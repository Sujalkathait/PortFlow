import { useState, type FormEvent } from 'react';
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { supabase } from '../lib/supabase';
import './Login.css';

type Mode = 'sign-in' | 'request-reset' | 'update-password';
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function Login() {
  const { signInLocal } = useAuth();
  const [mode, setMode] = useState<Mode>(location.hash.includes('type=recovery') ? 'update-password' : 'sign-in');
  const [email, setEmail] = useState('admin@portflow.com');
  const [password, setPassword] = useState('Password123!');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (mode !== 'update-password' && !emailPattern.test(email)) {
      setError('Enter a valid work email address.');
      return;
    }
    if (mode !== 'request-reset' && password.length < 6) {
      setError('Use at least 6 characters for your password.');
      return;
    }

    setBusy(true);

    try {
      if (mode === 'sign-in') {
        const cleanEmail = email.trim().toLowerCase();

        // 1. Direct local authentication for development & offline mode
        if (cleanEmail === 'admin@portflow.com' && password === 'Password123!') {
          signInLocal('Admin', 'admin@portflow.com', 'Port Administrator');
          navigate('/admin', { replace: true });
          return;
        }

        if (cleanEmail === 'operator@portflow.com' && password === 'Password123!') {
          signInLocal('Operator', 'operator@portflow.com', 'Crane Operator');
          navigate('/operator', { replace: true });
          return;
        }

        // 2. Live Supabase authentication if configured
        if (supabase) {
          const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
          if (authError) throw authError;

          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single();

          if (profileError || !profile) {
            throw new Error('This account is not assigned a PortFlow role.');
          }

          navigate(profile.role === 'Admin' ? '/admin' : '/operator', { replace: true });
          return;
        }

        throw new Error('Invalid email or password. Use admin@portflow.com or operator@portflow.com with password Password123!');
      } else if (mode === 'request-reset') {
        if (!supabase) {
          setMessage('Local mode: password reset simulated. Use Password123! to sign in.');
          setMode('sign-in');
          return;
        }
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/login#type=recovery`,
        });
        if (resetError) throw resetError;
        setMessage('If this account exists, a secure reset link has been sent.');
      } else {
        if (!supabase) {
          setMessage('Local mode: password updated. You can now sign in.');
          setMode('sign-in');
          setPassword('Password123!');
          return;
        }
        const { error: updateError } = await supabase.auth.updateUser({ password });
        if (updateError) throw updateError;
        setMessage('Password updated. You can now sign in.');
        setMode('sign-in');
        setPassword('');
      }
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Unable to complete request. Please try again.'
      );
    } finally {
      setBusy(false);
    }
  };

  const reset = (next: Mode) => {
    setMode(next);
    setError('');
    setMessage('');
    setPassword('');
  };

  const isReset = mode === 'request-reset';
  const isUpdate = mode === 'update-password';

  return (
    <main className="auth-shell">
      <a className="skip-link" href="#auth-form">
        Skip to sign in
      </a>

      <section className="auth-brand" aria-label="PortFlow overview">
        <img
          className="auth-logo"
          src="/image/primarylogo.png"
          alt="PortFlow integrated port operations and cargo management system"
          width="700"
          height="287"
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
            <h2>{isReset ? 'Reset your password' : isUpdate ? 'Choose a new password' : 'Welcome back'}</h2>
            <p>
              {isReset
                ? 'We will email a one-time reset link if the address is registered.'
                : isUpdate
                ? 'Use a strong password to protect your workspace.'
                : 'Sign in with your PortFlow account credentials.'}
            </p>
          </div>

          <form onSubmit={submit} noValidate>
            {!isUpdate && (
              <label>
                Email address
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@organisation.com"
                  required
                />
                <Mail aria-hidden="true" />
              </label>
            )}

            {!isReset && (
              <label>
                {isUpdate ? 'New password' : 'Password'}
                <div className="password-control">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={isUpdate ? 'new-password' : 'current-password'}
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
            )}

            <div className="credentials-hint">
              <strong>Local Credentials:</strong>
              <span><code>admin@portflow.com</code> (Admin) or <code>operator@portflow.com</code> (Operator)</span>
              <span>Password: <code>Password123!</code></span>
            </div>

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

            <button className="primary-button" disabled={busy}>
              {busy
                ? 'Please wait…'
                : isReset
                ? 'Send reset link'
                : isUpdate
                ? 'Update password'
                : 'Sign in securely'}
            </button>
          </form>

          <div className="auth-links">
            {mode === 'sign-in' ? (
              <button onClick={() => reset('request-reset')}>Forgot password?</button>
            ) : (
              <button onClick={() => reset('sign-in')}>Back to sign in</button>
            )}
          </div>

          <p className="security-note">
            <ShieldCheck aria-hidden="true" />
            {supabase ? 'Authentication is managed securely by Supabase.' : 'Local Workspace Authentication active.'}
          </p>
        </div>
      </section>
    </main>
  );
}
