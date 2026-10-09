# 🚢 PortFlow — PBL Phase 2 Member Viva Preparation Guide (40% Milestone)

**Project:** PortFlow — Marine Operating System (TOS) & OS Simulator  
**Target Milestone:** Project-Based Learning (PBL) Phase 2 Evaluation (~40% Codebase Completion)  
**Team Composition:** 6 Full-Stack Members (each owning a distinct Frontend module, Backend API, OS concept, and DBMS table)  
**Primary Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS, Node.js, Express 5, Prisma ORM, PostgreSQL (Supabase)

---

# PART 1 — PROJECT OVERVIEW

### 1. What Problem Does PortFlow Solve?
Modern commercial seaports face heavy congestion, berth allocation bottlenecks, crane contention, and scheduling delays. PortFlow bridges real-world maritime container logistics with theoretical Operating System resource management algorithms. It solves physical resource starvation (berth and crane allocation) and optimizes job execution times using proven computer science scheduling and synchronization models.

### 2. Who Are the Intended Users?
The primary intended user in Phase 2 is the **Terminal Operator**. Terminal operators oversee vessel berthing, assign container discharge jobs, allocate physical port equipment (quay cranes and berths), switch CPU scheduling strategies, and resolve deadlock bottlenecks.

### 3. What Is the Main Purpose of the Project?
To provide a full-stack, enterprise-grade Terminal Operating System that models dockyard physical resources (berths, cranes, ships, containers) as core OS primitives (Processes, Mutexes, Semaphores, CPU Queues) and validates their efficiency using real-time telemetry metrics.

### 4. Major Features Currently Implemented (Phase 2 Working State)
- **JWT-Based Authentication & Session Management:** Secure login, registration, and session persistence using bcrypt password hashing and 30-second expiring OTP password recovery.
- **Vessel & Manifest Tracking:** Complete CRUD for marine vessels (`ships` table with IMO validation) and container freight (`cargo` table with zone tracking).
- **Physical Equipment Management:** Allocation and status monitoring for shared terminal resources (`equipment` table: Berths & Cranes).
- **Operations Hub (Process Control Block):** Port job generation acting as OS Process Control Blocks (PCBs) submitted to the execution queue.
- **Custom Node.js OS Kernel:**
  - **CPU Scheduling Strategies:** First-Come First-Served (FCFS), Shortest Job First (SJF), Priority Scheduling, and Round Robin.
  - **Resource Synchronization Primitives:** Mutex locks for exclusive crane access and Counting Semaphores for pooled berth allocation.
  - **Deadlock Detection Engine:** Wait-For Graph (WFG) running Depth-First Search (DFS) cycle detection.
  - **Execution Telemetry:** Calculation of Waiting Time ($W_t$) and Turnaround Time ($T_t$).
- **Recycle Bin (Soft-Delete Architecture):** Two-phase recovery preserving referential integrity via `deleted_at` timestamps across all entities.

### 5. Features Planned / Incomplete (Phase 3 & Future Roadmaps)
- Advanced land-based logistics: Dedicated `trucks` and `warehouses` tables (`FUTURE_PHASES.md`).
- Billing & invoicing automated engine (`bills` table).
- Customs regulatory clearance workflow (`customs` & `inspections` tables).
- Active Deadlock Recovery via Banker's Algorithm and process preemption (Phase 2 detects deadlocks; automated kill/rollback is marked for future phases).

### 6. Overall Workflow of the Application
1. **Operator Access:** Operator authenticates via JWT login (`/api/auth/login`).
2. **Vessel Registration:** A ship is scheduled and docked (`/api/ships`).
3. **Cargo Ingestion:** Container manifests associated with the vessel are registered (`/api/cargos`).
4. **Operation Dispatch:** Operator creates an operation (e.g., "Discharge Cargo from Ship X using Crane A").
5. **OS Simulation:**
   - The job is wrapped into an isolated `Process` (PID, burst time, priority).
   - Added to the OS `Scheduler` Ready Queue.
   - Scheduler orders jobs based on the active strategy (FCFS / SJF / Priority).
   - Before entering `RUNNING`, process locks the Mutex (Crane) and acquires the Semaphore (Berth).
   - Once completed, resources are released and telemetry ($W_t$, $T_t$) is committed to PostgreSQL.
6. **Dashboard Feedback:** Real-time metrics and status updates reflect across the UI.

### 7. What Makes This Project Useful?
Unlike toy simulations, PortFlow persists all transactional operations to a normalized relational database (3NF PostgreSQL) and couples academic OS algorithm theory (deadlocks, mutexes, starvation, scheduling) with industrial logistics.

### ⏱️ 30–60 Second Viva Pitch (Memorize This!)
> *"PortFlow is a Marine Terminal Operating System that models real-world container port logistics as computer operating system primitives. Incoming ships and cargo loading tasks act as Processes in a CPU Ready Queue. Cranes act as Mutex locks, and docking berths act as Counting Semaphores. We simulate FCFS, Shortest Job First, and Priority CPU scheduling, track process waiting and turnaround times, and detect circular deadlocks using a Wait-For Graph. The full stack is built with React 19, TypeScript, Express 5, Prisma ORM, and Supabase PostgreSQL with 3NF normalization and soft-delete audit safety."*

---

# PART 2 — COMPLETE SYSTEM ARCHITECTURE

### High-Level Architectural Flow
```text
[ React 19 + Vite Frontend (SPA) ]
             │
             ▼  (HTTP REST / JSON with Authorization Bearer JWT)
[ Express 5 REST API Router (backend/src/routes/api.ts) ]
             │
             ▼
[ Controllers Layer (backend/src/controllers/) ]  <-- Auth & Input Validation
             │
             ▼
[ Services Layer (backend/src/services/) ]        <-- Business Logic
       │                                │
       ▼                                ▼
[ OS Simulation Kernel ]      [ Repositories Layer (backend/src/repositories/) ]
  - Scheduler (FCFS/SJF)                │
  - Mutexes & Semaphores                ▼
  - Deadlock Detector (DFS)   [ Prisma ORM Client (backend/src/config/prisma.ts) ]
                                        │
                                        ▼  (PostgreSQL Protocol / Connection Pooling)
                              [ Supabase PostgreSQL 14+ Relational Database ]
```

### Layer Technologies & Responsibilities
| Layer | Technologies Used | Responsibility |
| :--- | :--- | :--- |
| **Frontend UI** | React 19, TypeScript, Vite, Tailwind CSS, Lucide React, Radix UI | Presentational views, MVVM custom hooks, modal forms, and local state. |
| **API Client** | Native `fetch` with Facade Adapter pattern (`frontend/src/lib/api.ts`) | Bearer token injection, endpoint abstraction, error normalization. |
| **Backend Server** | Node.js v18+, Express 5, TypeScript | Routing, rate-limiting, CORS, HTTP request/response serialization. |
| **OS Simulation Kernel** | Pure TypeScript OOP (`backend/src/os/`) | Process Control Block management, CPU queue scheduling, lock synchronization. |
| **Data Access (ORM)** | Prisma Client v5.22 (`@prisma/client`) | Type-safe SQL abstraction, transaction handling, query mapping. |
| **Database** | PostgreSQL 14+ hosted on Supabase | 3NF relational storage, B-Tree indexes, RLS, triggers, soft-deletes. |

### Architectural Data Flow Patterns
1. **Frontend to Backend Communication:** The frontend never connects directly to PostgreSQL. All requests go through `frontend/src/lib/api.ts` making JSON REST calls to `http://localhost:10000/api`.
2. **Backend to Database Communication:** Backend services call dedicated Repositories which utilize the singleton `prisma` client (`backend/src/config/prisma.ts`) connected via `DATABASE_URL` (pooled port 6543) and `DIRECT_URL` (direct port 5432).
3. **Where Authentication Occurs:** In `backend/src/middleware/auth.ts` (`requireAuth`). Every protected route checks the `Authorization: Bearer <token>` header, verified with `jsonwebtoken` against `JWT_SECRET`.
4. **Where Validation Occurs:** Controller layer validates request payloads (e.g., IMO string length $\ge 3$, capacity $> 0$, valid status enumerations).
5. **Where Business Logic Occurs:** In `backend/src/services/` (e.g., metric calculations, dispatching processes to the OS kernel, password hashing).

---

# PART 3 — FRONTEND TECHNOLOGY

### 1. Frontend Stack Breakdown
- **Framework/Library:** React 19 (`react`, `react-dom`)
- **Language:** TypeScript (`.tsx`, `.ts`)
- **Build Tool:** Vite v8 (`@vitejs/plugin-react`)
- **Styling:** Tailwind CSS + Vanilla CSS tokens (`frontend/src/index.css`, `Login.css`)
- **Routing:** Client-side SPA routing via component state & view switching in `App.tsx`
- **State Management:** React Built-in Hooks (`useState`, `useEffect`, `useCallback`, `useMemo`) + Context API (`frontend/src/auth/AuthProvider.tsx`)
- **API Communication:** Custom Facade wrapper (`frontend/src/lib/api.ts`) using standard browser `fetch`
- **Icons & Primitives:** Lucide React (`lucide-react`), Radix UI (`@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-slot`)
- **Authentication Handling:** Stored in `localStorage` (`portflow_auth_token`), injected as `Authorization: Bearer` header on all API calls.

### 2. Important Frontend Directory & File Map
| File / Directory | Purpose | Technology | Student Owner |
| :--- | :--- | :--- | :--- |
| `frontend/src/pages/OperationsPage.tsx` | Operations queue dashboard and process dispatching | React 19, Custom Hook | Member 1 |
| `frontend/src/features/operations/` | Operations table, state management, creation modals | React 19, Tailwind | Member 1 |
| `frontend/src/pages/ShipsPage.tsx` | Vessel arrival schedule, IMO registration, docking status | React 19, Data Table | Member 2 |
| `frontend/src/components/ui/table.tsx` | Reusable atomic UI data table primitives | Radix UI, Tailwind | Member 2 |
| `frontend/src/pages/CargoPage.tsx` | Container tracking, TEU sizes, yard zone movements | React 19, Data Table | Member 3 |
| `frontend/src/components/ui/` | Reusable atomic UI (Button, Input, Card, Dialog, Badge) | Radix UI, Tailwind | Member 3 |
| `frontend/src/pages/EquipmentPage.tsx` | Physical berths and cranes allocation & status panel | React 19, Lucide Icons | Member 4 |
| `frontend/src/pages/SchedulingPage.tsx` | Interactive OS scheduling switcher & algorithm demo | React 19, Lucide Icons | Member 5 |
| `frontend/src/App.tsx` | Main layout shell, sidebar navigation, view router | React 19 / TSX | Member 5 |
| `frontend/src/pages/Login.tsx` | Authentication portal, demo sign-in, 30s OTP reset modal | React 19, CSS Grid | Member 6 |
| `frontend/src/pages/TrashPage.tsx` | Unified 2-phase recycle bin with 1-click restore | React 19, Table | Member 6 |
| `frontend/src/auth/AuthProvider.tsx` | Global authentication context & token manager | React Context API | Member 6 |
| `frontend/src/lib/api.ts` | Unified HTTP REST client facade adapter | TypeScript, Fetch | Shared (M1–M6) |

### 3. Core React Topics Used in PortFlow (Main & Important)
*These are the exact React concepts actively utilized across the frontend codebase:*

- **Functional Components & JSX:**
  - Every UI screen and component (`OperationsPage.tsx`, `ShipsPage.tsx`, `Login.tsx`, etc.) is written as a modern functional component returning declarative JSX markup.
- **Local Component State (`useState`):**
  - Manages view-level reactive state such as modal dialog visibility (`isOpen`), form text inputs, active tab selection, filter queries, and the 30-second OTP countdown timer in `Login.tsx`.
- **Side Effects & Lifecycles (`useEffect`):**
  - Executes asynchronous data fetching on component mount (`api.getOperations()`, `api.getShips()`, `api.getEquipment()`).
  - Sets up interval timers (e.g., OTP countdown) and cleans up timer intervals (`clearInterval`) on unmount to prevent memory leaks.
