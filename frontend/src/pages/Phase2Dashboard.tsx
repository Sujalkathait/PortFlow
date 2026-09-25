import { useEffect, useState, type FormEvent } from 'react';
import {
  Anchor,
  Boxes,
  Ship,
  UserRound,
  RefreshCw,
  LogOut,
  Plus,
  Trash2,
  Play,
  CheckCircle2,
  Cpu,
  Lock,
  Unlock,
  Clock,
  ShieldCheck,
  X,
  Sliders
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth, type Role } from '../auth/AuthProvider';
import { supabase } from '../lib/supabase';
import './Phase2Dashboard.css';

export type Operation = {
  id: number;
  operation_type: string;
  ship_name: string;
  crane_id: string;
  berth_id: string;
  priority: number;
  status: 'Queued' | 'Running' | 'Completed' | 'Cancelled';
  start_time: string | null;
  end_time: string | null;
  waiting_time_ms?: number;
  turnaround_time_ms?: number;
  created_at: string;
};

type OSState = {
  readyQueue: Array<{ id: string; status: string; priority?: number; burstTime?: number; waitingTime: number }>;
  deadlockDetected: boolean;
  mutexes: Record<string, { isLocked: boolean; ownerId: string | null }>;
  semaphores: Record<string, { available: number }>;
};

const LOCAL_OPS_KEY = 'portflow_local_operations';
const API_URL = 'http://localhost:3000/api';

