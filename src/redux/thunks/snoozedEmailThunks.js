import { snoozedEmailsApi } from "../../api/snoozedEmails";
import { createApiThunk } from "./createApiThunk";

export const snoozeMessage = createApiThunk(
  "mail/snoozeMessage",
  ({ id, snoozeUntil }) => snoozedEmailsApi.snoozeMessage(id, snoozeUntil),
);

export const unsnoozeMessage = createApiThunk("mail/unsnoozeMessage", (id) =>
  snoozedEmailsApi.unsnoozeMessage(id),
);

export const fetchSnoozedMessages = createApiThunk(
  "snoozed/messages",
  (query, { signal }) => snoozedEmailsApi.listMessages({ ...query, signal }),
);

export const snoozedActions = {
  fetch: createApiThunk("snoozed/fetch", (_, { signal }) =>
    snoozedEmailsApi.list({ signal }),
  ),
  create: createApiThunk("snoozed/create", (body) =>
    snoozedEmailsApi.create(body),
  ),
  update: createApiThunk("snoozed/update", ({ id, body }) =>
    snoozedEmailsApi.update(id, body),
  ),
  remove: createApiThunk("snoozed/remove", (id) => snoozedEmailsApi.remove(id)),
};
