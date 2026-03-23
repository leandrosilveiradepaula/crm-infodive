import { readdirSync, statSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const searchDir = 'c:/Users/Leandro Silveira/Documents/crm-next/src';

const replacements = [
    { regex: /text-gray-900/g, replacement: 'text-foreground' },
    { regex: /text-gray-800/g, replacement: 'text-foreground' },
    { regex: /text-gray-700/g, replacement: 'text-foreground' },
    { regex: /text-gray-600/g, replacement: 'text-muted-foreground' },
    { regex: /text-gray-500/g, replacement: 'text-muted-foreground' },
    { regex: /text-gray-400/g, replacement: 'text-muted-foreground' },
    { regex: /bg-gray-50\b|bg-gray-100\b/g, replacement: 'bg-muted/50' },
    { regex: /border-gray-200/g, replacement: 'border-border' },
    { regex: /border-gray-100/g, replacement: 'border-border/50' }
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
console.log('Theme substitution complete!');
