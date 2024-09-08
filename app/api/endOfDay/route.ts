import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';

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




import ExcelJS from 'exceljs';
import { serverBaseUrl } from '@/components/serverConfig';
import axios from 'axios';


export async function PUT(request: NextRequest) {
    try {
        const { date, totalCash, imageBuffer, userName } = await request.json();

        const fileName = 'meyvali-excel.xlsx';
        const publicDir = path.join(process.cwd(), 'public');
        const uploadsDir = path.join(publicDir, 'uploads');
        const filePath = path.join(publicDir, fileName);

        console.log(date);
        console.log(totalCash);

        const dateOnly = date.split(' ')[0]; // Output: "DD.MM.YYYY"

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
            const headers = ['Tarih', 'Kalan', 'Kredi Kartı', 'Kare Kod', 'e-Fatura', 'Ek Bilgi', 'Fotoğraf', 'Kullanıcı'];
            worksheet.addRow(headers);

            // Adjust column widths
            worksheet.columns = [
                { width: 15 }, // Tarih
                { width: 10 }, // Kalan
                { width: 10 }, // Kredi Kartı
                { width: 10 }, // Kare Kod
                { width: 10 }, // e-Fatura
                { width: 25 }, // Ek Bilgi
                { width: 15 }, // Fotoğraf
                { width: 20 }  // Kullanıcı
            ];
        }

        // Find the row with the given ID or add a new row
        let rowToUpdate: ExcelJS.Row | undefined;
        worksheet.eachRow((row, rowNumber) => {
            console.log("-------------------------------------");

            console.log((row.getCell(1).value + "").split(' ')[0], "+++++", date.split(' ')[0]);

            if ((row.getCell(1).value + "").split(' ')[0] === date.split(' ')[0]) {
                rowToUpdate = row;
            }
        });

        if (rowToUpdate) {
            // Update the existing row
            rowToUpdate.getCell(1).value = date;
            rowToUpdate.getCell(2).value = totalCash.remaining;
            rowToUpdate.getCell(3).value = totalCash.creditCard;
            rowToUpdate.getCell(4).value = totalCash.TRQcode;
            rowToUpdate.getCell(5).value = totalCash.eBill;
            rowToUpdate.getCell(6).value = totalCash.info;

            rowToUpdate.getCell(8).value = userName;
        } else {
            // Insert new row if ID not found
            const newRow = [
                date,
                totalCash.remaining,
                totalCash.creditCard,
                totalCash.TRQcode,
                totalCash.eBill,
                totalCash.info,
                "", // Placeholder for image
                userName
            ];
            rowToUpdate = worksheet.addRow(newRow);
        }

        const newRowIndex = rowToUpdate.number;

        // Handle image replacement logic
        const imageCell = worksheet.getCell(`G${newRowIndex}`);
        let oldImageUrl: string | undefined;

        if (imageCell.value && typeof imageCell.value === 'object' && 'hyperlink' in imageCell.value) {
            oldImageUrl = (imageCell.value as ExcelJS.CellHyperlinkValue).hyperlink;
        }

        const sharp = require('sharp');

        if (imageBuffer) {
            // Generate a filename based on the date
            const dateFormatted = dateOnly.replace(/\./g, '-');

            // Extract image type from the base64 string
            const match = imageBuffer.match(/^data:image\/(\w+);base64,/);
            let imageType = match ? match[1] : 'png'; // Default to png if type can't be determined

            // Handle both 'jpeg' and 'jpg'
            if (imageType === 'jpeg') {
                imageType = 'jpg'; // Treat 'jpeg' as 'jpg'
            }

            const imageFileName = `${dateFormatted}-Gun_Sonu.${imageType}`;
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

            // Convert base64 to buffer
            const buffer = Buffer.from(imageBuffer.split(',')[1], 'base64');

            // Compress the image using sharp
            await sharp(buffer)
                .toFormat("webp", { quality: 20 }) // Compress image, adjust quality as needed
                .toFile(imageFilePath);

            const imageUrl = `${serverBaseUrl}/uploads/${imageFileName}`;

            // Update the Excel file with the new image link
            imageCell.value = { text: 'Fotoğraf Linki', hyperlink: imageUrl } as ExcelJS.CellHyperlinkValue;
            imageCell.font = { color: { argb: 'FF0000FF' }, underline: true };

            console.log(`Updated image for date: ${date}`);
        }


        // Now move to the first worksheet
        const worksheet1 = workbook.getWorksheet(1);
        if (!worksheet1) {
            throw new Error('Worksheet 1 not found');
        }


        // console.log("Columns Config");
        let columns = {
            'Kalan': 'R',
            'Kredi Kartı': 'S',
        };
        try {
            const res = await axios.get(`${serverBaseUrl}/api/columns?page=EndOfDay`);
            // console.log(res.data);
            columns = res.data.columns;
        } catch (error) {
            console.log('Error getting the EndOfDay columns', error);
        }

        // Define the mapping of categories to their corresponding column in the first worksheet
        const paymentTypeColumnMap: { [key: string]: string } = columns

        // Find the correct row for the date and update 'Kalan' and 'Kredi Kartı' values
        const targetRow = findRowForDate(worksheet1, dateOnly, 2);

        Object.entries(paymentTypeColumnMap).forEach(([key, columnLetter]) => {
            const targetCell = worksheet1.getCell(`${columnLetter}${targetRow}`);
            const value = key === 'Kalan' ? totalCash.remaining : totalCash.creditCard;
            targetCell.value = value;
        });

        // Save the updated workbook back to the file
        await workbook.xlsx.writeFile(filePath);

        return NextResponse.json({ message: 'Total cash and image link successfully updated' }, { status: 200 });
    } catch (error) {
        console.log('Error in PUT function:', error);
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