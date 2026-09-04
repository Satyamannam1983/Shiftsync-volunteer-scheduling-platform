const app = require("../src/app");
const { createUser, auth } = require("./helpers");

describe("authorization", () => {
  let coordinator;
  let volunteer;

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
  });

  it("prevents a volunteer from creating a program", async () => {
    const res = await auth(app, volunteer).post("/api/programs").send({
      name: "Food Bank",
    });
    expect(res.status).toBe(403);
  });

  it("allows a coordinator to create a program", async () => {
    const res = await auth(app, coordinator).post("/api/programs").send({
      name: "Food Bank",
      description: "Packing shifts",
    });
    expect(res.status).toBe(201);
  });

  it("prevents a volunteer from creating a shift", async () => {
    const program = await auth(app, coordinator).post("/api/programs").send({ name: "Food Bank" });
    const res = await auth(app, volunteer).post("/api/shifts").send({
      program: program.body.program._id,
      date: new Date().toISOString(),
      startTime: "09:00",
      durationMinutes: 120,
      location: "Hall",
      requiredHeadcount: 3,
    });
    expect(res.status).toBe(403);
  });

  it("prevents a volunteer from adding members", async () => {
    const program = await auth(app, coordinator).post("/api/programs").send({ name: "Food Bank" });
    const res = await auth(app, volunteer)
      .post(`/api/programs/${program.body.program._id}/members`)
      .send({ volunteerId: volunteer._id });
    expect(res.status).toBe(403);
  });

  it("prevents a volunteer from listing or dismissing alerts", async () => {
    const volunteerApi = auth(app, volunteer);
    const list = await volunteerApi.get("/api/alerts");
    expect(list.status).toBe(403);
    const dismiss = await volunteerApi.post("/api/alerts/000000000000000000000000/dismiss");
    expect(dismiss.status).toBe(403);
  });
});
