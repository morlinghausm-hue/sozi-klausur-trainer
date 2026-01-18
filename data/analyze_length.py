#!/usr/bin/env python3
"""
Identifiziert Fragen wo die richtige Antwort die längste ist 
und schlägt kürzere Alternativ-Formulierungen vor.
"""

import json
from pathlib import Path

DATA_DIR = Path(__file__).parent

def load_questions():
    with open(DATA_DIR / "questions.json", 'r', encoding='utf-8') as f:
        return json.load(f)

def analyze_length_pattern(data):
    problematic = []
    
    for q in data["mcQuestions"]:
        if q.get("isMultiSelect", False):
            continue
        
        # Find correct answer
        correct_opt = None
        max_len = 0
        for opt in q["options"]:
            if opt["correct"]:
                correct_opt = opt
            if len(opt["text"]) > max_len:
                max_len = len(opt["text"])
        
        if correct_opt and len(correct_opt["text"]) == max_len:
            # Kürze die richtige Antwort oder verlängere eine falsche
            other_lengths = [len(opt["text"]) for opt in q["options"] if not opt["correct"]]
            max_wrong = max(other_lengths) if other_lengths else 0
            
            if len(correct_opt["text"]) > max_wrong + 20:  # Signifikant länger
                problematic.append({
                    "id": q["id"],
                    "stem": q["stem"][:80],
                    "correct": correct_opt["text"],
                    "correct_len": len(correct_opt["text"]),
                    "max_wrong_len": max_wrong,
                    "diff": len(correct_opt["text"]) - max_wrong
                })
    
    # Sort by difference
    problematic.sort(key=lambda x: x["diff"], reverse=True)
    
    print(f"Fragen mit signifikant längerer richtiger Antwort: {len(problematic)}")
    print("\nTop 10 problematisch (größte Längen-Differenz):")
    for p in problematic[:10]:
        print(f"\n{p['id']}: Diff={p['diff']}")
        print(f"  Frage: {p['stem']}...")
        print(f"  Richtig ({p['correct_len']}): {p['correct'][:80]}...")

if __name__ == "__main__":
    data = load_questions()
    analyze_length_pattern(data)
