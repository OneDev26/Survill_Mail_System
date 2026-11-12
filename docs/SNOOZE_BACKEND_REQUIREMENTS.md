# Message-linked snooze integration

The updated SNOOZED_EMAILS_API_REFERENCE.md documents real message snoozing. The Inbox sends `POST /api/messages/:id/snooze` with `{ "snoozeUntil": "ISO-8601 UTC" }`. The Snoozed view loads `GET /api/messages?folder=snoozed`, as confirmed by the backend owner, and returns a message using `POST /api/messages/:id/unsnooze`. The backend hides snoozed messages from Inbox and removes expired markers so they reappear on refresh. The open Inbox refreshes every 30 seconds and when the tab becomes visible.

The separate `/api/snoozed` record routes remain available under the Snoozed page's Records and Ended views. Those rows have no message ID and do not control real mail-message snoozing. The Inbox no longer creates detached records.
