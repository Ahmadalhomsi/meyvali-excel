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
import { Edit, Delete, AddAPhoto } from '@mui/icons-material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/tr'; // Import the Turkish locale
import toast from 'react-hot-toast';
import axios from 'axios';
import { useUser } from '@clerk/nextjs';

interface TotalCash {
    remaining: string | null;
    creditCard: string | null;
    TRQcode: string | null;
    eBill: string | null;
    info: string;
    date: string;
}

interface DailyData {
    // remaining: number;
    // creditCard: number;
    ciro: number;
    paketAdet: number;
    paketAverage: number;
    date: string;
}


export default function End_Of_Day() {
    const [totalCash, setTotalCash] = useState<TotalCash>({
        remaining: null,
        creditCard: null,
        TRQcode: null,
        eBill: null,
        info: '',
        date: dayjs().locale('tr').format('DD.MM.YYYY HH:mm')
    });
    const [useToday, setUseToday] = useState<boolean>(true); // Checkbox state

    const [isLoading, setIsLoading] = useState(false);

    const [dailyData, setDailyData] = useState<DailyData>({
        // remaining: 0,
        // creditCard: 0,
        ciro: 0,
        paketAdet: 0,
        paketAverage: 0,
        date: dayjs().locale('tr').format('DD.MM.YYYY HH:mm')
    });

    const handleInputChange = (
        e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setTotalCash(prev => ({
            ...prev,
            [name]: name === 'info' ? value : value,
        }));
    };

    const handleCheckboxChange = () => {
        setUseToday(!useToday);
        if (!useToday) {
            setTotalCash({ ...totalCash, date: dayjs().locale('tr').format('DD.MM.YYYY') }); // Set to today's date
        }
    };

    // const calculateTotalPrice = () => {
    //     return payments.reduce((total, product) => total + parseFloat(product.price + ""), 0);
    // };

    const calculateTotalCash = () => {
        return ['remaining', 'creditCard', 'TRQcode', 'eBill'].reduce((total, field) => {
            const value = parseFloat(totalCash[field as keyof TotalCash] ?? '0');
            return total + (isNaN(value) ? 0 : value);
        }, 0);
    };

    const formatPrice = (price: any) => {
        return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };


    const fetchDailyData = async () => {
        const today = dayjs().format('DD.MM.YYYY HH:mm');
        setIsLoading(true);
        try {
            const response = await axios.get(`/api/endOfDay?date=${today}`);
            if (response.status === 200) {
                setDailyData(response.data.dailyData);
                // Initialize totalCash with the fetched remaining and creditCard values
                console.log(response.data.dailyData);
            }
        } catch (error) {
            console.log('Error fetching daily data:', error);
            toast.error('Günlük veri alınırken bir hata oluştu.');
        } finally {
            setIsLoading(false);
        }
    };

    const { user } = useUser();
    const isAdmin = user?.publicMetadata?.role === 'admin';
    const isSupervisor = user?.publicMetadata?.role === 'supervisor';

    const uploadTotalCash = async () => {
        if (!image) {
            toast('Fotoğraf Eklenmedi', {
                icon: '❗',
            });
        }

        setIsLoading(true);
        console.log(totalCash);

        const processedTotalCash = {
            remaining: Number(totalCash.remaining) || 0,
            creditCard: Number(totalCash.creditCard) || 0,
            TRQcode: Number(totalCash.TRQcode) || 0,
            eBill: Number(totalCash.eBill) || 0,
            info: totalCash.info, // info string olarak kalacak
            date: totalCash.date
        };

        try {

            const userName = user?.username || user?.fullName || user?.emailAddresses[0].emailAddress;

            console.log('User name:', userName);

            const response = await axios.put('/api/endOfDay', {
                totalCash: processedTotalCash,
                imageBuffer: image,
                date: dayjs().format('DD.MM.YYYY HH:mm'),
                userName
            });
            if (response.status === 200) {
                toast.success('Toplam nakit bilgisi başarıyla güncellendi!');
                fetchDailyData();
            }
        } catch (error) {
            console.log('Error updating total cash:', error);
            toast.error('Toplam nakit bilgisi güncellenirken bir hata oluştu.');
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


    return (
        <Container>
            <Typography variant="h4" gutterBottom>Günün Sonu</Typography>
            <form noValidate autoComplete="off">
                <Grid container spacing={2}>

                    <Grid item xs={6} sm={1.5} md={2}>
                        <div style={{ display: 'flex' }}>
                            <TextField
                                label="Kalan"
                                name="remaining"
                                type="number"
                                value={totalCash.remaining}
                                onChange={handleInputChange}
                            />

                            <h4 style={{ paddingLeft: 5, fontWeight: 'initial' }}>₺</h4>
                        </div>
                    </Grid>

                    <Grid item xs={6} sm={1.5} md={2}>
                        <div style={{ display: 'flex' }}>
                            <TextField
                                label="Kredi Kartı"
                                name="creditCard"
                                type="number"
                                value={totalCash.creditCard}
                                onChange={handleInputChange}
                            />

                            <h4 style={{ paddingLeft: 5, fontWeight: 'initial' }}>₺</h4>
                        </div>
                    </Grid>

                    <Grid item xs={6} sm={1.5} md={2}>
                        <div style={{ display: 'flex' }}>
                            <TextField
                                label="Kare Kod"
                                name="TRQcode"
                                type="number"
                                value={totalCash.TRQcode}
                                onChange={handleInputChange}
                            />

                            <h4 style={{ paddingLeft: 5, fontWeight: 'initial' }}>₺</h4>
                        </div>
                    </Grid>

                    <Grid item xs={6} sm={1.5} md={2}>
                        <div style={{ display: 'flex' }}>
                            <TextField
                                label="e-Fatura"
                                name="eBill"
                                type="number"
                                value={totalCash.eBill}
                                onChange={handleInputChange}
                            />

                            <h4 style={{ paddingLeft: 5, fontWeight: 'initial' }}>₺</h4>
                        </div>
                    </Grid>

                    <Grid item xs={12} sm={6} md={4} sx={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <input
                                accept="image/*"
                                style={{ display: 'none' }}
                                id="raised-button-file"
                                type="file"
                                onChange={handleImageUpload}
                            />
                            <label htmlFor="raised-button-file">
                                <Button variant="contained" component="span" startIcon={<AddAPhoto />}>
                                    {image ? 'FOTOĞRAFI DEĞİŞTİR' : 'Fotoğraf Ekle'}
                                </Button>
                            </label>
                        </Box>

                        {image && (
                            <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", marginLeft: 1 }}>
                                <img
                                    src={image}
                                    alt="Product"
                                    style={{ maxWidth: 60, maxHeight: 60, borderRadius: 4 }}
                                />
                            </Box>
                        )}
                    </Grid>


                    <Grid item xs={12} sm={6} md={3}>
                        <TextField
                            label="Ek Bilgi"
                            name="info"
                            value={totalCash.info}
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
                                    value={dayjs(totalCash.date, 'DD.MM.YYYY')}
                                    onChange={(newValue) => {
                                        setTotalCash(prev => ({
                                            ...prev,
                                            date: newValue ? newValue.format('DD.MM.YYYY') : prev.date
                                        }));
                                    }}
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

                </Grid>
            </form>

            <Button
                variant="contained"
                color="primary"
                onClick={uploadTotalCash}
                disabled={isLoading}
                sx={{ mt: 2 }}
            >
                {isLoading ? 'Kaydediliyor...' : 'Tüm Kontrolu Yaptım Onaylıyorum'}
            </Button>

            <Divider sx={{ mt: 2 }} />

            <Box sx={{ mt: 2 }}>
                <Typography variant="h6" fontWeight="bold">
                    Toplam Ciro: {formatPrice(dailyData.ciro.toFixed(2))} ₺
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                    Toplam Kasa: {formatPrice(calculateTotalCash().toFixed(2))} ₺
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                    Sonuç: {formatPrice((dailyData.ciro - calculateTotalCash()).toFixed(2))} ₺
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                    Paket Toplamı: {dailyData.paketAdet.toLocaleString()}
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                    Paket Ortalaması: {formatPrice(dailyData.paketAverage.toFixed(2))}
                </Typography>
            </Box>
        </Container >
    );
}
