# Frontend data-source audit — 7 November 2026

Scope: `src`, public assets, API adapters, Redux slices/thunks and user-facing screens in this repository. This workspace contains the frontend, not the backend implementation or its database.

## Result

- No active demo datasets, sample employee/message lists, simulated mutations, local-storage seeding or demo fallback imports remain in production frontend source. Earlier `companyMailDemo.js` data and simulated transitions were already removed during API integration.
- Removed unused `.admin-demo-note` and `.admin-domain-demo-note` CSS rules, including their responsive override.
- The five new workspace tabs read/write authenticated API endpoints. Other mailbox, workspace and admin screens also use API data. API failures show errors/empty states rather than substituting invented records.
- Empty collection initial state, default form values, status option lists, example input hints, UI-only IDs and debounce timers are normal UI behavior, not sample business data; these remain.
- Test fixtures in `tests/api.spec.mjs` are retained to validate success/failure contracts. They are not imported by production source or bundled into the website.
- Preview-service wording remains accurate until the backend confirms durable storage. Removing that wording would not remove server sample data.

## Server-side example data remains a separate requirement

The earlier WORKSPACE_TABS_API_REFERENCE.md described in-memory example data for shared mailboxes, scheduled, snoozed, company directory, and approvals. The later SNOOZED_EMAILS_API_REFERENCE.md describes PostgreSQL storage for snoozed records. This frontend cannot distinguish an actual employee from a fixture returned under the same API schema and should not guess or delete records based on names/email domains. The backend engineer must remove any production sample seeding, supply real user-scoped persistence where still missing, and return empty collections for accounts without data.

See [the current backend handoff](ENDPOINT_GAPS.md) for existing routes, missing operations, proposed contracts and implementation requirements. It supersedes the outdated October backlog that incorrectly listed several now-integrated CRUD resources as missing.
