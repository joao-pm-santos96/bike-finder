import { useEffect, useRef, useState } from "react";
import { AppHeader } from "./components/AppHeader";
import { HeroBlock } from "./components/HeroBlock";
import { Logo } from "./components/Logo";
import { QuizCard } from "./components/QuizCard";
import { ResultsCard } from "./components/ResultsCard";
import { ThinkingSkeleton } from "./components/ThinkingSkeleton";
import { buildFallbackComparison, buildFallbackComparisonRows, localFallbackImages } from "./lib/fallbacks";
import { rankMotorcycles } from "./lib/scoring";
import { readCache, writeCache } from "./lib/cache";
import { fetchBikeComparison, fetchBikeImage, fetchJson } from "./services/api";
import { SUPPORTED_LANGUAGES, translations } from "./i18n";
import "./App.css";

const THEME_STORAGE_KEY = "bikefinder-theme";
const LANGUAGE_STORAGE_KEY = "bikefinder-language";
const DEFAULT_LABELS = {
  toggleToLight: "Ativar modo claro",
  toggleToDark: "Ativar modo escuro",
  languageSelectorLabel: "Selecionar idioma",
  heroTitle: "Descobre a tua mota ideal",
  heroLead: "Responde a um questionario rapido e recebe recomendacoes com contexto tecnico.",
  questionProgress: (current, total) => `Pergunta ${current} de ${total}`,
  previous: "Anterior",
  next: "Seguinte",
  preparingResult: "A preparar resultado...",
  seeResult: "Ver resultado",
  recommendationTitle: "A tua recomendacao",
  recommendationSubtitle: "Resultado gerado pelo motor interno de scoring.",
  technicalExplanation: "Comparador tecnico",
  restartQuiz: "Refazer questionario",
  primaryRecommendation: "Recomendacao principal",
  alternative: "Alternativa",
  category: "Categoria",
  budget: "Orcamento",
  internalScore: "Score interno",
  loadingRecommendations: "A carregar recomendacoes",
  thinkingTitle: "A pensar na tua recomendacao...",
  thinkingLead: "Estamos a preparar imagens e comparador tecnico.",
  chooseOptionBeforeContinuing: "Seleciona uma opcao antes de continuar.",
  appStartError: "Erro ao iniciar a aplicacao:",
  loading: "A carregar..."
};

