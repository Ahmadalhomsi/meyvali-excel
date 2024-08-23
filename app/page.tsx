"use client";

import { useState, ChangeEvent, useEffect } from 'react';
import {
  Container,
  TextField,
  Button,
  IconButton,
  Autocomplete,
  Box,
  Checkbox,
  FormControlLabel,
  Typography,
  Divider,
  CircularProgress,
  Grid,
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/tr'; // Import the Turkish locale
import toast from 'react-hot-toast';
import axios from 'axios';

// Define the product type
interface Product {
  id: number;
  category: string | null;
  name: string;
  quantity: number;
  price: number;
  paymentType: string | null;
  info: string;
  date: string; // Store date as a string in YYYY-MM-DD format
}

const categories = [
  'SÜT',
  'ET-DANA',
  'ET-KUZU',
  'BEYAZ-ET',
  'EKMEK',
  'MARKET PAZAR RAMİ',
  'PAÇA',
  'İŞKEMBE',
  'AMBALAJ MALZEMESİ',
  'SU-ŞİŞE',
  'MEŞRUBAT',
  'TÜP',
  'MAZOT',
  'EKSTRA ELEMAN',
];

const paymentTypes = [
  'Nakit',
  'Kredi Kartı',
  'Havale',
];

export default function ProductPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [currentProduct, setCurrentProduct] = useState<Product>({
    id: 0,
    category: null,
    name: '',
    quantity: 0,
    price: 0,
    paymentType: null,
    info: '',
    date: dayjs().locale('tr').format('DD.MM.YYYY') // Initialize date in Turkish format
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [productIdCounter, setProductIdCounter] = useState<number>(1);
  const [useToday, setUseToday] = useState<boolean>(true); // Checkbox state

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTodayProducts();
  }, []);

  const fetchTodayProducts = async () => {
    const today = dayjs().format('DD.MM.YYYY');
    setIsLoading(true);
    try {
      const response = await axios.get(`/api/excel?date=${today}`);
      if (response.status === 200) {
        const productsWithIds = response.data.products.map((product: any, index: number) => ({
          id: index + 1,  // or however the ID should be generated
          category: product['Katagori'],
          name: product['Ürün Adı'],
          quantity: parseFloat(product['Adet/Kg']),
          price: parseFloat(product['Fiyat']),
          paymentType: product['Ödeme Türü'],
          info: product['Ek Bilgi'],
          date: product['Tarih']
        }));
        setProducts(productsWithIds);

        // Update the productIdCounter to avoid ID conflicts
        const maxId = Math.max(...productsWithIds.map((product: { id: any; }) => product.id), 0);
        setProductIdCounter(maxId + 1);
      }
    } catch (error) {
      console.error('Error fetching today\'s products:', error);
      toast.error('Günün ürünleri alınırken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setCurrentProduct({
      ...currentProduct,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddProduct = () => {
    if (editingIndex !== null) { // Updating
      const updatedProducts = products.map((product, index) =>
        index === editingIndex ? { ...currentProduct, id: products[editingIndex].id } : product
      );
      setProducts(updatedProducts);
      setEditingIndex(null);
      toast.success('Ürün başarıyla güncellendi!');
    } else { // Adding
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
      paymentType: null,
      info: '',
      date: dayjs().locale('tr').format('DD.MM.YYYY'), // Reset to today's date
    });
    // setUseToday(true); // Reset checkbox to true after adding the product
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
    toast.success('Ürün başarıyla silindi!');
  };

  const handleCheckboxChange = () => {
    setUseToday(!useToday);
    if (!useToday) {
      setCurrentProduct({ ...currentProduct, date: dayjs().locale('tr').format('DD.MM.YYYY') }); // Set to today's date
    }
  };

  const handleDateChange = (newValue: dayjs.Dayjs | null) => {
    setCurrentProduct({
      ...currentProduct,
      date: newValue ? newValue.format('DD.MM.YYYY') : ''
    });
  };

  const calculateTotalPrice = () => {
    return products.reduce((total, product) => total + parseFloat(product.price + ""), 0);
  };


  const updateProducts = async () => {
    const today = dayjs().format('DD.MM.YYYY');
    setIsLoading(true);
    try {
      const response = await axios.put('/api/excel', {
        date: today,
        products: products.map(p => ({
          Tarih: p.date,
          Katagori: p.category,
          'Ürün Adı': p.name,
          'Adet/Kg': p.quantity.toString(),
          Fiyat: p.price.toString(),
          'Ödeme Türü': p.paymentType,
          'Ek Bilgi': p.info
        }))
      });
      if (response.status === 200) {
        toast.success('Ürünler başarıyla güncellendi!');
      }
    } catch (error) {
      console.error('Error updating products:', error);
      toast.error('Ürünler güncellenirken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const columns: GridColDef[] = [
    // { field: 'id', headerName: 'ID', width: 2 },
    { field: 'category', headerName: 'Katagori', width: 150 },
    { field: 'name', headerName: 'Ürün Adı', width: 180 },
    { field: 'quantity', headerName: 'Adet/Kg', width: 80, type: 'number' },
    { field: 'price', headerName: 'Fiyat', width: 80, type: 'number' },
    { field: 'paymentType', headerName: 'Ödeme Türü', width: 100 },
    { field: 'info', headerName: 'Ek Bilgi', width: 250 },
    { field: 'date', headerName: 'Tarih', width: 100 },
    {
      field: 'actions',
      headerName: 'İşlemler',
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
      <Typography variant="h4" gutterBottom>Ürün Ekleme</Typography>
      <form noValidate autoComplete="off">
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={2.6}>
            <Autocomplete
              options={categories}
              getOptionLabel={(option) => option}
              value={currentProduct.category}
              onChange={(_, newValue) => setCurrentProduct({ ...currentProduct, category: newValue || '' })}
              isOptionEqualToValue={(option, value) => option === value}
              renderInput={(params) => (
                <TextField {...params} label="Katagori" fullWidth />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Ürün Adı"
              name="name"
              value={currentProduct.name}
              onChange={handleInputChange}
              fullWidth
            />
          </Grid>

          <Grid item xs={6} sm={3} md={1}>
            <TextField
              label="Adet/Kg"
              name="quantity"
              type="number"
              value={currentProduct.quantity}
              onChange={handleInputChange}

            />
          </Grid>
          <Grid item xs={6} sm={3} md={1}>
            <TextField
              label="Fiyat"
              name="price"
              type="number"
              value={currentProduct.price}
              onChange={handleInputChange}

            />
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Autocomplete
              options={paymentTypes}
              getOptionLabel={(option) => option}
              value={currentProduct.paymentType}
              onChange={(_, newValue) => setCurrentProduct({ ...currentProduct, paymentType: newValue })}
              isOptionEqualToValue={(option, value) => option === value}
              renderInput={(params) => (
                <TextField {...params} label="Ödeme Türü" />
              )}
              sx={{ width: '100%' }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Ek Bilgi"
              name="info"
              value={currentProduct.info}
              onChange={handleInputChange}
              fullWidth
              sx={{ width: '100%'}}
            />
            <br />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="tr">
              <DatePicker
                label="Tarih"
                views={['year', 'month', 'day']}
                defaultValue={dayjs().locale('tr')}
                value={dayjs(currentProduct.date, 'DD.MM.YYYY')}
                onChange={handleDateChange}
                disabled={useToday}
                sx={{ width: '40%'}}
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
              sx={{ marginTop: '20px', marginLeft: '5px' }}
            />
          </Grid>

        </Grid>

        <Button
          variant="contained"
          color="primary"
          onClick={handleAddProduct}
          sx={{ mt: 2 }}
        >
          Ürün {editingIndex !== null ? 'Güncelle' : 'Ekle'}
        </Button>
      </form>

      {/* <Typography variant="h6" fontWeight="bold" style={{ padding: 5 }}>
        Bugünkü eklenen ürünler:
      </Typography> */}


      <Divider sx={{ my: 1 }}>Bugünkü eklenen ürünler:</Divider>


      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ height: 400, width: '100%' }}>
          <DataGrid
            rows={products}
            columns={columns}
            hideFooter
            sx={{
              '& .MuiDataGrid-cell': {
                whiteSpace: 'normal',
                lineHeight: 'normal',
                padding: '8px',
              },
            }}
          />
        </Box>
      )}


      <Typography variant="h6" fontWeight="bold" sx={{ mt: 2 }}>
        Toplam Fiyat: {calculateTotalPrice()} TL
      </Typography>

      <Button
        variant="contained"
        color="primary"
        onClick={updateProducts}
        disabled={isLoading}
        sx={{ mt: 2 }}
      >
        {isLoading ? 'Kaydediliyor...' : 'Kaydet'}
      </Button>
    </Container >
  );
}
