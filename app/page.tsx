"use client";

import { useState, ChangeEvent, useEffect, useCallback } from 'react';
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
import { Edit, Delete, AddAPhoto } from '@mui/icons-material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/tr'; // Import the Turkish locale
import toast from 'react-hot-toast';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { serverBaseUrl } from '@/components/serverConfig';

// Define the product type
interface Product {
  id: string;
  category: string | null;
  name: string;
  quantity: number;
  price: number;
  paymentType: string | null;
  info: string;
  date: string; // Store date as a string in YYYY-MM-DD format
  image: string | null;
}

const paymentTypes = [
  'Nakit',
  'Kredi Kartı',
  'Havale',
  'Kasadan'
];

export default function ProductPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [currentProduct, setCurrentProduct] = useState<Product>({
    id: uuidv4(),
    category: null,
    name: '',
    quantity: 0,
    price: 0,
    paymentType: null,
    info: '',
    date: dayjs().locale('tr').format('DD.MM.YYYY HH:mm'), // Initialize date in Turkish format
    image: null,
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [useToday, setUseToday] = useState<boolean>(true); // Checkbox state
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);


  useEffect(() => {
    fetchTodayProducts();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories');
      if (response.status === 200) {
        setCategories(response.data.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Kategoriler alınırken bir hata oluştu.');
    }
  };

  const fetchTodayProducts = async () => {
    const today = dayjs().format('DD.MM.YYYY HH:mm');
    setIsLoading(true);
    try {
      const response = await axios.get(`/api/products?date=${today.split(' ')[0]}`);
      if (response.status === 200) {
        console.log('Today\'s products:', response.data.products);

        const productsWithIds = response.data.products.map((product: any) => ({
          id: product.ID,
          category: product['Katagori'],
          name: product['Ürün Adı'],
          quantity: parseFloat(product['Adet/Kg']),
          price: parseFloat(product['Fiyat']),
          paymentType: product['Ödeme Türü'],
          info: product['Ek Bilgi'],
          date: product['Tarih'],
          image: product['Fotoğraf'].hyperlink,
        }));
        setProducts(productsWithIds);
      }
    } catch (error) {
      console.error('Error fetching today\'s products:', error);
      toast.error('Günün ürünleri alınırken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const updatedProduct = {
      ...currentProduct,
      [e.target.name]: e.target.value,
    };
    setCurrentProduct(updatedProduct);
  };


  const updateProduct = async (product: Product) => {
    console.log('Updating product:', product);

    try {
      await axios.put(`/api/products/`, product);
    } catch (error) {
      console.error('Error updating product:', error);
      throw error; // Rethrow the error to handle it in the calling function
    }
  };

  const handleAddProduct = async () => {
    try {
      console.log(editingId);

      let uniqueId

      if (editingId !== null) {
        setIsLoading(true);
        // Format date and construct image URL outside the loop
        uniqueId = editingId;
        const dateFormatted = dayjs().locale('tr').format('DD-MM-YYYY');
        const imageFileName = `${dateFormatted}-${uniqueId}-Urunler.png`;
        const imageUrl = `${serverBaseUrl}/uploads/${imageFileName}`;

        // Update the product list with the new values
        const updatedProducts = products.map((product) =>
          product.id === editingId
            ? { ...currentProduct }
            : product
        );

        // Wait for the update to complete before proceeding
        await updateProduct(currentProduct);

        // Only update state if the API call is successful
        setProducts(updatedProducts);
        setEditingId(null);
        toast.success('Ürün başarıyla güncellendi!');
        setIsLoading(false);

      } else {
        uniqueId = uuidv4();
        const dateFormatted = dayjs().locale('tr').format('DD-MM-YYYY');
        const imageFileName = `${dateFormatted}-${uniqueId}-Urunler.png`;
        const imageUrl = `${serverBaseUrl}/uploads/${imageFileName}`;


        const newProduct = { ...currentProduct, id: uniqueId };

        // Wait for the add operation to complete
        await updateProduct(newProduct);

        newProduct.image = imageUrl;
        // Only update state if the API call is successful
        setProducts([...products, newProduct]);
        toast.success('Ürün başarıyla eklendi!');
      }

      // Reset current product after successful operation
      setCurrentProduct({
        id: uniqueId,
        category: null,
        name: '',
        quantity: 0,
        price: 0,
        paymentType: null,
        info: '',
        date: dayjs().locale('tr').format('DD.MM.YYYY HH:mm'),
        image: null,
      });
    } catch (error) {
      console.error('Error handling product:', error);
      // Error toast is already shown in `updateProduct`, so no need to show another one here
    }
  };

  const handleEditProduct = (id: string) => {
    const productToEdit = products.find(product => product.id === id);
    if (productToEdit) {
      setCurrentProduct(productToEdit);
      setEditingId(id);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await axios.delete(`/api/products/${id}`);
      const updatedProducts = products.filter((product) => product.id !== id);
      setProducts(updatedProducts);
      toast.success('Ürün başarıyla silindi!');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Ürün silinirken bir hata oluştu.');
    }
  };

  const handleCheckboxChange = () => {
    setUseToday(!useToday);
    if (!useToday) {
      setCurrentProduct({ ...currentProduct, date: dayjs().locale('tr').format('DD.MM.YYYY') });
    }
  };

  const handleDateChange = (newValue: dayjs.Dayjs | null) => {
    const newDate = newValue ? newValue.format('DD.MM.YYYY') : '';
    const updatedProduct = {
      ...currentProduct,
      date: newDate,
    };
    setCurrentProduct(updatedProduct);
  };

  const calculateTotalPrice = () => {
    return products.reduce((total, product) => total + parseFloat(product.price + ""), 0).toFixed(2);
  };

  const formatPrice = (price: any) => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };



  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageDataUrl = e.target?.result as string;
        const updatedProduct = { ...currentProduct, image: imageDataUrl };
        setCurrentProduct(updatedProduct);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageDelete = () => {
    const updatedProduct = { ...currentProduct, image: null };
    setCurrentProduct(updatedProduct);
  };


  const columns: GridColDef[] = [
    // { field: 'id', headerName: 'ID', width: 2 },
    { field: 'date', headerName: 'Tarih', width: 100 },
    { field: 'category', headerName: 'Katagori', width: 150 },
    { field: 'name', headerName: 'Ürün Adı', width: 180 },
    { field: 'quantity', headerName: 'Adet/Kg', width: 80, type: 'number' },
    { field: 'price', headerName: 'Fiyat', width: 80, type: 'number' },
    { field: 'paymentType', headerName: 'Ödeme Türü', width: 100 },
    { field: 'info', headerName: 'Ek Bilgi', width: 220 },
    {
      field: 'image',
      headerName: 'Fotoğraf',
      width: 100,
      renderCell: (params) =>
        params.value ? (
          <a href={params.value} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', padding: 0 }}>
            <img
              src={params.value}
              alt="Product"
              style={{
                width: 'auto',  // Let the width adjust automatically
                height: '140%', // Make the image take the full height of the cell
                objectFit: 'contain', // Ensure the entire image is visible without distortion
                cursor: 'pointer',
                margin: 0, // Remove any margin around the image
              }}
            />
          </a>
        ) : (
          <Typography>No Image</Typography>
        ),
    },

    {
      field: 'actions',
      headerName: 'İşlemler',
      width: 120,
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

          <Grid item xs={6} sm={1.5} md={1.2}>
            <TextField
              label="Adet/Kg"
              name="quantity"
              type="number"
              value={currentProduct.quantity}
              onChange={handleInputChange}

            />
          </Grid>
          <Grid item xs={6} sm={1.5} md={1.4}>
            <div style={{ display: 'flex' }}>
              <TextField
                label="Fiyat"
                name="price"
                type="number"
                value={currentProduct.price}
                onChange={handleInputChange}
              />

              <h4 style={{ paddingLeft: 5, fontWeight: 'initial' }}>₺</h4>
            </div>
          </Grid>



          <Grid item xs={12} sm={2} md={2}>
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
              sx={{ width: '100%' }}
            />
            <br />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="tr">
              <DatePicker
                label="Tarih"
                views={['year', 'month', 'day',]}
                defaultValue={dayjs().locale('tr')}
                value={dayjs(currentProduct.date, 'DD.MM.YYYY HH:mm')}
                onChange={handleDateChange}
                disabled={useToday}
                sx={{ width: '55%' }}
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
              sx={{ marginTop: '8px', marginLeft: '4px' }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={2.9}>
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="raised-button-file"
              type="file"
              onChange={handleImageUpload}
            />
            <label htmlFor="raised-button-file">
              <Button variant="contained" component="span" sx={{ marginTop: 1 }} startIcon={<AddAPhoto />}>
                {currentProduct.image ? 'Fotoğrafı Değiştir' : 'Fotoğraf Ekle'}
              </Button>
            </label>
            {currentProduct.image && (
              <IconButton onClick={handleImageDelete} color="secondary">
                <Delete />
              </IconButton>
            )}
          </Grid>

          {currentProduct.image && (
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <img
                src={currentProduct.image}
                alt="Uploaded"
                style={{ maxWidth: 60, maxHeight: 60, marginRight: 10, borderRadius: 4, marginTop: 10 }}
              />
            </Box>
          )}

        </Grid>
        <br />

        <Button
          variant="contained"
          color="primary"
          onClick={handleAddProduct}
        >
          Ürün {editingId !== null ? 'Güncelle' : 'Ekle'}
        </Button>
      </form>
      <Divider sx={{ my: 1 }}>Bugünkü eklenen ürünler:</Divider>

      {
        isLoading ? (
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
        )
      }

      <Typography variant="h6" fontWeight="bold" sx={{ mt: 2 }}>
        Toplam Fiyat: {formatPrice(calculateTotalPrice())} TL
      </Typography>
    </Container >
  );
}
