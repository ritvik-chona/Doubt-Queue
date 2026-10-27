# Doubt Queue

> **Live app:** https://doubt-queue.vercel.app
> **API:** https://doubt-queue-p7v7.onrender.com/api/health
> **Demo video:** DEMO_VIDEO_URL_PLACEHOLDER

## Demo Accounts

All demo accounts use the password **`DoubtQueue@2026`**. They share one seeded course, **Data Structures and Algorithms (CS201)**.

| Name | Email | Role |
|---|---|---|
| Priya Sharma | `priya.sharma@example.com` | TA, course owner (sees the join code) |
| Rahul Verma | `rahul.verma@example.com` | TA, co-TA |
| Ananya Iyer | `ananya.iyer@example.com` | Student |
| Arjun Mehta | `arjun.mehta@example.com` | Student |
| Sneha Reddy | `sneha.reddy@example.com` | Student |

The course already contains doubts in every state:
- **Resolved:** the quicksort doubt (by Priya) and the BFS doubt (by Rahul).
- **Claimed, no answer yet:** the Dijkstra doubt (Rahul).
- **Claimed, answered but not resolved:** the AVL doubt (Priya).
- **Reopened by its author:** the heap doubt (Sneha), with Priya's answer kept.
- **Open:** a few doubts with upvotes.

Suggested walkthrough:
1. Log in as **Arjun** and start asking *"quicksort worst case"* to see duplicate suggestions.
2. Log in as **Rahul**, then try to claim the AVL doubt to get *"Already claimed by Priya Sharma"*.
3. Log in as **Priya** and resolve the AVL doubt.
4. Log in as **Ananya** and reopen her resolved quicksort doubt.

The first request after the API has been idle can take up to a minute (Render free tier cold start). Anyone with these credentials can change the demo data.

## Problem Statement

In a course, students' doubts get scattered across chat groups, emails and office-hour queues. The same question gets asked many times, popular questions are hard to spot, and when several TAs are helping, two of them often answer the same doubt while others go unanswered. Students also can't tell whether their doubt is waiting, being worked on, or done.

## Target Users

- **Students** enrolled in a course, who need to ask doubts, see whether someone already asked the same thing, and track their doubt until it is answered.
- **TAs** (course owner and co-TAs), who need to see which doubts matter most, take ownership of one without colliding with another TA, and close the loop with an answer.

## Solution

Doubt Queue gives each course a single shared queue of doubts:

- A TA creates a course and gets a 6-character join code. Students (and co-TAs) join with that code.
- While a student types a doubt title, the app suggests similar existing doubts, so duplicates can be avoided before posting.
- Students upvote doubts they also have, so the queue can be sorted by what matters most.
- A TA **claims** a doubt (only one TA can hold it), posts an answer and **resolves** it. If the answer didn't help, the author can **reopen** it.

## Key Features

1. **Auth and enrollment**
   - Register as a student or TA, with a JWT stored in an httpOnly cookie.
   - TAs create courses and get a unique join code with a copy button. Students and co-TAs join with the code.
2. **Post a doubt with duplicate detection**
   - Live "Similar doubts" suggestions while typing the title (debounced, stale requests cancelled).
   - Suggestions never block posting.
3. **Browse, search, filter, upvote**
   - Full-text search, filter by status, sort by votes or newest, pagination.
   - One upvote per user, as a toggle, with an optimistic UI. Authors cannot upvote their own doubt.
   - The list refreshes every 15 seconds while the tab is visible.
4. **TA resolution flow**
   - Claim (atomic), unclaim, answer, resolve (requires at least one answer), and reopen (author only).
   - The detail page shows only the actions the server says the current user may take, and refreshes every 15 seconds so another TA's claim shows up.

## Tech Stack

