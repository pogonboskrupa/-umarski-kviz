const LEADERBOARD_KEY = "sumarski-kviz-rezultati";
const TIME_PER_QUESTION = 20;
const MAX_QUESTIONS = 20;

const firebaseBanner = document.getElementById("firebaseBanner");
let ACTIVE_QUESTIONS = QUESTIONS;

async function loadQuestionPool() {
  if (!db) {
    firebaseBanner.hidden = false;
    return;
  }
  try {
    const snapshot = await db.collection("questions").where("active", "==", true).get();
    if (!snapshot.empty) {
      ACTIVE_QUESTIONS = snapshot.docs.map((doc) => doc.data());
    }
  } catch (err) {
    console.error("Neuspjelo učitavanje pitanja iz baze, koriste se ugrađena pitanja.", err);
  }
}

function saveResultToFirestore(correctCount, total, percent) {
  if (!db) return;
  db.collection("results")
    .add({
      name: playerName,
      category: selectedCategory,
      categoryLabel: categoryLabel(selectedCategory),
      score: correctCount,
      total,
      percent,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    })
    .catch((err) => console.error("Neuspjelo slanje rezultata u bazu.", err));
}

const screens = {
  start: document.getElementById("screen-start"),
  quiz: document.getElementById("screen-quiz"),
  result: document.getElementById("screen-result"),
  leaderboard: document.getElementById("screen-leaderboard"),
};

const playerNameInput = document.getElementById("playerName");
const categoryGrid = document.getElementById("categoryGrid");
const categoryBadge = document.getElementById("categoryBadge");
const timerToggle = document.getElementById("timerToggle");
const startBtn = document.getElementById("startBtn");
const leaderboardBtn = document.getElementById("leaderboardBtn");
const nextBtn = document.getElementById("nextBtn");
const restartBtn = document.getElementById("restartBtn");
const shareBtn = document.getElementById("shareBtn");
const progressText = document.getElementById("progressText");
const progressFill = document.getElementById("progressFill");
const timerWrap = document.getElementById("timerWrap");
const timerFill = document.getElementById("timerFill");
const timerText = document.getElementById("timerText");
const questionText = document.getElementById("questionText");
const answersEl = document.getElementById("answers");
const resultName = document.getElementById("resultName");
const resultScore = document.getElementById("resultScore");
const resultGrade = document.getElementById("resultGrade");
const reviewList = document.getElementById("reviewList");
const leaderboardList = document.getElementById("leaderboardList");
const clearLeaderboardBtn = document.getElementById("clearLeaderboardBtn");
const backFromLeaderboardBtn = document.getElementById("backFromLeaderboardBtn");

let quizQuestions = [];
let currentIndex = 0;
let selectedAnswer = null;
let answersLog = [];
let playerName = "";
let timerOn = true;
let timerInterval = null;
let timeLeft = TIME_PER_QUESTION;
let selectedCategory = "mix";

function renderCategoryGrid() {
  categoryGrid.innerHTML = "";
  CATEGORIES.forEach((cat) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "category-option" + (cat.id === selectedCategory ? " selected" : "");
    btn.innerHTML = `<span class="cat-icon">${cat.icon}</span><span>${cat.label}</span>`;
    btn.addEventListener("click", () => {
      selectedCategory = cat.id;
      renderCategoryGrid();
    });
    categoryGrid.appendChild(btn);
  });
}

function shuffle(array) {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildQuizQuestions(categoryId) {
  const pool = categoryId === "mix" ? ACTIVE_QUESTIONS : ACTIVE_QUESTIONS.filter((q) => q.category === categoryId);
  return shuffle(pool)
    .slice(0, MAX_QUESTIONS)
    .map((q) => {
      const correctText = q.a[q.correct];
      const shuffledAnswers = shuffle(q.a);
      return {
        q: q.q,
        a: shuffledAnswers,
        correct: shuffledAnswers.indexOf(correctText),
      };
    });
}

function categoryLabel(id) {
  const cat = CATEGORIES.find((c) => c.id === id);
  return cat ? `${cat.icon} ${cat.label}` : "";
}

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
  timerOn = timerToggle.checked;
  quizQuestions = buildQuizQuestions(selectedCategory);
  categoryBadge.textContent = categoryLabel(selectedCategory);
  currentIndex = 0;
  answersLog = [];
  showScreen("quiz");
  renderQuestion();
}

function renderQuestion() {
  const question = quizQuestions[currentIndex];
  selectedAnswer = null;
  nextBtn.disabled = true;
  nextBtn.textContent = currentIndex === quizQuestions.length - 1 ? "Prikaži rezultat" : "Sljedeće pitanje";

  progressText.textContent = `Pitanje ${currentIndex + 1} / ${quizQuestions.length}`;
  progressFill.style.width = `${(currentIndex / quizQuestions.length) * 100}%`;

  questionText.textContent = question.q;
  answersEl.innerHTML = "";

  question.a.forEach((answerText, idx) => {
    const btn = document.createElement("button");
    btn.className = "answer-btn";
    btn.textContent = answerText;
    btn.addEventListener("click", () => selectAnswer(idx));
    answersEl.appendChild(btn);
  });

  startTimer();
}

