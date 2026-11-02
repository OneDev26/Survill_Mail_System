import { useState } from "react";
import {
  Archive,
  ArrowLeft,
  Download,
  FileText,
  Forward,
  Mail,
  Reply,
  RotateCcw,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { Avatar, IconButton, LabelBadge } from "./Ui";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { fetchAttachment } from "../redux/thunks/mailThunks";
import { reportError } from "../utils/errors";
export default function MessageView(props) {
  const [lastMessage, setLastMessage] = useState(props.message);
  if (props.message && props.message !== lastMessage) {
    setLastMessage(props.message);
  }
  const reading = Boolean(props.message);
  return (
    <div
      className={`message-pane ${reading ? "message-pane-open" : ""}`}
      aria-hidden={!reading}
      inert={!reading}
    >
      <MessageContent {...props} message={props.message || lastMessage} />
    </div>
  );
}

function MessageContent({
  message,
  onClose,
  onAction,
  onStar,
  onCompose,
  onLabel,
}) {
  const labels = useSelector((state) => state.mail.labels);
  const ownEmail = useSelector((state) => state.profile.email);
  const dispatch = useDispatch();
  if (!message) return null;
  async function download(attachment) {
    try {
      const result = await dispatch(fetchAttachment(attachment.id)).unwrap();
      const link = document.createElement("a");
      link.href = result.url;
      link.rel = "noopener noreferrer";
      link.target = "_blank";
      link.click();
    } catch (error) {
      reportError(dispatch, error);
    }
  }

  return (
    <section
      aria-label="Message preview"
      className="message-pane-content flex h-full min-h-0 min-w-0 flex-col border-l border-slate-200/70 bg-white"
    >
      <div className="flex h-[55px] shrink-0 items-center gap-1 border-b border-slate-200/70 px-4 lg:px-6">
        <IconButton
          icon={ArrowLeft}
          label="Back to messages"
          className="lg:hidden"
          onClick={onClose}
        />
        <IconButton
          icon={Archive}
          label="Archive message"
          onClick={() => onAction("Archive", [message.id])}
        />
        <IconButton
          icon={Trash2}
          label="Move message to trash"
          onClick={() => onAction("Trash", [message.id])}
        />
        <IconButton
          icon={Mail}
          label="Mark message as unread"
          onClick={() => onAction("unread", [message.id])}
        />
        {message.folder !== "Inbox" && (
          <IconButton
            icon={RotateCcw}
            label="Move message to inbox"
            onClick={() => onAction("Inbox", [message.id])}
          />
        )}
        <div className="mx-2 h-4 border-l border-slate-200" />
        <select
          aria-label="Message label"
          value={message.label || ""}
          onChange={(event) => onLabel(message.id, event.target.value)}
          className="max-w-28 rounded bg-transparent p-1 text-[11px] text-slate-500 outline-brand-500"
        >
          <option value="">No label</option>
          {labels.map((label) => (
            <option key={label.name}>{label.name}</option>
          ))}
        </select>
        <IconButton
          icon={X}
          label="Close message"
          className="ml-auto"
          onClick={onClose}
        />
      </div>
      <div className="thin-scrollbar min-h-0 flex-1 overflow-y-auto px-6 py-7 xl:px-9">
        <div className="mb-4">
          <LabelBadge name={message.label} />
        </div>
        <h2 className="max-w-lg text-xl font-semibold leading-8 tracking-tight">
          {message.subject || "(No subject)"}
        </h2>
        <div className="mb-7 mt-6 flex items-start gap-3">
          <Avatar initials={message.initials} color={message.color} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-xs font-semibold">{message.sender}</span>
              <span className="truncate text-[10px] text-slate-400">
                &lt;{message.email}&gt;
              </span>
            </div>
            <p className="mt-1.5 text-[11px] text-slate-400">
              To: {message.to || "me"}
            </p>
            {message.cc && (
              <p className="mt-1 break-all text-[11px] text-slate-400">
                Cc: {message.cc}
              </p>
            )}
            {message.email === ownEmail && message.bcc && (
              <p className="mt-1 break-all text-[11px] text-slate-400">
                Bcc: {message.bcc}
              </p>
            )}
            <p className="mt-1 text-[10px] text-slate-400">
              {new Date(message.date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}{" "}
              · {message.time}
            </p>
          </div>
          <button
            aria-label={message.starred ? "Unstar message" : "Star message"}
            aria-pressed={message.starred}
            onClick={() => onStar(message.id)}
            className={`p-1 ${message.starred ? "text-amber-400" : "text-slate-300"}`}
          >
            <Star size={17} fill={message.starred ? "currentColor" : "none"} />
          </button>
        </div>
        <div className="whitespace-pre-wrap break-words text-[13px] leading-[1.95] text-slate-600">
          {message.html ? (
            <iframe
              title="Email content"
              sandbox=""
              referrerPolicy="no-referrer"
              className="min-h-80 w-full border-0"
              srcDoc={`<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: http: data:; style-src 'unsafe-inline';"><base target="_blank">${message.html}`}
            />
          ) : (
            message.body
          )}
        </div>
        {message.attachments.length > 0 && (
          <div className="mt-7 border-t border-slate-100 pt-5">
            <p className="mb-3 text-[11px] font-medium text-slate-500">
              {message.attachments.length} attachment
              {message.attachments.length > 1 ? "s" : ""}
            </p>
            {message.attachments.map((attachment, index) => (
              <button
                key={index}
                onClick={() => download(attachment)}
                className="mb-2 flex w-full max-w-80 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/50 p-3 text-left hover:border-brand-500"
              >
                <span className="rounded-md bg-red-50 p-2 text-red-400">
                  <FileText size={21} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[11px] font-medium">
                    {attachment.name}
                  </span>
                  <span className="mt-1 block text-[10px] text-slate-400">
                    {attachment.size}
                  </span>
                </span>
                <Download size={16} className="text-slate-400" />
              </button>
            ))}
          </div>
        )}
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            onClick={() => onCompose("reply", message)}
            className="flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-xs font-medium text-white hover:bg-brand-500"
          >
            <Reply size={15} />
            Reply
          </button>
          <button
            onClick={() => onCompose("replyAll", message)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-xs text-slate-600 hover:bg-slate-50"
          >
            Reply all
          </button>
          <button
            onClick={() => onCompose("forward", message)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-xs text-slate-600 hover:bg-slate-50"
          >
            <Forward size={15} />
            Forward
          </button>
        </div>
      </div>
      <div className="flex h-11 shrink-0 items-center justify-center gap-1.5 border-t border-slate-100 text-[10px] text-slate-400">
        <span className="size-1.5 rounded-full bg-emerald-400" />
        You're all set. Make room for your best work.
      </div>
    </section>
  );
}
