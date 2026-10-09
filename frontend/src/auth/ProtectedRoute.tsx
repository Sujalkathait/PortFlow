import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth, type Role } from './AuthProvider';

export function ProtectedRoute({ children }: { role?: Role; children: ReactNode }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <main className="page-loader" aria-live="polite">Loading your secure workspace…</main>;
  if (!user) return <Navigate to="/login" replace />;
  if (!profile) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