function startTimer() {
  clearInterval(timerInterval);
  if (!timerOn) {
    timerWrap.classList.remove("active");
    return;
  }
  timerWrap.classList.add("active");
  timeLeft = TIME_PER_QUESTION;
  updateTimerUI();
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerUI();
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      timeUp();
    }
  }, 1000);
}

function updateTimerUI() {
  timerText.textContent = timeLeft;
  const percent = (timeLeft / TIME_PER_QUESTION) * 100;
  timerFill.style.width = `${percent}%`;
  timerFill.classList.toggle("warn", percent <= 50 && percent > 20);
  timerFill.classList.toggle("danger", percent <= 20);
}

function timeUp() {
  if (selectedAnswer !== null) return;
  selectAnswer(null);
}

function selectAnswer(idx) {
  if (selectedAnswer !== null) return;
  selectedAnswer = idx === null ? -1 : idx;
  clearInterval(timerInterval);

  const question = quizQuestions[currentIndex];
  const buttons = Array.from(answersEl.children);
  buttons.forEach((b, i) => {
    b.disabled = true;
    if (i === question.correct) b.classList.add("correct");
    else if (i === idx) b.classList.add("wrong");
  });

  answersLog.push({
    question: question.q,
    chosen: idx === null ? "(nema odgovora — isteklo vrijeme)" : question.a[idx],
    correctAnswer: question.a[question.correct],
    isCorrect: idx === question.correct,
  });

  nextBtn.disabled = false;
}

function nextQuestion() {
  if (currentIndex < quizQuestions.length - 1) {
    currentIndex++;
    renderQuestion();
  } else {
    clearInterval(timerInterval);
    showResult();
  }
}

function showResult() {
  progressFill.style.width = "100%";
  const correctCount = answersLog.filter((a) => a.isCorrect).length;
  const total = quizQuestions.length;
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

  saveToLeaderboard(correctCount, total, percent);
  saveResultToFirestore(correctCount, total, percent);
  showScreen("result");
}

function gradeFor(percent) {
  if (percent >= 90) return "🏆 Odličan poznavalac šuma!";
  if (percent >= 70) return "🌲 Vrlo dobro znanje!";
  if (percent >= 50) return "🌿 Solidno, ima prostora za napredak.";
  return "🍂 Vrijeme za malo dodatnog učenja o šumarstvu.";
}

function loadLeaderboard() {
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToLeaderboard(correctCount, total, percent) {
  try {
    const entries = loadLeaderboard();
    entries.push({
      name: playerName,
      score: correctCount,
      total,
      percent,
      category: categoryLabel(selectedCategory),
      date: new Date().toLocaleString("bs-BA"),
    });
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(entries));
  } catch {
    // localStorage nedostupan (privatni mod i sl.) — nastavi bez pohrane
  }
}

function renderLeaderboard() {
  const entries = loadLeaderboard().sort((a, b) => b.percent - a.percent || b.score - a.score);
  leaderboardList.innerHTML = "";

  if (entries.length === 0) {
    leaderboardList.innerHTML = '<p class="leaderboard-empty">Još nema rezultata na ovom uređaju.</p>';
    return;
  }

  entries.forEach((entry, idx) => {
    const item = document.createElement("div");
    item.className = "leaderboard-item";
    item.innerHTML = `
      <span class="leaderboard-rank">${idx + 1}.</span>
      <span class="leaderboard-info">
        <div class="leaderboard-name">${entry.name}</div>
        <div class="leaderboard-date">${entry.category ? entry.category + " · " : ""}${entry.date}</div>
      </span>
      <span class="leaderboard-score">${entry.score}/${entry.total} (${entry.percent}%)</span>
    `;
    leaderboardList.appendChild(item);
  });
}

function openLeaderboard() {
  renderLeaderboard();
  showScreen("leaderboard");
}

function clearLeaderboard() {
  if (!confirm("Obrisati sve rezultate sa ovog uređaja?")) return;
  localStorage.removeItem(LEADERBOARD_KEY);
  renderLeaderboard();
}

function shareResult() {
  const correctCount = answersLog.filter((a) => a.isCorrect).length;
  const total = quizQuestions.length;
  const percent = Math.round((correctCount / total) * 100);
  const text = `Šumarski kviz — ${playerName}: ${correctCount}/${total} (${percent}%)`;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      shareBtn.textContent = "✅ Kopirano!";
      setTimeout(() => (shareBtn.textContent = "📋 Kopiraj rezultat"), 1800);
    });
  } else {
    prompt("Kopirajte rezultat:", text);
  }
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
leaderboardBtn.addEventListener("click", openLeaderboard);
backFromLeaderboardBtn.addEventListener("click", () => showScreen("start"));
clearLeaderboardBtn.addEventListener("click", clearLeaderboard);
shareBtn.addEventListener("click", shareResult);

renderCategoryGrid();

startBtn.disabled = true;
startBtn.textContent = "Učitavanje pitanja...";
loadQuestionPool().finally(() => {
  startBtn.disabled = false;
  startBtn.textContent = "Započni kviz";
});

document.addEventListener("keydown", (e) => {
  if (!screens.quiz.classList.contains("active")) return;
  if (["1", "2", "3", "4"].includes(e.key)) {
    const idx = Number(e.key) - 1;
    if (idx < answersEl.children.length) selectAnswer(idx);
  } else if (e.key === "Enter" && !nextBtn.disabled) {
    nextQuestion();
  }
});
