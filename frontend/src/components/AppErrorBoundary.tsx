import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props = { children: ReactNode };
type State = { hasError: boolean };

/** Provides a clear recovery path if a page-level render fails. */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // The API remains the source of operational diagnostics; do not expose errors to users here.
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="grid min-h-svh place-items-center bg-muted/30 p-6" role="alert">
          <section className="w-full max-w-md rounded-xl border bg-card p-6 text-center shadow-sm">
            <div className="mx-auto mb-4 grid size-11 place-items-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle aria-hidden="true" className="size-5" />
            </div>
            <h1 className="text-lg font-semibold">This workspace section could not load</h1>
            <p className="mt-2 text-sm text-muted-foreground">Your data has not been changed. Reload to try again.</p>
            <Button className="mt-5" onClick={() => window.location.reload()}>
              <RefreshCw aria-hidden="true" /> Reload workspace
            </Button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
