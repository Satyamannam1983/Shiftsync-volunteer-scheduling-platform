# Submission

## Project

ShiftSync is a volunteer scheduling system for coordinators and volunteers. It provides role-based access to programs, shifts, signups, rosters, dashboards, and scheduling history.

## Repository

https://github.com/Satyamannam1983/volunteer-scheduling

## Live Application

- Frontend: **[PLACEHOLDER: Render frontend URL is not present in the repository configuration]**
- Backend: https://shiftsync-volunteer-scheduling-platform-1.onrender.com

## Demo Credentials

### Coordinator

- Email: `coordinator@example.com`
- Password: **[PLACEHOLDER: set via `SEED_COORDINATOR_PASSWORD`; not stored in the repository]**

### Volunteer

- Email: `volunteer@example.com`
- Password: **[PLACEHOLDER: set via `SEED_VOLUNTEER_PASSWORD`; not stored in the repository]**

## Tech Stack

- Frontend: React, Vite, React Router, Tailwind CSS, Axios, Recharts
- Backend: Node.js, Express.js, Mongoose
- Database: MongoDB Atlas
- Authentication: JWT and bcryptjs
- Deployment: Render web service and static site

## Implemented Features

- JWT authentication with coordinator and volunteer roles
- Program creation, archiving/restoring, and volunteer membership management
- Shift creation, editing, closing, derived lifecycle states, and recurring schedule generation
- Volunteer self-signup and coordinator-managed signups
- Signup overlap prevention and headcount protection
- Shift search, filtering, sorting, and pagination
- CSV roster export
- Dashboard aggregations
- Immutable shift history
- Understaffed alerts with dismissal and reappearance behavior

## Deployment

The backend runs as a Node/Express web service on Render and exposes the `/api` routes, including `/api/health`. The frontend is deployed as a Render static site and communicates with the backend over HTTPS using the `VITE_API_URL` build-time variable. The backend uses MongoDB Atlas through `MONGODB_URI`.

Production configuration also requires `JWT_SECRET`, `FRONTEND_URL`, `NODE_ENV`, `JWT_EXPIRES_IN`, and `APP_TIMEZONE`. Seed passwords are supplied separately through `SEED_COORDINATOR_PASSWORD` and `SEED_VOLUNTEER_PASSWORD`; secrets and connection strings are not committed.

Render free-tier services may sleep when inactive, causing a cold start on the first request.

## Local Setup

```bash
cd backend
npm install
npm run dev
```

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Configure the environment variables from `backend/.env.example` and `frontend/.env.example` before running the application.

## Testing

The repository includes Jest and Supertest API tests under `backend/tests`, plus Vitest and React Testing Library tests under `frontend/src`. Available commands are:

```bash
cd backend && npm test
cd frontend && npm test
```

The deployed backend health endpoint was verified at `/api/health`, and the deployed frontend login route was verified to load.

## Known Limitations

- Render free-tier cold starts can delay the first request after inactivity.
- Shift wall-clock times use the server timezone unless `APP_TIMEZONE` is configured.
- Last-spot signup protection is strongest when MongoDB Atlas provides a replica set.

## Submission Checklist

- [x] Public GitHub repository
- [ ] Live frontend — URL not present in repository configuration
- [x] Live backend
- [x] MongoDB Atlas configuration
- [ ] Demo coordinator password — supplied through deployment environment
- [ ] Demo volunteer password — supplied through deployment environment
- [x] Environment variables configured outside source control
- [x] Seed/demo data
- [x] Documentation