| Layer | Tools |
|---|---|
| Client | React 19, Vite, React Router, Tailwind CSS 4, axios |
| Server | Node.js, Express 5, Mongoose, Zod, bcrypt, jsonwebtoken, express-rate-limit, cookie-parser, cors |
| Database | MongoDB Atlas |
| Testing | Node's built-in `node:test` |
| Hosting | Vercel (client), Render (server) |

## Architecture

```
 Browser: React SPA served by Vercel
    |
    |  same-origin requests to /api/*  (auth cookie is first-party)
    v
 Vercel rewrite:  /api/:path*  -->  https://<render-service>/api/:path*
    |
    v
 Express API on Render
    routes -> middleware -> controllers -> services
              auth            auth           similarity.js         (pure, unit tested)
              requireRole     course         doubtStateMachine.js  (pure, unit tested)
              requireEnrolled doubt
              loadDoubt       resolution
              validate (Zod)
              errorHandler
    |
    v
 MongoDB Atlas: users, courses, doubts, answers
```

Doubt status machine (`server/src/services/doubtStateMachine.js`):

```
          claim                resolve
  open ----------> claimed -------------> resolved
   ^  <----------    |                       |
   |    unclaim                              |
   +------------------- reopen --------------+
```

Any other transition (for example `open -> resolved`, or `claim` on a resolved doubt) is rejected with **409 Conflict**.

### Project layout

```
client/src/
  api/client.js           axios instance, error normalisation
  context/AuthContext.jsx session state (/auth/me on load)
  components/             Navbar, ProtectedRoute, DoubtCard, DoubtForm, UpvoteButton, StatusBadge, States, Field
  pages/                  Login, Register, Courses, CourseDoubts, NewDoubt, DoubtDetail, NotFound
  hooks/                  useDebounce, usePolling
server/src/
  index.js                app setup, env checks, CORS, trust proxy
  models/                 User, Course, Doubt, Answer
  routes/, controllers/   auth, course, doubt, resolution
  middleware/             auth, requireRole, requireEnrolled, loadDoubt, validate, errorHandler
  services/               similarity.js, doubtStateMachine.js
server/tests/             similarity.test.js, stateMachine.test.js
server/scripts/           claimRace.js
```

### API

| Method | Path | Who |
|---|---|---|
| POST | `/api/auth/register`, `/api/auth/login`, `/api/auth/logout` | anyone (register and login are rate limited) |
| GET | `/api/auth/me` | logged in |
| GET / POST | `/api/courses` | list: logged in. Create: TA |
| POST | `/api/courses/join` | student or TA (not the owner) |
| GET | `/api/courses/:id` | course member |
| GET / POST | `/api/courses/:id/doubts` (`?search=&status=&sort=votes\|new&page=&limit=`) | course member |
| GET | `/api/courses/:id/doubts/similar?q=` | course member |
| GET | `/api/doubts/:id` | course member |
| POST | `/api/doubts/:id/upvote` | course member, not the author |
| POST | `/api/doubts/:id/claim`, `/unclaim`, `/answers`, `/resolve` | TA. Unclaim, answers and resolve: only the claiming TA |
| POST | `/api/doubts/:id/reopen` | doubt author |

Every error response has the shape `{ "error": { "message", "details?" } }` with 400, 401, 403, 404, 409 or 429 as appropriate.

### Key engineering decisions

- **Atomic claim.**
  - A claim is a single `findOneAndUpdate({ _id, status: 'open' }, { $set: { status: 'claimed', claimedBy: me } })`. If two TAs claim at once, MongoDB lets exactly one update match.
  - The loser gets `409 Already claimed by <name>`, built by re-reading the doubt.
  - Unclaim and resolve are atomic in the same way, and also match `claimedBy: me`.
  - `npm run race` fires 5 simultaneous claims from 2 TAs at a running server and passes only if exactly one gets 200 and the other four get 409.
