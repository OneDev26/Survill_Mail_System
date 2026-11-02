import { createSlice } from "@reduxjs/toolkit";
import { profileModel } from "../../api/models";
import { login, restoreSession, changePassword } from "../thunks/authThunks";
import {
  updateProfile,
  uploadAvatar,
  removeAvatar,
} from "../thunks/profileThunks";
import { trackRequests } from "../requestState";

const slice = createSlice({
  name: "profile",
  initialState: {
    id: null,
    email: "",
    name: "",
    avatar: "",
    recoveryEmail: "",
    requests: {},
  },
  reducers: {},
  extraReducers: (builder) => {
    for (const thunk of [login, restoreSession]) {
      builder.addCase(thunk.fulfilled, (state, { payload }) => {
        Object.assign(state, profileModel(payload.user));
      });
    }
    for (const thunk of [
      updateProfile,
      uploadAvatar,
      removeAvatar,
      changePassword,
    ]) {
      builder.addCase(thunk.fulfilled, (state, { payload }) => {
        Object.assign(state, profileModel(payload));
      });
    }
    trackRequests(builder, [updateProfile, uploadAvatar, removeAvatar]);
  },
});
export default slice.reducer;
