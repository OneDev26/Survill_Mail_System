import { test, expect } from "@playwright/test";
async function login(page) {
  await page.goto("/admin/users");
  await expect(page).toHaveURL(/login/);
  await page.getByRole("button", { name: "Fill demo credentials" }).click();
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/mail\/Inbox/);
  await page.goto("/admin/users");
}
async function addUser(page, name = "Taylor Reed", email = "taylor@studio.co") {
  await page.getByRole("button", { name: "Add user", exact: true }).click();
  await page.getByLabel("Full name", { exact: true }).fill(name);
  await page.getByLabel("Email address", { exact: true }).fill(email);
  await page.getByLabel("Department", { exact: true }).fill("Support");
  await page.getByRole("button", { name: "Save user", exact: true }).click();
}
test("admin directory persists, protects owner, and records changes", async ({
  page,
}) => {
  await login(page);
  await addUser(page);
  await expect(
    page.getByRole("cell", { name: "Taylor Reed", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("cell", { name: "Taylor Reed", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Edit Taylor Reed", exact: true })
    .click();
  await page.getByLabel("Status", { exact: true }).selectOption("Suspended");
  await page.getByRole("button", { name: "Save user", exact: true }).click();
  await expect(
    page.getByRole("row").filter({ hasText: "Taylor Reed" }),
  ).toContainText("Suspended");
  await page.getByLabel("Select Alex Morgan", { exact: true }).check();
  await page.getByRole("button", { name: "Delete selected (1)" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "owner cannot be deleted",
  );
  await page.getByLabel("Select Alex Morgan", { exact: true }).uncheck();
  await page
    .getByRole("button", { name: "Delete Taylor Reed", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirm deletion", exact: true })
    .click();
  await expect(
    page.getByRole("cell", { name: "Taylor Reed", exact: true }),
  ).toHaveCount(0);
  await page.goto("/admin/audit");
  await expect(
    page.getByRole("cell", {
      name: "Created users: taylor@studio.co",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "Deleted 1 users record(s)", exact: true }),
  ).toBeVisible();
});
test("user profiles and access actions persist and are audited", async ({
  page,
}) => {
  await login(page);
  await expect(
    page.getByRole("columnheader", { name: "Last login", exact: true }),
  ).toBeVisible();

  await page
    .getByRole("button", { name: "View Sophia Chen profile", exact: true })
    .click();
  let dialog = page.getByRole("dialog");
  await expect(dialog.getByText("sophia@studio.co", { exact: true })).toBeVisible();
  await expect(dialog.getByText("Last login", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Close", exact: true }).click();

  await page
    .getByRole("button", { name: "Manage Sophia Chen access", exact: true })
    .click();
  dialog = page.getByRole("dialog");
  await dialog.getByLabel("Status for Sophia Chen").selectOption("Suspended");
  await dialog.getByRole("button", { name: "Save status" }).click();
  await expect(dialog.getByRole("button", { name: "Save status" })).toBeDisabled();

  await dialog.getByRole("button", { name: "Reset password" }).click();
  await expect(dialog.getByText("Temporary password:")).toContainText(
    "Demo@1234",
  );
  await dialog.getByRole("button", { name: "Force logout" }).click();
  await expect(
    dialog.getByText("Logout request recorded successfully."),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "Close", exact: true }).click();

  await expect(
    page.getByRole("row").filter({ hasText: "Sophia Chen" }),
  ).toContainText("Suspended");
  await page.reload();
  await expect(
    page.getByRole("row").filter({ hasText: "Sophia Chen" }),
  ).toContainText("Suspended");

  await page.goto("/admin/audit");
  await expect(
    page.getByRole("row").filter({ hasText: "Reset demo password" }),
  ).toHaveCount(1);
  await expect(
    page.getByRole("row").filter({ hasText: "Forced demo logout" }),
  ).toHaveCount(1);
});
test("validation rejects duplicates and unknown domains; dependencies protect users", async ({
  page,
}) => {
  await login(page);
  await addUser(page, "Duplicate", "sophia@studio.co");
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "already exists",
  );
  await page
    .getByLabel("Email address", { exact: true })
    .fill("new@unknown.example");
  await page.getByRole("button", { name: "Save user", exact: true }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "Domains first",
  );
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page
    .getByRole("button", { name: "Delete Sophia Chen", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("groups and aliases");
  await page.goto("/admin/domains");
  await page
    .getByRole("button", { name: "Delete studio.co", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("dependencies");
});
test("domains, groups, aliases, and rules can be configured", async ({
  page,
}) => {
  await login(page);
  await page.goto("/admin/domains");
  await page.getByRole("button", { name: "Add domain", exact: true }).click();
  await page.getByLabel("Domain name").fill("example.org");
  await page.getByRole("button", { name: "Save domain", exact: true }).click();
  await expect(
    page.getByRole("row").filter({ hasText: "example.org" }),
  ).toContainText("Pending verification");
  await expect(
    page.getByRole("region", { name: "Domain overview" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Manage DNS for example.org", exact: true })
    .click();
  const domainDialog = page.getByRole("dialog");
  await domainDialog
    .getByRole("button", { name: "Run verification", exact: true })
    .click();
  await expect(
    domainDialog.getByRole("button", {
      name: "Verification complete",
      exact: true,
    }),
  ).toBeDisabled();
  await domainDialog
    .getByRole("button", { name: "Set as primary", exact: true })
    .click();
  await expect(
    domainDialog.getByRole("button", { name: "Primary domain", exact: true }),
  ).toBeDisabled();
  await domainDialog
    .getByRole("button", { name: "Copy SPF value", exact: true })
    .click();
  await expect(
    domainDialog.getByRole("button", { name: "Copy SPF value", exact: true }),
  ).toContainText("Copied");
  await domainDialog
    .getByRole("button", { name: "Rotate DKIM key", exact: true })
    .click();
  await expect(domainDialog.getByRole("button", { name: "Key rotated" })).toBeVisible();
  await domainDialog.getByRole("button", { name: "Close", exact: true }).click();
  await expect(
    page.getByRole("row").filter({ hasText: "example.org" }),
  ).toContainText("Verified");
  await expect(
    page.getByRole("row").filter({ hasText: "example.org" }),
  ).toContainText("Primary domain");
  await page.reload();
  await expect(
    page.getByRole("row").filter({ hasText: "example.org" }),
  ).toContainText("Verified");
  await page.goto("/admin/groups");
  await expect(
    page.getByRole("region", { name: "Group overview" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "View Studio team group", exact: true })
    .click();
  let groupDialog = page.getByRole("dialog");
  await expect(groupDialog.getByText("Group members", { exact: true })).toBeVisible();
  await expect(groupDialog.getByText("Sophia Chen", { exact: true })).toBeVisible();
  await groupDialog.getByRole("button", { name: "Close", exact: true }).click();

  await page
    .getByRole("button", { name: "Manage Studio team group", exact: true })
    .click();
  groupDialog = page.getByRole("dialog");
  await groupDialog.getByLabel("Include Sophia Chen").uncheck();
  await groupDialog
    .getByLabel("Group sender permission")
    .selectOption("Members only");
  await groupDialog.getByLabel("Group delivery status").selectOption("Paused");
  await groupDialog
    .getByRole("button", { name: "Copy address", exact: true })
    .click();
  await expect(
    groupDialog.getByRole("button", { name: "Address copied", exact: true }),
  ).toBeVisible();
  await groupDialog
    .getByRole("button", { name: "Run delivery test", exact: true })
    .click();
  await expect(
    groupDialog.getByRole("button", { name: "Test recorded", exact: true }),
  ).toBeVisible();
  await groupDialog
    .getByRole("button", { name: "Save group settings", exact: true })
    .click();
  await expect(
    groupDialog.getByText("Group settings saved successfully.", {
      exact: true,
    }),
  ).toBeVisible();
  await groupDialog.getByRole("button", { name: "Close", exact: true }).click();

  let studioRow = page.getByRole("row").filter({ hasText: "Studio team" });
  await expect(studioRow).toContainText("Members only");
  await expect(studioRow).toContainText("Paused");
  await expect(studioRow.getByRole("cell").nth(4)).toHaveText("1");
  await page.reload();
  studioRow = page.getByRole("row").filter({ hasText: "Studio team" });
  await expect(studioRow).toContainText("Paused");
  await page.getByRole("button", { name: "Add group", exact: true }).click();
  await page.getByLabel("Group name").fill("Engineering");
  await page.getByLabel("Group email").fill("engineering@studio.co");
  await page
    .getByLabel("Member emails (comma-separated)")
    .fill("james@studio.co");
  await page.getByRole("button", { name: "Save group", exact: true }).click();
  await expect(
    page.getByRole("cell", { name: "engineering@studio.co", exact: true }),
  ).toBeVisible();
  await page.goto("/admin/aliases");
  await page.getByRole("button", { name: "Add alias", exact: true }).click();
  await page.getByLabel("Alias address").fill("support@studio.co");
  await page.getByLabel("Mailbox address").fill("james@studio.co");
  await page.getByRole("button", { name: "Save alias", exact: true }).click();
  await expect(
    page.getByRole("cell", { name: "support@studio.co", exact: true }),
  ).toBeVisible();
  await page.goto("/admin/routing");
  await page.getByRole("button", { name: "Add rule", exact: true }).click();
  await page.getByLabel("Rule name").fill("Hold suspicious sender");
  await page.getByLabel("Match value").fill("example.net");
  await page.getByRole("button", { name: "Save rule", exact: true }).click();
  await expect(
    page.getByRole("cell", { name: "Hold suspicious sender", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("cell", { name: "Hold suspicious sender", exact: true }),
  ).toBeVisible();
});
test("security policies persist and quarantine decisions are confirmed", async ({
  page,
}) => {
  await login(page);
  await page.goto("/admin/security");
  await page.getByLabel("Allow POP access").check();
  await page.getByLabel("Session duration (minutes)").fill("90");
  await page
    .getByRole("button", { name: "Save configuration", exact: true })
    .click();
  await page.reload();
  await expect(page.getByLabel("Allow POP access")).toBeChecked();
  await expect(page.getByLabel("Session duration (minutes)")).toHaveValue("90");
  await page.goto("/admin/quarantine");
  await page.getByRole("button", { name: "Release", exact: true }).click();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Release", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Release", exact: true }).click();
  await page
    .getByRole("button", { name: "Confirm action", exact: true })
    .click();
  await page.getByLabel("Quarantine status").selectOption("Released");
  await expect(
    page.getByText("Example suspicious message", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Release", exact: true }),
  ).toHaveCount(0);
});
test("CSV export, search, overview and mobile navigation work", async ({
  page,
}) => {
  await login(page);
  await page.getByLabel("Search users", { exact: true }).fill("Sophia");
  await expect(
    page.getByRole("cell", { name: "Alex Morgan", exact: true }),
  ).toHaveCount(0);
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV", exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("users.csv");
  await page.goto("/admin/overview");
  await expect(
    page.getByRole("heading", { name: "Workspace setup" }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/admin-overview.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("navigation", { name: "Administration", exact: true })
    .getByRole("link", { name: "Organization", exact: true })
    .click();
  await page.getByLabel("Organization name").fill("Acme Studio");
  await page
    .getByRole("button", { name: "Save configuration", exact: true })
    .click();
  await page.reload();
  await expect(page.getByLabel("Organization name")).toHaveValue("Acme Studio");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
});
