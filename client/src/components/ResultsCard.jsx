import { Logo } from "./Logo";
import { RecommendationCard } from "./RecommendationCard";

export function ResultsCard({ top3, explanationText, imageByBikeId, onRestart }) {
  return (
    <div className="card results-panel">
      <div className="results-brand">
        <Logo variant="inline" />
      </div>
      <h2 className="results-title">A tua recomendacao</h2>
      <p className="results-subtitle">Resultado gerado pelo motor interno de scoring.</p>

      <div className="recommendation-grid">
        {top3.map((bike, idx) => (
          <RecommendationCard key={bike.id} bike={bike} imageUrl={imageByBikeId[bike.id]} isTop={idx === 0} />
        ))}
      </div>

      <div className="explanation">
        <h3 className="explanation-title">
          <span className="explanation-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" focusable="false">
              <path
                fill="currentColor"
                d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm-1 2 5 5h-5V4ZM8 12h8v2H8v-2Zm0 4h8v2H8v-2Zm0-8h3v2H8V8Z"
              />
            </svg>
          </span>
          Explicacao tecnica
        </h3>
        <pre className="explanation-body">{explanationText}</pre>
      </div>

      <button type="button" className="btn primary btn-wide" onClick={onRestart}>
        Refazer questionario
      </button>
    </div>
  );
}
