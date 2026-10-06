import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import {
  Store,
  Plus,
  Search,
  ArrowLeft,
  Users,
  MapPin,
  Pencil,
  Trash2,
} from "lucide-react";
import Dialog from "../components/Dialog";
import { adminChanged } from "../redux/slice/adminSlice";
import { notify } from "../redux/slice/uiSlice";
import {
  cleanStore,
  storeError,
  cleanEmployee,
  employeeError,
  employeeBatchError,
} from "../api/storeData";
import "./StoresPage.css";

function StoreEditor({ record, onClose }) {
  const stores = useSelector((state) => state.admin.stores);
  const dispatch = useDispatch();
  const [draft, setDraft] = useState(
    record || { name: "", code: "", location: "", status: "Active" },
  );
  const [error, setError] = useState("");
  function save(event) {
    event.preventDefault();
    const next = cleanStore({ ...draft, id: draft.id || crypto.randomUUID() });
    const problem = storeError(stores, next);
    if (problem) {
      setError(problem);
      return;
    }
    dispatch(adminChanged({ kind: "storeSave", record: next }));
    dispatch(
      notify({
        text: record
          ? "Store updated."
          : "Store created. Open it to add employees.",
      }),
    );
    onClose();
  }
  return (
    <Dialog title={record ? "Edit store" : "Add store"} onClose={onClose}>
      <form onSubmit={save} className="space-y-4 p-6">
        {[
          ["name", "Store name", 100],
          ["code", "Store code", 30],
          ["location", "Location (optional)", 200],
        ].map(([key, label, max]) => (
          <label key={key} className="block">
            <span className="field-label">{label}</span>
            <input
              className="field"
              autoFocus={key === "name"}
              required={key !== "location"}
              maxLength={max}
              value={draft[key]}
              onChange={(event) =>
                setDraft({ ...draft, [key]: event.target.value })
              }
            />
          </label>
        ))}
        <p className="text-xs text-slate-500">
          Use a unique code such as DEL-01 to identify this store.
        </p>
        <label className="block">
          <span className="field-label">Store status</span>
          <select
            className="field"
            aria-label="Store status"
            value={draft.status}
            onChange={(event) =>
              setDraft({ ...draft, status: event.target.value })
            }
          >
            <option>Active</option>
            <option>Inactive</option>
          </select>
        </label>
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary">Save store</button>
        </div>
      </form>
    </Dialog>
  );
}

