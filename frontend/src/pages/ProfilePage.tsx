import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthProvider';
import { api } from '@/lib/api';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  User, Mail, Shield, Trash2, AlertTriangle,
  CheckCircle2, ArrowLeft, LogOut
} from 'lucide-react';

export function ProfilePage() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fullName = profile?.full_name || 'Portflow User';
  const email = profile?.email || 'user@portflow.com';
  const initial = fullName.charAt(0).toUpperCase();
  const basePath = '/operator';

  const handleDeleteAccount = async () => {
    setBusy(true);
    setError('');
    try {
      await api.auth.deleteAccount();
      setSuccess('Account deleted successfully. Redirecting to login…');
      setTimeout(async () => {
        await signOut();
        navigate('/login', { replace: true });
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to delete account. Please try again.');
      setBusy(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`${basePath}/dashboard`)}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Button>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
          Profile Settings
        </span>
      </div>

      {/* Profile Overview Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 border-2 border-primary/20 text-primary flex items-center justify-center font-bold text-2xl shadow-sm">
                {initial}
              </div>
              <div>
                <CardTitle className="text-xl font-bold">{fullName}</CardTitle>
                <CardDescription className="text-sm mt-0.5">{email}</CardDescription>
                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/30">
                    <Shield className="w-3 h-3" />
                    Terminal Operator
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Active Account
                  </span>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await signOut();
                navigate('/login', { replace: true });
              }}
              className="gap-2 text-muted-foreground hover:text-destructive hover:border-destructive/30"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-2 border-t">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border">
              <User className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground font-medium">Full Name</div>
                <div className="text-sm font-semibold text-foreground">{fullName}</div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border">
              <Mail className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground font-medium">Work Email</div>
                <div className="text-sm font-semibold text-foreground">{email}</div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border">
              <Shield className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground font-medium">Assigned Role</div>
                <div className="text-sm font-semibold text-foreground">
                  Terminal Operator
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground font-medium">Security Level</div>
                <div className="text-sm font-semibold text-foreground">256-bit JWT Authenticated</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone: Delete Account */}
      <Card className="border-destructive/30 dark:border-destructive/40 bg-destructive/5 dark:bg-destructive/10">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 text-destructive font-semibold">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <CardTitle className="text-base text-destructive">Delete Account</CardTitle>
          </div>
          <CardDescription className="text-xs sm:text-sm text-destructive/80">
            Permanently remove your PortFlow operator profile and revoke terminal credentials.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-sm font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {!confirmDelete ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-destructive/20">
              <div className="text-xs text-muted-foreground">
                Once deleted, you will need a new registration to regain access.
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setConfirmDelete(true)}
                className="gap-2 shrink-0 font-semibold"
              >
                <Trash2 className="w-4 h-4" />
                Delete Account
              </Button>
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-destructive/40 bg-background/95 dark:bg-card/95 space-y-3 shadow-md">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-bold text-foreground">Confirm Account Deletion</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Are you absolutely sure you want to delete account <strong>{email}</strong>? This action cannot be undone.
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmDelete(false)}
                  disabled={busy}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteAccount}
                  disabled={busy}
                  className="gap-2 font-bold"
                >
                  {busy ? 'Deleting…' : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Yes, Delete My Account
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
