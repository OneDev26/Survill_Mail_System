import { initials } from "../utils/mail";
export function signatureText(html = "") {
  return new DOMParser()
    .parseFromString(
      html.replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n"),
      "text/html",
    )
    .body.textContent.trim();
}
export const folderName = (folder) =>
  folder.kind === "custom"
    ? folder.name
    : folder.kind[0].toUpperCase() + folder.kind.slice(1);
export const userModel = (user) => ({
  ...user,
  name: user.displayName,
});
export const profileModel = (user) => ({
  id: user.id,
  email: user.email,
  name: user.displayName,
  avatar: user.avatarUrl || "",
  recoveryEmail: user.recoveryEmail || "",
});
export const labelModel = (label) => ({
  ...label,
  dot: "bg-violet-400",
  badge: "bg-violet-50 text-violet-600",
});
export function messageModel(message, folders = [], labels = []) {
  const date = message.sentAt || message.receivedAt || message.updatedAt;
  const addresses = (items) =>
    (items || []).map((item) => item.email).join(", ");
  return {
    ...message,
    sender: message.from?.displayName || message.from?.email || "Unknown",
    email: message.from?.email || "",
    initials: initials(message.from?.displayName),
    color: "violet",
    to: addresses(message.to),
    cc: addresses(message.cc),
    bcc: addresses(message.bcc),
    replyTo: addresses(message.replyTo),
    body: message.bodyText || "",
    html: message.bodyHtml || "",
    preview: message.snippet || "",
    date,
    time: date
      ? new Date(date).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "",
    folder: folderName(
      folders.find((f) => f.id === message.folderId) || {
        kind: message.folderKind || "inbox",
        name: "",
      },
    ),
    unread: !message.isRead,
    starred: message.isStarred,
    label: labels.find((l) => message.labelIds?.includes(l.id))?.name || "",
    attachments: (message.attachments || []).map((a) => ({
      ...a,
      name: a.filename,
      bytes: a.size,
      size: `${Math.ceil(a.size / 1024)} KB`,
    })),
  };
}
const localDate = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
export function workspaceModel(kind, item) {
  if (kind === "tasks")
    return {
      ...item,
      due: item.dueDate?.slice(0, 10) || "",
      done: item.completed,
    };
  if (kind === "events") {
    const start = new Date(item.startAt),
      end = new Date(item.endAt);
    const time = (date) =>
      `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
    return {
      ...item,
      date: localDate(start),
      endDate: localDate(end),
      time: time(start),
      endTime: time(end),
    };
  }
  return item;
}
export function workspaceBody(kind, item) {
  const pick = (keys) =>
    Object.fromEntries(
      keys
        .filter((key) => item[key] !== undefined)
        .map((key) => [key, item[key]]),
    );
  if (kind === "tasks")
    return {
      ...pick(["title", "notes", "priority"]),
      dueDate: item.due || null,
      completed: !!item.done,
    };
  if (kind === "events")
    return {
      ...pick(["title", "description", "location", "allDay"]),
      startAt: new Date(`${item.date}T${item.time}`).toISOString(),
      endAt: new Date(
        `${item.endDate || item.date}T${item.endTime}`,
      ).toISOString(),
    };
  return pick(
    kind === "contacts"
      ? ["name", "email", "phone", "company", "notes"]
      : ["title", "body", "color", "pinned"],
  );
}
