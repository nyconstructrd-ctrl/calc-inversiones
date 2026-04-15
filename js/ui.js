// js/ui.js
// Navegación y gestión de la interfaz de usuario

function showScreen(screenId) {
    const screen = document.getElementById(screenId);
    if (!screen) {
        console.error('Screen not found:', screenId);
        return;
    }
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    screen.classList.add('active');
    
    // Gestión de barra de navegación
    const bottomNav = document.querySelector('.bottom-nav');
    if (bottomNav) {
        bottomNav.style.display = screenId === 'login-screen' ? 'none' : '';
    }
    
    // Activar botón de nav correspondiente
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    const navButtons = {
        'home-screen': 'nav-home',
        'config-screen': 'nav-config',
        'shopping-screen': 'nav-shopping',
        'sales-screen': 'nav-sales',
        'history-screen': 'nav-history',
        'help-screen': 'nav-help'
    };
    
    const navId = navButtons[screenId];
    if (navId) {
        const navBtn = document.getElementById(navId);
        if (navBtn) navBtn.classList.add('active');
    }
    
    if (screenId !== 'login-screen') {
        localStorage.setItem('calc_current_screen', screenId);
    }
}

function showHome() {
    loadData();
    updateDashboard();
    showScreen('home-screen');
}

function showConfig() {
    loadConfigForm();
    showScreen('config-screen');
}

function showShopping() {
    loadShoppingForm();
    renderComprasList();
    showScreen('shopping-screen');
}

function showSales() {
    renderVentasList();
    showScreen('sales-screen');
}

function showHistory() {
    loadHistoryMonths();
    showScreen('history-screen');
    if (typeof renderCharts === 'function') renderCharts();
}

function showHelp() {
    showScreen('help-screen');
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
            <div style="font-size: 24px; color: ${color}; font-weight: bold; margin-bottom: 5px;">📄 FACTURA</div>
            <div style="font-size: 18px; font-weight: bold;">${nombre}</div>
            <div style="font-size: 12px; font-style: italic; color: #666;">"${slogan}"</div>
            <div style="font-size: 11px; margin-top: 5px;">Tel: ${telefono}</div>
            ${encabezado ? `<div style="font-size: 11px; color: #555; margin-top: 5px;">${encabezado}</div>` : ''}
            ${redes ? `<div style="font-size: 10px; color: #777;">${redes}</div>` : ''}
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

function showDisenoFactura() {
    // Cargar valores actuales en el formulario
    const el = id => document.getElementById(id);
    if (el('df-encabezado')) el('df-encabezado').value = config.facturaEncabezado || '';
    if (el('df-pie'))        el('df-pie').value        = config.facturaPie || '¡Gracias por su preferencia!';
    if (el('df-color'))     el('df-color').value      = config.facturaColor || '#4CAF50';
    showScreen('diseno-factura-screen');
    // Actualizar vista previa
    setTimeout(updatePreviewFactura, 100);
}

function saveDisenoFactura() {
    config.facturaEncabezado = document.getElementById('df-encabezado')?.value.trim() || '';
    config.facturaPie        = document.getElementById('df-pie')?.value.trim() || '';
    config.facturaColor      = document.getElementById('df-color')?.value || '#4CAF50';
    saveData();
    alert('\u2705 Diseño guardado correctamente');
    showConfig();
}

function loadConfigForm() {
    document.getElementById('config-nombre').value = config.nombre || '';
    document.getElementById('config-telefono').value = config.telefono || '';
    document.getElementById('config-redes').value = config.redes || '';
    document.getElementById('config-slogan').value = config.slogan || '';
    document.getElementById('config-email').value = config.email || '';
}

function saveConfig() {
    config.nombre = document.getElementById('config-nombre').value.trim();
    config.telefono = document.getElementById('config-telefono').value.trim();
    config.redes = document.getElementById('config-redes').value.trim();
    config.slogan = document.getElementById('config-slogan').value.trim();
    config.email = document.getElementById('config-email').value.trim();
    saveData();
    alert('Configuración guardada');
    showHome();
}

// Inicialización del Dashboard
function updateDashboard() {
    // CALCULOS SOLO DE ITEMS NO CONSOLIDADOS
    const ventasActivas = ventas.filter(v => !v.consolidado);
    const comprasActivas = compras.filter(c => !c.consolidado);
    const gastosActivos = (config.gastos || []).filter(g => !g.consolidado);

    const ventasTotales = ventasActivas.reduce((sum, v) => sum + (v.totalVenta || 0), 0);
    const gananciaBrutaActiva = ventasActivas.reduce((sum, v) => {
        return sum + (v.ganancia || (v.precioVenta * 0.4)); 
    }, 0);

    const inversionActiva = comprasActivas.reduce((sum, c) => sum + (c.costoTotalLocal || 0), 0);
    const diezmoActivo = ventasActivas.reduce((sum, v) => sum + (v.diezmo || 0), 0);
    const gastosActivosMonto = gastosActivos.reduce((sum, g) => sum + (g.monto || 0), 0);

    // Capital en inventario (esto siempre es dinámico por stock)
    const valorInventarioReal = inventario.reduce((sum, item) => sum + (item.cantidad * item.costoUnitario), 0);
    const totalArticulosInv = inventario.reduce((sum, item) => sum + item.cantidad, 0);

    const tasa = config.tasaCambio || 1;
    const monedaSeleccionada = document.getElementById('dash-resumen-moneda')?.value || 'USD';

    const format = (val) => {
        if (monedaSeleccionada === 'USD') {
            return formatUSD(val / tasa);
        }
        return formatCurrency(val);
    };

    // Actualizar elementos
    const setText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    };

    setText('dash-ventas', format(ventasTotales));
    setText('dash-inversion', format(inversionActiva));
    setText('dash-diezmo', format(diezmoActivo));
    setText('dash-resto', format(valorInventarioReal));
    setText('dash-utilidad', format(gananciaBrutaActiva - gastosActivosMonto));
    setText('dash-ganancia-bruta', format(gananciaBrutaActiva));
    setText('dash-tasa', config.tasaCambio ? 'RD$ ' + config.tasaCambio : 'RD$ 0');
    setText('dash-gastos', format(gastosActivosMonto));
    setText('dash-inventario-articulos', totalArticulosInv + ' artículos');
    const diezmoLabel = document.getElementById('dash-diezmo-label');
    if (diezmoLabel) {
        diezmoLabel.innerHTML = 'Diezmo (' + (config.diezmoPorciento || 10) + '%) <span style="font-size:12px;">⚙️</span>';
    }
}

