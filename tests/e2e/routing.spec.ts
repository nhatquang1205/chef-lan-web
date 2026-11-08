import { expect, test } from "@playwright/test";
import { dict } from "./helpers";

// The bugs these guard against only showed up in production behind nginx (X-Forwarded-Proto: https).
const nginx = { Host: "course.example", "X-Forwarded-Proto": "https" };

test.describe("locale routing", () => {
  for (const path of ["/", "/courses", "/vi/courses", "/login", "/terms"]) {
    test(`${path} answers 200 without redirecting`, async ({ request }) => {
      const response = await request.get(path, { maxRedirects: 0 });
      expect(response.status()).toBe(200);
    });

    test(`${path} answers 200 behind nginx headers`, async ({ request }) => {
      const response = await request.get(path, { headers: nginx, maxRedirects: 0 });
      expect(response.status()).toBe(200);
    });
  }

  test("bare path is Vietnamese", async ({ page }) => {
    await page.goto("/courses");
    await expect(page.locator("html")).toHaveAttribute("lang", "vi");
  });

  // English is hidden for now: /en redirects (temporary) to the Vietnamese page; /vi never redirects.
  for (const [from, to] of [["/en", "/"], ["/en/courses", "/courses"], ["/en/courses/macaron", "/courses/macaron"]]) {
    test(`${from} redirects temporarily to ${to}`, async ({ request }) => {
      const response = await request.get(from, { maxRedirects: 0 });
      expect(response.status()).toBe(307);
      expect(new URL(response.headers().location, "http://x").pathname).toBe(to);
    });

    test(`${from} redirects behind nginx headers`, async ({ request }) => {
      const response = await request.get(from, { headers: nginx, maxRedirects: 0 });
      expect(response.status()).toBe(307);
    });
  }

  test("there is no language toggle", async ({ page }) => {
    await page.goto("/courses");
    await expect(page.getByRole("link", { name: /^en$/i })).toHaveCount(0);
    await expect(page.getByRole("navigation", { name: dict.nav.language })).toHaveCount(0);
  });
});
