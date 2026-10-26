# ⚓ PortFlow Frontend — Terminal Operations Portal

**A Modern, Responsive Single Page Application (SPA) Built with React 19, TypeScript, Vite, & Tailwind CSS**

---

## 🌊 Overview (Simple English)

The **PortFlow Frontend** is the command center used by Terminal Operators to oversee all port activity. It connects to the PortFlow backend to display live vessel positions, crane statuses, container manifests, and CPU scheduling queues.

---

## 🛠️ Technology Stack

* **UI Framework:** [React 19](https://react.dev/) & [TypeScript](https://www.typescriptlang.org/)
* **Build Tooling:** [Vite](https://vitejs.dev/) (Instant Hot Module Replacement & production bundling)
* **Styling & Theme:** [Tailwind CSS v3](https://tailwindcss.com/) with dark mode support
* **UI Components:** [Radix UI Primitives](https://www.radix-ui.com/) & Lucide React Icons
* **Data Grids:** [TanStack Table v8](https://tanstack.com/table/v8) for high-performance sorting and pagination
* **Code Linter:** [Oxlint](https://oxc.rs/) for sub-second static analysis

---

## 📱 Page Overview & Features

| Page | Path | What You Can Do Here |
| :--- | :--- | :--- |
| **Dashboard** | `/operator/dashboard` | View high-level port KPIs: active operations, docked vessels, available equipment, and quick navigation. |
| **Operations** | `/operator/operations` | View all active loading/unloading jobs, schedule a new operation, and trigger the CPU dispatch button. |
| **Ships & Berths** | `/operator/ships` | Register arriving vessels, assign docking berths, and change vessel statuses (Arriving, Docked, Departed). |
| **Cargo Containers** | `/operator/cargos` | Track container manifests (20ft / 40ft), tare weight, warehouse assignments, and clearance statuses. |
| **Equipment & Cranes** | `/operator/equipments` | Manage STS Gantry Cranes and Berths. Toggle statuses between Available, Busy, and Maintenance. |
| **OS CPU Scheduler** | `/operator/scheduling` | Visual inspection of the OS ready queue. Toggle scheduling algorithms (**FCFS, SJF, Priority, Round Robin**) live in real-time. |
| **Analytics & Reports** | `/operator/reports` | Dual REST vs. GraphQL architecture comparison, live GraphQL interactive playground, and SQL JOIN benchmarks. |
| **System Logs** | `/operator/logs` | Real-time audit trail and kernel event logging (OS scheduler, deadlock detection, and auth events). |
| **Trash Bin** | `/operator/trash` | Safe Recycle Bin: View all soft-deleted records and restore them in 1-click or permanently delete them. |
| **Operator Profile** | `/operator/profile` | View operator account information, active session role, and security settings. |

---

## 🏗️ Folder Structure

```
src/
├── auth/               # AuthContext provider, session storage, and ProtectedRoute guards
├── components/
│   ├── ui/             # Atomic UI primitives (Buttons, Cards, Dialogs, Dropdowns, Tables)
│   ├── app-sidebar.tsx # Collapsible navigation sidebar
│   └── command-menu.tsx# Quick command launcher (Ctrl + K)
├── features/
│   └── operations/     # Operations domain slice (Custom hooks, modals, forms)
├── lib/
│   ├── api.ts          # Unified HTTP client supporting both REST and GraphQL queries
│   └── utils.ts        # Tailwind class merging utility (cn)
├── pages/              # Full page view components
├── App.tsx             # Client-side router, layout shell, and navigation title mapping
└── main.tsx            # React application mount entrypoint
```

---

## 🚀 Setup & Local Execution

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (`.env`)
Create a `.env` file in the `frontend/` folder:
```env
# URL pointing to your running backend API server
VITE_API_URL=http://localhost:10000/api
```
*(The frontend automatically supports both `VITE_API_URL` and `VITE_API_BASE_URL`.)*

### 3. Start Development Server
```bash
npm run dev
```
Open your browser at **`http://localhost:5173`**.

---

## 📜 Available NPM Scripts

* `npm run dev` — Starts the local Vite development server with hot-reloading.
* `npm run build` — Compiles TypeScript (`tsc -b`) and builds the optimized production bundle in `dist/`.
* `npm run lint` — Runs Oxlint across all TypeScript files.
* `npm run preview` — Locally previews the compiled production build.

---

## ☁️ Deployment on Vercel

The frontend is ready for immediate deployment on **Vercel**:
1. Connect your GitHub repository to Vercel.
2. Set **Root Directory** to `frontend`.
3. Add environment variable `VITE_API_URL` pointing to your deployed Render backend (e.g., `https://portflow-backend.onrender.com/api`).
4. Click **Deploy**. Vercel will build with Vite and apply [`vercel.json`](./vercel.json) to handle Single Page Application (SPA) routing automatically.
