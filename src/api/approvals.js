import { request } from "./client";

const basePath = "/api/approvals";
const decisions = new Set(["approved", "rejected"]);

export const approvalsApi = {
  async list({ signal } = {}) {
    const data = await request("GET", basePath, undefined, undefined, {
      signal,
    });
    if (!Array.isArray(data?.items))
      throw new Error("The server returned an invalid approvals response.");
    return data;
  },

  create({ title, requester, details, amount }) {
    return request("POST", basePath, {
      title,
      requester,
      details,
      amount,
      status: "pending",
    });
  },

  decide(id, status) {
    if (!decisions.has(status))
      throw new Error("Unsupported approval decision.");
    if (!id) throw new Error("Choose an approval request to review.");
    return request("PATCH", `${basePath}/${encodeURIComponent(id)}`, {
      status,
    });
  },
};
