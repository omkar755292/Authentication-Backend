import mongoose, { Schema } from "mongoose";
import { IUser } from "../types/global.types";

const UserSchema: Schema = new Schema<IUser>(
  {
    FirstName: {
      type: String,
      uppercase: true,
      trim: true,
      required: true,
    },
    MiddleName: {
      type: String,
      uppercase: true,
      trim: true,
      default: null,
    },
    LastName: {
      type: String,
      uppercase: true,
      trim: true,
      required: true,
    },
    Gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true,
    },
    DOB: {
      type: Date,
      default: null,
    },
    Email: {
      type: String,
      lowercase: true,
      unique: true,
      required: true,
    },
    PhoneNo: {
      type: String,
      unique: true,
      required: true,
    },
    Password: {
      type: String,
      required: true,
    },
    RealPassword: {
      type: String,
      minlength: 6,
    },
    SubscriptionPlan: {
      Name: { type: String, default: null },
      Validity: { type: Date, default: null },
    },
    DefaultCurrency: {
      type: String,
      default: "INR",
    },
    NotificationPreference: {
      Email: { type: Boolean, default: true },
      SMS: { type: Boolean, default: true },
      InApp: { type: Boolean, default: true },
      WhatsApp: { type: Boolean, default: true },
    },
    ResetPasswordToken: {
      type: String,
      default: null,
    },
    SwapPassHash: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

export default mongoose.model<IUser>("User", UserSchema);
