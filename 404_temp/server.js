const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4'
};

const server = http.createServer((req, res) => {
  // Parse URL
  let parsedUrl = req.url.split('?')[0];
  
  // If requesting root, default to first.html
  if (parsedUrl === '/') {
    parsedUrl = '/first.html';
  }

  const filePath = path.join(__dirname, parsedUrl);
  const ext = path.extname(filePath).toLowerCase();

  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      // File does not exist, serve 404.html with 404 status code
      const errorPagePath = path.join(__dirname, '404.html');
      fs.readFile(errorPagePath, (err404, content404) => {
        if (err404) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404 Page Not Found');
        } else {
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end(content404);
        }
      });
    } else {
      // File exists, serve it
      fs.readFile(filePath, (readErr, content) => {
        if (readErr) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Internal Server Error');
        } else {
          const contentType = MIME_TYPES[ext] || 'application/octet-stream';
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(content);
        }
      });
    }
  });
});

server.listen(PORT, () => {
  console.log(`JDSS Services running at http://localhost:${PORT}`);
});
