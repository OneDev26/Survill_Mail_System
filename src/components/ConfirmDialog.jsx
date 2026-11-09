import Dialog from "./Dialog";
import { useState } from "react";
export default function ConfirmDialog({
  title,
  description,
  confirmLabel = "Confirm",
  onConfirm,
  onClose,
}) {
  const [busy, setBusy] = useState(false);
  async function confirm() {
    if (busy) return;
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog
      title={title}
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <div className="p-6">
        <p className="text-sm leading-6 text-slate-500">{description}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            autoFocus
            disabled={busy}
            className="btn-secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="btn-primary bg-red-600 hover:bg-red-500"
            disabled={busy}
            onClick={confirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Dialog>
  );
}//
