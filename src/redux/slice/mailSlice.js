import { createSlice } from "@reduxjs/toolkit";
import { demoMessages, labels } from "../../api/demoData";

export const defaultMail = {
  messages: demoMessages,
  labels,
  customFolders: [],
  undo: null,
};
const allowedChanges = ["folder", "unread", "label", "starred"];
const slice = createSlice({
  name: "mail",
  initialState: defaultMail,
  reducers: {
    updateMessages(state, { payload: { ids, changes } }) {
      const clean = Object.fromEntries(
        Object.entries(changes).filter(([key]) => allowedChanges.includes(key)),
      );
      state.undo = state.messages
        .filter((m) => ids.includes(m.id))
        .map((m) => ({
          id: m.id,
          changes: Object.fromEntries(
            Object.keys(clean).map((key) => [key, m[key]]),
          ),
        }));
      for (const message of state.messages)
        if (ids.includes(message.id)) Object.assign(message, clean);
    },
    messageRead(state, { payload }) {
      const message = state.messages.find((m) => m.id === payload);
      if (message) message.unread = false;
    },
    toggleStar(state, { payload }) {
      const message = state.messages.find((m) => m.id === payload);
      if (message) message.starred = !message.starred;
    },
    saveMessage(state, { payload }) {
      const index = state.messages.findIndex((item) => item.id === payload.id);
      if (index >= 0) state.messages[index] = payload;
      else state.messages.unshift(payload);
    },
    deleteMessages(state, { payload }) {
      state.messages = state.messages.filter((m) => !payload.includes(m.id));
      state.undo = null;
    },
    undoChange(state) {
      for (const item of state.undo || []) {
        const message = state.messages.find((m) => m.id === item.id);
        if (message) Object.assign(message, item.changes);
      }
      state.undo = null;
    },
    folderAdded(state, { payload }) {
      if (!state.customFolders.includes(payload))
        state.customFolders.push(payload);
    },
    folderDeleted(state, { payload }) {
      state.customFolders = state.customFolders.filter(
        (name) => name !== payload,
      );
      for (const m of state.messages)
        if (m.folder === payload) m.folder = "Inbox";
      state.undo = null;
    },
    labelSaved(state, { payload }) {
      const index = state.labels.findIndex((l) => l.name === payload.name);
      if (index >= 0) state.labels[index] = payload;
      else state.labels.push(payload);
    },
    labelDeleted(state, { payload }) {
      state.labels = state.labels.filter((l) => l.name !== payload);
      for (const m of state.messages) if (m.label === payload) m.label = "";
      state.undo = null;
    },
  },
});
export const {
  updateMessages,
  messageRead,
  toggleStar,
  saveMessage,
  deleteMessages,
  undoChange,
  folderAdded,
  folderDeleted,
  labelSaved,
  labelDeleted,
} = slice.actions;
export default slice.reducer;
