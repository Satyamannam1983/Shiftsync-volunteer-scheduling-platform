# Engineering decisions

## 1. Derived fill state, not a stored enum

**Problem:** OPEN / PARTIALLY_FILLED / FILLED must not be client-editable.  
**Options:** store `state` and update on every signup; derive from signup count.  
**Chosen:** derive in services/aggregations. `closed` is the only stored lifecycle flag.  
**Why:** clients cannot spoof fill.  
**Trade-off:** list queries join signup counts.

## 2. MongoDB transactions with a documented fallback

**Problem:** two volunteers can race the last spot.  
**Options:** always transactions; application lock; unique index only.  
**Chosen:** `session.withTransaction` when topology is a replica set/Atlas; otherwise fallback plus a partial unique index on active volunteer+shift.  
**Why:** Atlas (the deployment target) supports transactions. Local standalone Mongo often does not.  
**Trade-off:** last-spot races remain theoretically possible on standalone Mongo. Duplicate self-signup still fails on the unique index.

## 3. Alert cycle instead of deleting dismissals

**Problem:** dismissing an understaffed shift must not hide it forever after it fills and then drops.  
**Options:** delete dismissals on rollback; store timestamp; store a version.  
**Chosen:** increment `Shift.alertCycle` when FILLED → OPEN/PARTIALLY_FILLED. Dismissal stores that cycle in `stateVersion`.  
**Why:** matches “do not permanently hide based on an old dismissal” and keeps dismissal rows for audit.  
**Trade-off:** extra field on Shift.

## 4. Timezone: UTC storage, local wall-clock for shift windows

**Problem:** overlap and “has the shift started?” need comparable datetimes.  
**Options:** store everything as strings; store zoned instants; Date + HH:MM.  
**Chosen:** Mongo `Date` for the calendar day, `startTime` as HH:MM, combine with `Date#setHours` on the server. Recurring dates parse `YYYY-MM-DD` as local calendar dates, not UTC midnight.  
**Why:** volunteer shifts are wall-clock events. UTC midnight strings shift the weekday in US timezones.  
**Trade-off:** multi-region orgs would need an explicit IANA timezone on Program.

## 5. Membership removal cancels future signups, keeps history

**Problem:** spec forbids silently deleting signup history but is silent on future occupancy.  
**Options:** leave future signups; delete them; cancel via `cancelledAt`.  
**Chosen:** cancel future, non-closed, not-yet-started signups; leave historical rows.  
**Why:** the volunteer is no longer in the program, so they should not occupy upcoming headcount, but audits stay intact.

## 6. Reversed: filter fill state after pagination

**Problem:** first implementation paginated Mongo documents then filtered `state` in memory, which broke totals.  
**Options:** keep it and document the bug; move state into an aggregation `$match` before `$facet`.  
**Chosen (after reversing):** aggregation pipeline computes `state`, then filters, then paginates.  
**Why:** Server-side pagination requires exact total counts for filtered results.

## 7. Public registration cannot set role

**Problem:** clients could send `role: coordinator`.  
**Options:** honor body role for first user; ignore role; reject non-volunteer role.  
**Chosen:** validators reject any role other than volunteer; service always writes `volunteer`. Coordinators come from seed.
