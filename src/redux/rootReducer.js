import { combineReducers } from "@reduxjs/toolkit";
import auth, { sessionExpired } from "./slice/authSlice";
import mail from "./slice/mailSlice";
import profile from "./slice/profileSlice";
import settings from "./slice/settingsSlice";
import workspace from "./slice/workspaceSlice";
import ui from "./slice/uiSlice";
import admin from "./slice/adminSlice";
import { logout } from "./thunks/authThunks";

const combined = combineReducers({
  auth,
  mail,
  profile,
  settings,
  workspace,
  ui,
  admin,
});
export function rootReducer(state, action) {
  if (sessionExpired.match(action) || logout.fulfilled.match(action)) {
    const cleared = combined(undefined, { type: "@@session/reset" });
    return {
      ...cleared,
      auth: {
        ...cleared.auth,
        status: "anonymous",
        generation: (state?.auth.generation || 0) + 1,
      },
    };
  }
  return combined(state, action);
}
