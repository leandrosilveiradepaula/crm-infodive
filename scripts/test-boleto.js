const fs = require('fs');
const pdfParse = require('pdf-parse');

const filePath = String.raw`c:\Users\Leandro Silveira\Downloads\NFe32250901771935000800550090004674281791615932.pdf`;

async function main() {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    const text = data.text;

    const boletos = [];

    // Find all Vencimentos
    // PAGAVEL EM QUALQUER BANCO ATE VENCIMENTO27/10/2025
    const dateRegex = /PAGAVEL EM QUALQUER BANCO ATE VENCIMENTO\s*(\d{2}\/\d{2}\/\d{4})/gi;
    let dateMatch;
    const dates = [];
    while ((dateMatch = dateRegex.exec(text)) !== null) {
        dates.push(dateMatch[1]);
    }

    // Find all Values
    // 109R$      68.779,90
    const valueRegex = /109R\$\s+([\d\.,]+)/gi;
    let valueMatch;
    const values = [];
    while ((valueMatch = valueRegex.exec(text)) !== null) {
        values.push(valueMatch[1]);
    }

    // Combine them (assuming they appear in order)
    const maxLen = Math.min(dates.length, values.length);
    for (let i = 0; i < maxLen; i++) {
        boletos.push({
            dueDate: dates[i],
            amount: parseFloat(values[i].replace(/[^\d,]/g, '').replace(',', '.'))
        });
    }

    console.log('--- EXTRACAO DE BOLETOS ---');
    console.log(boletos);
}

main().catch(console.error);
