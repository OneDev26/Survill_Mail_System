export const systemFolders = [
  "Inbox",
  "Starred",
  "Drafts",
  "Sent",
  "Archive",
  "Spam",
  "Trash",
];
export function initials(name = "") {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "?"
  );
}
