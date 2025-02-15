import jwt, { JwtPayload } from "jsonwebtoken";
import { Response } from "express";
import dotenv from "dotenv";
import User from "../models/user";
import { DecodedUser, IUser } from "../types/global.types";
import { logger } from "../utils/logger";

interface TokenPayload extends JwtPayload {
  Email: string;
  Uid: string;
}

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

  async verifyRefreshToken(token: string): Promise<IUser | null> {
    try {
      const decoded = jwt.verify(
        token,
        this.refreshTokenSecret,
      ) as TokenPayload;
      return await User.findOne({ Email: decoded.Email, _id: decoded.Uid });
    } catch (error) {
      logger.error("Error verifying refresh token:", error);
      return null;
    }
  }

  generateAccessToken(user: IUser): string {
    const token = jwt.sign(
      { Email: user.Email, Uid: user._id },
      this.accessTokenSecret,
      { expiresIn: "15m" },
    );

    return token;
  }

  generateRefreshToken(user: IUser): string {
    const token = jwt.sign(
      { Email: user.Email, Uid: user._id },
      this.refreshTokenSecret,
      { expiresIn: "7d" },
    );

    return token;
  }

  sendAccessTokenCookie(res: Response, token: string): void {
    res.cookie("access_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });
  }

  sendRefreshTokenCookie(res: Response, token: string): void {
    res.cookie("refresh_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
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
