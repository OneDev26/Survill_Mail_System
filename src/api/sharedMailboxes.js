import { request } from "./client";

const basePath = "/api/shared-mailboxes";
const statuses = new Set(["pending", "approved", "rejected"]);
const accessModes = new Set(["Open", "Restricted"]);

function validateSettings({ status, access }) {
  if (status !== undefined && !statuses.has(status))
    throw new Error("Choose a valid conversation status.");
  if (access !== undefined && !accessModes.has(access))
    throw new Error("Choose a valid access setting.");
}

export const sharedMailboxesApi = {
  async list({ signal } = {}) {
    const data = await request("GET", basePath, undefined, undefined, {
      signal,
    });
    if (!Array.isArray(data?.items))
      throw new Error(
        "The server returned an invalid shared mailbox response.",
      );
    return data;
  },

  create({
    mailbox,
    conversation,
    status = "pending",
    access = "Open",
    note = "",
  }) {
    validateSettings({ status, access });
    return request("POST", basePath, {
      mailbox,
      conversation,
      status,
      access,
      note,
    });
  },

  update(id, { status, access }) {
    if (!id) throw new Error("Choose a conversation to update.");
    validateSettings({ status, access });
    const body = Object.fromEntries(
      Object.entries({ status, access }).filter(
        ([, value]) => value !== undefined,
      ),
    );
    if (!Object.keys(body).length)
      throw new Error("Choose a conversation setting to update.");
    return request("PATCH", `${basePath}/${encodeURIComponent(id)}`, body);
  },
};
