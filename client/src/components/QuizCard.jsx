export function QuizCard({
  question,
  currentQuestion,
  totalQuestions,
  selectedAnswer,
  onSelectOption,
  onPrevious,
  onNext,
  isPreparing
}) {
  const progress = Math.round(((currentQuestion + 1) / totalQuestions) * 100);

  return (
    <div className="card quiz-card">
      <div className="progress-wrap">
        <div className="progress-label">{`Pergunta ${currentQuestion + 1} de ${totalQuestions}`}</div>
        <div className="progress-bar">
          <span className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <h2 className="quiz-question">{question.label}</h2>
      <div className="options">
        {question.options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`option-btn ${selectedAnswer === option.value ? "selected" : ""}`}
            onClick={() => onSelectOption(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="actions">
        <button type="button" className="btn secondary" onClick={onPrevious} disabled={currentQuestion === 0}>
          Anterior
        </button>
        <button type="button" className="btn primary" onClick={onNext} disabled={isPreparing}>
          {isPreparing ? "A preparar resultado..." : currentQuestion === totalQuestions - 1 ? "Ver resultado" : "Seguinte"}
        </button>
      </div>
    </div>
  );
}
