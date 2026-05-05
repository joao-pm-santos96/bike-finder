require("dotenv").config({ override: true });
const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const clientDistPath = path.join(__dirname, "client", "dist");
const clientDistIndexPath = path.join(clientDistPath, "index.html");

const PEXELS_API_KEY = process.env.PEXELS_API_KEY || "";
const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_MODEL = "llama-3.3-70b-versatile";
const GROQ_MODEL_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MAX_OUTPUT_TOKENS = 700;
const GROQ_MAX_RETRIES = 2;
const GROQ_RETRY_BASE_DELAY_MS = 500;
const RATE_WINDOW_MS = 60 * 1000;
const RATE_MAX = 30;
const ipCounters = new Map();

app.use(express.json({ limit: "1mb" }));
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
}

function rateLimit(req, res, next) {
  const key = req.ip || req.headers["x-forwarded-for"] || "local";
  const now = Date.now();
  const existing = ipCounters.get(key);

  if (!existing || now > existing.resetAt) {
    ipCounters.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return next();
  }

  if (existing.count >= RATE_MAX) {
    return res.status(429).json({ error: "Demasiados pedidos. Tenta novamente em breve." });
  }

  existing.count += 1;
  return next();
}

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/images", rateLimit, async (req, res) => {
  const query = (req.query.query || "motorcycle").toString().trim();

  if (!PEXELS_API_KEY) {
    return res.status(200).json({ photos: [], fallback: true, reason: "missing_pexels_api_key" });
  }

  try {
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
      {
        headers: {
          Authorization: PEXELS_API_KEY
        }
      }
    );

    if (!response.ok) {
      return res.status(200).json({ photos: [], fallback: true, reason: "image_api_error" });
    }

    const data = await response.json();
    const first = (data.photos || [])[0];
    if (first?.src?.large || first?.src?.medium) {
      return res.json({
        photos: [
          {
            id: first.id,
            alt: first.alt || "Moto",
            src: first.src?.large || first.src?.medium || "",
            photographer: first.photographer || "",
            photographerUrl: first.photographer_url || ""
          }
        ],
        fallback: false,
        reason: "ok"
      });
    }

    return res.json({
      photos: [],
      fallback: true,
      reason: "no_valid_motorcycle_images"
    });
  } catch (_error) {
    return res.status(200).json({ photos: [], fallback: true, reason: "image_api_unreachable" });
  }
});

app.post("/api/explain", rateLimit, async (req, res) => {
  const { profile, top3, reasoning } = req.body || {};

  if (!GROQ_API_KEY) {
    return res.status(200).json({ text: "", fallback: true, reason: "missing_groq_api_key" });
  }

  const variationSeed = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const prompt = [
    "Escreve uma explicacao em portugues de Portugal, com tom tecnico, claro e objetivo.",
    "Fala diretamente para o utilizador (trata por 'tu'), sem linguagem comercial.",
    "Evita bullet points. Escreve 2 a 3 paragrafos curtos e bem estruturados.",
    "Justifica a recomendacao principal com base em criterios práticos: utilizacao, custo total, conforto, desempenho e margem de evolucao.",
    "Menciona as alternativas de forma comparativa, explicando trade-offs concretos.",
    "Usa vocabulário técnico acessível, sem jargao desnecessario.",
    "Varia a formulacao e a ordem das ideias entre respostas com os mesmos dados; o conteudo tecnico deve manter-se equivalente.",
    "Tamanho recomendado: 120 a 180 palavras.",
    "Termina com uma conclusao objetiva.",
    "Sem inventar dados tecnicos nao fornecidos.",
    `Semente editorial (nao cites nem expliques esta linha no texto): ${variationSeed}`,
    `Perfil do utilizador: ${JSON.stringify(profile || {})}`,
    `Top 3 escolhido pelo motor interno: ${JSON.stringify(top3 || [])}`,
    `Razoes do scoring interno: ${JSON.stringify(reasoning || {})}`
  ].join("\n");

  async function generateGroqContent(textPrompt) {
    const response = await fetch(GROQ_MODEL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.75,
        top_p: 0.92,
        max_tokens: GROQ_MAX_OUTPUT_TOKENS,
        messages: [
          {
            role: "user",
            content: textPrompt
          }
        ]
      })
    });

    return response;
  }

  function buildErrorSnippet(payloadText) {
    if (!payloadText) return "";
    return payloadText.replace(/\s+/g, " ").trim().slice(0, 240);
  }

  function canRetryLlmStatus(statusCode) {
    return statusCode === 429 || statusCode === 503;
  }

  function delay(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  async function generateGroqWithRetry(textPrompt) {
    let lastResponse = null;
    let lastRawError = "";

    for (let attempt = 0; attempt <= GROQ_MAX_RETRIES; attempt += 1) {
      const response = await generateGroqContent(textPrompt);
      lastResponse = response;

      if (response.ok) {
        return { response, rawError: "" };
      }

      const rawError = await response.text();
      lastRawError = rawError;

      if (!canRetryLlmStatus(response.status) || attempt === GROQ_MAX_RETRIES) {
        return { response, rawError };
      }

      const backoffMs = GROQ_RETRY_BASE_DELAY_MS * 2 ** attempt + Math.floor(Math.random() * 200);
      await delay(backoffMs);
    }

    return { response: lastResponse, rawError: lastRawError };
  }

  function readGroqText(data) {
    return data?.choices?.[0]?.message?.content?.trim() || "";
  }

  try {
    const { response, rawError } = await generateGroqWithRetry(prompt);
    if (!response.ok) {
      return res.status(200).json({
        text: "",
        fallback: true,
        reason: "llm_api_error",
        llmStatus: response.status,
        llmErrorSnippet: buildErrorSnippet(rawError)
      });
    }

    const data = await response.json();
    const cleanedText = readGroqText(data);
    const completedText = cleanedText && /[.!?]$/.test(cleanedText) ? cleanedText : cleanedText ? `${cleanedText}.` : "";

    return res.json({
      text: completedText,
      fallback: !completedText,
      reason: completedText ? "ok" : "empty_text"
    });
  } catch (error) {
    return res.status(200).json({
      text: "",
      fallback: true,
      reason: "llm_api_unreachable",
      llmErrorSnippet: buildErrorSnippet(error?.message || "")
    });
  }
});

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api") || req.path === "/health") {
    return next();
  }

  if (fs.existsSync(clientDistIndexPath)) {
    return res.sendFile(clientDistIndexPath);
  }

  return res
    .status(503)
    .send("Frontend build em falta. Executa `npm run build` para gerar `client/dist`.");
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Bike Finder running on port ${PORT}`);
});
