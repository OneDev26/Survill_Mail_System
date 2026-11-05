# Admin API Reference

Base URL:
- Local: http://localhost:4000
- Ngrok: https://mail-backend.ngrok.app

All admin endpoints require admin authentication.

## 1) Admin overview
Method: GET
Endpoint: /api/admin/overview

Example request:
```http
GET /api/admin/overview
```

Example response:
```json
{
  "mailSummary": {
    "totalMailCopies": 13,
    "inboxCopies": 5,
    "unreadMessages": 4,
    "withAttachments": 0
  },
  "organization": {
    "directoryUsers": 3,
    "activeUsers": 3,
    "domains": 1,
    "contacts": 0,
    "sampleMessages": 21
  },
  "workspaceSetup": {
    "directoryReady": true,
    "usersConnected": 3
  },
  "recentActivity": [
    {
      "title": "Project update",
      "sender": "alice@example.com",
      "receivedAt": "2026-11-04T10:15:00.000Z"
    }
  ]
}
```

## 2) Admin overview summary alias
Method: GET
Endpoint: /api/admin/overview/summary

Example request:
```http
GET /api/admin/overview/summary
```

Example response:
```json
{
  "mailSummary": {
    "totalMailCopies": 13,
    "inboxCopies": 5,
    "unreadMessages": 4,
    "withAttachments": 0
  },
  "organization": {
    "directoryUsers": 3,
    "activeUsers": 3,
    "domains": 1,
    "contacts": 0,
    "sampleMessages": 21
  },
  "workspaceSetup": {
    "directoryReady": true,
    "usersConnected": 3
  },
  "recentActivity": []
}
```

## 3) List domains
Method: GET
Endpoint: /api/admin/domains

Example request:
```http
GET /api/admin/domains
```

Example response:
```json
{
  "totalDomains": 1,
  "verified": 1,
  "pending": 0,
  "primaryDomain": {
    "id": "4e3f...",
    "domain": "studio.co",
    "name": "Studio domain"
  },
  "items": [
    {
      "id": "4e3f...",
      "domain": "studio.co",
      "name": "Studio domain",
      "primary": true,
      "status": "verified"
    }
  ]
}
```

## 4) Add domain
Method: POST
Endpoint: /api/admin/domains

Payload:
```json
{
  "domain": "studio.co",
  "name": "Studio domain"
}
```

Example response:
```json
{
  "item": {
    "id": "4e3f...",
    "domain": "studio.co",
    "name": "Studio domain",
    "primary": true,
    "status": "verified"
  }
}
```

## 5) Update domain
Method: PATCH
Endpoint: /api/admin/domains/:id

Payload:
```json
{
  "name": "Updated Studio domain"
}
```

## 6) Delete domain
Method: DELETE
Endpoint: /api/admin/domains/:id

Response:
- HTTP 204 No Content

## 7) List aliases
Method: GET
Endpoint: /api/admin/aliases

Example request:
```http
GET /api/admin/aliases
```

Example response:
```json
{
  "items": [
    {
      "id": "9ab1...",
      "email": "sales@survill.com",
      "userId": "7d1a...",
      "userEmail": "admin@survill.com",
      "userName": "Admin",
      "canSend": true,
      "createdAt": "2026-11-04T10:15:00.000Z"
    }
  ]
}
```

## 8) Create alias
Method: POST
Endpoint: /api/admin/aliases

Payload:
```json
{
  "email": "sales@survill.com",
  "userId": "7d1a...",
  "canSend": true
}
```

Example response:
```json
{
  "item": {
    "id": "9ab1...",
    "email": "sales@survill.com",
    "userId": "7d1a...",
    "canSend": true,
    "createdAt": "2026-11-04T10:15:00.000Z"
  }
}
```

## 9) Delete alias
Method: DELETE
Endpoint: /api/admin/aliases/:id

Response:
- HTTP 204 No Content

