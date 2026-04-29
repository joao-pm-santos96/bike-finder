require("dotenv").config({ override: true });
const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const clientDistPath = path.join(__dirname, "client", "dist");
const clientDistIndexPath = path.join(clientDistPath, "index.html");

const PEXELS_API_KEY = process.env.PEXELS_API_KEY || "";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
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

  if (!GEMINI_API_KEY) {
    return res.status(200).json({ text: "", fallback: true, reason: "missing_gemini_api_key" });
  }

  const prompt = [
    "Escreve uma explicacao muito simples em portugues de Portugal.",
    "Tom: claro, pratico e amigavel.",
    "Usa frases curtas e linguagem do dia a dia.",
    "Tamanho recomendado: 120 a 180 palavras.",
    "Termina sempre com frase completa.",
    "Sem inventar dados tecnicos nao fornecidos.",
    "Estrutura: 1 paragrafo para recomendacao principal + 2 bullets para alternativas.",
    `Perfil do utilizador: ${JSON.stringify(profile || {})}`,
    `Top 3 escolhido pelo motor interno: ${JSON.stringify(top3 || [])}`,
    `Razoes do scoring interno: ${JSON.stringify(reasoning || {})}`
  ].join("\n");

  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 900
          }
        })
      }
    );

    if (!response.ok) {
      return res.status(200).json({ text: "", fallback: true, reason: "llm_api_error" });
    }

    const data = await response.json();
    const text =
      data?.candidates?.[0]?.content?.parts
        ?.map((part) => part.text)
        .join("\n")
        .trim() || "";
    const completedText = text && /[.!?]$/.test(text) ? text : text ? `${text}.` : "";

    return res.json({
      text: completedText,
      fallback: !completedText,
      reason: completedText ? "ok" : "empty_text"
    });
  } catch (_error) {
    return res.status(200).json({ text: "", fallback: true, reason: "llm_api_unreachable" });
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
