import jwt from "jsonwebtoken";

const TOKEN_TTL = "7d";

function getSecret() {
  return process.env.JWT_SECRET || process.env.ADMIN_PASSWORD || "swipewise-poc-dev-secret";
}

export function signToken(email) {
  return jwt.sign({ email, role: "admin" }, getSecret(), { expiresIn: TOKEN_TTL });
}

export function verifyToken(token) {
  return jwt.verify(token, getSecret());
}

export function getBearerToken(req) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return null;
  return header.slice(7);
}

export function requireAuth(req, res) {
  const token = getBearerToken(req);
  if (!token) {
    res.status(401).json({ error: "Authentication required." });
    return null;
  }
  try {
    return verifyToken(token);
  } catch {
    res.status(401).json({ error: "Invalid or expired session." });
    return null;
  }
}

export function verifyAdminCredentials(email, password) {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be configured.");
  }
  return email === adminEmail && password === adminPassword;
}
