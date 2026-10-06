export const systemFolders = [
  "Inbox",
  "Starred",
  "Drafts",
  "Outbox",
  "Snooze",
  "Sent",
  "Archive",
  "Spam",
  "Trash",
  "Template",
  "Notifications",
  "Newsletter",
];
export function initials(name = "") {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "AM"
  );
}
export function belongsToFolder(message, folder) {
  if (folder === "Starred")
    return message.starred && !["Trash", "Spam"].includes(message.folder);
  if (folder.startsWith("label:"))
    return (
      message.label === folder.slice(6) &&
      !["Trash", "Spam"].includes(message.folder)
    );
  return message.folder === folder;
}
export function filterMessages(
  messages,
  { folder, query = "", filter = "All", sort = "newest", attachments = false },
) {
  const search = query.trim().toLowerCase();
  return messages
    .filter(
      (m) =>
        belongsToFolder(m, folder) &&
        (filter !== "Unread" || m.unread) &&
        (filter !== "Starred" || m.starred) &&
        (!attachments || m.attachments.length > 0) &&
        [m.sender, m.email, m.to, m.cc, m.subject, m.body]
          .join(" ")
          .toLowerCase()
          .includes(search),
    )
    .sort((a, b) =>
      sort === "newest"
        ? new Date(b.date) - new Date(a.date)
        : new Date(a.date) - new Date(b.date),
    );
}
export function replyRecipients(message, ownEmail, all = false) {
  const values = [
    message.email === ownEmail ? message.to : message.email,
    ...(all ? [message.to, message.cc] : []),
  ];
  return [
    ...new Set(
      values
        .flatMap((value) => (value || "").split(","))
        .map((value) => value.trim())
        .filter(
          (value) => value && value.toLowerCase() !== ownEmail.toLowerCase(),
        ),
    ),
  ].join(", ");
}
