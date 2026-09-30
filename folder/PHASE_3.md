# Phase 3: Full Working Project Deployed (50% Final Milestone)

This final phase brings the project to 100% total completion (10% Phase 1 + 40% Phase 2 + 50% Phase 3). 

At this stage, the system handles the advanced movement of **Containers, Cargo, Trucks, and Warehouses**. We also introduce the **Billing system, Customs clearance, and Deployment**.

This phase implements the most advanced Operating System and Database Management System concepts to make the system scalable and robust.


---

### 🧠 1. Phase 3 Operating System (OS) Features

Phase 3 introduces advanced concurrency, deadlock prevention, and multi-resource management:

| OS Concept | Real-World Port Feature | How It Works in Phase 3 |
| :--- | :--- | :--- |
| **Deadlock Detection** | Circular Wait Alert | Actively builds a **Resource Allocation Graph (RAG)** to detect when two jobs are stuck waiting for each other (e.g., Job A holds Crane 1 and needs Berth 2; Job B holds Berth 2 and needs Crane 1). |
| **Deadlock Recovery** | Stuck Job Resolution | Automatically aborts or preempts lower-priority operations to break circular dependencies and free equipment. |
| **Advanced CPU Scheduling** | Algorithm Switcher | Expands beyond FCFS to include **SJF (Shortest Job First)**, **Preemptive Priority**, and **Round Robin (Time-Slicing)** for fair resource distribution. |
| **Counting Semaphores** | Multi-Unit Resource Control | Manages resources with multiple units: available berths, truck fleet dispatching, and warehouse bay limits. |
| **Mutex Locks** | Exclusive Resource Locks | Strict binary locks on individual cranes, inspection bays, and fuel stations. |
| **Critical Section** | Atomic Resource Handoff | The precise instant when a crane or berth is handed over to a job, guaranteed to run without interruption or race conditions. |
| **Multithreading / Concurrency** | Parallel Port Operations | Simulates simultaneous, concurrent port workflows (unloading 3 ships at 3 different berths at the exact same time). |
| **IPC (Inter-Process Communication)** | Live Telemetry Stream | Uses WebSockets / SSE to stream live OS queue updates, crane lock states, and CPU utilization from backend to frontend. |

---

### 💾 2. Phase 3 Database (DBMS) Features

Phase 3 expands the database into an enterprise-grade, 12-table relational logistics engine:

| DBMS Concept | Real-World Port Feature | How It Works in Phase 3 |
| :--- | :--- | :--- |
| **Full 12-Table Schema** | Complete Port Ecosystem | Adds `warehouses`, `trucks`, `inspections`, `customs`, and `bills` alongside existing tables. |
| **Database Views** | Pre-Calculated Reports | Creates virtual views (`v_customs_clearance`, `v_port_billing_summary`, `v_berth_occupancy`) for instant executive reporting. |
| **Row-Level Security (RLS)** | Multi-Role Security | PostgreSQL security policies ensuring Shipping Agents only see their own cargo, while Customs Officials see inspection records. |
| **Referential Integrity** | Safe Foreign Key Rules | Enforces `ON DELETE RESTRICT` to prevent deleting a docked ship if cargo or active bills are still attached to it. |
| **ACID Multi-Step Transactions** | Automated Billing & Invoicing | Computes and saves multi-item bills (dockage fee + crane handling fee + warehouse storage fee) in a single atomic transaction. |
| **Composite & Partial Indexes** | High-Traffic Query Speed | Adds composite indexes on `(status, created_at)` and partial indexes on active records (`WHERE deleted_at IS NULL`). |
| **Audit Trails & Triggers** | Compliance & Logging | Automated database triggers that log every status transition (`On Ship` $\rightarrow$ `In Yard` $\rightarrow$ `Inspected` $\rightarrow$ `Dispatched`) to a persistent audit log. |

---

### 🚢 3. Business & Functional Features Delivered in Phase 3

* **Customs Clearance Portal**: Customs officers can inspect, approve, or hold suspicious containers.
* **Logistics & Warehousing**: Truck gate pass generation and warehouse zone allocation.
* **Automated Billing Engine**: Invoices generated automatically based on container weight, berth docking duration, and equipment usage.
* **Live WebSocket Dashboard**: Real-time visual updates of moving cranes, queue changes, and vessel departures without refreshing the page.
* **Production Cloud Deployment**: Production backend hosted on Render, frontend deployed on Vercel, and database hosted on Supabase PostgreSQL.