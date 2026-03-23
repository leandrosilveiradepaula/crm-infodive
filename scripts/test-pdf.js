const fs = require('fs');
const pdfParse = require('pdf-parse');

const filePath = String.raw`c:\Users\Leandro Silveira\Downloads\NFe32250901771935000800550090004674281791615932.pdf`;

async function main() {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    const text = data.text;

    // Date
    let date = 'Not found';
    const emissionMatch = text.match(/DATA DE EMISS.O[\s\S]*?(\d{2}\/\d{2}\/\d{4})/i) ||
        text.match(/EMISSAO:\s*(\d{2}\/\d{2}\/\d{4})/i) ||
        text.match(/(?:^|\s)(\d{2}\/\d{2}\/\d{4})(?:\s|$)/);
    if (emissionMatch) date = emissionMatch[1];

    // Total
    let total = 'Not found';
    const totalMatch = text.match(/VALOR TOTAL DA NOTA[\s\S]{0,50}?([\d\.,]{5,})/i) ||
        text.match(/VALOR TOTAL DOS PRODUTOS[\s\S]{0,50}?([\d\.,]{5,})/i) ||
        text.match(/R\$\s*([\d\.,]+)/i);
    if (totalMatch) total = totalMatch[1];

    // Issuer Name
    let issuer = 'Not found';
    const nameMatch = text.match(/INGRAM MICRO/i) ? 'INGRAM MICRO BRASIL LTDA' : 'Desconhecido';

    console.log('Date:', date);
    console.log('Total:', total);
    console.log('Issuer:', nameMatch);
}

main().catch(console.error);
