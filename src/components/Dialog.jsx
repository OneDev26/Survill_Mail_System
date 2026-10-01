import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { IconButton } from "./Ui";
import { useId } from "react";
export default function Dialog({ title, onClose, children, wide = false }) {
  const ref = useRef(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement;
    dialog.showModal();
    return () => {
      dialog.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      aria-labelledby={titleId}
      className={`m-auto max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-0 text-ink shadow-2xl backdrop:bg-slate-950/30 ${wide ? "max-w-2xl" : "max-w-md"}`}
    >
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-6 py-4">
        <h2 id={titleId} className="text-sm font-semibold">
          {title}
        </h2>
        <IconButton icon={X} label="Close dialog" onClick={onClose} />
      </div>
      {children}
    </dialog>
  );
}
