import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  fetchAdminSection,
  createUser,
  updateUser,
  assignAlias,
  removeAlias,
  saveKnownDomain,
  deleteKnownDomain,
  syncContacts,
} from "../redux/thunks/adminThunks";
import Dialog from "../components/Dialog";
import ConfirmDialog from "../components/ConfirmDialog";
const sections = [
  "users",
  "aliases",
  "known-domains",
  "inbound-log",
  "zoho-sync",
];
export default function AdminPage() {
  const { section } = useParams();
  return <Admin key={section} section={section} />;
}
function Admin({ section }) {
  const dispatch = useDispatch();
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [editor, setEditor] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let active = true;
    dispatch(fetchAdminSection(section))
      .unwrap()
      .then((data) => {
        if (active) {
          setItems(data.items);
          setStatus(data.sync || null);
        }
      })
      .catch((error) => {
        if (active) setError(error.message);
      });
    return () => {
      active = false;
    };
  }, [dispatch, section, version]);
  async function run(fn) {
    setBusy(true);
    setError("");
    try {
      await fn();
      setEditor(null);
      setConfirm(null);
      setVersion((v) => v + 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  async function save(e) {
    e.preventDefault();
    await run(async () => {
      if (section === "known-domains")
        await dispatch(
          saveKnownDomain({ domain: editor.domain, name: editor.name }),
        ).unwrap();
      else if (section === "aliases")
        await dispatch(
          assignAlias({
            id: editor.id,
            body: {
              email: editor.email,
              canSend: editor.canSend,
            },
          }),
        ).unwrap();
      else {
        const body = {
          displayName: editor.displayName,
          role: editor.role,
          recoveryEmail: editor.recoveryEmail || null,
          ...(editor.password ? { password: editor.password } : {}),
        };
        if (editor.id)
          await dispatch(
            updateUser({
              id: editor.id,
              body: {
                ...body,
                isActive: editor.isActive,
              },
            }),
          ).unwrap();
        else
          await dispatch(createUser({ ...body, email: editor.email })).unwrap();
      }
    });
  }
  return (
    <div className="flex-1 overflow-auto p-6">
      <h1 className="text-2xl font-semibold">Administration</h1>
      <nav className="my-5 flex flex-wrap gap-3">
        {sections.map((s) => (
          <Link className="btn-secondary capitalize" key={s} to={`/admin/${s}`}>
            {s.replaceAll("-", " ")}
          </Link>
        ))}
      </nav>
      {!sections.includes(section) && (
        <p className="card">
          {section === "overview"
            ? "Manage mailbox users, aliases, trusted company identities, inbound processing, and contact synchronization using the sections above."
            : "This feature has no endpoint in the supplied backend. It is unavailable in connected mode."}
        </p>
      )}
      {error && (
        <p role="alert" className="my-4 text-red-600">
          {error}
        </p>
      )}
      <fieldset disabled={busy} className="space-y-4">
        {["users", "known-domains"].includes(section) && (
          <button
            className="btn-primary"
            onClick={() =>
              setEditor(
                section === "users"
                  ? {
                      email: "",
                      displayName: "",
                      password: "",
                      recoveryEmail: "",
                      role: "member",
                      isActive: true,
                    }
                  : { domain: "", name: "" },
              )
            }
          >
            Create {section === "users" ? "user" : "known domain"}
          </button>
        )}
        {section === "known-domains" && (
          <p className="text-sm">
            Known domains resolve sender identities. They do not provision mail
            hosting or verify DNS.
          </p>
        )}
        {items.map((item, index) => (
          <article
            className="card space-y-2"
            key={item.id || item.ses_message_id || index}
          >
            {section === "users" && (
              <>
                <h2 className="font-semibold">{item.displayName}</h2>
                <p>
                  {item.email} · {item.role} ·{" "}
                  {item.isActive ? "Active" : "Inactive"}
                </p>
                <button
                  className="btn-secondary"
                  onClick={() => setEditor({ ...item, password: "" })}
                >
                  Edit {item.email}
                </button>
              </>
            )}
            {section === "aliases" && (
              <>
                <h2>{item.email}</h2>
                {item.aliases.map((a) => (
                  <p key={a.email}>
                    {a.email} ({a.canSend ? "send and receive" : "receive only"}
                    ){" "}
                    <button
                      className="btn-secondary"
                      onClick={() =>
                        setConfirm({
                          kind: "alias",
                          id: item.id,
                          email: a.email,
                        })
                      }
                    >
                      Remove alias
                    </button>
                  </p>
                ))}
                <button
                  className="btn-secondary"
                  onClick={() =>
                    setEditor({ id: item.id, email: "", canSend: true })
                  }
                >
                  Assign alias to {item.email}
                </button>
              </>
            )}
            {section === "known-domains" && (
              <>
                <h2>
                  {item.domain} · {item.name}
                </h2>
                <button
                  className="btn-secondary"
                  onClick={() => setEditor(item)}
                >
                  Edit domain
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => setConfirm({ kind: "domain", id: item.id })}
                >
                  Remove domain
                </button>
              </>
            )}
            {section === "inbound-log" && (
              <>
                <h2>
                  {item.status} · {item.processed_at}
                </h2>
                <pre className="whitespace-pre-wrap break-all text-xs">
                  {JSON.stringify(item, null, 2)}
                </pre>
              </>
            )}
          </article>
        ))}
        {section === "zoho-sync" && (
          <div className="card">
            <pre className="mb-4 whitespace-pre-wrap">
              {JSON.stringify(status, null, 2)}
            </pre>
            <button
              className="btn-primary"
              onClick={() =>
                run(async () =>
                  setStatus(await dispatch(syncContacts()).unwrap()),
                )
              }
            >
              Synchronize contacts
            </button>
          </div>
        )}
      </fieldset>
      {editor && (
        <Dialog
          title={
            section === "users"
              ? "Mailbox user"
              : section === "aliases"
                ? "Assign alias"
                : "Known domain"
          }
          onClose={() => {
            if (!busy) setEditor(null);
          }}
        >
          <form className="space-y-4 p-6" onSubmit={save}>
            <fieldset disabled={busy} className="space-y-4">
              {(section === "known-domains"
                ? [
                    ["domain", "Domain", "text"],
                    ["name", "Company name", "text"],
                  ]
                : section === "aliases"
                  ? [["email", "Alias email", "email"]]
                  : [
                      ["displayName", "Display name", "text"],
                      ["email", "Email", "email"],
                      ["recoveryEmail", "Recovery email", "email"],
                      [
                        "password",
                        editor.id ? "New password (optional)" : "Password",
                        "password",
                      ],
                    ]
              ).map(([key, label, type]) => (
                <label className="block" key={key}>
                  {label}
                  <input
                    className="field"
                    type={type}
                    value={editor[key] || ""}
                    readOnly={
                      section === "users" && key === "email" && !!editor.id
                    }
                    required={
                      key !== "recoveryEmail" &&
                      !(key === "password" && editor.id)
                    }
                    minLength={key === "password" ? 10 : undefined}
                    onChange={(e) =>
                      setEditor({ ...editor, [key]: e.target.value })
                    }
                  />
                </label>
              ))}
              {section === "users" && (
                <>
                  <label className="block">
                    Role
                    <select
                      className="field"
                      value={editor.role}
                      onChange={(e) =>
                        setEditor({ ...editor, role: e.target.value })
                      }
                    >
                      <option value="member">Member</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </label>
                  {editor.id && (
                    <label>
                      <input
                        type="checkbox"
                        checked={editor.isActive}
                        onChange={(e) =>
                          setEditor({ ...editor, isActive: e.target.checked })
                        }
                      />{" "}
                      Active
                    </label>
                  )}
                </>
              )}
              {section === "aliases" && (
                <label>
                  <input
                    type="checkbox"
                    checked={editor.canSend}
                    onChange={(e) =>
                      setEditor({ ...editor, canSend: e.target.checked })
                    }
                  />{" "}
                  Allow sending
                </label>
              )}
              {error && (
                <p role="alert" className="text-red-600">
                  {error}
                </p>
              )}
              <button className="btn-primary">Save</button>
            </fieldset>
          </form>
        </Dialog>
      )}
      {confirm && (
        <ConfirmDialog
          title="Remove assignment?"
          description="This change takes effect on the server."
          confirmLabel="Remove"
          onClose={() => setConfirm(null)}
          onConfirm={() =>
            run(() =>
              confirm.kind === "alias"
                ? dispatch(
                    removeAlias({ id: confirm.id, email: confirm.email }),
                  ).unwrap()
                : dispatch(deleteKnownDomain(confirm.id)).unwrap(),
            )
          }
        />
      )}
    </div>
  );
}
