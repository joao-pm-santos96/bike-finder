export function RecommendationCard({ bike, imageUrl, isTop }) {
  return (
    <article className={`bike-card ${isTop ? "top" : ""}`}>
      <div className="badge">{isTop ? "Recomendacao principal" : "Alternativa"}</div>
      <img src={imageUrl} alt={bike.name} loading="lazy" />
      <h3>{bike.name}</h3>
      <p className="meta">{`Categoria: ${bike.category}`}</p>
      <p className="meta">{`Orcamento: ${bike.priceRange}`}</p>
      <p className="meta">{`Score interno: ${bike.score}`}</p>
    </article>
  );
}
