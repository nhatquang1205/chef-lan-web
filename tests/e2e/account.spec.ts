import { expect, test } from "@playwright/test";
import { dict, login } from "./helpers";

const historyKey = "cheflan.history.v1.Customer-1";
const entry = {
  videoId: "aaaaaaaaaaaaaaa1", courseSlug: "macaron", courseTitle: "Macaron", lessonSlug: "step-one", lessonTitle: "Step one",
  title: "Meringue", positionSeconds: 60, durationSeconds: 600, updatedAt: 1,
};

test.describe("my courses and history", () => {
  test("owner sees the course; no history means no continue button", async ({ page }) => {
    await login(page, "owner@test.dev");
    await page.goto("/account/courses");
    await expect(page.getByRole("link", { name: "Macaron" })).toBeVisible();
    await expect(page.getByRole("link", { name: dict.account.continue })).toHaveCount(0);
  });

  test("with history, the card shows progress and Continue jumps to that video", async ({ page }) => {
    await login(page, "owner@test.dev");
    await page.evaluate(([key, value]) => localStorage.setItem(key, JSON.stringify([value])), [historyKey, entry] as const);
    await page.goto("/account/courses");
    await expect(page.getByText("1:00 / 10:00")).toBeVisible();
    await page.getByRole("link", { name: dict.account.continue }).click();
    await expect(page).toHaveURL(/lessons\/step-one\?v=aaaaaaaaaaaaaaa1/);
  });

  test("history shows watched / total time and entries can be removed", async ({ page }) => {
    await login(page, "owner@test.dev");
    await page.evaluate(([key, value]) => localStorage.setItem(key, JSON.stringify([value])), [historyKey, entry] as const);
    await page.goto("/account/history");
    await expect(page.getByText("1:00 / 10:00")).toBeVisible();
    await expect(page.getByText("%")).toHaveCount(0);
    await page.getByRole("button", { name: dict.account.removeEntry }).click();
    await expect(page.getByText(dict.account.historyEmpty)).toBeVisible();
  });

  test("an admin login gets a clear message instead of an empty list", async ({ page }) => {
    await login(page, "admin@test.dev");
    await page.goto("/account/courses");
    await expect(page.getByText(dict.account.staffNoLibrary)).toBeVisible();
    await expect(page.getByText(dict.account.myCoursesEmpty)).toHaveCount(0);
  });
});
