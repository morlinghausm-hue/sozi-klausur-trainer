/**
 * Flashcards Module - Karteikarten mit Lernmodus und Confidence-Rating
 */

let flashcardsData = [];
let currentFlashcardIndex = 0;
let filteredFlashcards = [];
let flashcardMode = 'browse'; // 'browse' oder 'learn'
let flashcardProgress = {};

/**
 * Lädt den Lernfortschritt aus localStorage
 */
function loadFlashcardProgress() {
    const saved = localStorage.getItem('flashcardProgress');
    if (saved) {
        try {
            flashcardProgress = JSON.parse(saved);
        } catch (e) {
            flashcardProgress = {};
        }
    }
}

/**
 * Speichert den Lernfortschritt in localStorage
 */
function saveFlashcardProgress() {
    localStorage.setItem('flashcardProgress', JSON.stringify(flashcardProgress));
}

/**
 * Lädt die Karteikarten
 */
async function loadFlashcards() {
    console.log('[Flashcards] Starting to load flashcards...');
    try {
        loadFlashcardProgress();
        const response = await fetch('data/flashcards.json?v=' + Date.now());
        const data = await response.json();
        flashcardsData = data.flashcards;
        filteredFlashcards = [...flashcardsData];

        console.log('[Flashcards] Flashcards loaded:', flashcardsData.length);
        console.log('[Flashcards] Calling initFlashcards()...');
        initFlashcards();
    } catch (error) {
        console.error('[Flashcards] Error loading flashcards:', error);
    }
}

/**
 * Initialisiert die Karteikarten-UI
 */
function initFlashcards() {
    console.log('[Flashcards] Initializing flashcards...');

    // Topic-Select befüllen
    const select = document.getElementById('flashcardTopicSelect');
    if (!select) {
        console.error('[Flashcards] Select element not found!');
        return;
    }

    const topics = getTopics();
    console.log('[Flashcards] Topics from getTopics():', topics);
    console.log('[Flashcards] Number of topics:', topics.length);

    topics.forEach(topic => {
        const option = document.createElement('option');
        option.value = topic.id;
        option.textContent = topic.name;
        select.appendChild(option);
        console.log('[Flashcards] Added topic:', topic.name);
    });

    // Event Listeners
    select.addEventListener('change', filterFlashcards);

    document.getElementById('flashcard').addEventListener('click', flipCard);
    document.getElementById('prevFlashcard').addEventListener('click', prevCard);
    document.getElementById('nextFlashcard').addEventListener('click', nextCard);

    // Mode Toggle Buttons
    const browseModeBtn = document.getElementById('browseModeBtn');
    const learnModeBtn = document.getElementById('learnModeBtn');

    if (browseModeBtn) {
        browseModeBtn.addEventListener('click', () => setFlashcardMode('browse'));
    }
    if (learnModeBtn) {
        learnModeBtn.addEventListener('click', () => setFlashcardMode('learn'));
    }

    // Confidence Buttons
    const confidenceButtons = document.querySelectorAll('.confidence-btn');
    confidenceButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const level = parseInt(btn.dataset.level);
            handleConfidenceRating(level);
        });
    });

    // Initialize Stats HTML if not present
    initializeStatsHTML();

    // Initial Stats Update
    updateFlashcardStats();

    // Erste Karte anzeigen
    showFlashcard(0);

    console.log('[Flashcards] Initialization complete');
}

/**
 * Setzt den Modus (browse/learn)
 */
function setFlashcardMode(mode) {
    flashcardMode = mode;

    const browseModeBtn = document.getElementById('browseModeBtn');
    const learnModeBtn = document.getElementById('learnModeBtn');
    const confidenceArea = document.getElementById('confidenceArea');
    const statsArea = document.getElementById('flashcardStats');
    const navButtons = document.querySelector('.flashcard-actions');

    if (browseModeBtn) browseModeBtn.classList.toggle('active', mode === 'browse');
    if (learnModeBtn) learnModeBtn.classList.toggle('active', mode === 'learn');

    if (mode === 'learn') {
        // Lernmodus aktivieren
        if (confidenceArea) confidenceArea.classList.remove('hidden');
        if (statsArea) statsArea.classList.remove('hidden');
        if (navButtons) navButtons.classList.add('hidden');

        // Karten nach Priorität sortieren
        sortCardsByPriority();
        currentFlashcardIndex = 0;
    } else {
        // Browse-Modus aktivieren
        if (confidenceArea) confidenceArea.classList.add('hidden');
        if (statsArea) statsArea.classList.add('hidden');
        if (navButtons) navButtons.classList.remove('hidden');

        // Normale Sortierung wiederherstellen
        filterFlashcards();
    }

    showFlashcard(currentFlashcardIndex);
}

/**
 * Sortiert Karten nach Lernpriorität (niedrigeres Vertrauen zuerst)
 */
