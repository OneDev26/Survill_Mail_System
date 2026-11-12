import { useState } from "react";
import { useSelector } from "react-redux";
import useCompanyMail from "../../hooks/useCompanyMail";
import FeatureShell from "../../components/companyMail/FeatureShell";
import Dialog from "../../components/Dialog";
import { approvalActions } from "../../redux/thunks/approvalThunks";
import { canAdminister, sessionUser } from "../../utils/access";

function belongsToUser(item, user) {
  if (!user) return false;
  if (item.requesterId != null)
    return String(item.requesterId) === String(user.id);
  const email = item.requesterEmail || item.requester;
  return (
    typeof email === "string" &&
    email.toLowerCase() === user.email?.toLowerCase()
  );
}

function RequestForm({ resource, onClose }) {
  const [form, setForm] = useState({ title: "", details: "", amount: "" });
  const [validation, setValidation] = useState("");
  async function submit(event) {
    event.preventDefault();
    const body = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [key, value.trim()]),
    );
    if (Object.values(body).some((value) => !value)) {
      setValidation("Complete every field before sending your request.");
      return;
    }
    setValidation("");
    if (await resource.run(approvalActions.create(body))) onClose();
  }
  return (
    <Dialog
      title="New approval request"
      onClose={() => !resource.busy && onClose()}
    >
      <form onSubmit={submit} className="space-y-4 p-6">
        <p className="text-sm text-slate-500">
          Your request will be sent to administrators for review.
        </p>
        <label className="block text-sm">
          Request title
          <input
            className="field mt-1"
            required
            value={form.title}
            onChange={(event) =>
              setForm({ ...form, title: event.target.value })
            }
          />
        </label>
        <label className="block text-sm">
          Details
          <textarea
            className="field mt-1"
            rows={4}
            required
            value={form.details}
            onChange={(event) =>
              setForm({ ...form, details: event.target.value })
            }
          />
        </label>
        <label className="block text-sm">
          Amount (formatted text)
          <input
            className="field mt-1"
            required
            value={form.amount}
            onChange={(event) =>
              setForm({ ...form, amount: event.target.value })
            }
          />
        </label>
        {(validation || resource.error) && (
          <p role="alert" className="text-sm text-red-600">
            {validation || resource.error}
          </p>
        )}
        <button className="btn-primary" disabled={resource.busy}>
          {resource.busy ? "Sending…" : "Send request"}
        </button>
      </form>
    </Dialog>
  );
}

