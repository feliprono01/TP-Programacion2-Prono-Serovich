/**
 * Lana & Lino — Servidor de desarrollo
 * - Sirve el frontend estático desde /frontend en el puerto 3000
 * - Hace de PROXY para /api/* → redirige al backend en :4000
 *   (evita errores de CORS sin modificar el backend)
 * Uso: node server.js
 */

const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');

const PORT         = 3000;
const BACKEND_PORT = 4000;
const BACKEND_HOST = 'localhost';
const FRONTEND_DIR = path.join(__dirname, 'frontend');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css' : 'text/css; charset=utf-8',
  '.js'  : 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png' : 'image/png',
  '.jpg' : 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif' : 'image/gif',
  '.svg' : 'image/svg+xml',
  '.ico' : 'image/x-icon',
  '.webp': 'image/webp',
};

const server = http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0];

  // ── PROXY: reenviar /api/* al backend ──────────────────────────
  if (urlPath.startsWith('/api')) {
    const options = {
      hostname: BACKEND_HOST,
      port    : BACKEND_PORT,
      path    : req.url,   // incluye query string
      method  : req.method,
      headers : { ...req.headers, host: `${BACKEND_HOST}:${BACKEND_PORT}` },
    };

    const proxy = http.request(options, (backendRes) => {
      // Agregar CORS headers en la respuesta del proxy
      res.writeHead(backendRes.statusCode, {
        ...backendRes.headers,
        'Access-Control-Allow-Origin' : '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      });
      backendRes.pipe(res);
    });

    proxy.on('error', () => {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ codigo: -1, mensaje: 'Backend no disponible. Verificá que esté corriendo en el puerto 4000.' }));
    });

    req.pipe(proxy);
    return;
  }

  // ── OPTIONS preflight ──────────────────────────────────────────
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin' : '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    res.end();
    return;
  }

  // ── ESTÁTICO: servir archivos del frontend ─────────────────────
  let filePath = path.join(FRONTEND_DIR, urlPath === '/' ? '/index.html' : urlPath);

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      // Fallback a index.html
      filePath = path.join(FRONTEND_DIR, 'index.html');
      fs.readFile(filePath, (e, data) => {
        if (e) { res.writeHead(404); res.end('404'); return; }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(data);
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (e, data) => {
      if (e) { res.writeHead(500); res.end('500'); return; }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
  });
});

server.listen(PORT, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════════╗');
  console.log('  ║      Lana & Lino — Servidor Local        ║');
  console.log('  ╠══════════════════════════════════════════╣');
  console.log(`  ║  Frontend  →  http://localhost:${PORT}     ║`);
  console.log(`  ║  Backend   →  http://localhost:${BACKEND_PORT} (proxy) ║`);
  console.log('  ╚══════════════════════════════════════════╝');
  console.log('');
  console.log('  Abrí http://localhost:3000 en tu navegador.');
  console.log('');
});
