import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';



export async function GET() {
    const filePath = path.join(process.cwd(), 'public', 'meyvali-excel.xlsx');

    try {
        const fileStream = fs.createReadStream(filePath);
        const headers = new Headers();
        headers.set('Content-Disposition', 'attachment; filename=meyvali-excel.xlsx');
        headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        return new NextResponse(fileStream, { headers });
    } catch (error) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
}

import { writeFile, readFile, unlink } from 'fs/promises';
import os from 'os';

export async function POST(req) {
    try {
        const formData = await req.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Save to temp file first
        const tempPath = path.join(os.tmpdir(), 'temp_excel_file.xlsx');
        await writeFile(tempPath, buffer);

        // Define the final path
        const finalPath = path.join(process.cwd(), 'public', 'meyvali-excel.xlsx');

        // Read from temp file
        const fileContent = await readFile(tempPath);

        // Write to final location
        await writeFile(finalPath, fileContent);

        // Delete the temp file
        await unlink(tempPath);

        return NextResponse.json({ message: 'File uploaded successfully' }, { status: 200 });
    } catch (error) {
        console.log('Error uploading file:', error);
        return NextResponse.json({ error: 'Error uploading file' }, { status: 500 });
    }
}

import ExcelJS from 'exceljs';
import dayjs from 'dayjs';

export async function PUT(request) {
    try {
        const { date } = await request.json();
        const selectedDate = dayjs(date);

        const filePath = path.join(process.cwd(), 'public', 'meyvali-excel.xlsx');
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);

        const worksheet = workbook.getWorksheet(1);
        const daysInMonth = selectedDate.daysInMonth();

        // Function to update dates in a range of rows
        const updateDatesInRange = (startRow, endRow) => {
            for (let i = startRow; i <= endRow && (i - startRow + 1) <= daysInMonth; i++) {
                const cellDate = selectedDate.date(i - startRow + 1);
                worksheet.getCell(`A${i}`).value = cellDate.format('DD.MM.YYYY');
            }
            // Clear any remaining cells if the month ends before the last row
            for (let i = startRow + daysInMonth; i <= endRow; i++) {
                worksheet.getCell(`A${i}`).value = null;
            }
        };

        // Update rows 2-32
        updateDatesInRange(2, 32);

        // Update rows 34-44
        updateDatesInRange(34, 64);

        await workbook.xlsx.writeFile(filePath);

        return NextResponse.json({ message: 'Dates updated successfully' }, { status: 200 });
    } catch (error) {
        console.error('Error updating Excel file:', error);
        return NextResponse.json({ error: 'Failed to update dates' }, { status: 500 });
    }
}