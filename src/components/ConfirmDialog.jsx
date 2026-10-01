import Dialog from "./Dialog";
export default function ConfirmDialog({
  title,
  description,
  confirmLabel = "Confirm",
  onConfirm,
  onClose,
}) {
  return (
    <Dialog title={title} onClose={onClose}>
      <div className="p-6">
        <p className="text-sm leading-6 text-slate-500">{description}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button autoFocus className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary bg-red-600 hover:bg-red-500"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
