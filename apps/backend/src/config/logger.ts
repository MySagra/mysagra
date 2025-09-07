import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";


const logLevel = process.env.NODE_ENV === "production" ? "info" : "debug";

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
      filename: "logs/error-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      level: "error",
      maxSize: "20m",
      maxFiles: "14d",
    }),
    new DailyRotateFile({
      filename: "logs/combined-%DATE%.log",
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
      filename: "logs/requests-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      maxSize: "20m",
      maxFiles: "14d",
    }) as winston.transport,
  ],
});