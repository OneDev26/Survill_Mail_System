import { combineReducers } from "@reduxjs/toolkit";
import mail from "./slice/mailSlice";
import auth from "./slice/authSlice";
import profile from "./slice/profileSlice";
import settings from "./slice/settingsSlice";
import workspace from "./slice/workspaceSlice";
import ui from "./slice/uiSlice";
import admin from "./slice/adminSlice";
import { accountKeys, newAccount, snapshot } from "../api/accountState";
import { accountId, canAdminister, sessionUser } from "../utils/access";

const combined = combineReducers({
  mail,
  auth,
  profile,
  settings,
  workspace,
  ui,
  admin,
  accounts: (state = {}) => state,
});
const emptyMail = { messages: [], labels: [], customFolders: [], undo: null };
export function rootReducer(state, action) {
  // A hidden link is not sufficient: reject admin mutations for member sessions.
  if (state && action.type.startsWith("admin/")) {
    if (!canAdminister(state)) return state;
    action = {
      ...action,
      payload: { ...action.payload, actor: state.auth.session.email },
    };
  }
  if (state && action.type === "auth/signedIn") {
    const user = sessionUser({ ...state, auth: action.payload });
    if (!user) return state;
    const id = accountId(user);
    const account = state.accounts[id] || newAccount(user);
    state = {
      ...state,
      ...account,
      profile: { ...account.profile, id, email: user.email },
      ui: {
        compose: null,
        notification: null,
        storageError: state.ui.storageError,
      },
    };
  }
  let next = combined(state, action);
  const user = sessionUser(next);
  if (next.auth.session && !user)
    next = { ...next, auth: { session: null, remember: false } };
  const id = user ? accountId(user) : null;
  if (
    id &&
    (action.type === "auth/signedIn" ||
      accountKeys.some((key) => next[key] !== state?.[key]))
  ) {
    next = { ...next, accounts: { ...next.accounts, [id]: snapshot(next) } };
  }
  // Simulate delivery only to active local directory mailboxes. Preserve separate
  // recipient copies and strip Bcc; external mail is never actually delivered.
  if (
    id &&
    action.type === "mail/saveMessage" &&
    action.payload.folder === "Sent"
  ) {
    const message = action.payload;
    const previous = state?.mail.messages.find(
      (item) => item.id === message.id,
    );
    if (!previous || previous.folder === "Drafts") {
      const recipients = new Set(
        [message.to, message.cc, message.bcc]
          .filter(Boolean)
          .flatMap((value) =>
            value.split(",").map((address) => address.trim().toLowerCase()),
          ),
      );
      for (const recipient of next.admin.users.filter(
        (item) =>
          item.status === "Active" && recipients.has(item.email.toLowerCase()),
      )) {
        const recipientId = accountId(recipient);
        const account = next.accounts[recipientId] || newAccount(recipient);
        const received = {
          ...message,
          id: `${message.id}:received:${recipientId}`,
          sender: next.profile.name,
          email: next.profile.email,
          bcc: "",
          folder: "Inbox",
          unread: true,
          starred: false,
          label: "",
        };
        if (account.mail.messages.some((item) => item.id === received.id))
          continue;
        const updated = {
          ...account,
          mail: {
            ...account.mail,
            messages: [received, ...account.mail.messages],
          },
        };
        next = {
          ...next,
          accounts: { ...next.accounts, [recipientId]: updated },
          ...(recipientId === id ? { mail: updated.mail } : {}),
        };
      }
    }
  }
  if (!next.auth.session && state?.auth.session) {
    next = {
      ...next,
      mail: emptyMail,
      profile: { ...next.profile, name: "", email: "", avatar: "" },
      workspace: { contacts: [], tasks: [], notes: [], events: [] },
      ui: {
        compose: null,
        notification: null,
        storageError: next.ui.storageError,
      },
    };
  }
  return next;
}
