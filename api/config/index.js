import { requireAuth } from "../_lib/auth.js";
import { handleServerError, methodNotAllowed, sendError } from "../_lib/http.js";
import { listConfigs, seedPrototypeConfigs, upsertConfig } from "../_lib/services/config.js";

export default async function handler(req, res) {
  const user = requireAuth(req, res);
  if (!user) return;

  try {
    if (req.method === "GET") {
      return res.status(200).json(await listConfigs());
    }

    if (req.method === "POST") {
      const body = req.body || {};
      if (body.seed === "prototype") {
        const result = await seedPrototypeConfigs();
        return res.status(201).json(result);
      }
      const config = await upsertConfig(body);
      return res.status(201).json(config);
    }

    return methodNotAllowed(res, ["GET", "POST"]);
  } catch (err) {
    if (err.message?.includes("required") || err.message?.includes("invalid")) {
      return sendError(res, 400, err.message);
    }
    return handleServerError(res, err, "Config API");
  }
}
