import { readFileSync, writeFileSync } from 'fs';

const filesToFix = [
  "c:/Users/Leandro Silveira/Documents/crm-next/src/app/(dashboard)/settings/client-page.tsx",
  "c:/Users/Leandro Silveira/Documents/crm-next/src/app/(dashboard)/sales-orders/page.tsx",
  "c:/Users/Leandro Silveira/Documents/crm-next/src/app/(dashboard)/reports/client-page.tsx",
  "c:/Users/Leandro Silveira/Documents/crm-next/src/app/(dashboard)/proposals/page.tsx",
  "c:/Users/Leandro Silveira/Documents/crm-next/src/app/(dashboard)/products/client-page.tsx",
  "c:/Users/Leandro Silveira/Documents/crm-next/src/app/(dashboard)/price-lists/page.tsx",
  "c:/Users/Leandro Silveira/Documents/crm-next/src/app/(dashboard)/pipeline/client-page.tsx",
  "c:/Users/Leandro Silveira/Documents/crm-next/src/app/(dashboard)/integrations/client-page.tsx",
  "c:/Users/Leandro Silveira/Documents/crm-next/src/app/(dashboard)/leads/client-page.tsx",
  "c:/Users/Leandro Silveira/Documents/crm-next/src/app/(dashboard)/goals-commissions/client-page.tsx",
  "c:/Users/Leandro Silveira/Documents/crm-next/src/app/(dashboard)/inbox/page.tsx",
  "c:/Users/Leandro Silveira/Documents/crm-next/src/app/(dashboard)/goals/client-page.tsx",
  "c:/Users/Leandro Silveira/Documents/crm-next/src/app/(dashboard)/customers/client-page.tsx",
  "c:/Users/Leandro Silveira/Documents/crm-next/src/app/(dashboard)/dashboard/client-page.tsx",
  "c:/Users/Leandro Silveira/Documents/crm-next/src/app/(dashboard)/contacts/client-page.tsx",
  "c:/Users/Leandro Silveira/Documents/crm-next/src/app/(dashboard)/contracts/client-page.tsx",
  "c:/Users/Leandro Silveira/Documents/crm-next/src/app/(dashboard)/automations/client-page.tsx",
  "c:/Users/Leandro Silveira/Documents/crm-next/src/app/(dashboard)/activities/client-page.tsx"
];

for (const f of filesToFix) {
    let content = readFileSync(f, 'utf8');

    content = content.replace(/<h1 className="([^"]*)"/g, (match, classes) => {
        let newClasses = classes
            .replace(/\btext-(lg|xl|2xl|3xl|4xl|5xl)\b/g, '')
            .replace(/\bfont-(normal|medium|semibold|bold|extrabold|black)\b/g, '')
            .replace(/\btracking-(tighter|tight|normal|wide)\b/g, '')
            .replace(/\btext-foreground\b/g, '')
            .split(' ')
            .filter(c => c.trim() !== '')
            .join(' ');
        
        newClasses = `text-3xl font-black text-foreground tracking-tight ${newClasses}`.trim();
        return `<h1 className="${newClasses}"`;
    });

    writeFileSync(f, content);
}

console.log('All headings standardized successfully!');
