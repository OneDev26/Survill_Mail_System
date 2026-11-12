# Approval authorization backend requirements

The frontend now has a personal request page at `/approvals` and an administrator review queue at `/admin/approvals`. It uses the existing `GET /api/approvals`, `POST /api/approvals`, and `PATCH /api/approvals/:id` contract. The current API reference identifies requesters with a free-text `requester` field; that cannot provide secure ownership or authorization by itself.

## Required server behavior

1. **Authenticate every request.** Read the account ID, role, and organization from the verified session or token. Do not trust requester or role values sent by the browser.
2. **Scope reads on the server.** `GET /api/approvals` should return only records where `requesterId` equals the signed-in user for members. For admins, return all records in their organization. Apply this rule to list, detail, pagination, search, filters, and counts. A member must never receive another user's request in the HTTP response. The frontend currently filters the existing shared list for display, which is only a temporary UI measure.
3. **Set ownership on creation.** On `POST /api/approvals`, derive `requesterId`, `requesterEmail`, organization ID, `status: "pending"`, and `createdAt` on the server. Accept only request fields such as `title`, `details`, and `amount`. Ignore or reject client-supplied requester and status fields. For compatibility, the current frontend still submits `requester` as the signed-in email and `status: "pending"`; these are not authoritative.
4. **Restrict decisions.** `PATCH /api/approvals/:id` must require an admin in the same organization. A member receives `403` even if they forge a request. Allow only valid transitions from `pending` to `approved` or `rejected`, as documented in APPROVALS_API_REFERENCE.md. Use a transaction or conditional update so two admins cannot silently overwrite each other's decisions; return `409` for an already decided request.
5. **Record decision history.** Persist `decidedById`, `decidedAt`, status, and an audit event. Return them in list/detail responses so the user can see who decided and when. Preserve creation and decision timestamps.
6. **Link legacy records.** Migrate old requests that only have a display name to a real requester ID. Matching on a person's name is unsafe; the frontend deliberately does not show such records in the personal page.

Recommended response item: `{ id, title, details, amount, status, requesterId, requesterEmail, createdAt, decidedById, decidedAt }`. Keep existing endpoint paths and return shape `{ items, total }` so the frontend can switch to secure server-scoped data without a new route.
