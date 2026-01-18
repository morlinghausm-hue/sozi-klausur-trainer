/**
 * App Module - Hauptlogik und Event-Handler
 */

// App-Zustand
let currentView = 'topics';

/**
 * Initialisiert die App
 */
async function initApp() {
    // Lade Daten
    const data = await loadQuestionsData();
    if (!data) return;

    // Initialisiere Storage
    initStorage();

    // Render UI
    renderTopics();
    renderExamCountdown();
    updateProgressView();

    // Setup Event-Listeners
    setupEventListeners();

    console.log('App initialisiert');
}

/**
 * Setzt alle Event-Listeners
 */
function setupEventListeners() {
    // Navigation Tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const view = tab.dataset.view;
            showView(view);
        });
    });

    // Quiz Actions
    document.getElementById('submitAnswer').addEventListener('click', handleSubmitAnswer);
    document.getElementById('nextQuestion').addEventListener('click', handleNextQuestion);
    document.getElementById('closeQuiz').addEventListener('click', () => showView('topics'));

    // Exam
    document.getElementById('startExam').addEventListener('click', startExam);

    // Open Question Modal
    document.getElementById('closeModal').addEventListener('click', () => {
        document.getElementById('openQuestionModal').classList.add('hidden');
    });
    document.getElementById('showModelAnswer').addEventListener('click', showModelAnswer);
    document.getElementById('closeOpenQuestion').addEventListener('click', handleNextOpenQuestion);
}

/**
 * Wechselt die View
 */
function showView(viewName) {
    // Deaktiviere alle Views
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });

    // Aktiviere gewählte View
    document.getElementById(`${viewName}View`).classList.add('active');

    // Update Nav-Tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.view === viewName);
    });

    currentView = viewName;

    // Spezielle Actions pro View
    if (viewName === 'progress') {
        updateProgressView();
    }
}

/**
 * Rendert die Themen-Übersicht
 */
function renderTopics() {
    const grid = document.getElementById('topicsGrid');
    const topics = getTopics();
    const progress = getProgress();

    grid.innerHTML = '';

    topics.forEach(topic => {
        const stats = getTopicStats(topic.id);
        const { mcQuestions, openQuestions } = getQuestionsByTopic(topic.id);
        const totalQuestions = mcQuestions.length + openQuestions.length;

        const card = document.createElement('div');
        card.className = 'topic-card';
        card.onclick = () => startTopicQuiz(topic.id, topic.name);

        card.innerHTML = `
            <div class="topic-card-header">
                <span class="topic-number">${topic.id}</span>
            </div>
            <h3>${topic.name}</h3>
            <p>${topic.focusFromImpulse || topic.keyConcepts?.[0] || ''}</p>
            <div class="topic-stats">
                <span class="topic-stat">📝 ${totalQuestions} Fragen</span>
                <span class="topic-stat">✓ ${stats.percentage}%</span>
            </div>
            <div class="topic-progress-bar">
                <div class="topic-progress-fill" style="width: ${stats.percentage}%"></div>
            </div>
        `;

        grid.appendChild(card);
    });

    // Gemischter Quiz Button
    const mixedCard = document.createElement('div');
    mixedCard.className = 'topic-card';
    mixedCard.style.background = 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))';
    mixedCard.onclick = startMixedQuiz;

    mixedCard.innerHTML = `
        <div class="topic-card-header">
            <span class="topic-number" style="background: white; color: var(--primary-color);">🎲</span>
        </div>
        <h3 style="color: white;">Gemischter Quiz</h3>
        <p style="color: rgba(255,255,255,0.8);">
            Übe alle Themen gemischt mit Fokus auf schwache Bereiche
        </p>
        <div class="topic-stats" style="color: rgba(255,255,255,0.8);">
            <span class="topic-stat">📝 15 Fragen</span>
            <span class="topic-stat">🔄 Spaced Repetition</span>
        </div>
    `;

    grid.appendChild(mixedCard);
}

let countdownInterval = null;

/**
 * Rendert den Prüfungs-Countdown in Echtzeit
 */
