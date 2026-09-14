const REAL_CATEGORIES = CATEGORIES.filter((c) => c.id !== "mix");

const firebaseBanner = document.getElementById("firebaseBanner");
const screens = {
  login: document.getElementById("screen-login"),
  admin: document.getElementById("screen-admin"),
};

const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginBtn = document.getElementById("loginBtn");
const loginError = document.getElementById("loginError");
const logoutBtn = document.getElementById("logoutBtn");

const tabBtns = document.querySelectorAll(".tab-btn");
const tabPanels = {
  questions: document.getElementById("tab-questions"),
  results: document.getElementById("tab-results"),
};

const categoryFilter = document.getElementById("categoryFilter");
const questionSearch = document.getElementById("questionSearch");
const seedBtn = document.getElementById("seedBtn");
const addQuestionBtn = document.getElementById("addQuestionBtn");
const questionsCount = document.getElementById("questionsCount");
const questionForm = document.getElementById("questionForm");
const questionsList = document.getElementById("questionsList");

const resultsCategoryFilter = document.getElementById("resultsCategoryFilter");
const resultsSort = document.getElementById("resultsSort");
const exportCsvBtn = document.getElementById("exportCsvBtn");
const refreshResultsBtn = document.getElementById("refreshResultsBtn");
const statsRow = document.getElementById("statsRow");
const resultsTableWrap = document.getElementById("resultsTableWrap");

let allQuestions = [];
let allResults = [];
let editingId = null;

function showScreen(name) {
  Object.values(screens).forEach((s) => s.classList.remove("active"));
  screens[name].classList.add("active");
}

// ---------- Prijava ----------

function initAuth() {
  if (!auth) {
    firebaseBanner.hidden = false;
    loginBtn.disabled = true;
    return;
  }
  auth.onAuthStateChanged((user) => {
    if (user) {
      showScreen("admin");
      loadQuestions();
      loadResults();
    } else {
      showScreen("login");
    }
  });
}

function login() {
  loginError.hidden = true;
  auth
    .signInWithEmailAndPassword(loginEmail.value.trim(), loginPassword.value)
    .catch((err) => {
      loginError.textContent = "Neuspjela prijava: " + err.message;
      loginError.hidden = false;
    });
}

function logout() {
  auth.signOut();
}

// ---------- Tabovi ----------

function switchTab(tabId) {
  tabBtns.forEach((b) => b.classList.toggle("active", b.dataset.tab === tabId));
  Object.entries(tabPanels).forEach(([id, el]) => el.classList.toggle("active", id === tabId));
}

// ---------- Pitanja ----------

function populateCategorySelects() {
  categoryFilter.innerHTML = '<option value="all">Sve kategorije</option>';
  resultsCategoryFilter.innerHTML = '<option value="all">Sve kategorije</option>';
  CATEGORIES.forEach((cat) => {
    if (cat.id !== "mix") {
      categoryFilter.insertAdjacentHTML("beforeend", `<option value="${cat.id}">${cat.icon} ${cat.label}</option>`);
    }
    resultsCategoryFilter.insertAdjacentHTML("beforeend", `<option value="${cat.id}">${cat.icon} ${cat.label}</option>`);
  });
}

function categoryLabel(id) {
  const cat = CATEGORIES.find((c) => c.id === id);
  return cat ? `${cat.icon} ${cat.label}` : id;
}

async function loadQuestions() {
  questionsList.innerHTML = "<p class='muted-text'>Učitavanje...</p>";
  const snapshot = await db.collection("questions").get();
  allQuestions = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  renderQuestions();
}

function renderQuestions() {
  const filter = categoryFilter.value;
  const search = questionSearch.value.trim().toLowerCase();
  let filtered = filter === "all" ? allQuestions : allQuestions.filter((q) => q.category === filter);
  if (search) {
    filtered = filtered.filter((q) => q.q.toLowerCase().includes(search) || q.a.some((a) => a.toLowerCase().includes(search)));
  }

  questionsCount.textContent = `${filtered.length} pitanje/a prikazano (ukupno u bazi: ${allQuestions.length})`;

  if (filtered.length === 0) {
    questionsList.innerHTML = "<p class='muted-text'>Nema pitanja koja odgovaraju filteru/pretrazi. Dodajte novo ili uvezite ugrađena pitanja.</p>";
    return;
  }

  questionsList.innerHTML = "";
  filtered.forEach((q) => {
    const card = document.createElement("div");
    card.className = "question-card" + (q.active ? "" : " inactive");
    card.innerHTML = `
      <div class="question-card-top">
        <div>
          <span class="question-card-cat">${categoryLabel(q.category)}</span>
          <div class="question-card-q">${q.q}</div>
        </div>
        <div class="question-card-actions">
          <button class="icon-btn edit-btn">✏️ Uredi</button>
          <button class="icon-btn delete-btn">🗑️ Obriši</button>
        </div>
      </div>
      <ol class="question-card-answers">
        ${q.a.map((ans, i) => `<li class="${i === q.correct ? "correct-ans" : ""}">${ans}</li>`).join("")}
      </ol>
      <label class="toggle-active">
        <input type="checkbox" class="active-toggle" ${q.active ? "checked" : ""} />
        Aktivno (uključeno u kviz)
      </label>
    `;
    card.querySelector(".edit-btn").addEventListener("click", () => openForm(q));
    card.querySelector(".delete-btn").addEventListener("click", () => deleteQuestion(q.id));
    card.querySelector(".active-toggle").addEventListener("change", (e) => toggleActive(q.id, e.target.checked));
    questionsList.appendChild(card);
  });
}

