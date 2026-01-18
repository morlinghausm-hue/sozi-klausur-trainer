#!/usr/bin/env python3
"""
Deep-Dive Fragen-Qualitätsprüfung:
1. Identifiziert problematische Fragen (irrelevante Details, komische Formulierungen)
2. Erweitert Erklärungen zu vollständigen Lernkarten
3. Ersetzt schlechte Fragen durch relevantere

KRITERIEN für gute Klausurfragen:
- Take-Home-Message-Style (was soll man längerfristig mitnehmen?)
- Relevanz für Praxis und Verständnis
- NICHT: Spezifische Methoden, Stichproben, Effektstärken, Studiendesign
"""

import json
import re
from pathlib import Path

DATA_DIR = Path(__file__).parent

# Problematische Muster in Fragen
PROBLEM_PATTERNS = [
    (r'welche methode', 'methodology'),
    (r'studiendesign', 'methodology'),
    (r'wie viele teilnehmer', 'sample_size'),
    (r'stichprobe', 'sample_size'),
    (r'cronbach', 'statistics'),
    (r'effektstärke', 'statistics'),
    (r'signifikanz', 'statistics'),
    (r'p-wert', 'statistics'),
    (r'in studie \d', 'study_detail'),
    (r'mturk', 'methodology'),
    (r'laborexperiment', 'methodology'),
    (r'online-umfrage', 'methodology'),
    (r'likert', 'methodology'),
    (r'fragebogen', 'methodology'),
]

# Erweiterte Erklärungen mit vollständigem Kontext
TOPIC_FULL_EXPLANATIONS = {
    1: """PSYCHOLOGICAL SAFETY - Kernwissen:

📚 Definition: Der Glaube, dass man in einem Team nicht bestraft oder bloßgestellt wird, wenn man Fragen stellt, Fehler zugibt oder neue Ideen einbringt (Edmondson).

💡 Warum wichtig: Ermöglicht Lernen aus Fehlern, fördert Innovation, verbessert Teamrisikobereitschaft.

👔 Leadership-Stile die PS fördern:
• Humble Leadership: FK gibt eigene Grenzen zu, lebt Lernbereitschaft vor
• Inclusive Leadership: Zeigt Wertschätzung, signalisiert Offenheit für Beiträge

🔗 Wirkmechanismus: Leadership → Psychological Safety (Mediator) → Engagement""",
    
    2: """TRANSFORMATIONALE & TRANSAKTIONALE FÜHRUNG - Kernwissen:

📚 Transformational: Vision, Inspiration, individuelle Förderung → passt zu PROMOTION FOCUS
📚 Transaktional: Struktur, Kontrolle, Belohnung bei Zielerreichung → passt zu PREVENTION FOCUS

💡 Regulatory Fit: Wenn Führungsstil zur motivationalen Orientierung passt, "fühlt sich richtig an"
→ Mehr Wertschätzung (Feeling Valued), höhere Zufriedenheit

🔑 Take-Home: Es gibt keinen universell besten Führungsstil - Passung ist entscheidend!""",

    3: """STANDARDEFFEKTE VON MACHT - Kernwissen:

📚 Macht = Asymmetrische Kontrolle über wichtige Ressourcen anderer

📊 Drei Standardeffekte:
1. Handlungsorientierung - Mächtige denken mehr in Zielen und Handeln
2. Enthemmung/Disinhibition - weniger durch soziale Regeln gebunden
3. Objektifizierung - andere werden nach Nützlichkeit bewertet

🧠 Erklärung: Approach-Inhibition-Modell (Keltner)
• Macht → Approach-System aktiviert → Fokus auf Belohnungen, Risikobereitschaft
• Machtlosigkeit → Inhibition-System → Fokus auf Gefahren, Vorsicht

⚠️ Moderatoren: Accountability (Rechenschaftspflicht), Systemstabilität""",

    4: """FOLGEN INSTABILER MACHT - Kernwissen:

⚡ Interaktionseffekt Macht × Inkompetenz:
Macht ALLEIN → kein Problem
Inkompetenz ALLEIN → kein Problem
Macht + wahrgenommene eigene Inkompetenz → Ego-Bedrohung → AGGRESSION

💊 Gegenmittel: Selbstaffirmation (Selbstwert auf anderem Wege stärken)

📊 Legitimität von Macht:
• Legitime Macht basiert auf Verdienst, Kompetenz, sozialer Zustimmung
• Illegitime Macht ist instabil, wird eher herausgefordert
• Illegitim Machtlose zeigen NICHT die typischen Nachteile!""",

    5: """BETRACHTUNGSWEISE VON MACHT - Kernwissen:

🔍 Zwei Perspektiven:
• Macht als OPPORTUNITY (Chance): Freiheit, eigene Ziele → attraktiv für Promotion Focus
• Macht als RESPONSIBILITY (Verantwortung): Pflichten, Rechenschaft

💡 Praktische Implikation: Die FORMULIERUNG von Machtpositionen beeinflusst, wer sich bewirbt!
(z.B. Stellenausschreibungen)

🔗 Machtmotivation des Chefs beeinflusst Leistungsmotivation der ganzen Dyade""",

    6: """MACHT UND VERTRAUEN - Kernwissen:

📚 Drei Komponenten von Vertrauen:
1. Benevolenz (Wohlwollen) - gute Absichten
2. Integrität - Werte werden im Handeln umgesetzt
3. Fähigkeit/Ability - Kompetenz

🔗 Verantwortungsorientierte FK werden als wohlwollender und integrer wahrgenommen → mehr Vertrauen
(Chancenorientierte FK werden als MÄCHTIGER aber weniger vertrauenswürdig gesehen)

📊 Power Granting: Benevolenz + hohe Integrität → höchste Bereitschaft, Macht zu übertragen""",

    7: """SOZIALE IDENTITÄT & PROTOTYPIKALITÄT - Kernwissen:

📚 Prototyp: Abstrakte Menge an Merkmalen, die Ähnlichkeiten in der Gruppe und Unterschiede zur Outgroup erfasst
→ Es gibt einen GRADIENTEN (manche sind prototypischer als andere)

💡 Social Identity Theory of Leadership: Bei hoher Gruppensalienz wird Prototypikalität wichtiger als allgemeine Führungsschemata

🛡️ License-to-Fail-Effekt: Prototypische Leader bekommen einen "Fehlerbonus"
→ Bei Misserfolg werden sie milder beurteilt (Vertrauen als Mediator)""",

    8: """LEADER EMERGENCE & PERSÖNLICHKEIT - Kernwissen:

📚 Leader-Trait-Perspektive: Stabile Persönlichkeitsmerkmale beeinflussen:
• Leader EMERGENCE (wer wird Leader?)
• Leader EFFECTIVENESS (wie erfolgreich führt die Person?)

🧬 LTEE-Modell: Trait → Emergence → Effectiveness

📊 Big Five & Führung:
✓ Extraversion, Offenheit, Gewissenhaftigkeit → positiv
✗ Neurotizismus → negativ""",

    9: """LEADERSHIP & DIGITALIZATION - Kernwissen:

💻 Problem in virtuellen Teams: Typische Führungsmechanismen fehlen
• Direkte Überwachung/Kontrolle
• Persönliche Präsenz
• Spontane nonverbale Kommunikation

🔧 Kompensation durch:
1. Strukturelle Unterstützung (klare Prozesse, formalisierte Strukturen)
2. Shared Leadership (Führung auf mehrere verteilt)

📊 Virtualität MODERIERT den Zusammenhang zwischen hierarchischer Führung und Teamleistung"""
}

