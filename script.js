// script.js complet

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDxfxlXSJNmV_LOTMfWDPfh5WEMGZiU0cw",
  authDomain: "quiz-cmi.firebaseapp.com",
  databaseURL: "https://quiz-cmi-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "quiz-cmi",
  storageBucket: "quiz-cmi.appspot.com",
  messagingSenderId: "442390350641",
  appId: "1:442390350641:web:373dabe481fb9242147e10",
  measurementId: "G-J38H6PLV06"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Références DOM
const homeScreen = document.getElementById("home-screen");
const joueurScreen = document.getElementById("joueur-screen");
const adminScreen = document.getElementById("admin-screen");
const questionTitle = document.getElementById("question-title");
const optionsDiv = document.getElementById("options");
const scoreContainer = document.getElementById("score-container");

const joueurBtn = document.getElementById("joueur-btn");
const adminBtn = document.getElementById("admin-btn");
const startBtn = document.getElementById("start-btn");
const validateAdminBtn = document.getElementById("validate-admin-btn");
const refreshBtn = document.getElementById("refresh-btn");
const resetBtn = document.getElementById("reset-btn");

const teamnameInput = document.getElementById("teamname");
const adminPasswordInput = document.getElementById("admin-password");
const adminResultsDiv = document.getElementById("admin-results");

const editQuestionsDiv = document.getElementById("edit-questions");
const questionList = document.getElementById("questions-list");

// État du quiz
let questions = [];
let currentIndex = 0;
let score = 0;
let currentTeam = "";

// Fonctions
function loadQuestionsFromDB() {
  db.ref("questions").once("value", (snapshot) => {
    questions = Object.entries(snapshot.val() || {}).map(([id, q]) => ({ ...q, id }));
  });
}

function showQuestion() {
  if (currentIndex >= questions.length) {
    db.ref("results/" + currentTeam).set(score);
    questionTitle.style.display = "none";
    optionsDiv.style.display = "none";
    scoreContainer.innerText = `Score : ${score} / ${questions.length}`;
    scoreContainer.style.display = "block";
    return;
  }
  const q = questions[currentIndex];
  questionTitle.innerText = q.text;
  questionTitle.style.display = "block";
  optionsDiv.innerHTML = "";
  optionsDiv.style.display = "block";

  if (q.type === "libre") {
    const input = document.createElement("input");
    input.placeholder = "Votre réponse";
    const submit = document.createElement("button");
    submit.textContent = "Valider";
    submit.onclick = () => {
      currentIndex++;
      showQuestion();
    };
    optionsDiv.append(input, submit);
  } else {
    q.options.forEach((opt, i) => {
      const btn = document.createElement("button");
      btn.innerText = opt;
      btn.onclick = () => {
        if (i === q.answer) score++;
        currentIndex++;
        showQuestion();
      };
      optionsDiv.appendChild(btn);
    });
  }
}

function displayResults() {
  db.ref("results").once("value", (snap) => {
    const results = snap.val() || {};
    const sorted = Object.entries(results).sort(([, a], [, b]) => b - a);
    adminResultsDiv.innerHTML = sorted.map(([team, score]) => `<p><strong>${team}</strong> : ${score}</p>`).join("");
  });
}

function displayQuestionsForAdmin() {
  questionList.innerHTML = "";
  questions.forEach((q) => {
    const div = document.createElement("div");
    div.innerHTML = `<strong>${q.text}</strong><br><button onclick="deleteQuestion('${q.id}')">🗑 Supprimer</button><hr>`;
    questionList.appendChild(div);
  });
}

function deleteQuestion(id) {
  db.ref("questions/" + id).remove().then(() => {
    loadQuestionsFromDB();
    setTimeout(displayQuestionsForAdmin, 500);
  });
}

// Événements
joueurBtn.onclick = () => {
  homeScreen.style.display = "none";
  joueurScreen.style.display = "block";
};

adminBtn.onclick = () => {
  homeScreen.style.display = "none";
  adminScreen.style.display = "block";
};

startBtn.onclick = () => {
  currentTeam = teamnameInput.value.trim();
  if (!currentTeam) return alert("Veuillez entrer un nom d'équipe.");
  joueurScreen.style.display = "none";
  loadQuestionsFromDB();
  setTimeout(showQuestion, 500);
};

validateAdminBtn.onclick = () => {
  const pass = adminPasswordInput.value;
  if (pass !== "100719") return alert("Mot de passe incorrect");
  validateAdminBtn.style.display = "none";
  adminPasswordInput.style.display = "none";
  refreshBtn.style.display = resetBtn.style.display = "inline-block";
  editQuestionsDiv.style.display = "block";
  loadQuestionsFromDB();
  setTimeout(() => {
    displayResults();
    displayQuestionsForAdmin();
  }, 500);
};

refreshBtn.onclick = displayResults;
resetBtn.onclick = () => {
  if (confirm("Confirmer la réinitialisation ?")) {
    db.ref("results").remove();
    displayResults();
  }
};

// Ajouter une question
const addBtn = document.getElementById("add-question-btn");
addBtn.onclick = () => {
  const text = document.getElementById("new-question").value;
  const type = document.getElementById("question-type").value;
  const options = [...document.getElementsByClassName("option-input")].map(i => i.value).filter(v => v);
  const answer = parseInt(document.getElementById("correct-answer").value);

  const data = { text, type };
  if (type === "choix") {
    data.options = options;
    data.answer = answer;
  }

  db.ref("questions").push(data);
  loadQuestionsFromDB();
  setTimeout(displayQuestionsForAdmin, 500);
};

// Auto refresh toutes les 10 sec pour l’admin
setInterval(() => {
  if (adminScreen.style.display !== "none") displayResults();
}, 10000);
