function normalizeValue(value, maxValue = 5) {
  return Math.max(0, Math.min(1, value / maxValue));
}

function scoreBudget(profileBudget, bikeBudget, priceScale) {
  const user = priceScale[profileBudget] || 2;
  const bike = priceScale[bikeBudget] || 2;
  const diff = Math.abs(user - bike);

  if (diff === 0) return 1;
  if (diff === 1) return 0.55;
  return 0.15;
}

function scorePower(experience, bikePower, config) {
  const target = config.experienceTargetPower[experience] || "media";
  const targetValue = config.powerScale[target] || 2;
  const bikeValue = config.powerScale[bikePower] || 2;
  const diff = Math.abs(targetValue - bikeValue);

  if (diff === 0) return 1;
  if (diff === 1) return 0.6;
  return 0.2;
}

function scorePriority(priority, bike, config) {
  const weights = config.priorityWeights[priority];
  if (!weights) return 0.5;

  let weighted = 0;
  let sum = 0;

  Object.entries(weights).forEach(([key, value]) => {
    if (key === "powerLevel") {
      weighted += normalizeValue(config.powerScale[bike.powerLevel] || 2, 3) * value;
    } else {
      weighted += normalizeValue(bike[key] || 0, 5) * value;
    }
    sum += value;
  });

  return sum > 0 ? weighted / sum : 0.5;
}

function buildReasoning(profile, bike, subScores) {
  const reasons = [];
  if (subScores.usage > 0.8) reasons.push("bom encaixe no tipo de utilizacao");
  if (subScores.budget > 0.8) reasons.push("orcamento bem alinhado");
  if (subScores.experience > 0.8) reasons.push("adequada ao teu nivel de experiencia");
  if (profile.style !== "indiferente" && subScores.style > 0.8) reasons.push("estilo preferido respeitado");
  if (subScores.priority > 0.8) reasons.push(`forte na prioridade ${profile.priority}`);
  if (!reasons.length) reasons.push("equilibrio geral para o teu perfil");
  return reasons;
}

export function rankMotorcycles(profile, motorcycles, config) {
  const scored = motorcycles.map((bike) => {
    const usage = bike.usage.includes(profile.usage) ? 1 : 0.35;
    const budget = scoreBudget(profile.budget, bike.priceRange, config.priceScale);
    const experience = scorePower(profile.experience, bike.powerLevel, config);
    const style = profile.style === "indiferente" ? 0.7 : bike.category === profile.style ? 1 : 0.3;
    const priority = scorePriority(profile.priority, bike, config);

    const subScores = { usage, budget, experience, style, priority };
    const total =
      usage * config.weights.usageMatch +
      budget * config.weights.budgetMatch +
      experience * config.weights.experienceMatch +
      style * config.weights.styleMatch +
      priority * config.weights.priorityFit;

    return {
      ...bike,
      score: Number(total.toFixed(2)),
      reasons: buildReasoning(profile, bike, subScores)
    };
  });

  const top3 = scored.sort((a, b) => b.score - a.score).slice(0, 3);
  const reasoningMap = Object.fromEntries(top3.map((item) => [item.id, item.reasons]));

  return { top3, reasoningMap };
}
