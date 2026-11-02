import { backend } from "../../api/backend";
import { workspaceBody, workspaceModel } from "../../api/models";
import { createApiThunk } from "./createApiThunk";

export const fetchWorkspace = createApiThunk(
  "workspace/fetch",
  async (collection) => {
    const items = [];
    let page = 1;
    let hasNextPage;
    do {
      const result = await backend.list(
        collection,
        collection === "contacts" ? { page, pageSize: 200 } : undefined,
      );
      items.push(...result.items);
      hasNextPage =
        collection === "contacts" &&
        result.items.length > 0 &&
        items.length < result.total;
      page++;
    } while (hasNextPage);
    return {
      collection,
      items: items.map((item) => workspaceModel(collection, item)),
    };
  },
);
export const saveWorkspaceItem = createApiThunk(
  "workspace/save",
  async ({ collection, item }, { getState }) => {
    const exists = getState().workspace[collection].some(
      (entry) => entry.id === item.id,
    );
    const body = workspaceBody(collection, item);
    const result = await (exists
      ? backend.update(collection, item.id, body)
      : backend.create(collection, body));
    const key = {
      contacts: "contact",
      tasks: "task",
      notes: "note",
      events: "event",
    }[collection];
    return { collection, item: workspaceModel(collection, result[key]) };
  },
);
export const deleteWorkspaceItem = createApiThunk(
  "workspace/delete",
  async ({ collection, id }) => {
    await backend.remove(collection, id);
    return { collection, id };
  },
);
