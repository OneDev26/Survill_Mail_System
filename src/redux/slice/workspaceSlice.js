import { createSlice } from "@reduxjs/toolkit";
import { demoMessages } from "../../api/demoData";
const today = new Date().toISOString().slice(0, 10);
export const defaultWorkspace = {
  contacts: demoMessages
    .filter((m) => m.sender !== "Me")
    .filter(
      (m, index, all) =>
        all.findIndex((item) => item.email === m.email) === index,
    )
    .map((m) => ({
      id: m.id,
      name: m.sender,
      email: m.email,
      phone: "",
      company: "Studio",
    })),
  tasks: [
    {
      id: "task-1",
      title: "Review the website redesign",
      done: false,
      due: today,
    },
    {
      id: "task-2",
      title: "Share launch checklist with James",
      done: false,
      due: today,
    },
  ],
  notes: [
    {
      id: "note-1",
      title: "Ideas for the next sprint",
      body: "Improve onboarding\nReview the new navigation\nSchedule a team design review",
    },
  ],
  events: [
    {
      id: "event-1",
      title: "Design catch-up",
      date: today,
      time: "14:30",
      endTime: "15:15",
      location: "Studio meeting room",
      description: "Review the latest website designs with Sophia.",
    },
  ],
};
const slice = createSlice({
  name: "workspace",
  initialState: defaultWorkspace,
  reducers: {
    itemSaved(state, { payload: { collection, item } }) {
      if (!Object.hasOwn(state, collection)) return;
      const index = state[collection].findIndex(
        (value) => value.id === item.id,
      );
      if (index >= 0) state[collection][index] = item;
      else state[collection].unshift(item);
    },
    itemDeleted(state, { payload: { collection, id } }) {
      if (Object.hasOwn(state, collection))
        state[collection] = state[collection].filter((item) => item.id !== id);
    },
  },
});
export const { itemSaved, itemDeleted } = slice.actions;
export default slice.reducer;
