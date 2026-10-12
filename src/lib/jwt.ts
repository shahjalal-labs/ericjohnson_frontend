export const sanitizeToken = (value?: string | null): string | null => {
  if (!value) return null;

  // Some callers pass quoted / percent-encoded strings.
  // Example: "%22<token>%22" or "\"<token>\"".
  const trimmed = value.replaceAll("%22", "").replaceAll('"', "").trim();

  if (!trimmed) return null;

  // Handle Authorization-style inputs.
  const bearerPrefix = /^Bearer\s+/i;
  return trimmed.replace(bearerPrefix, "").trim() || null;
};

const base64UrlToBase64 = (value: string): string => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4;
  if (padding === 0) return normalized;
  return normalized + "=".repeat(4 - padding);
};

export const decodeJwtPayload = <T = any>(token?: string | null): T | null => {
  const cleaned = sanitizeToken(token);
  if (!cleaned) return null;

  const parts = cleaned.split(".");
  if (parts.length < 2) return null;

  const payloadPart = parts[1];
  if (!payloadPart) return null;

  try {
    if (typeof atob !== "function") return null;
    const json = atob(base64UrlToBase64(payloadPart));
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
};

export const getUserIdFromToken = (token?: string | null): string | null => {
  const payload = decodeJwtPayload<Record<string, unknown>>(token);
  if (!payload) return null;

  const candidate =
    (typeof payload.id === "string" && payload.id) ||
    (typeof payload.userId === "string" && payload.userId) ||
    (typeof payload._id === "string" && payload._id) ||
    (typeof payload.sub === "string" && payload.sub) ||
    null;

  return candidate ? String(candidate) : null;
};
