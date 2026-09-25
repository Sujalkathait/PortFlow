# Phase 1: Complete Project Documentation

**Project Name**: PortFlow
**Tech Stack**: 
- **Frontend**: React.js 
- **Backend**: Node.js / Express (includes our custom OS Module)
- **Database (DBMS)**: Supabase PostgreSQL

---

## 1. Project Overview
PortFlow is a system built to manage everything that happens at a busy port. It keeps track of ships, containers, cargo, places to dock (berths), cranes, warehouses, trucks, customs inspections, and billing.

For this project, we split the logic into two main parts to show how **Operating System (OS)** and **Database (DBMS)** concepts work in real life. 
- The **Database part** uses Supabase PostgreSQL to store all the port data safely. 
- The **OS part** is built directly into our Node.js backend. It acts like a mini operating system that manages port resources—using concepts like CPU scheduling, semaphores, mutexes, and deadlock detection to handle port jobs efficiently.

---

## 2. Objectives
- Make port operations digital and automatic so ships and trucks can move faster.
- See exactly where containers and cargo are at all times.
- Show how OS concepts work by scheduling port resources (like cranes and berths).
- Show how Database concepts work by storing port data properly without repeating information.
- Make it easier for customs to inspect and clear containers.

---

## 3. Features
- **Ships & Berths**: Plan when ships arrive and assign them a place to dock.
- **Containers & Cargo**: Track where containers are and what's inside them.
- **Cranes & Trucks**: Keep an eye on what equipment is being used.
- **Warehouses**: See how much space is left in storage.
- **Customs**: Let customs officials clear or hold containers.
- **Billing**: Automatically create bills for using the port.
- **OS Dashboard**: Watch how the system schedules jobs and locks resources in real-time.
- **Deadlock Detection**: See if port jobs get stuck waiting for each other.

---

## 4. How It Works (Admin vs. User)

### Admin Flow (Port Authority / System Admin)
1. **Login**: Admins log in and see port stats from the database.
2. **Setup**: They add new ships, berths, cranes, warehouses, and trucks to the database.
3. **OS Monitor**: They can watch the system schedule jobs in real-time. They can see waiting times, resource locks, and deadlock warnings (handled by the OS Module).
4. **Billing & Customs**: They can check bills and override customs holds if needed.

### User Flow (Shipping Agent / Crane Operator / Customs Official)
1. **Login**: Users log in and see a dashboard meant just for their job.
2. **Start a Job**: 
   - A Shipping Agent asks the system to do something (like "Unload Ship Alpha at Berth 3 using Crane 2").
   - The React frontend sends this to the Node.js backend, which passes it to our OS Module.
3. **Scheduling (OS part)**:
   - The OS Module puts the job in a waiting line (Ready Queue).
   - It decides which job goes first using rules like FCFS (First-Come, First-Served) or SJF (Shortest Job First).
   - It uses a **Semaphore** to check if a berth is free, and a **Mutex** to lock the crane so no one else can use it at the same time.
   - If jobs get stuck waiting for each other, **Deadlock Detection** catches it.
4. **Doing the Job (DBMS part)**:
   - The Crane Operator updates the container status, which saves to the database.
   - The Customs Official logs their inspection, which also saves to the database.
5. **Finishing Up**:
   - The OS Module unlocks the crane and berth so others can use them.
   - The database updates the job to 'completed'.
   - A bill is automatically created and saved.

```mermaid
flowchart TD
    A[User Login] --> B{Role?}
    B -- Admin --> C[Admin Dashboard]
    B -- Agent --> D[Agent Dashboard]
    B -- Operator --> E[Operator Dashboard]
    B -- Customs --> F[Customs Dashboard]
    
    C --> G[Add Resources to Database]
    C --> H[Watch OS Queues & Deadlocks]
    
    D --> I[Create a Port Job]
    I --> J[OS Module: Waiting Line / Ready Queue]
    J --> K[OS Module: Decide Who Goes Next]
    K --> L[OS Module: Lock the Crane/Berth]
    L --> M[Do the Job]
    M --> N[Database: Update Records]
    N --> O[OS Module: Unlock Resources]
    O --> P[Database: Create Bill]
    
    E --> Q[Update Container Status in Database]
    F --> R[Log Customs Clearance in Database]
```

