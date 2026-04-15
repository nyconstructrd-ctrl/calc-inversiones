// js/globals.js
// Variables globales y utilidades básicas

var config = {
    costoPorLibra: 150,
    tasaCambio: 58.50,
    publicidadMensual: 2000,
    diezmoPorciento: 10,
    nombre: 'Chic Divine',
    telefono: '829-510-1202',
    redes: 'www.instagram.com/chicdiv_',
    slogan: 'ELEGANCIA DIVINA',
    email: '',
    facturaEncabezado: '',
    facturaPie: '',
    gastos: []
};

// Arrays de datos
var compras = [];
var ventas = [];
var inventario = [];
var articulosSeleccionados = [];

// Utilidades de conversión y formateo
function safeParseFloat(value, defaultValue = 0) {
    if (value === null || value === undefined || value === '') return defaultValue;
    const num = parseFloat(value);
    return isNaN(num) ? defaultValue : num;
}

function safeParseInt(value, defaultValue = 0) {
    if (value === null || value === undefined || value === '') return defaultValue;
    const num = parseInt(value, 10);
    return isNaN(num) ? defaultValue : num;
}

function formatCurrency(num) {
    return 'RD$ ' + parseFloat(num || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
}

function formatUSD(num) {
    return '$' + parseFloat(num || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' USD';
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('es-DO');
}

function sanitizeHTML(text) {
    if (text === null || text === undefined) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

// Persistencia
function loadData() {
    try {
        const cfg = localStorage.getItem('calc_config');
        const com = localStorage.getItem('calc_compras');
        const ven = localStorage.getItem('calc_ventas');
        const inv = localStorage.getItem('calc_inventario');
        if (cfg) config = JSON.parse(cfg);
        if (com) compras = JSON.parse(com);
        if (ven) ventas = JSON.parse(ven);
        if (inv) inventario = JSON.parse(inv);
        
        console.log('Datos cargados exitosamente');
    } catch (e) {
        console.error('Error al cargar datos:', e);
    }
}

function saveData() {
    try {
        localStorage.setItem('calc_config', JSON.stringify(config));
        localStorage.setItem('calc_compras', JSON.stringify(compras));
        localStorage.setItem('calc_ventas', JSON.stringify(ventas));
        localStorage.setItem('calc_inventario', JSON.stringify(inventario));
    } catch (e) {
        console.error('Error al guardar datos:', e);
    }
}

// Reset total - Borra TODOS los datos y pone todo en 0
function resetAllData() {
    // Primera confirmación
    if (!confirm('⚠️ ¿ESTÁS SEGURA?\n\nEsto borrará TODO:\n• Inventario completo\n• Todas las ventas\n• Todas las compras\n• Todos los gastos\n• Historial y reportes\n\n¡Esta acción NO se puede deshacer!')) {
        return;
    }
    
    // Segunda confirmación - escribir BORRAR
    const confirmText = prompt('🔴 ÚLTIMA OPORTUNIDAD\n\nEscribe BORRAR para confirmar el reset total:');
    if (confirmText !== 'BORRAR') {
        alert('❌ Reset cancelado. No escribiste BORRAR.');
        return;
    }
    
    try {
        // Guardar contraseña y config del comercio antes de borrar
        const savedPassword = localStorage.getItem('calc_app_password');
        const savedConfig = {
            nombre: config.nombre || '',
            telefono: config.telefono || '',
            redes: config.redes || '',
            slogan: config.slogan || '',
            email: config.email || '',
            facturaEncabezado: config.facturaEncabezado || '',
            facturaPie: config.facturaPie || '',
            facturaColor: config.facturaColor || '#4CAF50',
            diezmoPorciento: config.diezmoPorciento || 10,
            tasaCambio: config.tasaCambio || 0,
            costoPorLibra: config.costoPorLibra || 150
        };
        
        // Limpiar arrays
        compras = [];
        ventas = [];
        inventario = [];
        articulosSeleccionados = [];
        
        // Resetear config pero mantener datos del comercio
        config = {
            ...savedConfig,
            publicidadMensual: 0,
            gastos: []
        };
        
        // Limpiar localStorage
        localStorage.removeItem('calc_config');
        localStorage.removeItem('calc_compras');
        localStorage.removeItem('calc_ventas');
        localStorage.removeItem('calc_inventario');
        localStorage.removeItem('calc_consolidaciones');
        localStorage.removeItem('calc_ultima_consolidacion');
        localStorage.removeItem('calc_factura_contador');
        
        // Restaurar contraseña
        if (savedPassword) {
            localStorage.setItem('calc_app_password', savedPassword);
        }
        
        // Guardar datos vacíos
        saveData();
        
        // Actualizar dashboard
        if (typeof updateDashboard === 'function') updateDashboard();
        
        alert('✅ Reset completo.\n\nTodos los datos han sido borrados.\nLa contraseña se mantuvo igual.');
        
        // Volver al inicio
        if (typeof showHome === 'function') showHome();
        
        console.log('[APP] 🔴 RESET TOTAL ejecutado');
    } catch (e) {
        console.error('Error en reset:', e);
        alert('❌ Error al resetear: ' + e.message);
    }
}

// Inicialización de la ventana con las funciones necesarias
window.formatCurrency = formatCurrency;
window.formatUSD = formatUSD;
window.formatDate = formatDate;
window.sanitizeHTML = sanitizeHTML;
window.saveData = saveData;
window.loadData = loadData;
window.resetAllData = resetAllData;
