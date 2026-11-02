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

---

## 🌐 Cloud Deployment Guide (How We Deploy the Backend)

The PortFlow backend is architected for free, resilient cloud hosting using **Render** (Node.js Web Service) and **Supabase** (Managed PostgreSQL 15).

### 1. Deployment Architecture

```
                  ┌──────────────────────────────────────────────┐
                  │           Render Cloud Platform              │
                  │                                              │
Git Push (main) ──►  Auto-Build Pipeline                         │
                  │  1. npm install (runs prisma generate)       │
                  │  2. npm run build (tsc compiles to dist/)    │
                  │  3. npm start (node index.js)                │
                  │                                              │
                  │  Express 5 Dual REST + GraphQL Server        │
                  │  Port: 10000 | Health: /health               │
                  └──────────────┬───────────────────────────────┘
                                 │
                 PostgreSQL Connection Pooling
                                 ▼
                  ┌──────────────────────────────────────────────┐
                  │            Supabase Cloud                    │
                  │                                              │
                  │  • Pooled Connection (Port 6543, PgBouncer)  │
                  │    Used by DATABASE_URL for API transactions │
                  │  • Direct Connection (Port 5432)             │
                  │    Used by DIRECT_URL for Prisma migrations  │
                  │  • 12 3NF Tables + B-Tree Indexes            │
                  └──────────────────────────────────────────────┘
```

---

### 2. Method A: Automatic Deployment via Render Blueprint (Recommended)

PortFlow includes an Infrastructure-as-Code (IaC) configuration at the repository root ([`render.yaml`](../render.yaml)).

1. **Log in to Render:** Go to [Render Dashboard](https://dashboard.render.com/).
2. **Create New Blueprint:** Click **New +** $\rightarrow$ **Blueprint**.
3. **Connect Repository:** Select your `PortFlow` repository (`main` branch).
4. **Render Blueprint Discovery:** Render detects `render.yaml` automatically with these pre-configured settings:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/health`
5. **Set Environment Variables:**
   | Variable | Value / Description |
   | :--- | :--- |
   | `DATABASE_URL` | Supabase Transaction Pooler URL (Port `6543` with `?pgbouncer=true`) |
   | `DIRECT_URL` | Supabase Direct Connection URL (Port `5432` or session pooler) |
   | `JWT_SECRET` | Auto-generated or custom 32+ character secret string |
   | `CORS_ORIGIN` | Your deployed Vercel frontend URL (or `*` during initial testing) |
   | `NODE_ENV` | `production` (pre-filled by `render.yaml`) |
   | `PORT` | `10000` (pre-filled by `render.yaml`) |
6. **Click "Apply":** Render provisions the web service, builds the TypeScript bundle, runs `postinstall: prisma generate`, and starts the live server.

---

### 3. Method B: Manual Web Service Deployment on Render

If not using Blueprints, create a standard Web Service:

1. Click **New +** $\rightarrow$ **Web Service**.
2. Select your `PortFlow` Git repository.
3. Configure the service details:
   - **Name:** `portflow-backend`
   - **Region:** Choose closest to your Supabase region (e.g., Singapore `ap-southeast-1` or Oregon `us-west`).
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Runtime:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free`
4. Expand **Advanced** $\rightarrow$ add **Health Check Path:** `/health`.
5. Under **Environment Variables**, add:
   ```env
   NODE_ENV=production
   PORT=10000
   DATABASE_URL=postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
   DIRECT_URL=postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
   JWT_SECRET=your_super_secret_jwt_key_at_least_32_chars_long
   CORS_ORIGIN=https://portflow-client.vercel.app
   ```
6. Click **Create Web Service**.

---

### 4. Verifying the Deployment

Once Render displays **"Live"**, verify your endpoints:

1. **Health & DB Check:**
   ```bash
   curl https://your-backend.onrender.com/health
   ```
   **Expected Response (HTTP 200):**
   ```json
   {
     "status": "ok",
     "service": "PortFlow Backend",
     "environment": "production",
     "databaseConnected": true,
     "graphqlReady": true,
     "timestamp": "2026-11-02T12:00:00.000Z"
   }
   ```
2. **GraphQL Sandbox Check:**
   Visit `https://your-backend.onrender.com/graphql` in a browser or test via POST:
   ```bash
   curl -X POST https://your-backend.onrender.com/graphql \
     -H "Content-Type: application/json" \
     -d '{"query":"{ portDashboardOverview { totalVesselsInPort totalActiveOperations } }"}'
   ```

---

### 5. Production Nuances & Best Practices

- **Free Tier Cold Starts:** Render free services spin down after 15 minutes of inactivity. The first request takes ~30–50 seconds to warm up; subsequent requests respond in `<50ms`.
- **PgBouncer Port 6543:** Always use port `6543` for `DATABASE_URL` so serverless or ephemeral Node.js connections do not exhaust PostgreSQL connection limits.
- **Compiled Execution:** In production, `npm start` executes `node index.js`, which directly requires `./dist/index.js` (compiled by `tsc`). `ts-node` is never invoked in production, keeping memory usage minimal.