---

## 5. Modules
1. **User Module**: Handles logins and shows the right dashboard for each person.
2. **Marine Module**: Manages ships, berths, and scheduling.
3. **Terminal Module**: Manages cranes, containers, and moving cargo around.
4. **Logistics Module**: Manages warehouses, trucks, and storage.
5. **Customs Module**: Handles inspections and border clearances.
6. **Billing Module**: Creates and tracks invoices.
7. **OS Simulation Module** *(inside Node.js)*: Does the heavy lifting for scheduling jobs, locking resources, and checking for deadlocks.

---

## 6. System Architecture

```mermaid
graph TD
    subgraph Frontend
        React[React.js Website]
    end
    
    subgraph Backend
        API[Node.js API]
        OSModule[OS Simulation Module]
        API <--> OSModule
    end
    
    subgraph Database
        DB[(Supabase PostgreSQL)]
    end
    
    React <-->|Talks to API| API
    API <-->|Reads/Writes Data| DB
    OSModule -->|Checks if resources are free| DB
    OSModule -->|Locks resources| DB
```

---

## 7. OS & DBMS Usage Map

### 7.1 Operating System (OS) Concepts
We built a custom OS Simulation Module inside Node.js to handle these concepts.

| OS Concept                  | PortFlow Feature       | How We Use It in Simple Terms |
| --------------------------- | ---------------------- | ------------------------------------------------------------------- |
| **Process**                 | Port Jobs              | Every job (like unloading a ship) is treated as a process. |
| **CPU Scheduling**          | Job Scheduling         | Deciding which job goes first using FCFS, SJF, or Round Robin rules. |
| **Ready Queue**             | Waiting Line           | A line for jobs that are ready but waiting for their turn. |
| **Waiting Time**            | Time Spent Waiting     | How long a job sits in the waiting line before starting. |
| **Turnaround Time**         | Total Time Taken       | The total time from when the job was asked for until it finished. |
| **Process Synchronization** | Sharing Equipment      | Making sure two jobs don't mess up by trying to use the same crane. |
| **Semaphore**               | Berth Access           | A counter that controls access to resources we have more than one of. |
| **Mutex**                   | Crane Locks            | A lock that makes sure only one job can use a specific crane at a time. |
| **Critical Section**        | Giving Out Resources   | The exact moment we give a crane to a job, where no one else can interrupt. |
| **Deadlock**                | Stuck Jobs             | When jobs get stuck because they are waiting for equipment someone else has. |
| **Deadlock Detection**      | Stuck Job Alert        | The system checks if any jobs are stuck in a loop waiting for each other. |
| **Resource Allocation**     | Handing out Equipment  | Figuring out who gets to use the berths, cranes, and trucks safely. |
| **Multithreading**          | Doing Things at Once   | Handling multiple port jobs at the exact same time. |
| **IPC**                     | Talking Between Parts  | How the main website talks to our custom OS Module. |

#### OS Scheduling Flow
```mermaid
flowchart TD
    A[New Job Request] --> B[Create a Process]
    B --> C[Put in Waiting Line]
    C --> D{Pick a Rule}
    D --> |First-Come, First-Served| E1[FCFS]
    D --> |Shortest Job First| E2[SJF]
    D --> |Round Robin| E3[Take Turns]
    E1 --> F[Ask for Equipment]
    E2 --> F
    E3 --> F
    F --> G{Is Equipment Free?}
    G -- Yes --> H[Lock the Equipment]
    H --> I[Start the Job]
    I --> J[Finish the Job]
    J --> K[Unlock the Equipment]
    K --> L[Save Results to Database]
    G -- No --> N{Are we stuck forever? Deadlock?}
    N -- Yes --> O[Fix the Deadlock]
    N -- No --> P[Wait in line]
    P --> G
```

### 7.2 Database (DBMS) Concepts
We use **Supabase PostgreSQL** to store all our data so it's safe, organized, and easy to find.

