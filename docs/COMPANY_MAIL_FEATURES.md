# Connected workspace tabs

Shared Mailboxes now uses a dedicated mailbox/conversation/detail layout and a session-only reply-draft slice. Its existing GET/POST/PATCH integration remains intact. Actual message history, replies and internal chat still require new backend contracts; see [SHARED_INBOX.md](SHARED_INBOX.md). Other tabs retain the shared record-list component described below.

Based on the supplied WORKSPACE_TABS_API_REFERENCE.md. All five resources use the authenticated HTTP client with existing base URL, cookie/bearer handling, session refresh, and serializable thunk errors. There is no frontend sample-data fallback.

| Tab | Endpoint | Supported operations |
| --- | --- | --- |
| Shared Mailboxes | `/api/shared-mailboxes` | GET, POST; PATCH `/:id` for status/access |
| Scheduled | `/api/scheduled` | GET, POST; PATCH `/:id` to cancel; DELETE `/:id` |
| Snoozed | `/api/snoozed` | GET, POST; PATCH `/:id` to mark active; DELETE `/:id` |
| Company Directory | `/api/company-directory` | GET, POST; PATCH `/:id` for office |
| Approvals | `/api/approvals` | GET, POST; PATCH `/:id` to approve |
| All Mail | `/api/messages?folder=all` | Existing mailbox integration, unchanged |

## Code ownership

- `src/api/companyMail.js`: explicit route map, allowed write-field serialization, abortable GET, encoded record IDs. The adapter returns raw server fields.
- `src/redux/thunks/companyMailThunks.js`: per-resource fetch/create/update action groups, plus remove for scheduled/snoozed records.
- `src/redux/slice/companyMailSlices.js`: five independent collections, server totals, request state, stale-read protection, and logout reset through the root reducer.
- `src/hooks/useCompanyMail.js`: request lifecycle and refresh after writes. Mutations are considered saved once the write succeeds. If the subsequent read fails, the UI says the write succeeded and offers read-only retry, preventing duplicate submissions.
- `src/pages/companyMail/workspaceTabConfig.js`: documented fields, supported controls, and directory admin-only write visibility.
- `src/pages/companyMail/WorkspaceTabPage.jsx`: shared list, local search/filters, create/edit forms, details and delete confirmation. Route wrappers retain the existing tab paths.

Mutation response bodies are not fully specified, so lists are re-fetched after successful writes, including HTTP 204 deletes. A mutation invalidates older reads so their responses cannot undo the refreshed state. Errors retain existing records and failed form edits. Initial read failures never populate sample records.

Scheduled forms send `to` and `scheduledFor`; snoozed forms send `from` and `snoozedUntil`. Local date inputs are validated and converted to UTC ISO timestamps. Directory records use `office`, without invented manager/phone fields. Approvals preserve the formatted `amount` string and use `details`, without invented approver/category/history fields. Shared records expose `conversation`, `requests`, `access`, and `note`.

## Service limits

The supplied reference explicitly describes in-memory example data. Connecting these APIs does not establish durable persistence, real shared-mailbox sending, scheduling workers, or inbox snooze/restore behavior. The UI identifies the service as a preview and does not claim those delivery effects.

Shared replies/assignment, scheduled send-now/time editing, rejection/withdrawal/history, and other undocumented operations have been removed rather than simulated. Directory writes are visible to admins; the backend must independently enforce authorization on all endpoints. No capability/approver metadata is documented, so the client cannot establish approval authority; server rejections are surfaced.

Search and filters apply to the loaded records. The server's `total` is shown separately. No undocumented pagination/filter parameters are sent.

Tests in `tests/api.spec.mjs` cover exact wire payloads, server refresh after writes, 204 mutation responses, reload, date validation, formatted amounts, read/write failures, and recovery when a write succeeds but refreshing fails.
