import { useState, type FormEvent } from 'react';
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, User, UserCog } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth, type Role } from '../auth/AuthProvider';
import { Button } from '@/components/ui/button';
import './Login.css';

type Mode = 'sign-in' | 'register';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function Login() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<Role>('Operator');

  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    setError('');
    setMessage('');
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
        profile = await register(cleanEmail, cleanPassword, fullName.trim(), role);
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
    <>
      <a className="skip-link" href="#auth-form">
        Skip to sign in
      </a>

      <main className="auth-shell">

        <section className="auth-brand" aria-label="PortFlow overview">
          <img
            className="auth-logo"
            src="/image/primarylogo.png"
            alt="PortFlow integrated port operations and cargo management system"
            width="280"
          />
          <div>
            <p className="eyebrow">PHASE 2 · SECURE OPERATIONS</p>
            <h1>Operate the port with a clear, controlled flow.</h1>
            <p>Role-based operational access for PortFlow administrators and operators.</p>
          </div>
        </section>

        <section className="auth-panel">
          <div className="auth-card" id="auth-form">
            <div className="auth-heading">
              <span className="auth-icon">
                <LockKeyhole aria-hidden="true" />
              </span>
              <p className="eyebrow">SECURE ACCESS</p>
              <h2>{isRegister ? 'Create an Account' : 'Welcome back'}</h2>
              <p>
                {isRegister
                  ? 'Register to manage port operations and cargo.'
                  : 'Sign in with your PortFlow account credentials.'}
              </p>
            </div>

            <form onSubmit={submit} noValidate>
              {isRegister && (
                <label>
                  Full Name
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. John Doe"
                    required
                  />
                  <User aria-hidden="true" />
                </label>
              )}

              <label>
                Email address
                <input
                  type="text"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@organisation.com"
                  required
                />
                <Mail aria-hidden="true" />
              </label>

              <label>
                Password
                <div className="password-control">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={isRegister ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                  />
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </label>

              {isRegister && (
                <label>
                  Operational Role
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as Role)}
                    className="auth-select"
                  >
                    <option value="Operator">Terminal Operator</option>
                    <option value="Admin">Port Administrator</option>
                  </select>
                  <UserCog aria-hidden="true" className="auth-field-icon" />
                </label>
              )}

              {!isRegister && (
                <div className="credentials-hint">
                  <strong>Quick Demo Fill (Click to Select):</strong>
                  <div className="demo-actions">
                    <button
                      type="button"
                      onClick={() => {
                        setEmail('admin@portflow.com');
                        setPassword('Password123!');
                        setError('');
                      }}
                      className="demo-action demo-action-admin"
                    >
                      Admin Demo
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEmail('operator@portflow.com');
                        setPassword('Password123!');
                        setError('');
                      }}
                      className="demo-action demo-action-operator"
                    >
                      Operator Demo
                    </button>
                  </div>
                  <span className="demo-password">
                    Password: <code>Password123!</code>
                  </span>
                </div>
              )}

              {error && (
                <p className="form-message error" role="alert">
                  {error}
                </p>
              )}

              {message && (
                <p className="form-message success" aria-live="polite">
                  {message}
                </p>
              )}

              <Button
                type="submit"
                size="lg"
                className="primary-button"
                disabled={busy}
              >
                {busy
                  ? 'Please wait…'
                  : isRegister
                    ? 'Create Account'
                    : 'Sign in securely'}
              </Button>
            </form>

            <div className="auth-links">
              {mode === 'sign-in' ? (
                <button onClick={() => switchMode('register')}>Create a new account</button>
              ) : (
                <button onClick={() => switchMode('sign-in')}>Back to sign in</button>
              )}
            </div>

            <p className="security-note">
              <ShieldCheck aria-hidden="true" />
              PortFlow internal system connection secure.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
