// components/Layout.tsx
import React, { useState } from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    Tabs,
    Tab,
    Box,
    useMediaQuery,
    Theme,
    IconButton,
    Drawer,
    List,
    ListItem,
    ListItemText,
    useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

import Link from 'next/link';
import { SignInButton, SignedIn, SignedOut, UserButton, useUser } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import Logo from '../public/logo.svg';
import Image from 'next/image';
import { styled } from '@mui/material/styles';


interface LayoutProps {
    children: React.ReactNode;
    darkMode: boolean;
    toggleDarkMode: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, darkMode, toggleDarkMode }) => {
    const currentPage = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);
    const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));
    const theme = useTheme();
    const { user } = useUser();


    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const isAdmin = user?.publicMetadata?.role === 'admin';

    const menuItems = [
        { label: 'Ürünler', path: '/' },
        { label: 'Ödeme', path: '/payment' },
        ...(isAdmin ? [
            { label: 'Gün sonu', path: '/endOfDay' },
            { label: 'Ayarlar', path: '/settings' },
        ] : []),
    ];

    const StyledTabs = styled(Tabs)(({ theme }) => ({
        position: 'relative',
        '& .MuiTabs-indicator': {
            left: 0,
            right: 0,
        },
    }));

    const drawer = (
        <Box
            onClick={handleDrawerToggle}
            sx={{
                textAlign: 'center',
                bgcolor: darkMode ? 'background.paper' : '#a12e32',
                color: darkMode ? 'text.primary' : 'custom.main',
                height: '100%',
            }}
        >
            <List>
                {menuItems.map((item) => (
                    <ListItem
                        key={item.path}
                        component={Link}
                        href={item.path}
                        sx={{
                            '&:hover': {
                                bgcolor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                            },
                        }}
                    >
                        <ListItemText
                            primary={item.label}
                            primaryTypographyProps={{
                                sx: {
                                    color: currentPage === item.path
                                        ? "#e9cd94"
                                        : '#d6d6d6'
                                }
                            }}
                        />
                    </ListItem>
                ))}
            </List>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <AppBar position="static">
                <Toolbar>
                    {isMobile && (
                        <IconButton
                            color="inherit"
                            aria-label="open drawer"
                            edge="start"
                            onClick={handleDrawerToggle}
                            sx={{ mr: 2 }}
                        >
                            <MenuIcon />
                        </IconButton>
                    )}
                    <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', mr: 2 }}>
                        <Image
                            src={Logo}
                            alt="App Logo"
                            width={45} // Set the width of the logo
                            height={45} // Set the height of the logo
                            priority={true} // Optional: Load this image first
                        />
                    </Box>
                    {!isMobile && (
                        <Typography variant='h5' fontWeight='bold' sx={{ flexGrow: 1, Width: '50%' }}>
                            Meyvalı Lokantası Kontrol Sistemi
                        </Typography>
                    )}
                    <IconButton sx={{ paddingRight: 1.5 }} onClick={toggleDarkMode} color="inherit">
                        {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
                    </IconButton>
                    <SignedOut>
                        <SignInButton />
                    </SignedOut>
                    <SignedIn>
                        <UserButton />
                    </SignedIn>
                </Toolbar>
                {!isMobile && (
                    <StyledTabs
                        value={menuItems.findIndex((item) => item.path === currentPage)}
                        centered
                        sx={{
                            backgroundColor: darkMode ? theme.palette.background.paper : '#852529',
                            '.MuiTabs-indicator': {
                                backgroundColor: '#e9cd94',
                                height: 3, // Adjust the height of the indicator if needed
                            },
                        }}
                    >
                        {menuItems.map((item, index) => (
                            <Tab
                                key={item.path}
                                label={item.label}
                                component={Link}
                                href={item.path}
                                sx={{
                                    color: darkMode ? '#d6d6d6' : '#ffffff',
                                    '&.Mui-selected': {
                                        color: '#e9cd94',
                                    },
                                    '&:hover': {
                                        backgroundColor: darkMode
                                            ? 'rgba(255, 255, 255, 0.08)'
                                            : 'rgba(0, 0, 0, 0.08)',
                                    },
                                }}
                            />
                        ))}
                    </StyledTabs>
                )}
            </AppBar>
            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={handleDrawerToggle}
                ModalProps={{
                    keepMounted: true,
                }}
                sx={{
                    display: { xs: 'block', sm: 'none' },
                    '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 },
                }}
            >
                {drawer}
            </Drawer>
            <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                {children}
            </Box>
        </Box>
    );
};

export default Layout;