// utils/columnManagement.js
import fs from 'fs/promises';
import path from 'path';

const columnsFilePath = path.join(process.cwd(), 'data', 'columns.json');

async function readColumnsFile() {
  try {
    const data = await fs.readFile(columnsFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, return an empty object
      return {};
    }
    throw error;
  }
}

async function writeColumnsFile(data) {
  await fs.writeFile(columnsFilePath, JSON.stringify(data, null, 2));
}

export async function getColumns(page) {
  const columns = await readColumnsFile();
  return columns[page] || {};
}

export async function addColumn(page, columnName, columnLetter) {
  const columns = await readColumnsFile();
  if (!columns[page]) {
    columns[page] = {};
  }
  columns[page][columnName] = columnLetter;
  await writeColumnsFile(columns);
}

export async function deleteColumn(page, columnName) {
  const columns = await readColumnsFile();
  if (columns[page] && columns[page][columnName]) {
    delete columns[page][columnName];
    await writeColumnsFile(columns);
  }
}