import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createSelector } from "@reduxjs/toolkit";
import { Eye, Search, Inbox, Paperclip, Download } from "lucide-react";
import Dialog from "../components/Dialog";
import { adminChanged } from "../redux/slice/adminSlice";

const selectMailboxes = createSelector(
  [(state) => state.accounts],
  (accounts) =>
    Object.entries(accounts).map(([id, account]) => ({
      id,
      email: account.profile.email,
      name: account.profile.name,
      messages: account.mail.messages,
    })),
);
function download(attachment) {
  const stored =
    typeof attachment.dataUrl === "string" &&
    attachment.dataUrl.startsWith("data:")
      ? attachment.dataUrl
      : null;
  const url =
    stored ||
    URL.createObjectURL(
      new Blob([attachment.content || "Demo attachment"], {
        type: "text/plain",
      }),
    );
  const link = document.createElement("a");
  link.href = url;
  link.download = attachment.name;
  link.click();
  if (!stored) setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export default function EmailMonitoring() {
  const mailboxes = useSelector(selectMailboxes);
  const dispatch = useDispatch();
  const [query, setQuery] = useState("");
  const [mailbox, setMailbox] = useState("");
  const [folder, setFolder] = useState("");
  const [from, setFrom] = useState("");
  const [until, setUntil] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const all = useMemo(
    () =>
      mailboxes
        .flatMap((box) =>
          box.messages.map((message) => ({
            ...message,
            mailboxId: box.id,
            mailbox: box.email,
            key: `${box.id}/${message.id}`,
          })),
        )
        .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [mailboxes],
  );
  const folders = [...new Set(all.map((message) => message.folder))].sort();
  const invalidDates = from && until && from > until;
  const rows = all.filter((message) => {
    const date = new Date(message.date);
    const localDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    return (
      !invalidDates &&
      (!mailbox || message.mailboxId === mailbox) &&
      (!folder || message.folder === folder) &&
      (!from || localDate >= from) &&
      (!until || localDate <= until) &&
      [
        message.mailbox,
        message.email,
        message.sender,
        message.to,
        message.cc,
        message.bcc,
        message.subject,
        message.body,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase())
    );
  });
  const pages = Math.max(1, Math.ceil(rows.length / 20));
  const current = Math.min(page, pages);
  const visible = rows.slice((current - 1) * 20, current * 20);
  const message = all.find((item) => item.key === selected);
  function change(setter, value) {
    setter(value);
    setPage(1);
  }
  function open(item) {
    setSelected(item.key);
    dispatch(
      adminChanged({
        kind: "monitor",
        mailbox: item.mailbox,
        messageId: item.id,
      }),
    );
  }
  return (
    <>
      <div className="admin-section-heading">
        <div>
          <h2>Email monitoring</h2>
          <p>
            Read messages across all local app mailboxes without changing users'
            read status.
          </p>
        </div>
        <span className="admin-badge">Administrator access</span>
      </div>
      <div className="mb-5 rounded-xl border border-brand-100 bg-brand-50 p-4 text-xs leading-6 text-slate-600">
        <strong>
          {all.length} mailbox copies across {mailboxes.length} accounts.
        </strong>{" "}
        Includes Inbox, Sent, drafts, archived mail, Spam, and Trash currently
        stored in this browser. Sent and received copies appear separately.
        Permanently deleted messages and mail on other devices are not
        available. Each message opened here is recorded in the admin audit log.
      </div>
      <div className="admin-panel">
        <div className="admin-toolbar">
          <label className="admin-search">
            <Search size={16} />
            <input
              aria-label="Search monitored mail"
              placeholder="Search sender, recipient, subject, or message…"
              value={query}
              onChange={(e) => change(setQuery, e.target.value)}
            />
          </label>
          <select
            className="field admin-filter"
            aria-label="Monitoring mailbox"
            value={mailbox}
            onChange={(e) => change(setMailbox, e.target.value)}
          >
            <option value="">All mailboxes</option>
            {mailboxes.map((box) => (
              <option value={box.id} key={box.id}>
                {box.email}
              </option>
            ))}
          </select>
          <select
            className="field admin-filter"
            aria-label="Monitoring folder"
            value={folder}
            onChange={(e) => change(setFolder, e.target.value)}
          >
            <option value="">All folders</option>
            {folders.map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap items-end gap-3 border-t border-slate-100 px-5 py-3">
          <label>
            <span className="field-label">From date</span>
            <input
              className="field"
              type="date"
              value={from}
              onChange={(e) => change(setFrom, e.target.value)}
            />
          </label>
          <label>
            <span className="field-label">Through date</span>
            <input
              className="field"
              type="date"
              value={until}
              onChange={(e) => change(setUntil, e.target.value)}
            />
          </label>
          <button
            className="btn-secondary"
            onClick={() => {
              setQuery("");
              setMailbox("");
              setFolder("");
              setFrom("");
              setUntil("");
              setPage(1);
            }}
          >
            Clear filters
          </button>
        </div>
        {invalidDates && (
          <p role="alert" className="px-5 pb-3 text-red-600">
            From date must be on or before through date.
          </p>
        )}
        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mailbox</th>
                <th>From / To</th>
                <th>Subject</th>
                <th>Folder</th>
                <th>Date</th>
                <th>Review</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((item) => (
                <tr key={item.key}>
                  <td>{item.mailbox}</td>
                  <td>
                    <div>{item.email || item.sender}</div>
                    <small className="text-slate-400">
                      To: {item.to || "—"}
                    </small>
                  </td>
                  <td>
                    <strong className="font-medium">{item.subject}</strong>
                    {item.attachments.length > 0 && (
                      <span className="mt-1 flex items-center gap-1 text-slate-400">
                        <Paperclip size={12} />
                        {item.attachments.length}
                      </span>
                    )}
                  </td>
                  <td>
                    <span className="admin-badge">{item.folder}</span>
                  </td>
                  <td>{new Date(item.date).toLocaleString()}</td>
                  <td>
                    <button
                      className="inline-flex items-center gap-1 text-brand-600"
                      aria-label={`Read ${item.subject} in ${item.mailbox}`}
                      onClick={() => open(item)}
                    >
                      <Eye size={15} />
                      Read
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!rows.length && (
          <div className="admin-empty">
            <Inbox size={28} />
            <p>No messages match these filters.</p>
          </div>
        )}
        <div className="admin-pagination">
          <span>{rows.length} matching mailbox copies</span>
          <div>
            <button
              disabled={current === 1}
              onClick={() => setPage(current - 1)}
            >
              Previous
            </button>
            <span>
              Page {current} of {pages}
            </span>
            <button
              disabled={current === pages}
              onClick={() => setPage(current + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
      {message && (
        <Dialog
          wide
          title="Monitored message"
          onClose={() => setSelected(null)}
        >
          <article className="space-y-5 p-6">
            <div>
              <p className="mb-2 text-xs text-brand-600">
                Read-only review · {message.mailbox} · {message.folder}
              </p>
              <h3 className="break-words text-lg font-semibold">
                {message.subject}
              </h3>
            </div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 break-words text-xs">
              <dt className="text-slate-400">From</dt>
              <dd>{message.email || message.sender}</dd>
              <dt className="text-slate-400">To</dt>
              <dd>{message.to || "—"}</dd>
              {message.cc && (
                <>
                  <dt className="text-slate-400">Cc</dt>
                  <dd>{message.cc}</dd>
                </>
              )}
              {message.bcc && (
                <>
                  <dt className="text-slate-400">Bcc (sender copy)</dt>
                  <dd>{message.bcc}</dd>
                </>
              )}
              <dt className="text-slate-400">Date</dt>
              <dd>{new Date(message.date).toLocaleString()}</dd>
            </dl>
            <div
              className="whitespace-pre-wrap break-words border-t border-slate-100 pt-5 text-sm leading-7"
              data-testid="monitored-body"
            >
              {message.body}
            </div>
            {message.attachments.length > 0 && (
              <section className="border-t border-slate-100 pt-4">
                <h4 className="mb-3 text-xs font-semibold">Attachments</h4>
                <div className="flex flex-wrap gap-2">
                  {message.attachments.map((file, index) => (
                    <button
                      key={index}
                      className="btn-secondary max-w-full"
                      onClick={() => download(file)}
                    >
                      <Download size={15} />
                      <span className="truncate">{file.name}</span>
                    </button>
                  ))}
                </div>
              </section>
            )}
            <button className="btn-secondary" onClick={() => setSelected(null)}>
              Close review
            </button>
          </article>
        </Dialog>
      )}
    </>
  );
}
