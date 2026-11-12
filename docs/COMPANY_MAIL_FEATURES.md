# Connected workspace tabs

Shared Mailboxes uses a dedicated mailbox/conversation/detail layout and a session-only reply-draft slice. Scheduled and Snoozed use dedicated mail list and preview layouts. Actual shared message history, replies and internal chat still require new backend contracts; see [SHARED_INBOX.md](SHARED_INBOX.md). Company Directory retains the shared record-list component described below.

Based on the supplied WORKSPACE_TABS_API_REFERENCE.md. All five resources use the authenticated HTTP client with existing base URL, cookie/bearer handling, session refresh, and serializable thunk errors. There is no frontend sample-data fallback.

| Tab | Endpoint | Supported operations |
| --- | --- | --- |
| Shared Mailboxes | `/api/shared-mailboxes` | GET, POST; PATCH `/:id` for status/access |
| Scheduled | `/api/scheduled` | GET, POST; PATCH `/:id` to cancel; DELETE `/:id` |
| Snoozed messages | `/api/messages?folder=snoozed`; `/api/messages/:id/snooze`; `/api/messages/:id/unsnooze` | GET real messages, POST snooze, POST unsnooze |
| Snoozed records | `/api/snoozed` | GET, POST, PATCH `/:id` status, DELETE `/:id` |
| Company Directory | `/api/company-directory` | GET, POST; PATCH `/:id` for office |
| Approvals | `/api/approvals` | GET, POST; PATCH `/:id` to approve or reject |
| All Mail | `/api/messages?folder=all` | Existing mailbox integration, unchanged |

## Code ownership

- `src/api/companyMail.js`, `src/redux/thunks/companyMailThunks.js`, and `src/redux/slice/companyMailSlices.js`: company directory records.
- `src/api/sharedMailboxes.js`, `src/redux/thunks/sharedMailboxThunks.js`, and `src/redux/slice/sharedMailboxSlice.js`: the documented shared-mailbox contract and state lifecycle.
- `src/api/scheduledEmails.js`, `src/redux/thunks/scheduledEmailThunks.js`, and `src/redux/slice/scheduledEmailSlice.js`: the documented scheduled-email contract and state lifecycle.
- `src/api/snoozedEmails.js`, `src/redux/thunks/snoozedEmailThunks.js`, and `src/redux/slice/snoozedEmailSlice.js`: real message snooze/unsnooze/list operations plus the separate snoozed-record contract.
- `src/hooks/useCompanyMail.js`: request lifecycle and refresh after writes. Mutations are considered saved once the write succeeds. If the subsequent read fails, the UI says the write succeeded and offers read-only retry, preventing duplicate submissions.
- `src/pages/companyMail/workspaceTabConfig.js`: documented fields and supported controls for the generic record pages.
- `src/pages/companyMail/WorkspaceTabPage.jsx`: shared list, local search/filters, create/edit forms, details and delete confirmation.
- `src/pages/companyMail/SnoozedMailPage.jsx`: real snoozed-message list/detail UI and return-to-Inbox action, plus separate record views with status updates and deletion.
- `src/pages/companyMail/ScheduledMailPage.jsx`: dedicated Scheduled queue, message preview, compose form, cancellation, and deletion of cancelled records.
- `src/api/approvals.js`, `src/redux/thunks/approvalThunks.js`, and `src/redux/slice/approvalSlice.js`: dedicated approval contract, authenticated request and decision thunks, and request state.

Mutation response bodies are not fully specified, so lists are re-fetched after successful writes, including HTTP 204 deletes. A mutation invalidates older reads so their responses cannot undo the refreshed state. Errors retain existing records and failed form edits. Initial read failures never populate sample records.

Scheduled forms send `to`, `subject`, optional `body`, a UTC `scheduledFor`, and `status: "scheduled"`. The tab displays scheduled, sent, and cancelled records, cancels via PATCH, and deletes via DELETE. The Inbox snooze dialog sends a real message ID and UTC `snoozeUntil`; the backend hides the message from Inbox. The Snoozed view lists messages using `folder=snoozed` and POSTs to `/unsnooze` for immediate return. The older `/api/snoozed` records remain in separate Records and Ended views, where status and deletion only affect those records. Directory records use `office`, without invented manager/phone fields. Approvals preserve the formatted `amount` string and use `details`, without invented approver/category/history fields. Shared records expose `conversation`, `requests`, `access`, and `note`.

## Service limits

The updated message snooze reference documents backend-managed hide and timed return. The separate Snoozed record reference describes PostgreSQL storage for detached records; other supplied references may still use in-memory example data. Real shared-mailbox sending and scheduled-email delivery workers still require backend support. See [SNOOZE_BACKEND_REQUIREMENTS.md](SNOOZE_BACKEND_REQUIREMENTS.md) for the message-linked routes.

Shared replies/assignment, scheduled send-now/time editing, approval withdrawal/history, and other undocumented operations are not simulated. Directory writes are visible to admins; the backend must independently enforce authorization on all endpoints. The approval reference documents rejection, so admins can approve or reject; it does not document ownership or role enforcement, which the backend must add for secure access.

Search and filters apply to the loaded records. The server's `total` is shown separately. No undocumented pagination/filter parameters are sent.

Tests in `tests/api.spec.mjs` cover exact wire payloads, server refresh after writes, 204 mutation responses, reload, date validation, formatted amounts, read/write failures, and recovery when a write succeeds but refreshing fails.
