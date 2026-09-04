const dotenv = require("dotenv");

dotenv.config();

const { loadEnv } = require("./src/config/env");
const app = require("./src/app");
const connectDB = require("./src/config/db");

const startServer = async () => {
  const env = loadEnv();
  await connectDB();

  app.listen(env.port, () => {
    console.log(`Server running on http://localhost:${env.port}`);
  });
};

startServer();
