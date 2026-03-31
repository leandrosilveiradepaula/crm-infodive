import os
import re

# Mapping of forbidden colors to approved replacements
MAPPINGS = {
    r'purple-(\d+)': r'teal-\1',
    r'violet-(\d+)': r'cyan-\1',
    r'indigo-(\d+)': r'blue-\1',
    r'from-purple-(\d+)': r'from-teal-\1',
    r'to-purple-(\d+)': r'to-teal-\1',
    r'via-purple-(\d+)': r'via-teal-\1',
    r'border-purple-(\d+)': r'border-teal-\1',
    r'bg-purple-(\d+)': r'bg-teal-\1',
    r'text-purple-(\d+)': r'text-teal-\1',
    r'ring-purple-(\d+)': r'ring-teal-\1',
    r'shadow-purple-(\d+)': r'shadow-teal-\1',
}

EXTENSIONS = ('.tsx', '.ts', '.css', '.js', '.jsx')
SEARCH_DIR = 'src'

def refactor_colors():
    count = 0
    file_count = 0
    for root, dirs, files in os.walk(SEARCH_DIR):
        for file in files:
            if file.endswith(EXTENSIONS):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                new_content = content
                for pattern, replacement in MAPPINGS.items():
                    new_content = re.sub(pattern, replacement, new_content)
                
                if new_content != content:
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Refactored: {path}")
                    file_count += 1
                    count += len(re.findall(r'teal-|cyan-', new_content)) - len(re.findall(r'teal-|cyan-', content))

    print(f"\nFinalizado: {file_count} arquivos alterados.")

if __name__ == "__main__":
    refactor_colors()
