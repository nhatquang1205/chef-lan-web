import { expect, test } from "@playwright/test";
import { dict, login, stubPlayerJs } from "./helpers";

const lesson = "/courses/macaron/lessons/step-one";

test.describe("watching: owner vs non-owner", () => {
  test.beforeEach(async ({ page }) => stubPlayerJs(page));

  test("anonymous is asked to sign in", async ({ page }) => {
    await page.goto(lesson);
    await expect(page.getByRole("heading", { name: dict.lesson.signInTitle })).toBeVisible();
  });

  test("owner plays the full video: no preview notice, recipe visible", async ({ page }) => {
    await login(page, "owner@test.dev");
    await page.goto(lesson);
    await expect(page.getByTitle("Meringue")).toBeVisible();
    await expect(page.getByText(/Đây là bản xem thử/)).toHaveCount(0);
    await expect(page.getByText("Whip the whites.")).toBeVisible();
    await expect(page.getByText(dict.course.notOwned)).toHaveCount(0);
  });

  test("non-owner gets the preview with a notice, and a locked recipe", async ({ page }) => {
    await login(page, "visitor@test.dev");
    await page.goto(lesson);
    await expect(page.getByText(/Đây là bản xem thử: 30 giây/)).toBeVisible();
    await expect(page.getByText(dict.lesson.recipeLocked)).toBeVisible();
    await expect(page.getByText(dict.course.notOwned)).toBeVisible();
  });

  test("non-owner sees a locked message for a paid video", async ({ page }) => {
    await login(page, "visitor@test.dev");
    await page.goto(`${lesson}?v=aaaaaaaaaaaaaaa2`);
    await expect(page.getByText(dict.lesson.lockedVideoTitle)).toBeVisible();
  });

  test("owner: when a video ends, up next counts down and goes to the next video", async ({ page }) => {
    await login(page, "owner@test.dev");
    await page.goto(lesson);
    await expect(page.getByTitle("Meringue")).toBeVisible();
    await page.waitForFunction(() => (window as unknown as { __player?: { handlers: Record<string, unknown[]> } }).__player?.handlers.ended?.length);
    await page.evaluate(() => (window as unknown as { __player: { emit(e: string): void } }).__player.emit("ended"));
    await expect(page.getByRole("status").filter({ hasText: "Piping" })).toBeVisible();
    await page.getByRole("button", { name: dict.lesson.playNow }).click();
    await expect(page).toHaveURL(/v=aaaaaaaaaaaaaaa2/);
  });

  test("owner: up next can be cancelled", async ({ page }) => {
    await login(page, "owner@test.dev");
    await page.goto(lesson);
    await page.waitForFunction(() => (window as unknown as { __player?: { handlers: Record<string, unknown[]> } }).__player?.handlers.ended?.length);
    await page.evaluate(() => (window as unknown as { __player: { emit(e: string): void } }).__player.emit("ended"));
    await page.getByRole("button", { name: dict.lesson.cancel }).click();
    await expect(page.getByRole("button", { name: dict.lesson.playNow })).toHaveCount(0);
    await expect(page).not.toHaveURL(/v=aaaaaaaaaaaaaaa2/);
  });

  test("lesson page links to the next lesson", async ({ page }) => {
    await login(page, "owner@test.dev");
    await page.goto(lesson);
    await page.getByRole("link", { name: new RegExp(dict.lesson.next) }).click();
    await expect(page).toHaveURL(/step-two/);
  });
});
