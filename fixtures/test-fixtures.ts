import { test as base, expect } from '@playwright/test';
import { CartPage, CheckoutPage, InventoryPage, LoginPage } from '../pages';
import { BookingApi } from '../utils/booking-api';
import { env } from '../utils/env';

type Fixtures = {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
  /** Inventory page with an already-authenticated session (UI login skipped). */
  loggedInInventoryPage: InventoryPage;
  bookingApi: BookingApi;
};

/**
 * Custom `test` that injects page objects and API clients as fixtures, so
 * specs never construct them by hand. Import `test`/`expect` from here.
 */
export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  inventoryPage: async ({ page }, use) => {
    await use(new InventoryPage(page));
  },

  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },

  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },

  /**
   * Seeds session state directly instead of driving the login form.
   * The demo app keeps its session in a `session-username` cookie, so we set
   * it on the context. This is the same "set state out-of-band, then test the
   * UI" pattern you'd use with a real auth API + storageState.
   */
  loggedInInventoryPage: async ({ page, context, baseURL }, use) => {
    await context.addCookies([
      { name: 'session-username', value: env.ui.username, url: baseURL ?? env.baseUrl },
    ]);
    const inventory = new InventoryPage(page);
    await inventory.goto();
    await use(inventory);
  },

  /**
   * Dedicated request context pointed at the API base URL, so the client
   * works from any project (including UI projects whose baseURL is the web app).
   */
  bookingApi: async ({ playwright }, use) => {
    const apiContext = await playwright.request.newContext({
      baseURL: env.apiBaseUrl,
      extraHTTPHeaders: { Accept: 'application/json' },
    });
    await use(new BookingApi(apiContext));
    await apiContext.dispose();
  },
});

export { expect };
