import { Logo } from "./Logo";

export function HeroBlock() {
  return (
    <section className="hero hero--rich">
      <Logo variant="hero" />
      <div className="hero-copy">
        <h1 className="hero-title">Descobre a tua mota ideal</h1>
        <p className="hero-lead">
          Responde a um questionario rapido e recebe 1 recomendacao principal e 2 alternativas com contexto tecnico.
        </p>
      </div>
    </section>
  );
}
