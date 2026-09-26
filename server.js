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

let ocrWorkerPromise = null;
async function getOcrWorker() {
  if (!ocrWorkerPromise) {
    try {
      const { createWorker } = require('tesseract.js');
      ocrWorkerPromise = createWorker('eng');
    } catch (e) {
      console.warn('[OCR] tesseract.js no disponible en server:', e.message);
      return null;
    }
  }
  return ocrWorkerPromise;
}

const ocrParser = require('./js/ocr-parser.js');

const server = http.createServer((req, res) => {
  // Manejo de API para persistencia directa en disco y OCR
  if (req.url.startsWith('/api/')) {
    const dbFile = path.join(DATA_DIR, 'database.json');
    if (req.method === 'GET' && req.url === '/api/load-all') {
      let currentDb = {};
      if (fs.existsSync(dbFile)) {
        try { currentDb = JSON.parse(fs.readFileSync(dbFile, 'utf8')); } catch (e) {}
      }
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify({ ok: true, data: currentDb }));
      return;
    }

    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const payload = JSON.parse(body || '{}');
          let currentDb = {};
          if (fs.existsSync(dbFile)) {
            try { currentDb = JSON.parse(fs.readFileSync(dbFile, 'utf8')); } catch (e) {}
          }

          if (req.url === '/api/save-all') {
            currentDb = { ...currentDb, ...payload, updatedAt: new Date().toISOString() };
            fs.writeFileSync(dbFile, JSON.stringify(currentDb, null, 2), 'utf8');
            console.log(`[API] Base de datos completa guardada en data/database.json`);
          } else if (req.url === '/api/save-players') {
            currentDb.players = payload.players;
            currentDb.updatedAt = new Date().toISOString();
            fs.writeFileSync(dbFile, JSON.stringify(currentDb, null, 2), 'utf8');
            console.log(`[API] Guardados ${payload.players?.length || 0} jugadores en data/database.json`);
          } else if (req.url === '/api/save-teams') {
            currentDb.teams = payload.teams;
            currentDb.updatedAt = new Date().toISOString();
            fs.writeFileSync(dbFile, JSON.stringify(currentDb, null, 2), 'utf8');
            console.log(`[API] Guardados ${payload.teams?.length || 0} equipos en data/database.json`);
          } else if (req.url === '/api/save-attendance') {
            currentDb.attendance = payload.attendance;
            currentDb.updatedAt = new Date().toISOString();
            fs.writeFileSync(dbFile, JSON.stringify(currentDb, null, 2), 'utf8');
            console.log(`[API] Guardada asistencia en data/database.json`);
          } else if (req.url === '/api/save-trainings') {
            currentDb.trainings = payload.trainings;
            currentDb.updatedAt = new Date().toISOString();
            fs.writeFileSync(dbFile, JSON.stringify(currentDb, null, 2), 'utf8');
            console.log(`[API] Guardados ${payload.trainings?.length || 0} entrenamientos en data/database.json`);
          } else if (req.url === '/api/save-events') {
            currentDb.events = payload.events;
            currentDb.updatedAt = new Date().toISOString();
            fs.writeFileSync(dbFile, JSON.stringify(currentDb, null, 2), 'utf8');
            console.log(`[API] Guardados ${payload.events?.length || 0} partidos/torneos en data/database.json`);
          } else if (req.url === '/api/save-transport') {
            currentDb.transport = payload.transport;
            currentDb.updatedAt = new Date().toISOString();
            fs.writeFileSync(dbFile, JSON.stringify(currentDb, null, 2), 'utf8');
            console.log(`[API] Guardada configuración de transporte en data/database.json`);
          } else if (req.url === '/api/save-vans') {
            currentDb.vans = payload.vans;
            currentDb.updatedAt = new Date().toISOString();
            fs.writeFileSync(dbFile, JSON.stringify(currentDb, null, 2), 'utf8');
            console.log(`[API] Guardados ${payload.vans?.length || 0} vehículos de flota en data/database.json`);
          } else if (req.url === '/api/save-locations') {
            currentDb.savedLocations = payload.savedLocations;
            currentDb.updatedAt = new Date().toISOString();
            fs.writeFileSync(dbFile, JSON.stringify(currentDb, null, 2), 'utf8');
            console.log(`[API] Guardadas ubicaciones en data/database.json`);
          } else if (req.url === '/api/ocr-extract') {
            const imageBase64 = payload.image;
            const headerBase64 = payload.headerImage;
            const teams = payload.teams || [];
            if (!imageBase64) {
              res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
              res.end(JSON.stringify({ ok: false, error: 'No image provided' }));
              return;
            }

            const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
            const buffer = Buffer.from(cleanBase64, 'base64');

            (async () => {
              try {
                const worker = await getOcrWorker();
                if (!worker) {
                  res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
                  res.end(JSON.stringify({ ok: false, error: 'Tesseract worker not initialized' }));
                  return;
                }
                const ret = await worker.recognize(buffer);
                let rawText = ret.data.text || '';
                let extracted = ocrParser.parseProfileScreenshot(rawText, teams);

                // Si el nombre no fue detectado en la imagen completa y disponemos del recorte de cabecera
                if ((!extracted.name || !extracted.lastName) && headerBase64) {
                  try {
                    const cleanHeader = headerBase64.replace(/^data:image\/\w+;base64,/, '');
                    const headerBuf = Buffer.from(cleanHeader, 'base64');
                    const hRet = await worker.recognize(headerBuf);
                    const hText = hRet.data.text || '';
                    if (hText.trim().length > 0) {
                      rawText = hText + '\n' + rawText;
                      extracted = ocrParser.parseProfileScreenshot(rawText, teams);
                    }
                  } catch (hErr) {
                    console.warn('[OCR Header Crop Warn]', hErr.message);
                  }
                }

                res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
                res.end(JSON.stringify({ ok: true, data: extracted, rawText }));
              } catch (ocrErr) {
                console.error('[OCR Error]', ocrErr);
                res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
                res.end(JSON.stringify({ ok: false, error: ocrErr.message }));
              }
            })();
            return;
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
