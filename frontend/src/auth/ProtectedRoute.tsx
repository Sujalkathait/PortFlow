import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth, type Role } from './AuthProvider';

export function ProtectedRoute({ role, children }: { role: Role; children: ReactNode }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <main className="page-loader" aria-live="polite">Loading your secure workspace…</main>;
  if (!user) return <Navigate to="/login" replace />;
  if (!profile) return <main className="page-loader" role="alert">Your account has no PortFlow role. Contact an administrator.</main>;
  if (profile.role !== role) return <Navigate to={profile.role === 'Admin' ? '/admin' : '/operator'} replace />;
  return <>{children}</>;
}
