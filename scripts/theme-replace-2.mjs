import { readdirSync, statSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const searchDir = 'c:/Users/Leandro Silveira/Documents/crm-next/src';

const replacements = [
    { regex: /\bbg-white\b/g, replacement: 'bg-card' },
    { regex: /\btext-gray-300\b/g, replacement: 'text-muted-foreground' },
    { regex: /\bbg-slate-50\b|\bbg-gray-100\b|\bbg-gray-50\b|\bbg-gray-200\b/g, replacement: 'bg-muted/50' },
    { regex: /\btext-slate-500\b|\btext-slate-400\b/g, replacement: 'text-muted-foreground' },
    { regex: /\btext-slate-900\b|\btext-slate-800\b/g, replacement: 'text-foreground' },
    { regex: /\bborder-slate-200\b|\bborder-slate-100\b|\bborder-gray-200\b/g, replacement: 'border-border' }
];

function processDirectory(dir) {
    const files = readdirSync(dir);

    for (const file of files) {
        const fullPath = join(dir, file);
        if (statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = readFileSync(fullPath, 'utf8');
            let modified = false;

            for (const { regex, replacement } of replacements) {
                if (regex.test(content)) {
                    content = content.replace(regex, replacement);
                    modified = true;
                }
            }

            if (modified) {
                writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated: ${fullPath}`);
            }
        }
    }
}

processDirectory(searchDir);
console.log('Theme substitution 2 complete!');
