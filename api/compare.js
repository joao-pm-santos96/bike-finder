const fs = require("fs");
const path = require("path");

const BIKESPECS_API_BASE_URL = process.env.BIKESPECS_API_BASE_URL || "https://www.bikespecs.org/api/v1";
const localComparisonSpecsPath = path.join(process.cwd(), "client", "public", "data", "comparison-specs.json");

function getBrandAndModelFromName(name) {
  const tokens = (name || "").trim().split(/\s+/).filter(Boolean);
  if (tokens.length < 2) return { brand: "", model: name || "" };
  return { brand: tokens[0], model: tokens.slice(1).join(" ") };
}

function toApiSearchUrl(query, brand) {
  const url = new URL(`${BIKESPECS_API_BASE_URL}/search`);
  url.searchParams.set("q", query);
  url.searchParams.set("per_page", "20");
  if (brand) url.searchParams.set("brand", brand);
  return url.toString();
}

function loadLocalComparisonSpecs() {
  try {
    if (!fs.existsSync(localComparisonSpecsPath)) return {};
    const raw = fs.readFileSync(localComparisonSpecsPath, "utf-8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (_error) {
    return {};
  }
}

const LOCAL_COMPARISON_SPECS = loadLocalComparisonSpecs();

function normalizeText(value) {
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeCompact(value) {
  return normalizeText(value).replace(/[\s-]+/g, "");
}

function createNameVariants(value) {
  const text = (value || "").trim();
  if (!text) return [];
  const clean = normalizeText(text);
  const noSeparators = clean.replace(/[\s-]+/g, "");
  const splitAlphaNum = clean.replace(/([a-z])(\d)/g, "$1 $2").replace(/(\d)([a-z])/g, "$1 $2");
  const joinAlphaNum = clean.replace(/([a-z])\s+(\d)/g, "$1$2").replace(/(\d)\s+([a-z])/g, "$1$2");
  return [...new Set([text, clean, noSeparators, splitAlphaNum, joinAlphaNum].filter(Boolean))];
}

function toSearchQueries(bike) {
  const { brand, model } = getBrandAndModelFromName(bike.name || "");
  const aliases = Array.isArray(bike.aliases) ? bike.aliases : [];
  const raw = [bike.name, model, ...aliases];
  return {
    brand,
    model,
    queries: [...new Set(raw.flatMap((item) => createNameVariants(item)).filter(Boolean))]
  };
}

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];
  return [value];
}

function extractCandidateList(payload) {
  const direct = [
    ...toArray(payload?.data),
    ...toArray(payload?.results),
    ...toArray(payload?.items),
    ...toArray(payload?.bikes),
    ...toArray(payload)
  ];

  return direct.filter((item) => item && typeof item === "object");
}

function findNestedValue(obj, keywords) {
  if (!obj || typeof obj !== "object") return "";

  const normalizedKeywords = keywords.map((keyword) => normalizeText(keyword));
  const stack = [obj];

  while (stack.length) {
    const current = stack.pop();
    if (!current || typeof current !== "object") continue;

    for (const [key, value] of Object.entries(current)) {
      const normalizedKey = normalizeText(key);
      if (normalizedKeywords.every((keyword) => normalizedKey.includes(keyword)) && value) {
        return String(value);
      }
      if (value && typeof value === "object") stack.push(value);
    }
  }

  return "";
}

function pickFirstNonEmpty(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== "") return String(value).trim();
  }
  return "";
}

function normalizeCandidateSpecs(candidate) {
  const brand = pickFirstNonEmpty(candidate?.brand, candidate?.make, candidate?.manufacturer);
  const model = pickFirstNonEmpty(candidate?.model, candidate?.fullModelName, candidate?.name, candidate?.title);
  const year = pickFirstNonEmpty(candidate?.year, candidate?.modelYear, candidate?.productionYear, findNestedValue(candidate, ["year"]));
  const displacement = pickFirstNonEmpty(
    candidate?.engineSize,
    candidate?.engine_size,
    candidate?.displacement,
    candidate?.cc,
    findNestedValue(candidate, ["engine", "displacement"]),
    findNestedValue(candidate, ["displacement"])
  );
  const power = pickFirstNonEmpty(
    candidate?.power,
    candidate?.horsepower,
    candidate?.hp,
    findNestedValue(candidate, ["engine", "power"]),
    findNestedValue(candidate, ["power"]),
    findNestedValue(candidate, ["output"])
  );

  return {
    brand: brand || "n/d",
    model: model || "n/d",
    year: year || "n/d",
    displacement: displacement || "n/d",
    power: power || "n/d"
  };
}

function scoreCandidate(targetName, targetBrand, targetModel, candidateSpecs) {
  const targetCompact = normalizeCompact(targetName);
  const targetBrandCompact = normalizeCompact(targetBrand);
  const targetModelCompact = normalizeCompact(targetModel);
  const candidateBrandCompact = normalizeCompact(candidateSpecs.brand);
  const candidateModelCompact = normalizeCompact(candidateSpecs.model);
  const candidateFullCompact = normalizeCompact(`${candidateSpecs.brand} ${candidateSpecs.model}`);

  if (!candidateModelCompact && !candidateFullCompact) return 0;

  let score = 0;
  if (targetCompact && candidateFullCompact === targetCompact) score += 1000;
  if (targetCompact && (candidateFullCompact.includes(targetCompact) || targetCompact.includes(candidateFullCompact))) score += 500;

  if (targetBrandCompact && candidateBrandCompact) {
    if (targetBrandCompact === candidateBrandCompact) score += 250;
    else score -= 350;
  }

  if (targetModelCompact && candidateModelCompact) {
    if (targetModelCompact === candidateModelCompact) score += 400;
    else if (candidateModelCompact.includes(targetModelCompact) || targetModelCompact.includes(candidateModelCompact)) score += 240;
  }

  const targetTokens = normalizeText(targetModel).split(" ").filter((token) => token.length >= 2);
  const modelTokens = new Set(normalizeText(candidateSpecs.model).split(" ").filter((token) => token.length >= 2));
  const overlap = targetTokens.filter((token) => modelTokens.has(token)).length;
  score += overlap * 80;

  return score;
}

