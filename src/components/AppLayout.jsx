import { useState } from "react";
import {
  Outlet,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Sidebar from "./Sidebar";
import MailHeader from "./MailHeader";
import ComposeModal from "./ComposeModal";
import Dialog from "./Dialog";
import { composeOpened, composeClosed, notify } from "../redux/slice/uiSlice";
import { deleteMessages, saveMessage } from "../redux/slice/mailSlice";

export default function AppLayout() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [help, setHelp] = useState(false);
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { compose, storageError } = useSelector((state) => state.ui);
  const title = location.pathname.startsWith("/mail")
    ? "Mail"
    : location.pathname.slice(1);
  function search(value) {
    if (!location.pathname.startsWith("/mail/")) {
      navigate(`/mail/Inbox?q=${encodeURIComponent(value)}`);
      return;
    }
    setParams(
      (previous) => {
        if (value) previous.set("q", value);
        else previous.delete("q");
        previous.delete("message");
        return previous;
      },
      { replace: true },
    );
  }
  return (
    <div className="flex h-dvh min-h-[400px] overflow-hidden">
      <Sidebar
        onCompose={() => {
          dispatch(composeOpened());
          setMobileMenu(false);
        }}
        open={mobileMenu}
        onClose={() => setMobileMenu(false)}
      />
      <main className="flex min-w-0 flex-1 flex-col">
        <MailHeader
          query={params.get("q") || ""}
          onSearch={search}
          title={title}
          onMenu={() => setMobileMenu(true)}
          onHelp={() => setHelp(true)}
        />
        {storageError && (
          <div
            role="alert"
            className="bg-amber-50 px-5 py-2 text-xs text-amber-800"
          >
            Browser storage is full or unavailable. New changes may not survive
            a refresh. Download any important attachments before leaving.
          </div>
        )}
        <div className="flex min-h-0 flex-1 flex-col">
          <Outlet />
        </div>
        <footer className="flex h-7 shrink-0 items-center justify-between border-t border-slate-200/70 bg-[#f8f9fc] px-5 text-[10px] text-slate-400">
          <span>Demo workspace · Local data</span>
          <span className="hidden sm:block">Less noise. More focus.</span>
        </footer>
      </main>
      {compose && (
        <ComposeModal
          key={compose.id}
          initial={compose}
          onSave={(message, keepOpen = false) => {
            dispatch(saveMessage(message));
            if (!keepOpen) {
              dispatch(composeClosed());
              dispatch(
                notify({
                  text:
                    message.folder === "Sent"
                      ? "Message sent to your demo Sent folder."
                      : "Draft saved.",
                }),
              );
            }
          }}
          onClose={() => dispatch(composeClosed())}
          onDiscard={() => {
            dispatch(deleteMessages([compose.id]));
            dispatch(composeClosed());
            dispatch(notify({ text: "Draft discarded." }));
          }}
        />
      )}
      {help && (
        <Dialog title="Your demo workspace" onClose={() => setHelp(false)}>
          <div className="space-y-4 p-6 text-sm leading-6 text-slate-600">
            <p>
              Compose, reply, organize mail, and manage your profile from the
              account menu. Use the sidebar for contacts, tasks, notes, and
              calendar.
            </p>
            <p>
              Changes are stored in this browser. Closing a message saves it in
              Drafts. Move messages out of Spam or Trash to restore them;
              permanent deletion asks for confirmation.
            </p>
            <p>
              Login and sending are simulated. A backend is required for real
              authentication, delivery, synchronization, and password recovery.
            </p>
            <button className="btn-primary" onClick={() => setHelp(false)}>
              Got it
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
