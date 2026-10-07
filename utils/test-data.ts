/**
 * Test data builders. Each call returns fresh, unique data so tests can run
 * in parallel without colliding.
 */

export interface BookingDates {
  checkin: string;
  checkout: string;
}

export interface Booking {
  firstname: string;
  lastname: string;
  totalprice: number;
  depositpaid: boolean;
  bookingdates: BookingDates;
  additionalneeds?: string;
}

export interface CheckoutCustomer {
  firstName: string;
  lastName: string;
  postalCode: string;
}

const FIRST_NAMES = ['Ada', 'Grace', 'Linus', 'Margaret', 'Alan', 'Barbara'];
const LAST_NAMES = ['Lovelace', 'Hopper', 'Torvalds', 'Hamilton', 'Turing', 'Liskov'];

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function uniqueSuffix(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/** Formats a date as YYYY-MM-DD. */
export function isoDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

export function buildBooking(overrides: Partial<Booking> = {}): Booking {
  const start = randomInt(1, 30);
  return {
    firstname: pick(FIRST_NAMES),
    lastname: `${pick(LAST_NAMES)}-${uniqueSuffix()}`,
    totalprice: randomInt(50, 900),
    depositpaid: Math.random() > 0.5,
    bookingdates: {
      checkin: isoDate(daysFromNow(start)),
      checkout: isoDate(daysFromNow(start + randomInt(1, 7))),
    },
    additionalneeds: 'Breakfast',
    ...overrides,
  };
}

export function buildCustomer(overrides: Partial<CheckoutCustomer> = {}): CheckoutCustomer {
  return {
    firstName: pick(FIRST_NAMES),
    lastName: pick(LAST_NAMES),
    postalCode: String(randomInt(10000, 99999)),
    ...overrides,
  };
}

/** Products available on the demo store, keyed for readability in tests. */
export const Products = {
  backpack: { name: 'Sauce Labs Backpack', price: 29.99 },
  bikeLight: { name: 'Sauce Labs Bike Light', price: 9.99 },
  boltTShirt: { name: 'Sauce Labs Bolt T-Shirt', price: 15.99 },
} as const;

export type ProductKey = keyof typeof Products;