function hasGoodModelOverlap(targetModel, candidateModel) {
  const targetTokens = normalizeText(targetModel).split(" ").filter((token) => token.length >= 2);
  if (!targetTokens.length) return true;
  const modelTokens = new Set(normalizeText(candidateModel).split(" ").filter((token) => token.length >= 2));
  const overlap = targetTokens.filter((token) => modelTokens.has(token)).length;
  return overlap >= 1;
}

function normalizeFallbackSpecs(specs = {}) {
  return {
    brand: specs.brand || "n/d",
    model: specs.model || "n/d",
    year: specs.year || "n/d",
    displacement: specs.displacement || "n/d",
    power: specs.power || "n/d",
    comfort: specs.comfort || "n/d",
    maintenance: specs.maintenance || "n/d",
    consumption: specs.consumption || "n/d"
  };
}

function getLocalFallbackSpecs(bike) {
  return normalizeFallbackSpecs(LOCAL_COMPARISON_SPECS[bike.id] || {});
}

function fromScale(value) {
  return Number.isFinite(value) ? `${value}/5` : "n/d";
}

function getStableMetricsFromBike(bike = {}) {
  return {
    comfort: fromScale(bike.comfortLevel),
    maintenance: fromScale(bike.maintenanceLevel),
    consumption: fromScale(bike.consumptionLevel)
  };
}

function withStableMetrics(specs, bike) {
  const stable = getStableMetricsFromBike(bike);
  return {
    ...specs,
    comfort: specs?.comfort && specs.comfort !== "n/d" ? specs.comfort : stable.comfort,
    maintenance: specs?.maintenance && specs.maintenance !== "n/d" ? specs.maintenance : stable.maintenance,
    consumption: specs?.consumption && specs.consumption !== "n/d" ? specs.consumption : stable.consumption
  };
}

async function fetchJsonWithTimeout(url, timeoutMs = 4500) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) return null;
    return response.json();
  } catch (_error) {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchBestApiSpecs(bike) {
  const { brand, model, queries } = toSearchQueries(bike);
  const scoredCandidates = [];

  for (const query of queries) {
    const urls = [toApiSearchUrl(query, brand), toApiSearchUrl(query, "")];
    for (const url of urls) {
      const payload = await fetchJsonWithTimeout(url);
      if (!payload) continue;

      const candidates = extractCandidateList(payload);
      for (const candidate of candidates) {
        const specs = normalizeCandidateSpecs(candidate);
        const score = scoreCandidate(bike.name || "", brand, model, specs);
        scoredCandidates.push({ specs, score });
      }
    }
  }

  if (!scoredCandidates.length) return null;

  scoredCandidates.sort((a, b) => b.score - a.score);
  const best = scoredCandidates[0];
  const brandOk =
    !normalizeCompact(brand) ||
    !normalizeCompact(best.specs.brand) ||
    normalizeCompact(brand) === normalizeCompact(best.specs.brand);
  const modelOk = hasGoodModelOverlap(model || bike.name || "", best.specs.model);

  if (best.score < 220 || !brandOk || !modelOk) return null;
  return best.specs;
}

function toComparisonLine(result) {
  return [
    `${result.name}:`,
    `marca ${result.specs.brand}`,
    `modelo ${result.specs.model}`,
    `ano ${result.specs.year}`,
    `cilindrada ${result.specs.displacement}`,
    `potencia ${result.specs.power}`,
    `conforto ${result.specs.comfort}`,
    `manutencao ${result.specs.maintenance}`,
    `consumo ${result.specs.consumption}`
  ].join(" | ");
}

function buildComparisonText(items) {
  const lines = ["Comparador tecnico:", ...items.map((item) => `- ${toComparisonLine(item)}`)];
  return lines.join("\n");
}

function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch (_error) {
      return {};
    }
  }
  return {};
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { top3 } = readBody(req);
  const selected = Array.isArray(top3) ? top3.slice(0, 3) : [];

  if (!selected.length) {
    return res.status(400).json({ text: "", fallback: true, reason: "missing_bikes" });
  }

  try {
    const results = await Promise.all(
      selected.map(async (bike) => {
        const apiSpecs = await fetchBestApiSpecs(bike);
        if (apiSpecs) return { id: bike.id, name: bike.name, specs: withStableMetrics(apiSpecs, bike), source: "bikespecs" };

        const localSpecs = getLocalFallbackSpecs(bike);
        if (Object.values(localSpecs).some((value) => value !== "n/d")) {
          return { id: bike.id, name: bike.name, specs: withStableMetrics(localSpecs, bike), source: "local_catalog" };
        }
        return {
          id: bike.id,
          name: bike.name,
          specs: withStableMetrics(normalizeFallbackSpecs(), bike),
          source: "fallback"
        };
      })
    );

    return res.json({
      text: buildComparisonText(results),
      fallback: results.every((item) => item.source === "fallback"),
      reason: "ok",
      comparisons: results
    });
  } catch (_error) {
    return res.status(200).json({
      text: "",
      fallback: true,
      reason: "bikespecs_api_unreachable",
      comparisons: []
    });
  }
};
