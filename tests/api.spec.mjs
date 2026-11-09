import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

const runtimeErrors = new WeakMap();
test.beforeEach(({ page }) => {
  const errors = [];
  runtimeErrors.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      message.text().includes("non-serializable")
    )
      errors.push(message.text());
  });
});
test.afterEach(({ page }) => {
  expect(runtimeErrors.get(page)).toEqual([]);
});

const userId = "11111111-1111-4111-8111-111111111111";
const messageId = "22222222-2222-4222-8222-222222222222";
const draftId = "33333333-3333-4333-8333-333333333333";
const attachmentId = "44444444-4444-4444-8444-444444444444";
const companyRecords = {
  "shared-mailboxes": {
    id: "mb-1",
    mailbox: "support@example.com",
    conversation: "sales@example.com",
    status: "pending",
    requests: 0,
    access: "Open",
    note: "Delivery update requested",
  },
  scheduled: {
    id: "sched-1",
    subject: "Server scheduled message",
    to: "team@example.com",
    body: "Scheduled body",
    scheduledFor: "2099-11-07T10:00:00.000Z",
    status: "scheduled",
  },
  snoozed: {
    id: "snooze-1",
    subject: "Server snoozed message",
    from: "supplier@example.com",
    body: "Snoozed body",
    snoozedUntil: "2099-11-07T10:30:00.000Z",
    status: "snoozed",
  },
  "company-directory": {
    id: "emp-1",
    name: "Asha Rao",
    title: "HR Manager",
    department: "Human Resources",
    office: "Head Office",
    email: "asha@example.com",
  },
  approvals: {
    id: "apr-1",
    title: "Office equipment request",
    requester: "Rohan Mehta",
    details: "Purchase - Rahul Menta",
    amount: "₹ 1,240.00",
    status: "pending",
  },
};
async function mockApi(page, options = {}) {
  const calls = [];
  const companyRows = Object.fromEntries(
    Object.entries(companyRecords).map(([key, item]) => [
      key,
      [structuredClone(item)],
    ]),
  );
  const user = {
    id: userId,
    email: "test@survill.com",
    displayName: "Test User",
    role: options.admin ? "admin" : "member",
    isActive: true,
    recoveryEmail: "recovery@example.com",
    avatarUrl: null,
    signatureHtml: "<p>Server signature</p>",
    preferences: options.preferences || {},
    aliases: [],
  };
  const folders = ["inbox", "drafts", "sent", "archive", "spam", "trash"].map(
    (kind, n) => ({
      id: `00000000-0000-4000-8000-00000000000${n}`,
      kind,
      name: kind,
      total: kind === "inbox" ? 1 : 0,
      unread: kind === "inbox" ? 1 : 0,
      position: n,
    }),
  );
  const base = {
    id: messageId,
    threadId: messageId,
    folderId: folders[0].id,
    folderKind: "inbox",
    direction: "inbound",
    subject: "Server message",
    snippet: "Real API contract",
    from: {
      email: "sender@example.com",
      displayName: "Verified Sender",
      status: "known",
    },
    to: [{ email: user.email }],
    cc: [],
    bcc: [],
    replyTo: [],
    sentAt: "2026-10-31T10:00:00Z",
    receivedAt: "2026-10-31T10:00:00Z",
    updatedAt: "2026-10-31T10:00:00Z",
    isRead: false,
    isStarred: false,
    isDraft: false,
    hasAttachments: false,
    labelIds: [],
    bodyText: "Full server message body",
    bodyHtml: "",
    attachments: [],
  };
  let message = { ...base },
    draft = null,
    authenticated = false,
    expired = false;
  let groups = [
    {
      id: 1,
      name: "Studio team",
      email: "team@survill.com",
      whoCanSend: "organization",
      delivery: "active",
      members: [
        { id: 10, email: "a@survill.com", name: "Alice", canSend: true },
        { id: 11, email: "b@survill.com", name: "Bob", canSend: false },
      ],
    },
  ];
  const groupItem = (group) => ({
    ...group,
    memberCount: group.members.length,
    senderCount: group.members.filter((m) => m.canSend).length,
  });
  const adminRows = {
    domains: [
      {
        id: "domain-1",
        domain: "studio.co",
        name: "Studio domain",
        primary: true,
        status: "verified",
      },
    ],
    aliases: [
      {
        id: "alias-1",
        email: "sales@survill.com",
        userId,
        userEmail: user.email,
        userName: user.displayName,
        canSend: true,
      },
    ],
    routing: [
      {
        id: "rule-1",
        name: "Block spam",
        matchField: "domain",
        action: "block",
        priority: 200,
        status: "active",
        criteria: { value: "example.com" },
      },
    ],
    stores: [
      {
        id: "store-1",
        name: "Downtown Hub",
        code: "DTH-01",
        location: "New York",
        status: "active",
      },
    ],
    "sender-controls": [],
  };
  let adminSecurity = {
    requireMfa: true,
    allowExternalForwarding: false,
    allowImapAccess: true,
    allowPopAccess: false,
    sessionDurationMinutes: 60,
    minimumPasswordLength: 12,
    retentionPeriodDays: 365,
  };
  const collections = { contacts: [], tasks: [], notes: [], events: [] };
  const session = () => ({
    accessToken: expired ? "rotated-token" : "test-token",
    expiresIn: 900,
    user,
  });
  await page.route("**/api/**", async (route) => {
    const request = route.request(),
      url = new URL(request.url()),
      path = url.pathname,
      method = request.method();
    if (!path.startsWith("/api/")) return route.continue();
    if (method === "OPTIONS") return route.fulfill({ status: 204 });
    const contentType = request.headers()["content-type"] || "";
    const body = contentType.includes("application/json")
      ? request.postDataJSON()
      : request.postData();
    calls.push({
      path,
      method,
      body,
      params: Object.fromEntries(url.searchParams),
      headers: request.headers(),
    });
    const json = (data, status = 200) => route.fulfill({ status, json: data });
    const empty = () => route.fulfill({ status: 204 });
    const [, , companyKind, companyId] = path.split("/");
    if (companyRows[companyKind]) {
      if (options.companyReadFails && method === "GET")
        return json({ error: "Workspace unavailable" }, 503);
      if (options.companyWriteFails && method !== "GET")
        return json({ error: "Workspace update rejected" }, 403);
      if (method === "GET")
        return json({
          items: companyRows[companyKind],
          total: companyRows[companyKind].length,
          ...(companyKind === "shared-mailboxes" ? { filter: "all" } : {}),
        });
      if (method === "POST") {
        const item = {
          ...body,
          id: `${companyKind}-created`,
          ...(companyKind === "shared-mailboxes" ? { requests: 0 } : {}),
        };
        companyRows[companyKind].push(item);
        return json({ item }, 201);
      }
      if (method === "PATCH") {
        Object.assign(
          companyRows[companyKind].find(
            (item) => item.id === decodeURIComponent(companyId),
          ),
          body,
        );
        return empty();
      }
      if (method === "DELETE") {
        companyRows[companyKind] = companyRows[companyKind].filter(
          (item) => item.id !== decodeURIComponent(companyId),
        );
        return empty();
      }
    }
    if (["/api/admin/overview", "/api/admin/overview/summary"].includes(path))
      return json({
        mailSummary: {
          totalMailCopies: 120,
          inboxCopies: 80,
          unreadMessages: 14,
          withAttachments: 31,
        },
        organization: {
          directoryUsers: 3,
          activeUsers: 3,
          domains: 1,
          contacts: 0,
          sampleMessages: 21,
        },
        workspaceSetup: { directoryReady: true, usersConnected: 3 },
        recentActivity: [
          {
            title: "Latest server activity",
            sender: "alice@example.com",
            receivedAt: "2026-11-04T10:15:00Z",
          },
        ],
      });
    if (["/api/admin/reports", "/api/admin/reports/summary"].includes(path))
      return json({
        mailboxDistribution: [
          { folder: "inbox", count: 6 },
          { folder: "sent", count: 3 },
        ],
        directoryCapacity: {
          allocatedGb: 100,
          usedGb: 0,
          distributedGroups: 2,
          alternateAddresses: 1,
          serverMetricsAvailable: false,
          message: "Delivery telemetry not configured.",
        },
        summary: { totalUsers: 3, totalDomains: 1 },
      });
    if (path === "/api/admin/security") {
      if (method === "GET") return json({ item: adminSecurity });
      if (options.adminWriteFails)
        return json({ error: "Security update rejected" }, 400);
      adminSecurity = { ...adminSecurity, ...body };
      return json({ ok: true });
    }
    const adminMatch = path.match(
      /^\/api\/admin\/(domains|aliases|routing|stores|sender-controls)(?:\/([^/]+))?$/,
    );
    if (adminMatch) {
      const [, kind, id] = adminMatch;
      if (method === "GET") {
        if (options.adminReadFails)
          return json({ error: "Admin data unavailable" }, 503);
        const items = adminRows[kind];
        return json({
          items,
          totalDomains: items.length,
          verified: items.filter((r) => r.status === "verified").length,
          pending: 0,
          primaryDomain:
            kind === "domains" ? items.find((r) => r.primary) : undefined,
          totalRules: items.length,
          activeRules: items.filter((r) => r.status === "active").length,
          pausedRules: items.filter((r) => r.status === "paused").length,
          totalStores: items.length,
          activeStores: items.filter((r) => r.status === "active").length,
          inactiveStores: items.filter((r) => r.status === "inactive").length,
        });
      }
      if (options.adminWriteFails)
        return json({ error: "Admin change rejected" }, 409);
      if (method === "DELETE") {
        adminRows[kind] = adminRows[kind].filter((r) => r.id !== id);
        return empty();
      }
      if (method === "PATCH") {
        Object.assign(
          adminRows[kind].find((r) => r.id === id),
          body,
        );
        return json({ ok: true });
      }
      const item = {
        ...body,
        id: `${kind}-${adminRows[kind].length + 1}`,
        ...(kind === "domains" ? { primary: false, status: "pending" } : {}),
        ...(kind === "aliases"
          ? { userEmail: user.email, userName: user.displayName }
          : {}),
      };
      adminRows[kind].push(item);
      return json({ item }, 201);
    }
    if (path.startsWith("/api/admin/groups")) {
      if (options.groupFailure && method !== "GET")
        return json({ error: "Group change rejected" }, 409);
      if (method === "GET")
        return json({
          totalGroups: groups.length,
          uniqueMembers: new Set(
            groups.flatMap((g) => g.members.map((m) => m.email)),
          ).size,
          activeDelivery: groups.filter((g) => g.delivery === "active").length,
          restrictedSenders: 0,
          items: groups.map(groupItem),
        });
      if (method === "POST") {
        const item = { ...body, id: groups.length + 10 };
        groups.push(item);
        return json({ item: groupItem(item) }, 201);
      }
      const id = Number(path.split("/").at(-1));
      if (method === "PATCH") {
        const item = groups.find((g) => g.id === id);
        Object.assign(item, body);
        return json({ item: groupItem(item) });
      }
      if (method === "DELETE") {
        groups = groups.filter((g) => g.id !== id);
        return empty();
      }
    }
    if (
      ["/api/admin/monitoring", "/api/admin/email-monitoring"].includes(path)
    ) {
      if (options.monitoringFailure)
        return json({ error: "Monitoring unavailable" }, 503);
      return json({
        summary: {
          totalMailCopies: 120,
          inboxCopies: 80,
          unreadMessages: 14,
          withAttachments: 31,
        },
        items: [
          {
            id: 5001,
            mailbox: "ops@survill.com",
            from: "alice@example.com",
            to: "team@survill.com",
            subject: "Project update",
            folder: "inbox",
            date: "2026-11-04T10:15:00.000Z",
            unread: true,
            hasAttachments: false,
          },
        ],
      });
    }
    if (path === "/api/auth/refresh") {
      if (!authenticated || options.refreshFails)
        return json({ error: "Session expired" }, 401);
      await new Promise((resolve) => setTimeout(resolve, 50));
      expired = true;
      return json(session());
    }
    if (path === "/api/auth/login") {
      if (body.password === "wrong")
        return json({ error: "Incorrect credentials" }, 401);
      authenticated = true;
      return json(session());
    }
    if (path === "/api/auth/forgot-password")
      return json({
        ok: true,
        message:
          "If that account has a recovery email, a code has been sent to it.",
      });
    if (path === "/api/auth/reset-password") return json({ ok: true });
    if (!request.headers().authorization)
      return json({ error: "Missing bearer" }, 401);
    if (path === "/api/auth/logout" || path === "/api/auth/logout-all") {
      authenticated = false;
      return empty();
    }
    if (path === "/api/auth/change-password") return json(session());
    if (
      options.expire &&
      ["/api/tasks", "/api/notes"].includes(path) &&
      request.headers().authorization === "Bearer test-token"
    )
      return json({ error: "Expired" }, 401);
    if (["/api/profile", "/api/auth/me"].includes(path)) {
      if (method === "PATCH") Object.assign(user, body);
      return json({ user });
    }
    if (path === "/api/profile/avatar") return json({ user });
    if (path === "/api/settings") {
      if (method === "PUT") user.preferences = { ...body };
      else if (method === "PATCH") Object.assign(user.preferences, body);
      return json({ preferences: user.preferences });
    }
    if (path === "/api/folders") {
      if (method === "POST") {
        const folder = {
          id: crypto.randomUUID(),
          kind: "custom",
          name: body.name,
          total: 0,
          unread: 0,
        };
        folders.push(folder);
        return json({ folder }, 201);
      }
      return json({ folders, starredCount: 0 });
    }
    if (path === "/api/labels") return json({ labels: [] });
    if (path === "/api/contacts/suggest")
      return json({
        items: [{ email: "recipient@example.com", displayName: "Recipient" }],
      });
    if (path === "/api/messages" && method === "GET")
      return json({
        items:
          url.searchParams.get("folder") === "all" ||
          message.folderId === url.searchParams.get("folder")
            ? [message]
            : [],
        total: 1,
        page: Number(url.searchParams.get("page")),
        pageSize: Number(url.searchParams.get("pageSize")),
        totalPages: 2,
      });
    if (path === `/api/messages/${messageId}`) return json({ message });
    if (path === "/api/messages" && method === "PATCH") {
      if (options.bulkFails)
        return json({ error: "Mailbox update rejected" }, 500);
      const old = message;
      if (body.action === "archive")
        message = {
          ...message,
          folderId: folders[3].id,
          folderKind: "archive",
        };
      if (body.action === "revert") message = { ...base };
      return json({
        updated: 1,
        undo: {
          ids: body.ids,
          action: "revert",
          states: [
            {
              id: messageId,
              folderId: old.folderId,
              isRead: old.isRead,
              isStarred: old.isStarred,
            },
          ],
        },
      });
    }
    if (path === "/api/messages" && method === "DELETE")
      return json({ deleted: body.ids.length });
    if (path === "/api/drafts" && method === "POST") {
      draft = {
        ...base,
        id: draftId,
        folderKind: "drafts",
        isDraft: true,
        bodyText: body.text,
        subject: body.subject,
        attachments: [],
      };
      return json({ message: draft }, 201);
    }
    if (path === `/api/drafts/${draftId}`) {
      if (method === "DELETE") {
        draft = null;
        return empty();
      }
      draft = { ...draft, bodyText: body.text, subject: body.subject };
      return json({ message: draft });
    }
    if (path === `/api/drafts/${draftId}/attachments`) {
      draft.attachments = [
        {
          id: attachmentId,
          filename: "report.txt",
          contentType: "text/plain",
          size: 5,
          url: "/signed/file",
        },
      ];
      return json({ message: draft }, 201);
    }
    if (path === `/api/drafts/${draftId}/attachments/${attachmentId}`) {
      draft.attachments = [];
      return json({ message: draft });
    }
    if (path === `/api/drafts/${draftId}/send`) {
      if (options.sendFails)
        return json({ error: "Transport unavailable" }, 502);
      return json({
        message: {
          ...draft,
          isDraft: false,
          folderKind: "sent",
          deliveryStatus: "sent",
        },
      });
    }
    const match = path.match(
      /^\/api\/(contacts|tasks|notes|events)(?:\/([^/]+))?$/,
    );
    if (match) {
      const [, kind, key] = match;
      if (method === "GET")
        return json({
          items: collections[kind],
          total: collections[kind].length,
          page: 1,
          pageSize: 200,
        });
      if (options.workspaceFails)
        return json(
          {
            error: "Validation failed",
            details: { title: ["Rejected title"] },
          },
          400,
        );
      if (method === "DELETE") {
        collections[kind] = collections[kind].filter((item) => item.id !== key);
        return empty();
      }
      const item = { ...body, id: key || crypto.randomUUID() };
      if (key)
        collections[kind] = collections[kind].map((old) =>
          old.id === key ? item : old,
        );
      else collections[kind].push(item);
      return json({ [kind.slice(0, -1)]: item }, key ? 200 : 201);
    }
    if (path === "/api/admin/users") return json({ users: [user] });
    if (path === "/api/admin/inbound-log")
      return json({ items: options.inboundItems || [] });
    if (path === "/api/admin/audit-log")
      return json(options.auditLog || { available: true, total: 0, items: [] });
    if (path === "/api/admin/zoho-sync")
      return json({ configured: false, last: null });
    return json({ error: `Unmocked ${method} ${path}` }, 501);
  });
  return { calls, user };
}
async function login(page) {
  await page.goto("/mail/Inbox");
  await page
    .getByLabel("Email address", { exact: true })
    .fill("test@survill.com");
  await page.getByLabel("Password", { exact: true }).fill("StrongPassword123");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Inbox", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Verified Sender/ }),
  ).toBeVisible();
}

