import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ThemeToggleProps = { dark: boolean; onToggle: () => void };

/** Toggles the token-based light and dark palettes without changing application state. */
export function ThemeToggle({ dark, onToggle }: ThemeToggleProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      type="button"
      onClick={onToggle}
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={dark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {dark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
    </Button>
  );
}
