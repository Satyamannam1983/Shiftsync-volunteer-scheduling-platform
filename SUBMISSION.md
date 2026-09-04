# Submission

## GitHub repository URL

https://github.com/Satyamannam1983/volunteer-scheduling

## Live application URL

Not deployed from this development environment yet. After creating Render + Vercel projects, put those URLs here.

## Backend URL

Render Web Service URL (example shape): `https://<service>.onrender.com`

A `render.yaml` blueprint is in the repo root (`rootDir: backend`, start `npm start`, health check `/api/health`).

## Frontend URL

Vercel project URL (example shape): `https://<project>.vercel.app`

Set the Vercel project root to `frontend`. SPA rewrites are in `frontend/vercel.json`. Set `VITE_API_URL` to `https://<render-host>/api`.

## Demo coordinator

- Email: `coordinator@example.com`
- Password: set via `SEED_COORDINATOR_PASSWORD` when you run `npm run seed` (suggested local value: `Coordinator123!`)

## Demo volunteer

- Email: `volunteer@example.com`
- Password: set via `SEED_VOLUNTEER_PASSWORD` (suggested local value: `Volunteer123!`)

Do not commit those passwords in source. Additional seeded volunteers (`bob@example.com`, `chen@example.com`, `dana@example.com`, `evan@example.com`) share the volunteer seed password.

## Deployment notes

1. Atlas: replica-set cluster, database user, network access (`0.0.0.0/0` is acceptable for a take-home).
2. Render: Web Service, root directory `backend`, start command `npm start`, env `MONGODB_URI`, `JWT_SECRET`, `FRONTEND_URL` (the Vercel origin, no trailing slash), `NODE_ENV=production`. `PORT` is provided by Render.
3. Vercel: root `frontend`, env `VITE_API_URL=https://<render-host>/api`.
4. CORS: `FRONTEND_URL` must match the Vercel origin. Multiple origins can be comma-separated if needed.
5. Redeploy the frontend after changing `VITE_API_URL` (it is baked in at build time).

## Cold start

Render free instances sleep. The first API request after idle can take 30–60 seconds.

## Setup notes

```
cd backend && npm install && npm run seed && npm run dev
cd frontend && npm install && npm run dev
```

## Known limitations

See README. Live Render/Vercel URLs still need to be pasted here after you create those projects (this machine cannot log into your cloud accounts).
