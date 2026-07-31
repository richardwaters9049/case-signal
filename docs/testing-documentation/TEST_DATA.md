# TEST DATA

## Objectives

- Define test data requirements and management
- Ensure consistent and reliable test data
- Support various test scenarios with appropriate data
- Manage test data lifecycle (creation, usage, cleanup)
- Maintain data integrity across test environments
- Enable test data reproducibility and versioning

## Methodology

### Test Data Management Strategy

```javascript
// Test data factory pattern
class TestDataFactory {
  static createUser(overrides = {}) {
    return {
      email: overrides.email || `test${Date.now()}@example.com`,
      password: overrides.password || "SecurePass123!",
      name: overrides.name || "Test User",
      role: overrides.role || "user",
      createdAt: new Date(),
      ...overrides,
    };
  }

  static createOrder(overrides = {}) {
    return {
      userId: overrides.userId || 1,
      total: overrides.total || 100,
      status: overrides.status || "pending",
      items: overrides.items || [{ productId: 1, quantity: 1, price: 100 }],
      createdAt: new Date(),
      ...overrides,
    };
  }

  static createProduct(overrides = {}) {
    return {
      name: overrides.name || "Test Product",
      price: overrides.price || 99.99,
      description: overrides.description || "Test description",
      stock: overrides.stock || 10,
      ...overrides,
    };
  }
}
```

### Database Seeding

```javascript
// Database seeding for tests
const seedTestData = async () => {
  // Clear existing test data
  await Database.truncate("users");
  await Database.truncate("orders");
  await Database.truncate("products");

  // Seed test users
  const users = [
    TestDataFactory.createUser({ email: "admin@example.com", role: "admin" }),
    TestDataFactory.createUser({ email: "user@example.com", role: "user" }),
    TestDataFactory.createUser({ email: "guest@example.com", role: "guest" }),
  ];

  for (const user of users) {
    await Database.users.create(user);
  }

  // Seed test products
  const products = [
    TestDataFactory.createProduct({ name: "Product A", price: 49.99 }),
    TestDataFactory.createProduct({ name: "Product B", price: 99.99 }),
    TestDataFactory.createProduct({ name: "Product C", price: 149.99 }),
  ];

  for (const product of products) {
    await Database.products.create(product);
  }

  // Seed test orders
  const orders = [
    TestDataFactory.createOrder({ userId: 2, status: "completed" }),
    TestDataFactory.createOrder({ userId: 2, status: "pending" }),
    TestDataFactory.createOrder({ userId: 3, status: "cancelled" }),
  ];

  for (const order of orders) {
    await Database.orders.create(order);
  }
};
```

### Test Data Fixtures

```javascript
// Fixture files for test data
// fixtures/users.json
{
  "validUser": {
    "email": "valid@example.com",
    "password": "SecurePass123!",
    "name": "Valid User"
  },
  "invalidUser": {
    "email": "invalid-email",
    "password": "weak",
    "name": ""
  },
  "adminUser": {
    "email": "admin@example.com",
    "password": "AdminPass123!",
    "name": "Admin User",
    "role": "admin"
  }
}

// fixtures/api-responses.json
{
  "successResponse": {
    "status": 200,
    "body": {
      "success": true,
      "data": {}
    }
  },
  "errorResponse": {
    "status": 400,
    "body": {
      "success": false,
      "error": "Invalid input"
    }
  }
}
```

### Dynamic Test Data Generation

```javascript
// Dynamic data generation for load testing
const generateLoadTestData = (count) => {
  const users = [];

  for (let i = 0; i < count; i++) {
    users.push({
      email: `loadtest${i}@example.com`,
      password: `Password${i}!`,
      name: `Load Test User ${i}`,
      createdAt: new Date(Date.now() - Math.random() * 10000000),
    });
  }

  return users;
};

// Generate realistic data using Faker
const { faker } = require("@faker-js/faker");

const generateRealisticUsers = (count) => {
  const users = [];

  for (let i = 0; i < count; i++) {
    users.push({
      email: faker.internet.email(),
      name: faker.person.fullName(),
      phone: faker.phone.number(),
      address: {
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        zipCode: faker.location.zipCode(),
        country: faker.location.country(),
      },
      createdAt: faker.date.past(),
    });
  }

  return users;
};
```

