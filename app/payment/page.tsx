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

interface Product {
  id: number;
  price: number;
  billNo: string;
  name: string;
  paymentType: string | null;
  info: string;
  date: string; // Store date as a string in YYYY-MM-DD format
}

const paymentTypes = [
  'Havale',
  'Eski Bakiye',
  'Veresiye'
];

export default function Payment_Calculation() {
  const [payments, setPayments] = useState<Product[]>([]);
  const [currentPayment, setCurrentPayment] = useState<Product>({
    id: 0,
    price: 0,
    billNo: '',
    name: '',
    paymentType: null,
    info: '',
    date: dayjs().locale('tr').format('DD.MM.YYYY HH:mm') // Initialize date in Turkish format
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [productIdCounter, setProductIdCounter] = useState<number>(1);
  const [useToday, setUseToday] = useState<boolean>(true); // Checkbox state

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTodayProducts();
  }, []);

  const fetchTodayProducts = async () => {
    const today = dayjs().format('DD.MM.YYYY HH:mm');
    setIsLoading(true);
    try {
      const response = await axios.get(`/api/payments?date=${today}`);
      if (response.status === 200) {
        const productsWithIds = response.data.payments.map((product: any, index: number) => ({
          id: index + 1,  // or however the ID should be generated
          date: product['Tarih'],
          price: parseFloat(product['Fiyat']),
          name: product['Adisyon No'],
          billNo: product['Adisyon Adı'],
          paymentType: product['Ödeme Türü'],
          info: product['Ek Bilgi'],
        }));
        setPayments(productsWithIds);

        // Update the productIdCounter to avoid ID conflicts
        const maxId = Math.max(...productsWithIds.map((product: { id: any; }) => product.id), 0);
        setProductIdCounter(maxId + 1);
      }
    } catch (error) {
      console.error('Error fetching today\'s products:', error);
      toast.error('Günün Ödemeleri alınırken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setCurrentPayment({
      ...currentPayment,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddProduct = () => {
    if (editingIndex !== null) { // Updating
      const updatedProducts = payments.map((product, index) =>
        index === editingIndex ? { ...currentPayment, id: payments[editingIndex].id } : product
      );
      setPayments(updatedProducts);
      setEditingIndex(null);
      toast.success('Ödeme başarıyla güncellendi!');
    } else { // Adding
      setPayments([...payments, { ...currentPayment, id: productIdCounter }]);
      setProductIdCounter(productIdCounter + 1);
      toast.success('Ödeme başarıyla eklendi!');
    }

    setCurrentPayment({
      id: 0,
      price: 0,
      billNo: '',
      name: '',
      paymentType: null,
      info: '',
      date: dayjs().locale('tr').format('DD.MM.YYYY HH:mm'), // Reset to today's date
    });
    // setUseToday(true); // Reset checkbox to true after adding the product
  };

  const handleEditProduct = (id: number) => {
    const index = payments.findIndex(product => product.id === id);
    setCurrentPayment(payments[index]);
    setEditingIndex(index);
    setUseToday(payments[index].date === dayjs().locale('tr').format('DD.MM.YYYY')); // Determine if the date is today
  };

  const handleDeleteProduct = (id: number) => {
    const updatedProducts = payments.filter((product) => product.id !== id);
    setPayments(updatedProducts);
    toast.success('Ödeme başarıyla silindi!');
  };

  const handleCheckboxChange = () => {
    setUseToday(!useToday);
    if (!useToday) {
      setCurrentPayment({ ...currentPayment, date: dayjs().locale('tr').format('DD.MM.YYYY') }); // Set to today's date
    }
  };

  const handleDateChange = (newValue: dayjs.Dayjs | null) => {
    setCurrentPayment({
      ...currentPayment,
      date: newValue ? newValue.format('DD.MM.YYYY') : ''
    });
  };

  const calculateTotalPrice = () => {
    return payments.reduce((total, product) => total + parseFloat(product.price + ""), 0).toFixed(2);
  };

  const formatPrice = (price : any) => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };
  

  const uploadProducts = async () => {

    if (!image) {
      toast('Fotoğraf Eklenmedi', {
        icon: '❗',
      });
    }

    const today = dayjs().format('DD.MM.YYYY');
    setIsLoading(true);
    try {
      const response = await axios.put('/api/payments', {
        date: today,
        payments: payments.map(p => ({
          'Tarih': p.date,
          'Fiyat': parseInt(p.price + ""),
          'Adisyon No': p.billNo,
          'Adisyon Adı': p.name,
          'Ödeme Türü': p.paymentType,
          'Ek Bilgi': p.info,
        })),
        totalPrice: calculateTotalPrice(),
        imageBuffer: image
      });
      if (response.status === 200) {
        toast.success('Ödemeler başarıyla güncellendi!');
      }
    } catch (error) {
      console.error('Error updating products:', error);
      toast.error('Ödemeler güncellenirken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  // Image upload
  const [image, setImage] = useState<string | null>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };


  const columns: GridColDef[] = [
    // { field: 'id', headerName: 'ID', width: 2 },
    { field: 'date', headerName: 'Tarih', width: 100 },
    { field: 'price', headerName: 'Fiyat', width: 80, type: 'number' },
    { field: 'billNo', headerName: 'Adisyon No', width: 180 },
    { field: 'name', headerName: 'Adisyon Adı', width: 180 },
    { field: 'paymentType', headerName: 'Ödeme Türü', width: 100 },
    { field: 'info', headerName: 'Ek Bilgi', width: 200 },
    {
      field: 'actions',
      headerName: 'İşlemler',
      width: 96,
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
      <Typography variant="h4" gutterBottom>Ödeme, Tahsilat ve Veresiye İşlemleri</Typography>
      <form noValidate autoComplete="off">
        <Grid container spacing={2}>

          <Grid item xs={6} sm={1.5} md={1.4}>
            <div style={{ display: 'flex' }}>
              <TextField
                label="Fiyat"
                name="price"
                type="number"
                value={currentPayment.price}
                onChange={handleInputChange}
              />

              <h4 style={{ paddingLeft: 5, fontWeight: 'initial' }}>₺</h4>
            </div>
          </Grid>

          <Grid item xs={12} sm={1} md={3}>
            <TextField
              label="Adisyon No"
              name="billNo"
              value={currentPayment.billNo}
              onChange={handleInputChange}
              fullWidth
            />
          </Grid>

          <Grid item xs={12} sm={1} md={3}>
            <TextField
              label="Adisyon Adı"
              name="name"
              value={currentPayment.name}
              onChange={handleInputChange}
              fullWidth
            />
          </Grid>

          <Grid item xs={12} sm={1} md={2}>
            <Autocomplete
              options={paymentTypes}
              getOptionLabel={(option) => option}
              value={currentPayment.paymentType}
              onChange={(_, newValue) => setCurrentPayment({ ...currentPayment, paymentType: newValue })}
              isOptionEqualToValue={(option, value) => option === value}
              renderInput={(params) => (
                <TextField {...params} label="Ödeme Türü" />
              )}
              sx={{ width: '100%' }}
            />
          </Grid>

          <Box sx={{ display: "flex", alignItems: "center", marginTop: 2, marginLeft: 2 }}>
            <Button
              variant="contained"
              component="label"
              sx={{ marginRight: 2 }}
            >
              Fotoğraf Yükle
              <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
            </Button>

            {image && (
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <img
                  src={image}
                  alt="Uploaded"
                  style={{ maxWidth: 60, maxHeight: 60, marginRight: 10, borderRadius: 4 }}
                />
              </Box>
            )}
          </Box>


          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Ek Bilgi"
              name="info"
              value={currentPayment.info}
              onChange={handleInputChange}
              fullWidth
              sx={{ width: '100%' }}
            />
            <br />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="tr">
              <DatePicker
                label="Tarih"
                views={['year', 'month', 'day']}
                defaultValue={dayjs().locale('tr')}
                value={dayjs(currentPayment.date, 'DD.MM.YYYY HH:mm')}
                onChange={handleDateChange}
                disabled={useToday}
                sx={{ width: '40%' }}
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
              sx={{ marginTop: '10px', marginLeft: '5px' }}
            />
          </Grid>

        </Grid>
        <br />


        <Button
          variant="contained"
          color="primary"
          onClick={handleAddProduct}
        >
          Ödeme {editingIndex !== null ? 'Güncelle' : 'Ekle'}
        </Button>
      </form>

      {/* <Typography variant="h6" fontWeight="bold" style={{ padding: 5 }}>
        Bugünkü eklenen Ödemeler:
      </Typography> */}


      <Divider sx={{ my: 1 }}>Bugünkü eklenen ödemeler:</Divider>


      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ height: 400, width: '100%' }}>
          <DataGrid
            rows={payments}
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
        Toplam Fiyat: {formatPrice(calculateTotalPrice())} TL
      </Typography>

      <Button
        variant="contained"
        color="primary"
        onClick={uploadProducts}
        disabled={isLoading}
        sx={{ mt: 2 }}
      >
        {isLoading ? 'Kaydediliyor...' : 'Kaydet'}
      </Button>
    </Container >
  );
}
