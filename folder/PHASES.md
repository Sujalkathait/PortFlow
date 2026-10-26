<div align="center">
  <h1>🚢 PortFlow — Project Evolution & Phase Roadmap</h1>
  <p><strong>Complete Summary of Phase 1, Phase 2, Phase 3, and Future Phases</strong></p>
</div>

---

## 📌 Phase Summary Matrix

| Milestone | Status | Key Focus | Database Scope | OS Engine Scope | API Protocols |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **Phase 1** | ✅ Complete | Blueprint & Theoretical Foundations | 5 Planned Entities | Conceptual OS Mapping | REST Blueprint |
| **Phase 2** | ✅ Complete | Core Functional MVP & Basic Simulator | 5 Active Tables | FCFS, SJF, Priority, Mutex & Semaphore | REST API (`/api/*`) |
| **Phase 3** | ✅ Complete | Enterprise TOS, Analytics & Testing | 12 Normalized 3NF Tables | Round Robin, WFG Deadlock Detection | Dual REST + Apollo GraphQL |
| **Future** | 🔮 Planned | Land Logistics, Gate Automation & AI | IoT Sensor Tables & Vectors | Preemptive Schedulers & AI Copilot | WebSockets & Redis Pub/Sub |

---

## 🗺️ Phase 1: Blueprint & Architecture (Planning)

### Objective
Establish the theoretical foundation bridging **Computer Science Operating System (OS) concepts** with **real-world maritime port logistics**.

### Key Deliverables
1. **Conceptual OS Mapping:**
   - Cargo loading/unloading tasks mapped to **CPU Processes** with Burst Time ($B_t$), Arrival Time ($A_t$), and Priority ($P$).
   - Quay Cranes modeled as **Mutex Locks** (1 Crane = 1 Job at a time).
   - Docking Berths modeled as **Counting Semaphores** (fixed parking slot counter).
2. **Initial 5-Entity Schema Design:**
   - `users`: Authenticated terminal operators.
   - `ships`: Arriving marine vessels with IMO identifiers.
   - `cargo`: Container freight inventory with TEU sizes.
   - `equipment`: Physical cranes and berths.
   - `operations`: Central job record connecting ships, cargo, and equipment.
3. **Architecture Definition:**
   - Multi-tiered, decoupled client-server architecture inside a monorepo.

---

## ⚙️ Phase 2: Core Engine & First Working Build (MVP)

### Objective
Transform the Phase 1 blueprint into a functional, working full-stack web application with basic CRUD operations and the first version of the OS Simulator.

### Key Deliverables
1. **Full-Stack Implementation:**
   - **Frontend:** React 19 Single Page Application with Tailwind CSS and Radix UI.
   - **Backend:** Node.js, Express 5, and TypeScript with Prisma ORM.
2. **Authentication & Security:**
   - JWT-based authentication with bcrypt password hashing and 30-second expiring OTP password recovery.
3. **OS Simulator v1.0:**
   - **Ready Queue:** Holds waiting port operations.
   - **3 Scheduling Algorithms:**
     - `FCFS` (First-Come, First-Served): Jobs executed in chronological order of arrival.
     - `SJF` (Shortest Job First): Shortest burst time executed first to minimize average waiting time.
     - `Priority`: High-priority cargo dispatched ahead of standard freight.
   - **Mutex & Semaphore Synchronization:** Verified asynchronous resource locking in Node.js.
4. **Soft-Delete Recycle Bin:**
   - Implemented `deleted_at` timestamping across all records to allow 1-click restore from the Trash Bin without data loss.

---

## 🚀 Phase 3: Enterprise Architecture & Dual Engine (Current Release)

### Objective
Scale PortFlow to an enterprise-grade Marine Terminal Operating System (TOS) featuring a 12-table relational database, dual REST + GraphQL APIs, automated testing, and query optimization.

### Key Deliverables
1. **Full 12-Table 3NF Relational Model:**
   - Normalized schema in PostgreSQL 15 (Supabase) with foreign keys and cascade/set-null rules:
     - Core: `users`, `ships`, `cargo`, `equipment`, `operations`, `warehouses`
     - Extended: `trucks`, `gate_passes`, `customs_inspections`, `bills`, `issues`, `system_logs`
2. **Dual-Engine API Architecture:**
   - **REST API (`/api/*`):** Fast mutations, auth, OTP reset, and OS scheduler triggers.
   - **Apollo GraphQL (`/graphql`):** Deep relational graph traversals (`portDashboardOverview`, nested queries) in a single network roundtrip.
3. **Advanced OS Simulation Engine:**
   - Added **Round Robin (`RoundRobinStrategy`)** scheduling with configurable time quantum (1500ms).
   - Added **Deadlock Detection (`DeadlockDetector.ts`)** using Depth-First Search (DFS) on the Wait-For Graph (WFG).
   - Telemetry metrics: Automated tracking of Waiting Time ($W_t$) and Turnaround Time ($T_t$).
4. **Query Performance & Scalability:**
   - Replaced table scans with **$O(1)$ unique B-Tree index lookups** (`findUnique`).
   - Added **in-memory TTL micro-caching (5s)** for dashboard counters and aggregate analytics.
   - Batch ingestion (`createMany`) for high-throughput container manifest imports.
5. **Quality Assurance & Verification:**
   - 100% passing automated Jest unit tests for OS algorithms and PortSystem ([`Scheduler.test.ts`](../backend/src/os/__tests__/Scheduler.test.ts)).
   - Grafana k6 load test script simulating 50 to 3,000 concurrent virtual users ([`load-test.k6.js`](../load-test.k6.js)).
   - Zero linter errors with Oxlint.

---

## 🔮 Future Phases: Roadmap

Planned enhancements for upcoming development cycles:

1. **Automated Land Logistics & Gate Automation:**
   - Optical Character Recognition (OCR) / RFID integration for automatic truck license plate recognition at gates.
   - Automated yard crane dispatch for container pickup/drop-off.
2. **Customs Clearance Workflow:**
   - Digital customs declarations, automated tariff duties calculation, and border security inspection holds.
3. **Distributed Caching & Real-Time Messaging:**
   - Redis cache cluster for global query caching.
   - WebSockets / Socket.io backed by Redis Pub/Sub for multi-operator real-time dispatch chat.
4. **PortFlow AI Copilot (pgvector):**
   - Natural language "Chat with Your Port Data" powered by PostgreSQL `pgvector` semantic search.
