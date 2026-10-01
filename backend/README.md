# PortFlow Backend

The backend is built with **Node.js, Express, and Prisma ORM** against a **Supabase PostgreSQL** database. It handles API requests, database interactions, and runs our custom **OS Simulation Engine**.

## 🏗️ Architecture & Data Flow
We use a standard layered architecture for separation of concerns:
- **Routes (`/routes`)**: Defines API endpoints.
- **Controllers (`/controllers`)**: Handles HTTP requests, extracts parameters, and sends JSON responses.
- **Services (`/services`)**: Contains the core business logic (invoked by controllers).
- **Repositories (`/repositories`)**: Encapsulates all Prisma database queries.
- **OS Module (`/os`)**: Our custom simulation engine (Scheduler, Mutex, Semaphore, DeadlockDetector).

### Data Flow
`Frontend Request -> Router -> Controller -> Service <-> OS Engine (if Job) -> Repository -> Supabase DB`

## 🔌 API Endpoints
- **`/api/auth`**: Registration, Login, and Session validation.
- **`/api/operations`**: CRUD for Port Jobs, dispatching, and OS integration.
- **`/api/os`**: Getting current OS kernel state, queues, and changing scheduling algorithms.
- **`/api/ships`, `/api/cargos`, `/api/equipments`**: CRUD operations for entities.
- **`/api/system`, `/api/analytics`**: Application health, logs, and database metrics.

## 🗄️ Database Management (DBMS)
We use a highly normalized PostgreSQL schema managed via Prisma. The primary entities are:
- `User`, `Ship`, `Operation`, `Cargo`, `Equipment`

## ⚙️ The OS Engine
Located in `src/os/`, this engine treats port operations as "OS Processes".
- **Scheduling**: FCFS, SJF, and Priority algorithms determine which job leaves the Ready Queue first.
- **Synchronization**: Uses **Mutexes** for 1:1 resource locking (e.g., Cranes) and **Semaphores** for counted resources (e.g., Berths).
- **Deadlock Detection**: Continuously runs a Wait-For Graph (WFG) DFS cycle detection to alert Admins of blocked jobs.

## 🚀 Setup Instructions
1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure `.env`:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/portflow"
   JWT_SECRET="your_secret_key"
   PORT=5000
   ```
3. Run Prisma Migrations:
   ```bash
   npx prisma migrate dev
   ```
4. Start the server:
   ```bash
   npm run dev
   ```
