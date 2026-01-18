/**
 * Data Module - Lädt und verwaltet die Fragen-Datenbank
 */

// Globales Datenobjekt
let questionsData = null;

/**
 * Lädt die Fragen aus der JSON-Datei
 */
async function loadQuestionsData() {
    try {
        const response = await fetch('data/questions.json');
        if (!response.ok) {
            throw new Error('Konnte Fragen nicht laden');
        }
        questionsData = await response.json();
        console.log('Fragen geladen:', questionsData.metadata);
        return questionsData;
    } catch (error) {
        console.error('Fehler beim Laden der Fragen:', error);
        // Fallback: Zeige Fehlermeldung
        showLoadError();
        return null;
    }
}

/**
 * Zeigt einen Ladefehler an
 */
function showLoadError() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div style="text-align: center; padding: 60px 20px;">
            <h2>⚠️ Fehler beim Laden</h2>
            <p style="color: var(--text-secondary); margin-top: 16px;">
                Die Fragen-Datenbank konnte nicht geladen werden.
            </p>
            <p style="color: var(--text-muted); margin-top: 8px;">
                Stelle sicher, dass die App über einen lokalen Server läuft.
            </p>
            <button onclick="location.reload()" class="btn btn-primary" style="margin-top: 24px;">
                Erneut versuchen
            </button>
        </div>
    `;
}

/**
 * Gibt alle Themen zurück
 */
function getTopics() {
    if (!questionsData) return [];
    return questionsData.topics;
}

/**
 * Gibt Fragen für ein bestimmtes Thema zurück
 */
function getQuestionsByTopic(topicId) {
    if (!questionsData) return [];

    const mcQuestions = questionsData.mcQuestions.filter(q => q.topicId === topicId);
    const openQuestions = questionsData.openQuestions.filter(q => q.topicId === topicId);

    return { mcQuestions, openQuestions };
}

/**
 * Gibt zufällige Fragen für Prüfungssimulation zurück
 */
function getExamQuestions(mcCount = 20, openCount = 3) {
    if (!questionsData) return { mc: [], open: [] };

    // Nur Single-Choice Fragen für Prüfung
    const singleChoice = questionsData.mcQuestions.filter(q => !q.isMultiSelect);

    // Shuffle und auswählen
    const shuffledMC = shuffleArray([...singleChoice]);
    const shuffledOpen = shuffleArray([...questionsData.openQuestions]);

    return {
        mc: shuffledMC.slice(0, mcCount),
        open: shuffledOpen.slice(0, openCount)
    };
}

/**
 * Gibt alle MC-Fragen zurück (für gemischten Quiz)
 */
function getAllMCQuestions() {
    if (!questionsData) return [];
    return questionsData.mcQuestions;
}

/**
 * Gibt Metadaten zurück
 */
function getMetadata() {
    if (!questionsData) return null;
    return questionsData.metadata;
}

/**
 * Hilfsfunktion: Array mischen (Fisher-Yates)
 */
function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}
