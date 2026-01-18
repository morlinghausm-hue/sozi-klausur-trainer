/**
 * Storage Module - Speichert Lernfortschritt in LocalStorage
 */

const STORAGE_KEY = 'klausurTrainer_progress';

/**
 * Initialisiert den Storage mit Standardwerten
 */
function initStorage() {
    if (!localStorage.getItem(STORAGE_KEY)) {
        const defaultProgress = {
            totalAnswered: 0,
            correctAnswers: 0,
            streak: 0,
            maxStreak: 0,
            topicProgress: {},
            questionHistory: {},
            lastSession: null,
            examResults: []
        };
        saveProgress(defaultProgress);
    }
    return getProgress();
}

/**
 * Holt den gespeicherten Fortschritt
 */
function getProgress() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : initStorage();
}

/**
 * Speichert den Fortschritt
 */
function saveProgress(progress) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

/**
 * Aktualisiert nach einer beantworteten Frage
 */
function recordAnswer(questionId, topicId, isCorrect) {
    const progress = getProgress();

    // Globale Stats
    progress.totalAnswered++;
    if (isCorrect) {
        progress.correctAnswers++;
        progress.streak++;
        progress.maxStreak = Math.max(progress.maxStreak, progress.streak);
    } else {
        progress.streak = 0;
    }

    // Topic Progress
    if (!progress.topicProgress[topicId]) {
        progress.topicProgress[topicId] = {
            answered: 0,
            correct: 0,
            lastPracticed: null
        };
    }
    progress.topicProgress[topicId].answered++;
    if (isCorrect) {
        progress.topicProgress[topicId].correct++;
    }
    progress.topicProgress[topicId].lastPracticed = new Date().toISOString();

    // Question History (für Spaced Repetition)
    if (!progress.questionHistory[questionId]) {
        progress.questionHistory[questionId] = {
            attempts: 0,
            correct: 0,
            lastAttempt: null,
            nextReview: null
        };
    }
    const qh = progress.questionHistory[questionId];
    qh.attempts++;
    if (isCorrect) {
        qh.correct++;
        // Spaced Repetition: Verlängere Review-Intervall
        const interval = Math.min(qh.correct * 24, 168); // Max 1 Woche
        qh.nextReview = new Date(Date.now() + interval * 60 * 60 * 1000).toISOString();
    } else {
        // Falsches Antwort: Kürzeres Intervall
        qh.nextReview = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 Min
    }
    qh.lastAttempt = new Date().toISOString();

    progress.lastSession = new Date().toISOString();
    saveProgress(progress);

    return progress;
}

/**
 * Speichert Prüfungsergebnis
 */
function recordExamResult(mcCorrect, mcTotal, openAnswered) {
    const progress = getProgress();

    progress.examResults.push({
        date: new Date().toISOString(),
        mcCorrect,
        mcTotal,
        openAnswered,
        percentage: Math.round((mcCorrect / mcTotal) * 100)
    });

    saveProgress(progress);
    return progress;
}

/**
 * Berechnet Statistiken für ein Thema
 */
function getTopicStats(topicId) {
    const progress = getProgress();
    const topicData = progress.topicProgress[topicId];

    if (!topicData) {
        return { answered: 0, correct: 0, percentage: 0 };
    }

    return {
        answered: topicData.answered,
        correct: topicData.correct,
        percentage: topicData.answered > 0
            ? Math.round((topicData.correct / topicData.answered) * 100)
            : 0
    };
}

/**
 * Findet Fragen, die wiederholt werden sollten (Spaced Repetition)
 */
function getQuestionsForReview() {
    const progress = getProgress();
    const now = new Date();
    const dueQuestions = [];

    for (const [questionId, history] of Object.entries(progress.questionHistory)) {
        if (history.nextReview && new Date(history.nextReview) <= now) {
            dueQuestions.push({
                questionId,
                priority: history.correct === 0 ? 1 : (history.attempts / history.correct)
            });
        }
    }

    // Sortiere nach Priorität (häufiger falsch = höhere Priorität)
    dueQuestions.sort((a, b) => b.priority - a.priority);

    return dueQuestions.map(q => q.questionId);
}

/**
 * Findet schwache Themen
 */
function getWeakTopics(threshold = 70) {
    const progress = getProgress();
    const weakTopics = [];

    for (const [topicId, data] of Object.entries(progress.topicProgress)) {
        if (data.answered >= 3) { // Mindestens 3 Fragen beantwortet
            const percentage = Math.round((data.correct / data.answered) * 100);
            if (percentage < threshold) {
                weakTopics.push({
                    topicId: parseInt(topicId),
                    percentage,
                    answered: data.answered
                });
            }
        }
    }

    // Sortiere nach Schwäche (niedrigste Prozent zuerst)
    weakTopics.sort((a, b) => a.percentage - b.percentage);

    return weakTopics;
}

/**
 * Setzt allen Fortschritt zurück
 */
function resetProgress() {
    localStorage.removeItem(STORAGE_KEY);
    return initStorage();
}
