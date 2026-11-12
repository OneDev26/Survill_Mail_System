import { useState } from "react";
import { useDispatch } from "react-redux";
import {
  AlarmClock,
  CalendarClock,
  ChevronLeft,
  Inbox,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";
import Dialog from "../../components/Dialog";
import useCompanyMail from "../../hooks/useCompanyMail";
import useSnoozedMessages from "../../hooks/useSnoozedMessages";
import { fetchFolders } from "../../redux/thunks/mailThunks";
import {
  snoozedActions,
  unsnoozeMessage,
} from "../../redux/thunks/snoozedEmailThunks";

function returnLabel(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Return time unavailable";
  return date.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function SnoozedMailPage() {
  const dispatch = useDispatch();
  const resource = useCompanyMail("snoozed", snoozedActions);
  const messages = useSnoozedMessages();
  const [view, setView] = useState("snoozed");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [returningId, setReturningId] = useState(null);
  const [actionError, setActionError] = useState("");
  const messageRows = messages.items.map((item) => ({
    id: item.id,
    key: `message:${item.id}`,
    source: "message",
    subject: item.subject,
    from: item.from?.email || item.from?.displayName || "",
    body: item.bodyText || item.snippet || "",
    snoozedUntil: item.snoozedUntil,
    status: "snoozed",
  }));
  const recordRows = resource.items.map((item) => ({
    ...item,
    key: `record:${item.id}`,
    source: "record",
  }));
  const sourceRows =
    view === "snoozed"
      ? messageRows
      : view === "records"
        ? recordRows.filter((item) => item.status === "snoozed")
        : view === "active"
          ? recordRows.filter((item) => item.status === "active")
          : [...messageRows, ...recordRows];
  const rows = sourceRows
    .filter((item) =>
      [item.subject, item.from, item.body].some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    )
    .sort(
      (a, b) =>
        new Date(a.snoozedUntil).getTime() - new Date(b.snoozedUntil).getTime(),
    );
  const selected = selectedId
    ? rows.find((item) => item.key === selectedId)
    : null;
  const deleting = resource.items.find((item) => item.id === deletingId);
  const locked = resource.busy || resource.stale || resource.readFailed;
  const loading =
    view === "snoozed"
      ? messages.loading
      : view === "all"
        ? messages.loading || resource.loading
        : resource.loading;
  const error =
    actionError ||
    (view === "snoozed"
      ? messages.error
      : view === "all"
        ? messages.error || resource.error
        : resource.error);

  async function returnNow(item) {
    setReturningId(item.id);
    setActionError("");
    try {
      await dispatch(unsnoozeMessage(item.id)).unwrap();
      setSelectedId(null);
      messages.reload();
      try {
        await dispatch(fetchFolders()).unwrap();
      } catch {
        setActionError(
          "Message returned, but folder counts could not refresh.",
        );
      }
    } catch (err) {
      setActionError(err.message);
    } finally {
      setReturningId(null);
    }
  }

  function reload() {
    setActionError("");
    messages.reload();
    resource.reload();
  }

  return (
    <section
      className="flex min-h-0 min-w-0 flex-1 flex-col bg-white"
      aria-label="Snoozed mail"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 lg:px-7">
        <div className="flex items-center gap-3">
          <span className="rounded-xl bg-brand-50 p-2.5 text-brand-600">
            <AlarmClock size={21} />
          </span>
          <div>
            <h1 className="text-xl font-semibold">Snoozed</h1>
            <p className="text-xs text-slate-500">
              Messages waiting to return to Inbox
            </p>
          </div>
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
            {messages.total}
          </span>
        </div>
        <button
          className="btn-secondary !px-3"
          aria-label="Refresh snoozed"
          disabled={returningId !== null || loading}
          onClick={reload}
        >
          <RefreshCw size={16} />
        </button>
      </header>
      {error && (
        <div
          role="alert"
          className="border-b border-red-100 px-5 py-3 text-sm text-red-600"
        >
          {error}{" "}
          <button className="ml-2 underline" onClick={reload}>
            Retry
          </button>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3 lg:px-7">
        <nav className="flex gap-5" aria-label="Snoozed views">
          {[
            ["snoozed", "Snoozed"],
            ["records", "Records"],
            ["active", "Ended"],
            ["all", "All"],
          ].map(([key, label]) => (
            <button
              key={key}
              className={`border-b-2 pb-2 text-xs font-medium ${view === key ? "border-brand-600 text-brand-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
              onClick={() => {
                setView(key);
                setSelectedId(null);
              }}
            >
              {label}
            </button>
          ))}
        </nav>
        <label className="flex min-w-48 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-slate-400">
          <Search size={15} />
          <input
            aria-label="Search snoozed mail"
            className="w-full bg-transparent text-xs text-slate-700 outline-none"
            placeholder="Search snoozed mail"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setSelectedId(null);
            }}
          />
        </label>
      </div>
      {loading ? (
        <div role="status" className="p-7 text-sm text-slate-500">
          Loading snoozed messages…
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <div
            role="region"
            aria-label="Snoozed message list"
            className={`thin-scrollbar min-h-0 overflow-y-auto border-r border-slate-100 ${selected ? "hidden lg:block lg:w-1/2 lg:flex-none" : "w-full"}`}
          >
            {rows.length ? (
              <>
                {rows.map((item) => (
                  <article
                    key={item.key}
                    className={`border-b border-slate-100 ${selected?.key === item.key ? "bg-brand-50/60" : "hover:bg-slate-50"}`}
                  >
                    <button
                      className={`w-full border-l-[3px] px-5 py-4 text-left ${selected?.key === item.key ? "border-brand-600" : "border-transparent"}`}
                      onClick={() => setSelectedId(item.key)}
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                          {(item.from || "?").slice(0, 2).toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate text-xs font-semibold">
                              {item.from || "Unknown sender"}
                            </span>
                            <span className="shrink-0 text-[11px] text-slate-400">
                              {item.status === "snoozed" ? "Snoozed" : "Ended"}
                            </span>
                          </div>
                          <p className="mt-1 truncate text-sm font-medium">
                            {item.subject || "No subject"}
                          </p>
                          <p className="mt-1 truncate text-xs text-slate-500">
                            {item.body}
                          </p>
                          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-brand-600">
                            <AlarmClock size={12} />
                            {item.status === "snoozed"
                              ? "Snoozed until "
                              : "Recorded until "}
                            {returnLabel(item.snoozedUntil)}
                          </p>
                        </div>
                      </div>
                    </button>
                  </article>
                ))}
                {view === "snoozed" && messages.totalPages > 1 && (
                  <div className="flex items-center justify-between gap-3 p-4 text-xs text-slate-500">
                    <button
                      className="btn-secondary"
                      disabled={messages.page <= 1}
                      onClick={() => {
                        messages.setPage(messages.page - 1);
                        setSelectedId(null);
                      }}
                    >
                      Previous
                    </button>
                    <span>
                      Page {messages.page} of {messages.totalPages}
                    </span>
                    <button
                      className="btn-secondary"
                      disabled={messages.page >= messages.totalPages}
                      onClick={() => {
                        messages.setPage(messages.page + 1);
                        setSelectedId(null);
                      }}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex min-h-60 flex-col items-center justify-center px-6 text-center">
                <span className="rounded-2xl bg-brand-50 p-4 text-brand-600">
                  <Inbox size={26} />
                </span>
                <h2 className="mt-4 font-semibold">
                  {query
                    ? "No matching messages"
                    : view === "snoozed"
                      ? "Nothing snoozed"
                      : "No messages in this view"}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {query
                    ? "Try a different search."
                    : view === "snoozed"
                      ? "Snooze a message from your Inbox to see it here."
                      : "Saved records will appear here."}
                </p>
              </div>
            )}
          </div>
          <div
            role="region"
            aria-label="Snoozed message preview"
            className={`thin-scrollbar min-h-0 overflow-y-auto ${selected ? "w-full lg:w-1/2 lg:flex-none" : "hidden"}`}
          >
            {selected ? (
              <div className="mx-auto max-w-3xl p-5 lg:p-8">
                <button
                  className="mb-4 flex items-center gap-1 text-xs text-brand-600"
                  onClick={() => setSelectedId(null)}
                >
                  <ChevronLeft size={16} /> Back to list
                </button>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold">
                      {selected.subject || "No subject"}
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                      From {selected.from || "Unknown sender"}
                    </p>
                  </div>
                  <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-600">
                    {selected.status === "snoozed" ? "Snoozed" : "Ended"}
                  </span>
                </div>
                <div className="mt-6 flex items-start gap-3 rounded-xl border border-brand-100 bg-brand-50/50 p-4">
                  <CalendarClock
                    size={19}
                    className="mt-0.5 shrink-0 text-brand-600"
                  />
                  <div>
                    <p className="text-xs font-semibold text-slate-700">
                      {selected.status === "snoozed"
                        ? "Snoozed until"
                        : "Recorded until"}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {returnLabel(selected.snoozedUntil)}
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                  {selected.source === "message" && (
                    <button
                      className="btn-primary"
                      disabled={returningId !== null}
                      onClick={() => returnNow(selected)}
                    >
                      <RotateCcw size={15} /> Return to Inbox now
                    </button>
                  )}
                  {selected.source === "record" &&
                    selected.status === "snoozed" && (
                      <button
                        className="btn-secondary"
                        disabled={locked}
                        onClick={async () => {
                          if (
                            await resource.run(
                              snoozedActions.update({
                                id: selected.id,
                                body: { status: "active" },
                              }),
                            )
                          )
                            setSelectedId(null);
                        }}
                      >
                        <RotateCcw size={15} /> End snooze record
                      </button>
                    )}
                  {selected.source === "record" && (
                    <button
                      className="btn-secondary"
                      disabled={locked}
                      onClick={() => setDeletingId(selected.id)}
                    >
                      <Trash2 size={15} /> Delete record
                    </button>
                  )}
                </div>
                <div className="mt-7 border-t border-slate-100 pt-7">
                  <p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
                    {selected.body || "No message body available."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex h-full min-h-60 flex-col items-center justify-center gap-2 p-6 text-center text-slate-400">
                <AlarmClock size={28} />
                <p className="text-sm">Select a message to see its details.</p>
              </div>
            )}
          </div>
        </div>
      )}
      {deleting && (
        <Dialog
          title="Delete snooze record?"
          onClose={() => !resource.busy && setDeletingId(null)}
        >
          <div className="space-y-4 p-6">
            <p className="text-sm">
              Delete “{deleting.subject || "this message"}” from Snoozed?
            </p>
            {resource.error && (
              <p role="alert" className="text-sm text-red-600">
                {resource.error}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button
                className="btn-secondary"
                disabled={resource.busy}
                onClick={() => setDeletingId(null)}
              >
                Keep record
              </button>
              <button
                className="btn-primary"
                disabled={resource.busy}
                onClick={async () => {
                  if (await resource.run(snoozedActions.remove(deleting.id))) {
                    setDeletingId(null);
                    setSelectedId(null);
                  }
                }}
              >
                Confirm delete
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </section>
  );
}
