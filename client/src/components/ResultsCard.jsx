import { Logo } from "./Logo";
import { RecommendationCard } from "./RecommendationCard";

const COMPARISON_METRICS = [
  { key: "brand", label: "Marca" },
  { key: "model", label: "Modelo" },
  { key: "year", label: "Ano" },
  { key: "displacement", label: "Cilindrada" },
  { key: "power", label: "Potencia" },
  { key: "comfort", label: "Conforto" },
  { key: "maintenance", label: "Manutencao" },
  { key: "consumption", label: "Consumo" }
];

export function ResultsCard({ top3, comparisonRows, imageByBikeId, onRestart, labels }) {
  const rows = comparisonRows?.length ? comparisonRows : top3.map((bike) => ({ id: bike.id, name: bike.name, specs: {} }));

  return (
    <div className="card results-panel">
      <div className="results-brand">
        <Logo variant="inline" />
      </div>
      <h2 className="results-title">{labels.recommendationTitle}</h2>
      <p className="results-subtitle">{labels.recommendationSubtitle}</p>

      <div className="recommendation-grid">
        {top3.map((bike, idx) => (
          <RecommendationCard key={bike.id} bike={bike} imageUrl={imageByBikeId[bike.id]} isTop={idx === 0} labels={labels} />
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
          {labels.technicalExplanation}
        </h3>
        <div className="comparison-table-wrap">
          <table className="comparison-table">
            <thead>
              <tr>
                <th scope="col">Metrica</th>
                {rows.map((bike) => (
                  <th key={bike.id} scope="col">
                    {bike.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON_METRICS.map((metric) => (
                <tr key={metric.key}>
                  <th scope="row">{metric.label}</th>
                  {rows.map((bike) => (
                    <td key={`${bike.id}-${metric.key}`}>{bike?.specs?.[metric.key] || "n/d"}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <button type="button" className="btn primary btn-wide" onClick={onRestart}>
        {labels.restartQuiz}
      </button>
    </div>
  );
}
