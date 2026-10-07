import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class CartPage extends BasePage {
  protected readonly path = '/cart.html';

  readonly title: Locator;
  readonly items: Locator;
  readonly itemNames: Locator;
  readonly checkoutButton: Locator;
  readonly continueShoppingButton: Locator;

  constructor(page: Page) {
    super(page);
    this.title = this.byTestId('title');
    this.items = this.byTestId('inventory-item');
    this.itemNames = this.byTestId('inventory-item-name');
    this.checkoutButton = this.byTestId('checkout');
    this.continueShoppingButton = this.byTestId('continue-shopping');
  }

  async waitForLoaded(): Promise<void> {
    await expect(this.title).toHaveText('Your Cart');
  }

  async expectItems(names: string[]): Promise<void> {
    await expect(this.itemNames).toHaveText(names);
  }

  async checkout(): Promise<void> {
    await this.checkoutButton.click();
  }
}
