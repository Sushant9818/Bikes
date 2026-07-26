import { test, expect } from '@playwright/test'
import { clerkSetup, setupClerkTestingToken, clerk } from '@clerk/testing/playwright'

test.beforeAll(async () => {
  await clerkSetup()
})

test('a signed-in client can browse parts, add one to cart, and reach the Stripe payment step', async ({ page }) => {
  await setupClerkTestingToken({ page })
  await page.goto('/sign-in')
  await clerk.signIn({
    page,
    signInParams: {
      strategy: 'password',
      identifier: process.env.E2E_CLIENT_EMAIL!,
      password: process.env.E2E_CLIENT_PASSWORD!,
    },
  })

  await page.goto('/parts')
  await expect(page.getByRole('heading', { name: /Suzuki (Bike|Scooter) Parts/ })).toBeVisible()

  await page.locator('article').first().getByRole('button').last().click() // Add to Cart icon button
  await page.goto('/cart')
  await expect(page.getByText('Shopping Cart')).toBeVisible()

  await page.getByRole('link', { name: 'Proceed to Checkout' }).click()
  await expect(page).toHaveURL(/checkout/)

  await page.getByLabel('Full Name *').fill('E2E Test User')
  await page.getByLabel('Phone *').fill('9800000000')
  await page.getByLabel('Address *').fill('Balkumari, Lalitpur')
  await page.getByRole('button', { name: 'Continue to Payment' }).click()

  await expect(page.getByText('Pay with Card')).toBeVisible({ timeout: 15_000 })

  const stripeFrame = page.frameLocator('iframe[title="Secure payment input frame"]').first()
  await stripeFrame.getByPlaceholder('1234 1234 1234 1234').fill('4242424242424242')
  await stripeFrame.getByPlaceholder('MM / YY').fill('12/30')
  await stripeFrame.getByPlaceholder('CVC').fill('123')

  await page.getByRole('button', { name: /^Pay Rs/ }).click()
  await expect(page).toHaveURL(/checkout\/success/, { timeout: 20_000 })
  await expect(page.getByText('Payment Successful!')).toBeVisible()
})
