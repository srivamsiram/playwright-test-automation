import { APIRequestContext, APIResponse, expect } from '@playwright/test';
import { Booking } from './test-data';
import { env } from './env';

export interface CreatedBooking {
  bookingid: number;
  booking: Booking;
}

/**
 * Thin wrapper around Playwright's APIRequestContext for the Booking API.
 * Keeps endpoints, auth and happy-path assertions out of test bodies.
 * Methods that tests may want to assert on (status, headers) return the raw
 * APIResponse; happy-path helpers return parsed bodies.
 */
export class BookingApi {
  private token?: string;

  constructor(private readonly request: APIRequestContext) {}

  /** Obtains (and caches) the auth token required for PUT/PATCH/DELETE. */
  async authenticate(
    username: string = env.api.username,
    password: string = env.api.password,
  ): Promise<string> {
    if (this.token) return this.token;
    const response = await this.request.post('/auth', { data: { username, password } });
    await expect(response, 'auth request should succeed').toBeOK();
    const body = (await response.json()) as { token?: string; reason?: string };
    if (!body.token) throw new Error(`Authentication failed: ${body.reason ?? 'unknown reason'}`);
    this.token = body.token;
    return this.token;
  }

  private async authHeaders(): Promise<Record<string, string>> {
    return { Cookie: `token=${await this.authenticate()}` };
  }

  async healthCheck(): Promise<APIResponse> {
    return this.request.get('/ping');
  }

  async listBookingIds(filters: Record<string, string> = {}): Promise<number[]> {
    const response = await this.request.get('/booking', { params: filters });
    await expect(response).toBeOK();
    const body = (await response.json()) as Array<{ bookingid: number }>;
    return body.map((b) => b.bookingid);
  }

  async create(booking: Booking): Promise<CreatedBooking> {
    const response = await this.request.post('/booking', { data: booking });
    await expect(response, 'create booking should succeed').toBeOK();
    return (await response.json()) as CreatedBooking;
  }

  async get(id: number): Promise<APIResponse> {
    return this.request.get(`/booking/${id}`);
  }

  async update(id: number, booking: Booking): Promise<APIResponse> {
    return this.request.put(`/booking/${id}`, {
      data: booking,
      headers: await this.authHeaders(),
    });
  }

  async patch(id: number, partial: Partial<Booking>): Promise<APIResponse> {
    return this.request.patch(`/booking/${id}`, {
      data: partial,
      headers: await this.authHeaders(),
    });
  }

  async delete(id: number): Promise<APIResponse> {
    return this.request.delete(`/booking/${id}`, { headers: await this.authHeaders() });
  }
}