// Función para mostrar pantalla de cambiar contraseña
function showPassword() {
    showScreen('password-screen');
}

// Función para mostrar pantalla del dólar
function showDolar() {
    const tasaInput = document.getElementById('dolar-tasa');
    if (tasaInput && config.tasaCambio) {
        tasaInput.value = config.tasaCambio;
    }
    showScreen('dolar-screen');
}

// Función para guardar la tasa del dólar
function guardarTasa() {
    const tasa = parseFloat(document.getElementById('dolar-tasa')?.value);
    if (!tasa || tasa <= 0) {
        alert('Ingrese una tasa válida');
        return;
    }
    config.tasaCambio = tasa;
    saveData();
    alert(`Tasa guardada: 1 USD = ${formatCurrency(tasa)}`);
    showHome();
}

window.showScreen = showScreen;
window.showDolar = showDolar;
window.guardarTasa = guardarTasa;
window.showHome = showHome;
window.showConfig = showConfig;
window.showShopping = showShopping;
window.showSales = showSales;
window.showHistory = showHistory;
window.showHelp = showHelp;
window.showPassword = showPassword;
window.showDisenoFactura = showDisenoFactura;
window.saveDisenoFactura = saveDisenoFactura;
window.saveConfig = saveConfig;
window.updateDashboard = updateDashboard;
window.gestionarTarjetasMenu = function() {
    const banco = prompt('Nombre del Banco (Ej: Banreservas, Popular):');
    if (!banco) return;
    
    const ultimos4 = prompt('Últimos 4 dígitos de la tarjeta (Ej: 1234):');
    if (!ultimos4) return;
    
    const corte = parseInt(prompt('Día de corte (1-31):'));
    if (!corte || corte < 1 || corte > 31) { alert('Día inválido'); return; }
    
    const pago = parseInt(prompt('Restricción: Día límite de pago (1-31):'));
    if (!pago || pago < 1 || pago > 31) { alert('Día inválido'); return; }
    
    const id = Date.now().toString();
    window.tarjetas.push({ id, banco, ultimos4, corte, pago });
    
    try {
        saveData(); // Llama a saveData (que ya graba window.tarjetas)
        alert('✅ Tarjeta agregada exitosamente.');
        renderMetodosPago();
    } catch(e) {
        console.error(e);
    }
};

window.renderMetodosPago = function() {
    const select = document.getElementById('compra-metodo-pago');
    if (!select) return;
    
    let html = '<option value="efectivo" selected>💵 Efectivo / Transferencia / Débito</option>';
    if (window.tarjetas && window.tarjetas.length > 0) {
        window.tarjetas.forEach(t => {
            html += `<option value="${t.id}">💳 ${t.banco} (*${t.ultimos4})</option>`;
        });
    }
    select.innerHTML = html;
};

// Asegurar que se renderice cuando se abra la app o al abrir compras
const originalShowShopping = window.showShopping;
window.showShopping = function() {
    window.renderMetodosPago();
    if(typeof originalShowShopping === 'function') originalShowShopping();
};
