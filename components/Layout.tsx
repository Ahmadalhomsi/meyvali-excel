import React, { useState } from 'react';
import {
    AppBar,
    Toolbar,
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

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };


    const menuItems = [
        { label: 'Ürünler', path: '/' },
        { label: 'Ödeme', path: '/payment' },
        { label: 'Gün sonu', path: '/endOfDay' },
        { label: 'Ayarlar', path: '/settings' },
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

    const isSignInPage = currentPage === '/sign-in';
    const isSignUpPage = currentPage === '/sign-up';


    if (isSignInPage || isSignUpPage) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                {/* Toggle Dark Mode Button */}
                <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
                    <IconButton onClick={toggleDarkMode} color="inherit">
                        {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
                    </IconButton>
                </Box>

                {/* Centering the content */}
                <Box
                    sx={{
                        flexGrow: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: theme.palette.background.default,
                        p: 2, // padding to ensure better responsiveness on small devices
                    }}
                >
                    {/* Ensure the content is centered */}
                    <Box sx={{ textAlign: 'center', maxWidth: '400px', width: '100%' }}>
                        {children}
                    </Box>
                </Box>
            </Box>
        );
    }


    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <AppBar position="static">
                <Toolbar sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Image
                            src={Logo}
                            alt="App Logo"
                            width={55}
                            height={55}
                            priority={true}
                        />
                    </Box>
                    {!isMobile && (
                        <StyledTabs
                            value={menuItems.findIndex((item) => item.path === currentPage)}
                            sx={{
                                backgroundColor: 'transparent',
                                '.MuiTabs-indicator': {
                                    backgroundColor: '#e9cd94',
                                    height: 3,
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
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconButton sx={{ paddingRight: 1.5 }} onClick={toggleDarkMode} color="inherit">
                            {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
                        </IconButton>
                        <SignedOut>
                            <SignInButton />
                        </SignedOut>
                        <SignedIn>
                            <UserButton />
                        </SignedIn>
                    </Box>
                </Toolbar>
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