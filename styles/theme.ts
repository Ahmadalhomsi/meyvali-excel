// styles/theme.ts
import { createTheme, Theme } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    custom: {
      main: string;
      light: string;
    };
  }
  interface PaletteOptions {
    custom: {
      main: string;
      light: string;
    };
  }
}

const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#a12e32',
    },
    secondary: {
      main: '#e9cd94',
    },
    custom: {
      main: '#a12e32',
      light: '#e9cd94',
    },
    background: {
      default: '#ffffff',
      paper: '#f5f5f5',
    },
  },
});

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#e9cd94',
    },
    secondary: {
      main: '#a12e32',
    },
    custom: {
      main: '#e9cd94',
      light: '#a12e32',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
});

export { lightTheme, darkTheme };