export default function ApprovalsPage({ admin = false }) {
  const resource = useCompanyMail("approvals", approvalActions);
  const user = useSelector(sessionUser);
  const isAdmin = useSelector(canAdminister);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState(admin ? "pending" : "all");
  const [creating, setCreating] = useState(false);
  const [reviewId, setReviewId] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const scoped =
    admin && isAdmin
      ? resource.items
      : resource.items.filter((item) => belongsToUser(item, user));
  const pendingCount = scoped.filter(
    (item) => item.status === "pending",
  ).length;
  const rows = scoped
    .filter(
      (item) =>
        (status === "all" || item.status === status) &&
        [
          item.title,
          item.requesterEmail,
          item.requester,
          item.details,
          item.amount,
        ].some((value) =>
          String(value ?? "")
            .toLowerCase()
            .includes(query.toLowerCase()),
        ),
    )
    .sort(
      (a, b) =>
        (a.status === "pending" ? 0 : 1) - (b.status === "pending" ? 0 : 1),
    );
  const reviewing = scoped.find((item) => item.id === reviewId);
  const detail = scoped.find((item) => item.id === detailId);
  async function decide(status) {
    if (!reviewing) return;
    if (
      await resource.run(
        approvalActions.update({ id: reviewing.id, body: { status } }),
      )
    )
      setReviewId(null);
  }
  const list = (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <input
          className="field min-w-40 flex-1"
          aria-label="Search approvals"
          placeholder="Search requests"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <select
          className="field w-auto"
          aria-label="Status filter"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        {!admin && (
          <button className="btn-primary" onClick={() => setCreating(true)}>
            New request
          </button>
        )}
      </div>
      {admin && (
        <p className="text-sm text-slate-500">
          {pendingCount} pending requests · {scoped.length} loaded
        </p>
      )}
      <div className="space-y-3">
        {rows.map((item) => (
          <article className="card space-y-3" key={item.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">
                  {item.title || "Untitled request"}
                </h3>
                {admin && (
                  <p className="text-sm text-slate-500">
                    Requested by{" "}
                    {item.requesterEmail || item.requester || "Unknown user"}
                  </p>
                )}
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${item.status === "approved" ? "bg-emerald-50 text-emerald-700" : item.status === "pending" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"}`}
              >
                {item.status || "unknown"}
              </span>
            </div>
            <p className="whitespace-pre-wrap break-words text-sm text-slate-600">
              {item.details || "No details supplied"}
            </p>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
              <span className="text-sm font-semibold">
                {item.amount || "—"}
              </span>
              <div className="flex gap-2">
                <button
                  className="btn-secondary"
                  onClick={() => setDetailId(item.id)}
                >
                  View details
                </button>
                {admin && isAdmin && item.status === "pending" && (
                  <button
                    className="btn-primary"
                    onClick={() => setReviewId(item.id)}
                  >
                    Review request
                  </button>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
      {!resource.loading && !resource.error && rows.length === 0 && (
        <p className="card text-sm text-slate-500">
          {admin
            ? "No requests match this view."
            : "You have no requests in this view."}
        </p>
      )}
    </>
  );
  return (
    <>
      {admin ? (
        <section className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Approval queue</h2>
              <p className="mt-1 text-sm text-slate-500">
                Review requests from users across your workspace.
              </p>
            </div>
            <button
              className="btn-secondary"
              disabled={resource.busy || resource.loading}
              onClick={resource.reload}
            >
              Refresh
            </button>
          </div>
          {resource.error && (
            <p role="alert" className="text-sm text-red-600">
              {resource.error}{" "}
              <button className="btn-secondary ml-2" onClick={resource.reload}>
                Retry
              </button>
            </p>
          )}
          {resource.loading ? (
            <p role="status">Loading…</p>
          ) : (
            <fieldset
              disabled={resource.busy || resource.stale || resource.readFailed}
              className="space-y-5"
            >
              {list}
            </fieldset>
          )}
        </section>
      ) : (
        <FeatureShell
          title="My approvals"
          description="Track approval requests you have submitted."
          resource={resource}
        >
          {list}
        </FeatureShell>
      )}
      {creating && (
        <RequestForm resource={resource} onClose={() => setCreating(false)} />
      )}
      {detail && (
        <Dialog title="Request details" onClose={() => setDetailId(null)}>
          <dl className="space-y-3 p-6 text-sm">
            {[
              ["Title", detail.title],
              ["Requested by", detail.requesterEmail || detail.requester],
              ["Details", detail.details],
              ["Amount", detail.amount],
              ["Status", detail.status],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-slate-500">{label}</dt>
                <dd className="mt-1 whitespace-pre-wrap break-words">
                  {value || "—"}
                </dd>
              </div>
            ))}
          </dl>
        </Dialog>
      )}
      {reviewing && admin && isAdmin && (
        <Dialog
          title="Review approval request"
          onClose={() => !resource.busy && setReviewId(null)}
        >
          <div className="space-y-4 p-6">
            <p className="text-sm">
              Review <strong>{reviewing.title}</strong> from{" "}
              {reviewing.requesterEmail || reviewing.requester || "this user"}?
            </p>
            <p className="whitespace-pre-wrap text-sm text-slate-600">
              {reviewing.details}
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
                onClick={() => setReviewId(null)}
              >
                Cancel
              </button>
              <button
                className="btn-secondary !text-red-600"
                disabled={resource.busy}
                onClick={() => decide("rejected")}
              >
                {resource.busy ? "Saving…" : "Reject request"}
              </button>
              <button
                className="btn-primary"
                disabled={resource.busy}
                onClick={() => decide("approved")}
              >
                {resource.busy ? "Approving…" : "Approve request"}
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </>
  );
}
