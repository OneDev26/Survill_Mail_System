import { defaultMail } from "../redux/slice/mailSlice";
import { defaultProfile } from "../redux/slice/profileSlice";
import { defaultSettings } from "../redux/slice/settingsSlice";
import { defaultWorkspace } from "../redux/slice/workspaceSlice";
import { accountId } from "../utils/access";

export const accountKeys = ["mail", "profile", "settings", "workspace"];
export const isMessages = (value) =>
  Array.isArray(value) &&
  value.every(
    (m) =>
      m &&
      typeof m.id === "string" &&
      typeof m.subject === "string" &&
      typeof m.sender === "string" &&
      typeof m.body === "string" &&
      typeof m.folder === "string" &&
      Array.isArray(m.attachments) &&
      Number.isFinite(Date.parse(m.date)),
  );
export const validMail = (value) =>
  value &&
  isMessages(value.messages) &&
  Array.isArray(value.labels) &&
  value.labels.every((l) => typeof l.name === "string") &&
  Array.isArray(value.customFolders) &&
  value.customFolders.every((f) => typeof f === "string");
export const validWorkspace = (value) =>
  value &&
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
  value.events.every((item) =>
    ["date", "time", "endTime"].every((key) => typeof item[key] === "string"),
  );
export const validSettings = (value) =>
  value &&
  [10, 20, 50].includes(value.pageSize) &&
  typeof value.signature === "string" &&
  ["compact", "markReadOnOpen", "useSignature", "confirmTrash"].every(
    (key) => typeof value[key] === "boolean",
  );
export const validProfile = (value) =>
  value &&
  Object.keys(defaultProfile).every((key) => typeof value[key] === "string");
export const validAccounts = (value) =>
  value &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  Object.entries(value).every(
    ([id, item]) =>
      validMail(item.mail) &&
      validProfile(item.profile) &&
      item.profile.id === id &&
      validSettings(item.settings) &&
      validWorkspace(item.workspace),
  );
export function newAccount(user) {
  if (user.id === "owner")
    return {
      mail: defaultMail,
      profile: defaultProfile,
      settings: defaultSettings,
      workspace: defaultWorkspace,
    };
  return {
    mail: { ...defaultMail, messages: [], undo: null },
    profile: {
      ...defaultProfile,
      id: accountId(user),
      name: user.name,
      email: user.email,
      title: "",
      phone: "",
      location: "",
      bio: "",
      avatar: "",
    },
    settings: { ...defaultSettings, signature: `Best,\n${user.name}` },
    workspace: { contacts: [], tasks: [], notes: [], events: [] },
  };
}
export function snapshot(state) {
  return Object.fromEntries(
    accountKeys.map((key) => [
      key,
      key === "mail" ? { ...state.mail, undo: null } : state[key],
    ]),
  );
}
