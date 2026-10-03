import {
  Archive,
  ArrowDownWideNarrow,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Mail,
  Paperclip,
  RotateCcw,
  Star,
  Trash2,
} from "lucide-react";
import { Avatar, IconButton, LabelBadge } from "./Ui";
export default function MailList({
  messages,
  total,
  folder,
  filter,
  setFilter,
  activeId,
  onOpen,
  selected,
  onSelect,
  onSelectAll,
  onStar,
  onAction,
  compact,
  sort,
  onSort,
  page,
  pageSize = 10,
  setPage,
  pageCount,
  reading,
}) {
  const allSelected =
    messages.length > 0 &&
    messages.every((message) => selected.includes(message.id));
  return (
    <section
      aria-label="Message list"
      className={`mail-list flex min-h-0 min-w-0 flex-1 flex-col bg-white ${reading ? "mail-list-reading" : ""}`}
    >
      <div className="flex h-[70px] shrink-0 items-center justify-between px-5 lg:px-6">
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl font-semibold tracking-tight">{folder}</h1>
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">
            {total}
          </span>
        </div>
        <span className="hidden text-[11px] text-slate-400 sm:block">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </span>
      </div>
      <div className="flex items-center justify-between border-b border-slate-200/70 px-5">
        <div className="flex gap-6">
          {["All", "Unread", "Starred"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`border-b-2 pb-3 text-xs ${filter === tab ? "border-brand-600 font-semibold text-brand-600" : "border-transparent text-slate-400 hover:text-slate-700"}`}
            >
              {tab}
            </button>
          ))}
        </div>
        <button
          onClick={onSort}
          className="mb-2 flex items-center gap-1.5 rounded px-1 py-1 text-[11px] text-slate-500 hover:bg-slate-100"
        >
          <ArrowDownWideNarrow size={14} />
          {sort === "newest" ? "Newest first" : "Oldest first"}
        </button>
      </div>
      <div className="flex h-12 shrink-0 items-center gap-1 border-b border-slate-200/70 bg-slate-50/40 px-5">
        <input
          type="checkbox"
          aria-label="Select all messages on this page"
          checked={allSelected}
          ref={(node) => {
            if (node)
              node.indeterminate =
                !allSelected &&
                messages.some((message) => selected.includes(message.id));
          }}
          onChange={onSelectAll}
          className="mr-2 size-3.5"
        />
        {selected.length > 0 ? (
          <>
            <span className="mr-1 text-[11px] text-slate-500">
              {selected.length} selected
            </span>
            <IconButton
              icon={Archive}
              label="Archive selected"
              onClick={() => onAction("Archive")}
            />
            <IconButton
              icon={Trash2}
              label="Move selected to trash"
              onClick={() => onAction("Trash")}
            />
            <IconButton
              icon={CheckCheck}
              label="Mark selected as read"
              onClick={() => onAction("read")}
            />
            <IconButton
              icon={Mail}
              label="Mark selected as unread"
              onClick={() => onAction("unread")}
            />
            {folder !== "Inbox" && (
              <IconButton
                icon={RotateCcw}
                label="Move selected to inbox"
                onClick={() => onAction("Inbox")}
              />
            )}
          </>
        ) : (
          <span className="ml-2 text-[11px] text-slate-400">
            Select messages to manage your mail
          </span>
        )}
        <span className="ml-auto hidden text-[10px] text-slate-400 xl:block">
          {total ? (page - 1) * pageSize + 1 : 0}–
          {Math.min(page * pageSize, total)} of {total}
        </span>
      </div>
      <div className="thin-scrollbar min-h-0 flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex h-full min-h-64 flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="rounded-2xl bg-brand-50 p-4 text-brand-500">
              <Inbox size={28} />
            </div>
            <h2 className="font-semibold">No messages here</h2>
            <p className="max-w-60 text-xs leading-5 text-slate-400">
              Try another folder or change your search and filters.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`group relative flex gap-3 border-b border-slate-100 px-5 transition ${compact ? "py-3" : "py-[18px]"} ${activeId === message.id ? "border-l-[3px] border-l-brand-500 bg-brand-50/70 pl-[17px]" : "border-l-[3px] border-l-transparent pl-[17px] hover:bg-slate-50"} ${selected.includes(message.id) ? "bg-brand-50" : ""}`}
            >
              <div className="flex shrink-0 flex-col items-center gap-3 pt-1">
                <input
                  type="checkbox"
                  aria-label={`Select ${message.subject}`}
                  checked={selected.includes(message.id)}
                  onChange={() => onSelect(message.id)}
                  className="size-3.5"
                />
                <button
                  aria-label={`${message.starred ? "Unstar" : "Star"} ${message.subject}`}
                  aria-pressed={message.starred}
                  onClick={() => onStar(message.id)}
                  className={
                    message.starred
                      ? "text-amber-400"
                      : "text-slate-300 hover:text-amber-400"
                  }
                >
                  <Star
                    size={15}
                    fill={message.starred ? "currentColor" : "none"}
                    strokeWidth={1.6}
                  />
                </button>
              </div>
              <button
                onClick={() => onOpen(message)}
                className="flex min-w-0 flex-1 gap-3 text-left"
              >
                <div className="pt-0.5">
                  <Avatar
                    initials={message.initials}
                    color={message.color}
                    small
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span
                      className={`truncate text-xs ${message.unread ? "font-bold text-ink" : "font-medium text-slate-600"}`}
                    >
                      {message.folder === "Drafts" ? (
                        <span className="text-red-500">Draft · </span>
                      ) : null}
                      {message.sender}
                    </span>
                    <span
                      className={`shrink-0 text-[10px] ${message.unread ? "font-medium text-brand-600" : "text-slate-400"}`}
                    >
                      {message.time}
                    </span>
                  </div>
                  <p
                    className={`truncate text-xs ${message.unread ? "font-semibold" : "text-slate-600"}`}
                  >
                    {message.subject}
                  </p>
                  {!compact && (
                    <p className="mt-1.5 truncate text-[11px] text-slate-400">
                      {message.preview}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <LabelBadge name={message.label} />
                    {message.attachments.length > 0 && (
                      <Paperclip size={12} className="text-slate-400" />
                    )}
                    {message.unread && (
                      <span className="ml-auto size-1.5 rounded-full bg-brand-500" />
                    )}
                  </div>
                </div>
              </button>
            </div>
          ))
        )}
      </div>
      <div className="flex h-12 shrink-0 items-center justify-between border-t border-slate-200/70 px-5 text-[11px] text-slate-400">
        <span>
          Page {page} of {pageCount}
        </span>
        <div className="flex items-center gap-2">
          <IconButton
            icon={ChevronLeft}
            label="Previous page"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          />
          <IconButton
            icon={ChevronRight}
            label="Next page"
            disabled={page >= pageCount}
            onClick={() => setPage(page + 1)}
          />
        </div>
      </div>
    </section>
  );
}
