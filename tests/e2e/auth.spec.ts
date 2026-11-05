import { expect, test } from "@playwright/test";
import { dict, login } from "./helpers";

test.describe("login and the account menu", () => {
  test("wrong password shows an error and stays on login", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(dict.auth.email).fill("owner@test.dev");
    await page.getByLabel(dict.auth.password, { exact: true }).fill("wrong");
    await page.getByRole("button", { name: dict.nav.login }).last().click();
    await expect(page.getByRole("alert").filter({ hasText: /\S/ })).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("login shows the name; hover opens My courses, History, Log out", async ({ page }) => {
    await login(page, "owner@test.dev");
    const menuButton = page.getByRole("button", { name: dict.account.menuLabel }).first();
    await expect(menuButton).toContainText("Owner Test");
    await expect(page.getByRole("link", { name: dict.nav.login })).toHaveCount(0);

    await menuButton.hover();
    const menu = page.getByRole("menu", { name: dict.account.menuLabel });
    await expect(menu.getByRole("menuitem", { name: dict.nav.myCourses })).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: dict.nav.history })).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: dict.nav.logout })).toBeVisible();
  });

  test("Escape closes the menu; Log out signs out", async ({ page }) => {
    await login(page, "owner@test.dev");
    await page.getByRole("button", { name: dict.account.menuLabel }).first().click();
    await expect(page.getByRole("menu", { name: dict.account.menuLabel })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("menu", { name: dict.account.menuLabel })).toHaveCount(0);

    await page.getByRole("button", { name: dict.account.menuLabel }).first().click();
    await page.getByRole("menuitem", { name: dict.nav.logout }).click();
    await expect(page.getByRole("link", { name: dict.nav.login }).first()).toBeVisible();
  });

  test("anonymous visitors to My courses are sent to login and back", async ({ page }) => {
    await page.goto("/account/courses");
    await expect(page).toHaveURL(/\/login\?next=%2Faccount%2Fcourses/);
  });
});
