const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

dotenv.config();

const connectDB = require("../src/config/db");
const User = require("../src/models/User");
const Program = require("../src/models/Program");
const ProgramMember = require("../src/models/ProgramMember");
const Shift = require("../src/models/Shift");
const Signup = require("../src/models/Signup");
const ShiftHistory = require("../src/models/ShiftHistory");
const AlertDismissal = require("../src/models/AlertDismissal");
const { createHistoryEvent } = require("../src/services/historyService");

const addDays = (date, days) => {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};

const seed = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is required");
  }

  const coordinatorPassword = process.env.SEED_COORDINATOR_PASSWORD;
  const volunteerPassword = process.env.SEED_VOLUNTEER_PASSWORD;

  if (!coordinatorPassword || !volunteerPassword) {
    throw new Error(
      "SEED_COORDINATOR_PASSWORD and SEED_VOLUNTEER_PASSWORD must be set. Do not hardcode demo passwords."
    );
  }

  await connectDB();

  await Promise.all([
    User.deleteMany({}),
    Program.deleteMany({}),
    ProgramMember.deleteMany({}),
    Shift.deleteMany({}),
    Signup.deleteMany({}),
    ShiftHistory.deleteMany({}),
    AlertDismissal.deleteMany({}),
  ]);

  const coordinatorHash = await bcrypt.hash(coordinatorPassword, 10);
  const volunteerHash = await bcrypt.hash(volunteerPassword, 10);

  const coordinator = await User.create({
    name: "Casey Coordinator",
    email: "coordinator@example.com",
    passwordHash: coordinatorHash,
    role: "coordinator",
  });

  const volunteers = await User.create([
    { name: "Alice Volunteer", email: "volunteer@example.com", passwordHash: volunteerHash, role: "volunteer" },
    { name: "Bob Rivera", email: "bob@example.com", passwordHash: volunteerHash, role: "volunteer" },
    { name: "Chen Wei", email: "chen@example.com", passwordHash: volunteerHash, role: "volunteer" },
    { name: "Dana Patel", email: "dana@example.com", passwordHash: volunteerHash, role: "volunteer" },
    { name: "Evan Brooks", email: "evan@example.com", passwordHash: volunteerHash, role: "volunteer" },
  ]);

  const [alice, bob, chen, dana, evan] = volunteers;

  const foodBank = await Program.create({
    name: "Community Food Bank",
    description: "Weekly packing and distribution shifts.",
    createdBy: coordinator._id,
  });

  const shelter = await Program.create({
    name: "Overnight Shelter",
    description: "Evening check-in and overnight support.",
    createdBy: coordinator._id,
  });

  const tutoring = await Program.create({
    name: "Youth Tutoring",
    description: "After-school homework help.",
    createdBy: coordinator._id,
  });

  await ProgramMember.create([
    { program: foodBank._id, volunteer: alice._id, addedBy: coordinator._id },
    { program: foodBank._id, volunteer: bob._id, addedBy: coordinator._id },
    { program: foodBank._id, volunteer: chen._id, addedBy: coordinator._id },
    { program: shelter._id, volunteer: alice._id, addedBy: coordinator._id },
    { program: shelter._id, volunteer: dana._id, addedBy: coordinator._id },
    { program: tutoring._id, volunteer: bob._id, addedBy: coordinator._id },
    { program: tutoring._id, volunteer: evan._id, addedBy: coordinator._id },
  ]);

  const today = new Date();
  today.setUTCHours(12, 0, 0, 0);

  const makeShift = async (program, daysFromToday, startTime, durationMinutes, location, requiredHeadcount, closed = false) => {
    const shift = await Shift.create({
      program,
      date: addDays(today, daysFromToday),
      startTime,
      durationMinutes,
      location,
      requiredHeadcount,
      createdBy: coordinator._id,
      closed,
      closedAt: closed ? addDays(today, daysFromToday) : undefined,
    });
    await createHistoryEvent(shift._id, "SHIFT_CREATED", coordinator._id);
    return shift;
  };

  const openShift = await makeShift(foodBank._id, 1, "09:00", 180, "Warehouse A", 6);
  const partialShift = await makeShift(foodBank._id, 2, "13:00", 120, "Warehouse A", 4);
  const filledShift = await makeShift(shelter._id, 1, "18:00", 240, "Main Hall", 2);
  const historical = await makeShift(foodBank._id, -10, "09:00", 180, "Warehouse A", 4, true);
  const closedThisWeek = await makeShift(tutoring._id, -1, "16:00", 90, "Room 12", 3, true);
  await makeShift(tutoring._id, 3, "16:00", 90, "Room 12", 3);
  await makeShift(shelter._id, 5, "18:00", 240, "Main Hall", 5);

  const signup = async (shift, volunteer) => {
    const record = await Signup.create({
      shift: shift._id,
      volunteer: volunteer._id,
      createdBy: coordinator._id,
    });
    await createHistoryEvent(shift._id, "SIGNUP_CREATED", coordinator._id, {
      volunteer: volunteer._id,
      action: "signup",
    });
    return record;
  };

  await signup(partialShift, alice);
  await signup(partialShift, bob);
  await signup(filledShift, alice);
  await signup(filledShift, dana);
  await signup(historical, alice);
  await signup(historical, bob);
  await signup(closedThisWeek, evan);

  await createHistoryEvent(partialShift._id, "STATE_CHANGED", coordinator._id, {
    oldState: "OPEN",
    newState: "PARTIALLY_FILLED",
  });
  await createHistoryEvent(filledShift._id, "STATE_CHANGED", coordinator._id, {
    oldState: "OPEN",
    newState: "FILLED",
  });
  await createHistoryEvent(historical._id, "SHIFT_CLOSED", coordinator._id, {
    oldState: "FILLED",
    newState: "CLOSED",
  });

  for (let i = 2; i <= 8; i += 1) {
    const past = await makeShift(foodBank._id, -i * 7, "09:00", 180, "Warehouse A", 5, true);
    await signup(past, alice);
    await Signup.create({
      shift: past._id,
      volunteer: chen._id,
      createdBy: coordinator._id,
      createdAt: addDays(today, -i * 7),
    });
  }

  console.log("Seed complete.");
  console.log("Coordinator email: coordinator@example.com");
  console.log("Volunteer email: volunteer@example.com");
  console.log("Passwords are read from environment variables and are not printed.");

  await mongoose.disconnect();
};

seed().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
