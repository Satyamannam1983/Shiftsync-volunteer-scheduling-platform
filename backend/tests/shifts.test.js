const app = require("../src/app");
const { createUser, auth } = require("./helpers");
const { calculateShiftState } = require("../src/utils/stateUtils");

const futureDate = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

describe("shifts", () => {
  let coordinator;
  let api;
  let programId;

  beforeEach(async () => {
    coordinator = await createUser({
      name: "Casey",
      email: "coord@example.com",
      password: "password123",
      role: "coordinator",
    });
    api = auth(app, coordinator);
    const program = await api.post("/api/programs").send({ name: "Food Bank" });
    programId = program.body.program._id;
  });

  it("creates, edits, and lists a shift with derived state", async () => {
    const created = await api.post("/api/shifts").send({
      program: programId,
      date: futureDate(4).toISOString(),
      startTime: "09:00",
      durationMinutes: 120,
      location: "Hall",
      requiredHeadcount: 3,
    });
    expect(created.status).toBe(201);

    const listed = await api.get("/api/shifts?search=Hall&page=1&limit=10");
    expect(listed.body.items.length).toBe(1);
    expect(listed.body.items[0].state).toBe("OPEN");
    expect(listed.body.pagination.total).toBe(1);

    const updated = await api.patch(`/api/shifts/${created.body.shift._id}`).send({
      location: "Warehouse",
    });
    expect(updated.body.shift.location).toBe("Warehouse");
  });

  it("derives fill states from signup count", () => {
    expect(calculateShiftState(0, 3, false)).toBe("OPEN");
    expect(calculateShiftState(1, 3, false)).toBe("PARTIALLY_FILLED");
    expect(calculateShiftState(3, 3, false)).toBe("FILLED");
    expect(calculateShiftState(3, 3, true)).toBe("CLOSED");
  });

  it("rejects closing a shift before it starts", async () => {
    const created = await api.post("/api/shifts").send({
      program: programId,
      date: futureDate(4).toISOString(),
      startTime: "09:00",
      durationMinutes: 120,
      location: "Hall",
      requiredHeadcount: 3,
    });
    const closed = await api.post(`/api/shifts/${created.body.shift._id}/close`);
    expect(closed.status).toBe(400);
  });

  it("deletes a shift with no active signups", async () => {
    const created = await api.post("/api/shifts").send({
      program: programId,
      date: futureDate(4).toISOString(),
      startTime: "09:00",
      durationMinutes: 120,
      location: "Hall",
      requiredHeadcount: 3,
    });
    const deleted = await api.delete(`/api/shifts/${created.body.shift._id}`);
    expect(deleted.status).toBe(200);
  });
});
