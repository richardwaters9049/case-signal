# INTEGRATION TESTING

## Objectives

- Verify that different modules/services work together correctly
- Test interactions between components through their interfaces
- Identify issues in data flow between integrated systems
- Validate API contracts and database integration
- Ensure external dependencies behave as expected

## Methodology

### Test Environment Setup

```javascript
// Integration test configuration
module.exports = {
  testEnvironment: "node",
  setupFilesAfterEnv: ["./tests/integration/setup.js"],
  testMatch: ["**/tests/integration/**/*.test.js"],
  globalSetup: "./tests/integration/global-setup.js",
  globalTeardown: "./tests/integration/global-teardown.js",
};
```

### Database Integration Test Example

```javascript
// UserIntegration.test.js
describe("User Service Integration", () => {
  beforeAll(async () => {
    // Setup test database
    await Database.connect(process.env.TEST_DB_URL);
    await Database.migrate();
  });

  afterAll(async () => {
    // Cleanup test database
    await Database.close();
  });

  beforeEach(async () => {
    // Clear test data before each test
    await Database.truncate("users");
    await Database.truncate("sessions");
  });

  describe("User Registration Flow", () => {
    it("should create user and session in database", async () => {
      const userData = {
        email: "integration@test.com",
        password: "SecurePass123!",
      };

      const result = await UserService.register(userData);

      // Verify user in database
      const user = await Database.users.findOne({
        where: { email: userData.email },
      });
      expect(user).toBeTruthy();
      expect(user.email).toBe(userData.email);

      // Verify session created
      const session = await Database.sessions.findOne({
        where: { userId: user.id },
      });
      expect(session).toBeTruthy();
    });

    it("should handle database constraint violations", async () => {
      const userData = {
        email: "duplicate@test.com",
        password: "SecurePass123!",
      };

      // First registration succeeds
      await UserService.register(userData);

      // Second registration fails
      await expect(UserService.register(userData)).rejects.toThrow(
        "Duplicate entry",
      );
    });
  });
});
```

### API Integration Test Example

```javascript
// APIIntegration.test.js
describe("API Integration Tests", () => {
  let app;

  beforeAll(async () => {
    app = await createTestApp();
    await Database.seed("test-data");
  });

  afterAll(async () => {
    await app.close();
  });

  describe("User API Endpoints", () => {
    it("should complete full user lifecycle through API", async () => {
      // Create user
      const createResponse = await request(app).post("/api/users").send({
        email: "api@test.com",
        password: "SecurePass123!",
      });

      expect(createResponse.status).toBe(201);
      const userId = createResponse.body.id;

      // Fetch user
      const getResponse = await request(app).get(`/api/users/${userId}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.email).toBe("api@test.com");

      // Update user
      const updateResponse = await request(app)
        .put(`/api/users/${userId}`)
        .send({ name: "Updated Name" });

      expect(updateResponse.status).toBe(200);

      // Delete user
      const deleteResponse = await request(app).delete(`/api/users/${userId}`);

      expect(deleteResponse.status).toBe(204);
    });
  });
});
```

### External Service Integration

```javascript
// PaymentServiceIntegration.test.js
describe("Payment Service Integration", () => {
  it("should process payment with Stripe", async () => {
    const paymentData = {
      amount: 1000,
      currency: "usd",
      token: "tok_visa",
    };

    // Mock Stripe in test environment
    const stripeMock = mockStripeService();
    stripeMock.charge.mockResolvedValue({
      id: "ch_1234567890",
      status: "succeeded",
    });

    const result = await PaymentService.process(paymentData);

    expect(result.status).toBe("succeeded");
    expect(stripeMock.charge).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 1000,
        currency: "usd",
      }),
    );
  });
});
```

## Expected Output

- All integration tests pass with real database connections
- Data consistency verified across multiple tables
- API contracts validated against actual implementations
- External service interactions properly mocked or tested
- Test execution completes within reasonable time (under 2 minutes)

## Actual Output

```bash
PASS  tests/integration/UserService.test.js
PASS  tests/integration/APIIntegration.test.js
PASS  tests/integration/PaymentService.test.js

Test Suites: 3 passed, 3 total
Tests:       12 passed, 12 total
Time:        1m 45.234s
Database:    PostgreSQL (test)
External APIs: Mocked
```

## Evidence

- Database state verification logs
- API request/response captures
- External service call logs
- Integration test execution reports
- Data consistency validation results

## Risks

- **Test data pollution**: Tests may interfere with each other
- **External dependencies**: Third-party services may be unavailable
- **Environment differences**: Test environment may not match production
- **Slow execution**: Database operations can be slow
- **Complex setup**: Managing test data can be challenging

## Acceptance Criteria

- All integration tests pass consistently
- Database is properly cleaned between tests
- API contracts match documentation
- External services are properly mocked or tested
- Tests complete within time limits
- No data leakage between test runs

## Reporting

- **Per Build**: Integration test results with database state
- **Weekly**: Integration test health and performance metrics
- **Per Release**: Full integration test suite report
- **On Failure**: Database state dump and API logs for debugging
