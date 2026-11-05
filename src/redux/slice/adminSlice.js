import { createSlice } from "@reduxjs/toolkit";
import * as thunks from "../thunks/adminThunks";
import { trackRequests } from "../requestState";

const slice = createSlice({
  name: "admin",
  initialState: { requests: {}, data: {} },
  reducers: {},
  extraReducers: (builder) => {
    const reads = [
      thunks.fetchAdminUsers,
      thunks.fetchInboundLog,
      thunks.fetchAuditLog,
      thunks.fetchAdminOverview,
      thunks.fetchAdminOverviewSummary,
      thunks.fetchAdminReports,
      thunks.fetchAdminReportsSummary,
      thunks.fetchAdminDomains,
      thunks.fetchAdminAliases,
      thunks.fetchSenderControls,
      thunks.fetchRoutingRules,
      thunks.fetchStores,
      thunks.fetchAdminSecurity,
    ];
    for (const thunk of reads) {
      builder.addCase(thunk.fulfilled, (state, action) => {
        if (
          state.requests[thunk.typePrefix]?.requestId === action.meta.requestId
        )
          state.data[thunk.typePrefix] = action.payload;
      });
    }
    // Invalidate in-flight list reads after writes so old responses cannot undo a save.
    const mutations = [
      [thunks.createAdminDomain, thunks.fetchAdminDomains],
      [thunks.updateAdminDomain, thunks.fetchAdminDomains],
      [thunks.deleteAdminDomain, thunks.fetchAdminDomains],
      [thunks.createAdminAlias, thunks.fetchAdminAliases],
      [thunks.deleteAdminAlias, thunks.fetchAdminAliases],
      [thunks.createSenderControl, thunks.fetchSenderControls],
      [thunks.updateSenderControl, thunks.fetchSenderControls],
      [thunks.deleteSenderControl, thunks.fetchSenderControls],
      [thunks.createRoutingRule, thunks.fetchRoutingRules],
      [thunks.updateRoutingRule, thunks.fetchRoutingRules],
      [thunks.deleteRoutingRule, thunks.fetchRoutingRules],
      [thunks.createStore, thunks.fetchStores],
      [thunks.updateStore, thunks.fetchStores],
      [thunks.deleteStore, thunks.fetchStores],
      [thunks.updateAdminSecurity, thunks.fetchAdminSecurity],
    ];
    for (const [write, read] of mutations) {
      builder.addCase(write.fulfilled, (state) => {
        delete state.data[read.typePrefix];
        delete state.requests[read.typePrefix];
      });
    }
    trackRequests(builder, Object.values(thunks));
  },
});
export default slice.reducer;