function sortCardsByPriority() {
    const now = Date.now();

    filteredFlashcards.sort((a, b) => {
        const progressA = flashcardProgress[a.id] || { confidence: 0, nextReview: 0 };
        const progressB = flashcardProgress[b.id] || { confidence: 0, nextReview: 0 };

        // Zuerst: Karten die zur Wiederholung anstehen
        const dueA = progressA.nextReview <= now;
        const dueB = progressB.nextReview <= now;

        if (dueA && !dueB) return -1;
        if (!dueA && dueB) return 1;

        // Dann: Nach Vertrauen sortieren (niedrig zuerst)
        return progressA.confidence - progressB.confidence;
    });
}

/**
 * Behandelt die Confidence-Bewertung
 */
function handleConfidenceRating(level) {
    if (filteredFlashcards.length === 0) return;

    const card = filteredFlashcards[currentFlashcardIndex];
    const now = Date.now();

    // Wiederholungsintervalle (in Millisekunden)
    const intervals = {
        1: 60 * 1000,           // 1 Minute
        2: 10 * 60 * 1000,      // 10 Minuten
        3: 24 * 60 * 60 * 1000, // 1 Tag
        4: 3 * 24 * 60 * 60 * 1000, // 3 Tage
        5: 7 * 24 * 60 * 60 * 1000  // 7 Tage
    };

    flashcardProgress[card.id] = {
        confidence: level,
        lastReview: now,
        nextReview: now + intervals[level],
        reviewCount: (flashcardProgress[card.id]?.reviewCount || 0) + 1
    };

    saveFlashcardProgress();
    updateFlashcardStats();

    // Visuelle Feedback-Animation
    const flashcardEl = document.getElementById('flashcard');
    if (flashcardEl) {
        flashcardEl.classList.add('rated');
        setTimeout(() => flashcardEl.classList.remove('rated'), 300);
    }

    // Zur nächsten Karte oder Lernsession beenden
    if (currentFlashcardIndex < filteredFlashcards.length - 1) {
        setTimeout(() => {
            currentFlashcardIndex++;
            showFlashcard(currentFlashcardIndex);
        }, 300);
    } else {
        // Lernsession beendet
        setTimeout(() => showLearningComplete(), 300);
    }
}

/**
 * Initialisiert die Stats-HTML-Struktur
 */
function initializeStatsHTML() {
    const statsContainer = document.getElementById('flashcardStats');
    if (!statsContainer) return;

    // Prüfe ob bereits initialisiert
    if (statsContainer.querySelector('.flashcard-stat')) return;

    statsContainer.classList.add('hidden'); // Initially hidden in browse mode
    statsContainer.innerHTML = `
        <div class="flashcard-stat new">
            <span class="stat-count">0</span>
            <span class="stat-label">Neu</span>
        </div>
        <div class="flashcard-stat learning">
            <span class="stat-count">0</span>
            <span class="stat-label">Lerne</span>
        </div>
        <div class="flashcard-stat mastered">
            <span class="stat-count">0</span>
            <span class="stat-label">Beherrscht</span>
        </div>
    `;
}

/**
 * Aktualisiert die Statistiken
 */
function updateFlashcardStats() {
    let newCount = 0;
    let learningCount = 0;
    let masteredCount = 0;

    filteredFlashcards.forEach(card => {
        const progress = flashcardProgress[card.id];
        if (!progress) {
            newCount++;
        } else if (progress.confidence >= 4) {
            masteredCount++;
        } else {
            learningCount++;
        }
    });

    const newEl = document.querySelector('.flashcard-stat.new .stat-count');
    const learningEl = document.querySelector('.flashcard-stat.learning .stat-count');
    const masteredEl = document.querySelector('.flashcard-stat.mastered .stat-count');

    if (newEl) newEl.textContent = newCount;
    if (learningEl) learningEl.textContent = learningCount;
    if (masteredEl) masteredEl.textContent = masteredCount;
}

/**
 * Zeigt den "Lernsession abgeschlossen" Bildschirm
 */
function showLearningComplete() {
    const container = document.querySelector('.flashcard-container');
    if (!container) return;

    const reviewed = filteredFlashcards.length;
    let masteredThisSession = 0;

    filteredFlashcards.forEach(card => {
        const progress = flashcardProgress[card.id];
        if (progress && progress.confidence >= 4) {
            masteredThisSession++;
        }
    });

    container.innerHTML = `
        <div class="learning-complete">
            <div class="complete-icon">🎉</div>
            <h3>Lernsession abgeschlossen!</h3>
            <div class="session-stats">
                <div class="session-stat">
                    <span class="stat-value">${reviewed}</span>
                    <span class="stat-label">Karten durchgearbeitet</span>
                </div>
                <div class="session-stat">
                    <span class="stat-value">${masteredThisSession}</span>
                    <span class="stat-label">Sicher beherrscht</span>
                </div>
            </div>
            <button class="btn btn-primary" onclick="restartLearning()">
                🔄 Nochmal lernen
            </button>
            <button class="btn btn-secondary" onclick="setFlashcardMode('browse')">
                📚 Zum Durchblättern
            </button>
        </div>
    `;
}

/**
 * Startet die Lernsession neu
 */
