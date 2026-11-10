import { expect, test } from '@playwright/test'

test('edits a build loaded from disk without persisting changes', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Edit', exact: true }).click()
  await page.getByLabel('Title', { exact: true }).fill('Updated starter')
  await page.getByRole('dialog').getByRole('button', { name: 'Save', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Updated starter', exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Fixture starter', exact: true })).toBeVisible()
})

test('edits an omitted work-in-progress flag in version settings', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Settings', exact: true }).click()
  await page.getByRole('checkbox', { name: 'Work in progress' }).check()
  await page.getByRole('dialog').getByRole('button', { name: 'Save', exact: true }).click()
  await page.getByRole('button', { name: 'Settings', exact: true }).click()
  await expect(page.getByRole('checkbox', { name: 'Work in progress' })).toBeChecked()
})
