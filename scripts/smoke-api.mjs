// Real backend smoke test. Does not send mail. --write creates temporary owned
// resources and deletes them in finally; use a dedicated test account/database.
const origin = (process.env.API_URL || "https://mail-backend.ngrok.app").replace(
  /\/$/,
  "",
);
const email = process.env.TEST_EMAIL;
const password = process.env.TEST_PASSWORD;
if (!email || !password) {
  console.error(
    "Set API_URL, TEST_EMAIL and TEST_PASSWORD for a dedicated backend test account.",
  );
  process.exit(1);
}
let token, cookie;
let passed = 0;
const cleanup = [];
async function call(method, path, body, expected = 200) {
  const response = await fetch(origin + path, {
    method,
    headers: {
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(20000),
  });
  const setCookie = response.headers
    .getSetCookie()
    .find((value) => value.startsWith("survill_refresh="));
  if (setCookie) cookie = setCookie.split(";")[0];
  if (response.status !== expected)
    throw new Error(
      `${method} ${path}: expected ${expected}, received ${response.status}`,
    );
  const data = expected === 204 ? undefined : await response.json();
  passed++;
  console.log(`PASS ${method} ${path}`);
  return data;
}
try {
  const health = await call("GET", "/health");
  if (health.ok !== true) throw new Error("Health response was not ok=true");
  const session = await call("POST", "/api/auth/login", {
    email,
    password,
    remember: false,
  });
  token = session.accessToken;
  if (!token || !cookie)
    throw new Error("Login did not provide access token and refresh cookie");
  const refreshed = await call("POST", "/api/auth/refresh");
  token = refreshed.accessToken;
  for (const path of [
    "/api/auth/me",
    "/api/profile",
    "/api/settings",
    "/api/folders",
    "/api/labels",
    "/api/messages?page=1&pageSize=1",
    "/api/contacts?page=1&pageSize=1",
    "/api/tasks",
    "/api/notes",
    "/api/events",
    "/api/known-domains",
  ])
    await call("GET", path);
  if (refreshed.user.role === "admin")
    for (const path of [
      "/api/admin/users",
      "/api/admin/inbound-log?limit=1",
      "/api/admin/zoho-sync",
    ])
      await call("GET", path);
  if (process.argv.includes("--write")) {
    const suffix = `${Date.now()}`;
    const cases = [
      [
        "tasks",
        "task",
        { title: `API smoke ${suffix}`, dueDate: null, completed: false },
        { completed: true },
      ],
      [
        "notes",
        "note",
        { title: `API smoke ${suffix}`, body: "Temporary test note" },
        { body: "Updated test note" },
      ],
      [
        "events",
        "event",
        {
          title: `API smoke ${suffix}`,
          startAt: "2026-11-05T10:00:00Z",
          endAt: "2026-11-05T11:00:00Z",
        },
        { location: "Test" },
      ],
      [
        "contacts",
        "contact",
        { name: `API smoke ${suffix}`, email: `smoke-${suffix}@example.com` },
        { company: "Smoke test" },
      ],
      [
        "folders",
        "folder",
        { name: `Smoke ${suffix}` },
        { name: `Updated ${suffix}` },
      ],
      [
        "labels",
        "label",
        { name: `Smoke ${suffix}`, color: "#112233" },
        { color: "#334455" },
      ],
    ];
    for (const [collection, key, body, edits] of cases) {
      const created = await call("POST", `/api/${collection}`, body, 201);
      const path = `/api/${collection}/${encodeURIComponent(created[key].id)}`;
      cleanup.push(path);
      const updated = await call("PATCH", path, edits);
      for (const [field, value] of Object.entries(edits))
        if (updated[key][field] !== value)
          throw new Error(`${path}: ${field} did not persist`);
    }
    const created = await call(
      "POST",
      "/api/drafts",
      {
        subject: `Unsent smoke ${suffix}`,
        text: "This draft must never be sent",
      },
      201,
    );
    const path = `/api/drafts/${encodeURIComponent(created.message.id)}`;
    cleanup.push(path);
    await call("PUT", path, { text: "Updated unsent draft" });
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  for (const path of cleanup.reverse()) {
    try {
      await call("DELETE", path, undefined, 204);
    } catch (error) {
      console.error(`CLEANUP REQUIRED: ${error.message}`);
      process.exitCode = 1;
    }
  }
  if (cookie) {
    try {
      await call("POST", "/api/auth/logout", undefined, 204);
    } catch (error) {
      console.error(error.message);
      process.exitCode = 1;
    }
  }
  console.log(
    `${passed} checks passed; ${process.exitCode ? "smoke test failed" : "smoke test passed"}. External mail delivery and browser CORS are not tested by this script.`,
  );
}
