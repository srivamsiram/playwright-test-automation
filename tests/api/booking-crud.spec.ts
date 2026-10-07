import { test, expect } from '../../fixtures/test-fixtures';
import { Booking, buildBooking } from '../../utils/test-data';

/**
 * Full CRUD lifecycle against the Booking API using Playwright's
 * APIRequestContext (wrapped by BookingApi). Each test owns its data and
 * cleans up after itself so the suite is safe to run fully in parallel.
 */
test.describe('Booking API - CRUD', () => {
  test('service health check responds', async ({ bookingApi }) => {
    const response = await bookingApi.healthCheck();
    expect(response.status()).toBe(201);
  });

  test.describe('with a booking created in setup', () => {
    let bookingId: number;
    let original: Booking;

    test.beforeEach(async ({ bookingApi }) => {
      original = buildBooking();
      const created = await bookingApi.create(original);
      bookingId = created.bookingid;
    });

    test.afterEach(async ({ bookingApi }) => {
      // Best-effort cleanup; the delete test already removed its booking.
      if (bookingId) await bookingApi.delete(bookingId);
    });

    test('CREATE + READ: new booking can be retrieved by id', async ({ bookingApi }) => {
      expect(bookingId).toBeGreaterThan(0);

      const response = await bookingApi.get(bookingId);
      await expect(response).toBeOK();
      expect(await response.json()).toEqual(original);
    });

    test('READ: booking is discoverable via name filter', async ({ bookingApi }) => {
      const ids = await bookingApi.listBookingIds({
        firstname: original.firstname,
        lastname: original.lastname,
      });
      expect(ids).toContain(bookingId);
    });

    test('UPDATE (PUT): replaces the whole booking', async ({ bookingApi }) => {
      const updated = buildBooking({ additionalneeds: 'Late checkout' });

      const response = await bookingApi.update(bookingId, updated);
      await expect(response).toBeOK();
      expect(await response.json()).toEqual(updated);

      const fetched = await bookingApi.get(bookingId);
      expect(await fetched.json()).toEqual(updated);
    });

    test('UPDATE (PATCH): changes only the provided fields', async ({ bookingApi }) => {
      const response = await bookingApi.patch(bookingId, { totalprice: 1234, depositpaid: true });
      await expect(response).toBeOK();

      const body = (await response.json()) as Booking;
      expect(body).toEqual({ ...original, totalprice: 1234, depositpaid: true });
    });

    test('DELETE: booking is removed and no longer retrievable', async ({ bookingApi }) => {
      const response = await bookingApi.delete(bookingId);
      expect(response.status()).toBe(201); // this API returns 201 on delete

      const fetched = await bookingApi.get(bookingId);
      expect(fetched.status()).toBe(404);
      bookingId = 0; // nothing left to clean up
    });
  });

  test.describe('negative cases', () => {
    test('GET a non-existent booking returns 404', async ({ bookingApi }) => {
      const response = await bookingApi.get(999_999_999);
      expect(response.status()).toBe(404);
    });

    test('DELETE without a token is forbidden', async ({ request }) => {
      // Uses the raw project-level `request` fixture (baseURL = API_BASE_URL).
      const response = await request.delete('/booking/1');
      expect(response.status()).toBe(403);
    });

    test('authentication with bad credentials yields no token', async ({ request }) => {
      const response = await request.post('/auth', {
        data: { username: 'admin', password: 'wrong-password' },
      });
      // The API returns 200 with a "Bad credentials" reason instead of a 401.
      const body = (await response.json()) as { token?: string; reason?: string };
      expect(body.token).toBeUndefined();
      expect(body.reason).toBe('Bad credentials');
    });
  });
});
