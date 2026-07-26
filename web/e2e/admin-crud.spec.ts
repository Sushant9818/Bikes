import { test, expect } from '@playwright/test'
import { clerkSetup, setupClerkTestingToken, clerk } from '@clerk/testing/playwright'

test.beforeAll(async () => {
  await clerkSetup()
})

test('an admin can create, edit, and delete a bike', async ({ page }) => {
  await setupClerkTestingToken({ page })
  await page.goto('/sign-in')
  await clerk.signIn({
    page,
    signInParams: {
      strategy: 'password',
      identifier: process.env.E2E_ADMIN_EMAIL!,
      password: process.env.E2E_ADMIN_PASSWORD!,
    },
  })

  await page.goto('/bikes')
  const modelName = `E2E Test Bike ${Date.now()}`

  await page.getByRole('button', { name: 'Add Bike' }).click()
  await page.getByLabel('Model Name *').fill(modelName)
  await page.getByLabel('Price (Rs)').fill('250000')
  await page.getByLabel('Stock quantity').fill('5')
  await page.getByRole('button', { name: 'Add' }).click()
  await expect(page.getByText(modelName)).toBeVisible()

  await page.getByText(modelName).locator('..').locator('..').getByRole('button', { name: 'Edit' }).click()
  await page.getByLabel('Price (Rs)').fill('260000')
  await page.getByRole('button', { name: 'Update' }).click()
  await expect(page.getByText('Rs 2,60,000')).toBeVisible()

  await page.getByText(modelName).locator('..').locator('..').getByRole('button', { name: 'Delete' }).click()
  await page.getByRole('button', { name: 'Delete' }).last().click()
  await expect(page.getByText(modelName)).not.toBeVisible()
})
