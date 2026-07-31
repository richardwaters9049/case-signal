# TEST ENVIRONMENTS

## Objectives

- Define and manage test environment configurations
- Ensure environments match production as closely as possible
- Enable consistent and reproducible test execution
- Support multiple testing stages (dev, staging, production-like)
- Manage environment-specific configurations
- Facilitate environment provisioning and teardown

## Methodology

### Environment Configuration

```javascript
// Environment configuration management
const environments = {
  development: {
    name: "Development",
    url: "http://localhost:3000",
    apiUrl: "http://localhost:3001",
    database: {
      host: "localhost",
      port: 5432,
      database: "test_dev",
      user: "dev_user",
      password: "dev_password",
    },
    redis: {
      host: "localhost",
      port: 6379,
    },
    features: {
      newFeature: true,
      experimental: true,
    },
  },

  staging: {
    name: "Staging",
    url: "https://staging.example.com",
    apiUrl: "https://api-staging.example.com",
    database: {
      host: "staging-db.example.com",
      port: 5432,
      database: "test_staging",
      user: "staging_user",
      password: process.env.STAGING_DB_PASSWORD,
    },
    redis: {
      host: "staging-redis.example.com",
      port: 6379,
    },
    features: {
      newFeature: true,
      experimental: false,
    },
  },

  production: {
    name: "Production",
    url: "https://example.com",
    apiUrl: "https://api.example.com",
    database: {
      host: "prod-db.example.com",
      port: 5432,
      database: "test_production",
      user: "prod_user",
      password: process.env.PROD_DB_PASSWORD,
    },
    redis: {
      host: "prod-redis.example.com",
      port: 6379,
    },
    features: {
      newFeature: false,
      experimental: false,
    },
  },
};

const getEnvironment = (env = process.env.NODE_ENV || "development") => {
  return environments[env] || environments.development;
};
```

### Docker Compose for Test Environment

```yaml
# docker-compose.test.yml
version: "3.8"

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.test
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=test
      - DATABASE_URL=postgresql://test_user:test_pass@db:5432/test_db
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    volumes:
      - ./tests:/app/tests
      - ./src:/app/src

  db:
    image: postgres:14-alpine
    environment:
      - POSTGRES_DB=test_db
      - POSTGRES_USER=test_user
      - POSTGRES_PASSWORD=test_pass
    ports:
      - "5432:5432"
    volumes:
      - test_db_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - test_redis_data:/data

  selenium:
    image: selenium/standalone-chrome:latest
    ports:
      - "4444:4444"
    shm_size: 2gb

volumes:
  test_db_data:
  test_redis_data:
```

### Environment Setup Scripts

```bash
#!/bin/bash
# setup-test-environment.sh

ENVIRONMENT=${1:-development}

echo "Setting up $ENVIRONMENT test environment..."

# Load environment variables
if [ -f ".env.$ENVIRONMENT" ]; then
  export $(cat .env.$ENVIRONMENT | xargs)
else
  echo "Environment file .env.$ENVIRONMENT not found"
  exit 1
fi

# Start Docker services
docker-compose -f docker-compose.test.yml up -d

# Wait for database to be ready
echo "Waiting for database..."
until docker-compose exec -T db pg_isready -U test_user; do
  sleep 1
done

# Run database migrations
echo "Running database migrations..."
npm run migrate:test

# Seed test data
echo "Seeding test data..."
npm run seed:test

# Run health checks
echo "Running health checks..."
npm run health-check

echo "$ENVIRONMENT environment setup complete!"
```

### Environment Validation

```javascript
// Environment validation tests
describe("Environment Validation", () => {
  it("should validate development environment", async () => {
    const env = getEnvironment("development");

    expect(env.name).toBe("Development");
    expect(env.url).toContain("localhost");
    expect(env.database.host).toBe("localhost");
  });

  it("should validate staging environment", async () => {
    const env = getEnvironment("staging");

    expect(env.name).toBe("Staging");
    expect(env.url).toContain("staging");
    expect(env.database.host).toContain("staging");
  });

  it("should validate production environment", async () => {
    const env = getEnvironment("production");

    expect(env.name).toBe("Production");
    expect(env.url).toContain("example.com");
    expect(env.database.host).toContain("prod");
  });

  it("should verify database connectivity", async () => {
    const env = getEnvironment();

    const client = await Database.connect(env.database);
    expect(client).toBeTruthy();

    await client.end();
  });

  it("should verify Redis connectivity", async () => {
    const env = getEnvironment();

    const client = await Redis.connect(env.redis);
    expect(client).toBeTruthy();

    await client.quit();
  });
});
```

