import { expect, type Page } from "@playwright/test";
import vi from "../../src/i18n/dictionaries/vi.json";

export const dict = vi;
export const PASSWORD = "Passw0rd!";

export async function login(page: Page, email: string) {
  await page.goto("/login");
  // While the page hydrates, the server-rendered and client-rendered form can briefly coexist.
  await expect(page.getByLabel(dict.auth.email)).toHaveCount(1);
  await page.getByLabel(dict.auth.email).fill(email);
  await page.getByLabel(dict.auth.password, { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: dict.nav.login }).last().click();
  await expect(page.getByRole("button", { name: dict.account.menuLabel }).first()).toBeVisible();
}

/**
 * Bunny's player.js is loaded from their CDN. Replace it with a stub that reports `ready` and lets a test
 * fire player events with `window.__player.emit("ended")`.
 */
export async function stubPlayerJs(page: Page) {
  await page.route("**/playerjs-latest.min.js", (route) =>
    route.fulfill({
      contentType: "text/javascript",
      body: `
        window.__player = { handlers: {}, emit(event, data) { (this.handlers[event] || []).forEach((cb) => cb(data)); } };
        window.playerjs = { Player: class {
          on(event, cb) { (window.__player.handlers[event] ||= []).push(cb); if (event === "ready") setTimeout(cb, 0); }
          pause() {} setCurrentTime() {} getCurrentTime(cb) { cb(0); }
        } };
      `,
    }),
  );
}
