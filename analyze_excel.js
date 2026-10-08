const ExcelJS = require('exceljs');
const path = require('path');

const filePath = path.join('c:', 'Users', 'Leandro Silveira', 'Documents', 'crm-next', 'docs', 'templates', 'FORMULÁRIO DE PEDIDOS HW Ingram.xlsx');

async function main() {
    try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);

        console.log('Sheet Names:', workbook.worksheets.map((sheet) => sheet.name));

        const sheetName = 'Pedido HW';
        console.log(`\n--- Sheet: ${sheetName} ---`);
        const sheet = workbook.getWorksheet(sheetName);
        if (!sheet) throw new Error(`Sheet not found: ${sheetName}`);

        const data = [];
        for (let rowNumber = 1; rowNumber <= sheet.rowCount; rowNumber += 1) {
            const row = sheet.getRow(rowNumber);
            const values = [];
            for (let columnNumber = 1; columnNumber <= sheet.columnCount; columnNumber += 1) {
                const value = row.getCell(columnNumber).value;
                if (value && typeof value === 'object' && 'result' in value) values.push(value.result ?? '');
                else if (value && typeof value === 'object' && 'text' in value) values.push(value.text ?? '');
                else values.push(value ?? '');
            }
            data.push(values);
        }

        console.log('Total rows in data array:', data.length);
        data.forEach((row, index) => {
            if (row.length > 0 && index >= 30 && index < 60) {
                console.log(`Row ${index}:`, row.map((cell) => String(cell).substring(0, 50)).join(' | '));
            }
        });
    } catch (error) {
        console.error('Error reading Excel:', error instanceof Error ? error.message : String(error));
        process.exitCode = 1;
    }
}

main();
