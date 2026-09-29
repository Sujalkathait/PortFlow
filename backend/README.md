<div align="center">
  <img src="../frontend/public/image/favicon.png" alt="PortFlow Logo" width="100" />

# PortFlow Backend (Node.js + Express + TypeScript)
</div>

This is the central API and Custom Operating System Kernel for PortFlow.
It operates at the **40% project milestone (Phase 2 completed)**, meaning the backend fully supports both Admin and Operator clients.

## Core Architecture (Both Sides)

### 1. Admin Capabilities
The backend exposes powerful APIs for the Admin side:
- **Operations Management**: Full CRUD for port operations and dispatching tasks to the OS engine.
- **Ships & Cargo**: Endpoints to manage ships and track cargo flow.
- **Berths & Cranes**: APIs to manage available equipment and lock resources.
- **Scheduling Kernel**: The backend runs the OS Simulator, processing FCFS, SJF, and Priority queues.
- **Reports**: Exposes database analytics (join queries, aggregations) and raw system logs.

### 2. Operator Capabilities
- **My Operations**: Endpoints tailored for row-level security (RLS) allowing operators to update the status of their assigned tasks.
- **Cargo Tracking**: Real-time status updates from the ground up to the database.

## Technologies Used
- Node.js & Express.js
- TypeScript
- Prisma ORM
- PostgreSQL (Supabase)
- Custom OS Kernel (Deadlock detection, Mutex, Semaphores)

## Setup
Run `npm install` and `npx prisma db push` to initialize the database schema, then `npm run dev` to start the server.