function EmployeeEditor({ storeId, employee, bulk, onClose }) {
  const store = useSelector((state) =>
    state.admin.stores.find((item) => item.id === storeId),
  );
  const directory = useSelector((state) => state.admin.users);
  const dispatch = useDispatch();
  const [draft, setDraft] = useState(employee || { name: "", email: "" });
  const [emails, setEmails] = useState("");
  const [error, setError] = useState("");
  function save(event) {
    event.preventDefault();
    if (bulk) {
      const employees = emails
        .split(/[,;\n]+/)
        .map((email) => email.trim())
        .filter(Boolean)
        .map((email) =>
          cleanEmployee({ id: crypto.randomUUID(), name: "", email }),
        );
      const problem = employeeBatchError(store, employees);
      if (problem) {
        setError(problem);
        return;
      }
      dispatch(adminChanged({ kind: "employeeBulk", storeId, employees }));
      dispatch(
        notify({
          text: `${employees.length} employees added to ${store.name}.`,
        }),
      );
    } else {
      const record = cleanEmployee({
        ...draft,
        id: draft.id || crypto.randomUUID(),
      });
      const problem = employeeError(store, record);
      if (problem) {
        setError(problem);
        return;
      }
      dispatch(adminChanged({ kind: "employeeSave", storeId, record }));
      dispatch(
        notify({
          text: employee ? "Employee updated." : "Employee added to store.",
        }),
      );
    }
    onClose();
  }
  return (
    <Dialog
      title={
        bulk
          ? "Add employee emails"
          : employee
            ? "Edit employee"
            : "Add employee"
      }
      onClose={onClose}
    >
      <form className="space-y-4 p-6" onSubmit={save}>
        <p className="text-sm font-medium text-brand-600">
          {store?.name} · {store?.code}
        </p>
        {bulk ? (
          <label className="block">
            <span className="field-label">Employee email addresses</span>
            <textarea
              autoFocus
              className="field min-h-40"
              required
              maxLength={51200}
              placeholder={"employee1@example.com\nemployee2@example.com"}
              value={emails}
              onChange={(event) => setEmails(event.target.value)}
            />
            <span className="mt-2 block text-xs text-slate-500">
              One per line, or separated by commas or semicolons. Up to 200
              emails; the entire list is checked before saving.
            </span>
          </label>
        ) : (
          <>
            <label className="block">
              <span className="field-label">Employee name (optional)</span>
              <input
                autoFocus
                className="field"
                maxLength={100}
                value={draft.name}
                onChange={(event) =>
                  setDraft({ ...draft, name: event.target.value })
                }
              />
            </label>
            <label className="block">
              <span className="field-label">Employee email</span>
              <input
                className="field"
                type="email"
                aria-label="Employee email"
                required
                maxLength={254}
                list="store-directory-emails"
                value={draft.email}
                onChange={(event) =>
                  setDraft({ ...draft, email: event.target.value })
                }
              />
              <datalist id="store-directory-emails">
                {directory.map((user) => (
                  <option key={user.id} value={user.email}>
                    {user.name}
                  </option>
                ))}
              </datalist>
            </label>
          </>
        )}
        <p className="text-xs leading-5 text-slate-500">
          Add an existing employee email address. This records store membership;
          it does not create a mailbox or change account access.
        </p>
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary">
            {bulk ? "Add emails" : "Save employee"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}

function StoreEmployees({ store, onEdit, onBack, onRemove }) {
  const directory = useSelector((state) => state.admin.users);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [editor, setEditor] = useState(null);
  const rows = store.employees
    .filter((employee) =>
      `${employee.name} ${employee.email}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
    )
    .sort((a, b) => a.email.localeCompare(b.email));
  const pages = Math.max(1, Math.ceil(rows.length / 10));
  const current = Math.min(page, pages);
  const active = store.status === "Active";
  return (
    <>
      <button
        className="mb-4 inline-flex items-center gap-2 text-sm text-brand-600"
        onClick={onBack}
      >
        <ArrowLeft size={16} />
        All stores
      </button>
      <div className="admin-section-heading">
        <div>
          <h2>{store.name}</h2>
          <p>
            {store.code}
            {store.location ? ` · ${store.location}` : ""} ·{" "}
            {store.employees.length} employees
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`admin-badge ${active ? "positive" : ""}`}>
            {store.status}
          </span>
          <button className="btn-secondary" onClick={onEdit}>
            <Pencil size={15} />
            Edit store
          </button>
          <button
            className="btn-secondary"
            disabled={!active}
            onClick={() => setEditor({ bulk: true })}
          >
            Add emails in bulk
          </button>
          <button
            className="btn-primary"
            disabled={!active}
            onClick={() => setEditor({})}
          >
            <Plus size={16} />
            Add employee
          </button>
        </div>
      </div>
      {!active && (
        <p className="mb-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
          This store is inactive. Edit its status to add or edit employees.
          Existing email accounts are unaffected.
        </p>
      )}
      <div className="admin-panel">
        <div className="admin-toolbar">
          <label className="admin-search">
            <Search size={16} />
            <input
              aria-label="Search store employees"
              placeholder="Search employee name or email…"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
            />
          </label>
        </div>
        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Email address</th>
                <th>Directory account</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice((current - 1) * 10, current * 10).map((employee) => {
                const user = directory.find(
                  (item) =>
                    item.email.toLowerCase() === employee.email.toLowerCase(),
                );
                return (
                  <tr key={employee.id}>
                    <td>{employee.name || user?.name || "—"}</td>
                    <td>{employee.email}</td>
                    <td>
                      <span
                        className={`admin-badge ${user?.status === "Active" ? "positive" : ""}`}
                      >
                        {user ? `${user.status} account` : "Email record only"}
                      </span>
                    </td>
                    <td>
                      <div className="admin-row-actions">
                        <button
                          disabled={!active}
                          aria-label={`Edit employee ${employee.email}`}
                          onClick={() => setEditor({ employee })}
                        >
                          Edit
                        </button>
                        <button
                          aria-label={`Remove employee ${employee.email}`}
                          onClick={() => onRemove(employee)}
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!rows.length && (
          <div className="admin-empty">
            <Users size={28} />
            <p>
              {query
                ? "No employees match your search."
                : "No employees yet. Add the email addresses of this store’s team."}
            </p>
          </div>
        )}
        <div className="admin-pagination">
          <span>{rows.length} employees</span>
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
      {editor && (
        <EmployeeEditor
          storeId={store.id}
          employee={editor.employee}
          bulk={editor.bulk}
          onClose={() => setEditor(null)}
        />
      )}
    </>
  );
}

export default function StoresPage() {
  const stores = useSelector((state) => state.admin.stores);
  const dispatch = useDispatch();
  const [params, setParams] = useSearchParams();
  const selected = params.get("store");
  const store = stores.find((item) => item.id === selected);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [editor, setEditor] = useState(null);
  const [removal, setRemoval] = useState(null);
  const [error, setError] = useState("");
  const visible = stores
    .filter(
      (item) =>
        (status === "All" || item.status === status) &&
        `${item.name} ${item.code} ${item.location} ${item.employees.map((employee) => `${employee.name} ${employee.email}`).join(" ")}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
    )
    .sort((a, b) => a.name.localeCompare(b.name));
  function open(id) {
    setError("");
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      if (id) next.set("store", id);
      else next.delete("store");
      return next;
    });
  }
  function requestDelete(item) {
    setError("");
    if (item.employees.length) {
      setError("Remove this store’s employees before deleting the store.");
      return;
    }
    setRemoval({ store: item });
  }
  function remove() {
    const current = stores.find((item) => item.id === removal.store.id);
    if (!removal.employee && current?.employees.length) {
      setError("Remove this store’s employees before deleting the store.");
      setRemoval(null);
      return;
    }
    dispatch(
      adminChanged({
        kind: removal.employee ? "employeeRemove" : "storeDelete",
        storeId: removal.store.id,
        employeeId: removal.employee?.id,
      }),
    );
    if (!removal.employee && selected === removal.store.id) open(null);
    dispatch(
      notify({
        text: removal.employee
          ? "Employee removed from store."
          : "Store deleted.",
      }),
    );
    setRemoval(null);
  }
  return (
    <>
      {error && (
        <p
          role="alert"
          className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600"
        >
          {error}
        </p>
      )}
      {selected && !store ? (
        <div className="admin-panel admin-empty">
          <p>This store is no longer available.</p>
          <button className="btn-secondary" onClick={() => open(null)}>
            All stores
          </button>
        </div>
      ) : store ? (
        <StoreEmployees
          key={store.id}
          store={store}
          onBack={() => open(null)}
          onEdit={() => setEditor(store)}
          onRemove={(employee) => setRemoval({ store, employee })}
        />
      ) : (
        <>
          <div className="admin-section-heading">
            <div>
              <h2>Stores</h2>
              <p>
                Organize stores and maintain each store’s employee email
                addresses.
              </p>
            </div>
            <button className="btn-primary" onClick={() => setEditor({})}>
              <Plus size={16} />
              Add store
            </button>
          </div>
          <div className="store-summary">
            <span>
              <strong>{stores.length}</strong> stores
            </span>
            <span>
              <strong>
                {stores.filter((item) => item.status === "Active").length}
              </strong>{" "}
              active
            </span>
            <span>
              <strong>
                {stores.reduce(
                  (total, item) => total + item.employees.length,
                  0,
                )}
              </strong>{" "}
              employee memberships
            </span>
          </div>
          <div className="admin-panel">
            <div className="admin-toolbar">
              <label className="admin-search">
                <Search size={16} />
                <input
                  aria-label="Search stores"
                  placeholder="Search store, code, location, or employee email…"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
              <select
                className="field admin-filter"
                aria-label="Filter stores by status"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                <option>All</option>
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>
          </div>
          <div className="store-grid">
            {visible.map((item) => (
              <section key={item.id} className="admin-panel store-card">
                <div className="store-card-title">
                  <span className="admin-brand-icon">
                    <Store size={23} />
                  </span>
                  <span
                    className={`admin-badge ${item.status === "Active" ? "positive" : ""}`}
                  >
                    {item.status}
                  </span>
                </div>
                <h3>{item.name}</h3>
                <span className="store-code">{item.code}</span>
                <p className="store-location">
                  <MapPin size={14} />
                  {item.location || "No location added"}
                </p>
                <div className="store-card-footer">
                  <span>
                    <Users size={15} />
                    {item.employees.length} employees
                  </span>
                  <div className="flex gap-3">
                    <button
                      aria-label={`Edit store ${item.name}`}
                      title="Edit store"
                      onClick={() => setEditor(item)}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      aria-label={`Delete store ${item.name}`}
                      title="Delete store"
                      onClick={() => requestDelete(item)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <button
                  className="btn-secondary w-full"
                  aria-label={`Manage employees for ${item.name}`}
                  onClick={() => open(item.id)}
                >
                  Manage employees
                </button>
              </section>
            ))}
          </div>
          {!visible.length && (
            <div className="admin-panel admin-empty">
              <Store size={32} />
              <p>
                {stores.length
                  ? "No stores match your filters."
                  : "Add your first store, then add its employee email addresses."}
              </p>
            </div>
          )}
        </>
      )}
      {editor && (
        <StoreEditor
          record={editor.id ? editor : null}
          onClose={() => setEditor(null)}
        />
      )}
      {removal && (
        <Dialog
          title={
            removal.employee ? "Remove employee from store?" : "Delete store?"
          }
          onClose={() => setRemoval(null)}
        >
          <div className="space-y-4 p-6">
            <p className="break-words text-sm">
              {removal.employee
                ? `Remove ${removal.employee.email} from ${removal.store.name}? Their email account and messages will be preserved.`
                : `Delete ${removal.store.name} (${removal.store.code})? This cannot be undone.`}
            </p>
            <div className="flex justify-end gap-2">
              <button
                className="btn-secondary"
                onClick={() => setRemoval(null)}
              >
                Cancel
              </button>
              <button className="btn-primary" onClick={remove}>
                {removal.employee ? "Confirm removal" : "Confirm deletion"}
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </>
  );
}
