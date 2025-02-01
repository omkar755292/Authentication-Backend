import { Request, Response, NextFunction } from "express";

const requiredLogin = (req: Request, res: Response, next: NextFunction) => {
  console.log("Required Login Middleware");
  next();
};

export default requiredLogin;
