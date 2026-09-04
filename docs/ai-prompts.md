# AI Prompts

AI was used as a development assistant during the Volunteer Scheduling System project. The main
uses were scaffolding, debugging, focused implementation help, edge-case analysis, UI assistance,
and code review. The prompts below capture the main interactions that influenced development.

## 1. Project structure

### Context
I chose the MERN stack and wanted a simple modular backend.

### Prompt
> I am building a Volunteer Scheduling System with React, Node.js, Express and MongoDB. Suggest
> a clean backend structure using routes, controllers, models, middleware and services without
> overengineering the application.

### Result
I used the suggested separation as a starting point and adjusted it to fit the project.

---

## 2. MongoDB connection debugging

### Context
The first backend connection failed because the MongoDB URI was undefined.

### Prompt
> My Mongoose connection says the MongoDB URI is undefined even though it is in .env. Check the
> initialization order and explain what could cause process.env.MONGODB_URI to be undefined.

### Result
The issue was dotenv loading after the database module was imported. I changed the startup order
and verified the connection again.

---

## 3. MongoDB Atlas connectivity

### Context
After fixing the environment loading issue, Atlas returned `querySrv ENOTFOUND`.

### Prompt
> Mongoose now receives the MongoDB URI but Atlas returns a querySrv ENOTFOUND error. What should
> I verify in the Atlas cluster, connection string, database user and network settings?

### Result
I checked the cluster, credentials, connection string and IP access configuration. The backend
then connected successfully.

---

## 4. Registration

### Prompt
> Implement a registration endpoint with name, email and password. Validate required fields,
> normalize email, reject duplicate accounts, hash the password with bcrypt, and return only
> safe user information.

### Result
I implemented and tested registration through Thunder Client. The duplicate-email response was
later changed to `User with email already exists` for clearer wording.

---

## 5. Role escalation

### Context
An early registration design accepted a role from the client.

### Prompt
> Review this registration flow for privilege escalation. If the client can submit a role, could
> an unauthenticated user create a coordinator account? Suggest a safer design.

### Result
I removed role selection from public registration. New public accounts are volunteers; coordinator
creation is treated as a controlled operation.

---

## 6. Login and JWT

### Prompt
> Implement login using bcrypt and JWT. Find the user by normalized email, compare the password,
> reject invalid credentials, create an expiring JWT containing the user ID and role, and read the
> secret from environment variables.

### Result
Login and JWT creation were implemented and tested with Thunder Client.

---

## 7. JWT middleware

### Prompt
> Create Express middleware that reads a Bearer token, verifies it with JWT_SECRET, attaches the
> decoded user to req.user, returns 401 for missing or invalid tokens, and supports role-based
> authorization with a coordinator-only middleware.

### Result
Authentication and authorization middleware were added. A protected `/api/auth/me` endpoint was
used to verify valid, missing and invalid-token behavior.

---

## 8. UI-first AI attempt

### Context
One AI coding attempt focused mainly on generating the React interface.

### Result
The UI looked reasonable, but important backend behavior was still missing. That was not enough for
the assignment.

### Follow-up prompt
> The current implementation focuses too much on UI. Stop adding presentation components and
> inspect the missing backend functionality and business rules. The backend must remain
> authoritative.

### Result
I redirected the work toward backend integration and server-side validation instead of treating a
complete-looking UI as a complete application.

---

## 9. Shift lifecycle

### Prompt
> Design the shift lifecycle for OPEN, PARTIALLY_FILLED, FILLED and CLOSED. Zero signups is OPEN,
> fewer than required is PARTIALLY_FILLED, required headcount is FILLED, and a coordinator can
> close a shift after its scheduled time. The client must not be able to force the state.

### Result
Fill state was treated as a server-controlled value derived from signup count and required
headcount.

---

## 10. Signup rules

### Prompt
> Design signup validation for the Volunteer Scheduling System. A volunteer must belong to the
> program, cannot join a filled or closed shift, cannot duplicate an active signup, and cannot
> signup another volunteer. A coordinator can signup any volunteer.

