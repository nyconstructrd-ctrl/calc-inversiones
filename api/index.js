const fs = require('fs');
const path = require('path');
const url = require('url');

const USERS_FILE = path.join(__dirname, '..', 'usuarios.json');

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

// Función principal para Vercel
module.exports = async (req, res) => {
    // Headers CORS más seguros
    const allowedOrigins = [
        'http://localhost:5000',
        'http://127.0.0.1:5000',
        'https://calc-inversiones.vercel.app',
        'https://calc-inversiones-nyconstructrd-ctrl.vercel.app'
    ];
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname.replace('/api', ''); // Remover /api del path

    try {
        // API endpoints
        if (pathname === '/usuarios' && req.method === 'GET') {
            const usuarios = leerUsuarios();
            res.setHeader('Content-Type', 'application/json');
            res.status(200).json(usuarios);
            return;
        }

        if (pathname === '/usuarios' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });

            req.on('end', () => {
                try {
                    const usuarios = JSON.parse(body);

                    // Validación básica
                    if (!Array.isArray(usuarios)) {
                        res.status(400).json({ error: 'Datos inválidos - se esperaba array' });
                        return;
                    }

                    // Validar estructura de cada usuario
                    for (const usuario of usuarios) {
                        if (typeof usuario.nombre !== 'string' || typeof usuario.password !== 'string') {
                            res.status(400).json({ error: 'Estructura de usuario inválida' });
                            return;
                        }
                    }

                    if (guardarUsuarios(usuarios)) {
                        res.status(200).json({ success: true });
                    } else {
                        res.status(500).json({ error: 'Error guardando usuarios' });
                    }
                } catch (e) {
                    res.status(400).json({ error: 'JSON inválido' });
                }
            });
            return;
        }

        // Servir archivos estáticos
        let filePath = path.join(__dirname, '..', pathname === '/' ? 'index.html' : pathname);

        // Validar path para prevenir directory traversal
        const resolvedPath = path.resolve(filePath);
        const rootPath = path.resolve(__dirname, '..');
        if (!resolvedPath.startsWith(rootPath)) {
            res.status(403).json({ error: 'Acceso denegado' });
            return;
        }

        // Tipos de archivo permitidos
        const allowedExtensions = ['.html', '.css', '.js', '.json', '.png', '.jpg', '.jpeg', '.ico', '.svg', '.woff', '.woff2'];
        const ext = path.extname(filePath).toLowerCase();

        if (!allowedExtensions.includes(ext) && pathname !== '/') {
            res.status(403).json({ error: 'Tipo de archivo no permitido' });
            return;
        }

        // Intentar servir el archivo
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            const contentType = {
                '.html': 'text/html',
                '.css': 'text/css',
                '.js': 'application/javascript',
                '.json': 'application/json',
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.ico': 'image/x-icon',
                '.svg': 'image/svg+xml',
                '.woff': 'font/woff',
                '.woff2': 'font/woff2'
            }[ext] || 'text/plain';

            const content = fs.readFileSync(filePath);
            res.setHeader('Content-Type', contentType);
            res.status(200).send(content);
            return;
        }

        // Si no es un archivo específico, servir index.html (SPA)
        if (pathname !== '/api/usuarios') {
            const indexPath = path.join(__dirname, '..', 'index.html');
            if (fs.existsSync(indexPath)) {
                const content = fs.readFileSync(indexPath);
                res.setHeader('Content-Type', 'text/html');
                res.status(200).send(content);
                return;
            }
        }

        // 404
        res.status(404).json({ error: 'Archivo no encontrado' });

    } catch (error) {
        console.error('Error en servidor:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};