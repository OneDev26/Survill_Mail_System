import { test, expect } from "@playwright/test";
async function login(page, email = "alex.morgan@studio.co") {
  await page.goto("/login");
  await page.getByLabel("Email address", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill("Demo@1234");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/mail\/Inbox/);
}
async function logout(page) {
  await page.getByRole("button", { name: "Account menu" }).click();
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/login/);
}
async function compose(page, to, subject, body) {
  await page.getByRole("button", { name: "New mail" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Recipients", { exact: true }).fill(to);
  await dialog.getByLabel("Subject", { exact: true }).fill(subject);
  await dialog.getByLabel("Message body").fill(body);
  return dialog;
}
test("admin controls are outside sidebar; members cannot open admin routes", async ({
  page,
}) => {
  await login(page);
  await expect(
    page.locator("aside").getByRole("link", { name: /Admin/ }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Admin tools", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Account menu" }).click();
  await page
    .getByRole("link", { name: "Email monitoring", exact: true })
    .click();
  await expect(page).toHaveURL(/admin\/monitoring/);
  await expect(page.getByRole("button", { name: "New mail" })).toBeVisible();
  await logout(page);
  await login(page, "sophia@studio.co");
  await expect(
    page.getByRole("link", { name: "Admin tools", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Account menu" }).click();
  await expect(
    page.getByRole("link", { name: "Email monitoring", exact: true }),
  ).toHaveCount(0);
  for (const route of ["/admin", "/admin/users", "/admin/monitoring"]) {
    await page.goto(route);
    await expect(page).toHaveURL(/mail\/Inbox/);
    await expect(
      page.getByRole("heading", { name: "Inbox", exact: true }),
    ).toBeVisible();
  }
  await expect(
    page.getByRole("button", { name: /Website redesign/ }),
  ).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByRole("link", { name: "Admin tools", exact: true }),
  ).toHaveCount(0);
});
test("member sends, admin monitors every mailbox and reads without marking mail read", async ({
  page,
}) => {
  await login(page, "sophia@studio.co");
  const dialog = await compose(
    page,
    "alex.morgan@studio.co",
    "Monitoring integration",
    "Private team update from Sophia.",
  );
  await dialog.getByRole("button", { name: "Cc / Bcc" }).click();
  await dialog.getByLabel("Bcc recipients").fill("james@studio.co");
  await dialog.locator("input[type=file]").setInputFiles({
    name: "monitor.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("Attachment review"),
  });
  await dialog.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.goto("/mail/Sent");
  await expect(
    page.getByRole("button", { name: /Me.*Monitoring integration/ }),
  ).toBeVisible();
  await logout(page);
  await login(page);
  await expect(
    page.getByRole("button", { name: /Sophia Chen.*Monitoring integration/ }),
  ).toBeVisible();
  await page.goto("/admin/monitoring");
  await page.getByLabel("Search monitored mail").fill("Monitoring integration");
  await expect(
    page.getByRole("button", { name: /^Read Monitoring integration/ }),
  ).toHaveCount(3);
  await page
    .getByRole("button", {
      name: "Read Monitoring integration in alex.morgan@studio.co",
      exact: true,
    })
    .click();
  await expect(page.getByTestId("monitored-body")).toHaveText(
    "Private team update from Sophia.",
  );
  await expect(
    page.getByRole("dialog").getByText("Bcc (sender copy)", { exact: true }),
  ).toHaveCount(0);
  const download = page.waitForEvent("download");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "monitor.txt" })
    .click();
  expect((await download).suggestedFilename()).toBe("monitor.txt");
  await page.getByRole("button", { name: "Close review" }).click();
  const unread = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("zoho-demo-v2:accounts"))[
        "alex-morgan"
      ].mail.messages.find(
        (message) => message.subject === "Monitoring integration",
      ).unread,
  );
  expect(unread).toBe(true);
  await page.getByLabel("Monitoring mailbox").selectOption("sophia");
  await page
    .getByRole("button", {
      name: "Read Monitoring integration in sophia@studio.co",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("dialog").getByText("Bcc (sender copy)", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close review" }).click();
  await page.goto("/admin/audit");
  await page.getByLabel("Audit action").selectOption("monitor");
  await expect(
    page.getByRole("row").filter({ hasText: "Viewed message" }),
  ).toHaveCount(2);
  await page.goto("/mail/Inbox");
  const reply = await compose(
    page,
    "sophia@studio.co",
    "Admin can send too",
    "Reply from the administrator.",
  );
  await reply.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await logout(page);
  await login(page, "sophia@studio.co");
  await expect(
    page.getByRole("button", { name: /Alex Morgan.*Admin can send too/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Website redesign/ }),
  ).toHaveCount(0);
});
test("drafts are isolated per account and visible in read-only monitoring", async ({
  page,
}) => {
  await login(page, "sophia@studio.co");
  const dialog = await compose(
    page,
    "client@example.com",
    "Member draft",
    "Unsent draft text.",
  );
  await expect(dialog.getByText(/Draft saved at/)).toBeVisible();
  await page.reload();
  await logout(page);
  await login(page);
  await page.goto("/mail/Drafts");
  await expect(page.getByRole("button", { name: /Member draft/ })).toHaveCount(
    0,
  );
  await page.goto("/admin/monitoring");
  await page.getByLabel("Monitoring folder").selectOption("Drafts");
  await page.getByLabel("Monitoring mailbox").selectOption("sophia");
  await page
    .getByRole("button", {
      name: "Read Member draft in sophia@studio.co",
      exact: true,
    })
    .click();
  await expect(page.getByTestId("monitored-body")).toHaveText(
    "Unsent draft text.",
  );
  await page.getByRole("button", { name: "Close review" }).click();
  await page.getByLabel("From date").fill("2030-01-02");
  await page.getByLabel("Through date").fill("2030-01-01");
  await expect(page.getByRole("alert")).toContainText("on or before");
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
});
test("directory role changes and account suspension control access", async ({
  page,
}) => {
  await login(page);
  await page.goto("/admin/users");
  await page
    .getByRole("button", { name: "Edit Sophia Chen", exact: true })
    .click();
  await page.getByLabel("Role", { exact: true }).selectOption("Administrator");
  await page.getByRole("button", { name: "Save user", exact: true }).click();
  await logout(page);
  await login(page, "sophia@studio.co");
  await expect(
    page.getByRole("link", { name: "Admin tools", exact: true }),
  ).toBeVisible();
  await page.goto("/admin/monitoring");
  await page
    .getByRole("button", { name: /^Read / })
    .first()
    .click();
  await page.getByRole("button", { name: "Close review" }).click();
  await page.goto("/admin/audit");
  await expect(
    page.getByRole("row").filter({ hasText: "Viewed message" }),
  ).toContainText("sophia@studio.co");
  await logout(page);
  await login(page);
  await page.goto("/admin/users");
  await page
    .getByRole("button", { name: "Edit Sophia Chen", exact: true })
    .click();
  await page.getByLabel("Status", { exact: true }).selectOption("Suspended");
  await page.getByRole("button", { name: "Save user", exact: true }).click();
  await logout(page);
  await page
    .getByLabel("Email address", { exact: true })
    .fill("sophia@studio.co");
  await page.getByLabel("Password", { exact: true }).fill("Demo@1234");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("inactive");
  await expect(page).toHaveURL(/login/);
});
