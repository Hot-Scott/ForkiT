# ForkIt — Get It Online (Web Deploy Guide)

This is the click-by-click path to a live website your family can use. Three
pieces go online:

| Piece | What it is | Where it goes | Cost |
|-------|-----------|---------------|------|
| The app (frontend) | the React swiping UI | **Vercel** | Free |
| `server.js` | Google restaurants proxy | **Render** (Web Service) | Free |
| `multiplayer.js` | realtime voting server | **Render** (Web Service) | Free* |

\* Free works, with one catch explained in Step 5. Budget ~$7/mo per backend if
the catch bothers you.

You'll need: a free **GitHub** account, a free **Vercel** account, a free
**Render** account, and your Google API key from the earlier setup.

---

## Step 0 — Put your code on GitHub (everything else pulls from here)

1. Create a free account at github.com.
2. Make a new **private** repository called `forkit`.
3. Upload your project into it. Easiest way without the command line: on the new
   repo page, click **uploading an existing file** and drag your folders in.
   Keep this structure:

   ```
   forkit/
     app/                ← the React app (your .jsx + index, package.json)
     forkit-backend/     ← server.js, multiplayer.js, package.json, etc.
   ```

4. **Double-check `.env` is NOT uploaded.** Your API key must never go to
   GitHub. The included `.gitignore` already blocks it — verify you don't see
   `.env` in the file list. (`.env.example` is fine; it has no real key.)

---

## Step 1 — Deploy the Google proxy (`server.js`) to Render

1. Sign up at render.com (no credit card needed for free).
2. Dashboard → **New +** → **Web Service** → connect your GitHub and pick the
   `forkit` repo.
3. Fill in:
   - **Root Directory:** `forkit-backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** **Free**
4. Open the **Environment** section and add your secrets as environment
   variables (this is the safe replacement for the `.env` file):
   - `GOOGLE_MAPS_API_KEY` = your real key
   - `ALLOWED_ORIGIN` = `*` for now (you'll tighten this in Step 6)
5. Click **Create Web Service**. Wait for it to build, then copy the URL it
   gives you, e.g. `https://forkit-api.onrender.com`. **Save it.**
6. Test it: open `https://forkit-api.onrender.com/health` in your browser — you
   should see `{"ok":true}`.

---

## Step 2 — Deploy the multiplayer server (`multiplayer.js`) to Render

Same as Step 1, but a second service:

1. **New +** → **Web Service** → same `forkit` repo.
2. Fill in:
   - **Root Directory:** `forkit-backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm run start:mp`
   - **Instance Type:** **Free**
3. No Google key needed here. Click **Create Web Service**.
4. Copy this URL too, e.g. `https://forkit-mp.onrender.com`. **Save it.** Your
   app will connect to it as `wss://forkit-mp.onrender.com` (note: `wss`, the
   secure WebSocket form — Render gives you HTTPS automatically, which makes
   `wss` work).

---

## Step 3 — Point the app at your live backends

In your `app/` folder, create a file named `.env.production` with your two URLs:

```
VITE_API_BASE=https://forkit-api.onrender.com
VITE_MP_BASE=wss://forkit-mp.onrender.com
```

(Use the exact URLs Render gave you. Keep `wss://` for the multiplayer one.)
Commit/upload this change to GitHub.

---

## Step 4 — Deploy the app (frontend) to Vercel

1. Sign up at vercel.com with your GitHub account.
2. **Add New… → Project** → import the `forkit` repo.
3. Set **Root Directory** to `app`.
4. Vercel auto-detects a Vite/React app. Leave the build settings as detected.
5. Add the same two environment variables here too (Settings → Environment
   Variables), since the frontend reads them at build time:
   - `VITE_API_BASE` = `https://forkit-api.onrender.com`
   - `VITE_MP_BASE` = `wss://forkit-mp.onrender.com`
6. Click **Deploy**. In about a minute you get a public link like
   `https://forkit.vercel.app` — **that's your live app.** Share it with the
   family.

---

## Step 5 — The one catch on the free tier (read this)

Render's free web services **go to sleep after 15 minutes** with no traffic and
take **about a minute to wake up** on the next visit. In practice: the first
person to open ForkIt after a quiet spell waits ~60 seconds, then it's snappy
for everyone. For a family deciding on dinner, that's usually fine.

If the nap is annoying, two options:
- **Cheapest fix:** upgrade each Render service to the ~$7/month paid tier — no
  sleeping, no cold starts.
- **Free-ish workaround:** a free uptime pinger (e.g. UptimeRobot) hits your
  `/health` URL every few minutes to keep it awake. Works, but is a bit of a
  hack.

Also note: because the multiplayer server keeps rounds **in memory**, a sleep or
restart clears any round in progress. Fine for casual use; if you want rounds to
survive, that's the Redis upgrade noted in `multiplayer.js`.

---

## Step 6 — Lock it down before you share widely

1. **Tighten CORS:** back in the Render `server.js` service, change
   `ALLOWED_ORIGIN` from `*` to your real app URL,
   `https://forkit.vercel.app`. Redeploy.
2. **Re-check your Google key restrictions** (from the API setup): API
   restrictions limited to Places API (New) + Geocoding, and watch your usage in
   the Google Cloud console for the first week so there are no billing
   surprises.

---

## Quick recap

```
Family phones → https://forkit.vercel.app        (the app, on Vercel)
                      │
        ┌─────────────┴──────────────┐
        ▼                            ▼
 https://forkit-api.onrender.com   wss://forkit-mp.onrender.com
 (Google restaurants)              (realtime majority voting)
```

Get the three deployed, share the Vercel link, and ForkIt is live. When you're
ready for the App Store / Google Play route later, the next step is wrapping
this same app with Capacitor — but the web version above is the one to launch
first.
