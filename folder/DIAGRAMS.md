# PortFlow — All 5 System Diagrams (Simple English Guide)

This guide explains all 5 system diagrams for the PortFlow project in simple, clear English.
The diagrams use Mermaid format so you can see them directly inside your code editor or markdown viewer.

---

## 📁 Files in Your Project

You have all diagrams in two formats:
1. **Markdown File**: `folder/DIAGRAMS.md` (Press `Ctrl + Shift + V` in VS Code to see visual diagrams)
2. **Draw.io XML File**: `folder/diagrams.xml` (Open at https://app.diagrams.net to view and edit)

Database Schema References:
- SQL Schema: `backend/supabase/schema.sql`
- Prisma Schema: `backend/prisma/schema.prisma`

---

## 1. System Architecture Diagram

This diagram shows the 5 main parts of PortFlow and how they connect with each other.

### 📊 Diagram (Mermaid)

```mermaid
graph TB
    subgraph CLIENT["1. Client Layer (Frontend)"]
        UI["React 18 + Vite Web App"]
        P1["Dashboard Page"]
        P2["Operations Page"]
        P3["Ships Page"]
        P4["Equipment & Cargo Page"]
        P5["Reports & Logs Page"]
    end

    subgraph GATEWAY["2. API Gateway (Backend Server - Express 5)"]
        AUTH_CHECK["Security & Token Check (JWT Auth + Helmet)"]
        REST_API["REST API Routes (/api/*)"]
        GRAPHQL_API["Apollo GraphQL Server (/graphql)"]
    end

    subgraph SERVICES["3. Service Layer (Business Rules)"]
        AUTH_SVC["Auth Service (Login, Register, Passwords)"]
        OPS_SVC["Operations Service (Create, View, Run Jobs)"]
        SHIP_SVC["Ships Service (Vessels Management)"]
        EQUIP_SVC["Equipment Service (Cranes & Berths)"]
    end

    subgraph OS_SIM["4. OS Simulator (Operating System Engine)"]
        PORT_SYS["PortSystem (Main Coordinator)"]
        SCHEDULER["Scheduler (FCFS / SJF / Priority Algorithms)"]
        MUTEX["Mutex Locks (Cranes A-D: 1 Crane = 1 Job at a time)"]
        SEMAPHORE["Semaphore (Berths 1-5: Limited Parking Slots)"]
        DEADLOCK["Deadlock Detector (Finds Circular Wait Cycles)"]
    end

    subgraph DATABASE["5. Database Layer (PostgreSQL / Supabase)"]
        DB["12 Relational Tables (Strict 3NF Schema)"]
    end

    UI --> AUTH_CHECK
    AUTH_CHECK --> REST_API
    AUTH_CHECK --> GRAPHQL_API
    REST_API --> SERVICES
    GRAPHQL_API --> SERVICES
    OPS_SVC --> PORT_SYS
    PORT_SYS --> SCHEDULER
    PORT_SYS --> MUTEX
    PORT_SYS --> SEMAPHORE
    PORT_SYS --> DEADLOCK
    SERVICES --> DB
```

### 💡 Simple Explanation
1. **Client Layer (Frontend)**: The website built with React. Operators click buttons here to manage ships, cargo, and cranes.
2. **API Gateway (Backend Server)**: Listens for requests on port 10000. It checks user login tokens (JWT) and sends requests to either REST API or GraphQL.
3. **Service Layer**: Contains the business logic. It validates user data, checks permissions, and handles database queries.
4. **OS Simulator**: Treats port resources like computer parts. A crane is a lock (Mutex), berths are counting resources (Semaphore), and cargo loading is a Process run by a CPU Scheduler.
5. **Database Layer**: Stores all data safely in 12 PostgreSQL tables.

---

## 2. Class Diagram

This diagram shows the main TypeScript classes in the backend and how they work together.

### 📊 Diagram (Mermaid)

```mermaid
classDiagram
    class Process {
        +id: string
        +arrivalTime: number
        +burstTime: number
        +remainingTime: number
        +priority: number
        +status: string
        +requiredEquipments: string[]
        +heldEquipments: string[]
        +start(): void
        +finish(): void
    }

    class Scheduler {
        -readyQueue: Process[]
        -strategy: SchedulingStrategy
        +setStrategy(strategy): void
        +addProcess(process): void
        +getNextProcess(): Process
        +removeProcess(id): void
        +getReadyQueue(): Process[]
    }

    class Mutex {
        -locked: boolean
        -owner: Process
        +lock(process): Promise
        +unlock(process): void
        +isBusy(): boolean
        +getOwner(): Process
    }

    class Semaphore {
        -count: number
        +acquire(): Promise
        +release(): void
        +getAvailable(): number
    }

    class DeadlockDetector {
        +detectDeadlock(processes, locks): boolean
    }

    class PortSystem {
        -scheduler: Scheduler
        -mutexes: Map
        -semaphores: Map
        +getInstance(): PortSystem
        +addProcess(proc): void
        +executeNextProcess(): Promise
        +checkDeadlock(): boolean
        +getSystemState(): object
    }

    class OperationsService {
        -repo: OperationsRepository
        -portSystem: PortSystem
        +getOperations(): Promise
        +submitOperation(dto): Promise
        +dispatchNext(): Promise
        +getMetrics(): Promise
    }

    PortSystem --> Scheduler : uses
    PortSystem --> Mutex : manages cranes
    PortSystem --> Semaphore : manages berths
    PortSystem --> DeadlockDetector : checks stuck processes
    Scheduler --> Process : ready queue
    OperationsService --> PortSystem : sends jobs to run
```

### 💡 Simple Explanation of Classes
- **`Process`**: Represents a single port job (e.g. unloading a container from a ship). It tracks process ID, arrival time, burst duration, priority, and state (`READY`, `RUNNING`, `TERMINATED`).
- **`Scheduler`**: The CPU scheduling engine that decides which job runs next using standard algorithms.
- **`SchedulingStrategy`**: Common interface that lets us swap algorithms at runtime without restarting the server.
- **`Mutex`**: A mutual-exclusion lock. Because a crane can only lift one container at a time, a process must lock the crane before use and unlock it when finished.
- **`Semaphore`**: A counting semaphore for berths. If 5 berths exist, it counts down when ships dock and counts up when they depart.
- **`DeadlockDetector`**: Builds a Wait-For Graph (WFG) and runs Depth-First Search (DFS) to detect circular resource wait cycles.
- **`PortSystem`**: The Singleton coordinator that binds the scheduler, locks, and berths into one unified OS engine.

### 🔗 Class Diagram Relationships Explained (Plain English)
1. **Implementation / Realization (`SchedulingStrategy <|.. Strategy`):**
   - `FCFSStrategy`, `SJFStrategy`, `PriorityStrategy`, and `RoundRobinStrategy` all implement the `SchedulingStrategy` interface.
   - *Meaning:* The `Scheduler` can switch between any algorithm at runtime instantly without touching the rest of the codebase.
2. **Composition (`PortSystem` owns `Scheduler`, `Mutex`, `Semaphore`, `DeadlockDetector`):**
   - `PortSystem` is the master controller that creates and holds the crane mutex map, the berth semaphore counter, and the deadlock detector.
3. **Aggregation / Queue (`Scheduler` holds `Process[]`):**
   - The `Scheduler` maintains an internal `readyQueue` array of waiting `Process` objects. Jobs enter the queue, get sorted by algorithm, and leave when executed.
4. **Dependency / Invocation (`OperationsService` calls `PortSystem`):**
   - The web API service (`OperationsService`) depends on `PortSystem`. When an operator clicks "Dispatch Next" in the browser, `OperationsService` delegates the work to `PortSystem.executeNextProcess()`.

---

## 3. Entity-Relationship (ER) Diagram

This diagram matches **`backend/supabase/schema.sql`** and **`backend/prisma/schema.prisma`** exactly.
It shows all **12 tables**, their columns, Primary Keys (`PK`), Foreign Keys (`FK`), and connections.

### 📊 Diagram (Mermaid)

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

### 💡 Simple Explanation of the 12 Tables
1. **`users`**: Authenticated staff (Terminal Operator, Admin, Customs Officer).
2. **`equipment`**: Physical infrastructure — Berths (parking slots) and Cranes (container lifting).
3. **`ships`**: Cargo vessels visiting the port, linked to assigned berths.
4. **`warehouses`**: Storage facilities (Cold Chain Reefer Storage and Dry Yard Storage).
5. **`cargo`**: Shipping container freight inventory with TEU sizes (20ft, 40ft) and tare weight.
6. **`operations`**: Central operational jobs (Ship + Crane + Berth + Priority + Status).
7. **`trucks`**: Ground logistics trucks transporting containers in and out of the port.
8. **`gate_passes`**: Security gate access passes for trucks entering through specific lanes.
9. **`customs_inspections`**: Legal customs compliance checks and duty tariff records.
10. **`bills`**: Automated financial invoices itemizing berth docking, crane usage, and storage fees.
11. **`issues`**: Mechanical incident tickets and breakdown alerts for faulty equipment.
12. **`system_logs`**: Immutable audit logs of all user actions and OS scheduling events.

### 🔗 Entity-Relationship (ER) Connections Explained (Plain English)
Every relationship in PortFlow connects tables with explicit Foreign Key (FK) rules (`ON DELETE SetNull` or `Cascade`):

1. **`users` (1) $\rightarrow$ (Many) `operations`, `gate_passes`, `customs_inspections`, `issues`, `system_logs`:**
   - *Meaning:* One user (operator, inspector, technician) can initiate multiple operations, issue multiple gate passes, clear multiple customs inspections, report multiple issues, or trigger multiple system logs.
2. **`equipment` (1) $\rightarrow$ (Many) `ships` (`berth_equipment_id`):**
   - *Meaning:* A physical Berth equipment can have multiple ships dock there over time (one ship at a time per berth).
3. **`equipment` (1) $\rightarrow$ (Many) `operations` (`crane_equipment_id` & `berth_equipment_id`):**
   - *Meaning:* A Quay Crane or Berth is used across multiple operations sequentially (protected by Mutex locks in real time).
4. **`ships` (1) $\rightarrow$ (Many) `cargo` (`ship_id`):**
   - *Meaning:* One container vessel carries multiple cargo containers on its manifest.
5. **`ships` (1) $\rightarrow$ (Many) `operations` (`ship_id`):**
   - *Meaning:* A single ship can have multiple loading and unloading jobs during its stay.
6. **`warehouses` (1) $\rightarrow$ (Many) `cargo` (`warehouse_id`):**
   - *Meaning:* One warehouse facility (e.g. Cold Chain CFS) stores many containers in its yard.
7. **`cargo` (1) $\rightarrow$ (Many) `operations`, `trucks`, `gate_passes`, `customs_inspections`, `bills`:**
   - *Meaning:* A container is moved by an operation, assigned to a truck, verified by a gate pass, scanned by customs, and charged storage fees on an invoice.
8. **`trucks` (1) $\rightarrow$ (Many) `gate_passes` (`truck_id`):**
   - *Meaning:* A drayage truck receives a new Gate Pass each time it checks in or checks out through the terminal security gate.
9. **`operations` (1) $\rightarrow$ (Many) `bills` (`operation_id`):**
   - *Meaning:* When an operation completes, an automated invoice is generated itemizing crane hours, turnaround time, and docking tariffs.

---

## 4. Flowchart (Step-by-Step Operation Lifecycle)

This diagram shows what happens when an operator submits a job.

### 📊 Diagram (Mermaid)

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

### 💡 Simple Explanation
1. **Submit**: The operator picks a ship, crane, and priority, then clicks Submit.
2. **Security**: The server checks the login token. If missing, it rejects the request.
3. **Database Save**: The job is stored in PostgreSQL with status `Queued`.
4. **Queue in OS**: A `Process` object is created and placed in the ready queue.
5. **Scheduler Choice**: The algorithm picks the next job (for example, shortest first or highest priority).
6. **Crane Lock Check**:
   - If the crane is busy: The job waits (`WAITING`), and the deadlock detector checks for issues.
   - If the crane is free: The crane is locked, and the job runs (`RUNNING`).
7. **Finish & Clean Up**: When done, the crane is unlocked, the database is updated to `Completed`, and an invoice is created.

---

## 5. Sequence Diagram (Request & Response Timeline)

This diagram shows how messages travel between the user, server, OS engine, and database.

### 📊 Diagram (Mermaid)

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

### 💡 Simple Explanation
1. **Submit**: The operator sends job details. The backend saves it as `Queued` in PostgreSQL and gives it to the in-memory OS scheduler.
2. **Dispatch**: When dispatch runs, the scheduler picks the best job, locks the crane, runs the job, releases the crane, and marks the job as `Completed` with total time recorded.
3. **GraphQL Reports**: When viewing reports, one single query gets ships, operations, and bills data together without refreshing the page.

---

## 🛠️ How to Open and Edit the Draw.io XML File

The multi-diagram Draw.io file is saved at:
`folder/diagrams.xml`

Steps to open it:
1. Open your browser and go to **https://app.diagrams.net**
2. Click **File** ➔ **Open From** ➔ **Device**
3. Select `folder/diagrams.xml` from your project folder.
4. You will see 5 bottom tabs:
   - Tab 1: `1. Architecture Diagram`
   - Tab 2: `2. Class Diagram`
   - Tab 3: `3. Entity-Relationship (ER) Diagram`
   - Tab 4: `4. Flowchart (Operation & OS Lifecycle)`
   - Tab 5: `5. Sequence Diagram`
5. You can edit any box or line, and export your diagrams as PNG or PDF via **File ➔ Export as**.
