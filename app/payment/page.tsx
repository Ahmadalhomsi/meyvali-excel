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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import { Edit, Delete, AddAPhoto, Warning } from '@mui/icons-material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/tr'; // Import the Turkish locale
import toast from 'react-hot-toast';
import axios from 'axios';
import { useUser } from '@clerk/nextjs';
import { serverBaseUrl } from '@/components/serverConfig';
import { v4 as uuidv4 } from 'uuid';

interface Payment {
  id: string;
  price: number;
  billNo: string;
  name: string;
  paymentType: string | null;
  info: string;
  date: string; // Store date as a string in YYYY-MM-DD format
  image: string | null;
}

const paymentTypes = [
  'Havale',
  'Eski Bakiye',
  'Veresiye'
];

export default function Payment_Calculation() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [currentPayment, setCurrentPayment] = useState<Payment>({
    id: uuidv4(),
    price: 0,
    billNo: '',
    name: '',
    paymentType: null,
    info: '',
    date: dayjs().locale('tr').format('DD.MM.YYYY HH:mm'), // Initialize date in Turkish format
    image: null,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [productIdCounter, setProductIdCounter] = useState<number>(1);
  const [useToday, setUseToday] = useState<boolean>(true); // Checkbox state
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false);

  useEffect(() => {
    fetchTodayProducts();
  }, []);

  const fetchTodayProducts = async () => {
    const today = dayjs().format('DD.MM.YYYY HH:mm');
    setIsLoading(true);
    try {
      const response = await axios.get(`/api/payments?date=${today.split(' ')[0]}`);
      if (response.status === 200) {
        const productsWithIds = response.data.payments.map((product: any) => ({
          id: product.ID,  // or however the ID should be generated
          date: product['Tarih'],
          price: parseFloat(product['Fiyat']),
          name: product['Adisyon No'],
          billNo: product['Adisyon Adı'],
          paymentType: product['Ödeme Türü'],
          info: product['Ek Bilgi'],
          image: product['Fotoğraf']?.hyperlink,
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

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setCurrentPayment({
      ...currentPayment,
      [e.target.name]: e.target.value,
    });
  };

  const { user } = useUser();

  const updatePayment = async (payment: Payment) => {
    console.log('Updating payment:', payment);

    try {

      const userName = user?.username || user?.fullName || user?.emailAddresses[0].emailAddress;

      console.log('User name:', userName);


      if (!userName) {
        toast.error('Kullanıcı adı alınamadı. Lütfen tekrar deneyin.');
      }

      // Pass the userName along with the product data to the backend
      await axios.put(`/api/payments/`, {
        ...payment,
        userName, // Include the userName in the request body
      });
    } catch (error) {
      console.log('Error updating product:', error);
      throw error; // Rethrow the error to handle it in the calling function
    }
  };

  const handleAddPayment = async () => {

    console.log('Current payment:', currentPayment);


    try {
      let uniqueId

      if (editingId !== null) {
        setIsLoading(true);
        // Format date and construct image URL outside the loop
        uniqueId = editingId;
        const dateFormatted = dayjs().locale('tr').format('DD-MM-YYYY');
        const imageFileName = `${dateFormatted}-${uniqueId}-Urunler.png`;

        await updatePayment(currentPayment);

        // Append the timestamp only when editing the image
        const timestamp = new Date().getTime();
        const imageUrl = `${serverBaseUrl}/uploads/${imageFileName}?t=${timestamp}`;

        // Update the payment with the new image URL
        const updatedPayments = payments.map((payment) =>
          payment.id === editingId
            ? { ...currentPayment }
            : payment
        );

        setPayments(updatedPayments);
        setEditingId(null);
        toast.success('Ödeme başarıyla güncellendi!');
        setIsLoading(false);
      } else {
        // Format date and construct image URL outside the loop
        uniqueId = uuidv4();
        const dateFormatted = dayjs().locale('tr').format('DD-MM-YYYY');
        const imageFileName = `${dateFormatted}-${uniqueId}-Urunler.png`;
        const imageUrl = `${serverBaseUrl}/uploads/${imageFileName}`;

        const newPayment = { ...currentPayment, image: imageUrl };

        await updatePayment(newPayment);

        newPayment.image = imageUrl;

        setPayments([...payments, newPayment]);
        toast.success('Ödeme başarıyla eklendi!');
      }

      setCurrentPayment({
        id: uniqueId,
        price: 0,
        billNo: '',
        name: '',
        paymentType: null,
        info: '',
        date: dayjs().locale('tr').format('DD.MM.YYYY HH:mm'), // Reset to today's date
        image: null,
      });

    } catch (error) {
      console.log('Error handling product:', error);
      toast.error('Ödeme işlenirken bir hata oluştu.');
    }
  };

  const handleEditProduct = (id: string) => {
    const paymentToEdit = payments.find(payment => payment.id === id);
    if (paymentToEdit) {
      setCurrentPayment(paymentToEdit);
      setEditingId(id);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await axios.delete(`/api/payments/`, { data: { id } });
      const updatedPayments = payments.filter(payment => payment.id !== id);
      setPayments(updatedPayments);
      toast.success('Ödeme başarıyla silindi!');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Ödeme silinirken bir hata oluştu.');
    }
  };

  const handleCheckboxChange = () => {
    setUseToday(!useToday);
    if (!useToday) {
      setCurrentPayment({ ...currentPayment, date: dayjs().locale('tr').format('DD.MM.YYYY') }); // Set to today's date
    }
  };

  const handleDateChange = (newValue: dayjs.Dayjs | null) => {
    const newDate = newValue ? newValue.format('DD.MM.YYYY') : '';
    const updatedPayment = {
      ...currentPayment,
      date: newDate,
    };
    setCurrentPayment(updatedPayment);
  };

  const calculateTotalPrice = () => {
    return payments.reduce((total, product) => total + parseFloat(product.price + ""), 0).toFixed(2);
  };

  const formatPrice = (price: any) => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageDataUrl = e.target?.result as string;
        const updatedPayment = { ...currentPayment, image: imageDataUrl };
        setCurrentPayment(updatedPayment);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleImageDelete = async () => {
    if (!currentPayment.image) {
      toast.error('No image to delete.');
      return;
    }

    setIsDeletingPhoto(true);
    try {
      // Extract the filename from the image URL
      const filename = currentPayment.image.split('/').pop();

      console.log('Deleting photo:', filename);

      // Make an API call to delete the image from the server
      await axios.delete(`/api/payments`, {
        data: {
          id: currentPayment.id,
          imageOnly: true
        }
      });

      // Update the current Payment state
      setCurrentPayment({ ...currentPayment, image: null });

      // If we're editing an existing Payment, update it in the Payments list
      if (editingId) {
        setPayments(payments.map(payment =>
          payment.id === editingId ? { ...payment, image: null } : payment
        ));
      }

      toast.success('Fotoğraf başarıyla silindi!');
    } catch (error) {
      console.log('Error deleting photo:', error);
      toast.error('Failed to delete photo. Please try again.');
    } finally {
      setIsDeletingPhoto(false);
      setIsDeleteDialogOpen(false);
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
      field: 'image',
      headerName: 'Fotoğraf',
      width: 100,
      renderCell: (params) => {
        // Log the value to the console
        console.log('Image URLZZZZ:', params.value);

        return params.value ? (
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
        );
      },
    },
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

          <Grid item xs={12} sm={6} md={3}>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="tr">
              <DatePicker
                label="Tarih"
                views={['year', 'month', 'day']}
                defaultValue={dayjs().locale('tr')}
                value={dayjs(currentPayment.date, 'DD.MM.YYYY HH:mm')}
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
              sx={{ marginTop: '10px', marginLeft: '5px' }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4} sx={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="raised-button-file"
                type="file"
                onChange={handleImageSelect}
              />
              <label htmlFor="raised-button-file">
                <Button variant="contained" component="span" startIcon={<AddAPhoto />}>
                  {currentPayment.image ? 'Fotoğrafı Değiştir' : 'Fotoğraf Ekle'}
                </Button>
              </label>
            </Box>

            {currentPayment.image && (
              <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", marginLeft: 1 }}>
                <img
                  src={currentPayment.image}
                  alt="Payment"
                  style={{ maxWidth: 60, maxHeight: 60, borderRadius: 4 }}
                />
                <IconButton onClick={handleImageDeleteClick} color="secondary" sx={{ marginLeft: 1 }}>
                  <Delete />
                </IconButton>
              </Box>
            )}
          </Grid>

          <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)}>
            <DialogTitle>
              <Warning color="warning" /> Fotoğrafı Sil
            </DialogTitle>
            <DialogContent>
              <Typography>
                Bu fotoğrafı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setIsDeleteDialogOpen(false)} color="primary">
                İptal
              </Button>
              <Button
                onClick={handleImageDelete}
                color="secondary"
                disabled={isDeletingPhoto}
                startIcon={isDeletingPhoto ? <CircularProgress size={20} /> : <Delete />}
              >
                {isDeletingPhoto ? 'Siliniyor...' : 'Sil'}
              </Button>
            </DialogActions>
          </Dialog>

        </Grid>
        <br />


        <Button
          variant="contained"
          color="primary"
          onClick={handleAddPayment}
        >
          Ödeme {editingId !== null ? 'Güncelle' : 'Ekle'}
        </Button>
      </form>

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
    </Container >
  );
}


