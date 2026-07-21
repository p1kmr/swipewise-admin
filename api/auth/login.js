import { signToken, verifyAdminCredentials } from "../_lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    if (!verifyAdminCredentials(email, password)) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = signToken(email);
    return res.status(200).json({
      token,
      user: { email, role: "admin" },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: err.message || "Login failed." });
  }
}
