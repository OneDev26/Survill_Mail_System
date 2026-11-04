# Admin groups and monitoring integration

Updated 4 November 2026 against the supplied Admin API Reference.

All six new method/path combinations use the shared client at `https://mail-backend.ngrok.app`, with credentials enabled and the current bearer token. No cookie is manually constructed or exposed to JavaScript.

| Endpoint | Frontend usage |
| --- | --- |
| GET /api/admin/groups | Groups table and server-provided summary cards |
| POST /api/admin/groups | Create group form |
| PATCH /api/admin/groups/:id | Edit details, delivery and complete membership |
| DELETE /api/admin/groups/:id | Confirmed deletion; handles empty 204 response |
| GET /api/admin/monitoring | Live mailbox summary on Overview |
| GET /api/admin/email-monitoring | Email Monitoring list, summary and filters |

Adapters: `src/api/backend.js`. Domain thunks: `src/redux/thunks/adminThunks.js`. Screens: `AdminGroups.jsx` and `EmailMonitoring.jsx`. Request lifecycle remains tracked by the admin slice; component results are guarded against unmounts and requests are aborted when filters change.

Group writes contain `name`, `email`, `whoCanSend`, `delivery`, and `members: [{email,name,canSend}]`. Server-generated group/member IDs and derived counts are not sent as editable fields. Existing canSend values survive edits. Save errors preserve the open editor; failed deletes retain the record. Successful mutations reload the authoritative list and aggregate counts. Group IDs support numbers as in the reference.

The reference documents `organization` for whoCanSend, but does not specify its full enum. The editor accepts a policy value and preserves the returned value rather than inventing allowed backend values. Delivery supports active/paused. Backend validation errors are displayed.

Monitoring sends q, folder, unread, withAttachments and limit. False booleans are sent explicitly; unspecified booleans are omitted. Search is debounced; superseded responses are discarded. Summary counters are read from the response, never recomputed from the limited items array. No page/offset parameter is fabricated: the UI reports the returned count and requested limit. Folder/read/attachment filters use the documented monitoring query contract for the email-monitoring list.

Only metadata is returned by the supplied monitoring reference. The Details dialog displays mailbox, sender, recipient, date, folder, read state and attachment presence. Full bodies and attachment downloads remain unavailable pending admin-authorized endpoints. The screen does not call owner-only message APIs, show dummy bodies or manufacture audit events. Neither connected section falls back to sample data on errors.

Overview also contains the older preview organization cards; those are explicitly labeled preview data. Other unconnected administration sections remain previews. The prior restoration document describes the earlier sample implementation and is superseded for Groups and Email Monitoring by this document.

Verification uses intercepted browser responses matching the supplied contract: all six adapter routes, group create/update/delete, member permission serialization, failed writes/deletes, monitoring filters (including false), metadata display and error states. Live database/provider behavior requires a real admin session in the deployed environment.
