
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import ExcelJS from 'exceljs';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const date = searchParams.get('date');

        if (!date) {
            return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 });
        }

        const fileName = 'meyvali-excel.xlsx';
        const publicDir = path.join(process.cwd(), 'public');
        const filePath = path.join(publicDir, fileName);

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);

        const worksheet1 = workbook.getWorksheet(1);
        if (!worksheet1) {
            throw new Error('Worksheet 1 not found');
        }

        const targetRow = findRowForDate(worksheet1, date, 2);

        const getCellValue = (cell: ExcelJS.Cell): number => {
            return Number(cell.value) || 0;
        };

        // Manually calculate the value of Q (Q12 in this case)
        let qValue = 0;
        for (let col = 'C'.charCodeAt(0); col <= 'P'.charCodeAt(0); col++) {
            const cellValue = getCellValue(worksheet1.getCell(`${String.fromCharCode(col)}${targetRow}`));
            qValue += cellValue;
        }

        // Manually calculate the value of T (T12 in this case)
        const rValue = getCellValue(worksheet1.getCell(`R${targetRow}`));
        const sValue = getCellValue(worksheet1.getCell(`S${targetRow}`));
        const tValue = qValue + rValue + sValue;

        const paketAdet = getCellValue(worksheet1.getCell(`Y${targetRow}`));

        // Calculate the average of the Y column (paketAverage)
        let ySum = 0;
        let yCount = 0;
        worksheet1.eachRow((row, rowNumber) => {
            const yCell = row.getCell('Y');
            const yValue = getCellValue(yCell);
            if (yValue) {
                ySum += yValue;
                yCount++;
            }
        });
        const paketAverage = yCount > 0 ? ySum / yCount : 0;

        console.log('Retrieved values:', { tValue, paketAdet, paketAverage: paketAverage }); // Debug log

        const dailyData = {
            ciro: tValue,
            paketAdet,
            paketAverage: paketAverage,
            date
        };

        console.log('Sending data:', dailyData); // Debug log

        return NextResponse.json({ dailyData }, { status: 200 });
    } catch (error) {
        console.log('Error in GET function:', error);
        return NextResponse.json({ error: 'An error occurred while processing the request' }, { status: 500 });
    }
}

// Function to find the correct row for the given date, starting from a specific row
function findRowForDate(worksheet: ExcelJS.Worksheet, date: string, startRow: number): number {
    let rowIndex = startRow;
    while (rowIndex <= worksheet.rowCount) {
        const cellValue = worksheet.getCell(`A${rowIndex}`).value;
        if (cellValue === null || cellValue === undefined || cellValue === '') {
            worksheet.getCell(`A${rowIndex}`).value = date;
            return rowIndex;
        } else if (cellValue === date) {
            return rowIndex;
        }
        rowIndex++;
    }
    worksheet.getCell(`A${rowIndex}`).value = date; // Set the date in the next available row
    return rowIndex;
}