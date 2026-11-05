import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  createDraft,
  saveDraft,
  sendDraft,
  discardDraft,
  uploadAttachments,
  removeAttachment,
  suggestRecipients,
  fetchFolders,
} from "../redux/thunks/mailThunks";
import { composeClosed, notify } from "../redux/slice/uiSlice";
import { mailboxInvalidated } from "../redux/slice/mailSlice";
import Dialog from "./Dialog";
import ConfirmDialog from "./ConfirmDialog";

export default function ComposeModal({ initial }) {
  const settings = useSelector((s) => s.settings);
  const user = useSelector((s) => s.auth.session);
  const dispatch = useDispatch();
  const [form, setForm] = useState({
    to: initial.to || "",
    cc: initial.cc || "",
    bcc: initial.bcc || "",
    subject: initial.subject || "",
    text: initial.body ?? (settings.useSignature ? settings.signature : ""),
    fromAddress: initial.isDraft ? initial.email || user.email : user.email,
  });
  const [attachments, setAttachments] = useState(initial.attachments || []);
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [discard, setDiscard] = useState(false);
  const draft = useRef(initial.isDraft ? initial.id : null);
  const queue = useRef(Promise.resolve());
  const finished = useRef(false);
  const latest = useRef(form);
  const enqueue = (fn) => {
    const result = queue.current.catch(() => {}).then(fn);
    queue.current = result;
    return result;
  };
  const save = async (body) => {
    if (finished.current) return;
    const payload = { ...body, html: "" };
    const result = draft.current
      ? await dispatch(saveDraft({ id: draft.current, body: payload })).unwrap()
      : await dispatch(
          createDraft({
            ...payload,
            replyToMessageId: initial.replyToMessageId,
            forwardOfMessageId: initial.forwardOfMessageId,
          }),
        ).unwrap();
    draft.current = result.message.id;
    setAttachments(
      result.message.attachments.map((a) => ({ ...a, name: a.filename })),
    );
    setStatus("Draft saved.");
    return result;
  };
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  });
  useEffect(() => {
    if (!dirty || busy) return;
    const timer = setTimeout(() => {
      enqueue(() => saveRef.current(form)).catch((err) => {
        setError(err.message);
        setStatus("Draft not saved. Retry Save draft.");
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [form, dirty, busy]);
  useEffect(() => {
    let active = true;
    const q = form.to.split(/[,;]/).at(-1).trim();
    const timer = setTimeout(() => {
      if (q)
        dispatch(suggestRecipients(q.slice(0, 100)))
          .unwrap()
          .then((r) => {
            if (active) setSuggestions(r.items);
          })
          .catch(() => {});
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer); //
    };
  }, [form.to, dispatch]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  function update(e) {
    const next = { ...form, [e.target.name]: e.target.value };
    latest.current = next;
    setForm(next);
    setDirty(true);
    setStatus("");
  }
  async function run(fn) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await enqueue(fn);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  async function close() {
    await run(async () => {
      await save(latest.current);
      finished.current = true;
      dispatch(composeClosed());
      dispatch(mailboxInvalidated());
      await dispatch(fetchFolders()).unwrap();
    });
  }
  async function send(event) {
    event.preventDefault();
    await run(async () => {
      await save(latest.current);
      await dispatch(sendDraft(draft.current)).unwrap();
      finished.current = true;
      dispatch(composeClosed());
      dispatch(mailboxInvalidated());
      dispatch(notify({ text: "Message sent." }));
      await dispatch(fetchFolders()).unwrap();
    });
  }
  return (
    <>
      <Dialog
        wide
        title={initial.isDraft ? "Edit draft" : "New message"}
        onClose={close}
      >
        <form
          className="space-y-4 p-6"
          onSubmit={send}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
              e.preventDefault();
              e.currentTarget.requestSubmit();
            }
          }}
        >
          <fieldset disabled={busy} className="space-y-3">
            <label className="block">
              From
              <select
                className="field"
                name="fromAddress"
                value={form.fromAddress}
                onChange={update}
              >
                {[
                  user.email,
                  ...(user.aliases || [])
                    .filter((a) => a.canSend)
                    .map((a) => a.email),
                ].map((email) => (
                  <option key={email}>{email}</option>
                ))}
              </select>
            </label>
            {[
              ["to", "Recipients"],
              ["cc", "Cc recipients"],
              ["bcc", "Bcc recipients"],
              ["subject", "Subject"],
            ].map(([key, label]) => (
              <label className="block" key={key}>
                {label}
                <input
                  className="field"
                  name={key}
                  aria-label={label}
                  list={key === "subject" ? undefined : "live-recipients"}
                  value={form[key]}
                  onChange={update}
                  maxLength={key === "subject" ? 998 : undefined}
                />
              </label>
            ))}
            <datalist id="live-recipients">
              {suggestions.map((s) => (
                <option key={s.email} value={s.email}>
                  {s.displayName}
                </option>
              ))}
            </datalist>
            <textarea
              className="field min-h-60"
              name="text"
              aria-label="Message body"
              value={form.text}
              onChange={update}
            />
            {attachments.map((a) => (
              <div key={a.id} className="flex gap-3 text-xs">
                <span>{a.filename || a.name}</span>
                <button
                  type="button"
                  onClick={() =>
                    run(async () => {
                      const r = await dispatch(
                        removeAttachment({
                          id: draft.current,
                          attachmentId: a.id,
                        }),
                      ).unwrap();
                      setAttachments(r.message.attachments);
                    })
                  }
                >
                  Remove {a.filename || a.name}
                </button>
              </div>
            ))}
            <label className="block text-sm">
              Attach files
              <input
                type="file"
                multiple
                onChange={(e) => {
                  const files = [...e.target.files];
                  e.target.value = "";
                  if (!files.length) return;
                  run(async () => {
                    await save(latest.current);
                    const r = await dispatch(
                      uploadAttachments({ id: draft.current, files: files }),
                    ).unwrap();
                    setAttachments(r.message.attachments);
                  });
                }}
              />
            </label>
            <div className="flex gap-3">
              <button className="btn-primary">Send</button>
              <button className="btn-secondary" type="button" onClick={close}>
                Save draft
              </button>
              <button
                className="btn-secondary"
                type="button"
                onClick={() => setDiscard(true)}
              >
                Discard
              </button>
            </div>
          </fieldset>
          {error && (
            <p role="alert" className="text-red-600">
              {error}
            </p>
          )}
          <p role="status" className="text-xs">
            {busy ? "Saving…" : status}
          </p>
        </form>
      </Dialog>
      {discard && (
        <ConfirmDialog
          title="Discard draft?"
          description="The draft and its attachments will be permanently deleted."
          confirmLabel="Discard"
          onClose={() => setDiscard(false)}
          onConfirm={() =>
            run(async () => {
              if (draft.current)
                await dispatch(discardDraft(draft.current)).unwrap();
              finished.current = true;
              dispatch(composeClosed());
              dispatch(mailboxInvalidated());
              await dispatch(fetchFolders()).unwrap();
            })
          }
        />
      )}
    </>
  );
}