## 10) List sender controls
Method: GET
Endpoint: /api/admin/sender-controls

Example request:
```http
GET /api/admin/sender-controls?q=example.com
```

Example response:
```json
{
  "totalRules": 1,
  "items": [
    {
      "id": "c3b1...",
      "emailOrDomain": "example.com",
      "action": "block",
      "reason": "spam source",
      "createdAt": "2026-11-04T10:15:00.000Z",
      "updatedAt": "2026-11-04T10:15:00.000Z"
    }
  ]
}
```

## 11) Create sender control
Method: POST
Endpoint: /api/admin/sender-controls

Payload:
```json
{
  "emailOrDomain": "example.com",
  "action": "block",
  "reason": "spam source"
}
```

## 12) Update sender control
Method: PATCH
Endpoint: /api/admin/sender-controls/:id

Payload:
```json
{
  "action": "allow",
  "reason": "verified sender"
}
```

## 13) Delete sender control
Method: DELETE
Endpoint: /api/admin/sender-controls/:id

Response:
- HTTP 204 No Content

## 14) List users
Method: GET
Endpoint: /api/admin/users

Example request:
```http
GET /api/admin/users
```

Example response:
```json
{
  "users": [
    {
      "id": "7d1a...",
      "email": "admin@survill.com",
      "displayName": "Admin",
      "role": "admin",
      "isActive": true,
      "avatarKey": null,
      "recoveryEmail": null,
      "createdAt": "2026-11-04T10:15:00.000Z",
      "updatedAt": "2026-11-04T10:15:00.000Z"
    }
  ]
}
```

## 4) Create user
Method: POST
Endpoint: /api/admin/users

Payload:
```json
{
  "email": "newuser@survill.com",
  "displayName": "New User",
  "password": "StrongPass123!",
  "role": "member",
  "recoveryEmail": "backup@example.com"
}
```

Example response:
```json
{
  "user": {
    "id": "7d1a...",
    "email": "newuser@survill.com",
    "displayName": "New User",
    "role": "member",
    "isActive": true,
    "avatarKey": null,
    "recoveryEmail": "backup@example.com"
  }
}
```

## 5) Update user
Method: PATCH
Endpoint: /api/admin/users/:id

Payload:
```json
{
  "displayName": "Updated User",
  "role": "admin",
  "isActive": true,
  "recoveryEmail": "updated@example.com"
}
```

Example response:
```json
{
  "user": {
    "id": "7d1a...",
    "email": "updateduser@survill.com",
    "displayName": "Updated User",
    "role": "admin",
    "isActive": true,
    "avatarKey": null,
    "recoveryEmail": "updated@example.com"
  }
}
```

## 6) List groups
Method: GET
Endpoint: /api/admin/groups

Example request:
```http
GET /api/admin/groups
```

Example response:
```json
{
  "totalGroups": 1,
  "uniqueMembers": 2,
  "activeDelivery": 1,
  "restrictedSenders": 0,
  "items": [
    {
      "id": 1,
      "name": "Studio team",
      "email": "team@survill.com",
      "whoCanSend": "organization",
      "delivery": "active",
      "memberCount": 2,
      "senderCount": 1,
      "members": [
        { "id": 10, "email": "a@survill.com", "name": "Alice", "canSend": true },
        { "id": 11, "email": "b@survill.com", "name": "Bob", "canSend": false }
      ]
    }
  ]
}
```

## 7) Create group
Method: POST
Endpoint: /api/admin/groups

Payload:
```json
{
  "name": "Studio team",
  "email": "team@survill.com",
  "whoCanSend": "organization",
  "delivery": "active",
  "members": [
    { "email": "a@survill.com", "name": "Alice", "canSend": true },
    { "email": "b@survill.com", "name": "Bob", "canSend": false }
  ]
}
```

