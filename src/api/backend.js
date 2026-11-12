import { request, setSession, clearSession, refreshSession } from "./client";
import { settingsApi } from "./settings";
const id = encodeURIComponent;
const get = (path, params, options) =>
  request("GET", path, undefined, params, options);
const post = (path, body) => request("POST", path, body);
const patch = (path, body) => request("PATCH", path, body);
const del = (path, body) => request("DELETE", path, body);
const upload = (method, path, field, files) => {
  const body = new FormData();
  for (const file of files) body.append(field, file);
  return request(method, path, body);
};
export const backend = {
  health: () => get("/health"),
  async login(body) {
    const session = await request("POST", "/api/auth/login", body, undefined, {
      skipRefresh: true,
    });
    setSession(session);
    return session;
  },
  refresh: refreshSession,
  async logout(all = false) {
    await post(`/api/auth/${all ? "logout-all" : "logout"}`);
    clearSession();
  },
  me: () => get("/api/auth/me"),
  forgot: (email) =>
    request("POST", "/api/auth/forgot-password", { email }, undefined, {
      skipRefresh: true,
    }),
  reset: (body) =>
    request("POST", "/api/auth/reset-password", body, undefined, {
      skipRefresh: true,
    }),
  async changePassword(body) {
    const session = await post("/api/auth/change-password", body);
    setSession(session);
    return session;
  },
  profile: () => get("/api/profile"),
  updateProfile: (body) => patch("/api/profile", body),
  avatar: (file) => upload("PUT", "/api/profile/avatar", "avatar", [file]),
  removeAvatar: () => del("/api/profile/avatar"),
  settings: settingsApi.get,
  saveSettings: (preferences, replace = false) =>
    replace
      ? settingsApi.replace(preferences)
      : settingsApi.update(preferences),
  folders: () => get("/api/folders"),
  createFolder: (name) => post("/api/folders", { name }),
  renameFolder: (key, name) => patch(`/api/folders/${id(key)}`, { name }),
  deleteFolder: (key) => del(`/api/folders/${id(key)}`),
  emptyFolder: (kind) => post(`/api/folders/${id(kind)}/empty`),
  labels: () => get("/api/labels"),
  createLabel: (body) => post("/api/labels", body),
  updateLabel: (key, body) => patch(`/api/labels/${id(key)}`, body),
  deleteLabel: (key) => del(`/api/labels/${id(key)}`),
  messages: (params, options) => get("/api/messages", params, options),
  message: (key, markRead = true) =>
    get(`/api/messages/${id(key)}`, { markRead }),
  markFolderRead: (key) => post(`/api/folders/${id(key)}/mark-read`),
  thread: (key) => get(`/api/threads/${id(key)}`),
  bulk: (body) => patch("/api/messages", body),
  deleteMessages: (ids) => del("/api/messages", { ids }),
  raw: (key) => get(`/api/messages/${id(key)}/raw`),
  attachment: (key) => get(`/api/attachments/${id(key)}`),
  createDraft: (body) => post("/api/drafts", body),
  saveDraft: (key, body) => request("PUT", `/api/drafts/${id(key)}`, body),
  discardDraft: (key) => del(`/api/drafts/${id(key)}`),
  attach: (key, files) =>
    upload("POST", `/api/drafts/${id(key)}/attachments`, "files", files),
  detach: (key, attachment) =>
    del(`/api/drafts/${id(key)}/attachments/${id(attachment)}`),
  sendDraft: (key) => post(`/api/drafts/${id(key)}/send`),
  send: (body) => post("/api/messages/send", body),
  list: (kind, params) => get(`/api/${id(kind)}`, params),
  create: (kind, body) => post(`/api/${id(kind)}`, body),
  update: (kind, key, body) => patch(`/api/${id(kind)}/${id(key)}`, body),
  remove: (kind, key) => del(`/api/${id(kind)}/${id(key)}`),
  suggest: (q) => get("/api/contacts/suggest", { q }),
  identify: (emails) => post("/api/identify", { emails }),
  adminOverview: (options) => get("/api/admin/overview", undefined, options),
  adminOverviewSummary: (options) =>
    get("/api/admin/overview/summary", undefined, options),
  adminReports: (options) => get("/api/admin/reports", undefined, options),
  adminReportsSummary: (options) =>
    get("/api/admin/reports/summary", undefined, options),
  adminDomains: (params, options) => get("/api/admin/domains", params, options),
  createAdminDomain: (body) => post("/api/admin/domains", body),
  updateAdminDomain: (key, body) =>
    patch(`/api/admin/domains/${id(key)}`, body),
  deleteAdminDomain: (key) => del(`/api/admin/domains/${id(key)}`),
  adminAliases: (params, options) => get("/api/admin/aliases", params, options),
  createAdminAlias: (body) => post("/api/admin/aliases", body),
  deleteAdminAlias: (key) => del(`/api/admin/aliases/${id(key)}`),
  senderControls: (params, options) =>
    get("/api/admin/sender-controls", params, options),
  createSenderControl: (body) => post("/api/admin/sender-controls", body),
  updateSenderControl: (key, body) =>
    patch(`/api/admin/sender-controls/${id(key)}`, body),
  deleteSenderControl: (key) => del(`/api/admin/sender-controls/${id(key)}`),
  routingRules: (params, options) => get("/api/admin/routing", params, options),
  createRoutingRule: (body) => post("/api/admin/routing", body),
  updateRoutingRule: (key, body) =>
    patch(`/api/admin/routing/${id(key)}`, body),
  deleteRoutingRule: (key) => del(`/api/admin/routing/${id(key)}`),
  stores: (params, options) => get("/api/admin/stores", params, options),
  createStore: (body) => post("/api/admin/stores", body),
  updateStore: (key, body) => patch(`/api/admin/stores/${id(key)}`, body),
  deleteStore: (key) => del(`/api/admin/stores/${id(key)}`),
  adminSecurity: (options) => get("/api/admin/security", undefined, options),
  updateAdminSecurity: (body) => patch("/api/admin/security", body),
  users: (options) => get("/api/admin/users", undefined, options),
  groups: (options) => get("/api/admin/groups", undefined, options),
  createGroup: (body) => post("/api/admin/groups", body),
  updateGroup: (key, body) => patch(`/api/admin/groups/${id(key)}`, body),
  deleteGroup: (key) => del(`/api/admin/groups/${id(key)}`),
  monitoring: (params, options) =>
    get("/api/admin/monitoring", params, options),
  emailMonitoring: (params, options) =>
    get("/api/admin/email-monitoring", params, options),
  createUser: (body) => post("/api/admin/users", body),
  updateUser: (key, body) => patch(`/api/admin/users/${id(key)}`, body),
  addAlias: (key, body) => post(`/api/admin/users/${id(key)}/aliases`, body),
  removeAlias: (key, email) =>
    del(`/api/admin/users/${id(key)}/aliases/${id(email)}`),
  inboundLog: (limit = 25, options) =>
    get("/api/admin/inbound-log", { limit }, options),
  auditLog: (limit = 25, options) =>
    get("/api/admin/audit-log", { limit }, options),
  syncStatus: () => get("/api/admin/zoho-sync"),
  syncContacts: () => post("/api/admin/zoho-sync"), //
};
