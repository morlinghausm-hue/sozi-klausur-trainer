#!/usr/bin/env python3
"""
Kombiniert alle Topic-JSON-Dateien zu einer finalen questions.json für die Klausur-Trainer App.
"""

import json
import os
from pathlib import Path

DATA_DIR = Path(__file__).parent

def load_topic_files():
    """Lädt alle Topic-JSON-Dateien."""
    topics = []
    for i in range(1, 10):
        pattern = f"topic_{i:02d}_*.json"
        files = list(DATA_DIR.glob(pattern))
        if files:
            with open(files[0], 'r', encoding='utf-8') as f:
                topics.append(json.load(f))
    return topics

def combine_questions(topics):
    """Kombiniert alle Fragen in ein einheitliches Format."""
    all_mc_questions = []
    all_open_questions = []
    topic_metadata = []
    
    for topic_data in topics:
        topic = topic_data["topic"]
        questions = topic_data["questions"]
        
        topic_id = topic["id"]
        topic_name = topic["name"]
        
        topic_metadata.append({
            "id": topic_id,
            "name": topic_name,
            "keyPapers": topic.get("keyPapers", []),
            "keyConcepts": topic.get("keyConcepts", []),
            "focusFromImpulse": topic.get("focusFromImpulse", "")
        })
        
        # MC Fragen (existing + generated)
        for q in questions.get("mc_existing", []):
            q["topicId"] = topic_id
            q["topicName"] = topic_name
            q["questionType"] = "mc"
            q["isOriginal"] = True
            if "difficulty" not in q:
                q["difficulty"] = "medium"
            all_mc_questions.append(q)
        
        for q in questions.get("mc_generated", []):
            q["topicId"] = topic_id
            q["topicName"] = topic_name
            q["questionType"] = "mc"
            q["isOriginal"] = False
            if "difficulty" not in q:
                q["difficulty"] = "medium"
            all_mc_questions.append(q)
        
        # Offene Fragen
        for q in questions.get("open_existing", []):
            q["topicId"] = topic_id
            q["topicName"] = topic_name
            q["questionType"] = "open"
            q["isOriginal"] = True
            if "difficulty" not in q:
                q["difficulty"] = "medium"
            all_open_questions.append(q)
        
        for q in questions.get("open_generated", []):
            q["topicId"] = topic_id
            q["topicName"] = topic_name
            q["questionType"] = "open"
            q["isOriginal"] = False
            if "difficulty" not in q:
                q["difficulty"] = "medium"
            all_open_questions.append(q)
    
    return {
        "metadata": {
            "course": "Sozialpsychologie: Was Macht mit uns macht",
            "examDate": "2026-02-04",
            "generatedAt": "2026-01-18",
            "totalTopics": len(topics),
            "totalMcQuestions": len(all_mc_questions),
            "totalOpenQuestions": len(all_open_questions),
            "difficultyDistribution": {
                "easy": len([q for q in all_mc_questions if q.get("difficulty") == "easy"]),
                "medium": len([q for q in all_mc_questions if q.get("difficulty") == "medium"]),
                "hard": len([q for q in all_mc_questions if q.get("difficulty") == "hard"])
            }
        },
        "topics": topic_metadata,
        "mcQuestions": all_mc_questions,
        "openQuestions": all_open_questions
    }

def main():
    topics = load_topic_files()
    print(f"Loaded {len(topics)} topic files")
    
    combined = combine_questions(topics)
    
    output_path = DATA_DIR / "questions.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(combined, f, ensure_ascii=False, indent=2)
    
    print(f"\nCreated: {output_path}")
    print(f"Total MC Questions: {combined['metadata']['totalMcQuestions']}")
    print(f"Total Open Questions: {combined['metadata']['totalOpenQuestions']}")
    print(f"Difficulty: {combined['metadata']['difficultyDistribution']}")

if __name__ == "__main__":
    main()
