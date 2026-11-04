import { backend } from "../../api/backend";
import { createApiThunk } from "./createApiThunk";

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

export const fetchAdminSection = createApiThunk(
  "admin/fetchSection",
  async (section) => {
    switch (section) {
      case "users":
      case "aliases":
        return { items: (await backend.users()).users };
      case "known-domains":
        return { items: (await backend.domains()).items };
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
export const assignAlias = createApiThunk("admin/assignAlias", ({ id, body }) =>
  backend.addAlias(id, body),
);
export const removeAlias = createApiThunk(
  "admin/removeAlias",
  ({ id, email }) => backend.removeAlias(id, email),
);
export const saveKnownDomain = createApiThunk("admin/saveKnownDomain", (body) =>
  backend.saveDomain(body),
);
export const deleteKnownDomain = createApiThunk(
  "admin/deleteKnownDomain",
  (id) => backend.deleteDomain(id),
);
export const syncContacts = createApiThunk("admin/syncContacts", () =>
  backend.syncContacts(),
);
//
