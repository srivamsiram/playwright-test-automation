import { Locator, Page, expect } from '@playwright/test';

/**
 * Common behaviour shared by every page object.
 * Concrete pages declare their own `path` and locators, and expose
 * intention-revealing actions rather than raw selectors.
 */
export abstract class BasePage {
  /** Path relative to `baseURL`, e.g. '/inventory.html'. */
  protected abstract readonly path: string;

  constructor(protected readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto(this.path);
    await this.waitForLoaded();
  }

  /** Override to wait for a page-specific "ready" element. */
  async waitForLoaded(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
  }

  async expectOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`${escapeRegExp(this.path)}$`));
  }

  async pageTitle(): Promise<string> {
    return this.page.title();
  }

  protected byTestId(id: string): Locator {
    return this.page.getByTestId(id);
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