- **Custom Hooks & MVVM Pattern:**
  - `useOperations.ts` abstracts data fetching, state tracking, and process dispatching into a dedicated custom hook, keeping UI presentation completely decoupled from business logic.
- **Context API & Global State (`createContext`, `useContext`):**
  - `AuthProvider.tsx` implements React Context to store and broadcast global authentication status (`user`, `token`, `login()`, `logout()`) to any component without manual prop drilling.
- **Performance Optimization (`useMemo` & `useCallback`):**
  - `useMemo` caches filtered lists (e.g., filtering vessels by status or search text) and static table column headers.
  - `useCallback` memoizes event handler functions passed down to child components to prevent unnecessary re-rendering cycles.
- **Controlled Components & Forms:**
  - Form inputs are bound to state variables with `value` and `onChange` handlers.
  - Form submissions intercept browser default reloads using `e.preventDefault()` before calling the backend API.
- **Conditional Rendering:**
  - Dynamic UI updates based on state: displays loading spinners while fetching, shows empty-state cards when lists are empty, renders error alerts on API failure, and applies dynamic CSS classes to status badges (e.g., green for `COMPLETED`, amber for `PENDING`).
- **Client-Side Routing & Route Protection:**
  - Single Page Application (SPA) navigation where `<ProtectedRoute>` validates JWT token presence and redirects unauthenticated users to `/login`.
- **Props & Component Composition:**
  - Modular UI components in `frontend/src/components/ui/` (`Button`, `Card`, `Dialog`, `Table`, `Badge`) receive typed props and compose children (`props.children`).

---

# PART 4 — BACKEND TECHNOLOGY

### 1. Backend Stack Breakdown
- **Framework:** Express 5 (`express` v5.2.1) on Node.js
- **Language:** TypeScript (`typescript` v5.9.3, executed via `ts-node` / `nodemon` in dev)
- **Architecture:** 5-Tier Layered Architecture (Routes $\to$ Controllers $\to$ Services $\to$ Repositories $\to$ Prisma ORM)
- **Security & Headers:** `helmet`, `cors`, `express-rate-limit`
- **Authentication:** `jsonwebtoken` (HMAC SHA-256 JWTs) + `bcryptjs` (salt rounds: 10)
- **Database Access:** Prisma ORM v5.22 (`@prisma/client`) with custom connection pooling

### 2. Important Backend Directory & File Map
| File / Directory | Purpose | Responsibility | Student Owner |
| :--- | :--- | :--- | :--- |
| `backend/src/controllers/operations.controller.ts` | Operations HTTP handlers | Job creation, step execution, telemetry commits | Member 1 |
| `backend/src/os/Scheduler.ts` | CPU queue scheduler | FCFS and SJF scheduling strategies | Member 1 |
| `backend/src/controllers/ships.controller.ts` | Ships HTTP handlers | Validation & status updates for marine vessels | Member 2 |
| `backend/src/os/Process.ts` | PCB domain entity | Process ID, burst duration, state machine transitions | Member 2 |
| `backend/src/controllers/cargo.controller.ts` | Cargo HTTP handlers | Manifest tracking, weight validation, zone updates | Member 3 |
| `backend/src/os/Mutex.ts` | Crane locking primitive | Mutual exclusion lock with FIFO Promise wait-queue | Member 3 |
| `backend/src/controllers/equipment.controller.ts` | Equipment HTTP handlers | Cranes/berths status transitions and allocations | Member 4 |
| `backend/src/os/Semaphore.ts` | Berth allocation primitive | Counting semaphore maintaining physical berth counters | Member 4 |
| `backend/src/os/DeadlockDetector.ts` | Cycle detection engine | Wait-For Graph (WFG) DFS cycle finder | Member 5 |
| `backend/src/os/PortSystem.ts` | OS simulation singleton | Orchestrates scheduling, locks, and process lifecycles | Member 5 |
| `backend/src/index.ts` | Server entry point | Port listening (10000), middleware pipeline, routes | Member 5 |
| `backend/src/controllers/auth.controller.ts` | Authentication endpoints | Register, login, me, OTP request, OTP verify, reset | Member 6 |
| `backend/src/services/auth.service.ts` | Auth business logic | Bcrypt verification, JWT generation, 30s OTP cache | Member 6 |
| `backend/src/middleware/auth.ts` | Security middleware | JWT extraction, bearer parsing, role checks | Member 6 |
| `backend/src/repositories/trash.repository.ts` | Recycle bin data access | Cross-table soft-deleted records collector and restorer | Member 6 |
| `backend/prisma/schema.prisma` | Relational schema | Prisma data definitions with B-Tree indexes | Member 6 |
| `backend/supabase/schema.sql` | Production DDL | PostgreSQL DDL script with RLS, triggers, indexes | Member 6 |

### 3. Core Backend & Node.js Topics Used in PortFlow (Main & Important)
*These are the exact Node.js, Express, and backend engineering concepts actively utilized across the backend codebase:*

- **RESTful API Architecture & HTTP Standards:**
  - Predictable resource-based routing (`/api/ships`, `/api/cargos`, `/api/equipment`, `/api/operations`).
  - Standard HTTP verbs (`GET` for reading, `POST` for creating, `PUT`/`PATCH` for updates, `DELETE` for soft-deletion).
  - Explicit HTTP response status codes (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `404 Not Found`, `500 Internal Server Error`).
- **5-Tier Layered Architecture:**
  - Strict separation of concerns: **Routes** (URL dispatching) $\to$ **Controllers** (HTTP parsing & response serialization) $\to$ **Services** (domain rules & calculations) $\to$ **Repositories** (database operations) $\to$ **Prisma ORM** (type-safe SQL).
- **Express Middleware Pipeline:**
  - Chain of responsibility pattern: `express.json()` (JSON body parsing), `cors()` (cross-origin browser access), `helmet()` (security HTTP headers), `express-rate-limit` (brute-force defense), and custom JWT verification guards (`requireAuth`).
- **Token-Based Authentication (JWT):**
  - Stateless authentication via `jsonwebtoken`. Issues HMAC SHA-256 signed bearer tokens on login with 24-hour expiration, validated via HTTP `Authorization: Bearer <token>` headers.
- **Cryptographic Password Hashing:**
  - Secure one-way hashing with `bcryptjs` using 10 salt rounds before storing credentials in PostgreSQL, preventing plaintext exposure.
- **Object-Relational Mapping (Prisma ORM):**
  - Prisma Client v5.22 provides compile-time TypeScript type definitions, relational foreign key modeling, migration synchronization, and connection pooling across `DATABASE_URL` and `DIRECT_URL`.
- **Asynchronous Programming & Concurrency:**
  - Non-blocking event loop execution using `async`/`await` and JavaScript Promises.
  - Parallel query execution using `Promise.all` in `trash.repository.ts` to query soft-deleted records from all tables concurrently without blocking.
- **OS Concurrency & Synchronization Primitives:**
  - Custom in-memory Mutex lock (`Mutex.ts`) with an asynchronous FIFO wait-queue to model crane mutual exclusion.
  - Counting Semaphore (`Semaphore.ts`) to manage pooled berths and prevent over-allocation.
- **Object-Oriented Design Patterns:**
  - **Singleton Pattern:** `PortSystem.getInstance()` guarantees a single global OS simulation kernel coordinates all operations and resources.
  - **Strategy Pattern:** `Scheduler.ts` dynamically switches CPU scheduling algorithms (FCFS, SJF, Priority, Round Robin).
  - **Repository Pattern:** Decouples direct Prisma queries from business services.
- **In-Memory Caching & State Management:**
  - In-memory scheduling queues (Ready Queue, Waiting List, Terminated List).
  - JavaScript `Map` data structure with timestamp expiration for temporary 30-second password reset OTP storage.
- **Input Validation & Structured Error Handling:**
  - Defensive request validation (e.g., vessel IMO length $\ge 3$, container weight $\ge 0$, valid status enumerations).
  - Centralized try-catch error blocks returning uniform JSON error responses `{ error: string }`.

---

# PART 5 — OPERATING SYSTEM (OS)

### 1. Assumptions & Development Environment
The repository was developed and tested on **Windows 10/11** using PowerShell and Node.js v22.  
*Cross-Platform Capability:* PortFlow is completely OS-independent at runtime because Node.js, Express, and Vite run identically across Windows, macOS, and Linux.

### 2. Recommended Viva Answer
> *"We developed and tested the project primarily on Windows 10/11 using PowerShell, Node.js, and modern Web browsers. However, PortFlow is fully cross-platform and OS-independent because both the React frontend and Node.js/Express backend execute on standard runtime environments without OS-specific native binary bindings. In production, our Render backend runs on Linux and our database runs on Supabase (Linux-based PostgreSQL)."*

### 3. Installed Development Tools
- Node.js runtime (v18.0.0 or higher; v22 used locally)
- npm package manager (v9+)
- Git version control
- Modern Chromium / Webkit browser for testing the React SPA

---

# PART 6 — DATABASE MANAGEMENT SYSTEM (DBMS)

### 1. Exact DBMS Used
- **Database Engine:** PostgreSQL 14+ (hosted remotely on Supabase)
- **Data Access Tool / ORM:** Prisma ORM v5.22 (`@prisma/client`)
- **DDL & Migration Source:** `backend/supabase/schema.sql` and `backend/prisma/schema.prisma`

### 2. Why PostgreSQL via Supabase Was Chosen
- **ACID Transaction Guarantee:** Resource locking and state updates occur atomically.
- **Relational Integrity:** Clean foreign key relations linking operations to ships, equipment, and cargo.
- **Enterprise Features:** High-speed B-Tree indexing, Row Level Security (RLS), and custom PL/pgSQL trigger functions.
- **Prisma Client Compatibility:** Provides type-safe compile-time database queries with zero raw SQL injection vulnerabilities.

### 3. Alternatives Considered vs. Chosen Stack
- **MongoDB (NoSQL Document Store):** Unsuitable because port terminal operations require strict relational integrity, 3NF normalization, and transactional consistency rather than unstructured document schemas.
- **MySQL:** Viable, but PostgreSQL offers better indexing capabilities, native `TIMESTAMPTZ` handling, and seamless integration with Supabase cloud infrastructure.

---

# PART 7 — DATABASE TABLES / MODELS

### Core 5-Table Relational Schema
| Model / Table | File Location | Key Fields | Purpose | Relationships |
| :--- | :--- | :--- | :--- | :--- |
| **`users`** | `schema.prisma` / `schema.sql` | `id`, `email`, `password_hash`, `full_name`, `role`, `updated_at`, `deleted_at` | Authenticated operators & credentials | Initiates operations (`created_by`) |
| **`ships`** | `schema.prisma` / `schema.sql` | `id`, `imo_number`, `name`, `vessel_type`, `capacity_teu`, `status`, `berth_id` | Marine vessels arriving & docking | $1:N$ with `cargo`, $1:N$ with `operations` |
| **`cargo`** | `schema.prisma` / `schema.sql` | `id`, `cargo_number`, `size_type`, `weight_tons`, `current_location`, `ship_name`, `status` | Shipping container manifests | Linked to vessel via `ship_name` |
| **`equipment`**| `schema.prisma` / `schema.sql` | `id`, `equipment_id`, `name`, `type`, `status`, `assigned_to` | Shared Berths & Cranes (Mutexes/Semaphores) | Allocated to operations via `assigned_to` |
| **`operations`**| `schema.prisma` / `schema.sql` | `id`, `process_id`, `operation_type`, `ship_name`, `crane_id`, `berth_id`, `priority`, `status`, `waiting_time_ms`, `turnaround_time_ms` | Central Process Control Block (PCB) jobs | Bridges ships, cranes, berths, and users |

