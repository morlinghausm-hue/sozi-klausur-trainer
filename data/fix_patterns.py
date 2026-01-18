#!/usr/bin/env python3
"""
Shuffelt die Antwortoptionen um Muster zu eliminieren.
Markiert Multi-Select Fragen explizit.
"""

import json
import random
from pathlib import Path

DATA_DIR = Path(__file__).parent

def load_questions():
    with open(DATA_DIR / "questions.json", 'r', encoding='utf-8') as f:
        return json.load(f)

def fix_questions(data):
    """Shuffelt Optionen und markiert Multi-Select."""
    
    random.seed(42)  # Für Reproduzierbarkeit
    
    mc_questions = data["mcQuestions"]
    multi_select_count = 0
    shuffled_count = 0
    
    for q in mc_questions:
        # Zähle richtige Antworten
        correct_count = sum(1 for opt in q["options"] if opt["correct"])
        
        # Markiere Multi-Select Fragen
        if correct_count > 1:
            q["isMultiSelect"] = True
            multi_select_count += 1
        else:
            q["isMultiSelect"] = False
        
        # Shuffle die Optionen
        random.shuffle(q["options"])
        shuffled_count += 1
    
    # Update metadata
    data["metadata"]["multiSelectQuestions"] = multi_select_count
    data["metadata"]["singleChoiceQuestions"] = len(mc_questions) - multi_select_count
    
    return data, shuffled_count, multi_select_count

def verify_fix(data):
    """Verifiziert, dass die Fixes funktioniert haben."""
    mc_questions = data["mcQuestions"]
    
    # Check position distribution
    position_counts = {0: 0, 1: 0, 2: 0, 3: 0}
    longest_is_correct = 0
    total_single = 0
    
    for q in mc_questions:
        if q["isMultiSelect"]:
            continue
        
        total_single += 1
        
        # Position check
        for i, opt in enumerate(q["options"]):
            if opt["correct"]:
                position_counts[i] += 1
        
        # Longest check
        max_len = max(len(opt["text"]) for opt in q["options"])
        correct_len = [len(opt["text"]) for opt in q["options"] if opt["correct"]][0]
        if correct_len == max_len:
            longest_is_correct += 1
    
    print("NACH FIX:")
    print(f"  Positions-Verteilung: A:{position_counts[0]} B:{position_counts[1]} C:{position_counts[2]} D:{position_counts[3]}")
    print(f"  Längste=Richtig: {longest_is_correct}/{total_single} ({longest_is_correct/total_single*100:.1f}%)")
    
    return position_counts, longest_is_correct / total_single

def main():
    print("Lade Fragen...")
    data = load_questions()
    
    print("Fixe Muster...")
    data, shuffled, multi = fix_questions(data)
    
    print(f"  Geshuffelt: {shuffled} Fragen")
    print(f"  Multi-Select markiert: {multi} Fragen")
    
    # Verify
    verify_fix(data)
    
    # Save
    output_path = DATA_DIR / "questions.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"\nGespeichert: {output_path}")

if __name__ == "__main__":
    main()
