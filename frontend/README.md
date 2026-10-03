# PortFlow Frontend

The frontend is a modern web application built with **React, TypeScript, Vite, and Tailwind CSS**. It provides a unified dashboard for Terminal Operators.

## 🏗️ Folder Structure
- **`components/ui/`**: Reusable UI parts (buttons, modals).
- **`features/`**: Feature-specific logic (Hooks, Services).
- **`lib/api.ts`**: API client to talk to the Node.js backend.
- **`pages/`**: Full-page views:
  - `DashboardPage.tsx`
  - `CargoPage.tsx`
  - `ShipsPage.tsx`
  - `OperationsPage.tsx`
  - `EquipmentPage.tsx`
  - `SchedulingPage.tsx` (Shows the OS Ready Queue)
  - `LogsPage.tsx` & `ReportsPage.tsx`
  - `Login.tsx`

## 🚀 Setup Instructions
1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure `.env`:
   ```env
   VITE_API_URL="http://localhost:5000/api"
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```

## 👥 Roles
- **Terminal Operator**: Has full access to manage ships, cranes, view OS metrics, and update assigned operations.
