/**
 * CORS origin validator for Express and Socket.IO
 * Allows origins specified in CLIENT_URL (comma-separated, trimmed of spaces and trailing slashes).
 * Always allows http://localhost:5173 when NODE_ENV is not production.
 * Logs any rejected origins.
 */
export function isOriginAllowed(
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void
): void {
  // Allow requests without Origin header (e.g. mobile apps, curl, server-to-server)
  if (!origin) {
    return callback(null, true);
  }

  const rawClientUrl = process.env.CLIENT_URL || "";
  const allowedOrigins = new Set<string>(
    rawClientUrl
      .split(",")
      .map((url) => url.trim().replace(/\/+$/, ""))
      .filter(Boolean)
  );

  // Always also allow http://localhost:5173 when NODE_ENV is not production
  if (process.env.NODE_ENV !== "production") {
    allowedOrigins.add("http://localhost:5173");
  }

  const cleanOrigin = origin.trim().replace(/\/+$/, "");

  if (allowedOrigins.has(cleanOrigin)) {
    return callback(null, true);
  }

  console.warn(`[CORS] Rejected origin: ${origin}`);
  return callback(null, false);
}
