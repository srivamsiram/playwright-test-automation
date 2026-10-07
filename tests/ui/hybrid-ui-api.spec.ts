import { test, expect } from '../../fixtures/test-fixtures';
import { buildBooking } from '../../utils/test-data';

/**
 * Hybrid UI + API examples: API calls set up / verify state around the UI.
 */
test.describe('Hybrid UI + API', () => {
  test('every product image rendered in the UI is served successfully (UI → API verify)', async ({
    loggedInInventoryPage,
    request,
  }) => {
    // 1. UI: collect what the browser actually rendered.
    const imageUrls = await loggedInInventoryPage.getImageSources();
    expect(imageUrls.length).toBeGreaterThan(0);

    // 2. API: verify each asset independently of the browser cache.
    for (const url of imageUrls) {
      const response = await request.get(url);
      expect.soft(response.status(), `image ${url}`).toBe(200);
      expect.soft(response.headers()['content-type'], `image ${url}`).toMatch(/^image\//);
    }
  });

  test('API-seeded state is set up, survives a UI session, and is torn down via API', async ({
    loggedInInventoryPage,
    bookingApi,
  }) => {
    // 1. API: create backend state and register cleanup. In a real system this
    //    would be the data your UI renders (orders, users, products...).
    const created = await bookingApi.create(buildBooking({ additionalneeds: 'UI hybrid test' }));
    test.info().annotations.push({ type: 'bookingId', description: String(created.bookingid) });

    try {
      // 2. UI: exercise the front end.
      await expect(loggedInInventoryPage.items).toHaveCount(6);
      const names = await loggedInInventoryPage.getItemNames();
      expect(names).toContain('Sauce Labs Backpack');

      // 3. API: verify the backend state is still intact after the UI flow.
      const fetched = await bookingApi.get(created.bookingid);
      await expect(fetched).toBeOK();
      expect((await fetched.json()).additionalneeds).toBe('UI hybrid test');
    } finally {
      // 4. API teardown — always runs, even if UI assertions fail.
      await bookingApi.delete(created.bookingid);
    }
  });
});
