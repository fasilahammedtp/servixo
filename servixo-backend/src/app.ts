import express, { Application, Request, Response } from "express";
import cors from "cors";
import { errorHandler } from "./middleware/errorHandler";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import workerRoutes from "./routes/workerRoutes";
import categoryRoutes from "./routes/categoryRoutes";
import adminRoutes from "./routes/adminRoutes";
import jobRoutes from "./routes/jobRoutes";
import uploadRoutes from "./routes/uploadRoutes";
import quotationRoutes from "./routes/quotationRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import reviewRoutes from "./routes/reviewRoutes";
import messageRoutes from "./routes/messageRoutes";
import badgeRoutes from "./routes/badgeRoutes";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { isOriginAllowed } from "./config/cors";

const app: Application = express();

// Trust proxy for reverse proxy platforms like Render (must be set before rate limiters)
app.set("trust proxy", 1);

app.use(helmet());
app.use(
  cors({
    origin: isOriginAllowed,
    credentials: true,
  })
);
app.use(express.json());

// Public health check endpoint for Render health monitoring (no auth, no DB call)
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ ok: true });
});

app.get("/api/health", (req: Request, res: Response) => {
  res.status(200).json({ ok: true, status: "ok", message: "Servixo API is running" });
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/workers", workerRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/quotations", quotationRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/badges", badgeRoutes);

app.use((req: Request, res: Response) => {
  res.status(404).json({ message: "Route not found" });
});

app.use(errorHandler);

export default app;
