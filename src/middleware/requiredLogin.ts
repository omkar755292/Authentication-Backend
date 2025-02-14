import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";
import {
  verifyAccessToken,
  verifyRefreshToken,
  generateAccessToken,
  setAccessTokenCookie,
} from "../utils/verifyJwt";
import { IUser } from "../models/user";

declare global {
  namespace Express {
    interface Request {
      user: IUser;
    }
  }
}

const requiredLogin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Get the access token from cookies
    const accessToken: string = req.cookies.access_token;

    if (!accessToken) {
      res.status(401).json({ error: "Access token required" });
      return;
    }

    // Verify access token and get user
    const user = await verifyAccessToken(accessToken);

    if (user) {
      req.user = user;
      next();
      return;
    }

    // If access token is invalid, try refresh token
    const refreshToken: string = req.cookies.refresh_token;
    if (!refreshToken) {
      res.status(401).json({ error: "Refresh token required" });
      return;
    }

    // Verify refresh token and get user
    const refreshUser = await verifyRefreshToken(refreshToken);
    if (!refreshUser) {
      res.status(401).json({ error: "Invalid refresh token" });
      return;
    }

    // Generate new access token
    const newAccessToken: string = generateAccessToken(refreshUser);
    setAccessTokenCookie(res, newAccessToken);

    // Attach user to request and continue
    req.user = refreshUser;
    next();
  } catch (error: any) {
    logger.error("Authentication middleware error:", error);
    res.status(500).json({ error: error.message });
    return;
  }
};

export default requiredLogin;
