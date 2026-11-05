import { expect, test } from "@playwright/test";

// The bugs these guard against only showed up in production behind nginx (X-Forwarded-Proto: https).
const nginx = { Host: "course.example", "X-Forwarded-Proto": "https" };

test.describe("locale routing", () => {
  for (const path of ["/", "/courses", "/en", "/en/courses", "/vi/courses", "/login", "/terms"]) {
    test(`${path} answers 200 without redirecting`, async ({ request }) => {
      const response = await request.get(path, { maxRedirects: 0 });
      expect(response.status()).toBe(200);
    });

    test(`${path} answers 200 behind nginx headers`, async ({ request }) => {
      const response = await request.get(path, { headers: nginx, maxRedirects: 0 });
      expect(response.status()).toBe(200);
    });
  }

  test("bare path is Vietnamese, /en is English", async ({ page }) => {
    await page.goto("/courses");
    await expect(page.locator("html")).toHaveAttribute("lang", "vi");
    await page.goto("/en/courses");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });

  test("language toggle switches and keeps the page", async ({ page }) => {
    await page.goto("/courses");
    await page.getByRole("link", { name: /^en$/i }).first().click();
    await expect(page).toHaveURL(/\/en\/courses$/);
    await page.getByRole("link", { name: /^vi$/i }).first().click();
    await expect(page).toHaveURL(/\/courses$/);
    await expect(page).not.toHaveURL(/\/vi\//);
  });
});