### Complete Database Flow (Realistic Walkthrough Example)
1. **Insert Ship:** Ship `"MV Pacific Wave"` (IMO: `IMO-9876543`) is registered in table `ships`.
2. **Insert Cargo:** 20ft container manifest `"CRG-4001"` is added to table `cargo` with `ship_name = 'MV Pacific Wave'`.
3. **Insert Operation:** Operator dispatches an unloading job. A record is inserted into `operations` with `crane_id = 'Crane A'`, `berth_id = 'Berth 1'`, `status = 'Queued'`.
4. **Prisma Transaction:** A process ID (`op-<id>`) is generated.
5. **OS Execution:** The Node.js scheduler locks `"Crane A"` (Mutex) and allocates `"Berth 1"` (Semaphore).
6. **Completion Update:** Upon task completion, `operations.status` becomes `'Completed'`, `end_time` is stamped, and `waiting_time_ms` (e.g., $150\text{ ms}$) and `turnaround_time_ms` (e.g., $4150\text{ ms}$) are persisted to PostgreSQL.

---

# PART 8 — MAIN REST API ENDPOINTS

| Method | Endpoint | Purpose | Request Data | Response | Owned By |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate operator | `{ email, password }` | `{ token, user }` | Member 6 |
| `POST` | `/api/auth/register` | Register new operator | `{ email, password, fullName, role }` | `{ token, user }` | Member 6 |
| `POST` | `/api/auth/forgot-password`| Request 30s OTP code | `{ email }` | `{ success, message }` | Member 6 |
| `POST` | `/api/auth/verify-otp` | Verify 6-digit OTP | `{ email, otp }` | `{ success, message }` | Member 6 |
| `POST` | `/api/auth/reset-password`| Finalize new password | `{ email, otp, newPassword }` | `{ success, message }` | Member 6 |
| `GET` | `/api/operations` | List active operations | None (Headers: Bearer Token) | `OperationRecord[]` | Member 1 |
| `POST` | `/api/operations` | Create new port job (PCB)| `{ operationType, shipName, craneId, berthId, priority }` | Created `OperationRecord` | Member 1 |
| `POST` | `/api/operations/dispatch`| Step scheduler execution | None | `{ operationId, process }` | Member 1 |
| `GET` | `/api/ships` | List all active vessels | None | `ShipRecord[]` | Member 2 |
| `POST` | `/api/ships` | Register incoming vessel | `{ name, imo_number, vessel_type, capacity_teu }` | Created `ShipRecord` | Member 2 |
| `PUT` | `/api/ships/:id` | Update ship status/berth | `{ status, berth_id, name }` | Updated `ShipRecord` | Member 2 |
| `GET` | `/api/cargos` | List container manifests | None | `CargoRecord[]` | Member 3 |
| `POST` | `/api/cargos` | Register new container | `{ cargo_number, size_type, weight_tons, ship_name }` | Created `CargoRecord` | Member 3 |
| `PUT` | `/api/cargos/:id` | Update location/status | `{ status, current_location }` | Updated `CargoRecord` | Member 3 |
| `GET` | `/api/equipments` | List berths & cranes | None | `EquipmentRecord[]` | Member 4 |
| `PUT` | `/api/equipments/:id` | Update equipment status | `{ status, assigned_to }` | Updated `EquipmentRecord` | Member 4 |
| `GET` | `/api/os/state` | Inspect OS queues & locks| None | `{ queue, locks, activeAlgo }` | Member 5 |
| `PUT` | `/api/os/algorithm` | Switch scheduling mode | `{ algorithm: 'FCFS'\|'SJF'\|'PRIORITY' }` | `{ currentAlgo }` | Member 5 |
| `GET` | `/api/trash` | View all soft-deleted items| None | `TrashedRecord[]` | Member 6 |
| `POST` | `/api/trash/restore/:c/:id`| 1-click restore item | None | `{ success, restored }` | Member 6 |
| `DELETE`| `/api/trash/:c/:id` | Permanent purge item | None | `{ success }` | Member 6 |

---

# PART 9 — FULL-STACK 6-MEMBER DIVISION (FE + BE + OS + DBMS)

In accordance with academic PBL viva expectations, every member is a **Full-Stack Feature Owner** responsible for an end-to-end slice of PortFlow:
1. **Frontend:** React 19 pages, UI components, modals, and client hooks.
2. **Backend:** Express 5 route handlers, controllers, services, and repositories.
3. **Dedicated OS Feature:** A distinct core Operating System algorithm or synchronization primitive.
4. **Dedicated DBMS Table:** A distinct 3NF relational PostgreSQL table and query layer.

```text
                          ┌──────────────────────────────────────────────┐
                          │         PORTFLOW 6-MEMBER TEAM MATRIX        │
                          │        (Full-Stack + OS + DBMS Slices)       │
                          └──────────────────────┬───────────────────────┘
                                                 │
  ┌──────────────────────┬───────────────────────┼───────────────────────┬───────────────────────┬──────────────────────┐
  ▼                      ▼                       ▼                       ▼                       ▼                      ▼
MEMBER 1               MEMBER 2                MEMBER 3                MEMBER 4                MEMBER 5               MEMBER 6
Operations &           Vessel Traffic &        Cargo Logistics &       Equipment &             Telemetry &            Security &
CPU Scheduling         PCB Lifecycle           Crane Mutex             Berth Semaphores        Deadlock Graph         Recycle Bin
────────────────       ────────────────        ─────────────────       ────────────────        ────────────────       ────────────────
FE: OperationsPage     FE: ShipsPage           FE: CargoPage           FE: EquipmentPage       FE: SchedulingPage     FE: Login & Trash
BE: Operations API     BE: Ships API           BE: Cargo API           BE: Equipment API       BE: OS State API       BE: Auth & Trash API
OS: FCFS & SJF         OS: Process PCB         OS: Crane Mutex         OS: Semaphores          OS: Deadlock (DFS)     OS: Protection & Reclaim
DB: `operations`       DB: `ships`             DB: `cargo`             DB: `equipment`         DB: Telemetry (Ops)    DB: `users` & Audit
```

---

### MEMBER 1 — Operations Hub & CPU Scheduling (FCFS / SJF)
- **Primary Domain:** Port Job Execution & CPU Scheduling Algorithms
- **🎨 Frontend Ownership:**
  - `frontend/src/pages/OperationsPage.tsx`
  - `frontend/src/features/operations/components/OperationsTable.tsx`
  - `frontend/src/features/operations/hooks/useOperations.ts`
  - Interactive job dispatching UI, dynamic algorithm dropdown, priority badges, and execution step button.
- **🛠️ Backend Ownership:**
  - `backend/src/controllers/operations.controller.ts`
  - `backend/src/services/operations.service.ts`
  - `backend/src/repositories/operations.repository.ts`
  - Handlers for `GET /api/operations`, `POST /api/operations`, and `POST /api/operations/dispatch`.
- **💻 Dedicated OS Feature:** **CPU Scheduling Algorithms (`Scheduler.ts`)**
  - **First-Come First-Served (FCFS):** Orders ready processes strictly by arrival time ($A_t$).
  - **Shortest Job First (SJF):** Non-preemptive scheduling reordering the queue based on minimum CPU burst time ($B_t$).
  - **Strategy Pattern:** Enables runtime swapping of scheduling policies without stopping execution.
- **🗄️ Dedicated DBMS Table:** **`operations` Table**
  - Schema: `id`, `process_id`, `operation_type`, `ship_name`, `crane_id`, `berth_id`, `priority`, `status`, `waiting_time_ms`, `turnaround_time_ms`.
  - Represents persistent Process Control Blocks (PCBs) in PostgreSQL with B-Tree indexes on `status` and `priority`.
- **💬 30-Second Viva Pitch:**
  > *"I engineered the Operations feature full-stack. On the frontend, I built the Operations dashboard and `useOperations` hook to create and dispatch port jobs. On the backend, I built `operations.controller.ts` and its repository. My dedicated OS feature is CPU Scheduling in `Scheduler.ts`, where I implemented FCFS and Shortest Job First queue sorting algorithms. My dedicated database table is `operations`, which stores persistent process states, priorities, and calculated execution times."*
- **🎯 What to Demonstrate Live:**
  1. Open the Operations Page and submit a new container discharge operation.
  2. Switch scheduling algorithm to SJF and click "Dispatch Next".
  3. Show how the job with the shortest burst time executes first and updates its status in the table.

---

### MEMBER 2 — Marine Vessel Traffic & Process Control Block (PCB) Lifecycle
- **Primary Domain:** Vessel Fleet Tracking & OS Process State Machine
- **🎨 Frontend Ownership:**
  - `frontend/src/pages/ShipsPage.tsx`
  - Vessel registration modal dialog and IMO validation inputs.
  - Real-time docking status chips (`Waiting`, `Docked`, `Departed`).
  - Search and filter bar for active vessels.
- **🛠️ Backend Ownership:**
  - `backend/src/controllers/ships.controller.ts`
  - `backend/src/services/ships.service.ts`
  - `backend/src/repositories/ships.repository.ts`
  - Handlers for `GET /api/ships`, `POST /api/ships`, `PUT /api/ships/:id`, and `DELETE /api/ships/:id`.
- **💻 Dedicated OS Feature:** **Process Control Block (PCB) & Lifecycle (`Process.ts`)**
  - Models marine vessel tasks as standard OS processes holding PID, burst duration, remaining time, priority, and timestamps.
  - Implements the strict 5-state process lifecycle machine: `NEW` $\to$ `READY` $\to$ `RUNNING` $\to$ `WAITING` $\to$ `TERMINATED`.
- **🗄️ Dedicated DBMS Table:** **`ships` Table**
  - Schema: `id`, `imo_number` (UNIQUE constraint, length $\ge 3$), `name`, `vessel_type`, `capacity_teu`, `status`, `berth_id`, `arrival_time`, `departure_time`.
  - 3NF relational link: One-to-many relationship with `cargo` and foreign-key link to assigned `berth_id`.
- **💬 30-Second Viva Pitch:**
  > *"I engineered the Marine Vessel domain full-stack. On the frontend, I developed the Ships Page with IMO validation and status controls. On the backend, I built `ships.controller.ts`, `ships.service.ts`, and `ships.repository.ts`. My OS concept is the Process Control Block (PCB) in `Process.ts`, modeling jobs as processes transitioning through NEW, READY, RUNNING, and TERMINATED states. My dedicated database table is `ships`, featuring unique IMO constraints and foreign-key ties to docking berths."*
- **🎯 What to Demonstrate Live:**
  1. Register a new vessel with valid IMO (e.g., `IMO-9988771`) and capacity in TEUs.
  2. Change vessel status from `Waiting` to `Docked`.
  3. Show the corresponding process state in `Process.ts` transition from `READY` to `RUNNING`.

---

### MEMBER 3 — Container Cargo Logistics & Crane Mutex Synchronization
- **Primary Domain:** Freight Logistics & Mutual Exclusion (Mutex)
- **🎨 Frontend Ownership:**
  - `frontend/src/pages/CargoPage.tsx`
  - Container manifest creation and edit modal.
  - TEU size distribution filters (20ft Standard vs 40ft High Cube) and Hazardous cargo warning badges.
  - Yard zone location dropdowns (`Yard A`, `Yard B`, `Customs Holding`).
- **🛠️ Backend Ownership:**
  - `backend/src/controllers/cargo.controller.ts`
  - `backend/src/services/cargo.service.ts`
  - `backend/src/repositories/cargo.repository.ts`
  - Handlers for `GET /api/cargos`, `POST /api/cargos`, `PUT /api/cargos/:id`, and `DELETE /api/cargos/:id`.
- **💻 Dedicated OS Feature:** **Mutual Exclusion (Mutex) & Lock Contention (`Mutex.ts`)**
  - Implements a thread-safe asynchronous Mutex for Quay Cranes.
  - Maintains an internal FIFO wait-queue of Promises: if Crane A is currently locked by Job 1, Job 2 requests the lock and is queued without busy-waiting until `unlock()` releases it.
