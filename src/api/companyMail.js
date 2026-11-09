import { request } from "./client";

const contracts = {
  shared: {
    path: "shared-mailboxes",
    create: ["mailbox", "conversation", "status", "access", "note"],
    update: ["status", "access"],
  },
  directory: {
    path: "company-directory",
    create: ["name", "title", "department", "office", "email"],
    update: ["office"],
  },
  scheduled: {
    path: "scheduled",
    create: ["subject", "to", "body", "scheduledFor", "status"],
    update: ["status"],
    remove: true,
  },
  snoozed: {
    path: "snoozed",
    create: ["subject", "from", "body", "snoozedUntil", "status"],
    update: ["status"],
    remove: true,
  },
  approvals: {
    path: "approvals",
    create: ["title", "requester", "details", "amount", "status"],
    update: ["status"],
  },
};
function contract(kind) {
  const value = contracts[kind];
  if (!value) throw new Error("Unknown workspace resource.");
  return value;
}
function bodyFor(fields, source) {
  return Object.fromEntries(
    fields
      .filter((key) => source[key] !== undefined)
      .map((key) => [key, source[key]]),
  );
}
export const companyMailApi = {
  async list(kind, options) {
    const data = await request(
      "GET",
      `/api/${contract(kind).path}`,
      undefined,
      undefined,
      options,
    );
    if (!Array.isArray(data?.items))
      throw new Error("The server returned an invalid workspace response.");
    return data;
  },
  create(kind, body) {
    const config = contract(kind);
    return request("POST", `/api/${config.path}`, bodyFor(config.create, body));
  },
  update(kind, id, body) {
    const config = contract(kind);
    return request(
      "PATCH",
      `/api/${config.path}/${encodeURIComponent(id)}`,
      bodyFor(config.update, body),
    );
  },
  remove(kind, id) {
    const config = contract(kind);
    if (!config.remove)
      throw new Error("Deletion is not supported for this resource.");
    return request("DELETE", `/api/${config.path}/${encodeURIComponent(id)}`);
  },
};
