import { settingsApi } from "../../api/settings";
import { createApiThunk } from "./createApiThunk";

export const fetchSettings = createApiThunk(
  "settings/fetch",
  async (_, { signal }) => (await settingsApi.get({ signal })).preferences,
);
export const saveSettings = createApiThunk(
  "settings/save",
  async (preferences) => (await settingsApi.update(preferences)).preferences,
);
export const replaceSettings = createApiThunk(
  "settings/replace",
  async (preferences) => (await settingsApi.replace(preferences)).preferences,
);
