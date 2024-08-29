function getServerBaseUrl() {
    if (process.env.NODE_ENV === 'development') {
      return 'http://localhost:3000';
    } else {
      return 'http://162.19.152.156:3000';
    }
  }
  
  export const serverBaseUrl = getServerBaseUrl();