function openForm(question, prefillCategory) {
  editingId = question ? question.id : null;
  const q = question || {
    category: prefillCategory || REAL_CATEGORIES[0].id,
    q: "",
    a: ["", "", "", ""],
    correct: 0,
    active: true,
  };

  questionForm.hidden = false;
  questionForm.innerHTML = `
    <p id="formError" class="form-error" hidden></p>
    <label>Kategorija</label>
    <select id="formCategory">
      ${REAL_CATEGORIES.map((c) => `<option value="${c.id}" ${c.id === q.category ? "selected" : ""}>${c.icon} ${c.label}</option>`).join("")}
    </select>
    <label>Pitanje</label>
    <textarea id="formQuestion" rows="2">${q.q}</textarea>
    <label>Ponuđeni odgovori (označite tačan)</label>
    ${q.a.map((ans, i) => `
      <div class="answer-row">
        <input type="radio" name="formCorrect" value="${i}" ${i === q.correct ? "checked" : ""} />
        <input type="text" class="form-answer" data-idx="${i}" value="${ans.replace(/"/g, "&quot;")}" placeholder="Odgovor ${i + 1}" />
      </div>
    `).join("")}
    <label class="checkbox-label">
      <input type="checkbox" id="formActive" ${q.active ? "checked" : ""} />
      Aktivno (uključeno u kviz)
    </label>
    <div class="form-actions">
      <button id="formSaveBtn">💾 Sačuvaj</button>
      ${editingId ? "" : '<button id="formSaveNewBtn" class="btn-secondary">💾 Sačuvaj i dodaj novo</button>'}
      <button id="formCancelBtn" class="btn-secondary">Otkaži</button>
    </div>
  `;
  questionForm.scrollIntoView({ behavior: "smooth", block: "center" });
  document.getElementById("formQuestion").focus();
  document.getElementById("formSaveBtn").addEventListener("click", () => saveQuestion(false));
  const saveNewBtn = document.getElementById("formSaveNewBtn");
  if (saveNewBtn) saveNewBtn.addEventListener("click", () => saveQuestion(true));
  document.getElementById("formCancelBtn").addEventListener("click", closeForm);
}

function closeForm() {
  editingId = null;
  questionForm.hidden = true;
  questionForm.innerHTML = "";
}

function showFormError(message) {
  const el = document.getElementById("formError");
  el.textContent = message;
  el.hidden = false;
}

async function saveQuestion(keepOpenForNext) {
  const category = document.getElementById("formCategory").value;
  const questionText = document.getElementById("formQuestion").value.trim();
  const answers = Array.from(document.querySelectorAll(".form-answer")).map((el) => el.value.trim());
  const correctRadio = document.querySelector('input[name="formCorrect"]:checked');
  const active = document.getElementById("formActive").checked;

  if (!questionText) {
    showFormError("Unesite tekst pitanja.");
    return;
  }
  if (answers.some((a) => !a)) {
    showFormError("Popunite sva 4 ponuđena odgovora.");
    return;
  }
  const normalized = answers.map((a) => a.toLowerCase());
  if (new Set(normalized).size !== normalized.length) {
    showFormError("Dva ili više ponuđenih odgovora su identična — svaki odgovor mora biti različit.");
    return;
  }
  if (!correctRadio) {
    showFormError("Označite koji je od ponuđenih odgovora tačan.");
    return;
  }

  const data = { category, q: questionText, a: answers, correct: Number(correctRadio.value), active };

  const saveBtn = document.getElementById("formSaveBtn");
  const saveNewBtn = document.getElementById("formSaveNewBtn");
  [saveBtn, saveNewBtn].forEach((b) => b && (b.disabled = true));

  try {
    if (editingId) {
      await db.collection("questions").doc(editingId).update(data);
    } else {
      await db.collection("questions").add(data);
    }
  } catch (err) {
    showFormError("Greška prilikom čuvanja: " + err.message);
    [saveBtn, saveNewBtn].forEach((b) => b && (b.disabled = false));
    return;
  }

  await loadQuestions();

  if (keepOpenForNext) {
    openForm(null, category);
  } else {
    closeForm();
  }
}

async function deleteQuestion(id) {
  if (!confirm("Obrisati ovo pitanje?")) return;
  await db.collection("questions").doc(id).delete();
  loadQuestions();
}

async function toggleActive(id, active) {
  await db.collection("questions").doc(id).update({ active });
  const q = allQuestions.find((x) => x.id === id);
  if (q) q.active = active;
  renderQuestions();
}

