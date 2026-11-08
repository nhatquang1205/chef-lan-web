import { expect, test } from "@playwright/test";
import { dict, login } from "./helpers";

const MOCK = "http://127.0.0.1:5099";

test.describe("personalised home page", () => {
  test("every page opens with the trial banner and its link to chef Lan's Facebook", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(dict.banner.text)).toBeVisible();
    const link = page.getByRole("link", { name: dict.banner.link });
    await expect(link).toHaveAttribute("href", "https://www.facebook.com/Chefphuonglandoan");
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", /noopener/);
  });

  test("anonymous sees every course at the list price, and no My courses item", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 3, name: "Macaron" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 3, name: "Sauce base" })).toBeVisible();
    await expect(page.locator("s")).toHaveCount(3); // the compare-at price of the hero and the two priced cards
    await expect(page.getByText(dict.card.owned)).toHaveCount(0);
    await expect(page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: dict.nav.myCourses })).toHaveCount(0);
  });

  test("a course card shows the totals with the included modules, not its own counts", async ({ page }) => {
    await page.goto("/");
    const card = page.getByRole("link", { name: /Macaron/ }).first();
    await expect(card).toContainText(`5 ${dict.card.lessons}`);
    await expect(card).toContainText(`1 ${dict.duration.hours} 20 ${dict.duration.minutes}`);
    await expect(card).not.toContainText(`2 ${dict.card.lessons}`);
  });

  test("an owner still sees the course she owns, labelled owned and without a price", async ({ page }) => {
    await login(page, "owner@test.dev");
    await page.goto("/");

    const owned = page.getByRole("link", { name: /Macaron/ }).filter({ hasText: dict.card.owned });
    await expect(owned.first()).toBeVisible();
    await expect(owned.first()).not.toContainText("1.000.000");
    await expect(owned.first().locator("s")).toHaveCount(0);
    await expect(page.locator("#category-pastry").getByText(dict.card.owned)).toHaveCount(1);

    const card = page.getByRole("link", { name: /Sauce base/ });
    await expect(card.getByText("800.000 ₫")).toBeVisible();
    await expect(card.locator("s")).toHaveText("1.000.000 ₫");
  });

  test("the course list labels the owned course and shows the reduced price too", async ({ page }) => {
    await login(page, "owner@test.dev");
    await page.goto("/courses");
    const card = page.getByRole("link", { name: /Macaron/ }).first();
    await expect(card).toContainText(dict.card.owned);
    await expect(card).not.toContainText("1.000.000");

    await page.goto("/courses?type=shared");
    await expect(page.getByRole("link", { name: /Sauce base/ }).getByText("800.000 ₫")).toBeVisible();
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
    // The fetch can land before the post-login redirect: be on the home page before reloading it.
    await page.goto("/");
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

  test("a free course reads Miễn phí on its card and on its page, never 0 ₫", async ({ page }) => {
    await page.goto("/");
    const card = page.getByRole("link", { name: /Free class/ }).first();
    await expect(card).toContainText(dict.common.free);
    await expect(card).not.toContainText("0 ₫");

    await page.goto("/courses/free-class");
    await expect(page.getByRole("heading", { level: 1, name: "Free class" })).toBeVisible();
    await expect(page.getByText(dict.common.free).first()).toBeVisible();
    await expect(page.getByText("0 ₫")).toHaveCount(0);
  });

  test("an admin sees every course and no My courses item", async ({ page }) => {
    await login(page, "admin@test.dev");
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 3, name: "Macaron" }).first()).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: dict.nav.myCourses })).toHaveCount(0);
  });
});
