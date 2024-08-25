
import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs/promises';

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
        const fileBuffer = await fs.readFile(filePath);
        const workbook = XLSX.read(fileBuffer);

        // Get the third sheet (index 2)
        const worksheet = workbook.Sheets[workbook.SheetNames[2]];

        // Convert the worksheet to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Filter the data based on the provided date
        const filteredProducts = jsonData.filter((product: any) => product['Tarih'] === date);

        return NextResponse.json({ products: filteredProducts }, { status: 200 });
    } catch (error: any) {
        console.error('Error in GET function:', error);
        return NextResponse.json({ error: 'An error occurred while processing the request', details: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const products = data.products;

        // Define the file path
        const fileName = 'temmuz 2024 dene.xlsx';
        const publicDir = path.join(process.cwd(), 'public');
        const filePath = path.join(publicDir, fileName);

        // Ensure the public directory exists
        await fs.mkdir(publicDir, { recursive: true });

        let workbook: XLSX.WorkBook;
        let worksheet: XLSX.WorkSheet;

        try {
            // Try to read the existing file
            const fileBuffer = await fs.readFile(filePath);
            workbook = XLSX.read(fileBuffer);
            worksheet = workbook.Sheets[workbook.SheetNames[2]];

        } catch (error: any) {
            console.log('Error reading file:', error);
            return NextResponse.json({ error: 'An error occurred while reading the file', details: error.message }, { status: 500 });

            // If file doesn't exist or can't be read, create a new workbook
            // workbook = XLSX.utils.book_new();
            // worksheet = XLSX.utils.aoa_to_sheet([['Katagori', 'Ürün Adı', 'Adet/Kg', 'Fiyat', 'Ödeme Türü', 'Ek Bilgi', 'Tarih']]);
            // XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
        }

        // Get the current number of rows in the worksheet
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
        let rowIndex = range.e.r + 1;

        // Add new products to the worksheet
        products.forEach((product: any) => {
            const row = [
                product.date,
                product.category,
                product.name,
                product.quantity,
                product.price,
                product.paymentType,
                product.info,
            ];
            XLSX.utils.sheet_add_aoa(worksheet, [row], { origin: rowIndex++ });
        });

        // Write the workbook to a file
        const fileBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        await fs.writeFile(filePath, fileBuffer);

        return NextResponse.json({ message: 'Products successfully added to Excel file' }, { status: 200 });
    } catch (error: any) {
        console.error('Error in POST function:', error);
        return NextResponse.json({ error: 'An error occurred while processing the request', details: error.message }, { status: 500 });
    }
}



import ExcelJS from 'exceljs';
import sharp from 'sharp';

export async function PUT(request: NextRequest) {
    try {
        const { date, products, totalPrice, imageBuffer } = await request.json();



        // Define the file path
        const fileName = 'temmuz 2024 dene.xlsx';
        const publicDir = path.join(process.cwd(), 'public');
        const filePath = path.join(publicDir, fileName);

        // Read the Excel file using ExcelJS
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);

        // Get the third sheet (index 2)
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
            }
            else {
                rowToDelete++;
            }

        }

        console.log(products);
        // Add the new products
        products.forEach((product: any) => {
            // Check the structure of each product
            console.log('Adding product:', product);

            // Ensure the product is added as an array
            const productRow = Array.isArray(product) ? product : Object.values(product);

            // Add the row to the worksheet
            worksheet.addRow(productRow);
        });

        // Find the row index where the first new product was added
        const firstProductRowIndex = worksheet.actualRowCount - products.length + 1;

        // Process and add the image if provided
        if (imageBuffer) {
            const buffer = Buffer.from(imageBuffer.split(',')[1], 'base64');

            // Use sharp to get image dimensions and resize while maintaining aspect ratio
            const image = sharp(buffer);
            const metadata = await image.metadata();

            // Define a maximum size for the image (optional)
            const maxWidth = 1920;
            const maxHeight = 1080;

            let { width, height } = metadata;

            if (width && height) {
                if (width > maxWidth || height > maxHeight) {
                    const aspectRatio = width / height;

                    if (width > height) {
                        width = maxWidth;
                        height = Math.round(width / aspectRatio);
                    } else {
                        height = maxHeight;
                        width = Math.round(height * aspectRatio);
                    }
                }
            }

            // Resize the image using sharp
            const resizedBuffer = await image.resize(width, height).toBuffer();

            // Add the image to the workbook
            const imageId = workbook.addImage({
                buffer: resizedBuffer,
                extension: 'png', // Change to 'jpeg' if necessary
            });

            // Place the image in the 7th column ("G") of the same row as the first new product
            worksheet.addImage(imageId, {
                tl: { col: 7, row: firstProductRowIndex - 1 }, // Column "G" (7th column, index 6) and the correct row
                ext: { width: width!, height: height! }, // Set the image dimensions
                editAs: 'oneCell', // Place the image inside the cell
            });
        }

        // Save the updated workbook back to the file
        await workbook.xlsx.writeFile(filePath);

        return NextResponse.json({ message: 'Products and image successfully updated' }, { status: 200 });
    } catch (error) {
        console.error('Error in PUT function:', error);
        return NextResponse.json({ error: 'An error occurred while processing the request' }, { status: 500 });
    }
}



// Post endpoint to type the data on the excel file that located in the public folder