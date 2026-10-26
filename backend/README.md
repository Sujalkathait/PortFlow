# ⚓ PortFlow Backend — Dual REST & GraphQL Engine

The backend for **PortFlow** is an enterprise-grade service built with **Node.js, Express, TypeScript, and Prisma ORM**, backed by a **Supabase PostgreSQL** database. It runs a custom in-memory **Operating System (OS) Concurrency & Simulation Engine** alongside dual REST and GraphQL APIs.

---

## 🏗️ Architecture & Layered LLD

The backend strictly follows a decoupled, layered architecture:

```
src/
├── config/             # Database connection, Prisma singleton, and initial seeding
├── controllers/        # HTTP Request & Response handlers (status codes, JSON serialization)
├── graphql/            # Apollo Server setup, schema definitions, and GraphQL resolvers
├── interfaces/         # Repository, Service, and Entity contracts (DIP / SOLID)
├── middleware/         # JWT authentication, RBAC, helmet headers, and rate limiters
├── models/             # Domain entities and Data Transfer Objects (DTOs)
├── os/                 # Custom OS Simulation Kernel (Processes, Schedulers, Locks, Deadlock)
├── repositories/       # Data Access Layer (Prisma ORM queries)
├── routes/             # Express API route endpoints
├── services/           # Domain business logic & OS kernel synchronization
└── index.ts            # Application bootstrap and server lifecycle
```

### Data Flow
```
Client Request -> Express Router / Apollo GraphQL -> Auth Middleware (JWT/RBAC) 
  -> Controller / Resolver -> Domain Service <-> OS Simulation Kernel
  -> Repository Pattern -> Prisma ORM -> PostgreSQL (Supabase)
```

---

## 🔌 API Endpoints & Interfaces

### 1. Dual Engine Entry Points
* **Health Check:** `GET /health` (Returns DB connectivity, service status, and timestamp)
* **API Manifest:** `GET /` (Engine metadata and documentation links)
* **Apollo GraphQL Endpoint:** `POST /graphql` (Interactive GraphQL Sandbox enabled in development)

### 2. REST API Routes (`/api`)
| Route | Method | Access | Description |
| :--- | :--- | :--- | :--- |
| `/api/auth/register` | `POST` | Public | Registers a new user account |
| `/api/auth/login` | `POST` | Public | Authenticates credentials and returns signed JWT |
| `/api/auth/me` | `GET` | Authenticated | Fetches profile of the currently logged-in user |
| `/api/auth/forgot-password` | `POST` | Public | Generates OTP for password recovery |
| `/api/auth/verify-otp` | `POST` | Public | Validates 6-digit password reset OTP |
| `/api/auth/reset-password` | `POST` | Public | Updates user password after OTP verification |
| `/api/operations` | `GET, POST` | Authenticated | Lists all port operations or creates a new job |
| `/api/operations/:id` | `GET, PUT, PATCH, DELETE` | Authenticated | Inspects, modifies, or soft-deletes a specific operation |
| `/api/operations/dispatch` | `POST` | Authenticated | Triggers the OS scheduler to dispatch the next ready job |
| `/api/os/state` | `GET` | Authenticated | Inspects active scheduler queue, locks, and deadlock state |
| `/api/os/algorithm` | `PUT` | Authenticated | Dynamically switches CPU scheduling algorithm (`FCFS`, `SJF`, `Priority`, `RoundRobin`) |
| `/api/ships` | `GET, POST` | Authenticated | Manages arriving vessels and berths |
| `/api/cargos` | `GET, POST` | Authenticated | Manages shipping containers and yard inventory |
| `/api/equipments` | `GET, POST` | Authenticated | Manages cranes and berths |
| `/api/system/logs` | `GET` | Authenticated | Fetches real-time system audit logs |
| `/api/system/analytics` | `GET` | Authenticated | Fetches database metrics and turnaround analytics |
| `/api/trash` | `GET, POST, DELETE` | Authenticated | Inspects, restores, or permanently purges soft-deleted items |

---

## ⚙️ The OS Simulation Kernel

Located in `src/os/`, the engine models real-world maritime operations as operating system processes:

* **Process Control Block (PCB) (`Process.ts`):** Models each task with PID, burst time, arrival time, priority, and state (`NEW`, `READY`, `RUNNING`, `WAITING`, `TERMINATED`).
* **Pluggable CPU Schedulers (`Scheduler.ts`):**
  * `FCFSStrategy`: First-Come, First-Served based on arrival timestamps.
  * `SJFStrategy`: Shortest Job First to minimize average wait time.
  * `PriorityStrategy`: Schedules operations with highest priority weights first.
  * `RoundRobinStrategy`: Time-sliced scheduling with configurable quantum.
* **Synchronization & Mutual Exclusion:**
  * **Mutex (`Mutex.ts`):** Enforces exclusive 1:1 access for Cranes to prevent collisions.
  * **Counting Semaphore (`Semaphore.ts`):** Controls multi-slot parking capacity for Berths.
* **Deadlock Detection (`DeadlockDetector.ts`):** Runs Depth-First Search (DFS) cycle detection over the active Wait-For Graph (WFG).

---

## 🚀 Setup & Installation

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (`.env`)
Create a `.env` file in the `backend/` directory:
```env
PORT=10000
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
JWT_SECRET="your-32-character-secret-key-goes-here"
CORS_ORIGIN="http://localhost:5173"
NODE_ENV="development"
```

### 3. Generate Prisma Client & Migrate
```bash
npx prisma generate
npx prisma db push
```

### 4. Start Development Server
```bash
npm run dev
```
*Server starts on `http://localhost:10000`.*

---

## 🧪 Testing & Load Testing Suite

The backend includes a comprehensive testing setup covering unit tests, OS algorithm correctness, and high-concurrency load testing.

### Run Unit Tests
```bash
# Run all Jest test suites
npm test

# Run tests in watch mode
npm run test:watch

# Generate test coverage report
npm run test:coverage
```

### Run Concurrency & User Load Testing
To check how many concurrent users and requests your server can handle:

1. **Run the Automated Load Tester:**
   ```bash
   npm run test:load
   ```
2. **Custom Load & Duration:**
   ```bash
   node scripts/load-test.js --concurrency 100 --duration 20 --url http://localhost:10000/health
   ```
3. **Bypassing Rate Limiting for Stress Tests:**
   The backend includes built-in bypass flags so load tests originating from a single IP are not blocked:
   ```bash
   # Set DISABLE_RATE_LIMIT=true or LOAD_TEST=true in .env or run with:
   node scripts/load-test.js --concurrency 250 --duration 30
   ```
4. **Key Metrics Evaluated:**
   * **Throughput (req/sec):** Target sustained request capacity.
   * **Latency Distribution:** p50 (median), p95, and p99 response times.
   * **Error Rate:** Verifies 0% failed requests under high concurrent load.
