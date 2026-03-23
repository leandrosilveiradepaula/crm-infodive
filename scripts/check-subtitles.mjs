import fs from 'fs';
const filesToFix = [
  'c:/Users/Leandro Silveira/Documents/crm-next/src/app/(dashboard)/settings/client-page.tsx',
  'c:/Users/Leandro Silveira/Documents/crm-next/src/app/(dashboard)/sales-orders/page.tsx',
  'c:/Users/Leandro Silveira/Documents/crm-next/src/app/(dashboard)/reports/client-page.tsx',
  'c:/Users/Leandro Silveira/Documents/crm-next/src/app/(dashboard)/proposals/page.tsx',
  'c:/Users/Leandro Silveira/Documents/crm-next/src/app/(dashboard)/products/client-page.tsx',
  'c:/Users/Leandro Silveira/Documents/crm-next/src/app/(dashboard)/price-lists/page.tsx',
  'c:/Users/Leandro Silveira/Documents/crm-next/src/app/(dashboard)/pipeline/client-page.tsx',
  'c:/Users/Leandro Silveira/Documents/crm-next/src/app/(dashboard)/integrations/client-page.tsx',
  'c:/Users/Leandro Silveira/Documents/crm-next/src/app/(dashboard)/leads/client-page.tsx',
  'c:/Users/Leandro Silveira/Documents/crm-next/src/app/(dashboard)/goals-commissions/client-page.tsx',
  'c:/Users/Leandro Silveira/Documents/crm-next/src/app/(dashboard)/inbox/page.tsx',
  'c:/Users/Leandro Silveira/Documents/crm-next/src/app/(dashboard)/goals/client-page.tsx',
  'c:/Users/Leandro Silveira/Documents/crm-next/src/app/(dashboard)/customers/client-page.tsx',
  'c:/Users/Leandro Silveira/Documents/crm-next/src/app/(dashboard)/dashboard/client-page.tsx',
  'c:/Users/Leandro Silveira/Documents/crm-next/src/app/(dashboard)/contacts/client-page.tsx',
  'c:/Users/Leandro Silveira/Documents/crm-next/src/app/(dashboard)/contracts/client-page.tsx',
  'c:/Users/Leandro Silveira/Documents/crm-next/src/app/(dashboard)/automations/client-page.tsx',
  'c:/Users/Leandro Silveira/Documents/crm-next/src/app/(dashboard)/activities/client-page.tsx',
  'c:/Users/Leandro Silveira/Documents/crm-next/src/app/(dashboard)/sales/page.tsx'
];

for (const f of filesToFix) {
    if (!fs.existsSync(f)) continue;
    let content = fs.readFileSync(f, 'utf8');
    let idx = content.indexOf('<h1');
    if (idx !== -1) {
        let before = content.substring(Math.max(0, idx - 150), idx);
        let after = content.substring(idx, Math.min(content.length, idx + 250));
        let moduleName = f.split('/').slice(-2)[0];
        console.log('--- ' + moduleName + ' ---');
        console.log('WRAP:', before.split('\n').slice(-3).join('\n'));
        
        let pMatch = after.match(/<p[^>]*>.*?<\/p>/s);
        if (pMatch) {
            console.log('SUBTITLE:', pMatch[0].substring(0, 100).replace(/\n\s*/g, ' '));
        } else {
            console.log('SUBTITLE: None');
        }
    }
}
