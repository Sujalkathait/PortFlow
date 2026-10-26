# ⚓ PortFlow Backend — Dual REST & GraphQL Engine

**A High-Performance Node.js & TypeScript Backend Service with Custom OS Simulator & PostgreSQL 3NF Database**

---

## 🌊 Overview (Simple English)

The **PortFlow Backend** coordinates all real-time port activity. It powers the web portal by providing two powerful APIs:
1. **REST API (`/api/*`)**: Fast, lightweight endpoints for user login, container mutations, and triggering the OS CPU scheduler.
2. **Apollo GraphQL API (`/graphql`)**: A flexible graph engine for querying nested relationships (Vessels $\rightarrow$ Berths $\rightarrow$ Cargo $\rightarrow$ Bills) in a single request without roundtrips.

It also runs an **In-Memory OS Simulator** that treats port equipment like computer hardware:
- **Cranes** are protected by **Mutex Locks** (1 Crane = 1 Job at a time).
- **Berths** are managed by **Counting Semaphores** (Limits docked ships to available parking slots).
- **Jobs** are scheduled by a **CPU Scheduler** using **FCFS, SJF, Priority, and Round Robin** algorithms.

---

## 🏗️ Architecture & Layered LLD

The backend uses a clean, decoupled 5-tier architecture:

```
src/
├── config/             # DB connection pool (Prisma singleton) & initial seeding
├── controllers/        # HTTP handlers: parses requests, calls services, sends JSON
├── graphql/            # Apollo Server setup, GraphQL type definitions & resolvers
├── interfaces/         # TypeScript interface contracts for repositories & services
├── middleware/         # Security headers (Helmet), JWT authentication, rate limiting
├── models/             # Domain data shapes and Data Transfer Objects (DTOs)
├── os/                 # OS Simulator Kernel (Processes, Schedulers, Mutex, Semaphores)
│   └── __tests__/      # Jest automated unit tests for OS algorithms
├── repositories/       # Fast database query layer using Prisma ORM
├── routes/             # Express REST router definitions (/api/*)
├── services/           # Business logic & bridge to OS simulator
└── index.ts            # Server entrypoint (initializes REST, GraphQL, & Database)
```

### Simple Request Flow:
```
Client Request ──► Express Router / GraphQL ──► Auth Middleware (JWT)
  ──► Controller / Resolver ──► Domain Service ◄──► OS Simulation Kernel
  ──► Repository Layer ──► Prisma ORM ──► PostgreSQL (Supabase)
```

---

## 🔌 API Endpoints Reference

### 1. Main Entry Points
* **Health Probe:** `GET /health` (Checks database connection and server uptime)
* **REST API Base:** `http://localhost:10000/api`
* **Apollo GraphQL:** `http://localhost:10000/graphql` (Interactive query playground in development)

### 2. REST Endpoints (`/api`)
| Route | Method | Access | What It Does |
| :--- | :--- | :--- | :--- |
| `/api/auth/register` | `POST` | Public | Create a new operator account |
| `/api/auth/login` | `POST` | Public | Sign in and receive a secure JWT token |
| `/api/auth/me` | `GET` | Authenticated | Get current operator profile |
| `/api/auth/forgot-password` | `POST` | Public | Request a 6-digit OTP for password reset |
| `/api/auth/verify-otp` | `POST` | Public | Verify OTP code (valid for 30 seconds) |
| `/api/auth/reset-password` | `POST` | Public | Set new password after OTP verification |
| `/api/operations` | `GET, POST` | Authenticated | List all port operations or create a new job |
| `/api/operations/:id` | `GET, PUT, DELETE` | Authenticated | View, modify, or move an operation to trash |
| `/api/operations/dispatch` | `POST` | Authenticated | Tell the OS scheduler to execute the next ready job |
| `/api/os/state` | `GET` | Authenticated | View live ready queue, crane lock states, and deadlocks |
| `/api/os/algorithm` | `PUT` | Authenticated | Switch scheduling algorithm (`FCFS`, `SJF`, `Priority`, `RoundRobin`) |
| `/api/ships` | `GET, POST` | Authenticated | Manage incoming marine vessels and berth parking |
| `/api/cargos` | `GET, POST` | Authenticated | Manage shipping containers and yard inventory |
| `/api/equipments` | `GET, POST` | Authenticated | Manage cranes and berth equipment status |
| `/api/system/logs` | `GET` | Authenticated | View live kernel and system audit logs |
| `/api/system/reports` | `GET` | Authenticated | Database analytics and SQL JOIN benchmarks |
| `/api/trash` | `GET, POST, DELETE` | Authenticated | View trash bin, restore items, or empty permanently |

---

## ⚙️ The OS Simulation Engine

Located in `src/os/`, this engine brings operating system concepts to life:

1. **Process (`Process.ts`):** Models an operation with PID, arrival time, burst duration, priority, and state (`READY`, `RUNNING`, `TERMINATED`).
2. **CPU Schedulers (`Scheduler.ts`):**
   - **FCFS (First-Come, First-Served):** Ships serviced in order of arrival.
   - **SJF (Shortest Job First):** Shortest container discharge scheduled first to minimize average wait time.
   - **Priority:** High-priority cargo (e.g. cold storage medicine, hazardous goods) dispatched first.
   - **Round Robin:** Fair time-sharing using a configurable time quantum (e.g. 1500ms).
3. **Mutual Exclusion (`Mutex.ts`):** Ensures a physical crane cannot be claimed by two operations at the same time.
4. **Counting Semaphore (`Semaphore.ts`):** Manages available docking berths as a shared counter pool.
5. **Deadlock Detection (`DeadlockDetector.ts`):** Runs Depth-First Search (DFS) on the Wait-For Graph (WFG) to catch circular waiting conditions.

---

## 🚀 Setup & Local Execution

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (`.env`)
Create a `.env` file in `backend/` (see [`.env.example`](./.env.example)):
```env
PORT=10000
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres"
JWT_SECRET="your-secure-jwt-secret-key-32-chars-minimum"
CORS_ORIGIN="http://localhost:5173"
NODE_ENV="development"
```

### 3. Generate Prisma Client & Run Migrations
```bash
npx prisma generate
npx prisma db push
```

### 4. Start the Server
* **Development (Hot Reload):** `npm run dev`
* **Production Build:** `npm run build`
* **Production Start:** `npm start` (Runs compiled code in `dist/index.js`)

---

## 🧪 Automated Testing

```bash
# Run Jest unit tests for OS Schedulers and PortSystem
npm test

# Run tests with code coverage analysis
npm run test:coverage
```
