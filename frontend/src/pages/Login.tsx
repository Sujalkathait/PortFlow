import { useState, type FormEvent } from 'react';
import {
  Eye, EyeOff, LockKeyhole, Mail, ShieldCheck,
  User, UserCog, Zap, ArrowRight, AlertCircle, Check, X,
  Anchor, Compass, Boxes, Radio, Clock, Cpu, Users
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import './Login.css';

type Mode = 'sign-in' | 'register';
type InfoModalType = 'features' | 'about' | null;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Custom high-precision SVG icons matching the reference mockup
function ShipHeadonIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 19l2-8h12l2 8c-3 2-6 2-8 2s-5 0-8-2z" />
      <path d="M7 11V6a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v5" />
      <path d="M12 2v3" />
      <path d="M9 8h6" />
      <path d="M12 11v8" />
    </svg>
  );
}

function CargoContainerIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <line x1="6" y1="6" x2="6" y2="18" />
      <line x1="10" y1="6" x2="10" y2="18" />
      <line x1="14" y1="6" x2="14" y2="18" />
      <line x1="18" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ShieldVerifyIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export function Login() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>('sign-in');
  const [infoModal, setInfoModal] = useState<InfoModalType>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [activeDemo, setActiveDemo] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    setError('');
    setMessage('');
    setActiveDemo(false);
  };

  const scrollToAuth = (initialMode: Mode = 'sign-in') => {
    switchMode(initialMode);
    document.getElementById('auth-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDemoFill = () => {
    setEmail('operator@portflow.com');
    setPassword('Password123!');
    setActiveDemo(true);
    setError('');
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');

    const cleanEmail = email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(cleanEmail) && cleanEmail.length < 3) {
      setError('Enter a valid work email address.');
      return;
    }

    const cleanPassword = password.trim();
    if (cleanPassword.length < 6) {
      setError('Use at least 6 characters for your password.');
      return;
    }

    if (mode === 'register' && fullName.trim().length < 2) {
      setError('Please provide your full name.');
      return;
    }

    setBusy(true);

    try {
      let profile;
      if (mode === 'sign-in') {
        profile = await login(cleanEmail, cleanPassword);
      } else {
        profile = await register(cleanEmail, cleanPassword, fullName.trim(), 'Operator');
      }

      navigate(profile.role === 'Admin' ? '/admin' : '/operator', { replace: true });
    } catch (reason: any) {
      setError(
        reason instanceof Error
          ? reason.message
          : reason?.message || 'Unable to complete request. Please try again.'
      );
    } finally {
      setBusy(false);
    }
  };

  const isRegister = mode === 'register';

  return (
    <div className="portflow-landing-wrapper">
      {/* ─── Modern Minimalist Header / Navbar ─── */}
      <header className="portflow-navbar">
        <div className="navbar-container">
          {/* Logo Mark */}
          <div className="navbar-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="logo-badge">
              <svg viewBox="0 0 36 36" fill="none" className="w-9 h-9">
                <path
                  d="M18 2L4 7v11c0 8.5 6 14.5 14 16 8-1.5 14-7.5 14-16V7L18 2z"
                  stroke="#0284c7"
                  strokeWidth="2.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="rgba(2, 132, 199, 0.08)"
                />
                <circle cx="18" cy="11" r="2.4" stroke="#0284c7" strokeWidth="2" />
                <path d="M18 13.5V26" stroke="#0284c7" strokeWidth="2.2" strokeLinecap="round" />
                <path d="M12 17h12" stroke="#0284c7" strokeWidth="2.2" strokeLinecap="round" />
                <path d="M10 21c2 3.5 5 5 8 5s6-1.5 8-5" stroke="#0284c7" strokeWidth="2.2" strokeLinecap="round" />
                <path d="M10 21l-1.5-2" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" />
                <path d="M26 21l1.5-2" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <div className="logo-text-group">
              <span className="logo-title">PORTFLOW</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="navbar-nav">
            <button
              type="button"
              onClick={() => setInfoModal('features')}
              className="nav-link"
            >
              Features
            </button>
            <button
              type="button"
              onClick={() => setInfoModal('about')}
              className="nav-link"
            >
              About
            </button>
          </nav>

          {/* Nav Actions */}
          <div className="navbar-actions">
            <button
              type="button"
              onClick={() => {
                switchMode('sign-in');
                document.getElementById('auth-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="btn-nav-login"
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => {
                switchMode('register');
                document.getElementById('auth-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="btn-nav-signup"
            >
              Sign up
            </button>
          </div>
        </div>
      </header>

      {/* ─── Hero Section with port_sunset_bg.jpg ─── */}
      <section className="portflow-hero">
        <div className="hero-overlay" />

        <div className="hero-inner">
          <div className="hero-main-row">
            {/* Left Column: Hero Text, Headings & Value Pillars */}
            <div className="hero-content">
              {/* Eyebrow Label */}
              <div className="hero-eyebrow">
                <span className="eyebrow-dash" />
                <span className="eyebrow-text">
                  INTEGRATED PORT OPERATIONS &amp; CARGO MANAGEMENT
                </span>
              </div>

              {/* Main Title */}
              <h1 className="hero-heading">
                Operate smarter.<br />
                <span className="gradient-text">Move faster.</span>
              </h1>

              {/* Subtitle */}
              <p className="hero-description">
              </p>

              {/* Bottom 3 Feature Pillars */}
              <div className="hero-pillars">
                <div className="pillar-item">
                  <div className="pillar-icon">
                    <ShipHeadonIcon className="w-6 h-6 text-sky-400" />
                  </div>
                  <div className="pillar-text">
                    <span className="pillar-title">Smarter</span>
                    <span className="pillar-subtitle">Operations</span>
                  </div>
                </div>

                <div className="pillar-divider" />

                <div className="pillar-item">
                  <div className="pillar-icon">
                    <CargoContainerIcon className="w-6 h-6 text-sky-400" />
                  </div>
                  <div className="pillar-text">
                    <span className="pillar-title">Complete</span>
                    <span className="pillar-subtitle">Cargo Visibility</span>
                  </div>
                </div>

                <div className="pillar-divider" />

                <div className="pillar-item">
                  <div className="pillar-icon">
                    <ShieldVerifyIcon className="w-6 h-6 text-sky-400" />
                  </div>
                  <div className="pillar-text">
                    <span className="pillar-title">Reliable</span>
                    <span className="pillar-subtitle">&amp; Secure</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Embedded Auth Card (Directly on Hero, NEVER covering main page!) */}
            <div className="hero-auth-card" id="auth-section">
              <div className="modal-header">
                <div className="modal-logo-mark">
                  <Anchor className="w-5 h-5 text-sky-400" />
                </div>
                <span className="modal-badge">PORTFLOW </span>
                <h2 id="auth-modal-title" className="modal-title">
                  {isRegister ? 'Create an Account' : 'Welcome Back'}
                </h2>
                <p className="modal-sub">
                  {isRegister
                    ? 'Join PortFlow to manage global vessels, berths & cargo.'
                    : 'Sign in to access your PortFlow operations dashboard.'}
                </p>
              </div>

              {/* Mode Switcher */}
              <div className="modal-tabs">
                <button
                  type="button"
                  onClick={() => switchMode('sign-in')}
                  className={`modal-tab ${!isRegister ? 'active' : ''}`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className={`modal-tab ${isRegister ? 'active' : ''}`}
                >
                  Register
                </button>
              </div>

              {/* Quick Demo Fill Card */}
              {!isRegister && (
                <div className="modal-demo-box">
                  <div className="demo-header-row">
                    <span className="demo-title">
                      <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      Quick Demo Access
                    </span>
                    <span className="demo-pass-hint">
                      Pass: <code>Password123!</code>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleDemoFill}
                    className={`modal-demo-btn ${activeDemo ? 'selected' : ''}`}
                  >
                    <div className="demo-avatar">
                      {activeDemo ? <Check className="w-3.5 h-3.5" /> : <UserCog className="w-3.5 h-3.5" />}
                    </div>
                    <div className="demo-details">
                      <span className="demo-role">Terminal Operator Demo</span>
                      <span className="demo-email">operator@portflow.com</span>
                    </div>
                  </button>
                </div>
              )}

              {/* Auth Form */}
              <form onSubmit={submit} noValidate className="modal-form">
                {isRegister && (
                  <div className="modal-field">
                    <label htmlFor="reg-fullname">Full Name</label>
                    <div className="field-input-box">
                      <User className="field-icon" aria-hidden="true" />
                      <input
                        id="reg-fullname"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Captain Alex Rivera"
                        required
                        className="field-input"
                      />
                    </div>
                  </div>
                )}

                <div className="modal-field">
                  <label htmlFor="auth-email">Work Email</label>
                  <div className="field-input-box">
                    <Mail className="field-icon" aria-hidden="true" />
                    <input
                      id="auth-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setActiveDemo(false);
                      }}
                      placeholder="name@organisation.com"
                      required
                      className="field-input"
                    />
                  </div>
                </div>

                <div className="modal-field">
                  <label htmlFor="auth-password">Password</label>
                  <div className="field-input-box">
                    <LockKeyhole className="field-icon" aria-hidden="true" />
                    <input
                      id="auth-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={isRegister ? 'new-password' : 'current-password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setActiveDemo(false);
                      }}
                      placeholder="Enter password"
                      required
                      className="field-input with-action"
                    />
                    <button
                      type="button"
                      className="field-action-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="modal-alert error" role="alert">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {message && (
                  <div className="modal-alert success" aria-live="polite">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>{message}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="modal-submit-btn"
                  disabled={busy}
                >
                  {busy ? (
                    <span className="submit-loading">
                      <span className="spinner" />
                      Authenticating…
                    </span>
                  ) : (
                    <span className="submit-text">
                      {isRegister ? 'Create Account' : 'Sign In to Terminal'}
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </button>
              </form>

              <div className="modal-footer">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>256-bit TLS encrypted connection · PortFlow Security Guard</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Informational Modals (Our WebApp / About) ─── */}
      {infoModal && (
        <div className="modal-backdrop" onClick={() => setInfoModal(null)}>
          <div
            className="info-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setInfoModal(null)}
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>

            {infoModal === 'features' && (
              <div>
                <div className="modal-header">
                  <div className="modal-logo-mark">
                    <Compass className="w-5 h-5 text-sky-400" />
                  </div>
                  <span className="modal-badge">PLATFORM FEATURES</span>
                  <h2 className="modal-title">Port Operating System Features</h2>
                  <p className="modal-sub">Enterprise tools built for high-throughput global terminals.</p>
                </div>

                <div className="features-grid">
                  <div className="feature-card">
                    <Radio className="w-5 h-5 text-sky-400 mb-2" />
                    <h3 className="feature-heading">Real-Time Vessel AIS Tracking</h3>
                    <p className="feature-desc">Monitor approaching container ships, live ETA calculations, harbor approach queues, and automated pilotage handoffs.</p>
                  </div>
                  <div className="feature-card">
                    <Clock className="w-5 h-5 text-sky-400 mb-2" />
                    <h3 className="feature-heading">Intelligent Berth Scheduling (OS Kernel)</h3>
                    <p className="feature-desc">Dynamic Gantt scheduling powered by FCFS, SJF, and Priority algorithms with counting Semaphore berth allocations.</p>
                  </div>
                  <div className="feature-card">
                    <Boxes className="w-5 h-5 text-sky-400 mb-2" />
                    <h3 className="feature-heading">ISO Cargo &amp; Yard Management</h3>
                    <p className="feature-desc">Interactive container yard stacking, reefer temperature telemetry, TEU inventory controls, and gate transaction tracking.</p>
                  </div>
                  <div className="feature-card">
                    <Cpu className="w-5 h-5 text-sky-400 mb-2" />
                    <h3 className="feature-heading">Crane Resource Locks (Mutex)</h3>
                    <p className="feature-desc">Ship-to-Shore (STS) gantry crane dispatch with binary Mutex locking and Wait-For-Graph (WFG) deadlock prevention.</p>
                  </div>
                  <div className="feature-card">
                    <Compass className="w-5 h-5 text-sky-400 mb-2" />
                    <h3 className="feature-heading">Interactive Operator Ground Console</h3>
                    <p className="feature-desc">Unified command interface for terminal operators with live status filters, soft-delete safety, and trash recovery.</p>
                  </div>
                  <div className="feature-card">
                    <ShieldCheck className="w-5 h-5 text-sky-400 mb-2" />
                    <h3 className="feature-heading">Enterprise Architecture &amp; Security</h3>
                    <p className="feature-desc">React 19 + TypeScript frontend with secure JWT role-based access control (RBAC) and PostgreSQL 3NF normalized backend.</p>
                  </div>
                </div>

                <div className="info-modal-cta">
                  <button
                    type="button"
                    onClick={() => {
                      setInfoModal(null);
                      scrollToAuth('sign-in');
                    }}
                    className="modal-submit-btn"
                  >
                    Launch WebApp &amp; Sign In
                  </button>
                </div>
              </div>
            )}

            {infoModal === 'about' && (
              <div>
                <div className="modal-header">
                  <div className="modal-logo-mark">
                    <Users className="w-5 h-5 text-sky-400" />
                  </div>
                  <span className="modal-badge">TEAM DATA DRAGONS</span>
                  <h2 className="modal-title">Meet Team Data Dragons</h2>
                  <p className="modal-sub">The engineering minds designing the future of smart maritime operations.</p>
                </div>

                <div className="about-text-content">
                  <p>
                    We are <strong>Team Data Dragons</strong> — the creators and developers behind <strong>PortFlow</strong>. Our mission is to bridge complex maritime logistics with fundamental Computer Science principles, simulating Operating System concurrency (Mutex locks, Semaphores, CPU schedulers) atop a robust 3NF relational database.
                  </p>

                  <div className="team-section-heading">
                    <h3 className="team-group-title">Core Engineering Team</h3>
                    <span className="team-group-sub">Roles &amp; Contributions</span>
                  </div>

                  <div className="team-grid">
                    <div className="team-card lead">
                      <div className="team-card-top">
                        <div className="team-avatar lead-avatar">SK</div>
                        <div>
                          <div className="team-name">Sujal Kathait</div>
                          <div className="team-role">Project Lead &amp; System Architect</div>
                        </div>
                      </div>
                      <span className="team-tag lead-tag">LEAD ARCHITECT</span>
                      <p className="team-desc">
                        Full-Stack architecture, OS Simulation Kernel design, ER modeling, and end-to-end integration.
                      </p>
                    </div>

                    <div className="team-card">
                      <div className="team-card-top">
                        <div className="team-avatar">FE</div>
                        <div>
                          <div className="team-name">Team Member</div>
                          <div className="team-role">Frontend UI/UX Developer</div>
                        </div>
                      </div>
                      <span className="team-tag">REACT &amp; TS</span>
                      <p className="team-desc">
                        React 19 SPA, modern responsive design system, and unified Terminal Operator dashboard.
                      </p>
                    </div>

                    <div className="team-card">
                      <div className="team-card-top">
                        <div className="team-avatar">BE</div>
                        <div>
                          <div className="team-name">Team Member</div>
                          <div className="team-role">Backend API Engineer</div>
                        </div>
                      </div>
                      <span className="team-tag">NODE &amp; EXPRESS</span>
                      <p className="team-desc">
                        RESTful API endpoints, Inter-Process Communication (IPC), and secure JWT role-based auth.
                      </p>
                    </div>

                    <div className="team-card">
                      <div className="team-card-top">
                        <div className="team-avatar">DB</div>
                        <div>
                          <div className="team-name">Team Member</div>
                          <div className="team-role">Database Administrator</div>
                        </div>
                      </div>
                      <span className="team-tag">POSTGRES &amp; PRISMA</span>
                      <p className="team-desc">
                        PostgreSQL 3NF normalized schema, Prisma ORM transactions, and soft-delete audit trails.
                      </p>
                    </div>

                    <div className="team-card">
                      <div className="team-card-top">
                        <div className="team-avatar">OS</div>
                        <div>
                          <div className="team-name">Team Member</div>
                          <div className="team-role">OS Scheduling Engineer</div>
                        </div>
                      </div>
                      <span className="team-tag">OS SIMULATOR</span>
                      <p className="team-desc">
                        CPU scheduling algorithms (FCFS, SJF, Priority), process lifecycle, and ready queue management.
                      </p>
                    </div>

                    <div className="team-card">
                      <div className="team-card-top">
                        <div className="team-avatar">QA</div>
                        <div>
                          <div className="team-name">Team Member</div>
                          <div className="team-role">Concurrency &amp; QA Lead</div>
                        </div>
                      </div>
                      <span className="team-tag">MUTEX &amp; TEST</span>
                      <p className="team-desc">
                        Mutex locks for cranes, berth semaphores, deadlock detection, and integration testing.
                      </p>
                    </div>
                  </div>

                  <div className="about-stats-row">
                    <div className="stat-item">
                      <span className="stat-number">3</span>
                      <span className="stat-label">OS Schedulers (FCFS/SJF/Priority)</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-number">100%</span>
                      <span className="stat-label">Deadlock-Free Concurrency</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-number">3NF</span>
                      <span className="stat-label">Normalized PostgreSQL</span>
                    </div>
                  </div>
                </div>

                <div className="info-modal-cta">
                  <button
                    type="button"
                    onClick={() => {
                      setInfoModal(null);
                      scrollToAuth('sign-in');
                    }}
                    className="modal-submit-btn"
                  >
                    Explore Terminal Demo
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
