export function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={onToggle}
      aria-pressed={isDark}
      aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
    >
      {isDark ? (
        <svg className="theme-toggle-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 18a6 6 0 1 1 0-12 6 6 0 0 1 0 12Zm0-16a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0V3a1 1 0 0 1 1-1Zm0 18a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0v-1a1 1 0 0 1 1-1ZM4.22 4.22a1 1 0 0 1 1.42 0l.7.7a1 1 0 0 1-1.42 1.42l-.7-.7a1 1 0 0 1 0-1.42Zm12.02 12.02a1 1 0 0 1 1.42 0l.7.7a1 1 0 1 1-1.42 1.42l-.7-.7a1 1 0 0 1 0-1.42ZM21 11a1 1 0 1 1 0 2h-1a1 1 0 1 1 0-2h1ZM4 11a1 1 0 1 1 0 2H3a1 1 0 1 1 0-2h1Zm14.08-6.86a1 1 0 0 1 0 1.42l-.7.7a1 1 0 1 1-1.42-1.42l.7-.7a1 1 0 0 1 1.42 0ZM7.64 16.64a1 1 0 0 1 0 1.42l-.7.7a1 1 0 1 1-1.42-1.42l.7-.7a1 1 0 0 1 1.42 0Z"
          />
        </svg>
      ) : (
        <svg className="theme-toggle-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path
            fill="currentColor"
            d="M21.64 13a9 9 0 1 1-11.64-11 7 7 0 0 0 11.64 11ZM12 3a1 1 0 0 0-1 1v1a1 1 0 1 0 2 0V4a1 1 0 0 0-1-1Zm-6.36 1.05a1 1 0 0 0-1.42 1.42l.7.7a1 1 0 0 0 1.42-1.42l-.7-.7ZM3 11a1 1 0 1 0 0 2h1a1 1 0 1 0 0-2H3Zm2.05 6.36a1 1 0 0 0 1.42 1.42l.7-.7a1 1 0 1 0-1.42-1.42l-.7.7ZM12 19a1 1 0 0 0-1 1v1a1 1 0 1 0 2 0v-1a1 1 0 0 0-1-1Zm6.36-1.05a1 1 0 0 0-1.42-1.42l-.7.7a1 1 0 1 0 1.42 1.42l.7-.7ZM19 11h1a1 1 0 1 0 0-2h-1a1 1 0 1 0 0 2Zm-1.05-6.36a1 1 0 0 0-1.42 0l-.7.7a1 1 0 0 0 1.42 1.42l.7-.7a1 1 0 0 0 0-1.42Z"
          />
        </svg>
      )}
    </button>
  );
}
