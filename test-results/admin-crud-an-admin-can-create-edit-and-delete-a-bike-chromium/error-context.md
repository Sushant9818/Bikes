# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin-crud.spec.ts >> an admin can create, edit, and delete a bike
- Location: e2e/admin-crud.spec.ts:8:5

# Error details

```
Error: You need to set the CLERK_PUBLISHABLE_KEY environment variable.
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | import { clerkSetup, setupClerkTestingToken, clerk } from '@clerk/testing/playwright'
  3  | 
  4  | test.beforeAll(async () => {
> 5  |   await clerkSetup()
     |                   ^ Error: You need to set the CLERK_PUBLISHABLE_KEY environment variable.
  6  | })
  7  | 
  8  | test('an admin can create, edit, and delete a bike', async ({ page }) => {
  9  |   await setupClerkTestingToken({ page })
  10 |   await page.goto('/sign-in')
  11 |   await clerk.signIn({
  12 |     page,
  13 |     signInParams: {
  14 |       strategy: 'password',
  15 |       identifier: process.env.E2E_ADMIN_EMAIL!,
  16 |       password: process.env.E2E_ADMIN_PASSWORD!,
  17 |     },
  18 |   })
  19 | 
  20 |   await page.goto('/bikes')
  21 |   const modelName = `E2E Test Bike ${Date.now()}`
  22 | 
  23 |   await page.getByRole('button', { name: 'Add Bike' }).click()
  24 |   await page.getByLabel('Model Name *').fill(modelName)
  25 |   await page.getByLabel('Price (Rs)').fill('250000')
  26 |   await page.getByLabel('Stock quantity').fill('5')
  27 |   await page.getByRole('button', { name: 'Add' }).click()
  28 |   await expect(page.getByText(modelName)).toBeVisible()
  29 | 
  30 |   await page.getByText(modelName).locator('..').locator('..').getByRole('button', { name: 'Edit' }).click()
  31 |   await page.getByLabel('Price (Rs)').fill('260000')
  32 |   await page.getByRole('button', { name: 'Update' }).click()
  33 |   await expect(page.getByText('Rs 2,60,000')).toBeVisible()
  34 | 
  35 |   await page.getByText(modelName).locator('..').locator('..').getByRole('button', { name: 'Delete' }).click()
  36 |   await page.getByRole('button', { name: 'Delete' }).last().click()
  37 |   await expect(page.getByText(modelName)).not.toBeVisible()
  38 | })
  39 | 
```