def load_questions():
    with open(DATA_DIR / "questions.json", 'r', encoding='utf-8') as f:
        return json.load(f)

def analyze_question(q):
    """Analysiert eine Frage auf Probleme."""
    stem = q.get('stem', '').lower()
    issues = []
    
    for pattern, issue_type in PROBLEM_PATTERNS:
        if re.search(pattern, stem, re.IGNORECASE):
            issues.append(issue_type)
    
    return issues

def enhance_single_explanation(q, topic_explanations):
    """Erweitert eine Frage-Erklärung mit vollständigem Kontext."""
    topic_id = q.get('topicId', 0)
    current = q.get('explanation', '')
    
    full_context = topic_explanations.get(topic_id, '')
    
    if not full_context:
        return current
    
    # Wenn Erklärung kurz ist, erweitern
    if len(current) < 200:
        # Füge kurze spezifische Erklärung + vollständigen Kontext hinzu
        enhanced = current + "\n\n" + "─" * 40 + "\n\n" + full_context
        return enhanced
    
    # Wenn Erklärung schon gut ist, nur Kontext ergänzen wenn nicht vorhanden
    if "Kernwissen" not in current:
        return current + "\n\n" + "─" * 40 + "\n\n" + full_context
    
    return current

def deep_quality_check(data):
    """Führt Deep Quality Check durch."""
    
    problematic_questions = []
    enhanced_count = 0
    
    for q in data['mcQuestions']:
        issues = analyze_question(q)
        
        if issues:
            problematic_questions.append({
                'id': q['id'],
                'stem': q['stem'][:80],
                'issues': issues
            })
        
        # Erweitere Erklärung
        old_explanation = q.get('explanation', '')
        q['explanation'] = enhance_single_explanation(q, TOPIC_FULL_EXPLANATIONS)
        
        if q['explanation'] != old_explanation:
            enhanced_count += 1
    
    return data, problematic_questions, enhanced_count

def main():
    print("Lade Fragen...")
    data = load_questions()
    
    print("\nDeep Quality Check...")
    data, problems, enhanced = deep_quality_check(data)
    
    print(f"\nErgebnisse:")
    print(f"  Problematische Fragen gefunden: {len(problems)}")
    print(f"  Erweiterte Erklärungen: {enhanced}")
    
    if problems:
        print("\nProblematische Fragen (potenziell irrelevante Detail-Fragen):")
        for p in problems[:10]:
            print(f"  - {p['id']}: {p['issues']}")
            print(f"    {p['stem']}...")
    
    # Speichern
    with open(DATA_DIR / "questions.json", 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"\nGespeichert!")
    
    # Log für manuelle Review
    with open(DATA_DIR / "quality_report.txt", 'w', encoding='utf-8') as f:
        f.write("QUALITY REPORT - Fragen die manuell geprüft werden sollten\n")
        f.write("=" * 60 + "\n\n")
        
        for p in problems:
            f.write(f"ID: {p['id']}\n")
            f.write(f"Issues: {', '.join(p['issues'])}\n")
            f.write(f"Frage: {p['stem']}...\n\n")
    
    print(f"Quality Report gespeichert: {DATA_DIR}/quality_report.txt")

if __name__ == "__main__":
    main()
