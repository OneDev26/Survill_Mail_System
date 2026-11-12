import { sharedMailboxesApi } from "../../api/sharedMailboxes";
import { createApiThunk } from "./createApiThunk";

export const sharedActions = {
  fetch: createApiThunk("shared/fetch", (_, { signal }) =>
    sharedMailboxesApi.list({ signal }),
  ),
  create: createApiThunk("shared/create", (body) =>
    sharedMailboxesApi.create(body),
  ),
  update: createApiThunk("shared/update", ({ id, body }) =>
    sharedMailboxesApi.update(id, body),
  ),
};
