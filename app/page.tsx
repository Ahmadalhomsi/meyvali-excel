"use client";

import { useState, ChangeEvent } from 'react';
import {
  Container,
  TextField,
  Button,
  IconButton,
  Autocomplete,
  Box,
  Checkbox,
  FormControlLabel,
  Typography
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/tr'; // Import the Turkish locale
import toast from 'react-hot-toast';

// Define the product type
interface Product {
  id: number;
  category: string | null;
  name: string;
  quantity: number;
  price: number;
  info: string;
  date: string; // Store date as a string in YYYY-MM-DD format
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
    id: 0,
    category: null,
    name: '',
    quantity: 0,
    price: 0,
    info: '',
    date: dayjs().locale('tr').format('DD.MM.YYYY') // Initialize date in Turkish format
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [productIdCounter, setProductIdCounter] = useState<number>(1);
  const [useToday, setUseToday] = useState<boolean>(true); // Checkbox state

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
      toast.success('Ürün başarıyla güncellendi!');
    } else {
      setProducts([...products, { ...currentProduct, id: productIdCounter }]);
      setProductIdCounter(productIdCounter + 1);
      toast.success('Ürün başarıyla eklendi!');
    }
    setCurrentProduct({
      id: 0,
      category: null,
      name: '',
      quantity: 0,
      price: 0,
      info: '',
      date: dayjs().locale('tr').format('DD.MM.YYYY'), // Reset to today's date
    });
    setUseToday(true); // Reset checkbox to true after adding the product
  };

  const handleEditProduct = (id: number) => {
    const index = products.findIndex(product => product.id === id);
    setCurrentProduct(products[index]);
    setEditingIndex(index);
    setUseToday(products[index].date === dayjs().locale('tr').format('DD.MM.YYYY')); // Determine if the date is today
  };

  const handleDeleteProduct = (id: number) => {
    const updatedProducts = products.filter((product) => product.id !== id);
    setProducts(updatedProducts);
  };

  const handleCheckboxChange = () => {
    setUseToday(!useToday);
    if (!useToday) {
      setCurrentProduct({ ...currentProduct, date: dayjs().locale('tr').format('DD.MM.YYYY') });
    }
  };

  const handleDateChange = (newValue: dayjs.Dayjs | null) => {
    setCurrentProduct({
      ...currentProduct,
      date: newValue ? newValue.format('DD.MM.YYYY') : ''
    });
  };

  const calculateTotalPrice = () => {
    return products.reduce((total, product) => total + parseFloat(product.price.toString()), 0);
  };

  const columns: GridColDef[] = [
    { field: 'category', headerName: 'Category', width: 150 },
    { field: 'name', headerName: 'Product Name', width: 200 },
    { field: 'quantity', headerName: 'Quantity', width: 80, type: 'number'},
    { field: 'price', headerName: 'Price', width: 80, type: 'number'},
    { field: 'info', headerName: 'Info', width: 300 },
    { field: 'date', headerName: 'Date', width: 100 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 80,
      renderCell: (params) => (
        <Box>
          <IconButton
            color="primary"
            onClick={() => handleEditProduct(params.row.id)}
          >
            <Edit />
          </IconButton>
          <IconButton
            color="secondary"
            onClick={() => handleDeleteProduct(params.row.id)}
          >
            <Delete />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Container>
      <h1>Add Product</h1>
      <form noValidate autoComplete="off">
        <Autocomplete
          options={categories}
          getOptionLabel={(option) => option}
          value={currentProduct.category}
          onChange={(_, newValue) => setCurrentProduct({ ...currentProduct, category: newValue || '' })}
          isOptionEqualToValue={(option, value) => option === value}
          renderInput={(params) => (
            <TextField {...params} label="Category" />
          )}
          sx={{ width: '25%', display: 'inline-block' }} // Added display: inline-block
        />

        <TextField
          label="Product Name"
          name="name"
          value={currentProduct.name}
          onChange={handleInputChange}
          sx={{ width: '25%', marginLeft: '15px' }}
        />
        <br />

        <TextField
          label="Adet/Kg"
          name="quantity"
          type="number"
          value={currentProduct.quantity}
          onChange={handleInputChange}
          sx={{ width: '10%', marginTop: '15px' }}
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
        <h4 style={{ display: 'inline-block', marginLeft: '10px', marginTop: '30px' }}>TL</h4>
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

        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="tr">
          <DatePicker
            label="Tarih"
            views={['year', 'month', 'day']}
            defaultValue={dayjs().locale('tr')}
            onChange={handleDateChange}
            disabled={useToday}
            sx={{ width: '20%', marginTop: '10px' }}
          />
        </LocalizationProvider>

        <FormControlLabel
          control={
            <Checkbox
              checked={useToday}
              onChange={handleCheckboxChange}
              name="useToday"
              color="primary"
            />
          }
          label="Bugün"
          sx={{ marginTop: '15px', marginLeft: '5px' }}
        />
        <br />

        <Button
          variant="contained"
          color="primary"
          onClick={handleAddProduct}
          style={{ marginTop: '20px' }}
        >
          Ürün {editingIndex !== null ? 'Güncelle' : 'Ekle'}
        </Button>
      </form>

      <Typography variant="h6" fontWeight="bold" style={{ padding: 5 }}>
        Bugünkü eklenen ürünler:
      </Typography>

      <Box sx={{ height: 300, width: '90%' }}>
        <DataGrid
          rows={products}
          columns={columns}
          getRowId={(row) => row.id}
          hideFooter
        />
      </Box>

      <Typography variant="h6" fontWeight="bold" style={{ padding: 5, marginTop: '20px' }}>
        Toplam Fiyat: {calculateTotalPrice()} TL
      </Typography>
    </Container>
  );
}
