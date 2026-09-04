const request = require("supertest");
const app = require("../src/app");
const { createUser, auth } = require("./helpers");

describe("auth", () => {
  it("registers a volunteer", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Alice",
      email: "alice@example.com",
      password: "password123",
    });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe("volunteer");
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it("rejects duplicate email", async () => {
    await request(app).post("/api/auth/register").send({
      name: "Alice",
      email: "alice@example.com",
      password: "password123",
    });
    const res = await request(app).post("/api/auth/register").send({
      name: "Alice 2",
      email: "alice@example.com",
      password: "password123",
    });
    expect(res.status).toBe(409);
  });

  it("does not create a coordinator via public registration", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Eve",
      email: "eve@example.com",
      password: "password123",
      role: "coordinator",
    });
    expect(res.status).toBe(400);
  });

  it("logs in successfully", async () => {
    await request(app).post("/api/auth/register").send({
      name: "Alice",
      email: "alice@example.com",
      password: "password123",
    });
    const res = await request(app).post("/api/auth/login").send({
      email: "alice@example.com",
      password: "password123",
    });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it("rejects a wrong password", async () => {
    await request(app).post("/api/auth/register").send({
      name: "Alice",
      email: "alice@example.com",
      password: "password123",
    });
    const res = await request(app).post("/api/auth/login").send({
      email: "alice@example.com",
      password: "wrongpass",
    });
    expect(res.status).toBe(401);
  });

  it("rejects a protected route without a token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("rejects an invalid token", async () => {
    const res = await request(app).get("/api/auth/me").set("Authorization", "Bearer not-a-token");
    expect(res.status).toBe(401);
  });

  it("returns the current user", async () => {
    const user = await createUser({
      name: "Alice",
      email: "alice@example.com",
      password: "password123",
      role: "volunteer",
    });
    const res = await auth(app, user).get("/api/auth/me");
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("alice@example.com");
  });
});
