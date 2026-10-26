<div align="center">
  <img src="./frontend/public/image/primarylogo.png" alt="PortFlow Logo" width="460" />

# ⚓ PortFlow — Smart Maritime Port Management System

**A Complete Full-Stack Port Operations Platform with Built-in OS Scheduling & Relational DBMS Engines**

[![Frontend](https://img.shields.io/badge/Frontend-React_19_%7C_Vite_%7C_TypeScript-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Backend](https://img.shields.io/badge/Backend-Node.js_%7C_Express_%7C_TypeScript-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/Database-PostgreSQL_15_%7C_Supabase-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![ORM](https://img.shields.io/badge/ORM-Prisma-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![APIs](https://img.shields.io/badge/APIs-REST_%26_Apollo_GraphQL-FF4154?logo=graphql&logoColor=white)](https://graphql.org/)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](#-license)

</div>

---

## 📑 Table of Contents

- [🌊 What is PortFlow?](#-what-is-portflow)
- [🏛️ System Architecture](#️-system-architecture)
- [📊 Class Diagram (How the Code Works)](#-class-diagram-how-the-code-works)
- [🗄️ Entity Relationship (ER) Diagram (Database Design)](#️-entity-relationship-er-diagram-database-design)
- [🧠 Operating System (OS) Concepts in Plain English](#-operating-system-os-concepts-in-plain-english)
- [💾 Database (DBMS) Concepts in Plain English](#-database-dbms-concepts-in-plain-english)
- [✨ Key Features of PortFlow](#-key-features-of-portflow)
- [📂 Project Folder Structure](#-project-folder-structure)
- [🚀 Quick Start (Run Locally)](#-quick-start-run-locally)
- [🧪 Testing & Verification](#-testing--verification)
- [🔑 Demo Login Credentials](#-demo-login-credentials)
- [☁️ Cloud Deployment Guide](#️-cloud-deployment-guide)
- [📄 License](#-license)

---

## 🌊 What is PortFlow?

Modern commercial shipping ports handle thousands of container vessels, cranes, trucks, and cargo boxes every day. If resources are managed poorly, ships wait for days (causing millions of dollars in demurrage fees) and cranes sit idle.

**PortFlow** solves this problem by combining **Maritime Logistics** with core **Computer Science principles**:

1. **Physical Port Management**: Track ships arriving at sea, berths for parking, cranes for lifting, reefer/dry warehouses, logistics trucks, gate passes, customs checks, and automatic billing.
2. **OS Scheduling Simulator**: Treats port operations like CPU processes. Cranes are locked using **Mutexes**, berths are managed using **Counting Semaphores**, and unloading tasks are scheduled using **FCFS, SJF, Priority, and Round Robin** algorithms with automatic **Deadlock Detection**.
3. **Dual API Architecture**: Fast transactional endpoints via **REST API** (`/api/*`) and composite relational data fetching via **Apollo GraphQL** (`/graphql`).
4. **High-Performance Relational Database**: Built on **PostgreSQL 15 (Supabase)** with 12 normalized tables in 3NF, B-Tree indexes, soft-deletes, and in-memory TTL caching.

---

## 🏛️ System Architecture

PortFlow uses a **Modular Monolith Architecture** within a monorepo. The React frontend and the Express backend are completely decoupled and talk through typed REST and GraphQL APIs.

```mermaid
graph TB
    subgraph CLIENT["1. Client Layer (Frontend)"]
        UI["React 19 + Vite Web Application"]
        P1["Dashboard Overview"]
        P2["Operations & Dispatch"]
        P3["Vessels & Berthing"]
        P4["Cargo & Warehouses"]
        P5["Equipment & Cranes"]
        P6["CPU Scheduling & OS State"]
        P7["System Logs & Analytics"]
        P8["Trash Bin & 1-Click Restore"]
    end

    subgraph GATEWAY["2. Backend Server (Node.js + Express 5)"]
        AUTH_CHECK["Security Middleware (JWT Auth + Helmet + Rate Limit)"]
        REST_API["REST API Router (/api/*)"]
        GRAPHQL_API["Apollo GraphQL Server (/graphql)"]
    end

    subgraph SERVICES["3. Business Logic (Service Layer)"]
        AUTH_SVC["Auth Service (Login, Register, OTP Reset)"]
        OPS_SVC["Operations Service (Job Lifecycle)"]
        SHIP_SVC["Ships Service (Vessels & Berthing)"]
        EQUIP_SVC["Equipment Service (Cranes & Berths)"]
        TRASH_SVC["Trash Service (Soft-Delete & Restore)"]
    end

    subgraph OS_SIM["4. OS Simulation Engine (In-Memory Kernel)"]
        PORT_SYS["PortSystem (Singleton Coordinator)"]
        SCHEDULER["CPU Scheduler (FCFS / SJF / Priority / Round Robin)"]
        MUTEX["Mutex Locks (1 Crane = 1 Job at a time)"]
        SEMAPHORE["Counting Semaphore (Available Berths Pool)"]
        DEADLOCK["Deadlock Detector (Wait-For Graph Cycle Finder)"]
    end

    subgraph DATABASE["5. Database Layer (PostgreSQL / Supabase via Prisma)"]
        PRISMA["Prisma ORM (Data Access Layer)"]
        DB[(PostgreSQL 15 - 12 Tables in 3NF)]
    end

    UI --> AUTH_CHECK
    AUTH_CHECK --> REST_API
    AUTH_CHECK --> GRAPHQL_API
    REST_API --> SERVICES
    GRAPHQL_API --> SERVICES
    OPS_SVC <--> PORT_SYS
    PORT_SYS --> SCHEDULER
    PORT_SYS --> MUTEX
    PORT_SYS --> SEMAPHORE
    PORT_SYS --> DEADLOCK
    SERVICES --> PRISMA
    PRISMA --> DB
```

### Simple Explanation of the Layers:
1. **Frontend**: An interactive web app where port operators view live metrics, assign cranes, and trigger jobs.
2. **API Layer**: Secure doorway with JWT verification and rate limiting. Requests go to either REST routes or Apollo GraphQL.
3. **Service Layer**: Business rules for creating containers, updating berths, calculating tariffs, and validating inputs.
4. **OS Simulator**: In-memory engine that simulates a computer operating system using real cranes and ships as computing resources.
5. **Database Layer**: Centralized 12-table PostgreSQL database ensuring ACID safety and permanent storage.

---

## 📊 Class Diagram (How the Code Works)

This diagram shows the main TypeScript classes that run inside the PortFlow backend engine:

```mermaid
classDiagram
    class Process {
        +string id
        +number arrivalTime
        +number burstTime
        +number remainingTime
        +number priority
        +string status
        +string[] requiredEquipments
        +string[] heldEquipments
        +start() void
        +finish() void
    }

    class Scheduler {
        -Process[] readyQueue
        -SchedulingStrategy strategy
        +setStrategy(strategy) void
        +addProcess(process) void
        +getNextProcess() Process
        +removeProcess(id) void
        +getReadyQueue() Process[]
    }

    class SchedulingStrategy {
        <<interface>>
        +schedule(readyQueue) Process
        +getName() string
    }

    class FCFSStrategy {
        +schedule(readyQueue) Process
        +getName() string
    }

    class SJFStrategy {
        +schedule(readyQueue) Process
        +getName() string
    }

    class PriorityStrategy {
        +schedule(readyQueue) Process
        +getName() string
    }

    class RoundRobinStrategy {
        -number quantumMs
        +schedule(readyQueue) Process
        +getQuantum() number
    }

    class Mutex {
        -boolean locked
        -Process owner
        +lock(process) Promise
        +unlock(process) void
        +isBusy() boolean
        +getOwner() Process
    }

    class Semaphore {
        -number availableSlots
        -number maxCapacity
        +acquire() Promise
        +release() void
        +getAvailable() number
    }

    class DeadlockDetector {
        +detectDeadlock(processes, mutexes) boolean
        +findCycleDFS(waitGraph) string[]
    }

    class PortSystem {
        <<Singleton>>
        -static PortSystem instance
        -Scheduler scheduler
        -Map~string, Mutex~ craneLocks
        -Semaphore berthSemaphore
        -DeadlockDetector detector
        +static getInstance() PortSystem
        +submitOperation(op) void
        +dispatchNext() Process
        +getSystemState() Object
    }

    SchedulingStrategy <|.. FCFSStrategy : implements
    SchedulingStrategy <|.. SJFStrategy : implements
    SchedulingStrategy <|.. PriorityStrategy : implements
    SchedulingStrategy <|.. RoundRobinStrategy : implements

    Scheduler --> SchedulingStrategy : uses
    PortSystem --> Scheduler : owns
    PortSystem --> Mutex : manages cranes
    PortSystem --> Semaphore : manages berths
    PortSystem --> DeadlockDetector : monitors
    Process --> Mutex : holds/waits
```

### Simple Explanation of the Classes:
- **`Process` (The Work Item):** Represents an operation (e.g. Unload 50 containers from Vessel A). It tracks when it arrived, how long it takes (`burstTime`), and its priority.
- **`Scheduler` (The Brain):** Manages the waiting line (`readyQueue`). It picks which job runs next according to the active algorithm.
- **`SchedulingStrategy` (Design Pattern):** Allows switching algorithms at runtime without restarting the server:
  - `FCFSStrategy`: First-Come, First-Served.
  - `SJFStrategy`: Shortest Job First (minimizes average wait time).
  - `PriorityStrategy`: Emergency / high-priority cargo runs first.
  - `RoundRobinStrategy`: Time-shared allocation with fixed time quantum.
- **`Mutex` (Exclusive Crane Lock):** Only **one** process can use a specific crane at a time. Other jobs must wait in line.
- **`Semaphore` (Berth Parking Pool):** A counting counter that limits how many ships can dock simultaneously (e.g. 5 berths = max 5 ships docked).
- **`DeadlockDetector` (Safety Watchdog):** Scans the Wait-For Graph (WFG) using Depth-First Search (DFS) to catch circular waiting locks before they freeze port operations.
- **`PortSystem` (Singleton):** The master coordinator combining all schedulers, locks, and detectors into one shared system.

---

## 🗄️ Entity Relationship (ER) Diagram (Database Design)

PortFlow is designed in strict **Third Normal Form (3NF)** with 12 relational tables. There is zero redundant data, and all tables are linked through foreign keys:

```mermaid
erDiagram
    USERS ||--o{ OPERATIONS : "initiates (created_by_user_id)"
    USERS ||--o{ GATE_PASSES : "issues (issued_by_id)"
    USERS ||--o{ CUSTOMS_INSPECTIONS : "inspects (inspector_id)"
    USERS ||--o{ ISSUES : "reports (reported_by_id)"
    USERS ||--o{ SYSTEM_LOGS : "triggers (user_id)"

    EQUIPMENT ||--o{ SHIPS : "parks at berth (berth_equipment_id)"
    EQUIPMENT ||--o{ OPERATIONS : "crane allocated (crane_equipment_id)"
    EQUIPMENT ||--o{ OPERATIONS : "berth allocated (berth_equipment_id)"
    EQUIPMENT ||--o{ ISSUES : "has issue (equipment_id)"

    SHIPS ||--o{ CARGO : "carries (ship_id)"
    SHIPS ||--o{ OPERATIONS : "serviced in (ship_id)"
    SHIPS ||--o{ BILLS : "billed to (ship_id)"

    WAREHOUSES ||--o{ CARGO : "stored inside (warehouse_id)"

    CARGO ||--o{ OPERATIONS : "moved in (cargo_id)"
    CARGO ||--o{ TRUCKS : "loaded onto (assigned_cargo_id)"
    CARGO ||--o{ GATE_PASSES : "cleared for (cargo_id)"
    CARGO ||--o{ CUSTOMS_INSPECTIONS : "inspected for (cargo_id)"
    CARGO ||--o{ BILLS : "storage billed (cargo_id)"

    TRUCKS ||--o{ GATE_PASSES : "admitted via (truck_id)"

    OPERATIONS ||--o{ BILLS : "invoiced for (operation_id)"

    USERS {
        int id PK
        string email UK
        string password_hash
        string full_name
        string role
        datetime created_at
        datetime deleted_at
    }

    EQUIPMENT {
        int id PK
        string equipment_id UK
        string name
        string type "Berth or Crane"
        string status "Available or Occupied"
        float capacity_metric
        datetime deleted_at
    }

    SHIPS {
        int id PK
        string imo_number UK
        string name
        string vessel_type
        int capacity_teu
        string status "Docked or Arriving"
        int berth_equipment_id FK
        datetime deleted_at
    }

    WAREHOUSES {
        int id PK
        string code UK
        string name
        string zone_type "Reefer or Dry"
        int capacity_teu
        int current_occupancy_teu
        float temperature_celsius
        datetime deleted_at
    }

    CARGO {
        int id PK
        string cargo_number UK
        string size_type "20ft or 40ft"
        float weight_tons
        string cargo_type
        string current_location
        int ship_id FK
        int warehouse_id FK
        string status "On Ship or In Yard"
        datetime deleted_at
    }

    OPERATIONS {
        int id PK
        string process_id UK
        string operation_type
        int ship_id FK
        int cargo_id FK
        int crane_equipment_id FK
        int berth_equipment_id FK
        int created_by_user_id FK
        int priority
        string status "Queued or Running"
        datetime deleted_at
    }

    TRUCKS {
        int id PK
        string license_plate UK
        string driver_name
        string transport_company
        string status
        int assigned_cargo_id FK
        datetime deleted_at
    }

    GATE_PASSES {
        int id PK
        string pass_number UK
        int truck_id FK
        int cargo_id FK
        int issued_by_id FK
        string gate_lane
        string status
        datetime check_in_time
    }

    CUSTOMS_INSPECTIONS {
        int id PK
        string inspection_number UK
        int cargo_id FK
        int inspector_id FK
        string inspection_type
        string status "Cleared or Hold"
        bigint duty_amount_cents
    }

    BILLS {
        int id PK
        string invoice_number UK
        int ship_id FK
        int cargo_id FK
        int operation_id FK
        float total_amount
        string currency
        string payment_status
    }

    ISSUES {
        int id PK
        string ticket_number UK
        string title
        string severity
        string status
        int reported_by_id FK
        int equipment_id FK
    }

    SYSTEM_LOGS {
        int id PK
        datetime timestamp
        string level
        string source
        string message
        int user_id FK
    }
```

### Table Relationships in Plain English:
1. **`users` $\rightarrow$ Everything**: Tracks which operator created an operation, issued a gate pass, approved customs, reported a crane issue, or triggered an audit log.
2. **`equipment` $\rightarrow$ `ships` & `operations`**: Equipment represents both physical Berths (parking) and Cranes (lifting). A Ship docks at a Berth equipment; an Operation reserves a Crane equipment via Mutex.
3. **`ships` $\rightarrow$ `cargo` & `operations`**: A Ship carries multiple Cargo containers (1-to-Many). When operations are scheduled, they reference the specific Ship being serviced.
4. **`warehouses` $\rightarrow$ `cargo`**: Cold storage reefer containers and general dry containers are stored in specific warehouse zones.
5. **`trucks` $\rightarrow$ `cargo` & `gate_passes`**: Logistics trucks pick up containers from the yard. Each truck check-in generates an automated Gate Pass.
6. **`cargo` $\rightarrow$ `customs_inspections`**: Every container undergoes X-ray or physical inspection before customs duty is calculated and cleared.
7. **`operations` $\rightarrow$ `bills`**: Once a ship discharge is completed, an automated tariff bill is generated calculating docking fees, crane hours, and warehouse storage costs.

---

## 🧠 Operating System (OS) Concepts in Plain English

| OS Concept | Port Real-World Analogy | How PortFlow Implements It |
| :--- | :--- | :--- |
| **Process & PCB** | Ship loading or unloading job | Each task is an isolated `Process` object with an ID (`pid`), burst time, arrival time, and execution state (`READY`, `RUNNING`, `TERMINATED`). |
| **CPU Scheduling** | Crane work sequencing | Schedulers pick the next operation from the ready queue using **FCFS, SJF, Priority, or Round Robin**. |
| **Ready Queue** | Waiting line for equipment | Queue where operations wait until their crane and berth are both free. |
| **Mutex Lock** | Exclusive Crane access | Only **one** operation can use a crane at a time to prevent collisions. |
| **Counting Semaphore** | Berth parking slots | A counter limiting how many ships can be docked simultaneously based on physical port space. |
| **Deadlock Avoidance** | Traffic gridlock detection | A Wait-For Graph (WFG) scans for circular wait conditions (e.g., Ship A has Crane 1 waiting for Berth 1; Ship B has Berth 1 waiting for Crane 1). |

---

## 💾 Database (DBMS) Concepts in Plain English

| DBMS Concept | Why It Matters | Implementation in PortFlow |
| :--- | :--- | :--- |
| **3NF Normalization** | Eliminates duplicate data and update anomalies | 12 tables divided cleanly with zero data duplication. |
| **Primary & Foreign Keys** | Keeps database relationships clean and valid | Surrogate `id SERIAL` + domain unique IDs (`imo_number`, `cargo_number`) with explicit `ON DELETE CASCADE / SET NULL`. |
| **B-Tree Indexing** | Makes searching millions of rows fast ($O(\log N)$) | B-Tree indexes on `status`, `deleted_at`, foreign keys, and unique codes. |
| **ACID Transactions** | Guarantees all-or-nothing operations | Atomic operations ensure that completing a discharge updates cargo status, frees the crane, and creates an invoice together. |
| **Soft-Delete Pattern** | Prevents accidental data loss | Rows are stamped with `deleted_at: timestamp`. Deleted items go to the Trash Bin and can be restored in 1 click. |
| **Query Optimization** | Keeps server response time under 10ms | Point-updates using unique primary keys, selective field projection (`select`), and in-memory TTL caching. |

---

## ✨ Key Features of PortFlow

1. **Operations Management**: Create, dispatch, and track ship discharge and loading operations in real time.
2. **Dynamic Algorithm Switching**: Toggle between **FCFS, SJF, Priority, and Round Robin** scheduling live from the UI without restarting the server.
3. **Interactive Relational Analytics**: View foreign key SQL JOIN query benchmarks and table statistics directly on the Reports page.
4. **Live GraphQL Playground**: Test nested GraphQL queries against the `/graphql` Apollo endpoint directly from the browser.
5. **Trash & Recovery Bin**: 1-click restore or permanent purge for accidentally deleted ships, cargo, equipment, or operations.
6. **Dual API Protocols**: REST endpoints for simple actions; Apollo GraphQL for deep relational graph queries.

---

## 📂 Project Folder Structure

```
portflow/
├── backend/                    # Node.js + Express + TypeScript API Server
│   ├── prisma/                 # Prisma ORM schema & migrations
│   ├── src/
│   │   ├── config/             # DB connection pool (Prisma singleton)
│   │   ├── controllers/        # Request handlers & JSON responses
│   │   ├── graphql/            # Apollo GraphQL schemas & resolvers
│   │   ├── interfaces/         # TypeScript contracts & DIP abstractions
│   │   ├── middleware/         # JWT auth, RBAC, helmet, rate-limiters
│   │   ├── models/             # Domain entities & DTOs
│   │   ├── os/                 # OS Simulator Kernel (Schedulers, Mutex, Semaphores)
│   │   │   └── __tests__/      # Jest unit tests for OS algorithms
│   │   ├── repositories/       # Fast Prisma database query layer
│   │   ├── routes/             # REST API route definitions (/api/*)
│   │   ├── services/           # Domain business rules
│   │   └── index.ts            # Application entrypoint & HTTP server
│   ├── scripts/                # Database alignment & seeding scripts
│   └── package.json
│
├── frontend/                   # React 19 + Vite + Tailwind CSS Single Page App
│   ├── src/
│   │   ├── auth/               # Auth provider & protected route guards
│   │   ├── components/         # Reusable UI widgets, navigation & sidebar
│   │   ├── lib/                # API client facade (REST & GraphQL)
│   │   ├── pages/              # Full-page view containers (Dashboard, Ships, Cargo, etc.)
│   │   ├── App.tsx             # Client-side router & layout
│   │   └── main.tsx            # React application entrypoint
│   └── package.json
│
├── folder/                     # System design diagrams (Mermaid & Draw.io XML)
├── load-test.k6.js             # Grafana k6 performance & stress load test
├── render.yaml                 # Render cloud deployment blueprint
├── package.json                # Root orchestration scripts
└── README.md                   # You are here!
```

---

## 🚀 Quick Start (Run Locally)

### Prerequisites
* [Node.js](https://nodejs.org/) v18+ installed
* [Git](https://git-scm.com/) installed
* A free [Supabase](https://supabase.com/) PostgreSQL database (or local PostgreSQL)

### 1. Clone the Repository
```bash
git clone https://github.com/Sujalkathait/PortFlow.git
cd PortFlow
```

### 2. Install Dependencies
```bash
# Install root, backend, and frontend dependencies in one command
npm install
npm install --prefix backend
npm install --prefix frontend
```

### 3. Configure Environment Variables
Create a `.env` file inside the `backend/` folder (use [`backend/.env.example`](./backend/.env.example) as reference):
```env
PORT=10000
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres"
JWT_SECRET="your-super-secure-jwt-secret-key-min-32-chars"
CORS_ORIGIN="http://localhost:5173"
NODE_ENV="development"
```

### 4. Run Database Setup
```bash
cd backend
npx prisma generate
npx prisma db push
cd ..
```

### 5. Start Both Backend & Frontend
From the root folder:
```bash
npm run dev
```
* **Frontend UI:** Open [http://localhost:5173](http://localhost:5173) in your browser.
* **REST API:** [http://localhost:10000/api](http://localhost:10000/api)
* **GraphQL Sandbox:** [http://localhost:10000/graphql](http://localhost:10000/graphql)
* **Health Check:** [http://localhost:10000/health](http://localhost:10000/health)

---

## 🧪 Testing & Verification

PortFlow includes comprehensive unit tests and load testing scripts:

```bash
# Run all OS Scheduler & PortSystem unit tests
npm test

# Run tests with code coverage report
npm run test:coverage

# Run Grafana k6 stress test (simulates 50 to 3,000 concurrent users)
k6 run load-test.k6.js

# Run frontend code quality linter
npm run lint
```

---

## 🔑 Demo Login Credentials

For quick evaluation, pre-seeded operator credentials are ready to use:

* **Email:** `operator@portflow.com`
* **Password:** `Password123!`
* **Role:** Terminal Operator

*(You can also click the **"Quick Demo Login"** button on the login screen to sign in instantly with one click.)*

---

## ☁️ Cloud Deployment Guide

PortFlow is pre-configured for free cloud deployment on **Render** (Backend) and **Vercel** (Frontend):

### Deploy Backend (Render)
1. Go to [Render Dashboard](https://dashboard.render.com/) $\rightarrow$ Click **New +** $\rightarrow$ **Blueprint**.
2. Select your `PortFlow` repository.
3. Render reads [`render.yaml`](./render.yaml) automatically.
4. Fill in your `DATABASE_URL`, `DIRECT_URL`, and `JWT_SECRET`.
5. Click **Apply**.

### Deploy Frontend (Vercel)
1. Go to [Vercel Dashboard](https://vercel.com/) $\rightarrow$ Click **Add New** $\rightarrow$ **Project**.
2. Import `PortFlow` and set the **Root Directory** to `frontend`.
3. Add Environment Variable:
   - `VITE_API_URL`: `https://your-backend.onrender.com/api`
4. Click **Deploy**. Vercel will build with Vite and apply [`frontend/vercel.json`](./frontend/vercel.json) automatic SPA rewrites.

---

## 📄 License

This project is licensed under the **ISC License** — see the [LICENSE](./LICENSE) file for details.
