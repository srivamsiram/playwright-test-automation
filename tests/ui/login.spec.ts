import { test, expect } from '../../fixtures/test-fixtures';
import { env } from '../../utils/env';

test.describe('Login', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('valid user lands on the inventory page', async ({ loginPage, inventoryPage }) => {
    await loginPage.login(env.ui.username, env.ui.password);

    await inventoryPage.expectOnPage();
    await inventoryPage.waitForLoaded();
    await expect(inventoryPage.items).toHaveCount(6);
  });

  test('locked-out user sees an error', async ({ loginPage }) => {
    await loginPage.login('locked_out_user', env.ui.password);
    await loginPage.expectError('Sorry, this user has been locked out.');
  });

  test('wrong password is rejected', async ({ loginPage }) => {
    await loginPage.login(env.ui.username, 'not-the-password');
    await loginPage.expectError('Username and password do not match any user in this service');
  });

  test('user can log out', async ({ loginPage, inventoryPage }) => {
    await loginPage.login(env.ui.username, env.ui.password);
    await inventoryPage.waitForLoaded();

    await inventoryPage.logout();
    await expect(loginPage.loginButton).toBeVisible();
  });
});
