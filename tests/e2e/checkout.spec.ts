import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { dict, login } from "./helpers";

const MOCK = "http://127.0.0.1:5099";

async function startOrder(page: Page): Promise<string> {
  await page.goto("/courses/macaron");
  await page.getByRole("button", { name: dict.checkout.buyNow }).click();
  await page.getByRole("button", { name: dict.checkout.optionTransferTitle }).click();
  await expect(page).toHaveURL(/\/checkout\/BBTEST\d+$/);

  return new URL(page.url()).pathname.split("/").pop()!;
}

// The mock stands in for the bank: "pay" is the transfer arriving, "expire" is the deadline passing.
const bank = (request: APIRequestContext, action: "pay" | "expire", code: string) => request.post(`${MOCK}/__mock/${action}/${code}`);

test.describe("checkout", () => {
  test("a signed-out visitor who clicks Buy now is sent to log in and brought back", async ({ page }) => {
    await page.goto("/courses/macaron");
    await page.getByRole("button", { name: dict.checkout.buyNow }).click();
    await expect(page).toHaveURL(/\/login\?next=%2Fcourses%2Fmacaron/);
  });

  test("the payment page shows what is being bought and sends the customer to SePay with the signed form", async ({ page }) => {
    await login(page, "buyer1@test.dev");
    const code = await startOrder(page);

    await expect(page.getByRole("heading", { name: dict.checkout.title })).toBeVisible();
    await expect(page.getByRole("definition").filter({ hasText: "1.000.000 ₫" }).first()).toBeVisible();
    await expect(page.getByText(dict.checkout.payHint)).toBeVisible();
    await expect(page.getByText(dict.checkout.waiting)).toBeVisible();
    await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute("content", /noindex/);
    // No bank details or QR of our own: the payment page is SePay's.
    await expect(page.getByRole("main").getByRole("img")).toHaveCount(0);

    await page.getByRole("button", { name: dict.checkout.payWithQr }).click();
    await expect(page.getByRole("heading", { name: "SePay gateway" })).toBeVisible();
    await expect(page.locator("#invoice")).toHaveText(code);
    await expect(page.locator("#amount")).toHaveText("1000000");
    await expect(page.locator("#merchant")).toHaveText("SP-TEST-1");
    await expect(page.locator("#signature")).toHaveText("mock-signature");
  });

  test("when the payment arrives the page confirms it and the course unlocks", async ({ page, request }) => {
    await login(page, "buyer2@test.dev");
    const code = await startOrder(page);

    await page.getByRole("button", { name: dict.checkout.payWithQr }).click();
    await bank(request, "pay", code);
    // SePay sends the customer back to the shop's page; it shows the result.
    await page.getByRole("link", { name: "Back to the shop" }).click();
    await expect(page.getByRole("heading", { name: dict.checkout.paidTitle })).toBeVisible({ timeout: 15_000 });

    await page.getByRole("link", { name: dict.checkout.startLearning }).click();
    await expect(page).toHaveURL(/\/courses\/macaron$/);
    await expect(page.getByRole("heading", { level: 1, name: "Macaron" })).toBeVisible();
    await expect(page.getByRole("button", { name: dict.checkout.buyNow })).toHaveCount(0);
    await expect(page.getByText(dict.course.notOwned)).toHaveCount(0);
  });

  test("a payment made while the customer is still on the page is picked up by polling", async ({ page, request }) => {
    await login(page, "buyer8@test.dev");
    const code = await startOrder(page);

    await bank(request, "pay", code);
    await expect(page.getByRole("heading", { name: dict.checkout.paidTitle })).toBeVisible({ timeout: 15_000 });
  });

  test("an order that lapses shows the expired message with its code", async ({ page, request }) => {
    await login(page, "buyer3@test.dev");
    const code = await startOrder(page);

    await bank(request, "expire", code);
    await expect(page.getByRole("heading", { name: dict.checkout.expiredTitle })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(code)).toBeVisible();
  });

  test("asking to buy twice returns the same order", async ({ page }) => {
    await login(page, "buyer4@test.dev");
    const first = await startOrder(page);

    await page.goto("/courses/macaron");
    await page.getByRole("button", { name: dict.checkout.buyNow }).click();
    await page.getByRole("button", { name: dict.checkout.optionTransferTitle }).click();
    await expect(page).toHaveURL(new RegExp(`/checkout/${first}$`));
  });

  test("cancelling the order returns to the course and the order shows as cancelled", async ({ page }) => {
    await login(page, "buyer5@test.dev");
    await startOrder(page);

    await page.getByRole("button", { name: dict.checkout.cancel }).click();
    await expect(page).toHaveURL(/\/courses\/macaron$/);

    await page.goto("/account/orders");
    await expect(page.getByText(dict.account.orderStatus.Cancelled)).toBeVisible();
  });

  test("a pending order is listed under My orders with a way back to pay", async ({ page }) => {
    await login(page, "buyer6@test.dev");
    const code = await startOrder(page);

    await page.goto("/account/orders");
    await expect(page.getByText(dict.account.orderStatus.Pending)).toBeVisible();
    await page.getByRole("link", { name: dict.account.payNow }).click();
    await expect(page).toHaveURL(new RegExp(`/checkout/${code}$`));
  });

  test("someone else's order looks like a missing one", async ({ page, browser }) => {
    await login(page, "buyer7@test.dev");
    const code = await startOrder(page);

    const other = await browser.newPage();
    await login(other, "visitor@test.dev");
    await other.goto(`/checkout/${code}`);
    await expect(other.getByRole("heading", { name: dict.common.notFoundTitle })).toBeVisible();
    await other.close();
  });

  test("contacting chef Lan creates an order that shows her details and no payment form", async ({ page, request }) => {
    await login(page, "buyer9@test.dev");
    await page.goto("/courses/macaron");
    await page.getByRole("button", { name: dict.checkout.buyNow }).click();
    await page.getByRole("button", { name: dict.checkout.optionContactTitle }).click();
    await expect(page).toHaveURL(/\/checkout\/BBTEST\d+$/);

    const code = new URL(page.url()).pathname.split("/").pop()!;
    await expect(page.getByRole("heading", { name: `Đơn hàng ${code}` })).toBeVisible();
    // A modal left open on the hidden course page would make this page inert.
    await page.getByRole("article").getByRole("link", { name: "0932 046 296" }).click({ trial: true });
    await expect(page.getByRole("button", { name: dict.checkout.payWithQr })).toHaveCount(0);
    await expect(page.getByRole("article").getByRole("link", { name: "0775 965 143" })).toHaveCount(0);
    await expect(page.getByRole("article").getByText("0775 965 143")).toHaveCount(0);

    await bank(request, "pay", code);
    await expect(page.getByRole("heading", { name: dict.checkout.paidTitle })).toBeVisible({ timeout: 15_000 });
  });

  test("an owner does not see Buy now", async ({ page }) => {
    await login(page, "owner@test.dev");
    await page.goto("/courses/macaron");
    await expect(page.getByRole("heading", { level: 1, name: "Macaron" })).toBeVisible();
    await expect(page.getByRole("button", { name: dict.checkout.buyNow })).toHaveCount(0);
  });

  test("the account menu links to My orders", async ({ page }) => {
    await login(page, "visitor@test.dev");
    await page.getByRole("button", { name: dict.account.menuLabel }).first().click();
    await expect(page.getByRole("menuitem", { name: dict.nav.orders })).toBeVisible();
  });

  test("a free course: Buy now then contacting chef Lan lands on a Paid order, and the lists call it owned at once", async ({ page }) => {
    await login(page, "buyer10@test.dev");
    await page.goto("/courses/free-class");
    await expect(page.getByText(dict.common.free).first()).toBeVisible();

    await page.getByRole("button", { name: dict.checkout.buyNow }).click();
    await page.getByRole("button", { name: dict.checkout.optionContactTitle }).click();
    await expect(page).toHaveURL(/\/checkout\/BBTEST\d+$/);
    await expect(page.getByRole("heading", { name: dict.checkout.paidTitle })).toBeVisible();
    await expect(page.getByRole("link", { name: dict.checkout.startLearning })).toBeVisible();

    // Client navigation keeps the pages alive; the catalog state was refreshed, not left to age.
    await page.goto("/");
    const card = page.getByRole("link", { name: /Free class/ }).first();
    await expect(card).toContainText(dict.card.owned);
    await expect(card).not.toContainText(dict.common.free);
  });
});
