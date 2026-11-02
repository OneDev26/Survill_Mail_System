import { createSlice } from "@reduxjs/toolkit";
import { signatureText } from "../../api/models";
import { login, restoreSession } from "../thunks/authThunks";
import { saveSettings } from "../thunks/profileThunks";
import { trackRequests } from "../requestState";

export const defaultSettings = {
  compact: false,
  pageSize: 10,
  markReadOnOpen: true,
  signature: "",
  useSignature: true,
  confirmTrash: false,
};
export function normalizeSettings(preferences = {}, signature = "") {
  return {
    compact:
      typeof preferences.compact === "boolean" ? preferences.compact : false,
    pageSize: [10, 20, 50].includes(preferences.pageSize)
      ? preferences.pageSize
      : 10,
    markReadOnOpen:
      typeof preferences.markReadOnOpen === "boolean"
        ? preferences.markReadOnOpen
        : true,
    signature:
      typeof preferences.signature === "string"
        ? preferences.signature
        : signature,
    useSignature:
      typeof preferences.useSignature === "boolean"
        ? preferences.useSignature
        : true,
    confirmTrash:
      typeof preferences.confirmTrash === "boolean"
        ? preferences.confirmTrash
        : false,
  };
}
const slice = createSlice({
  name: "settings",
  initialState: { ...defaultSettings, requests: {} },
  reducers: {},
  extraReducers: (builder) => {
    for (const thunk of [login, restoreSession]) {
      builder.addCase(thunk.fulfilled, (state, { payload }) => {
        Object.assign(
          state,
          normalizeSettings(
            payload.user.preferences,
            signatureText(payload.user.signatureHtml),
          ),
        );
      });
    }
    builder.addCase(saveSettings.fulfilled, (state, { payload }) => {
      Object.assign(state, normalizeSettings(payload));
    });
    trackRequests(builder, [saveSettings]);
  },
});
export default slice.reducer;
