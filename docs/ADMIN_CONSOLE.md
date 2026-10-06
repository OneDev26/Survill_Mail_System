# Admin console

Sign in as an active Administrator or Super administrator, then open **Admin** in the top bar or **Admin tools** in the account menu. The mail sidebar contains only normal workspace actions. `/admin` redirects to `/admin/overview`; direct admin URLs check the current directory role. Members are redirected to their inbox. Admins retain compose, inbox, contacts, tasks, notes, calendar, profile, and settings.

## Available workflows

- Overview with directory counts, local mailbox counts, setup links, and recent activity.
- Users: add/edit, roles, departments, quota allocations, suspend/reactivate through the status editor, search, status filter, pagination, bulk selection, confirmed deletion, CSV export.
- Domains: add/edit/remove with dependency protection and a provider-neutral DNS checklist. All domains remain pending verification.
- Groups: distribution addresses, directory membership, sender access policy.
- Aliases: alternate addresses linked to active directory users.
- Mail routing: ordered sender-domain, recipient, or subject rules; quarantine/reject/forward actions and enable/disable configuration.
- Sender controls: allow/block addresses or domains with reasons.
- Security and retention: desired MFA, forwarding, IMAP/POP, session, password, and retention policies.
- Stores: create/edit stores, manage employee names and emails, add up to 200 emails per batch, search, filter, and confirm removals. Stores replaces Quarantine; old bookmarks redirect to Stores.
- Reports: counts derived from the current local mailbox, planned directory capacity, CSV download.
- Audit: latest 1,000 mutations, actor/action search/filter, CSV download.
- Organization: identity, admin contact, validated IANA time zone metadata. Displayed timestamps use the browser time zone.

State lives in the Redux admin slice and persists under `zoho-demo-v2:admin`. Storage failures use the existing persistent warning. The existing mailbox and personal settings remain separate. Alex is the protected super administrator. All active directory users can sign in using their directory email and the shared demo password `Demo@1234`. Sophia starts as a Member; James starts as an Administrator. Roles gate header/account-menu controls, routes, and admin Redux mutations. Suspended or deleted accounts cannot sign in. This is client-side demo behavior, not a production authorization boundary. CSV values are quoted and formula-leading values are prefixed to avoid spreadsheet formula execution.

## Production architecture and remaining work

This repository is a frontend demo. No provider credentials, mail server, database, job queue, DNS resolver, or authenticated administration API is configured. Role and active-status checks apply within the demo. Security policies and quotas are planned configuration and have no effect on real accounts, mail transport, password strength, sessions, or retention. Browser state and its audit history are not trusted security boundaries.

Before production, connect these modules to an authenticated API and a durable organization-scoped database. Enforce membership, permissions, ownership, validation, and audit logging server-side on every request. Keep provider secrets in a server-side secret store. Integrate your actual mail provider using its documented, region-specific APIs and OAuth scopes; do not infer endpoints from UI route names.

Suggested backend aggregates are organizations, domains, users, memberships, groups, aliases, routing rules, sender policies, security policies, stores, store employee memberships, and append-only audit events. Use unique organization/address constraints and transactional dependency checks. Use revision/version fields to prevent lost updates.

Provisioning, DNS verification, imports/migrations, delivery changes, retention jobs, and account lifecycle changes need background jobs with idempotency, retries, progress, and failure reporting. Derive reports from server telemetry and clearly distinguish planned allocation from measured usage.

Additional production modules include SSO/directory sync, MFA enrollment/recovery, session/device revocation, secure password reset, mailbox delegation, shared mailboxes, bulk provisioning, migration connectors, backup/restore, retention execution, legal holds and e-discovery, DLP rules, integration credentials/webhooks, abuse limits, service health, and billing/licenses. These require backend/provider capabilities and are not simulated as working features in this console.

## Validation

`npm run build`, `npm run lint`, and `npm test` cover the application. `tests/monitoring.spec.mjs` exercises role gating, mailbox isolation, local delivery with Bcc protection, read-only monitoring, attachments, read-access auditing, and suspension. `tests/admin.spec.mjs` exercises persistence, owner/dependency protection, validation, directory workflows, policy configuration, export, and mobile layout alongside the existing mailbox tests.

## Stores and employee emails

Open **Admin > Stores**, add a store with a unique 2–30 character code, then select **Manage employees**. Store names and employee names are limited to 100 characters; location is optional. Codes are normalized to uppercase, and email addresses to lowercase. The same email can belong to multiple stores, but cannot be duplicated within one store.

Employee entries are store memberships, not newly provisioned mail accounts. Existing directory accounts are recognized by email and display their active/suspended status; other addresses are labeled email records. Adding, editing, or removing a membership never changes an account's permissions, mailbox, or messages. Inactive stores keep their employees but reject new or edited memberships until reactivated.

Bulk entry accepts newline-, comma-, or semicolon-separated emails, up to 200 per batch. A bad or duplicate address rejects the entire batch. Store and employee searches, store status filters, and employee pagination are available. Store deletion requires an empty employee list and confirmation. Every mutation records the signed-in administrator in the audit log.

Stores are persisted in the existing admin storage record. Older records without stores migrate to an empty store list without resetting users, policies, or audit history. Legacy quarantine data is retained for storage compatibility, but its screen and actions are removed. Existing routing rules retain their configured actions.

`tests/stores.spec.mjs` covers persistence, editing/removal, duplicate validation, atomic bulk entry, inactive-store rules, legacy data migration, mobile layout, and rejection of member access and mutations.

## Email monitoring and separate mailboxes

The account menu and admin navigation expose **Email monitoring** only to administrators. It searches sender, recipients (including Bcc on sender copies), subject, body, and mailbox owner. Mailbox, folder, and inclusive local-date filters combine with search. Review shows the full plain-text body, recipient details, timestamp, and downloadable attachments. Opening a message records the actual signed-in actor, message ID, and mailbox in the audit log without changing unread state or moving the original.

Monitoring covers the currently stored contents of every local account: Inbox, Sent, Drafts, Archive, Spam, Trash, and custom folders. A delivered message appears separately in sender and recipient mailboxes. Permanently deleted messages are not retained; this is not a transport journal, legal archive, or tamper-proof audit. Mail outside this browser is unavailable. Mailboxes retained after directory deletion remain visible to admins as stored data.

Account snapshots live under `zoho-demo-v2:accounts`. The original owner data is imported and its old keys maintained for compatibility. Login switches mail, profile, personal settings, and workspace state together; logout closes compose and clears the active mailbox. Local sends generate Inbox copies for matching active directory users, including To/Cc/Bcc recipients. Recipient copies omit Bcc and start unread; aliases, groups, routing, and external delivery still need provider integration. Drafts do not deliver. The app's login screen discloses administrator monitoring.

All accounts and message content live in browser storage, which is not a trusted security boundary. Production requires server-side role checks on message list, read, attachment, and administrative mutation endpoints; account-isolated storage; server-side delivery journaling for complete monitoring; and durable read-access audit events. Concurrent tabs/devices and live server mail require synchronization beyond these local snapshots.
