# Servixo Backend — Week 1

Express + TypeScript + MongoDB backend covering Week 1 of the build plan:
database schema, authentication (email + Google), and user/worker profile APIs.

## Setup (in Antigravity's terminal)

1. **Install dependencies**
   ```
   npm install
   ```

2. **Create your `.env` file**
   Copy `.env.example` to `.env` and fill in:
   - `MONGO_URI` — from MongoDB Atlas: Database → Connect → Drivers
   - `JWT_SECRET` — any long random string
   - `GOOGLE_CLIENT_ID` — from Google Cloud Console (OAuth 2.0 Client ID)

3. **Run the dev server**
   ```
   npm run dev
   ```
   You should see:
   ```
   MongoDB connected: <your-cluster-host>
   Servixo API running on http://localhost:5000
   ```

4. **Seed the categories collection** (run once)
   ```
   npm run seed
   ```

5. **Test it's alive**
   Open `http://localhost:5000/api/health` in your browser — should return:
   ```json
   { "status": "ok", "message": "Servixo API is running" }
   ```

## Testing the Week 1 APIs

Use Postman, Thunder Client (VS Code/Antigravity extension), or `curl`.

### Register
```
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "name": "Ravi Kumar",
  "email": "ravi@example.com",
  "phone": "9876543210",
  "password": "test1234",
  "role": "customer"
}
```
Returns a `token` — copy it for the next requests.

### Login
```
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "ravi@example.com",
  "password": "test1234"
}
```

### Get my profile (protected route)
```
GET http://localhost:5000/api/auth/me
Authorization: Bearer <paste token here>
```

### Register a worker + complete their profile
```
POST http://localhost:5000/api/auth/register
{ "name": "Suresh", "email": "suresh@example.com", "password": "test1234", "role": "worker" }

PUT http://localhost:5000/api/workers/<userId>/profile
Authorization: Bearer <worker's token>
{
  "skills": ["Plumbing", "AC Repair"],
  "experienceYears": 5,
  "serviceRadiusKm": 10,
  "visitingCharge": 150,
  "location": { "lat": 11.258, "lng": 75.780 }
}
```

## What's implemented (Week 1 scope)

- [x] MongoDB Atlas connection
- [x] Schemas: User, Worker, Job, Quotation, Review, Category
- [x] Register / Login (bcrypt + JWT)
- [x] Google OAuth login
- [x] Auth middleware (`requireAuth`) + role middleware (`requireRole`)
- [x] Customer profile GET/PUT
- [x] Worker profile PUT (skills, radius, visiting charge, location) + availability toggle
- [x] Category seed script

## Not yet built (coming in Week 2+)

Jobs, Quotations, Socket.IO real-time notifications, image upload, admin routes —
these come in Weeks 2–4 per the project plan.
