import { test, expect } from '@playwright/test'
import { clerkSetup, setupClerkTestingToken, clerk } from '@clerk/testing/playwright'

test.beforeAll(async () => {
  await clerkSetup()
})

test('a signed-out visitor can reach the sign-in page from the navbar', async ({ page }) => {
  await setupClerkTestingToken({ page })
  await page.goto('/')
  await page.getByRole('link', { name: 'Login' }).click()
  await expect(page).toHaveURL(/sign-in/)
})

test('an existing client can sign in and see the account menu', async ({ page }) => {
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
  await page.goto('/')
  await expect(page.getByText('CLIENT')).toBeVisible()
})
