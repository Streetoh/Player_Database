const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const server = http.createServer((req, res) => {
  // Manejo de API para persistencia directa en disco
  if (req.method === 'POST' && req.url.startsWith('/api/')) {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const dbFile = path.join(DATA_DIR, 'database.json');
        let currentDb = {};
        if (fs.existsSync(dbFile)) {
          try { currentDb = JSON.parse(fs.readFileSync(dbFile, 'utf8')); } catch (e) {}
        }

        if (req.url === '/api/save-players') {
          currentDb.players = payload.players;
          currentDb.updatedAt = new Date().toISOString();
          fs.writeFileSync(dbFile, JSON.stringify(currentDb, null, 2), 'utf8');
          console.log(`[API] Guardados ${payload.players?.length || 0} jugadores en data/database.json`);
        } else if (req.url === '/api/save-teams') {
          currentDb.teams = payload.teams;
          currentDb.updatedAt = new Date().toISOString();
          fs.writeFileSync(dbFile, JSON.stringify(currentDb, null, 2), 'utf8');
          console.log(`[API] Guardados ${payload.teams?.length || 0} equipos en data/database.json`);
        }

        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ ok: true }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
  
  const filePath = path.join(__dirname, reqPath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 
      'Content-Type': mime,
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` Servidor local JK Noova activo en: http://localhost:${PORT}/`);
  console.log(`=======================================================`);
});
