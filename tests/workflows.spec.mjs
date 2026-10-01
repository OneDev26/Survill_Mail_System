import { test, expect } from "@playwright/test";

async function login(page) {
  await page.goto("/mail/Inbox");
  await expect(page).toHaveURL(/login/);
  await page.getByRole("button", { name: "Fill demo credentials" }).click();
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Inbox", exact: true }),
  ).toBeVisible();
}

test("protected routes, invalid login, remembered session, and logout", async ({
  page,
}) => {
  await page.goto("/profile");
  await expect(page).toHaveURL(/login/);
  await page
    .getByLabel("Email address", { exact: true })
    .fill("wrong@example.com");
  await page.getByLabel("Password", { exact: true }).fill("incorrect");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("incorrect");
  await page.getByRole("button", { name: "Fill demo credentials" }).click();
  await page.getByRole("button", { name: "Show password" }).click();
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute(
    "type",
    "text",
  );
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/mail\/Inbox/);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Inbox", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Account menu" }).click();
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/login/);
  await page.goto("/profile");
  await expect(page).toHaveURL(/login/);
});

test("search, archive undo, labels, spam, and trash restoration", async ({
  page,
}) => {
  await login(page);
  await page
    .getByLabel("Search mail", { exact: true })
    .fill("Website redesign");
  await page.getByRole("button", { name: /Sophia Chen/ }).click();
  await expect(
    page.getByRole("heading", { name: /Website redesign/ }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Archive message", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "No messages here" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await page.getByRole("button", { name: /Sophia Chen/ }).click();
  await page
    .getByLabel("Message label", { exact: true })
    .selectOption("Personal");
  await expect(page.getByLabel("Message label", { exact: true })).toHaveValue(
    "Personal",
  );
  await page.getByRole("button", { name: "Spam", exact: true }).click();
  await page
    .getByRole("navigation", { name: "Mail folders" })
    .getByRole("link", { name: /^Spam/ })
    .click();
  await page.getByRole("button", { name: /Sophia Chen/ }).click();
  await page.getByRole("button", { name: "Not spam", exact: true }).click();
  await page.goto("/mail/Inbox?q=Website");
  await page.getByRole("button", { name: /Sophia Chen/ }).click();
  await page
    .getByRole("button", { name: "Move message to trash", exact: true })
    .click();
  await page.goto("/mail/Trash");
  await page.getByRole("button", { name: /Sophia Chen/ }).click();
  await page
    .getByRole("button", { name: "Move message to inbox", exact: true })
    .click();
  await page.reload();
  await page.goto("/mail/Inbox?q=Website");
  await expect(page.getByRole("button", { name: /Sophia Chen/ })).toBeVisible();
});

test("compose, autosave, Cc/Bcc, attachments, send and reply all", async ({
  page,
}) => {
  await login(page);
  await page.getByRole("button", { name: "New mail" }).click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Recipients", { exact: true })
    .fill("sophia@studio.co");
  await dialog.getByRole("button", { name: "Cc / Bcc" }).click();
  await dialog
    .getByLabel("Cc recipients", { exact: true })
    .fill("james@studio.co");
  await dialog.getByLabel("Bcc recipients").fill("private@example.com");
  await dialog
    .getByLabel("Subject", { exact: true })
    .fill("Browser test message");
  await dialog.getByLabel("Message body").fill("A complete demo message.");
  await dialog.locator("input[type=file]").setInputFiles({
    name: "brief.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("Demo attachment contents"),
  });
  await expect(dialog.getByText(/Draft saved at/)).toBeVisible();
  await page.reload();
  await page.goto("/mail/Drafts");
  await page.getByRole("button", { name: /Me.*Browser test message/ }).click();
  await expect(page.getByLabel("Cc recipients", { exact: true })).toHaveValue(
    "james@studio.co",
  );
  await expect(page.getByText("brief.txt", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await page.goto("/mail/Sent");
  await page.getByRole("button", { name: /Me.*Browser test message/ }).click();
  await expect(page.getByText("Bcc: private@example.com")).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: /brief.txt/ }).click();
  expect((await download).suggestedFilename()).toBe("brief.txt");
  await page.getByRole("button", { name: "Reply all", exact: true }).click();
  await expect(page.getByLabel("Recipients", { exact: true })).toHaveValue(
    /sophia@studio\.co,\s*james@studio\.co/,
  );
  await page
    .getByRole("button", { name: "Discard draft", exact: true })
    .click();
  await page
    .getByRole("dialog", { name: "Discard this draft?" })
    .getByRole("button", { name: "Discard draft", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("profile changes and preferences persist across navigation and reload", async ({
  page,
}) => {
  await login(page);
  await page.goto("/profile");
  await page.getByLabel("Full name").fill("Alex Parker");
  await page.getByLabel("Job title").fill("Design Lead");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await page.reload();
  await expect(page.getByLabel("Full name")).toHaveValue("Alex Parker");
  await page.goto("/settings");
  await page.getByLabel("Compact message list").check();
  await page.getByLabel("Messages per page").selectOption("20");
  await page.getByLabel("Email signature").fill("Regards, Alex Parker");
  await page.getByRole("button", { name: "Save preferences" }).click();
  await page.reload();
  await expect(page.getByLabel("Compact message list")).toBeChecked();
  await page.getByRole("button", { name: "New mail" }).click();
  await expect(page.getByLabel("Message body")).toContainText(
    "Regards, Alex Parker",
  );
});

test("custom folders, duplicate validation, moving and folder deletion", async ({
  page,
}) => {
  await login(page);
  await page.goto("/settings");
  await page.getByLabel("New folder or label name").fill("Clients");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await page.getByLabel("New folder or label name").fill("clients");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("already in use");
  await page.goto("/mail/Inbox");
  await page
    .getByLabel("Select Website redesign — ready for your review", {
      exact: true,
    })
    .check();
  await page.getByLabel("Move messages to folder").selectOption("Clients");
  await page.goto("/mail/Clients");
  await expect(page.getByRole("button", { name: /Sophia Chen/ })).toBeVisible();
  await page.goto("/settings");
  await page.getByRole("button", { name: "Delete folder Clients" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete", exact: true })
    .click();
  await page.goto("/mail/Inbox?q=Website");
  await expect(page.getByRole("button", { name: /Sophia Chen/ })).toBeVisible();
});

test("contact creation, edit, duplicate rejection and compose", async ({
  page,
}) => {
  await login(page);
  await page.goto("/contacts");
  await page.getByRole("button", { name: "New contact" }).click();
  await page.getByLabel("Full name").fill("Taylor Demo");
  await page
    .getByLabel("Email address", { exact: false })
    .fill("taylor@example.com");
  await page.getByRole("button", { name: "Save contact" }).click();
  await page.reload();
  await page.getByRole("button", { name: "Edit Taylor Demo" }).click();
  await page.getByLabel("Company", { exact: true }).fill("Demo Company");
  await page.getByRole("button", { name: "Save contact" }).click();
  await expect(page.getByText("Demo Company", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "New contact" }).click();
  await page.getByLabel("Full name").fill("Duplicate");
  await page
    .getByLabel("Email address", { exact: false })
    .fill("taylor@example.com");
  await page.getByRole("button", { name: "Save contact" }).click();
  await expect(page.getByRole("alert")).toContainText("already exists");
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page
    .locator("article")
    .filter({ hasText: "Taylor Demo" })
    .getByRole("button", { name: "Send message" })
    .click();
  await expect(page.getByLabel("Recipients", { exact: true })).toHaveValue(
    "taylor@example.com",
  );
});

test("tasks, notes and calendar CRUD persist", async ({ page }) => {
  await login(page);
  await page.goto("/tasks");
  await page.getByRole("button", { name: "New task" }).click();
  await page
    .getByRole("dialog")
    .getByRole("textbox", { name: "Task *", exact: true })
    .fill("Review API contract");
  await page.getByRole("button", { name: "Save task" }).click();
  await page.getByLabel("Complete Review API contract").check();
  await page.reload();
  await expect(page.getByLabel("Complete Review API contract")).toBeChecked();
  await page.goto("/notes");
  await page.getByRole("button", { name: "New note" }).click();
  await page.getByLabel("Title", { exact: false }).fill("Integration notes");
  await page
    .getByLabel("Note", { exact: true })
    .fill("Use async thunks later.");
  await page.getByRole("button", { name: "Save note" }).click();
  await page.reload();
  await expect(page.getByText("Use async thunks later.")).toBeVisible();
  await page.goto("/calendar");
  await page.getByRole("button", { name: "New event" }).click();
  await page.getByLabel("Event title").fill("API review");
  await page.getByLabel("Starts at").fill("10:00");
  await page.getByLabel("Ends at").fill("09:00");
  await page.getByRole("button", { name: "Save event" }).click();
  await expect(page.getByRole("alert")).toContainText("end time");
  await page.getByLabel("Ends at").fill("10:30");
  await page.getByRole("button", { name: "Save event" }).click();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "API review", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Delete API review", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "API review", exact: true }),
  ).toHaveCount(0);
});

test("bulk pagination and permanent deletion confirmation", async ({
  page,
}) => {
  await login(page);
  await page.getByRole("button", { name: "Next page" }).click();
  await expect(page.getByText("Page 2 of 2")).toBeVisible();
  await page.getByRole("button", { name: "Previous page" }).click();
  await page.getByLabel("Select all messages on this page").check();
  await page
    .getByRole("button", { name: "Archive selected", exact: true })
    .click();
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await page.goto("/mail/Trash");
  await page.getByRole("button", { name: "Empty trash", exact: true }).click();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(
    page.getByRole("button", { name: /GitHub.*Old deployment notification/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Empty trash", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete forever", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "No messages here" }),
  ).toBeVisible();
});

test("mobile sidebar, reading pane and compose fit the viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  await page.getByRole("button", { name: /Sophia Chen/ }).click();
  await expect(
    page.getByRole("heading", { name: /Website redesign/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Back to messages" }).click();
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("button", { name: "New mail" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  const box = await page.getByRole("dialog").boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(390);
  await page.getByRole("button", { name: "Close dialog" }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
});

test("screens render without runtime errors", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await login(page);
  await page.getByRole("button", { name: /Sophia Chen/ }).click();
  await page.screenshot({
    path: "test-results/inbox-desktop.png",
    fullPage: true,
  });
  for (const route of [
    "/profile",
    "/settings",
    "/contacts",
    "/tasks",
    "/notes",
    "/calendar",
  ]) {
    await page.goto(route);
    await expect(page.locator("h1")).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test("malformed stored data falls back to a usable demo", async ({ page }) => {
  await page.addInitScript(() => {
    for (const key of ["auth", "profile", "mail", "settings", "workspace"])
      localStorage.setItem("zoho-demo-v2:" + key, "{broken");
  });
  await login(page);
  await expect(page.getByRole("button", { name: /Sophia Chen/ })).toBeVisible();
});

test("storage failure shows a warning without preventing in-memory use", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Quota full", "QuotaExceededError");
    };
  });
  await login(page);
  await expect(page.getByRole("alert")).toContainText(
    "storage is full or unavailable",
  );
  await page.getByRole("button", { name: /Sophia Chen/ }).click();
  await expect(
    page.getByRole("heading", { name: /Website redesign/ }),
  ).toBeVisible();
});

test("session-only login uses session storage and oversized files are rejected", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Fill demo credentials" }).click();
  await page.getByLabel("Keep me signed in").uncheck();
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/mail\/Inbox/);
  expect(
    await page.evaluate(() => localStorage.getItem("zoho-demo-v2:auth")),
  ).toBeNull();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(sessionStorage.getItem("zoho-demo-v2:auth")).session.userId,
    ),
  ).toBe("alex-morgan");
  await page.getByRole("button", { name: "New mail" }).click();
  await page
    .getByRole("dialog")
    .locator("input[type=file]")
    .setInputFiles({
      name: "large.txt",
      mimeType: "text/plain",
      buffer: Buffer.alloc(1024 * 1024 + 1),
    });
  await expect(page.getByRole("alert")).toContainText("under 1 MB");
});
