# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> a signed-out visitor can reach the sign-in page from the navbar
- Location: e2e/auth.spec.ts:8:5

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
  8  | test('a signed-out visitor can reach the sign-in page from the navbar', async ({ page }) => {
  9  |   await setupClerkTestingToken({ page })
  10 |   await page.goto('/')
  11 |   await page.getByRole('link', { name: 'Login' }).click()
  12 |   await expect(page).toHaveURL(/sign-in/)
  13 | })
  14 | 
  15 | test('an existing client can sign in and see the account menu', async ({ page }) => {
  16 |   await setupClerkTestingToken({ page })
  17 |   await page.goto('/sign-in')
  18 |   await clerk.signIn({
  19 |     page,
  20 |     signInParams: {
  21 |       strategy: 'password',
  22 |       identifier: process.env.E2E_CLIENT_EMAIL!,
  23 |       password: process.env.E2E_CLIENT_PASSWORD!,
  24 |     },
  25 |   })
  26 |   await page.goto('/')
  27 |   await expect(page.getByText('CLIENT')).toBeVisible()
  28 | })
  29 | 
```