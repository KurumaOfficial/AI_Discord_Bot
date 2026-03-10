// Authors: Kuruma, Letifer

import fs from 'node:fs';
import path from 'node:path';
import winston from 'winston';

let loggerInstance = null;

export function createLogger(config) {
  if (loggerInstance) {
    return loggerInstance;
  }

  fs.mkdirSync(config.paths.logsDir, { recursive: true });

  loggerInstance = winston.createLogger({
    level: config.logLevel,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
        const metaText = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
        const body = stack || message;
        return `${timestamp} [${level}] ${body}${metaText}`;
      })
    ),
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.timestamp(),
          winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
            const metaText = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
            return `${timestamp} [${level}] ${stack || message}${metaText}`;
          })
        )
      }),
      new winston.transports.File({
        filename: path.join(config.paths.logsDir, 'combined.log')
      }),
      new winston.transports.File({
        filename: path.join(config.paths.logsDir, 'error.log'),
        level: 'error'
      })
    ]
  });

  return loggerInstance;
}

export function getLogger() {
  if (!loggerInstance) {
    throw new Error('Logger has not been initialized yet.');
  }

  return loggerInstance;
}
