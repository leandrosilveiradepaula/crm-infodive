const fs = require('fs');
const pdfParse = require('pdf-parse');

const filePath = String.raw`c:\Users\Leandro Silveira\Downloads\NFe32250901771935000800550090004674281791615932.pdf`;

async function main() {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    const text = data.text;

    const boletos = [];

    // Ingram Micro specific parsing
    // Split by VENCIMENTO line
    const blocks = text.split(/PAGAVEL EM QUALQUER BANCO ATE VENCIMENTO/i);
    // first block is header, ignore
    for (let i = 1; i < blocks.length; i++) {
        const block = blocks[i];
        const dateMatch = block.match(/^(\d{2}\/\d{2}\/\d{4})/);
        const valMatch = block.match(/109R\$\s*([\d\.,]+)/);
        if (dateMatch && valMatch) {
            boletos.push({
                dueDate: dateMatch[1],
                amount: parseFloat(valMatch[1].replace(/[^\d,]/g, '').replace(',', '.'))
            });
        }
    }

    console.log('--- EXTRACAO DE BOLETOS ---');
    console.log(boletos);
}

main().catch(console.error);