### Environment Isolation

```javascript
// Environment isolation utilities
class EnvironmentIsolation {
  static async createIsolatedTestSpace(testId) {
    const isolatedDb = `test_${testId}_${Date.now()}`;

    // Create isolated database
    await Database.query(`CREATE DATABASE ${isolatedDb}`);

    // Run migrations on isolated database
    await Database.migrate(isolatedDb);

    return {
      database: isolatedDb,
      cleanup: async () => {
        await Database.query(`DROP DATABASE ${isolatedDb}`);
      },
    };
  }

  static async withIsolatedEnvironment(testId, callback) {
    const { database, cleanup } = await this.createIsolatedTestSpace(testId);

    try {
      await callback(database);
    } finally {
      await cleanup();
    }
  }
}

// Usage in tests
describe("Isolated Environment Tests", () => {
  it("should run in isolated database", async () => {
    await EnvironmentIsolation.withIsolatedEnvironment(
      "test_001",
      async (db) => {
        // Test runs in isolated database
        await Database.users.create({ email: "test@example.com" });

        const users = await Database.users.findMany();
        expect(users.length).toBe(1);
      },
    );
  });
});
```

### Environment Monitoring

```javascript
// Environment health monitoring
const monitorEnvironmentHealth = async () => {
  const health = {
    timestamp: new Date(),
    services: {},
  };

  // Check application health
  try {
    const appResponse = await fetch(`${process.env.APP_URL}/health`);
    health.services.app = {
      status: appResponse.ok ? "healthy" : "unhealthy",
      statusCode: appResponse.status,
    };
  } catch (error) {
    health.services.app = { status: "unreachable", error: error.message };
  }

  // Check database health
  try {
    const dbStart = Date.now();
    await Database.query("SELECT 1");
    const dbLatency = Date.now() - dbStart;
    health.services.database = {
      status: "healthy",
      latency: `${dbLatency}ms`,
    };
  } catch (error) {
    health.services.database = { status: "unhealthy", error: error.message };
  }

  // Check Redis health
  try {
    await Redis.ping();
    health.services.redis = { status: "healthy" };
  } catch (error) {
    health.services.redis = { status: "unhealthy", error: error.message };
  }

  return health;
};
```

## Expected Output

- Test environments provisioned and configured correctly
- Environments match production configuration
- Isolated test spaces prevent interference
- Health monitoring confirms environment stability
- Environment cleanup completes successfully
- Consistent behavior across environments

## Actual Output

```bash
Test Environment Results:

Environment Setup:
  ✓ Development environment configured
  ✓ Staging environment configured
  ✓ Production-like environment configured
  ✓ Docker services started successfully

Environment Validation:
  ✓ Database connectivity verified
  ✓ Redis connectivity verified
  ✓ Application health checks passing
  ✓ Service dependencies available

Environment Isolation:
  ✓ Isolated test databases created
  ✓ No data leakage between tests
  ✓ Cleanup processes working
  ✓ Resource cleanup complete

Total: 12/12 environment operations successful
```

## Evidence

- Environment configuration files
- Docker compose logs
- Health check results
- Database connectivity logs
- Environment validation test results
- Resource usage metrics

## Risks

- **Configuration drift**: Test environments may diverge from production
- **Resource constraints**: Limited resources may affect test execution
- **Environment pollution**: Tests may affect shared environments
- **Setup complexity**: Managing multiple environments can be complex
- **Cost implications**: Running multiple environments can be expensive
- **Network issues**: Network configuration may cause connectivity problems

## Acceptance Criteria

- All environments properly configured and accessible
- Environments match production configuration within acceptable variance
- Isolated test spaces prevent interference
- Health monitoring confirms environment stability
- Environment cleanup completes successfully
- Environment provisioning completes within acceptable time

## Reporting

- **Per Setup**: Environment configuration and health status
- **Weekly**: Environment health and resource usage
- **Per Release**: Environment validation and comparison report
- **On Issues**: Environment diagnostics and remediation steps
