# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: appointment-booking.spec.ts >> a client can book a service appointment and an admin can approve it
- Location: e2e/appointment-booking.spec.ts:8:5

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
  8  | test('a client can book a service appointment and an admin can approve it', async ({ browser }) => {
  9  |   const clientContext = await browser.newContext()
  10 |   const clientPage = await clientContext.newPage()
  11 |   await setupClerkTestingToken({ page: clientPage })
  12 |   await clientPage.goto('/sign-in')
  13 |   await clerk.signIn({
  14 |     page: clientPage,
  15 |     signInParams: { strategy: 'password', identifier: process.env.E2E_CLIENT_EMAIL!, password: process.env.E2E_CLIENT_PASSWORD! },
  16 |   })
  17 | 
  18 |   await clientPage.goto('/book-service')
  19 |   await clientPage.getByLabel('Bike Model *').fill('Gixxer SF 250')
  20 |   await clientPage.getByText('Oil Change').click()
  21 |   const today = new Date()
  22 |   today.setDate(today.getDate() + 3)
  23 |   await clientPage.getByLabel('Preferred Date *').fill(today.toISOString().split('T')[0])
  24 |   await clientPage.locator('select').selectOption('10:00 AM')
  25 |   await clientPage.getByRole('button', { name: 'Book Appointment' }).click()
  26 |   await expect(clientPage).toHaveURL(/my-appointments/)
  27 |   await expect(clientPage.getByText('Gixxer SF 250')).toBeVisible()
  28 | 
  29 |   const adminContext = await browser.newContext()
  30 |   const adminPage = await adminContext.newPage()
  31 |   await setupClerkTestingToken({ page: adminPage })
  32 |   await adminPage.goto('/sign-in')
  33 |   await clerk.signIn({
  34 |     page: adminPage,
  35 |     signInParams: { strategy: 'password', identifier: process.env.E2E_ADMIN_EMAIL!, password: process.env.E2E_ADMIN_PASSWORD! },
  36 |   })
  37 | 
  38 |   await adminPage.goto('/admin/appointments')
  39 |   await adminPage.getByPlaceholder('Search client...').fill(process.env.E2E_CLIENT_EMAIL!.split('@')[0])
  40 |   await adminPage.getByRole('button', { name: 'Search' }).click()
  41 |   await adminPage.getByRole('link').first().click()
  42 |   await adminPage.locator('select').first().selectOption('APPROVED')
  43 |   await adminPage.getByRole('button', { name: 'Save Changes' }).click()
  44 |   await expect(adminPage.getByText('Approved')).toBeVisible()
  45 | 
  46 |   await clientContext.close()
  47 |   await adminContext.close()
  48 | })
  49 | 
```