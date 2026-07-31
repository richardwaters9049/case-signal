# UI TESTING

## Objectives

- Verify user interface components render correctly
- Test user interactions and workflows
- Validate responsive design across devices
- Ensure accessibility standards are met
- Test visual consistency and styling
- Verify form validation and error handling

## Methodology

### Test Framework Setup

```javascript
// Playwright configuration
const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests/ui",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
    },
  ],
});
```

### Component Testing Example

```javascript
// LoginForm.test.js
import { test, expect } from "@playwright/test";

test.describe("Login Form", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("should render login form", async ({ page }) => {
    await expect(page.locator("form")).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("should show validation error for invalid email", async ({ page }) => {
    await page.fill('input[name="email"]', "invalid-email");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');

    await expect(page.locator(".error-message")).toBeVisible();
    await expect(page.locator(".error-message")).toContainText("Invalid email");
  });

  test("should login successfully with valid credentials", async ({ page }) => {
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "SecurePass123!");
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL("/dashboard");
    await expect(page.locator("h1")).toContainText("Welcome");
  });
});
```

### User Workflow Testing

```javascript
// UserRegistrationFlow.test.js
test.describe("User Registration Flow", () => {
  test("should complete full registration process", async ({ page }) => {
    await page.goto("/");

    // Navigate to registration
    await page.click("text=Sign Up");
    await expect(page).toHaveURL("/register");

    // Fill registration form
    await page.fill('input[name="name"]', "Test User");
    await page.fill('input[name="email"]', "newuser@example.com");
    await page.fill('input[name="password"]', "SecurePass123!");
    await page.fill('input[name="confirmPassword"]', "SecurePass123!");

    // Submit form
    await page.click('button[type="submit"]');

    // Verify success
    await expect(page.locator(".success-message")).toBeVisible();
    await expect(page).toHaveURL("/login");
  });

  test("should handle password mismatch", async ({ page }) => {
    await page.goto("/register");

    await page.fill('input[name="name"]', "Test User");
    await page.fill('input[name="email"]', "newuser@example.com");
    await page.fill('input[name="password"]', "SecurePass123!");
    await page.fill('input[name="confirmPassword"]', "DifferentPass123!");

    await page.click('button[type="submit"]');

    await expect(page.locator(".error-message")).toBeVisible();
    await expect(page.locator(".error-message")).toContainText(
      "Passwords do not match",
    );
  });
});
```

### Responsive Design Testing

```javascript
// ResponsiveDesign.test.js
test.describe("Responsive Design", () => {
  test("should display correctly on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    // Mobile navigation should be hamburger menu
    await expect(page.locator(".mobile-menu")).toBeVisible();
    await expect(page.locator(".desktop-nav")).not.toBeVisible();
  });

  test("should display correctly on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/");

    // Desktop navigation should be visible
    await expect(page.locator(".desktop-nav")).toBeVisible();
    await expect(page.locator(".mobile-menu")).not.toBeVisible();
  });

  test("should handle tablet layout", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");

    // Tablet-specific layout
    await expect(page.locator(".tablet-layout")).toBeVisible();
  });
});
```

### Accessibility Testing

```javascript
// Accessibility.test.js
import { test, expect } from "@playwright/test";

test.describe("Accessibility", () => {
  test("should have proper ARIA labels", async ({ page }) => {
    await page.goto("/login");

    const emailInput = page.locator('input[name="email"]');
    await expect(emailInput).toHaveAttribute("aria-label", "Email address");

    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toHaveAttribute(
      "aria-label",
      "Submit login form",
    );
  });

  test("should be keyboard navigable", async ({ page }) => {
    await page.goto("/login");

    // Tab through form
    await page.keyboard.press("Tab");
    await expect(page.locator('input[name="email"]')).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(page.locator('input[name="password"]')).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(page.locator('button[type="submit"]')).toBeFocused();
  });

  test("should have sufficient color contrast", async ({ page }) => {
    await page.goto("/");

    // Check contrast ratios (using axe-core)
    const accessibilityScanResults = await page.accessibility.scan();
    expect(accessibilityScanResults.violations).toHaveLength(0);
  });
});
```

### Visual Regression Testing

```javascript
// VisualRegression.test.js
test.describe("Visual Regression", () => {
  test("should match dashboard screenshot", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveScreenshot("dashboard.png");
  });

  test("should match login form screenshot", async ({ page }) => {
    await page.goto("/login");

    await expect(page.locator("form")).toHaveScreenshot("login-form.png");
  });
});
```

## Expected Output

- All UI components render correctly across browsers
- User interactions work as expected
- Responsive design functions on all device sizes
- Accessibility standards are met (WCAG 2.1 AA)
- Visual consistency maintained across pages
- Forms validate input correctly

## Actual Output

```bash
Running 15 tests using 5 workers

  ✓ [chromium] LoginForm.test.js:9:3 › should render login form (1.2s)
  ✓ [firefox] LoginForm.test.js:15:3 › should show validation error (1.5s)
  ✓ [webkit] LoginForm.test.js:24:3 › should login successfully (2.1s)
  ✓ [chromium] UserRegistrationFlow.test.js:8:3 › should complete registration (3.4s)
  ✓ [Mobile Chrome] ResponsiveDesign.test.js:8:3 › mobile layout (1.8s)
  ✓ [chromium] Accessibility.test.js:8:3 › ARIA labels (0.9s)
  ✓ [chromium] VisualRegression.test.js:8:3 › dashboard screenshot (2.3s)

  15 passed (15.6s)
```

## Evidence

- Screenshot comparisons for visual regression
- Accessibility audit reports
- Cross-browser test results
- Responsive design validation logs
- User interaction recordings
- Form validation test results

## Risks

- **Browser updates**: Browser changes may break tests
- **Dynamic content**: Changing content may cause flaky tests
- **Timing issues**: Async operations may cause intermittent failures
- **Visual differences**: Minor rendering differences may fail tests
- **Maintenance overhead**: Keeping screenshots updated can be time-consuming

## Acceptance Criteria

- All critical user workflows tested
- Cross-browser compatibility verified
- Accessibility standards met
- Responsive design validated
- Visual regression tests passing
- Forms properly validated
- Tests run reliably in CI/CD

## Reporting

- **Per Build**: UI test results with browser coverage
- **Weekly**: Cross-browser compatibility report
- **Per Release**: Full visual regression report
- **On Failure**: Screenshots and interaction logs
