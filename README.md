<div align="center">
  <img src="./frontend/public/image/primarylogo.png" alt="PortFlow Logo" width="460" />

# ⚓ PortFlow — Smart Maritime Port Management System

**A Full-Stack Port & Terminal Operating Platform with Built-in OS Scheduling & 12-Table Relational DBMS Engine**

[![Frontend](https://img.shields.io/badge/Frontend-React_19_%7C_Vite_%7C_TypeScript-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Backend](https://img.shields.io/badge/Backend-Node.js_%7C_Express_5_%7C_TypeScript-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/Database-PostgreSQL_15_%7C_Supabase-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![ORM](https://img.shields.io/badge/ORM-Prisma-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![APIs](https://img.shields.io/badge/APIs-REST_%26_Apollo_GraphQL-FF4154?logo=graphql&logoColor=white)](https://graphql.org/)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](#-license)

</div>

---

## 📑 Table of Contents

- [🌊 PortFlow in Simple English (The Everyday Guide)](#-portflow-in-simple-english-the-everyday-guide)
- [⏱️ 100-Word Elevator Pitch](#️-100-word-elevator-pitch)
- [🏛️ All 5 System Diagrams (from `folder/DIAGRAMS.md`)](#️-all-5-system-diagrams-from-folderdiagramsmd)
  - [1. System Architecture Diagram](#1-system-architecture-diagram)
  - [2. Class Diagram (OS Simulation Engine)](#2-class-diagram-os-simulation-engine)
  - [3. Entity-Relationship (ER) Diagram (12-Table 3NF Design)](#3-entity-relationship-er-diagram-12-table-3nf-design)
  - [4. Operation Lifecycle Flowchart](#4-operation-lifecycle-flowchart)
  - [5. Sequence Diagram (Request & Response Timeline)](#5-sequence-diagram-request--response-timeline)
  - [🛠️ How to Open & Edit in Draw.io](#️-how-to-open--edit-in-drawio)
- [🧠 Operating System (OS) Concepts Made Simple](#-operating-system-os-concepts-made-simple)
- [💾 Database (DBMS) Concepts Made Simple](#-database-dbms-concepts-made-simple)
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

## 🌊 PortFlow in Simple English (The Everyday Guide)

Imagine a **massive commercial seaport** where giant container ships arrive from all over the world. Thousands of metal shipping containers must be lifted by enormous cranes, stored in warehouses, inspected by customs officials, picked up by transport trucks, and billed accurately.

Without a smart management system, a seaport becomes pure chaos:
* Ships wait for days burning fuel at sea while waiting for a parking spot.
* Cranes sit idle because jobs aren't scheduled efficiently.
* Warehouses overflow, trucks cause traffic jams at terminal gates, and paperwork gets lost.

**PortFlow is the "Digital Brain and Control Tower" for a modern seaport.**
Just as an airport control tower manages airplanes, runways, baggage, and passengers, **PortFlow coordinates ships, docking berths, heavy cranes, storage warehouses, trucks, gate passes, and billing in real-time.**

---

### ⚓ The 6 Core Things PortFlow Does:

1. **🚢 Ship & Dock Management (Berth Parking)**:
   * Tracks incoming vessels, assigns available docks ("berths"), monitors departure times, and prevents two ships from competing for the same berth.
2. **🧠 The "Smart Brain" (OS Scheduling Engine)**:
   * Uses real computer science CPU algorithms (like **First-Come-First-Served**, **Shortest Job First**, and **Priority**) to decide which ship or container gets unloaded first so nobody waits unnecessarily.
3. **📦 Cargo & Warehouse Tracking (Inventory)**:
   * Tracks every container's weight, size (20ft, 40ft), hazard level, and exact shelf location across Dry Yards, CFS Depots, and Reefer Cold Storage facilities (-18.5°C).
4. **🚛 Land Logistics & Security (Trucks, Gates & Customs)**:
   * Issues digital **Gate Passes** to truck drivers for secure terminal entry/exit, logs **Customs Inspections** (X-Ray scan, physical audit, quarantine), and prevents uncleared goods from leaving the gates.
5. **💳 Automated Invoicing (Billing Engine)**:
   * Calculates port fees automatically based on vessel docking hours, crane hours, and warehouse storage days, generating official itemized receipts.
6. **🗑️ Universal Safety Net (The 10-Table Trash Bin)**:
   * If an operator accidentally deletes a ship, invoice, container, or warehouse, data is **never destroyed**. It moves into a centralized **Trash & Recovery Bin** where an administrator can restore it with a single click across all 10 core tables.

---

## ⏱️ 100-Word Elevator Pitch

> **PortFlow** is a smart digital operating system for modern cargo seaports. It acts like an airport control tower, coordinating incoming ships, docking berths, cranes, warehouses, and transport trucks. 
> 
> What makes PortFlow unique is its scheduling brain: it applies computer science algorithms (such as First-Come-First-Served and Priority) to eliminate port traffic jams and unload vessels faster. It also automates customs clearances, truck gate passes, and fee billing. 
> 
> Built with React, Node.js, and a 12-table PostgreSQL database, PortFlow features an enterprise 10-table trash recovery bin so critical port data is never accidentally lost.

---

## 🏛️ All 5 System Diagrams (from `folder/DIAGRAMS.md`)

All diagrams are written in standard Mermaid format so they render directly in GitHub, VS Code, and Markdown viewers. 

---

### 1. System Architecture Diagram

This diagram displays the 5 main tiers of PortFlow and how frontend, backend, OS simulator, and database communicate.

```mermaid
graph TB
    subgraph CLIENT["1. Client Layer (React 19 + Vite + Tailwind CSS)"]
        UI["Operator Web Dashboard"]
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

    subgraph GATEWAY["2. Backend Server Gateway (Node.js + Express 5)"]
        AUTH_CHECK["Security & Token Check (JWT Auth + Helmet + Rate Limit)"]
        REST_API["REST API Routes (/api/*)"]
        GRAPHQL_API["Apollo GraphQL Server (/graphql)"]
    end

    subgraph SERVICES["3. Business Logic (Service Layer)"]
        AUTH_SVC["Auth Service (Login, Register, Demo Accounts)"]
        OPS_SVC["Operations Service (Process Control Blocks & Dispatches)"]
        SHIP_SVC["Ships Service (Vessels Management & Allocations)"]
        EQUIP_SVC["Equipment Service (Cranes & Berths)"]
        BILL_SVC["Billing Service (Automated Tariff Calculations)"]
        TRASH_SVC["Trash Service (10-Collection Soft-Delete & Restore)"]
    end

    subgraph OS_SIM["4. OS Simulator Engine (In-Memory Kernel)"]
        PORT_SYS["PortSystem (Singleton Coordinator)"]
        SCHEDULER["CPU Scheduler (FCFS / SJF / Priority / Round Robin)"]
        MUTEX["Mutex Locks (1 Crane = 1 Job at a time)"]
        SEMAPHORE["Counting Semaphore (Berths 1-5: Limited Parking Slots)"]
        DEADLOCK["Deadlock Detector (Wait-For Graph Cycle Finder)"]
    end

    subgraph DATABASE["5. Database Layer (PostgreSQL 15 / Supabase)"]
        PRISMA["Prisma ORM (Data Access Layer with B-Tree Indexes)"]
        DB[(12 Relational Tables in Strict 3NF)]
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

#### 💡 Simple Explanation of Architecture:
1. **Client Layer**: The fast responsive React application where terminal operators click buttons to manage ships, trucks, and cranes.
2. **Backend Gateway**: Express 5 server verifying JSON Web Tokens (JWT) and routing calls to either REST endpoints or Apollo GraphQL.
3. **Service Layer**: Validates business rules, calculates tariffs, and issues database transactions.
4. **OS Simulator**: Re-creates operating system primitives: cranes behave as Mutex locks, berths behave as Semaphores, and container moves run as Scheduled Processes.
5. **Database Layer**: Stores persistent records across 12 relational PostgreSQL tables.

---

### 2. Class Diagram (OS Simulation Engine)

This diagram highlights the TypeScript object-oriented design powering the PortFlow scheduling kernel.

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

#### 💡 Simple Explanation of Classes:
* **`Process`**: Represents a single port operation (e.g., unloading 50 TEU containers from Vessel X).
* **`Scheduler`**: The CPU scheduling engine that decides which job runs next using standard algorithms.
* **`SchedulingStrategy`**: Polymorphic interface allowing instant algorithm swapping at runtime (FCFS, SJF, Priority, Round Robin).
* **`Mutex`**: Exclusive resource lock. Since a crane can only pick up one container at a time, a job must lock the crane and release it when complete.
* **`Semaphore`**: Counting semaphore tracking physical dock space (e.g. 5 available berths).
* **`DeadlockDetector`**: Builds a Wait-For Graph (WFG) and uses Depth-First Search (DFS) to detect circular waits.
* **`PortSystem`**: The Singleton coordinator managing the scheduler, locks, and berths as a unified kernel.

---

### 3. Entity-Relationship (ER) Diagram (12-Table 3NF Design)

PortFlow is modeled in **Third Normal Form (3NF)** with 12 interconnected relational tables in PostgreSQL:

```mermaid
erDiagram
    USERS ||--o{ OPERATIONS : "created_by_user_id"
    USERS ||--o{ GATE_PASSES : "issued_by_id"
    USERS ||--o{ CUSTOMS_INSPECTIONS : "inspector_id"
    USERS ||--o{ ISSUES : "reported_by_id"
    USERS ||--o{ SYSTEM_LOGS : "user_id"

    EQUIPMENT ||--o{ SHIPS : "berth_equipment_id"
    EQUIPMENT ||--o{ OPERATIONS : "crane_equipment_id"
    EQUIPMENT ||--o{ OPERATIONS : "berth_equipment_id"
    EQUIPMENT ||--o{ ISSUES : "equipment_id"

    SHIPS ||--o{ CARGO : "ship_id"
    SHIPS ||--o{ OPERATIONS : "ship_id"
    SHIPS ||--o{ BILLS : "ship_id"

    WAREHOUSES ||--o{ CARGO : "warehouse_id"

    CARGO ||--o{ OPERATIONS : "cargo_id"
    CARGO ||--o{ TRUCKS : "assigned_cargo_id"
    CARGO ||--o{ GATE_PASSES : "cargo_id"
    CARGO ||--o{ CUSTOMS_INSPECTIONS : "cargo_id"
    CARGO ||--o{ BILLS : "cargo_id"

    TRUCKS ||--o{ GATE_PASSES : "truck_id"

    OPERATIONS ||--o{ BILLS : "operation_id"

    USERS {
        int id PK
        string email UK
        string password_hash
        string full_name
        string role
        datetime created_at
        datetime updated_at
        datetime deleted_at
        string deleted_by
    }

    EQUIPMENT {
        int id PK
        string equipment_id UK
        string name
        string type
        string status
        float capacity_metric
        string assigned_to
        string created_by
        datetime created_at
        datetime updated_at
        datetime deleted_at
        string deleted_by
    }

    SHIPS {
        int id PK
        string imo_number UK
        string name
        string vessel_type
        int capacity_teu
        string status
        string berth_id
        int berth_equipment_id FK
        datetime eta
        datetime etd
        string created_by
        datetime created_at
        datetime updated_at
        datetime deleted_at
        string deleted_by
    }

    WAREHOUSES {
        int id PK
        string code UK
        string name
        string zone_type
        int capacity_teu
        int current_occupancy_teu
        float temperature_celsius
        string status
        datetime created_at
        datetime updated_at
        datetime deleted_at
        string deleted_by
    }

    CARGO {
        int id PK
        string cargo_number UK
        string size_type
        float weight_tons
        string cargo_type
        string current_location
        string ship_name
        int ship_id FK
        int warehouse_id FK
        string hazard_class
        string status
        string created_by
        datetime created_at
        datetime updated_at
        datetime deleted_at
        string deleted_by
    }

    OPERATIONS {
        int id PK
        string process_id UK
        string operation_type
        string ship_name
        int ship_id FK
        int cargo_id FK
        string crane_id
        int crane_equipment_id FK
        string berth_id
        int berth_equipment_id FK
        int created_by_user_id FK
        int priority
        string status
        datetime start_time
        datetime end_time
        int waiting_time_ms
        int turnaround_time_ms
        string created_by
        datetime created_at
        datetime updated_at
        datetime deleted_at
        string deleted_by
    }

    TRUCKS {
        int id PK
        string license_plate UK
        string driver_name
        string driver_phone
        string transport_company
        string status
        float max_payload_tons
        int assigned_cargo_id FK
        datetime created_at
        datetime updated_at
        datetime deleted_at
        string deleted_by
    }

    GATE_PASSES {
        int id PK
        string pass_number UK
        int truck_id FK
        int cargo_id FK
        int issued_by_id FK
        string gate_lane
        string pass_type
        string status
        datetime check_in_time
        datetime check_out_time
        datetime created_at
        datetime deleted_at
    }

    CUSTOMS_INSPECTIONS {
        int id PK
        string inspection_number UK
        int cargo_id FK
        int inspector_id FK
        string declaration_number
        string inspection_type
        string status
        bigint duty_amount_cents
        string findings
        datetime inspected_at
        datetime cleared_at
        datetime created_at
        datetime updated_at
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
        string payment_status
        datetime due_date
        datetime paid_at
        datetime created_at
        datetime updated_at
        datetime deleted_at
    }

    ISSUES {
        int id PK
        string ticket_number UK
        string title
        string description
        string severity
        string status
        int reported_by_id FK
        int equipment_id FK
        string resolution_notes
        datetime resolved_at
        datetime created_at
        datetime updated_at
        datetime deleted_at
    }

    SYSTEM_LOGS {
        int id PK
        datetime timestamp
        string level
        string source
        string message
        string action
        string entity_type
        int entity_id
        int user_id FK
        string ip_address
        datetime created_at
    }
```

#### 💡 The 12 Tables in Plain English:
1. **`users`**: Terminal operators, admins, customs officers, and dispatchers.
2. **`equipment`**: Cranes and physical berths.
3. **`ships`**: Marine cargo vessels visiting the port.
4. **`warehouses`**: Dry yards, CFS container depots, and Reefer cold storage.
5. **`cargo`**: Containers tracked with TEU sizes, weight, and hazard tags.
6. **`operations`**: Active Process Control Blocks (Ship + Crane + Berth + Priority).
7. **`trucks`**: Drayage transport fleet hauling containers between gates and yards.
8. **`gate_passes`**: Security gate permits for trucks entering through specific lanes.
9. **`customs_inspections`**: Border compliance checks, declarations, and duties.
10. **`bills`**: Itemized invoices covering docking, crane hours, and warehouse storage.
11. **`issues`**: Maintenance incident reports for mechanical faults.
12. **`system_logs`**: Immutable audit logs of all user mutations and scheduler events.

---

### 4. Operation Lifecycle Flowchart

This flowchart demonstrates what happens behind the scenes from the moment an operator clicks "Submit Operation" until the job completes and the bill is generated.

```mermaid
flowchart TD
    START([1. Operator clicks Submit Operation]) --> AUTH{Is User Logged In?}
    AUTH -- No --> REJECT([Return 401: Unauthorized])
    AUTH -- Yes --> VALIDATE{Valid Ship & Crane selected?}
    VALIDATE -- No --> BAD_INPUT([Return 400: Missing Required Fields])
    VALIDATE -- Yes --> SAVE_DB[Save Operation in PostgreSQL\nstatus = Queued]
    
    SAVE_DB --> CREATE_PCB[Create OS Process PCB\nAdd to Scheduler Ready Queue]
    
    CREATE_PCB --> SCHEDULER[Scheduler selects next Job\nBased on Policy: FCFS / SJF / Priority]
    
    SCHEDULER --> CHECK_CRANE{Is Assigned Crane Free?}
    CHECK_CRANE -- No / Busy --> WAIT_STATE[Process becomes WAITING]
    WAIT_STATE --> CHECK_DEADLOCK{Deadlock Cycle in Wait-For Graph?}
    CHECK_DEADLOCK -- Yes --> ALERT[Log Warning: Deadlock Found]
    CHECK_DEADLOCK -- No --> WAIT_STATE
    
    CHECK_CRANE -- Yes / Free --> LOCK_CRANE[Lock Crane Mutex\nProcess becomes RUNNING]
    
    LOCK_CRANE --> RUN_WORK[Simulate Container Lift\nDuration: 3-5 seconds]
    
    RUN_WORK --> UNLOCK_CRANE[Unlock Crane Mutex\nProcess becomes TERMINATED]
    
    UNLOCK_CRANE --> UPDATE_DB[Update PostgreSQL:\nstatus = Completed\nSave Turnaround & Waiting Time]
    
    UPDATE_DB --> CREATE_BILL[Auto-create Tariff Bill in DB]
    
    CREATE_BILL --> DONE([Job Complete & Screen Updates])
```

#### 💡 Step-by-Step Walkthrough:
1. **Submit**: Operator picks a ship, crane, and priority, then submits the task.
2. **Authentication & Validation**: JWT security check ensures valid user permissions.
3. **Database Insertion**: The job is persisted into PostgreSQL with status `Queued`.
4. **OS Queueing**: An in-memory `Process` PCB is created and placed in the Ready Queue.
5. **Scheduler Decision**: Algorithm (e.g. SJF or Priority) selects the next process to execute.
6. **Mutex Lock & Deadlock Scan**: If crane is free, it locks exclusively. If busy, process waits while Deadlock Detector checks the Wait-For Graph.
7. **Execution**: Simulated crane lift runs; upon completion, crane unlocks.
8. **Finalization & Billing**: Database updates to `Completed`, turnaround times are recorded, and a tariff invoice is generated automatically.

---

### 5. Sequence Diagram (Request & Response Timeline)

This sequence diagram illustrates message flow across the client browser, API gateway, service layer, OS simulator, and database.

```mermaid
sequenceDiagram
    autonumber
    actor User as Operator (Browser)
    participant API as Backend Gateway (Express 5)
    participant Service as Operations Service
    participant OS as OS Engine (PortSystem)
    participant DB as PostgreSQL Database

    Note over User,DB: Phase 1: Creating a New Operation
    User->>API: 1. POST /api/operations (ship, crane, priority)
    API->>Service: 2. submitOperation(dto)
    Service->>DB: 3. INSERT INTO operations (status = 'Queued')
    DB-->>Service: 4. Record saved (id = 101, process_id = 'op-101')
    Service->>OS: 5. addProcess(Process 'op-101')
    OS-->>Service: 6. Added to ready queue
    Service-->>API: 7. Operation created
    API-->>User: 8. HTTP 201 Created (UI shows 'Queued')

    Note over User,DB: Phase 2: Running the Operation
    User->>API: 9. POST /api/operations/dispatch
    API->>Service: 10. dispatchNext()
    Service->>OS: 11. executeNextProcess()
    OS->>OS: 12. Scheduler selects highest-priority process
    OS->>OS: 13. Crane Mutex locked
    OS->>OS: 14. Work executed (simulated delay)
    OS->>OS: 15. Crane Mutex unlocked
    OS-->>Service: 16. Process finished (status: TERMINATED)
    Service->>DB: 17. UPDATE operations (status = 'Completed', turnaround_time)
    Service->>DB: 18. INSERT INTO bills (Auto Tariff Invoice)
    DB-->>Service: 19. Database updated
    Service-->>API: 20. Dispatch finished
    API-->>User: 21. HTTP 200 OK (UI updates to 'Completed')

    Note over User,DB: Phase 3: Fetching Reports with GraphQL
    User->>API: 22. POST /graphql (query: portDashboardOverview)
    API->>DB: 23. Aggregated query across tables
    DB-->>API: 24. Return counts and stats
    API-->>User: 25. Live Dashboard Charts rendered
```

---

### 🛠️ How to Open & Edit in Draw.io

All diagrams are also exported in vector format inside:
📁 [`folder/diagrams.xml`](./folder/diagrams.xml)

1. Open **[https://app.diagrams.net](https://app.diagrams.net)** in your web browser.
2. Select **File** ➔ **Open From** ➔ **Device**.
3. Choose `folder/diagrams.xml`.
4. You will see 5 multi-tab pages:
   * **Tab 1**: Architecture Diagram
   * **Tab 2**: Class Diagram
   * **Tab 3**: Entity-Relationship (ER) Diagram
   * **Tab 4**: Operation Lifecycle Flowchart
   * **Tab 5**: Sequence Diagram
5. Edit any element and export to high-resolution PNG or PDF.

---

## 🧠 Operating System (OS) Concepts Made Simple

| OS Concept | Real-World Port Analogy | Implementation in PortFlow |
| :--- | :--- | :--- |
| **Process & PCB** | Ship loading/unloading task | Each task is an isolated `Process` object with an ID, burst duration, arrival time, and execution state (`READY`, `RUNNING`, `TERMINATED`). |
| **CPU Scheduling** | Crane work sequencing | Schedulers pick the next operation from the ready queue using **FCFS, SJF, Priority, or Round Robin**. |
| **Ready Queue** | Waiting line for equipment | Queue where operations wait until their crane and berth are both free. |
| **Mutex Lock** | Exclusive Crane access | Only **one** operation can use a crane at a time to prevent collisions. |
| **Counting Semaphore** | Berth parking slots | A counter limiting how many ships can be docked simultaneously based on physical port space. |
| **Deadlock Avoidance** | Traffic gridlock detection | A Wait-For Graph (WFG) scans for circular wait conditions (e.g., Ship A has Crane 1 waiting for Berth 1; Ship B has Berth 1 waiting for Crane 1). |

---

## 💾 Database (DBMS) Concepts Made Simple

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
   - Real-time Gantt execution chart and queue visualization.
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
│   ├── DIAGRAMS.md             # Complete 5-diagram reference manual
│   └── diagrams.xml            # Multi-page Draw.io vector file
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

-----

## 📄 License

This project is licensed under the **ISC License** — see the [LICENSE](./LICENSE) file for details.
