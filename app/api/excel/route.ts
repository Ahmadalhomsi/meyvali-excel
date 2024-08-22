// import express from 'express';
// import path from 'path';
// import xlsx from 'xlsx';

// const app = express();
// const publicFolderPath = path.join(__dirname, 'public');

// app.use(express.json());

// app.post('/api/excel', (req, res) => {
//     // Get the data from the request body
//     const { data } = req.body;

//     // Load the Excel file
//     const workbook = xlsx.readFile(path.join(publicFolderPath, 'data.xlsx'));

//     // Select the first sheet
//     const sheetName = workbook.SheetNames[0];
//     const sheet = workbook.Sheets[sheetName];

//     // Find the next available row
//     const range = xlsx.utils.decode_range(sheet['!ref']);
//     const nextRow = range.e.r + 1;

//     // Write the data to the next available row
//     Object.keys(data).forEach((key, index) => {
//         const cell = xlsx.utils.encode_cell({ r: nextRow, c: index });
//         sheet[cell] = { t: 's', v: data[key] };
//     });

//     // Save the changes to the Excel file
//     xlsx.writeFile(workbook, path.join(publicFolderPath, 'data.xlsx'));

//     res.sendStatus(200);
// });

// app.listen(3000, () => {
//     console.log('Server is running on port 3000');
// });


import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs/promises';

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
        } catch (error) {
            // If file doesn't exist or can't be read, create a new workbook
            workbook = XLSX.utils.book_new();
            worksheet = XLSX.utils.aoa_to_sheet([['Katagori', 'Ürün Adı', 'Adet/Kg', 'Fiyat', 'Ödeme Türü', 'Ek Bilgi', 'Tarih']]);
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
        }

        // Get the current number of rows in the worksheet
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
        let rowIndex = range.e.r + 1;

        // Add new products to the worksheet
        products.forEach((product: any) => {
            const row = [
                product.category,
                product.name,
                product.quantity,
                product.price,
                product.paymentType,
                product.info,
                product.date
            ];
            XLSX.utils.sheet_add_aoa(worksheet, [row], { origin: rowIndex++ });
        });

        // Write the workbook to a file
        const fileBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        await fs.writeFile(filePath, fileBuffer);

        return NextResponse.json({ message: 'Products successfully added to Excel file' }, { status: 200 });
    } catch (error : any) {
        console.error('Error in POST function:', error);
        return NextResponse.json({ error: 'An error occurred while processing the request', details: error.message }, { status: 500 });
    }
}




// Post endpoint to type the data on the excel file that located in the public folder