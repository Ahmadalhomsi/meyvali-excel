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
import { usePathname } from 'next/navigation';

const inter = Inter({ subsets: ["latin"] });

// List of public routes (pages that don't require authentication)
const publicPages = ['/sign-in', '/sign-up'];


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [darkMode, setDarkMode] = useState(false);
  const pathname = usePathname();


  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };


  const isPublicPage = publicPages.includes(pathname);

  return (
    <ClerkProvider localization={trTR}>
      <html lang="en">
        <body className={inter.className}>
          <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
            <CssBaseline />
            <Layout darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
              <Toaster position="bottom-right" />
              {isPublicPage ? (
                children
              ) : (
                <>
                  <SignedIn>{children}</SignedIn>
                  <SignedOut>
                    <RedirectToSignIn />
                  </SignedOut>
                </>
              )}
            </Layout>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
