import { useState } from "react";

export function RecommendationCard({ bike, imageUrl, isTop, labels }) {
  const [imgReady, setImgReady] = useState(false);

  return (
    <article className={`bike-card ${isTop ? "bike-card--main top" : "bike-card--alt"}`}>
      <div className="badge">{isTop ? labels.primaryRecommendation : labels.alternative}</div>
      <figure className="bike-card-figure">
        {!imgReady ? <div className="bike-card-img-skeleton shimmer" aria-hidden="true" /> : null}
        <img
          src={imageUrl}
          alt={bike.name}
          loading="lazy"
          className={imgReady ? "img-ready" : "img-loading"}
          onLoad={() => setImgReady(true)}
          onError={() => setImgReady(true)}
        />
      </figure>
      <h3>{bike.name}</h3>
      <p className="meta">{`${labels.category}: ${bike.category}`}</p>
      <p className="meta">{`${labels.budget}: ${bike.priceRange}`}</p>
      <p className="meta">{`${labels.internalScore}: ${bike.score}`}</p>
    </article>
  );
}
