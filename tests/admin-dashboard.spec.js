const { test, expect } = require("@playwright/test");

const adminUser = process.env.WP_ADMIN_USER || "admin";
const adminPassword = process.env.WP_ADMIN_PASSWORD || "password";
const loginPath = process.env.WP_LOGIN_PATH || "/wp-login.php";

let adminPage;

async function loginToWpAdmin(page) {
  await page.goto(loginPath, { waitUntil: "domcontentloaded" });

  if (page.url().includes("wp-login.php")) {
    const usernameInput = page.locator("#user_login");
    const passwordInput = page.locator("#user_pass");

    await expect(usernameInput).toBeVisible();
    await expect(passwordInput).toBeVisible();

    await usernameInput.fill(adminUser);
    await passwordInput.fill(adminPassword);
    await page.getByRole("button", { name: "Log In" }).click();
  }

  await expect(page).not.toHaveURL(/wp-login\.php/);
}

test.describe("Kreebi Forms wp-admin e2e", () => {
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    adminPage = await context.newPage();
    await loginToWpAdmin(adminPage);
  });
  test.afterAll(async () => {
    await adminPage.context().close();
  });

  test("loads the Kreebi Forms dashboard page", async () => {
    await adminPage.goto("/wp-admin/admin.php?page=krefrm_forms", {
      waitUntil: "domcontentloaded",
    });

    await expect(adminPage).toHaveURL(/admin\.php\?page=krefrm_forms/);
    await expect(
      adminPage.locator("#toplevel_page_krefrm_forms"),
    ).toBeVisible();
    await expect(adminPage.locator("#kreebi-form-form")).toBeVisible();
  });

  test("navigates through all Kreebi Forms admin sections", async () => {
    await adminPage.goto("/wp-admin/admin.php?page=krefrm_forms", {
      waitUntil: "domcontentloaded",
    });

    await expect(adminPage).toHaveURL(/admin\.php\?page=krefrm_forms$/);
    await expect(adminPage.locator("#kreebi-form-form")).toBeVisible();

    const sections = [
      { hash: "#form", id: "kreebi-form-form" },
      { hash: "#submission", id: "kreebi-form-submission" },
      { hash: "#style-templates", id: "kreebi-form-style-templates" },
      { hash: "#integrations", id: "kreebi-form-integrations" },
      { hash: "#addons", id: "kreebi-form-addons" },
      { hash: "#upgrade-to-pro", id: "kreebi-form-upgrade-to-pro" },
    ];

    for (const section of sections) {
      await adminPage.goto(
        `/wp-admin/admin.php?page=krefrm_forms${section.hash}`,
        {
          waitUntil: "domcontentloaded",
        },
      );

      await expect(adminPage).toHaveURL(new RegExp(`${section.hash}$`));
      await expect(adminPage.locator(`#${section.id}`)).toBeVisible();
    }
  });
});
