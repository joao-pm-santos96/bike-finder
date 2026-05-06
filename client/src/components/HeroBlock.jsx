import { Logo } from "./Logo";

export function HeroBlock({ labels }) {
  return (
    <section className="hero hero--rich">
      <Logo variant="hero" />
      <div className="hero-copy">
        <h1 className="hero-title">{labels.heroTitle}</h1>
        <p className="hero-lead">{labels.heroLead}</p>
      </div>
    </section>
  );
}
