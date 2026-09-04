const app = require("../src/app");
const { createUser, auth } = require("./helpers");

const futureDate = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

describe("alerts and history", () => {
  let coordinator;
  let volunteer;
  let api;

  beforeEach(async () => {
    coordinator = await createUser({
      name: "Casey",
      email: "coord@example.com",
      password: "password123",
      role: "coordinator",
    });
    volunteer = await createUser({
      name: "Alice",
      email: "alice@example.com",
      password: "password123",
      role: "volunteer",
    });
    api = auth(app, coordinator);
  });

  it("shows understaffed shifts within 3 days and hides farther ones", async () => {
    const program = await api.post("/api/programs").send({ name: "Food Bank" });
    const programId = program.body.program._id;
    await api.post(`/api/programs/${programId}/members`).send({ volunteerId: volunteer._id });

    const soon = await api.post("/api/shifts").send({
      program: programId,
      date: futureDate(1).toISOString(),
      startTime: "09:00",
      durationMinutes: 60,
      location: "Hall",
      requiredHeadcount: 2,
    });
    await api.post("/api/shifts").send({
      program: programId,
      date: futureDate(10).toISOString(),
      startTime: "09:00",
      durationMinutes: 60,
      location: "Hall",
      requiredHeadcount: 2,
    });

    const alerts = await api.get("/api/alerts");
    expect(alerts.body.alerts.some((alert) => alert.shiftId === soon.body.shift._id)).toBe(true);
    expect(alerts.body.alerts.length).toBe(1);
  });

  it("dismisses an alert and brings it back after a filled shift becomes understaffed", async () => {
    const program = await api.post("/api/programs").send({ name: "Food Bank" });
    const programId = program.body.program._id;
    const bob = await createUser({
      name: "Bob",
      email: "bob@example.com",
      password: "password123",
      role: "volunteer",
    });
    await api.post(`/api/programs/${programId}/members`).send({ volunteerId: volunteer._id });
    await api.post(`/api/programs/${programId}/members`).send({ volunteerId: bob._id });

    const shift = await api.post("/api/shifts").send({
      program: programId,
      date: futureDate(1).toISOString(),
      startTime: "09:00",
      durationMinutes: 60,
      location: "Hall",
      requiredHeadcount: 1,
    });
    const shiftId = shift.body.shift._id;

    const dismissed = await api.post(`/api/alerts/${shiftId}/dismiss`);
    expect(dismissed.status).toBe(200);

    const hidden = await api.get("/api/alerts");
    expect(hidden.body.alerts.find((alert) => alert.shiftId === shiftId)).toBeUndefined();

    const signup = await api.post(`/api/shifts/${shiftId}/signups`).send({
      volunteerId: volunteer._id.toString(),
    });
    await api.delete(`/api/shifts/${shiftId}/signups/${signup.body.signup._id}`);

    const again = await api.get("/api/alerts");
    expect(again.body.alerts.some((alert) => alert.shiftId === shiftId)).toBe(true);
  });

  it("records history events and has no update/delete history routes", async () => {
    const program = await api.post("/api/programs").send({ name: "Food Bank" });
    const programId = program.body.program._id;
    await api.post(`/api/programs/${programId}/members`).send({ volunteerId: volunteer._id });
    const shift = await api.post("/api/shifts").send({
      program: programId,
      date: futureDate(4).toISOString(),
      startTime: "09:00",
      durationMinutes: 60,
      location: "Hall",
      requiredHeadcount: 2,
    });
    const shiftId = shift.body.shift._id;
    const signup = await api.post(`/api/shifts/${shiftId}/signups`).send({
      volunteerId: volunteer._id.toString(),
    });
    await api.delete(`/api/shifts/${shiftId}/signups/${signup.body.signup._id}`);
    await api.post(`/api/shifts/${shiftId}/notes`).send({ note: "Bring extra bags" });

    const history = await api.get(`/api/shifts/${shiftId}/history`);
    const types = history.body.history.map((event) => event.type);
    expect(types).toContain("SHIFT_CREATED");
    expect(types).toContain("SIGNUP_CREATED");
    expect(types).toContain("SIGNUP_CANCELLED");
    expect(types).toContain("STATE_CHANGED");
    expect(types).toContain("NOTE_ADDED");

    const patched = await api.patch(`/api/shifts/${shiftId}/history`);
    expect(patched.status).toBe(404);
    const deleted = await api.delete(`/api/shifts/${shiftId}/history`);
    expect(deleted.status).toBe(404);
  });
});
