import fs from 'fs';
import { NextResponse } from 'next/server';
import path from 'path';

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const filter = searchParams.get('filter') || '';
    
    const directory = path.join(process.cwd(), 'public', 'uploads');

    try {
        // Use fs.promises for better performance
        const files = await fs.promises.readdir(directory);
        
        // Filter images with case-insensitive search
        let images = files.filter(file => {
            const isImage = /\.(jpg|jpeg|png|gif|webp|avif)$/i.test(file);
            const matchesFilter = filter ? file.toLowerCase().includes(filter.toLowerCase()) : true;
            return isImage && matchesFilter;
        });
        
        // Sort by modification time (newest first) for better UX
        const imageStats = await Promise.all(
            images.map(async (image) => {
                try {
                    const stat = await fs.promises.stat(path.join(directory, image));
                    return { name: image, mtime: stat.mtime };
                } catch (err) {
                    console.log(`Error getting stats for ${image}:`, err);
                    return { name: image, mtime: new Date(0) };
                }
            })
        );
        
        // Sort by modification time (newest first)
        imageStats.sort((a, b) => b.mtime - a.mtime);
        images = imageStats.map(item => item.name);
        
        // Calculate pagination
        const totalImages = images.length;
        const totalPages = Math.ceil(totalImages / limit);
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedImages = images.slice(startIndex, endIndex);

        console.log(`Images API: Found ${totalImages} images, returning page ${page}/${totalPages}`);

        return NextResponse.json({ 
            images: paginatedImages,
            pagination: {
                page,
                limit,
                total: totalImages,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        });
    } catch (err) {
        console.log('Error reading directory:', err);
        return NextResponse.json({ error: 'Failed to read directory' }, { status: 500 });
    }
}


export async function POST(req) { // For image deletion
    try {
        const body = await req.json(); // Parse the JSON body
        const { images } = body;

        if (!images || !Array.isArray(images)) {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }

        const directory = path.join(process.cwd(), 'public', 'uploads');

        // Use Promise.allSettled for better error handling
        const deletePromises = images.map(async (image) => {
            try {
                const filePath = path.join(directory, image);
                await fs.promises.unlink(filePath);
                return { image, success: true };
            } catch (err) {
                console.log(`Error deleting file ${image}:`, err);
                return { image, success: false, error: err.message };
            }
        });

        const results = await Promise.allSettled(deletePromises);
        const deletedImages = [];
        const failedImages = [];

        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                if (result.value.success) {
                    deletedImages.push(result.value.image);
                } else {
                    failedImages.push({ image: result.value.image, error: result.value.error });
                }
            } else {
                failedImages.push({ image: images[index], error: result.reason });
            }
        });

        console.log(`Deleted ${deletedImages.length} images, failed to delete ${failedImages.length} images`);

        if (failedImages.length > 0) {
            return NextResponse.json({ 
                message: `Deleted ${deletedImages.length} images successfully`,
                deletedImages,
                failedImages,
                warning: 'Some images could not be deleted'
            }, { status: 207 }); // 207 Multi-Status
        }

        return NextResponse.json({ 
            message: 'All selected images deleted successfully',
            deletedImages 
        });
    } catch (error) {
        console.log('Error deleting images:', error);
        return NextResponse.json({ error: 'Failed to delete images' }, { status: 500 });
    }
}