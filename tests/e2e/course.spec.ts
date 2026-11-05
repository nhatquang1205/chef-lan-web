import { expect, test } from "@playwright/test";
import { dict, login } from "./helpers";

test.describe("course page", () => {
  test("shows only lessons and duration, with no level tag", async ({ page }) => {
    await page.goto("/courses/macaron");
    await expect(page.getByRole("heading", { level: 1, name: "Macaron" })).toBeVisible();
    await expect(page.getByText(dict.course.lessons, { exact: true })).toBeVisible();
    await expect(page.getByText(dict.course.duration, { exact: true })).toBeVisible();
    await expect(page.getByText("Cơ bản")).toHaveCount(0);
  });

  test("anonymous: contact note and every lesson marked not owned", async ({ page }) => {
    await page.goto("/courses/macaron");
    await expect(page.getByText(dict.course.buyNote).first()).toBeVisible();
    await expect(page.getByText(dict.course.notOwned)).toHaveCount(2);
  });

  test("owner: no contact note and no not-owned marks", async ({ page }) => {
    await login(page, "owner@test.dev");
    await page.goto("/courses/macaron");
    await expect(page.getByRole("heading", { level: 1, name: "Macaron" })).toBeVisible();
    await expect(page.getByText(dict.course.buyNote)).toHaveCount(0);
    await expect(page.getByText(dict.course.notOwned)).toHaveCount(0);
  });

  test("visitor without the course still sees the note", async ({ page }) => {
    await login(page, "visitor@test.dev");
    await page.goto("/courses/macaron");
    await expect(page.getByText(dict.course.buyNote).first()).toBeVisible();
    await expect(page.getByText(dict.course.notOwned)).toHaveCount(2);
  });

  test("filter form uses the custom select and keeps the URL filters", async ({ page }) => {
    await page.goto("/courses");
    await page.getByRole("combobox", { name: dict.courses.sort }).click();
    await page.getByRole("option", { name: dict.courses.sortPriceAsc }).click();
    await page.getByRole("button", { name: dict.courses.apply }).click();
    await expect(page).toHaveURL(/sort=PriceAsc/);
    await expect(page.getByRole("combobox", { name: dict.courses.sort })).toContainText(dict.courses.sortPriceAsc);
  });
});
