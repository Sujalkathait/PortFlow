# Phase 3: Full Working Project Deployed (50% Final Milestone)

This final phase brings the project to 100% total completion (10% Phase 1 + 40% Phase 2 + 50% Phase 3). 

At this stage, the system handles the advanced movement of **Containers, Cargo, Trucks, and Warehouses**. We also introduce the **Billing system, Customs clearance, and Deployment**.

This phase implements the most advanced Operating System and Database Management System concepts to make the system scalable and robust.

---

## OS Concepts Used in Phase 3

Here is exactly how advanced Operating System concepts are implemented in this final deployed phase:

| OS Concept | PortFlow Feature | How it is used in Phase 3 |
| :--- | :--- | :--- |
| **Semaphore** | Berth Access | A counter that controls access to resources we have more than one of. |
| **Mutex** | Crane Locks | A lock that makes sure only one job can use a specific crane at a time. |
| **Critical Section** | Giving Out Resources | The exact moment we give a crane to a job, where no one else can interrupt. |
| **Deadlock** | Stuck Jobs | When jobs get stuck because they are waiting for equipment someone else has. |
| **Deadlock Detection**| Stuck Job Alert | The system checks if any jobs are stuck in a loop waiting for each other. |
| **Resource Allocation**| Handing out Equipment | Figuring out who gets to use the berths, cranes, and trucks safely. |
| **Multithreading** | Doing Things at Once | Handling multiple port jobs at the exact same time. |
| **IPC** | Talking Between Parts | How the main website talks to our custom OS Module. |

---

## DBMS Concepts Used in Phase 3

Here is exactly how advanced Database Management System concepts are implemented alongside the OS:

| DBMS Concept | PortFlow Feature | How it is used in Phase 3 |
| :--- | :--- | :--- |
| **Indexes** | Fast Searching | Adding shortcuts so we can search for a container number instantly. |
| **Transactions** | Safe Saves | Making sure a complex save either completely works or completely fails (no half-saves). |
| **ACID** | Data Reliability | Making sure the database never loses data or gets confused. |
| **Views** | Simple Reports | Creating easy-to-read summaries of complex data for the dashboard. |
| **Authentication** | User Logins | Handling secure sign-ups and logins (using Supabase Auth). |
| **Row-Level Security**| Access Rules | Making sure a normal user can't see admin-only data. |
| **Referential Integrity**| Keeping Links Safe | Stopping someone from deleting a ship if it still has cargo attached to it. |

---

## Team Roles (How the 6 members built this 50%)

1. **Frontend UI Developer:** Built the logistics, cargo tracking, and billing dashboard screens.
2. **Backend API Developer:** Built the advanced `/api/containers` and `/api/bills` endpoints using IPC.
3. **Database Administrator:** Handled **Row-Level Security, Views, Indexes, and Referential Integrity** for advanced data sets.
4. **OS Scheduling Engineer:** Built the **Deadlock Detection** and **Resource Allocation** algorithms.
5. **OS Synchronization Engineer:** Handled **Semaphores, Mutexes, and Critical Sections** for advanced warehouse logistics.
6. **Integration, Testing & Deployment Lead:** Ensured **ACID** properties held up during deployment and pushed the fully working project to the cloud.
