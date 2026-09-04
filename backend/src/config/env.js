const required = ["MONGODB_URI", "JWT_SECRET"];

const loadEnv = () => {
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length && process.env.NODE_ENV !== "test") {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  return {
    nodeEnv: process.env.NODE_ENV || "development",
    port: Number(process.env.PORT) || 5000,
    mongodbUri: process.env.MONGODB_URI,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
    timezone: process.env.APP_TIMEZONE || "UTC",
  };
};

module.exports = { loadEnv };
