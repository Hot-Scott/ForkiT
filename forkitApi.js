# ForkIt — Google Setup & Launch Guide

This backend wires up every Google API the app needs to go live. Follow these
steps once and the app gets real, location-aware restaurants.

---

## 1. What you're enabling

In the Google Cloud Console you'll turn on **two** APIs (both cover several
features):

| API | Powers in the app |
|-----|-------------------|
| **Places API (New)** | Restaurant search, place details, reviews, photos |
| **Geocoding API** | Setting a household's home by typed address / zip |

> Note: the older "Places API" is now Legacy and can no longer be enabled — this
> backend uses **Places API (New)**, the current version.

Browser GPS (the "where am I" prompt) is handled by the device, not a Google
API, so there's nothing to enable for that.

---

## 2. Get your API key

1. Go to https://console.cloud.google.com/ and create a project (e.g. "ForkIt").
2. Open **Billing** and attach a billing account (required even for free-tier).
3. Go to **APIs & Services → Library**, search for and **Enable**:
   - Places API (New)
   - Geocoding API
4. Go to **APIs & Services → Credentials → Create Credentials → API key**.
5. Copy the key.

---

## 3. Lock the key down (important)

An unrestricted key can be stolen and run up your bill. On the key's settings:

- **Application restrictions**: since the key lives only on your server, set an
  **IP address** restriction to your server's IP. (Don't use HTTP-referrer
  restrictions — those are for browser keys, and we're keeping the key off the
  browser on purpose.)
- **API restrictions**: restrict the key to just **Places API (New)** and
  **Geocoding API**.

---

## 4. Run the backend

```bash
cd forkit-backend
cp .env.example .env        # then paste your key into .env
npm install
npm start
```

You should see: `🍴 ForkIt API running on http://localhost:8787`

Test it:

```bash
curl "http://localhost:8787/api/geocode?address=San%20Francisco"
```

---

## 5. Connect the app

1. Copy `forkitApi.js` into your app's source.
2. Replace the mocked restaurant data with real calls. For example:

```js
import { getCurrentLocation, findRestaurants } from "./forkitApi";

const { lat, lng } = await getCurrentLocation();      // GPS prompt
const { restaurants } = await findRestaurants({       // real results
  cuisine: matched.id,   // "mexican", "indian", ...
  lat, lng,
  radiusMeters: 8000,
  openNow: true,
});
```

3. Set `VITE_API_BASE` to your deployed backend URL in production.

---

## 6. Cost (so there are no surprises)

- Google Maps Platform gives a **$200/month credit** shared across all Maps
  APIs combined. Light/early usage typically stays free.
- You're billed per request, and the **field mask** in `server.js` is kept lean
  on purpose — requesting fewer fields keeps you in a cheaper billing tier.
- The server's **rate limiter** (60 req/min/IP) is your safety net against a
  runaway bill. Tune it as you grow.
- Nearby/Text Search returns up to 20 results per page (max 60 across pages) and
  the search radius caps at 50,000 m.

Check current per-API prices on Google's pricing page before launch, since
Google updates SKUs periodically.

---

## 7. Multiplayer (household rounds)

`multiplayer.js` is the realtime server for the household half — the head
creates a round, family members join by code from their own phones, everyone
swipes, and a **majority match** is detected live and pushed to all phones.

Run it alongside the Google proxy (it's a separate port):

```bash
npm run start:mp      # ws://localhost:8788
```

How matching works: a cuisine wins when **more than half** the household has
swiped right on it (3 of 5, 2 of 3, etc.). If everyone finishes their deck
without a majority, it falls back to the most-liked cuisine.

Wiring in the app (see `forkitMultiplayer.js` for the full client):

```js
import { connectForkIt } from "./forkitMultiplayer";

const mp = connectForkIt({
  created:       (m) => showInviteCode(m.code),  // head sees the code
  room_update:   (m) => renderRoster(m.room),    // live family list
  round_started: () => goToSwipeScreen(),
  tally:         (m) => updateLiveVotes(m.tally), // "Mexican: 2 yes"
  matched:       (m) => loadRestaurants(m.result.winner), // hand off to Google backend
});

mp.create("Dad", "👨");   // head starts a household
mp.start();                // head begins the round
mp.swipe("mexican", true); // a right-swipe
```

When `matched` fires, take `result.winner` (e.g. `"mexican"`) and feed it
straight into `findRestaurants()` from `forkitApi.js` — that's the full loop.

**Storage:** rooms live in memory, so a restart clears active rounds — fine for
launch/demo. To make it durable and multi-server, move room state to Redis and
use Redis pub/sub for broadcasts (notes are at the bottom of `multiplayer.js`).
The client protocol doesn't change.

---

## 8. The full picture

```
 Phones ──ws──> multiplayer.js ──(majority match: "mexican")──┐
                                                              │
 Phones ──http──> server.js ──> Google Places/Geocoding ──> restaurants
```

Everything needed to launch is now built. The only mock left is the demo
artifact, which simulates multiple phones in one browser so you can see the
flow without deploying.
