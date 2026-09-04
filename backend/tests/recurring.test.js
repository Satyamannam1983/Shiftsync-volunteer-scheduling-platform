const app = require("../src/app");
const { createUser, auth } = require("./helpers");

describe("recurring schedules", () => {
  it("creates matching dates, skips holidays, and skips existing shifts", async () => {
    const coordinator = await createUser({
      name: "Casey",
      email: "coord@example.com",
      password: "password123",
      role: "coordinator",
    });
    const api = auth(app, coordinator);
    const program = await api.post("/api/programs").send({ name: "Food Bank" });
    const programId = program.body.program._id;

    const first = await api.post(`/api/programs/${programId}/shifts/recurring`).send({
      startDate: "2026-09-05",
      endDate: "2026-09-26",
      dayOfWeek: 6,
      startTime: "09:00",
      durationMinutes: 180,
      location: "Hall",
      requiredHeadcount: 8,
      excludedDates: ["2026-09-12"],
    });

    expect(first.status).toBe(200);
    expect(first.body.created.length).toBeGreaterThan(0);
    expect(first.body.skipped.some((item) => item.reason === "holiday")).toBe(true);

    const second = await api.post(`/api/programs/${programId}/shifts/recurring`).send({
      startDate: "2026-09-05",
      endDate: "2026-09-26",
      dayOfWeek: 6,
      startTime: "09:00",
      durationMinutes: 180,
      location: "Hall",
      requiredHeadcount: 8,
      excludedDates: ["2026-09-12"],
    });

    expect(second.body.created.length).toBe(0);
    expect(second.body.skipped.some((item) => item.reason === "existing shift")).toBe(true);
  });
});
