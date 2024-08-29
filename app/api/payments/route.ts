import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';

export async function GET(request: NextRequest) {
    try {
        // Get the date from the query parameter
        const searchParams = request.nextUrl.searchParams;
        const date = searchParams.get('date');

        if (!date) {
            return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 });
        }

        // Define the file path
        const fileName = 'meyvali-excel.xlsx';
        const publicDir = path.join(process.cwd(), 'public');
        const filePath = path.join(publicDir, fileName);

        // Read the Excel file
        const workbook = new ExcelJS.Workbook();
        const fileBuffer = await fs.readFile(filePath);
        await workbook.xlsx.load(fileBuffer);

        // Get the third sheet (index 3)
        const worksheet = workbook.worksheets[3];

        // Convert the worksheet to JSON
        const jsonData: any[] = [];
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) { // Skip the header row
                const rowObject: any = {};
                row.eachCell((cell, colNumber) => {
                    const headerCell = worksheet.getRow(1).getCell(colNumber);
                    const header = headerCell.value?.toString();
                    if (header) {
                        rowObject[header] = cell.value;
                    }
                });
                jsonData.push(rowObject);
            }
        });

        // Filter the data based on the provided date
        const filteredPayments = jsonData.filter((product: any) => product['Tarih'] === date);

        return NextResponse.json({ payments: filteredPayments }, { status: 200 });
    } catch (error: any) {
        console.error('Error in GET function:', error);
        return NextResponse.json({ error: 'An error occurred while processing the request', details: error.message }, { status: 500 });
    }
}

import ExcelJS from 'exceljs';
import { serverBaseUrl } from '@/components/serverConfig';


export async function PUT(request: NextRequest) {
    try {
        const { date, payments, totalPrice, imageBuffer } = await request.json();

        const fileName = 'meyvali-excel.xlsx';
        const publicDir = path.join(process.cwd(), 'public');
        const uploadsDir = path.join(publicDir, 'uploads');
        const filePath = path.join(publicDir, fileName);

        console.log(payments);

        // Ensure the uploads directory exists
        try {
            await fs.access(uploadsDir);
        } catch {
            await fs.mkdir(uploadsDir, { recursive: true });
        }

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);

        let worksheet = workbook.getWorksheet(4);

        if (!worksheet) {
            worksheet = workbook.addWorksheet('Sheet4');
        }

        // If the worksheet is empty, add the template headers and set column widths
        if (worksheet.actualRowCount === 0) {
            const headers = ['Tarih', 'Fiyat', 'Adisyon No', 'Adisyon Adı', 'Ödeme Türü', 'Ek Bilgi', 'Fotoğraf'];
            worksheet.addRow(headers);

            // Adjust column widths
            worksheet.columns = [
                { width: 12 }, // Tarih
                { width: 8 }, // Fiyat
                { width: 16 }, // Adisyon No
                { width: 12 }, // Adisyon Adı
                { width: 15 }, // Ödeme Türü
                { width: 25 }, // Ek Bilgi
                { width: 15 }, // Fotoğraf
            ];
        }

        // Find and remove all rows with the given date in the first column
        let rowToDelete = 1;
        while (rowToDelete <= worksheet.rowCount) {
            const cell = worksheet.getCell(`A${rowToDelete}`);
            if (cell.value === date) {
                worksheet.spliceRows(rowToDelete, 1);
            } else {
                rowToDelete++;
            }
        }

        // Determine the index to start adding new rows
        const startRow = worksheet.actualRowCount + 1;

        // Add the new products starting from the correct row
        payments.forEach((product: any, index: number) => {
            const productRow = Array.isArray(product) ? product : Object.values(product);
            worksheet.insertRow(startRow + index, productRow);
        });

        const firstProductRowIndex = startRow;

        // Handle image replacement logic
        const imageCell = worksheet.getCell(`H${firstProductRowIndex}`); // Changed to column H for Fotoğraf
        let oldImageUrl: string | undefined;

        if (imageCell.value && typeof imageCell.value === 'object' && 'hyperlink' in imageCell.value) {
            oldImageUrl = (imageCell.value as ExcelJS.CellHyperlinkValue).hyperlink;
        }

        if (imageBuffer) {
            // Generate a filename based on the date
            const dateFormatted = date.replace(/\./g, '-'); // Convert '25.08.2024' to '25-08-2024'
            const imageFileName = `${dateFormatted}-Odeme.png`;
            const imageFilePath = path.join(uploadsDir, imageFileName);

            // Check if an old image exists and delete it
            try {
                await fs.access(imageFilePath);
                await fs.unlink(imageFilePath);
                console.log(`Deleted existing image for date: ${date}`);
            } catch (err: any) {
                if (err.code !== 'ENOENT') {
                    console.warn(`Error checking/deleting existing image: ${err.message}`);
                }
            }

            // Save the new image
            const buffer = Buffer.from(imageBuffer.split(',')[1], 'base64');
            await fs.writeFile(imageFilePath, buffer);

            const imageUrl = `${serverBaseUrl}/uploads/${imageFileName}`;

            // Update the Excel file with the new image link
            imageCell.value = { text: 'Fotoğraf Linki', hyperlink: imageUrl } as ExcelJS.CellHyperlinkValue;
            imageCell.font = { color: { argb: 'FF0000FF' }, underline: true };

            console.log(`Updated image for date: ${date}`);
        }

        // ------ ------- Now move to the first worksheet

        const worksheet1 = workbook.getWorksheet(1);
        if (!worksheet1) {
            throw new Error('Worksheet 1 not found');
        }

        // Define the mapping of categories to their corresponding index in the first worksheet
        const paymentTypeColumnMap: { [key: string]: string } = {
            'Havale': 'W',
            'Eski Bakiye': 'X',
            'Veresiye': 'AA',
        };



        // Loop through the products and update the first worksheet
        payments.forEach((product: any) => {
            const { 'Fiyat': price, 'Ödeme Türü': paymentType } = product;

            const columnLetter = paymentTypeColumnMap[paymentType];

            if (columnLetter) {
                let targetRow: number;
                targetRow = findRowForDate(worksheet1, date, 2); // Start from row 2 for 'Nakit'
                const targetCell = worksheet1.getCell(`${columnLetter}${targetRow}`);
                const currentValue = targetCell.value || 0;
                targetCell.value = (currentValue as number) + price;
            }
        });

        // Save the updated workbook back to the file
        await workbook.xlsx.writeFile(filePath);

        return NextResponse.json({ message: 'Products and image link successfully updated' }, { status: 200 });
    } catch (error) {
        console.error('Error in PUT function:', error);
        return NextResponse.json({ error: 'An error occurred while processing the request' }, { status: 500 });
    }
}


// Function to find the correct row for the given date, starting from a specific row
function findRowForDate(worksheet: any, date: string, startRow: number): number {
    let rowIndex = startRow;
    while (rowIndex <= worksheet.rowCount) {
        const cellValue = worksheet.getCell(`A${rowIndex}`).value;
        if (cellValue === null || cellValue === undefined || cellValue === '') {
            worksheet.getCell(`A${rowIndex}`).value = date; // Add the date to the first empty row
            return rowIndex;
        }
        if (cellValue === date) {
            return rowIndex; // Return the row if the date matches
        }
        if (cellValue > date) {
            // Insert a new row and add the date
            worksheet.insertRow(rowIndex, [date]);
            return rowIndex;
        }
        rowIndex++;
    }
    // If we've reached here, add a new row at the end
    worksheet.addRow([date]);
    return worksheet.rowCount;
}


// Post endpoint to type the data on the excel file that located in the public folder