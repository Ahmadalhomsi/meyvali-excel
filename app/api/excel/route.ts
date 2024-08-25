
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
        const fileName = 'temmuz 2024 dene.xlsx';
        const publicDir = path.join(process.cwd(), 'public');
        const filePath = path.join(publicDir, fileName);

        // Read the Excel file
        const workbook = new ExcelJS.Workbook();
        const fileBuffer = await fs.readFile(filePath);
        await workbook.xlsx.load(fileBuffer);

        // Get the third sheet (index 2)
        const worksheet = workbook.worksheets[2];

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
        const filteredProducts = jsonData.filter((product: any) => product['Tarih'] === date);

        return NextResponse.json({ products: filteredProducts }, { status: 200 });
    } catch (error: any) {
        console.error('Error in GET function:', error);
        return NextResponse.json({ error: 'An error occurred while processing the request', details: error.message }, { status: 500 });
    }
}

import ExcelJS from 'exceljs';


export async function PUT(request: NextRequest) {
    try {
        const { date, products, totalPrice, imageBuffer } = await request.json();

        const fileName = 'temmuz 2024 dene.xlsx';
        const publicDir = path.join(process.cwd(), 'public');
        const uploadsDir = path.join(publicDir, 'uploads');
        const filePath = path.join(publicDir, fileName);

        // Ensure the uploads directory exists
        try {
            await fs.access(uploadsDir);
        } catch {
            await fs.mkdir(uploadsDir, { recursive: true });
        }

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);

        const worksheet = workbook.getWorksheet(3);

        if (!worksheet) {
            throw new Error('Worksheet not found');
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

        // Add the new products
        products.forEach((product: any) => {
            const productRow = Array.isArray(product) ? product : Object.values(product);
            worksheet.addRow(productRow);
        });

        const firstProductRowIndex = worksheet.actualRowCount - products.length + 1;

        // Handle image replacement logic
        const imageCell = worksheet.getCell(`G${firstProductRowIndex}`);
        let oldImageUrl: string | undefined;

        if (imageCell.value && typeof imageCell.value === 'object' && 'hyperlink' in imageCell.value) {
            oldImageUrl = (imageCell.value as ExcelJS.CellHyperlinkValue).hyperlink;
        }

        if (imageBuffer) {
            // Generate a filename based on the date
            const dateFormatted = date.replace(/\./g, '-'); // Convert '25.08.2024' to '25-08-2024'
            const imageFileName = `${dateFormatted}.png`;
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

            const imageUrl = `${request.nextUrl.origin}/uploads/${imageFileName}`;

            // Update the Excel file with the new image link
            imageCell.value = { text: 'Image Link', hyperlink: imageUrl } as ExcelJS.CellHyperlinkValue;
            imageCell.font = { color: { argb: 'FF0000FF' }, underline: true };

            console.log(`Updated image for date: ${date}`);
        }

        // Save the updated workbook back to the file
        await workbook.xlsx.writeFile(filePath);

        return NextResponse.json({ message: 'Products and image link successfully updated' }, { status: 200 });
    } catch (error) {
        console.error('Error in PUT function:', error);
        return NextResponse.json({ error: 'An error occurred while processing the request' }, { status: 500 });
    }
}



// Post endpoint to type the data on the excel file that located in the public folder