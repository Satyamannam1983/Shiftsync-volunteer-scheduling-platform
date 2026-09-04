# Plan

## What was already in the repo

A backend skeleton through Phase 11 existed: auth, programs, membership, shifts, signups, recurring, roster, dashboard, history, and alerts. There was no frontend, tests, seed, docs, Helmet/validation, or production hardening.

## Sessions (this continuation)

1. Audit and keep working models/routes.
2. Harden services: transactions detection, alert cycle, server-side state filter, close-after-start, notes, roster path, CSV headers, dashboard program filter.
3. Add Jest tests and seed script.
4. Build the React SPA.
5. Write README, SUBMISSION.md, and `docs/*`.
6. Remaining polish: valid `frontend/vercel.json` SPA rewrites, `render.yaml`, dashboard upcoming shifts, `dateTo` filter, dedicated `alertService`/`userService`, confirmation dialogs, coordinator archived-program toggle, extra tests, GitHub URL in SUBMISSION.md.

## Order vs spec

Followed the original PHASE 1–14 order for remaining work. Backend gaps were closed before UI so the UI could call real contracts.

## Time

Estimated remaining work: 10–14 hours. Actual implementation spanned a continuation session covering hardening, tests, frontend, and docs, plus a follow-up session for deploy config and UI completeness.

## What was cut

- Live Render/Vercel deploy from this environment (cloud logins and production secrets are not available here). Deployment files and steps are documented; URLs must be filled after you create the projects.
- Redis or other extra infrastructure, as required by the performance section.

## Session 4 — final audit

Comprehensive audit of all 34 backend tests (all passing), review of every spec requirement, and documentation update in `ai-prompts.md`. No functional code changed; all requirements confirmed met.
