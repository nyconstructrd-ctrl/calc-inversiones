const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const USERS_FILE = path.join(__dirname, 'usuarios.json');

// Leer usuarios del archivo
function leerUsuarios() {
    try {
        if (fs.existsSync(USERS_FILE)) {
            const data = fs.readFileSync(USERS_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (e) {
        console.error('Error leyendo usuarios:', e);
    }
    return [];
}

// Guardar usuarios al archivo
function guardarUsuarios(usuarios) {
    try {
        fs.writeFileSync(USERS_FILE, JSON.stringify(usuarios, null, 2));
        return true;
    } catch (e) {
        console.error('Error guardando usuarios:', e);
        return false;
    }
}

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    // Headers CORS más seguros - solo permitir localhost
    const allowedOrigins = ['http://localhost:5000', 'http://127.0.0.1:5000', 'http://192.168.1.7:5000'];
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    // API Endpoint: GET /api/usuarios
    if (pathname === '/api/usuarios' && req.method === 'GET') {
        const usuarios = leerUsuarios();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(usuarios));
        return;
    }
    
    // API Endpoint: POST /api/usuarios
    if (pathname === '/api/usuarios' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk;
            // Limitar tamaño del body a 1MB
            if (body.length > 1024 * 1024) {
                res.writeHead(413);
                res.end(JSON.stringify({ error: 'Payload too large' }));
                req.destroy();
                return;
            }
        });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                // Validar que sea un array
                if (!Array.isArray(data)) {
                    res.writeHead(400);
                    res.end(JSON.stringify({ error: 'Data must be an array' }));
                    return;
                }
                // Validar estructura básica de usuarios
                for (const user of data) {
                    if (!user.nombre || typeof user.nombre !== 'string') {
                        res.writeHead(400);
                        res.end(JSON.stringify({ error: 'Invalid user data' }));
                        return;
                    }
                }
                if (guardarUsuarios(data)) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true }));
                } else {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'No se pudo guardar' }));
                }
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Datos inválidos' }));
            }
        });
        return;
    }
    
    // Servir archivos estáticos con validación de seguridad
    let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);

    // Validar que la ruta no salga del directorio del proyecto
    const resolvedPath = path.resolve(filePath);
    const rootPath = path.resolve(__dirname);
    if (!resolvedPath.startsWith(rootPath)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    // Validar que el archivo solicitado sea de un tipo permitido
    const ext = path.extname(filePath);
    const allowedExtensions = ['.html', '.js', '.css', '.json', '.png', '.jpg', '.jpeg', '.ico', '.svg', '.woff', '.woff2'];
    if (!allowedExtensions.includes(ext) && pathname !== '/') {
        res.writeHead(403);
        res.end('Forbidden file type');
        return;
    }

    const contentTypes = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.ico': 'image/x-icon',
        '.svg': 'image/svg+xml',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2'
    };

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404);
                res.end('File not found');
            } else {
                res.writeHead(500);
                res.end('Internal server error');
            }
            return;
        }
        res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'text/plain' });
        res.end(content);
    });
});

server.listen(5000, '0.0.0.0', () => {
    console.log('Server running on http://localhost:5000');
    console.log('Also available on http://192.168.1.7:5000');
});
