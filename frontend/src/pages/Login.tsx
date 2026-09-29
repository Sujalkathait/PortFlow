import { useState, type FormEvent } from 'react';
import { Eye, EyeOff, Lock, User, ShieldCheck, Ship, Box, Anchor, LineChart, ArrowRight, Cpu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth, type Role } from '../auth/AuthProvider';
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
    const [algo, setAlgo] = useState('FCFS');
    
    const [showPassword, setShowPassword] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const switchMode = (newMode: Mode) => {
        setMode(newMode);
        setError('');
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        const cleanEmail = email.trim().toLowerCase();
        if (!EMAIL_PATTERN.test(cleanEmail) && cleanEmail.length < 3) {
            setError('Please enter a valid email or username.');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
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
                profile = await login(cleanEmail, password);
            } else {
                profile = await register(cleanEmail, password, fullName.trim(), role);
            }
            
            // Set CPU Algorithm
            try {
                await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:10000'}/api/os/algorithm`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('portflow_auth_token')}`
                    },
                    body: JSON.stringify({ algorithm: algo })
                });
            } catch (e) {
                console.warn('Failed to set OS algorithm', e);
            }

            navigate(profile.role === 'Admin' ? '/admin' : '/operator', { replace: true });
        } catch (err: any) {
            setError(err.message || 'Authentication failed. Please verify your credentials.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="login-Cargo">
            <div className="login-left">
                <div className="login-overlay"></div>
                <div className="login-brand-top">
                    <div className="logo-area">
                        <img src="/image/primarylogo.png" alt="PortFlow" className="login-logo-img" />
                    </div>
                    <div className="login-nav">
                        <span>OPERATE</span> &bull; <span>MANAGE</span> &bull; <span>FLOW</span>
                    </div>
                </div>
                
                <div className="login-hero-text">
                    <h1>Smarter Port Operations<br/>for a <span className="highlight-cyan">Faster Tomorrow</span></h1>
                    <p>Manage ships, track cargo, coordinate operations<br/>and keep your port running smoothly — all in one place.</p>
                </div>

                <div className="login-features">
                    <div className="feature-item">
                        <Ship className="feature-icon" size={24} />
                        <p>Ship<br/>Management</p>
                    </div>
                    <div className="feature-item">
                        <Box className="feature-icon" size={24} />
                        <p>Cargo<br/>Operations</p>
                    </div>
                    <div className="feature-item">
                        <Anchor className="feature-icon" size={24} />
                        <p>Berth & Crane<br/>Scheduling</p>
                    </div>
                    <div className="feature-item">
                        <LineChart className="feature-icon" size={24} />
                        <p>Real-time<br/>Analytics</p>
                    </div>
                </div>
            </div>

            <div className="login-right">
                <div className="secure-badge-top">
                    <ShieldCheck size={16} /> Secure & Encrypted
                </div>

                <div className="login-form-wrapper">
                    <div className="login-header">
                        <h2>{mode === 'sign-in' ? 'Welcome back' : 'Create an Account'}</h2>
                        <p>{mode === 'sign-in' ? 'Sign in to your PortFlow account.' : 'Register to manage port operations.'}</p>
                    </div>
                    
                    <div className="auth-tabs">
                        <button 
                            type="button" 
                            className={`auth-tab ${mode === 'sign-in' ? 'active' : ''}`}
                            onClick={() => switchMode('sign-in')}
                        >
                            Sign In
                        </button>
                        <button 
                            type="button" 
                            className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
                            onClick={() => switchMode('register')}
                        >
                            Register
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} noValidate>
                        {mode === 'register' && (
                            <div className="input-group">
                                <label>Full Name</label>
                                <div className="input-with-icon">
                                    <User className="input-icon" size={18} />
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="e.g. John Doe"
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        <div className="input-group">
                            <label>Email or Username</label>
                            <div className="input-with-icon">
                                <User className="input-icon" size={18} />
                                <input
                                    type="text"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email or username"
                                    required
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label>Password</label>
                            <div className="input-with-icon">
                                <Lock className="input-icon" size={18} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    required
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {mode === 'register' && (
                            <div className="input-group">
                                <label>Operational Role</label>
                                <select 
                                    value={role} 
                                    onChange={(e) => setRole(e.target.value as Role)}
                                    className="login-select"
                                >
                                    <option value="Operator">Terminal Operator</option>
                                    <option value="Admin">Port Administrator</option>
                                </select>
                            </div>
                        )}

                        <div className="input-group">
                            <label>CPU Scheduling Algorithm</label>
                            <div className="input-with-icon">
                                <Cpu className="input-icon" size={18} />
                                <select 
                                    value={algo} 
                                    onChange={(e) => setAlgo(e.target.value)}
                                    className="login-select with-icon"
                                >
                                    <option value="FCFS">First-Come, First-Served (FCFS)</option>
                                    <option value="SJF">Shortest Job First (SJF)</option>
                                    <option value="PRIORITY">Priority Scheduling</option>
                                </select>
                            </div>
                        </div>

                        {error && <div className="login-error">{error}</div>}

                        <button type="submit" className="login-submit-btn" disabled={busy}>
                            <span>{busy ? 'Processing...' : mode === 'sign-in' ? 'Sign In' : 'Create Account'}</span>
                            {!busy && <ArrowRight size={18} />}
                        </button>
                    </form>

                    {mode === 'sign-in' && (
                        <div className="forgot-password">
                            <a href="#">Forgot password?</a>
                        </div>
                    )}
                </div>

                <div className="secure-badge-bottom">
                    <ShieldCheck size={16} /> Your data is safe with us
                </div>
            </div>
        </div>
    );
}

