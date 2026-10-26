import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Eye, EyeOff, LockKeyhole, Mail, User,
  AlertCircle, Check, X, ShieldCheck, Compass, Anchor,
  Ship, Boxes, Cpu, CheckCircle2, Timer, KeyRound, ArrowLeft, RefreshCw
} from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { api } from '../lib/api';
import './Login.css';

type Mode = 'login' | 'signup' | 'none';
type InfoModal = 'features' | 'about' | 'forgot' | null;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function Login() {
  const { login, register, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Handle URL query ?mode=signup or default to login form
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'login';
  const [mode, setMode] = useState<Mode>(initialMode);
  const [activeModal, setActiveModal] = useState<InfoModal>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Forgot password wizard state
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpTimer, setOtpTimer] = useState<number>(30);
  const [otpTimerActive, setOtpTimerActive] = useState<boolean>(false);
  const [forgotBusy, setForgotBusy] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  // 30-Second Countdown Timer for OTP Expiration
  useEffect(() => {
    let interval: any = null;
    if (otpTimerActive && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    } else if (otpTimer === 0) {
      setOtpTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [otpTimerActive, otpTimer]);

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveModal(null);
      }
    };
    if (activeModal) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModal]);

  // If already authenticated and not loading, redirect to authorized dashboard
  useEffect(() => {
    if (!authLoading && profile) {
      navigate('/operator', { replace: true });
    }
  }, [authLoading, profile, navigate]);

  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    setError('');
    setMessage('');
    setSearchParams(newMode === 'signup' ? { mode: 'signup' } : {});
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');

    let cleanEmail = email.trim().toLowerCase();
    // Allow typing 'operator' or 'admin' directly as username
    if (!cleanEmail.includes('@')) {
      if (cleanEmail === 'operator' || cleanEmail === 'admin') {
        cleanEmail = `${cleanEmail}@portflow.com`;
      } else {
        setError('Please enter a valid email or username.');
        return;
      }
    } else if (!EMAIL_PATTERN.test(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    const cleanPassword = password.trim();
    if (cleanPassword.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }

    if (mode === 'signup' && fullName.trim().length < 2) {
      setError('Please provide your full name (minimum 2 characters).');
      return;
    }

    setBusy(true);

    try {
      if (mode === 'login') {
        await login(cleanEmail, cleanPassword);
      } else {
        await register(cleanEmail, cleanPassword, fullName.trim(), 'Operator');
      }

      navigate('/operator', { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please verify your credentials and try again.');
    } finally {
      setBusy(false);
    }
  };

  const openForgotPassword = () => {
    setForgotStep(1);
    setForgotEmail(email.trim());
    setForgotOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setForgotError('');
    setForgotSuccess('');
    setOtpTimer(30);
    setOtpTimerActive(false);
    setActiveModal('forgot');
  };

  const handleSendOTP = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    let clean = forgotEmail.trim().toLowerCase();
    if (!clean) {
      setForgotError('Please enter your email address or username.');
      return;
    }
    if (!clean.includes('@') && (clean === 'operator' || clean === 'admin')) {
      clean = `${clean}@portflow.com`;
    }

    setForgotBusy(true);
    try {
      const res = await api.auth.forgotPassword(clean);
      setForgotSuccess(res.message || 'If the account exists, an OTP has been sent.');
      setForgotStep(2);
      setOtpTimer(30);
      setOtpTimerActive(true);
    } catch (err: any) {
      setForgotError(err.message || 'Failed to send OTP code.');
    } finally {
      setForgotBusy(false);
    }
  };

  const handleVerifyOTP = async (e: FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    const cleanOtp = forgotOtp.trim();
    if (cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      setForgotError('Please enter a valid 6-digit numeric OTP code.');
      return;
    }

    if (otpTimer <= 0) {
      setForgotError('OTP has expired (30s limit exceeded). Please click "Resend OTP" to generate a new code.');
      return;
    }

    let clean = forgotEmail.trim().toLowerCase();
    if (!clean.includes('@') && (clean === 'operator' || clean === 'admin')) {
      clean = `${clean}@portflow.com`;
    }

    setForgotBusy(true);
    try {
      const res = await api.auth.verifyOTP(clean, cleanOtp);
      setForgotSuccess(res.message || 'OTP verified successfully.');
      setForgotStep(3);
    } catch (err: any) {
      setForgotError(err.message || 'Invalid or expired OTP code.');
    } finally {
      setForgotBusy(false);
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    if (newPassword.length < 6) {
      setForgotError('New password must contain at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setForgotError('Passwords do not match. Please verify both fields.');
      return;
    }

    let clean = forgotEmail.trim().toLowerCase();
    if (!clean.includes('@') && (clean === 'operator' || clean === 'admin')) {
      clean = `${clean}@portflow.com`;
    }

    setForgotBusy(true);
    try {
      const res = await api.auth.resetPassword({
        email: clean,
        otp: forgotOtp.trim(),
        newPassword
      });
      setActiveModal(null);
      setMessage(res.message || 'Password updated successfully! Please sign in with your new password.');
      setPassword('');
      switchMode('login');
    } catch (err: any) {
      setForgotError(err.message || 'Password reset failed.');
    } finally {
      setForgotBusy(false);
    }
  };

  return (
    <div className="portflow-page-root">
            <header className="portflow-navbar">
        <div className="navbar-container">
                    <div
            className="navbar-brand"
            onClick={() => switchMode('none')}
            role="button"
            tabIndex={0}
            aria-label="PortFlow Home"
          >
            <div className="navbar-logo-icon" aria-hidden="true">
              <svg viewBox="0 0 40 40" fill="none" className="logo-svg">
                                <circle cx="20" cy="10" r="3.2" stroke="#0070f3" strokeWidth="2.4" />
                                <path d="M20 13.5v16" stroke="#0070f3" strokeWidth="2.4" strokeLinecap="round" />
                                <path d="M12 18h16" stroke="#0070f3" strokeWidth="2.4" strokeLinecap="round" />
                                <path d="M10 24c2 4 5.5 5.5 10 5.5s8-1.5 10-5.5" stroke="#0070f3" strokeWidth="2.4" strokeLinecap="round" />
                <path d="M8 23.5l-2-2m28 2l2-2" stroke="#0070f3" strokeWidth="2.2" strokeLinecap="round" />
                                <path d="M6 33.5c4-1.5 8-1.5 14 0 6 1.5 10 1.5 14 0" stroke="#0070f3" strokeWidth="2.2" strokeLinecap="round" />
                <path d="M9 37c3.5-1 7-1 11 0 4 1 7.5 1 11 0" stroke="#0070f3" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <span className="navbar-brand-name">
              <span className="brand-port">Port</span>
              <span className="brand-flow">Flow</span>
            </span>
          </div>

                    <nav className="navbar-center-nav" aria-label="Main Navigation">
            <button
              type="button"
              className="navbar-link"
              onClick={() => setActiveModal('features')}
            >
              Features
            </button>
            <button
              type="button"
              className="navbar-link"
              onClick={() => setActiveModal('about')}
            >
              About
            </button>
          </nav>

                    <div className="navbar-actions">
            <button
              type="button"
              className={`navbar-login-btn ${mode === 'login' ? 'active' : ''}`}
              onClick={() => switchMode('login')}
            >
              Log in
            </button>
            <button
              type="button"
              className="navbar-signup-btn"
              onClick={() => switchMode('signup')}
            >
              Sign up
            </button>
          </div>
        </div>
      </header>

            <main className="portflow-hero-viewport">
                <div
          className="hero-bg-scenery"
          style={{ backgroundImage: `url('/image/port_sunset_bg.jpg')` }}
          aria-hidden="true"
        />

                <div className="hero-bg-overlay" aria-hidden="true" />

        <div className="hero-main-container">
                    <div className="hero-scenery-space" aria-hidden="true" />

                    {mode !== 'none' && (
            <div className="hero-auth-column">
            <div className="auth-card-clean" role="region" aria-labelledby="auth-card-title">
                            <div className="auth-card-header" style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => switchMode('none')}
                  aria-label="Close form"
                  style={{ position: 'absolute', right: '-0.5rem', top: '-1rem', background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
                >
                  <X className="w-5 h-5" />
                </button>
                <h1 id="auth-card-title" className="auth-card-title">
                  {mode === 'login' ? 'Welcome back' : 'Create an account'}
                </h1>
                <p className="auth-card-subtitle">
                  {mode === 'login'
                    ? 'Sign in to your PortFlow account'
                    : 'Start managing your port operations today'}
                </p>
              </div>

                            <form onSubmit={handleSubmit} noValidate className="auth-form-clean">
                {mode === 'signup' && (
                  <div className="form-field-group">
                    <label htmlFor="auth-fullname" className="form-field-label">
                      Full Name
                    </label>
                    <div className="form-input-box">
                      <User className="form-input-icon" aria-hidden="true" />
                      <input
                        id="auth-fullname"
                        type="text"
                        autoComplete="name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Enter your full name"
                        required
                        className="form-input"
                      />
                    </div>
                  </div>
                )}

                <div className="form-field-group">
                  <label htmlFor="auth-email" className="form-field-label">
                    Username or Email
                  </label>
                  <div className="form-input-box">
                    {mode === 'signup' ? (
                      <Mail className="form-input-icon" aria-hidden="true" />
                    ) : (
                      <User className="form-input-icon" aria-hidden="true" />
                    )}
                    <input
                      id="auth-email"
                      type="text"
                      autoComplete="username email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email or username"
                      required
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-field-group">
                  <label htmlFor="auth-password" className="form-field-label">
                    Password
                  </label>
                  <div className="form-input-box">
                    <LockKeyhole className="form-input-icon" aria-hidden="true" />
                    <input
                      id="auth-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      className="form-input has-action"
                    />
                    <button
                      type="button"
                      className="form-password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="toggle-eye-icon" />
                      ) : (
                        <Eye className="toggle-eye-icon" />
                      )}
                    </button>
                  </div>
                </div>

                                {mode === 'login' && (
                  <div className="form-options-row">
                    <label className="form-checkbox-label">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="form-checkbox"
                      />
                      <span>Remember me</span>
                    </label>

                    <button
                      type="button"
                      className="form-forgot-btn"
                      onClick={() => openForgotPassword()}
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                                {error && (
                  <div className="form-alert error" role="alert">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {message && (
                  <div className="form-alert success" aria-live="polite">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>{message}</span>
                  </div>
                )}

                                <button
                  type="submit"
                  className="form-submit-btn"
                  disabled={busy}
                >
                  {busy ? (
                    <span className="submit-loading-state">
                      <span className="submit-spinner" />
                      Processing…
                    </span>
                  ) : mode === 'login' ? (
                    'Sign in'
                  ) : (
                    'Create account'
                  )}
                </button>
              </form>

                            <div className="auth-card-footer">
                {mode === 'login' ? (
                  <p>
                    Don't have an account?{' '}
                    <button
                      type="button"
                      className="footer-switch-btn"
                      onClick={() => switchMode('signup')}
                    >
                      Sign up
                    </button>
                  </p>
                ) : (
                  <p>
                    Already have an account?{' '}
                    <button
                      type="button"
                      className="footer-switch-btn"
                      onClick={() => switchMode('login')}
                    >
                      Sign in
                    </button>
                  </p>
                )}
              </div>
            </div>
          </div>
          )}
        </div>
      </main>

            {activeModal && (
        <div className="info-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div
            className="info-modal-sheet"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
                        <button
              type="button"
              className="sheet-close-btn"
              onClick={() => setActiveModal(null)}
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>

                        {activeModal === 'features' && (
              <div className="sheet-content">
                <div className="sheet-header">
                  <div className="sheet-icon-wrap">
                    <Compass className="w-6 h-6 text-blue-600" />
                  </div>
                  <h2 className="sheet-title">PortFlow Enterprise Features</h2>
                  <p className="sheet-subtitle">
                    Integrated smart port operations, real-time cargo movement, and OS-level concurrency control.
                  </p>
                </div>

                <div className="features-sheet-grid">
                  <div className="feature-sheet-item">
                    <Ship className="w-5 h-5 text-blue-600 mb-2" />
                    <h3>Vessel &amp; Berth Scheduling</h3>
                    <p>Automated berthing allocation with mutual exclusion mutex locks preventing crane conflicts.</p>
                  </div>
                  <div className="feature-sheet-item">
                    <Boxes className="w-5 h-5 text-blue-600 mb-2" />
                    <h3>Cargo &amp; Yard Visibility</h3>
                    <p>End-to-end container tracking, weight verification, hazmat compliance, and audit trail safety.</p>
                  </div>
                  <div className="feature-sheet-item">
                    <Cpu className="w-5 h-5 text-blue-600 mb-2" />
                    <h3>OS Simulation Engine</h3>
                    <p>FCFS, SJF, and Priority algorithm execution simulating CPU scheduling in maritime logistics.</p>
                  </div>
                  <div className="feature-sheet-item">
                    <ShieldCheck className="w-5 h-5 text-blue-600 mb-2" />
                    <h3>Secure RBAC &amp; Audit Logs</h3>
                    <p>Role-based operator security, transaction safety, and trash bin soft-delete recovery.</p>
                  </div>
                </div>

                <div className="sheet-footer-action">
                  <button
                    type="button"
                    className="sheet-primary-btn"
                    onClick={() => {
                      setActiveModal(null);
                      switchMode('login');
                    }}
                  >
                    Continue to Sign In
                  </button>
                </div>
              </div>
            )}


                        {activeModal === 'about' && (
              <div className="sheet-content">
                <div className="sheet-header">
                  <div className="sheet-icon-wrap">
                    <Anchor className="w-6 h-6 text-blue-600" />
                  </div>
                  <h2 className="sheet-title">About PortFlow</h2>
                  <p className="sheet-subtitle">
                    Integrated Port Operations &amp; Cargo Management System by <strong>Team Data Dragons</strong>.
                  </p>
                </div>

                <div className="about-sheet-body">
                  <p>
                    PortFlow bridges real-world marine terminal logistics with core Computer Science Operating Systems fundamentals. It demonstrates process scheduling algorithms, race condition prevention, and resource synchronization on a modern React 19 and Node.js stack.
                  </p>
                  <div className="about-architect-card">
                    <div className="architect-avatar">SK</div>
                    <div>
                      <h4 className="architect-name">Sujal Kathait</h4>
                      <p className="architect-role">System Architect &amp; Lead Developer</p>
                    </div>
                  </div>
                </div>

                <div className="sheet-footer-action">
                  <button
                    type="button"
                    className="sheet-primary-btn"
                    onClick={() => setActiveModal(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

                        {activeModal === 'forgot' && (
              <div className="sheet-content forgot-wizard-content">
                <div className="sheet-header">
                  <div className="sheet-icon-wrap">
                    <KeyRound className="w-6 h-6 text-blue-600" />
                  </div>
                  <h2 className="sheet-title">Reset Password</h2>
                  <p className="sheet-subtitle">
                    {forgotStep === 1 && 'Enter your registered email address or username to receive a 6-digit verification code.'}
                    {forgotStep === 2 && 'Enter the 6-digit OTP code sent to your email. The code expires in 30 seconds.'}
                    {forgotStep === 3 && 'Choose a strong new password for your PortFlow operator account.'}
                  </p>
                </div>

                                <div className="wizard-progress-bar">
                  <div className="wizard-steps-header">
                    <span className={`wizard-step-pill ${forgotStep >= 1 ? 'active' : ''}`}>1. Account</span>
                    <span className="wizard-step-divider">→</span>
                    <span className={`wizard-step-pill ${forgotStep >= 2 ? 'active' : ''}`}>2. 6-Digit OTP</span>
                    <span className="wizard-step-divider">→</span>
                    <span className={`wizard-step-pill ${forgotStep >= 3 ? 'active' : ''}`}>3. New Password</span>
                  </div>
                  <div className="wizard-track">
                    <div
                      className="wizard-fill"
                      style={{
                        width: forgotStep === 1 ? '33.33%' : forgotStep === 2 ? '66.66%' : '100%'
                      }}
                    />
                  </div>
                </div>

                                {forgotError && (
                  <div className="form-alert error" role="alert" style={{ marginBottom: '1.25rem' }}>
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{forgotError}</span>
                  </div>
                )}
                {forgotSuccess && (
                  <div className="form-alert success" role="status" style={{ marginBottom: '1.25rem' }}>
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{forgotSuccess}</span>
                  </div>
                )}

                                {forgotStep === 1 && (
                  <form onSubmit={handleSendOTP} className="forgot-wizard-form">
                    <div className="form-field-group">
                      <label htmlFor="forgot-email-input" className="form-field-label">
                        Username or Registered Email
                      </label>
                      <div className="form-input-box">
                        <Mail className="form-input-icon" aria-hidden="true" />
                        <input
                          id="forgot-email-input"
                          type="text"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder="e.g. operator@portflow.com"
                          required
                          autoFocus
                          className="form-input"
                        />
                      </div>
                      <span className="form-field-hint">
                        If the account exists in PortFlow, a 6-digit OTP valid for 30 seconds will be generated.
                      </span>
                    </div>

                    <div className="sheet-footer-action-row">
                      <button
                        type="button"
                        className="sheet-secondary-btn"
                        onClick={() => setActiveModal(null)}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={forgotBusy || !forgotEmail.trim()}
                        className="sheet-primary-btn"
                      >
                        {forgotBusy ? (
                          <span className="btn-loading-flex">
                            <span className="spinner-dots" /> Sending OTP...
                          </span>
                        ) : (
                          'Send 6-Digit OTP'
                        )}
                      </button>
                    </div>
                  </form>
                )}

                                {forgotStep === 2 && (
                  <form onSubmit={handleVerifyOTP} className="forgot-wizard-form">
                    <div className="otp-verification-card">
                      <div className="otp-header-info">
                        <span className="otp-target-label">Verification code sent for:</span>
                        <span className="otp-target-email">{forgotEmail}</span>
                      </div>

                      <div className="otp-input-container">
                        <label htmlFor="otp-input-field" className="form-field-label text-center block">
                          Enter 6-Digit Verification Code
                        </label>
                        <input
                          id="otp-input-field"
                          type="text"
                          maxLength={6}
                          pattern="[0-9]*"
                          inputMode="numeric"
                          value={forgotOtp}
                          onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                          placeholder="000000"
                          required
                          autoFocus
                          className="otp-code-input"
                        />
                      </div>

                                            <div className="otp-timer-container">
                        {otpTimer > 0 ? (
                          <div className="otp-countdown-pill active">
                            <Timer className="w-4 h-4 animate-spin text-emerald-600" />
                            <span>Valid for: <strong>{otpTimer}s</strong></span>
                          </div>
                        ) : (
                          <div className="otp-countdown-pill expired">
                            <AlertCircle className="w-4 h-4 text-red-600" />
                            <span>OTP expired (30s limit exceeded)</span>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => void handleSendOTP()}
                          disabled={forgotBusy}
                          className="resend-otp-btn"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${forgotBusy ? 'animate-spin' : ''}`} />
                          Resend OTP
                        </button>
                      </div>
                    </div>

                    <div className="sheet-footer-action-row">
                      <button
                        type="button"
                        className="sheet-secondary-btn"
                        onClick={() => setForgotStep(1)}
                      >
                        <ArrowLeft className="w-4 h-4 mr-1 inline" /> Back
                      </button>
                      <button
                        type="submit"
                        disabled={forgotBusy || forgotOtp.length !== 6 || otpTimer <= 0}
                        className="sheet-primary-btn"
                      >
                        {forgotBusy ? (
                          <span className="btn-loading-flex">
                            <span className="spinner-dots" /> Verifying...
                          </span>
                        ) : (
                          'Verify OTP'
                        )}
                      </button>
                    </div>
                  </form>
                )}

                                {forgotStep === 3 && (
                  <form onSubmit={handleResetPassword} className="forgot-wizard-form">
                    <div className="form-field-group">
                      <label htmlFor="forgot-new-password" className="form-field-label">
                        New Password
                      </label>
                      <div className="form-input-box">
                        <LockKeyhole className="form-input-icon" aria-hidden="true" />
                        <input
                          id="forgot-new-password"
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="At least 6 characters"
                          required
                          minLength={6}
                          autoFocus
                          className="form-input has-action"
                        />
                        <button
                          type="button"
                          className="form-password-toggle"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                        >
                          {showNewPassword ? <EyeOff className="toggle-eye-icon" /> : <Eye className="toggle-eye-icon" />}
                        </button>
                      </div>
                    </div>

                    <div className="form-field-group">
                      <label htmlFor="forgot-confirm-password" className="form-field-label">
                        Confirm New Password
                      </label>
                      <div className="form-input-box">
                        <LockKeyhole className="form-input-icon" aria-hidden="true" />
                        <input
                          id="forgot-confirm-password"
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter your new password"
                          required
                          minLength={6}
                          className="form-input has-action"
                        />
                        <button
                          type="button"
                          className="form-password-toggle"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                        >
                          {showConfirmPassword ? <EyeOff className="toggle-eye-icon" /> : <Eye className="toggle-eye-icon" />}
                        </button>
                      </div>
                    </div>

                    <div className="sheet-footer-action-row">
                      <button
                        type="button"
                        className="sheet-secondary-btn"
                        onClick={() => setForgotStep(2)}
                      >
                        <ArrowLeft className="w-4 h-4 mr-1 inline" /> Back
                      </button>
                      <button
                        type="submit"
                        disabled={forgotBusy || newPassword.length < 6 || newPassword !== confirmPassword}
                        className="sheet-primary-btn"
                      >
                        {forgotBusy ? (
                          <span className="btn-loading-flex">
                            <span className="spinner-dots" /> Updating...
                          </span>
                        ) : (
                          'Reset & Save Password'
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
