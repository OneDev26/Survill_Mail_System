import { useSelector } from "react-redux";
import { NavLink, Link } from "react-router-dom";
import {
  Archive,
  CalendarDays,
  CheckCheck,
  FileText,
  Folder,
  Inbox,
  Mail,
  PenLine,
  Send,
  Settings,
  ShieldAlert,
  Star,
  StickyNote,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { Avatar, IconButton } from "./Ui";
import { belongsToFolder, initials } from "../utils/mail";
const folders = [
  ["Inbox", Inbox],
  ["Starred", Star],
  ["Drafts", FileText],
  ["Sent", Send],
  ["Archive", Archive],
  ["Spam", ShieldAlert],
  ["Trash", Trash2],
];
const workspaces = [
  ["contacts", Users],
  ["tasks", CheckCheck],
  ["notes", StickyNote],
  ["calendar", CalendarDays],
];
export default function Sidebar({ onCompose, open, onClose }) {
  const { messages, labels, customFolders } = useSelector(
    (state) => state.mail,
  );
  const profile = useSelector((state) => state.profile);
  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] capitalize transition ${isActive ? "bg-brand-100/80 font-semibold text-brand-600" : "text-slate-600 hover:bg-slate-100"}`;
  const bytes = new Blob([JSON.stringify(messages)]).size;
  return (
    <>
      {open && (
        <button
          className="fixed inset-0 z-30 bg-slate-950/30 md:hidden"
          aria-label="Close navigation"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-60 shrink-0 flex-col border-r border-slate-200/70 bg-[#f8f9fc] transition-transform md:static md:w-56 md:translate-x-0 xl:w-60 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <Link
          to="/mail/Inbox"
          onClick={onClose}
          className="flex h-[76px] shrink-0 items-center gap-2.5 px-6"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-brand-600 text-white">
            <Mail size={23} />
          </span>
          <span className="text-[23px] font-semibold tracking-tight">
            zoho<span className="ml-1.5 font-normal text-slate-500">mail</span>
          </span>
        </Link>
        {open && (
          <IconButton
            icon={X}
            label="Close navigation"
            onClick={onClose}
            className="absolute right-1 top-1 md:hidden"
          />
        )}
        <div className="px-4 pb-4 pt-2">
          <button onClick={onCompose} className="btn-primary w-full">
            <PenLine size={17} />
            New mail<span className="ml-auto text-lg font-light">+</span>
          </button>
        </div>
        <div className="thin-scrollbar min-h-0 flex-1 overflow-y-auto px-3 pb-3">
          <nav aria-label="Mail folders" className="space-y-0.5">
            {[...folders, ...customFolders.map((name) => [name, Folder])].map(
              ([name, Icon]) => {
                const count = messages.filter(
                  (m) =>
                    belongsToFolder(m, name) && (name !== "Inbox" || m.unread),
                ).length;
                return (
                  <NavLink
                    key={name}
                    to={`/mail/${encodeURIComponent(name)}`}
                    onClick={onClose}
                    className={linkClass}
                  >
                    <Icon size={17} strokeWidth={1.7} />
                    <span className="truncate">{name}</span>
                    {count > 0 && (
                      <span className="ml-auto text-[11px] opacity-65">
                        {count}
                      </span>
                    )}
                  </NavLink>
                );
              },
            )}
          </nav>
          <div className="mb-2 mt-5 flex items-center justify-between px-3 text-[10px] font-semibold tracking-widest text-slate-400">
            LABELS
            <Link
              to="/settings#organization"
              onClick={onClose}
              aria-label="Manage folders and labels"
              className="text-lg hover:text-brand-600"
            >
              +
            </Link>
          </div>
          <nav aria-label="Labels" className="space-y-0.5">
            {labels.map((label) => (
              <NavLink
                key={label.name}
                to={`/mail/${encodeURIComponent("label:" + label.name)}`}
                onClick={onClose}
                className={linkClass}
              >
                <span className={`size-2 shrink-0 rounded-full ${label.dot}`} />
                <span className="truncate">{label.name}</span>
              </NavLink>
            ))}
          </nav>
          <div className="mb-2 mt-5 px-3 text-[10px] font-semibold tracking-widest text-slate-400">
            WORKSPACE
          </div>
          <nav aria-label="Workspace" className="space-y-0.5">
            {workspaces.map(([name, Icon]) => (
              <NavLink
                key={name}
                to={`/${name}`}
                onClick={onClose}
                className={linkClass}
              >
                <Icon size={17} />
                {name}
              </NavLink>
            ))}
            <NavLink to="/settings" onClick={onClose} className={linkClass}>
              <Settings size={17} />
              Settings
            </NavLink>
          </nav>
        </div>
        <div className="px-6 py-3 text-[10px] text-slate-400">
          <span>LOCAL MAIL DATA</span>
          <span className="float-right">{(bytes / 1024).toFixed(0)} KB</span>
          <p className="mt-1.5">Saved in this browser</p>
        </div>
        <Link
          to="/profile"
          onClick={onClose}
          className="flex items-center gap-2.5 border-t border-slate-200/70 px-5 py-4 hover:bg-slate-100"
        >
          <Avatar
            initials={initials(profile.name)}
            src={profile.avatar}
            small
          />
          <span className="min-w-0">
            <span className="block truncate text-xs font-semibold">
              {profile.name}
            </span>
            <span className="mt-0.5 block truncate text-[10px] text-slate-400">
              View your profile
            </span>
          </span>
          <span className="ml-auto size-2 rounded-full bg-emerald-400" />
        </Link>
      </aside>
    </>
  );
}
