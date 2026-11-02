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
async function mockApi(page, options = {}) {
  const calls = [];
  const user = {
    id: userId,
    email: "test@survill.com",
    displayName: "Test User",
    role: options.admin ? "admin" : "member",
    isActive: true,
    recoveryEmail: "recovery@example.com",
    avatarUrl: null,
    signatureHtml: "<p>Server signature</p>",
    preferences: {},
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
      if (body) Object.assign(user.preferences, body.preferences);
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
          message.folderId === url.searchParams.get("folder") ? [message] : [],
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
    if (path === "/api/known-domains") return json({ items: [] });
    if (path === "/api/admin/inbound-log") return json({ items: [] });
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

test("admin route uses backend users and unsupported features stay unavailable", async ({
  page,
}) => {
  const { calls } = await mockApi(page, { admin: true });
  await login(page);
  await page.getByRole("link", { name: "Admin tools", exact: true }).click();
  await page.getByRole("link", { name: "users", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Test User", exact: true }),
  ).toBeVisible();
  await page.goto("/admin/stores");
  await expect(
    page.getByText("This feature has no endpoint", { exact: false }),
  ).toBeVisible();
  expect(calls.some((c) => c.path.includes("stores"))).toBe(false);
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
    .getByRole("navigation", { name: "Workspace" })
    .getByRole("link", { name: "Settings" })
    .click();
  await page.getByLabel("Email signature").fill("<script>not markup</script>");
  await page.getByRole("button", { name: "Save preferences" }).click();
  await expect
    .poll(() =>
      calls.some(
        (c) =>
          c.path === "/api/profile" &&
          c.body?.signatureHtml === "&lt;script&gt;not markup&lt;/script&gt;",
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
    await api.saveSettings({ pageSize: 20 });
    await api.saveSettings({ pageSize: 50 }, true);
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
    await api.domains();
    await api.saveDomain({ domain: "example.com", name: "Example" });
    await api.deleteDomain(key);
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
    new Set(inventory.filter((p) => p !== "GET /api/files/:token")),
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
