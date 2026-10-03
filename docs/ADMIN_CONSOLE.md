# Admin console

Open **Admin console** in the workspace sidebar, or visit `/admin`. Sign in with the existing demo account. `/admin` redirects to `/admin/overview`; direct section URLs are protected by the existing session route.

## Available workflows

- Overview with directory counts, local mailbox counts, setup links, and recent activity.
- Users: add/edit, roles, departments, quota allocations, suspend/reactivate through the status editor, search, status filter, pagination, bulk selection, confirmed deletion, CSV export.
- Domains: add/edit/remove with dependency protection and a provider-neutral DNS checklist. All domains remain pending verification.
- Groups: distribution addresses, directory membership, sender access policy.
- Aliases: alternate addresses linked to active directory users.
- Mail routing: ordered sender-domain, recipient, or subject rules; quarantine/reject/forward actions and enable/disable configuration.
- Sender controls: allow/block addresses or domains with reasons.
- Security and retention: desired MFA, forwarding, IMAP/POP, session, password, and retention policies.
- Quarantine: confirm simulated release/delete review decisions, and filter by status. Release does not deliver a message; delete changes the review status and does not purge content.
- Reports: counts derived from the current local mailbox, planned directory capacity, CSV download.
- Audit: latest 1,000 mutations, actor/action search/filter, CSV download.
- Organization: identity, admin contact, validated IANA time zone metadata. Displayed timestamps use the browser time zone.

State lives in the Redux admin slice and persists under `zoho-demo-v2:admin`. Storage failures use the existing persistent warning. The existing mailbox and personal settings remain separate. The fixed demo account is the protected super administrator; directory accounts cannot sign in. Roles are directory metadata, not a production authorization system. CSV values are quoted and formula-leading values are prefixed to avoid spreadsheet formula execution.

## Production architecture and remaining work

This repository is a frontend demo. No provider credentials, mail server, database, job queue, DNS resolver, or authenticated administration API is configured. All policies and quotas here are planned configuration and have no effect on real accounts, mailbox access, mail transport, authentication, password strength, sessions, or retention. Browser state and its audit history are not trusted security boundaries.

Before production, connect these modules to an authenticated API and a durable organization-scoped database. Enforce membership, permissions, ownership, validation, and audit logging server-side on every request. Keep provider secrets in a server-side secret store. Integrate your actual mail provider using its documented, region-specific APIs and OAuth scopes; do not infer endpoints from UI route names.

Suggested backend aggregates are organizations, domains, users, memberships, groups, aliases, routing rules, sender policies, security policies, quarantine decisions, and append-only audit events. Use unique organization/address constraints and transactional dependency checks. Use revision/version fields to prevent lost updates.

Provisioning, DNS verification, imports/migrations, delivery changes, retention jobs, and account lifecycle changes need background jobs with idempotency, retries, progress, and failure reporting. A production quarantine release should require permission and cause actual delivery only after provider acknowledgement. Derive reports from server telemetry and clearly distinguish planned allocation from measured usage.

Additional production modules include SSO/directory sync, MFA enrollment/recovery, session/device revocation, secure password reset, mailbox delegation, shared mailboxes, bulk provisioning, migration connectors, backup/restore, retention execution, legal holds and e-discovery, DLP rules, integration credentials/webhooks, abuse limits, service health, and billing/licenses. These require backend/provider capabilities and are not simulated as working features in this console.

## Validation

`npm run build`, `npm run lint`, and `npm test` cover the application. `tests/admin.spec.mjs` exercises persistence, owner/dependency protection, validation, directory workflows, policy configuration, confirmed quarantine actions, export, and mobile layout alongside the existing mailbox tests.
