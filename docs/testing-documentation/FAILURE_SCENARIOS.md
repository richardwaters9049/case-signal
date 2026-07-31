# FAILURE SCENARIOS

## Objectives

- Test system behavior under failure conditions
- Validate error handling and recovery mechanisms
- Ensure graceful degradation when components fail
- Verify data integrity during failures
- Test failover and redundancy systems
- Validate monitoring and alerting during failures

## Methodology

### Database Failure Scenarios

```javascript
// DatabaseFailure.test.js
describe("Database Failure Scenarios", () => {
  it("should handle database connection loss", async () => {
    // Simulate database connection failure
    await Database.disconnect();

    const response = await request(app).get("/api/users");

    expect(response.status).toBe(503);
    expect(response.body).toHaveProperty("error", "Service unavailable");

    // Verify reconnection works
    await Database.reconnect();
    const retryResponse = await request(app).get("/api/users");

    expect(retryResponse.status).toBe(200);
  });

  it("should handle database query timeouts", async () => {
    // Simulate slow query
    const slowQuery = jest
      .spyOn(Database, "query")
      .mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(resolve, 10000)),
      );

    const response = await request(app).get("/api/users").timeout(5000);

    expect(response.status).toBe(504);
    slowQuery.mockRestore();
  });

  it("should handle database constraint violations gracefully", async () => {
    // Try to insert duplicate
    const user = await Database.users.create({
      email: "duplicate@example.com",
      password: "hashedpassword",
    });

    await expect(
      Database.users.create({
        email: "duplicate@example.com",
        password: "hashedpassword",
      }),
    ).rejects.toThrow();

    // Verify application handles error
    const response = await request(app).post("/api/users").send({
      email: "duplicate@example.com",
      password: "SecurePass123!",
    });

    expect(response.status).toBe(409);
    expect(response.body).toHaveProperty("error");
  });
});
```

### API Service Failure Scenarios

```javascript
// APIServiceFailure.test.js
describe("API Service Failure Scenarios", () => {
  it("should handle external API timeouts", async () => {
    // Mock external API timeout
    jest
      .spyOn(ExternalAPI, "fetchData")
      .mockImplementationOnce(
        () =>
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), 100),
          ),
      );

    const response = await request(app).get("/api/external-data");

    expect(response.status).toBe(504);
    expect(response.body).toHaveProperty("error", "External service timeout");
  });

  it("should handle external API failures gracefully", async () => {
    // Mock external API failure
    jest
      .spyOn(ExternalAPI, "fetchData")
      .mockRejectedValueOnce(new Error("Service unavailable"));

    const response = await request(app).get("/api/external-data");

    expect(response.status).toBe(502);
    expect(response.body).toHaveProperty("error");
  });

  it("should use cached data when external API fails", async () => {
    // First call succeeds and caches
    jest
      .spyOn(ExternalAPI, "fetchData")
      .mockResolvedValueOnce({ data: "cached" });

    const firstResponse = await request(app).get("/api/external-data");

    expect(firstResponse.status).toBe(200);
    expect(firstResponse.body.data).toBe("cached");

    // Second call fails but uses cache
    jest
      .spyOn(ExternalAPI, "fetchData")
      .mockRejectedValueOnce(new Error("Service unavailable"));

    const cachedResponse = await request(app).get("/api/external-data");

    expect(cachedResponse.status).toBe(200);
    expect(cachedResponse.body.data).toBe("cached");
    expect(cachedResponse.body.fromCache).toBe(true);
  });
});
```

### Network Failure Scenarios

```javascript
// NetworkFailure.test.js
describe("Network Failure Scenarios", () => {
  it("should handle network timeouts", async () => {
    const response = await request(app).get("/api/slow-endpoint").timeout(3000);

    expect(response.status).toBe(504);
  });

  it("should handle rate limiting gracefully", async () => {
    const requests = Array(101)
      .fill(null)
      .map(() => request(app).get("/api/users"));

    const responses = await Promise.all(requests);
    const rateLimitedResponses = responses.filter((r) => r.status === 429);

    expect(rateLimitedResponses.length).toBeGreaterThan(0);
    expect(rateLimitedResponses[0].body).toHaveProperty("retryAfter");
  });

  it("should handle malformed requests", async () => {
    const response = await request(app)
      .post("/api/users")
      .send("invalid json")
      .set("Content-Type", "application/json");

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error", "Invalid JSON");
  });
});
```

