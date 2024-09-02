import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';

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

                        // Check if this is the image column and extract the hyperlink
                        if (header === 'Image' && cell.hyperlink) {
                            rowObject['Image'] = cell.hyperlink;
                        }
                    }
                });
                jsonData.push(rowObject);
            }
        });

        console.log('Excel data:', jsonData);


        // Filter the data based on the provided date
        const filteredPayment = jsonData.filter((payment: any) => payment['Tarih'].split(' ')[0] === date);

        console.log('Filtered payment:', filteredPayment);


        return NextResponse.json({ payments: filteredPayment }, { status: 200 });
    } catch (error: any) {
        console.log('Error in GET function:', error);
        return NextResponse.json({ error: 'An error occurred while processing the request', details: error.message }, { status: 500 });
    }
}

import ExcelJS from 'exceljs';
import { serverBaseUrl } from '@/components/serverConfig';


export async function PUT(request: NextRequest) {
    try {
        const data = await request.json();
        const { id, date, billNo, name, paymentType, info, image, userName } = data;
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

        let worksheet = workbook.getWorksheet(4);

        if (!worksheet) {
            worksheet = workbook.addWorksheet('Sheet4');
        }

        // If the worksheet is empty, add the template headers and set column widths
        if (worksheet.actualRowCount === 0) {
            const headers = ['Tarih', 'Fiyat', 'Adisyon No', 'Adisyon Adı', 'Ödeme Türü', 'Ek Bilgi', 'Fotoğraf', 'ID', 'Kullanıcı'];
            worksheet.addRow(headers);

            // Adjust column widths
            worksheet.columns = [

                { width: 15 }, // Tarih
                { width: 8 },  // Fiyat
                { width: 16 }, // Adisyon No
                { width: 12 }, // Adisyon Adı
                { width: 15 }, // Ödeme Türü
                { width: 25 }, // Ek Bilgi
                { width: 15 }, // Fotoğraf
                { width: 5 }, // ID
                { width: 20 }, // Kullanıcı Adı
            ];
        }

        // Find the row with the given ID or add a new row
        let rowToUpdate: ExcelJS.Row | undefined;
        worksheet.eachRow((row, rowNumber) => {
            if (row.getCell(9).value === id) {
                rowToUpdate = row;
            }
        });

        if (rowToUpdate) {
            // Update existing row
            rowToUpdate.getCell(1).value = date;
            rowToUpdate.getCell(2).value = price;
            rowToUpdate.getCell(3).value = billNo;
            rowToUpdate.getCell(4).value = name;
            rowToUpdate.getCell(5).value = paymentType;
            rowToUpdate.getCell(6).value = info;
            rowToUpdate.getCell(9).value = userName;

        } else {
            // Insert new row if ID not found
            const newRow = [date, price, billNo, name, paymentType, info, '', id, userName];
            rowToUpdate = worksheet.addRow(newRow);
        }

        // Handle image update
        if (image && typeof image === 'string' && image.startsWith('data:image/png;base64,')) {
            const uniqueId = id;
            const dateFormatted = dateOnly.replace(/\./g, '-');
            const imageFileName = `${dateFormatted}-${uniqueId}-Odemeler.png`;
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

        // Insert new row if ID not found
        let newPayment: { price: number, paymentType: string } | undefined;
        if (!rowToUpdate) {
            const newRow = [date, price, billNo, name, paymentType, info, '', id, userName];
            rowToUpdate = worksheet.addRow(newRow);
            newPayment = { price, paymentType }; // Store the new payment details
        }

        // Get all payments for the same date, including the new payment
        const allPayments: { price: number, paymentType: string }[] = [];

        if (newPayment) {
            allPayments.push(newPayment); // Add the new payment to the array
        }

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) { // Skip header row
                const rowDate = row.getCell(1).value?.toString().split(' ')[0];
                if (rowDate === dateOnly) {
                    allPayments.push({
                        price: parseFloat(row.getCell(2).value?.toString() || '0'),
                        paymentType: row.getCell(5).value?.toString() || '',
                    });
                }
            }
        });

        // Calculate the sum of payments by paymentType
        const paymentSums: { [key: string]: number } = {};
        allPayments.forEach(payment => {
            if (payment.paymentType in paymentSums) {
                paymentSums[payment.paymentType] += payment.price;
            } else {
                paymentSums[payment.paymentType] = payment.price;
            }
        });

        console.log('All payments:', allPayments);
        console.log('Payment sums:', paymentSums);

        // Now move to the first worksheet
        const worksheet1 = workbook.getWorksheet(1);
        if (!worksheet1) {
            throw new Error('Worksheet 1 not found');
        }

        // Define the mapping of payment types to their corresponding column in the first worksheet
        const paymentTypeColumnMap: { [key: string]: string } = {
            'Havale': 'W',
            'Eski Bakiye': 'X',
            'Veresiye': 'AA',
        };

        console.log('Payment type column map:', paymentTypeColumnMap);

        // Write the sums to the corresponding columns in the first worksheet
        for (const [type, sum] of Object.entries(paymentSums)) {
            console.log(`Processing payment type: ${type}, sum: ${sum}`);
            const columnLetter = paymentTypeColumnMap[type];
            console.log(`Column letter for ${type}: ${columnLetter}`);

            if (columnLetter) {
                console.log(`Updating column ${columnLetter} with sum ${sum} for payment type ${type} on date ${dateOnly}`);

                const targetRow = findRowForDate(worksheet1, dateOnly);
                console.log(`Target row for date ${dateOnly}: ${targetRow}`);

                if (targetRow) {
                    const targetCell = worksheet1.getCell(`${columnLetter}${targetRow}`);
                    // const currentValue = targetCell.value ? Number(targetCell.value) : 0;
                    targetCell.value = sum;
                    console.log(`Updated cell ${columnLetter}${targetRow} with value ${sum}`);
                } else {
                    console.log(`No matching row found for date ${dateOnly}`);
                }
            } else {
                console.warn(`No column mapping found for payment type: ${type}. Skipping this payment type.`);
            }
        }

        // Save the updated workbook back to the file
        await workbook.xlsx.writeFile(filePath);

        return NextResponse.json({ message: 'Payment and image link successfully updated' }, { status: 200 });
    } catch (error) {
        console.error('Error in PUT function:', error);
        return NextResponse.json({ error: 'An error occurred while processing the request' }, { status: 500 });
    }
}