| DBMS Concept              | PortFlow Feature      | How We Use It in Simple Terms |
| ------------------------- | --------------------- | ------------------------------------------------- |
| **Tables**                | Port Data             | Places to store data like users, ships, and cargo. |
| **Primary Key**           | Unique ID             | A unique number for every single record so we don't mix them up. |
| **Foreign Key**           | Links                 | A way to link a container to the specific ship it came from. |
| **Normalization**         | Clean Design          | Organizing the database so we don't repeat the same data over and over. |
| **Constraints**           | Data Rules            | Rules like "every cargo must have a weight" to keep data clean. |
| **SQL**                   | Data Management       | The language we use to read and write data. |
| **SELECT**                | Dashboard             | Fetching port information to show on the screen. |
| **INSERT**                | New Records           | Adding new ships, cargo, or jobs to the system. |
| **UPDATE**                | Status Changes        | Changing a container's status from 'on ship' to 'in warehouse'. |
| **DELETE**                | Removing Records      | Deleting old or cancelled records safely. |
| **JOIN**                  | Reports               | Combining ship data and bill data together to make a final report. |
| **Aggregate Functions**   | Analytics             | Doing math like COUNT or SUM to see total bills or total containers. |
| **Indexes**               | Fast Searching        | Adding shortcuts so we can search for a container number instantly. |
| **Transactions**          | Safe Saves            | Making sure a complex save either completely works or completely fails (no half-saves). |
| **ACID**                  | Data Reliability      | Making sure the database never loses data or gets confused. |
| **Views**                 | Simple Reports        | Creating easy-to-read summaries of complex data for the dashboard. |
| **Authentication**        | User Logins           | Handling secure sign-ups and logins (using Supabase Auth). |
| **Row-Level Security**    | Access Rules          | Making sure a normal user can't see admin-only data. |
| **Referential Integrity** | Keeping Links Safe    | Stopping someone from deleting a ship if it still has cargo attached to it. |

---

## 8. The Big Picture: How OS and DBMS Work Together

```text
                 React.js (Frontend / Website)
                    │
                    ▼
              Node.js (Backend API)
                    │
          ┌─────────┴──────────────┐
          │                        │
          ▼                        ▼
       Database Part             OS Part (inside Node.js)
          │                        │
 Supabase PostgreSQL         Decides who goes next
          │                  Locks and unlocks equipment
     Stores 12 Tables        Checks for stuck jobs
     Keeps data safe         Manages the waiting line
     Handles the math        Runs the processes
          │                        │
          └────────────┬───────────┘
                       ▼
                 PortFlow System
```

### In Simple Words
| Question | Database Answers | OS Module Answers |
| :--- | :--- | :--- |
| Which berth is free right now? | ✅ (Reads the table) | |
| Who is currently using Crane 2? | ✅ (Reads the table) | |
| Which job should we run next? | | ✅ (Uses Scheduling rules) |
| Can two jobs use the same berth? | | ✅ (Uses Locks to say NO) |
| Are jobs stuck waiting forever? | | ✅ (Detects Deadlocks) |
| What is the total bill? | ✅ (Does the math) | |
| How long did the job wait? | | ✅ (Calculates waiting time) |

---

## 9. Our 12 Database Tables

| #  | Table         | Main Purpose |
| -- | ------------- | --- |
| 1  | `users`       | Stores user accounts and their roles. |
| 2  | `ships`       | Stores details about the ships. |
| 3  | `berths`      | Stores the locations where ships can dock. |
| 4  | `cranes`      | Stores the equipment used to move things. |
| 5  | `warehouses`  | Stores the places where cargo is kept. |
| 6  | `trucks`      | Stores the trucks used to drive cargo away. |
| 7  | `operations`  | The main hub! Connects a user, ship, berth, and crane to a specific job. |
| 8  | `containers`  | Stores the big shipping containers. |
| 9  | `cargo`       | Stores the actual goods inside the containers. |
| 10 | `inspections` | Stores safety and quality checks. |
| 11 | `customs`     | Stores border clearance records. |
| 12 | `bills`       | Stores the final invoices for the work done. |