async function seedQuestions() {
  if (allQuestions.length > 0) {
    if (!confirm(`Baza već ima ${allQuestions.length} pitanja. Ipak dodati ugrađenih ${QUESTIONS.length} pitanja (mogući duplikati)?`)) return;
  } else if (!confirm(`Uvesti ugrađenih ${QUESTIONS.length} pitanja u bazu?`)) {
    return;
  }
  seedBtn.disabled = true;
  seedBtn.textContent = "Uvozim...";
  const batchSize = 400;
  for (let i = 0; i < QUESTIONS.length; i += batchSize) {
    const batch = db.batch();
    QUESTIONS.slice(i, i + batchSize).forEach((q) => {
      const ref = db.collection("questions").doc();
      batch.set(ref, { category: q.category, q: q.q, a: q.a, correct: q.correct, active: true });
    });
    await batch.commit();
  }
  seedBtn.disabled = false;
  seedBtn.textContent = "⬇️ Uvezi ugrađena pitanja";
  loadQuestions();
}

// ---------- Rezultati ----------

async function loadResults() {
  resultsTableWrap.innerHTML = "<p class='muted-text'>Učitavanje...</p>";
  const snapshot = await db.collection("results").orderBy("createdAt", "desc").get();
  allResults = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  renderResults();
}

const RESULT_MEDALS = ["🥇", "🥈", "🥉"];

function renderResults() {
  const filter = resultsCategoryFilter.value;
  let filtered = filter === "all" ? allResults : allResults.filter((r) => r.category === filter);

  const count = filtered.length;
  const avg = count ? Math.round(filtered.reduce((sum, r) => sum + r.percent, 0) / count) : 0;
  const best = count ? Math.max(...filtered.map((r) => r.percent)) : 0;

  statsRow.innerHTML = `
    <div class="stat-card"><div class="stat-value">${count}</div><div class="stat-label">Rješavanja</div></div>
    <div class="stat-card"><div class="stat-value">${avg}%</div><div class="stat-label">Prosjek</div></div>
    <div class="stat-card"><div class="stat-value">${best}%</div><div class="stat-label">Najbolji rezultat</div></div>
  `;

  if (filtered.length === 0) {
    resultsTableWrap.innerHTML = "<p class='muted-text'>Nema rezultata za odabrani filter.</p>";
    return;
  }

  const byRank = resultsSort.value === "rank";
  filtered = byRank
    ? [...filtered].sort((a, b) => b.percent - a.percent || b.score - a.score)
    : [...filtered].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

  const rows = filtered
    .map((r, idx) => {
      const rankCell = byRank ? (idx < 3 ? RESULT_MEDALS[idx] : `${idx + 1}.`) : "—";
      return `
      <tr class="${byRank && idx < 3 ? "rank-row-" + (idx + 1) : ""}">
        <td>${rankCell}</td>
        <td>${r.name}</td>
        <td>${r.categoryLabel || categoryLabel(r.category)}</td>
        <td>${r.score}/${r.total}</td>
        <td>${r.percent}%</td>
        <td>${formatDate(r.createdAt)}</td>
        <td><button class="icon-btn delete-result-btn" data-id="${r.id}">🗑️</button></td>
      </tr>`;
    })
    .join("");

  resultsTableWrap.innerHTML = `
    <table class="results-table">
      <thead><tr><th>#</th><th>Ime</th><th>Kategorija</th><th>Rezultat</th><th>%</th><th>Datum</th><th></th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  resultsTableWrap.querySelectorAll(".delete-result-btn").forEach((btn) => {
    btn.addEventListener("click", () => deleteResult(btn.dataset.id));
  });
}

function formatDate(ts) {
  if (!ts || !ts.toDate) return "—";
  return ts.toDate().toLocaleString("bs-BA");
}

async function deleteResult(id) {
  if (!confirm("Obrisati ovaj rezultat?")) return;
  await db.collection("results").doc(id).delete();
  loadResults();
}

function exportCsv() {
  const filter = resultsCategoryFilter.value;
  const filtered = filter === "all" ? allResults : allResults.filter((r) => r.category === filter);
  const header = "Ime,Kategorija,Rezultat,Postotak,Datum\n";
  const rows = filtered
    .map((r) => [r.name, r.categoryLabel || categoryLabel(r.category), `${r.score}/${r.total}`, `${r.percent}%`, formatDate(r.createdAt)]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(","))
    .join("\n");
  const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "sumarski-kviz-rezultati.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// ---------- Event listeneri ----------

loginBtn.addEventListener("click", login);
loginPassword.addEventListener("keydown", (e) => {
  if (e.key === "Enter") login();
});
logoutBtn.addEventListener("click", logout);

tabBtns.forEach((btn) => btn.addEventListener("click", () => switchTab(btn.dataset.tab)));

categoryFilter.addEventListener("change", renderQuestions);
questionSearch.addEventListener("input", renderQuestions);
addQuestionBtn.addEventListener("click", () => openForm(null));
seedBtn.addEventListener("click", seedQuestions);

resultsCategoryFilter.addEventListener("change", renderResults);
resultsSort.addEventListener("change", renderResults);
exportCsvBtn.addEventListener("click", exportCsv);
refreshResultsBtn.addEventListener("click", loadResults);

populateCategorySelects();
initAuth();
