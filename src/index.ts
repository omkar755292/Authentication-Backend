import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRouter from "./routes/authRoutes";
import errorHandler from "./middleware/errorHandler";
import { logger, loggerMiddleware } from "./utils/logger";
import { AdminConfig } from "./models/adminConfig";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

let allowedOrigins: string[] = ["http://localhost:3000"];

// Fetch allowed domains from DB
const fetchAllowedOrigins = async () => {
  try {
    const result = await AdminConfig.findOne({});
    if (result?.allowedOrigins) {
      allowedOrigins = [
        ...new Set([...allowedOrigins, ...result.allowedOrigins]),
      ]; // Merge & remove duplicates
      logger.info("Updated Allowed Origins:", allowedOrigins);
    }
  } catch (error) {
    logger.error("Error fetching allowed origins:", error);
  }
};

// Set interval to update allowed origins every 10 minutes
setInterval(fetchAllowedOrigins, 10 * 60 * 1000);

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI || "")
  .then(async (connect) => {
    console.log("Database connected:", connect.connection.name);
    await fetchAllowedOrigins();
  })
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });

// CORS Configuration
app.use(
  cors({
    origin: async (origin, callback) => {
      try {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          await fetchAllowedOrigins(); // Fetch origins dynamically
          if (allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            logger.warn(`Blocked by CORS: ${origin}`);
            callback(new Error("Not allowed by CORS"));
          }
        }
      } catch (error) {
        logger.error("Error fetching allowed origins dynamically:", error);
        callback(new Error("Not allowed by CORS"));
      }
    },
    optionsSuccessStatus: 200,
    credentials: true,
  }),
);

// Middleware
app.use(loggerMiddleware);
app.use(express.json());
app.use(cookieParser());

// Health check
app.get("/health", (req, res) => {
  res.send("OK");
});

// Routes
app.use("/auth", authRouter);
app.use("*", errorHandler);

// Start server
app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`),
);
