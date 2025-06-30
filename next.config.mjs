/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        // Enable image optimization
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
        formats: ['image/webp', 'image/avif'],
        minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
        dangerouslyAllowSVG: true,
        contentDispositionType: 'attachment',
        contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
        // Allow images from your domain
        domains: ['localhost'],
        remotePatterns: [
            {
                protocol: 'http',
                hostname: 'localhost',
                port: '3000',
                pathname: '/uploads/**',
            },
        ],
    },
    // Enable compression
    compress: true,
    // Remove experimental features that are causing issues
    // experimental: {
    //     optimizeCss: true,
    //     optimizePackageImports: ['@mui/material', '@mui/icons-material'],
    // },
};

export default nextConfig;
