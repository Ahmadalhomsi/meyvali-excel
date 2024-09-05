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