---

## 10. How the Tables are Connected

Here is a simple list of how our 12 tables talk to each other. Almost everything connects back to the `operations` table.

| # | Parent Table | Child Table | How they connect (1 to Many) |
| :-- | :--- | :--- | :--- |
| 1 | `users` | `operations` | One user can start many operations. |
| 2 | `users` | `inspections` | One inspector can do many inspections. |
| 3 | `users` | `customs` | One officer can clear many customs forms. |
| 4 | `ships` | `operations` | One ship can have many operations done on it. |
| 5 | `berths` | `operations` | One berth can host many operations over time. |
| 6 | `cranes` | `operations` | One crane can be used in many operations. |
| 7 | `trucks` | `operations` | One truck can be assigned to many operations. |
| 8 | `warehouses` | `operations` | One warehouse can be used by many operations. |
| 9 | `operations` | `containers` | One operation can move many containers. |
| 10 | `operations` | `bills` | One operation creates the final bills. |
| 11 | `containers` | `cargo` | One container can hold many items of cargo. |
| 12 | `containers` | `inspections` | One container can be inspected many times. |
| 13 | `containers` | `customs` | One container needs customs clearance. |

---

## 11. Database Diagram (ER Diagram)
```mermaid
erDiagram
    USERS ||--o{ OPERATIONS : "1:M initiates"
    USERS ||--o{ INSPECTIONS : "1:M conducts"
    USERS ||--o{ CUSTOMS : "1:M processes"
    SHIPS ||--o{ OPERATIONS : "1:M involved in"
    BERTHS ||--o{ OPERATIONS : "1:M allocated to"
    CRANES ||--o{ OPERATIONS : "1:M assigned to"
    TRUCKS ||--o{ OPERATIONS : "1:M assigned to"
    WAREHOUSES ||--o{ OPERATIONS : "1:M stores at"
    OPERATIONS ||--o{ CONTAINERS : "1:M handles"
    OPERATIONS ||--o{ BILLS : "1:M generates"
    CONTAINERS ||--o{ CARGO : "1:M contains"
    CONTAINERS ||--o{ INSPECTIONS : "1:M undergoes"
    CONTAINERS ||--o{ CUSTOMS : "1:M requires"

    USERS {
        int id PK
        string username UK
        string password_hash
        string full_name
        string role
        timestamp created_at
    }
    SHIPS {
        int id PK
        string imo_number UK
        string name
        string vessel_type
        int capacity_teu
    }
    BERTHS {
        int id PK
        string name UK
        string location
        boolean is_available
        int max_vessel_length
    }
    CRANES {
        int id PK
        string identifier UK
        string crane_type
        boolean is_available
        int capacity_tons
    }
    WAREHOUSES {
        int id PK
        string zone_name UK
        int capacity_teu
        int current_usage
    }
    TRUCKS {
        int id PK
        string license_plate UK
        string company_name
        boolean is_available
    }
    OPERATIONS {
        int id PK
        int user_id FK
        int ship_id FK
        int berth_id FK
        int crane_id FK
        int truck_id FK
        int warehouse_id FK
        string operation_type
        string status
        datetime start_time
        datetime end_time
    }
    CONTAINERS {
        int id PK
        int operation_id FK
        string container_number UK
        string size_type
        string current_location
    }
    CARGO {
        int id PK
        int container_id FK
        string description
        float weight_tons
        string hazard_class
    }
    INSPECTIONS {
        int id PK
        int container_id FK
        int inspector_id FK
        string inspection_type
        string status
        string remarks
        datetime inspected_at
    }
    CUSTOMS {
        int id PK
        int container_id FK
        int officer_id FK
        string clearance_status
        string declaration_ref
        datetime cleared_at
    }
    BILLS {
        int id PK
        int operation_id FK
        decimal dockage_fee
        decimal handling_fee
        decimal storage_fee
        decimal total_amount
        string payment_status
        date issue_date
    }
```

---

## 12. Code Blueprint (UML Class Diagram)