function renderExamCountdown() {
    const metadata = getMetadata();
    if (!metadata || !metadata.examDate) return;

    const container = document.getElementById('examCountdown');

    // Setze Klausurdatum auf 4.2.2026 um 09:00 Uhr
    const examDate = new Date(metadata.examDate);
    examDate.setHours(9, 0, 0, 0);

    const update = () => {
        const now = new Date();
        const diff = examDate - now;

        if (diff <= 0) {
            container.textContent = '🔥 Die Klausur hat begonnen!';
            if (countdownInterval) clearInterval(countdownInterval);
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        // Formatierung mit führenden Nullen
        const h = hours.toString().padStart(2, '0');
        const m = minutes.toString().padStart(2, '0');
        const s = seconds.toString().padStart(2, '0');

        container.innerHTML = `⏳ ${days}d ${h}h ${m}m ${s}s`;
    };

    update(); // Initialer Aufruf

    // Interval stoppen falls schon läuft (vermeidet doppelte Timer)
    if (countdownInterval) clearInterval(countdownInterval);
    countdownInterval = setInterval(update, 1000);
}

/**
 * Aktualisiert die Fortschritts-Ansicht
 */
function updateProgressView() {
    const progress = getProgress();
    const topics = getTopics();

    // Globale Stats
    document.getElementById('totalAnswered').textContent = progress.totalAnswered;
    document.getElementById('correctRate').textContent =
        progress.totalAnswered > 0
            ? `${Math.round((progress.correctAnswers / progress.totalAnswered) * 100)}%`
            : '0%';
    document.getElementById('streakCount').textContent = progress.streak;

    // Topic Progress Liste
    const list = document.getElementById('topicProgressList');
    list.innerHTML = '';

    topics.forEach(topic => {
        const stats = getTopicStats(topic.id);
        const { mcQuestions } = getQuestionsByTopic(topic.id);

        const item = document.createElement('div');
        item.className = 'topic-progress-item';
        item.innerHTML = `
            <div class="topic-progress-info">
                <div class="topic-progress-name">${topic.name}</div>
                <div class="topic-progress-bar-bg">
                    <div class="topic-progress-bar-fill" style="width: ${stats.percentage}%"></div>
                </div>
            </div>
            <div class="topic-progress-percent">${stats.percentage}%</div>
        `;
        list.appendChild(item);
    });

    // Schwache Themen
    const weakTopics = getWeakTopics();
    const weakContainer = document.getElementById('weakTopics');
    const weakList = document.getElementById('weakTopicsList');

    if (weakTopics.length > 0) {
        weakContainer.classList.remove('hidden');
        weakList.innerHTML = '';

        weakTopics.forEach(weak => {
            const topic = topics.find(t => t.id === weak.topicId);
            if (topic) {
                const tag = document.createElement('span');
                tag.className = 'weak-topic-tag';
                tag.textContent = `${topic.name} (${weak.percentage}%)`;
                tag.onclick = () => startTopicQuiz(weak.topicId, topic.name);
                weakList.appendChild(tag);
            }
        });
    } else {
        weakContainer.classList.add('hidden');
    }
}

/**
 * Startet die Prüfungssimulation
 */
let examState = {
    mcQuestions: [],
    openQuestions: [],
    currentMcIndex: 0,
    mcAnswers: [],
    openAnswers: [],
    phase: 'mc' // 'mc' oder 'open'
};

function startExam() {
    const examQuestions = getExamQuestions(20, 3);

    examState = {
        mcQuestions: examQuestions.mc,
        openQuestions: examQuestions.open,
        currentMcIndex: 0,
        mcAnswers: [],
        openAnswers: [],
        phase: 'mc'
    };

    document.getElementById('examIntro').classList.add('hidden');
    document.getElementById('examResults').classList.add('hidden');

    // Nutze den normalen Quiz-Modus für MC-Fragen
    quizEngine.start(examState.mcQuestions, {
        mode: 'exam',
        topicName: 'Prüfungssimulation'
    });

    document.getElementById('quizTopic').textContent = 'Prüfungssimulation';
    showView('quiz');
    renderQuestion(quizEngine.getCurrentQuestion());
}

// Anpassung für Prüfungsmodus
const originalShowFeedback = showFeedback;
showFeedback = function (result) {
    if (quizEngine.mode === 'exam') {
        // Kein Feedback im Prüfungsmodus
        const container = document.getElementById('feedbackContainer');
        container.classList.add('hidden');
    } else {
        originalShowFeedback(result);
    }
};

// Anpassung für Quiz-Ende im Prüfungsmodus
const originalShowQuizComplete = showQuizComplete;
showQuizComplete = function () {
    if (quizEngine.mode === 'exam') {
        // Zeige Prüfungsergebnis
        showExamResults();
    } else {
        originalShowQuizComplete();
    }
};

function showExamResults() {
    const results = quizEngine.getResults();

    // Speichere Ergebnis
    recordExamResult(results.correct, results.total, examState.openQuestions.length);

    showView('exam');
    document.getElementById('examIntro').classList.add('hidden');
    document.getElementById('examResults').classList.remove('hidden');

    document.getElementById('scoreValue').textContent = `${results.percentage}%`;

    const breakdown = document.getElementById('resultsBreakdown');
    breakdown.innerHTML = `
        <div class="result-item">
            <div class="result-value" style="color: var(--success-color)">${results.correct}</div>
            <div class="result-label">Richtig</div>
        </div>
        <div class="result-item">
            <div class="result-value" style="color: var(--error-color)">${results.total - results.correct}</div>
            <div class="result-label">Falsch</div>
        </div>
        <div class="result-item">
            <div class="result-value">${results.total}</div>
            <div class="result-label">Gesamt</div>
        </div>
    `;

    // Speichere Antworten für Review
    document.getElementById('reviewExam').onclick = () => reviewExamAnswers(results.answers);
    document.getElementById('retakeExam').onclick = () => {
        document.getElementById('examIntro').classList.remove('hidden');
        document.getElementById('examResults').classList.add('hidden');
    };
}

function reviewExamAnswers(answers) {
    // Zeige alle Fragen mit korrekten/falschen Markierungen
    const card = document.getElementById('questionCard');

    let html = '<div class="exam-review"><h2>Antworten-Übersicht</h2>';

    answers.forEach((answer, idx) => {
        const question = quizEngine.questions[idx];
        const isCorrect = answer.isCorrect;

        html += `
            <div class="review-item ${isCorrect ? 'correct' : 'incorrect'}">
                <div class="review-header">
                    <span class="review-number">${idx + 1}</span>
                    <span class="review-status">${isCorrect ? '✓' : '✗'}</span>
                </div>
                <p class="review-question">${question.stem}</p>
                <p class="review-explanation">${question.explanation || ''}</p>
            </div>
        `;
    });

    html += '<button class="btn btn-secondary" onclick="showView(\'exam\')">Zurück</button></div>';

    showView('quiz');
    card.innerHTML = html;
}

// Styles für Exam Review
const examReviewStyle = document.createElement('style');
examReviewStyle.textContent = `
    .exam-review {
        padding: 20px;
    }
    .review-item {
        padding: 16px;
        margin-bottom: 12px;
        border-radius: var(--border-radius);
        border-left: 4px solid;
    }
    .review-item.correct {
        background: var(--success-light);
        border-color: var(--success-color);
    }
    .review-item.incorrect {
        background: var(--error-light);
        border-color: var(--error-color);
    }
    .review-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
    }
    .review-number {
        font-weight: 600;
        color: var(--bg-primary);
    }
    .review-status {
        font-size: 1.2rem;
    }
    .review-question {
        color: var(--bg-primary);
        font-weight: 500;
        margin-bottom: 8px;
    }
    .review-explanation {
        color: var(--bg-secondary);
        font-size: 0.9rem;
    }
`;
document.head.appendChild(examReviewStyle);

/**
 * Offene Fragen Modal
 */
let currentOpenQuestionIndex = 0;

function showOpenQuestion(question) {
    const modal = document.getElementById('openQuestionModal');
    document.getElementById('openQuestionText').textContent = question.stem;
    document.getElementById('openQuestionAnswer').value = '';
    document.getElementById('modelAnswerContainer').classList.add('hidden');
    document.getElementById('showModelAnswer').classList.remove('hidden');
    document.getElementById('closeOpenQuestion').classList.add('hidden');

    modal.classList.remove('hidden');
}

function showModelAnswer() {
    const question = examState.openQuestions[currentOpenQuestionIndex];

    document.getElementById('modelAnswer').textContent = question.modelAnswer;

    const keyPointsList = document.getElementById('keyPoints');
    keyPointsList.innerHTML = '';
    (question.keyPoints || []).forEach(point => {
        const li = document.createElement('li');
        li.textContent = point;
        keyPointsList.appendChild(li);
    });

    document.getElementById('modelAnswerContainer').classList.remove('hidden');
    document.getElementById('showModelAnswer').classList.add('hidden');
    document.getElementById('closeOpenQuestion').classList.remove('hidden');

    // Speichere Antwort
    examState.openAnswers.push({
        questionId: question.id,
        userAnswer: document.getElementById('openQuestionAnswer').value
    });
}

function handleNextOpenQuestion() {
    currentOpenQuestionIndex++;

    if (currentOpenQuestionIndex < examState.openQuestions.length) {
        showOpenQuestion(examState.openQuestions[currentOpenQuestionIndex]);
    } else {
        document.getElementById('openQuestionModal').classList.add('hidden');
        // Prüfung wirklich beendet
    }
}

// App starten
document.addEventListener('DOMContentLoaded', initApp);
