import { backend } from "../../api/backend";
import { createApiThunk } from "./createApiThunk";

export const fetchFolders = createApiThunk("mail/fetchFolders", async () => {
  const [folders, labels] = await Promise.all([
    backend.folders(),
    backend.labels(),
  ]);
  return { ...folders, ...labels };
});
export const fetchMessages = createApiThunk(
  "mail/fetchMessages",
  (query, { signal }) => backend.messages(query, { signal }),
);
export const fetchMessage = createApiThunk(
  "mail/fetchMessage",
  ({ id, markRead }) => backend.message(id, markRead),
);
export const bulkUpdateMessages = createApiThunk("mail/bulkUpdate", (body) =>
  backend.bulk(body),
);
export const markFolderRead = createApiThunk("mail/markFolderRead", (id) =>
  backend.markFolderRead(id),
);
export const deleteMessages = createApiThunk("mail/deleteMessages", (ids) =>
  backend.deleteMessages(ids),
);
export const emptyFolder = createApiThunk("mail/emptyFolder", (kind) =>
  backend.emptyFolder(kind),
);
export const undoMailChange = createApiThunk(
  "mail/undo",
  async (_, { getState }) => {
    const undo = getState().mail.undo;
    if (undo) await backend.bulk(undo);
  },
);
export const createFolder = createApiThunk("mail/createFolder", (name) =>
  backend.createFolder(name),
);
export const deleteFolder = createApiThunk("mail/deleteFolder", (id) =>
  backend.deleteFolder(id),
);
export const createLabel = createApiThunk("mail/createLabel", (label) =>
  backend.createLabel(label),
);
export const deleteLabel = createApiThunk("mail/deleteLabel", (id) =>
  backend.deleteLabel(id),
);
export const createDraft = createApiThunk("mail/createDraft", (body) =>
  backend.createDraft(body),
);
export const saveDraft = createApiThunk("mail/saveDraft", ({ id, body }) =>
  backend.saveDraft(id, body),
);
export const discardDraft = createApiThunk("mail/discardDraft", (id) =>
  backend.discardDraft(id),
);
export const uploadAttachments = createApiThunk(
  "mail/uploadAttachments",
  ({ id, files }) => backend.attach(id, files),
);
export const removeAttachment = createApiThunk(
  "mail/removeAttachment",
  ({ id, attachmentId }) => backend.detach(id, attachmentId),
);
export const sendDraft = createApiThunk("mail/sendDraft", (id) =>
  backend.sendDraft(id),
);
export const fetchAttachment = createApiThunk("mail/fetchAttachment", (id) =>
  backend.attachment(id),
);
export const suggestRecipients = createApiThunk(
  "mail/suggestRecipients",
  (query) => backend.suggest(query),
);
