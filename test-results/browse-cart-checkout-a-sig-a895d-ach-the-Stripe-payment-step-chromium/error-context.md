# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: browse-cart-checkout.spec.ts >> a signed-in client can browse parts, add one to cart, and reach the Stripe payment step
- Location: e2e/browse-cart-checkout.spec.ts:8:5

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
  8  | test('a signed-in client can browse parts, add one to cart, and reach the Stripe payment step', async ({ page }) => {
  9  |   await setupClerkTestingToken({ page })
  10 |   await page.goto('/sign-in')
  11 |   await clerk.signIn({
  12 |     page,
  13 |     signInParams: {
  14 |       strategy: 'password',
  15 |       identifier: process.env.E2E_CLIENT_EMAIL!,
  16 |       password: process.env.E2E_CLIENT_PASSWORD!,
  17 |     },
  18 |   })
  19 | 
  20 |   await page.goto('/parts')
  21 |   await expect(page.getByRole('heading', { name: /Suzuki (Bike|Scooter) Parts/ })).toBeVisible()
  22 | 
  23 |   await page.locator('article').first().getByRole('button').last().click() // Add to Cart icon button
  24 |   await page.goto('/cart')
  25 |   await expect(page.getByText('Shopping Cart')).toBeVisible()
  26 | 
  27 |   await page.getByRole('link', { name: 'Proceed to Checkout' }).click()
  28 |   await expect(page).toHaveURL(/checkout/)
  29 | 
  30 |   await page.getByLabel('Full Name *').fill('E2E Test User')
  31 |   await page.getByLabel('Phone *').fill('9800000000')
  32 |   await page.getByLabel('Address *').fill('Balkumari, Lalitpur')
  33 |   await page.getByRole('button', { name: 'Continue to Payment' }).click()
  34 | 
  35 |   await expect(page.getByText('Pay with Card')).toBeVisible({ timeout: 15_000 })
  36 | 
  37 |   const stripeFrame = page.frameLocator('iframe[title="Secure payment input frame"]').first()
  38 |   await stripeFrame.getByPlaceholder('1234 1234 1234 1234').fill('4242424242424242')
  39 |   await stripeFrame.getByPlaceholder('MM / YY').fill('12/30')
  40 |   await stripeFrame.getByPlaceholder('CVC').fill('123')
  41 | 
  42 |   await page.getByRole('button', { name: /^Pay Rs/ }).click()
  43 |   await expect(page).toHaveURL(/checkout\/success/, { timeout: 20_000 })
  44 |   await expect(page.getByText('Payment Successful!')).toBeVisible()
  45 | })
  46 | 
```