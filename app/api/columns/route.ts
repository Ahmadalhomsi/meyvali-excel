// pages/api/columns/route.ts

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const columnsFilePath = path.join(process.cwd(), 'public', 'columns.json');

async function readColumnsFile() {
  try {
    const data = await fs.readFile(columnsFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, return an empty object
      return {};
    }
    throw error;
  }
}

async function writeColumnsFile(data: any) {
  await fs.writeFile(columnsFilePath, JSON.stringify(data, null, 2));
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = searchParams.get('page');

  if (!page) {
    return NextResponse.json({ error: 'Page parameter is required' }, { status: 400 });
  }

  try {
    const columns = await readColumnsFile();
    return NextResponse.json({ columns: columns[page] || {} });
  } catch (error) {
    console.log('Error in GET /api/columns:', error);
    return NextResponse.json({ error: 'Error fetching columns' }, { status: 500 });
  }
}


export async function POST(request: NextRequest) {
  const body = await request.json();
  const { page, columnName, columnLetter } = body;

  if (!page || !columnName || !columnLetter) {
    return NextResponse.json({ error: 'Page, columnName, and columnLetter are required' }, { status: 400 });
  }

  try {
    const columns = await readColumnsFile();
    if (!columns[page]) {
      columns[page] = {};
    }
    columns[page][columnName] = columnLetter;
    await writeColumnsFile(columns);
    return NextResponse.json({ message: 'Column added successfully' });
  } catch (error) {
    console.log('Error in POST /api/columns:', error);
    return NextResponse.json({ error: 'Error adding column' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { page, oldColumnName, newColumnName, newColumnLetter } = body;

  if (!page || !oldColumnName || !newColumnName || !newColumnLetter) {
    return NextResponse.json({ error: 'Page, oldColumnName, newColumnName, and newColumnLetter are required' }, { status: 400 });
  }

  try {
    const columns = await readColumnsFile();
    if (!columns[page] || !columns[page][oldColumnName]) {
      return NextResponse.json({ error: 'Column not found' }, { status: 404 });
    }

    delete columns[page][oldColumnName];
    columns[page][newColumnName] = newColumnLetter;

    await writeColumnsFile(columns);
    return NextResponse.json({ message: 'Column updated successfully' });
  } catch (error) {
    console.log('Error in PUT /api/columns:', error);
    return NextResponse.json({ error: 'Error updating column' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const body = await request.json();
  const { page, columnName } = body;

  if (!page || !columnName) {
    return NextResponse.json({ error: 'Page and columnName are required' }, { status: 400 });
  }

  try {
    const columns = await readColumnsFile();
    if (columns[page] && columns[page][columnName]) {
      delete columns[page][columnName];
      await writeColumnsFile(columns);
    }
    return NextResponse.json({ message: 'Column deleted successfully' });
  } catch (error) {
    console.log('Error in DELETE /api/columns:', error);
    return NextResponse.json({ error: 'Error deleting column' }, { status: 500 });
  }
}