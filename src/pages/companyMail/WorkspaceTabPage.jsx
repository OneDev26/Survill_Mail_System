import { useState } from "react";
import { useSelector } from "react-redux";
import useCompanyMail from "../../hooks/useCompanyMail";
import FeatureShell from "../../components/companyMail/FeatureShell";
import Dialog from "../../components/Dialog";
import { canAdminister } from "../../utils/access";
import { workspaceTabConfig } from "./workspaceTabConfig";

function display(value, type) {
  if (value === null || value === undefined || value === "") return "—";
  if (type === "date" && Number.isFinite(Date.parse(value)))
    return new Date(value).toLocaleString();
  return String(value);
}

function RecordEditor({ config, record, resource, onClose, requester }) {
  const fields = record ? config.editFields : config.fields;
  const [form, setForm] = useState(() =>
    Object.fromEntries(
      fields.map(([key]) => [
        key,
        record?.[key] ??
          config.defaults?.[key] ??
          (key === "requester" ? requester : ""),
      ]),
    ),
  );
  const [validation, setValidation] = useState("");
  async function save(event) {
    event.preventDefault();
    setValidation("");
    const body = record ? {} : { ...config.defaults };
    for (const [key, label, type] of fields) {
      const value = form[key].trim();
      if (!value) {
        setValidation(`${label} is required.`);
        return;
      }
      if (type === "datetime-local") {
        if (
          !Number.isFinite(Date.parse(value)) ||
          Date.parse(value) <= Date.now()
        ) {
          setValidation("Choose a future date and time.");
          return;
        }
        body[key] = new Date(value).toISOString();
      } else body[key] = value;
    }
    const action = record
      ? config.actions.update({ id: record.id, body })
      : config.actions.create(body);
    if (await resource.run(action)) onClose();
  }
  return (
    <Dialog
      title={`${record ? "Edit" : "Create"} ${config.title.toLowerCase()} record`}
      onClose={() => {
        if (!resource.busy) onClose();
      }}
    >
      <form className="space-y-4 p-6" onSubmit={save}>
        <fieldset disabled={resource.busy} className="space-y-4">
          {fields.map(([key, label, type = "text"]) => (
            <label className="block text-sm" key={key}>
              {label}
              {Array.isArray(type) ? (
                <select
                  aria-label={label}
                  className="field mt-1"
                  required
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                >
                  {[
                    ...new Set([...type, ...(form[key] ? [form[key]] : [])]),
                  ].map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              ) : type === "textarea" ? (
                <textarea
                  aria-label={label}
                  className="field mt-1"
                  required
                  rows={4}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              ) : (
                <input
                  aria-label={label}
                  className="field mt-1"
                  required
                  type={type}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              )}
            </label>
          ))}
          {fields.some(([, , type]) => type === "datetime-local") && (
            <p className="text-xs text-slate-500">
              Enter your local time. It is saved as a UTC timestamp.
            </p>
          )}
          {(validation || resource.error) && (
            <p role="alert" className="text-sm text-red-600">
              {validation || resource.error}
            </p>
          )}
          <button className="btn-primary">
            {resource.busy ? "Saving…" : "Save record"}
          </button>
        </fieldset>
      </form>
    </Dialog>
  );
}

export default function WorkspaceTabPage({ kind }) {
  const config = workspaceTabConfig[kind];
  const resource = useCompanyMail(kind, config.actions);
  const isAdmin = useSelector(canAdminister);
  const requester = useSelector((state) => state.profile.name);
  const canWrite = !config.adminWrites || isAdmin;
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({});
  const [editor, setEditor] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [removing, setRemoving] = useState(null);
  const selected = resource.items.find((item) => item.id === detailId);
  const rows = resource.items.filter(
    (item) =>
      Object.entries(filters).every(
        ([key, value]) => !value || String(item[key]) === value,
      ) &&
      config.columns.some(([key]) =>
        String(item[key] ?? "")
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
  );
  return (
    <>
      <FeatureShell
        title={config.title}
        description={config.description}
        resource={resource}
      >
        {config.note && <p className="text-sm text-slate-500">{config.note}</p>}
        <div className="flex flex-wrap gap-3">
          <input
            className="field min-w-40 flex-1"
            aria-label={`Search ${config.title.toLowerCase()}`}
            placeholder="Search loaded records"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {config.filters.map(([key, label]) => (
            <select
              key={key}
              className="field w-auto"
              aria-label={label}
              value={filters[key] || ""}
              onChange={(e) =>
                setFilters({ ...filters, [key]: e.target.value })
              }
            >
              <option value="">
                All {label.replace(" filter", "").toLowerCase()} values
              </option>
              {[
                ...new Set(
                  resource.items
                    .map((item) => item[key])
                    .filter((value) => value != null),
                ),
              ].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          ))}
          {canWrite && (
            <button className="btn-primary" onClick={() => setEditor({})}>
              Create record
            </button>
          )}
        </div>
        <p className="text-sm text-slate-500">
          Showing {rows.length} loaded records · Server total:{" "}
          {resource.total ?? "—"}
        </p>
        <div className="space-y-3">
          {rows.map((item) => (
            <article className="card space-y-4" key={item.id}>
              <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {config.columns.map(([key, label, type]) => (
                  <div key={key}>
                    <dt className="text-xs text-slate-500">{label}</dt>
                    <dd className="mt-1 whitespace-pre-wrap break-words text-sm">
                      {display(item[key], type)}
                    </dd>
                  </div>
                ))}
              </dl>
              <div className="flex flex-wrap gap-2">
                <button
                  className="btn-secondary"
                  onClick={() => setDetailId(item.id)}
                >
                  View details
                </button>
                {canWrite && config.editFields && (
                  <button
                    className="btn-secondary"
                    onClick={() => setEditor({ record: item })}
                  >
                    Edit record
                  </button>
                )}
                {canWrite &&
                  config.transition &&
                  item.status === config.transition.from && (
                    <button
                      className="btn-secondary"
                      onClick={() =>
                        resource.run(
                          config.actions.update({
                            id: item.id,
                            body: { status: config.transition.to },
                          }),
                        )
                      }
                    >
                      {config.transition.label}
                    </button>
                  )}
                {canWrite && config.actions.remove && (
                  <button
                    className="btn-secondary"
                    onClick={() => setRemoving(item)}
                  >
                    Delete record
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
        {!resource.error && !rows.length && (
          <p className="card">No records found.</p>
        )}
      </FeatureShell>
      {editor && (
        <RecordEditor
          config={config}
          record={editor.record}
          requester={requester}
          resource={resource}
          onClose={() => setEditor(null)}
        />
      )}
      {selected && (
        <Dialog
          title={`${config.title} details`}
          onClose={() => setDetailId(null)}
        >
          <dl className="space-y-4 p-6">
            {[["id", "Record ID"], ...config.columns].map(
              ([key, label, type]) => (
                <div key={key}>
                  <dt className="text-xs text-slate-500">{label}</dt>
                  <dd className="whitespace-pre-wrap break-words text-sm">
                    {display(selected[key], type)}
                  </dd>
                </div>
              ),
            )}
          </dl>
        </Dialog>
      )}
      {removing && (
        <Dialog
          title="Delete record?"
          onClose={() => {
            if (!resource.busy) setRemoving(null);
          }}
        >
          <div className="space-y-4 p-6">
            <p>
              Delete “{removing.subject}” from {config.title.toLowerCase()}?
            </p>
            {resource.error && (
              <p role="alert" className="text-red-600">
                {resource.error}
              </p>
            )}
            <div className="flex gap-3">
              <button
                disabled={resource.busy}
                className="btn-secondary"
                onClick={() => setRemoving(null)}
              >
                Keep record
              </button>
              <button
                disabled={resource.busy}
                className="btn-primary"
                onClick={async () => {
                  if (await resource.run(config.actions.remove(removing.id)))
                    setRemoving(null);
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
