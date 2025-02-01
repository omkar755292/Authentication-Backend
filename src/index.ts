import express from "express";
import dotenv from "dotenv";
import authRouter from "./routes/authRoutes";
import mongoose from "mongoose";
import errorHandler from "./middleware/errorHandler";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI || "")
  .then((connect) => {
    console.log("Successfully connected to Database:", connect.connection.name);
  })
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });

app.use(express.json());

// Health check route
app.get("/health", (req, res) => {
  res.send("OK");
});

// Routes
app.use("/auth", authRouter);
app.use("*", errorHandler);

// Start server
app.listen(PORT, () =>
  console.log(`Server running at http://localhost:${PORT}`),
);
