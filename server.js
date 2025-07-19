import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Serve static files from the dist directory
app.use(express.static('dist'));

// Serve admin.html for admin routes
app.get('/admin', (req, res) => {
  res.sendFile(resolve(__dirname, 'dist/admin/index.html'));
});

app.get('/admin/*', (req, res) => {
  res.sendFile(resolve(__dirname, 'dist/admin/index.html'));
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(resolve(__dirname, 'dist/index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 