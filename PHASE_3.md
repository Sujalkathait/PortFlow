# Phase 3: Full Working Project Deployed (50% Final Milestone)

This final phase brings the project to 100% total completion (10% Phase 1 + 40% Phase 2 + 50% Phase 3). 

At this stage, the system handles the advanced movement of **Containers, Cargo, Trucks, and Warehouses**. We also introduce the **Billing system, Customs clearance, and Deployment**.

This phase is where the **advanced** OS and DBMS concepts come into play, specifically **SJF Scheduling**, **Semaphores (Counting Locks)**, **Deadlock Detection**, and **Complex SQL JOINs**.

---

## Team Roles & Feature Breakdown

### Role 1: Frontend UI Developer (React.js)
**Goal:** Build the logistics, cargo tracking, and billing screens.
* **Feature 1:** Container & Cargo Tracking Dashboard (Show where every container is).
* **Feature 2:** Warehouse capacity visualizer (Show how full a warehouse is).
* **Feature 3:** Billing and Invoice screen for Admins.

### Role 2: Backend API Developer (Node.js)
**Goal:** Build the complex endpoints to handle cargo movement and billing.
* **Feature 1:** `/api/containers`, `/api/cargo`, and `/api/bills` endpoints.
* **Feature 2:** `/api/warehouses` and `/api/trucks` to move containers off the port.
* **Concepts:** Advanced **API Routing** and **Error Handling** (e.g., stopping a truck from taking a container that hasn't cleared customs yet).

### Role 3: Database Administrator (Supabase / PostgreSQL)
**Goal:** Set up the complex relationships and write advanced queries.
* **Feature 1:** Create the `containers`, `cargo`, `warehouses`, `trucks`, and `bills` tables.
* **Feature 2:** Link Cargo to Containers, and Containers to Ships using Foreign Keys.
* **DBMS Concepts Used Here:**
  * **Advanced Foreign Keys:** Ensuring Cargo cannot exist without a Container (Referential Integrity).
  * **JOIN Queries:** Writing SQL to say "Show me all Cargo inside Containers that came from Ship Alpha".
  * **Aggregate Functions (SUM/COUNT):** Calculating the total weight of cargo on a specific ship, or summing the total bills for the month.

### Role 4: OS Scheduling Engineer (Node.js OS Module)
**Goal:** Make the scheduling algorithm smarter and prevent deadlocks.
* **Feature 1:** Upgrade the scheduler from simple FCFS to **SJF (Shortest Job First)**.
* **Feature 2:** Build **Deadlock Detection** using Resource Allocation Graphs (RAG) to ensure jobs never get stuck in a circle waiting for each other.
* **OS Concepts Used Here:**
  * **SJF Scheduling:** Calculating which job takes the least time (e.g., unloading 5 containers vs unloading 100 containers) and putting the shortest job first.
  * **Deadlock Detection:** An advanced OS concept where the system actively scans for stuck processes.

### Role 5: OS Synchronization Engineer (Node.js OS Module)
**Goal:** Build counting locks for resources we have more than one of.
* **Feature 1:** Create a **Semaphore** class in Node.js.
* **Feature 2:** Apply the Semaphore to Warehouses. If a Warehouse has 10 loading docks, the Semaphore starts at 10. When 10 trucks arrive, the Semaphore hits 0, and the 11th truck must wait.
* **OS Concepts Used Here:**
  * **Counting Semaphores:** Unlike a Mutex (which is just 1 or 0), a Semaphore counts down from a set number.
  * **Process Blocking:** Making trucks wait in a specific queue if the warehouse semaphore is at 0.

### Role 6: Integration, Testing & Deployment Lead
**Goal:** Ensure the complex cargo movement doesn't break the database and deploy the project to the internet.
* **Feature 1:** End-to-End test of a container moving from a Ship -> Crane -> Warehouse -> Truck.
* **Feature 2:** Deploy the Frontend to Vercel/Netlify and the Backend to Render/Heroku.
* **DBMS/OS Concepts Used Here:**
  * **ACID Properties:** Ensuring that when a container moves, it is deleted from the Ship's inventory and added to the Warehouse's inventory in one single, unbreakable transaction. If the system crashes halfway, the container shouldn't disappear.