export function Phase2Dashboard({ role }: { role: Role }) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const [operations, setOperations] = useState<Operation[]>(() => {
    const saved = localStorage.getItem(LOCAL_OPS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [osState, setOsState] = useState<OSState>({
    readyQueue: [],
    deadlockDetected: false,
    mutexes: {
      'Crane A': { isLocked: false, ownerId: null },
      'Crane B': { isLocked: false, ownerId: null },
    },
    semaphores: {
      'Berth 1': { available: 1 },
      'Berth 2': { available: 1 },
    },
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editOperation, setEditOperation] = useState<Operation | null>(null);

  // Form states for creating a new Operation
  const [formType, setFormType] = useState('Container Discharge');
  const [formShip, setFormShip] = useState('MV Ocean Carrier');
  const [formCrane, setFormCrane] = useState('Crane A');
  const [formBerth, setFormBerth] = useState('Berth 1');
  const [formPriority, setFormPriority] = useState('1');
  const [formBurst, setFormBurst] = useState('4');

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  // Sync state to localStorage
  const saveOperations = (ops: Operation[]) => {
    setOperations(ops);
    localStorage.setItem(LOCAL_OPS_KEY, JSON.stringify(ops));
  };

  // Fetch operations and OS telemetry
  const load = async () => {
    setLoading(true);
    setError('');

    // If Supabase is connected, query Supabase
    if (supabase) {
      try {
        const { data, error: sbError } = await supabase
          .from('operations')
          .select('id, operation_type, status, start_time, end_time, created_at')
          .order('created_at', { ascending: false });

        if (sbError) throw sbError;
        if (data) {
          const mapped: Operation[] = data.map((d) => ({
            id: d.id,
            operation_type: d.operation_type,
            ship_name: 'Database Vessel',
            crane_id: 'Crane A',
            berth_id: 'Berth 1',
            priority: 1,
            status: d.status as any,
            start_time: d.start_time,
            end_time: d.end_time,
            created_at: d.created_at,
          }));
          saveOperations(mapped);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Supabase fetch error');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Try communicating with local Backend OS Engine
    try {
      const [opsRes, osRes] = await Promise.all([
        fetch(`${API_URL}/operations`).catch(() => null),
        fetch(`${API_URL}/os/state`).catch(() => null),
      ]);

      if (opsRes && opsRes.ok) {
        const data = await opsRes.json();
        saveOperations(data);
      }

      if (osRes && osRes.ok) {
        const state = await osRes.json();
        setOsState({
          readyQueue: state.readyQueue || [],
          deadlockDetected: Boolean(state.deadlockDetected),
          mutexes: state.mutexes || {
            'Crane A': { isLocked: false, ownerId: null },
            'Crane B': { isLocked: false, ownerId: null },
          },
          semaphores: state.semaphores || {
            'Berth 1': { available: 1 },
            'Berth 2': { available: 1 },
          },
        });
      } else {
        // Fallback local OS state simulation from operations
        deriveLocalOSState(operations);
      }
    } catch {
      deriveLocalOSState(operations);
    } finally {
      setLoading(false);
    }
  };

  const deriveLocalOSState = (ops: Operation[]) => {
    const queued = ops.filter((o) => o.status === 'Queued');
    const running = ops.filter((o) => o.status === 'Running');

    const craneAOwner = running.find((o) => o.crane_id === 'Crane A');
    const craneBOwner = running.find((o) => o.crane_id === 'Crane B');

    setOsState({
      readyQueue: queued.map((o) => ({
        id: `op-${o.id}`,
        status: 'READY',
        priority: o.priority,
        waitingTime: Date.now() - new Date(o.created_at).getTime(),
      })),
      deadlockDetected: false,
      mutexes: {
        'Crane A': { isLocked: Boolean(craneAOwner), ownerId: craneAOwner ? `OP-${craneAOwner.id}` : null },
        'Crane B': { isLocked: Boolean(craneBOwner), ownerId: craneBOwner ? `OP-${craneBOwner.id}` : null },
      },
      semaphores: {
        'Berth 1': { available: running.some((o) => o.berth_id === 'Berth 1') ? 0 : 1 },
        'Berth 2': { available: running.some((o) => o.berth_id === 'Berth 2') ? 0 : 1 },
      },
    });
  };

  useEffect(() => {
    void load();
    const interval = setInterval(() => {
      void load();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // CRUD 1: CREATE Operation
  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    const payload = {
      operationType: formType,
      shipName: formShip,
      craneId: formCrane,
      berthId: formBerth,
      priority: Number(formPriority),
      burstDuration: Number(formBurst) * 1000,
    };

    try {
      const res = await fetch(`${API_URL}/operations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const created = await res.json();
        const updated = [created, ...operations.filter((o) => o.id !== created.id)];
        saveOperations(updated);
        deriveLocalOSState(updated);
      } else {
        throw new Error('Backend failed');
      }
    } catch {
      // Local fallback creation
      const localId = Date.now() % 100000;
      const newOp: Operation = {
        id: localId,
        operation_type: formType,
        ship_name: formShip,
        crane_id: formCrane,
        berth_id: formBerth,
        priority: Number(formPriority),
        status: 'Queued',
        start_time: null,
        end_time: null,
        created_at: new Date().toISOString(),
      };
      const updated = [newOp, ...operations];
      saveOperations(updated);
      deriveLocalOSState(updated);
    }

    setShowCreateModal(false);
  };

  // CRUD 2: UPDATE Operation
  const handleUpdateStatus = async (id: number, nextStatus: Operation['status']) => {
    const target = operations.find((o) => o.id === id);
    if (!target) return;

    const updates: Partial<Operation> = {
      status: nextStatus,
      start_time: nextStatus === 'Running' ? new Date().toISOString() : target.start_time,
      end_time: nextStatus === 'Completed' || nextStatus === 'Cancelled' ? new Date().toISOString() : target.end_time,
    };

    if (nextStatus === 'Completed' && target.start_time) {
      updates.turnaround_time_ms = Date.now() - new Date(target.created_at).getTime();
    }

    try {
      await fetch(`${API_URL}/operations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch {
      // ignore network error
    }

    const updated = operations.map((o) => (o.id === id ? { ...o, ...updates } : o));
    saveOperations(updated);
    deriveLocalOSState(updated);
    setEditOperation(null);
  };

  // CRUD 3: DELETE Operation
  const handleDelete = async (id: number) => {
    if (!window.confirm(`Delete operation OP-${id}?`)) return;

    try {
      await fetch(`${API_URL}/operations/${id}`, { method: 'DELETE' });
    } catch {
      // ignore
    }

    const updated = operations.filter((o) => o.id !== id);
    saveOperations(updated);
    deriveLocalOSState(updated);
  };

  // OS Scheduling: Dispatch Next FCFS Process
  const handleDispatchNext = async () => {
    try {
      const res = await fetch(`${API_URL}/operations/dispatch`, { method: 'POST' });
      if (res.ok) {
        void load();
        return;
      }
    } catch {
      // local dispatch
    }

    // Local simulation: Find first queued operation, run it, then complete it after 3s
    const firstQueued = operations.find((o) => o.status === 'Queued');
    if (firstQueued) {
      await handleUpdateStatus(firstQueued.id, 'Running');
      setTimeout(() => {
        void handleUpdateStatus(firstQueued.id, 'Completed');
      }, 3500);
    }
  };

  // DBMS Aggregate calculations
  const totalShips = new Set(operations.map((o) => o.ship_name)).size;
  const activeOps = operations.filter((o) => o.status === 'Queued' || o.status === 'Running').length;
  const totalContainers = operations.length * 140;
  const activeBerths = new Set(operations.filter((o) => o.status === 'Running').map((o) => o.berth_id)).size;

  const cards = [
    { label: 'Ships in Port', value: totalShips, icon: Ship },
    { label: 'Active Operations', value: activeOps, icon: Anchor },
    { label: 'Containers Tracked', value: totalContainers, icon: Boxes },
    { label: 'Occupied Berths', value: activeBerths, icon: UserRound },
  ];

  return (
    <main className="phase-dashboard">
      <header className="phase-header">
        <div>
          <p className="eyebrow">{role.toUpperCase()} WORKSPACE · PHASE 2</p>
          <h1>{profile?.full_name || `${role} Operator`}</h1>
          <p>
            {supabase
              ? 'Live telemetry from connected Supabase database.'
              : 'Local port terminal workspace with OS & DBMS engine active.'}
          </p>
        </div>

        <div className="header-actions">
          <span className={`status-badge ${supabase ? 'live' : 'local'}`}>
            <span className="live-dot" />
            {supabase ? 'Live Supabase' : 'Local OS & DBMS Mode'}
          </span>
          <button className="refresh-button" onClick={() => void load()} disabled={loading} title="Refresh Telemetry">
            <RefreshCw aria-hidden="true" size={16} /> Refresh
          </button>
          <button className="signout-button" onClick={() => void handleSignOut()} aria-label="Sign out">
            <LogOut aria-hidden="true" size={16} /> Sign out
          </button>
        </div>
      </header>

      {error && (
        <section className="dashboard-notice" role="status">
          <p>{error}</p>
        </section>
      )}

      {/* DBMS Concept: Aggregate Functions (COUNT, SUM) */}
      <section className="metric-grid" aria-live="polite">
        {cards.map(({ label, value, icon: Icon }) => (
          <article className="metric-card" key={label}>
            <Icon aria-hidden="true" />
            <p>{label}</p>
            <strong>{loading ? '—' : typeof value === 'number' ? value.toLocaleString() : value}</strong>
          </article>
        ))}
      </section>

      {/* OS Concepts: CPU Scheduling, Ready Queue, Mutex Locks & Concurrency */}
      <section className="os-telemetry-panel">
        <div className="os-panel-header">
          <div className="os-title">
            <Cpu size={18} aria-hidden="true" />
            <div>
              <h3>Operating System Scheduler & Concurrency Monitor</h3>
              <p>FCFS CPU Scheduling · Mutex Lock Allocation · Deadlock Detection</p>
            </div>
          </div>
          <div className="os-actions">
            <span className={`deadlock-pill ${osState.deadlockDetected ? 'deadlock' : 'safe'}`}>
              <ShieldCheck size={14} aria-hidden="true" />
              {osState.deadlockDetected ? 'Deadlock Alert' : 'Safe State (No Deadlock)'}
            </span>
            <button
              className="dispatch-button"
              onClick={() => void handleDispatchNext()}
              disabled={!operations.some((o) => o.status === 'Queued')}
              title="Schedule and execute the next queued process via FCFS"
            >
              <Play size={14} aria-hidden="true" /> Dispatch Next Process (FCFS)
            </button>
          </div>
        </div>

        <div className="os-telemetry-grid">
          {/* FCFS Ready Queue */}
          <div className="os-card">
            <div className="os-card-head">
              <Clock size={16} />
              <h4>Ready Queue ({osState.readyQueue.length} Waiting)</h4>
            </div>
            {osState.readyQueue.length === 0 ? (
              <p className="os-empty">Ready queue is idle. No processes waiting.</p>
            ) : (
              <div className="queue-list">
                {osState.readyQueue.map((item, idx) => (
                  <div className="queue-chip" key={item.id}>
                    <span className="queue-index">#{idx + 1}</span>
                    <span className="queue-id">{item.id}</span>
                    <span className="queue-priority">P{item.priority || 1}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Crane Mutex Locks */}
          <div className="os-card">
            <div className="os-card-head">
              <Lock size={16} />
              <h4>Equipment Mutex Locks (Cranes)</h4>
            </div>
            <div className="mutex-list">
              {Object.entries(osState.mutexes).map(([name, lock]) => (
                <div className={`mutex-row ${lock.isLocked ? 'locked' : 'available'}`} key={name}>
                  <div className="mutex-name">
                    {lock.isLocked ? <Lock size={14} /> : <Unlock size={14} />}
                    <strong>{name}</strong>
                  </div>
                  <span className="mutex-status">
                    {lock.isLocked ? `Locked by ${lock.ownerId || 'Running Process'}` : 'Unlocked / Free'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Berth Semaphores */}
          <div className="os-card">
            <div className="os-card-head">
              <Anchor size={16} />
              <h4>Berth Allocation Semaphores</h4>
            </div>
            <div className="mutex-list">
              {Object.entries(osState.semaphores).map(([name, sem]) => (
                <div className={`mutex-row ${sem.available === 0 ? 'locked' : 'available'}`} key={name}>
                  <div className="mutex-name">
                    <Anchor size={14} />
                    <strong>{name}</strong>
                  </div>
                  <span className="mutex-status">
                    {sem.available === 0 ? 'Occupied (Capacity: 0/1)' : 'Available (Capacity: 1/1)'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* DBMS Concept: Operations Table & Local CRUD */}
      <section className="operations-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">PORT OPERATIONS &amp; CRUD MANAGEMENT</p>
            <h2>Active Operations</h2>
          </div>
          <div className="panel-actions">
            <span className="panel-count">{operations.length} operations</span>
            <button
              className="create-button"
              onClick={() => setShowCreateModal(true)}
              id="new-operation-btn"
            >
              <Plus size={16} aria-hidden="true" /> + New Operation
            </button>
          </div>
        </div>

        {operations.length === 0 ? (
          <div className="empty-state">
            <Anchor aria-hidden="true" />
            <h3>No operations yet</h3>
            <p>Click "+ New Operation" to submit a port job to the scheduler and database.</p>
            <button className="primary-action-btn" onClick={() => setShowCreateModal(true)}>
              <Plus size={16} /> Create First Operation
            </button>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Ref</th>
                  <th>Operation Type</th>
                  <th>Ship Name</th>
                  <th>Berth / Crane</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Timing</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {operations.map((op) => (
                  <tr key={op.id}>
                    <td>
                      <span className="reference-code">OP-{op.id}</span>
                    </td>
                    <td>
                      <strong>{op.operation_type}</strong>
                    </td>
                    <td>{op.ship_name}</td>
                    <td>
                      <span className="location-pill">
                        {op.berth_id} · {op.crane_id}
                      </span>
                    </td>
                    <td>
                      <span className={`priority-tag p${op.priority}`}>
                        {op.priority === 3 ? 'Critical' : op.priority === 2 ? 'High' : 'Normal'}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`status-pill ${
                          op.status === 'Running'
                            ? 'in-progress'
                            : op.status === 'Completed'
                            ? 'completed'
                            : op.status === 'Cancelled'
                            ? 'cancelled'
                            : 'scheduled'
                        }`}
                      >
                        {op.status}
                      </span>
                    </td>
                    <td>
                      <span className="time-metric">
                        {op.turnaround_time_ms
                          ? `Done in ${(op.turnaround_time_ms / 1000).toFixed(1)}s`
                          : op.start_time
                          ? 'In Execution'
                          : 'Queued'}
                      </span>
                    </td>
                    <td>
                      <div className="table-action-btns">
                        {op.status === 'Queued' && (
                          <button
                            className="row-btn run"
                            onClick={() => void handleUpdateStatus(op.id, 'Running')}
                            title="Run process"
                          >
                            <Play size={13} />
                          </button>
                        )}
                        {op.status === 'Running' && (
                          <button
                            className="row-btn complete"
                            onClick={() => void handleUpdateStatus(op.id, 'Completed')}
                            title="Complete operation"
                          >
                            <CheckCircle2 size={13} />
                          </button>
                        )}
                        <button
                          className="row-btn edit"
                          onClick={() => setEditOperation(op)}
                          title="Update operation"
                        >
                          <Sliders size={13} />
                        </button>
                        <button
                          className="row-btn delete"
                          onClick={() => void handleDelete(op.id)}
                          title="Delete operation"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* CREATE OPERATION MODAL */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <Plus size={18} />
                <h3>Create New Port Operation</h3>
              </div>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate}>
              <div className="modal-form-grid">
                <label>
                  Operation Type
                  <select value={formType} onChange={(e) => setFormType(e.target.value)}>
                    <option value="Container Discharge">Container Discharge</option>
                    <option value="Bulk Grain Unloading">Bulk Grain Unloading</option>
                    <option value="Refrigerated Cargo Inspection">Refrigerated Cargo Inspection</option>
                    <option value="Hazmat Staging">Dangerous Goods Hazmat Staging</option>
                    <option value="Bunkering Fuel Transfer">Bunkering Fuel Transfer</option>
                    <option value="Automated Vehicle Dispatch">Automated Vehicle Dispatch</option>
                  </select>
                </label>

                <label>
                  Vessel / Ship Name
                  <select value={formShip} onChange={(e) => setFormShip(e.target.value)}>
                    <option value="MV Ocean Carrier">MV Ocean Carrier</option>
                    <option value="Ever Glory">Ever Glory</option>
                    <option value="Pacific Trader">Pacific Trader</option>
                    <option value="Maersk Rotterdam">Maersk Rotterdam</option>
                    <option value="Cosco Harmony">Cosco Harmony</option>
                  </select>
                </label>

                <label>
                  Berth Allocation (Semaphore)
                  <select value={formBerth} onChange={(e) => setFormBerth(e.target.value)}>
                    <option value="Berth 1">Berth 1</option>
                    <option value="Berth 2">Berth 2</option>
                  </select>
                </label>

                <label>
                  Crane Equipment (Mutex Lock)
                  <select value={formCrane} onChange={(e) => setFormCrane(e.target.value)}>
                    <option value="Crane A">Crane A</option>
                    <option value="Crane B">Crane B</option>
                    <option value="None">None (Manual Gang)</option>
                  </select>
                </label>

                <label>
                  Scheduling Priority
                  <select value={formPriority} onChange={(e) => setFormPriority(e.target.value)}>
                    <option value="1">Priority 1 (Normal)</option>
                    <option value="2">Priority 2 (High)</option>
                    <option value="3">Priority 3 (Emergency / Critical)</option>
                  </select>
                </label>

                <label>
                  Process Burst Duration (seconds)
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={formBurst}
                    onChange={(e) => setFormBurst(e.target.value)}
                    required
                  />
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Submit to Ready Queue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPDATE OPERATION MODAL */}
      {editOperation && (
        <div className="modal-backdrop" onClick={() => setEditOperation(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <Sliders size={18} />
                <h3>Update OP-{editOperation.id}</h3>
              </div>
              <button className="close-btn" onClick={() => setEditOperation(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-form-grid">
              <label>
                Update Status
                <select
                  value={editOperation.status}
                  onChange={(e) => void handleUpdateStatus(editOperation.id, e.target.value as any)}
                >
                  <option value="Queued">Queued (In Ready Queue)</option>
                  <option value="Running">Running (Acquired Locks)</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </label>

              <label>
                Assigned Crane
                <select
                  value={editOperation.crane_id}
                  onChange={(e) => {
                    const crane = e.target.value;
                    const updated = operations.map((o) => (o.id === editOperation.id ? { ...o, crane_id: crane } : o));
                    saveOperations(updated);
                    setEditOperation({ ...editOperation, crane_id: crane });
                  }}
                >
                  <option value="Crane A">Crane A</option>
                  <option value="Crane B">Crane B</option>
                  <option value="None">None</option>
                </select>
              </label>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setEditOperation(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
