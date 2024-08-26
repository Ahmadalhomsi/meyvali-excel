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

interface TotalCash {
    remaining: number;
    creditCard: number;
    TRQcode: number;
    eBill: number;
    info: string;
    date: string;
}


export default function End_Of_Day() {
    const [totalCash, setTotalCash] = useState<TotalCash>({
        remaining: 0,
        creditCard: 0,
        TRQcode: 0,
        eBill: 0,
        info: '',
        date: dayjs().locale('tr').format('DD.MM.YYYY')
    });
    const [useToday, setUseToday] = useState<boolean>(true); // Checkbox state

    const [isLoading, setIsLoading] = useState(false);

    // useEffect(() => {
    //     fetchTodayTotalCash();
    // }, []);

    // const fetchTodayTotalCash = async () => {
    //     const today = dayjs().format('DD.MM.YYYY');
    //     setIsLoading(true);
    //     try {
    //         const response = await axios.get(`/api/endOfDay?date=${today}`);
    //         if (response.status === 200) {
    //             setTotalCash({
    //                 remaining: response.data.remaining || 0,
    //                 creditCard: response.data.creditCard || 0,
    //                 TRQcode: response.data.TRQcode || 0,
    //                 eBill: response.data.eBill || 0,
    //                 info: response.data.info || '',
    //                 date: response.data.date || today,
    //             });
    //         }
    //     } catch (error) {
    //         console.error('Error fetching today\'s total cash:', error);
    //         toast.error('Günün toplam nakit bilgisi alınırken bir hata oluştu.');
    //     } finally {
    //         setIsLoading(false);
    //     }
    // };

    const handleInputChange = (
        e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setTotalCash(prev => ({
            ...prev,
            [name]: name === 'info' ? value : parseFloat(value) || 0,
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

    const uploadTotalCash = async () => {
        if (!image) {
            toast('Fotoğraf Eklenmedi', {
                icon: '❗',
            });
        }

        setIsLoading(true);
        console.log(totalCash);

        try {
            const response = await axios.put('/api/endOfDay', {
                totalCash,
                imageBuffer: image,
                date: dayjs().format('DD.MM.YYYY')
            });
            if (response.status === 200) {
                toast.success('Toplam nakit bilgisi başarıyla güncellendi!');
            }
        } catch (error) {
            console.error('Error updating total cash:', error);
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
                            value={totalCash.info}
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
                                value={dayjs(totalCash.date, 'DD.MM.YYYY')}
                                onChange={(newValue) => {
                                    setTotalCash(prev => ({
                                        ...prev,
                                        date: newValue ? newValue.format('DD.MM.YYYY') : prev.date
                                    }));
                                }}
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

            <Typography variant="h6" fontWeight="bold" sx={{ mt: 2 }}>
                {/* Toplam Fiyat: {calculateTotalPrice()} TL */}
                xxxxxx
            </Typography>
        </Container >
    );
}