test("shared inbox separates reply drafts scopes search and supports mobile navigation without simulated sending", async ({
  page,
}) => {
  const { calls } = await mockApi(page);
  await login(page);
  await page.route("**/api/shared-mailboxes", (route) =>
    route.fulfill({
      json: {
        items: [
          companyRecords["shared-mailboxes"],
          {
            id: "mb-2",
            mailbox: "hr@example.com",
            conversation: "candidate@example.com",
            status: "approved",
            requests: 2,
            access: "Restricted",
            note: "Interview availability",
          },
        ],
        total: 2,
      },
    }),
  );
  await page.goto("/shared-mailboxes");
  const list = page.getByRole("region", {
    name: "Conversation list",
    exact: true,
  });
  const draft = page.getByLabel("Shared mailbox reply", { exact: true });
  await draft.fill("Reply for sales");
  await list.getByRole("button", { name: /candidate@example.com/ }).click();
  await expect(draft).toHaveValue("");
  await draft.fill("Reply for candidate");
  await list.getByRole("button", { name: /sales@example.com/ }).click();
  await expect(draft).toHaveValue("Reply for sales");
  await expect(
    page.getByRole("button", { name: "Send reply", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByText("This is a record note, not an email message."),
  ).toBeVisible();
  await page.getByLabel("Search mail", { exact: true }).fill("Interview");
  await expect(page).toHaveURL(/\/shared-mailboxes\?q=Interview$/);
  await expect(
    list.getByRole("button", { name: /sales@example.com/ }),
  ).toHaveCount(0);
  await page.getByLabel("Search conversations").fill("");
  await list.getByRole("button", { name: /sales@example.com/ }).click();
  await page.screenshot({
    path: "test-results/shared-inbox-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(draft).toBeVisible();
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(list).toBeVisible();
  await page.getByLabel("Choose mailbox").selectOption("hr@example.com");
  await list.getByRole("button", { name: /candidate@example.com/ }).click();
  await expect(draft).toHaveValue("Reply for candidate");
  await page.screenshot({
    path: "test-results/shared-inbox-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Discard draft", exact: true })
    .click();
  await expect(draft).toHaveValue("");
  expect(calls.some((call) => /\/send$|\/replies$/.test(call.path))).toBe(
    false,
  );
  await page.reload();
  await list.getByRole("button", { name: /sales@example.com/ }).click();
  await expect(draft).toHaveValue("");
});

test("workspace tabs shared mailbox and directory use documented server fields", async ({
  page,
}) => {
  const { calls } = await mockApi(page, { admin: true });
  await login(page);
  await page.goto("/shared-mailboxes");
  await expect(
    page.getByRole("region", { name: "Conversation workspace", exact: true }),
  ).toContainText("sales@example.com");
  await expect(
    page.getByRole("region", { name: "Conversation workspace", exact: true }),
  ).toContainText("Delivery update requested");
  await expect(
    page.getByRole("button", { name: /assign|resolve/i }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  let dialog = page.getByRole("dialog");
  await dialog.getByLabel("Status", { exact: true }).selectOption("approved");
  await dialog.getByLabel("Access", { exact: true }).selectOption("Restricted");
  await dialog.getByRole("button", { name: "Save conversation" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(
    page.getByRole("region", { name: "Conversation workspace", exact: true }),
  ).toContainText("Restricted");
  expect(
    calls.find(
      (c) => c.path === "/api/shared-mailboxes/mb-1" && c.method === "PATCH",
    ).body,
  ).toEqual({ status: "approved", access: "Restricted" });
  await page.getByRole("button", { name: "New conversation" }).click();
  dialog = page.getByRole("dialog");
  await dialog.getByLabel("Mailbox", { exact: true }).fill("hr@example.com");
  await dialog
    .getByLabel("Contact email", { exact: true })
    .fill("candidate@example.com");
  await dialog
    .getByLabel("Context note", { exact: true })
    .fill("Interview availability");
  await dialog.getByRole("button", { name: "Save conversation" }).click();
  await expect(dialog).toHaveCount(0);
  expect(
    calls.find((c) => c.path === "/api/shared-mailboxes" && c.method === "POST")
      .body,
  ).toEqual({
    mailbox: "hr@example.com",
    conversation: "candidate@example.com",
    note: "Interview availability",
    access: "Open",
    status: "pending",
  });
  await page.goto("/directory");
  await expect(page.getByRole("article")).toContainText("Head Office");
  await page.getByRole("button", { name: "Edit record" }).click();
  dialog = page.getByRole("dialog");
  await dialog.getByLabel("Office", { exact: true }).fill("Mumbai Office");
  await dialog.getByRole("button", { name: "Save record" }).click();
  await expect(dialog).toHaveCount(0);
  expect(
    calls.find(
      (c) => c.path === "/api/company-directory/emp-1" && c.method === "PATCH",
    ).body,
  ).toEqual({ office: "Mumbai Office" });
  await page.getByRole("button", { name: "Create record" }).click();
  dialog = page.getByRole("dialog");
  for (const [label, value] of [
    ["Name", "New Employee"],
    ["Job title", "Manager"],
    ["Department", "Operations"],
    ["Office", "Delhi"],
    ["Email", "employee@example.com"],
  ])
    await dialog.getByLabel(label, { exact: true }).fill(value);
  await dialog.getByRole("button", { name: "Save record" }).click();
  await expect(dialog).toHaveCount(0);
  expect(
    calls.find(
      (c) => c.path === "/api/company-directory" && c.method === "POST",
    ).body,
  ).toEqual({
    name: "New Employee",
    title: "Manager",
    department: "Operations",
    office: "Delhi",
    email: "employee@example.com",
  });
  await page.reload();
  await expect(
    page.getByRole("article").filter({ hasText: "New Employee" }),
  ).toBeVisible();
});

for (const kind of ["scheduled", "snoozed"]) {
  test(`workspace tabs ${kind} create transition and delete use exact contracts`, async ({
    page,
  }) => {
    const { calls } = await mockApi(page);
    await login(page);
    await page.goto(`/${kind}`);
    const scheduling = kind === "scheduled";
    await expect(page.getByRole("article")).toContainText(
      scheduling ? "team@example.com" : "supplier@example.com",
    );
    await page.getByRole("button", { name: "Create record" }).click();
    const dialog = page.getByRole("dialog");
    await dialog
      .getByLabel("Subject", { exact: true })
      .fill("New server record");
    await dialog
      .getByLabel(scheduling ? "Recipient" : "Sender", { exact: true })
      .fill("person@example.com");
    await dialog.getByLabel("Message", { exact: true }).fill("Saved message");
    const time = dialog.getByLabel(scheduling ? "Send at" : "Return at", {
      exact: true,
    });
    await time.fill("2020-01-01T09:00");
    await dialog.getByRole("button", { name: "Save record" }).click();
    await expect(dialog.getByRole("alert")).toContainText("future date");
    await time.fill("2099-01-01T09:00");
    await dialog.getByRole("button", { name: "Save record" }).click();
    await expect(dialog).toHaveCount(0);
    const payload = calls.find(
      (c) => c.path === `/api/${kind}` && c.method === "POST",
    ).body;
    const timeKey = scheduling ? "scheduledFor" : "snoozedUntil";
    expect(payload).toEqual({
      subject: "New server record",
      [scheduling ? "to" : "from"]: "person@example.com",
      body: "Saved message",
      [timeKey]: expect.any(String),
      status: kind,
    });
    expect(payload[timeKey]).toBe(
      await page.evaluate(() => new Date("2099-01-01T09:00").toISOString()),
    );
    const card = page
      .getByRole("article")
      .filter({ hasText: "New server record" });
    await card
      .getByRole("button", {
        name: scheduling ? "Cancel schedule" : "Mark active",
      })
      .click();
    await expect(card).toContainText(scheduling ? "cancelled" : "active");
    expect(
      calls.find(
        (c) =>
          c.path === `/api/${kind}/${kind}-created` && c.method === "PATCH",
      ).body,
    ).toEqual({ status: scheduling ? "cancelled" : "active" });
    await card.getByRole("button", { name: "Delete record" }).click();
    await page.getByRole("button", { name: "Confirm delete" }).click();
    await expect(card).toHaveCount(0);
    expect(
      calls.some(
        (c) =>
          c.path === `/api/${kind}/${kind}-created` && c.method === "DELETE",
      ),
    ).toBe(true);
    expect(calls.some((c) => /\/send$/.test(c.path))).toBe(false);
  });
}

test("workspace tabs approvals preserve formatted amounts and approve server records", async ({
  page,
}) => {
  const { calls } = await mockApi(page);
  await login(page);
  await page.goto("/approvals");
  await expect(page.getByRole("article")).toContainText("₹ 1,240.00");
  await expect(page.getByRole("article")).toContainText(
    "Purchase - Rahul Menta",
  );
  await expect(
    page.getByRole("button", { name: /reject|withdraw/i }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Create record" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Request title").fill("Travel request");
  await dialog
    .getByLabel("Details", { exact: true })
    .fill("Visit Mumbai office");
  await dialog.getByLabel("Amount (formatted text)").fill("₹ 5,000.00");
  await dialog.getByRole("button", { name: "Save record" }).click();
  await expect(dialog).toHaveCount(0);
  expect(
    calls.find((c) => c.path === "/api/approvals" && c.method === "POST").body,
  ).toEqual({
    title: "Travel request",
    requester: "Test User",
    details: "Visit Mumbai office",
    amount: "₹ 5,000.00",
    status: "pending",
  });
  const card = page.getByRole("article").filter({ hasText: "Travel request" });
  await card.getByRole("button", { name: "Approve request" }).click();
  await expect(card).toContainText("approved");
  expect(
    calls.find(
      (c) =>
        c.path === "/api/approvals/approvals-created" && c.method === "PATCH",
    ).body,
  ).toEqual({ status: "approved" });
});

test("workspace tabs failure retry retains edits and never substitutes demo records", async ({
  page,
}) => {
  const { calls } = await mockApi(page);
  await login(page);
  let failRead = true;
  let failWrite = true;
  await page.route("**/api/shared-mailboxes", (route) => {
    if (route.request().method() === "GET" && failRead)
      return route.fulfill({
        status: 503,
        json: { error: "Service unavailable" },
      });
    if (route.request().method() === "POST" && failWrite)
      return route.fulfill({ status: 403, json: { error: "Not permitted" } });
    return route.fallback();
  });
  await page.goto("/shared-mailboxes");
  await expect(page.getByRole("alert")).toContainText("Service unavailable");
  await expect(page.getByRole("article")).toHaveCount(0);
  failRead = false;
  await page.getByRole("button", { name: "Retry", exact: true }).click();
  await page.getByRole("button", { name: "New conversation" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Mailbox", { exact: true }).fill("new@example.com");
  await dialog
    .getByLabel("Contact email", { exact: true })
    .fill("sender@example.com");
  await dialog
    .getByLabel("Context note", { exact: true })
    .fill("Keep my input");
  await dialog.getByRole("button", { name: "Save conversation" }).click();
  await expect(dialog.getByRole("alert")).toContainText("Not permitted");
  await expect(dialog.getByLabel("Context note", { exact: true })).toHaveValue(
    "Keep my input",
  );
  failWrite = false;
  failRead = true;
  await dialog.getByRole("button", { name: "Save conversation" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("alert")).toContainText(
    "Changes were saved, but the list could not be refreshed",
  );
  failRead = false;
  await page.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(
    page
      .getByRole("region", { name: "Conversation list", exact: true })
      .getByRole("button")
      .filter({ hasText: "Keep my input" }),
  ).toBeVisible();
  expect(
    calls.filter(
      (c) => c.path === "/api/shared-mailboxes" && c.method === "POST",
    ),
  ).toHaveLength(1);
  await page.goto("/directory");
  await expect(page.getByRole("article")).toContainText("Asha Rao");
  await expect(page.getByRole("button", { name: "Create record" })).toHaveCount(
    0,
  );
});

test("authentication, cookie restoration, logout, and no browser persistence", async ({
  page,
}) => {
  const { calls } = await mockApi(page);
  await login(page);
  expect(calls.find((c) => c.path.endsWith("/login")).body).toMatchObject({
    remember: true,
  });
  expect(
    calls.find((c) => c.path === "/api/messages").headers.authorization,
  ).toBe("Bearer test-token");
  expect(
    await page.evaluate(() => ({
      local: { ...localStorage },
      session: { ...sessionStorage },
    })),
  ).toEqual({ local: {}, session: {} });
  await page.reload();
  await expect(
    page.getByRole("button", { name: /Verified Sender/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Account menu" }).click();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL(/login/);
  await expect(page.getByText("Fill demo credentials")).toHaveCount(0);
});

for (const resource of ["folders", "labels"]) {
  test(`reload keeps authentication when ${resource} fails and retries mailbox loading`, async ({
    page,
  }) => {
    const { calls } = await mockApi(page);
    await login(page);
    const intercept = (route) =>
      route.fulfill({
        status: 503,
        json: { error: "Temporarily unavailable" },
      });
    await page.route(`**/api/${resource}`, intercept);
    await page.reload();
    await expect(page.getByRole("alert")).toContainText("You are signed in");
    await expect(page).toHaveURL(/mail\/Inbox/);
    await expect(page.getByLabel("Password", { exact: true })).toHaveCount(0);
    await page.unroute(`**/api/${resource}`, intercept);
    await page.getByRole("button", { name: "Retry mailbox" }).click();
    await expect(
      page.getByRole("button", { name: /Verified Sender/ }),
    ).toBeVisible();
    expect(
      calls.filter((call) => call.path === "/api/auth/login"),
    ).toHaveLength(1);
  });
}

test("reload offers retry for unavailable refresh instead of asking for login", async ({
  page,
}) => {
  await mockApi(page);
  await login(page);
  const intercept = (route) =>
    route.fulfill({ status: 503, json: { error: "Temporarily unavailable" } });
  await page.route("**/api/auth/refresh", intercept);
  await page.reload();
  await expect(page.getByRole("alert")).toContainText(
    "Could not restore your session",
  );
  await expect(page).toHaveURL(/mail\/Inbox/);
  await expect(page.getByLabel("Password", { exact: true })).toHaveCount(0);
  await page.unroute("**/api/auth/refresh", intercept);
  await page.getByRole("button", { name: "Retry connection" }).click();
  await expect(
    page.getByRole("button", { name: /Verified Sender/ }),
  ).toBeVisible();
});

test("reload requests login when the backend rejects the refresh session", async ({
  page,
}) => {
  await mockApi(page);
  await login(page);
  await page.route("**/api/auth/refresh", (route) =>
    route.fulfill({ status: 401, json: { error: "Session expired" } }),
  );
  await page.reload();
  await expect(page).toHaveURL(/login/);
  await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
});

test("search and pagination use server parameters; full message opens and bulk undo works", async ({
  page,
}) => {
  const { calls } = await mockApi(page);
  await login(page);
  await page.getByLabel("Search mail", { exact: true }).fill("needle");
  await expect
    .poll(
      () => calls.filter((c) => c.path === "/api/messages").at(-1)?.params.q,
    )
    .toBe("needle");
  await page.getByRole("button", { name: "Next page" }).click();
  await expect
    .poll(
      () => calls.filter((c) => c.path === "/api/messages").at(-1)?.params.page,
    )
    .toBe("2");
  await page.getByRole("button", { name: /Verified Sender/ }).click();
  await expect(
    page.getByText("Full server message body", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Archive message", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Undo", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect
    .poll(() => calls.some((c) => c.body?.action === "revert"))
    .toBe(true);
});

test("failed bulk update retains the message and reports the server error", async ({
  page,
}) => {
  await mockApi(page, { bulkFails: true });
  await login(page);
  await page.getByRole("button", { name: /Verified Sender/ }).click();
  await page
    .getByRole("button", { name: "Archive message", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "Mailbox update rejected",
  );
  await expect(
    page.getByText("Full server message body", { exact: true }),
  ).toBeVisible();
});

test("draft creation, multipart attachment, save and send use one server draft", async ({
  page,
}) => {
  const { calls } = await mockApi(page);
  await login(page);
  await page.getByRole("button", { name: /New mail/ }).click();
  await expect(page.getByLabel("Message body")).toHaveValue("Server signature");
  await page
    .getByLabel("Recipients", { exact: true })
    .fill("recipient@example.com");
  await page.getByLabel("Subject", { exact: true }).fill("Attached report");
  await page.getByLabel("Message body").fill("Hello from the API integration");
  await page.getByLabel("Attach files").setInputFiles({
    name: "report.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("hello"),
  });
  await expect(
    page.getByRole("button", { name: "Remove report.txt" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(
    calls.filter((c) => c.path === "/api/drafts" && c.method === "POST"),
  ).toHaveLength(1);
  const upload = calls.find((c) => c.path.endsWith("/attachments"));
  expect(upload.headers["content-type"]).toContain(
    "multipart/form-data; boundary=",
  );
  expect(upload.body).toContain('name="files"');
  expect(calls.some((c) => c.path === `/api/drafts/${draftId}/send`)).toBe(
    true,
  );
});

test("transport failure keeps composer and recoverable draft open", async ({
  page,
}) => {
  const { calls } = await mockApi(page, { sendFails: true });
  await login(page);
  await page.getByRole("button", { name: /New mail/ }).click();
  await page
    .getByLabel("Recipients", { exact: true })
    .fill("recipient@example.com");
  await page.getByLabel("Subject", { exact: true }).fill("Keep this draft");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Transport unavailable");
  await expect(page.getByLabel("Subject", { exact: true })).toHaveValue(
    "Keep this draft",
  );
  await page.getByRole("button", { name: "Send", exact: true }).click();
  expect(
    calls.filter((c) => c.path === "/api/drafts" && c.method === "POST"),
  ).toHaveLength(1);
});

test("workspace task create, edit, completion and delete use backend fields", async ({
  page,
}) => {
  const { calls } = await mockApi(page);
  await login(page);
  await page.getByRole("link", { name: "tasks", exact: true }).click();
  await page.getByRole("button", { name: /New task/ }).click();
  await page
    .getByRole("textbox", { name: "Task *", exact: true })
    .fill("Server task");
  await page.getByLabel("Due date").fill("2026-11-05");
  await page.getByRole("button", { name: "Save task", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Server task" }),
  ).toBeVisible();
  expect(
    calls.find((c) => c.path === "/api/tasks" && c.method === "POST").body,
  ).toMatchObject({
    title: "Server task",
    dueDate: "2026-11-05",
    completed: false,
  });
  await page.getByLabel("Complete Server task").click();
  await expect(page.getByLabel("Complete Server task")).toBeChecked();
  await expect
    .poll(() =>
      calls.some((c) => c.method === "PATCH" && c.body?.completed === true),
    )
    .toBe(true);
  await page
    .getByRole("button", { name: "Delete Server task", exact: true })
    .click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Server task" })).toHaveCount(
    0,
  );
});

test("failed workspace save does not close editor or claim success", async ({
  page,
}) => {
  await mockApi(page, { workspaceFails: true });
  await login(page);
  await page.getByRole("link", { name: "notes", exact: true }).click();
  await page.getByRole("button", { name: /New note/ }).click();
  await page.getByLabel("Title").fill("Rejected");
  await page.getByRole("button", { name: "Save note", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Rejected title");
  await expect(page.getByRole("dialog")).toBeVisible();
});

test("concurrent 401s share one refresh and retry with the rotated token", async ({
  page,
}) => {
  const { calls } = await mockApi(page, { expire: true });
  await login(page);
  await page.evaluate(async () => {
    const { backend } = await import("/src/api/backend.js");
    await Promise.all([backend.list("tasks"), backend.list("notes")]);
  });
  expect(calls.filter((c) => c.path === "/api/auth/refresh")).toHaveLength(2); // startup + one rotation
  expect(
    calls.filter(
      (c) =>
        ["/api/tasks", "/api/notes"].includes(c.path) &&
        c.headers.authorization === "Bearer rotated-token",
    ),
  ).toHaveLength(2);
});

test("expired refresh clears protected state without a retry loop", async ({
  page,
}) => {
  const { calls } = await mockApi(page, { expire: true, refreshFails: true });
  await login(page);
  await page.getByRole("link", { name: "tasks", exact: true }).click();
  await expect(page).toHaveURL(/login/);
  expect(calls.filter((c) => c.path === "/api/auth/refresh")).toHaveLength(2);
});

test("admin monitoring uses live summaries, filters and metadata", async ({
  page,
}) => {
  const { calls } = await mockApi(page, { admin: true });
  await login(page);
  await page.goto("/admin/overview");
  await expect(
    page.getByRole("region", { name: "Monitoring overview" }),
  ).toContainText("120");
  expect(calls.some((c) => c.path === "/api/admin/overview")).toBe(true);
  await page
    .getByRole("link", { name: "Email monitoring", exact: true })
    .click();
  await expect(
    page.getByRole("cell", { name: "Project update", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Search monitored mail").fill("invoice");
  await page.getByLabel("Monitoring folder").selectOption("inbox");
  await page.getByLabel("Message read state").selectOption("false");
  await page.getByLabel("Attachment state").selectOption("false");
  await page.getByLabel("Monitoring limit").selectOption("20");
  await expect
    .poll(
      () =>
        calls.filter((c) => c.path === "/api/admin/email-monitoring").at(-1)
          ?.params,
    )
    .toEqual({
      q: "invoice",
      folder: "inbox",
      unread: "false",
      withAttachments: "false",
      limit: "20",
    });
  await page
    .getByRole("button", {
      name: "Details for Project update in ops@survill.com",
    })
    .click();
  await expect(page.getByRole("dialog")).toContainText("alice@example.com");
  await expect(page.getByRole("dialog")).toContainText(
    "Message content and attachment downloads are not available",
  );
  await page.getByRole("button", { name: "Close dialog" }).click();
  expect(calls.some((c) => /messages\/5001|attachments\//.test(c.path))).toBe(
    false,
  );
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("admin audit log displays events, limits, unavailable state and retry", async ({
  page,
}) => {
  const { calls } = await mockApi(page, {
    admin: true,
    auditLog: {
      available: true,
      total: 42,
      items: [
        {
          id: "6c7a-event",
          eventType: "user.login",
          actorEmail: "admin@survill.com",
          targetType: "user",
          targetId: "7d1a-user",
          details: { ip: "203.0.113.41", userAgent: "Chrome" },
          createdAt: "2026-11-04T10:15:00.000Z",
        },
      ],
    },
  });
  await login(page);
  await page.goto("/admin/audit");
  const table = page.getByRole("table", { name: "Audit log", exact: true });
  for (const value of [
    "6c7a-event",
    "user.login",
    "admin@survill.com",
    "7d1a-user",
    "203.0.113.41",
    "Chrome",
    "2026-11-04T10:15:00.000Z",
  ])
    await expect(table).toContainText(value);
  await expect(page.getByText("Showing 1 of 42 audit events")).toBeVisible();
  const reads = () =>
    calls.filter((call) => call.path === "/api/admin/audit-log");
  expect(reads().at(-1)).toMatchObject({
    method: "GET",
    params: { limit: "25" },
  });
  await page.getByLabel("Record limit").selectOption("100");
  await expect.poll(() => reads().at(-1).params.limit).toBe("100");
  await expect(table).toBeVisible();
  const count = reads().length;
  await page.getByRole("button", { name: "Refresh audit log" }).click();
  await expect.poll(() => reads().length).toBeGreaterThan(count);
  await expect(table).toBeVisible();
  await page.route("**/api/admin/audit-log?*", (route) =>
    route.fulfill({
      json: {
        available: false,
        message: "Audit tracking is disabled for this organization.",
        items: [],
      },
    }),
  );
  await page.getByRole("button", { name: "Refresh audit log" }).click();
  await expect(page.getByRole("status")).toHaveText(
    "Audit tracking is disabled for this organization.",
  );
  await expect(table).toHaveCount(0);
  await expect(page.getByText(/Showing .* audit events/)).toHaveCount(0);
  await expect(page.getByText("No audit log entries found.")).toHaveCount(0);
  await page.route("**/api/admin/audit-log?*", (route) =>
    route.fulfill({
      status: 503,
      json: { error: "Audit service unavailable" },
    }),
  );
  await page.getByRole("button", { name: "Refresh audit log" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Audit service unavailable",
  );
  await page.route("**/api/admin/audit-log?*", (route) =>
    route.fulfill({ json: { available: true, total: 0, items: [] } }),
  );
  await page.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(page.getByText("No audit log entries found.")).toBeVisible();
  await expect(page.getByText("Showing 0 of 0 audit events")).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("admin inbound log displays API records and supports limits, refresh and retry", async ({
  page,
}) => {
  const { calls } = await mockApi(page, {
    admin: true,
    inboundItems: [
      {
        id: "b1d4-log",
        ses_message_id: "3fb2-message",
        status: "delivered",
        detail: { message: "delivered to the recipient mailbox" },
        recipients: ["newuser@survill.com", "second@survill.com"],
        processed_at: "2026-11-05T08:22:00.000Z",
      },
    ],
  });
  await login(page);
  await page.goto("/admin/inbound-log");
  const table = page.getByRole("table", { name: "Inbound log", exact: true });
  for (const value of [
    "b1d4-log",
    "3fb2-message",
    "delivered to the recipient mailbox",
    "newuser@survill.com",
    "second@survill.com",
    "2026-11-05T08:22:00.000Z",
  ])
    await expect(table).toContainText(value);
  const reads = () =>
    calls.filter((call) => call.path === "/api/admin/inbound-log");
  expect(reads().at(-1)).toMatchObject({
    method: "GET",
    params: { limit: "25" },
  });
  await page.getByLabel("Record limit").selectOption("50");
  await expect.poll(() => reads().at(-1).params.limit).toBe("50");
  await expect(table).toBeVisible();
  const count = reads().length;
  await page.getByRole("button", { name: "Refresh inbound log" }).click();
  await expect.poll(() => reads().length).toBeGreaterThan(count);
  await expect(table).toBeVisible();
  await page.route("**/api/admin/inbound-log?*", (route) =>
    route.fulfill({ status: 503, json: { error: "Inbound log unavailable" } }),
  );
  await page.getByRole("button", { name: "Refresh inbound log" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Inbound log unavailable",
  );
  await expect(table).toHaveCount(0);
  await page.route("**/api/admin/inbound-log?*", (route) =>
    route.fulfill({ json: { items: [] } }),
  );
  await page.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(page.getByText("No inbound log entries found.")).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("admin groups create edit and delete use the supplied member contract", async ({
  page,
}) => {
  const { calls } = await mockApi(page, { admin: true });
  await login(page);
  await page.goto("/admin/groups");
  await expect(
    page.getByRole("button", { name: "Edit Studio team", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Create group", exact: true }).click();
  await page.getByLabel("Group name", { exact: true }).fill("Support team");
  await page
    .getByLabel("Group email", { exact: true })
    .fill("support@survill.com");
  await page.getByRole("button", { name: "Add member" }).click();
  await page.getByLabel("Member 1 name").fill("Charlie");
  await page.getByLabel("Member 1 email").fill("c@survill.com");
  await page.getByLabel("Member 1 can send").check();
  await page.getByRole("button", { name: "Save group" }).click();
  await expect(
    page.getByRole("button", { name: "Edit Support team" }),
  ).toBeVisible();
  expect(
    calls.find((c) => c.path === "/api/admin/groups" && c.method === "POST")
      .body,
  ).toEqual({
    name: "Support team",
    email: "support@survill.com",
    whoCanSend: "organization",
    delivery: "active",
    members: [{ email: "c@survill.com", name: "Charlie", canSend: true }],
  });
  await page.getByRole("button", { name: "Edit Support team" }).click();
  await page.getByLabel("Delivery", { exact: true }).selectOption("paused");
  await page.getByLabel("Member 1 can send").uncheck();
  await page.getByRole("button", { name: "Save group" }).click();
  await expect(
    page.getByRole("cell", { name: "paused", exact: true }),
  ).toBeVisible();
  expect(
    calls.find((c) => c.method === "PATCH" && c.path === "/api/admin/groups/11")
      .body.members,
  ).toEqual([{ email: "c@survill.com", name: "Charlie", canSend: false }]);
  await page.getByRole("button", { name: "Delete Support team" }).click();
  await page.getByRole("button", { name: "Confirm delete" }).click();
  await expect(
    page.getByRole("button", { name: "Edit Support team" }),
  ).toHaveCount(0);
  expect(
    calls.some(
      (c) => c.method === "DELETE" && c.path === "/api/admin/groups/11",
    ),
  ).toBe(true);
});

test("admin API failures retain group edits and never show sample monitored mail", async ({
  page,
}) => {
  await mockApi(page, {
    admin: true,
    groupFailure: true,
    monitoringFailure: true,
  });
  await login(page);
  await page.goto("/admin/groups");
  await page.getByRole("button", { name: "Edit Studio team" }).click();
  await page.getByLabel("Group name", { exact: true }).fill("Keep my edit");
  await page.getByRole("button", { name: "Save group" }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "Group change rejected",
  );
  await expect(page.getByLabel("Group name", { exact: true })).toHaveValue(
    "Keep my edit",
  );
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.getByRole("button", { name: "Delete Studio team" }).click();
  await page.getByRole("button", { name: "Confirm delete" }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "Group change rejected",
  );
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Edit Studio team" }),
  ).toBeVisible();
  await page.goto("/admin/monitoring");
  await expect(page.getByRole("alert")).toContainText("Monitoring unavailable");
  await expect(page.getByRole("cell")).toHaveCount(0);
});

test("settings loads documented fields and patches only changed preferences", async ({
  page,
}) => {
  const { calls } = await mockApi(page, {
    preferences: {
      compactMessageList: true,
      markAsReadWhenOpened: false,
      confirmBeforeMovingToTrash: true,
      messagesPerPage: 25,
      useSignature: false,
      signature: "Best Regards\nhr@onesintel.com",
      customPreference: "keep me",
    },
  });
  await login(page);
  await page.goto("/settings");
  await expect(page.getByLabel("Messages per page")).toHaveValue("25");
  await expect(page.getByLabel("Compact message list")).toBeChecked();
  await expect(page.getByLabel("Mark as read when opened")).not.toBeChecked();
  await expect(page.getByLabel("Confirm before moving to Trash")).toBeChecked();
  await expect(page.getByLabel("Use my signature")).not.toBeChecked();
  await expect(page.getByLabel("Email signature")).toHaveValue(
    "Best Regards\nhr@onesintel.com",
  );
  await expect(
    page.getByRole("button", { name: "Save preferences" }),
  ).toBeDisabled();
  expect(
    calls.some((c) => c.path === "/api/settings" && c.method === "GET"),
  ).toBe(true);
  await page.getByLabel("Messages per page").selectOption("50");
  await page.getByLabel("Use my signature").check();
  await page.getByLabel("Email signature").fill("Regards\nHR");
  await page.getByRole("button", { name: "Save preferences" }).click();
  await expect(
    page.getByRole("button", { name: "Save preferences" }),
  ).toBeDisabled();
  expect(
    calls.find((c) => c.path === "/api/settings" && c.method === "PATCH").body,
  ).toEqual({
    messagesPerPage: 50,
    useSignature: true,
    signature: "Regards\nHR",
  });
  expect(
    calls.some((c) => c.path === "/api/profile" && c.method === "PATCH"),
  ).toBe(false);
  await page.reload();
  await expect(page.getByLabel("Messages per page")).toHaveValue("50");
  await expect(page.getByLabel("Email signature")).toHaveValue("Regards\nHR");
  const preferences = await page.evaluate(async () => {
    const { settingsApi } = await import("/src/api/settings.js");
    return (await settingsApi.get()).preferences;
  });
  expect(preferences).toMatchObject({ customPreference: "keep me" });
  await page.getByLabel("Email signature").fill("Unsaved");
  await page.getByRole("button", { name: "Cancel changes" }).click();
  await expect(page.getByLabel("Email signature")).toHaveValue("Regards\nHR");
});

test("settings load and save failures offer retry and preserve edits", async ({
  page,
}) => {
  await mockApi(page);
  await login(page);
  let failRead = true;
  let failSave = true;
  await page.route("**/api/settings", (route) => {
    if (
      (route.request().method() === "GET" && failRead) ||
      (route.request().method() === "PATCH" && failSave)
    )
      return route.fulfill({
        status: 503,
        json: { error: "Settings unavailable" },
      });
    return route.fallback();
  });
  await page.goto("/settings");
  await expect(page.getByRole("alert")).toContainText("Settings unavailable");
  await expect(
    page.getByRole("button", { name: "Save preferences" }),
  ).toHaveCount(0);
  failRead = false;
  await page.getByRole("button", { name: "Retry settings" }).click();
  await page.getByLabel("Email signature").fill("Keep this edit");
  await page.getByRole("button", { name: "Save preferences" }).click();
  await expect(page.getByRole("alert")).toContainText("Settings unavailable");
  await expect(page.getByLabel("Email signature")).toHaveValue(
    "Keep this edit",
  );
  await expect(
    page.getByRole("button", { name: "Save preferences" }),
  ).toBeEnabled();
  failSave = false;
  await page.getByRole("button", { name: "Save preferences" }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Save preferences" }),
  ).toBeDisabled();
});

test("settings thunks support replacement and partial updates with flat payloads", async ({
  page,
}) => {
  const { calls } = await mockApi(page, { preferences: { oldCustom: true } });
  await login(page);
  const result = await page.evaluate(async () => {
    const { store } = await import("/src/redux/store");
    const { fetchSettings, saveSettings, replaceSettings } =
      await import("/src/redux/thunks/settingsThunks.js");
    await store.dispatch(fetchSettings()).unwrap();
    await store
      .dispatch(
        replaceSettings({
          messagesPerPage: 25,
          signature: "Replacement",
          useSignature: false,
        }),
      )
      .unwrap();
    const replaced = store.getState().settings.preferences;
    await store.dispatch(saveSettings({ compactMessageList: true })).unwrap();
    return { replaced, state: store.getState().settings };
  });
  expect(result.replaced).toEqual({
    messagesPerPage: 25,
    signature: "Replacement",
    useSignature: false,
  });
  expect(result.state).toMatchObject({
    compact: true,
    pageSize: 25,
    signature: "Replacement",
    useSignature: false,
  });
  expect(
    calls.find((c) => c.path === "/api/settings" && c.method === "PUT").body,
  ).toEqual(result.replaced);
  expect(
    calls.find((c) => c.path === "/api/settings" && c.method === "PATCH").body,
  ).toEqual({ compactMessageList: true });
});

test("profile and preferences are sent with documented payloads", async ({
  page,
}) => {
  const { calls } = await mockApi(page);
  await login(page);
  await page.getByRole("link", { name: /View your profile/ }).click();
  await expect(page.getByLabel("Display name")).toBeDisabled();
  await page.getByLabel("Recovery email").fill("new@example.com");
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect
    .poll(() =>
      calls.some(
        (c) =>
          c.path === "/api/profile" &&
          c.body?.recoveryEmail === "new@example.com",
      ),
    )
    .toBe(true);
  await page
    .getByRole("navigation", { name: "Tools and settings" })
    .getByRole("link", { name: "Settings", exact: true })
    .click();
  await page.getByLabel("Email signature").fill("<script>not markup</script>");
  await page.getByRole("button", { name: "Save preferences" }).click();
  await expect
    .poll(() =>
      calls.some(
        (c) =>
          c.path === "/api/settings" &&
          c.method === "PATCH" &&
          c.body?.signature === "<script>not markup</script>",
      ),
    )
    .toBe(true);
});

test("API adapter covers every documented JSON/multipart route and preserves wire contracts", async ({
  page,
}) => {
  await mockApi(page);
  await login(page);
  const requests = await page.evaluate(async () => {
    const { backend: api } = await import("/src/api/backend.js");
    const { apiClient } = await import("/src/api/client.js");
    const calls = [];
    apiClient.defaults.adapter = async (config) => {
      calls.push({
        method: config.method.toUpperCase(),
        path: config.url,
        body:
          typeof config.data === "string"
            ? JSON.parse(config.data)
            : config.data instanceof FormData
              ? [...config.data.keys()]
              : null,
        credentials: config.withCredentials,
        params: config.params,
      });
      return {
        data: { accessToken: "token", user: {}, items: [] },
        status: 200,
        statusText: "OK",
        headers: {},
        config,
      };
    };
    const key = "id",
      blob = new File(["hello"], "file.txt", { type: "text/plain" });
    await api.health();
    await api.login({
      email: "a@survill.com",
      password: "password123",
      remember: true,
    });
    await api.refresh();
    await api.logout();
    await api.logout(true);
    await api.me();
    await api.forgot("a@survill.com");
    await api.reset({
      email: "a@survill.com",
      code: "123456",
      newPassword: "password123",
    });
    await api.changePassword({
      currentPassword: "old",
      newPassword: "password123",
    });
    await api.profile();
    await api.updateProfile({ recoveryEmail: null });
    await api.avatar(blob);
    await api.removeAvatar();
    await api.settings();
    await api.saveSettings({ messagesPerPage: 25 });
    await api.saveSettings({ messagesPerPage: 50 }, true);
    await api.folders();
    await api.createFolder("Projects");
    await api.renameFolder(key, "Work");
    await api.deleteFolder(key);
    await api.emptyFolder("trash");
    await api.labels();
    await api.createLabel({ name: "Work", color: "#112233" });
    await api.updateLabel(key, { color: "#334455" });
    await api.deleteLabel(key);
    await api.messages({ folder: "inbox", page: 2, pageSize: 10, q: "a&b" });
    await api.message(key, false);
    await api.thread(key);
    await api.bulk({ ids: [key], action: "read" });
    await api.deleteMessages([key]);
    await api.raw(key);
    await api.attachment(key);
    await api.createDraft({ text: "Body" });
    await api.saveDraft(key, { to: [] });
    await api.discardDraft(key);
    await api.attach(key, [blob]);
    await api.detach(key, "attachmentId");
    await api.sendDraft(key);
    await api.send({ to: ["a@survill.com"], text: "Hello" });
    for (const kind of ["contacts", "tasks", "notes", "events"]) {
      await api.list(kind);
      await api.create(kind, { title: "Item" });
      await api.update(kind, key, { title: "Edit" });
      await api.remove(kind, key);
    }
    await api.suggest("query");
    await api.identify(["a@survill.com"]);
    await api.groups();
    await api.createGroup({
      name: "Team",
      email: "team@survill.com",
      whoCanSend: "organization",
      delivery: "active",
      members: [],
    });
    await api.updateGroup(key, { delivery: "paused", members: [] });
    await api.deleteGroup(key);
    await api.monitoring({
      folder: "inbox",
      unread: true,
      withAttachments: true,
      limit: 25,
    });
    await api.emailMonitoring({ q: "invoice", folder: "all", limit: 20 });
    await api.adminOverview();
    await api.adminOverviewSummary();
    await api.adminReports();
    await api.adminReportsSummary();
    await api.adminSecurity();
    await api.updateAdminSecurity({
      requireMfa: false,
      allowExternalForwarding: true,
      allowImapAccess: true,
      allowPopAccess: false,
      sessionDurationMinutes: 60,
      minimumPasswordLength: 12,
      retentionPeriodDays: 365,
    });
    await api.adminDomains();
    await api.createAdminDomain({ domain: "studio.co", name: "Studio domain" });
    await api.updateAdminDomain(key, { name: "Updated Studio domain" });
    await api.deleteAdminDomain(key);
    await api.adminAliases();
    await api.createAdminAlias({
      email: "sales@survill.com",
      userId: "user",
      canSend: false,
    });
    await api.deleteAdminAlias(key);
    await api.senderControls({ q: "example.com" });
    await api.createSenderControl({
      emailOrDomain: "example.com",
      action: "block",
      reason: "spam source",
    });
    await api.updateSenderControl(key, {
      action: "allow",
      reason: "verified sender",
    });
    await api.deleteSenderControl(key);
    await api.routingRules({ q: "spam", status: "active" });
    await api.createRoutingRule({
      name: "Block spam",
      matchField: "domain",
      action: "block",
      priority: 200,
      status: "active",
      criteria: { value: "example.com" },
    });
    await api.updateRoutingRule(key, { status: "paused", priority: 500 });
    await api.deleteRoutingRule(key);
    await api.stores();
    await api.createStore({
      name: "Downtown Hub",
      code: "DTH-01",
      location: "New York",
      status: "active",
    });
    await api.updateStore(key, {
      name: "Downtown Hub Updated",
      status: "inactive",
    });
    await api.deleteStore(key);
    await api.users();
    await api.createUser({
      email: "a@survill.com",
      displayName: "User",
      password: "password123",
    });
    await api.updateUser(key, { isActive: false });
    await api.addAlias(key, { email: "team+one@survill.com", canSend: true });
    await api.removeAlias(key, "team+one@survill.com");
    await api.inboundLog(200);
    await api.syncStatus();
    await api.syncContacts();
    return calls;
  });
  const inventory = JSON.parse(
    readFileSync(
      new URL("../docs/endpoint-inventory.json", import.meta.url),
      "utf8",
    ),
  );
  const normalized = requests.map(
    ({ method, path }) =>
      `${method} ${path
        .replace(/\/id(?=\/|$)/g, "/:id")
        .replace("/threads/:id", "/threads/:threadId")
        .replace("/attachments/attachmentId", "/attachments/:attachmentId")
        .replace("/folders/trash/empty", "/folders/:kind/empty")
        .replace("/aliases/team%2Bone%40survill.com", "/aliases/:email")}`,
  );
  expect(new Set(normalized)).toEqual(
    new Set(
      inventory.filter(
        (p) =>
          p !== "GET /api/files/:token" && !p.includes("/api/known-domains"),
      ),
    ),
  );
  expect(requests.every((r) => r.credentials)).toBe(true);
  expect(
    requests.find((r) => r.method === "DELETE" && r.path === "/api/messages")
      .body,
  ).toEqual({ ids: ["id"] });
  expect(
    requests.find((r) => r.method === "PUT" && r.path === "/api/profile/avatar")
      .body,
  ).toEqual(["avatar"]);
  expect(
    requests.find(
      (r) => r.method === "POST" && r.path === "/api/drafts/id/attachments",
    ).body,
  ).toEqual(["files"]);
  expect(
    requests.find((r) => r.method === "GET" && r.path === "/api/messages/id")
      .params,
  ).toEqual({ markRead: false });
});

test("calendar conversion preserves cross-day times and task payloads clear nullable dates", async ({
  page,
}) => {
  await mockApi(page);
  await login(page);
  const result = await page.evaluate(async () => {
    const { workspaceBody, workspaceModel } =
      await import("/src/api/models.js");
    const source = {
      title: "Overnight",
      startAt: "2026-11-05T23:30:00+05:30",
      endAt: "2026-11-06T01:30:00+05:30",
      allDay: false,
    };
    return {
      event: workspaceBody("events", workspaceModel("events", source)),
      task: workspaceBody("tasks", {
        id: "local-only",
        title: "Task",
        due: "",
        done: true,
      }),
    };
  });
  expect(Date.parse(result.event.startAt)).toBe(
    Date.parse("2026-11-05T23:30:00+05:30"),
  );
  expect(Date.parse(result.event.endAt)).toBe(
    Date.parse("2026-11-06T01:30:00+05:30"),
  );
  expect(result.task).toEqual({
    title: "Task",
    dueDate: null,
    completed: true,
  });
});

test("thunks expose pending and fulfilled states and commit server-generated IDs", async ({
  page,
}) => {
  await mockApi(page);
  await login(page);
  const result = await page.evaluate(async () => {
    const { store } = await import("/src/redux/store.js");
    const { saveWorkspaceItem } =
      await import("/src/redux/thunks/workspaceThunks.js");
    const request = store.dispatch(
      saveWorkspaceItem({
        collection: "notes",
        item: { title: "Persisted by server", body: "Note" },
      }),
    );
    const pending =
      store.getState().workspace.requests["workspace/save"].status;
    const data = await request.unwrap();
    return {
      pending,
      fulfilled: store.getState().workspace.requests["workspace/save"].status,
      id: data.item.id,
      notes: store.getState().workspace.notes,
      auth: store.getState().auth,
    };
  });
  expect(result.pending).toBe("pending");
  expect(result.fulfilled).toBe("succeeded");
  expect(result.id).toMatch(/^[0-9a-f-]{36}$/);
  expect(result.notes).toEqual([
    expect.objectContaining({ id: result.id, title: "Persisted by server" }),
  ]);
  expect(JSON.stringify(result.auth)).not.toContain("StrongPassword123");
  expect(JSON.stringify(result.auth)).not.toContain("test-token");
});

test("rejected thunks keep state unchanged and retain serializable validation details", async ({
  page,
}) => {
  await mockApi(page, { workspaceFails: true });
  await login(page);
  const result = await page.evaluate(async () => {
    const { store } = await import("/src/redux/store.js");
    const { saveWorkspaceItem } =
      await import("/src/redux/thunks/workspaceThunks.js");
    const action = await store.dispatch(
      saveWorkspaceItem({ collection: "notes", item: { title: "Rejected" } }),
    );
    return {
      status: action.meta.requestStatus,
      notes: store.getState().workspace.notes,
      request: store.getState().workspace.requests["workspace/save"],
    };
  });
  expect(result.status).toBe("rejected");
  expect(result.notes).toEqual([]);
  expect(result.request.status).toBe("failed");
  expect(result.request.error).toMatchObject({
    status: 400,
    details: { title: ["Rejected title"] },
  });
});

test("a delayed response cannot restore private data after logout", async ({
  page,
}) => {
  await mockApi(page);
  await login(page);
  await page.route("**/api/notes", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    await route.fulfill({
      json: {
        items: [
          {
            id: "old-account-note",
            title: "Private",
            body: "Must not survive logout",
          },
        ],
      },
    });
  });
  const result = await page.evaluate(async () => {
    const { store } = await import("/src/redux/store.js");
    const { fetchWorkspace } =
      await import("/src/redux/thunks/workspaceThunks.js");
    const { logout } = await import("/src/redux/thunks/authThunks.js");
    const pending = store.dispatch(fetchWorkspace("notes"));
    await store.dispatch(logout()).unwrap();
    const action = await pending;
    return {
      session: store.getState().auth.session,
      notes: store.getState().workspace.notes,
      result: action.meta.requestStatus,
    };
  });
  expect(result).toEqual({ session: null, notes: [], result: "rejected" });
});

test("an older workspace list cannot overwrite a confirmed save", async ({
  page,
}) => {
  await mockApi(page);
  await login(page);
  await page.route("**/api/notes", async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    await new Promise((resolve) => setTimeout(resolve, 300));
    await route.fulfill({ json: { items: [] } });
  });
  const notes = await page.evaluate(async () => {
    const { store } = await import("/src/redux/store.js");
    const { fetchWorkspace, saveWorkspaceItem } =
      await import("/src/redux/thunks/workspaceThunks.js");
    const pending = store.dispatch(fetchWorkspace("notes"));
    await store
      .dispatch(
        saveWorkspaceItem({
          collection: "notes",
          item: { title: "Latest confirmed note" },
        }),
      )
      .unwrap();
    await pending.unwrap();
    return store.getState().workspace.notes;
  });
  expect(notes).toEqual([
    expect.objectContaining({ title: "Latest confirmed note" }),
  ]);
});

test("admin domains use server CRUD without simulated verification", async ({
  page,
}) => {
  const { calls } = await mockApi(page, { admin: true });
  await login(page);
  await page.goto("/admin/domains");
  await expect(page.getByText("Primary domain: studio.co")).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Verify|DKIM|Make primary/ }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Create domain", exact: true })
    .click();
  await page.getByLabel("Domain", { exact: true }).fill("example.org");
  await page.getByLabel("Domain name", { exact: true }).fill("Example domain");
  await page.getByRole("button", { name: "Save domain" }).click();
  await page.getByRole("button", { name: "Edit Example domain" }).click();
  await expect(page.getByLabel("Domain", { exact: true })).toBeDisabled();
  await page.getByLabel("Domain name", { exact: true }).fill("Updated domain");
  await page.getByRole("button", { name: "Save domain" }).click();
  await expect(
    page.getByRole("button", { name: "Edit Updated domain" }),
  ).toBeVisible();
  expect(
    calls.find((c) => c.method === "POST" && c.path === "/api/admin/domains")
      .body,
  ).toEqual({ domain: "example.org", name: "Example domain" });
  expect(
    calls.find(
      (c) => c.method === "PATCH" && c.path === "/api/admin/domains/domains-2",
    ).body,
  ).toEqual({ name: "Updated domain" });
  await page.getByRole("button", { name: "Delete Updated domain" }).click();
  await page.getByRole("button", { name: "Confirm delete" }).click();
  await expect(
    page.getByRole("button", { name: "Edit Updated domain" }),
  ).toHaveCount(0);
});

test("admin aliases select a real user and delete by alias ID", async ({
  page,
}) => {
  const { calls } = await mockApi(page, { admin: true });
  await login(page);
  await page.goto("/admin/aliases");
  await page.getByRole("button", { name: "Create alias", exact: true }).click();
  await page.getByLabel("Alias email").fill("help@survill.com");
  await page.getByLabel("Mailbox user", { exact: true }).selectOption(userId);
  await page.getByLabel("Allow sending").uncheck();
  await page.getByRole("button", { name: "Save alias" }).click();
  await expect(
    page.getByRole("button", { name: "Delete help@survill.com" }),
  ).toBeVisible();
  expect(
    calls.find((c) => c.method === "POST" && c.path === "/api/admin/aliases")
      .body,
  ).toEqual({ email: "help@survill.com", userId, canSend: false });
  await page.getByRole("button", { name: "Delete help@survill.com" }).click();
  await page.getByRole("button", { name: "Confirm delete" }).click();
  await expect(
    page.getByRole("button", { name: "Delete help@survill.com" }),
  ).toHaveCount(0);
  expect(
    calls.some(
      (c) => c.method === "DELETE" && c.path === "/api/admin/aliases/aliases-2",
    ),
  ).toBe(true);
  expect(calls.some((c) => c.path.includes(`/users/${userId}/aliases`))).toBe(
    false,
  );
});

test("admin routing preserves criteria and serializes priority and filters", async ({
  page,
}) => {
  const { calls } = await mockApi(page, { admin: true });
  await login(page);
  await page.goto("/admin/routing");
  await page.getByLabel("Search mail routing").fill("spam");
  await page.getByLabel("Routing status filter").selectOption("active");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect
    .poll(
      () =>
        calls
          .filter((c) => c.method === "GET" && c.path === "/api/admin/routing")
          .at(-1)?.params,
    )
    .toEqual({ q: "spam", status: "active" });
  await page.getByRole("button", { name: "Create rule", exact: true }).click();
  await page.getByLabel("Rule name").fill("Block example");
  await page
    .getByLabel("Criteria (JSON)")
    .fill('{"value":"example.org","extra":"preserved"}');
  await page.getByRole("button", { name: "Save rule" }).click();
  await page.getByRole("button", { name: "Edit Block example" }).click();
  await page.getByLabel("Priority", { exact: true }).fill("500");
  await page.getByLabel("Status", { exact: true }).selectOption("paused");
  await page.getByRole("button", { name: "Save rule" }).click();
  await expect(
    page.getByRole("button", { name: "Edit Block example" }),
  ).toBeVisible();
  const update = calls.find(
    (c) => c.method === "PATCH" && c.path === "/api/admin/routing/routing-2",
  );
  expect(update.body).toEqual({
    name: "Block example",
    matchField: "domain",
    action: "block",
    priority: 500,
    status: "paused",
    criteria: { value: "example.org", extra: "preserved" },
  });
  await page.getByRole("button", { name: "Delete Block example" }).click();
  await page.getByRole("button", { name: "Confirm delete" }).click();
  await expect(
    page.getByRole("button", { name: "Edit Block example" }),
  ).toHaveCount(0);
});

test("admin stores use API records without local employee memberships", async ({
  page,
}) => {
  const { calls } = await mockApi(page, { admin: true });
  await login(page);
  await page.goto("/admin/stores");
  await page.getByRole("button", { name: "Create store", exact: true }).click();
  await page.getByLabel("Store name").fill("North Hub");
  await page.getByLabel("Store code").fill("NH-01");
  await page.getByLabel("Location", { exact: true }).fill("Mumbai");
  await page.getByRole("button", { name: "Save store" }).click();
  await page.getByRole("button", { name: "Edit North Hub" }).click();
  await page.getByLabel("Status", { exact: true }).selectOption("inactive");
  await page.getByRole("button", { name: "Save store" }).click();
  await expect(
    page.getByRole("cell", { name: "inactive", exact: true }),
  ).toBeVisible();
  expect(
    calls.find((c) => c.method === "POST" && c.path === "/api/admin/stores")
      .body,
  ).toEqual({
    name: "North Hub",
    code: "NH-01",
    location: "Mumbai",
    status: "active",
  });
  await page.getByRole("button", { name: "Delete North Hub" }).click();
  await page.getByRole("button", { name: "Confirm delete" }).click();
  await expect(
    page.getByRole("button", { name: "Edit North Hub" }),
  ).toHaveCount(0);
  expect(calls.some((c) => c.path.includes("/employees"))).toBe(false);
});

test("admin overview reports and security use server data and exact policy fields", async ({
  page,
}) => {
  const { calls } = await mockApi(page, { admin: true });
  await login(page);
  await page.goto("/admin/overview");
  await expect(page.getByText("Latest server activity")).toBeVisible();
  for (const label of ["Sender controls", "Organization", "Known domains"])
    await expect(
      page
        .getByRole("navigation", { name: "Administration", exact: true })
        .getByRole("link", { name: label, exact: true }),
    ).toHaveCount(0);
  await page.getByRole("link", { name: "Reports", exact: true }).click();
  await expect(
    page.getByText("Delivery telemetry not configured."),
  ).toBeVisible();
  await expect(
    page.getByText("Server telemetry is unavailable."),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Security & retention", exact: true })
    .click();
  await page.getByLabel("Require multi-factor authentication").uncheck();
  await page.getByLabel("Allow external forwarding").check();
  await page.getByLabel("Session duration (minutes)").fill("90");
  await page.getByRole("button", { name: "Save configuration" }).click();
  await expect(page.getByText("Security settings saved.")).toBeVisible();
  await expect(page.getByLabel("Session duration (minutes)")).toHaveValue("90");
  expect(
    calls.find((c) => c.path === "/api/admin/security" && c.method === "PATCH")
      .body,
  ).toEqual({
    requireMfa: false,
    allowExternalForwarding: true,
    allowImapAccess: true,
    allowPopAccess: false,
    sessionDurationMinutes: 90,
    minimumPasswordLength: 12,
    retentionPeriodDays: 365,
  });
});

test("admin resource failures preserve editor and report errors without demo fallback", async ({
  page,
}) => {
  await mockApi(page, { admin: true, adminWriteFails: true });
  await login(page);
  await page.goto("/admin/domains");
  await page.getByRole("button", { name: "Edit Studio domain" }).click();
  await page.getByLabel("Domain name", { exact: true }).fill("Keep my changes");
  await page.getByRole("button", { name: "Save domain" }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "Admin change rejected",
  );
  await expect(page.getByLabel("Domain name", { exact: true })).toHaveValue(
    "Keep my changes",
  );
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.getByRole("button", { name: "Delete Studio domain" }).click();
  await page.getByRole("button", { name: "Confirm delete" }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "Admin change rejected",
  );
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.goto("/admin/security");
  await page.getByLabel("Session duration (minutes)").fill("75");
  await page.getByRole("button", { name: "Save configuration" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Security update rejected",
  );
  await expect(page.getByLabel("Session duration (minutes)")).toHaveValue("75");
  await page.route("**/api/admin/stores", (route) =>
    route.fulfill({
      status: 503,
      json: { error: "Store service unavailable" },
    }),
  );
  await page.goto("/admin/stores");
  await expect(page.getByRole("alert")).toContainText(
    "Store service unavailable",
  );
  await expect(page.getByRole("cell")).toHaveCount(0);
});

test("admin resource thunk lifecycle rejects stale reads after a confirmed write", async ({
  page,
}) => {
  await mockApi(page, { admin: true });
  await login(page);
  const result = await page.evaluate(async () => {
    const { store } = await import("/src/redux/store.js");
    const {
      fetchStores,
      createStore,
      fetchSenderControls,
      fetchAdminOverviewSummary,
      fetchAdminReportsSummary,
    } = await import("/src/redux/thunks/adminThunks.js");
    await store.dispatch(fetchSenderControls({ q: "example.com" })).unwrap();
    await store.dispatch(fetchAdminOverviewSummary()).unwrap();
    await store.dispatch(fetchAdminReportsSummary()).unwrap();
    const before = await store.dispatch(fetchStores()).unwrap();
    store.dispatch(fetchStores.pending("old-request", undefined));
    store.dispatch(
      createStore.fulfilled({ item: { id: "new" } }, "write-request", {}),
    );
    store.dispatch(
      fetchStores.fulfilled(
        { items: [{ id: "stale" }] },
        "old-request",
        undefined,
      ),
    );
    const stale = store.getState().admin.data[fetchStores.typePrefix];
    await store.dispatch(fetchStores()).unwrap();
    return {
      before: before.items[0].id,
      stale: stale ?? null,
      status: store.getState().admin.requests[fetchStores.typePrefix].status,
      summary:
        store.getState().admin.data[fetchAdminOverviewSummary.typePrefix]
          .workspaceSetup.directoryReady,
    };
  });
  expect(result).toEqual({
    before: "store-1",
    stale: null,
    status: "succeeded",
    summary: true,
  });
});