// Function to find the correct row for the given date, starting from a specific row
function findRowForDate(worksheet: ExcelJS.Worksheet, date: string, startRow: number = 2): number {
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


// // Updated function to find the correct row for the given date
// function findRowForDate(worksheet: ExcelJS.Worksheet, date: string): number | null {
//     const dateToFind = date.split(' ')[0]; // Ensure only the date part is used
//     console.log(`Searching for date: ${dateToFind}`);

//     for (let rowIndex = 2; rowIndex <= worksheet.actualRowCount; rowIndex++) {
//         const cellValue = worksheet.getCell(`A${rowIndex}`).value;
//         console.log(`Row ${rowIndex}: ${cellValue}`);
//         if (cellValue === null || cellValue === undefined || cellValue === '') {
//             worksheet.getCell(`A${rowIndex}`).value = date;
//             return rowIndex;

//         } else if(cellValue && cellValue.toString().split(' ')[0] === dateToFind) {
//             console.log(`Found matching date at row ${rowIndex}`);
//             return rowIndex;
//         }
//     }

//     // If the date is not found, find the next empty row
//     const nextEmptyRow = worksheet.actualRowCount + 1;
//     console.log(`Date not found. Adding new date at row ${nextEmptyRow}`);
//     worksheet.getCell(`A${nextEmptyRow}`).value = dateToFind;
//     return nextEmptyRow;
// }


export async function DELETE(request: NextRequest) {
    try {
        const { id, imageOnly } = await request.json();

        if (!id) {
            return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
        }

        const fileName = 'meyvali-excel.xlsx';
        const publicDir = path.join(process.cwd(), 'public');
        const uploadsDir = path.join(publicDir, 'uploads');
        const filePath = path.join(publicDir, fileName);

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);

        let worksheet = workbook.getWorksheet(4);
        let worksheet1 = workbook.getWorksheet(1);

        if (!worksheet || !worksheet1) {
            return NextResponse.json({ error: 'Required worksheets not found' }, { status: 500 });
        }

        let deletedProduct: any = null;
        let rowToDelete: number | null = null;

        // Find the product to delete
        worksheet.eachRow((row, rowNumber) => {
            if (row.getCell(8).value === id) {
                deletedProduct = {
                    date: row.getCell(1).value?.toString().split(' ')[0],
                    price: parseFloat(row.getCell(2).value?.toString() || '0'),
                    billNo: row.getCell(3).value?.toString() || '',
                    name: row.getCell(4).value?.toString() || '',
                    paymentType: row.getCell(5).value?.toString() || '',
                    info: row.getCell(6).value?.toString() || '',
                    image: row.getCell(7).hyperlink,
                    userName: row.getCell(9).value?.toString() || '',


                };
                rowToDelete = rowNumber;
            }
        });

        if (!deletedProduct || rowToDelete === null) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        // If imageOnly is true, only remove the image and its link
        if (imageOnly && typeof deletedProduct.image === 'object' && deletedProduct.image?.hyperlink) {
            const imageUrl = deletedProduct.image.hyperlink;
            const imagePath = imageUrl.replace(serverBaseUrl, '');
            const fullImagePath = path.join(publicDir, imagePath);

            try {
                // Delete the image file
                await fs.unlink(fullImagePath);
                console.log(`Deleted image: ${fullImagePath}`);

                // Clear the cell that contains the image hyperlink
                worksheet.getCell(rowToDelete, 8).value = null;
            } catch (error) {
                console.log(`Failed to delete image: ${fullImagePath}`, error);
                return NextResponse.json({ error: 'Failed to delete the image' }, { status: 500 });
            }
        } else {
            // If not imageOnly, delete the row from worksheet 3
            worksheet.spliceRows(rowToDelete, 1);

            // Define the mapping of payment types to their corresponding column in the first worksheet
            const paymentTypeColumnMap: { [key: string]: string } = {
                'Havale': 'W',
                'Eski Bakiye': 'X',
                'Veresiye': 'AA',
            };

            const columnLetter = paymentTypeColumnMap[deletedProduct.paymentType];
            if (columnLetter) {
                const rowIndex = findRowForDate(worksheet1, deletedProduct.date, 2)


                const cell = worksheet1.getCell(`${columnLetter}${rowIndex}`);
                const currentValue = parseFloat(cell.value?.toString() || '0');
                cell.value = Math.max(0, currentValue - deletedProduct.price); // Ensure the value doesn't go below 0
            }

            // Also delete the associated photo if it exists
            if (typeof deletedProduct.image === 'object' && deletedProduct.image?.hyperlink) {
                const imageUrl = deletedProduct.image.hyperlink;
                const imagePath = imageUrl.replace(serverBaseUrl, '');
                const fullImagePath = path.join(publicDir, imagePath);

                try {
                    await fs.unlink(fullImagePath);
                    console.log(`Deleted image: ${fullImagePath}`);
                } catch (error) {
                    console.log(`Failed to delete image: ${fullImagePath}`, error);
                }
            }
        }

        // Save the updated workbook
        await workbook.xlsx.writeFile(filePath);

        return NextResponse.json({ message: 'Product successfully deleted' }, { status: 200 });
    } catch (error) {
        console.log('Error in DELETE function:', error);
        return NextResponse.json({ error: 'An error occurred while processing the request' }, { status: 500 });
    }
}