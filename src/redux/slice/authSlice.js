import { createSlice } from "@reduxjs/toolkit";

const slice = createSlice({
  name: "auth",
  initialState: { session: null, remember: false },
  reducers: {
    signedIn(state, { payload }) {
      state.session = payload.session;
      state.remember = payload.remember;
    },
    signedOut(state) {
      state.session = null;
      state.remember = false;
    },
  },
});
export const { signedIn, signedOut } = slice.actions;
export default slice.reducer;
