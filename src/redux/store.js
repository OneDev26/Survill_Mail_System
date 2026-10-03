import { configureStore } from "@reduxjs/toolkit";
import { defaultMail } from "./slice/mailSlice";
import { defaultProfile } from "./slice/profileSlice";
import { defaultSettings } from "./slice/settingsSlice";
import { defaultWorkspace } from "./slice/workspaceSlice";
import { storageFailed } from "./slice/uiSlice";
import { readStorage, writeStorage } from "../api/storage";
import { loadMessages } from "../api/mailStorage";
import { defaultAdmin, validAdmin } from "../api/adminData";
import {
  accountKeys,
  isMessages,
  validMail,
  validProfile,
  validSettings,
  validWorkspace,
  validAccounts,
  newAccount,
} from "../api/accountState";
import { accountId, sessionUser } from "../utils/access";
import { rootReducer } from "./rootReducer";

const admin = readStorage("admin", defaultAdmin, validAdmin);
const validSession = (value) =>
  typeof value?.remember === "boolean" &&
  Boolean(sessionUser({ auth: value, admin }));
const auth =
  readStorage("auth", null, validSession) ||
  readStorage("auth", { session: null, remember: false }, validSession, true);
const legacy = loadMessages();
const owner = {
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
  profile: readStorage(
    "profile",
    defaultProfile,
    (value) =>
      validProfile(value) &&
      value.id === defaultProfile.id &&
      value.email === defaultProfile.email,
  ),
  settings: readStorage("settings", defaultSettings, validSettings),
  workspace: readStorage("workspace", defaultWorkspace, validWorkspace),
};
const accounts = {
  "alex-morgan": owner,
  ...readStorage("accounts", {}, validAccounts),
};
for (const user of admin.users) {
  const id = accountId(user);
  if (!accounts[id]) accounts[id] = newAccount(user);
  // Directory identity is authoritative, even when the address is edited.
  accounts[id] = {
    ...accounts[id],
    profile: { ...accounts[id].profile, email: user.email, id },
  };
}
const current = sessionUser({ auth, admin });
const active = current ? accounts[accountId(current)] : owner;
export const store = configureStore({
  reducer: rootReducer,
  preloadedState: {
    ...active,
    mail: { ...active.mail, undo: null },
    auth,
    admin,
    accounts,
  },
});
let previous = store.getState();
store.subscribe(() => {
  const state = store.getState();
  const before = previous;
  previous = state;
  let success = true;
  for (const key of ["admin", "accounts"]) {
    if (before[key] !== state[key])
      success = writeStorage(key, state[key]) && success;
  }
  // Maintain original owner keys for existing installations and older versions.
  const ownerBefore = before.accounts["alex-morgan"];
  const ownerAfter = state.accounts["alex-morgan"];
  for (const key of accountKeys) {
    if (ownerBefore?.[key] !== ownerAfter?.[key])
      success = writeStorage(key, ownerAfter[key]) && success;
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
