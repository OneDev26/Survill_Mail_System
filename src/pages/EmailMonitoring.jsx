import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import {
  fetchMonitoring,
  fetchEmailMonitoring,
} from "../redux/thunks/adminThunks";
import Dialog from "../components/Dialog";

export default function EmailMonitoring({ summaryOnly = false }) {
  const dispatch = useDispatch();
  const [filters, setFilters] = useState({
    q: "",
    folder: "all",
    unread: "",
    withAttachments: "",
    limit: 25,
  });
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState({
    data: null,
    error: "",
    loading: true,
  });
  const [selected, setSelected] = useState(null);
  useEffect(() => {
    let active = true;
    let request;
    const timer = setTimeout(() => {
      setResult({ data: null, error: "", loading: true });
      request = dispatch(
        (summaryOnly ? fetchMonitoring : fetchEmailMonitoring)({
          q: filters.q.trim() || undefined,
          folder: filters.folder,
          unread: filters.unread === "" ? undefined : filters.unread === "true",
          withAttachments:
            filters.withAttachments === ""
              ? undefined
              : filters.withAttachments === "true",
          limit: summaryOnly ? 1 : filters.limit,
        }),
      );
      request
        .unwrap()
        .then((data) => {
          if (active) setResult({ data, error: "", loading: false });
        })
        .catch((err) => {
          if (active)
            setResult({ data: null, error: err.message, loading: false });
        });
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
      request?.abort();
    };
  }, [dispatch, summaryOnly, filters, revision]);
  function change(key, value) {
    setFilters((old) => ({ ...old, [key]: value }));
    setSelected(null);
    setResult({ data: null, error: "", loading: true });
  }
  const items = result.data?.items || [];
  const summary = result.data?.summary;
  return (
    <>
      <div className="admin-section-heading">
        <div>
          <h2>{summaryOnly ? "Live mailbox summary" : "Email monitoring"}</h2>
          <p>Review mail across organization mailboxes.</p>
        </div>
        <button
          className="btn-secondary"
          disabled={result.loading}
          onClick={() => {
            setResult({ data: null, error: "", loading: true });
            setRevision((v) => v + 1);
          }}
        >
          Refresh monitoring
        </button>
      </div>
      <section className="monitoring-stats" aria-label="Monitoring overview">
        {[
          ["Total mail copies", "totalMailCopies"],
          ["Inbox copies", "inboxCopies"],
          ["Unread messages", "unreadMessages"],
          ["With attachments", "withAttachments"],
        ].map(([title, key]) => (
          <article className="monitoring-stat-card" key={key}>
            <div>
              <p>{title}</p>
              <strong>{summary?.[key] ?? "—"}</strong>
            </div>
          </article>
        ))}
      </section>
      {result.loading && (
        <p role="status" className="mb-4">
          Loading monitored mail...
        </p>
      )}
      {result.error && (
        <p role="alert" className="mb-4 text-red-600">
          Could not load monitored mail. {result.error}
        </p>
      )}
      {!summaryOnly && (
        <div className="admin-panel">
          <div className="admin-toolbar">
            <input
              className="field"
              aria-label="Search monitored mail"
              placeholder="Search monitored mail"
              value={filters.q}
              onChange={(e) => change("q", e.target.value)}
            />
            <select
              className="field admin-filter"
              aria-label="Monitoring folder"
              value={filters.folder}
              onChange={(e) => change("folder", e.target.value)}
            >
              {[
                "all",
                "inbox",
                "sent",
                "drafts",
                "archive",
                "spam",
                "trash",
              ].map((value) => (
                <option key={value} value={value}>
                  {value === "all" ? "All folders" : value}
                </option>
              ))}
            </select>
            <select
              className="field admin-filter"
              aria-label="Message read state"
              value={filters.unread}
              onChange={(e) => change("unread", e.target.value)}
            >
              <option value="">Any read state</option>
              <option value="true">Unread</option>
              <option value="false">Read</option>
            </select>
            <select
              className="field admin-filter"
              aria-label="Attachment state"
              value={filters.withAttachments}
              onChange={(e) => change("withAttachments", e.target.value)}
            >
              <option value="">With or without attachments</option>
              <option value="true">Has attachments</option>
              <option value="false">No attachments</option>
            </select>
            <select
              className="field admin-filter"
              aria-label="Monitoring limit"
              value={filters.limit}
              onChange={(e) => change("limit", Number(e.target.value))}
            >
              {[20, 25, 50, 100].map((value) => (
                <option key={value} value={value}>
                  Up to {value} messages
                </option>
              ))}
            </select>
          </div>
          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  {[
                    "Mailbox",
                    "From / To",
                    "Subject",
                    "Folder",
                    "Date",
                    "Read state",
                    "Review",
                  ].map((title) => (
                    <th key={title}>{title}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={`${item.mailbox}/${item.id}`}>
                    <td>{item.mailbox}</td>
                    <td>
                      <div>{item.from}</div>
                      <small>To: {item.to}</small>
                    </td>
                    <td>
                      <strong>{item.subject}</strong>
                      {item.hasAttachments && (
                        <div className="text-xs text-slate-500">
                          Has attachments
                        </div>
                      )}
                    </td>
                    <td>{item.folder}</td>
                    <td>
                      {item.date ? new Date(item.date).toLocaleString() : "—"}
                    </td>
                    <td>{item.unread ? "Unread" : "Read"}</td>
                    <td>
                      <button
                        className="text-brand-600"
                        aria-label={`Details for ${item.subject} in ${item.mailbox}`}
                        onClick={() => setSelected(item)}
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!result.loading && !result.error && !items.length && (
            <p className="admin-empty">No messages match these filters.</p>
          )}
          {result.data && (
            <p className="p-4 text-xs text-slate-500">
              Showing {items.length} returned messages (limit {filters.limit}).
            </p>
          )}
        </div>
      )}
      {selected && (
        <Dialog
          wide
          title="Monitored message details"
          onClose={() => setSelected(null)}
        >
          <div className="space-y-5 p-6">
            <h3 className="break-words text-lg font-semibold">
              {selected.subject}
            </h3>
            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 break-words text-sm">
              {[
                ["Mailbox", selected.mailbox],
                ["From", selected.from],
                ["To", selected.to],
                ["Folder", selected.folder],
                [
                  "Date",
                  selected.date
                    ? new Date(selected.date).toLocaleString()
                    : "—",
                ],
                ["Read state", selected.unread ? "Unread" : "Read"],
                ["Attachments", selected.hasAttachments ? "Yes" : "No"],
              ].map(([label, value]) => (
                <div key={label} className="contents">
                  <dt className="text-slate-500">{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
            <p className="text-sm text-slate-500">
              Message content and attachment downloads are not available in this
              view yet.
            </p>
          </div>
        </Dialog>
      )}
    </>
  );
}
