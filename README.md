# H Calls

A private two-person audio/video calling app disguised as a plain notes app.
The site looks and *works* like a real notes tool. Typing one of two secret
passphrases into the search box (then Enter) unlocks either the real call UI
or a harmless decoy call UI. Anything else just searches notes normally.

## How it works

- `frontend/index.html` + `cover.js` — the cover: a working localStorage
  notes app. The search box doubles as the passphrase field.
- On Enter, the search text is POSTed to `/api/unlock`. The backend compares
  it against bcrypt hashes (never the plaintext) stored in env vars.
  - Match **real** passphrase → server returns a short-lived token, the
    client injects `socket.io` + `call.js`, and the real WebRTC call UI
    replaces the notes app.
  - Match **decoy** passphrase → the client injects `decoy.js`, a
    fully local, inert fake call UI (no camera/mic access, no signaling).
  - No match → nothing happens, page stays a notes app.
- `backend/server.js` — Express serves the static frontend and the
  `/api/unlock` endpoint; Socket.io relays WebRTC offer/answer/ICE candidates
  between exactly two peers in a single room. It never sees your media.

## Local development

```bash
cd backend
npm install
cp .env.example .env   # fill in REAL_PASS_HASH / DECOY_PASS_HASH
npm start
```

Generate a passphrase hash:

```bash
node -e "console.log(require('bcryptjs').hashSync('your passphrase here', 10))"
```

Then open `http://localhost:3000`.

**Picking passphrases:** choose two distinct phrases that look like plausible
note-search text if someone glances over your shoulder (e.g. a short phrase,
not "password123" or anything call/dating related). Keep the decoy
passphrase easy to give up under pressure without hesitation.

## Deploying (free, no credit card)

Both pieces are served by **one Render.com free Web Service** — simplest
setup, no CORS, and Render's free tier doesn't require a card.

1. Push this repo to a **private** GitHub repo (see note below — I won't
   create accounts or push on your behalf).
2. On [render.com](https://render.com), New → Web Service → connect the repo.
3. Settings:
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `node server.js`
4. Add environment variables in the Render dashboard (never commit these):
   - `REAL_PASS_HASH`
   - `DECOY_PASS_HASH`
5. Deploy. Bookmark the resulting URL on both phones like any other link.

**Cold start trade-off:** Render's free tier sleeps a service after 15
minutes of no traffic. The first open after a sleep takes ~30-60s to wake up
(you'll just see the notes app load slowly). There's no free way around this
without a paid tier. Optional mitigation: an external free pinger (e.g.
cron-job.org) hitting `/health` every ~10 minutes keeps it warm — costs
nothing, but means the server runs continuously. Entirely optional; skipped
by default.

## STUN/TURN

- STUN: Google's public server (`stun:stun.l.google.com:19302`), free, no
  signup.
- TURN: [Open Relay Project](https://www.metered.ca/tools/openrelay/)'s
  public free TURN server, no signup needed. This is required for
  reliability — many mobile carrier and corporate NATs can't establish a
  direct peer connection via STUN alone, and calls would silently fail
  without a TURN fallback. Open Relay's free tier has no published hard
  limit but is a shared public resource; if it ever gets flaky, Metered.ca's
  own free TURN tier (50GB/month, requires a free account) is a drop-in
  replacement — swap the `ICE_SERVERS` array in `frontend/call.js`.

## Security notes (honest limitations)

- The passphrase check is server-side and hashed, so casual view-source
  won't reveal it. It is **not** hardened against a technically
  sophisticated, motivated attacker with time on their hands — this is
  designed to defeat a nosy glance or casual snooping, not a targeted
  attack.
- The signaling server enforces exactly 2 participants per room, but does
  not otherwise authenticate *which* two people — anyone with the real
  passphrase can join. Keep the real passphrase private.
- Only the signaling (offer/answer/ICE) passes through the server — audio
  and video flow peer-to-peer (or via the TURN relay) and are never stored
  or visible to the server.

## Not yet deployed

This has only been tested locally. Once you create the GitHub + Render
accounts (I can't do that step — account creation is off-limits for me),
tell me and I'll walk through the deploy with you, or push the repo if you
create an empty remote first.
