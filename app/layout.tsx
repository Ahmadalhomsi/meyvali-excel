"use client";

import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn, ClerkLoaded } from '@clerk/nextjs';
import Layout from '../components/Layout';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useState } from 'react';
import { lightTheme, darkTheme } from '../styles/theme';
import { trTR } from '@clerk/localizations'


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
    <ClerkProvider localization={trTR}>
      <html lang="en">
        <body className={inter.className}>
          <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
            <CssBaseline />
            <Layout darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
              <Toaster position="bottom-right" />
              {/* Protect all pages */}

              <ClerkLoaded>
                <main className="min-h-screen">
                    {children}
                </main>
              </ClerkLoaded>

            </Layout>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
