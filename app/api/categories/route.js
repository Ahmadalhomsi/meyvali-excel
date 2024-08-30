import fs from 'fs';
import path from 'path';


const categoriesFilePath = path.join(process.cwd(), 'public', 'categories.txt');

export async function GET(req, res) {
    try {
        const categories = fs.readFileSync(categoriesFilePath, 'utf-8').split('\n').filter(Boolean);
        return Response.json({ categories });
    } catch (error) {
        console.error('Error reading categories:', error);
        return Response.error({ error: 'Failed to read categories' });
    }
}


export async function POST(req, res) {
    try {
        const { category } = await req.json();
        console.log('category:', category);
        
        fs.appendFileSync(categoriesFilePath, category + '\n');
        return Response.json({ message: 'Category added successfully' });
    }
    catch (error) {
        console.error('Error adding category:', error);
        return Response.error({ error: 'Failed to add category' });
    }
}

export async function DELETE(req, res) {
    try {
        const { category } = await req.json();
        let categories = fs.readFileSync(categoriesFilePath, 'utf-8').split('\n').filter(Boolean);
        categories = categories.filter(c => c !== category);
        fs.writeFileSync(categoriesFilePath, categories.join('\n') + '\n');
        return Response.json({ message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Error deleting category:', error);
        return Response.error({ error: 'Failed to delete category'});
    }
}








// export default function handler(req, res) {
//     if (req.method === 'GET') {
//         try {
//             const categories = fs.readFileSync(categoriesFilePath, 'utf-8').split('\n').filter(Boolean);
//             res.status(200).json({ categories });
//         } catch (error) {
//             console.error('Error reading categories:', error);
//             res.status(500).json({ error: 'Failed to read categories' });
//         }
//     } else if (req.method === 'POST') {
//         try {
//             const { category } = req.body;
//             fs.appendFileSync(categoriesFilePath, category + '\n');
//             res.status(200).json({ message: 'Category added successfully' });
//         } catch (error) {
//             console.error('Error adding category:', error);
//             res.status(500).json({ error: 'Failed to add category' });
//         }
//     } else if (req.method === 'DELETE') {
//         try {
//             const { category } = req.body;
//             let categories = fs.readFileSync(categoriesFilePath, 'utf-8').split('\n').filter(Boolean);
//             categories = categories.filter(c => c !== category);
//             fs.writeFileSync(categoriesFilePath, categories.join('\n') + '\n');
//             res.status(200).json({ message: 'Category deleted successfully' });
//         } catch (error) {
//             console.error('Error deleting category:', error);
//             res.status(500).json({ error: 'Failed to delete category' });
//         }
//     } else {
//         res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
//         res.status(405).end(`Method ${req.method} Not Allowed`);
//     }
// }