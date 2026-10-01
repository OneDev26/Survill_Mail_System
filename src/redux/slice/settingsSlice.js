import { createSlice } from "@reduxjs/toolkit";
export const defaultSettings = {
  compact: false,
  pageSize: 10,
  markReadOnOpen: true,
  signature: "Best,\nAlex Morgan\nProduct Designer · Studio",
  useSignature: true,
  confirmTrash: false,
};
const slice = createSlice({
  name: "settings",
  initialState: defaultSettings,
  reducers: {
    settingsUpdated(state, { payload }) {
      Object.assign(state, payload);
    },
  },
});
export const { settingsUpdated } = slice.actions;
export default slice.reducer;
