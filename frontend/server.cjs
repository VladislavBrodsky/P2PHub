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
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);

    let filePath = path.join(DIST_DIR, req.url === '/' ? 'index.html' : req.url);

    // Basic SPA routing: if file doesn't exist, serve index.html
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(DIST_DIR, 'index.html');
    }

    const extname = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';

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
            res.writeHead(200, { 'Content-Type': contentType });
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
