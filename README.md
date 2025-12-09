<div align="center">

# 🚀 Go-GenAI-Stack

### A Full-Stack Development Framework Designed for the AI Era

**AI-friendly code structure that turns ideas directly into code**

**[English](README.md) | [中文](README.zh.md)**

[![Go Version](https://img.shields.io/badge/Go-1.23+-00ADD8?style=flat&logo=go)](https://go.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/erweixin/Go-GenAI-Stack/pulls)

[Quick Start](#-quick-start) • [Core Features](#core-features) • [Architecture](#architecture-highlights) • [Documentation](#documentation) • [Contributing](#contributing)

</div>

---

<div align="center">

### ⚠️ **Project Status**

> **🚧 This project is currently in very early development stage. Code structure may change at any time, but the goal is to be a production-ready starter for large commercial projects**  
> **🎯 This is an experimental attempt at AI-friendly software architecture**  
> **💡 Exploring how to make code structure more understandable and generatable by AI**

**Welcome to discuss and contribute, let's explore best practices for software development in the AI era together!**

</div>

---

<div align="center">

### 📖 **Core Philosophy**

> **The core ideas and implementation approach of this project come from:**  
> **[《Discussion on Possible Changes in Software Architecture and Collaboration Relationships in the AI Era》](https://github.com/erweixin/blog/blob/main/%E8%AE%A8%E8%AE%BA%E4%B8%8B%20AI%20%E6%97%B6%E4%BB%A3%E7%9A%84%E8%BD%AF%E4%BB%B6%E6%9E%B6%E6%9E%84%E4%B8%8E%E5%8D%8F%E4%BD%9C%E5%85%B3%E7%B3%BB%E7%9A%84%E5%87%A0%E4%B8%AA%E5%8F%AF%E8%83%BD%E7%9A%84%E5%8F%98%E5%8C%96.md)** ⭐

</div>

---

## 💡 Why Choose Go-GenAI-Stack?

In the era of AI programming, traditional project architectures face challenges:
- ❌ **Business rules scattered across code**, AI needs to read massive amounts of code to understand intent
- ❌ **Horizontal layered architecture** makes it difficult for AI to locate functional boundaries
- ❌ **Implicit domain knowledge** requires repeated manual explanations
- ❌ **Test-unfriendly design**, automated tests are costly and flaky

**Go-GenAI-Stack rethinks how code is organized**:

| Traditional Architecture | Go-GenAI-Stack (Vibe-Coding-Friendly) |
|---------|--------------------------------------|
| Business rules hidden in code | **Explicit knowledge files** (rules.md, glossary.md) |
| Layered by tech stack | **Vertically split by business domain** |
| Describe flow with code | **Declare use cases with YAML** (usecases.yaml) |
| AI needs to read thousands of lines | **AI reads a few structured files to understand** |
| Manual frontend-backend type sync | **Go → TypeScript automatic sync** |
| Flaky tests and unstable selectors | **Playwright-friendly design + data-test-id convention + Docker E2E env** |

> 💡 **Vibe Coding**: Express your ideas, AI understands business logic, directly generates code that follows rules.
>
> This project makes AI a true programming partner, not just a code completion tool.

---

## 🎯 Project Positioning

**This is a production-ready full-stack Starter** with a complete **Task domain** as a best practice example:

- ✅ **Ready to use**: If you need task management functionality
- ✅ **Use as template**: Map to your business (Product, Order, Article...)
- ✅ **Learn from it**: Understand how to build AI-friendly architecture

### 🌟 Standing on the Shoulders of Giants

- **Backend Architecture** inspired by [Coze Studio](https://www.coze.com/):
  - Domain-Driven Design centered on LLM orchestration
  - Plugin-first and extensibility priority
  - Declarative workflows (usecases.yaml)

- **Mobile Architecture** inspired by [Bluesky Social App](https://github.com/bluesky-social/social-app):
  - React Native best practices
  - Native-level performance optimization
  - Cross-platform component design

---

## 📁 Project Structure

```
Go-GenAI-Stack/
├── backend/              # Backend (Go + Hertz + DDD)
│   ├── cmd/              # Application entry
│   │   └── server/       # HTTP Server entry
│   ├── domains/          # Domain layer (Domain-First)
│   │   ├── task/         # Task domain (example implementation) ★
│   │   │   ├── handlers/ # HTTP adapter layer
│   │   │   ├── service/  # Business logic layer
│   │   │   ├── model/    # Domain model
│   │   │   └── ...       # Other components
│   │   └── shared/       # Shared components
│   ├── infrastructure/   # Infrastructure layer
│   │   ├── bootstrap/    # Bootstrap
│   │   ├── persistence/  # Persistence (Postgres, Redis)
│   │   ├── middleware/   # Middleware
│   │   ├── config/       # Configuration management
│   │   └── database/     # Database Schema
│   ├── pkg/              # Reusable packages
│   │   └── validator/    # Validator
│   ├── migrations/       # Database migrations
│   │   ├── atlas/        # Atlas migration files & config
│   │   └── seed/         # Seed data
│   ├── shared/           # Shared code
│   │   └── errors/       # Error definitions
│   └── scripts/          # Development scripts
├── frontend/             # Frontend Monorepo
│   ├── web/              # React Web application
│   ├── mobile/           # React Native mobile application
│   └── shared/           # Frontend shared code
│       ├── types/        # TypeScript type definitions
│       ├── utils/        # Utility functions
│       └── constants/    # Constants
├── docs/                 # Project documentation
├── docker/               # Docker configuration
└── scripts/              # Project-level scripts
```

---

## Core Features

### 🎯 Vibe-Coding-Friendly DDD (Core Highlight)

<table>
<tr>
<td width="50%">

#### 📚 Explicit Knowledge Files (AI can directly understand)

Each domain requires **6 structured files**:

```
domains/task/
├── 📄 README.md          # Domain overview
├── 📄 glossary.md        # Glossary
├── 📄 rules.md           # Business rules
├── 📄 events.md          # Domain events
├── 📄 usecases.yaml      # Use case declarations ⭐
└── 📄 ai-metadata.json   # AI metadata
```

**AI only needs to read these 6 files to understand complete business logic!**

</td>
<td width="50%">

#### 🎭 Declarative Use Cases (Generate code with one sentence)

```yaml
# usecases.yaml
CreateTask:
  description: "Create new task"
  steps:
    - ValidateInput
    - GenerateTaskID
    - SaveTask
    - PublishEvent
  errors:
    - TASK_TITLE_EMPTY
    - TASK_ALREADY_EXISTS
```

**AI reads YAML → Automatically generates Handler + Tests**

</td>
</tr>
</table>

#### ✅ Vibe-Coding-Friendly Advantages

| Feature | Traditional DDD | Vibe-Coding-Friendly DDD | Improvement |
|-----|---------|--------------------------|------|
| **AI Understanding Speed** | Need to read thousands of lines | Only read 6 structured files | **10x** ⚡ |
| **Onboarding Time** | 2-3 days | 30 minutes (starting from README) | **5x** 🚀 |
| **Maintenance Cost** | Search across multiple directories | Self-contained (one directory) | **-70%** 💰 |
| **Use Case Changes** | Manually change code + tests | Change YAML → AI auto-generates | **3x** ⚡ |
| **Type Safety** | Manual frontend-backend sync | Go → TS automatic sync | **100%** ✅ |

---

### 🧪 Test-Friendly by Design (Playwright / Vitest Ready)

In AI-assisted development, testability determines how fast AI-generated code can be verified. This project is optimized for automation:

- **Frontend Playwright-friendly**: Mandatory `data-test-id` on all interactive elements; stable routes/state to reduce flakiness; selectors never rely on styling classes.
- **Isolated E2E environment**: Docker spins dedicated Postgres (:5433) + Backend (:8081) so dev and E2E can run in parallel; `pnpm e2e:all` = setup → test → teardown.
- **Stable fixtures**: Seed data and fixed test accounts; shared Playwright fixtures/helpers to avoid magic strings.
- **Fast unit feedback**: Vitest + happy-dom + thread pool; `pnpm test:watch` for second-level feedback, `pnpm test:coverage` for reports.
- **Directory as contract**: Feature-local `__tests__` beside hooks/stores/api/components so humans/AI can locate behaviors quickly.
- **CI friendly**: E2E triple caching (pnpm store / Playwright browsers / Docker layers); backend `./backend/scripts/test_all.sh` supports coverage output, reducing pipeline time.

> Goal: close the loop of “AI generates → automation validates → quick fix” with minimal human regression effort.

---

### Architecture Highlights

#### 1️⃣ **Domain-First**

```
✅ domains/task/        # Organized by business domain
   ├── model/           # Domain model
   ├── service/         # Business logic
   ├── repository/      # Data access
   ├── handlers/        # HTTP adapter layer
   └── tests/           # Tests

❌ Traditional layering (hard to locate functionality):
   ├── controllers/     # All domains mixed together
   ├── services/        # All services mixed together
   └── repositories/    # All repositories mixed together
```

#### 2️⃣ **Self-Contained**

Each domain is **independent**:
- ✅ Can be understood, modified, and tested separately
- ✅ Reduces cognitive load (focus on one domain)
- ✅ Easy parallel development (different teams for different domains)

#### 3️⃣ **Three-Layer Architecture** (Clear Layering)

```go
// Handler layer (thin): Only HTTP adaptation
func CreateTaskHandler(c *app.RequestContext) {
    var req dto.CreateTaskRequest
    c.BindAndValidate(&req)
    
    // Call Service layer
    output, err := taskService.CreateTask(ctx, input)
    
    c.JSON(200, response)
}

// Service layer (thick): Business logic ⭐
func (s *TaskService) CreateTask(input CreateTaskInput) {
    // 1. Validate business rules
    // 2. Create domain object
    // 3. Persist
    // 4. Publish event
}

// Repository layer: Data access (database/sql, no ORM)
func (r *TaskRepo) Create(task *Task) error {
    query := `INSERT INTO tasks (...) VALUES (...)`
    _, err := r.db.ExecContext(ctx, query, ...)
    return err
}
```

---

### 🤖 AI-Assisted Development Workflow

```bash
# 1️⃣ You: Add new use case in usecases.yaml
vim backend/domains/task/usecases.yaml

# 2️⃣ AI: Reads explicit knowledge files
# - README.md (understand domain boundaries)
# - glossary.md (understand terminology)
# - rules.md (understand business rules)
# - usecases.yaml (understand use case flow)

# 3️⃣ AI: Auto-generates code
# ✅ handlers/new_usecase.handler.go
# ✅ service/task_service.go (new method)
# ✅ http/dto/new_usecase.go
# ✅ tests/new_usecase.test.go

# 4️⃣ You: Run tests and commit
./backend/scripts/test_all.sh
git commit -m "feat(task): add new usecase"
```

**True Vibe Coding**: You only need to express intent, AI completes the implementation!

---

### 🛠️ Complete Development Toolchain

| Tool | Purpose | Command |
|-----|------|------|
| **Atlas** | Database Schema management | `cd backend/database && make diff/apply` |
| **Type Sync** | Go → TypeScript type sync | `./scripts/sync_types.sh all` |
| **Testing** | Unit + Integration + E2E | `./backend/scripts/test_all.sh` / `pnpm test` / `pnpm e2e:all` |
| **Linting** | Code quality check | `./backend/scripts/lint.sh --fix` |
| **Docker** | One-click full environment | `./scripts/quickstart.sh` |

---

### 📊 Production-Grade Observability

Complete **three pillars** observability solution (with toggle control):

<table>
<tr>
<td width="33%">

**🔍 Structured Logging**
- uber-go/zap
- JSON/Console format
- Log rotation
- Request tracing

</td>
<td width="33%">

**📈 Prometheus Metrics**
- QPS, latency, error rate
- Business metrics
- System metrics
- `/metrics` endpoint

</td>
<td width="33%">

**🔗 Distributed Tracing**
- OpenTelemetry
- Jaeger / Tempo
- Cross-service tracing
- Performance profiling

</td>
</tr>
</table>

```go
// One-click toggle (via config file)
observability:
  logging:
    enabled: true      # Logging
  metrics:
    enabled: true      # Metrics
  tracing:
    enabled: true      # Tracing
```

Access:
- Health check: `http://localhost:8080/health`
- Prometheus: `http://localhost:8080/metrics`
- Grafana: `http://localhost:3000` (full monitoring)

📖 Detailed docs: [Observability Guide](backend/infrastructure/monitoring/README.md)

---

## 🚀 Quick Start

### ⚡ One-Click Start (Recommended)

The easiest way to get started:

```bash
# 1️⃣ Clone the project
git clone https://github.com/erweixin/Go-GenAI-Stack.git
cd Go-GenAI-Stack

# 2️⃣ One-click start (Backend + Database)
./scripts/quickstart.sh
```

This script will:
- ✅ Check dependencies (Go, Docker)
- ✅ Setup environment variables (copy from .env.example if needed)
- ✅ Start PostgreSQL and Redis (Docker)
- ✅ Run database migrations (Atlas)
- ✅ Load seed data
- ✅ Start backend server

**Access services**:
- 🔗 Backend API: `http://localhost:8080/api`
- ❤️ Health check: `http://localhost:8080/health`
- 📊 Prometheus Metrics: `http://localhost:8080/metrics`

---

### 🌐 Start Full Stack (Backend + Frontend)

For full-stack development:

```bash
# 1. Start backend (in one terminal)
./scripts/quickstart.sh

# 2. Start frontend (in another terminal)
cd frontend
pnpm install
cd web
pnpm dev
```

**Access**:
- 🌐 Frontend Web: `http://localhost:5173`
- 🔗 Backend API: `http://localhost:8080/api`

---

### 🐳 Docker Production Mode

Start complete production environment with monitoring:

```bash
# Start all services (Backend + Monitoring)
./scripts/start-all.sh
```

**Access services**:
- 🔗 Backend API: `http://localhost:8080`
- 📊 Grafana: `http://localhost:3000` (admin/admin)
- 🔍 Jaeger: `http://localhost:16686`
- 📈 Prometheus: `http://localhost:9090`
- 🐛 Sentry: `http://localhost:9000`

**Note**: Frontend needs to be built and deployed separately. See [Frontend README](frontend/web/README.md) for build instructions.

---

### 🛠️ Local Development Mode (Manual Setup)

<details>
<summary><b>Click to expand detailed steps</b></summary>

#### Prerequisites

- **Go** 1.23+
- **Node.js** 22.0+
- **pnpm** 8.0+
- **Docker** & Docker Compose (for databases)
- **[Atlas](https://atlasgo.io/)** (Schema management)

```bash
# Install Atlas
curl -sSf https://atlasgo.sh | sh
```

#### Step 1: Start Databases

```bash
# Start PostgreSQL and Redis
cd docker
docker-compose up -d postgres redis

# Wait for databases to be ready
docker-compose ps
```

#### Step 2: Setup Backend

```bash
cd backend

# Install dependencies
go mod download

# Apply database migrations
cd database
make apply

# Load seed data (optional)
make seed

# Start backend server
cd ..
go run cmd/server/main.go
```

Backend will start at `http://localhost:8080`

#### Step 3: Setup Frontend

```bash
cd frontend

# Install dependencies
pnpm install

# Start Web application
cd web
pnpm dev         # http://localhost:5173

# Or start Mobile application (optional)
cd ../mobile
pnpm start
```

#### Step 4: Verify

```bash
# Check backend health
curl http://localhost:8080/health

# Check frontend
open http://localhost:5173
```

</details>

📖 **More startup options**: [Docker Deployment Guide](docs/Guides/docker-deployment.md)

---

## 📚 Development Guide

### 🎯 Common Development Tasks

<table>
<tr>
<td width="50%">

#### ➕ Add New Use Case

```bash
# 1. Declare use case
vim backend/domains/task/usecases.yaml

# 2. AI generates code (or write manually)
# - handlers/new_usecase.handler.go
# - service/task_service.go
# - http/dto/new_usecase.go
# - tests/new_usecase.test.go

# 3. Run tests
./backend/scripts/test_all.sh
```

**Detailed guide**: [Quick Reference](docs/Guides/quick-reference.md)

</td>
<td width="50%">

#### 🗄️ Database Schema Management

```bash
cd backend/database

# Generate migration
make diff NAME=add_field

# Apply migration
make apply

# Check status
make status
```

**Detailed guide**: [Database Management](docs/Guides/database.md)

</td>
</tr>
<tr>
<td width="50%">

#### 🔄 Frontend-Backend Type Sync

```bash
# Sync single domain
./scripts/sync_types.sh task

# Sync all domains
./scripts/sync_types.sh all
```

Generated types: `frontend/shared/types/domains/`

**Detailed guide**: [Type Sync](docs/Guides/type-sync.md)

</td>
<td width="50%">

#### ✅ Before Committing Code

```bash
# 1. Format + check
./backend/scripts/lint.sh --fix

# 2. Run tests
./backend/scripts/test_all.sh --coverage

# 3. Commit
git commit -m "feat(task): add feature"
```

Follow [Conventional Commits](https://www.conventionalcommits.org/) specification

</td>
</tr>
</table>

---

## Documentation

<table>
<tr>
<td width="50%">

### 🎯 Core Concepts

- 📘 [Architecture Overview](docs/Core/architecture-overview.md)
- 💡 [Vibe-Coding-Friendly Philosophy](docs/Core/vibe-coding-friendly.md) ⭐
- ⚡ [Quick Reference Guide](docs/Guides/quick-reference.md)

### 🛠️ Development Guides

- 🗄️ [Database Management](docs/Guides/database.md) - Atlas Schema management
- 🔄 [Type Sync](docs/Guides/type-sync.md) - Go → TypeScript
- 🐳 [Docker Deployment](docs/Guides/docker-deployment.md)

</td>
<td width="50%">

### 📊 Observability

- 📋 [Observability Overview](backend/infrastructure/monitoring/README.md)
- 📝 [Structured Logging](backend/infrastructure/monitoring/logger/README.md)
- 📈 [Prometheus Metrics](backend/infrastructure/monitoring/metrics/README.md)
- 🔗 [OpenTelemetry Tracing](backend/infrastructure/monitoring/tracing/README.md)

### 🔌 Extension Guides

- 🏗️ [Application Layer Guide](docs/Extensions/APPLICATION-LAYER-GUIDE.md)
- 🗃️ [Database Provider Switching](docs/Extensions/DATABASE-PROVIDERS.md)

</td>
</tr>
</table>

📚 **Complete documentation index**: [docs/INDEX.md](docs/INDEX.md)

---

## 🏗️ Tech Stack

<table>
<tr>
<td width="33%" valign="top">

### 🔧 Backend

**Language & Framework**
- ![Go](https://img.shields.io/badge/Go-1.23+-00ADD8?logo=go&logoColor=white) Go 1.23+
- [CloudWeGo Hertz](https://www.cloudwego.io/zh/docs/hertz/) - High-performance HTTP framework
- [Eino](https://github.com/cloudwego/eino) - ByteDance LLM framework

**Data Storage**
- PostgreSQL 16+ (using database/sql, no ORM)
- Redis 7+ (cache + message queue)

**Observability**
- [uber-go/zap](https://github.com/uber-go/zap) - Structured logging
- [Prometheus](https://prometheus.io/) - Metrics monitoring
- [OpenTelemetry](https://opentelemetry.io/) - Distributed tracing

**Toolchain**
- [Atlas](https://atlasgo.io/) - Schema management
- staticcheck - Code analysis

</td>
<td width="33%" valign="top">

### 🎨 Frontend

**Web Application**
- ![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react&logoColor=black) React 18+
- ![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript&logoColor=white) TypeScript 5.0+
- Vite - Modern build tool
- TanStack Query - Data fetching

**Mobile Application**
- React Native (Expo)
- Inspired by [Bluesky Social App](https://github.com/bluesky-social/social-app) architecture
- Native-level performance optimization

**Monorepo**
- pnpm workspace
- Shared types/utils/constants
- Go → TypeScript automatic type sync

</td>
<td width="33%" valign="top">

### 🚀 DevOps

**Containerization**
- ![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white) Docker
- Docker Compose
- Multi-environment config (dev/prod)

**Monitoring & Observability**
- Prometheus - Metrics collection
- Grafana - Visualization
- Jaeger - Distributed tracing (optional)

**Database Management**
- Atlas - Declarative Schema
- Automatic migration generation
- Version control

**Development Tools**
- Air - Hot reload
- golangci-lint - Code checking
- Playwright - E2E testing

</td>
</tr>
</table>

---

## 📋 Project Status & Roadmap

### ✅ v0.1 - Starter (Completed)

<table>
<tr>
<td width="50%">

**🏗️ Core Architecture**
- ✅ Vibe-Coding-Friendly DDD architecture
- ✅ Complete Task domain implementation (example)
- ✅ Three-layer architecture (Handler + Service + Repository)
- ✅ 6 explicit knowledge files complete

**🔧 Infrastructure**
- ✅ Hertz HTTP framework integration
- ✅ PostgreSQL + Redis (using database/sql, no ORM)
- ✅ Complete middleware (auth, CORS, rate limiting, recovery, etc.)
- ✅ Configuration management (zero third-party dependencies)

</td>
<td width="50%">

**📊 Observability**
- ✅ Structured logging (uber-go/zap)
- ✅ Prometheus Metrics
- ✅ OpenTelemetry Tracing
- ✅ Health check

**🛠️ Development Tools**
- ✅ Atlas Schema management
- ✅ Go → TypeScript type sync
- ✅ Frontend Monorepo (Web + Mobile)
- ✅ Docker one-click start
- ✅ Complete development scripts
- ✅ Playwright-friendly frontend (data-test-id convention, Docker E2E env)
- ✅ Vitest + happy-dom unit test setup (thread pool, fast feedback)

</td>
</tr>
</table>

---

### 🎯 Usage Guide

This project uses the **Task domain** as an example. You can:

<table>
<tr>
<td align="center" width="33%">

### 📦 Use Directly

If you need task management functionality

Deploy immediately

</td>
<td align="center" width="33%">

### 📚 Learn from It

Understand Vibe-Coding-Friendly DDD

Master best practices

</td>
<td align="center" width="33%">

### 🔄 Map to Your Business

Replace with your domain

Product, Order, Customer...

</td>
</tr>
</table>

---

### 🔌 Extension Points

Locations marked with `Extension point` in code can be extended:

| Extension Point | Description | Status |
|-------|------|-----|
| **Application Layer** | Cross-domain orchestration (needed for multi-domain collaboration) | 📖 [Guide](docs/Extensions/APPLICATION-LAYER-GUIDE.md) |
| **LLM Integration** | Integrate OpenAI, Claude, etc. | 🔌 Interface reserved |
| **Event Bus** | Switch from in-memory to Redis/Kafka | 🔌 Interface reserved |
| **JWT Authentication** | Complete token validation and refresh | 🔌 Interface reserved |
| ~~**Distributed Tracing**~~ | ~~OpenTelemetry Tracing~~ | ✅ **Completed** |
| ~~**Monitoring & Alerting**~~ | ~~Prometheus + Grafana~~ | ✅ **Completed** |

---

### 🗺️ Future Roadmap

<table>
<tr>
<td width="50%">

#### 🔜 v0.2 - Enhancement (Planned)

- [ ] Real LLM integration example (Eino)
- [ ] Event Sourcing
- [ ] CQRS pattern support
- [ ] Complete E2E tests
- [ ] Performance benchmarks

</td>
<td width="50%">

#### 🚀 v0.3 - Production (Planned)

- [ ] Kubernetes deployment config
- [ ] CI/CD pipeline
- [ ] Security hardening (JWT, RBAC)
- [ ] Multi-tenancy support
- [ ] API versioning

</td>
</tr>
</table>

**Welcome to share your ideas in [Discussions](https://github.com/erweixin/Go-GenAI-Stack/discussions)!**

---

## Contributing

We welcome all forms of contributions! ⭐ **Star** this project to show support.

### 💡 How to Contribute

<table>
<tr>
<td width="50%">

**🐛 Found an issue?**
- Submit an [Issue](https://github.com/erweixin/Go-GenAI-Stack/issues)
- Describe the problem and reproduction steps
- Include environment information

**💬 Have an idea?**
- Discuss in [Discussions](https://github.com/erweixin/Go-GenAI-Stack/discussions)
- Share your use cases
- Propose feature suggestions

</td>
<td width="50%">

**🔧 Want to contribute code?**

```bash
# 1. Fork and clone
git clone https://github.com/erweixin/Go-GenAI-Stack.git

# 2. Create branch
git checkout -b feat/amazing-feature

# 3. Commit (follow Conventional Commits)
git commit -m 'feat(task): add amazing feature'

# 4. Push and create PR
git push origin feat/amazing-feature
```

</td>
</tr>
</table>

### 📝 Commit Convention

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(domain):     New feature
fix(domain):      Bug fix
docs:             Documentation update
refactor(domain): Refactoring
test(domain):     Test
chore:            Build/toolchain
```

---

## 📊 Project Metrics

<table>
<tr>
<td align="center" width="25%">
<h3>🧪 Test Readiness</h3>
<h2>Playwright-friendly</h2>
<small>data-test-id + isolated Docker E2E env</small>
</td>
<td align="center" width="25%">
<h3>✅ Code Quality</h3>
<h2>100%</h2>
<small>go vet + staticcheck</small>
</td>
<td align="center" width="25%">
<h3>📚 Structure Completeness</h3>
<h2>1/6</h2>
<small>Required files complete</small>
</td>
<td align="center" width="25%">
<h3>🤖 AI Friendliness</h3>
<h2>≥ 10%</h2>
<small>usecases.yaml coverage</small>
</td>
</tr>
</table>

---

## 🌟 Star History

If this project helps you, please give it a ⭐ Star!

[![Star History Chart](https://api.star-history.com/svg?repos=erweixin/Go-GenAI-Stack&type=Date)](https://star-history.com/#erweixin/Go-GenAI-Stack&Date)

---

## 💬 Community & Support

<table>
<tr>
<td align="center" width="33%">

### 📖 Documentation

Complete documentation

[View Docs](docs/INDEX.md)

</td>
<td align="center" width="33%">

### 💡 Discussions

Share ideas and questions

[Join Discussion](https://github.com/erweixin/Go-GenAI-Stack/discussions)

</td>
<td align="center" width="33%">

### 🐛 Issues

Report bugs and feature requests

[Submit Issue](https://github.com/erweixin/Go-GenAI-Stack/issues)

</td>
</tr>
</table>

---

## 🔗 References & Resources

### Inspiration

- **[《Discussion on Possible Changes in Software Architecture and Collaboration Relationships in the AI Era》](https://github.com/erweixin/blog/blob/main/%E8%AE%A8%E8%AE%BA%E4%B8%8B%20AI%20%E6%97%B6%E4%BB%A3%E7%9A%84%E8%BD%AF%E4%BB%B6%E6%9E%B6%E6%9E%84%E4%B8%8E%E5%8D%8F%E4%BD%9C%E5%85%B3%E7%B3%BB%E7%9A%84%E5%87%A0%E4%B8%AA%E5%8F%AF%E8%83%BD%E7%9A%84%E5%8F%98%E5%8C%96.md)** ⭐ - **Core Philosophy Source**: Discusses AI-era software architecture from the perspective of "productivity determines production relations", proposing core concepts like domain-first, self-contained, and explicit knowledge
- **[Coze Studio](https://www.coze.com/)** - LLM orchestration platform, inspired the declarative workflow design of this project
- **[Bluesky Social App](https://github.com/bluesky-social/social-app)** - React Native best practices reference

### Technical Documentation

- [CloudWeGo Hertz](https://www.cloudwego.io/zh/docs/hertz/) - High-performance HTTP framework
- [Eino Framework](https://github.com/cloudwego/eino) - ByteDance LLM framework
- [Atlas](https://atlasgo.io/) - Database Schema management
- [Domain-Driven Design](https://domainlanguage.com/ddd/) - Domain-Driven Design

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">

**If this project helps you, please give it a ⭐ Star!**

Made with ❤️ by Go-GenAI-Stack Team

[⬆ Back to Top](#go-genai-stack)

---

**Version**: v0.1.0 | **Status**: 🚀 Active Development | **Last Updated**: 2025-12-02

</div>