```mermaid
classDiagram
    class User {
        +Int id
        +String username
        +String role
        +login()
        +logout()
    }
    class Ship {
        +Int id
        +String imoNumber
        +String name
        +String vesselType
    }
    class Berth {
        +Int id
        +String name
        +Boolean isAvailable
        +allocate()
        +release()
    }
    class Crane {
        +Int id
        +Boolean isAvailable
        +assignToOperation()
        +release()
    }
    class Warehouse {
        +Int id
        +String zoneName
        +Int capacityTeu
        +checkCapacity()
    }
    class Truck {
        +Int id
        +String licensePlate
        +Boolean isAvailable
        +dispatch()
    }
    class Operation {
        +Int id
        +String operationType
        +String status
        +createJob()
        +completeJob()
    }
    class Container {
        +Int id
        +String containerNumber
        +String currentLocation
        +trackLocation()
    }
    class Cargo {
        +Int id
        +String description
        +Float weightTons
    }
    class Inspection {
        +Int id
        +String status
        +String remarks
        +approve()
        +reject()
    }
    class Customs {
        +Int id
        +String clearanceStatus
        +approve()
        +hold()
    }
    class Bill {
        +Int id
        +Decimal totalAmount
        +String paymentStatus
        +generate()
        +markPaid()
    }
    class OSScheduler {
        +Queue readyQueue
        +schedule(algorithm)
        +getWaitingTime()
        +getTurnaroundTime()
    }
    class OSSynchronizer {
        +Map semaphores
        +Map mutexes
        +acquireLock(resourceId)
        +releaseLock(resourceId)
        +detectDeadlock()
    }

    User "1" -- "*" Operation : initiates
    Ship "1" -- "*" Operation : involves
    Berth "1" -- "*" Operation : allocated to
    Crane "1" -- "*" Operation : assigned to
    Warehouse "1" -- "*" Operation : stores at
    Truck "1" -- "*" Operation : assigned to
    Operation "1" -- "*" Container : handles
    Operation "1" -- "*" Bill : generates
    Container "1" -- "*" Cargo : contains
    Container "1" -- "*" Inspection : undergoes
    Container "1" -- "*" Customs : requires
    User "1" -- "*" Inspection : conducts
    User "1" -- "*" Customs : processes
    Operation ..> OSScheduler : depends on
    Operation ..> OSSynchronizer : depends on
```

---

## 13. Step-by-Step Example: Docking a Ship
This shows exactly what happens behind the scenes when a user asks to dock a ship.

```mermaid
sequenceDiagram
    actor Agent as Shipping Agent
    participant UI as React Website
    participant API as Node.js Backend
    participant OS as OS Module
    participant DB as Database

    Agent->>UI: Request "Dock Ship Alpha at Berth 3"
    UI->>API: Send Request
    API->>DB: Is Berth 3 free?
    DB-->>API: Yes, it is free!
    API->>OS: Start a new job using Berth 3 and Crane 2
    OS->>OS: Add to Waiting Line
    OS->>OS: Decide it's time to start (Scheduling)
    OS->>OS: Lock Berth 3 (Semaphore)
    OS->>OS: Lock Crane 2 (Mutex)
    OS-->>API: Equipment Locked Successfully
    API->>DB: Save the new job
    DB-->>API: Job saved as ID #101
    API->>DB: Mark Berth 3 and Crane 2 as "Busy"
    API-->>UI: Show "Job Started" to the User
    
    Note over OS: Once the job finishes...
    OS->>OS: Unlock Berth 3
    OS->>OS: Unlock Crane 2
    OS-->>API: Job Complete!
    API->>DB: Mark Job #101 as "Completed"
    API->>DB: Mark Berth 3 and Crane 2 as "Free"
    API->>DB: Create the final Bill
    API-->>UI: Show "Job Complete + Bill Ready"
```

---

