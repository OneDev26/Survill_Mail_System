import { useState } from "react";
import Dialog from "./Dialog";

const fields = {
  contacts: [
    ["name", "Full name", "text", true],
    ["email", "Email address", "email", true],
    ["phone", "Phone number", "tel"],
    ["company", "Company", "text"],
  ],
  tasks: [
    ["title", "Task", "text", true],
    ["due", "Due date", "date"],
  ],
  notes: [
    ["title", "Title", "text", true],
    ["body", "Note", "textarea"],
  ],
  events: [
    ["title", "Event title", "text", true],
    ["date", "Date", "date", true],
    ["time", "Starts at", "time", true],
    ["endTime", "Ends at", "time", true],
    ["location", "Location", "text"],
    ["description", "Description", "textarea"],
  ],
};
const singular = {
  contacts: "contact",
  tasks: "task",
  notes: "note",
  events: "event",
};
export default function WorkspaceEditor({
  collection,
  initial,
  items,
  onSave,
  onClose,
}) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  function submit(event) {
    event.preventDefault();
    const value = Object.fromEntries(
      Object.entries(form).map(([key, item]) => [
        key,
        typeof item === "string" ? item.trim() : item,
      ]),
    );
    if (!(value.title || value.name)?.trim()) {
      setError("Please enter a name or title.");
      return;
    }
    if (
      collection === "contacts" &&
      items.some(
        (item) =>
          item.id !== value.id &&
          item.email.toLowerCase() === value.email.toLowerCase(),
      )
    ) {
      setError("A contact with this email address already exists.");
      return;
    }
    if (collection === "events" && value.endTime <= value.time) {
      setError("The end time must be after the start time.");
      return;
    }
    onSave({ ...value, id: value.id || crypto.randomUUID() });
  }
  return (
    <Dialog
      title={`${initial.id ? "Edit" : "New"} ${singular[collection]}`}
      onClose={onClose}
    >
      <form onSubmit={submit} className="space-y-4 p-6">
        {fields[collection].map(([key, label, type, required], index) => (
          <label key={key} className="block">
            <span className="field-label">
              {label}
              {required ? " *" : ""}
            </span>
            {type === "textarea" ? (
              <textarea
                className="field min-h-32"
                maxLength={10000}
                value={form[key] || ""}
                onChange={(event) =>
                  setForm({ ...form, [key]: event.target.value })
                }
              />
            ) : (
              <input
                autoFocus={index === 0}
                className="field"
                type={type}
                maxLength={200}
                required={required}
                value={form[key] || ""}
                onChange={(event) =>
                  setForm({ ...form, [key]: event.target.value })
                }
              />
            )}
          </label>
        ))}
        {error && (
          <p role="alert" className="text-xs text-red-600">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary">Save {singular[collection]}</button>
        </div>
      </form>
    </Dialog>
  );
}
