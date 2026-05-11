import { expect, test } from '@playwright/test';
import { formatFutureDate, login } from './helpers';

test('basic user can create, finish, and delete a task', async ({ page }) => {
  const title = `E2E task ${Date.now()}`;

  await login(page, {
    login: 'basicUser',
    password: 'basic123@',
  });

  await page.getByLabel('Title').fill(title);
  await page.getByLabel('Description').fill('Task created by Playwright');
  await page.getByLabel('Date').fill(formatFutureDate(1));
  await page.getByLabel('Hour').fill('14:00');
  await page.getByRole('button', { name: 'Create task' }).click();

  await expect(page.getByText('1 task created')).toBeVisible();

  const searchInput = page.getByPlaceholder('Search by task title');
  await searchInput.fill(title);

  const taskRow = page.locator('.task-row').filter({ hasText: title }).first();
  await expect(taskRow).toBeVisible();

  await taskRow.getByRole('button', { name: 'Finish' }).click();
  await expect(page.getByText('Task finished')).toBeVisible();
  await expect(taskRow.getByText('Finished')).toBeVisible();

  await taskRow.getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByText('Task deleted')).toBeVisible();
  await expect(
    page.locator('.task-row').filter({ hasText: title }),
  ).toHaveCount(0);
});
