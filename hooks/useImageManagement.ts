"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface UseImageManagementProps {
    imagesPerPage?: number;
    enablePagination?: boolean;
}

interface ImagePagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

interface UseImageManagementReturn {
    images: string[];
    filteredImages: string[];
    paginatedImages: string[];
    selectedImages: string[];
    currentPage: number;
    totalPages: number;
    imagesPerPage: number;
    imageFilter: string;
    isLoading: boolean;
    isDeleting: boolean;
    
    // Actions
    setCurrentPage: (page: number) => void;
    setImagesPerPage: (count: number) => void;
    setImageFilter: (filter: string) => void;
    handleImageSelect: (imageName: string) => void;
    handleSelectAll: () => void;
    handleSelectAllFiltered: () => void;
    handleClearSelection: () => void;
    handleDeleteImages: () => Promise<void>;
    fetchImages: () => Promise<void>;
    
    // Pagination
    handlePageChange: (event: unknown, page: number) => void;
    handleImagesPerPageChange: (event: any) => void;
}

export const useImageManagement = ({
    imagesPerPage: initialImagesPerPage = 24,
    enablePagination = true
}: UseImageManagementProps = {}): UseImageManagementReturn => {
    const [images, setImages] = useState<string[]>([]);
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [imagesPerPage, setImagesPerPage] = useState(initialImagesPerPage);
    const [imageFilter, setImageFilter] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Memoized filtered images for performance
    const filteredImages = useMemo(() => {
        if (!imageFilter) return images;
        return images.filter((image: string) => 
            image.toLowerCase().includes(imageFilter.toLowerCase())
        );
    }, [images, imageFilter]);

    // Memoized paginated images
    const paginatedImages = useMemo(() => {
        if (!enablePagination) return filteredImages;
        
        const startIndex = (currentPage - 1) * imagesPerPage;
        const endIndex = startIndex + imagesPerPage;
        return filteredImages.slice(startIndex, endIndex);
    }, [filteredImages, currentPage, imagesPerPage, enablePagination]);

    // Calculate total pages
    const totalPages = useMemo(() => {
        if (!enablePagination) return 1;
        return Math.ceil(filteredImages.length / imagesPerPage);
    }, [filteredImages.length, imagesPerPage, enablePagination]);

    // Reset to first page when filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [imageFilter]);

    const fetchImages = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await axios.get('/api/images?limit=1000');
            
            if (response.data.images) {
                setImages(response.data.images);
            } else {
                setImages(response.data.images || []);
            }
        } catch (error) {
            console.log('Error fetching images:', error);
            toast.error('Resimler yüklenirken bir hata oluştu.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Optimized image select handler
    const handleImageSelect = useCallback((imageName: string) => {
        setSelectedImages(prev =>
            prev.includes(imageName)
                ? prev.filter(name => name !== imageName)
                : [...prev, imageName]
        );
    }, []);

    const handleSelectAll = useCallback(() => {
        const imagesToSelect = enablePagination ? paginatedImages : filteredImages;
        setSelectedImages(prevSelected => {
            const allSelected = imagesToSelect.every(img => prevSelected.includes(img));
            if (allSelected) {
                // Deselect all from current page/view
                return prevSelected.filter(img => !imagesToSelect.includes(img));
            } else {
                // Select all from current page/view
                const newSelection = [...prevSelected];
                imagesToSelect.forEach(img => {
                    if (!newSelection.includes(img)) {
                        newSelection.push(img);
                    }
                });
                return newSelection;
            }
        });
    }, [paginatedImages, filteredImages, enablePagination]);

    const handleSelectAllFiltered = useCallback(() => {
        setSelectedImages(filteredImages);
    }, [filteredImages]);

    const handleClearSelection = useCallback(() => {
        setSelectedImages([]);
    }, []);

    const handleDeleteImages = useCallback(async () => {
        if (selectedImages.length === 0) {
            toast.error('Lütfen silinecek resimleri seçin.');
            return;
        }

        setIsDeleting(true);
        try {
            const response = await axios.post('/api/images', { images: selectedImages });
            
            if (response.status === 207) {
                // Partial success
                const { deletedImages, failedImages } = response.data;
                toast.success(`${deletedImages.length} resim silindi.`);
                if (failedImages.length > 0) {
                    toast.error(`${failedImages.length} resim silinemedi.`);
                }
            } else {
                toast.success('Seçilen resimler başarıyla silindi.');
            }
            
            await fetchImages(); // Refresh the image list
            setSelectedImages([]);
        } catch (error) {
            console.log('Error deleting images:', error);
            toast.error('Resimler silinirken bir hata oluştu.');
        } finally {
            setIsDeleting(false);
        }
    }, [selectedImages, fetchImages]);

    const handlePageChange = useCallback((event: unknown, page: number) => {
        setCurrentPage(page);
    }, []);

    const handleImagesPerPageChange = useCallback((event: any) => {
        setImagesPerPage(event.target.value);
        setCurrentPage(1);
    }, []);

    return {
        images,
        filteredImages,
        paginatedImages,
        selectedImages,
        currentPage,
        totalPages,
        imagesPerPage,
        imageFilter,
        isLoading,
        isDeleting,
        
        setCurrentPage,
        setImagesPerPage,
        setImageFilter,
        handleImageSelect,
        handleSelectAll,
        handleSelectAllFiltered,
        handleClearSelection,
        handleDeleteImages,
        fetchImages,
        handlePageChange,
        handleImagesPerPageChange,
    };
};
