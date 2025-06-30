"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { Box, CircularProgress, Typography } from '@mui/material';

interface OptimizedImageProps {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    fill?: boolean;
    sizes?: string;
    quality?: number;
    priority?: boolean;
    onClick?: (event: React.MouseEvent) => void;
    style?: React.CSSProperties;
    loading?: 'lazy' | 'eager';
    className?: string;
    placeholder?: 'blur' | 'empty';
    blurDataURL?: string;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
    src,
    alt,
    width,
    height,
    fill = false,
    sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
    quality = 75,
    priority = false,
    onClick,
    style,
    loading = 'lazy',
    className,
    placeholder = 'empty',
    blurDataURL,
}) => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    const handleLoad = () => {
        setIsLoading(false);
    };

    const handleError = () => {
        setIsLoading(false);
        setHasError(true);
    };

    if (hasError) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: width || '100%',
                    height: height || '100%',
                    backgroundColor: 'grey.200',
                    border: '1px dashed',
                    borderColor: 'grey.400',
                    borderRadius: 1,
                }}
            >
                <Typography variant="caption" color="text.secondary">
                    Resim yüklenemedi
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
            {isLoading && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 1,
                    }}
                >
                    <CircularProgress size={24} />
                </Box>
            )}
            <Image
                src={src}
                alt={alt}
                width={!fill ? width : undefined}
                height={!fill ? height : undefined}
                fill={fill}
                sizes={sizes}
                quality={quality}
                priority={priority}
                loading={loading}
                onClick={onClick}
                style={{
                    ...style,
                    opacity: isLoading ? 0.5 : 1,
                    transition: 'opacity 0.3s ease',
                }}
                className={className}
                placeholder={placeholder}
                blurDataURL={blurDataURL}
                onLoad={handleLoad}
                onError={handleError}
            />
        </Box>
    );
};

export default OptimizedImage;
