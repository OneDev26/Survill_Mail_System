import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AlertCircle, Check, X } from "lucide-react";
import { notificationDismissed } from "../redux/slice/uiSlice";
import { undoChange } from "../redux/slice/mailSlice";
export default function Notifications() {
  const dispatch = useDispatch();
  const notification = useSelector((state) => state.ui.notification);
  const undo = useSelector((state) => state.mail.undo);
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(
      () => dispatch(notificationDismissed()),
      notification.undo ? 9000 : 5000,
    );
    return () => clearTimeout(timer);
  }, [notification, dispatch]);
  if (!notification) return null;
  return (
    <div
      role="status"
      className="fixed bottom-5 left-1/2 z-[100] flex w-max max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-3 rounded-xl bg-slate-800 px-4 py-3 text-xs text-white shadow-xl"
    >
      {notification.error ? (
        <AlertCircle size={17} />
      ) : (
        <Check size={17} className="shrink-0 text-emerald-300" />
      )}
      <span>{notification.text}</span>
      {notification.undo && undo && (
        <button
          className="font-semibold text-violet-200 hover:underline"
          onClick={() => {
            dispatch(undoChange());
            dispatch(notificationDismissed());
          }}
        >
          Undo
        </button>
      )}
      <button
        aria-label="Dismiss notification"
        onClick={() => dispatch(notificationDismissed())}
      >
        <X size={16} />
      </button>
    </div>
  );
}