function restartLearning() {
    // Container wiederherstellen
    const container = document.querySelector('.flashcard-container');
    if (!container) return;

    container.innerHTML = `
        <div class="flashcard" id="flashcard">
            <div class="flashcard-inner" id="flashcardInner">
                <div class="flashcard-front" id="flashcardFront">
                    <p>Lade Karteikarten...</p>
                </div>
                <div class="flashcard-back" id="flashcardBack">
                    <p></p>
                </div>
            </div>
        </div>
        <p class="flashcard-hint">Klicke auf die Karte zum Umdrehen</p>
        <div class="flashcard-progress">
            Karte <span id="flashcardNumber">1</span> von <span id="flashcardTotal">0</span>
        </div>
        <div class="flashcard-actions">
            <button id="prevFlashcard" class="btn btn-secondary">← Zurück</button>
            <button id="nextFlashcard" class="btn btn-secondary">Weiter →</button>
        </div>
    `;

    // Event Listeners erneut binden
    document.getElementById('flashcard').addEventListener('click', flipCard);
    document.getElementById('prevFlashcard').addEventListener('click', prevCard);
    document.getElementById('nextFlashcard').addEventListener('click', nextCard);

    // Lernmodus erneut starten
    setFlashcardMode('learn');
}

/**
 * Filtert Karteikarten nach Thema
 */
function filterFlashcards() {
    const topicId = document.getElementById('flashcardTopicSelect').value;

    if (topicId === 'all') {
        filteredFlashcards = [...flashcardsData];
    } else {
        filteredFlashcards = flashcardsData.filter(fc => fc.topicId === parseInt(topicId));
    }

    currentFlashcardIndex = 0;
    updateFlashcardStats();
    showFlashcard(0);
}

/**
 * Zeigt eine Karteikarte an
 */
function showFlashcard(index) {
    if (filteredFlashcards.length === 0) {
        document.getElementById('flashcardFront').innerHTML = '<p>Keine Karteikarten für dieses Thema</p>';
        document.getElementById('flashcardBack').innerHTML = '<p></p>';
        document.getElementById('flashcardNumber').textContent = 0;
        document.getElementById('flashcardTotal').textContent = 0;
        return;
    }

    currentFlashcardIndex = Math.max(0, Math.min(index, filteredFlashcards.length - 1));
    const card = filteredFlashcards[currentFlashcardIndex];
    const progress = flashcardProgress[card.id];

    // Reset flip
    const flashcardInner = document.getElementById('flashcardInner');
    if (flashcardInner) flashcardInner.classList.remove('flipped');

    // Confidence Indicator
    let confidenceIndicator = '';
    if (progress) {
        const confClass = progress.confidence <= 2 ? 'conf-low' :
            progress.confidence <= 3 ? 'conf-medium' : 'conf-high';
        const confLabels = ['', 'Sehr unsicher', 'Unsicher', 'Okay', 'Gut', 'Perfekt'];
        confidenceIndicator = `<div class="flashcard-confidence-indicator ${confClass}">${confLabels[progress.confidence]}</div>`;
    }

    // Set content
    const frontEl = document.getElementById('flashcardFront');
    if (frontEl) {
        frontEl.innerHTML = `
            <div class="flashcard-topic">${card.topicName}</div>
            <p>${card.front}</p>
            ${confidenceIndicator}
        `;
    }

    const backEl = document.getElementById('flashcardBack');
    if (backEl) {
        backEl.innerHTML = `
            <p>${card.back.replace(/\n/g, '<br>')}</p>
            ${card.source ? `<div class="flashcard-source">Quelle: ${card.source}</div>` : ''}
        `;
    }

    // Update progress
    const numberEl = document.getElementById('flashcardNumber');
    const totalEl = document.getElementById('flashcardTotal');
    if (numberEl) numberEl.textContent = currentFlashcardIndex + 1;
    if (totalEl) totalEl.textContent = filteredFlashcards.length;
}

/**
 * Dreht die Karte um
 */
function flipCard() {
    const flashcardInner = document.getElementById('flashcardInner');
    if (flashcardInner) flashcardInner.classList.toggle('flipped');
}

/**
 * Zeigt die vorherige Karte
 */
function prevCard() {
    showFlashcard(currentFlashcardIndex - 1);
}

/**
 * Zeigt die nächste Karte
 */
function nextCard() {
    showFlashcard(currentFlashcardIndex + 1);
}

// Keyboard Navigation
document.addEventListener('keydown', (e) => {
    const flashcardsView = document.getElementById('flashcardsView');
    if (!flashcardsView || !flashcardsView.classList.contains('active')) return;

    if (flashcardMode === 'browse') {
        if (e.key === 'ArrowLeft') prevCard();
        if (e.key === 'ArrowRight') nextCard();
    }

    if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        flipCard();
    }

    // Zahlen 1-5 für Confidence im Lernmodus
    if (flashcardMode === 'learn') {
        const num = parseInt(e.key);
        if (num >= 1 && num <= 5) {
            handleConfidenceRating(num);
        }
    }
});

// Export functions if needed, or rely on global scope
// document.addEventListener('DOMContentLoaded', loadFlashcards); // Removed to be handled by app.js
