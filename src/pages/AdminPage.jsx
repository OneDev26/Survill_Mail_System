import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, NavLink, useParams } from "react-router-dom";
import {
  ShieldCheck,
  Users,
  Globe,
  UsersRound,
  AtSign,
  Route,
  ShieldBan,
  LockKeyhole,
  Inbox,
  ChartNoAxesCombined,
  ScrollText,
  Building2,
  LayoutDashboard,
  Plus,
  Download,
  Search,
  ArrowUpRight,
  CheckCircle2,
  Server,
} from "lucide-react";
import Dialog from "../components/Dialog";
import { adminSections, validateRecord, deletionError } from "../api/adminData";
import { adminChanged } from "../redux/slice/adminSlice";
import { notify } from "../redux/slice/uiSlice";
import "./AdminPage.css";
import EmailMonitoring from "./EmailMonitoring";
import { sessionUser } from "../utils/access";

const navigation = [
  ["overview", "Overview", LayoutDashboard],
  ["monitoring", "Email monitoring", Inbox],
  ["users", "Users", Users],
  ["domains", "Domains", Globe],
  ["groups", "Groups", UsersRound],
  ["aliases", "Aliases", AtSign],
  ["routing", "Mail routing", Route],
  ["blocked", "Sender controls", ShieldBan],
  ["security", "Security & retention", LockKeyhole],
  ["quarantine", "Quarantine", Inbox],
  ["reports", "Reports", ChartNoAxesCombined],
  ["audit", "Audit log", ScrollText],
  ["organization", "Organization", Building2],
];
function exportCsv(filename, rows) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const cell = (value) => {
    const text = String(value ?? "");
    return (
      '"' +
      (/^[=+\-@\t\r\n]/.test(text) ? "'" + text : text).replaceAll('"', '""') +
      '"'
    );
  };
  const url = URL.createObjectURL(
    new Blob(
      [
        "\uFEFF" +
          [keys, ...rows.map((row) => keys.map((key) => row[key]))]
            .map((row) => row.map(cell).join(","))
            .join("\r\n"),
      ],
      { type: "text/csv;charset=utf-8" },
    ),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function Badge({ children }) {
  return (
    <span
      className={`admin-badge ${["Active", "Enabled", "Released"].includes(children) ? "positive" : ""}`}
    >
      {children}
    </span>
  );
}
function Empty({ children }) {
  return (
    <div className="admin-empty">
      <Inbox size={28} />
      <p>{children}</p>
    </div>
  );
}
function RecordEditor({ section, record, onClose }) {
  const state = useSelector((s) => s.admin);
  const dispatch = useDispatch();
  const config = adminSections[section];
  const [draft, setDraft] = useState(
    () =>
      record ||
      Object.fromEntries(
        config.fields.map(([key, , type]) => [
          key,
          Array.isArray(type) ? type[0] : type === "number" ? 25 : "",
        ]),
      ),
  );
  const [error, setError] = useState("");
  function submit(event) {
    event.preventDefault();
    const next = { ...draft, id: draft.id || crypto.randomUUID() };
    for (const [key, , type] of config.fields) {
      next[key] =
        type === "number" ? Number(next[key]) : String(next[key]).trim();
      if (
        type === "email" ||
        type === "optional-email" ||
        key === "members" ||
        section === "domains" ||
        (section === "blocked" && key === "name")
      )
        next[key] = String(next[key]).toLowerCase();
    }
    if (section === "domains") next.status = "Pending verification";
    const problem = validateRecord(state, section, next);
    if (problem) {
      setError(problem);
      return;
    }
    dispatch(adminChanged({ kind: "save", section, record: next }));
    dispatch(notify({ text: `${config.singular} saved locally.` }));
    onClose();
  }
  return (
    <Dialog
      title={`${record ? "Edit" : "Add"} ${config.singular}`}
      onClose={onClose}
    >
      <form onSubmit={submit} className="space-y-4 p-6">
        {config.fields.map(([key, label, type]) => (
          <label key={key} className="block">
            <span className="field-label">{label}</span>
            {Array.isArray(type) ? (
              <select
                className="field"
                aria-label={label}
                value={draft[key]}
                onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
              >
                {type.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            ) : type === "textarea" ? (
              <textarea
                className="field"
                required
                maxLength={2000}
                aria-label={label}
                value={draft[key]}
                onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
              />
            ) : (
              <input
                className="field"
                required={type !== "optional-email"}
                maxLength={2000}
                type={type === "optional-email" ? "email" : type || "text"}
                min={type === "number" ? 1 : undefined}
                max={type === "number" ? 10000 : undefined}
                aria-label={label}
                value={draft[key]}
                onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
              />
            )}
          </label>
        ))}
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary">Save {config.singular}</button>
        </div>
      </form>
    </Dialog>
  );
}
function Directory({ section }) {
  const state = useSelector((s) => s.admin);
  const dispatch = useDispatch();
  const config = adminSections[section];
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [selected, setSelected] = useState([]);
  const [editor, setEditor] = useState(null);
  const [removal, setRemoval] = useState(null);
  const [error, setError] = useState("");
  const [dns, setDns] = useState(null);
  const [page, setPage] = useState(1);
  const rows = state[section]
    .filter(
      (row) =>
        Object.values(row)
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase()) &&
        (status === "All" || row.status === status),
    )
    .sort((a, b) =>
      section === "routing"
        ? a.priority - b.priority
        : String(a.name || a.email).localeCompare(b.name || b.email),
    );
  const maxPage = Math.max(1, Math.ceil(rows.length / 10));
  const current = Math.min(page, maxPage);
  const visible = rows.slice((current - 1) * 10, current * 10);
  const statuses = [
    ...new Set(state[section].map((row) => row.status).filter(Boolean)),
  ];
  function remove(ids) {
    const problem = deletionError(state, section, ids);
    setError(problem);
    if (!problem) setRemoval(ids);
  }
  return (
    <>
      <div className="admin-section-heading">
        <div>
          <h2>{config.title}</h2>
          <p>{config.description}</p>
        </div>
        <button className="btn-primary" onClick={() => setEditor({})}>
          <Plus size={16} />
          Add {config.singular}
        </button>
      </div>
      <div className="admin-panel">
        <div className="admin-toolbar">
          <label className="admin-search">
            <Search size={16} />
            <input
              aria-label={`Search ${config.title.toLowerCase()}`}
              placeholder={`Search ${config.title.toLowerCase()}…`}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
            />
          </label>
          {statuses.length > 0 && (
            <select
              aria-label="Filter status"
              className="field admin-filter"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option>All</option>
              {statuses.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          )}
          <button
            className="btn-secondary"
            disabled={!rows.length}
            onClick={() => exportCsv(`${section}.csv`, rows)}
          >
            <Download size={15} />
            Export CSV
          </button>
          {selected.length > 0 && (
            <button className="btn-secondary" onClick={() => remove(selected)}>
              Delete selected ({selected.length})
            </button>
          )}
        </div>
        {error && (
          <p role="alert" className="px-5 pb-3 text-red-600">
            {error}
          </p>
        )}
        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    aria-label="Select page"
                    checked={
                      visible.length > 0 &&
                      visible.every((row) => selected.includes(row.id))
                    }
                    onChange={(e) =>
                      setSelected(
                        e.target.checked
                          ? [
                              ...new Set([
                                ...selected,
                                ...visible.map((row) => row.id),
                              ]),
                            ]
                          : selected.filter(
                              (id) => !visible.some((row) => row.id === id),
                            ),
                      )
                    }
                  />
                </th>
                {config.fields
                  .filter(
                    ([key]) =>
                      !["target", "value", "members"].includes(key) ||
                      section === "aliases",
                  )
                  .map(([key, label]) => (
                    <th key={key}>{label}</th>
                  ))}
                {section === "domains" && <th>Status</th>}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr key={row.id}>
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`Select ${row.name || row.email}`}
                      checked={selected.includes(row.id)}
                      onChange={(e) =>
                        setSelected(
                          e.target.checked
                            ? [...selected, row.id]
                            : selected.filter((id) => id !== row.id),
                        )
                      }
                    />
                  </td>
                  {config.fields
                    .filter(
                      ([key]) =>
                        !["target", "value", "members"].includes(key) ||
                        section === "aliases",
                    )
                    .map(([key]) => (
                      <td key={key}>
                        {key === "status" || key === "role" ? (
                          <Badge>{row[key]}</Badge>
                        ) : (
                          row[key]
                        )}
                        {key === "name" && row.id === "owner" && (
                          <small className="block text-slate-400">
                            You · protected owner
                          </small>
                        )}
                      </td>
                    ))}
                  {section === "domains" && (
                    <td>
                      <Badge>Pending verification</Badge>
                    </td>
                  )}
                  <td>
                    <div className="admin-row-actions">
                      {section === "domains" && (
                        <button onClick={() => setDns(row)}>DNS setup</button>
                      )}
                      <button
                        aria-label={`Edit ${row.name || row.email}`}
                        onClick={() => setEditor(row)}
                      >
                        Edit
                      </button>
                      <button
                        aria-label={`Delete ${row.name || row.email}`}
                        disabled={row.id === "owner"}
                        onClick={() => remove([row.id])}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!rows.length && (
          <Empty>
            No matching {config.title.toLowerCase()}. Add an entry or change
            your search.
          </Empty>
        )}
        <div className="admin-pagination">
          <span>
            {rows.length} records · {selected.length} selected
          </span>
          <div>
            <button
              disabled={current === 1}
              onClick={() => setPage(current - 1)}
            >
              Previous
            </button>
            <span>
              Page {current} of {maxPage}
            </span>
            <button
              disabled={current === maxPage}
              onClick={() => setPage(current + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
      {editor && (
        <RecordEditor
          section={section}
          record={editor.id ? editor : null}
          onClose={() => setEditor(null)}
        />
      )}
      {removal && (
        <Dialog
          title="Delete directory records?"
          onClose={() => setRemoval(null)}
        >
          <div className="space-y-4 p-6">
            <p>
              Delete {removal.length} selected record(s) from this local admin
              directory? This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                className="btn-secondary"
                onClick={() => setRemoval(null)}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  dispatch(
                    adminChanged({ kind: "delete", section, ids: removal }),
                  );
                  setSelected(selected.filter((id) => !removal.includes(id)));
                  setRemoval(null);
                  dispatch(notify({ text: "Directory records deleted." }));
                }}
              >
                Confirm deletion
              </button>
            </div>
          </div>
        </Dialog>
      )}
      {dns && (
        <Dialog title={`DNS setup: ${dns.name}`} onClose={() => setDns(null)}>
          <div className="space-y-4 p-6 text-sm">
            <p>
              Verification is pending. Connect your mail provider before
              publishing DNS records; this demo cannot query or verify DNS.
            </p>
            {[
              [
                "TXT ownership",
                "Obtain a unique verification token from your provider.",
              ],
              [
                "MX delivery",
                "Use the mail servers for your provider and account region.",
              ],
              ["SPF", "Authorize only your actual outbound mail services."],
              ["DKIM", "Generate a signing key through your mail provider."],
              [
                "DMARC",
                "Configure alignment and reporting after SPF and DKIM are ready.",
              ],
            ].map(([title, text]) => (
              <div
                key={title}
                className="rounded-lg border border-slate-200 p-3"
              >
                <strong>{title}</strong>
                <p className="mt-1 text-slate-500">{text}</p>
              </div>
            ))}
          </div>
        </Dialog>
      )}
    </>
  );
}
function Overview() {
  const state = useSelector((s) => s.admin);
  const messages = useSelector((s) => s.mail.messages);
  return (
    <>
      <div className="admin-welcome">
        <div>
          <span className="admin-eyebrow">ORGANIZATION AT A GLANCE</span>
          <h2>A clearer view of your mail workspace.</h2>
          <p>
            Manage your people, organize mail, and prepare your security
            policies in one place.
          </p>
          <Link to="/admin/users">
            Manage your directory <ArrowUpRight size={16} />
          </Link>
        </div>
        <ShieldCheck size={94} strokeWidth={1} />
      </div>
      <div className="admin-stats">
        {[
          [
            "Directory users",
            state.users.length,
            `${state.users.filter((u) => u.status === "Active").length} active accounts`,
            Users,
          ],
          ["Domains", state.domains.length, "DNS verification pending", Globe],
          ["Local messages", messages.length, "Current demo mailbox", Inbox],
          [
            "Held messages",
            state.quarantine.filter((q) => q.status === "Held").length,
            "Demo quarantine",
            ShieldBan,
          ],
        ].map(([label, value, caption, Icon]) => (
          <div className="admin-stat" key={label}>
            <div>
              <span>{label}</span>
              <Icon size={18} />
            </div>
            <strong>{value}</strong>
            <p>{caption}</p>
          </div>
        ))}
      </div>
      <div className="admin-two-col">
        <section className="admin-panel admin-padded">
          <h3>Workspace setup</h3>
          <p className="admin-muted">
            Your path from local workspace to a connected organization.
          </p>
          {[
            [
              "users",
              "Build your directory",
              `${state.users.length} users configured`,
              true,
            ],
            [
              "domains",
              "Connect your domains",
              "Provider verification required",
              false,
            ],
            [
              "security",
              "Review security policies",
              "Saved locally, awaiting backend enforcement",
              false,
            ],
            [
              "organization",
              "Organization details",
              state.organization.name,
              true,
            ],
          ].map(([route, title, text, done]) => (
            <Link
              className="admin-checklist"
              to={`/admin/${route}`}
              key={route}
            >
              <CheckCircle2
                size={21}
                className={done ? "text-emerald-600" : "text-slate-300"}
              />
              <div>
                <strong>{title}</strong>
                <p>{text}</p>
              </div>
              <ArrowUpRight size={16} />
            </Link>
          ))}
        </section>
        <section className="admin-panel admin-padded">
          <h3>Recent activity</h3>
          <p className="admin-muted">Changes made in this browser.</p>
          {state.audit.length ? (
            state.audit.slice(0, 5).map((event) => (
              <div className="admin-activity" key={event.id}>
                <span className="admin-activity-dot" />
                <div>
                  <strong>{event.detail}</strong>
                  <p>{new Date(event.at).toLocaleString()}</p>
                </div>
              </div>
            ))
          ) : (
            <Empty>Your first admin change will appear here.</Empty>
          )}
          <Link className="admin-text-link" to="/admin/audit">
            View audit log <ArrowUpRight size={14} />
          </Link>
        </section>
      </div>
    </>
  );
}
function Settings({ section }) {
  const stored = useSelector((s) => s.admin[section]);
  const dispatch = useDispatch();
  const [draft, setDraft] = useState(stored);
  const [error, setError] = useState("");
  const security = section === "security";
  function save(event) {
    event.preventDefault();
    setError("");
    if (!security) {
      try {
        new Intl.DateTimeFormat("en", { timeZone: draft.timezone });
      } catch {
        setError("Enter a valid IANA time zone, such as Asia/Kolkata.");
        return;
      }
    }
    const values = security
      ? draft
      : Object.fromEntries(
          Object.entries(draft).map(([key, value]) => [key, value.trim()]),
        );
    if (!security && !values.name) {
      setError("Organization name is required.");
      return;
    }
    dispatch(adminChanged({ kind: "settings", section, values }));
    dispatch(notify({ text: "Configuration saved locally." }));
  }
  return (
    <>
      <div className="admin-section-heading">
        <div>
          <h2>{security ? "Security & retention" : "Organization"}</h2>
          <p>
            {security
              ? "Define your intended policy. These settings are not enforced in the demo."
              : "Manage your organization identity and administrative contact."}
          </p>
        </div>
      </div>
      <form className="admin-panel admin-padded admin-settings" onSubmit={save}>
        {security ? (
          <>
            <h3>Access policies</h3>
            {[
              [
                "requireMfa",
                "Require multi-factor authentication",
                "Require a second factor for organization accounts.",
              ],
              [
                "externalForwarding",
                "Allow external forwarding",
                "Permit forwarding mail outside the organization.",
              ],
              [
                "allowImap",
                "Allow IMAP access",
                "Allow supported desktop and mobile clients.",
              ],
              [
                "allowPop",
                "Allow POP access",
                "Allow clients to download messages through POP.",
              ],
            ].map(([key, label, description]) => (
              <label className="admin-toggle" key={key}>
                <span>
                  <strong>{label}</strong>
                  <small>{description}</small>
                </span>
                <input
                  type="checkbox"
                  checked={draft[key]}
                  onChange={(e) =>
                    setDraft({ ...draft, [key]: e.target.checked })
                  }
                />
              </label>
            ))}
            <h3 className="mt-6">Session & data policy</h3>
            <div className="admin-settings-grid">
              {[
                ["sessionMinutes", "Session duration (minutes)", 5, 1440],
                ["passwordLength", "Minimum password length", 8, 128],
                ["retentionDays", "Retention period (days)", 1, 3650],
              ].map(([key, label, min, max]) => (
                <label key={key}>
                  <span className="field-label">{label}</span>
                  <input
                    required
                    className="field"
                    type="number"
                    min={min}
                    max={max}
                    step="1"
                    aria-label={label}
                    value={draft[key]}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        [key]:
                          e.target.value === "" ? "" : Number(e.target.value),
                      })
                    }
                  />
                </label>
              ))}
            </div>
          </>
        ) : (
          <div className="space-y-5">
            {[
              ["name", "Organization name", "text"],
              ["contact", "Admin contact email", "email"],
              ["timezone", "Organization time zone", "text"],
            ].map(([key, label, type]) => (
              <label className="block" key={key}>
                <span className="field-label">{label}</span>
                <input
                  required
                  maxLength={200}
                  className="field"
                  type={type}
                  aria-label={label}
                  value={draft[key]}
                  onChange={(e) =>
                    setDraft({ ...draft, [key]: e.target.value })
                  }
                />
              </label>
            ))}
            <p className="admin-muted">
              Use an IANA time zone, for example Asia/Kolkata. Dates in this
              console follow your browser time zone.
            </p>
          </div>
        )}
        {error && (
          <p role="alert" className="text-red-600">
            {error}
          </p>
        )}
        <div className="mt-6 flex gap-2">
          <button className="btn-primary">Save configuration</button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setDraft(stored);
              setError("");
            }}
          >
            Discard changes
          </button>
        </div>
      </form>
    </>
  );
}
function Quarantine() {
  const rows = useSelector((s) => s.admin.quarantine);
  const dispatch = useDispatch();
  const [action, setAction] = useState(null);
  const [status, setStatus] = useState("Held");
  const visible = rows.filter(
    (row) => status === "All" || row.status === status,
  );
  return (
    <>
      <div className="admin-section-heading">
        <div>
          <h2>Quarantine</h2>
          <p>
            Review simulated held messages. Release changes the local review
            status; it does not deliver mail.
          </p>
        </div>
        <select
          className="field admin-filter"
          aria-label="Quarantine status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          {["Held", "Released", "Deleted", "All"].map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </div>
      <div className="admin-panel">
        {visible.map((row) => (
          <div key={row.id} className="admin-quarantine">
            <div>
              <strong>{row.subject}</strong>
              <p>
                {row.sender} → {row.recipient}
              </p>
              <p>{row.reason}</p>
              <Badge>{row.status}</Badge>
            </div>
            {row.status === "Held" && (
              <div className="flex gap-2">
                <button
                  className="btn-secondary"
                  onClick={() => setAction({ id: row.id, status: "Released" })}
                >
                  Release
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => setAction({ id: row.id, status: "Deleted" })}
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
        {!visible.length && <Empty>No {status.toLowerCase()} messages.</Empty>}
      </div>
      {action && (
        <Dialog
          title="Confirm quarantine action"
          onClose={() => setAction(null)}
        >
          <div className="space-y-4 p-6">
            <p>
              Mark this demo message as {action.status.toLowerCase()}? This
              local review action cannot be undone. No message will be delivered
              or removed from a real server.
            </p>
            <div className="flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => setAction(null)}>
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  dispatch(adminChanged({ kind: "quarantine", ...action }));
                  setAction(null);
                  dispatch(notify({ text: "Demo quarantine status updated." }));
                }}
              >
                Confirm action
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </>
  );
}
function Audit() {
  const rows = useSelector((s) => s.admin.audit);
  const [query, setQuery] = useState("");
  const [action, setAction] = useState("All");
  const visible = rows.filter(
    (row) =>
      (action === "All" || row.action === action) &&
      `${row.actor} ${row.detail}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <div className="admin-section-heading">
        <div>
          <h2>Audit log</h2>
          <p>
            Latest 1,000 local changes. Browser history is editable and is not a
            compliance audit record.
          </p>
        </div>
        <button
          className="btn-secondary"
          disabled={!visible.length}
          onClick={() => exportCsv("admin-audit.csv", visible)}
        >
          <Download size={15} />
          Export CSV
        </button>
      </div>
      <div className="admin-panel">
        <div className="admin-toolbar">
          <label className="admin-search">
            <Search size={16} />
            <input
              aria-label="Search audit log"
              placeholder="Search actor or activity…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <select
            className="field admin-filter"
            aria-label="Audit action"
            value={action}
            onChange={(e) => setAction(e.target.value)}
          >
            {["All", "save", "delete", "settings", "quarantine", "monitor"].map(
              (item) => (
                <option key={item}>{item}</option>
              ),
            )}
          </select>
        </div>
        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Time (browser local)</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr key={row.id}>
                  <td>{new Date(row.at).toLocaleString()}</td>
                  <td>{row.actor}</td>
                  <td>
                    <Badge>{row.action}</Badge>
                  </td>
                  <td>{row.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!visible.length && <Empty>No matching activity.</Empty>}
      </div>
    </>
  );
}
function Reports() {
  const state = useSelector((s) => s.admin);
  const messages = useSelector((s) => s.mail.messages);
  const rows = Object.entries(
    messages.reduce(
      (counts, message) => ({
        ...counts,
        [message.folder]: (counts[message.folder] || 0) + 1,
      }),
      {},
    ),
  ).map(([folder, count]) => ({ folder, count }));
  return (
    <>
      <div className="admin-section-heading">
        <div>
          <h2>Reports</h2>
          <p>Live counts from the local mailbox and admin directory.</p>
        </div>
        <button
          className="btn-secondary"
          disabled={!rows.length}
          onClick={() => exportCsv("mailbox-report.csv", rows)}
        >
          <Download size={15} />
          Export CSV
        </button>
      </div>
      <div className="admin-two-col">
        <section className="admin-panel admin-padded">
          <h3>Mailbox distribution</h3>
          {rows.map((row) => (
            <div key={row.folder} className="admin-chart-row">
              <div>
                <span>{row.folder}</span>
                <strong>{row.count}</strong>
              </div>
              <div className="admin-bar">
                <span
                  style={{
                    width: `${(row.count / Math.max(1, messages.length)) * 100}%`,
                  }}
                />
              </div>
            </div>
          ))}
          {!rows.length && <Empty>No mailbox data.</Empty>}
        </section>
        <section className="admin-panel admin-padded">
          <h3>Directory capacity</h3>
          <div className="admin-capacity">
            {state.users.reduce((sum, user) => sum + Number(user.quota), 0)}{" "}
            <span>GB allocated</span>
          </div>
          <p className="admin-muted">
            Configured quotas across {state.users.length} users. This is planned
            capacity, not measured storage usage.
          </p>
          <div className="admin-checklist">
            <Users size={20} />
            <div>
              <strong>{state.groups.length} distribution groups</strong>
              <p>{state.aliases.length} alternate addresses</p>
            </div>
          </div>
          <div className="admin-checklist">
            <Server size={20} />
            <div>
              <strong>Server metrics unavailable</strong>
              <p>
                Connect a backend for delivery rates, storage usage, and login
                telemetry.
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
export default function AdminPage() {
  const { section = "overview" } = useParams();
  const name = useSelector((s) => s.admin.organization.name);
  const user = useSelector(sessionUser);
  const known = navigation.some(([key]) => key === section);
  return (
    <div className="admin-root">
      <header className="admin-header">
        <div className="admin-brand-icon">
          <ShieldCheck size={24} />
        </div>
        <div>
          <div className="admin-eyebrow">{name} / ADMINISTRATION</div>
          <h1>Admin console</h1>
        </div>
        <span className="admin-owner">{user?.role} ? Demo</span>
      </header>
      <div className="admin-demo-note">
        <span className="size-2 shrink-0 rounded-full bg-amber-500" />
        Local demo: directory and policy changes are saved in this browser.
        Server authentication, DNS verification, delivery, and security
        enforcement require backend integration.
      </div>
      <nav className="admin-nav" aria-label="Administration">
        {navigation.map(([key, label, Icon]) => (
          <NavLink
            key={key}
            to={`/admin/${key}`}
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="admin-content">
        {!known ? (
          <Empty>
            Admin section not found.{" "}
            <Link to="/admin/overview">Return to overview</Link>
          </Empty>
        ) : adminSections[section] ? (
          <Directory key={section} section={section} />
        ) : section === "monitoring" ? (
          <EmailMonitoring />
        ) : section === "overview" ? (
          <Overview />
        ) : ["organization", "security"].includes(section) ? (
          <Settings key={section} section={section} />
        ) : section === "quarantine" ? (
          <Quarantine />
        ) : section === "audit" ? (
          <Audit />
        ) : (
          <Reports />
        )}
      </div>
    </div>
  );
}
