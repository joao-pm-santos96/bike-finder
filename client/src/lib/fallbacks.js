function motoPlaceholder(label, accent = "265ef7") {
  const svg = `
<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='700' viewBox='0 0 1200 700'>
  <defs>
    <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
      <stop offset='0%' stop-color='#0f172a'/>
      <stop offset='100%' stop-color='#111827'/>
    </linearGradient>
  </defs>
  <rect width='1200' height='700' fill='url(#g)'/>
  <circle cx='360' cy='500' r='90' fill='none' stroke='#e5e7eb' stroke-width='16'/>
  <circle cx='840' cy='500' r='90' fill='none' stroke='#e5e7eb' stroke-width='16'/>
  <path d='M360 500 L500 370 L710 370 L840 500' fill='none' stroke='#e5e7eb' stroke-width='16' stroke-linecap='round'/>
  <path d='M510 365 L600 300 L690 365' fill='none' stroke='#${accent}' stroke-width='14' stroke-linecap='round'/>
  <rect x='520' y='320' width='150' height='34' rx='10' fill='#${accent}'/>
  <text x='600' y='110' text-anchor='middle' fill='#f9fafb' font-size='52' font-family='Arial, sans-serif' font-weight='700'>${label}</text>
  <text x='600' y='165' text-anchor='middle' fill='#cbd5e1' font-size='28' font-family='Arial, sans-serif'>Imagem de fallback (mota)</text>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const localFallbackImages = {
  scooter: [motoPlaceholder("Scooter", "22c55e")],
  naked: [motoPlaceholder("Naked", "3b82f6")],
  trail: [motoPlaceholder("Trail", "f59e0b")],
  "sport-touring": [motoPlaceholder("Sport Touring", "ef4444")],
  default: [motoPlaceholder("Mota", "8b5cf6")]
};

export function buildFallbackExplanation(top3, profile, reasoning) {
  const main = top3?.[0];
  const alt1 = top3?.[1];
  const alt2 = top3?.[2];

  if (!main) {
    return "Nao foi possivel gerar explicacao detalhada neste momento.";
  }

  const primaryReasons = (reasoning?.[main.id] || []).slice(0, 2).join(" e ");
  const preference = profile?.priority || "equilibrio geral";

  return [
    `${main.name} destaca-se para o teu perfil porque combina melhor com o teu uso ${profile.usage} e com a prioridade em ${preference}. ${primaryReasons ? `Os pontos mais fortes foram ${primaryReasons}.` : ""}`,
    alt1
      ? `- Alternativa: ${alt1.name} pode ser uma opcao valida se valorizares um compromisso diferente entre custo, conforto e desempenho.`
      : "",
    alt2
      ? `- Alternativa: ${alt2.name} e uma boa segunda via para um perfil semelhante ao teu, mantendo boa versatilidade.`
      : ""
  ]
    .filter(Boolean)
    .join("\n");
}
