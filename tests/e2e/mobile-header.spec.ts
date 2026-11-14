import { expect, test, type Page } from "@playwright/test";
import { dict, login } from "./helpers";

test.use({ viewport: { width: 375, height: 800 } });

async function mobileLogin(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel(dict.auth.email).fill(email);
  await page.getByLabel(dict.auth.password, { exact: true }).fill("Passw0rd!");
  await page.getByRole("button", { name: dict.nav.login }).last().click();
  await expect(page.getByRole("banner").getByRole("paragraph").filter({ hasText: "Owner Test" })).toBeVisible();
}

const menuButton = (page: Page) => page.getByRole("button", { name: dict.nav.menu });
const noHorizontalScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

test.describe("mobile header", () => {
  test("signed out: the login link is in the bar, not in the menu", async ({ page }) => {
    await page.goto("/");
    const header = page.getByRole("banner");
    await expect(header.getByRole("link", { name: dict.nav.login })).toBeVisible();
    expect(await noHorizontalScroll(page)).toBe(true);

    await menuButton(page).click();
    await expect(header.getByRole("link", { name: dict.nav.login })).toHaveCount(1);
  });

  test("signed in: the name is shown in the bar and fits", async ({ page }) => {
    await mobileLogin(page, "owner@test.dev");
    const header = page.getByRole("banner");
    await expect(header.getByRole("button", { name: dict.account.menuLabel })).toHaveCount(0);
    await expect(menuButton(page)).toBeVisible();
    expect(await noHorizontalScroll(page)).toBe(true);
  });

  test("tapping outside closes the menu", async ({ page }) => {
    await page.goto("/");
    await menuButton(page).click();
    await expect(page.locator("#mobile-menu")).toBeVisible();
    await page.mouse.click(300, 780);
    await expect(page.locator("#mobile-menu")).toHaveCount(0);
  });

  test("Escape closes the menu", async ({ page }) => {
    await page.goto("/");
    await menuButton(page).click();
    await expect(page.locator("#mobile-menu")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator("#mobile-menu")).toHaveCount(0);
  });

  test("tapping an account link closes the menu and navigates", async ({ page }) => {
    await mobileLogin(page, "owner@test.dev");
    await menuButton(page).click();
    await page.locator("#mobile-menu").getByRole("menuitem", { name: dict.nav.orders }).click();
    await expect(page).toHaveURL(/\/account\/orders/);
    await expect(page.locator("#mobile-menu")).toHaveCount(0);
  });
});

test.describe("owned course page", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("the Buy button is never in the server HTML nor visible after load", async ({ page, request }) => {
    const html = await (await request.get("/courses/macaron")).text();
    // The dictionary also travels in the page payload, so look for the rendered button, not the text.
    expect(html).not.toContain(`>${dict.checkout.buyNow}</button>`);

    await login(page, "owner@test.dev");
    await page.goto("/courses/macaron");
    await expect(page.getByRole("heading", { level: 1, name: "Macaron" })).toBeVisible();
    await expect(page.getByText(dict.course.notOwned)).toHaveCount(0);
    await expect(page.getByRole("button", { name: dict.checkout.buyNow })).toHaveCount(0);
  });
});
