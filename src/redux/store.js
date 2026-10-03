import { configureStore } from "@reduxjs/toolkit";
import mail, { defaultMail } from "./slice/mailSlice";
import auth from "./slice/authSlice";
import profile, { defaultProfile } from "./slice/profileSlice";
import settings, { defaultSettings } from "./slice/settingsSlice";
import workspace, { defaultWorkspace } from "./slice/workspaceSlice";
import ui, { storageFailed } from "./slice/uiSlice";
import { readStorage, writeStorage } from "../api/storage";
import { loadMessages } from "../api/mailStorage";
import admin from "./slice/adminSlice";
import { defaultAdmin, validAdmin } from "../api/adminData";

const validSession = (value) =>
  value?.session?.userId === "alex-morgan" &&
  typeof value.remember === "boolean";
const isMessages = (value) =>
  Array.isArray(value) &&
  value.every(
    (m) =>
      typeof m.id === "string" &&
      typeof m.subject === "string" &&
      typeof m.sender === "string" &&
      typeof m.body === "string" &&
      typeof m.folder === "string" &&
      Array.isArray(m.attachments) &&
      Number.isFinite(Date.parse(m.date)),
  );
const validMail = (value) =>
  isMessages(value.messages) &&
  Array.isArray(value.labels) &&
  value.labels.every((l) => typeof l.name === "string") &&
  Array.isArray(value.customFolders) &&
  value.customFolders.every((f) => typeof f === "string");
const validWorkspace = (value) =>
  ["contacts", "tasks", "notes", "events"].every(
    (key) =>
      Array.isArray(value[key]) &&
      value[key].every(
        (item) =>
          typeof item.id === "string" &&
          typeof (item.title ?? item.name) === "string",
      ),
  ) &&
  value.contacts.every((item) => typeof item.email === "string") &&
  value.notes.every((item) => typeof item.body === "string") &&
  value.tasks.every((item) => typeof item.done === "boolean") &&
  value.events.every(
    (item) =>
      typeof item.date === "string" &&
      typeof item.time === "string" &&
      typeof item.endTime === "string",
  );
const persistedAuth =
  readStorage("auth", null, validSession) ||
  readStorage("auth", { session: null, remember: false }, validSession, true);
const legacy = loadMessages();
export const store = configureStore({
  reducer: { mail, auth, profile, settings, workspace, ui, admin },
  preloadedState: {
    admin: readStorage("admin", defaultAdmin, validAdmin),
    mail: {
      ...readStorage(
        "mail",
        {
          ...defaultMail,
          messages: isMessages(legacy) ? legacy : defaultMail.messages,
        },
        validMail,
      ),
      undo: null,
    },
    auth: persistedAuth,
    profile: {
      ...defaultProfile,
      ...readStorage(
        "profile",
        {},
        (value) =>
          Object.keys(defaultProfile).every(
            (key) => typeof value[key] === "string",
          ) &&
          value.email === defaultProfile.email &&
          value.id === defaultProfile.id,
      ),
    },
    settings: {
      ...defaultSettings,
      ...readStorage(
        "settings",
        {},
        (value) =>
          [10, 20, 50].includes(value.pageSize) &&
          typeof value.signature === "string" &&
          ["compact", "markReadOnOpen", "useSignature", "confirmTrash"].every(
            (key) => typeof value[key] === "boolean",
          ),
      ),
    },
    workspace: readStorage("workspace", defaultWorkspace, validWorkspace),
  },
});
let previous = store.getState();
store.subscribe(() => {
  const state = store.getState();
  const before = previous;
  previous = state;
  let success = true;
  for (const key of ["mail", "profile", "settings", "workspace", "admin"]) {
    if (before[key] !== state[key])
      success =
        writeStorage(
          key,
          key === "mail" ? { ...state.mail, undo: null } : state[key],
        ) && success;
  }
  if (before.auth !== state.auth) {
    success =
      writeStorage(
        "auth",
        state.auth.remember && state.auth.session ? state.auth : null,
      ) && success;
    success =
      writeStorage(
        "auth",
        !state.auth.remember && state.auth.session ? state.auth : null,
        true,
      ) && success;
  }
  if (!success && !state.ui.storageError) store.dispatch(storageFailed());
});
