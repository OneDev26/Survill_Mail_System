import { createSlice } from "@reduxjs/toolkit";
const slice = createSlice({
  name: "ui",
  initialState: { compose: null, notification: null, storageError: false },
  reducers: {
    composeOpened: {
      prepare(value = {}) {
        return { payload: { ...value, id: value.id || crypto.randomUUID() } };
      },
      reducer(state, { payload }) {
        if (!state.compose) state.compose = payload;
      },
    },
    composeClosed(state) {
      state.compose = null;
    },
    notify: {
      prepare(value) {
        return { payload: { ...value, id: crypto.randomUUID() } };
      },
      reducer(state, { payload }) {
        state.notification = payload;
      },
    },
    notificationDismissed(state) {
      state.notification = null;
    },
    storageFailed(state) {
      state.storageError = true;
    },
  },
});
export const {
  composeOpened,
  composeClosed,
  notify,
  notificationDismissed,
  storageFailed,
} = slice.actions;
export default slice.reducer;
