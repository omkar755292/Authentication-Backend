import express, { Request, Response } from "express";
import { checkSchema, matchedData } from "express-validator";
import { validationResult } from "express-validator";
import bcrypt from "bcrypt";
import User from "../models/user";
import requiredLogin from "../middleware/requiredLogin";
import JWTService from "../services/jwtService";
import { logger } from "../utils/logger";

const authRouter = express.Router();

// Login (user)
authRouter.post(
  "/login",
  checkSchema({
    PhoneNo: {},
    Email: {
      isEmail: { errorMessage: "Invalid Email" },
      normalizeEmail: true,
    },
    Password: {
      isString: { errorMessage: "Password must be a string" },
      notEmpty: { errorMessage: "Password is required" },
    },
  }),
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const attr = matchedData(req);

      // Find user by email
      const user = await User.findOne({ Email: attr.Email });
      if (!user) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }

      // Compare passwords
      const isPasswordValid = await bcrypt.compare(
        attr.Password,
        user.Password,
      );
      if (!isPasswordValid) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }

      // Generate JWT Tokens
      const accessToken = JWTService.generateAccessToken(user);
      const refreshToken = JWTService.generateRefreshToken(user);

      // Clear old cookies
      JWTService.clearCookie(res, "access_token");
      JWTService.clearCookie(res, "refresh_token");

      // Set new cookies
      JWTService.sendAccessTokenCookie(res, accessToken);
      JWTService.sendRefreshTokenCookie(res, refreshToken);

      // For now, we'll just return the user data (excluding sensitive information)
      const userData = {
        _id: user._id,
        FirstName: user.FirstName,
        MiddleName: user.MiddleName,
        LastName: user.LastName,
        Gender: user.Gender,
        DOB: user.DOB,
        Email: user.Email,
        PhoneNo: user.PhoneNo,
      };

      res.status(200).json({
        message: "Login successful",
        user: userData,
      });
    } catch (error) {
      logger.error("Login error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Register (user)
authRouter.post(
  "/register",
  checkSchema({
    FirstName: {
      isString: { errorMessage: "First name must be a string" },
      notEmpty: { errorMessage: "First name is required" },
    },
    LastName: {
      isString: { errorMessage: "Last name must be a string" },
      notEmpty: { errorMessage: "Last name is required" },
    },
    Email: {
      isEmail: { errorMessage: "Invalid Email" },
      normalizeEmail: true,
    },
    Password: {
      isString: { errorMessage: "Password must be a string" },
      notEmpty: { errorMessage: "Password is required" },
    },
  }),
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const attr = matchedData(req);

      // Check if user already exists
      const existingUser = await User.findOne({ Email: attr.Email });
      if (existingUser) {
        res.status(400).json({ error: "Email already registered" });
        return;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(attr.Password, 10);

      // Create user
      const user = await User.create({
        ...attr,
        Password: hashedPassword,
      });

      res.status(201).json({
        message: "Registration successful",
        user: {
          _id: user._id,
          FirstName: user.FirstName,
          LastName: user.LastName,
          Email: user.Email,
        },
      });
    } catch (error) {
      logger.error("Registration error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Login OTP Route
authRouter.post("/login-otp", async (req: Request, res: Response) => {
  try {
    res.send("Login OTP Route");
  } catch (error) {
    logger.error("Login OTP error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Resend OTP
authRouter.post("/resend-otp", async (req: Request, res: Response) => {
  try {
    res.send("Resend OTP Route");
  } catch (error) {
    logger.error("Resend OTP error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Verify Email
authRouter.get("/verify-email", async (req: Request, res: Response) => {
  try {
    res.send("Verify Email Route");
  } catch (error) {
    logger.error("Verify Email error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Verify Phone Number
authRouter.get("/verify-phone", async (req: Request, res: Response) => {
  try {
    res.send("Verify Phone Number Route");
  } catch (error) {
    logger.error("Verify Phone Number error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Forgot Password
authRouter.post(
  "/forgot-password",
  async (req: Request, res: Response) => {
    try {
      res.send("Forgot Password Route");
    } catch (error) {
      logger.error("Forgot Password error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Reset Password
authRouter.post("/reset-password", async (req: Request, res: Response) => {
  try {
    res.send("Reset Password Route");
  } catch (error) {
    logger.error("Reset Password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Change Password
authRouter.post(
  "/change-password",
  async (req: Request, res: Response) => {
    try {
      res.send("Change Password Route");
    } catch (error) {
      logger.error("Change Password error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Refresh Token
authRouter.post("/refresh-token", async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refresh_token;
    if (!refreshToken) {
      res.status(403).json({ error: "Refresh token required" });
      return;
    }

    // Verify and decode the refresh token
    const user = await JWTService.verifyRefreshToken(refreshToken);
    if (!user) {
      res.status(403).json({ error: "Invalid refresh token" });
      return;
    }

    // Generate new access token
    const accessToken = JWTService.generateAccessToken(user);
    JWTService.clearCookie(res, "access_token");
    JWTService.sendAccessTokenCookie(res, accessToken);

    res.status(200).json({ message: "Access token refreshed" });
  } catch (error) {
    logger.error("Refresh token error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Logout
authRouter.post("/logout", async (req: Request, res: Response) => {
  try {
    JWTService.clearCookie(res, "access_token");
    JWTService.clearCookie(res, "refresh_token");
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    logger.error("Logout error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get User
authRouter.get("/user", requiredLogin, async (req: Request, res: Response) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    logger.error("Get user error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default authRouter;
