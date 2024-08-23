// app/layout.tsx
"use client";

import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { ClerkProvider } from '@clerk/nextjs';
import Layout from '../components/Layout';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useState } from 'react';
import { lightTheme, darkTheme } from '../styles/theme';

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };
  

  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
            <CssBaseline />
            <Layout darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
              <Toaster />
              {children}
            </Layout>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}