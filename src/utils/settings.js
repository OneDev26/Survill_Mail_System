export const defaultSettings = {
  compact: false,
  pageSize: 10,
  markReadOnOpen: true,
  signature: "",
  useSignature: true,
  confirmTrash: false,
};
export function normalizeSettings(preferences = {}, signature = "") {
  preferences = preferences || {};
  const compact = preferences.compactMessageList ?? preferences.compact;
  const pageSize = preferences.messagesPerPage ?? preferences.pageSize;
  const markReadOnOpen =
    preferences.markAsReadWhenOpened ?? preferences.markReadOnOpen;
  const confirmTrash =
    preferences.confirmBeforeMovingToTrash ?? preferences.confirmTrash;
  return {
    compact: typeof compact === "boolean" ? compact : false,
    pageSize: Number.isSafeInteger(pageSize) && pageSize > 0 ? pageSize : 10,
    markReadOnOpen: typeof markReadOnOpen === "boolean" ? markReadOnOpen : true,
    signature:
      typeof preferences.signature === "string"
        ? preferences.signature
        : signature,
    useSignature:
      typeof preferences.useSignature === "boolean"
        ? preferences.useSignature
        : true,
    confirmTrash: typeof confirmTrash === "boolean" ? confirmTrash : false,
  };
}
export function settingsPayload(settings) {
  return {
    compactMessageList: settings.compact,
    markAsReadWhenOpened: settings.markReadOnOpen,
    confirmBeforeMovingToTrash: settings.confirmTrash,
    messagesPerPage: settings.pageSize,
    useSignature: settings.useSignature,
    signature: settings.signature,
  };
}
