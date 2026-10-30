# NutriTrack — Diet & Calorie Tracker (MERN)

Full-stack nutrition tracker: JWT auth (HTTP-only cookie), seeded food catalogue (incl. Indian foods),
meal logging with server-side nutrition scaling, dashboard, weekly/monthly analytics, goals, and water tracking.

> **Build status**
> - [x] **Stage 1 — Backend (`server/`)**: complete, 7 unit tests passing, integration tests written
> - [x] **Stage 2 — Frontend (`client/`)**: React + Vite + Tailwind + Recharts, 8 pages
> - [ ] **Stage 3 — Polish**: add screenshots below, verify deployment

## Tech stack
**Backend:** Node.js · Express 4 · MongoDB/Mongoose · JWT + bcrypt · Zod · Helmet · CORS · express-rate-limit
**Frontend:** React 18 · Vite · Tailwind CSS · React Router · React Hook Form · Axios · Recharts · Lucide · react-hot-toast

## Pages
Landing · Register · Login · Dashboard (calorie ring, macros, water, weekly chart, summary, recent meals) ·
Log meal (search, categories, multi-food meals, edit/delete, date picker) · History (day / week / month charts) ·
Goals (targets, suggested estimate, today's progress) · Profile

## Project structure
```
server/src/  config · models · middleware · validators · controllers · routes · providers · services · utils · seed
client/src/  api · components · context · hooks · layouts · pages · utils
```

## Screenshots
_Add screenshots to `docs/` and link them here: dashboard, log meal, history, goals._

## Architecture highlights
| Decision | Why |
|---|---|
| Dates are `YYYY-MM-DD` strings | No timezone off-by-one bugs; the client sends the user's local date |
| Server computes all nutrition | Client sends `foodId + quantity + unit` only; values can't be tampered with |
| Nutrition **snapshots** on each meal item | History stays correct if the catalogue changes |
| Ownership via `{ _id, user }` queries | Other users' records return 404 (no existence leak) |
| HTTP-only cookie JWT | Token isn't readable by JS (XSS-resistant); Bearer header also accepted for API tools |
| `providers/` abstraction | Plug in USDA/Nutritionix later; falls back to the seeded DB |
| Pure `utils/nutrition.js` | Calorie math is unit-tested without a database |

## Setup
Requires Node ≥ 18.18 and MongoDB (local or Atlas).

```bash
cd server
cp .env.example .env        # then set JWT_SECRET (see below) and MONGODB_URI
npm install
npm run seed:demo           # foods + demo user (demo@example.com / Demo@1234) with 14 days of meals
npm run dev                 # http://localhost:5000/api/health
npm test                    # unit tests + integration tests
```
Generate a secret: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

### Run the frontend (second terminal)
```bash
cd client
npm install
npm run dev                 # http://localhost:5173
```
Vite proxies `/api` to `http://localhost:5000`, so the auth cookie works with no extra CORS setup in development.
Log in with `demo@example.com` / `Demo@1234`, or register a new account.

### MongoDB Atlas
1. Create a free M0 cluster at cloud.mongodb.com → **Database Access**: add a user with a strong password.
2. **Network Access**: add your IP (or `0.0.0.0/0` for a hosted API; rely on a strong DB password).
3. **Connect → Drivers**: copy the URI into `MONGODB_URI`, replacing `<password>` and adding the db name:
   `mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/nutrition_tracker?retryWrites=true&w=majority`
4. URL-encode special characters in the password (`@` → `%40`).

### Troubleshooting
| Symptom | Fix |
|---|---|
| `JWT_SECRET is not set` | Create `server/.env` from `.env.example` |
| `MongoDB connection failed` | Is `mongod` running? Atlas IP allow-list? Password URL-encoded? |
| `bcrypt` install fails | Use Node LTS; on Windows install build tools, or `npm rebuild bcrypt` |
| 401 after login from the client | CORS `CLIENT_URL` must match the client origin exactly; client needs `withCredentials: true` |
| Cookie not sent in production | Different domains → set `COOKIE_SAMESITE=none` (forces `Secure`; needs HTTPS) |
| Integration tests can't start | `mongodb-memory-server` downloads a MongoDB binary on first run (needs internet) |

## API
All responses: `{ success, data | message, errors? }`. Auth via the `token` cookie. Dates are `YYYY-MM-DD`.

| Method | Endpoint | Notes |
|---|---|---|
| POST | `/api/auth/register` | name, email, password (8+, letter+number), age, gender, heightCm, currentWeightKg, targetWeightKg?, activityLevel. Sets cookie; goals auto-estimated |
| POST | `/api/auth/login` · `/logout` | Login limited to 10 attempts / 15 min / IP |
| GET | `/api/auth/me` | Current user |
| GET/PUT | `/api/users/profile` | PUT accepts `recalculateGoals: true` |
| GET/PUT | `/api/users/goals` | calories, protein, carbs, fat, waterMl, currentWeightKg, targetWeightKg, activityLevel |
| GET | `/api/users/goals/suggested` | Calculated estimate (Mifflin-St Jeor) for prefill |
| GET | `/api/foods?search=&category=&page=&limit=` | Paginated catalogue |
| GET | `/api/foods/:id` | |
| GET | `/api/meals?date=` | Meals + totals for the day |
| POST | `/api/meals` | `{date, mealType: breakfast\|lunch\|dinner\|snack, items:[{foodId, quantity, unit: serving\|g}]}` |
| PUT/DELETE | `/api/meals/:id` | Partial update; replacing `items` recomputes totals |
| GET | `/api/analytics/daily?date=` | consumed, remaining, progress %, byType, recentMeals, water |
| GET | `/api/analytics/weekly?end=` | 7 zero-filled days + averages, days on target (±10%) |
| GET | `/api/analytics/monthly?month=YYYY-MM` | Days, weekly buckets, summary |
| GET/POST/PUT | `/api/water?date=` | POST adds an increment (atomic); PUT sets the day's total |

## Nutrition data and estimates
Foods store values **per 100 g** plus a standard serving size. Seeded values are approximate samples compiled from
public references (USDA, IFCT) and are **estimates**; brands and recipes vary. Calorie targets use the
Mifflin-St Jeor equation × activity factor (±400/300 kcal for weight goals, 1,200 kcal floor). They are
general estimates, **not medical advice**; consult a professional for dietary guidance.

## Deployment (summary)
- **API** (Render/Railway): root `server`, build `npm install`, start `npm start`. Set `NODE_ENV=production`, `MONGODB_URI`,
  `JWT_SECRET` (32+ chars), `CLIENT_URL=https://your-client`, `COOKIE_SAMESITE=none` if on different domains. Run `npm run seed` once.
- **Client** (Vercel/Netlify): root `client`, build `npm run build`, output `dist`. Set `VITE_API_URL=https://your-api/api`.
  Add a SPA rewrite so deep links work: Vercel `vercel.json` → `{"rewrites":[{"source":"/(.*)","destination":"/"}]}`;
  Netlify `public/_redirects` → `/* /index.html 200`.
- Cross-domain cookies need HTTPS on both sides, `COOKIE_SAMESITE=none` on the API, and `CLIENT_URL` set to the exact client origin.
  Alternative: serve client and API under one domain (e.g. a reverse proxy) and keep `lax`.
