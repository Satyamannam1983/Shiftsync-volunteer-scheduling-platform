const app = require("../src/app");
const { createUser, auth } = require("./helpers");

describe("dashboard and roster", () => {
  it("returns weekly counters and eight-week signup aggregation", async () => {
    const coordinator = await createUser({
      name: "Casey",
      email: "coord@example.com",
      password: "password123",
      role: "coordinator",
    });
    const api = auth(app, coordinator);
    const summary = await api.get("/api/dashboard/summary");
    expect(summary.status).toBe(200);
    expect(summary.body.summary.signupsPerWeek).toHaveLength(8);
    expect(summary.body.summary.byState).toBeDefined();
  });

  it("exports a CSV roster", async () => {
    const coordinator = await createUser({
      name: "Casey",
      email: "coord@example.com",
      password: "password123",
      role: "coordinator",
    });
    const volunteer = await createUser({
      name: "Alice",
      email: "alice@example.com",
      password: "password123",
      role: "volunteer",
    });
    const api = auth(app, coordinator);
    const program = await api.post("/api/programs").send({ name: "Food Bank" });
    const programId = program.body.program._id;
    await api.post(`/api/programs/${programId}/members`).send({ volunteerId: volunteer._id });

    const csv = await api.get(`/api/programs/${programId}/roster/export`);
    expect(csv.status).toBe(200);
    expect(csv.headers["content-type"]).toMatch(/text\/csv/);
    expect(csv.text).toContain("Volunteer,Email,Total Hours");
    expect(csv.text).toContain("Alice");
  });
});
