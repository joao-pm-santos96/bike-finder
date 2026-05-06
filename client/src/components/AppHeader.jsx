import { useState } from "react";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { SUPPORTED_LANGUAGES } from "../i18n";

const FLAG_BY_LANGUAGE = {
  pt: "https://flagcdn.com/w20/pt.png",
  en: "https://flagcdn.com/w20/us.png",
  es: "https://flagcdn.com/w20/es.png"
};

export function AppHeader({ theme, onToggleTheme, language, onLanguageChange, labels }) {
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);

  const handleLanguageChange = (lang) => {
    onLanguageChange(lang);
    setIsLanguageMenuOpen(false);
  };

  return (
    <header className="app-header">
      <Logo variant="header" />
      <div className="header-controls">
        <div
          className="language-select-wrap"
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              setIsLanguageMenuOpen(false);
            }
          }}
        >
          <button
            type="button"
            className="language-select"
            onClick={() => setIsLanguageMenuOpen((value) => !value)}
            aria-expanded={isLanguageMenuOpen}
            aria-label={labels.languageSelectorLabel}
          >
            <img className="language-flag" src={FLAG_BY_LANGUAGE[language]} alt="" aria-hidden="true" />
            <span>{language.toUpperCase()}</span>
            <svg className="language-caret" viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false">
              <path d="M5.5 7.5 10 12l4.5-4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {isLanguageMenuOpen ? (
            <div className="language-menu" role="menu">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  className={`language-menu-item ${language === lang ? "is-active" : ""}`}
                  onClick={() => handleLanguageChange(lang)}
                  role="menuitem"
                >
                  <img className="language-flag" src={FLAG_BY_LANGUAGE[lang]} alt="" aria-hidden="true" />
                  <span>{lang.toUpperCase()}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} labels={labels} />
      </div>
    </header>
  );
}
