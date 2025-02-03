import { NextFunction, Request, Response } from "express";
import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Shared timestamp format
const timestampFormat = "YYYY-MM-DD HH:mm:ss";

// Custom log formats
const consoleLogFormat = printf(({ level, message, timestamp }) => {
  return `[${level}] [${message}] [${timestamp}]`;
});

const fileLogFormat = combine(
  timestamp({ format: timestampFormat }),
  printf(({ timestamp, level, message }) => {
    return JSON.stringify({ timestamp, level, message });
  }),
);

const errorFormat = printf(({ timestamp, level, message, stack }) => {
  return stack
    ? `${timestamp} [${level}] ${message} \nStack: ${stack}`
    : `${timestamp} [${level}] ${message}`;
});

// Transport for Console
const consoleTransport = new winston.transports.Console({
  level: "info",
  format: combine(
    colorize(),
    timestamp({ format: timestampFormat }),
    consoleLogFormat,
  ),
});

// Transport for File (Daily Rotate)
const fileTransport = new DailyRotateFile({
  filename: "./logs/%DATE%-app.log",
  datePattern: "YYYY-MM-DD",
  maxFiles: "14d",
  level: "info",
  format: fileLogFormat,
});

// Create Logger instance
const logger = winston.createLogger({
  level: process.env.NODE_ENV === "development" ? "debug" : "info", // Conditional log level
  format: combine(colorize(), timestamp({ format: timestampFormat })),
  transports: [consoleTransport, fileTransport],
  exceptionHandlers: [
    new winston.transports.Console({
      format: combine(
        colorize(),
        errors({ stack: true }), // Automatically handle stack trace logging
        errorFormat,
      ),
    }),
    new winston.transports.File({
      filename: "logs/exceptions.log",
      format: errorFormat,
    }),
  ],
  rejectionHandlers: [
    new winston.transports.Console({
      format: combine(colorize(), errors({ stack: true }), errorFormat),
    }),
    new winston.transports.File({
      filename: "logs/rejections.log",
      format: errorFormat,
    }),
  ],
});

// Middleware to log HTTP request details
export const loggerMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.info(
      `Method: ${req.method} ${req.url} | Status: ${res.statusCode} | Duration: ${duration}ms`,
    );
  });
  next();
};

export { logger };

export default loggerMiddleware;
