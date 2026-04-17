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
    const pie = document.getElementById('df-pie')?.value || '¡Gracias por su preferencia!';
    const color = document.getElementById('df-color')?.value || '#4CAF50';
    
    const preview = document.getElementById('preview-factura');
    if (!preview) return;
    
    const nombre = config.nombre || 'TU NEGOCIO';
    const telefono = config.telefono || '000-000-0000';
    
    preview.innerHTML = `
        <div style="background: #fff; max-width: 300px; margin: 0 auto; color: #333; font-family: 'Courier New', Courier, monospace; font-size: 13px; line-height: 1.4;">
            
            <div style="text-align: center; margin-bottom: 15px;">
                <div style="font-size: 22px; font-weight: bold; font-family: Arial, sans-serif; color: ${color};">${nombre}</div>
                ${encabezado ? `<div style="font-size: 11px; color: #666; font-family: Arial, sans-serif; white-space: pre-line; margin-top: 5px;">${encabezado}</div>` : ''}
                ${!encabezado && telefono ? `<div style="font-size: 11px; color: #666; font-family: Arial, sans-serif; margin-top: 5px;">Tel: ${telefono}</div>` : ''}
            </div>
            
            <div style="border-bottom: 1px dashed #aaa; margin-bottom: 10px;"></div>
            
            <div style="font-family: Arial, sans-serif; font-size: 12px; margin-bottom: 15px;">
                <div style="margin-bottom: 4px;"><strong>CLIENTE:</strong> MARÍA GARCÍA</div>
                <div style="margin-bottom: 4px;"><strong>FECHA:</strong> ${new Date().toLocaleDateString('es-DO')}</div>
                <div style="margin-bottom: 4px; color: #9C27B0; font-weight: bold;"><strong>FACTURA:</strong> #001</div>
                <div><strong>PAGO:</strong> TRANSFERENCIA</div>
            </div>
            
            <div style="font-family: Arial, sans-serif; font-size: 13px; font-weight: bold; margin-bottom: 10px;">
                DETALLES DEL PEDIDO:
            </div>
            
            <div style="margin-bottom: 10px;">
                <div style="margin-bottom: 4px;">1x Pantalón de vestir - $850.00</div>
                <div>1x Zapatos negros - $1200.00</div>
            </div>
            
            <div style="border-bottom: 1px dashed #aaa; margin-bottom: 10px;"></div>
            
            <div style="text-align: right; font-family: Arial, sans-serif; margin-bottom: 10px;">
                <div style="font-size: 13px; margin-bottom: 4px;">Subtotal: $2,050.00</div>
                <div style="font-size: 13px;">Envío: $150.00</div>
            </div>
            
            <div style="text-align: right; font-family: Arial, sans-serif; font-size: 18px; font-weight: bold; color: ${color}; margin-bottom: 20px;">
                TOTAL: $2,200.00
            </div>
            
            <div style="text-align: center; font-size: 11px; color: #888; font-style: italic; font-family: Arial, sans-serif; white-space: pre-line;">
                ${pie}
            </div>
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
    checkAlertasTarjetas();
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
    
    let html = '<option value="" disabled selected>💳 Selecciona una Tarjeta...</option>';
    if (window.tarjetas && window.tarjetas.length > 0) {
        window.tarjetas.forEach(t => {
            html += `<option value="${t.id}">💳 ${t.banco} (*${t.ultimos4})</option>`;
        });
    }
    select.innerHTML = html;
};

function checkAlertasTarjetas() {
    const container = document.getElementById('dash-alertas');
    if (!container) return;
    
    container.innerHTML = '';
    if (!window.tarjetas || window.tarjetas.length === 0) return;
    
    const hoy = new Date();
    const diaActual = hoy.getDate();
    const mesActual = hoy.getMonth();
    const anioActual = hoy.getFullYear();
    
    window.tarjetas.forEach(t => {
        let fechaPago = new Date(anioActual, mesActual, t.pago);
        if (diaActual > t.pago) {
            fechaPago = new Date(anioActual, mesActual + 1, t.pago);
        }
        
        const difTiempo = fechaPago - hoy;
        const difDias = Math.ceil(difTiempo / (1000 * 60 * 60 * 24));
        
        if (difDias >= 0 && difDias <= 7) {
            const mensaje = difDias === 0 ? '¡PAGA HOY!' : `Faltan ${difDias} días para pagar`;
            const color = difDias <= 2 ? '#f44336' : '#FF9800';
            
            container.innerHTML += `
                <div style="background: ${color}; color: white; padding: 12px; border-radius: 12px; margin-bottom: 10px; display: flex; align-items: center; gap: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.2); animation: pulse 2s infinite;">
                    <span style="font-size: 20px;">💳</span>
                    <div style="flex:1;">
                        <p style="margin:0; font-weight:bold; font-size:13px;">${t.banco} (*${t.ultimos4})</p>
                        <p style="margin:0; font-size:11px;">${mensaje} (Día ${t.pago})</p>
                    </div>
                </div>
            `;
        }
    });
}



function toggleDarkMode() {
    const body = document.body;
    const isDark = body.classList.toggle('dark-mode');
    localStorage.setItem('calc_dark_mode', isDark ? 'true' : 'false');
    const btn = document.getElementById('btn-dark-mode');
    if (btn) {
        btn.textContent = isDark ? '☀️' : '🌙';
        btn.style.background = isDark ? '#fff' : '#333';
        btn.style.color = isDark ? '#333' : '#fff';
    }
}

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

function showDiezmo() {
    const actual = config.diezmoPorciento || 10;
    const nuevo = prompt(`Porcentaje actual: ${actual}%\n\nIngrese nuevo porcentaje de diezmo (0-100):`, actual);
    if (nuevo === null) return;
    const valor = parseFloat(nuevo);
    if (isNaN(valor) || valor < 0 || valor > 100) {
        alert('Valor inválido');
        return;
    }
    config.diezmoPorciento = valor;
    saveData();
    updateDashboard();
    alert(`Diezmo actualizado a ${valor}%`);
}

window.showDisenoFactura = showDisenoFactura;
window.saveDisenoFactura = saveDisenoFactura;
window.updatePreviewFactura = updatePreviewFactura;
window.updateDashboard = updateDashboard;
window.checkAlertasTarjetas = checkAlertasTarjetas;
window.toggleDarkMode = toggleDarkMode;
window.loadDarkMode = loadDarkMode;
window.showDiezmo = showDiezmo;
