const { test, expect } = require("@playwright/test");

const adminUser = process.env.WP_ADMIN_USER || "admin";
const adminPassword = process.env.WP_ADMIN_PASSWORD || "password";
const loginPath = process.env.WP_LOGIN_PATH || "/wp-login.php";

const pluginName = "Kreebi Forms";

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

async function goToPluginsPage(page) {
  await page.goto("/wp-admin/plugins.php", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/wp-admin\/plugins\.php/);
}

function pluginRow(page) {
  return page.locator("tr", { hasText: pluginName }).first();
}

async function ensurePluginActive(page) {
  await goToPluginsPage(page);
  const row = pluginRow(page);
  await expect(row).toBeVisible();

  const activate = row.getByRole("link", { name: "Activate" });
  if (await activate.count()) {
    await activate.first().click();
    await expect(row.getByRole("link", { name: /Deactivate/i })).toBeVisible();
  }
}

async function ensurePluginInactive(page) {
  await goToPluginsPage(page);
  const row = pluginRow(page);
  await expect(row).toBeVisible();

  const deactivate = row.getByRole("link", { name: /Deactivate/i });
  if (await deactivate.count()) {
    await deactivate.first().click();
    await expect(page.locator("#krefrm-deactivation-modal")).toBeVisible();

    await page.getByRole("button", { name: "Deactivate" }).click();
    await expect(row.getByRole("link", { name: "Activate" })).toBeVisible();
  }
}

test.describe.serial("Kreebi Forms deactivation/onboarding popup", () => {
  test("deactivation modal allows deactivate with optional feedback", async ({
    page,
  }) => {
    await loginToWpAdmin(page);
    await ensurePluginActive(page);
    await goToPluginsPage(page);

    const row = pluginRow(page);
    const deactivate = row.getByRole("link", { name: /Deactivate/i });

    await expect(deactivate).toBeVisible();
    await deactivate.first().click();

    const modal = page.locator("#krefrm-deactivation-modal");
    await expect(modal).toBeVisible();

    await page.getByRole("button", { name: "Skip and Deactivate" }).click();

    await expect(row.getByRole("link", { name: "Activate" })).toBeVisible();
  });

  test("reactivating plugin shows onboarding popup immediately on current page", async ({
    page,
  }) => {
    await loginToWpAdmin(page);
    await ensurePluginInactive(page);
    await goToPluginsPage(page);

    const row = pluginRow(page);
    const activate = row.getByRole("link", { name: "Activate" });
    await expect(activate).toBeVisible();
    await activate.first().click();

    await expect(row.getByRole("link", { name: /Deactivate/i })).toBeVisible();

    await expect(page.locator("#krefrm-global-welcome-modal")).toBeVisible();
    await expect(page.getByText("Welcome to Kreebi Forms")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Start Kreebi Forms" }),
    ).toBeVisible();
    await expect(page.getByText("Skip for now")).toBeVisible();

    await page
      .locator(
        '#krefrm-global-welcome-modal [data-krefrm-welcome-action="dismiss"]',
      )
      .click();
    await expect(page.locator("#krefrm-global-welcome-modal")).toHaveCount(0);
  });
});
