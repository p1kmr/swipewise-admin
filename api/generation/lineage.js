import { requireAuth } from "../_lib/auth.js";
import { handleServerError, methodNotAllowed } from "../_lib/http.js";
import { writeGenerationLineage } from "../_lib/services/lineage.js";

export default async function handler(req, res) {
  const user = requireAuth(req, res);
  if (!user) return;

  if (req.method !== "POST") {
    return methodNotAllowed(res, ["POST"]);
  }

  try {
    const result = await writeGenerationLineage(user.email, req.body || {});
    return res.status(201).json(result);
  } catch (err) {
    return handleServerError(res, err, "Lineage write");
  }
}
