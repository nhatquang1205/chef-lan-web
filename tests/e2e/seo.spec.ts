import { expect, test } from "@playwright/test";
import { dict } from "./helpers";

test.describe("seo", () => {
  test("sitemap lists the courses in Vietnamese only", async ({ request }) => {
    const xml = await (await request.get("/sitemap.xml")).text();
    expect(xml).toContain("/courses/macaron");
    expect(xml).not.toContain("/en/");
    for (const path of ["/terms", "/privacy", "/refund"]) expect(xml).not.toContain(path);
  });

  test("robots.txt points at the sitemap", async ({ request }) => {
    expect(await (await request.get("/robots.txt")).text()).toContain("/sitemap.xml");
  });

  test("course page has Open Graph tags", async ({ page }) => {
    await page.goto("/courses/macaron");
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", "Macaron");
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute("content", "Learn to make macarons.");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/courses\/macaron$/);
  });

  // Under Cache Components the status is 200 once streaming starts, so the page must at least tell crawlers not to index it.
  test("an unknown course shows not-found and is noindex", async ({ page }) => {
    await page.goto("/courses/does-not-exist");
    await expect(page.getByRole("heading", { name: dict.common.notFoundTitle })).toBeVisible();
    await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute("content", /noindex/);
  });

  for (const path of ["/terms", "/privacy", "/refund"]) {
    test(`${path} is gone`, async ({ request }) => {
      expect((await request.get(path, { maxRedirects: 0 })).status()).toBe(404);
    });
  }

  test("the footer has no legal links", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("navigation", { name: "Legal" })).toHaveCount(0);
  });
});
