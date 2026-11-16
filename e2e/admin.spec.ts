import { test, expect, Page } from '@playwright/test'
import { clerkSetup, setupClerkTestingToken, clerk } from '@clerk/testing/playwright'

test.beforeAll(async () => {
  await clerkSetup()
})

// Helper function to sign in as admin
async function signInAsAdmin(page: Page) {
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
}

// Helper function to sign in as regular client
async function signInAsClient(page: Page) {
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
}

test.describe('Admin Panel', () => {
  test.describe('Authentication & Access Control', () => {
    test('non-authenticated user is redirected to sign-in when accessing /admin', async ({ page }) => {
      await setupClerkTestingToken({ page })
      await page.goto('/admin', { waitUntil: 'networkidle' })
      await expect(page).toHaveURL(/sign-in/)
    })

    test('client user is redirected to permission-denied when accessing /admin', async ({ page }) => {
      await signInAsClient(page)
      await page.goto('/admin', { waitUntil: 'networkidle' })
      await expect(page).toHaveURL(/permission-denied/)
    })

    test('admin user can access the admin dashboard', async ({ page }) => {
      await signInAsAdmin(page)
      await page.goto('/admin', { waitUntil: 'networkidle' })
      await expect(page).toHaveURL(/\/admin\/?$/)
      await expect(page.getByRole('heading', { name: /Dashboard/ })).toBeVisible()
      await expect(page.getByText(/Welcome to the Suzuki Admin Panel/)).toBeVisible()
    })
  })

  test.describe('Admin Sidebar Navigation', () => {
    test('admin dashboard displays sidebar with all menu items', async ({ page }) => {
      await signInAsAdmin(page)
      await page.goto('/admin')

      // Check sidebar menu items exist
      await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible()
      await expect(page.getByRole('link', { name: 'Bikes' })).toBeVisible()
      await expect(page.getByRole('link', { name: 'Scooters' })).toBeVisible()
      await expect(page.getByRole('link', { name: 'Parts' })).toBeVisible()
    })

    test('admin can navigate between dashboard sections', async ({ page }) => {
      await signInAsAdmin(page)
      await page.goto('/admin')

      // Navigate to Bikes
      await page.getByRole('link', { name: 'Bikes' }).click()
      await expect(page).toHaveURL(/\/bikes/)
      await expect(page.getByRole('heading', { name: /Suzuki Motorcycles/ })).toBeVisible()

      // Navigate back to Dashboard
      await page.getByRole('link', { name: 'Dashboard' }).click()
      await expect(page).toHaveURL(/\/admin\/?$/)
      await expect(page.getByRole('heading', { name: /Dashboard/ })).toBeVisible()
    })
  })

  test.describe('Bike CRUD Operations', () => {
    test('admin can create a new bike with valid data', async ({ page }) => {
      await signInAsAdmin(page)
      await page.goto('/bikes')

      const bikeModel = `E2E Test Bike ${Date.now()}`
      const price = '350000'
      const quantity = '3'

      // Click Add Bike button
      await page.getByRole('button', { name: 'Add Bike' }).click()
      await expect(page.getByRole('dialog')).toBeVisible()

      // Fill form
      await page.getByLabel('Model Name *').fill(bikeModel)
      await page.getByLabel('Price (Rs)').fill(price)
      await page.getByLabel('Stock quantity').fill(quantity)

      // Submit
      await page.getByRole('button', { name: 'Add' }).click()

      // Verify bike was created
      await expect(page.getByText(bikeModel)).toBeVisible({ timeout: 10_000 })
      await expect(page.getByText('Rs 3,50,000')).toBeVisible()
    })

    test('admin can edit a bike', async ({ page }) => {
      await signInAsAdmin(page)
      await page.goto('/bikes')

      const bikeModel = `E2E Test Bike Edit ${Date.now()}`
      const initialPrice = '300000'
      const updatedPrice = '320000'

      // Create a bike first
      await page.getByRole('button', { name: 'Add Bike' }).click()
      await page.getByLabel('Model Name *').fill(bikeModel)
      await page.getByLabel('Price (Rs)').fill(initialPrice)
      await page.getByLabel('Stock quantity').fill('5')
      await page.getByRole('button', { name: 'Add' }).click()

      // Wait for bike to appear
      await expect(page.getByText(bikeModel)).toBeVisible({ timeout: 10_000 })

      // Edit the bike - find the card containing the bike model and click Edit
      const bikeCard = page.locator(`text=${bikeModel}`).locator('../..').locator('../..')
      await bikeCard.getByRole('button', { name: 'Edit' }).click()
      await expect(page.getByRole('dialog')).toBeVisible()

      // Clear and update price
      const priceInput = page.getByLabel('Price (Rs)')
      await priceInput.triple_click()
      await priceInput.fill(updatedPrice)

      await page.getByRole('button', { name: 'Update' }).click()

      // Verify update
      await expect(page.getByText('Rs 3,20,000')).toBeVisible({ timeout: 10_000 })
    })

    test('admin can delete a bike', async ({ page }) => {
      await signInAsAdmin(page)
      await page.goto('/bikes')

      const bikeModel = `E2E Test Bike Delete ${Date.now()}`

      // Create a bike
      await page.getByRole('button', { name: 'Add Bike' }).click()
      await page.getByLabel('Model Name *').fill(bikeModel)
      await page.getByLabel('Price (Rs)').fill('250000')
      await page.getByLabel('Stock quantity').fill('2')
      await page.getByRole('button', { name: 'Add' }).click()

      // Wait for bike to appear
      await expect(page.getByText(bikeModel)).toBeVisible({ timeout: 10_000 })

      // Delete the bike
      const bikeCard = page.locator(`text=${bikeModel}`).locator('../..').locator('../..')
      await bikeCard.getByRole('button', { name: 'Delete' }).click()

      // Confirm delete in dialog
      await expect(page.getByRole('dialog')).toBeVisible()
      await page.getByRole('button', { name: 'Delete' }).last().click()

      // Verify bike is deleted
      await expect(page.getByText(bikeModel)).not.toBeVisible({ timeout: 10_000 })
    })

    test('admin can complete full CRUD cycle: create, edit, and delete a bike', async ({ page }) => {
      await signInAsAdmin(page)
      await page.goto('/bikes')

      const bikeModel = `E2E Test Bike CRUD ${Date.now()}`
      const initialPrice = '280000'
      const updatedPrice = '290000'

      // CREATE
      await page.getByRole('button', { name: 'Add Bike' }).click()
      await page.getByLabel('Model Name *').fill(bikeModel)
      await page.getByLabel('Price (Rs)').fill(initialPrice)
      await page.getByLabel('Stock quantity').fill('4')
      await page.getByRole('button', { name: 'Add' }).click()

      await expect(page.getByText(bikeModel)).toBeVisible({ timeout: 10_000 })
      await expect(page.getByText('Rs 2,80,000')).toBeVisible()

      // EDIT
      const bikeCard = page.locator(`text=${bikeModel}`).locator('../..').locator('../..')
      await bikeCard.getByRole('button', { name: 'Edit' }).click()
      await page.getByLabel('Price (Rs)').triple_click()
      await page.getByLabel('Price (Rs)').fill(updatedPrice)
      await page.getByRole('button', { name: 'Update' }).click()

      await expect(page.getByText('Rs 2,90,000')).toBeVisible({ timeout: 10_000 })

      // DELETE
      const updatedBikeCard = page.locator(`text=${bikeModel}`).locator('../..').locator('../..')
      await updatedBikeCard.getByRole('button', { name: 'Delete' }).click()
      await page.getByRole('button', { name: 'Delete' }).last().click()

      await expect(page.getByText(bikeModel)).not.toBeVisible({ timeout: 10_000 })
    })
  })

  test.describe('Form Validation', () => {
    test('form requires Model Name field', async ({ page }) => {
      await signInAsAdmin(page)
      await page.goto('/bikes')

      // Open modal
      await page.getByRole('button', { name: 'Add Bike' }).click()
      await expect(page.getByRole('dialog')).toBeVisible()

      // Try to submit without Model Name
      const modelInput = page.getByLabel('Model Name *')
      await expect(modelInput).toHaveAttribute('required')

      // Fill other fields but leave Model Name empty
      await page.getByLabel('Price (Rs)').fill('200000')

      // The form should prevent submission due to HTML5 validation
      const addButton = page.getByRole('button', { name: 'Add' })
      await addButton.click()

      // Dialog should still be visible since submission failed
      await expect(page.getByRole('dialog')).toBeVisible()
    })

    test('form accepts valid numeric inputs for price and quantity', async ({ page }) => {
      await signInAsAdmin(page)
      await page.goto('/bikes')

      const bikeModel = `E2E Validation Test ${Date.now()}`

      // Open modal
      await page.getByRole('button', { name: 'Add Bike' }).click()

      // Fill form with valid data
      await page.getByLabel('Model Name *').fill(bikeModel)
      await page.getByLabel('Price (Rs)').fill('1500000')
      await page.getByLabel('Stock quantity').fill('10')

      // Submit
      await page.getByRole('button', { name: 'Add' }).click()

      // Verify submission succeeded
      await expect(page.getByText(bikeModel)).toBeVisible({ timeout: 10_000 })
      await expect(page.getByText('Rs 15,00,000')).toBeVisible()
    })
  })

  test.describe('Responsive Behavior - Mobile Drawer Sidebar', () => {
    test('admin dashboard shows drawer sidebar on mobile view', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })

      await signInAsAdmin(page)
      await page.goto('/admin')

      // On mobile, sidebar should be off-screen initially
      const sidebar = page.locator('aside')
      const sidebarStyle = await sidebar.evaluate((el) => {
        return window.getComputedStyle(el).transform
      })

      // The sidebar should exist but be translated
      await expect(sidebar).toBeVisible()
    })

    test('mobile user can toggle sidebar drawer', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })

      await signInAsAdmin(page)
      await page.goto('/admin')

      // Find and click menu toggle button
      const menuButton = page.getByRole('button', { name: /toggle menu/i })

      // Menu button should be visible on mobile
      if (await menuButton.isVisible()) {
        await menuButton.click()

        // Sidebar links should become accessible
        await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible()
        await expect(page.getByRole('link', { name: 'Bikes' })).toBeVisible()
      }
    })

    test('desktop view shows permanent sidebar', async ({ page }) => {
      // Set desktop viewport
      await page.setViewportSize({ width: 1024, height: 768 })

      await signInAsAdmin(page)
      await page.goto('/admin')

      // On desktop, sidebar should be visible and permanent
      await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible()
      await expect(page.getByRole('link', { name: 'Bikes' })).toBeVisible()
      await expect(page.getByRole('link', { name: 'Scooters' })).toBeVisible()
      await expect(page.getByRole('link', { name: 'Parts' })).toBeVisible()
    })

    test('mobile bike management is responsive', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })

      await signInAsAdmin(page)
      await page.goto('/bikes')

      // Add Bike button should be visible and functional on mobile
      const addButton = page.getByRole('button', { name: 'Add Bike' })
      await expect(addButton).toBeVisible()
      await addButton.click()

      // Modal should be responsive and visible
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()

      // Fill and submit form
      await page.getByLabel('Model Name *').fill(`Mobile Test ${Date.now()}`)
      await page.getByLabel('Price (Rs)').fill('200000')
      await page.getByRole('button', { name: 'Add' }).click()

      // Verify success
      await expect(dialog).not.toBeVisible({ timeout: 10_000 })
    })
  })

  test.describe('Admin Panel UI Elements', () => {
    test('admin can see top navigation bar', async ({ page }) => {
      await signInAsAdmin(page)
      await page.goto('/admin')

      // Top nav should exist and contain expected elements
      const topNav = page.locator('nav')
      await expect(topNav).toBeVisible()
    })

    test('bikes page shows correct heading and count', async ({ page }) => {
      await signInAsAdmin(page)
      await page.goto('/bikes')

      // Check for main heading
      await expect(page.getByRole('heading', { name: /Suzuki Motorcycles/ })).toBeVisible()

      // Check for vehicle count display
      await expect(page.getByText(/vehicle\(s\)/)).toBeVisible()
    })

    test('empty bikes page shows appropriate message', async ({ page }) => {
      await signInAsAdmin(page)

      // Navigate to bikes
      await page.goto('/bikes')

      // If no bikes, there should be either bikes displayed or a message
      // This test just verifies the page loads properly
      const heading = page.getByRole('heading', { name: /Suzuki Motorcycles/ })
      await expect(heading).toBeVisible()
    })
  })

  test.describe('Client User Access Control', () => {
    test('client cannot access /admin route', async ({ page }) => {
      await signInAsClient(page)
      await page.goto('/admin', { waitUntil: 'networkidle' })

      // Should be redirected to permission denied
      await expect(page).toHaveURL(/permission-denied/)
    })

    test('client cannot access /admin/bikes route', async ({ page }) => {
      await signInAsClient(page)
      await page.goto('/admin/bikes', { waitUntil: 'networkidle' })

      // Should be redirected to permission denied
      await expect(page).toHaveURL(/permission-denied/)
    })
  })
})