- **🗄️ Dedicated DBMS Table:** **`cargo` Table**
  - Schema: `id`, `cargo_number` (UNIQUE container ID), `size_type`, `weight_tons`, `hazardous`, `current_location`, `yard_zone`, `ship_name`, `status`.
  - Backwards-compatibility SQL View `containers` mapped for legacy endpoints.
- **💬 30-Second Viva Pitch:**
  > *"I engineered the Container Cargo and Mutex synchronization domain full-stack. On the frontend, I built the Cargo Manifest page with TEU filters and hazard flags. On the backend, I built `cargo.controller.ts` and `cargo.repository.ts`. My OS feature is Mutual Exclusion in `Mutex.ts`, preventing race conditions on Quay Cranes using an asynchronous FIFO wait-queue. My dedicated database table is `cargo`, which indexes container numbers, weights, and yard zones."*
- **🎯 What to Demonstrate Live:**
  1. Add a new container to the manifest assigned to an incoming vessel.
  2. Dispatch two operations simultaneously requiring the same Quay Crane.
  3. Show how Job 1 acquires the Mutex while Job 2 waits in the Mutex FIFO queue.

---

### MEMBER 4 — Port Equipment Allocation & Counting Semaphores
- **Primary Domain:** Physical Dockyard Infrastructure & Counting Semaphores
- **🎨 Frontend Ownership:**
  - `frontend/src/pages/EquipmentPage.tsx`
  - Visual status cards for all physical Berths and Quay Cranes.
  - Real-time availability badges (`Available`, `Occupied`, `Maintenance`).
  - Interactive maintenance toggle dialogs and resource allocation monitors.
- **🛠️ Backend Ownership:**
  - `backend/src/controllers/equipment.controller.ts`
  - `backend/src/services/equipment.service.ts`
  - `backend/src/repositories/equipment.repository.ts`
  - Handlers for `GET /api/equipments` and `PUT /api/equipments/:id`.
- **💻 Dedicated OS Feature:** **Counting Semaphores & Resource Pooling (`Semaphore.ts`)**
  - Implements a classic Counting Semaphore initialized with $N$ available docking berths.
  - `acquire()` decrements permits; if count is 0, processes block and join the semaphore wait-list.
  - `release()` increments permits and signals the next waiting vessel process.
- **🗄️ Dedicated DBMS Table:** **`equipment` Table**
  - Schema: `id`, `equipment_id`, `name`, `type` (`CRANE` / `BERTH`), `status` (`AVAILABLE` / `OCCUPIED` / `MAINTENANCE`), `assigned_to`, `updated_at`.
  - Backwards-compatibility SQL View `resources` mapped to `equipment`.
- **💬 30-Second Viva Pitch:**
  > *"I engineered the Physical Equipment and Semaphore allocation domain full-stack. On the frontend, I developed the Equipment Page displaying live berth and crane states. On the backend, I built `equipment.controller.ts` and `equipment.repository.ts`. My OS feature is Counting Semaphores in `Semaphore.ts`, managing shared berths as a pooled resource counter to prevent physical over-allocation. My dedicated database table is `equipment`, recording resource health and assignments."*
- **🎯 What to Demonstrate Live:**
  1. Show the Equipment dashboard with 3 Berths available.
  2. Dock ships until all berths are occupied (semaphore count reaches 0).
  3. Attempt to dock a 4th vessel and demonstrate that the semaphore blocks the operation until a berth is released.

---

### MEMBER 5 — Scheduling Dashboard, Telemetry & Deadlock Detection
- **Primary Domain:** OS Scheduling Dashboard, Metrics & Graph Deadlock Detection
- **🎨 Frontend Ownership:**
  - `frontend/src/pages/SchedulingPage.tsx`
  - `frontend/src/features/operations/components/OperationMetricsCards.tsx`
  - `frontend/src/App.tsx` layout shell and top header alert indicators.
  - Live metric visualization for Average Waiting Time and Average Turnaround Time.
- **🛠️ Backend Ownership:**
  - `backend/src/controllers/os.controller.ts`
  - `backend/src/os/PortSystem.ts` (Singleton OS kernel coordinator)
  - `backend/src/index.ts` (Server configuration & middleware pipeline)
  - Handlers for `GET /api/os/state` and `PUT /api/os/algorithm`.
- **💻 Dedicated OS Feature:** **Deadlock Detection & Wait-For Graphs (`DeadlockDetector.ts`)**
  - Constructs a dynamic directed Wait-For Graph (WFG) where nodes represent Processes and Resources.
  - Runs Depth-First Search (DFS) with recursion stack tracking to detect cycles ($P_1 \to R_1 \to P_2 \to R_2 \to P_1$).
  - Flags circular wait deadlocks and outputs deadlocked PIDs to the UI.
- **🗄️ Dedicated DBMS Table:** **OS Performance Telemetry Schema in `operations` Table**
  - Telemetry columns: `waiting_time_ms`, `turnaround_time_ms`, `burst_time`, `priority`.
  - Calculates and persists $W_t = T_t - B_t$ and $T_t = C_t - A_t$ in PostgreSQL to evaluate CPU scheduling efficiency.
- **💬 30-Second Viva Pitch:**
  > *"I engineered the Scheduling Telemetry and Deadlock Detection domain full-stack. On the frontend, I built the Scheduling Page and performance metrics cards. On the backend, I built `os.controller.ts` and `PortSystem.ts`. My OS feature is Deadlock Detection in `DeadlockDetector.ts`, using a Wait-For Graph and DFS cycle finding to catch circular wait conditions. My DBMS focus is the performance telemetry schema in `operations` recording waiting and turnaround times."*
- **🎯 What to Demonstrate Live:**
  1. Open the Scheduling Page and review the live metrics cards ($W_t$ and $T_t$).
  2. Trigger a simulated resource cycle between two operations contending for Crane A and Berth 1.
  3. Demonstrate how the DFS cycle finder flags a deadlock and displays the circular wait graph.

---

### MEMBER 6 — Authentication, System Protection & Recycle Bin (Trash)
- **Primary Domain:** Security Architecture, Storage Reclaim & Database Administration
- **🎨 Frontend Ownership:**
  - `frontend/src/pages/Login.tsx` & `Login.css`
  - 30-second expiring OTP modal dialog and countdown timer.
  - Global authentication context in `frontend/src/auth/AuthProvider.tsx`.
  - Route guards in `frontend/src/auth/ProtectedRoute.tsx`.
  - Two-phase Recycle Bin UI in `frontend/src/pages/TrashPage.tsx`.
- **🛠️ Backend Ownership:**
  - `backend/src/controllers/auth.controller.ts` & `backend/src/services/auth.service.ts`
  - `backend/src/controllers/trash.controller.ts` & `backend/src/repositories/trash.repository.ts`
  - `backend/src/middleware/auth.ts` (JWT verification middleware)
  - `backend/supabase/schema.sql` & `backend/prisma/schema.prisma`
- **💻 Dedicated OS Feature:** **System Protection & Memory/Storage Reclaim**
  - Role-based authorization matrix and token verification enforcing process privileges.
  - In-memory eviction cache: JavaScript `Map` storing 30-second expiring OTP tokens with timestamp eviction.
  - Two-phase storage reclaim: Soft-delete sets `deleted_at = NOW()` to avoid dangling references; permanent purge executes clean garbage reclamation.
- **🗄️ Dedicated DBMS Table:** **`users` Table & Cross-Table Audit Schema**
  - `users` Schema: `id`, `email`, `password_hash`, `full_name`, `role`, `created_at`, `updated_at`, `deleted_at`.
  - 3NF normalization, 17 B-Tree indexes, PL/pgSQL `update_timestamp_column()` triggers, and Row Level Security (RLS).
- **💬 30-Second Viva Pitch:**
  > *"I engineered Authentication, System Protection, and Database Architecture full-stack. On the frontend, I built the Login portal, the 30-second OTP modal, and the Trash Recycle Bin. On the backend, I built `auth.service.ts`, `trash.repository.ts`, and the 3NF PostgreSQL schema. My OS concept is System Protection and Storage Reclaim, implementing JWT access control and a 2-phase soft-delete audit engine. My dedicated database table is `users`, along with the multi-table `deleted_at` audit schema."*
- **🎯 What to Demonstrate Live:**
  1. Log in with `operator@portflow.com` and trigger the 30-second OTP modal to show the countdown timer.
  2. Soft-delete an item, navigate to `/trash`, and execute a 1-click restore.
  3. Open `schema.sql` and explain the 3NF normalization, indexes, and triggers to the evaluator.

---

# PART 10 — OWN CODE VS AI-ASSISTED WORK (JUSTIFIED & HONEST)

### Team AI Policy Statement
> *"Our team used AI strictly as an auxiliary productivity assistant for debugging syntax errors, optimizing query structures, generating TypeScript interface boilerplate, and explaining complex library documentation. Every algorithm, data structure, schema relationship, and API route was reviewed, adapted, manually integrated, and verified by team members."*

| Member | What I Personally Wrote & Understand | What AI Assisted With | Why AI Was Justified | What I Did After AI Suggested It |
| :--- | :--- | :--- | :--- | :--- |
| **Member 1** (Ops & Scheduling) | Operations UI (`OperationsPage.tsx`), `useOperations.ts`, `operations.controller.ts`, and FCFS/SJF algorithms in `Scheduler.ts`. | Tailwind CSS color tokens for status chips; sorting utility snippet for burst times. | Accelerated CSS badge styling and array sorting boilerplate. | Adapted styles into `OperationsTable.tsx`, added null safety, verified non-preemptive SJF sorting. |
| **Member 2** (Ships & PCB) | Ships interface (`ShipsPage.tsx`), registration modal, `ships.controller.ts`, and Process state transitions in `Process.ts`. | Regex pattern for IMO vessel number format (`IMO-XXXXXXX`); Lucide icon suggestions. | Prevented invalid vessel codes via strict regular expression check. | Tested regex against standard IMO numbers, wired into form validation, verified 5-state lifecycle. |
| **Member 3** (Cargo & Mutex) | Cargo manifest page (`CargoPage.tsx`), TEU filters, `cargo.controller.ts`, and asynchronous Mutex queue in `Mutex.ts`. | Promise resolver queue structure snippet for asynchronous mutex lock. | Concurrency logic in Node.js requires careful Promise resolution without memory leaks. | Traced lock acquisition with test cases, verified FIFO order, bound to Quay Crane allocation. |
| **Member 4** (Equipment & Semaphore) | Equipment panel (`EquipmentPage.tsx`), status cards, `equipment.controller.ts`, and Counting Semaphore in `Semaphore.ts`. | Initial counting semaphore class outline with permit counter and wait queue. | Accelerated boilerplate class construction for pooled resource management. | Added strict boundary checks (permits cannot be negative), linked to berth capacity in PostgreSQL. |
| **Member 5** (Telemetry & Deadlock) | Scheduling dashboard (`SchedulingPage.tsx`), metric cards, `os.controller.ts`, and DFS cycle detector in `DeadlockDetector.ts`. | Recursive DFS graph traversal template for directed cycle detection. | Cycle detection in directed graphs has edge cases with recursion stack tracking. | Traced cycle detection on paper with a 3-node graph, added cycle path extraction, verified via Jest. |
| **Member 6** (Security, Trash & DBMS) | Login portal (`Login.tsx`), 30s OTP timer, `auth.service.ts`, `trash.repository.ts`, and PostgreSQL 3NF schema in `schema.sql`. | Syntax for PostgreSQL PL/pgSQL trigger function `update_timestamp_column()`. | Complex PostgreSQL trigger syntax differs from standard SQL queries. | Validated trigger execution in Supabase SQL editor, verified `updated_at` timestamps and RLS policies. |

### Safe Answers to Tough Viva Questions on AI

#### Q1: "How much AI did you use in this project?"
> *"We used AI for approximately 15–20% of our workflow, primarily as an interactive documentation and syntax assistant. For example, generating complex regex patterns, verifying PL/pgSQL trigger syntax, and optimizing CSS classes. All core business rules, OS scheduling logic, and database schemas were designed and coded by us."*

