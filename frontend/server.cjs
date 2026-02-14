const http = require('http');
const fs = require('fs');
const path = require('path');

// Validate process.env.PORT to prevent string injection (e.g. '${PORT}')
let PORT = process.env.PORT;
if (PORT && (PORT.includes('${') || isNaN(parseInt(PORT, 10)))) {
    console.warn(`WARNING: Invalid PORT environment variable detected: "${PORT}". Falling back to default.`);
    PORT = null;
}
PORT = PORT || 80;
const DIST_DIR = path.join(__dirname, 'dist');

const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm'
};

const server = http.createServer((req, res) => {
    // #comment: Added health check endpoint for Railway/Load Balancer.
    // This allows Railway to verify that the frontend container is alive and 
    // serving traffic before routing domain requests to it.
    if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'healthy', service: 'frontend' }));
        return;
    }

    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);

    let filePath = path.join(DIST_DIR, req.url === '/' ? 'index.html' : req.url);
    let originalFilePath = filePath;

    // Basic SPA routing: if file doesn't exist, serve index.html
    // We check existence later for compression handling
    if (!fs.existsSync(filePath) || (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory())) {
        filePath = path.join(DIST_DIR, 'index.html');
        originalFilePath = filePath;
    }

    const extname = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';

    // Compression Handling
    const acceptEncoding = req.headers['accept-encoding'] || '';
    let contentEncoding = null;

    if (/\.(js|css|html|svg|json|map)$/.test(filePath)) {
        if (acceptEncoding.includes('br') && fs.existsSync(filePath + '.br')) {
            filePath = filePath + '.br';
            contentEncoding = 'br';
        } else if (acceptEncoding.includes('gzip') && fs.existsSync(filePath + '.gz')) {
            filePath = filePath + '.gz';
            contentEncoding = 'gzip';
        }
    }

    // Cache Control
    const headers = { 'Content-Type': contentType };
    if (contentEncoding) {
        headers['Content-Encoding'] = contentEncoding;
    }

    // #comment: Strategic Caching Policy
    // 1. Assets (hashed): Immutable forever (1 year)
    // 2. Images/Fonts: Long cache (24h)
    // 3. HTML/JSON: No cache to ensure instant updates on deployment
    if (req.url.startsWith('/assets/')) {
        headers['Cache-Control'] = 'public, max-age=31536000, immutable';
    } else if (/\.(png|jpg|jpeg|gif|webp|svg|woff|woff2)$/.test(req.url)) {
        headers['Cache-Control'] = 'public, max-age=86400';
    } else {
        headers['Cache-Control'] = 'no-cache';
    }

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404);
                res.end('File not found');
            } else {
                res.writeHead(500);
                res.end(`Server error: ${error.code}`);
            }
        } else {
            res.writeHead(200, headers);
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`
🚀 Frontend Server is live!
-------------------------
Port: ${PORT}
Directory: ${DIST_DIR}
Binding: 0.0.0.0
Time: ${new Date().toISOString()}
-------------------------
`);
});
