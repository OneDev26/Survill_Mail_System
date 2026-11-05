import { useState } from "react";
import { useDispatch } from "react-redux";
import { adminResourceConfig } from "./adminResourceConfig";
import useAdminResource from "../hooks/useAdminResource";
import { fetchAdminUsers } from "../redux/thunks/adminThunks";
import AdminDataStatus from "../components/AdminDataStatus";
import Dialog from "../components/Dialog";

function UserField({ value, onChange }) {
  const resource = useAdminResource(fetchAdminUsers);
  return (
    <div>
      <AdminDataStatus {...resource} />
      <label>
        <span className="field-label">Mailbox user</span>
        <select
          className="field"
          aria-label="Mailbox user"
          required
          value={value}
          disabled={resource.loading || !!resource.error}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Select a mailbox user</option>
          {(resource.data?.users || []).map((user) => (
            <option key={user.id} value={user.id}>
              {user.displayName} ({user.email})
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function ResourceEditor({ config, record, onClose, onSaved }) {
  const dispatch = useDispatch();
  const [form, setForm] = useState(() =>
    Object.fromEntries(
      config.fields.map((field) => {
        const value = record?.[field.key] ?? config.defaults[field.key];
        return [
          field.key,
          field.type === "json" ? JSON.stringify(value, null, 2) : value,
        ];
      }),
    ),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const change = (key, value) => setForm((old) => ({ ...old, [key]: value }));
  async function save(event) {
    event.preventDefault();
    setError("");
    const body = {};
    try {
      for (const field of config.fields) {
        if (record && field.immutable) continue;
        let value = form[field.key];
        if (field.type === "json") {
          value = JSON.parse(value);
          if (!value || typeof value !== "object" || Array.isArray(value))
            throw new Error(`${field.label} must be a JSON object.`);
        } else if (field.type === "number") {
          value = Number(value);
          if (!Number.isSafeInteger(value))
            throw new Error(`${field.label} must be a whole number.`);
        } else if (typeof value === "string") {
          value = value.trim();
          if (!value) throw new Error(`${field.label} is required.`);
        }
        body[field.key] = value;
      }
      setBusy(true);
      await dispatch(
        record ? config.update({ id: record.id, body }) : config.create(body),
      ).unwrap();
      onSaved();
    } catch (err) {
      setError(err.message || "Could not save changes.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog
      wide
      title={`${record ? "Edit" : "Create"} ${config.singular}`}
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <form className="p-6" onSubmit={save}>
        <fieldset disabled={busy} className="space-y-4">
          {config.fields.map((field) => {
            const props = {
              className: "field",
              "aria-label": field.label,
              value: form[field.key],
              required: true,
              disabled: !!record && field.immutable,
              onChange: (e) => change(field.key, e.target.value),
            };
            if (field.type === "user")
              return (
                <UserField
                  key={field.key}
                  value={form[field.key]}
                  onChange={(value) => change(field.key, value)}
                />
              );
            if (field.type === "checkbox")
              return (
                <label key={field.key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form[field.key]}
                    onChange={(e) => change(field.key, e.target.checked)}
                  />
                  {field.label}
                </label>
              );
            return (
              <label key={field.key} className="block">
                <span className="field-label">{field.label}</span>
                {field.options ? (
                  <select {...props}>
                    {field.options.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                ) : field.type === "json" ? (
                  <textarea {...props} rows={5} />
                ) : (
                  <input
                    {...props}
                    type={field.type || "text"}
                    step={field.type === "number" ? 1 : undefined}
                  />
                )}
                {field.hint && (
                  <span className="mt-1 block text-xs text-slate-500">
                    {field.hint}
                  </span>
                )}
              </label>
            );
          })}
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
              {busy ? "Saving…" : `Save ${config.singular}`}
            </button>
          </div>
        </fieldset>
      </form>
    </Dialog>
  );
}

const display = (value) =>
  typeof value === "boolean"
    ? value
      ? "Yes"
      : "No"
    : value && typeof value === "object"
      ? JSON.stringify(value)
      : (value ?? "—");
export default function AdminResourcePage({ section }) {
  const config = adminResourceConfig[section];
  const dispatch = useDispatch();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [params, setParams] = useState(undefined);
  const resource = useAdminResource(config.read, params);
  const [editor, setEditor] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const rows = (resource.data?.items || []).filter(
    (row) =>
      config.serverSearch ||
      config.columns.some(([, key]) =>
        String(display(row[key])).toLowerCase().includes(query.toLowerCase()),
      ),
  );
  return (
    <>
      <div className="admin-section-heading">
        <div>
          <h2>{config.title}</h2>
          {section === "stores" && <p>Manage store details and status.</p>}
        </div>
        <div className="flex gap-2">
          <button
            className="btn-secondary"
            disabled={resource.loading}
            onClick={resource.reload}
          >
            Refresh {config.title.toLowerCase()}
          </button>
          <button className="btn-primary" onClick={() => setEditor({})}>
            Create {config.singular}
          </button>
        </div>
      </div>
      {config.stats && (
        <section
          className="monitoring-stats"
          aria-label={`${config.title} overview`}
        >
          {config.stats.map(([label, key]) => (
            <article key={key} className="monitoring-stat-card">
              <div>
                <p>{label}</p>
                <strong>{resource.data?.[key] ?? "—"}</strong>
              </div>
            </article>
          ))}
        </section>
      )}
      {section === "domains" && resource.data?.primaryDomain && (
        <p className="mb-4 text-sm text-slate-500">
          Primary domain: {resource.data.primaryDomain.domain}
        </p>
      )}
      <AdminDataStatus {...resource} />
      <div className="admin-panel">
        <form
          className="admin-toolbar"
          onSubmit={(e) => {
            e.preventDefault();
            if (config.serverSearch)
              setParams({
                q: query.trim() || undefined,
                status: status || undefined,
              });
          }}
        >
          <input
            className="field"
            aria-label={`Search ${config.title.toLowerCase()}`}
            placeholder={`Search ${config.title.toLowerCase()}`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {config.serverSearch && (
            <>
              <select
                aria-label="Routing status filter"
                className="field admin-filter"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">All statuses</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
              </select>
              <button className="btn-secondary">Apply filters</button>
            </>
          )}
        </form>
        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                {config.columns.map(([label]) => (
                  <th key={label}>{label}</th>
                ))}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  {config.columns.map(([, key]) => (
                    <td key={key}>{display(row[key])}</td>
                  ))}
                  <td>
                    <div className="flex gap-2">
                      {config.update && (
                        <button
                          className="btn-secondary"
                          disabled={resource.loading || !!resource.error}
                          onClick={() => setEditor({ record: row })}
                        >
                          Edit {row.name || row.email || row.domain}
                        </button>
                      )}
                      <button
                        className="btn-secondary"
                        disabled={resource.loading || !!resource.error}
                        onClick={() => {
                          setRemoving(row);
                          setDeleteError("");
                        }}
                      >
                        Delete {row.name || row.email || row.domain}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!resource.loading && !resource.error && !rows.length && (
          <p className="admin-empty">No {config.title.toLowerCase()} found.</p>
        )}
      </div>
      {editor && (
        <ResourceEditor
          config={config}
          record={editor.record}
          onClose={() => setEditor(null)}
          onSaved={() => {
            setEditor(null);
            resource.reload();
          }}
        />
      )}
      {removing && (
        <Dialog
          title={`Delete ${config.singular}?`}
          onClose={() => {
            if (!deleteBusy) setRemoving(null);
          }}
        >
          <div className="space-y-4 p-6">
            <p>Delete {removing.name || removing.email || removing.domain}?</p>
            {deleteError && (
              <p role="alert" className="text-red-600">
                {deleteError}
              </p>
            )}
            <div className="flex justify-end gap-3">
              <button
                className="btn-secondary"
                disabled={deleteBusy}
                onClick={() => setRemoving(null)}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                disabled={deleteBusy}
                onClick={async () => {
                  setDeleteBusy(true);
                  setDeleteError("");
                  try {
                    await dispatch(config.remove(removing.id)).unwrap();
                    setRemoving(null);
                    resource.reload();
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