#### Q2: "Which part of your code was written by AI?"
> *"No module was copied blindly from AI. Small helper snippets, such as the DFS graph traversal template in `DeadlockDetector.ts` or the CSS keyframe animation for the OTP modal, received AI input, but we reviewed, modified, and integrated every line into our codebase."*

#### Q3: "Why did you use AI if this project is meant for you to learn?"
> *"In modern software engineering, AI is an industry-standard productivity tool akin to an advanced linter or search engine. We used it to accelerate debugging and understand library APIs faster, allowing us to spend more time mastering low-level Operating System scheduling algorithms and relational database normalization."*

---

# PART 11 — MEMBER-WISE VIVA QUESTIONS & ANSWERS (FE + BE + OS + DBMS)

Every member must be prepared to answer questions covering **all 4 dimensions** of their full-stack slice: **Frontend**, **Backend**, **Dedicated OS Concept**, and **Dedicated DBMS Table**.

---

### Questions for MEMBER 1 — Operations Hub & CPU Scheduling (FCFS / SJF)

#### 🎨 Frontend (UI & Components)
1. **Q: Explain what your Operations Hub UI does and how jobs are displayed.**
   - *Simple Answer:* It displays the queue of port tasks and gives operators a button to dispatch them through our scheduling algorithm.
   - *Technical Answer:* It acts as the interactive presentation of the OS Ready Queue, fetching `/api/operations` and rendering process state, priority badges, assigned equipment, and execution progress in `OperationsTable.tsx`.
   - *File:* `frontend/src/pages/OperationsPage.tsx`
2. **Q: How does `useOperations.ts` manage state and prevent unnecessary re-renders?**
   - *Simple Answer:* It keeps all data fetching and button clicks in one custom hook so the table component stays clean.
   - *Technical Answer:* It implements the MVVM pattern: wraps operations in React `useState`, memoizes table calculations with `useMemo`, and uses `useCallback` for dispatch handlers to avoid unnecessary component tree reconciliation.
   - *File:* `frontend/src/features/operations/hooks/useOperations.ts`

#### 🛠️ Backend (APIs & Controllers)
3. **Q: What happens when an operator clicks "Dispatch Next" on the backend?**
   - *Simple Answer:* The server selects the next job from the queue and executes it.
   - *Technical Answer:* `POST /api/operations/dispatch` invokes `operations.controller.ts`, which calls `Scheduler.executeNextProcess()`. The scheduler locks necessary equipment, simulates burst duration, updates timestamps, and persists state in PostgreSQL.
   - *File:* `backend/src/controllers/operations.controller.ts`
4. **Q: How does `operations.repository.ts` abstract database operations from business logic?**
   - *Simple Answer:* It isolates Prisma database queries so controllers don't write database code directly.
   - *Technical Answer:* It implements the Repository Pattern. The repository exposes clean methods like `findActive()`, `create()`, and `updateStatus()` using `prisma.operation`, keeping the controller free of raw database dependencies.
   - *File:* `backend/src/repositories/operations.repository.ts`

#### 💻 Dedicated OS Feature (CPU Scheduling: FCFS & SJF)
5. **Q: How does First-Come First-Served (FCFS) scheduling work in your codebase?**
   - *Simple Answer:* Jobs are executed in the exact order they arrive at the terminal.
   - *Technical Answer:* In `Scheduler.ts`, the Ready Queue is sorted ascendingly by `arrivalTime` ($A_t$). The process at index 0 is dequeued and executed to completion non-preemptively.
   - *File:* `backend/src/os/Scheduler.ts`
6. **Q: How does Shortest Job First (SJF) work, and how does your code select the next process?**
   - *Simple Answer:* It looks at all waiting jobs and runs the one with the smallest burst time first.
   - *Technical Answer:* In `Scheduler.ts`, SJF sorts the queue by `burstTime` ($B_t$). The job requiring the least simulated execution time runs first, mathematically minimizing average waiting time.
   - *File:* `backend/src/os/Scheduler.ts`
7. **Q: What is the "Convoy Effect" in FCFS, and how does SJF solve it?**
   - *Simple Answer:* A huge job in front makes small jobs wait a long time; SJF runs the small jobs first so they don't get stuck.
   - *Technical Answer:* In FCFS, if a process with a large burst time enters the CPU first, all subsequent short processes are delayed, causing high average waiting time ($W_t$). SJF eliminates the convoy effect by prioritizing short bursts.
   - *File:* `backend/src/os/Scheduler.ts`

#### 🗄️ Dedicated DBMS Table (`operations` Table)
8. **Q: Explain the schema and columns of your dedicated `operations` table.**
   - *Simple Answer:* It stores process ID, ship name, crane ID, berth ID, priority, status, and calculated waiting/turnaround times.
   - *Technical Answer:* Primary key `id UUID`, foreign references `vessel_id`, `crane_id`, `berth_id`, and `created_by`, with columns `priority INTEGER`, `status VARCHAR(50)`, `waiting_time_ms INTEGER`, `turnaround_time_ms INTEGER`, and `deleted_at TIMESTAMPTZ`.
   - *File:* `backend/supabase/schema.sql` / `backend/prisma/schema.prisma`
9. **Q: How are calculated waiting time ($W_t$) and turnaround time ($T_t$) persisted in PostgreSQL?**
   - *Simple Answer:* Once a job finishes, the controller updates the operation row with end timestamps and calculated milliseconds.
   - *Technical Answer:* When the process finishes running, `operations.controller.ts` issues a Prisma `update` query setting `status = 'Completed'`, `end_time = NOW()`, `waiting_time_ms`, and `turnaround_time_ms`.
   - *File:* `backend/src/controllers/operations.controller.ts`
10. **Q: What indexes exist on the `operations` table and why are they needed?**
    - *Simple Answer:* Indexes on status, priority, and deleted_at to make dashboard queries fast.
    - *Technical Answer:* B-Tree indexes on `idx_operations_status` and `idx_operations_deleted_at` ensure active queries filtering `WHERE deleted_at IS NULL AND status = 'Pending'` execute in $O(\log N)$ time rather than full-table scans.
    - *File:* `backend/supabase/schema.sql`

---

### Questions for MEMBER 2 — Marine Vessel Traffic & PCB Lifecycle

#### 🎨 Frontend (UI & Components)
1. **Q: What is the purpose of the Ships page, and how is an incoming vessel registered?**
   - *Simple Answer:* It manages vessel registrations and docking berths.
   - *Technical Answer:* Provides full CRUD operations for maritime vessels in `ShipsPage.tsx`. Operators click "Register Ship", input name, IMO number, vessel type, and TEU capacity, and submit to `/api/ships`.
   - *File:* `frontend/src/pages/ShipsPage.tsx`
2. **Q: How do you validate the IMO number format on the frontend?**
   - *Simple Answer:* We check that the input is not empty and has at least 3 characters before submitting.
   - *Technical Answer:* An International Maritime Organization unique identifier. Validated on frontend via string length $\ge 3$ and regex check, preventing invalid form submissions before sending network requests.
   - *File:* `frontend/src/pages/ShipsPage.tsx`

#### 🛠️ Backend (APIs & Controllers)
3. **Q: How does `ships.controller.ts` validate requests and handle status updates?**
   - *Simple Answer:* It extracts vessel data from the request body, checks if required fields exist, and sends it to the service.
   - *Technical Answer:* Validates `name`, `imo_number`, and `capacity_teu`, passes the payload to `shipsService.create()`, and returns HTTP `201 Created` with the newly created vessel record.
   - *File:* `backend/src/controllers/ships.controller.ts`
4. **Q: How does `ships.repository.ts` filter out soft-deleted ships?**
   - *Simple Answer:* Every query automatically checks that deleted_at is null.
   - *Technical Answer:* All Prisma queries like `findMany` include `where: { deleted_at: null }`, ensuring soft-deleted vessels are quarantined from the active UI while preserving referential integrity.
   - *File:* `backend/src/repositories/ships.repository.ts`

#### 💻 Dedicated OS Feature (Process Control Block & Lifecycle)
5. **Q: What is a Process Control Block (PCB), and how does `Process.ts` model it?**
   - *Simple Answer:* A PCB is the data structure that stores all information about a running job; `Process.ts` holds its ID, state, and timers.
   - *Technical Answer:* `Process.ts` is the domain model representing an operating system PCB. It encapsulates Process ID (`pid`), Arrival Time (`arrivalTime`), Burst Time (`burstTime`), Remaining Time (`remainingTime`), Priority, and State (`state`).
   - *File:* `backend/src/os/Process.ts`
6. **Q: Explain the 5-state process lifecycle machine implemented in `Process.ts`.**
   - *Simple Answer:* A process moves from NEW to READY to RUNNING to WAITING to TERMINATED.
   - *Technical Answer:*
     - `NEW`: Vessel job created but not queued.
     - `READY`: Added to OS scheduler waiting for CPU.
     - `RUNNING`: Currently holding required resources and executing.
     - `WAITING`: Blocked waiting for a locked Crane (Mutex) or Berth (Semaphore).
     - `TERMINATED`: Execution finished, resources released, metrics recorded.
   - *File:* `backend/src/os/Process.ts`
7. **Q: What is Context Switching and how does your simulator model it?**
   - *Simple Answer:* Switching from one running job to another by saving and loading state.
   - *Technical Answer:* When the scheduler preempts or finishes a job, it saves the current process's remaining burst time and state, updates equipment allocation, and loads the next process PCB from the Ready Queue into execution.
   - *File:* `backend/src/os/Process.ts`

#### 🗄️ Dedicated DBMS Table (`ships` Table)
8. **Q: Explain the schema and constraints of your dedicated `ships` table.**
   - *Simple Answer:* It stores ship ID, unique IMO number, name, type, capacity in TEU, status, and berth ID.
   - *Technical Answer:* Primary key `id UUID`, unique `imo_number VARCHAR(50)`, `capacity_teu INTEGER CHECK (capacity_teu > 0)`, `status VARCHAR(50)`, foreign key `berth_id REFERENCES equipment(id)`, and audit timestamps.
   - *File:* `backend/supabase/schema.sql`
9. **Q: How does the database guarantee unique IMO numbers without crashing on duplicates?**
   - *Simple Answer:* A unique constraint in PostgreSQL throws an error that our backend catches and returns as a friendly message.
   - *Technical Answer:* `UNIQUE (imo_number)` in PostgreSQL creates a unique B-Tree index. When Prisma encounters a constraint violation (`P2002`), `ships.controller.ts` catches it and returns HTTP `400 Bad Request: IMO already exists`.
   - *File:* `backend/supabase/schema.sql`
10. **Q: How is the one-to-many relationship between `ships` and `cargo` represented?**
    - *Simple Answer:* The cargo table has a foreign key pointing to the ship's ID or name.
    - *Technical Answer:* In `schema.prisma`, `Ship` has relation `cargoes Cargo[]`, and `Cargo` has `vessel_id UUID REFERENCES ships(id) ON DELETE RESTRICT`, preventing a ship from being hard-deleted if it contains registered containers.
    - *File:* `backend/prisma/schema.prisma`

---

### Questions for MEMBER 3 (Auth UI, Equipment & Trash)
1. **Q: Explain how login works on the frontend.**
   - *Simple Answer:* Operator enters email and password; if correct, they get access to the dashboard.
   - *Technical Answer:* `handleLogin()` calls `api.auth.login()`, receives a JWT token and user object, stores the token in `localStorage`, updates `AuthProvider` context, and redirects to `/operator`.
   - *File:* `frontend/src/pages/Login.tsx`
2. **Q: How does the 30-second OTP password recovery work?**
   - *Simple Answer:* You enter your email, a 6-digit code is generated with a 30s timer, and you enter it to change your password.
   - *Technical Answer:* `handleSendOTP()` requests a 6-digit OTP via `/api/auth/forgot-password`. A `setInterval` timer counts down from 30s. Submitting verifies via `/api/auth/verify-otp` before allowing password reset.
   - *File:* `frontend/src/pages/Login.tsx`
