log_path = r"C:\Users\Leandro Silveira\.gemini\antigravity\brain\a7b4f031-42a9-46e9-84bf-4348dcadec17\.system_generated\logs\transcript.jsonl"

with open(log_path, 'r', encoding='utf-8') as f:
    for i, line in enumerate(f):
        if 'pptSlideBuilders' in line:
            print(f"Line {i} contains pptSlideBuilders")
            print(line[:500])
