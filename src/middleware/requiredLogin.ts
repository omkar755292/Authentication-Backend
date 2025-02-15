import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";
import JWTService from "../services/jwtService";
import { DecodedUser } from "../types/global.types";

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
    let accessToken: string = req.cookies.access_token;

    if (!accessToken) {
      // If access token is not found, check for refresh token
      const refreshToken = req.cookies.refresh_token;

      if (!refreshToken) {
        res.status(401).json({ error: "Access token and refresh token required" });
        return;
      }

      // Verify refresh token and get user
      const refreshUser = await JWTService.verifyRefreshToken(refreshToken);
      if (!refreshUser) {
        JWTService.clearCookie(res, "refresh_token");
        res.status(401).json({ error: "Invalid refresh token" });
        return;
      }

      // Generate new access token
      accessToken = JWTService.generateAccessToken(refreshUser);
      JWTService.sendAccessTokenCookie(res, accessToken);
    }

    // Verify access token
    const decodedUser = await JWTService.verifyAccessToken(accessToken);
    if (!decodedUser) {
      JWTService.clearCookie(res, "access_token");
      res.status(401).json({ error: "Invalid access token" });
      return;
    }

    // Attach the user to the request
    req.user = decodedUser;
    next();
  } catch (error: any) {
    logger.error("Authentication middleware error:", error);
    res.status(500).json({ error: error.message });
  }
};

export default requiredLogin;
