# Volunteer Scheduling System

Production-style volunteer scheduling for coordinators and volunteers. The backend is the source of truth for membership, fill state, overlap detection, alerts, and permissions.

## Features

- JWT authentication with volunteer and coordinator roles
- Program archive/restore and many-to-many membership
- Derived shift states: OPEN, PARTIALLY_FILLED, FILLED, CLOSED
- Volunteer self-signup, coordinator proxy signup, overlap rejection
- Server-side shift search, filter, sort, and pagination
- Recurring schedule generation with created/skipped reporting
- CSV roster export
- Dashboard aggregations
- Immutable shift history
- Understaffed alerts that reappear after a filled shift drops below headcount

## Architecture

React (Vercel) talks to an Express API (Render) over HTTPS. The API uses Mongoose against MongoDB Atlas. Business rules live in backend services, not React.

See `docs/architecture.md`.

## Tech stack

Frontend: React, Vite, JavaScript, Tailwind CSS, React Router, Axios, TanStack Query, Recharts  
Backend: Node.js, Express, Mongoose, JWT, bcryptjs, Helmet, express-validator  
Database: MongoDB Atlas  
Tests: Jest + Supertest, Vitest + React Testing Library

## Project structure

```
backend/   Express API, services, models, tests, seed
frontend/   React SPA
docs/       Architecture, schema, plan, decisions, AI prompts
```

## Local setup

1. Create a MongoDB Atlas cluster (replica set) or local MongoDB.
2. Copy environment files:

```
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

3. Fill `MONGODB_URI`, `JWT_SECRET`, seed passwords, and `VITE_API_URL`.

## Environment variables

Backend: `MONGODB_URI`, `JWT_SECRET`, `PORT`, `FRONTEND_URL`, `NODE_ENV`, `JWT_EXPIRES_IN`, `SEED_COORDINATOR_PASSWORD`, `SEED_VOLUNTEER_PASSWORD`  
Frontend: `VITE_API_URL`

Never commit `.env` files.

## Run backend

```
cd backend
npm install
npm run dev
```

## Run frontend

```
cd frontend
npm install
npm run dev
```

## Database setup

Use MongoDB Atlas. Transactions for last-spot signups require a replica set (`mongodb+srv`). Standalone MongoDB falls back to non-transactional writes plus a unique partial index on active signups.

## Seed instructions

```
cd backend
# set SEED_COORDINATOR_PASSWORD and SEED_VOLUNTEER_PASSWORD first
npm run seed
```

Demo emails: `coordinator@example.com` and `volunteer@example.com`. Passwords are only documented in `SUBMISSION.md`.

## Testing

```
cd backend && npm test
cd frontend && npm test
```

## Deployment

- Atlas: create a cluster and database user, whitelist Render IPs or `0.0.0.0/0` for a take-home.
- Render: Web Service, root `backend`, start `npm start`, build `npm install`.
- Vercel: root `frontend`, env `VITE_API_URL` pointing at the Render `/api` origin.

## Demo accounts

Documented in `SUBMISSION.md` only.

## Known limitations

- Render free tiers sleep and have a cold start.
- Shift wall-clock times are interpreted in the server's local timezone unless `APP_TIMEZONE` is later expanded.
- Concurrent last-spot protection is strongest on Atlas replica sets.
- Removing a member cancels that volunteer's future active signups for the program and keeps historical records.
