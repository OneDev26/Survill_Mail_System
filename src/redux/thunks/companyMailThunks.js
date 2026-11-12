import { companyMailApi } from "../../api/companyMail";
import { createApiThunk } from "./createApiThunk";

function collectionThunks(kind, removable = false) {
  return {
    fetch: createApiThunk(`${kind}/fetch`, (_, { signal }) =>
      companyMailApi.list(kind, { signal }),
    ),
    create: createApiThunk(`${kind}/create`, (body) =>
      companyMailApi.create(kind, body),
    ),
    update: createApiThunk(`${kind}/update`, ({ id, body }) =>
      companyMailApi.update(kind, id, body),
    ),
    ...(removable
      ? {
          remove: createApiThunk(`${kind}/remove`, (id) =>
            companyMailApi.remove(kind, id),
          ),
        }
      : {}),
  };
}
export const directoryActions = collectionThunks("directory");
