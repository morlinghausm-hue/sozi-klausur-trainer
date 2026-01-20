/**
 * Quiz Module - Kernlogik für Quiz und Prüfungssimulation
 */

class QuizEngine {
    constructor() {
        this.questions = [];
        this.currentIndex = 0;
        this.answers = [];
        this.mode = 'learn'; // 'learn' oder 'exam'
        this.topicId = null;
        this.topicName = '';
    }

    /**
     * Startet einen Quiz mit bestimmten Fragen
     */
    start(questions, options = {}) {
        this.questions = shuffleArray([...questions]);
        this.currentIndex = 0;
        this.answers = [];
        this.mode = options.mode || 'learn';
        this.topicId = options.topicId || null;
        this.topicName = options.topicName || 'Gemischt';

        return this.getCurrentQuestion();
    }

    /**
     * Gibt die aktuelle Frage zurück
     */
    getCurrentQuestion() {
        if (this.currentIndex >= this.questions.length) {
            return null;
        }
        return this.questions[this.currentIndex];
    }

    /**
     * Prüft die Antwort
     */
    checkAnswer(selectedIndices) {
        const question = this.getCurrentQuestion();
        if (!question) return null;

        // Finde die richtigen Antworten
        const correctIndices = [];
        question.options.forEach((opt, idx) => {
            if (opt.correct) {
                correctIndices.push(idx);
            }
        });

        // Vergleiche
        const isCorrect = this._arraysEqual(
            [...selectedIndices].sort(),
            [...correctIndices].sort()
        );

        // Speichere Antwort
        this.answers.push({
            questionId: question.id,
            topicId: question.topicId,
            selectedIndices,
            correctIndices,
            isCorrect
        });

        // Im Lernmodus: Speichere Progress
        if (this.mode === 'learn') {
            recordAnswer(question.id, question.topicId, isCorrect);
        }

        return {
            isCorrect,
            correctIndices,
            explanation: question.explanation || ''
        };
    }

    /**
     * Geht zur nächsten Frage
     */
    next() {
        this.currentIndex++;
        return this.getCurrentQuestion();
    }

    /**
     * Gibt den aktuellen Fortschritt zurück
     */
    getProgress() {
        return {
            current: this.currentIndex + 1,
            total: this.questions.length,
            percentage: Math.round(((this.currentIndex + 1) / this.questions.length) * 100)
        };
    }

    /**
     * Gibt die Ergebnisse zurück
     */
    getResults() {
        const correct = this.answers.filter(a => a.isCorrect).length;
        const total = this.answers.length;

        return {
            correct,
            total,
            percentage: total > 0 ? Math.round((correct / total) * 100) : 0,
            answers: this.answers
        };
    }

    /**
     * Prüft ob Quiz beendet ist
     */
    isComplete() {
        return this.currentIndex >= this.questions.length;
    }

    /**
     * Hilfsfunktion: Arrays vergleichen
     */
    _arraysEqual(a, b) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }
}

// Globale Quiz-Instanz
const quizEngine = new QuizEngine();

/**
 * Rendert die aktuelle Frage
 */
function renderQuestion(question) {
    const container = document.getElementById('optionsContainer');
    const questionText = document.getElementById('questionText');
    const difficultyBadge = document.getElementById('difficultyBadge');
    const typeBadge = document.getElementById('typeBadge');
    const submitBtn = document.getElementById('submitAnswer');
    const nextBtn = document.getElementById('nextQuestion');
    const feedbackContainer = document.getElementById('feedbackContainer');

    // Reset UI
    feedbackContainer.classList.add('hidden');
    feedbackContainer.classList.remove('correct', 'incorrect');
    submitBtn.classList.remove('hidden');
    nextBtn.classList.add('hidden');

    // Setze Frage
    questionText.textContent = question.stem;

    // Badges
    difficultyBadge.textContent = question.difficulty || 'Medium';
    difficultyBadge.className = 'difficulty-badge ' + (question.difficulty || 'medium');

    typeBadge.textContent = question.isMultiSelect ? 'Wähle alle zutreffenden' : 'Single Choice';

    // Source Badge (Student/KI) hinzufügen
    const badgeContainer = document.getElementById('questionBadge');
    let sourceBadge = badgeContainer.querySelector('.source-badge');
    if (!sourceBadge) {
        sourceBadge = document.createElement('span');
        sourceBadge.className = 'source-badge';
        badgeContainer.appendChild(sourceBadge);
    }
    sourceBadge.textContent = question.sourceLabel || '📝 Frage';
    sourceBadge.className = 'source-badge ' + (question.sourceType || '');

    // Render Optionen
    container.innerHTML = '';
    question.options.forEach((option, index) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn' + (question.isMultiSelect ? ' checkbox' : '');
        btn.dataset.index = index;

        const letter = String.fromCharCode(65 + index); // A, B, C, D

        btn.innerHTML = `
            <span class="option-indicator">${letter}</span>
            <span class="option-text">${option.text}</span>
        `;

        btn.addEventListener('click', () => handleOptionClick(btn, question.isMultiSelect));
        container.appendChild(btn);
    });

    // Update Progress
    const progress = quizEngine.getProgress();
    document.getElementById('questionNumber').textContent = progress.current;
    document.getElementById('totalQuestions').textContent = progress.total;
    document.getElementById('quizProgressBar').style.width = `${progress.percentage}%`;
}

