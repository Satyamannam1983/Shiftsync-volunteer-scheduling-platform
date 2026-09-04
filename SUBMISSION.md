# Submission

## GitHub repository URL

Add the public GitHub URL after pushing this repo.

## Live application URL

Not deployed from this development environment. After you create Render + Vercel projects, put those URLs here.

## Backend URL

Render Web Service URL (example shape): `https://<service>.onrender.com`

## Frontend URL

Vercel project URL (example shape): `https://<project>.vercel.app`

## Demo coordinator

- Email: `coordinator@example.com`
- Password: set via `SEED_COORDINATOR_PASSWORD` when you run `npm run seed` (suggested local value: `Coordinator123!`)

## Demo volunteer

- Email: `volunteer@example.com`
- Password: set via `SEED_VOLUNTEER_PASSWORD` (suggested local value: `Volunteer123!`)

Do not commit those passwords in source. Additional seeded volunteers (`bob@example.com`, `chen@example.com`, `dana@example.com`, `evan@example.com`) share the volunteer seed password.

## Deployment notes

1. Atlas: replica-set cluster, database user, network access.
2. Render: root directory `backend`, start command `npm start`, env `MONGODB_URI`, `JWT_SECRET`, `FRONTEND_URL`, `NODE_ENV=production`, `PORT` provided by Render.
3. Vercel: root `frontend`, env `VITE_API_URL=https://<render-host>/api`.
4. CORS: `FRONTEND_URL` must match the Vercel origin.

## Cold start

Render free instances sleep. The first API request after idle can take 30–60 seconds.

## Setup notes

```
cd backend && npm install && npm run seed && npm run dev
cd frontend && npm install && npm run dev
```

## Known limitations

See README. Deploy URLs and the GitHub remote must be filled in by the student after push/deploy.
