import { expect, test } from "@playwright/test";
import { dict, login } from "./helpers";

const MOCK = "http://127.0.0.1:5099";

test.describe("personalised home page", () => {
  test("anonymous sees every course at the list price, and no My courses item", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 3, name: "Macaron" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 3, name: "Sauce base" })).toBeVisible();
    await expect(page.locator("s")).toHaveCount(2); // the compare-at price of the two cards
    await expect(page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: dict.nav.myCourses })).toHaveCount(0);
  });

  test("an owner no longer sees the course she owns, and sees the reduced price", async ({ page }) => {
    await login(page, "owner@test.dev");
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 3, name: "Sauce base" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 3, name: "Macaron" })).toHaveCount(0);
    // The category and the hero held only the owned course, so they are gone entirely.
    await expect(page.locator("#category-pastry")).toHaveCount(0);

    const card = page.getByRole("link", { name: /Sauce base/ });
    await expect(card.getByText("800.000 ₫")).toBeVisible();
    await expect(card.locator("s")).toHaveText("1.000.000 ₫");
  });

  test("a visitor who owns nothing sees the full list and the reduced price", async ({ page }) => {
    await login(page, "visitor@test.dev");
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 3, name: "Macaron" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Sauce base/ }).getByText("800.000 ₫")).toBeVisible();
  });

  // Customer 50 has its own account and counter, so tests running in parallel do not disturb it.
  test("the state is fetched once after login and reused from IndexedDB on reload", async ({ page, request }) => {
    const count = async () => (await (await request.get(`${MOCK}/__mock/catalog-state-requests?customer=50`)).json()).count as number;
    const before = await count();

    await login(page, "catalog@test.dev");
    await expect.poll(count).toBe(before + 1);
    await page.reload();
    await expect(page.getByRole("heading", { level: 3, name: "Macaron" }).first()).toBeVisible();
    await page.waitForTimeout(500);
    expect(await count()).toBe(before + 1);
  });

  test("the stored record is deleted on logout", async ({ page }) => {
    await login(page, "visitor@test.dev");
    const stored = () =>
      page.evaluate(
        () =>
          new Promise<number>((resolve) => {
            const open = indexedDB.open("cheflan");
            open.onsuccess = () => {
              const req = open.result.transaction("catalogState").objectStore("catalogState").count();
              req.onsuccess = () => resolve(req.result);
            };
          }),
      );
    await expect.poll(stored).toBe(1);
    await page.getByRole("button", { name: dict.account.menuLabel }).first().click();
    await page.getByRole("menuitem", { name: dict.nav.logout }).click();
    await expect.poll(stored).toBe(0);
  });

  test("My courses is in the navbar for customers only", async ({ page }) => {
    await login(page, "visitor@test.dev");
    const link = page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: dict.nav.myCourses });
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(/\/account\/courses$/);
    await expect(link).toHaveAttribute("aria-current", "page");
  });

  test("an admin sees every course and no My courses item", async ({ page }) => {
    await login(page, "admin@test.dev");
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 3, name: "Macaron" }).first()).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: dict.nav.myCourses })).toHaveCount(0);
  });
});
