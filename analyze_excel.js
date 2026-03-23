const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join('c:', 'Users', 'Leandro Silveira', 'Documents', 'crm-next', 'docs', 'templates', 'FORMULÁRIO DE PEDIDOS HW Ingram.xlsx');

try {
    const workbook = XLSX.readFile(filePath);
    console.log("Sheet Names:", workbook.SheetNames);

    const sheetName = "Pedido HW";
    console.log(`\n--- Sheet: ${sheetName} ---`);
    const sheet = workbook.Sheets[sheetName];

    // Extract rows to see the product section
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, range: 0, defval: "" });

    console.log("Total rows in data array:", data.length);

    data.forEach((row, index) => {
        if (row.length > 0 && index >= 30 && index < 60) {
            console.log(`Row ${index}:`, row.map(cell => String(cell).substring(0, 50)).join(' | '));
        }
    });
} catch (error) {
    console.error("Error reading Excel:", error.message);
}
