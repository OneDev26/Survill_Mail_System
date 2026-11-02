import { createSlice } from "@reduxjs/toolkit";
import {
  login,
  restoreSession,
  requestPasswordReset,
  resetPassword,
  changePassword,
} from "../thunks/authThunks";
import {
  updateProfile,
  uploadAvatar,
  removeAvatar,
} from "../thunks/profileThunks";
import { userModel } from "../../api/models";
import { trackRequests } from "../requestState";

const initialState = {
  session: null,
  status: "idle",
  error: null,
  bootstrapError: null,
  generation: 0,
  requests: {},
};
const slice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    sessionExpired() {
      return { ...initialState, status: "anonymous" };
    },
  },
  extraReducers: (builder) => {
    for (const thunk of [login, restoreSession]) {
      builder.addCase(thunk.pending, (state) => {
        state.status = thunk === restoreSession ? "restoring" : "signingIn";
        state.error = null;
      });
      builder.addCase(thunk.fulfilled, (state, { payload }) => {
        state.session = userModel(payload.user);
        state.status = "authenticated";
        state.error = null;
        state.bootstrapError = null;
      });
      builder.addCase(thunk.rejected, (state, action) => {
        state.status = "anonymous";
        state.error =
          thunk === restoreSession && action.payload?.status === 401
            ? null
            : action.payload || action.error;
        if (thunk === restoreSession) state.bootstrapError = state.error;
      });
    }
    for (const thunk of [
      changePassword,
      updateProfile,
      uploadAvatar,
      removeAvatar,
    ]) {
      builder.addCase(thunk.fulfilled, (state, { payload }) => {
        state.session = userModel(payload);
      });
    }
    trackRequests(builder, [
      login,
      restoreSession,
      requestPasswordReset,
      resetPassword,
      changePassword,
    ]);
  },
});
export const { sessionExpired } = slice.actions;
export default slice.reducer;
