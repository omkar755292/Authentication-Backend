import jwt, { JwtPayload } from "jsonwebtoken";
import { Response } from "express";
import User from "../models/user";
import { IUser } from "../types/global.types";

interface TokenPayload extends JwtPayload {
  Email: string;
  Uid: string;
}

export const verifyAccessToken = async (
  token: string,
): Promise<IUser | null> => {
  try {
    const decoded = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET!,
    ) as TokenPayload;

    const user = await User.findOne({ Email: decoded.Email, _id: decoded.Uid });
    if (!user) return null;
    return user;
  } catch (error) {
    return null;
  }
};

export const verifyRefreshToken = async (
  token: string,
): Promise<IUser | null> => {
  try {
    const decoded = jwt.verify(
      token,
      process.env.REFRESH_TOKEN_SECRET!,
    ) as TokenPayload;

    const user = await User.findOne({ Email: decoded.Email, _id: decoded.Uid });
    if (!user) return null;
    return user;
  } catch (error) {
    return null;
  }
};

export const generateAccessToken = (user: IUser): string => {
  return jwt.sign(
    { Email: user.Email, Uid: user._id },
    process.env.ACCESS_TOKEN_SECRET!,
    { expiresIn: "1d" },
  );
};

export const generateRefreshToken = (user: IUser): string => {
  return jwt.sign(
    { Email: user.Email, Uid: user._id },
    process.env.REFRESH_TOKEN_SECRET!,
    { expiresIn: "5d" },
  );
};

export const setAccessTokenCookie = (res: Response, token: string): void => {
  res.cookie("access_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  });
};

export const setRefreshTokenCookie = (res: Response, token: string): void => {
  res.cookie("refresh_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 5 * 24 * 60 * 60 * 1000, // 5 days
  });
};

export const clearCookie = (res: Response, cookieName: string): void => {
  res.cookie(cookieName, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    expires: new Date(0),
  });
};
