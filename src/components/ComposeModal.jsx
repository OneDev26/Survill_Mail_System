import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Paperclip, Save, Send, Trash2, X } from "lucide-react";
import Dialog from "./Dialog";
import ConfirmDialog from "./ConfirmDialog";
import { IconButton } from "./Ui";
import { saveMessage } from "../redux/slice/mailSlice";
import { initials } from "../utils/mail";

function messageFrom(form, attachments, initial, profile, folder) {
  const date = new Date();
  return {
    ...initial,
    ...form,
    attachments,
    sender: "Me",
    email: profile.email,
    initials: initials(profile.name),
    color: "violet",
    subject: form.subject.trim() || "(No subject)",
    preview: form.body.replace(/\s+/g, " ").slice(0, 140),
    folder,
    label: initial.label || "",
    unread: false,
    starred: initial.starred || false,
    date: date.toISOString(),
    time: date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }),
  };
}

export default function ComposeModal({ initial, onSave, onClose, onDiscard }) {
  const profile = useSelector((state) => state.profile);
  const settings = useSelector((state) => state.settings);
  const contacts = useSelector((state) => state.workspace.contacts);
  const storageError = useSelector((state) => state.ui.storageError);
  const dispatch = useDispatch();
  const [form, setForm] = useState(() => ({
    to: initial.to || "",
    cc: initial.cc || "",
    bcc: initial.bcc || "",
    subject: initial.subject || "",
    body:
      initial.body ??
      (settings.useSignature ? `\n\n${settings.signature}` : ""),
  }));
  const [attachments, setAttachments] = useState(initial.attachments || []);
  const [copies, setCopies] = useState(Boolean(initial.cc || initial.bcc));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);
  const [savedAt, setSavedAt] = useState("");
  const [discard, setDiscard] = useState(false);
  const [drag, setDrag] = useState(false);
  const fileRef = useRef(null);
  const formRef = useRef(null);
  function update(event) {
    setTouched(true);
    setSavedAt("");
    setForm({ ...form, [event.target.name]: event.target.value });
  }
  useEffect(() => {
    if (!touched || loading) return;
    const timer = setTimeout(() => {
      dispatch(
        saveMessage(messageFrom(form, attachments, initial, profile, "Drafts")),
      );
      setSavedAt(
        new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        }),
      );
    }, 800);
    return () => clearTimeout(timer);
  }, [form, attachments, initial, profile, touched, loading, dispatch]);
  useEffect(() => {
    if (!touched || savedAt) return;
    const handler = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [touched, savedAt]);
  function save(folder) {
    if (loading) return;
    if (folder === "Sent") {
      const valid = (value) =>
        value
          .split(",")
          .every((address) =>
            /^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/.test(address.trim()),
          );
      if (
        !valid(form.to) ||
        (form.cc && !valid(form.cc)) ||
        (form.bcc && !valid(form.bcc))
      ) {
        setCopies(true);
        setError(
          "Enter valid email addresses in To, Cc, and Bcc, separated by commas.",
        );
        return;
      }
    }
    if (folder === "Sent" && (!form.subject.trim() || !form.body.trim())) {
      setError("Please add a subject and message.");
      return;
    }
    onSave(messageFrom(form, attachments, initial, profile, folder));
  }
  async function attach(files) {
    if (loading || !files.length) return;
    const existingBytes = attachments.reduce(
      (sum, file) => sum + (file.bytes || file.content?.length || 0),
      0,
    );
    if (
      files.reduce((sum, file) => sum + file.size, 0) + existingBytes >
      1024 * 1024
    ) {
      setError("Keep attachments under 1 MB in total for this browser demo.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const added = await Promise.all(
        files.map(
          (file) =>
            new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () =>
                resolve({
                  name: file.name,
                  size: `${Math.max(1, Math.round(file.size / 1024))} KB`,
                  bytes: file.size,
                  dataUrl: reader.result,
                });
              reader.onerror = () =>
                reject(
                  new Error("Unable to read this file. Please try again."),
                );
              reader.readAsDataURL(file);
            }),
        ),
      );
      setAttachments((previous) => [...previous, ...added]);
      setTouched(true);
      setSavedAt("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  function close() {
    if (!loading) {
      if (
        touched ||
        initial.folder === "Drafts" ||
        initial.to ||
        initial.subject
      )
        save("Drafts");
      else onClose();
    }
  }
  return (
    <>
      <Dialog
        wide
        title={initial.folder === "Drafts" ? "Edit draft" : "New message"}
        onClose={close}
      >
        <form
          ref={formRef}
          onSubmit={(event) => {
            event.preventDefault();
            save("Sent");
          }}
          onKeyDown={(event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
              event.preventDefault();
              formRef.current.requestSubmit();
            }
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setDrag(true);
          }}
          onDragLeave={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget))
              setDrag(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setDrag(false);
            attach(Array.from(event.dataTransfer.files));
          }}
          className={drag ? "bg-brand-50 ring-2 ring-inset ring-brand-500" : ""}
        >
          <div className="px-6">
            <div className="flex items-center gap-4 border-b border-slate-100 py-3 text-xs">
              <span className="w-12 text-slate-400">From</span>
              <span className="truncate">
                {profile.name} &lt;{profile.email}&gt;
              </span>
            </div>
            <div className="flex items-center gap-2 border-b border-slate-100">
              <label className="flex flex-1 items-center gap-4 py-3 text-xs">
                <span className="w-12 text-slate-400">To</span>
                <input
                  autoFocus
                  name="to"
                  required
                  type="email"
                  multiple
                  list="compose-contacts"
                  aria-label="Recipients"
                  value={form.to}
                  onChange={update}
                  placeholder="name@example.com"
                  className="min-w-0 flex-1 bg-transparent py-1 outline-none"
                />
              </label>
              <button
                type="button"
                aria-expanded={copies}
                onClick={() => setCopies(!copies)}
                className="text-xs text-brand-600"
              >
                Cc / Bcc
              </button>
            </div>
            {copies &&
              ["cc", "bcc"].map((name) => (
                <label
                  key={name}
                  className="flex items-center gap-4 border-b border-slate-100 py-3 text-xs"
                >
                  <span className="w-12 capitalize text-slate-400">{name}</span>
                  <input
                    aria-label={
                      name === "cc" ? "Cc recipients" : "Bcc recipients"
                    }
                    name={name}
                    type="email"
                    multiple
                    list="compose-contacts"
                    value={form[name]}
                    onChange={update}
                    className="min-w-0 flex-1 bg-transparent py-1 outline-none"
                  />
                </label>
              ))}
            <datalist id="compose-contacts">
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.email}>
                  {contact.name}
                </option>
              ))}
            </datalist>
            <label className="flex items-center gap-4 border-b border-slate-100 py-3 text-xs">
              <span className="w-12 text-slate-400">Subject</span>
              <input
                name="subject"
                required
                maxLength={300}
                value={form.subject}
                onChange={update}
                placeholder="Add a subject"
                className="min-w-0 flex-1 bg-transparent py-1 outline-none"
              />
            </label>
            <textarea
              name="body"
              aria-label="Message body"
              required
              value={form.body}
              onChange={update}
              placeholder="Write something thoughtful…"
              className="min-h-60 w-full resize-y bg-transparent py-5 text-sm leading-7 outline-none"
            />
            {attachments.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    className="flex max-w-full items-center gap-2 rounded-md bg-slate-100 pl-3 text-[11px]"
                  >
                    <Paperclip size={12} />
                    <span className="truncate">{file.name}</span>
                    <IconButton
                      icon={X}
                      label={`Remove ${file.name}`}
                      disabled={loading}
                      onClick={() => {
                        setAttachments(
                          attachments.filter((_, item) => item !== index),
                        );
                        setTouched(true);
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
            {error && (
              <p role="alert" className="mb-3 text-xs text-red-600">
                {error}
              </p>
            )}
            <p className="mb-3 text-[10px] text-slate-400">
              {loading
                ? "Reading attachments…"
                : storageError
                  ? "Draft is in memory only. Browser storage is unavailable."
                  : savedAt
                    ? `Draft saved at ${savedAt}`
                    : "Separate recipients with commas · Drop files to attach"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 px-6 py-4">
            <button disabled={loading} type="submit" className="btn-primary">
              <Send size={15} />
              Send
            </button>
            <IconButton
              icon={Paperclip}
              label="Attach files"
              disabled={loading}
              onClick={() => fileRef.current.click()}
            />
            <input
              ref={fileRef}
              type="file"
              multiple
              onChange={(event) => {
                attach(Array.from(event.target.files));
                event.target.value = "";
              }}
              className="hidden"
            />
            <button
              type="button"
              disabled={loading}
              onClick={() => save("Drafts")}
              className="flex items-center gap-2 rounded-lg px-2 py-2 text-xs text-slate-500 hover:bg-slate-100"
            >
              <Save size={15} />
              Save draft
            </button>
            <IconButton
              icon={Trash2}
              label="Discard draft"
              disabled={loading}
              onClick={() => setDiscard(true)}
            />
            <span className="ml-auto text-[10px] text-slate-400">
              Demo · no email is delivered
            </span>
          </div>
        </form>
      </Dialog>
      {discard && (
        <ConfirmDialog
          title="Discard this draft?"
          description="This message and its attachments will be removed from Drafts."
          confirmLabel="Discard draft"
          onClose={() => setDiscard(false)}
          onConfirm={onDiscard}
        />
      )}
    </>
  );
}
