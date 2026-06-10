// ============================================================================
// ForkIt — Multiplayer client
// A thin wrapper around the WebSocket protocol in multiplayer.js. Drop into the
// app; it works in plain JS or inside a React component.
// ============================================================================

const MP_BASE = import.meta?.env?.VITE_MP_BASE || "ws://localhost:8788";

export function connectForkIt(handlers = {}) {
  const ws = new WebSocket(MP_BASE);
  let state = { code: null, memberId: null, room: null };

  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.code) state.code = msg.code;
    if (msg.memberId) state.memberId = msg.memberId;
    if (msg.room) state.room = msg.room;

    // Route each server message type to an optional handler.
    handlers[msg.type]?.(msg, state);
    handlers.any?.(msg, state);
  };
  ws.onopen = () => handlers.open?.();
  ws.onclose = () => handlers.close?.();

  const sendWhenReady = (obj) => {
    if (ws.readyState === 1) ws.send(JSON.stringify(obj));
    else ws.addEventListener("open", () => ws.send(JSON.stringify(obj)), { once: true });
  };

  return {
    // Head starts a household round.
    create: (name, emoji) => sendWhenReady({ type: "create", name, emoji }),
    // Family member joins with the shared code.
    join: (code, name, emoji) => sendWhenReady({ type: "join", code, name, emoji }),
    // Reconnect after a refresh.
    resume: (code, memberId) => sendWhenReady({ type: "resume", code, memberId }),
    // Head launches the swiping phase.
    start: () => sendWhenReady({ type: "start" }),
    // Record a swipe (like = true for a right-swipe / "yes").
    swipe: (cuisine, like) => sendWhenReady({ type: "swipe", cuisine, like }),
    // Tell the server this member finished their deck.
    done: () => sendWhenReady({ type: "done" }),
    // Head starts a fresh round.
    reset: () => sendWhenReady({ type: "reset" }),
    get state() { return state; },
    socket: ws,
  };
}

// ---------------------------------------------------------------------------
// Example wiring inside the app:
//
//   const mp = connectForkIt({
//     created:  (m) => showCode(m.code),            // head sees the invite code
//     joined:   (m) => enterLobby(m.room),
//     room_update: (m) => renderMembers(m.room),    // live roster
//     round_started: () => goToSwipeScreen(),
//     tally:    (m) => updateLiveVotes(m.tally),     // "Mexican: 2 yes"
//     matched:  (m) => showWinner(m.result.winner),  // everyone lands here
//   });
//
//   mp.create("Dad", "👨");        // head
//   mp.join("K7QM", "Mia", "👧");  // member on another phone
//   mp.start();                     // head begins
//   mp.swipe("mexican", true);      // a right-swipe
// ---------------------------------------------------------------------------
