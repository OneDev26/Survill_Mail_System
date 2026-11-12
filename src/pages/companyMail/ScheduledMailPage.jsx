import { useState } from "react";
import {
  CalendarClock,
  ChevronLeft,
  Clock3,
  Mail,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";
import Dialog from "../../components/Dialog";
import useCompanyMail from "../../hooks/useCompanyMail";
import { scheduledActions } from "../../redux/thunks/scheduledEmailThunks";

function localInput(date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

function suggestedTime(choice) {
  const date = new Date();
  if (choice === "later") date.setHours(date.getHours() + 3);
  if (choice === "tomorrow") {
    date.setDate(date.getDate() + 1);
    date.setHours(9, 0, 0, 0);
  }
  if (choice === "week") {
    date.setDate(date.getDate() + 7);
    date.setHours(9, 0, 0, 0);
  }
  return localInput(date);
}

function sendTime(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Send time unavailable";
  return date.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function ScheduleForm({ resource, onClose }) {
  const [form, setForm] = useState({
    to: "",
    subject: "",
    body: "",
    scheduledFor: suggestedTime("tomorrow"),
  });
  const [validation, setValidation] = useState("");

  async function submit(event) {
    event.preventDefault();
    if ([form.to, form.subject].some((value) => !value.trim())) {
      setValidation("Complete the recipient and subject.");
      return;
    }
    const date = new Date(form.scheduledFor);
    if (!Number.isFinite(date.getTime()) || date <= new Date()) {
      setValidation("Choose a future date and time.");
      return;
    }
    setValidation("");
    if (
      await resource.run(
        scheduledActions.create({
          to: form.to.trim(),
          subject: form.subject.trim(),
          body: form.body.trim(),
          scheduledFor: date.toISOString(),
          status: "scheduled",
        }),
      )
    )
      onClose();
  }

  return (
    <Dialog
      title="Schedule email"
      onClose={() => !resource.busy && onClose()}
      wide
    >
      <form className="space-y-4 p-6" onSubmit={submit}>
        <label className="block text-sm">
          To
          <input
            className="field mt-1"
            type="email"
            required
            value={form.to}
            onChange={(event) => setForm({ ...form, to: event.target.value })}
          />
        </label>
        <label className="block text-sm">
          Subject
          <input
            className="field mt-1"
            required
            value={form.subject}
            onChange={(event) =>
              setForm({ ...form, subject: event.target.value })
            }
          />
        </label>
        <label className="block text-sm">
          Message
          <textarea
            className="field mt-1"
            rows={8}
            value={form.body}
            onChange={(event) => setForm({ ...form, body: event.target.value })}
          />
        </label>
        <div>
          <span className="text-sm">Send at</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {[
              ["later", "Later today"],
              ["tomorrow", "Tomorrow morning"],
              ["week", "Next week"],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                className="btn-secondary !px-3 !py-1.5 text-xs"
                disabled={resource.busy}
                onClick={() =>
                  setForm({ ...form, scheduledFor: suggestedTime(key) })
                }
              >
                {label}
              </button>
            ))}
          </div>
          <input
            aria-label="Send at"
            className="field mt-2"
            type="datetime-local"
            required
            value={form.scheduledFor}
            onChange={(event) =>
              setForm({ ...form, scheduledFor: event.target.value })
            }
          />
        </div>
        {(validation || resource.error) && (
          <p role="alert" className="text-sm text-red-600">
            {validation || resource.error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="btn-secondary"
            disabled={resource.busy}
            onClick={onClose}
          >
            Cancel
          </button>
          <button className="btn-primary" disabled={resource.busy}>
            <CalendarClock size={16} />
            {resource.busy ? "Scheduling…" : "Schedule email"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}

export default function ScheduledMailPage() {
  const resource = useCompanyMail("scheduled", scheduledActions);
  const [view, setView] = useState("scheduled");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const pendingCount = resource.items.filter(
    (item) => item.status === "scheduled",
  ).length;
  const rows = resource.items
    .filter(
      (item) =>
        (view === "all" || item.status === view) &&
        [item.to, item.subject, item.body].some((value) =>
          String(value ?? "")
            .toLowerCase()
            .includes(query.toLowerCase()),
        ),
    )
    .sort(
      (a, b) =>
        new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime(),
    );
  const selected = selectedId
    ? rows.find((item) => item.id === selectedId)
    : null;
  const cancelling = resource.items.find((item) => item.id === cancellingId);
  const deleting = resource.items.find((item) => item.id === deletingId);
  const locked = resource.busy || resource.stale || resource.readFailed;

  return (
    <section
      className="flex min-h-0 min-w-0 flex-1 flex-col bg-white"
      aria-label="Scheduled mail"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 lg:px-7">
        <div className="flex items-center gap-3">
          <span className="rounded-xl bg-brand-50 p-2.5 text-brand-600">
            <CalendarClock size={21} />
          </span>
          <div>
            <h1 className="text-xl font-semibold">Scheduled</h1>
            <p className="text-xs text-slate-500">
              Emails prepared for a future send time
            </p>
          </div>
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
            {pendingCount}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            className="btn-secondary !px-3"
            aria-label="Refresh scheduled"
            disabled={resource.busy || resource.loading}
            onClick={resource.reload}
          >
            <RefreshCw size={16} />
          </button>
          <button
            className="btn-primary"
            disabled={locked || resource.loading}
            onClick={() => setCreating(true)}
          >
            <Plus size={16} /> Schedule email
          </button>
        </div>
      </header>
      {resource.error && (
        <div
          role="alert"
          className="border-b border-red-100 px-5 py-3 text-sm text-red-600"
        >
          {resource.error}{" "}
          <button className="ml-2 underline" onClick={resource.reload}>
            Retry
          </button>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3 lg:px-7">
        <nav className="flex gap-5" aria-label="Scheduled views">
          {[
            ["scheduled", "Scheduled"],
            ["sent", "Sent"],
            ["cancelled", "Cancelled"],
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
            aria-label="Search scheduled mail"
            className="w-full bg-transparent text-xs text-slate-700 outline-none"
            placeholder="Search scheduled mail"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setSelectedId(null);
            }}
          />
        </label>
      </div>
      {resource.loading ? (
        <div role="status" className="p-7 text-sm text-slate-500">
          Loading scheduled emails…
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <div
            role="region"
            aria-label="Scheduled message list"
            className={`thin-scrollbar min-h-0 overflow-y-auto border-r border-slate-100 ${selected ? "hidden lg:block lg:w-1/2 lg:flex-none" : "w-full"}`}
          >
            {rows.length ? (
              rows.map((item) => (
                <article
                  key={item.id}
                  className={`border-b border-slate-100 ${selected?.id === item.id ? "bg-brand-50/60" : "hover:bg-slate-50"}`}
                >
                  <button
                    className={`w-full border-l-[3px] px-5 py-4 text-left ${selected?.id === item.id ? "border-brand-600" : "border-transparent"}`}
                    onClick={() => setSelectedId(item.id)}
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                        <Mail size={17} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-xs font-semibold">
                            To: {item.to || "Unknown recipient"}
                          </span>
                          <span className="shrink-0 text-[11px] text-slate-400 capitalize">
                            {item.status || "unknown"}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-sm font-medium">
                          {item.subject || "No subject"}
                        </p>
                        <p className="mt-1 truncate text-xs text-slate-500">
                          {item.body}
                        </p>
                        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-brand-600">
                          <Clock3 size={12} />
                          {item.status === "scheduled"
                            ? "Scheduled for "
                            : "Originally set for "}
                          {sendTime(item.scheduledFor)}
                        </p>
                      </div>
                    </div>
                  </button>
                </article>
              ))
            ) : (
              <div className="flex min-h-60 flex-col items-center justify-center px-6 text-center">
                <span className="rounded-2xl bg-brand-50 p-4 text-brand-600">
                  <CalendarClock size={26} />
                </span>
                <h2 className="mt-4 font-semibold">
                  {query
                    ? "No matching emails"
                    : view === "scheduled"
                      ? "No scheduled emails"
                      : "No emails in this view"}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {query
                    ? "Try a different search."
                    : "Scheduled emails will appear here."}
                </p>
              </div>
            )}
          </div>
          <div
            role="region"
            aria-label="Scheduled message preview"
            className={`thin-scrollbar min-h-0 overflow-y-auto ${selected ? "w-full lg:w-1/2 lg:flex-none" : "hidden"}`}
          >
            {selected && (
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
                      To {selected.to || "Unknown recipient"}
                    </p>
                  </div>
                  <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium capitalize text-brand-600">
                    {selected.status || "unknown"}
                  </span>
                </div>
                <div className="mt-6 flex items-start gap-3 rounded-xl border border-brand-100 bg-brand-50/50 p-4">
                  <CalendarClock
                    size={19}
                    className="mt-0.5 shrink-0 text-brand-600"
                  />
                  <div>
                    <p className="text-xs font-semibold text-slate-700">
                      {selected.status === "scheduled"
                        ? "Scheduled for"
                        : "Original send time"}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {sendTime(selected.scheduledFor)}
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                  {selected.status === "scheduled" && (
                    <button
                      className="btn-secondary"
                      disabled={locked}
                      onClick={() => setCancellingId(selected.id)}
                    >
                      <XCircle size={15} /> Cancel schedule
                    </button>
                  )}
                  {selected.status === "cancelled" && (
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
            )}
          </div>
        </div>
      )}
      {creating && (
        <ScheduleForm resource={resource} onClose={() => setCreating(false)} />
      )}
      {cancelling && (
        <Dialog
          title="Cancel scheduled email?"
          onClose={() => !resource.busy && setCancellingId(null)}
        >
          <div className="space-y-4 p-6">
            <p className="text-sm">
              Cancel the scheduled email “{cancelling.subject || "No subject"}”?
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
                onClick={() => setCancellingId(null)}
              >
                Keep scheduled
              </button>
              <button
                className="btn-primary"
                disabled={resource.busy}
                onClick={async () => {
                  if (
                    await resource.run(
                      scheduledActions.update({
                        id: cancelling.id,
                        body: { status: "cancelled" },
                      }),
                    )
                  ) {
                    setCancellingId(null);
                    setSelectedId(null);
                  }
                }}
              >
                Confirm cancellation
              </button>
            </div>
          </div>
        </Dialog>
      )}
      {deleting && (
        <Dialog
          title="Delete cancelled record?"
          onClose={() => !resource.busy && setDeletingId(null)}
        >
          <div className="space-y-4 p-6">
            <p className="text-sm">
              Delete “{deleting.subject || "No subject"}” from Scheduled?
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
                  if (
                    await resource.run(scheduledActions.remove(deleting.id))
                  ) {
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
