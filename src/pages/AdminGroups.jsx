import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import {
  fetchGroups,
  createGroup,
  updateGroup,
  deleteGroup,
} from "../redux/thunks/adminThunks";
import Dialog from "../components/Dialog";

function GroupEditor({ group, onClose, onSaved }) {
  const dispatch = useDispatch();
  const [form, setForm] = useState(() => ({
    name: group?.name || "",
    email: group?.email || "",
    whoCanSend: group?.whoCanSend || "organization",
    delivery: group?.delivery || "active",
    members: (group?.members || []).map(({ email, name, canSend }) => ({
      email,
      name: name || "",
      canSend: !!canSend,
    })),
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const change = (key, value) => setForm((old) => ({ ...old, [key]: value }));
  const memberChange = (index, key, value) =>
    change(
      "members",
      form.members.map((member, i) =>
        i === index ? { ...member, [key]: value } : member,
      ),
    );
  async function save(event) {
    event.preventDefault();
    const body = {
      ...form,
      name: form.name.trim(),
      email: form.email.trim(),
      whoCanSend: form.whoCanSend.trim(),
      members: form.members.map((member) => ({
        ...member,
        email: member.email.trim(),
        name: member.name.trim(),
      })),
    };
    if (
      new Set(body.members.map((m) => m.email.toLowerCase())).size !==
      body.members.length
    ) {
      setError("Each member email must be unique.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await dispatch(
        group ? updateGroup({ id: group.id, body }) : createGroup(body),
      ).unwrap();
      onSaved(result.item);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog
      wide
      title={group ? "Edit group" : "Create group"}
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <form className="p-6" onSubmit={save}>
        <fieldset disabled={busy} className="space-y-5">
          <label className="block">
            <span className="field-label">Group name</span>
            <input
              className="field"
              required
              value={form.name}
              onChange={(e) => change("name", e.target.value)}
            />
          </label>
          <label className="block">
            <span className="field-label">Group email</span>
            <input
              className="field"
              type="email"
              required
              value={form.email}
              onChange={(e) => change("email", e.target.value)}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className="field-label">Who can send</span>
              <input
                className="field"
                required
                value={form.whoCanSend}
                onChange={(e) => change("whoCanSend", e.target.value)}
              />
              <span className="mt-1 block text-xs text-slate-500">
                Use your organization's sender policy, such as organization.
              </span>
            </label>
            <label>
              <span className="field-label">Delivery</span>
              <select
                aria-label="Delivery"
                className="field"
                value={form.delivery}
                onChange={(e) => change("delivery", e.target.value)}
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
              </select>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Members</h3>
            <button
              type="button"
              className="btn-secondary"
              onClick={() =>
                change("members", [
                  ...form.members,
                  { email: "", name: "", canSend: false },
                ])
              }
            >
              Add member
            </button>
          </div>
          {form.members.map((member, index) => (
            <div
              key={index}
              className="space-y-3 rounded-lg border border-slate-200 p-3"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <label>
                  <span className="field-label">Member {index + 1} name</span>
                  <input
                    className="field"
                    value={member.name}
                    onChange={(e) =>
                      memberChange(index, "name", e.target.value)
                    }
                  />
                </label>
                <label>
                  <span className="field-label">Member {index + 1} email</span>
                  <input
                    className="field"
                    type="email"
                    required
                    value={member.email}
                    onChange={(e) =>
                      memberChange(index, "email", e.target.value)
                    }
                  />
                </label>
              </div>
              <div className="flex items-center justify-between gap-3">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={member.canSend}
                    onChange={(e) =>
                      memberChange(index, "canSend", e.target.checked)
                    }
                  />
                  Member {index + 1} can send
                </label>
                <button
                  type="button"
                  className="text-sm text-red-600"
                  onClick={() =>
                    change(
                      "members",
                      form.members.filter((_, i) => i !== index),
                    )
                  }
                >
                  Remove member {index + 1}
                </button>
              </div>
            </div>
          ))}
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="btn-primary">
              {busy ? "Saving…" : "Save group"}
            </button>
          </div>
        </fieldset>
      </form>
    </Dialog>
  );
}

export default function AdminGroups() {
  const dispatch = useDispatch();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const [editor, setEditor] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [query, setQuery] = useState("");
  useEffect(() => {
    let active = true;
    const request = dispatch(fetchGroups());
    request
      .unwrap()
      .then((result) => {
        if (active) {
          setData(result);
          setError("");
        }
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      request.abort();
    };
  }, [dispatch, revision]);
  function reload() {
    setLoading(true);
    setError("");
    setRevision((value) => value + 1);
  }
  const rows = (data?.items || []).filter((item) =>
    `${item.name} ${item.email}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <div className="admin-section-heading">
        <div>
          <h2>Groups</h2>
          <p>Manage group membership, sending permissions, and delivery.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" disabled={loading} onClick={reload}>
            Refresh groups
          </button>
          <button className="btn-primary" onClick={() => setEditor({})}>
            Create group
          </button>
        </div>
      </div>
      <section className="monitoring-stats" aria-label="Group overview">
        {[
          ["Total groups", "totalGroups"],
          ["Unique members", "uniqueMembers"],
          ["Active delivery", "activeDelivery"],
          ["Restricted senders", "restrictedSenders"],
        ].map(([label, key]) => (
          <article key={key} className="monitoring-stat-card">
            <div>
              <p>{label}</p>
              <strong>{data?.[key] ?? "—"}</strong>
            </div>
          </article>
        ))}
      </section>
      {error && (
        <p role="alert" className="mb-4 text-red-600">
          Could not load groups. {error}
        </p>
      )}
      {loading && (
        <p role="status" className="mb-4">
          Loading groups…
        </p>
      )}
      <div className="admin-panel">
        <div className="admin-toolbar">
          <input
            aria-label="Search groups"
            className="field"
            placeholder="Search group name or email"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                {[
                  "Group",
                  "Members",
                  "Can send",
                  "Who can send",
                  "Delivery",
                  "Actions",
                ].map((label) => (
                  <th key={label}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((group) => (
                <tr key={group.id}>
                  <td>
                    <strong>{group.name}</strong>
                    <div>{group.email}</div>
                  </td>
                  <td>{group.memberCount}</td>
                  <td>{group.senderCount}</td>
                  <td>{group.whoCanSend}</td>
                  <td>
                    <span className="admin-badge">{group.delivery}</span>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button
                        className="btn-secondary"
                        disabled={loading}
                        onClick={() => setEditor({ group })}
                      >
                        Edit {group.name}
                      </button>
                      <button
                        className="btn-secondary"
                        disabled={loading}
                        onClick={() => {
                          setRemoving(group);
                          setDeleteError("");
                        }}
                      >
                        Delete {group.name}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && !error && !rows.length && (
          <p className="admin-empty">No groups found.</p>
        )}
      </div>
      {editor && (
        <GroupEditor
          group={editor.group}
          onClose={() => setEditor(null)}
          onSaved={() => {
            setEditor(null);
            reload();
          }}
        />
      )}
      {removing && (
        <Dialog
          title="Delete group?"
          onClose={() => {
            if (!deleteBusy) setRemoving(null);
          }}
        >
          <div className="space-y-4 p-6">
            <p>
              Delete {removing.name} ({removing.email})?
            </p>
            {deleteError && (
              <p role="alert" className="text-red-600">
                {deleteError}
              </p>
            )}
            <div className="flex justify-end gap-3">
              <button
                disabled={deleteBusy}
                className="btn-secondary"
                onClick={() => setRemoving(null)}
              >
                Cancel
              </button>
              <button
                disabled={deleteBusy}
                className="btn-primary"
                onClick={async () => {
                  setDeleteBusy(true);
                  setDeleteError("");
                  try {
                    await dispatch(deleteGroup(removing.id)).unwrap();
                    setRemoving(null);
                    reload();
                  } catch (err) {
                    setDeleteError(err.message);
                  } finally {
                    setDeleteBusy(false);
                  }
                }}
              >
                Confirm delete
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </>
  );
}
