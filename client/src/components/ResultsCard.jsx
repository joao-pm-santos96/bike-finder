import { RecommendationCard } from "./RecommendationCard";

export function ResultsCard({ top3, explanationText, imageByBikeId, onRestart }) {
  return (
    <div className="card">
      <h2>A tua recomendacao</h2>
      <p>Resultado gerado pelo motor interno de scoring.</p>

      <div className="recommendation-grid">
        {top3.map((bike, idx) => (
          <RecommendationCard key={bike.id} bike={bike} imageUrl={imageByBikeId[bike.id]} isTop={idx === 0} />
        ))}
      </div>

      <div className="explanation">
        <h3>Explicacao</h3>
        <pre>{explanationText}</pre>
      </div>

      <button type="button" className="btn primary" onClick={onRestart}>
        Refazer questionario
      </button>
    </div>
  );
}
