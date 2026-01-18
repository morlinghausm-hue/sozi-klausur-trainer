#!/usr/bin/env python3
"""
Analysiert die Fragen-Datenbank auf potenzielle Muster und Probleme.
"""

import json
from pathlib import Path
from collections import Counter

DATA_DIR = Path(__file__).parent

def load_questions():
    with open(DATA_DIR / "questions.json", 'r', encoding='utf-8') as f:
        return json.load(f)

def analyze_patterns(data):
    mc_questions = data["mcQuestions"]
    
    print("=" * 60)
    print("ANALYSE: Muster in den Fragen")
    print("=" * 60)
    
    # 1. Check: Ist die richtige Antwort immer die längste?
    print("\n1. LÄNGSTE ANTWORT = RICHTIG?")
    longest_is_correct = 0
    total_single_correct = 0
    
    for q in mc_questions:
        # Skip multi-select questions
        correct_count = sum(1 for opt in q["options"] if opt["correct"])
        if correct_count != 1:
            continue
        
        total_single_correct += 1
        
        # Find longest option
        max_len = 0
        longest_option = None
        correct_option = None
        
        for opt in q["options"]:
            if len(opt["text"]) > max_len:
                max_len = len(opt["text"])
                longest_option = opt
            if opt["correct"]:
                correct_option = opt
        
        if longest_option == correct_option:
            longest_is_correct += 1
    
    print(f"   Single-Choice Fragen: {total_single_correct}")
    print(f"   Längste = Richtig: {longest_is_correct} ({longest_is_correct/total_single_correct*100:.1f}%)")
    if longest_is_correct / total_single_correct > 0.4:
        print("   ⚠️  WARNUNG: Muster erkennbar - sollte diversifiziert werden!")
    else:
        print("   ✅ OK - keine auffällige Häufung")
    
    # 2. Check: Position der richtigen Antwort
    print("\n2. POSITION DER RICHTIGEN ANTWORT")
    position_counts = Counter()
    
    for q in mc_questions:
        correct_count = sum(1 for opt in q["options"] if opt["correct"])
        if correct_count != 1:
            continue
        
        for i, opt in enumerate(q["options"]):
            if opt["correct"]:
                position_counts[i] = position_counts.get(i, 0) + 1
    
    for pos, count in sorted(position_counts.items()):
        letter = chr(65 + pos)  # A, B, C, D
        percentage = count / total_single_correct * 100
        print(f"   Position {letter}: {count} ({percentage:.1f}%)")
    
    # Check if any position is overrepresented
    expected = total_single_correct / 4
    for pos, count in position_counts.items():
        if count > expected * 1.5:
            print(f"   ⚠️  Position {chr(65+pos)} ist überrepräsentiert!")
    
    # 3. Multi-Select Fragen
    print("\n3. MULTI-SELECT FRAGEN (All-that-apply)")
    multi_select = []
    
    for q in mc_questions:
        correct_count = sum(1 for opt in q["options"] if opt["correct"])
        if correct_count > 1:
            multi_select.append({
                "id": q["id"],
                "stem": q["stem"][:60] + "...",
                "correct_count": correct_count,
                "has_note": "note" in q
            })
    
    print(f"   Anzahl Multi-Select: {len(multi_select)}")
    for ms in multi_select[:5]:
        print(f"   - {ms['id']}: {ms['correct_count']} richtige | marked: {ms['has_note']}")
    if len(multi_select) > 5:
        print(f"   ... und {len(multi_select) - 5} weitere")
    
    # 4. Difficulty distribution per topic
    print("\n4. SCHWIERIGKEIT PRO THEMA")
    topic_difficulty = {}
    for q in mc_questions:
        topic = q.get("topicName", "Unknown")
        diff = q.get("difficulty", "medium")
        
        if topic not in topic_difficulty:
            topic_difficulty[topic] = {"easy": 0, "medium": 0, "hard": 0}
        topic_difficulty[topic][diff] = topic_difficulty[topic].get(diff, 0) + 1
    
    for topic, diffs in topic_difficulty.items():
        print(f"   {topic[:40]}: E:{diffs['easy']} M:{diffs['medium']} H:{diffs['hard']}")
    
    return multi_select

def main():
    data = load_questions()
    multi_select = analyze_patterns(data)
    
    print("\n" + "=" * 60)
    print("EMPFEHLUNGEN")
    print("=" * 60)
    
    print(f"""
1. Multi-Select Fragen ({len(multi_select)} Stück):
   → In der App als "Wähle alle zutreffenden" markieren
   → Separate Checkbox-UI statt Radio-Buttons
   → Keine Prüfungssimulation (dort nur Single-Choice)

2. Features für die App (inspiriert von Quizlet/Anki):
   - Spaced Repetition für Wiederholung
   - Clean, modernes UI Design
   - Sofortiges Feedback mit Erklärung
   - Fortschritts-Tracking
   - Karteikarten-Modus für Definitionen
   - Prüfungssimulation (nur 1-richtig Format)
""")

if __name__ == "__main__":
    main()
