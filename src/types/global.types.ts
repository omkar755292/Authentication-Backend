import { Document } from "mongoose";

interface ISubscriptionPlan {
  Name: string;
  Validity: Date;
}

export interface DecodedUser extends Document {
  Uid: string;
  Email: string;
}

interface INotificationPreference {
  Email: boolean;
  SMS: boolean;
  InApp: boolean;
  WhatsApp: boolean;
}

export interface IUser extends Document {
  _id: string;
  FirstName: string;
  MiddleName?: string;
  LastName: string;
  Gender?: "Male" | "Female" | "Other";
  DOB?: Date;
  Email: string;
  PhoneNo: number;
  Password: string;
  RealPassword?: string;
  SubscriptionPlan?: ISubscriptionPlan;
  DefaultCurrency: string;
  NotificationPreference: INotificationPreference;
  ResetPasswordToken?: string;
  SwapPassHash?: string;
  createdAt: Date;
  updatedAt: Date;
}
