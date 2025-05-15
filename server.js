import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { createServer } from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Serve static files from the dist directory
app.use(express.static('dist'));

// Handle all routes by serving index.html
app.get('*', (req, res) => {
  // Check if the request is for the admin page
  if (req.path.startsWith('/admin')) {
    res.sendFile(resolve(__dirname, 'dist/admin/index.html'));
  } else {
    res.sendFile(resolve(__dirname, 'dist/index.html'));
  }
});

const server = createServer(app);

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 