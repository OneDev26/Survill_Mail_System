import { request } from "./client";

const basePath = "/api/snoozed";
const statuses = new Set(["snoozed", "active"]);

export const snoozedEmailsApi = {
  async listMessages({ page = 1, pageSize = 50, signal } = {}) {
    const data = await request(
      "GET",
      "/api/messages",
      undefined,
      { folder: "snoozed", page, pageSize },
      { signal },
    );
    if (!Array.isArray(data?.items))
      throw new Error(
        "The server returned an invalid snoozed messages response.",
      );
    return data;
  },

  snoozeMessage(messageId, snoozeUntil) {
    if (!messageId) throw new Error("Choose a message to snooze.");
    return request(
      "POST",
      `/api/messages/${encodeURIComponent(messageId)}/snooze`,
      { snoozeUntil },
    );
  },

  unsnoozeMessage(messageId) {
    if (!messageId) throw new Error("Choose a message to return to Inbox.");
    return request(
      "POST",
      `/api/messages/${encodeURIComponent(messageId)}/unsnooze`,
    );
  },

  async list({ signal } = {}) {
    const data = await request("GET", basePath, undefined, undefined, {
      signal,
    });
    if (!Array.isArray(data?.items))
      throw new Error(
        "The server returned an invalid snoozed emails response.",
      );
    return data;
  },

  create({ subject, from, body = "", snoozedUntil, status = "snoozed" }) {
    if (!statuses.has(status)) throw new Error("Choose a valid snooze status.");
    return request("POST", basePath, {
      subject,
      from,
      body,
      snoozedUntil,
      status,
    });
  },

  update(id, { status }) {
    if (!id) throw new Error("Choose a snoozed email to update.");
    if (!statuses.has(status)) throw new Error("Choose a valid snooze status.");
    return request("PATCH", `${basePath}/${encodeURIComponent(id)}`, {
      status,
    });
  },

  remove(id) {
    if (!id) throw new Error("Choose a snoozed email to delete.");
    return request("DELETE", `${basePath}/${encodeURIComponent(id)}`);
  },
};