3. **Q: How does `ProtectedRoute` prevent unauthorized access?**
   - *Simple Answer:* If you are not logged in, it redirects you to the login page.
   - *Technical Answer:* It checks `isAuthenticated` from `useAuth()`. If false, it renders `<Navigate to="/login" replace />`; otherwise, it renders the protected component tree.
   - *File:* `frontend/src/auth/ProtectedRoute.tsx`
4. **Q: What does the Equipment page represent?**
   - *Simple Answer:* It shows all the port berths and cranes and their current status.
   - *Technical Answer:* Represents the physical shared resources governed by OS Mutexes and Semaphores. Cards show availability (`Available`, `Occupied`, `Maintenance`) and active assignments.
   - *File:* `frontend/src/pages/EquipmentPage.tsx`
5. **Q: What is the Trash page and how does restore work?**
   - *Simple Answer:* It is a recycle bin where you can restore deleted items with one click.
   - *Technical Answer:* Consumes `/api/trash` displaying all entities with `deleted_at IS NOT NULL`. Clicking "Restore" triggers `POST /api/trash/restore/:collection/:id`, clearing `deleted_at`.
   - *File:* `frontend/src/pages/TrashPage.tsx`
6. **Q: What happens if an operator enters an expired OTP?**
   - *Simple Answer:* The UI shows an error saying the code has expired.
   - *Technical Answer:* If `otpTimer <= 0`, the client immediately sets an error message asking the user to request a new code; the backend also independently verifies timestamp expiration.
   - *File:* `frontend/src/pages/Login.tsx`
7. **Q: Where is the JWT token stored on the frontend?**
   - *Simple Answer:* In browser local storage.
   - *Technical Answer:* In `localStorage` under key `'portflow_auth_token'`. It is cleared on logout or on 401 unauthorized responses.
   - *File:* `frontend/src/lib/api.ts`
8. **Q: How does the "Empty Trash" feature work?**
   - *Simple Answer:* It permanently purges everything in the recycle bin.
   - *Technical Answer:* It sends `DELETE /api/trash/empty`, invoking `deleteMany` queries across all 4 collections on records where `deleted_at IS NOT NULL`.
   - *File:* `frontend/src/pages/TrashPage.tsx`
9. **Q: How does the sidebar highlight the active navigation item?**
   - *Simple Answer:* It checks the current route view.
   - *Technical Answer:* `app-sidebar.tsx` receives `activeView` as a prop and conditionally applies active background and text colors to the corresponding button.
   - *File:* `frontend/src/components/app-sidebar.tsx`
10. **Q: What would you improve in your module for Phase 3?**
    - *Simple Answer:* Add real email delivery for the OTP instead of console display.
    - *Technical Answer:* Integrate Nodemailer / SendGrid for production SMTP dispatch and add biometric WebAuthn support.

---

### Questions for MEMBER 4 — Port Equipment Allocation & Counting Semaphores

#### 🎨 Frontend (UI & Components)
1. **Q: What does the Equipment page display, and how do operators interact with it?**
   - *Simple Answer:* It shows cards for all berths and cranes, whether they are available or occupied, and allows maintenance toggling.
   - *Technical Answer:* `EquipmentPage.tsx` renders equipment inventory fetched from `/api/equipments`. Cards display type (`CRANE`/`BERTH`), current status, and assigned job, with modal controls to toggle maintenance mode.
   - *File:* `frontend/src/pages/EquipmentPage.tsx`
2. **Q: How do you handle status badge colors on equipment cards?**
   - *Simple Answer:* Green for Available, Amber for Occupied, and Red/Gray for Maintenance.
   - *Technical Answer:* A status mapping utility inspects `equipment.status` and returns Tailwind classes: `bg-emerald-500/10 text-emerald-400` for `Available`, `bg-amber-500/10 text-amber-400` for `Occupied`, and `bg-rose-500/10 text-rose-400` for `Maintenance`.
   - *File:* `frontend/src/pages/EquipmentPage.tsx`

#### 🛠️ Backend (APIs & Controllers)
3. **Q: How does `equipment.controller.ts` process equipment updates?**
   - *Simple Answer:* It validates the equipment ID and status string, then updates the database.
   - *Technical Answer:* It checks whether `status` is one of `Available`, `Occupied`, or `Maintenance`, updates `assigned_to`, and returns the updated `EquipmentRecord` JSON.
   - *File:* `backend/src/controllers/equipment.controller.ts`
4. **Q: How does `equipment.repository.ts` isolate database calls?**
   - *Simple Answer:* It encapsulates Prisma queries like `findMany` and `update` so service classes don't depend on Prisma syntax.
   - *Technical Answer:* It implements `IEquipmentRepository` with methods `findActive()`, `findById()`, and `updateStatus()`, facilitating clean unit testing with Jest mocks.
   - *File:* `backend/src/repositories/equipment.repository.ts`

#### 💻 Dedicated OS Feature (Counting Semaphores & Resource Pooling)
5. **Q: What is a Counting Semaphore, and how does `Semaphore.ts` model pooled berths?**
   - *Simple Answer:* A semaphore has a counter showing how many berths are free; jobs take a permit when docking and return it when leaving.
   - *Technical Answer:* A counting semaphore manages a finite pool of identical shared resources. Initialized with count $N$ (e.g., 3 Berths). Calling `acquire()` decrements available permits; if count reaches 0, incoming processes block until a permit is returned via `release()`.
   - *File:* `backend/src/os/Semaphore.ts`
6. **Q: Explain how `acquire()` and `release()` work in `Semaphore.ts`.**
   - *Simple Answer:* `acquire()` takes 1 permit or waits if 0; `release()` gives 1 permit back and wakes up a waiting job.
   - *Technical Answer:* In `Semaphore.ts`:
     - `acquire()`: If `permits > 0`, decrements `permits--` and resolves immediately. If `permits === 0`, pushes a resolver Promise callback to `waitQueue`.
     - `release()`: If `waitQueue.length > 0`, shifts the next waiting resolver and runs it. Otherwise, increments `permits++`.
   - *File:* `backend/src/os/Semaphore.ts`
7. **Q: How does a Counting Semaphore differ from a Mutex in resource allocation?**
   - *Simple Answer:* A Mutex only allows 1 process (binary 0 or 1); a counting semaphore allows $N$ processes to share a resource pool.
   - *Technical Answer:* Mutex enforces strict mutual exclusion on a single unit resource ($1$ lock, $1$ owner). Counting Semaphores manage resource pools of cardinality $N \ge 1$ without thread ownership constraints.
   - *File:* `backend/src/os/Semaphore.ts`

#### 🗄️ Dedicated DBMS Table (`equipment` Table)
8. **Q: Explain the schema and columns of your dedicated `equipment` table.**
   - *Simple Answer:* Stores equipment ID, name, type (Crane or Berth), status, and which operation is using it.
   - *Technical Answer:* Columns: `id UUID PRIMARY KEY`, `equipment_id VARCHAR(50) UNIQUE`, `name VARCHAR(100)`, `type VARCHAR(50)` (CHECK `type IN ('CRANE', 'BERTH')`), `status VARCHAR(50)`, `assigned_to VARCHAR(100)`, and audit timestamps.
   - *File:* `backend/supabase/schema.sql`
9. **Q: What is the purpose of the backwards-compatibility SQL view `resources`?**
   - *Simple Answer:* It redirects queries looking for `resources` to the new `equipment` table.
   - *Technical Answer:* `CREATE OR REPLACE VIEW resources AS SELECT * FROM equipment;` ensures backward compatibility for components designed against earlier draft specifications.
   - *File:* `backend/supabase/schema.sql`
10. **Q: How does the foreign key reference `assigned_to` maintain referential integrity?**
    - *Simple Answer:* It prevents assigning equipment to non-existent operations.
    - *Technical Answer:* When assigned to an active operation process ID, referential validation in the service layer guarantees equipment cannot be occupied by a non-existent PCB.
    - *File:* `backend/src/services/equipment.service.ts`

---

### Questions for MEMBER 5 — Scheduling Dashboard, Telemetry & Deadlock Detection

#### 🎨 Frontend (UI & Components)
1. **Q: What does the Scheduling Page display, and how does the algorithm switcher work?**
   - *Simple Answer:* It shows the active scheduling algorithm and allows operators to switch between FCFS, SJF, and Priority.
   - *Technical Answer:* `SchedulingPage.tsx` displays algorithm cards and an interactive select control. Changing the selection triggers `PUT /api/os/algorithm`, immediately updating the backend scheduler strategy and reflecting in UI badges.
   - *File:* `frontend/src/pages/SchedulingPage.tsx`
2. **Q: How are performance telemetry metrics calculated and rendered in `OperationMetricsCards.tsx`?**
   - *Simple Answer:* The cards calculate and display Average Waiting Time, Turnaround Time, and Throughput.
   - *Technical Answer:* `OperationMetricsCards.tsx` takes the list of completed operations, calculates $\frac{\sum W_t}{N}$ and $\frac{\sum T_t}{N}$, and renders them in KPI cards with trend indicators.
   - *File:* `frontend/src/features/operations/components/OperationMetricsCards.tsx`

#### 🛠️ Backend (APIs & Controllers)
3. **Q: What does the `GET /api/os/state` endpoint return to the client?**
   - *Simple Answer:* It returns the current state of queues, active locks, and the selected scheduling algorithm.
   - *Technical Answer:* `os.controller.ts` queries `PortSystem.getInstance()`, returning `{ readyQueue, waitingQueue, activeLocks, semaphorePermits, currentAlgorithm, deadlockStatus }`.
   - *File:* `backend/src/controllers/os.controller.ts`
4. **Q: How does `PortSystem.ts` act as a Singleton coordinator for the OS simulation?**
   - *Simple Answer:* It ensures only one OS kernel instance exists in memory across the entire backend.
   - *Technical Answer:* Implements the Singleton Pattern via `private static instance: PortSystem` and `public static getInstance()`. It binds `Scheduler`, `Mutex`, `Semaphore`, and `DeadlockDetector` together in a single shared runtime state.
   - *File:* `backend/src/os/PortSystem.ts`

#### 💻 Dedicated OS Feature (Deadlock Detection & Graph Theory)
5. **Q: What are the 4 Coffman conditions required for a deadlock to occur?**
   - *Simple Answer:* Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait.
   - *Technical Answer:*
     1. **Mutual Exclusion:** Resources cannot be shared simultaneously.
     2. **Hold and Wait:** A process holds one resource while requesting another.
     3. **No Preemption:** Resources cannot be forcibly taken from a process.
     4. **Circular Wait:** A closed chain of processes exists where each waits for a resource held by the next.
   - *File:* `backend/src/os/DeadlockDetector.ts`
6. **Q: How does `DeadlockDetector.ts` construct a Wait-For Graph (WFG)?**
   - *Simple Answer:* It creates a graph where arrows point from processes to the resources they are waiting for.
   - *Technical Answer:* In `DeadlockDetector.ts`, an adjacency list `Map<string, string[]>` is constructed. If Process $P_1$ holds Crane $R_1$ and is waiting for Berth $R_2$ held by Process $P_2$, a directed edge $P_1 \to P_2$ is recorded in the graph.
   - *File:* `backend/src/os/DeadlockDetector.ts`
7. **Q: Explain how the Depth-First Search (DFS) cycle detection algorithm works.**
   - *Simple Answer:* DFS explores each path; if it visits a node that is already on the current recursion stack, a cycle exists.
   - *Technical Answer:* It maintains two sets: `visited: Set<string>` and `recursionStack: Set<string>`. For each unvisited node, it performs DFS. If a neighbor is found in `recursionStack`, a back-edge exists, proving a directed cycle (deadlock).
   - *File:* `backend/src/os/DeadlockDetector.ts`

