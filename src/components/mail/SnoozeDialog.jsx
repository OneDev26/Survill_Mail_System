import { useState } from "react";
import Dialog from "../Dialog";

function localInput(date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

function suggestion(choice) {
  const date = new Date();
  if (choice === "later") date.setHours(date.getHours() + 3);
  if (choice === "tomorrow") {
    date.setDate(date.getDate() + 1);
    date.setHours(9, 0, 0, 0);
  }
  if (choice === "week") {
    date.setDate(date.getDate() + 7);
    date.setHours(9, 0, 0, 0);
  }
  return localInput(date);
}

export default function SnoozeDialog({
  message,
  busy,
  error,
  onClose,
  onSubmit,
}) {
  const [returnAt, setReturnAt] = useState(() => suggestion("tomorrow"));
  const [validation, setValidation] = useState("");

  async function submit(event) {
    event.preventDefault();
    const date = new Date(returnAt);
    if (!Number.isFinite(date.getTime()) || date <= new Date()) {
      setValidation("Choose a future date and time.");
      return;
    }
    setValidation("");
    await onSubmit(date.toISOString());
  }

  return (
    <Dialog title="Snooze message" onClose={() => !busy && onClose()}>
      <form className="space-y-4 p-6" onSubmit={submit}>
        <p className="text-sm text-slate-600">
          Hide <strong>{message.subject || "this message"}</strong> from Inbox
          until the selected time.
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            ["later", "Later today"],
            ["tomorrow", "Tomorrow morning"],
            ["week", "Next week"],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              className="btn-secondary !px-3 !py-1.5 text-xs"
              disabled={busy}
              onClick={() => setReturnAt(suggestion(key))}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="block text-sm">
          Return to Inbox at
          <input
            className="field mt-1"
            aria-label="Return to Inbox at"
            type="datetime-local"
            required
            value={returnAt}
            onChange={(event) => setReturnAt(event.target.value)}
          />
        </label>
        {(validation || error) && (
          <p role="alert" className="text-sm text-red-600">
            {validation || error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="btn-secondary"
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </button>
          <button className="btn-primary" disabled={busy}>
            {busy ? "Snoozing…" : "Snooze"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
