const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.geojson': 'application/geo+json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  // Normalize path and set default index.html
  let filePath = req.url === '/' ? '/index.html' : req.url;
  
  // Clean query strings if any
  const qIndex = filePath.indexOf('?');
  if (qIndex !== -1) {
    filePath = filePath.substring(0, qIndex);
  }

  // Resolve absolute path
  const absolutePath = path.join(__dirname, filePath);
  
  // Basic security check to prevent directory traversal
  if (!absolutePath.startsWith(__dirname)) {
    res.statusCode = 403;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Forbidden');
    return;
  }

  // Check if file exists
  fs.stat(absolutePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.end('<h1>404 Not Found</h1><p>The requested file was not found on this server.</p>');
      return;
    }

    // Determine content type
    const ext = path.extname(absolutePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // Serve file
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*' // Enable CORS just in case
    });

    const stream = fs.createReadStream(absolutePath);
    stream.on('error', (streamErr) => {
      console.error('Stream error:', streamErr);
      res.statusCode = 500;
      res.end('Internal Server Error');
    });
    stream.pipe(res);
  });
});

server.listen(PORT, () => {
  console.log('===================================================');
  console.log(`BKK Smart City Dashboard Server running locally!`);
  console.log(`Open your browser and navigate to:`);
  console.log(`---> http://localhost:${PORT}`);
  console.log('===================================================');
  console.log('Press Ctrl+C to terminate the server.');
});
