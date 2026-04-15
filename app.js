/**
 * app.js - ARCHIVO DE COMPATIBILIDAD
 * 
 * La lógica de la aplicación ha sido modularizada en la carpeta /js para mejorar 
 * el mantenimiento y el rendimiento (Recomendación 5).
 * 
 * Este archivo ahora se utiliza exclusivamente como puente si es necesario,
 * pero la inicialización principal ocurre en js/init.js.
 */

console.log('Utilizando arquitectura modular en /js');

// Fallback para logout si js/auth.js no cargó
if (typeof logoutUser !== 'function') {
    window.logoutUser = function() {
        window.isLoggedIn = false;
        localStorage.removeItem('calc_authenticated');
        localStorage.removeItem('calc_last_activity');
        if (typeof showScreen === 'function') {
            showScreen('login-screen');
        } else {
            document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
            const loginScreen = document.getElementById('login-screen');
            if (loginScreen) loginScreen.classList.add('active');
        }
    };
}

// Fallback para cambiar porcentaje de diezmo
if (typeof showDiezmo !== 'function') {
    window.showDiezmo = function() {
        const actual = config.diezmoPorciento || 10;
        const nuevo = prompt(`Porcentaje actual: ${actual}%\n\nIngrese nuevo porcentaje de diezmo (0-100):`, actual);
        if (nuevo === null) return;
        const valor = parseFloat(nuevo);
        if (isNaN(valor) || valor < 0 || valor > 100) {
            alert('Valor inválido');
            return;
        }
        config.diezmoPorciento = valor;
        if (typeof saveData === 'function') saveData();
        if (typeof updateDashboard === 'function') updateDashboard();
        alert(`Diezmo actualizado a ${valor}%`);
    };
}

// Fallbacks si js/ui.js no cargó correctamente
if (typeof showScreen !== 'function') {
    window.showScreen = function(screenId) {
        const screen = document.getElementById(screenId);
        if (!screen) {
            console.error('Screen not found:', screenId);
            return;
        }
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        screen.classList.add('active');
        
        const bottomNav = document.querySelector('.bottom-nav');
        if (bottomNav) {
            bottomNav.style.display = screenId === 'login-screen' ? 'none' : '';
        }
        
        if (screenId !== 'login-screen') {
            localStorage.setItem('calc_current_screen', screenId);
        }
    };
}

if (typeof showDisenoFactura !== 'function') {
    window.showDisenoFactura = function() {
        const el = id => document.getElementById(id);
        if (el('df-encabezado')) el('df-encabezado').value = config.facturaEncabezado || '';
        if (el('df-pie')) el('df-pie').value = config.facturaPie || '¡Gracias por su preferencia!';
        if (el('df-color')) el('df-color').value = config.facturaColor || '#4CAF50';
        showScreen('diseno-factura-screen');
        // Actualizar vista previa después de que la pantalla esté visible
        setTimeout(updatePreviewFactura, 100);
    };
}

if (typeof showConfig !== 'function') {
    window.showConfig = function() {
        showScreen('config-screen');
    };
}

// Función para actualizar vista previa de factura en el diseñador
function updatePreviewFactura() {
    const encabezado = document.getElementById('df-encabezado')?.value || '';
    const pie = document.getElementById('df-pie')?.value || '¡Gracias por su compra!';
    const color = document.getElementById('df-color')?.value || '#4CAF50';
    
    const preview = document.getElementById('preview-factura');
    if (!preview) return;
    
    const nombre = config.nombre || 'Tu Negocio';
    const telefono = config.telefono || '000-000-0000';
    const redes = config.redes || '@tu_negocio';
    const slogan = config.slogan || 'Tu slogan aquí';
    
    preview.innerHTML = `
        <div style="text-align: center; border-bottom: 2px dashed ${color}; padding-bottom: 15px; margin-bottom: 15px;">
            <div style="font-size: 24px; color: ${color}; font-weight: bold; margin-bottom: 5px; text-align: center;">📄 FACTURA</div>
            <div style="font-size: 18px; font-weight: bold; text-align: center;">${nombre}</div>
            <div style="font-size: 12px; font-style: italic; color: #666; text-align: center;">"${slogan}"</div>
            <div style="font-size: 11px; margin-top: 5px; text-align: center;">Tel: ${telefono}</div>
            ${encabezado ? `<div style="font-size: 11px; color: #555; margin-top: 5px; text-align: center;">${encabezado}</div>` : ''}
            ${redes ? `<div style="font-size: 10px; color: #777; text-align: center;">${redes}</div>` : ''}
        </div>
        
        <div style="text-align: center; margin: 15px 0;">
            <div style="font-size: 12px; color: #666;">Fecha: ${new Date().toLocaleString('es-DO')}</div>
            <div style="font-size: 11px; color: #999;">Factura #001</div>
        </div>
        
        <div style="border-top: 1px dashed #ccc; border-bottom: 1px dashed #ccc; padding: 10px 0; margin: 10px 0;">
            <div style="font-weight: bold; margin-bottom: 5px;">Cliente: María García</div>
            <div style="font-size: 11px; color: #666;">Tel: 809-555-1234</div>
        </div>
        
        <div style="margin: 15px 0;">
            <div style="font-weight: bold; text-align: center; margin-bottom: 10px;">ARTÍCULOS:</div>
            <div style="display: flex; justify-content: space-between; font-size: 12px; margin: 5px 0;">
                <span>1x Vestido Rojo</span>
                <span>$850.00</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 12px; margin: 5px 0;">
                <span>1x Zapatos Negros</span>
                <span>$1,200.00</span>
            </div>
        </div>
        
        <div style="border-top: 2px solid ${color}; padding-top: 10px; margin-top: 15px;">
            <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: bold; color: ${color};">
                <span>TOTAL:</span>
                <span>$2,050.00</span>
            </div>
        </div>
        
        <div style="text-align: center; margin-top: 15px; padding-top: 10px; border-top: 2px dashed ${color};">
            ${pie.split('\n').map(line => `<div style="font-size: 11px; color: ${color}; margin: 3px 0;">${line}</div>`).join('')}
        </div>
    `;
}

window.updatePreviewFactura = updatePreviewFactura;

// ==================== MODO OSCURO ====================

function toggleDarkMode() {
    const body = document.body;
    const isDark = body.classList.toggle('dark-mode');
    
    // Guardar preferencia
    localStorage.setItem('calc_dark_mode', isDark ? 'true' : 'false');
    
    // Actualizar icono del botón
    const btn = document.getElementById('btn-dark-mode');
    if (btn) {
        btn.textContent = isDark ? '☀️' : '🌙';
        btn.style.background = isDark ? '#fff' : '#333';
        btn.style.color = isDark ? '#333' : '#fff';
    }
    
    console.log('[APP] Modo oscuro:', isDark ? 'activado' : 'desactivado');
}

// Cargar modo oscuro guardado al iniciar
function loadDarkMode() {
    const savedDark = localStorage.getItem('calc_dark_mode') === 'true';
    if (savedDark) {
        document.body.classList.add('dark-mode');
        const btn = document.getElementById('btn-dark-mode');
        if (btn) {
            btn.textContent = '☀️';
            btn.style.background = '#fff';
            btn.style.color = '#333';
        }
    }
}

window.toggleDarkMode = toggleDarkMode;
window.loadDarkMode = loadDarkMode;
