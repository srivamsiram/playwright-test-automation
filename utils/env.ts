import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

function read(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/** Typed, centralised access to environment configuration. */
export const env = {
  baseUrl: read('BASE_URL', 'https://www.saucedemo.com'),
  apiBaseUrl: read('API_BASE_URL', 'https://restful-booker.herokuapp.com'),
  ui: {
    username: read('UI_USERNAME', 'standard_user'),
    password: read('UI_PASSWORD', 'secret_sauce'),
  },
  api: {
    username: read('API_USERNAME', 'admin'),
    password: read('API_PASSWORD', 'password123'),
  },
} as const;