#### 🗄️ Dedicated DBMS Schema (OS Performance Telemetry)
8. **Q: How is OS execution telemetry persisted in the `operations` table?**
   - *Simple Answer:* Every operation records its arrival time, start time, end time, and waiting/turnaround milliseconds.
   - *Technical Answer:* `schema.sql` defines `start_time TIMESTAMPTZ`, `end_time TIMESTAMPTZ`, `waiting_time_ms INTEGER`, and `turnaround_time_ms INTEGER`, committed atomically upon process completion.
   - *File:* `backend/supabase/schema.sql`
9. **Q: What are the exact mathematical formulas for Waiting Time ($W_t$) and Turnaround Time ($T_t$)?**
   - *Simple Answer:* Turnaround Time = Completion Time - Arrival Time. Waiting Time = Turnaround Time - Burst Time.
   - *Technical Answer:*
     - Turnaround Time: $T_t = C_t - A_t$ (elapsed time from submission to termination).
     - Waiting Time: $W_t = T_t - B_t = S_t - A_t$ (total time spent waiting in the ready queue before CPU execution).
   - *File:* `backend/src/os/Process.ts`
10. **Q: Why are `waiting_time_ms` and `turnaround_time_ms` stored as integer milliseconds in PostgreSQL?**
    - *Simple Answer:* Milliseconds give high precision and integers are fast to sum and average.
    - *Technical Answer:* Storing durations as integer milliseconds avoids floating-point rounding errors and enables fast database aggregation queries like `SELECT AVG(waiting_time_ms), AVG(turnaround_time_ms) FROM operations`.
    - *File:* `backend/supabase/schema.sql`

---

### Questions for MEMBER 6 — Authentication, System Protection & Recycle Bin

#### 🎨 Frontend (UI & Components)
1. **Q: Explain how login and token storage work in `Login.tsx` and `AuthProvider.tsx`.**
   - *Simple Answer:* The operator logs in, receives a JWT token, stores it in localStorage, and AuthProvider shares it across the app.
   - *Technical Answer:* `handleLogin()` calls `api.auth.login()`. Upon success, the token is written to `localStorage.setItem('portflow_auth_token', token)` and dispatched to `AuthProvider` context, allowing `<ProtectedRoute>` to permit route access.
   - *File:* `frontend/src/pages/Login.tsx` / `frontend/src/auth/AuthProvider.tsx`
2. **Q: How does the 30-second expiring OTP modal work, and how is the countdown timer cleaned up?**
   - *Simple Answer:* A 30s timer counts down; when it reaches 0, the code expires. `clearInterval` is called when closing.
   - *Technical Answer:* A `setInterval` decrements `timer` state every 1000ms. In the `useEffect` cleanup return function, `clearInterval(intervalId)` is invoked to prevent memory leaks when the modal closes.
   - *File:* `frontend/src/pages/Login.tsx`

#### 🛠️ Backend (APIs & Controllers)
3. **Q: How does `middleware/auth.ts` verify incoming JWT tokens?**
   - *Simple Answer:* It reads the Bearer token from the header and checks it with our secret key.
   - *Technical Answer:* It extracts `req.headers.authorization`, verifies the `Bearer <token>` format, calls `jwt.verify(token, JWT_SECRET)`, and attaches the decoded user payload to `req.user`. If invalid or expired, it returns HTTP 401.
   - *File:* `backend/src/middleware/auth.ts`
4. **Q: How does `trash.repository.ts` aggregate soft-deleted records across all tables?**
   - *Simple Answer:* It queries all 4 tables in parallel using Promise.all looking for items where deleted_at is not null.
   - *Technical Answer:* It issues parallel Prisma queries via `Promise.all([prisma.ship.findMany(...), prisma.cargo.findMany(...), ...])` filtering `WHERE deleted_at IS NOT NULL`, normalizes them into a unified `TrashItem[]` DTO, and returns them to the UI.
   - *File:* `backend/src/repositories/trash.repository.ts`

#### 💻 Dedicated OS Feature (System Protection & Memory/Storage Reclaim)
5. **Q: How does PortFlow implement System Protection and access control privileges?**
   - *Simple Answer:* Passwords are encrypted with bcrypt, routes are protected by JWT tokens, and users have assigned roles.
   - *Technical Answer:* Implements the principle of least privilege: passwords use salted bcrypt hashing (10 rounds); API routes are guarded by JWT cryptographic verification; and Supabase Row Level Security (RLS) protects PostgreSQL tables at the engine level.
   - *File:* `backend/src/services/auth.service.ts`
6. **Q: How does the in-memory OTP cache implement memory reclamation?**
   - *Simple Answer:* OTPs are stored in a JavaScript Map with a timestamp and deleted after 30 seconds.
   - *Technical Answer:* `auth.service.ts` uses an in-memory `Map<string, { otp: string, expiresAt: number }>`. Verification checks `Date.now() > expiresAt`; expired entries are pruned via `map.delete()`, preventing unbounded memory growth.
   - *File:* `backend/src/services/auth.service.ts`
7. **Q: What is the difference between Soft Deletion (quarantine) and Hard Deletion (purge) in storage systems?**
   - *Simple Answer:* Soft delete marks a deleted timestamp so you can restore it; hard delete permanently removes the row.
   - *Technical Answer:* Soft deletion marks `deleted_at = NOW()`, preserving referential integrity and audit trails. Hard deletion (`DELETE FROM table`) permanently frees storage blocks; in PortFlow, hard purge is restricted to the "Empty Trash" operation.
   - *File:* `backend/src/repositories/trash.repository.ts`

#### 🗄️ Dedicated DBMS Table (`users` Table & 3NF Schema)
8. **Q: Explain the schema and columns of your dedicated `users` table.**
   - *Simple Answer:* Stores user ID, email, password hash, full name, role, and timestamps.
   - *Technical Answer:* `id UUID PRIMARY KEY`, `email VARCHAR(255) UNIQUE NOT NULL`, `password_hash VARCHAR(255) NOT NULL`, `full_name VARCHAR(100)`, `role VARCHAR(50) DEFAULT 'OPERATOR'`, and audit timestamps (`created_at`, `updated_at`, `deleted_at`).
   - *File:* `backend/supabase/schema.sql`
9. **Q: Why is the database designed in 3rd Normal Form (3NF)?**
   - *Simple Answer:* To avoid duplicate data and ensure every field depends only on its primary key.
   - *Technical Answer:*
     - 1NF: All column values are atomic; every table possesses a primary key.
     - 2NF: No partial functional dependencies on composite keys.
     - 3NF: No transitive functional dependencies (e.g., equipment details are in `equipment`, not duplicated inside `operations`).
   - *File:* `backend/supabase/schema.sql`
10. **Q: Explain how the PL/pgSQL trigger function `update_timestamp_column()` works.**
    - *Simple Answer:* Whenever any row is updated, the trigger automatically updates its updated_at column to the current time.
    - *Technical Answer:* A PostgreSQL trigger function `SET NEW.updated_at = NOW(); RETURN NEW;` is bound via `BEFORE UPDATE` triggers across all 5 tables, ensuring reliable audit timestamps without relying on manual application code.
    - *File:* `backend/supabase/schema.sql`

---

---

# PART 12 — 30 COMMON QUESTIONS EVERY MEMBER MUST KNOW

1. **What problem does PortFlow solve?** Optimizes port terminal congestion and crane/berth resource contention by applying OS CPU scheduling and synchronization algorithms.
2. **Explain the complete project in simple words.** A full-stack web terminal where dock operations are scheduled as computer processes and managed in a PostgreSQL database.
3. **What is the system architecture?** React 19 Frontend $\to$ Express 5 REST API $\to$ OS Simulation Kernel $\to$ Prisma ORM $\to$ Supabase PostgreSQL.
4. **What frontend technologies are used?** React 19, TypeScript, Vite, Tailwind CSS, Radix UI primitives, Lucide React icons.
5. **What backend technologies are used?** Node.js, Express 5, TypeScript, Prisma ORM, bcryptjs, jsonwebtoken, helmet, cors.
6. **What programming language is used across the project?** TypeScript across both frontend and backend for end-to-end type safety.
7. **Which operating system was used?** Developed on Windows using Node.js v22/PowerShell; fully OS-independent and deployed on Linux environments.
8. **Which DBMS is used?** PostgreSQL 14+ hosted on Supabase, accessed via Prisma ORM.
9. **Why PostgreSQL instead of MongoDB?** Port terminal logistics require strict relational integrity, 3NF normalization, and ACID transaction safety.
10. **What are the 5 core database tables?** `users`, `ships`, `cargo`, `equipment`, `operations`.
11. **What are the 2 database views?** `containers` (view on `cargo`) and `resources` (view on `equipment`) for backwards compatibility.
12. **How does data flow from user click to database?** Button click $\to$ Component Handler $\to$ API Facade (`api.ts`) $\to$ Express Route $\to$ Controller $\to$ Service $\to$ Repository $\to$ Prisma $\to$ PostgreSQL.
13. **How is authentication handled?** Passwords hashed with bcrypt; sessions authenticated via JWT tokens passed in HTTP Bearer headers.
14. **Where does validation happen?** Input syntax validated in Controllers; relational constraints and enumerations validated in PostgreSQL.
15. **How are errors handled?** Try/catch blocks in controllers returning structured JSON `{ success: false, message }` with appropriate HTTP status codes (400, 401, 404, 500).
16. **How do you start the project?** Backend: `npm run dev` in `backend/` (port 10000). Frontend: `npm run dev` in `frontend/` (port 5173).
17. **What dependencies are required?** Node.js v18+, npm v9+, internet access for Supabase PostgreSQL.
18. **Where is database configuration stored?** In `backend/.env` under `DATABASE_URL` and `DIRECT_URL`.
19. **Where are the backend routes defined?** In `backend/src/routes/api.ts`.
20. **Where are frontend components located?** In `frontend/src/pages/`, `frontend/src/features/`, and `frontend/src/components/ui/`.
21. **What is your role and contribution?** *(Each member recites their assigned role from Part 9).*
22. **What did your teammates contribute?** Frontend built UI, hooks, and forms; Backend built the OS kernel, Prisma repositories, and database schemas.
23. **Where was AI used?** As a limited coding assistant for regex patterns, CSS styling adjustments, and PostgreSQL trigger syntax.
24. **Why was AI use limited?** To guarantee that every member understands, tests, and owns 100% of their feature logic.
25. **How did you verify AI suggestions?** By manual code review, paper tracing of algorithms, and automated test execution (`npm test`).
26. **What happens if AI is removed?** The project runs completely identically because all code is committed locally in our repository.
27. **What is Soft Delete?** Records are flagged with `deleted_at = NOW()` instead of destructive deletion, preserving historical logs.
28. **What are the 4 CPU scheduling algorithms implemented?** First-Come First-Served (FCFS), Shortest Job First (SJF), Priority Scheduling, and Round Robin.
29. **What represents Mutexes and Semaphores in PortFlow?** Quay Cranes represent Mutexes (1:1 lock); Docking Berths represent Counting Semaphores (pooled permits).
30. **What is the goal for Phase 3?** Advanced analytics dashboards, system logging, and land-based truck/warehouse logistics.

---

# PART 13 — HOW TO RUN THE PROJECT

### Prerequisites
- Node.js version 18.0.0 or higher
- npm version 9.0.0 or higher
- Supabase PostgreSQL database URL

