import fs from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

const filePath = String.raw`c:\Users\Leandro Silveira\Downloads\NFe32250901771935000800550090004674281791615932.pdf`;

async function main() {
    const dataBuffer = fs.readFileSync(filePath);
    // pdfParse might be an object with default
    const parseFn = typeof pdfParse === 'function' ? pdfParse : pdfParse.default;
    const data = await parseFn(dataBuffer);
    console.log('--- START TEXT ---');
    console.log(data.text);
    console.log('--- END TEXT ---');
}

main().catch(console.error);
