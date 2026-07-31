# CaseSignal AI

## Architecture Revision & Implementation Plan

### Version 2.0

---

# Purpose

This document outlines the architectural changes required to transform the existing CaseSignal project into a production-quality AI-powered IoT Workflow Automation Platform.

The existing Symfony and Next.js application provides an excellent foundation. Rather than replacing Symfony, the platform should evolve into a hybrid architecture where Symfony manages the enterprise application while Python provides the AI capabilities.

This approach closely reflects modern enterprise systems and aligns with the technology stack described in the SwiftCase Software Engineer role.

---

# Primary Objectives

The project should demonstrate the ability to:

* Work within an existing Symfony codebase
* Build modern AI services using Python
* Integrate multiple services together
* Build workflow automation
* Design scalable systems
* Create production-ready software
* Demonstrate AI engineering rather than simply consuming LLM APIs

---

# Updated Platform Vision

CaseSignal should no longer be viewed as an IoT dashboard.

Instead it becomes:

> **CaseSignal AI**
>
> Enterprise AI Workflow & Industrial Intelligence Platform

IoT devices become one source of business events.

The AI becomes the decision-making layer.

Symfony becomes the enterprise application.

---

# High-Level Architecture

```
Next.js Dashboard
        │
        ▼
Symfony Enterprise Platform
        │
 ┌──────┼──────────────┐
 │      │              │
 │      │              │
 ▼      ▼              ▼
Workflow Engine
Authentication
Device Registry
 │
 ▼
FastAPI AI Engine
 │
 ▼
LangGraph Agent Runtime
 │
 ▼
Redis Queue
 │
 ▼
MQTT Broker
 │
 ▼
Industrial IoT Devices
```

---

# Responsibilities

## Symfony

Symfony should become responsible for:

* Authentication
* User Management
* RBAC
* Device Management
* Workflow Management
* REST APIs
* Administration
* Audit Logging
* Notification orchestration

Symfony should NOT contain AI logic.

---

## FastAPI

Python should become responsible for:

* AI reasoning
* Prompt orchestration
* Agent execution
* LLM interaction
* Retrieval
* Evaluation
* Recommendations
* Report generation

Python becomes the intelligence layer.

---

## Next.js

The frontend should contain:

* AI Dashboard
* Device Monitoring
* Workflow Builder
* AI Evaluation
* Incident Centre
* Asset Management
* Analytics
* Administration

---

# New Platform Modules

The following modules should be implemented.

## AI Dashboard

Displays

* AI recommendations
* Critical incidents
* Active workflows
* System health
* AI confidence

---

## Device Management

Allows users to

* Register devices
* Group devices
* Manage firmware
* View health
* Configure telemetry

---

## Workflow Automation

Users should create workflows using natural language.

Example

> If Pump 7 exceeds 95°C for five minutes,
> create an incident,
> notify Teams,
> schedule maintenance,
> ask AI for recommendations.

The platform should convert this into executable workflow steps.

---

## AI Incident Centre

The AI should automatically investigate incidents.

Example

Instead of

Temperature: 102°C

The user should see

Machine 7 has exceeded expected operating temperature.

Confidence:
94%

Possible causes

• Cooling failure

• Bearing wear

• High ambient temperature

Recommended action

Reduce load immediately.

Inspect cooling system.

Schedule maintenance within 24 hours.

---

## Predictive Maintenance

The AI should analyse historical telemetry.

Predict

* failures
* maintenance windows
* abnormal behaviour

---

## Workflow Builder

Create a visual workflow designer.

Example

```
Telemetry

↓

Condition

↓

AI Analysis

↓

Approval

↓

Teams Notification

↓

Maintenance Ticket
```

---

## Evaluation Dashboard

Every AI interaction should be measured.

Display

* latency
* token usage
* model
* confidence
* cost
* hallucination risk
* response quality

---

## Prompt Management

Prompts should never be hardcoded.

Create

/prompts

Store

* versions
* metadata
* owners
* evaluations

---

## Cost Dashboard

Display

* OpenAI usage
* Anthropic usage
* Monthly cost
* Token usage
* Cost per workflow

---

# AI Agent Architecture

Replace a single AI assistant with specialist agents.

Planner Agent

Responsible for

* understanding requests
* decomposing tasks

---

Telemetry Agent

Responsible for

* analysing incoming sensor data

---

Incident Agent

Responsible for

* identifying abnormal events

---

Maintenance Agent

Responsible for

* predicting failures

---

Workflow Agent

Responsible for

* creating automation plans

---

Security Agent

Responsible for

* identifying suspicious behaviour

---

Report Agent

Responsible for

* producing executive reports

---

Evaluation Agent

Responsible for

* scoring AI quality
* recording metrics

---

# AI Pipeline

Every AI request should follow the same lifecycle.

User Request

↓

Context Retrieval

↓

Planner

↓

Tool Selection

↓

Execution

↓

Evaluation

↓

Reflection

↓

Logging

↓

Response

Nothing should call an LLM directly.

---

# Recommended Technologies

Frontend

* Next.js 16
* React
* TypeScript
* Tailwind CSS
* shadcn/ui
* React Flow
* Recharts

Symfony

* Symfony 7
* API Platform
* Messenger
* Doctrine

Python

* FastAPI
* Pydantic AI
* LangGraph
* LiteLLM
* SQLAlchemy
* Celery

Messaging

* Redis
* MQTT
* WebSockets

Database

* PostgreSQL
* TimescaleDB

Infrastructure

* Docker
* Docker Compose
* GitHub Actions
* Prometheus
* Grafana

---

# Documentation to Add

Create

docs/

Containing

architecture.md

system-design.md

deployment.md

database-design.md

security.md

observability.md

ci-cd.md

mqtt.md

langgraph.md

evaluation.md

prompts.md

rbac.md

performance.md

testing.md

coding-standards.md

---

# Testing Strategy

Every feature should include

Unit Tests

Integration Tests

End-to-End Tests

AI Evaluation Tests

Performance Tests

Security Tests

Workflow Tests

---

# Observability

Implement

Structured Logging

Distributed Tracing

Metrics

Health Checks

Request IDs

Correlation IDs

AI Cost Tracking

Token Tracking

Workflow Timing

---

# Security

Implement

RBAC

JWT Authentication

API Rate Limiting

Secrets Management

Input Validation

Prompt Injection Protection

Audit Logs

Encryption at Rest

Encryption in Transit

---

# Project Structure

```
casesignal/

frontend/

symfony/

python-ai/

workers/

connectors/

prompts/

evaluation/

docs/

docker/

scripts/

tests/

.github/
```

---

# Implementation Priority

## Phase 1

* Complete Symfony API
* Complete Next.js dashboard
* Add FastAPI AI service
* Configure Docker

---

## Phase 2

* MQTT integration
* Workflow engine
* Device management
* AI planner

---

## Phase 3

* LangGraph agents
* Prompt management
* Evaluation framework
* AI dashboards

---

## Phase 4

* Predictive maintenance
* Incident investigation
* Cost tracking
* Observability

---

## Phase 5

* CI/CD
* Performance optimisation
* Security hardening
* Documentation
* Production deployment

---

# Final Goal

CaseSignal AI should demonstrate senior-level software engineering by combining enterprise Symfony development, modern Python AI services, workflow automation, distributed systems, observability, and production-ready architecture.

The finished platform should clearly demonstrate the ability to work within an established PHP ecosystem while designing and implementing advanced AI capabilities that solve real-world operational problems.
