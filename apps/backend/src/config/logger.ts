import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import path from "path";
import { env } from "@/config/env";

const logLevel = process.env.NODE_ENV === "production" ? "info" : "debug";
const logDir = path.join(env.FILE_BASE_PATH, "logs");

const formatConfig = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json(),
  winston.format.errors({ stack: true }),
  winston.format.metadata()
);

const transports: winston.transport[] = [
  new winston.transports.Console({
    level: logLevel,
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }),
];

if (process.env.NODE_ENV === "production") {
  transports.push(
    new DailyRotateFile({
      filename: path.join(logDir, "error-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      level: "error",
      maxSize: "20m",
      maxFiles: "14d",
    }),
    new DailyRotateFile({
      filename: path.join(logDir, "combined-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      maxSize: "20m",
      maxFiles: "14d",
    })
  );
}

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: formatConfig,
  transports,
});

export const requestLogger = winston.createLogger({
  format: formatConfig,
  transports: [
    new (DailyRotateFile as any)({
      filename: path.join(logDir, "requests-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      maxSize: "20m",
      maxFiles: "14d",
    }) as winston.transport,
  ],
});