- **Atomic upvote toggle.** Two guarded updates:
  - `{ upvotes: { $ne: me } }` with `$addToSet` and `$inc: +1`. If that doesn't match, `{ upvotes: me }` with `$pull` and `$inc: -1`.
  - The voter array and `upvoteCount` change in the same operation, so they cannot drift apart and a user can never be counted twice.
  - `upvoteCount` is stored separately so sorting by votes uses an index.
- **Duplicate detection without an external API** (`services/similarity.js`).
  - **Normalising:** text is lowercased, stripped of punctuation, and stopwords are removed (including filler like "please", "explain"). A light stemmer then strips `-s`, `-es`, `-ies`, `-ing` and `-ed`.
  - **Scoring:** similarity is `0.5 × Jaccard(word tokens) + 0.5 × Dice(character trigrams)`. The trigrams are taken over the tokens joined without spaces, so "quick sort" and "quicksort" still match.
  - **Weighting:** a doubt's score weights its title 0.7 and its body 0.3.
  - **Endpoint:** `/similar` ranks the course's 200 most recent doubts in memory and returns the top 5 with score ≥ 0.25.
  - **Why not `$text`:** MongoDB text search matches whole (stemmed) words only, so it misses "quick sort" vs "quicksort" and partial overlaps. `$text` is still used for the search box, where exact-word matching is what users expect.
- **Permissions computed server-side.**
  - `getPermissions()` in the state machine service derives `canUpvote`, `canClaim`, `canUnclaim`, `canAnswer`, `canResolve` and `canReopen`. `GET /api/doubts/:id` and every action response include them.
  - The client renders buttons only from these flags and never re-implements the rules.
  - Every action is still re-checked by the server.
- **404 for non-members on doubt routes.** `loadDoubt` returns the same `404 Doubt not found` for a missing doubt, a malformed id, and a doubt in a course the user isn't enrolled in, so doubt ids can't be probed. Course-level routes return 403 for non-members.
- **Constant-time-ish login.** When the email doesn't exist, login still runs `bcrypt.compare` against a precomputed dummy hash, so response time doesn't reveal which emails are registered. Wrong email and wrong password return the same 401 message.
- **Rate limiting.** `POST /api/auth/register` and `POST /api/auth/login` are limited to 20 requests per 15 minutes per IP (`express-rate-limit`). `/me` is not limited because the client calls it on every page load.
- **Other.**
  - **Joining a course** is one atomic update that excludes the owner and existing members (409 for both).
  - **Validation:** every request body and query string the API reads is validated with Zod.
  - **Errors:** a central `errorHandler` maps duplicate keys to 409 and bad ids to 400.
  - **Cookie:** `httpOnly`, `Secure` and `SameSite=None` in production, `SameSite=Lax` in development.

## Local Setup

Requirements: Node.js 22.22 or newer (React Router requires it), and a MongoDB Atlas cluster (the free M0 tier is enough).

```bash
git clone https://github.com/ritvik-chona/Doubt-Queue.git
cd Doubt-Queue

# API
cd server
npm install
cp .env.example .env        # fill in MONGO_URI and JWT_SECRET
npm run dev                 # http://localhost:4000

# Client (new terminal)
cd client
npm install
cp .env.example .env
npm run dev                 # http://localhost:5173
```

The Vite dev server proxies `/api` to `http://localhost:4000`, so the browser sees one origin and the auth cookie works without CORS.

To generate a JWT secret: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

## Environment Variables

Only `.env.example` files are committed. Real `.env` files are git-ignored.

**Server (`server/.env`)**

| Variable | Required | Description |
|---|---|---|
| `MONGO_URI` | yes | MongoDB connection string, including the database name (`.../doubt-queue?...`) |
| `JWT_SECRET` | yes | Long random string used to sign session tokens |
| `CLIENT_ORIGIN` | in production | Allowed CORS origin, e.g. `https://your-app.vercel.app`. Defaults to `http://localhost:5173` in development |
| `NODE_ENV` | in production | Set to `production` to enable `Secure` and `SameSite=None` cookies and the `CLIENT_ORIGIN` check |
| `PORT` | no | Defaults to 4000. Render sets it automatically |
| `DNS_SERVERS` | no | For local use only: e.g. `8.8.8.8,1.1.1.1` if your network refuses the `mongodb+srv` SRV lookup (`querySrv ECONNREFUSED`) |