function getInitialTheme() {
  if (typeof window === "undefined") return "light";
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  if (saved === "dark" || saved === "light") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function logComparisonFallback(result, extra = {}) {
  // eslint-disable-next-line no-console
  console.warn("[bikefinder] Comparador em fallback", {
    reason: result.reason || "unknown",
    detail: result.errorSnippet || "",
    ...extra
  });
}

function getInitialLanguage() {
  if (typeof window === "undefined") return "pt";
  const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (saved && SUPPORTED_LANGUAGES.includes(saved)) return saved;
  return "pt";
}

function App() {
  const [questions, setQuestions] = useState([]);
  const [motorcycles, setMotorcycles] = useState([]);
  const [rules, setRules] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [top3, setTop3] = useState([]);
  const [imageByBikeId, setImageByBikeId] = useState({});
  const [, setComparisonText] = useState("");
  const [comparisonRows, setComparisonRows] = useState([]);
  const [isPreparing, setIsPreparing] = useState(false);
  const [preparingTop3, setPreparingTop3] = useState(null);
  const [theme, setTheme] = useState(getInitialTheme);
  const [language, setLanguage] = useState(getInitialLanguage);
  const [error, setError] = useState("");

  const imageCacheRef = useRef({});
  const labels = { ...DEFAULT_LABELS, ...(translations.pt || {}), ...(translations[language] || {}) };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [language]);

  useEffect(() => {
    async function bootstrap() {
      try {
        const [loadedQuestions, loadedMotorcycles, loadedRules] = await Promise.all([
          fetchJson("/data/questions.json"),
          fetchJson("/data/motorcycles.json"),
          fetchJson("/data/scoring-rules.json")
        ]);
        setQuestions(loadedQuestions);
        setMotorcycles(loadedMotorcycles);
        setRules(loadedRules);
      } catch (bootstrapError) {
        setError(`${labels.appStartError} ${bootstrapError.message}`);
      }
    }

    bootstrap();
  }, []);

  function toggleTheme() {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }

  async function getImageForBike(bike) {
    const imageCacheVersion = "v4";
    const imageCacheKey = `bikefinder:image:${imageCacheVersion}:${bike.id}`;
    if (imageCacheRef.current[bike.id]) return imageCacheRef.current[bike.id];

    const cached = readCache(imageCacheKey);
    if (cached) {
      imageCacheRef.current[bike.id] = cached;
      return cached;
    }

    try {
      const data = await fetchBikeImage(bike.name);
      if (!data.fallback && data.photos?.length) {
        const image = data.photos[0];
        imageCacheRef.current[bike.id] = image.src;
        writeCache(imageCacheKey, image.src);
        return image.src;
      }
      // eslint-disable-next-line no-console
      console.warn("[bikefinder] Imagem em fallback", {
        bikeId: bike.id,
        query: bike.name,
        apiReason: data.reason || "unknown"
      });
    } catch (imageError) {
      // eslint-disable-next-line no-console
      console.warn("[bikefinder] Imagem em fallback", {
        bikeId: bike.id,
        query: bike.name,
        apiReason: "request_failed_on_client",
        detail: imageError?.message || ""
      });
    }

    const fallback = localFallbackImages[bike.category]?.[0] || localFallbackImages.default[0];
    imageCacheRef.current[bike.id] = fallback;
    writeCache(imageCacheKey, fallback);
    return fallback;
  }

  async function getComparison(selectedTop3) {
    const fallbackText = buildFallbackComparison(selectedTop3);
    try {
      const data = await fetchBikeComparison({ top3: selectedTop3 });
      const apiText = (data.text || "").trim();
      let text = data.fallback ? fallbackText : apiText;
      let isFallback = Boolean(data.fallback);
      let reason = data.reason || (data.fallback ? "unknown_api_fallback_reason" : "ok");

      if (!isFallback && !apiText) {
        text = fallbackText;
        isFallback = true;
        reason = "empty_comparison_response";
      }

      const result = {
        text,
        isFallback,
        reason,
        errorSnippet: data.errorSnippet || "",
        comparisons: Array.isArray(data.comparisons) ? data.comparisons : []
      };
      if (result.isFallback) {
        logComparisonFallback(result, { source: "network_or_parse" });
      }
      return result;
    } catch (comparisonError) {
      const result = {
        text: fallbackText,
        isFallback: true,
        reason: "request_failed_on_client",
        errorSnippet: comparisonError?.message || "",
        comparisons: []
      };
      logComparisonFallback(result, { source: "client_fetch" });
      return result;
    }
  }

  async function handleNext() {
    const question = questions[currentQuestion];
    if (!answers[question.id]) {
      window.alert(labels.chooseOptionBeforeContinuing);
      return;
    }

    const isLast = currentQuestion === questions.length - 1;
    if (!isLast) {
      setCurrentQuestion((value) => value + 1);
      return;
    }

    const profile = { ...answers };
    const { top3: selectedTop3 } = rankMotorcycles(profile, motorcycles, rules);
    setPreparingTop3(selectedTop3);
    setIsPreparing(true);
    setComparisonText("");
    setComparisonRows([]);

    try {
      const [imagesEntries, finalComparison] = await Promise.all([
        Promise.all(
          selectedTop3.map(async (bike) => {
            const imageUrl = await getImageForBike(bike);
            return [bike.id, imageUrl];
          })
        ),
        getComparison(selectedTop3)
      ]);

      setImageByBikeId(Object.fromEntries(imagesEntries));
      setComparisonText(finalComparison.text || "");
      setComparisonRows(finalComparison.comparisons.length ? finalComparison.comparisons : buildFallbackComparisonRows(selectedTop3));
      setTop3(selectedTop3);
    } finally {
      setPreparingTop3(null);
      setIsPreparing(false);
    }
  }

  if (isPreparing) {
    return (
      <main className="container">
        <AppHeader
          theme={theme}
          onToggleTheme={toggleTheme}
          language={language}
          onLanguageChange={setLanguage}
          labels={labels}
        />
        <HeroBlock labels={labels} />
        <div className="card thinking-card">
          <Logo variant="thinking" />
          <div className="spinner" aria-hidden="true" />
          <h2 className="thinking-title">{labels.thinkingTitle}</h2>
          <p className="thinking-lead">{labels.thinkingLead}</p>
          <ThinkingSkeleton bikes={preparingTop3} labels={labels} />
        </div>
      </main>
    );
  }

  function handleRestart() {
    setAnswers({});
    setCurrentQuestion(0);
    setTop3([]);
    setImageByBikeId({});
    setComparisonText("");
    setComparisonRows([]);
    setIsPreparing(false);
    setPreparingTop3(null);
  }

  if (error) {
    return (
      <main className="container">
        <AppHeader
          theme={theme}
          onToggleTheme={toggleTheme}
          language={language}
          onLanguageChange={setLanguage}
          labels={labels}
        />
        <div className="card card--message">
          <div className="results-brand">
            <Logo variant="inline" />
          </div>
          {error}
        </div>
      </main>
    );
  }

  if (!questions.length || !rules || !motorcycles.length) {
    return (
      <main className="container">
        <AppHeader
          theme={theme}
          onToggleTheme={toggleTheme}
          language={language}
          onLanguageChange={setLanguage}
          labels={labels}
        />
        <div className="card card--message">
          <div className="results-brand">
            <Logo variant="inline" />
          </div>
          {labels.loading}
        </div>
      </main>
    );
  }

  const question = questions[currentQuestion];

  return (
    <main className="container">
      <AppHeader
        theme={theme}
        onToggleTheme={toggleTheme}
        language={language}
        onLanguageChange={setLanguage}
        labels={labels}
      />
      <HeroBlock labels={labels} />

      {!top3.length ? (
        <div key={currentQuestion} className="panel-enter">
          <QuizCard
            question={question}
            currentQuestion={currentQuestion}
            totalQuestions={questions.length}
            selectedAnswer={answers[question.id]}
            onSelectOption={(value) => setAnswers((prev) => ({ ...prev, [question.id]: value }))}
            onPrevious={() => setCurrentQuestion((value) => Math.max(0, value - 1))}
            onNext={handleNext}
            isPreparing={isPreparing}
            labels={labels}
          />
        </div>
      ) : (
        <div className="panel-enter results-enter">
          <ResultsCard
            top3={top3}
            comparisonRows={comparisonRows}
            imageByBikeId={imageByBikeId}
            onRestart={handleRestart}
            labels={labels}
          />
        </div>
      )}
    </main>
  );
}

export default App;
