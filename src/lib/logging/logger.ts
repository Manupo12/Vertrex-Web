import "server-only";

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  service: string;
  environment: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class VertrexLogger {
  private service = "vertrex-os";
  private environment = process.env.NODE_ENV || "development";

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ["debug", "info", "warn", "error"];
    const minLevel = (process.env.LOG_LEVEL as LogLevel) || "info";
    return levels.indexOf(level) >= levels.indexOf(minLevel);
  }

  private write(entry: LogEntry): void {
    const output = JSON.stringify(entry);
    if (entry.level === "error") {
      console.error(output);
    } else if (entry.level === "warn") {
      console.warn(output);
    } else {
      console.log(output);
    }
  }

  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog("debug")) return;
    this.write({
      level: "debug",
      message,
      timestamp: new Date().toISOString(),
      service: this.service,
      environment: this.environment,
      context,
    });
  }

  info(message: string, context?: LogContext): void {
    if (!this.shouldLog("info")) return;
    this.write({
      level: "info",
      message,
      timestamp: new Date().toISOString(),
      service: this.service,
      environment: this.environment,
      context,
    });
  }

  warn(message: string, context?: LogContext): void {
    if (!this.shouldLog("warn")) return;
    this.write({
      level: "warn",
      message,
      timestamp: new Date().toISOString(),
      service: this.service,
      environment: this.environment,
      context,
    });
  }

  error(message: string, error?: Error, context?: LogContext): void {
    if (!this.shouldLog("error")) return;
    this.write({
      level: "error",
      message,
      timestamp: new Date().toISOString(),
      service: this.service,
      environment: this.environment,
      context,
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: process.env.NODE_ENV !== "production" ? error.stack : undefined,
          }
        : undefined,
    });
  }
}

export const logger = new VertrexLogger();
