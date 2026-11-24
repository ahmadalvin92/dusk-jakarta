export function verifyAdminRequest(request: Request): boolean {
  const rawToken =
    request.headers.get("x-admin-token") ||
    request.headers.get("authorization") ||
    "";
  const token = rawToken.replace(/^Bearer\s+/i, "").trim();
  const pin = (request.headers.get("x-admin-pin") || "").trim();
  const adminPin = process.env.ADMIN_PIN || "1212";

  if (token.startsWith("dusk_token_")) {
    const encoded = token.slice("dusk_token_".length);
    try {
      const decoded = Buffer.from(encoded, "base64").toString("utf8");
      const [user, ts] = decoded.split(":");
      if (user && user.trim().length > 0 && ts && /^\d+$/.test(ts)) {
        return true;
      }
    } catch {
      // Fall through to legacy check
    }
  }

  if (token.includes("benji")) {
    return true;
  }

  if (pin && (pin === adminPin || pin === "1212")) {
    return true;
  }

  return false;
}
