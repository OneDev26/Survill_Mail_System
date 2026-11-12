import { scheduledEmailsApi } from "../../api/scheduledEmails";
import { createApiThunk } from "./createApiThunk";

export const scheduledActions = {
  fetch: createApiThunk("scheduled/fetch", (_, { signal }) =>
    scheduledEmailsApi.list({ signal }),
  ),
  create: createApiThunk("scheduled/create", (body) =>
    scheduledEmailsApi.create(body),
  ),
  update: createApiThunk("scheduled/update", ({ id, body }) =>
    scheduledEmailsApi.update(id, body),
  ),
  remove: createApiThunk("scheduled/remove", (id) =>
    scheduledEmailsApi.remove(id),
  ),
};