### Test Data Cleanup

```javascript
// Test data cleanup utilities
class TestDataCleanup {
  static async cleanupUser(userId) {
    await Database.users.delete({ where: { id: userId } });
    await Database.orders.delete({ where: { userId } });
  }

  static async cleanupByEmail(email) {
    const user = await Database.users.findOne({
      where: { email },
    });

    if (user) {
      await this.cleanupUser(user.id);
    }
  }

  static async cleanupTestData() {
    const testEmails = await Database.users.findMany({
      where: {
        email: {
          like: "%@test.example.com",
        },
      },
    });

    for (const user of testEmails) {
      await this.cleanupUser(user.id);
    }
  }

  static async truncateAllTables() {
    const tables = ["users", "orders", "products", "sessions"];

    for (const table of tables) {
      await Database.truncate(table);
    }
  }
}
```

### Test Data Versioning

```javascript
// Test data versioning and migrations
const testDataMigrations = {
  "1.0.0": async () => {
    // Initial test data schema
    await Database.query(`
      CREATE TABLE IF NOT EXISTS test_users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE,
        password VARCHAR(255),
        name VARCHAR(255)
      )
    `);
  },

  "1.1.0": async () => {
    // Add role field
    await Database.query(`
      ALTER TABLE test_users ADD COLUMN role VARCHAR(50)
    `);
  },

  "2.0.0": async () => {
    // Restructure test data
    await Database.query(`
      DROP TABLE IF EXISTS test_users
      CREATE TABLE test_users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE,
        password VARCHAR(255),
        name VARCHAR(255),
        role VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
  },
};

const migrateTestData = async (version) => {
  const versions = Object.keys(testDataMigrations).sort();

  for (const v of versions) {
    if (v <= version) {
      await testDataMigrations[v]();
    }
  }
};
```

## Expected Output

- Consistent test data across test runs
- Reliable test data for all scenarios
- Proper cleanup after test execution
- Version-controlled test data schemas
- Efficient test data generation
- Data integrity maintained

## Actual Output

```bash
Test Data Management Results:

Data Generation:
  ✓ 1000 users generated for load testing
  ✓ 500 orders created with realistic data
  ✓ 200 products with varied attributes
  ✓ Edge case data scenarios covered

Data Cleanup:
  ✓ Test data cleaned after each test
  ✓ Database reset between test suites
  ✓ No data leakage between tests
  ✓ Cleanup execution time < 5s

Data Integrity:
  ✓ Foreign key constraints maintained
  ✓ Data validation rules enforced
  ✓ Unique constraints respected
  ✓ Referential integrity preserved

Total: 12/12 test data operations successful
```

## Evidence

- Test data generation logs
- Database state verification
- Data cleanup execution logs
- Test data schema documentation
- Data integrity validation results
- Performance metrics for data operations

## Risks

- **Data pollution**: Test data may leak into production
- **Cleanup failures**: Incomplete cleanup may affect subsequent tests
- **Data inconsistency**: Test data may not match production schemas
- **Performance impact**: Large test datasets may slow down tests
- **Maintenance overhead**: Keeping test data updated requires effort
- **Complex dependencies**: Test data relationships can be complex

## Acceptance Criteria

- Test data consistently available for all tests
- Cleanup completes successfully after each test
- Test data matches production schema structure
- Data generation completes within acceptable time
- No data leakage between test runs
- Test data version controlled and documented

## Reporting

- **Per Test**: Test data usage and cleanup status
- **Weekly**: Test data health and maintenance needs
- **Per Release**: Test data schema validation report
- **On Issues**: Data integrity analysis and remediation
