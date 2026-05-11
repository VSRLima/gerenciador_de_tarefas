import { expect, test } from '@playwright/test';
import { login } from './helpers';

test('admin user can create, update, and delete another user', async ({
  page,
}) => {
  const suffix = Date.now();
  const username = `e2e-user-${suffix}`;
  const email = `e2e-user-${suffix}@example.com`;
  const displayName = `E2E User ${suffix}`;

  await login(page, {
    login: 'adminUser',
    password: 'admin123@',
  });

  await page.getByRole('link', { name: 'Users' }).click();
  await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible();

  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('playwright123@');
  await page.getByLabel('Display name').fill(displayName);
  await page.getByLabel('Role').selectOption('BASIC');
  await page.getByRole('button', { name: 'Create user' }).click();

  await expect(page.getByText('User created')).toBeVisible();

  const userRow = page.locator('.task-row').filter({ hasText: email }).first();
  await expect(userRow).toContainText(displayName);
  await expect(userRow).toContainText('BASIC');

  await userRow.getByRole('button', { name: 'Toggle role' }).click();
  await expect(page.getByText('User updated')).toBeVisible();
  await expect(userRow).toContainText('ADMIN');

  await userRow.getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByText('User deleted')).toBeVisible();
  await expect(
    page.locator('.task-row').filter({ hasText: email }),
  ).toHaveCount(0);
});
