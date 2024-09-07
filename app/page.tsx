"use client";

import { useState, useEffect } from 'react';
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
import { v4 as uuidv4 } from 'uuid';
import { serverBaseUrl } from '@/components/serverConfig';
import { useUser } from "@clerk/nextjs";


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
  imageExtension?: string; // Add this new optional property
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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false);


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
      console.log('Error fetching categories:', error);
      toast.error('Kategoriler alınırken bir hata oluştu.');
    }
  };

  const fetchTodayProducts = async (date?: any) => {
    const today = date || dayjs().format('DD.MM.YYYY HH:mm');
    setIsLoading(true);
    try {
      const response = await axios.get(`/api/products?date=${today.split(' ')[0]}`);
      if (response.status === 200) {

        const productsWithIds = response.data.products.map((product: any) => ({
          id: product.ID,
          category: product['Katagori'],
          name: product['Ürün Adı'],
          quantity: parseFloat(product['Adet/Kg']),
          price: parseFloat(product['Fiyat']),
          paymentType: product['Ödeme Türü'],
          info: product['Ek Bilgi'],
          date: product['Tarih'],
          image: product['Fotoğraf']?.hyperlink,
        }));
        setProducts(productsWithIds);
      }
    } catch (error) {
      console.log('Error fetching today\'s products:', error);
      toast.error('Günün ürünleri alınırken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {

    if (useToday) {
      currentProduct.date = dayjs().locale('tr').format('DD.MM.YYYY HH:mm');
    }

    setCurrentProduct({
      ...currentProduct,
      date: currentProduct.date,
      [e.target.name]: e.target.value,
    });
  };

  const { user } = useUser();
  const isAdmin = user?.publicMetadata?.role === 'admin';
  const isSupervisor = user?.publicMetadata?.role === 'supervisor';

  const updateProduct = async (product: Product) => {
    setIsLoading(true);
    if (useToday) {
      currentProduct.date = dayjs().locale('tr').format('DD.MM.YYYY HH:mm');
    }

    try {
      const userName = user?.username || user?.fullName || user?.emailAddresses[0].emailAddress;

      console.log('User name:', userName);


      if (!userName) {
        toast.error('Kullanıcı adı alınamadı. Lütfen tekrar deneyin.');
      }

      // Pass the userName along with the product data to the backend
      await axios.put(`/api/products/`, {
        ...product,
        date: currentProduct.date,
        userName, // Include the userName in the request body
      });
    } catch (error) {
      console.log('Error updating product:', error);
      throw error; // Rethrow the error to handle it in the calling function
    }
    setIsLoading(false);
  };

  const handleAddProduct = async () => {
    try {
      let uniqueId

      if (!currentProduct.category) {
        toast.error('Lütfen Katagori seçin.');
        return;
      } else if (!currentProduct.paymentType) {
        toast.error('Lütfen Ödeme Türü seçin.');
        return;
      }



      if (editingId !== null) { // Editing an existing product
        setIsLoading(true);
        // Format date and construct image URL outside the loop
        uniqueId = editingId;
        const dateFormatted = currentProduct.date.split(' ')[0].split('.').join('-');
        const imageExtension = currentProduct.imageExtension || 'jpg';
        const imageFileName = `${dateFormatted}-${uniqueId}-Urunler.${imageExtension}`;

        // Wait for the update to complete before proceeding
        await updateProduct(currentProduct);

        // Append the timestamp only when editing the image
        const timestamp = new Date().getTime();
        let imageUrl: any;


        if (typeof currentProduct.image === 'string') {
          console.log("Image IncludedX");
          imageUrl = `${serverBaseUrl}/uploads/${imageFileName}?t=${timestamp}`;
          currentProduct.image = imageUrl;
        } else {
          console.log("Image Not IncludedX");
          imageUrl = null;
        }

        const updatedProducts = products.map((product) =>
          product.id === editingId
            ? { ...currentProduct, image: imageUrl }
            : product
        );

        // Update the state with the new product list
        setProducts(updatedProducts);
        setEditingId(null);
        toast.success('Ürün başarıyla güncellendi!');
        setIsLoading(false);
      } else {
        uniqueId = editingId || uuidv4();
        const dateFormatted = currentProduct.date.split(' ')[0].split('.').join('-');
        const imageExtension = currentProduct.imageExtension || 'jpg';
        const imageFileName = `${dateFormatted}-${uniqueId}-Urunler.${imageExtension}`;
        const imageUrl = `${serverBaseUrl}/uploads/${imageFileName}`;

        if (useToday) {
          currentProduct.date = dayjs().locale('tr').format('DD.MM.YYYY HH:mm');
        }

        const newProduct = { ...currentProduct, id: uniqueId };

        // Wait for the add operation to complete
        await updateProduct(newProduct);

        if (typeof currentProduct.image === 'string') {
          console.log("Image Included");
          newProduct.image = imageUrl;
        } else {
          console.log("Image Not Included");
        }

        // Only update state if the API call is successful
        setProducts([...products, newProduct]);
        toast.success('Ürün başarıyla eklendi!');
      }

      console.log("Date", currentProduct.date);

      setCurrentProduct({
        id: uniqueId,
        category: null,
        name: '',
        quantity: 0,
        price: 0,
        paymentType: null,
        info: '',
        date: currentProduct.date,
        image: null,
      });
    } catch (error) {
      console.log('Error handling product:', error);
      toast.error('Ürün eklenirken bir hata oluştu.');
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
      await axios.delete(`/api/products/`, { data: { id } });
      const updatedProducts = products.filter((product) => product.id !== id);
      setProducts(updatedProducts);
      toast.success('Ürün başarıyla silindi!');
    } catch (error) {
      console.log('Error deleting product:', error);
      toast.error('Ürün silinirken bir hata oluştu.');
    }
  };

  const handleCheckboxChange = () => {
    setUseToday(!useToday);
    if (!useToday) {
      setCurrentProduct({ ...currentProduct, date: dayjs().locale('tr').format('DD.MM.YYYY') });
      handleDateChange(dayjs().locale('tr'));
    }
  };

  const handleDateChange = (newValue: dayjs.Dayjs | null) => {
    let newDate
    if (useToday) {
      newDate = dayjs().locale('tr').format('DD.MM.YYYY HH:mm');
      currentProduct.date = newDate;
    }
    else {
      newDate = newValue ? newValue.format('DD.MM.YYYY') : '';
      currentProduct.date = newDate;
    }


    const updatedProduct = {
      ...currentProduct,
      date: newDate,
    };
    setCurrentProduct(updatedProduct);
    fetchTodayProducts(newDate);
  };

  const calculateTotalPrice = () => {
    return products.reduce((total, product) => total + parseFloat(product.price + ""), 0).toFixed(2);
  };

  const formatPrice = (price: any) => {
    // Ensure the price is a valid number and format it to two decimal places
    const formattedPrice = parseFloat(price).toFixed(2);

    // Add commas
    return formattedPrice.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };


  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageDataUrl = e.target?.result as string;
        const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        console.log('Selected image:', file.name, fileExtension);

        const updatedProduct = {
          ...currentProduct,
          image: imageDataUrl,
          imageExtension: fileExtension
        };
        setCurrentProduct(updatedProduct);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleImageDelete = async () => {
    setEditingId(null);
    if (!currentProduct.image) {
      toast.error('No image to delete.');
      return;
    }

    setIsDeletingPhoto(true);
    try {
      // Extract the filename from the image URL
      const filename = currentProduct.image.split('/').pop();

      console.log('Deleting photo:', filename);

      // Make an API call to delete the image from the server
      await axios.delete(`/api/products`, {
        data: {
          id: currentProduct.id,
          imageOnly: true
        }
      });

      // Update the current product state
      setCurrentProduct({ ...currentProduct, image: null });

      // If we're editing an existing product, update it in the products list
      if (editingId) {
        setProducts(products.map(product =>
          product.id === editingId ? { ...product, image: null } : product
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
    { field: 'category', headerName: 'Katagori', width: 150 },
    { field: 'name', headerName: 'Ürün Adı', width: 180 },
    { field: 'quantity', headerName: 'Adet/Kg', width: 80, type: 'number' },
    {
      field: 'price', headerName: 'Fiyat', width: 80, type: 'number', renderCell: (params) => {
        return formatPrice(params.value);
      }
    },
    { field: 'paymentType', headerName: 'Ödeme Türü', width: 100 },
    { field: 'info', headerName: 'Ek Bilgi', width: 220 },
    {
      field: 'image',
      headerName: 'Fotoğraf',
      width: 110,
      renderCell: (params) => {

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
          <Typography>Fotoğraf Yok</Typography>
        );
      },
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
            {(isSupervisor || isAdmin) && (
              <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="tr">
                <DatePicker
                  label="Tarih"
                  views={['year', 'month', 'day']}
                  defaultValue={dayjs().locale('tr')}
                  value={dayjs(currentProduct.date, 'DD.MM.YYYY')}
                  onChange={handleDateChange}
                  disabled={useToday || !(isAdmin || isSupervisor)} // Disables if useToday is true or user is admin/supervisor
                  sx={{ width: '55%' }}
                />
              </LocalizationProvider>
            )}

            <FormControlLabel
              control={
                <Checkbox
                  checked={useToday}
                  onChange={handleCheckboxChange}
                  name="useToday"
                  color="primary"
                  disabled={!(isAdmin || isSupervisor)} // Disable if user is admin or supervisor
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
                  {currentProduct.image ? 'FOTOĞRAFI DEĞİŞTİR' : 'Fotoğraf Ekle'}
                </Button>
              </label>
            </Box>

            {currentProduct.image && (
              <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", marginLeft: 1 }}>
                <img
                  src={currentProduct.image}
                  alt="Product"
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
