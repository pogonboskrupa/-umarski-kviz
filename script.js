const screens = {
  start: document.getElementById("screen-start"),
  quiz: document.getElementById("screen-quiz"),
  result: document.getElementById("screen-result"),
};

const playerNameInput = document.getElementById("playerName");
const startBtn = document.getElementById("startBtn");
const nextBtn = document.getElementById("nextBtn");
const restartBtn = document.getElementById("restartBtn");
const progressText = document.getElementById("progressText");
const progressFill = document.getElementById("progressFill");
const questionText = document.getElementById("questionText");
const answersEl = document.getElementById("answers");
const resultName = document.getElementById("resultName");
const resultScore = document.getElementById("resultScore");
const resultGrade = document.getElementById("resultGrade");
const reviewList = document.getElementById("reviewList");

let currentIndex = 0;
let selectedAnswer = null;
let answersLog = [];
let playerName = "";

function showScreen(name) {
  Object.values(screens).forEach((s) => s.classList.remove("active"));
  screens[name].classList.add("active");
}

function startQuiz() {
  const name = playerNameInput.value.trim();
  if (!name) {
    playerNameInput.focus();
    playerNameInput.style.borderColor = "#d64545";
    return;
  }
  playerName = name;
  currentIndex = 0;
  answersLog = [];
  showScreen("quiz");
  renderQuestion();
}

function renderQuestion() {
  const question = QUESTIONS[currentIndex];
  selectedAnswer = null;
  nextBtn.disabled = true;
  nextBtn.textContent = currentIndex === QUESTIONS.length - 1 ? "Prikaži rezultat" : "Sljedeće pitanje";

  progressText.textContent = `Pitanje ${currentIndex + 1} / ${QUESTIONS.length}`;
  progressFill.style.width = `${(currentIndex / QUESTIONS.length) * 100}%`;

  questionText.textContent = question.q;
  answersEl.innerHTML = "";

  question.a.forEach((answerText, idx) => {
    const btn = document.createElement("button");
    btn.className = "answer-btn";
    btn.textContent = answerText;
    btn.addEventListener("click", () => selectAnswer(idx, btn));
    answersEl.appendChild(btn);
  });
}

function selectAnswer(idx, btn) {
  if (selectedAnswer !== null) return;
  selectedAnswer = idx;

  const question = QUESTIONS[currentIndex];
  const buttons = Array.from(answersEl.children);
  buttons.forEach((b, i) => {
    b.disabled = true;
    if (i === question.correct) b.classList.add("correct");
    else if (i === idx) b.classList.add("wrong");
  });

  answersLog.push({
    question: question.q,
    chosen: question.a[idx],
    correctAnswer: question.a[question.correct],
    isCorrect: idx === question.correct,
  });

  nextBtn.disabled = false;
}

function nextQuestion() {
  if (currentIndex < QUESTIONS.length - 1) {
    currentIndex++;
    renderQuestion();
  } else {
    showResult();
  }
}

function showResult() {
  progressFill.style.width = "100%";
  const correctCount = answersLog.filter((a) => a.isCorrect).length;
  const total = QUESTIONS.length;
  const percent = Math.round((correctCount / total) * 100);

  resultName.textContent = playerName;
  resultScore.textContent = `${correctCount} / ${total} (${percent}%)`;
  resultGrade.textContent = gradeFor(percent);

  reviewList.innerHTML = "";
  answersLog.forEach((entry, idx) => {
    const item = document.createElement("div");
    item.className = `review-item ${entry.isCorrect ? "ok" : "bad"}`;
    item.innerHTML = `
      <div class="review-q">${idx + 1}. ${entry.question}</div>
      <div class="review-a">Vaš odgovor: ${entry.chosen}</div>
      ${entry.isCorrect ? "" : `<div class="review-a correct-answer">Tačan odgovor: ${entry.correctAnswer}</div>`}
    `;
    reviewList.appendChild(item);
  });

  showScreen("result");
}

function gradeFor(percent) {
  if (percent >= 90) return "🏆 Odličan poznavalac šuma!";
  if (percent >= 70) return "🌲 Vrlo dobro znanje!";
  if (percent >= 50) return "🌿 Solidno, ima prostora za napredak.";
  return "🍂 Vrijeme za malo dodatnog učenja o šumarstvu.";
}

function restartQuiz() {
  playerNameInput.value = "";
  playerNameInput.style.borderColor = "";
  showScreen("start");
  playerNameInput.focus();
}

startBtn.addEventListener("click", startQuiz);
playerNameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") startQuiz();
});
nextBtn.addEventListener("click", nextQuestion);
restartBtn.addEventListener("click", restartQuiz);
