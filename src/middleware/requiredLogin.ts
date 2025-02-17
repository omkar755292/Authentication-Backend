import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";
import JWTService from "../services/jwtService";
import { DecodedUser } from "../types/global.types";
import User from "../models/user";

declare global {
  namespace Express {
    interface Request {
      user?: DecodedUser;
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
    let accessToken =
      req.cookies.access_token || req.headers.authorization?.split(" ")[1];
    // Step 1: Verify Access Token (if available)
    if (accessToken) {
      const decodedUser = await JWTService.verifyAccessToken(accessToken);
      if (decodedUser) {
        req.user = decodedUser;
        return next();
      }
    }
    // Step 2: If Access Token is missing/invalid, check Refresh Token
    const refreshToken = req.cookies.refresh_token;
    if (!refreshToken) {
      return res
        .status(401)
        .json({ error: "Unauthorized: No valid tokens found" });
    }
    // Step 3: Verify Refresh Token & Get User
    const refreshUser = await JWTService.verifyRefreshToken(refreshToken);
    if (!refreshUser) {
      JWTService.clearCookie(res, "refresh_token");
      return res
        .status(401)
        .json({ error: "Unauthorized: Invalid refresh token" });
    }
    const user = await User.findById(refreshUser.Uid);
    if (!user) {
      JWTService.clearCookie(res, "refresh_token");
      return res.status(401).json({ error: "Unauthorized: User not found" });
    }
    // Step 4: Generate and Send New Access Token
    accessToken = JWTService.generateAccessToken(user);
    JWTService.sendAccessTokenCookie(res, accessToken);
    req.user = refreshUser;
    next();
  } catch (error: any) {
    logger.error("Authentication middleware error:", error);
    res.status(500).json({ error: error.message });
  }
};

export default requiredLogin;
