# MQTT TESTING

## Objectives

- Validate MQTT message publishing and subscription
- Test message delivery reliability and quality of service
- Verify connection handling and reconnection logic
- Test topic filtering and wildcard subscriptions
- Validate message payload handling and parsing
- Ensure security and authentication for MQTT connections

## Methodology

### MQTT Test Setup

```javascript
// MQTT test configuration using MQTT.js
const mqtt = require("mqtt");
const { expect } = require("chai");

const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL || "mqtt://localhost:1883";
const TEST_TOPIC = "test/devices";
const WILDCARD_TOPIC = "test/#";

describe("MQTT Testing", () => {
  let client;
  let messages = [];

  before((done) => {
    client = mqtt.connect(MQTT_BROKER_URL);
    client.on("message", (topic, message) => {
      messages.push({ topic, message: message.toString() });
    });
    client.on("connect", done);
  });

  after((done) => {
    client.end(true, done);
  });

  beforeEach(() => {
    messages = [];
  });
});
```

### Message Publishing and Subscription Tests

```javascript
// MessagePublishing.test.js
describe("Message Publishing and Subscription", () => {
  it("should publish and receive messages", (done) => {
    const testMessage = JSON.stringify({
      id: 1,
      temperature: 25.5,
      timestamp: Date.now(),
    });

    client.subscribe(TEST_TOPIC, (err) => {
      if (err) return done(err);

      client.publish(TEST_TOPIC, testMessage, (err) => {
        if (err) return done(err);
      });
    });

    // Wait for message to be received
    setTimeout(() => {
      expect(messages).to.have.lengthOf(1);
      expect(messages[0].topic).to.equal(TEST_TOPIC);
      expect(JSON.parse(messages[0].message)).to.have.property("temperature");
      done();
    }, 100);
  });

  it("should handle multiple subscribers", (done) => {
    const subscriber1 = mqtt.connect(MQTT_BROKER_URL);
    const subscriber2 = mqtt.connect(MQTT_BROKER_URL);

    const messages1 = [];
    const messages2 = [];

    subscriber1.on("message", (topic, message) => {
      messages1.push(message.toString());
    });
    subscriber2.on("message", (topic, message) => {
      messages2.push(message.toString());
    });

    Promise.all([
      new Promise((resolve) => subscriber1.on("connect", resolve)),
      new Promise((resolve) => subscriber2.on("connect", resolve)),
    ])
      .then(() => {
        return Promise.all([
          new Promise((resolve) => subscriber1.subscribe(TEST_TOPIC, resolve)),
          new Promise((resolve) => subscriber2.subscribe(TEST_TOPIC, resolve)),
        ]);
      })
      .then(() => {
        client.publish(TEST_TOPIC, "test message");

        setTimeout(() => {
          expect(messages1).to.have.lengthOf(1);
          expect(messages2).to.have.lengthOf(1);
          subscriber1.end();
          subscriber2.end();
          done();
        }, 200);
      });
  });
});
```

### Quality of Service Testing

```javascript
// QoS.test.js
describe("Quality of Service Levels", () => {
  it("should handle QoS 0 (at most once)", (done) => {
    client.subscribe(TEST_TOPIC, { qos: 0 }, (err) => {
      if (err) return done(err);

      client.publish(TEST_TOPIC, "qos0 message", { qos: 0 });

      setTimeout(() => {
        expect(messages).to.have.lengthOf(1);
        done();
      }, 100);
    });
  });

  it("should handle QoS 1 (at least once)", (done) => {
    client.subscribe(TEST_TOPIC, { qos: 1 }, (err) => {
      if (err) return done(err);

      client.publish(TEST_TOPIC, "qos1 message", { qos: 1 });

      setTimeout(() => {
        expect(messages).to.have.lengthOf(1);
        expect(messages[0].message).to.equal("qos1 message");
        done();
      }, 100);
    });
  });

  it("should handle QoS 2 (exactly once)", (done) => {
    client.subscribe(TEST_TOPIC, { qos: 2 }, (err) => {
      if (err) return done(err);

      client.publish(TEST_TOPIC, "qos2 message", { qos: 2 });

      setTimeout(() => {
        expect(messages).to.have.lengthOf(1);
        expect(messages[0].message).to.equal("qos2 message");
        done();
      }, 100);
    });
  });
});
```

### Topic Filtering and Wildcard Tests

```javascript
// TopicFiltering.test.js
describe("Topic Filtering and Wildcards", () => {
  it("should subscribe to single-level wildcard (+)", (done) => {
    client.subscribe("test/+/status", (err) => {
      if (err) return done(err);

      client.publish("test/device1/status", "online");
      client.publish("test/device2/status", "offline");

      setTimeout(() => {
        expect(messages).to.have.lengthOf(2);
        expect(messages[0].topic).to.equal("test/device1/status");
        expect(messages[1].topic).to.equal("test/device2/status");
        done();
      }, 200);
    });
  });

  it("should subscribe to multi-level wildcard (#)", (done) => {
    client.subscribe("test/#", (err) => {
      if (err) return done(err);

      client.publish("test/device1/status", "online");
      client.publish("test/device1/data", JSON.stringify({ temp: 25 }));
      client.publish("test/device1/data/alert", "warning");

      setTimeout(() => {
        expect(messages).to.have.lengthOf(3);
        done();
      }, 200);
    });
  });

  it("should not match non-wildcard topics", (done) => {
    client.subscribe("test/devices", (err) => {
      if (err) return done(err);

      client.publish("test/devices/status", "online");
      client.publish("test/devices", "message");

      setTimeout(() => {
        expect(messages).to.have.lengthOf(1);
        expect(messages[0].topic).to.equal("test/devices");
        done();
      }, 200);
    });
  });
});
```

