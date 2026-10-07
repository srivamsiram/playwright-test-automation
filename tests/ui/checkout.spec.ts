import { test, expect } from '../../fixtures/test-fixtures';
import { Products, buildCustomer } from '../../utils/test-data';

test.describe('E-commerce: cart & checkout', () => {
  test('sorting by price low→high orders products ascending', async ({ loggedInInventoryPage }) => {
    await loggedInInventoryPage.sortBy('lohi');

    const prices = await loggedInInventoryPage.getItemPrices();
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  test('adding and removing items updates the cart badge', async ({ loggedInInventoryPage }) => {
    await loggedInInventoryPage.addToCart(Products.backpack.name);
    await loggedInInventoryPage.addToCart(Products.bikeLight.name);
    await loggedInInventoryPage.expectCartCount(2);

    await loggedInInventoryPage.removeFromCart(Products.backpack.name);
    await loggedInInventoryPage.expectCartCount(1);
  });

  test('user can purchase items end-to-end', async ({
    loggedInInventoryPage,
    cartPage,
    checkoutPage,
  }) => {
    const basket = [Products.backpack, Products.boltTShirt];

    for (const product of basket) {
      await loggedInInventoryPage.addToCart(product.name);
    }
    await loggedInInventoryPage.expectCartCount(basket.length);

    await loggedInInventoryPage.openCart();
    await cartPage.waitForLoaded();
    await cartPage.expectItems(basket.map((p) => p.name));
    await cartPage.checkout();

    await checkoutPage.fillCustomerInfo(buildCustomer());
    await checkoutPage.expectSubtotal(basket.reduce((sum, p) => sum + p.price, 0));
    await checkoutPage.finish();
    await checkoutPage.expectOrderComplete();
  });

  test('checkout requires customer information', async ({
    loggedInInventoryPage,
    cartPage,
    checkoutPage,
  }) => {
    await loggedInInventoryPage.addToCart(Products.bikeLight.name);
    await loggedInInventoryPage.openCart();
    await cartPage.checkout();

    await checkoutPage.continueButton.click();
    await expect(checkoutPage.errorMessage).toContainText('First Name is required');
  });
});
