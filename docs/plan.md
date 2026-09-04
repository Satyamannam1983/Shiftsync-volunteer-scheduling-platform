# Plan

## What was already in the repo

A backend skeleton through Phase 11 existed: auth, programs, membership, shifts, signups, recurring, roster, dashboard, history, and alerts. There was no frontend, tests, seed, docs, Helmet/validation, or production hardening.

## Sessions (this continuation)

1. Audit and keep working models/routes.
2. Harden services: transactions detection, alert cycle, server-side state filter, close-after-start, notes, roster path, CSV headers, dashboard program filter.
3. Add Jest tests and seed script.
4. Build the React SPA.
5. Write README, SUBMISSION.md, and `docs/*`.

## Order vs spec

Followed the original PHASE 1–14 order for remaining work. Backend gaps were closed before UI so the UI could call real contracts.

## Time

Estimated remaining work: 10–14 hours. Actual implementation was a single continuation session covering hardening, tests, frontend, and docs.

## What was cut

- Live Render/Vercel deploy from this environment (accounts and secrets are not available here). Deployment steps are documented.
- Redis or other extra infrastructure, as required by the performance section.
