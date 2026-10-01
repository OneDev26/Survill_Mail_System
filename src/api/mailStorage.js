import { demoMessages } from "./demoData";
const STORAGE_KEY = "studio-mail-demo-v1";
export function loadMessages() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (
      Array.isArray(saved) &&
      saved.every(
        (message) =>
          message &&
          typeof message.id === "string" &&
          typeof message.body === "string" &&
          typeof message.subject === "string" &&
          typeof message.sender === "string" &&
          Array.isArray(message.attachments),
      )
    )
      return saved;
  } catch {
    /* A fresh demo remains available if browser storage is unavailable. */
  }
  return demoMessages;
}
export function saveMessages(messages) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    return true;
  } catch {
    return false;
  }
}
