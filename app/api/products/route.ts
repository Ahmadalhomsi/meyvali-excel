
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
        const { id, category, name, paymentType, info, date, image, userName } = data;
        const quantity = parseFloat(data.quantity);
        const price = parseFloat(data.price);

        console.log('PUT request received with the following data:', data);

        console.log("UUSSSSER NAME", userName);


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
            const headers = ['Tarih', 'Katagori', 'Ürün Adı', 'Adet/Kg', 'Fiyat', 'Ödeme Türü', 'Ek Bilgi', 'Fotoğraf', 'ID', 'Kullanıcı'];
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
                { width: 5 }, // ID (increased width for UUID)
                { width: 20 } // Kullanıcı
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
            rowToUpdate.getCell(2).value = category;
            rowToUpdate.getCell(3).value = name;
            rowToUpdate.getCell(4).value = quantity;
            rowToUpdate.getCell(5).value = price;
            rowToUpdate.getCell(6).value = paymentType;
            rowToUpdate.getCell(7).value = info;
            rowToUpdate.getCell(10).value = userName;
        } else {
            // Insert new row if ID not found
            const newRow = [date, category, name, quantity, price, paymentType, info, , id, userName];
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

        // Get all products for the same date
        const allProducts: any[] = [];
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) { // Skip header row
                const rowDate = row.getCell(1).value?.toString().split(' ')[0];
                if (rowDate === dateOnly) {
                    allProducts.push({
                        category: row.getCell(2).value?.toString(),
                        price: parseFloat(row.getCell(5).value?.toString() || '0'),
                        paymentType: row.getCell(6).value?.toString()
                    });
                }
            }
        });

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

        // Sum products by category and payment type
        const summedProducts: { [key: string]: { nakit: number, other: number } } = {};
        allProducts.forEach(product => {
            if (!summedProducts[product.category]) {
                summedProducts[product.category] = { nakit: 0, other: 0 };
            }
            if (product.paymentType === 'Nakit') {
                summedProducts[product.category].nakit += product.price;
            } else {
                summedProducts[product.category].other += product.price;
            }
        });

        // Update worksheet1 with summed values
        Object.entries(summedProducts).forEach(([category, sums]) => {
            const columnLetter = categoryColumnMap[category];
            if (columnLetter) {
                const nakitRow = findRowForDate(worksheet1, dateOnly, 2);
                const otherRow = findRowForDate(worksheet1, dateOnly, 34);

                worksheet1.getCell(`${columnLetter}${nakitRow}`).value = sums.nakit;
                worksheet1.getCell(`${columnLetter}${otherRow}`).value = sums.other;
            }
        });

        // Save the updated workbook back to the file
        await workbook.xlsx.writeFile(filePath);

        return NextResponse.json({ message: 'Product and summary successfully updated', id: id || uuidv4() }, { status: 200 });
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

        let worksheet = workbook.getWorksheet(3);
        let worksheet1 = workbook.getWorksheet(1);

        if (!worksheet || !worksheet1) {
            return NextResponse.json({ error: 'Required worksheets not found' }, { status: 500 });
        }

        let deletedProduct: any = null;
        let rowToDelete: number | null = null;

        // Find the product to delete
        worksheet.eachRow((row, rowNumber) => {
            if (row.getCell(9).value === id) {
                deletedProduct = {
                    date: row.getCell(1).value?.toString().split(' ')[0],
                    category: row.getCell(2).value?.toString(),
                    price: parseFloat(row.getCell(5).value?.toString() || '0'),
                    paymentType: row.getCell(6).value?.toString(),
                    image: row.getCell(8).value
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

            // Update the sum in worksheet 1
            const categoryColumnMap: { [key: string]: string } = {
                'SÜT': 'C', 'ET-DANA': 'D', 'ET-KUZU': 'E', 'BEYAZ-ET': 'F',
                'EKMEK': 'G', 'MARKET PAZAR RAMİ': 'H', 'PAÇA': 'I', 'İŞKEMBE': 'J',
                'AMBALAJ MALZEMESİ': 'K', 'SU-ŞİŞE': 'L', 'MEŞRUBAT': 'M', 'TÜP': 'N',
                'MAZOT': 'O', 'EKSTRA ELEMAN': 'P'
            };

            const columnLetter = categoryColumnMap[deletedProduct.category];
            if (columnLetter) {
                const rowIndex = deletedProduct.paymentType === 'Nakit'
                    ? findRowForDate(worksheet1, deletedProduct.date, 2)
                    : findRowForDate(worksheet1, deletedProduct.date, 34);

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
