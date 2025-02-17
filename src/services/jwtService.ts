import jwt from "jsonwebtoken";
import { Response } from "express";
import dotenv from "dotenv";
import { DecodedUser, IUser } from "../types/global.types";
import { logger } from "../utils/logger";

dotenv.config();

class JWTService {
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;

  constructor() {
    this.accessTokenSecret = process.env.ACCESS_TOKEN_SECRET ?? "";
    this.refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET ?? "";

    if (!this.accessTokenSecret || !this.refreshTokenSecret) {
      throw new Error("JWT secrets are not defined in environment variables");
    }
  }

  async verifyAccessToken(token: string): Promise<DecodedUser | null> {
    try {
      return jwt.verify(token, this.accessTokenSecret) as DecodedUser;
    } catch (error) {
      logger.error("Error verifying access token:", error);
      return null;
    }
  }

  async verifyRefreshToken(token: string): Promise<DecodedUser | null> {
    try {
      return jwt.verify(token, this.refreshTokenSecret) as DecodedUser;
    } catch (error) {
      logger.error("Error verifying refresh token:", error);
      return null;
    }
  }

  generateAccessToken(user: IUser): string {
    const token = jwt.sign(
      { Email: user.Email, Uid: user._id },
      this.accessTokenSecret,
      { expiresIn: "1d" },
    );

    return token;
  }

  generateRefreshToken(user: IUser): string {
    const token = jwt.sign(
      { Email: user.Email, Uid: user._id },
      this.refreshTokenSecret,
      { expiresIn: "30d" },
    );

    return token;
  }

  sendAccessTokenCookie(res: Response, token: string): void {
    res.cookie("access_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });
  }

  sendRefreshTokenCookie(res: Response, token: string): void {
    res.cookie("refresh_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });
  }

  clearCookie(res: Response, cookieName: string): void {
    res.cookie(cookieName, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      expires: new Date(0),
    });
  }
}

export default new JWTService();
