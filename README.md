# Klausur-Trainer

Interaktive Lern-App zur Vorbereitung auf die Sozialpsychologie-Klausur.

## 🚀 Quick Start

### Lokal starten
```bash
cd klausur-trainer
python3 -m http.server 8080
# Öffne http://localhost:8080
```

### Mit anderen teilen

**Option 1: GitHub Pages (empfohlen)**
1. Erstelle ein GitHub Repository
2. Lade alle Dateien hoch
3. Gehe zu Settings → Pages → Source: "main branch"
4. Nach 1-2 Minuten ist die App unter `https://DEIN-USERNAME.github.io/klausur-trainer` erreichbar

**Option 2: Ordner kopieren**
Kopiere den kompletten `klausur-trainer` Ordner auf einen USB-Stick oder in die Cloud. Andere müssen dann den Server-Befehl ausführen.

**Option 3: Netlify Drop**
1. Gehe zu https://app.netlify.com/drop
2. Ziehe den `klausur-trainer` Ordner ins Browserfenster
3. Sofort ein öffentlicher Link verfügbar

## 📁 Struktur

```
klausur-trainer/
├── index.html          # Hauptseite
├── css/styles.css      # Styling
├── js/
│   ├── data.js         # Daten-Laden
│   ├── storage.js      # LocalStorage
│   ├── quiz.js         # Quiz-Logik
│   └── app.js          # App-Steuerung
└── data/
    └── questions.json  # Fragen-Datenbank
```

## ✨ Features

- 103 MC-Fragen + 19 offene Fragen
- 9 Themen aus dem Seminar
- Quiz-Modus mit sofortigem Feedback
- Prüfungssimulation (20 MC + offene Fragen)
- Spaced Repetition (schwache Fragen werden öfter wiederholt)
- Fortschritts-Tracking (im Browser gespeichert)
- Multi-Select Support für "Wähle alle zutreffenden" Fragen
- Markierung: 📚 Aus Übungsmaterial vs. 🤖 KI-generiert
