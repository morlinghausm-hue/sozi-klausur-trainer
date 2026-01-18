#!/usr/bin/env python3
"""
Erweitert die Erklärungen um sie lehrreicher und ausführlicher zu machen.
Fügt Take-Home-Messages und Kontext hinzu.
"""

import json
from pathlib import Path

DATA_DIR = Path(__file__).parent

# Take-Home-Messages pro Thema für Kontext
TOPIC_TAKEAWAYS = {
    1: {  # Psychological Safety
        "takeaway": "Psychological Safety ist der Glaube, ohne negative Konsequenzen Risiken eingehen zu können – zentral für Innovation und Lernen in Teams.",
        "key_concepts": ["Humble Leadership", "Inclusive Leadership", "Engagement als Outcome"]
    },
    2: {  # Transformationale & Transaktionale Führung
        "takeaway": "Gute Führung bedeutet, den eigenen Stil an die Selbstregulation der Mitarbeitenden anzupassen – Regulatory Fit führt zu Wertschätzung.",
        "key_concepts": ["Promotion Focus ↔ Transformational", "Prevention Focus ↔ Transactional", "Feeling Valued"]
    },
    3: {  # Standardeffekte von Macht
        "takeaway": "Macht aktiviert das Approach-System: Fokus auf eigene Ziele, weniger Hemmung, mehr Handlungsorientierung – aber auch Risiko der Objektifizierung.",
        "key_concepts": ["Approach-Inhibition", "Handlungsorientierung", "Enthemmung", "Objektifizierung"]
    },
    4: {  # Folgen instabiler Macht
        "takeaway": "Macht + Inkompetenz = Aggression (durch Ego-Bedrohung). Illegitime Machtlosigkeit schützt vor typischen Nachteilen.",
        "key_concepts": ["Ego Defensiveness", "Selbstaffirmation", "Legitimität"]
    },
    5: {  # Betrachtungsweise von Macht
        "takeaway": "Wie Macht dargestellt wird (Chance vs. Verantwortung) beeinflusst, wer sie attraktiv findet und annehmen möchte.",
        "key_concepts": ["Opportunity vs. Responsibility", "Machtmotivation", "Promotion Focus"]
    },
    6: {  # Macht und Vertrauen
        "takeaway": "Vertrauen basiert auf Wohlwollen, Integrität und Fähigkeit. Verantwortungsorientierte Führung erhält mehr Vertrauen.",
        "key_concepts": ["Benevolenz + Integrität → Power Granting", "Verantwortungserleben als Mediator"]
    },
    7: {  # Soziale Identität & Prototypikalität
        "takeaway": "Führung ist ein Gruppenprozess: Prototypikalität bestimmt Legitimität. Prototypische Leader haben einen 'Fehlerbonus'.",
        "key_concepts": ["Prototypikalitäts-Gradient", "License-to-fail", "Vertrauen als Mediator"]
    },
    8: {  # Leader Emergence & Persönlichkeit
        "takeaway": "Stabile Persönlichkeitsmerkmale beeinflussen, wer Leader wird (Emergence) UND wie erfolgreich man führt (Effectiveness).",
        "key_concepts": ["LTEE-Modell", "Traits → Emergence → Effectiveness"]
    },
    9: {  # Leadership & Digitalization
        "takeaway": "In virtuellen Teams wird hierarchische Führung weniger effektiv. Shared Leadership und strukturelle Unterstützung kompensieren.",
        "key_concepts": ["Virtualität als Moderator", "Shared Leadership", "Strukturelle Unterstützung"]
    }
}

def load_questions():
    with open(DATA_DIR / "questions.json", 'r', encoding='utf-8') as f:
        return json.load(f)

def enhance_explanation(question):
    """Erweitert eine Erklärung um lehrreicher zu sein."""
    topic_id = question.get('topicId', 0)
    current_explanation = question.get('explanation', '')
    
    if not current_explanation:
        current_explanation = "Diese Frage prüft dein Verständnis des Themas."
    
    # Hole Topic-Kontext
    topic_info = TOPIC_TAKEAWAYS.get(topic_id, {})
    takeaway = topic_info.get('takeaway', '')
    
    # Wenn die Erklärung schon gut ist (>150 Zeichen), verbessere nur leicht
    if len(current_explanation) > 150:
        # Füge Merke-Hinweis hinzu wenn nicht vorhanden
        if '💡' not in current_explanation and 'Merke' not in current_explanation:
            if takeaway:
                enhanced = current_explanation + f"\n\n💡 Merke: {takeaway}"
                return enhanced
        return current_explanation
    
    # Kurze Erklärung erweitern
    enhanced = current_explanation
    
    # Füge Take-Home-Message hinzu
    if takeaway and '💡' not in enhanced:
        enhanced += f"\n\n💡 Take-Home: {takeaway}"
    
    return enhanced

def enhance_all_explanations(data):
    """Erweitert alle Erklärungen."""
    enhanced_count = 0
    
    for q in data['mcQuestions']:
        old_explanation = q.get('explanation', '')
        new_explanation = enhance_explanation(q)
        
        if new_explanation != old_explanation:
            q['explanation'] = new_explanation
            enhanced_count += 1
    
    for q in data['openQuestions']:
        old_explanation = q.get('modelAnswer', '')
        if old_explanation:
            topic_id = q.get('topicId', 0)
            topic_info = TOPIC_TAKEAWAYS.get(topic_id, {})
            takeaway = topic_info.get('takeaway', '')
            
            if takeaway and '💡' not in old_explanation:
                q['modelAnswer'] = old_explanation + f"\n\n💡 Take-Home: {takeaway}"
                enhanced_count += 1
    
    return data, enhanced_count

def main():
    print("Lade Fragen...")
    data = load_questions()
    
    print("Erweitere Erklärungen...")
    data, count = enhance_all_explanations(data)
    
    print(f"Erweiterte Erklärungen: {count}")
    
    # Speichern
    with open(DATA_DIR / "questions.json", 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print("Gespeichert!")

if __name__ == "__main__":
    main()
