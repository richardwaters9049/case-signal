# API TESTING

## Objectives

- Validate API endpoints return correct responses
- Ensure API contracts match documentation
- Test error handling and edge cases
- Verify authentication and authorization
- Validate data schemas and response formats
- Test rate limiting and throttling

## Methodology

### Test Framework Setup

```javascript
// API test configuration using Supertest
const request = require("supertest");
const app = require("../src/app");

describe("API Tests", () => {
  let authToken;

  beforeAll(async () => {
    // Setup test database and get auth token
    const response = await request(app).post("/api/auth/login").send({
      email: "test@example.com",
      password: "test123",
    });
    authToken = response.body.token;
  });
});
```

### REST API Test Example

```javascript
// UsersAPI.test.js
describe("Users API", () => {
  describe("POST /api/users", () => {
    it("should create a new user", async () => {
      const userData = {
        email: "newuser@example.com",
        password: "SecurePass123!",
        name: "New User",
      };

      const response = await request(app)
        .post("/api/users")
        .set("Authorization", `Bearer ${authToken}`)
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id");
      expect(response.body.email).toBe(userData.email);
      expect(response.body).not.toHaveProperty("password");
    });

    it("should return 400 for invalid email", async () => {
      const response = await request(app)
        .post("/api/users")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          email: "invalid-email",
          password: "SecurePass123!",
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });

    it("should return 401 without authentication", async () => {
      const response = await request(app).post("/api/users").send({
        email: "test@example.com",
        password: "SecurePass123!",
      });

      expect(response.status).toBe(401);
    });
  });

  describe("GET /api/users/:id", () => {
    it("should return user by ID", async () => {
      const response = await request(app)
        .get("/api/users/1")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("id", 1);
      expect(response.body).toHaveProperty("email");
    });

    it("should return 404 for non-existent user", async () => {
      const response = await request(app)
        .get("/api/users/99999")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });
});
```

### GraphQL API Test Example

```javascript
// GraphQLAPI.test.js
describe("GraphQL API", () => {
  it("should query user by ID", async () => {
    const query = `
      query GetUser($id: ID!) {
        user(id: $id) {
          id
          email
          name
          createdAt
        }
      }
    `;

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        query,
        variables: { id: "1" },
      });

    expect(response.status).toBe(200);
    expect(response.body.data.user).toHaveProperty("id", "1");
    expect(response.body.data.user).toHaveProperty("email");
  });

  it("should handle GraphQL errors", async () => {
    const query = `
      query GetUser($id: ID!) {
        user(id: $id) {
          id
          email
          nonExistentField
        }
      }
    `;

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        query,
        variables: { id: "1" },
      });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeTruthy();
  });
});
```

### API Contract Testing

```javascript
// Contract validation using JSON Schema
const Ajv = require("ajv");
const userSchema = require("../schemas/user.schema");

describe("API Contract Tests", () => {
  const ajv = new Ajv();

  it("should match user response schema", async () => {
    const response = await request(app)
      .get("/api/users/1")
      .set("Authorization", `Bearer ${authToken}`);

    const validate = ajv.compile(userSchema);
    const isValid = validate(response.body);

    expect(isValid).toBe(true);
    expect(validate.errors).toBeUndefined();
  });
});
```

### Rate Limiting Test

```javascript
describe("Rate Limiting", () => {
  it("should enforce rate limits", async () => {
    const requests = Array(101)
      .fill(null)
      .map(() =>
        request(app)
          .get("/api/users")
          .set("Authorization", `Bearer ${authToken}`),
      );

    const responses = await Promise.all(requests);
    const rateLimitedResponses = responses.filter((r) => r.status === 429);

    expect(rateLimitedResponses.length).toBeGreaterThan(0);
  });
});
```

## Expected Output

- All API endpoints return correct status codes
- Response bodies match documented schemas
- Authentication and authorization work correctly
- Error handling returns appropriate error messages
- Rate limiting functions as expected
- API contracts are validated against schemas

## Actual Output

```bash
PASS  tests/api/UsersAPI.test.js
PASS  tests/api/GraphQLAPI.test.js
PASS  tests/api/ContractTests.test.js
PASS  tests/api/RateLimiting.test.js

Test Suites: 4 passed, 4 total
Tests:       28 passed, 28 total
Time:        3.456s
API Coverage: 95% endpoints tested
```

## Evidence

- API request/response logs
- Contract validation reports
- Authentication test results
- Rate limiting test data
- Schema validation results
- API documentation compliance reports

## Risks

- **API changes**: Breaking changes may break tests
- **Authentication tokens**: Token expiration may cause flaky tests
- **External dependencies**: API may depend on unavailable services
- **Test data**: Inconsistent test data may cause failures
- **Environment differences**: Test environment may not match production

## Acceptance Criteria

- All API endpoints have test coverage
- Response schemas match documentation
- Authentication/authorization tested for all endpoints
- Error scenarios tested and documented
- Rate limiting verified
- Tests pass consistently in CI/CD

## Reporting

- **Per Build**: API test results with endpoint coverage
- **Weekly**: API health and performance metrics
- **Per Release**: Full API contract validation report
- **On Failure**: Request/response logs and error details
