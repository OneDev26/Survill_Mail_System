import { request } from "./client";

const basePath = "/api/scheduled";
const statuses = new Set(["scheduled", "sent", "cancelled"]);

export const scheduledEmailsApi = {
  async list({ signal } = {}) {
    const data = await request("GET", basePath, undefined, undefined, {
      signal,
    });
    if (!Array.isArray(data?.items))
      throw new Error(
        "The server returned an invalid scheduled emails response.",
      );
    return data;
  },

  create({ to, subject, body = "", scheduledFor, status = "scheduled" }) {
    if (!statuses.has(status))
      throw new Error("Choose a valid schedule status.");
    return request("POST", basePath, {
      to,
      subject,
      body,
      scheduledFor,
      status,
    });
  },

  update(id, { status }) {
    if (!id) throw new Error("Choose a scheduled email to update.");
    if (!statuses.has(status))
      throw new Error("Choose a valid schedule status.");
    return request("PATCH", `${basePath}/${encodeURIComponent(id)}`, {
      status,
    });
  },

  remove(id) {
    if (!id) throw new Error("Choose a scheduled email to delete.");
    return request("DELETE", `${basePath}/${encodeURIComponent(id)}`);
  },
};
