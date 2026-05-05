import { useEffect, useRef, useState } from "react";
import { QuizCard } from "./components/QuizCard";
import { ResultsCard } from "./components/ResultsCard";
import { buildFallbackExplanation, localFallbackImages } from "./lib/fallbacks";
import { rankMotorcycles } from "./lib/scoring";
import { readCache, writeCache } from "./lib/cache";
import { fetchBikeImage, fetchExplanation, fetchJson } from "./services/api";
import "./App.css";

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
  const [explanationMeta, setExplanationMeta] = useState({
    isFallback: false,
    reason: "",
    llmStatus: null,
    llmErrorSnippet: ""
  });
  const [isPreparing, setIsPreparing] = useState(false);
  const [error, setError] = useState("");

  const imageCacheRef = useRef({});

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
    setIsPreparing(true);
    setExplanationText("");
    setExplanationMeta({ isFallback: false, reason: "", llmStatus: null, llmErrorSnippet: "" });

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
      setExplanationMeta({
        isFallback: Boolean(finalExplanation.isFallback),
        reason: finalExplanation.reason || "",
        llmStatus: finalExplanation.llmStatus ?? null,
        llmErrorSnippet: finalExplanation.llmErrorSnippet || ""
      });
      setTop3(selectedTop3);
    } finally {
      setIsPreparing(false);
    }
  }

  if (isPreparing) {
    return (
      <main className="container">
        <section className="hero">
          <h1>Descobre a tua mota ideal</h1>
          <p>Responde a um questionario rapido e recebe 1 recomendacao principal e 2 alternativas.</p>
        </section>
        <div className="card thinking-card">
          <div className="spinner" aria-hidden="true" />
          <h2>A pensar na tua recomendacao...</h2>
          <p>Estamos a preparar imagens e explicacao personalizada.</p>
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
    setExplanationMeta({ isFallback: false, reason: "", llmStatus: null, llmErrorSnippet: "" });
    setIsPreparing(false);
  }

  if (error) {
    return (
      <main className="container">
        <div className="card">{error}</div>
      </main>
    );
  }

  if (!questions.length || !rules || !motorcycles.length) {
    return (
      <main className="container">
        <div className="card">A carregar...</div>
      </main>
    );
  }

  const question = questions[currentQuestion];

  return (
    <main className="container">
      <section className="hero">
        <h1>Descobre a tua mota ideal</h1>
        <p>Responde a um questionario rapido e recebe 1 recomendacao principal e 2 alternativas.</p>
      </section>

      {!top3.length ? (
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
      ) : (
        <ResultsCard
          top3={top3}
          explanationText={explanationText}
          imageByBikeId={imageByBikeId}
          onRestart={handleRestart}
        />
      )}
    </main>
  );
}

export default App;