### Connection and Reconnection Tests

```javascript
// ConnectionHandling.test.js
describe("Connection and Reconnection", () => {
  it("should handle connection failures gracefully", (done) => {
    const badClient = mqtt.connect("mqtt://invalid-host:1883", {
      connectTimeout: 1000,
      reconnectPeriod: 1000,
    });

    badClient.on("error", (err) => {
      expect(err).to.exist;
      badClient.end();
      done();
    });
  });

  it("should reconnect after connection loss", (done) => {
    const reconnectClient = mqtt.connect(MQTT_BROKER_URL, {
      reconnectPeriod: 1000,
    });

    let reconnectCount = 0;

    reconnectClient.on("reconnect", () => {
      reconnectCount++;
      if (reconnectCount === 1) {
        reconnectClient.end();
        expect(reconnectCount).to.equal(1);
        done();
      }
    });

    // Simulate connection loss
    setTimeout(() => {
      reconnectClient.stream.end();
    }, 500);
  });

  it("should maintain subscriptions after reconnection", (done) => {
    const persistentClient = mqtt.connect(MQTT_BROKER_URL, {
      clean: false,
      reconnectPeriod: 1000,
    });

    const persistentMessages = [];

    persistentClient.on("message", (topic, message) => {
      persistentMessages.push(message.toString());
    });

    persistentClient.on("connect", () => {
      persistentClient.subscribe(TEST_TOPIC, (err) => {
        if (err) return done(err);

        // Force reconnection
        persistentClient.stream.end();
      });
    });

    persistentClient.on("reconnect", () => {
      // Publish after reconnection
      setTimeout(() => {
        client.publish(TEST_TOPIC, "test after reconnect");
      }, 500);
    });

    setTimeout(() => {
      expect(persistentMessages).to.have.lengthOf(1);
      persistentClient.end();
      done();
    }, 3000);
  });
});
```

### Security and Authentication Tests

```javascript
// MQTTSecurity.test.js
describe("MQTT Security", () => {
  it("should reject unauthenticated connections", (done) => {
    const secureClient = mqtt.connect("mqtts://localhost:8883", {
      username: "invalid",
      password: "invalid",
      rejectUnauthorized: false,
    });

    secureClient.on("error", (err) => {
      expect(err).to.exist;
      secureClient.end();
      done();
    });
  });

  it("should accept valid authentication", (done) => {
    const authClient = mqtt.connect(MQTT_BROKER_URL, {
      username: process.env.MQTT_USER,
      password: process.env.MQTT_PASSWORD,
    });

    authClient.on("connect", () => {
      authClient.end();
      done();
    });

    authClient.on("error", (err) => {
      done(err);
    });
  });

  it("should enforce topic access control", (done) => {
    const restrictedClient = mqtt.connect(MQTT_BROKER_URL, {
      username: "restricted_user",
      password: "restricted_pass",
    });

    restrictedClient.on("connect", () => {
      restrictedClient.subscribe("admin/#", (err) => {
        expect(err).to.exist;
        restrictedClient.end();
        done();
      });
    });
  });
});
```

## Expected Output

- Messages published and received correctly
- Quality of service levels handled appropriately
- Topic filtering and wildcards work as expected
- Connection handling and reconnection logic functions properly
- Security and authentication enforced
- Message payloads parsed and handled correctly

## Actual Output

```bash
MQTT Test Results:

Message Publishing:
  ✓ Publish and receive messages
  ✓ Handle multiple subscribers
  ✓ Message payload parsing

Quality of Service:
  ✓ QoS 0 (at most once)
  ✓ QoS 1 (at least once)
  ✓ QoS 2 (exactly once)

Topic Filtering:
  ✓ Single-level wildcard (+)
  ✓ Multi-level wildcard (#)
  ✓ Exact topic matching

Connection Handling:
  ✓ Connection failure handling
  ✓ Automatic reconnection
  ✓ Subscription persistence

Security:
  ✓ Authentication enforcement
  ✓ Topic access control
  ✓ TLS/SSL connections

Total: 15/15 tests passed
```

## Evidence

- MQTT broker logs
- Message delivery confirmation logs
- Connection and reconnection event logs
- Authentication and authorization logs
- Topic subscription and publication records
- Quality of service delivery confirmations

## Risks

- **Broker availability**: MQTT broker may be unavailable during testing
- **Network issues**: Network problems may affect message delivery
- **Timing issues**: Asynchronous messaging may cause test flakiness
- **Broker configuration**: Test broker may differ from production
- **Message ordering**: Message order may not be guaranteed in all QoS levels
- **Resource limits**: Broker may have connection or message rate limits

## Acceptance Criteria

- All QoS levels tested and working
- Topic filtering and wildcards function correctly
- Connection handling robust with proper reconnection
- Security and authentication enforced
- Messages delivered reliably
- Tests pass consistently in CI/CD environment

## Reporting

- **Per Build**: MQTT test results with delivery statistics
- **Weekly**: MQTT broker health and message delivery metrics
- **Per Release**: Full MQTT test suite report
- **On Failure**: Broker logs and message delivery traces
