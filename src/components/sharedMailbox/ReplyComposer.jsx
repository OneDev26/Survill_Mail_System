import { useDispatch, useSelector } from "react-redux";
import { Send, Trash2 } from "lucide-react";
import {
  replyDraftChanged,
  replyDraftDiscarded,
} from "../../redux/slice/sharedMailboxDraftsSlice";

export default function ReplyComposer({ conversation }) {
  const dispatch = useDispatch();
  const key = JSON.stringify([conversation.mailbox, conversation.id]);
  const text = useSelector((state) => state.sharedMailboxDrafts[key] || "");
  return (
    <section className="shared-reply" aria-label="Reply composer">
      <div className="shared-reply-heading">
        <strong>Reply draft</strong>
        <span>To {conversation.conversation || "Contact unavailable"}</span>
      </div>
      <textarea
        aria-label="Shared mailbox reply"
        placeholder="Write a reply draft…"
        value={text}
        maxLength={20000}
        onChange={(event) =>
          dispatch(replyDraftChanged({ key, text: event.target.value }))
        }
      />
      <p id="shared-send-unavailable" className="shared-reply-notice">
        Shared-mailbox sending is not connected yet. This draft stays in this
        browser session and is cleared on reload or sign-out.
      </p>
      <div className="shared-reply-actions">
        <span>{text ? "Draft kept for this conversation" : "No draft"}</span>
        <button
          className="btn-secondary"
          disabled={!text}
          onClick={() => dispatch(replyDraftDiscarded(key))}
        >
          <Trash2 size={15} />
          Discard draft
        </button>
        <button
          className="btn-primary"
          disabled
          aria-describedby="shared-send-unavailable"
        >
          <Send size={15} />
          Send reply
        </button>
      </div>
    </section>
  );
}
