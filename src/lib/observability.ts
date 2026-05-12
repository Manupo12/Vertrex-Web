export function captureError(error: Error, context?: Record<string, any>) {
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    name: error.name,
    message: error.message,
    stack: error.stack,
    context,
  }));
}

export function captureMessage(message: string, level: "info" | "warn" | "error" = "info") {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
  }));
}
