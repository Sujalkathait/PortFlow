# Phase 2: The Next 40% (Moving Cargo & Advanced OS/DBMS)

This phase takes the project from 40% to 80% complete. In Phase 1, we set up the foundation (Ships, Berths, Cranes). In Phase 2, we introduce **Containers, Cargo, Trucks, and Warehouses**. 

This phase is where the **advanced** OS and DBMS concepts come into play, specifically **SJF Scheduling**, **Semaphores (Counting Locks)**, and **Complex SQL JOINs**.

---

## Team Roles & Feature Breakdown

### Role 1: Frontend UI Developer (React.js)
**Goal:** Build the logistics and cargo tracking screens.
* **Feature 1:** Container & Cargo Tracking Dashboard (Show where every container is).
* **Feature 2:** Warehouse capacity visualizer (Show how full a warehouse is).
* **Feature 3:** Truck Dispatch Screen (Assign trucks to containers).
* **Concepts:** Advanced React state management, rendering charts/bars for warehouse capacity.

### Role 2: Backend API Developer (Node.js)
**Goal:** Build the complex endpoints to handle cargo movement.
* **Feature 1:** `/api/containers` and `/api/cargo` endpoints to track items.
* **Feature 2:** `/api/warehouses` and `/api/trucks` to move containers off the port.
* **Concepts:** Advanced **API Routing** and **Error Handling** (e.g., stopping a truck from taking a container that hasn't cleared customs yet).

### Role 3: Database Administrator (Supabase / PostgreSQL)
**Goal:** Set up the complex relationships and write advanced queries.
* **Feature 1:** Create the `containers`, `cargo`, `warehouses`, and `trucks` tables.
* **Feature 2:** Link Cargo to Containers, and Containers to Ships using Foreign Keys.
* **DBMS Concepts Used Here:**
  * **Advanced Foreign Keys:** Ensuring Cargo cannot exist without a Container (Referential Integrity).
  * **JOIN Queries:** Writing SQL to say "Show me all Cargo inside Containers that came from Ship Alpha".
  * **Aggregate Functions (SUM/COUNT):** Calculating the total weight of cargo on a specific ship, or counting how many containers are in Warehouse 1.

### Role 4: OS Scheduling Engineer (Node.js OS Module)
**Goal:** Make the scheduling algorithm smarter.
* **Feature 1:** Upgrade the scheduler from simple FCFS to **SJF (Shortest Job First)**.
* **OS Concepts Used Here:**
  * **SJF Scheduling:** If there are 3 jobs waiting, the OS module must calculate which job takes the least time (e.g., unloading 5 containers vs unloading 100 containers) and put the shortest job at the front of the queue.
  * **Turnaround Time Calculation:** Calculating the total time a job took from start to finish to prove SJF is faster than FCFS.

### Role 5: OS Synchronization Engineer (Node.js OS Module)
**Goal:** Build counting locks for resources we have more than one of.
* **Feature 1:** Create a **Semaphore** class in Node.js.
* **Feature 2:** Apply the Semaphore to Warehouses. If a Warehouse has 10 loading docks, the Semaphore starts at 10. When 10 trucks arrive, the Semaphore hits 0, and the 11th truck must wait.
* **OS Concepts Used Here:**
  * **Counting Semaphores:** Unlike a Mutex (which is just 1 or 0), a Semaphore counts down from a set number.
  * **Process Blocking:** Making trucks wait in a specific queue if the warehouse semaphore is at 0.

### Role 6: Integration & Testing Lead
**Goal:** Ensure the complex cargo movement doesn't break the database.
* **Feature 1:** End-to-End test of a container moving from a Ship -> Crane -> Warehouse -> Truck.
* **DBMS/OS Concepts Used Here:**
  * **ACID Properties:** Ensuring that when a container moves, it is deleted from the Ship's inventory and added to the Warehouse's inventory in one single, unbreakable transaction. If the system crashes halfway, the container shouldn't disappear.

---

## Phase 2 Milestone Goal
By the end of Phase 2, your system will be able to actively offload containers from a ship using **Shortest Job First** scheduling, store them in a warehouse using **Semaphores**, and track all the cargo weights using **SQL JOINs and Aggregates**.

*(Phase 3 will cover the final 20%: Customs Clearance, Billing, and Deadlock Detection!)*
