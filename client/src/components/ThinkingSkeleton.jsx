export function ThinkingSkeleton({ bikes }) {
  const items = bikes?.length ? bikes : [null, null, null];
  return (
    <div className="thinking-skeleton-grid" aria-busy="true" aria-label="A carregar recomendacoes">
      {items.map((bike, idx) => (
        <div
          key={bike?.id ?? idx}
          className={`skeleton-card ${idx === 0 ? "skeleton-card--main" : "skeleton-card--alt"}`}
        >
          <div className="skeleton-badge shimmer" />
          <div className="skeleton-image shimmer" />
          <div className="skeleton-line skeleton-line--title shimmer" />
          <div className="skeleton-line shimmer" />
          <div className="skeleton-line skeleton-line--short shimmer" />
        </div>
      ))}
    </div>
  );
}
