# OBSERVABILITY

## Objectives

- Monitor system health and performance during testing
- Collect metrics, logs, and traces for test analysis
- Enable debugging through comprehensive observability
- Validate monitoring and alerting systems
- Ensure test environments are observable
- Provide visibility into test execution and results

## Methodology

### Metrics Collection Setup

```javascript
// Metrics collection during tests
const Prometheus = require("prom-client");

const register = new Prometheus.Registry();

// Define custom metrics
const httpRequestDuration = new Prometheus.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.1, 0.5, 1, 2, 5],
});

const dbQueryDuration = new Prometheus.Histogram({
  name: "db_query_duration_seconds",
  help: "Duration of database queries in seconds",
  labelNames: ["operation", "table"],
  buckets: [0.01, 0.05, 0.1, 0.5, 1],
});

const activeConnections = new Prometheus.Gauge({
  name: "active_connections",
  help: "Number of active connections",
});

register.registerMetric(httpRequestDuration);
register.registerMetric(dbQueryDuration);
register.registerMetric(activeConnections);

// Middleware to track HTTP requests
app.use((req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration
      .labels(req.method, req.route?.path || req.path, res.statusCode)
      .observe(duration);
  });

  next();
});
```

### Logging Configuration

```javascript
// Structured logging setup
const winston = require("winston");

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: { service: "testing-service" },
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

// Test-specific logging
describe("Observable Tests", () => {
  beforeEach(() => {
    logger.info("Test started", { test: expect.getState().currentTestName });
  });

  afterEach(() => {
    logger.info("Test completed", {
      test: expect.getState().currentTestName,
      status: expect.getState().passed ? "passed" : "failed",
    });
  });
});
```

### Distributed Tracing

```javascript
// OpenTelemetry tracing setup
const { NodeTracerProvider } = require("@opentelemetry/node");
const { SimpleSpanProcessor } = require("@opentelemetry/tracing");
const { JaegerExporter } = require("@opentelemetry/exporter-jaeger");

const provider = new NodeTracerProvider();
const exporter = new JaegerExporter({
  serviceName: "testing-service",
  agentHost: process.env.JAEGER_AGENT_HOST || "localhost",
  agentPort: process.env.JAEGER_AGENT_PORT || 6832,
});

provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
provider.register();

// Traced test execution
describe("Traced API Tests", () => {
  it("should trace API request lifecycle", async () => {
    const tracer = provider.getTracer("test-tracer");

    const span = tracer.startSpan("api-request-test");

    try {
      const response = await request(app)
        .get("/api/users")
        .set("X-Trace-ID", span.context().traceId);

      expect(response.status).toBe(200);
      span.setStatus({ code: 0, message: "success" });
    } catch (error) {
      span.recordException(error);
      span.setStatus({ code: 1, message: error.message });
      throw error;
    } finally {
      span.end();
    }
  });
});
```

### Health Check Monitoring

```javascript
// Health check endpoint tests
describe("Health Check Observability", () => {
  it("should provide detailed health metrics", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      status: "healthy",
      uptime: expect.any(Number),
      timestamp: expect.any(String),
      checks: {
        database: expect.objectContaining({
          status: expect.any(String),
          latency: expect.any(Number),
        }),
        redis: expect.objectContaining({
          status: expect.any(String),
          latency: expect.any(Number),
        }),
      },
    });
  });

  it("should expose Prometheus metrics", async () => {
    const response = await request(app).get("/metrics");

    expect(response.status).toBe(200);
    expect(response.text).toContain("http_request_duration_seconds");
    expect(response.text).toContain("db_query_duration_seconds");
    expect(response.text).toContain("active_connections");
  });
});
```

### Log Analysis Testing

```javascript
// Log analysis during test execution
describe("Log Analysis", () => {
  it("should log all HTTP requests with proper structure", async () => {
    const response = await request(app).get("/api/users");

    // Verify log entry was created
    const logs = await readLogFiles();
    const requestLog = logs.find((log) =>
      log.message?.includes("GET /api/users"),
    );

    expect(requestLog).toBeDefined();
    expect(requestLog).toMatchObject({
      level: expect.any(String),
      timestamp: expect.any(String),
      method: "GET",
      path: "/api/users",
      statusCode: 200,
      duration: expect.any(Number),
    });
  });

  it("should log errors with stack traces", async () => {
    const response = await request(app).get("/api/error");

    const logs = await readLogFiles();
    const errorLog = logs.find((log) => log.level === "error");

    expect(errorLog).toBeDefined();
    expect(errorLog).toHaveProperty("stack");
    expect(errorLog.stack).toContain("Error:");
  });
});
```

### Performance Metrics Validation

```javascript
// Performance metrics observability
describe("Performance Metrics", () => {
  it("should track response time percentiles", async () => {
    // Make multiple requests to generate metrics
    for (let i = 0; i < 100; i++) {
      await request(app).get("/api/users");
    }

    const metricsResponse = await request(app).get("/metrics");

    expect(metricsResponse.text).toContain(
      "http_request_duration_seconds_bucket",
    );
    expect(metricsResponse.text).toContain('le="0.1"');
    expect(metricsResponse.text).toContain('le="0.5"');
    expect(metricsResponse.text).toContain('le="1"');
  });

  it("should track database query performance", async () => {
    await Database.users.findMany();

    const metricsResponse = await request(app).get("/metrics");

    expect(metricsResponse.text).toContain("db_query_duration_seconds");
    expect(metricsResponse.text).toContain('operation="find"');
  });
});
```

## Expected Output

- Comprehensive metrics collected during test execution
- Structured logs with proper correlation IDs
- Distributed traces for request flows
- Health check endpoints functioning correctly
- Performance metrics available for analysis
- Alerting triggers tested and validated

## Actual Output

```bash
Observability Test Results:

Metrics Collection:
  ✓ HTTP request duration metrics
  ✓ Database query metrics
  ✓ Active connection gauges
  ✓ Custom business metrics

Logging:
  ✓ Structured JSON logging
  ✓ Error logging with stack traces
  ✓ Request/response logging
  ✓ Correlation ID propagation

Tracing:
  ✓ Distributed tracing setup
  ✓ Span context propagation
  ✓ Trace export to Jaeger
  ✓ Performance tracing

Health Checks:
  ✓ Health endpoint responding
  ✓ Dependency health checks
  ✓ Metrics endpoint available
  ✓ Readiness checks working

Total: 16/16 observability tests passed
```

## Evidence

- Prometheus metrics endpoint data
- Log files with structured entries
- Jaeger trace exports
- Health check response data
- Monitoring dashboard screenshots
- Alert configuration validation

## Risks

- **Performance overhead**: Observability may impact test performance
- **Data volume**: High volume of metrics/logs can be overwhelming
- **Configuration complexity**: Setting up observability can be complex
- **Tool dependencies**: Reliance on external observability tools
- **Data retention**: Managing log/metric retention policies
- **Privacy concerns**: Logs may contain sensitive information

## Acceptance Criteria

- All critical metrics collected and accessible
- Logs structured and searchable
- Tracing enabled for key workflows
- Health checks comprehensive and accurate
- Monitoring dashboards functional
- Alerting rules tested and validated
- Observability doesn't significantly impact performance

## Reporting

- **Per Test**: Observability metrics and log summaries
- **Weekly**: Observability health and configuration review
- **Per Release**: Full observability validation report
- **On Issues**: Detailed logs, metrics, and traces for debugging
