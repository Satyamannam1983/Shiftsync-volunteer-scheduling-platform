const app = require("../src/app");
const { createUser, auth } = require("./helpers");

const futureDate = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

describe("signups", () => {
  let coordinator;
  let volunteer;
  let otherVolunteer;
  let coordApi;
  let volApi;
  let programId;
  let shiftId;

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
    otherVolunteer = await createUser({
      name: "Bob",
      email: "bob@example.com",
      password: "password123",
      role: "volunteer",
    });
    coordApi = auth(app, coordinator);
    volApi = auth(app, volunteer);

    const program = await coordApi.post("/api/programs").send({ name: "Food Bank" });
    programId = program.body.program._id;
    await coordApi.post(`/api/programs/${programId}/members`).send({ volunteerId: volunteer._id });
    await coordApi.post(`/api/programs/${programId}/members`).send({ volunteerId: otherVolunteer._id });

    const shift = await coordApi.post("/api/shifts").send({
      program: programId,
      date: futureDate(5).toISOString(),
      startTime: "09:00",
      durationMinutes: 120,
      location: "Hall",
      requiredHeadcount: 1,
    });
    shiftId = shift.body.shift._id;
  });

  it("lets a volunteer sign themselves up", async () => {
    const res = await volApi.post(`/api/shifts/${shiftId}/signups`).send({});
    expect(res.status).toBe(201);
    expect(res.body.stateChange.new).toBe("FILLED");
  });

  it("rejects a duplicate signup", async () => {
    await volApi.post(`/api/shifts/${shiftId}/signups`).send({});
    const res = await volApi.post(`/api/shifts/${shiftId}/signups`).send({});
    expect(res.status).toBe(409);
  });

  it("rejects signup when the shift is filled", async () => {
    await volApi.post(`/api/shifts/${shiftId}/signups`).send({});
    const res = await auth(app, otherVolunteer).post(`/api/shifts/${shiftId}/signups`).send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/filled/i);
  });

  it("rejects a non-member", async () => {
    const outsider = await createUser({
      name: "Eve",
      email: "eve@example.com",
      password: "password123",
      role: "volunteer",
    });
    const res = await auth(app, outsider).post(`/api/shifts/${shiftId}/signups`).send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/belong/i);
  });

  it("rejects overlapping shifts", async () => {
    const otherProgram = await coordApi.post("/api/programs").send({ name: "Shelter" });
    await coordApi
      .post(`/api/programs/${otherProgram.body.program._id}/members`)
      .send({ volunteerId: volunteer._id });
    const overlapping = await coordApi.post("/api/shifts").send({
      program: otherProgram.body.program._id,
      date: futureDate(5).toISOString(),
      startTime: "10:00",
      durationMinutes: 120,
      location: "Shelter",
      requiredHeadcount: 4,
    });
    await volApi.post(`/api/shifts/${shiftId}/signups`).send({});
    const res = await volApi.post(`/api/shifts/${overlapping.body.shift._id}/signups`).send({});
    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/overlapping/i);
  });

  it("prevents a volunteer from signing up someone else", async () => {
    const res = await volApi.post(`/api/shifts/${shiftId}/signups`).send({
      volunteerId: otherVolunteer._id.toString(),
    });
    expect(res.status).toBe(403);
  });

  it("lets a coordinator sign up any volunteer", async () => {
    const res = await coordApi.post(`/api/shifts/${shiftId}/signups`).send({
      volunteerId: volunteer._id.toString(),
    });
    expect(res.status).toBe(201);
  });

  it("cancels a signup and rolls fill state back", async () => {
    const created = await volApi.post(`/api/shifts/${shiftId}/signups`).send({});
    expect(created.body.stateChange.new).toBe("FILLED");
    const cancelled = await volApi.delete(
      `/api/shifts/${shiftId}/signups/${created.body.signup._id}`
    );
    expect(cancelled.status).toBe(200);
    expect(cancelled.body.stateChange.new).toBe("OPEN");
  });

  it("prevents a volunteer from cancelling another volunteer's signup", async () => {
    const created = await coordApi.post(`/api/shifts/${shiftId}/signups`).send({
      volunteerId: otherVolunteer._id.toString(),
    });
    const res = await volApi.delete(`/api/shifts/${shiftId}/signups/${created.body.signup._id}`);
    expect(res.status).toBe(403);
  });
});