Example response:
```json
{
  "item": {
    "id": 1,
    "name": "Studio team",
    "email": "team@survill.com",
    "whoCanSend": "organization",
    "delivery": "active",
    "memberCount": 2,
    "senderCount": 1,
    "members": [
      { "id": 10, "email": "a@survill.com", "name": "Alice", "canSend": true },
      { "id": 11, "email": "b@survill.com", "name": "Bob", "canSend": false }
    ]
  }
}
```

## 8) Update group
Method: PATCH
Endpoint: /api/admin/groups/:id

Payload:
```json
{
  "name": "Updated Studio team",
  "delivery": "paused",
  "members": [
    { "email": "a@survill.com", "name": "Alice", "canSend": true },
    { "email": "c@survill.com", "name": "Charlie", "canSend": true }
  ]
}
```

Example response:
```json
{
  "item": {
    "id": 1,
    "name": "Updated Studio team",
    "email": "team@survill.com",
    "whoCanSend": "organization",
    "delivery": "paused",
    "memberCount": 2,
    "senderCount": 2,
    "members": [
      { "id": 10, "email": "a@survill.com", "name": "Alice", "canSend": true },
      { "id": 12, "email": "c@survill.com", "name": "Charlie", "canSend": true }
    ]
  }
}
```

## 9) Delete group
Method: DELETE
Endpoint: /api/admin/groups/:id

Request:
```http
DELETE /api/admin/groups/1
```

Response:
- HTTP 204 No Content

## 10) Mail routing list
Method: GET
Endpoint: /api/admin/routing

Example request:
```http
GET /api/admin/routing?q=spam&status=active
```

Example response:
```json
{
  "totalRules": 1,
  "activeRules": 1,
  "pausedRules": 0,
  "items": [
    {
      "id": "ab12...",
      "name": "Block spam",
      "matchField": "domain",
      "action": "block",
      "priority": 200,
      "status": "active",
      "criteria": { "value": "example.com" },
      "createdAt": "2026-11-04T10:15:00.000Z",
      "updatedAt": "2026-11-04T10:15:00.000Z"
    }
  ]
}
```

## 11) Create mail routing rule
Method: POST
Endpoint: /api/admin/routing

Payload:
```json
{
  "name": "Block spam",
  "matchField": "domain",
  "action": "block",
  "priority": 200,
  "status": "active",
  "criteria": {
    "value": "example.com"
  }
}
```

## 12) Update mail routing rule
Method: PATCH
Endpoint: /api/admin/routing/:id

Payload:
```json
{
  "status": "paused",
  "priority": 500
}
```

## 13) Delete mail routing rule
Method: DELETE
Endpoint: /api/admin/routing/:id

Response:
- HTTP 204 No Content

## 14) Reports
Method: GET
Endpoint: /api/admin/reports

Example request:
```http
GET /api/admin/reports
```

Example response:
```json
{
  "mailboxDistribution": [
    { "folder": "inbox", "count": 6 },
    { "folder": "sent", "count": 3 },
    { "folder": "archive", "count": 3 },
    { "folder": "drafts", "count": 3 },
    { "folder": "spam", "count": 3 },
    { "folder": "trash", "count": 2 }
  ],
  "directoryCapacity": {
    "allocatedGb": 100,
    "usedGb": 0,
    "distributedGroups": 0,
    "alternateAddresses": 0,
    "serverMetricsAvailable": false,
    "message": "Connect a backend for delivery rates, storage usage, and login telemetry."
  },
  "summary": {
    "totalUsers": 3,
    "totalDomains": 1
  }
}
```

Method: GET
Endpoint: /api/admin/reports/summary

Example response:
```json
{
  "mailboxDistribution": [
    { "folder": "inbox", "count": 6 },
    { "folder": "sent", "count": 3 },
    { "folder": "archive", "count": 3 },
    { "folder": "drafts", "count": 3 },
    { "folder": "spam", "count": 3 },
    { "folder": "trash", "count": 2 }
  ],
  "directoryCapacity": {
    "allocatedGb": 100,
    "usedGb": 0,
    "distributedGroups": 0,
    "alternateAddresses": 0,
    "serverMetricsAvailable": false,
    "message": "Connect a backend for delivery rates, storage usage, and login telemetry."
  }
}
```

