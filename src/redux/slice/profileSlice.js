import { createSlice } from "@reduxjs/toolkit";

export const defaultProfile = {
  id: "alex-morgan",
  name: "Alex Morgan",
  email: "alex.morgan@studio.co",
  title: "Product Designer",
  company: "Studio",
  phone: "+1 415 555 0124",
  location: "San Francisco, CA",
  bio: "Creating thoughtful experiences with the Studio team.",
  avatar: "",
};
const slice = createSlice({
  name: "profile",
  initialState: defaultProfile,
  reducers: {
    profileUpdated(state, { payload }) {
      for (const key of [
        "name",
        "title",
        "company",
        "phone",
        "location",
        "bio",
        "avatar",
      ]) {
        if (typeof payload[key] === "string") state[key] = payload[key];
      }
    },
  },
});
export const { profileUpdated } = slice.actions;
export default slice.reducer;
