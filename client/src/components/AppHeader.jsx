import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

export function AppHeader({ theme, onToggleTheme }) {
  return (
    <header className="app-header">
      <Logo variant="header" />
      <ThemeToggle theme={theme} onToggle={onToggleTheme} />
    </header>
  );
}
