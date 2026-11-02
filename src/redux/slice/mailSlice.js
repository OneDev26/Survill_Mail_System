import { createSlice } from "@reduxjs/toolkit";
import { folderName, labelModel } from "../../api/models";
import { login, restoreSession } from "../thunks/authThunks";
import * as thunks from "../thunks/mailThunks";
import { trackRequests } from "../requestState";

function applyFolders(state, payload) {
  state.folders = payload.folders;
  state.labels = payload.labels.map(labelModel);
  state.customFolders = payload.folders
    .filter((folder) => folder.kind === "custom")
    .map(folderName);
  state.starredCount = payload.starredCount;
}
const slice = createSlice({
  name: "mail",
  initialState: {
    folders: [],
    labels: [],
    customFolders: [],
    starredCount: 0,
    undo: null,
    revision: 0,
    requests: {},
  },
  reducers: {
    mailboxInvalidated(state) {
      state.revision++;
    },
  },
  extraReducers: (builder) => {
    for (const thunk of [login, restoreSession, thunks.fetchFolders]) {
      builder.addCase(thunk.fulfilled, (state, { payload }) =>
        applyFolders(state, payload),
      );
    }
    builder.addCase(
      thunks.bulkUpdateMessages.fulfilled,
      (state, { payload }) => {
        state.undo = payload.undo;
        state.revision++;
      },
    );
    builder.addCase(thunks.undoMailChange.fulfilled, (state) => {
      state.undo = null;
      state.revision++;
    });
    for (const thunk of [
      thunks.deleteMessages,
      thunks.emptyFolder,
      thunks.sendDraft,
      thunks.discardDraft,
      thunks.createFolder,
      thunks.deleteFolder,
      thunks.createLabel,
      thunks.deleteLabel,
    ]) {
      builder.addCase(thunk.fulfilled, (state) => {
        state.revision++;
        state.undo = null;
      });
    }
    trackRequests(builder, Object.values(thunks));
  },
});
export const { mailboxInvalidated } = slice.actions;
export default slice.reducer;
