const express = require('express');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();

  // Serve static files from the public/uploads directory
  server.use('/uploads', express.static('public/uploads'));

  // Handle all API routes via Next.js
  server.all('/api/*', (req, res) => {
    return handle(req, res);
  });

  // Let Next.js handle all other routes
  server.all('*', (req, res) => {
    return handle(req, res);
  });

  // Catch 404 and forward to error handler
  server.use((req, res) => {
    res.status(404).send('Page not found');
  });

  server.listen(3000, (err) => {
    if (err) throw err;
    console.log('> Ready on http://localhost:3000');
  });
});

