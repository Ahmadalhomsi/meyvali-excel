import fs from 'fs';
import { NextResponse } from 'next/server';
import path from 'path';



export async function GET(req) {
    const directory = path.join(process.cwd(), 'public', 'uploads');

    try {
        const files = await new Promise((resolve, reject) => {
            fs.readdir(directory, (err, files) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(files);
                }
            });
        });

        const images = files.filter(file =>
            /\.(jpg|jpeg|png|gif)$/i.test(file)
        );

        console.log('imagesX:', images);

        return NextResponse.json({ images });
    } catch (err) {
        console.log('Error reading directory:', err);
        return NextResponse.json({ error: 'Failed to read directory' }, { status: 500 });
    }
}


export async function POST(req) { // For image deleteion
    try {
        const body = await req.json(); // Parse the JSON body
        const { images } = body;

        if (!images || !Array.isArray(images)) {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }

        const directory = path.join(process.cwd(), 'public', 'uploads');

        const deletePromises = images.map(image => {
            return new Promise((resolve, reject) => {
                const filePath = path.join(directory, image);
                fs.unlink(filePath, (err) => {
                    if (err) {
                        console.log(`Error deleting file ${image}:`, err);
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        });

        await Promise.all(deletePromises);

        return NextResponse.json({ message: 'Selected images deleted successfully' });
    } catch (error) {
        console.log('Error deleting images:', error);
        return NextResponse.json({ error: 'Failed to delete some images' }, { status: 500 });
    }
}