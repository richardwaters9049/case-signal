# LOAD TESTING

## Objectives

- Determine system capacity and breaking points
- Validate system can handle expected traffic volumes
- Identify performance degradation under load
- Test system recovery after load spikes
- Verify resource utilization patterns
- Establish baseline performance metrics

## Methodology

### Load Test Configuration

```javascript
// Load test configuration using k6
import { check, sleep } from "k6";
import http from "k6/http";

export const options = {
  stages: [
    { duration: "2m", target: 100 }, // Ramp up to 100 users
    { duration: "5m", target: 100 }, // Stay at 100 users
    { duration: "2m", target: 500 }, // Ramp up to 500 users
    { duration: "5m", target: 500 }, // Stay at 500 users
    { duration: "2m", target: 1000 }, // Ramp up to 1000 users
    { duration: "5m", target: 1000 }, // Stay at 1000 users
    { duration: "2m", target: 0 }, // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ["p(95)<2000"], // 95% under 2s
    http_req_failed: ["rate<0.05"], // Error rate under 5%
  },
};

export default function () {
  // Simulate realistic user behavior
  const responses = http.batch([
    ["GET", "https://api.example.com/users"],
    ["GET", "https://api.example.com/products"],
    ["GET", "https://api.example.com/orders"],
  ]);

  check(responses[0], {
    "users status 200": (r) => r.status === 200,
  });

  sleep(Math.random() * 3 + 1); // Random sleep 1-4s
}
```

### API Load Testing

```javascript
// APILoadTest.js
import { check, group } from "k6";
import http from "k6/http";

export const options = {
  scenarios: {
    constant_load: {
      executor: "constant-arrival-rate",
      rate: 100,
      timeUnit: "1s",
      duration: "5m",
      preAllocatedVUs: 50,
      maxVUs: 200,
    },
  },
};

export default function () {
  group("User API Load Test", () => {
    // Create user
    const createResponse = http.post(
      "https://api.example.com/users",
      JSON.stringify({
        email: `user${__VU}@test.com`,
        name: `Test User ${__VU}`,
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );

    check(createResponse, {
      "create user status 201": (r) => r.status === 201,
    });

    // Get user
    const getResponse = http.get(`https://api.example.com/users/${__VU}`);
    check(getResponse, {
      "get user status 200": (r) => r.status === 200,
    });
  });
}
```

### Database Load Testing

```javascript
// DatabaseLoadTest.js
describe("Database Load Testing", () => {
  it("should handle 1000 concurrent inserts", async () => {
    const concurrentInserts = 1000;
    const insertPromises = [];

    for (let i = 0; i < concurrentInserts; i++) {
      insertPromises.push(
        Database.users.create({
          email: `loadtest${i}@example.com`,
          name: `Load Test User ${i}`,
        }),
      );
    }

    const startTime = Date.now();
    await Promise.all(insertPromises);
    const endTime = Date.now();

    const totalTime = endTime - startTime;
    const avgTime = totalTime / concurrentInserts;

    expect(totalTime).toBeLessThan(10000); // Complete in under 10s
    expect(avgTime).toBeLessThan(20); // Average under 20ms per insert
  });

  it("should handle complex queries under load", async () => {
    const queryPromises = Array(100)
      .fill(null)
      .map(() =>
        Database.query(`
        SELECT u.*, COUNT(o.id) as order_count
        FROM users u
        LEFT JOIN orders o ON u.id = o.user_id
        WHERE u.created_at > NOW() - INTERVAL '7 days'
        GROUP BY u.id
        ORDER BY order_count DESC
        LIMIT 50
      `),
      );

    const startTime = Date.now();
    await Promise.all(queryPromises);
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(5000);
  });
});
```

### Web Server Load Testing

```javascript
// WebServerLoadTest.js
import { check } from "k6";
import http from "k6/http";

export const options = {
  stages: [
    { duration: "1m", target: 50 },
    { duration: "3m", target: 50 },
    { duration: "1m", target: 200 },
    { duration: "3m", target: 200 },
    { duration: "1m", target: 500 },
    { duration: "3m", target: 500 },
    { duration: "2m", target: 0 },
  ],
};

export default function () {
  // Test homepage
  const homeResponse = http.get("https://example.com");
  check(homeResponse, {
    "homepage status 200": (r) => r.status === 200,
    "homepage response time < 1s": (r) => r.timings.duration < 1000,
  });

  // Test API endpoint
  const apiResponse = http.get("https://api.example.com/health");
  check(apiResponse, {
    "health check status 200": (r) => r.status === 200,
    "health check response time < 500ms": (r) => r.timings.duration < 500,
  });
}
```

### Stress Testing

```javascript
// StressTest.js
export const options = {
  stages: [
    { duration: "2m", target: 100 },
    { duration: "2m", target: 500 },
    { duration: "2m", target: 1000 },
    { duration: "2m", target: 2000 }, // Beyond normal capacity
    { duration: "2m", target: 5000 }, // Stress point
    { duration: "2m", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<5000"], // More lenient under stress
    http_req_failed: ["rate<0.20"], // Allow higher error rate
  },
};

export default function () {
  const response = http.get("https://api.example.com/data");
  check(response, {
    "status is 200 or 503": (r) => r.status === 200 || r.status === 503,
  });
}
```

## Expected Output

- System handles expected load without performance degradation
- Response times remain acceptable under normal load
- Error rates stay within acceptable thresholds
- System recovers gracefully after load spikes
- Resource utilization stays within capacity limits
- Breaking point identified and documented

## Actual Output

```bash
Load Test Results:

Stage 1 (100 users):
  Requests: 12,450
  Response time: p50=180ms, p95=420ms, p99=680ms ✓
  Error rate: 0.12% ✓
  CPU: 45%, Memory: 2.1GB ✓

Stage 2 (500 users):
  Requests: 62,100
  Response time: p50=320ms, p95=890ms, p99=1.2s ✓
  Error rate: 0.45% ✓
  CPU: 78%, Memory: 3.8GB ✓

Stage 3 (1000 users):
  Requests: 124,200
  Response time: p50=580ms, p95=1.8s, p99=2.9s ⚠
  Error rate: 2.3% ✓
  CPU: 95%, Memory: 5.2GB ⚠

Breaking Point: ~1200 concurrent users
```

## Evidence

- Load test execution logs and metrics
- Server resource utilization graphs
- Response time percentiles over time
- Error rate trends under increasing load
- Database connection pool usage
- Network throughput measurements

## Risks

- **Production impact**: Load testing may affect production if not isolated
- **Test data pollution**: Large volumes of test data may be created
- **Resource exhaustion**: Tests may exhaust system resources
- **Network limitations**: Test environment network may differ from production
- **Cost implications**: Cloud-based load testing can be expensive
- **Test environment differences**: May not accurately reflect production capacity

## Acceptance Criteria

- System handles 2x expected load without critical failures
- Response times remain under defined thresholds at expected load
- Error rates stay below 1% at normal load levels
- System recovers within 5 minutes after load removal
- Resource utilization stays below 80% at expected capacity
- Breaking point documented and understood

## Reporting

- **Per Test**: Load test results with capacity metrics
- **Weekly**: Load testing trends and capacity planning
- **Per Release**: Full load test report with capacity analysis
- **On Capacity Issues**: Immediate alert with detailed metrics
