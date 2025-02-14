import express, { Request, Response } from "express";
import { checkSchema, matchedData } from "express-validator";
import { validationResult } from "express-validator";
import bcrypt from "bcrypt";
import User from "../models/user";
import requiredLogin from "../middleware/requiredLogin";
import {
  clearCookie,
  generateAccessToken,
  generateRefreshToken,
  setAccessTokenCookie,
  setRefreshTokenCookie,
  verifyRefreshToken,
} from "../utils/verifyJwt";

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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    const attr = matchedData(req);

    try {
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
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      // Clear old cookies
      clearCookie(res, "access_token");
      clearCookie(res, "refresh_token");

      // Set new cookies
      setAccessTokenCookie(res, accessToken);
      setRefreshTokenCookie(res, refreshToken);

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
      res.status(500).json({ error });
    }
  },
);

// Register (user)
authRouter.post(
  "/register",
  checkSchema({
    FirstName: {
      isString: { errorMessage: "First Name must be a string" },
      trim: true,
      notEmpty: { errorMessage: "First Name is required" },
    },
    MiddleName: {
      optional: true,
      isString: { errorMessage: "Middle Name must be a string" },
      trim: true,
    },
    LastName: {
      isString: { errorMessage: "Last Name must be a string" },
      trim: true,
      notEmpty: { errorMessage: "Last Name is required" },
    },
    Gender: {
      isIn: {
        options: [["Male", "Female", "Other"]],
        errorMessage: "Gender must be Male, Female, or Other",
      },
    },
    DOB: {
      optional: true,
      isISO8601: { errorMessage: "Invalid Date of Birth format" },
    },
    Email: {
      isEmail: { errorMessage: "Invalid Email" },
      normalizeEmail: true,
    },
    PhoneNo: {
      isNumeric: { errorMessage: "Phone number must contain only numbers" },
      isLength: {
        options: { min: 10, max: 15 },
        errorMessage: "Phone number must be between 10-15 digits",
      },
    },
    Password: {
      isString: { errorMessage: "Password must be a string" },
      isLength: {
        options: { min: 6 },
        errorMessage: "Password must be at least 6 characters long",
      },
    },
  }),
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    const attr = matchedData(req);

    try {
      const existingUser = await User.findOne({
        $or: [{ Email: attr.Email }, { PhoneNo: attr.PhoneNo }],
      });
      if (existingUser) {
        res.status(400).json({ error: "User already exists" });
        return;
      }

      const hashedPassword = await bcrypt.hash(attr.Password, 10);

      const newUser = new User({
        ...attr,
        Password: hashedPassword,
        ResetPassword: attr.Password,
      });

      await newUser.save();

      res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
      res.status(500).json({ error });
    }
  },
);

// Logout
authRouter.post("/logout", async (req: Request, res: Response) => {
  res.send("Logout Route");
});

// Login OTP Route
authRouter.post("/login-otp", async (req: Request, res: Response) => {
  res.send("Login OTP Route");
});

// Resend OTP
authRouter.post("/resend-otp", async (req: Request, res: Response) => {
  res.send("Resend OTP Route");
});

// Verify Email
authRouter.get("/verify-email", async (req: Request, res: Response) => {
  res.send("Verify Email Route");
});

// Verify Phone Number
authRouter.get("/verify-phone", async (req: Request, res: Response) => {
  res.send("Verify Phone Number Route");
});

// Forgot Password
authRouter.post(
  "/forgot-password",
  requiredLogin,
  async (req: Request, res: Response) => {
    res.send("Forgot Password Route");
  },
);

// Reset Password
authRouter.post("/reset-password", async (req: Request, res: Response) => {
  res.send("Reset Password Route");
});

// Change Password
authRouter.post(
  "/change-password",
  requiredLogin,
  async (req: Request, res: Response) => {
    res.send("Change Password Route");
  },
);

// refresh session
authRouter.post("/refresh-session", async (req: Request, res: Response) => {
  try {
    // Get the refresh token from the cookies
    const refreshToken = req.cookies.refresh_token;

    if (!refreshToken) {
      res.status(403).json({ error: "Refresh token required" });
      return;
    }

    // Verify the refresh token
    const user = await verifyRefreshToken(refreshToken);
    if (!user) {
      res.status(403).json({ error: "User not found" });
      return;
    }

    // Generate a new access token
    const accessToken = generateAccessToken(user);

    // Set the new access token as an HTTP-only cookie
    setAccessTokenCookie(res, accessToken);

    res.status(200).json({ message: "Access token refreshed" });
  } catch (error) {
    console.error("Refresh Token Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default authRouter;
