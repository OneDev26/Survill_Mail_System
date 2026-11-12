import { useState } from "react";
import Dialog from "../Dialog";
import { sharedActions } from "../../redux/thunks/sharedMailboxThunks";

export default function ConversationEditor({ record, resource, onClose }) {
  const [form, setForm] = useState(
    record
      ? { status: record.status || "pending", access: record.access || "Open" }
      : {
          mailbox: "",
          conversation: "",
          note: "",
          status: "pending",
          access: "Open",
        },
  );
  const [error, setError] = useState("");
  async function save(event) {
    event.preventDefault();
    setError("");
    const body = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [key, value.trim()]),
    );
    const required = record
      ? ["status", "access"]
      : ["mailbox", "conversation", "status", "access"];
    if (required.some((key) => !body[key])) {
      setError("Complete the required fields.");
      return;
    }
    if (
      await resource.run(
        record
          ? sharedActions.update({ id: record.id, body })
          : sharedActions.create(body),
      )
    )
      onClose();
  }
  return (
    <Dialog
      title={record ? "Conversation settings" : "New conversation"}
      onClose={() => {
        if (!resource.busy) onClose();
      }}
    >
      <form className="space-y-4 p-6" onSubmit={save}>
        <fieldset disabled={resource.busy} className="space-y-4">
          {!record && (
            <>
              <p className="text-sm text-slate-500">
                Create a conversation record for your team. This does not send
                an email.
              </p>
              {[
                ["mailbox", "Mailbox", "email"],
                ["conversation", "Contact email", "email"],
              ].map(([key, label, type]) => (
                <label className="block text-sm" key={key}>
                  {label}
                  <input
                    aria-label={label}
                    className="field mt-1"
                    type={type}
                    required
                    value={form[key]}
                    onChange={(event) =>
                      setForm({ ...form, [key]: event.target.value })
                    }
                  />
                </label>
              ))}
              <label className="block text-sm">
                Context note
                <textarea
                  aria-label="Context note"
                  className="field mt-1"
                  rows={4}
                  value={form.note}
                  onChange={(event) =>
                    setForm({ ...form, note: event.target.value })
                  }
                />
              </label>
            </>
          )}
          {record && (
            <label className="block text-sm">
              Status
              <select
                aria-label="Status"
                className="field mt-1"
                value={form.status}
                onChange={(event) =>
                  setForm({ ...form, status: event.target.value })
                }
              >
                {[
                  ...new Set(["pending", "approved", "rejected", form.status]),
                ].map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
          )}
          <label className="block text-sm">
            Access
            <select
              aria-label="Access"
              className="field mt-1"
              value={form.access}
              onChange={(event) =>
                setForm({ ...form, access: event.target.value })
              }
            >
              {[...new Set(["Open", "Restricted", form.access])].map(
                (value) => (
                  <option key={value}>{value}</option>
                ),
              )}
            </select>
          </label>
          {(error || resource.error) && (
            <p role="alert" className="text-sm text-red-600">
              {error || resource.error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="btn-primary">
              {resource.busy ? "Saving…" : "Save conversation"}
            </button>
          </div>
        </fieldset>
      </form>
    </Dialog>
  );
}
