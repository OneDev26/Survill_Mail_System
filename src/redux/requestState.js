import { isPending, isFulfilled, isRejected } from "@reduxjs/toolkit";

/** Track each domain request independently without storing credentials or files. */
export function trackRequests(builder, thunks) {
  builder
    .addMatcher(isPending(...thunks), (state, action) => {
      state.requests[action.type.replace(/\/pending$/, "")] = {
        status: "pending",
        error: null,
        requestId: action.meta.requestId,
      };
    })
    .addMatcher(isFulfilled(...thunks), (state, action) => {
      const request = state.requests[action.type.replace(/\/fulfilled$/, "")];
      if (request?.requestId === action.meta.requestId)
        request.status = "succeeded";
    })
    .addMatcher(isRejected(...thunks), (state, action) => {
      const request = state.requests[action.type.replace(/\/rejected$/, "")];
      if (request?.requestId !== action.meta.requestId) return;
      request.status = action.meta.aborted ? "idle" : "failed";
      request.error = action.meta.aborted
        ? null
        : action.payload || action.error;
    });
}