/**
 * Behandelt Klick auf Option
 */
function handleOptionClick(button, isMultiSelect) {
    if (button.classList.contains('disabled')) return;

    if (isMultiSelect) {
        // Toggle bei Multi-Select
        button.classList.toggle('selected');
    } else {
        // Single-Select: Nur eine auswählen
        document.querySelectorAll('.option-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        button.classList.add('selected');
    }

    // Aktiviere Submit-Button wenn mindestens eine Auswahl
    const hasSelection = document.querySelector('.option-btn.selected');
    document.getElementById('submitAnswer').disabled = !hasSelection;
}

/**
 * Behandelt Antwort-Submission
 */
function handleSubmitAnswer() {
    const selectedButtons = document.querySelectorAll('.option-btn.selected');
    const selectedIndices = Array.from(selectedButtons).map(btn => parseInt(btn.dataset.index));

    if (selectedIndices.length === 0) return;

    // Prüfe Antwort
    const result = quizEngine.checkAnswer(selectedIndices);

    // Zeige Feedback
    showFeedback(result);

    // Deaktiviere Optionen
    document.querySelectorAll('.option-btn').forEach((btn, idx) => {
        btn.classList.add('disabled');

        if (result.correctIndices.includes(idx)) {
            btn.classList.add('correct');
        } else if (selectedIndices.includes(idx)) {
            btn.classList.add('incorrect');
        }
    });

    // Wechsle Buttons
    document.getElementById('submitAnswer').classList.add('hidden');
    document.getElementById('nextQuestion').classList.remove('hidden');
}

/**
 * Zeigt Feedback an
 */
function showFeedback(result) {
    const container = document.getElementById('feedbackContainer');
    const header = container.querySelector('.feedback-header');
    const explanation = document.getElementById('feedbackExplanation');

    container.classList.remove('hidden', 'correct', 'incorrect');
    container.classList.add(result.isCorrect ? 'correct' : 'incorrect');

    header.innerHTML = result.isCorrect
        ? '<span class="feedback-icon">✓</span><span class="feedback-text">Richtig!</span>'
        : '<span class="feedback-icon">✗</span><span class="feedback-text">Leider falsch</span>';

    explanation.textContent = result.explanation;
}

/**
 * Geht zur nächsten Frage
 */
function handleNextQuestion() {
    const next = quizEngine.next();

    if (next) {
        renderQuestion(next);
    } else {
        // Quiz beendet
        showQuizComplete();
    }
}

/**
 * Zeigt Quiz-Ende an
 */
function showQuizComplete() {
    const results = quizEngine.getResults();
    const card = document.getElementById('questionCard');

    card.innerHTML = `
        <div class="quiz-complete">
            <div class="complete-icon">${results.percentage >= 70 ? '🎉' : '💪'}</div>
            <h2>Quiz beendet!</h2>
            <div class="score-display">
                <span class="score-big">${results.percentage}%</span>
                <span class="score-detail">${results.correct} / ${results.total} richtig</span>
            </div>
            <p class="completion-message">
                ${results.percentage >= 90 ? 'Ausgezeichnet! Du beherrschst dieses Thema.' :
            results.percentage >= 70 ? 'Gut gemacht! Weiter so.' :
                results.percentage >= 50 ? 'Nicht schlecht, aber da geht noch mehr!' :
                    'Übe dieses Thema noch einmal.'}
            </p>
            <div class="complete-actions">
                <button class="btn btn-primary" onclick="restartQuiz()">Nochmal üben</button>
                <button class="btn btn-secondary" onclick="showView('topics')">Themen wählen</button>
            </div>
        </div>
    `;
}

/**
 * Startet Quiz für ein Thema
 */
function startTopicQuiz(topicId, topicName) {
    const { mcQuestions, openQuestions } = getQuestionsByTopic(topicId);

    // Kombiniere MC und offene Fragen
    const allQuestions = [...mcQuestions];

    // Füge 1-2 offene Fragen hinzu wenn vorhanden
    if (openQuestions.length > 0) {
        const shuffledOpen = shuffleArray([...openQuestions]).slice(0, 2);
        shuffledOpen.forEach(q => {
            q.questionType = 'open';
        });
        allQuestions.push(...shuffledOpen);
    }

    if (allQuestions.length === 0) {
        alert('Keine Fragen für dieses Thema gefunden.');
        return;
    }

    // Stelle das Question Card HTML wieder her (falls durch Quiz-Ende überschrieben)
    resetQuestionCard();

    quizEngine.start(allQuestions, {
        mode: 'learn',
        topicId,
        topicName
    });

    document.getElementById('quizTopic').textContent = topicName;
    showView('quiz');
    renderQuestion(quizEngine.getCurrentQuestion());
}

/**
 * Startet gemischten Quiz
 */
function startMixedQuiz() {
    const allQuestions = getAllMCQuestions();

    // Bevorzuge Fragen, die zur Wiederholung anstehen
    const dueQuestionIds = getQuestionsForReview();
    const dueQuestions = allQuestions.filter(q => dueQuestionIds.includes(q.id));
    const otherQuestions = allQuestions.filter(q => !dueQuestionIds.includes(q.id));

    // Kombiniere: Erst fällige, dann zufällige
    const combined = [...dueQuestions, ...shuffleArray(otherQuestions)].slice(0, 15);

    quizEngine.start(combined, {
        mode: 'learn',
        topicName: 'Gemischter Quiz'
    });

    document.getElementById('quizTopic').textContent = 'Gemischter Quiz';
    showView('quiz');
    renderQuestion(quizEngine.getCurrentQuestion());
}

/**
 * Startet Quiz erneut
 */
function restartQuiz() {
    const topicId = quizEngine.topicId;
    const topicName = quizEngine.topicName;

    if (topicId) {
        startTopicQuiz(topicId, topicName);
    } else {
        startMixedQuiz();
    }
}

// CSS für Quiz-Ende
const quizCompleteStyle = document.createElement('style');
quizCompleteStyle.textContent = `
    .quiz-complete {
        text-align: center;
        padding: 40px 20px;
    }
    .complete-icon {
        font-size: 4rem;
        margin-bottom: 16px;
    }
    .score-display {
        margin: 24px 0;
    }
    .score-big {
        display: block;
        font-size: 3rem;
        font-weight: 700;
        background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }
    .score-detail {
        color: var(--text-secondary);
        font-size: 1.1rem;
    }
    .completion-message {
        color: var(--text-secondary);
        margin-bottom: 32px;
    }
    .complete-actions {
        display: flex;
        gap: 12px;
        justify-content: center;
    }
`;
document.head.appendChild(quizCompleteStyle);

/**
 * Stellt das Question Card HTML wieder her
 */
function resetQuestionCard() {
    const card = document.getElementById('questionCard');
    card.innerHTML = `
        <div class="question-badge" id="questionBadge">
            <span class="difficulty-badge" id="difficultyBadge">Medium</span>
            <span class="type-badge" id="typeBadge">Single Choice</span>
        </div>
        
        <h3 class="question-text" id="questionText"></h3>
        
        <div class="options-container" id="optionsContainer">
        </div>

        <div class="feedback-container hidden" id="feedbackContainer">
            <div class="feedback-header" id="feedbackHeader">
                <span class="feedback-icon"></span>
                <span class="feedback-text"></span>
            </div>
            <div class="feedback-explanation" id="feedbackExplanation"></div>
        </div>

        <div class="question-actions">
            <button class="btn btn-primary hidden" id="submitAnswer">Antwort prüfen</button>
            <button class="btn btn-primary hidden" id="nextQuestion">Weiter →</button>
        </div>
    `;

    // Event Listeners neu setzen
    document.getElementById('submitAnswer').addEventListener('click', handleSubmitAnswer);
    document.getElementById('nextQuestion').addEventListener('click', handleNextQuestion);
}

/**
 * Rendert eine offene Frage
 */
function renderOpenQuestion(question) {
    const card = document.getElementById('questionCard');

    card.innerHTML = `
        <div class="question-badge" id="questionBadge">
            <span class="difficulty-badge ${question.difficulty || 'medium'}">${question.difficulty || 'Medium'}</span>
            <span class="type-badge">✍️ Offene Frage</span>
            <span class="source-badge ${question.sourceType || ''}">${question.sourceLabel || '📝 Frage'}</span>
        </div>
        
        <h3 class="question-text">${question.stem}</h3>
        
        <div class="open-question-container">
            <textarea id="openAnswer" class="open-answer-textarea" placeholder="Schreibe deine Antwort hier..." rows="6"></textarea>
        </div>

        <div class="model-answer-container hidden" id="modelAnswerContainer">
            <h4>📖 Musterlösung:</h4>
            <p class="model-answer-text">${question.modelAnswer || ''}</p>
            ${question.keyPoints ? `
                <h4>🎯 Wichtige Punkte:</h4>
                <ul class="key-points-list">
                    ${question.keyPoints.map(p => `<li>${p}</li>`).join('')}
                </ul>
            ` : ''}
        </div>

        <div class="question-actions">
            <button class="btn btn-primary" id="openShowSolution">Lösung zeigen</button>
            <button class="btn btn-primary hidden" id="openNextQuestion">Weiter →</button>
        </div>
    `;

    // Flag um doppelte Registrierung zu verhindern
    let answerRecorded = false;

    // Event Listener für "Lösung zeigen"
    const showSolutionBtn = document.getElementById('openShowSolution');
    const nextBtn = document.getElementById('openNextQuestion');

    showSolutionBtn.addEventListener('click', () => {
        document.getElementById('modelAnswerContainer').classList.remove('hidden');
        showSolutionBtn.classList.add('hidden');
        nextBtn.classList.remove('hidden');

        // Nur einmal registrieren
        if (!answerRecorded) {
            answerRecorded = true;

            // Im Storage speichern
            recordAnswer(question.id, question.topicId, true);

            // Im quizEngine registrieren für korrekte Ergebnisberechnung
            quizEngine.answers.push({
                questionId: question.id,
                topicId: question.topicId,
                selectedIndices: [],
                correctIndices: [],
                isCorrect: true
            });
        }
    });

    // Event Listener für "Weiter" - verwendet eigene ID um Konflikte zu vermeiden
    nextBtn.addEventListener('click', () => {
        // Zur nächsten Frage gehen
        const next = quizEngine.next();
        if (next) {
            renderQuestion(next);
        } else {
            showQuizComplete();
        }
    });

    // Update Progress
    const progress = quizEngine.getProgress();
    document.getElementById('questionNumber').textContent = progress.current;
    document.getElementById('totalQuestions').textContent = progress.total;
    document.getElementById('quizProgressBar').style.width = `${progress.percentage}%`;
}

// Erweitere renderQuestion um offene Fragen zu erkennen
const originalRenderQuestion = renderQuestion;
renderQuestion = function (question) {
    if (question.questionType === 'open') {
        renderOpenQuestion(question);
    } else {
        // WICHTIG: Prüfe ob das MC-Layout noch existiert (könnte nach offener Frage fehlen)
        const optionsContainer = document.getElementById('optionsContainer');
        if (!optionsContainer) {
            // Layout wurde durch offene Frage ersetzt - wiederherstellen
            resetQuestionCard();
        }
        originalRenderQuestion(question);
    }
};

// CSS für offene Fragen
const openQuestionStyle = document.createElement('style');
openQuestionStyle.textContent = `
    .open-answer-textarea {
        width: 100%;
        padding: 16px;
        border: 2px solid var(--border-color);
        border-radius: var(--border-radius);
        background: var(--bg-secondary);
        color: var(--text-primary);
        font-family: inherit;
        font-size: 1rem;
        resize: vertical;
        margin-top: 16px;
    }
    .open-answer-textarea:focus {
        outline: none;
        border-color: var(--primary-color);
    }
    .model-answer-container {
        margin-top: 24px;
        padding: 20px;
        background: var(--bg-secondary);
        border-radius: var(--border-radius);
        border-left: 4px solid var(--success-color);
    }
    .model-answer-container h4 {
        color: var(--success-color);
        margin-bottom: 12px;
        font-size: 1rem;
    }
    .model-answer-text {
        color: var(--text-primary);
        line-height: 1.6;
        white-space: pre-wrap;
    }
    .key-points-list {
        margin-top: 8px;
        padding-left: 20px;
    }
    .key-points-list li {
        color: var(--text-secondary);
        margin-bottom: 6px;
    }
`;
document.head.appendChild(openQuestionStyle);

