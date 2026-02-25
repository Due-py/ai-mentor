import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';

const PORT = Number(process.env.PORT || 10000);
const DIST_DIR = join(process.cwd(), 'dist');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json; charset=utf-8'
};

const sendFile = (res, filePath) => {
  const ext = extname(filePath).toLowerCase();
  const type = MIME_TYPES[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': type });
  createReadStream(filePath).pipe(res);
};

createServer((req, res) => {
  const requestPath = (req.url || '/').split('?')[0];
  const safePath = normalize(requestPath).replace(/^(\.\.[/\\])+/, '');
  const assetPath = join(DIST_DIR, safePath === '/' ? 'index.html' : safePath);

  if (existsSync(assetPath)) {
    const stats = statSync(assetPath);
    if (stats.isFile()) {
      return sendFile(res, assetPath);
    }
  }

  const indexPath = join(DIST_DIR, 'index.html');
  if (existsSync(indexPath)) {
    return sendFile(res, indexPath);
  }

  res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('dist/index.html not found. Run "npm run build" before "npm start".');
}).listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
