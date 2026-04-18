import { Logtail as BetterStackLogger } from "@logtail/node";

type LogLevel = "info" | "error";

class Logger {
  private static instance: Logger;
  private readonly logtail?: BetterStackLogger;

  private constructor() {
    const token = process.env.BETTER_STACK_SOURCE_TOKEN;
    if (token) {
      this.logtail = new BetterStackLogger(token);
    }
  }

  static getInstance() {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private log<T extends Record<string, unknown>>(level: LogLevel, message: string, meta?: T) {
    if (this.logtail) {
      this.logtail[level](message, meta);
    } else {
      console[level === "error" ? "error" : "log"](message, meta);
    }
  }

  info<T extends Record<string, unknown>>(message: string, meta?: T) {
    this.log("info", message, meta);
  }

  private normalizeError(error: unknown) {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    return {
      message: String(error),
    };
  }

  error<T extends Record<string, unknown>>(message: string, error: unknown, meta?: T) {
    const payload = {
      ...meta,
      error: error ? this.normalizeError(error) : undefined,
    };
    this.log("error", message, payload);
  }
}

export const logger = Logger.getInstance();
