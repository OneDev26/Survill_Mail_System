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
  CalendarClock,
  KeyRound,
  LogOut,
  Settings2,
  Copy,
  RefreshCw,
  Star,
  Store,
} from "lucide-react";
import Dialog from "../components/Dialog";
import { adminSections, validateRecord, deletionError } from "../api/adminData";
import { adminChanged } from "../redux/slice/adminSlice";
import { signedOut } from "../redux/slice/authSlice";
import { notify } from "../redux/slice/uiSlice";
import "./AdminPage.css";
import EmailMonitoring from "./EmailMonitoring";
import StoresPage from "./StoresPage";
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
  ["stores", "Stores", Store],
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
    if (section === "domains") {
      next.status = record?.status || "Pending verification";
      next.primary = record?.primary ?? state.domains.length === 0;
      next.createdAt = record?.createdAt || new Date().toISOString();
      next.dkimVersion = record?.dkimVersion || 1;
    }
    if (section === "groups") {
      next.status = record?.status || "Active";
      next.createdAt = record?.createdAt || new Date().toISOString();
    }
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
function formatUserDate(value) {
  if (!value) return "Never";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Never" : date.toLocaleString();
}
function userInitials(name) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
function UserDetails({ user, currentUser, onClose }) {
  const isCurrent = currentUser?.id === user.id;
  return (
    <Dialog title="User profile details" onClose={onClose} wide>
      <article className="admin-user-profile">
        <header className="admin-user-profile-header">
          <span className="admin-user-avatar">{userInitials(user.name)}</span>
          <div>
            <div className="admin-user-title-line">
              <h3>{user.name}</h3>
              <Badge>{user.status}</Badge>
            </div>
            <p>{user.email}</p>
            {isCurrent && <small>Currently signed in on this browser</small>}
          </div>
        </header>
        <dl className="admin-user-detail-grid">
          <div>
            <dt>Role</dt>
            <dd>{user.role}</dd>
          </div>
          <div>
            <dt>Department</dt>
            <dd>{user.department}</dd>
          </div>
          <div>
            <dt>Mailbox quota</dt>
            <dd>{user.quota} GB</dd>
          </div>
          <div>
            <dt>Account status</dt>
            <dd>{user.status}</dd>
          </div>
          <div>
            <dt>Last login</dt>
            <dd>{formatUserDate(user.lastLogin)}</dd>
          </div>
          <div>
            <dt>Last forced logout</dt>
            <dd>{formatUserDate(user.forcedLogoutAt)}</dd>
          </div>
          <div>
            <dt>Password last reset</dt>
            <dd>{formatUserDate(user.passwordResetAt)}</dd>
          </div>
          <div>
            <dt>User ID</dt>
            <dd>{user.id}</dd>
          </div>
        </dl>
        <footer className="admin-user-dialog-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </footer>
      </article>
    </Dialog>
  );
}
function UserAccessManager({ user, currentUser, onClose, onEdit }) {
  const dispatch = useDispatch();
  const [status, setStatus] = useState(user.status);
  const [savedStatus, setSavedStatus] = useState(user.status);
  const [resetDone, setResetDone] = useState(false);
  const [logoutDone, setLogoutDone] = useState(false);
  const protectedOwner = user.id === "owner";
  const isCurrent = currentUser?.id === user.id;

  function saveStatus() {
    dispatch(adminChanged({ kind: "userStatus", id: user.id, status }));
    setSavedStatus(status);
    dispatch(notify({ text: `${user.name}'s status changed to ${status}.` }));
  }
  function resetPassword() {
    dispatch(adminChanged({ kind: "resetPassword", id: user.id }));
    setResetDone(true);
    dispatch(notify({ text: `Temporary password created for ${user.name}.` }));
  }
  function forceLogout() {
    dispatch(adminChanged({ kind: "forceLogout", id: user.id }));
    dispatch(notify({ text: `Force logout recorded for ${user.name}.` }));
    if (isCurrent) dispatch(signedOut());
    else setLogoutDone(true);
  }

  return (
    <Dialog title={`Manage access: ${user.name}`} onClose={onClose} wide>
      <div className="admin-user-management">
        <section className="admin-user-management-section">
          <span className="admin-user-action-icon">
            <Settings2 size={18} />
          </span>
          <div>
            <h3>Status management</h3>
            <p>
              Active users can sign in and receive local mail. Suspended users
              are blocked immediately.
            </p>
            <div className="admin-user-action-controls">
              <select
                className="field"
                aria-label={`Status for ${user.name}`}
                value={status}
                disabled={protectedOwner}
                onChange={(event) => setStatus(event.target.value)}
              >
                <option>Active</option>
                <option>Suspended</option>
              </select>
              <button
                className="btn-primary"
                disabled={protectedOwner || status === savedStatus}
                onClick={saveStatus}
              >
                Save status
              </button>
            </div>
            {protectedOwner && (
              <small>The protected owner must remain active.</small>
            )}
          </div>
        </section>
        <section className="admin-user-management-section">
          <span className="admin-user-action-icon">
            <KeyRound size={18} />
          </span>
          <div>
            <h3>Reset password</h3>
            <p>
              Generate a temporary demo password and record the reset in the
              audit log.
            </p>
            {resetDone && (
              <div className="admin-user-action-result" role="status">
                Temporary password: <strong>Demo@1234</strong>
              </div>
            )}
            <button className="btn-secondary" onClick={resetPassword}>
              Reset password
            </button>
          </div>
        </section>
        <section className="admin-user-management-section">
          <span className="admin-user-action-icon danger">
            <LogOut size={18} />
          </span>
          <div>
            <h3>Force logout</h3>
            <p>
              Record session revocation for this local demo account.
              {isCurrent && " This will sign you out of this browser."}
            </p>
            {logoutDone && (
              <div className="admin-user-action-result" role="status">
                Logout request recorded successfully.
              </div>
            )}
            <button className="btn-secondary" onClick={forceLogout}>
              Force logout
            </button>
          </div>
        </section>
        <footer className="admin-user-dialog-footer">
          <button
            className="btn-secondary"
            onClick={() => {
              onClose();
              onEdit();
            }}
          >
            Edit full profile
          </button>
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </footer>
      </div>
    </Dialog>
  );
}
function domainDnsRecords(domain) {
  return [
    {
      label: "Ownership",
      type: "TXT",
      host: "@",
      value: `zoho-verification=${domain.id}.demo`,
    },
    {
      label: "Mail exchange",
      type: "MX",
      host: "@",
      value: "10 mx.demo.zoho.local",
    },
    {
      label: "SPF",
      type: "TXT",
      host: "@",
      value: "v=spf1 include:demo.zoho.local ~all",
    },
    {
      label: "DKIM",
      type: "TXT",
      host: "selector1._domainkey",
      value: `v=DKIM1; k=rsa; p=DEMO-${domain.id.toUpperCase()}-${domain.dkimVersion || 1}`,
    },
    {
      label: "DMARC",
      type: "TXT",
      host: "_dmarc",
      value: `v=DMARC1; p=none; rua=mailto:dmarc@${domain.name}`,
    },
  ];
}
function DomainOverview({ domains }) {
  const verified = domains.filter(
    (domain) => domain.status === "Verified",
  ).length;
  const pending = domains.length - verified;
  const primary = domains.find((domain) => domain.primary);
  return (
    <section className="admin-domain-stats" aria-label="Domain overview">
      <article>
        <span className="admin-domain-stat-icon">
          <Globe size={18} />
        </span>
        <div>
          <p>Total domains</p>
          <strong>{domains.length}</strong>
          <small>Configured locally</small>
        </div>
      </article>
      <article>
        <span className="admin-domain-stat-icon verified">
          <CheckCircle2 size={18} />
        </span>
        <div>
          <p>Verified</p>
          <strong>{verified}</strong>
          <small>Ready for mail setup</small>
        </div>
      </article>
      <article>
        <span className="admin-domain-stat-icon pending">
          <RefreshCw size={18} />
        </span>
        <div>
          <p>Pending</p>
          <strong>{pending}</strong>
          <small>Awaiting DNS checks</small>
        </div>
      </article>
      <article>
        <span className="admin-domain-stat-icon primary">
          <Star size={18} />
        </span>
        <div>
          <p>Primary domain</p>
          <strong className="domain-name">{primary?.name || "Not set"}</strong>
          <small>Default organization domain</small>
        </div>
      </article>
    </section>
  );
}
function DomainManager({ domain, onClose }) {
  const dispatch = useDispatch();
  const [copied, setCopied] = useState("");
  const [verified, setVerified] = useState(domain.status === "Verified");
  const [isPrimary, setIsPrimary] = useState(Boolean(domain.primary));
  const [rotated, setRotated] = useState(false);
  const records = domainDnsRecords(domain);

  function copyValue(label, value) {
    navigator.clipboard?.writeText(value).catch(() => {});
    setCopied(label);
  }
  function verifyDomain() {
    dispatch(adminChanged({ kind: "domainVerify", id: domain.id }));
    setVerified(true);
    dispatch(notify({ text: `${domain.name} marked as verified locally.` }));
  }
  function makePrimary() {
    dispatch(adminChanged({ kind: "domainPrimary", id: domain.id }));
    setIsPrimary(true);
    dispatch(notify({ text: `${domain.name} is now the primary domain.` }));
  }
  function rotateDkim() {
    dispatch(adminChanged({ kind: "domainDkim", id: domain.id }));
    setRotated(true);
    dispatch(notify({ text: `DKIM key rotated for ${domain.name}.` }));
  }

  return (
    <Dialog title={`Domain settings: ${domain.name}`} onClose={onClose} wide>
      <div className="admin-domain-manager">
        <header className="admin-domain-manager-header">
          <span className="admin-domain-hero-icon">
            <Globe size={23} />
          </span>
          <div>
            <div className="admin-domain-title">
              <h3>{domain.name}</h3>
              <Badge>{verified ? "Verified" : "Pending verification"}</Badge>
              {isPrimary && (
                <span className="admin-domain-primary">Primary</span>
              )}
            </div>
            <p>
              Review demo DNS records and manage organization domain settings.
            </p>
          </div>
        </header>

        <section className="admin-domain-quick-actions">
          <div>
            <strong>Verification</strong>
            <p>Simulate a successful DNS ownership and mail-record check.</p>
            <button
              className="btn-secondary"
              disabled={verified}
              onClick={verifyDomain}
            >
              <RefreshCw size={15} />
              {verified ? "Verification complete" : "Run verification"}
            </button>
          </div>
          <div>
            <strong>Primary domain</strong>
            <p>Use this domain as the default for new directory identities.</p>
            <button
              className="btn-secondary"
              disabled={isPrimary}
              onClick={makePrimary}
            >
              <Star size={15} />
              {isPrimary ? "Primary domain" : "Set as primary"}
            </button>
          </div>
          <div>
            <strong>DKIM signing key</strong>
            <p>Generate a new local demo selector and record the rotation.</p>
            <button className="btn-secondary" onClick={rotateDkim}>
              <KeyRound size={15} />
              {rotated ? "Key rotated" : "Rotate DKIM key"}
            </button>
          </div>
        </section>

        <section className="admin-domain-records">
          <div className="admin-domain-records-heading">
            <div>
              <h3>DNS records</h3>
              <p>Publish these illustrative values with your DNS provider.</p>
            </div>
            <span>{records.length} records</span>
          </div>
          <div className="admin-domain-record-list">
            {records.map((record) => (
              <article key={record.label}>
                <div className="admin-domain-record-meta">
                  <span>{record.type}</span>
                  <strong>{record.label}</strong>
                  <small>{record.host}</small>
                </div>
                <code>{record.value}</code>
                <button
                  type="button"
                  aria-label={`Copy ${record.label} value`}
                  onClick={() => copyValue(record.label, record.value)}
                >
                  <Copy size={14} />
                  {copied === record.label ? "Copied" : "Copy"}
                </button>
              </article>
            ))}
          </div>
        </section>

        <footer className="admin-user-dialog-footer">
          <small className="admin-domain-demo-note">
            Demo only  no external DNS request is made.
          </small>
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </footer>
      </div>
    </Dialog>
  );
}
function groupMemberEmails(group) {
  return String(group.members || "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
}
function GroupOverview({ groups }) {
  const memberEmails = new Set(groups.flatMap(groupMemberEmails));
  const active = groups.filter((group) => group.status !== "Paused").length;
  const restricted = groups.filter((group) => group.access !== "Anyone").length;
  return (
    <section className="admin-group-stats" aria-label="Group overview">
      <article>
        <span className="admin-group-stat-icon">
          <UsersRound size={18} />
        </span>
        <div>
          <p>Total groups</p>
          <strong>{groups.length}</strong>
          <small>Distribution lists</small>
        </div>
      </article>
      <article>
        <span className="admin-group-stat-icon members">
          <Users size={18} />
        </span>
        <div>
          <p>Unique members</p>
          <strong>{memberEmails.size}</strong>
          <small>Across all groups</small>
        </div>
      </article>
      <article>
        <span className="admin-group-stat-icon active">
          <CheckCircle2 size={18} />
        </span>
        <div>
          <p>Active delivery</p>
          <strong>{active}</strong>
          <small>{groups.length - active} paused</small>
        </div>
      </article>
      <article>
        <span className="admin-group-stat-icon restricted">
          <ShieldCheck size={18} />
        </span>
        <div>
          <p>Restricted senders</p>
          <strong>{restricted}</strong>
          <small>Protected distribution lists</small>
        </div>
      </article>
    </section>
  );
}
function GroupDetails({ group, users, onClose }) {
  const members = groupMemberEmails(group);
  return (
    <Dialog title="Group details" onClose={onClose} wide>
      <article className="admin-group-details">
        <header className="admin-group-details-header">
          <span className="admin-group-hero-icon">
            <UsersRound size={22} />
          </span>
          <div>
            <div className="admin-group-title">
              <h3>{group.name}</h3>
              <Badge>{group.status || "Active"}</Badge>
            </div>
            <p>{group.email}</p>
          </div>
        </header>
        <dl className="admin-group-detail-grid">
          <div>
            <dt>Members</dt>
            <dd>{members.length}</dd>
          </div>
          <div>
            <dt>Who can send</dt>
            <dd>{group.access}</dd>
          </div>
          <div>
            <dt>Delivery</dt>
            <dd>{group.status || "Active"}</dd>
          </div>
          <div>
            <dt>Created</dt>
            <dd>{formatUserDate(group.createdAt)}</dd>
          </div>
        </dl>
        <section className="admin-group-member-summary">
          <h3>Group members</h3>
          <div>
            {members.map((email) => {
              const user = users.find((item) => item.email === email);
              return (
                <article key={email}>
                  <span>{userInitials(user?.name || email)}</span>
                  <div>
                    <strong>{user?.name || email}</strong>
                    <small>{email}</small>
                  </div>
                  <Badge>{user?.status || "Unknown"}</Badge>
                </article>
              );
            })}
          </div>
        </section>
        <footer className="admin-user-dialog-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </footer>
      </article>
    </Dialog>
  );
}
function GroupManager({ group, users, onClose }) {
  const dispatch = useDispatch();
  const [members, setMembers] = useState(groupMemberEmails(group));
  const [access, setAccess] = useState(group.access);
  const [delivery, setDelivery] = useState(group.status || "Active");
  const [copied, setCopied] = useState(false);
  const [tested, setTested] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const availableUsers = users.filter((user) => user.status === "Active");

  function toggleMember(email) {
    setSaved(false);
    setError("");
    setMembers((current) =>
      current.includes(email)
        ? current.filter((item) => item !== email)
        : [...current, email],
    );
  }
  function saveGroup() {
    if (!members.length) {
      setError("Select at least one active member.");
      return;
    }
    dispatch(
      adminChanged({
        kind: "save",
        section: "groups",
        record: {
          ...group,
          members: members.join(", "),
          access,
          status: delivery,
        },
      }),
    );
    setSaved(true);
    setError("");
    dispatch(notify({ text: `${group.name} settings saved locally.` }));
  }
  function copyAddress() {
    navigator.clipboard?.writeText(group.email).catch(() => {});
    setCopied(true);
  }
  function sendTest() {
    dispatch(adminChanged({ kind: "groupTest", id: group.id }));
    setTested(true);
    dispatch(notify({ text: `Test delivery recorded for ${group.name}.` }));
  }

  return (
    <Dialog title={`Manage group: ${group.name}`} onClose={onClose} wide>
      <div className="admin-group-manager">
        <header className="admin-group-manager-header">
          <div>
            <h3>{group.email}</h3>
            <p>
              Manage local membership, sender permissions, and delivery state.
            </p>
          </div>
          <button className="btn-secondary" onClick={copyAddress}>
            <Copy size={14} />
            {copied ? "Address copied" : "Copy address"}
          </button>
        </header>

        <section className="admin-group-management-grid">
          <div className="admin-group-members-panel">
            <div className="admin-group-panel-heading">
              <div>
                <h3>Members</h3>
                <p>{members.length} selected</p>
              </div>
              <span>{availableUsers.length} available</span>
            </div>
            <div className="admin-group-member-options">
              {availableUsers.map((user) => (
                <label key={user.id}>
                  <input
                    type="checkbox"
                    aria-label={`Include ${user.name}`}
                    checked={members.includes(user.email)}
                    onChange={() => toggleMember(user.email)}
                  />
                  <span>{userInitials(user.name)}</span>
                  <span>
                    <strong>{user.name}</strong>
                    <small>{user.email}</small>
                  </span>
                </label>
              ))}
            </div>
          </div>
          <div className="admin-group-controls-panel">
            <label>
              <span className="field-label">Who can send</span>
              <select
                className="field"
                aria-label="Group sender permission"
                value={access}
                onChange={(event) => {
                  setAccess(event.target.value);
                  setSaved(false);
                }}
              >
                <option>Organization only</option>
                <option>Members only</option>
                <option>Anyone</option>
              </select>
            </label>
            <label>
              <span className="field-label">Delivery status</span>
              <select
                className="field"
                aria-label="Group delivery status"
                value={delivery}
                onChange={(event) => {
                  setDelivery(event.target.value);
                  setSaved(false);
                }}
              >
                <option>Active</option>
                <option>Paused</option>
              </select>
            </label>
            <div className="admin-group-test-action">
              <strong>Test delivery</strong>
              <p>Simulate a delivery check without sending external mail.</p>
              <button className="btn-secondary" onClick={sendTest}>
                {tested ? "Test recorded" : "Run delivery test"}
              </button>
            </div>
          </div>
        </section>
        {error && (
          <p className="admin-group-error" role="alert">
            {error}
          </p>
        )}
        {saved && (
          <p className="admin-group-success" role="status">
            Group settings saved successfully.
          </p>
        )}
        <footer className="admin-user-dialog-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
          <button className="btn-primary" onClick={saveGroup}>
            Save group settings
          </button>
        </footer>
      </div>
    </Dialog>
  );
}
function Directory({ section }) {
  const state = useSelector((s) => s.admin);
  const currentUser = useSelector(sessionUser);
  const dispatch = useDispatch();
  const config = adminSections[section];
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [selected, setSelected] = useState([]);
  const [editor, setEditor] = useState(null);
  const [removal, setRemoval] = useState(null);
  const [error, setError] = useState("");
  const [dns, setDns] = useState(null);
  const [profile, setProfile] = useState(null);
  const [manager, setManager] = useState(null);
  const [groupDetails, setGroupDetails] = useState(null);
  const [groupManager, setGroupManager] = useState(null);
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
      {section === "domains" && <DomainOverview domains={state.domains} />}
      {section === "groups" && <GroupOverview groups={state.groups} />}
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
                {section === "users" && <th>Last login</th>}
                {section === "groups" && (
                  <>
                    <th>Members</th>
                    <th>Delivery</th>
                  </>
                )}
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
                        {key === "name" &&
                          section === "domains" &&
                          row.primary && (
                            <small className="admin-domain-table-primary">
                              <Star size={11} /> Primary domain
                            </small>
                          )}
                      </td>
                    ))}
                  {section === "users" && (
                    <td className="admin-user-last-login">
                      <CalendarClock size={14} />
                      {formatUserDate(row.lastLogin)}
                    </td>
                  )}
                  {section === "domains" && (
                    <td>
                      <Badge>{row.status || "Pending verification"}</Badge>
                    </td>
                  )}
                  {section === "groups" && (
                    <>
                      <td>
                        <span className="admin-group-member-count">
                          <Users size={13} />
                          {groupMemberEmails(row).length}
                        </span>
                      </td>
                      <td>
                        <Badge>{row.status || "Active"}</Badge>
                      </td>
                    </>
                  )}
                  <td>
                    <div className="admin-row-actions">
                      {section === "domains" && (
                        <button
                          aria-label={`Manage DNS for ${row.name}`}
                          onClick={() => setDns(row)}
                        >
                          Manage DNS
                        </button>
                      )}
                      {section === "groups" && (
                        <>
                          <button
                            aria-label={`View ${row.name} group`}
                            onClick={() => setGroupDetails(row)}
                          >
                            View
                          </button>
                          <button
                            aria-label={`Manage ${row.name} group`}
                            onClick={() => setGroupManager(row)}
                          >
                            Manage
                          </button>
                        </>
                      )}
                      {section === "users" && (
                        <>
                          <button
                            aria-label={`View ${row.name} profile`}
                            onClick={() => setProfile(row)}
                          >
                            View
                          </button>
                          <button
                            aria-label={`Manage ${row.name} access`}
                            onClick={() => setManager(row)}
                          >
                            Manage
                          </button>
                        </>
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
      {profile && (
        <UserDetails
          user={profile}
          currentUser={currentUser}
          onClose={() => setProfile(null)}
        />
      )}
      {manager && (
        <UserAccessManager
          user={manager}
          currentUser={currentUser}
          onClose={() => setManager(null)}
          onEdit={() => setEditor(manager)}
        />
      )}
      {groupDetails && (
        <GroupDetails
          group={groupDetails}
          users={state.users}
          onClose={() => setGroupDetails(null)}
        />
      )}
      {groupManager && (
        <GroupManager
          group={groupManager}
          users={state.users}
          onClose={() => setGroupManager(null)}
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
      {dns && <DomainManager domain={dns} onClose={() => setDns(null)} />}
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
            "Stores",
            state.stores.length,
            `${state.stores.reduce((sum, store) => sum + store.employees.length, 0)} employee memberships`,
            Store,
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
            {[
              "All",
              "save",
              "delete",
              "settings",
              "monitor",
              "storeSave",
              "storeDelete",
              "employeeSave",
              "employeeBulk",
              "employeeRemove",
            ].map((item) => (
              <option key={item}>{item}</option>
            ))}
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
        ) : section === "stores" ? (
          <StoresPage />
        ) : section === "audit" ? (
          <Audit />
        ) : (
          <Reports />
        )}
      </div>
    </div>
  );
}
