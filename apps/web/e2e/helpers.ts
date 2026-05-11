import { expect, Page } from '@playwright/test';

export const formatFutureDate = (daysAhead: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export const login = async (
  page: Page,
  credentials: { login: string; password: string },
): Promise<void> => {
  await page.goto('/login');
  await page.getByLabel('Login').fill(credentials.login);
  await page.getByLabel('Password').fill(credentials.password);
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page.getByRole('heading', { name: 'Tasks' })).toBeVisible();
};