### 1. Database Setup
1. Open Supabase Dashboard $\to$ SQL Editor.
2. Open [backend/supabase/schema.sql](file:///c:/Users/LENOVO/Desktop/project%20folder/portflow/backend/supabase/schema.sql).
3. Paste and run the script. This creates all 5 tables, views, triggers, indexes, and seeds `operator@portflow.com`.

### 2. Backend Setup
In a terminal window:
```bash
cd backend
npm install
npx prisma generate
npm run dev
```
- Server starts on: `http://localhost:10000`
- Tests can be verified via: `npm test`
- Build verified via: `npm run build`

### 3. Frontend Setup
In a second terminal window:
```bash
cd frontend
npm install
npm run dev
```
- Client starts on: `http://localhost:5173`
- Build verified via: `npm run build`

### Default Evaluator Login Credentials
- **Email:** `operator@portflow.com`
- **Password:** `Password123!`

---

# PART 14 — FULL-STACK 6-MEMBER CODE REPOSITORY MAP

### File Ownership by Member (Frontend + Backend + OS + DBMS)
- **Member 1 (Operations & Scheduling):**
  - *Frontend:* `frontend/src/pages/OperationsPage.tsx`, `frontend/src/features/operations/components/OperationsTable.tsx`, `frontend/src/features/operations/hooks/useOperations.ts`
  - *Backend:* `backend/src/controllers/operations.controller.ts`, `backend/src/services/operations.service.ts`, `backend/src/repositories/operations.repository.ts`
  - *OS Concept:* `backend/src/os/Scheduler.ts` (FCFS & SJF Scheduling Algorithms)
  - *DBMS Table:* `operations` table in `schema.prisma` and `schema.sql`

- **Member 2 (Marine Vessels & PCB):**
  - *Frontend:* `frontend/src/pages/ShipsPage.tsx`, Vessel Registration Modal, Status Dropdowns
  - *Backend:* `backend/src/controllers/ships.controller.ts`, `backend/src/services/ships.service.ts`, `backend/src/repositories/ships.repository.ts`
  - *OS Concept:* `backend/src/os/Process.ts` (Process Control Block & 5-State Machine)
  - *DBMS Table:* `ships` table in `schema.prisma` and `schema.sql`

- **Member 3 (Cargo Logistics & Crane Mutex):**
  - *Frontend:* `frontend/src/pages/CargoPage.tsx`, Container Manifest Modal, TEU & Hazard filters
  - *Backend:* `backend/src/controllers/cargo.controller.ts`, `backend/src/services/cargo.service.ts`, `backend/src/repositories/cargo.repository.ts`
  - *OS Concept:* `backend/src/os/Mutex.ts` (Crane Mutual Exclusion & Promise Wait-Queue)
  - *DBMS Table:* `cargo` table & `containers` view in `schema.prisma` and `schema.sql`

- **Member 4 (Equipment & Counting Semaphores):**
  - *Frontend:* `frontend/src/pages/EquipmentPage.tsx`, Berths & Cranes Cards, Maintenance Dialogs
  - *Backend:* `backend/src/controllers/equipment.controller.ts`, `backend/src/services/equipment.service.ts`, `backend/src/repositories/equipment.repository.ts`
  - *OS Concept:* `backend/src/os/Semaphore.ts` (Berth Counting Semaphores & Resource Pooling)
  - *DBMS Table:* `equipment` table & `resources` view in `schema.prisma` and `schema.sql`

- **Member 5 (Scheduling Dashboard, Telemetry & Deadlock):**
  - *Frontend:* `frontend/src/pages/SchedulingPage.tsx`, `frontend/src/features/operations/components/OperationMetricsCards.tsx`, `frontend/src/App.tsx`
  - *Backend:* `backend/src/controllers/os.controller.ts`, `backend/src/os/PortSystem.ts`, `backend/src/index.ts`
  - *OS Concept:* `backend/src/os/DeadlockDetector.ts` (Wait-For Graph & DFS Cycle Detection)
  - *DBMS Table:* Telemetry columns in `operations` table ($W_t$, $T_t$, Burst time)

- **Member 6 (Authentication, System Protection & Trash):**
  - *Frontend:* `frontend/src/pages/Login.tsx`, 30s OTP Modal, `frontend/src/auth/AuthProvider.tsx`, `frontend/src/pages/TrashPage.tsx`
  - *Backend:* `backend/src/controllers/auth.controller.ts`, `backend/src/services/auth.service.ts`, `backend/src/repositories/trash.repository.ts`, `backend/src/middleware/auth.ts`
  - *OS Concept:* System Protection (JWT, bcrypt) & 2-Phase Storage Reclaim (Soft-delete vs Hard-purge)
  - *DBMS Table:* `users` table & universal `deleted_at` audit pattern across all tables

### 5 Critical Files Every Member Must Recognize
1. `backend/src/routes/api.ts` — Master routing file for all backend endpoints.
2. `backend/prisma/schema.prisma` — Relational schema definition for Prisma ORM.
3. `backend/src/config/prisma.ts` — Database connection singleton pool.
4. `frontend/src/App.tsx` — Main application component and view manager.
5. `README.md` — Complete project overview, architecture, and academic viva notes.

---

# PART 15 — 40% PBL COMPLETION EVALUATION

### ✅ Completed Deliverables (Exceeds 40% Target)
- Full JWT authentication with 30s OTP recovery.
- Complete CRUD across all 4 primary resources (`ships`, `cargo`, `equipment`, `operations`).
- Working OS simulation kernel (FCFS, SJF, Priority, Mutexes, Semaphores, Deadlock detection).
- Full relational database (PostgreSQL on Supabase) with 3NF normalization.
- Soft-delete pattern with two-phase recovery across all entities.
- Unit testing with Jest (`PortSystem.test.ts`) passing with 100% success.
- Production TypeScript compilation (`tsc --noEmit`) passing with 0 errors across frontend and backend.

### ⚠️ Partially Completed / In Progress
- Process execution is currently stepped on demand via `/api/operations/dispatch` rather than continuous background cron-ticks (sufficient for Phase 2 demonstration).
- Issue reporting currently logs to server console instead of a dedicated `issues` table.

### ❌ Not Implemented (Scoped for Future Phases)
- Advanced modules: Trucks, Warehouses, Automated Invoicing, Customs clearance.
- Live telemetry streaming over WebSockets.

### 🎯 Highest Priority Before Phase 2 Evaluation
1. Run `npm test` in `backend/` to demonstrate passing unit tests.
2. Log in using `operator@portflow.com` / `Password123!`.
3. Demonstrate changing CPU scheduling algorithm from FCFS to SJF on the Scheduling Page.
4. Demonstrate creating an operation and observing waiting/turnaround metrics change.
5. Soft-delete a ship, show it in the Trash Page, and perform a 1-click restore.

---

# PART 16 — FINAL 1-PAGE SUMMARY CHEAT SHEET

### 📋 Full-Stack 6-Member Master Matrix
| Member | Feature Domain | Frontend Files | Backend Files | Dedicated OS Feature | Dedicated DBMS Table | One-Line Viva Answer |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- |
| **M1** | Operations & CPU Scheduling | `OperationsPage.tsx`<br>`useOperations.ts`<br>`OperationsTable.tsx` | `operations.controller.ts`<br>`operations.service.ts`<br>`operations.repository.ts` | **FCFS & SJF Scheduling**<br>(`Scheduler.ts`) | **`operations`**<br>(State, $W_t$, $T_t$, Priority) | *"I built the Operations UI and API, implemented FCFS/SJF CPU scheduling, and managed the `operations` PCB table."* |
| **M2** | Vessels & PCB Lifecycle | `ShipsPage.tsx`<br>Vessel Register Modal<br>`table.tsx` | `ships.controller.ts`<br>`ships.service.ts`<br>`ships.repository.ts` | **Process Control Block (PCB)**<br>(`Process.ts` 5-state machine) | **`ships`**<br>(IMO validation, Capacity, Berths) | *"I built the Vessels schedule UI and API, implemented the OS Process Control Block lifecycle, and designed the `ships` table."* |
| **M3** | Cargo Logistics & Crane Mutex | `CargoPage.tsx`<br>Container Form Modal<br>TEU & Hazard Badges | `cargo.controller.ts`<br>`cargo.service.ts`<br>`cargo.repository.ts` | **Mutual Exclusion (Mutex)**<br>(`Mutex.ts` crane locks) | **`cargo`**<br>(Containers, Weights, Yard zones) | *"I built the Cargo manifests UI and API, implemented Quay Crane Mutex locking with Promise wait-queues, and managed the `cargo` table."* |
| **M4** | Equipment & Semaphores | `EquipmentPage.tsx`<br>Berth/Crane Status Cards<br>Maintenance Dialog | `equipment.controller.ts`<br>`equipment.service.ts`<br>`equipment.repository.ts` | **Counting Semaphores**<br>(`Semaphore.ts` berth pool) | **`equipment`**<br>(Berths, Cranes, Occupancy) | *"I built the Equipment allocation UI and API, implemented Counting Semaphores for pooled berths, and managed the `equipment` table."* |
| **M5** | Telemetry & Deadlock Graph | `SchedulingPage.tsx`<br>`OperationMetricsCards.tsx`<br>`App.tsx` layout shell | `os.controller.ts`<br>`PortSystem.ts`<br>`index.ts` server entry | **Deadlock Detection**<br>(`DeadlockDetector.ts` WFG/DFS) | **Telemetry Schema**<br>(Waiting & Turnaround metrics) | *"I built the Scheduling dashboard and telemetry cards, implemented Deadlock Detection using Wait-For Graph DFS cycles, and tracked OS telemetry."* |
| **M6** | Security, Trash & 3NF Schema | `Login.tsx`<br>30s OTP Modal<br>`TrashPage.tsx`<br>`AuthProvider.tsx` | `auth.service.ts`<br>`trash.repository.ts`<br>`middleware/auth.ts`<br>`schema.sql` | **System Protection & Reclaim**<br>(JWT, bcrypt, 2-phase soft-delete) | **`users` & Audit**<br>(3NF Schema, Indexes, Triggers) | *"I built the Auth portal, 30s OTP, and Recycle Bin, implemented System Protection and soft-deletes, and engineered the 3NF PostgreSQL schema."* |

---

### ⚛️ Core React Topics Viva Checklist (Main & Important)
- **Functional Components & JSX:** Declarative UI modularity across all pages and widgets.
- **`useState` Hook:** Local state for modals, form inputs, filters, and the 30s OTP countdown.
- **`useEffect` Hook:** API data fetching on mount and timer interval cleanup on unmount.
- **Custom Hooks (MVVM):** `useOperations.ts` cleanly separates UI views from data/dispatch logic.
- **Context API (`AuthProvider`):** Global user session and JWT storage without prop drilling.
- **`useMemo` & `useCallback`:** Performance optimization for filtered lists and event handlers.
- **Controlled Components:** Form bindings with `value`, `onChange`, and `e.preventDefault()`.
- **Conditional Rendering:** Loading spinners, empty-state messages, and status badge colors.
- **Client Routing & Route Guards:** Protected route redirects for unauthenticated users.
- **Props & Component Composition:** Reusable UI primitives (`Button`, `Dialog`, `Card`, `Badge`).

---

### 🛠️ Core Backend & Node.js Topics Viva Checklist (Main & Important)
- **RESTful APIs:** Standard endpoints (`/api/*`), HTTP methods (`GET`, `POST`, `PUT`, `DELETE`), and standard status codes.
- **5-Tier Architecture:** Routes $\to$ Controllers $\to$ Services $\to$ Repositories $\to$ Prisma ORM.
- **Express Middleware:** `express.json()`, `cors`, `helmet`, rate limiting, and custom JWT auth guards.
- **JWT Authentication:** Stateless HMAC SHA-256 bearer tokens with 24-hour expiration.
- **Bcrypt Hashing:** 10 salt rounds for secure one-way password hashing.
- **Prisma ORM:** Type-safe database queries, foreign-key relations, and connection pooling.
- **Asynchronous I/O:** `async`/`await`, Promises, and `Promise.all` for parallel trash aggregation.
- **OS Synchronization:** Mutex locks (cranes) and Counting Semaphores (berths) in Node.js.
- **Design Patterns:** Singleton (`PortSystem`), Strategy (`Scheduler`), and Repository patterns.
- **In-Memory Caching:** Scheduling queues and JavaScript `Map` with 30s expiry for OTPs.
- **Defensive Validation:** Request payload checking, enum validation, and uniform `{ error: string }` responses.

---
*Document prepared directly from codebase inspection for PortFlow college PBL Phase 2 Evaluation.*
