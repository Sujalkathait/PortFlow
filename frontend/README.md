# ⚓ PortFlow Frontend — Modern Terminal Operations Portal

The frontend for **PortFlow** is an enterprise-grade Single Page Application (SPA) built with **React 19, TypeScript, Vite, and Tailwind CSS**. It provides an interactive ground operations portal for Terminal Operators to manage marine traffic, supervise container logistics, control OS process scheduling, and inspect real-time port telemetry.

---

## 🛠️ Technology Stack

* **Core Framework:** [React 19](https://react.dev/) & [TypeScript](https://www.typescriptlang.org/)
* **Build Tooling:** [Vite](https://vitejs.dev/)
* **Styling & Design System:** [Tailwind CSS](https://tailwindcss.com/), Radix UI Primitives, `clsx`, and `class-variance-authority`
* **Data Grids:** [TanStack Table v8](https://tanstack.com/table/v8) for high-performance sorting, filtering, and pagination
* **Icons:** [Lucide React](https://lucide.dev/)
* **Code Quality & Linting:** [Oxlint](https://oxc.rs/docs/guide/usage/linter.html)

---

## 🏗️ Architecture & Folder Structure

The frontend is structured using feature-based modularity combined with clean presentational component separation:

```
src/
├── auth/                    # Session state provider, auth context, and protected route guards
├── components/
│   └── ui/                  # Reusable atomic design primitives (Button, Card, Dialog, Table, Tabs)
├── features/
│   └── operations/          # Operations feature slice (Custom Hook, Modals, Services)
├── lib/
│   ├── api.ts               # HTTP client facade with automatic JWT injection & error handling
│   └── utils.ts             # Tailwind class merging (cn) and formatting helpers
├── pages/                   # Full-page view containers
│   ├── CargoPage.tsx        # Container inventory, TEU weights, and yard location management
│   ├── DashboardPage.tsx    # High-level KPIs, berth occupancy, crane status, and alerts
│   ├── EquipmentPage.tsx    # Crane & Berth allocation, maintenance tracking, and lock states
│   ├── Login.tsx            # Operator authentication, demo 1-click login, OTP password reset
│   ├── LogsPage.tsx         # Real-time system audit logs and event telemetry
│   ├── OperationsPage.tsx   # Active port operations table, new job creation, and dispatch
│   ├── ProfilePage.tsx      # Operator profile details, session management, and account actions
│   ├── ReportIssuePage.tsx  # Ground equipment issue ticketing
│   ├── ReportsPage.tsx      # Turnaround analytics and aggregate operational metrics
│   ├── SchedulingPage.tsx   # OS Ready Queue visualizer & real-time scheduling algorithm switcher
│   └── TrashPage.tsx        # Recycle bin with 1-click restore across all deleted records
├── App.tsx                  # Client-side router, layout navigation, and navigation state
└── main.tsx                 # Application entrypoint
```

---

## 🚀 Setup & Installation

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (`.env`)
Create a `.env` file in the `frontend/` directory (matching `frontend/.env.example`):
```env
# Set to your backend API URL (defaults to http://localhost:10000/api in development)
VITE_API_BASE_URL=http://localhost:10000/api
```

### 3. Start Development Server
```bash
npm run dev
```
*The React SPA will launch on `http://localhost:5173`.*

---

## 📜 Available Scripts

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts Vite local development server with Hot Module Replacement (HMR). |
| `npm run build` | Runs TypeScript type checking (`tsc -b`) and generates production bundle via Vite. |
| `npm run lint` | Runs lightning-fast static code analysis across all `.tsx` and `.ts` files using Oxlint. |
| `npm run preview` | Serves the production build locally for pre-deployment verification. |

---

## 👥 Authentication & Roles

* **Role:** **Terminal Operator**
* **Capabilities:** Full operational privileges across vessels, berths, cranes, cargo containers, process dispatching, scheduling algorithm switching (FCFS / SJF / Priority / Round Robin), and soft-delete recovery via the unified Trash Bin.
* **Demo Credentials:** A one-click login button is available on the Login screen (`operator@portflow.com` / `Password123!`).
