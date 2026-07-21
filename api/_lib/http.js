export function methodNotAllowed(res, methods) {
  res.setHeader("Allow", methods.join(", "));
  return res.status(405).json({ error: "Method not allowed." });
}

export function sendError(res, status, message) {
  return res.status(status).json({ error: message });
}

export function handleServerError(res, err, label) {
  console.error(`${label}:`, err);
  return res.status(500).json({ error: err.message || `${label} failed.` });
}
