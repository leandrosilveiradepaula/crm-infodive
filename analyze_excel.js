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

        if (!sheet) {
            throw new Error(`Sheet not found: ${sheetName}`);
        }

        console.log('Total rows in data array:', sheet.rowCount);

        sheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
            const index = rowNumber - 1;
            if (index >= 30 && index < 60) {
                const values = Array.isArray(row.values) ? row.values.slice(1) : [];
                console.log(
                    `Row ${index}:`,
                    values.map((cell) => String(cell ?? '').substring(0, 50)).join(' | ')
                );
            }
        });
    } catch (error) {
        console.error('Error reading Excel:', error instanceof Error ? error.message : error);
        process.exitCode = 1;
    }
}

void main();
