import "dotenv/config";
import express from "express";
import prisma from "./config/prisma";
import { errorHandler, notFound } from "./middlewares/error";
import { logger } from "./middlewares/logger";
import router from "./routes";

const app = express();

// Middleware global
app.use(logger);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root route
app.get("/", (_req, res) => {
  res.status(200).json({
    status: true,
    message: "MLBB Shop Backend API is running 🎮",
  });
});

// Fitur 1: Health check
app.get("/health", async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.status(200).json({
    status: true,
    message: "Server dan database OK",
  });
});

// Fitur API
app.use("/api", router);

// Middleware penanganan route 404 & error
app.use(notFound);
app.use(errorHandler);

const PORT = Number(process.env.PORT) || 3000;
const server = app.listen(PORT, (error?: Error) => {
  if (error) throw error;
  console.log(`Express is running on Port ${PORT}`);
});

// Graceful shutdown
const shutdown = async () => {
  server.close();
  await prisma.$disconnect();
  console.log("Database disconnected");
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
