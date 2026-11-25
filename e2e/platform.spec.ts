import { expect, test } from '@playwright/test'

test('home page displays a greeting from the API', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Kerja Woy', exact: true })).toBeVisible()
  await expect(page.getByText('Hello, Kerja Woy!', { exact: true })).toBeVisible()
})

test('navigates between file-based routes', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'About', exact: true }).click()

  await expect(page).toHaveURL('/about')
  await expect(page.getByRole('heading', { name: 'About', exact: true })).toBeVisible()

  await page.reload()
  await expect(page.getByRole('heading', { name: 'About', exact: true })).toBeVisible()

  await page.getByRole('link', { name: 'Home', exact: true }).click()
  await expect(page).toHaveURL('/')
  await expect(page.getByText('Hello, Kerja Woy!', { exact: true })).toBeVisible()
})
