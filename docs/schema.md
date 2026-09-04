# Schema

## Collections

### users
`name` string, `email` unique lowercase string, `passwordHash` string, `role` enum volunteer|coordinator, timestamps.

### programs
`name`, `description`, `archived` boolean, `createdBy` User, timestamps.

### programmembers
Many-to-many volunteer ↔ program. `program`, `volunteer`, `addedBy`, timestamps. Unique `{ program, volunteer }`.

### shifts
`program`, `date` Date, `startTime` HH:MM string, `durationMinutes`, `location`, `requiredHeadcount`, `createdBy`, `closed`, `closedAt`, `alertCycle` number, timestamps. Virtual `endTime`. Fill state is **not** stored.

### signups
`shift`, `volunteer`, `createdBy`, `cancelledAt` (null when active), timestamps. Partial unique index on `{ shift, volunteer }` where `cancelledAt` is null.

### shifthistories
Append-only: `shift`, `type`, `actor`, `metadata`, timestamps. No update/delete routes.

### alertdismissals
`shift`, `coordinator`, `dismissedAt`, `stateVersion` (stores current `alertCycle`). Records are not deleted when an alert should reappear; a new cycle invalidates the old dismissal.

## Relationships

- Program 1→N Shifts
- Program N↔N Users (volunteers) through ProgramMember
- Shift 1→N Signups
- Shift 1→N ShiftHistory
- Shift 1→N AlertDismissal

## Database vs application constraints

Database: unique email, unique membership, unique active signup, required refs.  
Application: overlap, fill caps, closed/time windows, role checks, understaffed window, recurring skip rules.

## Denormalization

Fill state is derived, not stored. Dashboard counters are aggregated on read. `alertCycle` on Shift is a small denormalization so dismissals can be versioned without deleting records.

## 100x data

Per-shift signup counts in the list endpoint would need a cached counter or a maintained `activeSignupCount`. Alert scans should become an aggregation with date bounds. History collections would need TTL-or-archive policy for very old events.
