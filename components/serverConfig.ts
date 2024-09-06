function getServerBaseUrl() {
    if (process.env.NODE_ENV === 'development') {
      return 'http://localhost:3000';
    } else {
      return 'https://meyvalilokantasi.com'; // http://37.148.211.114:3000
    }
  }
  
  export const serverBaseUrl = getServerBaseUrl();