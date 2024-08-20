"use client"

// pages/product.tsx
import { useState, ChangeEvent } from 'react';
import {
  Container,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Autocomplete
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';

// Define the product type
interface Product {
  category: string;
  name: string;
  price: string;
  info: string;
}

const categories = [
  'SUT',
  'ET-DANA',
  'ET-KUZU',
  'BEYAZ-ET',
  'EKMEK',
  'MARKET PAZAR RAMİ',
  'PACA',
  'İSKEMBE',
  'ambalaj malzemesi',
  'SU-SİSE',
  'MESRUBAT',
  'TUP',
  'mazot',
  'Ekstra Eleman',
];

export default function ProductPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [currentProduct, setCurrentProduct] = useState<Product>({
    category: '',
    name: '',
    price: '',
    info: '',
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setCurrentProduct({
      ...currentProduct,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddProduct = () => {
    if (editingIndex !== null) {
      const updatedProducts = products.map((product, index) =>
        index === editingIndex ? currentProduct : product
      );
      setProducts(updatedProducts);
      setEditingIndex(null);
    } else {
      setProducts([...products, currentProduct]);
    }
    setCurrentProduct({ category: '', name: '', price: '', info: '' });
  };

  const handleEditProduct = (index: number) => {
    setCurrentProduct(products[index]);
    setEditingIndex(index);
  };

  const handleDeleteProduct = (index: number) => {
    const updatedProducts = products.filter((_, i) => i !== index);
    setProducts(updatedProducts);
  };

  return (
    <Container>
      <h1>Add Product</h1>
      <form noValidate autoComplete="off">
        <Autocomplete
          options={categories}
          getOptionLabel={(option) => option}
          value={currentProduct.category}
          onChange={(_, newValue) => setCurrentProduct({ ...currentProduct, category: newValue || '' })}
          renderInput={(params) => (
            <TextField {...params} label="Category" />
          )}
          sx={{ width: '30%' }}
        />

        <TextField
          label="Product Name"
          name="name"
          value={currentProduct.name}
          onChange={handleInputChange}
          sx={{ width: '30%', marginTop: '15px' }}
        />
        <br />
        <TextField
          label="Price"
          name="price"
          type="number"
          value={currentProduct.price}
          onChange={handleInputChange}

          sx={{ width: '10%', marginTop: '15px' }}
        />
        <br />
        <TextField
          label="Info"
          name="info"
          value={currentProduct.info}
          onChange={handleInputChange}
          margin="normal"
          sx={{ width: '30%' }}
        />
        <br />
        <Button
          variant="contained"
          color="primary"
          onClick={handleAddProduct}
          style={{ marginTop: '20px' }}
        >
          {editingIndex !== null ? 'Update' : 'Add'} Product
        </Button>
      </form>

      <h2 style={{ marginTop: '40px' }}>Product List</h2>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Category</TableCell>
              <TableCell>Product Name</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Info</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((product, index) => (
              <TableRow key={index}>
                <TableCell>{product.category}</TableCell>
                <TableCell>{product.name}</TableCell>
                <TableCell>{product.price}</TableCell>
                <TableCell>{product.info}</TableCell>
                <TableCell>
                  <IconButton
                    color="primary"
                    onClick={() => handleEditProduct(index)}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    color="secondary"
                    onClick={() => handleDeleteProduct(index)}
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}
