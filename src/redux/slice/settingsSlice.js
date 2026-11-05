import { createSlice } from "@reduxjs/toolkit";
import { signatureText } from "../../api/models";
import { login, restoreSession } from "../thunks/authThunks";
import {
  fetchSettings,
  saveSettings,
  replaceSettings,
} from "../thunks/settingsThunks";
import { trackRequests } from "../requestState";

import { defaultSettings, normalizeSettings } from "../../utils/settings";
const slice = createSlice({
  name: "settings",
  initialState: { ...defaultSettings, preferences: {}, requests: {} },
  reducers: {},
  extraReducers: (builder) => {
    for (const thunk of [login, restoreSession]) {
      builder.addCase(thunk.fulfilled, (state, { payload }) => {
        state.preferences = payload.user.preferences || {};
        Object.assign(
          state,
          normalizeSettings(
            payload.user.preferences,
            signatureText(payload.user.signatureHtml),
          ),
        );
      });
    }
    for (const thunk of [fetchSettings, saveSettings, replaceSettings]) {
      builder.addCase(thunk.fulfilled, (state, action) => {
        if (
          state.requests[thunk.typePrefix]?.requestId !== action.meta.requestId
        )
          return;
        state.preferences = action.payload || {};
        Object.assign(state, normalizeSettings(action.payload));
        if (thunk !== fetchSettings)
          delete state.requests[fetchSettings.typePrefix];
      });
    }
    trackRequests(builder, [fetchSettings, saveSettings, replaceSettings]);
  },
});
export default slice.reducer;
