import express, { Application, Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import connectDB from "./config/db";
import { errorHandler } from "./utils/error";
import requestLogger from "./middleware/requestlogger";

import os from "os";
import userRoutes from "./routes/user";
import projectRoutes from "./routes/project";
import notificationRoutes from "./routes/notification";
import taskRoutes from "./routes/task";
import authRoutes from './routes/auth';
import sprint from './routes/sprint';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 8000;

connectDB();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use(requestLogger);

function getLocalIp(): string {
  const interfaces = os.networkInterfaces();
  for (const iface of Object.values(interfaces)) {
    if (!iface) continue;
    for (const config of iface) {
      if (
        config.family === "IPv4" &&
        !config.internal &&
        (config.address.startsWith("192.") ||
         config.address.startsWith("10.") ||
         config.address.startsWith("172."))
      ) {
        return config.address;
      }
    }
  }
  return "localhost"; // fallback
}

app.get("/api/config", (req: Request, res: Response) => {
  const ip = getLocalIp();
  res.json({ backendUrl: `http://${ip}:${PORT}` });
});
app.listen(PORT, () => {
  console.log(`Server running at http://${getLocalIp()}:${PORT}`);
});
// Routes
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/sprint",sprint);

// Health check route
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok", message: "Server is running" });
});

app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

process.on("unhandledRejection", (err: any) => {
  console.error(`❌ Error: ${err.message}`);
  server.close(() => process.exit(1));
});
