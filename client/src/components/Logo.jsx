/**
 * Logotipo Bike Finder — mesmo simbolo em todo o lado (header, hero, loading, resultados).
 * O SVG usa classes CSS em App.css para adaptar a tema claro/escuro.
 */
export function Logo({ variant = "header" }) {
  return (
    <div className={`logo logo--${variant}`} aria-label="Bike Finder">
      <svg
        className="logo-mark-svg"
        viewBox="0 0 40 40"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
      >
        <rect className="logo-mark-backer" x="1.5" y="1.5" width="37" height="37" rx="10" ry="10" />
        <circle className="logo-mark-wheel" cx="12" cy="27.5" r="5" />
        <circle className="logo-mark-hub" cx="12" cy="27.5" r="1.6" />
        <circle className="logo-mark-wheel" cx="28" cy="27.5" r="5" />
        <circle className="logo-mark-hub" cx="28" cy="27.5" r="1.6" />
        <path
          className="logo-mark-body"
          d="M12 27.5 L17.5 16 Q19.5 14 22.5 14.5 L26.5 13 Q28.5 12.5 30 15 L28 27.5"
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          className="logo-mark-body"
          d="M26.5 13 L30 10.5 L31.5 12.5"
          fill="none"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          className="logo-mark-seat"
          d="M17.5 16 Q20.5 14.5 23.5 15"
          fill="none"
          strokeWidth="1.85"
          strokeLinecap="round"
        />
      </svg>
      <div className="logo-wordmark">
        <span className="logo-word-bike">Bike</span>
        <span className="logo-word-finder">Finder</span>
      </div>
    </div>
  );
}