### Result
These rules were treated as backend business logic rather than frontend-only checks.

---

## 11. Overlapping shifts

### Prompt
> What is a reliable server-side way to determine whether a new volunteer shift overlaps an
> existing shift? Include the boundary case where one shift ends exactly when another begins.

### Result
I used the interval rule:

```text
newStart < existingEnd
AND
newEnd > existingStart
```

This allows adjacent shifts while rejecting actual overlaps.

---

## 12. Concurrent final spot

### Prompt
> A shift requires five volunteers and currently has four signups. Two volunteers submit requests
> at nearly the same time. Explain how the backend should prevent both from incorrectly taking the
> final spot.

### Result
The issue was treated as a concurrency problem rather than ordinary validation. The availability
check and signup write need atomic handling where MongoDB transaction support is available.

---

## 13. Server-side search

### Prompt
> Design GET /api/shifts with search over program name and location, filters for program, state
> and date, sorting, pagination and total match count. Do not load every shift into React.

### Result
Filtering, sorting and pagination were designed to happen in MongoDB through server-side query
parameters and paginated responses.

---

## 14. Recurring schedules

### Prompt
> Design a recurring schedule operation using a start date, end date, weekday, start time,
> duration, location and required headcount. Exclude holiday dates and skip an existing shift at
> the same program/date/time. Return created and skipped dates with reasons.

### Result
The scheduling logic was separated from the route so it could be tested and reused.

---

## 15. CSV roster

### Prompt
> Create a coordinator-only CSV roster containing volunteer name, email and total hours for their
> signups in a program. Return valid CSV and handle special characters correctly.

### Result
Roster calculations were kept on the server.

---

## 16. Dashboard

### Prompt
> Design dashboard calculations for shifts this week, open shifts, signups this week, closed
> shifts, breakdowns by fill state and program, and signups per week for the last eight weeks.
> Prefer MongoDB aggregation over downloading raw data to React.

### Result
The dashboard was designed around server-side aggregation.

---

## 17. Immutable history

### Prompt
> Design an append-only history model for a shift that records creation, state changes, signups,
> cancellations, notes and closing. Historical records must not be edited or deleted.

### Result
History was treated as a separate append-only collection containing the actor, event type,
timestamp and relevant metadata.

---

## 18. Understaffed alerts

### Prompt
> A shift is understaffed when its date is within the next three days and it is OPEN or
> PARTIALLY_FILLED. Coordinators can dismiss alerts, but if a Filled shift later becomes
> understaffed because of cancellation, the alert must return. How should this be modeled?

### Result
A permanent dismissed boolean was considered insufficient. Alert visibility needs to consider
the current staffing condition and later state changes.

---

## 19. Security and edge-case review

### Prompt
> Review the Volunteer Scheduling backend as a senior engineer. Focus on missing authorization,
> privilege escalation, client-controlled state, duplicate signup, overlapping shifts, closed
> shifts, immutable history, alert reappearance and exposed secrets.

### Result
I used the review as a second opinion and checked recommendations against the assignment and
actual application behavior before making changes.

---

## 20. Final requirement review

### Prompt
> Review the repository against the Volunteer Scheduling requirements and identify anything
> incomplete across authentication, authorization, programs, memberships, shifts, signups, search,
> recurring schedules, roster export, dashboard, history and alerts.

### Result
The review was used as a final gap-check rather than as a substitute for implementation and
testing.

---

## How AI was used

The most useful workflow was focused rather than fully autonomous:

```text
Understand requirement
      ↓
Choose approach
      ↓
Use AI for a specific problem
      ↓
Inspect the suggestion
      ↓
Implement or modify it
      ↓
Run and test the application
      ↓
Keep, change or reject the result
```

AI was especially useful for debugging, implementation starting points, edge-case discovery,
UI acceleration, and second-pass review. The UI-only attempt was corrected after review, and
server-side business rules remained the central implementation concern.
