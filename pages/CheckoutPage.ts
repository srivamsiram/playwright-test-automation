import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { CheckoutCustomer } from '../utils/test-data';

/** Models the three-step checkout flow (information → overview → complete). */
export class CheckoutPage extends BasePage {
  protected readonly path = '/checkout-step-one.html';

  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly postalCodeInput: Locator;
  readonly continueButton: Locator;
  readonly finishButton: Locator;
  readonly subtotalLabel: Locator;
  readonly completeHeader: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.firstNameInput = this.byTestId('firstName');
    this.lastNameInput = this.byTestId('lastName');
    this.postalCodeInput = this.byTestId('postalCode');
    this.continueButton = this.byTestId('continue');
    this.finishButton = this.byTestId('finish');
    this.subtotalLabel = this.byTestId('subtotal-label');
    this.completeHeader = this.byTestId('complete-header');
    this.errorMessage = this.byTestId('error');
  }

  async fillCustomerInfo(customer: CheckoutCustomer): Promise<void> {
    await this.firstNameInput.fill(customer.firstName);
    await this.lastNameInput.fill(customer.lastName);
    await this.postalCodeInput.fill(customer.postalCode);
    await this.continueButton.click();
  }

  async expectSubtotal(amount: number): Promise<void> {
    await expect(this.subtotalLabel).toHaveText(`Item total: $${amount.toFixed(2)}`);
  }

  async finish(): Promise<void> {
    await this.finishButton.click();
  }

  async expectOrderComplete(): Promise<void> {
    await expect(this.completeHeader).toHaveText('Thank you for your order!');
  }
}
