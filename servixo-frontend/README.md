# Servixo Frontend — Week 2

React + Vite + TypeScript frontend, connected to the backend built in Week 1.
Covers: Login, Signup (with Customer/Worker toggle), Forgot Password, and the
Customer Home page (live categories fetched from your database).

## Setup (in Antigravity's terminal)

1. Make sure your **backend is running** first (`npm run dev` in `servixo-backend`,
   on port 5000).

2. **Install dependencies**
   ```
   npm install
   ```

3. **Create your `.env` file**
   ```
   cp .env.example .env
   ```
   The default value (`http://localhost:5000/api`) already matches your backend —
   no editing needed unless you change the backend's port.

4. **Run the dev server**
   ```
   npm run dev
   ```
   You should see:
   ```
   VITE ready in ... ms
   ➜  Local:   http://localhost:5173/
   ```

5. **Open it in your browser**
   Go to `http://localhost:5173` — you should land on the Login page.

## Try it out

1. Click **"Create an account"**
2. Toggle between **"I need a service"** (customer) and **"I provide a service"** (worker)
3. Fill in the form and submit — this calls the same `/api/auth/register` endpoint you
   already tested with `curl` in Week 1, just from a real form now
4. You should be redirected to the Customer Home page (or Worker dashboard placeholder)
5. Log out, then log back in with the same credentials to test `/api/auth/login`
6. Try **"Forgot password?"** — it calls the reset flow you built and tested last

## What's implemented (Week 2 scope so far)

- [x] React + Vite + TypeScript project setup
- [x] Tailwind CSS styling
- [x] React Query for API data fetching/caching
- [x] Axios instance with automatic JWT attachment
- [x] AuthContext — tracks logged-in user across the app, persists in localStorage
- [x] ProtectedRoute — blocks pages from being viewed without login, and can restrict by role
- [x] Login page (connected to backend)
- [x] Signup page with Customer/Worker toggle (connected to backend)
- [x] Forgot Password page (connected to backend)
- [x] Customer Home page — fetches real categories from MongoDB via React Query

## Not yet built (coming later in Week 2 / Week 3)

- Create Service Request page (with image upload)
- Worker profile setup form (skills, service radius, visiting charge)
- Google login button on the frontend
- Compare Quotations, Job Tracking, and the rest of the core loop (Week 3)

## A note on the Worker pages

`WorkerHome` and `WorkerProfileSetup` are intentionally placeholders right now —
just enough to confirm the login/signup flow routes workers correctly. The real
worker dashboard (with live incoming job requests) gets built in Week 3, once
Socket.IO real-time notifications are added.
