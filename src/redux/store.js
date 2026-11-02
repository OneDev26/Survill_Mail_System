import { configureStore } from "@reduxjs/toolkit";
import { onSessionExpired } from "../api/client";
import { rootReducer } from "./rootReducer";
import { sessionExpired } from "./slice/authSlice";

// Never expose password arguments or file contents in Redux DevTools.
function sanitizeAction(action) {
  if (!action.meta?.arg) return action;
  if (
    /auth\/(login|resetPassword|changePassword)|admin\/(createUser|updateUser)|upload/i.test(
      action.type,
    )
  ) {
    return { ...action, meta: { ...action.meta, arg: "[redacted]" } };
  }
  return action;
}
export const store = configureStore({
  reducer: rootReducer,
  devTools: import.meta.env.DEV ? { actionSanitizer: sanitizeAction } : false,
});
onSessionExpired(() => store.dispatch(sessionExpired()));
