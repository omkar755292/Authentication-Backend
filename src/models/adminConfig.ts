import mongoose from "mongoose";

const adminConfigSchema = new mongoose.Schema(
  {
    allowedOrigins: [{ type: String }],
  },
  {
    timestamps: true,
  },
);
const AdminConfig = mongoose.model("AdminConfig", adminConfigSchema);

export { AdminConfig };
