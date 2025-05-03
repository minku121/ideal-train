import prisma from "@/app/lib/prisma";

// Define log levels matching the Prisma schema enum
export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARNING = "WARNING",
  ERROR = "ERROR",
  CRITICAL = "CRITICAL"
}

export interface LogOptions {
  source?: string;
  userId?: number;
  metadata?: Record<string, any>;
}

/**
 * Application logger utility for recording logs to the database
 */
class Logger {
  /**
   * Log a debug message
   */
  async debug(message: string, options: LogOptions = {}) {
    return this.log(LogLevel.DEBUG, message, options);
  }

  /**
   * Log an info message
   */
  async info(message: string, options: LogOptions = {}) {
    return this.log(LogLevel.INFO, message, options);
  }

  /**
   * Log a warning message
   */
  async warning(message: string, options: LogOptions = {}) {
    return this.log(LogLevel.WARNING, message, options);
  }

  /**
   * Log an error message
   */
  async error(message: string, options: LogOptions = {}) {
    return this.log(LogLevel.ERROR, message, options);
  }

  /**
   * Log a critical message
   */
  async critical(message: string, options: LogOptions = {}) {
    return this.log(LogLevel.CRITICAL, message, options);
  }

  /**
   * Create a log entry in the database
   */
  private async log(level: LogLevel, message: string, options: LogOptions = {}) {
    const { source, userId, metadata } = options;

    try {
      // Use raw query since we had issues with prisma client detection
      const query = `
        INSERT INTO AppLog (level, message, source, userId, metadata, createdAt)
        VALUES (?, ?, ?, ?, ?, NOW())
      `;

      await prisma.$executeRawUnsafe(
        query,
        level,
        message,
        source || null,
        userId || null,
        metadata ? JSON.stringify(metadata) : null
      );

      // Also log to console for development visibility
      if (process.env.NODE_ENV !== "production") {
        const consoleMessage = `[${level}] ${source ? `[${source}] ` : ""}${message}`;
        switch (level) {
          case LogLevel.DEBUG:
            console.debug(consoleMessage, metadata);
            break;
          case LogLevel.INFO:
            console.info(consoleMessage, metadata);
            break;
          case LogLevel.WARNING:
            console.warn(consoleMessage, metadata);
            break;
          case LogLevel.ERROR:
          case LogLevel.CRITICAL:
            console.error(consoleMessage, metadata);
            break;
        }
      }

      return true;
    } catch (error) {
      // Don't let logging failures crash the app
      console.error("Failed to write log to database:", error);
      return false;
    }
  }
}

// Export a singleton instance
const logger = new Logger();
export default logger; 