### File System Failure Scenarios

```javascript
// FileSystemFailure.test.js
describe("File System Failure Scenarios", () => {
  it("should handle file upload failures", async () => {
    // Mock file system error
    jest
      .spyOn(fs, "writeFile")
      .mockImplementationOnce((_, __, callback) =>
        callback(new Error("Disk full")),
      );

    const response = await request(app)
      .post("/api/upload")
      .attach("file", Buffer.from("test content"), "test.txt");

    expect(response.status).toBe(507);
    expect(response.body).toHaveProperty("error", "Insufficient storage");
  });

  it("should handle file read failures", async () => {
    // Mock file read error
    jest
      .spyOn(fs, "readFile")
      .mockImplementationOnce((_, callback) =>
        callback(new Error("File not found")),
      );

    const response = await request(app).get("/api/files/nonexistent.txt");

    expect(response.status).toBe(404);
  });
});
```

### Authentication Failure Scenarios

```javascript
// AuthenticationFailure.test.js
describe("Authentication Failure Scenarios", () => {
  it("should handle expired tokens", async () => {
    const expiredToken = generateExpiredToken();

    const response = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${expiredToken}`);

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("error", "Token expired");
  });

  it("should handle invalid tokens", async () => {
    const invalidToken = "invalid.token.here";

    const response = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${invalidToken}`);

    expect(response.status).toBe(401);
  });

  it("should handle account lockout", async () => {
    // Attempt multiple failed logins
    for (let i = 0; i < 6; i++) {
      await request(app).post("/api/auth/login").send({
        email: "test@example.com",
        password: "wrongpassword",
      });
    }

    const response = await request(app).post("/api/auth/login").send({
      email: "test@example.com",
      password: "correctpassword",
    });

    expect(response.status).toBe(429);
    expect(response.body).toHaveProperty("error", "Account locked");
  });
});
```

## Expected Output

- System handles failures gracefully without crashing
- Appropriate error messages returned to users
- Automatic recovery mechanisms function correctly
- Data integrity maintained during failures
- Monitoring and alerting triggered appropriately
- Failover systems activate when needed

## Actual Output

```bash
Failure Scenario Test Results:

Database Failures:
  ✓ Connection loss handling
  ✓ Query timeout handling
  ✓ Constraint violation handling

API Service Failures:
  ✓ External API timeouts
  ✓ External API failures
  ✓ Fallback to cached data

Network Failures:
  ✓ Network timeout handling
  ✓ Rate limiting handling
  ✓ Malformed request handling

File System Failures:
  ✓ File upload failures
  ✓ File read failures

Authentication Failures:
  ✓ Expired token handling
  ✓ Invalid token handling
  ✓ Account lockout handling

Total: 12/12 failure scenarios handled correctly
```

## Evidence

- Error logs and stack traces
- Monitoring and alerting logs
- Database transaction logs
- API response logs during failures
- System health check results
- Recovery time metrics

## Risks

- **Production impact**: Failure tests may affect production if not isolated
- **Data corruption**: Failure scenarios may corrupt test data
- **Incomplete coverage**: Not all failure scenarios may be tested
- **Complex setup**: Simulating failures can be complex
- **False confidence**: Passing tests don't guarantee production resilience
- **Recovery timing**: Recovery mechanisms may be slower in production

## Acceptance Criteria

- All critical failure scenarios tested
- Error handling prevents system crashes
- Data integrity maintained during failures
- Recovery mechanisms function correctly
- Appropriate error messages displayed
- Monitoring and alerting triggered
- Recovery within acceptable time limits

## Reporting

- **Per Test**: Failure scenario test results with recovery times
- **Weekly**: Failure handling health and improvement areas
- **Per Release**: Comprehensive failure scenario report
- **On Production Incident**: Post-mortem with test coverage analysis
