import { createSlice } from "@reduxjs/toolkit";
import * as thunks from "../thunks/adminThunks";
import { trackRequests } from "../requestState";

const slice = createSlice({
  name: "admin",
  initialState: { requests: {} },
  reducers: {},
  extraReducers: (builder) => {
    trackRequests(builder, Object.values(thunks));
  },
});
export default slice.reducer;
