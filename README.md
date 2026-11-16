<div align="center">
  <img src="./frontend/public/image/primarylogo.png" alt="PortFlow Logo" width="460" />

# ⚓ PortFlow — Smart Maritime Port Management System

**A Complete Full-Stack Port Operations Platform with Built-in OS Scheduling & 12-Table Relational DBMS Engines**

[![Frontend](https://img.shields.io/badge/Frontend-React_19_%7C_Vite_%7C_TypeScript-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Backend](https://img.shields.io/badge/Backend-Node.js_%7C_Express_5_%7C_TypeScript-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/Database-PostgreSQL_15_%7C_Supabase-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![ORM](https://img.shields.io/badge/ORM-Prisma-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![APIs](https://img.shields.io/badge/APIs-REST_%26_Apollo_GraphQL-FF4154?logo=graphql&logoColor=white)](https://graphql.org/)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](#-license)

</div>

---

## 📑 Table of Contents

- [🌊 What is PortFlow?](#-what-is-portflow)
- [🏛️ System Architecture](#️-system-architecture)
- [📊 Class Diagram (OS Simulation Engine)](#-class-diagram-os-simulation-engine)
- [🗄️ Entity Relationship (ER) Diagram (12-Table 3NF Design)](#️-entity-relationship-er-diagram-12-table-3nf-design)
- [🧠 Operating System (OS) Concepts in Plain English](#-operating-system-os-concepts-in-plain-english)
- [💾 Database (DBMS) Concepts in Plain English](#-database-dbms-concepts-in-plain-english)
- [✨ Key Features & Modules](#-key-features--modules)
- [🗑️ Trash & 10-Table Soft-Delete Recovery System](#️-trash--10-table-soft-delete-recovery-system)
- [📦 Enterprise High-Volume Seeding (100 Users, 500+ Rows/Table)](#-enterprise-high-volume-seeding-100-users-500-rowstable)
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

1. **Physical Port Management**: Track ships arriving at sea, berths for docking, cranes for container lifting, reefer/dry warehouses, drayage trucks, gate passes, customs border compliance, and automated tariff billing.
2. **OS Scheduling Simulator**: Treats port operations like CPU processes. Cranes are locked using **Mutexes**, berths are managed using **Counting Semaphores**, and unloading tasks are scheduled using **FCFS, SJF, Priority, and Round Robin** algorithms with automatic **Deadlock Detection**.
3. **Dual API Architecture**: Fast transactional endpoints via **REST API** (`/api/*`) and composite relational data fetching via **Apollo GraphQL** (`/graphql`).
4. **High-Performance Relational Database**: Built on **PostgreSQL 15 (Supabase)** with 12 normalized tables in strict 3NF, B-Tree indexes on all foreign keys and filter fields, soft-deletes, and in-memory TTL caching.
5. **Universal Trash & Recovery Bin**: 1-click restore or permanent purge across all 10 soft-deletable resources (operations, ships, cargo, equipment, warehouses, trucks, gate passes, customs, bills, issues).

---

## 🏛️ System Architecture

PortFlow uses a **Modular Monolith Architecture** within a monorepo. The React frontend and the Express backend are decoupled and communicate through typed REST and GraphQL APIs.

```mermaid
graph TB
    subgraph CLIENT["1. Client Layer (React 19 + Vite + Tailwind CSS)"]
        UI["Operator Single Page Application"]
        P1["Dashboard Overview"]
        P2["Vessels & Berthing"]
        P3["Containers & Cargo Manifests"]
        P4["Equipment & Quay Cranes"]
        P5["Logistics Hub (Warehouses, Trucks, Gate Passes, Customs)"]
        P6["Transactions & Invoices (Tariff Engine & Receipts)"]
        P7["Operations & CPU Scheduler (FCFS / SJF / Priority)"]
        P8["System & Audit Logs (Fault-Tolerant Runtime Telemetry)"]
        P9["Trash & Recovery Bin (10 Collections 1-Click Restore)"]
    end

    subgraph GATEWAY["2. Backend Server (Node.js + Express 5)"]
        AUTH_CHECK["Security Middleware (JWT Auth + Helmet + Rate Limit)"]
        REST_API["REST API Router (/api/*)"]
        GRAPHQL_API["Apollo GraphQL Server (/graphql)"]
    end

    subgraph SERVICES["3. Business Logic (Service Layer)"]
        AUTH_SVC["Auth Service (Login, Register, Demo Accounts)"]
        OPS_SVC["Operations Service (Process Control Blocks & Dispatches)"]
        SHIP_SVC["Ships Service (Vessels & Berthing Allocations)"]
        EQUIP_SVC["Equipment Service (Cranes & Berths)"]
        BILL_SVC["Billing Service (Automated Tariff Calculations & Line Items)"]
        TRASH_SVC["Trash Service (10-Collection Soft-Delete & Restore)"]
    end

    subgraph OS_SIM["4. OS Simulation Engine (In-Memory Kernel)"]
        PORT_SYS["PortSystem (Singleton Coordinator)"]
        SCHEDULER["CPU Scheduler (FCFS / SJF / Priority / Round Robin)"]
        MUTEX["Mutex Locks (1 Crane = 1 Job at a time)"]
        SEMAPHORE["Counting Semaphore (Available Berths Pool)"]
        DEADLOCK["Deadlock Detector (Wait-For Graph Cycle Finder)"]
    end

    subgraph DATABASE["5. Database Layer (PostgreSQL / Supabase via Prisma)"]
        PRISMA["Prisma ORM (Data Access Layer with B-Tree Indexes)"]
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

---

## 📊 Class Diagram (OS Simulation Engine)

This diagram shows the core TypeScript classes running inside the PortFlow scheduling kernel:

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

---

## 🗄️ Entity Relationship (ER) Diagram (12-Table 3NF Design)

PortFlow is designed in strict **Third Normal Form (3NF)** with 12 relational tables. Zero redundant columns, full foreign key referential integrity, and B-Tree indexes:

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
        string type "Berth, Crane, Gantry"
        string status "Available, Occupied, Busy, Maintenance"
        float capacity_metric
        datetime deleted_at
    }

    SHIPS {
        int id PK
        string imo_number UK
        string name
        string vessel_type
        int capacity_teu
        string status "Docked, Berthed, Arriving, Arrived"
        int berth_equipment_id FK
        datetime deleted_at
    }

    WAREHOUSES {
        int id PK
        string code UK
        string name
        string zone_type "Dry, Reefer, Dangerous Goods, Bonded"
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
        string status "On Ship, In Yard, Cleared, Discharged"
        datetime deleted_at
    }

    OPERATIONS {
        int id PK
        string process_id UK
        string operation_type
        string ship_name
        int ship_id FK
        int cargo_id FK
        int crane_equipment_id FK
        int berth_equipment_id FK
        int created_by_user_id FK
        int priority
        string status "Queued, Running, Completed"
        int waiting_time_ms
        int turnaround_time_ms
        datetime deleted_at
    }

    TRUCKS {
        int id PK
        string license_plate UK
        string driver_name
        string driver_phone
        string transport_company
        string status "In Transit, Loading, Idle, At Gate"
        float max_payload_tons
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
        string pass_type "Inbound_Delivery, Outbound_Dispatch, Empty_Return"
        string status "Issued, Checked_In, Completed"
        datetime check_in_time
        datetime check_out_time
        datetime deleted_at
    }

    CUSTOMS_INSPECTIONS {
        int id PK
        string inspection_number UK
        int cargo_id FK
        int inspector_id FK
        string declaration_number
        string inspection_type "X-Ray_Scan, Physical_Inspection, Document_Audit"
        string status "Pending, Under_Review, Cleared, Held"
        bigint duty_amount_cents
        string findings
        datetime deleted_at
    }

    BILLS {
        int id PK
        string invoice_number UK
        int ship_id FK
        int cargo_id FK
        int operation_id FK
        string customer_name
        float docking_fee
        float crane_usage_fee
        float storage_fee
        float total_amount
        string currency
        string payment_status "Paid, Pending, Issued, Draft"
        datetime due_date
        datetime paid_at
        datetime deleted_at
    }

    ISSUES {
        int id PK
        string ticket_number UK
        string title
        string description
        string severity "Critical, High, Medium, Low"
        string status "Open, Investigating, Resolved"
        int reported_by_id FK
        int equipment_id FK
        string resolution_notes
        datetime deleted_at
    }

    SYSTEM_LOGS {
        int id PK
        datetime timestamp
        string level "INFO, WARN, ERROR"
        string source
        string message
        string action
        string entity_type
        int entity_id
        int user_id FK
        string ip_address
    }
```

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
| **Primary & Foreign Keys** | Keeps database relationships clean and valid | Surrogate `id SERIAL` + domain unique IDs (`imo_number`, `cargo_number`, `invoice_number`) with explicit `ON DELETE CASCADE / SET NULL`. |
| **B-Tree Indexing** | Makes searching millions of rows fast ($O(\log N)$) | B-Tree indexes on `status`, `deleted_at`, `created_at`, foreign keys, and unique codes. |
| **ACID Transactions** | Guarantees all-or-nothing operations | Atomic operations ensure that completing a discharge updates cargo status, frees the crane, and creates an invoice together. |
| **Soft-Delete Pattern** | Prevents accidental data loss | Rows are stamped with `deleted_at: timestamp`. Deleted items go to the Trash Bin and can be restored in 1 click across all 10 tables. |
| **Query Optimization** | Keeps server response time under 10ms | Point-updates using unique primary keys, selective field projection (`select`), and in-memory TTL caching. |

---

## ✨ Key Features & Modules

1. **Dashboard Overview**: Key performance indicators (active operations, docked vessels, yard freight inventory, available cranes) and direct access to all terminal directories.
2. **Operations & CPU Scheduling**:
   - Create, dispatch, and track ship discharge and loading tasks.
   - Dynamic algorithm switching: toggle between **FCFS, SJF, Priority, and Round Robin** live without restarting the server.
   - Real-time Gantt execution chart and Gantt queue visualization.
3. **Logistics Hub (Fleet, Warehouses, Checkpoints)**:
   - **Warehouses**: Manage CFS dry yards, cold-chain reefer facilities (-18.5°C), hazardous storage silos, and bonded sheds.
   - **Drayage Trucks**: Track transport fleet, license plates, assigned container payloads, and drivers.
   - **Gate Passes**: Automated security gate access passes (Inbound Delivery, Outbound Dispatch, Empty Return) across 8 lanes.
   - **Customs Inspections**: Declaration reviews, X-ray scanning, physical audits, duty fee calculation, and clearances.
4. **Transactions & Invoicing**:
   - Automated tariff calculation when operations complete (docking fees + crane hours + yard storage).
   - Filter invoices by status (All, Pending, Paid), search by customer or vessel, and export itemized ledgers to CSV.
   - Printable official receipts with tax calculation and itemized breakdown.
5. **System & Audit Logs**:
   - Real-time application runtime events and user mutation audits.
   - Fault-tolerant multi-tier fallback architecture ensuring zero 500 errors even during database connectivity drops.
6. **Dual API Protocols**: REST endpoints (`/api/*`) for standard operations; Apollo GraphQL (`/graphql`) for composite relational queries.

---

## 🗑️ Trash & 10-Table Soft-Delete Recovery System

PortFlow provides an enterprise soft-delete recovery system. Deleting any record from any module never destroys data immediately; instead, it is safely quarantined in the **Trash & Recovery Bin**:

* **Supported Resource Collections (10 Tables)**:
  1. `Operations` (Discharge, loading, and shifting processes)
  2. `Ships` (Calling vessels and container carriers)
  3. `Containers` (Cargo manifests and freight)
  4. `Equipment` (Deepwater berths and STS cranes)
  5. `Warehouses` (CFS and cold storage facilities)
  6. `Trucks` (Drayage transport fleet)
  7. `Gate Passes` (Security terminal access passes)
  8. `Customs Inspections` (Border clearance reviews)
  9. `Invoices / Bills` (Tariff invoices)
  10. `Incidents & Issues` (Equipment maintenance tickets)
* **Actions Available**:
  - **1-Click Restore**: Recovers the record back to its active operational table immediately.
  - **Permanent Purge**: Hard-deletes the single record from the database.
  - **Empty Recovery Bin**: Purges all soft-deleted records across all 10 tables in one atomic transaction.
  - **Live Filter Tabs**: Filter trash items by category with real-time record count badges.

---

## 📦 Enterprise High-Volume Seeding (100 Users, 500+ Rows/Table)

PortFlow includes realistic enterprise volume generators to test performance under heavy operational load:

| Table | Count | Data Description |
| :--- | :--- | :--- |
| **`users`** | **100** | 10 Admins, 50 Operators, 15 Customs Officers, 15 Dispatchers, 10 Technicians (`Password123!`) |
| **`equipment`** | **550** | 200 Deepwater Quay Berths, 200 STS Cranes, 150 Yard Gantries |
| **`ships`** | **600** | Ultra-Large Container Vessels (MSC, Maersk, CMA CGM, COSCO, Evergreen, Hapag-Lloyd) |
| **`warehouses`** | **520** | Dry Storage CFS, Reefer Cold Storage (-18.5°C), Hazmat, Customs Bonded |
| **`cargo`** | **1,200** | 20ft & 40ft TEU containers (Electronics, Automotive Parts, Perishables, Chemicals) |
| **`operations`** | **1,500** | OS Scheduling PCBs (Discharge, Loading, Transshipment, Berthing Assist) |
| **`trucks`** | **550** | Drayage fleet with license plates, transport carriers, and drivers |
| **`gate_passes`** | **850** | Gate access passes across 8 security lanes |
| **`customs_inspections`** | **750** | X-Ray and physical inspections with declaration numbers and duty amounts |
| **`bills`** | **800** | Itemized tariff invoices (docking, crane usage, and storage fees) |
| **`issues`** | **600** | Mechanical breakdown alerts and equipment telemetry failure tickets |
| **`system_logs`** | **2,500** | OS scheduler dispatches, mutex lock/unlock events, and security audits |

### How to Seed the Database:
1. **Via Node CLI** (Prisma chunked batch seeder):
   ```bash
   cd backend
   npm run seed:heavy
   ```
2. **Via Supabase SQL Editor (Instant < 2s execute)**:
   Copy and run the contents of [`backend/prisma/seed_large.sql`](./backend/prisma/seed_large.sql) directly in your Supabase SQL Editor.
3. **In-Memory Fallback Mode**:
   All controllers and services include pre-populated in-memory datasets of 500+ records each so the UI is immediately functional in offline/mock environments.

---

## 📂 Project Folder Structure

```
portflow/
├── backend/                    # Node.js + Express 5 + TypeScript API Server
│   ├── prisma/                 # Prisma ORM schema & seed scripts
│   │   ├── schema.prisma       # 12-table 3NF schema with B-Tree indexes
│   │   └── seed_large.sql      # Raw PostgreSQL 100-user 500+ record seeder
│   ├── src/
│   │   ├── config/             # DB connection pool (Prisma singleton) & seeders
│   │   ├── controllers/        # Request handlers & JSON responses
│   │   ├── graphql/            # Apollo GraphQL schemas & resolvers
│   │   ├── interfaces/         # TypeScript contracts & DIP abstractions
│   │   ├── middleware/         # JWT auth, RBAC, helmet, rate-limiters
│   │   ├── models/             # Domain entities & DTOs
│   │   ├── os/                 # OS Simulator Kernel (Schedulers, Mutex, Semaphores)
│   │   │   └── __tests__/      # Jest unit tests for OS algorithms
│   │   ├── repositories/       # Prisma query layer (Operations, Ships, Cargo, Trash)
│   │   ├── routes/             # REST API route definitions (/api/*)
│   │   ├── services/           # Domain business rules (Billing, Operations, Auth)
│   │   └── index.ts            # Application entrypoint & HTTP server
│   ├── scripts/                # Database alignment & seeding scripts
│   └── package.json
│
├── frontend/                   # React 19 + Vite + Tailwind CSS Single Page App
│   ├── src/
│   │   ├── auth/               # Auth provider & protected route guards
│   │   ├── components/         # Reusable UI widgets, navigation & sidebar
│   │   ├── lib/                # API client facade (REST & GraphQL)
│   │   ├── pages/              # Full-page views:
│   │   │   ├── DashboardPage.tsx     # Terminal metrics overview
│   │   │   ├── ShipsPage.tsx         # Marine vessels & berthing
│   │   │   ├── CargoPage.tsx         # Container manifests
│   │   │   ├── EquipmentPage.tsx     # Quay cranes & berths
│   │   │   ├── LogisticsPage.tsx     # Warehouses, trucks, gate, customs
│   │   │   ├── TransactionsPage.tsx  # Invoices & automated tariffs
│   │   │   ├── OperationsPage.tsx    # Live operational processes
│   │   │   ├── SchedulingPage.tsx    # OS CPU scheduling engine
│   │   │   ├── LogsPage.tsx          # Real-time system & audit trail
│   │   │   ├── TrashPage.tsx         # 10-table soft-delete recovery
│   │   │   └── ProfilePage.tsx       # Operator account settings
│   │   ├── App.tsx             # Client-side router & layout
│   │   └── main.tsx            # React application entrypoint
│   └── package.json
│
├── folder/                     # System design diagrams (Mermaid & Draw.io XML)
│   └── DIAGRAMS.md             # Complete system architecture documentation
├── load-test.k6.js             # Grafana k6 performance & stress load test
├── render.yaml                 # Render cloud deployment blueprint
├── package.json                # Root orchestration scripts
└── README.md                   # Complete documentation
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
# Install root, backend, and frontend dependencies
npm install
npm install --prefix backend
npm install --prefix frontend
```

### 3. Configure Environment Variables
Create a `.env` file inside the `backend/` folder:
```env
PORT=10000
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres"
JWT_SECRET="your-super-secure-jwt-secret-key-min-32-chars"
CORS_ORIGIN="http://localhost:5173"
NODE_ENV="development"
```

### 4. Run Database Setup & Seeding
```bash
cd backend
npx prisma generate
npx prisma db push
npm run seed:heavy
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
# Run all OS Scheduler, PortSystem, and Billing Service unit tests
npm test --prefix backend

# Build backend and verify TypeScript compilation
npm run build --prefix backend

# Build frontend production bundle
npm run build --prefix frontend

# Run Grafana k6 stress test (simulates 50 to 3,000 concurrent users)
k6 run load-test.k6.js
```

---

## 🔑 Demo Login Credentials

100 pre-seeded demo accounts across multiple terminal roles are ready for testing:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@portflow.com` | `Password123!` | Full system access, empty trash, user management |
| **Operator** | `operator@portflow.com` | `Password123!` | Operations dispatch, vessel berthing, containers |
| **Customs** | `customs@portflow.com` | `Password123!` | Customs inspections, declaration review, clearances |
| **Dispatcher**| `dispatch@portflow.com` | `Password123!` | Drayage trucks, gate passes, warehouse transfers |
| **Technician**| `tech1@portflow.com` | `Password123!` | Crane maintenance tickets, incident logging |

*(You can also click the **"Quick Demo Login"** button on the login screen to sign in instantly.)*

---

## ☁️ Cloud Deployment Guide

PortFlow is pre-configured for deployment on **Render** (Backend) and **Vercel** (Frontend):

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
4. Click **Deploy**. Vercel will build with Vite and apply SPA rewrites.

---

## 📄 License

This project is licensed under the **ISC License** — see the [LICENSE](./LICENSE) file for details.
