import { createAsyncThunk } from "@reduxjs/toolkit";

/** Keep Axios objects and tokens out of Redux; reject stale account responses. */
export function createApiThunk(type, operation, options) {
  return createAsyncThunk(
    type,
    async (argument, api) => {
      const generation = api.getState().auth.generation;
      try {
        const result = await operation(argument, api);
        if (generation !== api.getState().auth.generation) {
          return api.rejectWithValue({
            message: "The session changed. Please try again.",
            status: 401,
          });
        }
        return result;
      } catch (error) {
        return api.rejectWithValue({
          message: error.message || "The request failed.",
          status: error.response?.status || error.status || null,
          details: error.response?.data?.details || null,
        });
      }
    },
    options,
  );
}
