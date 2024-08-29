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
} from '@mui/material';
import axios from 'axios';
import toast from 'react-hot-toast';

const FileManagementPage = () => {
    const [isDownloading, setIsDownloading] = useState(false);
    const [isReplacing, setIsReplacing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [images, setImages] = useState([]);
    const [selectedImages, setSelectedImages] = useState<string[]>([]);

    useEffect(() => {
        fetchImages();
    }, []);

    const fetchImages = async () => {
        try {
            const response = await axios.get('/api/images');
            console.log(response.data);

            setImages(response.data.images);
        } catch (error) {
            console.error('Error fetching images:', error);
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
            console.error('Error downloading Excel file:', error);
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
                console.error('Error replacing Excel file:', error);
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
            console.error('Error deleting images:', error);
            toast.error('Resimler silinirken bir hata oluştu.');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Container>
            <Typography variant="h4" gutterBottom>
                Dosya Yönetimi
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
                            {isDownloading ? 'İndiriliyor...' : 'İndir'}
                        </Button>
                        <Button
                            variant="contained"
                            color="secondary"
                            onClick={handleReplaceExcel}
                            disabled={isReplacing}
                            sx={{ mb: 2 }}
                        >
                            {isReplacing ? 'Değiştiriliyor...' : 'Değiştir'}
                        </Button>
                        {(isDownloading || isReplacing) && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                                <CircularProgress size={24} />
                            </Box>
                        )}
                    </Box>
                </Grid>

                <Grid item xs={12}>
                    <Box sx={{ border: 1, borderColor: 'grey.300', p: 2, borderRadius: 1, mt: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Resim İşlemleri
                        </Typography>
                        <Typography variant="body2" paragraph>
                            Resimlerin konumu: public\uploads\
                        </Typography>
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
                            {isDeleting ? 'Siliniyor...' : `Seçilen Resimleri Sil (${selectedImages.length})`}
                        </Button>
                        {isDeleting && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                                <CircularProgress size={24} />
                            </Box>
                        )}
                    </Box>
                </Grid>
            </Grid>

            <Divider sx={{ my: 4 }}>İşlem Geçmişi</Divider>

            <Typography variant="body2">
                İşlem geçmişi burada görüntülenebilir.
            </Typography>
        </Container>
    );
};

export default FileManagementPage;