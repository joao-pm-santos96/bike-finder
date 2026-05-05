import { useEffect, useRef, useState } from "react";
import { AppHeader } from "./components/AppHeader";
import { HeroBlock } from "./components/HeroBlock";
import { Logo } from "./components/Logo";
import { QuizCard } from "./components/QuizCard";
import { ResultsCard } from "./components/ResultsCard";
import { ThinkingSkeleton } from "./components/ThinkingSkeleton";
import { buildFallbackExplanation, localFallbackImages } from "./lib/fallbacks";
import { rankMotorcycles } from "./lib/scoring";
import { readCache, writeCache } from "./lib/cache";
import { fetchBikeImage, fetchExplanation, fetchJson } from "./services/api";
import "./App.css";

const THEME_STORAGE_KEY = "bikefinder-theme";

function getInitialTheme() {
  if (typeof window === "undefined") return "light";
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  if (saved === "dark" || saved === "light") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function logExplanationFallback(result, extra = {}) {
  // eslint-disable-next-line no-console
  console.warn("[bikefinder] Explicacao em fallback", {
    reason: result.reason || "unknown",
    status: result.llmStatus ?? null,
    detail: result.llmErrorSnippet || "",
    ...extra
  });
}

function App() {
  const [questions, setQuestions] = useState([]);
  const [motorcycles, setMotorcycles] = useState([]);
  const [rules, setRules] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [top3, setTop3] = useState([]);
  const [imageByBikeId, setImageByBikeId] = useState({});
  const [explanationText, setExplanationText] = useState("");
  const [isPreparing, setIsPreparing] = useState(false);
  const [preparingTop3, setPreparingTop3] = useState(null);
  const [theme, setTheme] = useState(getInitialTheme);
  const [error, setError] = useState("");

  const imageCacheRef = useRef({});

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

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
        setError(`Erro ao iniciar a aplicacao: ${bootstrapError.message}`);
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

  async function getExplanation(profile, selectedTop3, selectedReasoningMap) {
    const fallbackText = buildFallbackExplanation(selectedTop3, profile, selectedReasoningMap);
    try {
      const data = await fetchExplanation({
        profile,
        top3: selectedTop3,
        reasoning: selectedReasoningMap
      });
      const apiText = (data.text || "").trim();
      let text = data.fallback ? fallbackText : apiText;
      let isFallback = Boolean(data.fallback);
      let reason = data.reason || (data.fallback ? "unknown_fallback_reason" : "ok");

      if (!isFallback && !apiText) {
        text = fallbackText;
        isFallback = true;
        reason = "empty_llm_response";
      }

      const result = {
        text,
        isFallback,
        reason,
        llmStatus: data.llmStatus ?? null,
        llmErrorSnippet: data.llmErrorSnippet || ""
      };
      if (result.isFallback) {
        logExplanationFallback(result, { source: "network_or_parse" });
      }
      return result;
    } catch (explainError) {
      const result = {
        text: fallbackText,
        isFallback: true,
        reason: "request_failed_on_client",
        llmStatus: null,
        llmErrorSnippet: explainError?.message || ""
      };
      logExplanationFallback(result, { source: "client_fetch" });
      return result;
    }
  }

  async function handleNext() {
    const question = questions[currentQuestion];
    if (!answers[question.id]) {
      window.alert("Seleciona uma opcao antes de continuar.");
      return;
    }

    const isLast = currentQuestion === questions.length - 1;
    if (!isLast) {
      setCurrentQuestion((value) => value + 1);
      return;
    }

    const profile = { ...answers };
    const { top3: selectedTop3, reasoningMap: selectedReasoningMap } = rankMotorcycles(profile, motorcycles, rules);
    setPreparingTop3(selectedTop3);
    setIsPreparing(true);
    setExplanationText("");

    try {
      const [imagesEntries, finalExplanation] = await Promise.all([
        Promise.all(
          selectedTop3.map(async (bike) => {
            const imageUrl = await getImageForBike(bike);
            return [bike.id, imageUrl];
          })
        ),
        getExplanation(profile, selectedTop3, selectedReasoningMap)
      ]);

      setImageByBikeId(Object.fromEntries(imagesEntries));
      setExplanationText(finalExplanation.text || "");
      setTop3(selectedTop3);
    } finally {
      setPreparingTop3(null);
      setIsPreparing(false);
    }
  }

  if (isPreparing) {
    return (
      <main className="container">
        <AppHeader theme={theme} onToggleTheme={toggleTheme} />
        <HeroBlock />
        <div className="card thinking-card">
          <Logo variant="thinking" />
          <div className="spinner" aria-hidden="true" />
          <h2 className="thinking-title">A pensar na tua recomendacao...</h2>
          <p className="thinking-lead">Estamos a preparar imagens e explicacao personalizada.</p>
          <ThinkingSkeleton bikes={preparingTop3} />
        </div>
      </main>
    );
  }

  function handleRestart() {
    setAnswers({});
    setCurrentQuestion(0);
    setTop3([]);
    setImageByBikeId({});
    setExplanationText("");
    setIsPreparing(false);
    setPreparingTop3(null);
  }

  if (error) {
    return (
      <main className="container">
        <AppHeader theme={theme} onToggleTheme={toggleTheme} />
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
        <AppHeader theme={theme} onToggleTheme={toggleTheme} />
        <div className="card card--message">
          <div className="results-brand">
            <Logo variant="inline" />
          </div>
          A carregar...
        </div>
      </main>
    );
  }

  const question = questions[currentQuestion];

  return (
    <main className="container">
      <AppHeader theme={theme} onToggleTheme={toggleTheme} />
      <HeroBlock />

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
          />
        </div>
      ) : (
        <div className="panel-enter results-enter">
          <ResultsCard
            top3={top3}
            explanationText={explanationText}
            imageByBikeId={imageByBikeId}
            onRestart={handleRestart}
          />
        </div>
      )}
    </main>
  );
}

export default App;
