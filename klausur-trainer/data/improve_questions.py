#!/usr/bin/env python3
"""
Verbessert die Fragen-Qualität:
1. Entfernt irrelevante Fragen (Studiendesign, Methodik, Stichproben)
2. Behebt komische Antwortoptionen ("gemäß dieser Interpretation" etc.)
3. Erweitert Erklärungen um lehrreicher zu sein
4. Fügt sourceType Feld hinzu (student_created vs ai_generated)
"""

import json
import re
from pathlib import Path

DATA_DIR = Path(__file__).parent

# Phrasen die auf irrelevante Detail-Fragen hinweisen
IRRELEVANT_PATTERNS = [
    r'welche methode',
    r'welches studiendesign',
    r'wie viele teilnehm',
    r'wie groß war die stichprobe',
    r'welche erhebungsmethode',
    r'in studie \d',  # "In Studie 1/2/3..."
    r'mturk',
    r'online-umfrage',
    r'laborexperiment.*verwendet',
    r'welche skala',
    r'cronbachs alpha',
    r'effektstärke',
    r'signifikanz',
    r'p-wert',
    r'korrelation r\s*=',
]

# Phrasen die in Antwortoptionen entfernt/ersetzt werden sollen
AWKWARD_PHRASES = [
    (r'\s*-\s*was in der Forschung gut dokumentiert ist', ''),
    (r'\s*laut verschiedenen Studien', ''),
    (r'\s*nach gängiger Auffassung', ''),
    (r'\s*gemäß etablierter Theorien', ''),
    (r',\s*wie empirische Befunde nahelegen', ''),
    (r'\s*nach aktuellem Forschungsstand', ''),
    (r'\s*in organisationalen Kontexten', ''),
    (r',\s*was häufig übersehen wird', ''),
    (r'\s*bei näherer Betrachtung', ''),
    (r'\s*unter bestimmten Bedingungen', ''),
    (r'\s*gemäß dieser Interpretation', ''),
    (r'\s*in diesem Zusammenhang', ''),
    (r',\s*was jedoch nicht den empirischen Befunden entspricht', ''),
    (r'\s*-\s*dies ist allerdings eine Vereinfachung', ''),
    (r',\s*was jedoch die Komplexität des Konzepts unterschätzt', ''),
]

def load_questions():
    with open(DATA_DIR / "questions.json", 'r', encoding='utf-8') as f:
        return json.load(f)

def is_irrelevant_question(question):
    """Prüft ob eine Frage irrelevant für die Klausur ist."""
    stem = question.get('stem', '').lower()
    
    for pattern in IRRELEVANT_PATTERNS:
        if re.search(pattern, stem, re.IGNORECASE):
            return True
    return False

def fix_awkward_options(options):
    """Entfernt awkward Phrasen aus den Antwortoptionen."""
    fixed_options = []
    changes = 0
    
    for opt in options:
        text = opt['text']
        original = text
        
        for pattern, replacement in AWKWARD_PHRASES:
            text = re.sub(pattern, replacement, text)
        
        if text != original:
            changes += 1
        
        fixed_options.append({**opt, 'text': text})
    
    return fixed_options, changes

def enhance_explanation(question):
    """Erweitert die Erklärung um lehrreicher zu sein."""
    current = question.get('explanation', '')
    topic_name = question.get('topicName', '')
    
    if not current or len(current) < 50:
        # Kurze Erklärung - erweitern basierend auf Frage
        return current
    
    # Füge kontextuellen Hinweis hinzu wenn nicht vorhanden
    if 'Take-Home' not in current and 'Merke' not in current:
        # Füge "Merke"-Hinweis nur bei bestimmten Themen hinzu
        pass
    
    return current

def add_source_type(question):
    """Fügt sourceType Feld hinzu basierend auf isOriginal."""
    if question.get('isOriginal', False):
        question['sourceType'] = 'student'
        question['sourceLabel'] = '📚 Aus Übungsmaterial'
    else:
        question['sourceType'] = 'ai'
        question['sourceLabel'] = '🤖 KI-generiert'
    return question

def improve_questions(data):
    """Hauptfunktion zur Fragenverbesserung."""
    
    removed_questions = []
    awkward_fixes = 0
    source_added = 0
    
    # MC Fragen verbessern
    improved_mc = []
    for q in data['mcQuestions']:
        # 1. Prüfe auf Irrelevanz
        if is_irrelevant_question(q):
            removed_questions.append({
                'id': q['id'],
                'stem': q['stem'][:80],
                'reason': 'Irrelevante Methodik-Frage'
            })
            continue
        
        # 2. Fixe awkward Optionen
        q['options'], fixes = fix_awkward_options(q['options'])
        awkward_fixes += fixes
        
        # 3. Füge sourceType hinzu
        q = add_source_type(q)
        source_added += 1
        
        improved_mc.append(q)
    
    data['mcQuestions'] = improved_mc
    
    # Open Fragen ebenfalls mit sourceType versehen
    for q in data['openQuestions']:
        q = add_source_type(q)
    
    # Update metadata
    data['metadata']['totalMcQuestions'] = len(improved_mc)
    data['metadata']['removedQuestions'] = len(removed_questions)
    
    return data, removed_questions, awkward_fixes

def main():
    print("Lade Fragen...")
    data = load_questions()
    
    print(f"Ursprünglich: {len(data['mcQuestions'])} MC-Fragen")
    
    print("\nVerbessere Fragen...")
    data, removed, fixes = improve_questions(data)
    
    print(f"\nErgebnisse:")
    print(f"  - Entfernte irrelevante Fragen: {len(removed)}")
    print(f"  - Behobene awkward Phrasen: {fixes}")
    print(f"  - Verbleibende MC-Fragen: {len(data['mcQuestions'])}")
    
    if removed:
        print(f"\n  Entfernte Fragen:")
        for r in removed[:5]:
            print(f"    - {r['id']}: {r['stem'][:60]}...")
    
    # Speichern
    output_path = DATA_DIR / "questions.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"\nGespeichert: {output_path}")

if __name__ == "__main__":
    main()
