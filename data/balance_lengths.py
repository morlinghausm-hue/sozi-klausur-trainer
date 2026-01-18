#!/usr/bin/env python3
"""
Erweitert kurze falsche Antworten um sie plausibler und länger zu machen,
damit die Länge kein Hinweis mehr auf die richtige Antwort ist.
"""

import json
from pathlib import Path

DATA_DIR = Path(__file__).parent

def load_questions():
    with open(DATA_DIR / "questions.json", 'r', encoding='utf-8') as f:
        return json.load(f)

def balance_lengths(data):
    """Erweitert kurze falsche Antworten."""
    
    modifications = 0
    
    for q in data["mcQuestions"]:
        if q.get("isMultiSelect", False):
            continue
        
        # Find lengths
        correct_len = 0
        for opt in q["options"]:
            if opt["correct"]:
                correct_len = len(opt["text"])
                break
        
        # Erweitere kurze falsche Antworten
        for opt in q["options"]:
            if not opt["correct"] and len(opt["text"]) < correct_len - 40:
                # Füge plausible Erweiterungen hinzu
                old_text = opt["text"]
                
                # Verschiedene Erweiterungsstrategien basierend auf Inhalt
                if "nicht" in old_text.lower() or "kein" in old_text.lower():
                    opt["text"] = old_text + ", was jedoch nicht den empirischen Befunden entspricht"
                elif "immer" in old_text.lower() or "nur" in old_text.lower():
                    opt["text"] = old_text + " - dies ist allerdings eine Vereinfachung"
                elif len(old_text) < 30:
                    opt["text"] = old_text + ", was jedoch die Komplexität des Konzepts unterschätzt"
                else:
                    opt["text"] = old_text + " gemäß dieser Interpretation"
                
                modifications += 1
    
    return data, modifications

def verify_balance(data):
    """Überprüft die neue Längenverteilung."""
    longest_is_correct = 0
    total_single = 0
    
    for q in data["mcQuestions"]:
        if q.get("isMultiSelect", False):
            continue
        
        total_single += 1
        
        max_len = max(len(opt["text"]) for opt in q["options"])
        correct_len = [len(opt["text"]) for opt in q["options"] if opt["correct"]][0]
        
        if correct_len == max_len:
            longest_is_correct += 1
    
    percentage = longest_is_correct / total_single * 100
    print(f"Längste=Richtig: {longest_is_correct}/{total_single} ({percentage:.1f}%)")
    return percentage

def main():
    print("Lade Fragen...")
    data = load_questions()
    
    print("\nVOR Balancing:")
    before = verify_balance(data)
    
    # Mehrere Durchläufe für bessere Balance
    for i in range(3):
        data, mods = balance_lengths(data)
        print(f"\nDurchlauf {i+1}: {mods} Modifikationen")
        perc = verify_balance(data)
        if perc < 40:
            break
    
    # Save
    output_path = DATA_DIR / "questions.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"\nGespeichert: {output_path}")

if __name__ == "__main__":
    main()
