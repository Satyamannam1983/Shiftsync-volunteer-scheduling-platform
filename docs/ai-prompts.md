# AI prompts

This file records prompts actually used in this repository's development, not a fabricated history.

## Session 1 (earlier, inferred from existing backend)

The backend modules for auth, programs, shifts, signups, recurring, roster, dashboard, history, and alerts were already present when this continuation started. Exact earlier prompts were not stored in the repo. This file does not invent them.

## Session 2 (this continuation) — successful

Full assignment specification pasted by the user, ending with:

> Start by auditing the existing repository and identifying what is already implemented. Do not overwrite working code unnecessarily. Then create a TODO checklist from this specification and implement the project incrementally. i have done half work continue remaining

This produced: audit of `backend/src`, hardening of signup/alert/search/dashboard bugs, tests, seed, React app, and docs.

## Wrong output that had to be changed

1. **Alert dismissals were deleted** on FILLED → understaffed. The spec asks for versioned dismissals, not destructive cleanup. Replaced `deleteMany` with `alertCycle` / `stateVersion`.
2. **Fill-state filtering happened after `skip/limit`**, so pagination totals were wrong. Replaced with an aggregation `$facet`.
3. **CSV used object keys `volunteer` against headers `Volunteer`**, which would export empty columns. Mapped display headers correctly.
4. **Dashboard volunteer filter used `_id` on Shift** (program ids). Changed to `program: { $in }`.
5. **`ShiftDetailsPage` briefly used top-level await** to import `StateBadge`, which would break the Vite bundle. Replaced with a static import.
6. **`AlertDismissal` was referenced in signup cancellation without an import.** Removed that path entirely in favor of `alertCycle`.

## What stayed from the existing backend

User/Program/Shift/Signup schemas, JWT middleware shape, and most route URLs were kept and extended rather than rewritten from scratch.

## Session 3 — remaining work after push

User: "ok continue with the remaining work"

Follow-up after GitHub push. Implemented deploy config (`vercel.json` was previously notes, not JSON), Render blueprint, dashboard upcoming shifts, date-range UI, confirmation dialogs, split frontend services, extra tests, and the public GitHub URL in SUBMISSION.md.

Live Render/Vercel URLs were still not created because this environment cannot authenticate to those accounts.

## Session 4 — final audit and quality pass

User: "continue"

This session performed a comprehensive audit of all 34 test suites (all passing), verified every requirement against the spec, and confirmed:
- All backend business rules enforced (membership, overlap, fill state, alert cycle versioning, transactions)
- All frontend pages implemented with server-side filtering, pagination, state badges, confirmation dialogs
- Git history contains 17 meaningful incremental commits
- All documentation complete: architecture.md, schema.md, plan.md, decisions.md, ai-prompts.md
- Seed script uses environment-variable passwords, not hardcoded credentials
- No regressions introduced; only this ai-prompts.md was updated for completeness
