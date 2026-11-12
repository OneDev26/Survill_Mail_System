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
  ShieldAlert,
  Star,
  StickyNote,
  Trash2,
  Users,
  X,
  Clock,
  AlarmClock,
  Building2,
  UsersRound,
  ClipboardCheck,
} from "lucide-react";
import { Avatar, IconButton } from "./Ui";
import { initials } from "../utils/mail";
import { folderName } from "../api/models";
const folders = [
  ["Inbox", Inbox],
  ["All Mail", Mail],
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
  const { customFolders } = useSelector((state) => state.mail);
  const profile = useSelector((state) => state.profile);
  const serverMail = useSelector((state) => state.mail);
  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] capitalize transition ${isActive ? "bg-brand-100/80 font-semibold text-brand-600" : "text-slate-600 hover:bg-slate-100"}`;
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
            Survill
            <span className="ml-1.5 font-normal text-slate-500">mail</span>
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
                const serverFolder = serverMail.folders?.find(
                  (f) => folderName(f) === name,
                );
                const count =
                  (name === "Starred"
                    ? serverMail.starredCount
                    : name === "Inbox"
                      ? serverFolder?.unread
                      : serverFolder?.total) || 0;
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
          <div className="mb-2 mt-5 px-3 text-[10px] font-semibold tracking-widest text-slate-400">
            COMPANY MAIL
          </div>
          <nav aria-label="Company mail" className="space-y-0.5">
            {[
              ["Shared Mailboxes", UsersRound, "/shared-mailboxes"],
              ["Scheduled", Clock, "/scheduled"],
              ["Snoozed", AlarmClock, "/snoozed"],
              ["Company Directory", Building2, "/directory"],
              ["Approvals", ClipboardCheck, "/approvals"],
            ].map(([label, Icon, to]) => (
              <NavLink key={to} to={to} onClick={onClose} className={linkClass}>
                <Icon size={17} />
                <span>{label}</span>
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
          </nav>
        </div>
        <div className="px-6 py-3 text-[10px] text-slate-400">
          <span>SERVER MAILBOX</span>
          <p className="mt-1.5">Saved on your mail server</p>
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
