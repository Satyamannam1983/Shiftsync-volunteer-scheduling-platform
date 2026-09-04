# Architecture

## Components

- **frontend**: React SPA. Auth screens, coordinator/volunteer navigation, dashboards, program/shift/alert UIs. Uses Axios and TanStack Query. It never computes fill state, overlap, or alert eligibility.
- **backend**: Express modular monolith. Controllers handle HTTP. Services own business rules. Mongoose models persist data.
- **MongoDB Atlas**: Users, programs, memberships, shifts, signups, shift history, alert dismissals.

## Where they run

- Browser: Vercel (or Vite locally on port 5173)
- API: Render (or locally on port 5000)
- Database: MongoDB Atlas

## Communication

The SPA sends JSON over HTTPS to `/api/*` with a Bearer JWT. CORS is limited to `FRONTEND_URL`.

## Representative request flow: volunteer signup

1. Volunteer opens a shift details page. React loads `GET /api/shifts/:id` and `GET /api/shifts/:id/signups`.
2. Volunteer clicks Sign up. Frontend posts `POST /api/shifts/:id/signups` with no `volunteerId`.
3. Auth middleware verifies JWT and attaches `userId` + `role`.
4. Controller forces the volunteer id from `req.user`.
5. `signupService.createSignup` (transaction on Atlas) checks shift existence, closed flag, scheduled time, membership, duplicate active signup, remaining capacity, and overlap windows.
6. It inserts the signup, writes `SIGNUP_CREATED` and optional `STATE_CHANGED` history, then commits.
7. React invalidates queries and re-renders derived state from the server.

## Deliberately not built

- Microservices, Redis, Kafka, Kubernetes
- Email/SMS notifications
- Multi-organization tenancy
- Fine-grained per-program coordinator roles
- Client-side filtering of the global shift list
- History edit/delete APIs
