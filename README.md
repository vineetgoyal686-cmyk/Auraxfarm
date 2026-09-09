# AuraxFarm — Farm & Farmer Data Platform

A real, working React app (not a single HTML file) with:

- **Offline-first data capture** — farmers, farms, crops are written to the
  device first (localStorage) and synced to Supabase automatically when
  online, with a visible pending-sync queue.
- **Supabase backend** — Postgres tables + Row Level Security + email/password
  auth, with a `field` / `admin` role on each user.
- **GPS capture, voice input (Hindi/Punjabi/English), photo capture.**
- **Admin console** with charts (Recharts), reports, and editable master data.
- **Installable PWA** out of the box, and ready to wrap into an Android APK
  with Capacitor (steps below).

---

## 1. Run it locally

You need [Node.js 18+](https://nodejs.org) installed.

```bash
cd auraxfarm-app
npm install
cp .env.example .env      # then fill in your Supabase keys (step 2)
npm run dev
```

Open the printed `http://localhost:5173` URL. Without Supabase keys the app
still runs in **local demo mode** — you can click through everything, but
data stays only on that device/browser. Add real Supabase keys to unlock
multi-device sync and login.

---

## 2. Set up Supabase (free tier is enough to start)

1. Go to <https://supabase.com>, sign in, click **New project**.
   Pick any name/region and a database password (save it somewhere safe).
2. Once the project is ready, open **SQL Editor → New query**, paste the
   entire contents of `supabase/schema.sql` from this project, and click
   **Run**. This creates the `profiles`, `farmers`, `farms`, `crops`,
   `media` tables plus the security rules and the trigger that gives every
   new signup a `field` role automatically.
3. Go to **Project Settings → API**. Copy:
   - **Project URL** → paste into `.env` as `VITE_SUPABASE_URL`
   - **anon public** key → paste into `.env` as `VITE_SUPABASE_ANON_KEY`
4. Go to **Authentication → Providers** and make sure **Email** is enabled
   (it is by default). For quick testing, under **Authentication → Settings**
   you can turn off "Confirm email" so signup logs you in immediately.
5. Restart `npm run dev` after editing `.env`.

### Creating your first Admin user

Every signup starts as `role = 'field'`. To promote yourself to admin:

1. Sign up once from the app's login screen (any role toggle — it doesn't
   matter yet).
2. In Supabase, go to **Table Editor → profiles**, find your row, and change
   `role` to `admin`. (Or run this in the SQL Editor:)

```sql
update profiles set role = 'admin' where email = 'you@example.com';
```

3. Refresh the app — you'll now land on the Admin console.

---

## 3. Host it (pick one)

### Option A — Vercel (recommended, free)

1. Push this folder to a GitHub repository.
2. Go to <https://vercel.com> → **Add New → Project** → import the repo.
3. Framework preset: **Vite**. Build command `npm run build`, output
   directory `dist` (Vercel usually detects this automatically).
4. Under **Environment Variables**, add `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_ANON_KEY` with the same values from your `.env`.
5. Click **Deploy**. You'll get a live `https://your-app.vercel.app` URL.

### Option B — Netlify

1. Push to GitHub, then **Add new site → Import an existing project**.
2. Build command: `npm run build`, publish directory: `dist`.
3. Add the same two environment variables under **Site settings →
   Environment variables**.
4. Deploy.

Both options auto-redeploy every time you push to GitHub.

---

## 4. Turn it into an Android APK (Capacitor)

Once the site is hosted (or even just built locally), wrapping it as an
installable Android app takes about 15 minutes with
[Capacitor](https://capacitorjs.com):

```bash
npm install @capacitor/core @capacitor/android
npm install -D @capacitor/cli

npx cap init "AuraxFarm" "in.auraxfarm.app" --web-dir=dist

npm run build          # produces the dist/ folder Capacitor will wrap
npx cap add android
npx cap sync
```

Then either:

- **Build the APK on your machine:** open the project in Android Studio
  (`npx cap open android`), let Gradle sync, then
  **Build → Build Bundle(s)/APK(s) → Build APK(s)**. The APK lands in
  `android/app/build/outputs/apk/debug/app-debug.apk`.
- **Build a signed release APK** (for the Play Store) using
  `Build → Generate Signed Bundle / APK` in Android Studio once you have a
  keystore.

GPS, camera and microphone permissions are already used by the web code;
Capacitor's WebView exposes these through standard browser APIs so no extra
plugin is required for the current feature set. If you later want native
camera/GPS (better accuracy, background access) swap in
`@capacitor/camera` and `@capacitor/geolocation`.

### iOS

Same idea with `@capacitor/ios` and Xcode, if you have a Mac + Apple
Developer account — not required for Android.

---

## 5. How the offline sync actually works

- Every save (`NewFarmerModal`, `CaptureFarmModal`, `AddCropModal`) writes
  immediately to `localStorage` via `src/lib/localStore.js`, tagged
  `pending_op: 'upsert'`.
- `src/lib/sync.js` pushes any pending rows to the matching Supabase table
  whenever: the browser fires an `online` event, the user taps **Sync Now**,
  or every 20 seconds while online (see `src/lib/useOnlineSync.js`).
- On login (and whenever you come back online), `pullAll()` re-downloads
  the latest rows from Supabase so a second device/user sees new data too.
- If you go properly offline for a long field trip, none of this blocks —
  everything queues locally and flushes the moment you have signal again.

## 6. Project structure

```
src/
  context/AuthContext.jsx      Supabase auth + role handling
  lib/
    supabaseClient.js          Supabase client (reads .env)
    localStore.js              Offline-first localStorage layer
    sync.js                    Push/pull sync engine
    useOnlineSync.js           React hook: online status + auto sync
    useGeo.js                  GPS capture hook
    i18n.js                    English / Hindi / Punjabi strings
    masterData.js              Editable dropdown lists
  components/
    NewFarmerModal.jsx
    CaptureFarmModal.jsx
    AddCropModal.jsx
    VoiceInputButton.jsx
  pages/
    Login.jsx
    FieldApp.jsx                Field user dashboard / farmers / farms / sync
    AdminApp.jsx                Admin dashboard / reports / master data / users
supabase/schema.sql             Run this once in the Supabase SQL editor
```

## 7. Known limitations to be aware of

- Voice input uses the browser's `SpeechRecognition` API, which is only
  reliably available in Chrome/Edge (not Firefox, and not Safari on iOS).
- Photos are stored as base64 strings in the row itself for simplicity.
  For production at scale, switch to **Supabase Storage** (upload the file,
  store the returned URL instead) — ask and I can wire that up next.
- The current RLS policies let any signed-in user read/write all farmer
  data (simplest starting point for a small field team). If you need
  field users to only see their own captures, tighten the policies in
  `supabase/schema.sql` to filter on `created_by = auth.uid()`.
