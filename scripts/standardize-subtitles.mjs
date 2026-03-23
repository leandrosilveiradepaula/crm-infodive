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

let modifiedCount = 0;
for (const f of filesToFix) {
    if (!fs.existsSync(f)) continue;
    let content = fs.readFileSync(f, 'utf8');
    
    // Find the next <p> tag immediately following the </h1> tag
    const regex = /(<h1[^>]*>.*?<\/h1>\s*)(<p[^>]*>)(.*?)(<\/p>)/s;
    const match = content.match(regex);
    
    if (match) {
        const fullMatch = match[0];
        const h1Part = match[1];
        const pOpen = match[2];
        const pInner = match[3];
        const pClose = match[4];
        
        const newPOpen = '<p className="text-sm font-medium text-muted-foreground mt-1">';
        const newSubtitle = h1Part + newPOpen + pInner + pClose;
        
        if (fullMatch !== newSubtitle) {
            content = content.replace(fullMatch, newSubtitle);
            fs.writeFileSync(f, content, 'utf8');
            modifiedCount++;
            console.log('Updated subtitle in ' + f.split('/').slice(-2)[0]);
        }
    }
}

console.log('Modified ' + modifiedCount + ' files.');