In production the server refuses to start if `JWT_SECRET`, `MONGO_URI` or `CLIENT_ORIGIN` is missing.

**Client (`client/.env`)**

| Variable | Description |
|---|---|
| `VITE_API_URL` | API base URL. Use `/api` both locally (Vite proxy) and on Vercel (rewrite), or leave it unset, which defaults to `/api` |

## Deployment

1. **MongoDB Atlas.** Under Network Access, allow `0.0.0.0/0`, because Render's outbound IPs change.
2. **Render (API).**
   - Create a Web Service from this repo with root directory `server`, build command `npm install`, and start command `npm start`.
   - Environment variables: `MONGO_URI`, `JWT_SECRET`, `NODE_ENV=production`, and `CLIENT_ORIGIN` (the Vercel URL from step 4). Do not set `PORT` or `DNS_SERVERS`.
   - Health check path: `/api/health`.
3. **Point the client at the API.** In `client/vercel.json`, replace `RENDER_URL_PLACEHOLDER` with your Render hostname only, e.g. `doubt-queue-api.onrender.com`, with no `https://` and no trailing slash. Commit and push.
4. **Vercel (client).**
   - Import the repo with root directory `client` and framework preset Vite (build `npm run build`, output `dist`).
   - No environment variables are needed: `VITE_API_URL` defaults to `/api`, which the rewrite forwards to Render.
5. Copy the Vercel URL into Render's `CLIENT_ORIGIN` and redeploy the API.

**Why the rewrite:** the browser only ever talks to the Vercel domain, so the session cookie is first-party. That avoids browsers blocking third-party cookies between `*.vercel.app` and `*.onrender.com`.

**Proxy hops:** in production a request passes through two proxies (Vercel's rewrite, then Render's load balancer), so the server uses `app.set('trust proxy', 2)` to get the real client IP for rate limiting.

## Testing

```bash
cd server
npm test        # unit tests (node:test): state machine + similarity, 35 tests
npm run race    # needs the API running: 5 simultaneous claims from 2 TAs, expects exactly one 200 and four 409s
```

- `tests/stateMachine.test.js`:
  - every status × action pair (4 valid, 8 invalid)
  - an unknown action and an unknown status
  - `open -> resolved` is never possible
  - the permission flags
- `tests/similarity.test.js`:
  - stemming
  - identical titles score near 1, unrelated titles score under 0.2
  - "quicksort worst case" matches "worst case of quick sort"
  - stopword-only and empty input score 0
  - scores stay in the 0 to 1 range
  - the title outweighs the body
  - ranking order, limit and threshold

`npm run race` registers 3 throwaway accounts on each run. Registration is rate limited to 20 per 15 minutes, so restart the API if you hit 429 after many runs.

## Limitations

- **Anyone can register as a TA.** A real deployment would verify TAs through an invite link or admin approval.
- **Polling, not websockets.** The doubt list and detail page refresh every 15 seconds while visible, so updates are not instant.
- **In-memory rate limiting.** Counters live in the API process. They reset on restart and would not be shared across multiple instances (a Redis store would fix this).
- **Render free tier cold start.** After about 15 minutes idle the API sleeps, and the next request can take up to a minute while it wakes.
- **Duplicate detection only checks the course's 200 most recent doubts**, and the search box uses MongoDB text search, which matches whole words only (searching "quick" does not find "quicksort").
- **Sessions are stateless JWTs** valid for 7 days. Logout clears the cookie, but a stolen token stays valid until it expires.
- Doubts and answers cannot be edited or deleted.
