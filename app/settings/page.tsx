"use client"

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
    Pagination,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
} from '@mui/material';
import Image from 'next/image';
import OptimizedImage from '../../components/OptimizedImage';
import { useImageManagement } from '../../hooks/useImageManagement';
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
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [isUpdatingDates, setIsUpdatingDates] = useState(false);
    
    // Use the optimized image management hook
    const {
        images,
        filteredImages,
        paginatedImages,
        selectedImages,
        currentPage,
        totalPages,
        imagesPerPage,
        imageFilter,
        isLoading: isLoadingImages,
        isDeleting,
        setImageFilter,
        handleImageSelect,
        handleSelectAll,
        handleSelectAllFiltered,
        handleClearSelection,
        handleDeleteImages,
        fetchImages,
        handlePageChange,
        handleImagesPerPageChange,
    } = useImageManagement({ imagesPerPage: 24 });

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
    }, [fetchImages]);

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

    const handleImageClick = useCallback((image: string, event: React.MouseEvent) => {
        // Prevent the click from triggering the checkbox
        event.stopPropagation();
        // Open the image in a new tab
        window.open(`/uploads/${image}`, '_blank');
    }, []);


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
                            RESİM İŞLEMLERİ ({filteredImages.length} resim)
                        </Typography>
                        <Typography variant="body2" paragraph>
                            Resimlerin konumu: public\uploads\
                        </Typography>
                        
                        {/* Filter and Controls */}
                        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                            <TextField
                                label="Resim Ara"
                                value={imageFilter}
                                onChange={(e) => setImageFilter(e.target.value)}
                                size="small"
                                sx={{ minWidth: 200 }}
                            />
                            
                            <FormControl size="small" sx={{ minWidth: 120 }}>
                                <InputLabel>Sayfa Başına</InputLabel>
                                <Select
                                    value={imagesPerPage}
                                    onChange={handleImagesPerPageChange}
                                    label="Sayfa Başına"
                                >
                                    <MenuItem value={12}>12</MenuItem>
                                    <MenuItem value={24}>24</MenuItem>
                                    <MenuItem value={48}>48</MenuItem>
                                    <MenuItem value={96}>96</MenuItem>
                                </Select>
                            </FormControl>
                            
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button size="small" onClick={handleSelectAllFiltered}>
                                    Tümünü Seç ({filteredImages.length})
                                </Button>
                                <Button size="small" onClick={handleClearSelection}>
                                    Seçimi Temizle
                                </Button>
                            </Box>
                        </Box>

                        {/* Selection Info */}
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                                {selectedImages.length} resim seçili
                                {filteredImages.length !== images.length && ` (${filteredImages.length}/${images.length} resim gösteriliyor)`}
                            </Typography>
                        </Box>

                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={selectedImages.length === paginatedImages.length && paginatedImages.length > 0}
                                    onChange={handleSelectAll}
                                    indeterminate={selectedImages.length > 0 && selectedImages.length < paginatedImages.length}
                                />
                            }
                            label="Bu Sayfadaki Tümü"
                        />

                        {/* Loading State */}
                        {isLoadingImages ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            <>
                                {/* Optimized Image Grid */}
                                <ImageList sx={{ width: '100%', height: 450 }} cols={6} rowHeight={100}>
                                    {paginatedImages.map((image: string) => (
                                        <ImageListItem key={image}>
                                            <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
                                                <OptimizedImage
                                                    src={`/uploads/${image}`}
                                                    alt={image}
                                                    fill
                                                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 16vw"
                                                    style={{
                                                        objectFit: 'cover',
                                                        cursor: 'pointer',
                                                        opacity: selectedImages.includes(image) ? 0.5 : 1,
                                                    }}
                                                    onClick={(event) => handleImageClick(image, event)}
                                                    loading="lazy"
                                                    quality={60}
                                                />
                                            </Box>
                                            <ImageListItemBar
                                                title={image}
                                                actionIcon={
                                                    <Checkbox
                                                        checked={selectedImages.includes(image)}
                                                        onChange={(e) => {
                                                            e.stopPropagation();
                                                            handleImageSelect(image);
                                                        }}
                                                        sx={{ color: 'rgba(255, 255, 255, 0.54)' }}
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                }
                                                sx={{
                                                    '.MuiImageListItemBar-title': {
                                                        fontSize: '0.7rem',
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis'
                                                    }
                                                }}
                                            />
                                        </ImageListItem>
                                    ))}
                                </ImageList>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                                        <Pagination
                                            count={totalPages}
                                            page={currentPage}
                                            onChange={handlePageChange}
                                            color="primary"
                                            showFirstButton
                                            showLastButton
                                        />
                                    </Box>
                                )}
                            </>
                        )}
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