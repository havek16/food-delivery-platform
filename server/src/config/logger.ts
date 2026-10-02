/**
 * Structured JSON logger. In production, writes NDJSON to stdout for ingestion
 * by a log shipper; in development prints readable lines.
 */
type Level = "info" | "warn" | "error" | "debug";

const levelWeight: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };

function write(level: Level, msg: string, fields: Record<string, unknown> = {}) {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    msg,
    env: process.env.NODE_ENV ?? "development",
    ...fields,
  });
  if (level === "error") process.stderr.write(line + "\n");
  else process.stdout.write(line + "\n");
}

export const logger = {
  debug: (msg: string, fields?: Record<string, unknown>) => write("debug", msg, fields),
  info: (msg: string, fields?: Record<string, unknown>) => write("info", msg, fields),
  warn: (msg: string, fields?: Record<string, unknown>) => write("warn", msg, fields),
  error: (msg: string, fields?: Record<string, unknown>) => write("error", msg, fields),
  child: (base: Record<string, unknown>) => ({
    debug: (m: string, f?: Record<string, unknown>) => write("debug", m, { ...base, ...f }),
    info: (m: string, f?: Record<string, unknown>) => write("info", m, { ...base, ...f }),
    warn: (m: string, f?: Record<string, unknown>) => write("warn", m, { ...base, ...f }),
    error: (m: string, f?: Record<string, unknown>) => write("error", m, { ...base, ...f }),
  }),
  // Convenience for tests / debug tracing
  enabled: (level: Level) => levelWeight[level] >= levelWeight[(process.env.LOG_LEVEL as Level) ?? "info"],
};