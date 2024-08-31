
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';
import { v4 as uuidv4 } from 'uuid'; // To generate unique identifiers
import ExcelJS from 'exceljs';
import { serverBaseUrl } from '@/components/serverConfig';


export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const date = searchParams.get('date');
        console.log('Received GET request with date:', date);

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

                        // Check if this is the image column and extract the hyperlink
                        if (header === 'Image' && cell.hyperlink) {
                            rowObject['Image'] = cell.hyperlink;
                        }
                    }
                });
                jsonData.push(rowObject);
            }
        });

        // Filter the data based on the provided date
        const filteredProducts = jsonData.filter((product: any) => product['Tarih'].split(' ')[0] === date);

        return NextResponse.json({ products: filteredProducts }, { status: 200 });
    } catch (error: any) {
        console.log('Error in GET function:', error);
        return NextResponse.json({ error: 'An error occurred while processing the request', details: error.message }, { status: 500 });
    }
}





export async function PUT(request: NextRequest) {
    try {
        const data = await request.json();
        const { id, category, name, paymentType, info, date, image } = data;
        const quantity = parseFloat(data.quantity);
        const price = parseFloat(data.price);

        const fileName = 'meyvali-excel.xlsx';
        const publicDir = path.join(process.cwd(), 'public');
        const uploadsDir = path.join(publicDir, 'uploads');
        const filePath = path.join(publicDir, fileName);

        const dateOnly = date.split(' ')[0]; // Output: "DD.MM.YYYY"

        // Ensure the uploads directory exists
        try {
            await fs.access(uploadsDir);
        } catch {
            await fs.mkdir(uploadsDir, { recursive: true });
        }

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);

        let worksheet = workbook.getWorksheet(3);

        if (!worksheet) {
            worksheet = workbook.addWorksheet('Sheet3');
        }

        // If the worksheet is empty, add the template headers and set column widths
        if (worksheet.actualRowCount === 0) {
            const headers = ['Tarih', 'Katagori', 'Ürün Adı', 'Adet/Kg', 'Fiyat', 'Ödeme Türü', 'Ek Bilgi', 'Fotoğraf', 'ID'];
            worksheet.addRow(headers);

            // Adjust column widths
            worksheet.columns = [
                { width: 15 }, // Tarih
                { width: 16 }, // Katagori
                { width: 16 }, // Ürün Adı
                { width: 8 }, // Adet/Kg
                { width: 8 }, // Fiyat
                { width: 15 }, // Ödeme Türü
                { width: 25 }, // Ek Bilgi
                { width: 15 }, // Fotoğraf
                { width: 40 }, // ID (increased width for UUID)
            ];
        }

        // Find the row with the given ID
        let rowToUpdate: ExcelJS.Row | undefined;
        worksheet.eachRow((row, rowNumber) => {
            if (row.getCell(9).value === id) {
                rowToUpdate = row;
            }
        });

        if (rowToUpdate) {
            // Update existing row
            rowToUpdate.getCell(1).value = date;
            rowToUpdate.getCell(2).value = category;
            rowToUpdate.getCell(3).value = name;
            rowToUpdate.getCell(4).value = quantity;
            rowToUpdate.getCell(5).value = price;
            rowToUpdate.getCell(6).value = paymentType;
            rowToUpdate.getCell(7).value = info;
        } else {
            // Insert new row if ID not found
            const newRow = [date, category, name, quantity, price, paymentType, info, , id, ''];
            rowToUpdate = worksheet.addRow(newRow);
        }

        // Handle image update
        if (image && typeof image === 'string' && image.startsWith('data:image/png;base64,')) {
            const uniqueId = id;
            const dateFormatted = dateOnly.replace(/\./g, '-');
            const imageFileName = `${dateFormatted}-${uniqueId}-Urunler.png`;
            const imageFilePath = path.join(uploadsDir, imageFileName);

            // Save the new image
            const buffer = Buffer.from(image.split(',')[1], 'base64');
            await fs.writeFile(imageFilePath, buffer);

            const imageUrl = `${serverBaseUrl}/uploads/${imageFileName}`;

            // Update the Excel file with the new image link
            const imageCell = rowToUpdate.getCell(8);
            imageCell.value = { text: 'Fotoğraf Linki', hyperlink: imageUrl } as ExcelJS.CellHyperlinkValue;
            imageCell.font = { color: { argb: 'FF0000FF' }, underline: true };

            console.log(`Updated image for date: ${date}`);
        } else {
            console.error('Image is not a valid base64-encoded string.');
        }

        // Update the first worksheet based on category
        const worksheet1 = workbook.getWorksheet(1);
        if (!worksheet1) {
            throw new Error('Worksheet 1 not found');
        }

        // Define the mapping of categories to their corresponding index in the first worksheet
        const categoryColumnMap: { [key: string]: string } = {
            'SÜT': 'C',
            'ET-DANA': 'D',
            'ET-KUZU': 'E',
            'BEYAZ-ET': 'F',
            'EKMEK': 'G',
            'MARKET PAZAR RAMİ': 'H',
            'PAÇA': 'I',
            'İŞKEMBE': 'J',
            'AMBALAJ MALZEMESİ': 'K',
            'SU-ŞİŞE': 'L',
            'MEŞRUBAT': 'M',
            'TÜP': 'N',
            'MAZOT': 'O',
            'EKSTRA ELEMAN': 'P',
        };

        const columnLetter = categoryColumnMap[category];

        if (columnLetter) {
            let targetRow: number;
            if (paymentType === 'Nakit') {
                targetRow = findRowForDate(worksheet1, date, 2); // Start from row 2 for 'Nakit'
                const targetCell = worksheet1.getCell(`${columnLetter}${targetRow}`);
                const currentValue = targetCell.value || 0;
                targetCell.value = (currentValue as number) + price;
            } else {
                targetRow = findRowForDate(worksheet1, date, 34); // Start from row 34 for other payment types
                const targetCell = worksheet1.getCell(`${columnLetter}${targetRow}`);
                targetCell.value = price;
            }
        }

        // Save the updated workbook back to the file
        await workbook.xlsx.writeFile(filePath);

        return NextResponse.json({ message: 'Product and image link successfully updated', id: id || uuidv4() }, { status: 200 });
    } catch (error) {
        console.error('Error in PUT function:', error);
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