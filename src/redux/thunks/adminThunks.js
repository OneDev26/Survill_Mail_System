import { backend } from "../../api/backend";
import { createApiThunk } from "./createApiThunk";

export const fetchAdminUsers = createApiThunk(
  "admin/fetchAdminUsers",
  (_, { signal }) => backend.users({ signal }),
);

export const fetchGroups = createApiThunk(
  "admin/fetchGroups",
  (_, { signal }) => backend.groups({ signal }),
);
export const createGroup = createApiThunk("admin/createGroup", (body) =>
  backend.createGroup(body),
);
export const updateGroup = createApiThunk("admin/updateGroup", ({ id, body }) =>
  backend.updateGroup(id, body),
);
export const deleteGroup = createApiThunk("admin/deleteGroup", (id) =>
  backend.deleteGroup(id),
);
export const fetchMonitoring = createApiThunk(
  "admin/fetchMonitoring",
  (params, { signal }) => backend.monitoring(params, { signal }),
);
export const fetchEmailMonitoring = createApiThunk(
  "admin/fetchEmailMonitoring",
  (params, { signal }) => backend.emailMonitoring(params, { signal }),
);

export const fetchInboundLog = createApiThunk(
  "admin/fetchInboundLog",
  (limit, { signal }) => backend.inboundLog(limit, { signal }),
);

export const fetchAuditLog = createApiThunk(
  "admin/fetchAuditLog",
  (limit, { signal }) => backend.auditLog(limit, { signal }),
);

export const fetchAdminSection = createApiThunk(
  "admin/fetchSection",
  async (section) => {
    switch (section) {
      case "users":
        return { items: (await backend.users()).users };
      case "inbound-log":
        return { items: (await backend.inboundLog()).items };
      case "zoho-sync":
        return { items: [], sync: await backend.syncStatus() };
      default:
        return { items: [] };
    }
  },
);
export const createUser = createApiThunk("admin/createUser", (body) =>
  backend.createUser(body),
);
export const updateUser = createApiThunk("admin/updateUser", ({ id, body }) =>
  backend.updateUser(id, body),
);
export const syncContacts = createApiThunk("admin/syncContacts", () =>
  backend.syncContacts(),
);
//

export const fetchAdminOverview = createApiThunk(
  "admin/fetchAdminOverview",
  (_, { signal }) => backend.adminOverview({ signal }),
);
export const fetchAdminOverviewSummary = createApiThunk(
  "admin/fetchAdminOverviewSummary",
  (_, { signal }) => backend.adminOverviewSummary({ signal }),
);
export const fetchAdminReports = createApiThunk(
  "admin/fetchAdminReports",
  (_, { signal }) => backend.adminReports({ signal }),
);
export const fetchAdminReportsSummary = createApiThunk(
  "admin/fetchAdminReportsSummary",
  (_, { signal }) => backend.adminReportsSummary({ signal }),
);
export const fetchAdminSecurity = createApiThunk(
  "admin/fetchAdminSecurity",
  (_, { signal }) => backend.adminSecurity({ signal }),
);
export const fetchAdminDomains = createApiThunk(
  "admin/fetchAdminDomains",
  (params, { signal }) => backend.adminDomains(params, { signal }),
);
export const createAdminDomain = createApiThunk(
  "admin/createAdminDomain",
  (body) => backend.createAdminDomain(body),
);
export const updateAdminDomain = createApiThunk(
  "admin/updateAdminDomain",
  ({ id, body }) => backend.updateAdminDomain(id, body),
);
export const deleteAdminDomain = createApiThunk(
  "admin/deleteAdminDomain",
  (id) => backend.deleteAdminDomain(id),
);
export const fetchAdminAliases = createApiThunk(
  "admin/fetchAdminAliases",
  (params, { signal }) => backend.adminAliases(params, { signal }),
);
export const createAdminAlias = createApiThunk(
  "admin/createAdminAlias",
  (body) => backend.createAdminAlias(body),
);
export const deleteAdminAlias = createApiThunk("admin/deleteAdminAlias", (id) =>
  backend.deleteAdminAlias(id),
);
export const fetchSenderControls = createApiThunk(
  "admin/fetchSenderControls",
  (params, { signal }) => backend.senderControls(params, { signal }),
);
export const createSenderControl = createApiThunk(
  "admin/createSenderControl",
  (body) => backend.createSenderControl(body),
);
export const updateSenderControl = createApiThunk(
  "admin/updateSenderControl",
  ({ id, body }) => backend.updateSenderControl(id, body),
);
export const deleteSenderControl = createApiThunk(
  "admin/deleteSenderControl",
  (id) => backend.deleteSenderControl(id),
);
export const fetchRoutingRules = createApiThunk(
  "admin/fetchRoutingRules",
  (params, { signal }) => backend.routingRules(params, { signal }),
);
export const createRoutingRule = createApiThunk(
  "admin/createRoutingRule",
  (body) => backend.createRoutingRule(body),
);
export const updateRoutingRule = createApiThunk(
  "admin/updateRoutingRule",
  ({ id, body }) => backend.updateRoutingRule(id, body),
);
export const deleteRoutingRule = createApiThunk(
  "admin/deleteRoutingRule",
  (id) => backend.deleteRoutingRule(id),
);
export const fetchStores = createApiThunk(
  "admin/fetchStores",
  (params, { signal }) => backend.stores(params, { signal }),
);
export const createStore = createApiThunk("admin/createStore", (body) =>
  backend.createStore(body),
);
export const updateStore = createApiThunk("admin/updateStore", ({ id, body }) =>
  backend.updateStore(id, body),
);
export const deleteStore = createApiThunk("admin/deleteStore", (id) =>
  backend.deleteStore(id),
);
export const updateAdminSecurity = createApiThunk(
  "admin/updateAdminSecurity",
  (body) => backend.updateAdminSecurity(body),
);
