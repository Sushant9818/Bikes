import { test, expect } from '@playwright/test'
import { clerkSetup, setupClerkTestingToken, clerk } from '@clerk/testing/playwright'

test.beforeAll(async () => {
  await clerkSetup()
})

test('a client can book a service appointment and an admin can approve it', async ({ browser }) => {
  const clientContext = await browser.newContext()
  const clientPage = await clientContext.newPage()
  await setupClerkTestingToken({ page: clientPage })
  await clientPage.goto('/sign-in')
  await clerk.signIn({
    page: clientPage,
    signInParams: { strategy: 'password', identifier: process.env.E2E_CLIENT_EMAIL!, password: process.env.E2E_CLIENT_PASSWORD! },
  })

  await clientPage.goto('/book-service')
  await clientPage.getByLabel('Bike Model *').fill('Gixxer SF 250')
  await clientPage.getByText('Oil Change').click()
  const today = new Date()
  today.setDate(today.getDate() + 3)
  await clientPage.getByLabel('Preferred Date *').fill(today.toISOString().split('T')[0])
  await clientPage.locator('select').selectOption('10:00 AM')
  await clientPage.getByRole('button', { name: 'Book Appointment' }).click()
  await expect(clientPage).toHaveURL(/my-appointments/)
  await expect(clientPage.getByText('Gixxer SF 250')).toBeVisible()

  const adminContext = await browser.newContext()
  const adminPage = await adminContext.newPage()
  await setupClerkTestingToken({ page: adminPage })
  await adminPage.goto('/sign-in')
  await clerk.signIn({
    page: adminPage,
    signInParams: { strategy: 'password', identifier: process.env.E2E_ADMIN_EMAIL!, password: process.env.E2E_ADMIN_PASSWORD! },
  })

  await adminPage.goto('/admin/appointments')
  await adminPage.getByPlaceholder('Search client...').fill(process.env.E2E_CLIENT_EMAIL!.split('@')[0])
  await adminPage.getByRole('button', { name: 'Search' }).click()
  await adminPage.getByRole('link').first().click()
  await adminPage.locator('select').first().selectOption('APPROVED')
  await adminPage.getByRole('button', { name: 'Save Changes' }).click()
  await expect(adminPage.getByText('Approved')).toBeVisible()

  await clientContext.close()
  await adminContext.close()
})
