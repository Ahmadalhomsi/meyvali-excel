"use client"

import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Button,
    Grid,
    Box,
    CircularProgress,
    Divider,
    Checkbox,
    FormControlLabel,
    ImageList,
    ImageListItem,
    ImageListItemBar,
    TextField,
} from '@mui/material';
import axios from 'axios';
import toast from 'react-hot-toast';
import CategoriesManagement from './CategoriesManagement';
import ColumnsManagement from './ColumnsManagement';
import UserManagement from './UsersManagement';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import 'dayjs/locale/tr'; // Ensure Day.js Turkish locale is loaded
import { useUser } from '@clerk/nextjs';




const FileManagementPage = () => {
    const [isDownloading, setIsDownloading] = useState(false);
    const [isReplacing, setIsReplacing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [images, setImages] = useState([]);
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [isUpdatingDates, setIsUpdatingDates] = useState(false);

    const { user } = useUser();

    const isAdmin = user?.publicMetadata?.role === 'admin';

    if (!isAdmin) {
        return (
            <Container>
                <Typography variant="h4" gutterBottom>
                    Bu sayfayı görüntüleme yetkiniz yok.
                </Typography>
            </Container>
        );
    }


    useEffect(() => {
        fetchImages();
    }, []);

    const fetchImages = async () => {
        try {
            const response = await axios.get('/api/images');
            setImages(response.data.images);
        } catch (error) {
            console.log('Error fetching images:', error);
            toast.error('Resimler yüklenirken bir hata oluştu.');
        }
    };

    const handleDownloadExcel = async () => {
        setIsDownloading(true);
        try {
            const response = await axios.get('/api/excel', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'meyvali-excel.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.log('Error downloading Excel file:', error);
            toast.error('Excel dosyası indirilirken bir hata oluştu.');
        } finally {
            setIsDownloading(false);
        }
    };

    const handleReplaceExcel = async () => {
        setIsReplacing(true);
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx, .xls';

        input.onchange = async (e: any) => {
            const file = e.target.files[0];
            if (!file) {
                setIsReplacing(false);
                return;
            }

            const formData = new FormData();
            formData.append('file', file);

            try {
                const response = await axios.post('/api/excel', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });

                if (response.status === 200) {
                    toast.success('Excel dosyası başarıyla değiştirildi.');
                } else {
                    throw new Error('Dosya yükleme başarısız.');
                }
            } catch (error) {
                console.log('Error replacing Excel file:', error);
                toast.error('Excel dosyası değiştirilirken bir hata oluştu.');
            } finally {
                setIsReplacing(false);
            }
        };

        input.click();
    };


    const handleImageSelect = (imageName: any) => {
        setSelectedImages(prev =>
            prev.includes(imageName)
                ? prev.filter(name => name !== imageName)
                : [...prev, imageName]
        );
    };

    const handleSelectAll = (event: any) => {
        if (event.target.checked) {
            setSelectedImages(images);
        } else {
            setSelectedImages([]);
        }
    };

    const handleDeleteImages = async () => {
        if (selectedImages.length === 0) {
            toast.error('Lütfen silinecek resimleri seçin.');
            return;
        }

        setIsDeleting(true);
        try {
            await axios.post('/api/images', { images: selectedImages });
            toast.success('Seçilen resimler başarıyla silindi.');
            fetchImages(); // Refresh the image list
            setSelectedImages([]);
        } catch (error) {
            console.log('Error deleting images:', error);
            toast.error('Resimler silinirken bir hata oluştu.');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleUpdateDates = async () => {
        if (!selectedDate) {
            toast.error('Lütfen bir tarih seçin.');
            return;
        }

        setIsUpdatingDates(true);
        try {
            const response = await axios.put('/api/excel', { date: selectedDate });
            if (response.status === 200) {
                toast.success('Tarihler başarıyla güncellendi.');
            } else {
                throw new Error('Tarih güncelleme başarısız.');
            }
        } catch (error) {
            console.log('Error updating dates:', error);
            toast.error('Tarihler güncellenirken bir hata oluştu.');
        } finally {
            setIsUpdatingDates(false);
        }
    };

    return (
        <Container>
            <Typography variant="h4" gutterBottom>
                {/* Dosya Yönetimi */}
                Ayarlar
            </Typography>

            <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                    <Box sx={{ border: 1, borderColor: 'grey.300', p: 2, borderRadius: 1 }}>
                        <Typography variant="h6" gutterBottom>
                            Excel Dosyası İşlemleri
                        </Typography>
                        <Typography variant="body2" paragraph>
                            Excel dosyası ismi böyle olmalıdır: meyvali-excel.xlsx
                        </Typography>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleDownloadExcel}
                            disabled={isDownloading}
                            sx={{ mr: 2, mb: 2 }}
                        >
                            {isDownloading ? 'İNDİRİLİYOR...' : 'İNDİR'}
                        </Button>
                        <Button
                            variant="contained"
                            color="secondary"
                            onClick={handleReplaceExcel}
                            disabled={isReplacing}
                            sx={{ mb: 2 }}
                        >
                            {isReplacing ? 'DEĞİŞTİRİLİYOR...' : 'DEĞİŞTİR'}
                        </Button>
                        {(isDownloading || isReplacing) && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                                <CircularProgress size={24} />
                            </Box>
                        )}
                    </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Box sx={{ border: 1, borderColor: 'grey.300', p: 2, borderRadius: 1 }}>
                        <Typography variant="h6" gutterBottom>
                            Tarih Güncelleme
                        </Typography>
                        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="tr">
                            <DatePicker
                                views={['year', 'month']}
                                label="Ay ve Yıl Seçin"
                                value={selectedDate}
                                onChange={(newValue: any) => setSelectedDate(newValue)}
                            />
                        </LocalizationProvider>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleUpdateDates}
                            disabled={isUpdatingDates || !selectedDate}
                            sx={{ mt: 2, ml: 2 }}
                        >
                            {isUpdatingDates ? 'GÜNCELLENİYOR...' : 'TARİHLERİ GÜNCELLE'}
                        </Button>
                        {isUpdatingDates && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                                <CircularProgress size={24} />
                            </Box>
                        )}
                    </Box>
                </Grid>

                <Grid item xs={12}>
                    <UserManagement />
                </Grid>

                <Grid item xs={12}>
                    <CategoriesManagement />
                </Grid>

                <Grid item xs={12}>
                    <ColumnsManagement />
                </Grid>


                <Grid item xs={12}>
                    <Box sx={{ border: 1, borderColor: 'grey.300', p: 2, borderRadius: 1, mt: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            RESİM İŞLEMLERİ
                        </Typography>
                        <Typography variant="body2" paragraph>
                            Resimlerin konumu: public\uploads\
                        </Typography>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={selectedImages.length === images.length}
                                    onChange={handleSelectAll}
                                    indeterminate={selectedImages.length > 0 && selectedImages.length < images.length}
                                />
                            }
                            label="Tümü Seç"
                        />
                        <ImageList sx={{ width: '100%', height: 450 }} cols={3} rowHeight={164}>
                            {images.map((image) => (
                                <ImageListItem key={image}>
                                    <img
                                        src={`/uploads/${image}`}
                                        alt={image}
                                        loading="lazy"
                                        style={{ opacity: selectedImages.includes(image) ? 0.5 : 1 }}
                                    />
                                    <ImageListItemBar
                                        title={image}
                                        actionIcon={
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        checked={selectedImages.includes(image)}
                                                        onChange={() => handleImageSelect(image)}
                                                    />
                                                }
                                                label="Seç"
                                            />
                                        }
                                    />
                                </ImageListItem>
                            ))}
                        </ImageList>
                        <Button
                            variant="contained"
                            color="error"
                            onClick={handleDeleteImages}
                            disabled={isDeleting || selectedImages.length === 0}
                            sx={{ mt: 2 }}
                        >
                            {isDeleting ? 'SİLİNİYOR...' : `SEÇİLEN RESİMLERİ SİL (${selectedImages.length})`}
                        </Button>
                        {isDeleting && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                                <CircularProgress size={24} />
                            </Box>
                        )}
                    </Box>
                </Grid>


            </Grid>
        </Container>
    );
};

export default FileManagementPage;