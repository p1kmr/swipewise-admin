import { apiFetch } from "./apiClient.js";

export async function listConfigs() {
  return apiFetch("/api/config");
}

export async function upsertConfig(config) {
  return apiFetch("/api/config", {
    method: "POST",
    body: JSON.stringify(config),
  });
}

export async function seedPrototypeConfigs() {
  return apiFetch("/api/config", {
    method: "POST",
    body: JSON.stringify({ seed: "prototype" }),
  });
}

export async function setConfigActive(jurisdiction, active) {
  return apiFetch("/api/config/set-active", {
    method: "POST",
    body: JSON.stringify({ jurisdiction, active }),
  });
}
