import { createSlice } from "@reduxjs/toolkit";

// Unsaved reply text only, scoped to a mailbox/record. Cleared by root session reset.
const slice = createSlice({
  name: "sharedMailboxDrafts",
  initialState: {},
  reducers: {
    replyDraftChanged(state, { payload: { key, text } }) {
      if (text) state[key] = text;
      else delete state[key];
    },
    replyDraftDiscarded(state, { payload: key }) {
      delete state[key];
    },
  },
});
export const { replyDraftChanged, replyDraftDiscarded } = slice.actions;
export default slice.reducer;
