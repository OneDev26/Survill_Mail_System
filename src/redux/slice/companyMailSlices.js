import { createSlice } from "@reduxjs/toolkit";
import { trackRequests } from "../requestState";
import {
  directoryActions,
  sharedActions,
  scheduledActions,
  snoozedActions,
  approvalActions,
} from "../thunks/companyMailThunks";

function collectionSlice(name, actions) {
  return createSlice({
    name,
    initialState: {
      items: null,
      total: null,
      filter: null,
      requests: {},
      stale: false,
    },
    reducers: {},
    extraReducers(builder) {
      builder.addCase(actions.fetch.fulfilled, (state, action) => {
        if (
          state.requests[actions.fetch.typePrefix]?.requestId !==
          action.meta.requestId
        )
          return;
        state.items = action.payload.items;
        state.total = action.payload.total ?? action.payload.items.length;
        state.filter = action.payload.filter ?? null;
        state.stale = false;
      });
      for (const thunk of [
        actions.create,
        actions.update,
        actions.remove,
      ].filter(Boolean)) {
        builder.addCase(thunk.fulfilled, (state) => {
          // Write response shapes are unspecified. The hook re-reads confirmed data.
          state.stale = true;
          delete state.requests[actions.fetch.typePrefix];
        });
      }
      trackRequests(builder, Object.values(actions));
    },
  }).reducer;
}
export const directory = collectionSlice("directory", directoryActions);
export const shared = collectionSlice("shared", sharedActions);
export const scheduled = collectionSlice("scheduled", scheduledActions);
export const snoozed = collectionSlice("snoozed", snoozedActions);
export const approvals = collectionSlice("approvals", approvalActions);
