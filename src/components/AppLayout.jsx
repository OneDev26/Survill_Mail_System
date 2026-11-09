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
import { composeOpened } from "../redux/slice/uiSlice";

export default function AppLayout() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [help, setHelp] = useState(false);
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const compose = useSelector((state) => state.ui.compose);
  const title = location.pathname.startsWith("/mail")
    ? "Mail"
    : location.pathname.startsWith("/admin")
      ? "Administration"
      : location.pathname.slice(1).replaceAll("-", " ");
  function search(value) {
    if (
      !location.pathname.startsWith("/mail/") &&
      location.pathname !== "/shared-mailboxes"
    ) {
      navigate(`/mail/Inbox?q=${encodeURIComponent(value)}`);
      return;
    }
    setParams(
      (previous) => {
        if (value) previous.set("q", value);
        else previous.delete("q");
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
        <div className="flex min-h-0 flex-1 flex-col">
          <Outlet />
        </div>
        <footer className="flex h-7 shrink-0 items-center justify-between border-t border-slate-200/70 bg-[#f8f9fc] px-5 text-[10px] text-slate-400">
          <span>Survill Mail ? Connected workspace</span>
          <span className="hidden sm:block">Less noise. More focus.</span>
        </footer>
      </main>
      {compose && <ComposeModal key={compose.id} initial={compose} />}
      {help && (
        <Dialog title="Your mailbox" onClose={() => setHelp(false)}>
          <div className="space-y-4 p-6 text-sm leading-6 text-slate-600">
            <p>
              Compose, reply, organize mail, and manage your profile from the
              account menu. Use the sidebar for contacts, tasks, notes, and
              calendar.
            </p>
            <p>
              Mailbox changes are saved to your mail server. Closing the
              composer saves its draft. Use Refresh mailbox to check for new
              mail. Pages marked Preview service save records to the server, but
              those records may reset when the service restarts.
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