## 14. Big Picture Data Flow
```mermaid
graph LR
    subgraph Users
        Admin[Port Admin]
        Agent[Shipping Agent]
        Customs_Officer[Customs Official]
        Truck_Driver[Truck Operator]
    end

    subgraph Backend
        API[Node.js API]
        OS_Mod[OS Module]
    end

    subgraph Database
        DB[(12 Tables)]
    end

    Agent -->|1. Request a Job| API
    Customs_Officer -->|2. Update Clearance| API
    Truck_Driver -->|3. Request Pickup| API
    Admin -->|4. Manage Port| API
    API -->|5. Save Data| DB
    API <-->|6. Ask for Locks & Schedules| OS_Mod
    OS_Mod -->|7. Lock Equipment| DB
    DB -->|8. Send Data Back| API
    API -->|9. Show Data| Admin
    API -->|10. Show Status| Agent
```

---

## 15. The Container's Journey
```mermaid
flowchart TD
    A[Ship Arrives] --> B[Admin Assigns Berth & Locks it]
    B --> C[Crane is Assigned & Locked]
    C --> D[Crane Unloads Containers & Saves to DB]
    D --> E{Customs Status?}
    E -- Pending --> F[Move to Inspection Area]
    F --> G[Customs Officer Inspects]
    G -- Cleared --> H
    G -- Held --> I[Keep in Security Zone]
    E -- Pre-Cleared --> H[Move to Warehouse]
    H --> J[Truck is Assigned & Locked]
    J --> K[Load onto Truck & Save to DB]
    K --> L[Truck Leaves Port]
    L --> M[Unlock All Equipment]
    M --> N[Create Final Bill]
    N --> O[Done!]
```

---

## 16. Academic Summary (For Grading)

### Database (DBMS) Concepts Shown
- **ER Model**: Built using exactly 12 Tables with Primary and Foreign Keys.
- **Normalization**: Data is split into logical tables (like putting ships in one place and cargo in another) to avoid repeating data.
- **SQL**: Used to read, create, update, and delete all records.
- **Transactions**: Making sure multi-step jobs (like saving a job AND locking a crane) either all succeed or all fail safely.
- **Indexes**: Used to make searching for container numbers fast.
- **Aggregate Functions**: Doing math to calculate total bills and container counts.
- **Referential Integrity**: Rules that stop you from deleting a ship if it still has active jobs tied to it.

### Operating System (OS) Concepts Shown
- **Process**: Every port job is treated like a computer process.
- **CPU Scheduling**: We built FCFS (First Come First Serve), SJF (Shortest Job First), and Round Robin rules to decide which job goes next.
- **Ready Queue**: A waiting line for jobs.
- **Semaphore & Mutex**: Locks used to stop two jobs from using the same crane or berth at the same time.
- **Critical Section**: The exact moment we give a crane to a job safely.
- **Deadlock Detection**: We actively check if jobs are stuck waiting for each other in an endless loop.
- **Waiting & Turnaround Time**: We calculate exactly how long jobs had to wait in line.

---

## 17. Our API Endpoints (The URLs we use)
| URL | What it does | Who handles it |
| :--- | :--- | :--- |
| `/api/auth/login` | Logs a user in | Database |
| `/api/auth/register` | Signs a new user up | Database |
| `/api/ships` | Shows or adds ships | Database |
| `/api/berths` | Shows which berths are free | Database |
| `/api/cranes` | Shows which cranes are free | Database |
| `/api/warehouses` | Shows warehouse space | Database |
| `/api/trucks` | Shows or adds trucks | Database |
| `/api/operations` | Starts a new job! | OS + Database |
| `/api/operations/:id` | Checks if a job is done | OS + Database |
| `/api/containers` | Shows or adds containers | Database |
| `/api/cargo` | Shows or adds cargo | Database |
| `/api/inspections` | Updates safety checks | Database |
| `/api/customs` | Updates customs clearance | Database |
| `/api/bills` | Gets the final invoices | Database |
| `/api/os/queue` | Admin: Shows the waiting line | OS |
| `/api/os/schedule` | Admin: Shows scheduling times | OS |
| `/api/os/deadlocks` | Admin: Checks for stuck jobs | OS |
| `/api/os/resources` | Admin: Shows what is locked | OS |

