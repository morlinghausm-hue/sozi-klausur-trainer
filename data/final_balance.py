#!/usr/bin/env python3
"""
Gezieltes Rebalancing der problematischsten Fragen.
Macht falsche Antworten elaborierter und plausibler.
"""

import json
import random
from pathlib import Path

DATA_DIR = Path(__file__).parent

# Erweiterungen die die falschen Antworten plausibler machen
EXTENSIONS = [
    " - was in der Forschung gut dokumentiert ist",
    " laut verschiedenen Studien", 
    " nach gängiger Auffassung",
    " gemäß etablierter Theorien",
    ", wie empirische Befunde nahelegen",
    " nach aktuellem Forschungsstand",
    " in organisationalen Kontexten",
    ", was häufig übersehen wird",
    " bei näherer Betrachtung",
    " unter bestimmten Bedingungen",
]

def load_questions():
    with open(DATA_DIR / "questions.json", 'r', encoding='utf-8') as f:
        return json.load(f)

def aggressive_balance(data):
    """Aggressiveres Balancing aller Optionen."""
    
    random.seed(123)
    modifications = 0
    
    for q in data["mcQuestions"]:
        if q.get("isMultiSelect", False):
            continue
        
        # Find correct answer length
        correct_len = 0
        for opt in q["options"]:
            if opt["correct"]:
                correct_len = len(opt["text"])
                break
        
        # Berechne Ziel-Länge (leicht unter correct_len)
        target_min = max(30, correct_len - 30)
        target_max = correct_len + 20
        
        for opt in q["options"]:
            if not opt["correct"]:
                current_len = len(opt["text"])
                
                # Wenn zu kurz, erweitern
                if current_len < target_min:
                    # Wähle passende Erweiterung
                    extension = random.choice(EXTENSIONS)
                    
                    # Vermeide doppelte Erweiterungen
                    if not any(ext in opt["text"] for ext in EXTENSIONS):
                        opt["text"] = opt["text"].rstrip('.') + extension
                        modifications += 1
                
                # Wenn immer noch zu kurz, füge mehr hinzu
                if len(opt["text"]) < target_min - 20:
                    extra = " in diesem Zusammenhang"
                    if extra not in opt["text"]:
                        opt["text"] += extra
                        modifications += 1
    
    return data, modifications

def final_verify(data):
    """Finale Verifikation."""
    
    mc = data["mcQuestions"]
    single = [q for q in mc if not q.get("isMultiSelect", False)]
    
    longest_correct = 0
    for q in single:
        max_len = max(len(opt["text"]) for opt in q["options"])
        for opt in q["options"]:
            if opt["correct"] and len(opt["text"]) == max_len:
                longest_correct += 1
                break
    
    # Position check
    positions = {0: 0, 1: 0, 2: 0, 3: 0}
    for q in single:
        for i, opt in enumerate(q["options"]):
            if opt["correct"]:
                positions[i] += 1
    
    print(f"\nFINALE STATISTIK:")
    print(f"  Single-Choice: {len(single)}")
    print(f"  Multi-Select: {len(mc) - len(single)}")
    print(f"  Längste=Richtig: {longest_correct}/{len(single)} ({longest_correct/len(single)*100:.1f}%)")
    print(f"  Positionen: A:{positions[0]} B:{positions[1]} C:{positions[2]} D:{positions[3]}")
    
    # Ideal wäre unter 40%
    if longest_correct / len(single) < 0.5:
        print("  ✅ Akzeptables Level erreicht")
    else:
        print("  ⚠️ Hinweis: Einige Muster bleiben, aber weniger offensichtlich")

def main():
    data = load_questions()
    
    # Mehrere Runden aggressives Balancing
    for i in range(5):
        data, mods = aggressive_balance(data)
        print(f"Runde {i+1}: {mods} Änderungen")
        if mods == 0:
            break
    
    final_verify(data)
    
    # Re-shuffle nach Balancing
    random.seed(999)
    for q in data["mcQuestions"]:
        random.shuffle(q["options"])
    
    # Save
    with open(DATA_DIR / "questions.json", 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print("\nGespeichert!")

if __name__ == "__main__":
    main()
