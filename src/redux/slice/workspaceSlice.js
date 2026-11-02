import { createSlice } from "@reduxjs/toolkit";
import {
  fetchWorkspace,
  saveWorkspaceItem,
  deleteWorkspaceItem,
} from "../thunks/workspaceThunks";
import { trackRequests } from "../requestState";

const slice = createSlice({
  name: "workspace",
  initialState: {
    contacts: [],
    tasks: [],
    notes: [],
    events: [],
    activeRequests: {},
    requests: {},
  },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchWorkspace.pending, (state, action) => {
      state.activeRequests[action.meta.arg] = action.meta.requestId;
    });
    builder.addCase(fetchWorkspace.fulfilled, (state, action) => {
      const { collection, items } = action.payload;
      if (state.activeRequests[collection] === action.meta.requestId)
        state[collection] = items;
    });
    builder.addCase(
      saveWorkspaceItem.fulfilled,
      (state, { payload: { collection, item } }) => {
        // An older list response must not overwrite a confirmed mutation.
        state.activeRequests[collection] = null;
        const index = state[collection].findIndex(
          (entry) => entry.id === item.id,
        );
        if (index === -1) state[collection].unshift(item);
        else state[collection][index] = item;
      },
    );
    builder.addCase(
      deleteWorkspaceItem.fulfilled,
      (state, { payload: { collection, id } }) => {
        state.activeRequests[collection] = null;
        state[collection] = state[collection].filter((item) => item.id !== id);
      },
    );
    trackRequests(builder, [
      fetchWorkspace,
      saveWorkspaceItem,
      deleteWorkspaceItem,
    ]);
  },
});
export default slice.reducer;
