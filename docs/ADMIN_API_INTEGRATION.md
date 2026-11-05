# Admin API integration

Updated 4 November 2026 against `ADMIN_API_REFERENCE.md`, copied from the user-supplied reference.

## Architecture

All requests use the existing shared Axios client at `https://mail-backend.ngrok.app`, in-memory bearer tokens, and `withCredentials: true`. Components dispatch named `createApiThunk` operations in `src/redux/thunks/adminThunks.js`; they never import Axios or endpoint adapters. Thunks use `.unwrap()` for UI success/failure control and reject responses from a previous session.

New shared resource reads store confirmed responses in `admin.data[thunk.typePrefix]`. The admin slice tracks pending/fulfilled/rejected request status through `trackRequests`, accepts only the latest matching request ID, and invalidates in-flight reads after confirmed resource writes. `useAdminResource` aborts reads on unmount or filter changes. Successful writes reload authoritative lists and summaries; editors remain open on errors. Logout clears admin data through the existing root reducer.

## Endpoint mapping

| Screen / use | Endpoints |
| --- | --- |
| Overview | GET /api/admin/overview |
| Overview alias, available through thunk | GET /api/admin/overview/summary |
| Domains | GET/POST /api/admin/domains; PATCH/DELETE /api/admin/domains/:id |
| Aliases | GET/POST /api/admin/aliases; DELETE /api/admin/aliases/:id |
| Users | Existing GET/POST /api/admin/users; PATCH /api/admin/users/:id |
| Groups | Existing GET/POST /api/admin/groups; PATCH/DELETE /api/admin/groups/:id |
| Mail routing | GET/POST /api/admin/routing; PATCH/DELETE /api/admin/routing/:id |
| Reports | GET /api/admin/reports |
| Reports alias, available through thunk | GET /api/admin/reports/summary |
| Stores | GET/POST /api/admin/stores; PATCH/DELETE /api/admin/stores/:id |
| Security & retention | GET/PATCH /api/admin/security |
| Monitoring list, available through thunk | GET /api/admin/monitoring |
| Email Monitoring | GET /api/admin/email-monitoring |
| Sender Controls service layer only | GET/POST /api/admin/sender-controls; PATCH/DELETE /api/admin/sender-controls/:id |

Sender Controls remains absent from navigation because the user previously requested its removal. Its newly documented adapters/thunks are available for future consumers. Organization and Known Domains also remain removed. Hosted Domains is a separate supported screen. Existing inbound-log and Zoho-sync workflows remain connected.

## Wire contracts and UI behavior

- Domains create sends `{domain,name}`; editing sends only `{name}`. Primary and verification state come from the server. No fabricated verify/DKIM/make-primary calls.
- Aliases create sends `{email,userId,canSend}` using the real users list. Deletion uses the alias ID, not the mailbox-user ID or alias email. The new UI replaces the old nested user-alias workflow. No update-alias endpoint is invented.
- Groups preserve `{name,email,whoCanSend,delivery,members:[{email,name,canSend}]}`. Numeric IDs work. Derived counts/member IDs are excluded from write payloads.
- Routing uses `{name,matchField,action,priority,status,criteria}`. Priority is numeric; status is active/paused; criteria must be a JSON object and additional keys survive edits. Search submits q/status to the server. The reference does not enumerate every matchField/action value, so the editor preserves returned values and permits backend validation rather than inventing supported operations.
- Stores use `{name,code,location,status}` with active/inactive values. Old local employee membership controls are retired because the reference supplies no membership endpoints.
- Security sends exactly requireMfa, allowExternalForwarding, allowImapAccess, allowPopAccess, sessionDurationMinutes, minimumPasswordLength and retentionPeriodDays. Booleans and numbers retain their types. Successful PATCH triggers GET; the UI does not assume undocumented mutation response bodies. Saving configuration does not independently prove backend enforcement.
- Reports show mailboxDistribution, allocatedGb, usedGb, distributedGroups, alternateAddresses and serverMetricsAvailable. Zero usage is displayed as zero, and unavailable metrics are labeled. Summary is optional on the summary alias response.
- Overview displays mailSummary, organization directory counts, workspaceSetup and recentActivity. The reference's organization.sampleMessages property is not presented as live mail count; live totals come from mailSummary.
- Monitoring uses server summaries, q/folder/unread/withAttachments/limit, explicit false booleans, cancellation, and metadata details. The supplied contract has no body/download or pagination cursor endpoints, so the UI reports returned count/limit and does not claim complete pagination or provide invented body/download links.
- DELETE 204 succeeds without a JSON body. For mutations without documented response shapes, success is followed by a list/read request rather than assuming an item response.

## Removed preview implementation

The old admin preview reducer, default organization/store/sample-mail datasets, demo CRUD validation modules and local Stores page have been retired. Overview, Domains, Aliases, Routing, Stores, Reports and Security have no sample-data fallback. Audit log remains visible with an unavailable message because no audit endpoint appears in the reference; it no longer manufactures browser audit events.

## Verification and limits

The browser suite uses intercepted responses matching the reference. Coverage includes all documented adapter routes (including aliases and sender-control services), authentication headers/credentials, CRUD payloads, real-user selection for aliases, routing criteria and filters, policy types, server counters, 204 deletes, write/read errors and stale-read rejection. Existing authentication/mail/workspace tests are also run.

These checks validate frontend integration and serialized contracts. They do not establish deployed backend availability, actual email delivery, DNS verification, retention execution or MFA enforcement. Validate those with an authenticated admin session and the backend's own integration tests.
