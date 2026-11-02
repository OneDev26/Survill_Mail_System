import { backend } from "../../api/backend";
import { createApiThunk } from "./createApiThunk";

export const updateProfile = createApiThunk(
  "profile/update",
  async (body) => (await backend.updateProfile(body)).user,
);
export const uploadAvatar = createApiThunk(
  "profile/uploadAvatar",
  async (file) => (await backend.avatar(file)).user,
);
export const removeAvatar = createApiThunk(
  "profile/removeAvatar",
  async () => (await backend.removeAvatar()).user,
);
export const saveSettings = createApiThunk(
  "settings/save",
  async (preferences) => {
    const result = await backend.saveSettings(preferences);
    const signatureHtml = preferences.signature
      .replace(
        /[&<>"']/g,
        (character) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          })[character],
      )
      .replace(/\n/g, "<br>");
    await backend.updateProfile({ signatureHtml });
    return result.preferences;
  },
);
