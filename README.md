# The Daily Chronicle

A full-stack **MERN** newspaper app with a light, **1920s broadsheet** look.

| Layer    | Tech                                                        | Deploys to |
| -------- | ----------------------------------------------------------- | ---------- |
| Frontend | React 18, Vite, React Router, hand-written responsive CSS   | **Vercel** |
| Backend  | Node 18+, Express 5, Mongoose, JWT auth                     | **Render** |
| Database | MongoDB — **embedded** in development, **Atlas** in production | Atlas (free M0) |

**Features:** front page with lead story, true multi-column layout, section pages, search, "Most Read",
paginated lists, single-story page, and a password-protected **Editor's Desk** to write, edit, publish
and delete stories.

---

## Table of contents

1. [Project structure](#project-structure)
2. [Run locally (zero setup)](#run-locally-zero-setup)
3. [Deployment overview](#deployment-overview)
4. [Step 1 — Create the database (MongoDB Atlas)](#step-1--create-the-database-mongodb-atlas)
5. [Step 2 — Deploy the backend on Render](#step-2--deploy-the-backend-on-render)
6. [Step 3 — Deploy the frontend on Vercel](#step-3--deploy-the-frontend-on-vercel)
7. [Step 4 — Connect them (CORS)](#step-4--connect-them-cors)
8. [Environment variables reference](#environment-variables-reference)
9. [API reference](#api-reference)
10. [Troubleshooting](#troubleshooting)
11. [Security notes](#security-notes)
12. [Theme and CSS notes](#theme-and-css-notes)

---

## Project structure

```
daily-chronicle/
├── README.md
├── render.yaml                 # Render Blueprint (backend)
├── package.json                # convenience scripts only
├── server/                     # ── BACKEND (Render) ──
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── index.js            # app bootstrap, CORS, error handling
│       ├── seed.js             # sample stories + editor account (auto-runs when DB is empty)
│       ├── config/db.js        # Atlas in prod, embedded MongoDB in dev
│       ├── middleware/auth.js  # JWT sign / verify
│       ├── models/             # Article.js, User.js
│       └── routes/             # articles.js, auth.js
└── client/                     # ── FRONTEND (Vercel) ──
    ├── package.json
    ├── vercel.json             # SPA rewrites + asset caching
    ├── vite.config.js          # dev proxy: /api → localhost:5000
    ├── .env.example
    ├── index.html
    └── src/
        ├── main.jsx, App.jsx, api.js
        ├── context/AuthContext.jsx
        ├── components/         # Masthead, Footer, ArticleCard, Status
        ├── pages/              # Home, ArticlePage, Login, Admin, NotFound
        └── styles/index.css    # the 1920s newspaper theme
```

---

## Run locally (zero setup)

Requires **Node.js 18+** (20 recommended).

```bash
# 1. install everything
npm run install:all

# 2. backend (terminal 1)
cp server/.env.example server/.env
npm run dev:server        # http://localhost:5000

# 3. frontend (terminal 2)
npm run dev:client        # http://localhost:5173
```

**About the integrated database:** with `MONGODB_URI` left empty (the default in `server/.env.example`),
the server starts an **embedded MongoDB** (`mongodb-memory-server`) and stores its data in
`server/data/db`, so your stories survive restarts. On first start it downloads a MongoDB binary once
(about 100–200 MB, cached afterwards), so the first launch needs internet access and takes a minute.
On first start it also inserts 8 sample stories and creates the editor account.

Default local editor login (change it in `server/.env`):

- Email: `editor@chronicle.test`
- Password: `ChangeMe123!`

Open <http://localhost:5173/login> (there is also an "Editors' entrance" link in the footer).

To use a hosted database locally instead, put its connection string in `MONGODB_URI`.
To reset the sample stories: `npm --prefix server run seed` (this **deletes all stories**).

> The embedded database is for development only. Production refuses to start without `MONGODB_URI`,
> because Render's free filesystem is ephemeral and would lose your data.

---

## Deployment overview

Deploy in this order, because each step produces a value the next one needs:

```
Atlas (MONGODB_URI)  →  Render (API URL)  →  Vercel (site URL)  →  back to Render (CLIENT_ORIGIN)
```

Push the whole `daily-chronicle` folder to **one GitHub repository** first:

```bash
cd daily-chronicle
git init && git add . && git commit -m "Initial commit"
# create an empty repo on GitHub, then:
git remote add origin https://github.com/<you>/daily-chronicle.git
git branch -M main && git push -u origin main
```

---

## Step 1 — Create the database (MongoDB Atlas)

1. Sign up at <https://www.mongodb.com/cloud/atlas> and create a **free M0 cluster**.
2. **Database Access** → *Add New Database User* → username + strong password (note them down).
3. **Network Access** → *Add IP Address* → **Allow access from anywhere** (`0.0.0.0/0`).
   Render's free instances do not have fixed IP addresses, so this is required.
4. **Database** → *Connect* → *Drivers* → copy the connection string and add a database name:

   ```
   mongodb+srv://<user>:<password>@<cluster>.mongodb.net/chronicle?retryWrites=true&w=majority
   ```

   If your password contains special characters (`@`, `:`, `/`, `#`), URL-encode them.

This string is your `MONGODB_URI`.

---

## Step 2 — Deploy the backend on Render

The backend lives in the `server/` folder. Choose **Option A (Blueprint)** or **Option B (manual)**.

### Option A — Blueprint (recommended)

1. In Render: **New +** → **Blueprint** → connect your GitHub repo.
2. Render reads `render.yaml` and proposes the `daily-chronicle-api` web service.
3. Fill in the values it asks for (marked `sync: false`):
   - `MONGODB_URI` — from Step 1
   - `ADMIN_EMAIL` and `ADMIN_PASSWORD` — your editor login (use a strong password)
   - `CLIENT_ORIGIN` — put `https://placeholder.vercel.app` for now; you will fix it in Step 4
4. Click **Apply**. `JWT_SECRET` is generated for you.

### Option B — Manual

1. **New +** → **Web Service** → connect the repo.
2. Settings:

   | Setting            | Value                       |
   | ------------------ | --------------------------- |
   | Root Directory     | `server`                    |
   | Runtime            | Node                        |
   | Build Command      | `npm install --omit=dev`    |
   | Start Command      | `npm start`                 |
   | Health Check Path  | `/api/health`               |
   | Instance type      | Free                        |

3. Add the environment variables from the [reference table](#environment-variables-reference).
   Set `NODE_ENV=production`, `NODE_VERSION=20`, and generate `JWT_SECRET` with:

   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```

### Verify the backend

When the deploy is live, open:

```
https://<your-service>.onrender.com/api/health
```

You should see `{"status":"ok","db":"up"}`. Your **Render URL** (e.g.
`https://daily-chronicle-api.onrender.com`) is needed in the next step.
On first boot the server seeds 8 sample stories and creates your editor account.

> **Free-tier note:** Render free web services sleep after ~15 minutes without traffic. The first
> request afterwards can take 30–60 seconds. The frontend shows a friendly error if this happens;
> a refresh after a moment resolves it. Upgrade the instance type to remove the sleep.

---

## Step 3 — Deploy the frontend on Vercel

The frontend lives in the `client/` folder.

1. In Vercel: **Add New…** → **Project** → import your GitHub repo.
2. Configure:

   | Setting            | Value              |
   | ------------------ | ------------------ |
   | Framework Preset   | **Vite**           |
   | **Root Directory** | `client`           |
   | Build Command      | `npm run build`    |
   | Output Directory   | `dist`             |
   | Install Command    | `npm install`      |

   (`client/vercel.json` already contains these, plus the rule that sends every URL to `index.html`
   so deep links such as `/story/some-headline` and `/editor` work on refresh.)

3. Under **Environment Variables**, add:

   | Name            | Value                                          |
   | --------------- | ---------------------------------------------- |
   | `VITE_API_URL`  | `https://<your-service>.onrender.com`          |

   Use the Render URL from Step 2, **without** a trailing slash and **without** `/api`.
   Apply it to Production (and Preview if you want preview deployments to work).

4. Click **Deploy**. Your site URL will look like `https://daily-chronicle.vercel.app`.

> `VITE_*` variables are baked in at **build time**. If you change `VITE_API_URL`, **redeploy** the project.

### Vercel CLI alternative

```bash
npm i -g vercel
cd client
vercel            # first run: link/create the project (Root Directory = current folder)
vercel env add VITE_API_URL production
vercel --prod
```

---

## Step 4 — Connect them (CORS)

The browser only lets your Vercel site call the Render API if the API allows that origin.

1. In Render → your service → **Environment**, set:

   ```
   CLIENT_ORIGIN=https://<your-site>.vercel.app
   ```

   Several origins (e.g. a custom domain too) are comma-separated, with no trailing slashes:

   ```
   CLIENT_ORIGIN=https://daily-chronicle.vercel.app,https://www.mychronicle.com
   ```

2. Optional: to also allow Vercel **preview** deployments (`https://*.vercel.app`), set
   `ALLOW_VERCEL_PREVIEWS=true`. Leave it `false` unless you need it.
3. Save. Render redeploys automatically.

### Final checklist

- [ ] `https://<render>/api/health` returns `{"status":"ok","db":"up"}`
- [ ] The Vercel site shows the front page with stories
- [ ] Refreshing `/section/Sports` and `/story/<slug>` does not 404
- [ ] `/login` works with your `ADMIN_EMAIL` / `ADMIN_PASSWORD`
- [ ] You can publish a story from the Editor's Desk and see it on the front page

---

## Environment variables reference

### Backend (`server/.env` locally, Render dashboard in production)

| Variable                | Required in prod | Description |
| ----------------------- | :--------------: | ----------- |
| `NODE_ENV`              | yes              | `production` on Render. |
| `PORT`                  | no               | Render sets this automatically. Defaults to `5000` locally. |
| `MONGODB_URI`           | **yes**          | Atlas connection string. Empty in dev = embedded DB. |
| `JWT_SECRET`            | **yes**          | Long random string used to sign login tokens. |
| `ADMIN_EMAIL`           | yes              | Editor account created on first start. |
| `ADMIN_PASSWORD`        | yes              | Password for that account (only used when the account does not exist yet). |
| `CLIENT_ORIGIN`         | **yes**          | Allowed frontend origin(s), comma-separated. |
| `ALLOW_VERCEL_PREVIEWS` | no               | `true` allows any `https://*.vercel.app` origin. |
| `EMBEDDED_DB_PATH`      | no               | Dev only: where the embedded DB stores data (`./data/db`). |

> `ADMIN_PASSWORD` is only read when the editor account is first created. To change the password
> later, delete the user document in Atlas (collection `users`) and restart the service.

### Frontend (`client/.env` locally, Vercel dashboard in production)

| Variable        | Required in prod | Description |
| --------------- | :--------------: | ----------- |
| `VITE_API_URL`  | **yes**          | Render service URL, no trailing slash, no `/api`. Not needed locally (Vite proxies `/api`). |

---

## API reference

Base URL: `https://<render-service>.onrender.com`

| Method | Path                          | Auth | Description |
| ------ | ----------------------------- | :--: | ----------- |
| GET    | `/api/health`                 |      | Liveness + DB status. |
| GET    | `/api/articles`               |      | List. Query: `category`, `q`, `sort=views`, `featured=true`, `page`, `limit` (max 50). |
| GET    | `/api/articles/categories`    |      | Sections with story counts. |
| GET    | `/api/articles/:slug`         |      | One story (increments view count). |
| POST   | `/api/auth/login`             |      | `{ email, password }` → `{ token, user }`. |
| GET    | `/api/auth/me`                | yes  | Current editor. |
| GET    | `/api/articles/admin/all`     | yes  | All stories incl. drafts. |
| GET    | `/api/articles/admin/:id`     | yes  | One story by id (for editing). |
| POST   | `/api/articles`               | yes  | Create story. |
| PUT    | `/api/articles/:id`           | yes  | Update story. |
| DELETE | `/api/articles/:id`           | yes  | Delete story. |

Send the token as `Authorization: Bearer <token>`.

---

## Troubleshooting

| Symptom | Likely cause and fix |
| ------- | -------------------- |
| Site shows "Cannot reach the press room" | Render free instance is waking up (wait 30–60 s and refresh), or `VITE_API_URL` is wrong/missing. Fix it in Vercel and **redeploy**. |
| Browser console: *blocked by CORS policy* | `CLIENT_ORIGIN` on Render does not exactly match your Vercel URL (check `https`, no trailing slash). Save and let Render redeploy. |
| 404 when refreshing `/story/...` on Vercel | Root Directory is not set to `client`, so `vercel.json` is not applied. |
| Render logs: `MONGODB_URI is required` | Add the variable in Render → Environment. |
| Render logs: `bad auth` / `ECONNREFUSED` / `ENOTFOUND` | Wrong Atlas password (URL-encode special characters), missing database user, or Network Access does not allow `0.0.0.0/0`. |
| Render logs: `JWT_SECRET must be set in production` | Add `JWT_SECRET` (the Blueprint generates it). |
| Can't log in | Use the exact `ADMIN_EMAIL`/`ADMIN_PASSWORD` that were set **when the service first started**. See the note under the backend variables. |
| Local: first start is slow or fails | The embedded MongoDB binary is downloading; it needs internet once. Or set `MONGODB_URI` to use a hosted database instead. |
| Vercel build fails on Node version | Set Node.js Version to 18.x or 20.x in Project Settings → General. |

---

## Security notes

- Change `ADMIN_EMAIL` / `ADMIN_PASSWORD` before going public; never keep the defaults in production.
- `JWT_SECRET` must be long, random and private. Rotating it signs every editor out.
- Login is rate-limited (20 attempts / 15 minutes per IP); the API uses `helmet`, a CORS allow-list,
  request size limits, and bcrypt (cost 12) for password hashing.
- The login token is stored in `localStorage`. For a larger team or higher-risk deployment, consider
  moving to httpOnly cookies.
- Never commit `.env` files (they are in `.gitignore`).

---

## Theme and CSS notes

Everything lives in `client/src/styles/index.css`:

- **Palette:** cream newsprint (`--paper`), warm black ink (`--ink`), and a faded press red
  (`--accent`) as CSS custom properties; change them in one place to re-tone the whole site.
- **Type:** *UnifrakturCook* blackletter nameplate, *Playfair Display* headlines (Didone, period
  appropriate), *Old Standard TT* body text, *IM Fell English* for small caps-style labels
  (Google Fonts, loaded in `index.html`).
- **Newspaper details:** double and triple rules, a dateline and byline on every story, a drop cap on
  story openings, sepia-toned photographs, and Roman-numeral "Most Read" list.
- **Dynamic and responsive:** fluid type and spacing with `clamp()`, real CSS **multi-column**
  (`column-width` + `column-rule`) for the front page and story text, CSS Grid for the
  main/sidebar split, a collapsible mobile section menu, card-style admin table on small screens,
  larger scaling on very wide (≥1920 px) screens, `prefers-reduced-motion` support, and print styles.
#   d a i l y c h o r i n i c a l  
 #   d a i l y c h o r i n i c a l  
 