## 15) Stores
Method: GET
Endpoint: /api/admin/stores

Example request:
```http
GET /api/admin/stores
```

Example response:
```json
{
  "totalStores": 1,
  "activeStores": 1,
  "inactiveStores": 0,
  "items": [
    {
      "id": "7d1a...",
      "name": "Downtown Hub",
      "code": "DTH-01",
      "location": "New York",
      "status": "active",
      "createdAt": "2026-11-04T10:15:00.000Z",
      "updatedAt": "2026-11-04T10:15:00.000Z"
    }
  ]
}
```

Method: POST
Endpoint: /api/admin/stores

Payload:
```json
{
  "name": "Downtown Hub",
  "code": "DTH-01",
  "location": "New York",
  "status": "active"
}
```

Method: PATCH
Endpoint: /api/admin/stores/:id

Payload:
```json
{
  "name": "Downtown Hub Updated",
  "status": "inactive"
}
```

Method: DELETE
Endpoint: /api/admin/stores/:id

Response:
- HTTP 204 No Content

## 16) Security & retention
Method: GET
Endpoint: /api/admin/security

Example request:
```http
GET /api/admin/security
```

Example response:
```json
{
  "item": {
    "requireMfa": true,
    "allowExternalForwarding": false,
    "allowImapAccess": true,
    "allowPopAccess": false,
    "sessionDurationMinutes": 60,
    "minimumPasswordLength": 12,
    "retentionPeriodDays": 365
  }
}
```

Method: PATCH
Endpoint: /api/admin/security

Payload:
```json
{
  "requireMfa": true,
  "allowExternalForwarding": false,
  "allowImapAccess": true,
  "allowPopAccess": false,
  "sessionDurationMinutes": 60,
  "minimumPasswordLength": 12,
  "retentionPeriodDays": 365
}
```

## 16) Monitoring list
Method: GET
Endpoint: /api/admin/monitoring

Optional query parameters:
- q
- folder
- unread
- withAttachments
- limit

Example request:
```http
GET /api/admin/monitoring?folder=inbox&unread=true&withAttachments=true&limit=25
```

Example response:
```json
{
  "summary": {
    "totalMailCopies": 120,
    "inboxCopies": 80,
    "unreadMessages": 14,
    "withAttachments": 31
  },
  "items": [
    {
      "id": 5001,
      "mailbox": "ops@survill.com",
      "from": "alice@example.com",
      "to": "team@survill.com",
      "subject": "Project update",
      "folder": "inbox",
      "date": "2026-11-04T10:15:00.000Z",
      "unread": true,
      "hasAttachments": false
    }
  ]
}
```

## 11) Email monitoring
Method: GET
Endpoint: /api/admin/email-monitoring

Example request:
```http
GET /api/admin/email-monitoring?q=invoice&folder=all&limit=20
```

Example response:
```json
{
  "summary": {
    "totalMailCopies": 120,
    "inboxCopies": 80,
    "unreadMessages": 14,
    "withAttachments": 31
  },
  "items": [
    {
      "id": 5001,
      "mailbox": "ops@survill.com",
      "from": "alice@example.com",
      "to": "team@survill.com",
      "subject": "Project update",
      "folder": "inbox",
      "date": "2026-11-04T10:15:00.000Z",
      "unread": true,
      "hasAttachments": false
    }
  ]
}
```

## Auth requirement
Use a valid admin session before calling these routes.

Example with cookie auth:
```http
Cookie: survill_refresh=<refresh-token>
```

Example with bearer token:
```http
Authorization: Bearer <accessToken>
```
