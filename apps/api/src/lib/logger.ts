/**
 * Structured logger (Winston).
 * - Production: JSON to stdout + rotating file transport
 * - Development: coloured pretty output
 * - All sheets sync events use the "sheets" child logger
 */

import winston from "winston";
import "winston-daily-rotate-file";

const { combine, timestamp, json, colorize, simple, errors } = winston.format;

const isDev  = process.env.NODE_ENV === "development";
const level  = process.env.LOG_LEVEL ?? (isDev ? "debug" : "info");
const format = process.env.LOG_FORMAT ?? (isDev ? "pretty" : "json");

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: format === "pretty"
      ? combine(colorize(), simple())
      : combine(errors({ stack: true }), timestamp(), json()),
  }),
];

if (process.env.NODE_ENV === "production") {
  transports.push(
    new winston.transports.DailyRotateFile({
      filename:    "logs/api-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      maxSize:     "20m",
      maxFiles:    "14d",
      format:      combine(errors({ stack: true }), timestamp(), json()),
    }),
    new winston.transports.DailyRotateFile({
      filename:    "logs/sheets-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      maxSize:     "10m",
      maxFiles:    "30d",
      format:      combine(errors({ stack: true }), timestamp(), json()),
      level:       "debug",
    }),
  );
}

export const logger = winston.createLogger({ level, transports });

/** Child logger for all sheets sync operations — adds sheets:true meta. */
export const sheetsLogger = logger.child({ service: "sheets-sync" });
