import { test, expect } from "@playwright/test";

async function login(page, member = false) {
  await page.goto("/login");
  await page
    .getByRole("button", {
      name: member ? "Fill member credentials" : "Fill demo credentials",
    })
    .click();
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/mail\/Inbox/);
  await page.goto("/admin/stores");
}
async function createStore(page, name = "Delhi Central", code = "DEL-01") {
  await page.getByRole("button", { name: "Add store", exact: true }).click();
  await page.getByLabel("Store name", { exact: true }).fill(name);
  await page.getByLabel("Store code", { exact: true }).fill(code);
  await page
    .getByLabel("Location (optional)", { exact: true })
    .fill("New Delhi");
  await page.getByRole("button", { name: "Save store", exact: true }).click();
}
test("stores replace quarantine; employee CRUD persists and removals are audited", async ({
  page,
}) => {
  await login(page);
  await expect(
    page
      .getByRole("navigation", { name: "Administration", exact: true })
      .getByRole("link", { name: "Quarantine", exact: true }),
  ).toHaveCount(0);
  await page.goto("/admin/quarantine");
  await expect(page).toHaveURL(/admin\/stores/);
  await createStore(page);
  await page
    .getByRole("button", { name: "Manage employees for Delhi Central" })
    .click();
  await page.getByRole("button", { name: "Add employee", exact: true }).click();
  await page.getByLabel("Employee name (optional)").fill("Sophia Chen");
  await page
    .getByLabel("Employee email", { exact: true })
    .fill("SOPHIA@STUDIO.CO");
  await page
    .getByRole("button", { name: "Save employee", exact: true })
    .click();
  await expect(
    page.getByRole("row").filter({ hasText: "sophia@studio.co" }),
  ).toContainText("Active account");
  await page.reload();
  await expect(
    page.getByRole("cell", { name: "sophia@studio.co", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Edit employee sophia@studio.co",
      exact: true,
    })
    .click();
  await page
    .getByLabel("Employee name (optional)")
    .fill("Sophia - Store manager");
  await page
    .getByRole("button", { name: "Save employee", exact: true })
    .click();
  await expect(
    page.getByRole("cell", { name: "Sophia - Store manager", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "All stores", exact: true }).click();
  await page
    .getByRole("button", { name: "Delete store Delhi Central", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText(
    "employees before deleting",
  );
  await page
    .getByRole("button", { name: "Manage employees for Delhi Central" })
    .click();
  await page
    .getByRole("button", {
      name: "Remove employee sophia@studio.co",
      exact: true,
    })
    .click();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(
    page.getByRole("cell", { name: "sophia@studio.co", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Remove employee sophia@studio.co",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Confirm removal", exact: true })
    .click();
  await expect(
    page.getByRole("cell", { name: "sophia@studio.co", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "All stores", exact: true }).click();
  await page
    .getByRole("button", { name: "Delete store Delhi Central", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirm deletion", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Manage employees for Delhi Central" }),
  ).toHaveCount(0);
  await page.goto("/admin/audit");
  await expect(
    page.getByRole("cell", {
      name: "Created store: Delhi Central (DEL-01)",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("cell", {
      name: "Removed employee sophia@studio.co from store DEL-01",
      exact: true,
    }),
  ).toBeVisible();
  await page.goto("/admin/users");
  await expect(
    page.getByRole("cell", { name: "sophia@studio.co", exact: true }),
  ).toBeVisible();
});
test("duplicate stores and invalid batches are rejected without partial writes", async ({
  page,
}) => {
  await login(page);
  await createStore(page);
  await createStore(page, "Duplicate code", "del-01");
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "already in use",
  );
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page
    .getByRole("button", { name: "Manage employees for Delhi Central" })
    .click();
  await page
    .getByRole("button", { name: "Add emails in bulk", exact: true })
    .click();
  await page
    .getByLabel("Employee email addresses")
    .fill("first@example.com\ninvalid-email");
  await page.getByRole("button", { name: "Add emails", exact: true }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "valid employee email",
  );
  await page
    .getByLabel("Employee email addresses")
    .fill("first@example.com\nFIRST@example.com");
  await page.getByRole("button", { name: "Add emails", exact: true }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "Duplicate email",
  );
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(
    page.getByRole("cell", { name: "first@example.com", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Add emails in bulk", exact: true })
    .click();
  await page
    .getByLabel("Employee email addresses")
    .fill(
      Array.from(
        { length: 12 },
        (_, index) => `employee${String(index).padStart(2, "0")}@example.com`,
      ).join("\n"),
    );
  await page.getByRole("button", { name: "Add emails", exact: true }).click();
  await expect(page.getByText("Page 1 of 2", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(
    page.getByRole("cell", { name: "employee11@example.com", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Search store employees").fill("employee00");
  await expect(
    page.getByRole("cell", { name: "employee00@example.com", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Add employee", exact: true }).click();
  await page
    .getByLabel("Employee email", { exact: true })
    .fill("EMPLOYEE00@example.com");
  await page
    .getByRole("button", { name: "Save employee", exact: true })
    .click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "already belongs",
  );
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.getByRole("button", { name: "Edit store", exact: true }).click();
  await page
    .getByLabel("Store status", { exact: true })
    .selectOption("Inactive");
  await page.getByRole("button", { name: "Save store", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Add employee", exact: true }),
  ).toBeDisabled();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Add emails in bulk", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "All stores", exact: true }).click();
  await page.getByLabel("Search stores").fill("employee11@example.com");
  await expect(
    page.getByRole("button", { name: "Manage employees for Delhi Central" }),
  ).toBeVisible();
});
test("legacy admin data survives migration and stores work on mobile", async ({
  page,
}) => {
  await login(page);
  await page.goto("/admin/organization");
  await page.getByLabel("Organization name").fill("Preserved organization");
  await page
    .getByRole("button", { name: "Save configuration", exact: true })
    .click();
  await page.evaluate(() => {
    const value = JSON.parse(localStorage.getItem("zoho-demo-v2:admin"));
    delete value.stores;
    localStorage.setItem("zoho-demo-v2:admin", JSON.stringify(value));
  });
  await page.reload();
  await expect(page.getByLabel("Organization name")).toHaveValue(
    "Preserved organization",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/admin/stores");
  await createStore(page, "Mumbai West", "MUM-01");
  await page
    .getByRole("button", { name: "Manage employees for Mumbai West" })
    .click();
  await page.getByRole("button", { name: "Add employee", exact: true }).click();
  await page
    .getByLabel("Employee email", { exact: true })
    .fill("mumbai.employee@example.com");
  await page
    .getByRole("button", { name: "Save employee", exact: true })
    .click();
  await expect(
    page.getByRole("cell", {
      name: "mumbai.employee@example.com",
      exact: true,
    }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("members cannot access stores or mutate store data", async ({ page }) => {
  await login(page, true);
  await expect(page).toHaveURL(/mail\/Inbox/);
  const blocked = await page.evaluate(async () => {
    const { store } = await import("/src/redux/store.js");
    const { adminChanged } = await import("/src/redux/slice/adminSlice.js");
    store.dispatch(
      adminChanged({
        kind: "storeSave",
        record: {
          id: "unauthorized",
          name: "Unauthorized",
          code: "NO-01",
          location: "",
          status: "Active",
        },
      }),
    );
    return !store
      .getState()
      .admin.stores.some((item) => item.id === "unauthorized");
  });
  expect(blocked).toBe(true);
});
