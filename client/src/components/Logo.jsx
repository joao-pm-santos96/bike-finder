import { useId } from "react";

/**
 * Logotipo Bike Finder — mesmo simbolo em todo o lado (header, hero, loading, resultados).
 * O SVG usa classes CSS em App.css para adaptar a tema claro/escuro.
 */
export function Logo({ variant = "header" }) {
  const gradientId = useId();

  return (
    <div className={`logo logo--${variant}`} aria-label="Bike Finder">
      <svg
        className="logo-mark-svg"
        viewBox="0 0 48 48"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient id={gradientId} x1="8" y1="5" x2="40" y2="43" gradientUnits="userSpaceOnUse">
            <stop className="logo-mark-gradient-start" offset="0" />
            <stop className="logo-mark-gradient-end" offset="1" />
          </linearGradient>
        </defs>
        <rect className="logo-mark-backer" fill={`url(#${gradientId})`} x="3" y="3" width="42" height="42" rx="15" ry="15" />
        <path className="logo-mark-glow" d="M12 10C20 3 34 4 39 14C32 12 24 13 18 19C13 23 10 31 11 39C2 32 4 17 12 10Z" />
        <circle className="logo-mark-wheel" cx="15" cy="31" r="6.5" />
        <circle className="logo-mark-wheel" cx="33" cy="31" r="6.5" />
        <circle className="logo-mark-hub" cx="15" cy="31" r="2" />
        <circle className="logo-mark-hub" cx="33" cy="31" r="2" />
        <path
          className="logo-mark-body"
          d="M15 31 L20.5 20.5 Q21.5 18.5 24.5 18.5 L28 18.5 L33 31 M20.5 20.5 L28 18.5 L25 31 L15 31"
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          className="logo-mark-body"
          d="M28 18.5 L33.5 14.5 L36.5 18"
          fill="none"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          className="logo-mark-seat"
          d="M21 18.5 L25.5 15.5"
          fill="none"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          className="logo-mark-finder"
          d="M35.5 8.5C38.3 8.5 40.5 10.7 40.5 13.5C40.5 17.2 35.5 21.5 35.5 21.5C35.5 21.5 30.5 17.2 30.5 13.5C30.5 10.7 32.7 8.5 35.5 8.5Z"
        />
        <circle className="logo-mark-finder-dot" cx="35.5" cy="13.5" r="1.5" />
      </svg>
      <div className="logo-wordmark">
        <span className="logo-word-bike">Bike</span>
        <span className="logo-word-finder">Finder</span>
      </div>
    </div>
  );
}
