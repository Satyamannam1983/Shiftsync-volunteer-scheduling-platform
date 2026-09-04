const app = require("../src/app");
const { createUser, auth } = require("./helpers");

describe("programs", () => {
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

  it("creates, edits, archives, and restores a program", async () => {
    const created = await api.post("/api/programs").send({
      name: "Food Bank",
      description: "Packing",
    });
    expect(created.status).toBe(201);
    const id = created.body.program._id;

    const updated = await api.patch(`/api/programs/${id}`).send({ description: "Updated" });
    expect(updated.body.program.description).toBe("Updated");

    const archived = await api.post(`/api/programs/${id}/archive`);
    expect(archived.body.program.archived).toBe(true);

    const restored = await api.post(`/api/programs/${id}/restore`);
    expect(restored.body.program.archived).toBe(false);
  });

  it("adds and removes membership without deleting historical signups", async () => {
    const program = await api.post("/api/programs").send({ name: "Food Bank" });
    const programId = program.body.program._id;

    const added = await api.post(`/api/programs/${programId}/members`).send({
      volunteerId: volunteer._id,
    });
    expect(added.status).toBe(201);

    const future = new Date();
    future.setDate(future.getDate() + 5);
    const shift = await api.post("/api/shifts").send({
      program: programId,
      date: future.toISOString(),
      startTime: "09:00",
      durationMinutes: 60,
      location: "Hall",
      requiredHeadcount: 2,
    });

    const signup = await api.post(`/api/shifts/${shift.body.shift._id}/signups`).send({
      volunteerId: volunteer._id.toString(),
    });
    expect(signup.status).toBe(201);

    const removed = await api.delete(`/api/programs/${programId}/members/${volunteer._id}`);
    expect(removed.status).toBe(200);
    expect(removed.body.cancelledFutureSignups).toBe(1);

    const history = await api.get(`/api/shifts/${shift.body.shift._id}/history`);
    expect(history.body.history.some((event) => event.type === "SIGNUP_CANCELLED")).toBe(true);
  });
});
