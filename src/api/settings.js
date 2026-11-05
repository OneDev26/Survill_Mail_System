import { request } from "./client";

export const settingsApi = {
  get: (options) =>
    request("GET", "/api/settings", undefined, undefined, options),
  update: (preferences) => request("PATCH", "/api/settings", preferences),
  replace: (preferences) => request("PUT", "/api/settings", preferences),
};
