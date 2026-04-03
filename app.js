// CALC INVERSIONES - App.js
// Sistema de gestión financiera para reventa de ropa

// =====================
// INICIALIZACIÓN
// =====================

let config = {
    costoPorLibra: 0,
    tasaCambio: 0,
    publicidadMensual: 0
};

let compras = [];
let ventas = [];

// Cargar datos al inicio
window.addEventListener('DOMContentLoaded', function() {
    loadData();
    updateDashboard();
    updateShoppingForm();
    loadSalesDropdown();
    loadHistoryMonths();
    setupEventListeners();
});

// =====================
// NAVEGACIÓN
// =====================

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    if (screenId === 'home-screen') document.getElementById('nav-home').classList.add('active');
    if (screenId === 'config-screen') document.getElementById('nav-config').classList.add('active');
    if (screenId === 'shopping-screen') document.getElementById('nav-shopping').classList.add('active');
    if (screenId === 'sales-screen') document.getElementById('nav-sales').classList.add('active');
    if (screenId === 'history-screen') document.getElementById('nav-history').classList.add('active');
}

function showHome() {
    updateDashboard();
    showScreen('home-screen');
}

function showConfig() {
    loadConfigForm();
    showScreen('config-screen');
}

function showShopping() {
    updateShoppingForm();
    renderComprasList();
    showScreen('shopping-screen');
}

function showSales() {
    loadSalesDropdown();
    renderVentasList();
    showScreen('sales-screen');
}

function showHistory() {
    loadHistoryMonths();
    showScreen('history-screen');
}

// =====================
// STORAGE
// =====================

function loadData() {
    try {
        const cfg = localStorage.getItem('calc_config');
        const com = localStorage.getItem('calc_compras');
        const ven = localStorage.getItem('calc_ventas');
        
        if (cfg) config = JSON.parse(cfg);
        if (com) compras = JSON.parse(com);
        if (ven) ventas = JSON.parse(ven);
    } catch (e) {
        console.error('Error cargando datos:', e);
    }
}

function saveData() {
    try {
        localStorage.setItem('calc_config', JSON.stringify(config));
        localStorage.setItem('calc_compras', JSON.stringify(compras));
        localStorage.setItem('calc_ventas', JSON.stringify(ventas));
    } catch (e) {
        console.error('Error guardando datos:', e);
        alert('Error al guardar datos');
    }
}

// =====================
// CONFIG
// =====================

function loadConfigForm() {
    document.getElementById('config-costo-libra').value = config.costoPorLibra || '';
    document.getElementById('config-tasa').value = config.tasaCambio || '';
    document.getElementById('config-publicidad').value = config.publicidadMensual || '';
}

function saveConfig() {
    config.costoPorLibra = parseFloat(document.getElementById('config-costo-libra').value) || 0;
    config.tasaCambio = parseFloat(document.getElementById('config-tasa').value) || 0;
    config.publicidadMensual = parseFloat(document.getElementById('config-publicidad').value) || 0;
    
    if (!config.costoPorLibra || !config.tasaCambio) {
        alert('⚠️ Complete el costo por libra y la tasa de cambio');
        return;
    }
    
    saveData();
    alert('✅ Configuración guardada');
    showHome();
}

// =====================
// COMPRAS
// =====================

function updateShoppingForm() {
    const costo = parseFloat(document.getElementById('compra-costo').value) || 0;
    const peso = parseFloat(document.getElementById('compra-peso').value) || 0;
    
    // Calcular costo de envío
    const costoEnvioUSD = peso * config.costoPorLibra;
    const costoEnvioLocal = costoEnvioUSD * config.tasaCambio;
    const costoPrendaLocal = costo * config.tasaCambio;
    const totalLocal = costoPrendaLocal + costoEnvioLocal;
    
    // Mostrar preview
    document.getElementById('compra-envio-preview').textContent = 
        `Costo envío: RD$ ${costoEnvioLocal.toLocaleString()} (${peso} lbs × $${config.costoPorLibra})`;
    
    document.getElementById('compra-total').textContent = 
        `RD$ ${totalLocal.toLocaleString()}`;
}

function setupEventListeners() {
    document.getElementById('compra-costo').addEventListener('input', updateShoppingForm);
    document.getElementById('compra-peso').addEventListener('input', updateShoppingForm);
    
    document.getElementById('venta-compra').addEventListener('change', updateVentaPreview);
    document.getElementById('venta-precio').addEventListener('input', updateVentaPreview);
}

function saveCompra() {
    const proveedor = document.getElementById('compra-proveedor').value;
    const costoUSD = parseFloat(document.getElementById('compra-costo').value) || 0;
    const pesoLibras = parseFloat(document.getElementById('compra-peso').value) || 0;
    
    if (!costoUSD || !pesoLibras) {
        alert('⚠️ Complete todos los campos');
        return;
    }
    
    if (!config.costoPorLibra || !config.tasaCambio) {
        alert('⚠️ Configure los datos del comercio primero');
        showConfig();
        return;
    }
    
    // Calcular totales
    const costoEnvioUSD = pesoLibras * config.costoPorLibra;
    const costoEnvioLocal = costoEnvioUSD * config.tasaCambio;
    const costoPrendaLocal = costoUSD * config.tasaCambio;
    const costoTotalLocal = costoPrendaLocal + costoEnvioLocal;
    
    const nuevaCompra = {
        id: Date.now(),
        fecha: new Date().toISOString(),
        proveedor: proveedor,
        costoUSD: costoUSD,
        pesoLibras: pesoLibras,
        costoEnvioLocal: costoEnvioLocal,
        costoPrendaLocal: costoPrendaLocal,
        costoTotalLocal: costoTotalLocal,
        vendido: false
    };
    
    compras.push(nuevaCompra);
    saveData();
    
    // Limpiar formulario
    document.getElementById('compra-costo').value = '';
    document.getElementById('compra-peso').value = '';
    updateShoppingForm();
    renderComprasList();
    
    alert(`✅ Compra registrada\nInversión: RD$ ${costoTotalLocal.toLocaleString()}`);
}

function renderComprasList() {
    const container = document.getElementById('compras-list');
    const containerHome = document.getElementById('home-compras');
    
    const pendientes = compras.filter(c => !c.vendido).reverse();
    
    if (pendientes.length === 0) {
        container.innerHTML = '<p style="color: #999; text-align: center;">No hay compras pendientes</p>';
        containerHome.innerHTML = '<p style="color: #999; text-align: center;">Sin compras recientes</p>';
        return;
    }
    
    let html = '';
    pendientes.forEach(c => {
        html += `
            <div class="list-item">
                <div class="item-title">${c.proveedor}</div>
                <div class="item-detail">Costo: RD$ ${c.costoPrendaLocal.toLocaleString()} | Envío: RD$ ${c.costoEnvioLocal.toLocaleString()}</div>
                <div class="item-value">Total: RD$ ${c.costoTotalLocal.toLocaleString()}</div>
                <button class="delete-btn" onclick="deleteCompra(${c.id})">🗑️ Eliminar</button>
            </div>
        `;
    });
    
    container.innerHTML = html;
    containerHome.innerHTML = html;
}

function deleteCompra(id) {
    if (confirm('¿Eliminar esta compra?')) {
        compras = compras.filter(c => c.id !== id);
        saveData();
        renderComprasList();
    }
}

// =====================
// VENTAS
// =====================

function loadSalesDropdown() {
    const select = document.getElementById('venta-compra');
    const pendientes = compras.filter(c => !c.vendido);
    
    let html = '<option value="">-- Seleccionar --</option>';
    pendientes.forEach(c => {
        html += `<option value="${c.id}">${c.proveedor} - RD$ ${c.costoTotalLocal.toLocaleString()}</option>`;
    });
    
    select.innerHTML = html;
}

function updateVentaPreview() {
    const compraId = document.getElementById('venta-compra').value;
    const precioVenta = parseFloat(document.getElementById('venta-precio').value) || 0;
    
    if (!compraId) {
        document.getElementById('venta-ganancia-preview').textContent = 'Seleccione una prenda';
        return;
    }
    
    const compra = compras.find(c => c.id == compraId);
    if (!compra) return;
    
    const utilidadBruta = precioVenta - compra.costoTotalLocal;
    const diezmo = Math.max(0, utilidadBruta * 0.1);
    const gananciaNeta = utilidadBruta - diezmo;
    
    document.getElementById('venta-ganancia-preview').innerHTML = `
        Costo: RD$ ${compra.costoTotalLocal.toLocaleString()}<br>
        Ganancia bruta: RD$ ${utilidadBruta.toLocaleString()}<br>
        Diezmo (10%): RD$ ${diezmo.toLocaleString()}<br>
        <strong>Ganancia neta: RD$ ${gananciaNeta.toLocaleString()}</strong>
    `;
}

function saveVenta() {
    const compraId = document.getElementById('venta-compra').value;
    const precioVenta = parseFloat(document.getElementById('venta-precio').value) || 0;
    const telefono = document.getElementById('venta-telefono').value.trim();
    
    if (!compraId || !precioVenta) {
        alert('⚠️ Seleccione una prenda y precio de venta');
        return;
    }
    
    const compra = compras.find(c => c.id == compraId);
    if (!compra) return;
    
    // Calcular diezmo
    const utilidadBruta = precioVenta - compra.costoTotalLocal;
    const diezmo = Math.max(0, utilidadBruta * 0.1);
    
    const nuevaVenta = {
        id: Date.now(),
        fecha: new Date().toISOString(),
        compraId: compra.id,
        proveedor: compra.proveedor,
        costoPrenda: compra.costoTotalLocal,
        precioVenta: precioVenta,
        diezmo: diezmo,
        telefono: telefono
    };
    
    // Marcar compra como vendido
    const index = compras.findIndex(c => c.id == compraId);
    if (index !== -1) {
        compras[index].vendido = true;
    }
    
    ventas.push(nuevaVenta);
    saveData();
    
    // Limpiar
    document.getElementById('venta-precio').value = '';
    document.getElementById('venta-telefono').value = '';
    loadSalesDropdown();
    renderVentasList();
    
    alert(`✅ Venta registrada\nGanancia: RD$ ${(precioVenta - compra.costoTotalLocal - diezmo).toLocaleString()}`);
    
    // Sugerir WhatsApp
    if (telefono) {
        setTimeout(() => {
            if (confirm('¿Enviar factura por WhatsApp?')) {
                sendWhatsAppInvoice(nuevaVenta, telefono);
            }
        }, 500);
    }
}

function renderVentasList() {
    const container = document.getElementById('ventas-list');
    const recientes = ventas.reverse().slice(0, 10);
    
    if (recientes.length === 0) {
        container.innerHTML = '<p style="color: #999; text-align: center;">No hay ventas registradas</p>';
        return;
    }
    
    let html = '';
    recientes.forEach(v => {
        const ganancia = v.precioVenta - v.costoPrenda - v.diezmo;
        html += `
            <div class="list-item">
                <div class="item-title">${v.proveedor}</div>
                <div class="item-detail">Vendido: RD$ ${v.precioVenta.toLocaleString()}</div>
                <div class="item-value">Ganancia: RD$ ${ganancia.toLocaleString()}</div>
                ${v.telefono ? `<button class="btn-whatsapp" style="margin-top: 5px; padding: 8px;" onclick="sendWhatsAppInvoiceFromList(${v.id})">📱 WhatsApp</button>` : ''}
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function openWhatsApp() {
    const telefono = document.getElementById('venta-telefono').value.trim();
    if (!telefono) {
        alert('⚠️ Ingrese un número de teléfono');
        return;
    }
    
    const compraId = document.getElementById('venta-compra').value;
    if (!compraId) {
        alert('⚠️ Seleccione una prenda');
        return;
    }
    
    const venta = ventas.find(v => v.compraId == compraId);
    if (venta) {
        sendWhatsAppInvoice(venta, telefono);
    }
}

function sendWhatsAppInvoice(venta, telefono) {
    const ganancia = venta.precioVenta - venta.costoPrenda - venta.diezmo;
    const mensaje = `🧾 *FACTURA*\n\n*Proveedor:* ${venta.proveedor}\n*Costo:* RD$ ${venta.costoPrenda.toLocaleString()}\n*Venta:* RD$ ${venta.precioVenta.toLocaleString()}\n*Diezmo (10%):* RD$ ${venta.diezmo.toLocaleString()}\n*Ganancia:* RD$ ${ganancia.toLocaleString()}`;
    
    const url = `https://wa.me/${telefono.replace(/\D/g, '')}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
}

function sendWhatsAppInvoiceFromList(ventaId) {
    const venta = ventas.find(v => v.id == ventaId);
    if (!venta || !venta.telefono) {
        alert('No hay teléfono registrado');
        return;
    }
    sendWhatsAppInvoice(venta, venta.telefono);
}

// =====================
// DASHBOARD
// =====================

function updateDashboard() {
    const now = new Date();
    const mesActual = now.getMonth();
    const anioActual = now.getFullYear();
    
    // Filtrar ventas del mes
    const ventasMes = ventas.filter(v => {
        const fecha = new Date(v.fecha);
        return fecha.getMonth() === mesActual && fecha.getFullYear() === anioActual;
    });
    
    // Filtrar inversiones del mes
    const comprasMes = compras.filter(c => {
        const fecha = new Date(c.fecha);
        return fecha.getMonth() === mesActual && fecha.getFullYear() === anioActual;
    });
    
    // Calcular totales
    const ventaTotal = ventasMes.reduce((sum, v) => sum + v.precioVenta, 0);
    const inversionMes = comprasMes.reduce((sum, c) => sum + c.costoTotalLocal, 0);
    const diezmoMes = ventasMes.reduce((sum, v) => sum + v.diezmo, 0);
    
    // Resto por vender
    const restoPorVender = compras
        .filter(c => !c.vendido)
        .reduce((sum, c) => sum + c.costoTotalLocal, 0);
    
    // Utilidad neta
    const publicidad = config.publicidadMensual || 0;
    const utilidadNeta = ventaTotal - inversionMes - publicidad - diezmoMes;
    
    // Actualizar UI
    document.getElementById('dash-ventas').textContent = `RD$ ${ventaTotal.toLocaleString()}`;
    document.getElementById('dash-inversion').textContent = `RD$ ${inversionMes.toLocaleString()}`;
    document.getElementById('dash-diezmo').textContent = `RD$ ${diezmoMes.toLocaleString()}`;
    document.getElementById('dash-resto').textContent = `RD$ ${restoPorVender.toLocaleString()}`;
    
    const utilEl = document.getElementById('dash-utilidad');
    utilEl.textContent = `RD$ ${utilidadNeta.toLocaleString()}`;
    utilEl.style.background = utilidadNeta >= 0 ? 'linear-gradient(135deg, #4CAF50, #45a049)' : 'linear-gradient(135deg, #f44336, #D32F2F)';
}

// =====================
// HISTORIAL
// =====================

function loadHistoryMonths() {
    const select = document.getElementById('history-month');
    const meses = new Set();
    
    [...compras, ...ventas].forEach(item => {
        const fecha = new Date(item.fecha);
        meses.add(`${fecha.getFullYear()}-${fecha.getMonth()}`);
    });
    
    const sortedMeses = Array.from(meses).sort().reverse();
    
    let html = '<option value="">Seleccionar mes</option>';
    sortedMeses.forEach(mes => {
        const [anio, mesNum] = mes.split('-');
        const nombreMes = new Date(anio, parseInt(mesNum)).toLocaleString('default', { month: 'long', year: 'numeric' });
        html += `<option value="${mes}">${nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)}</option>`;
    });
    
    select.innerHTML = html;
}

function loadMonthData() {
    const mesSeleccionado = document.getElementById('history-month').value;
    const container = document.getElementById('history-data');
    
    if (!mesSeleccionado) {
        container.innerHTML = '';
        return;
    }
    
    const [anio, mesNum] = mesSeleccionado.split('-');
    
    const ventasMes = ventas.filter(v => {
        const fecha = new Date(v.fecha);
        return fecha.getMonth() === parseInt(mesNum) && fecha.getFullYear() === parseInt(anio);
    });
    
    const comprasMes = compras.filter(c => {
        const fecha = new Date(c.fecha);
        return fecha.getMonth() === parseInt(mesNum) && fecha.getFullYear() === parseInt(anio);
    });
    
    const ventaTotal = ventasMes.reduce((sum, v) => sum + v.precioVenta, 0);
    const inversionMes = comprasMes.reduce((sum, c) => sum + c.costoTotalLocal, 0);
    const diezmoTotal = ventasMes.reduce((sum, v) => sum + v.diezmo, 0);
    const publicidad = config.publicidadMensual || 0;
    const utilidad = ventaTotal - inversionMes - publicidad - diezmoTotal;
    
    container.innerHTML = `
        <div style="margin-top: 10px;">
            <p><strong>Ventas:</strong> RD$ ${ventaTotal.toLocaleString()}</p>
            <p><strong>Inversión:</strong> RD$ ${inversionMes.toLocaleString()}</p>
            <p><strong>Diezmo:</strong> RD$ ${diezmoTotal.toLocaleString()}</p>
            <p><strong>Publiciad:</strong> RD$ ${publicidad.toLocaleString()}</p>
            <hr style="margin: 10px 0;">
            <p style="font-size: 18px;"><strong>Utilidad:</strong> RD$ ${utilidad.toLocaleString()}</p>
        </div>
    `;
}

function generateReport() {
    const meses = new Set();
    [...compras, ...ventas].forEach(item => {
        const fecha = new Date(item.fecha);
        meses.add(`${fecha.getFullYear()}-${fecha.getMonth()}`);
    });
    
    const sortedMeses = Array.from(meses).sort().reverse();
    
    let reporte = '═══════════════════════════════════\n';
    reporte += '   RESUMEN FINANCIERO - CALC INVERSIONES\n';
    reporte += '═══════════════════════════════════\n\n';
    
    if (config.costoPorLibra) {
        reporte += `📊 CONFIGURACIÓN:\n`;
        reporte += `- Costo por libra: $${config.costoPorLibra}\n`;
        reporte += `- Tasa cambio: ${config.tasaCambio}\n`;
        reporte += `- Publicidad mensual: RD$ ${config.publicidadMensual}\n\n`;
    }
    
    sortedMeses.forEach(mes => {
        const [anio, mesNum] = mes.split('-');
        const mesNombre = new Date(anio, parseInt(mesNum)).toLocaleString('default', { month: 'long', year: 'numeric' });
        
        const ventasMes = ventas.filter(v => {
            const fecha = new Date(v.fecha);
            return fecha.getMonth() === parseInt(mesNum) && fecha.getFullYear() === parseInt(anio);
        });
        
        const comprasMes = compras.filter(c => {
            const fecha = new Date(c.fecha);
            return fecha.getMonth() === parseInt(mesNum) && fecha.getFullYear() === parseInt(anio);
        });
        
        const ventaTotal = ventasMes.reduce((sum, v) => sum + v.precioVenta, 0);
        const inversionMes = comprasMes.reduce((sum, c) => sum + c.costoTotalLocal, 0);
        const diezmoTotal = ventasMes.reduce((sum, v) => sum + v.diezmo, 0);
        const publicidad = config.publicidadMensual || 0;
        const utilidad = ventaTotal - inversionMes - publicidad - diezmoTotal;
        
        reporte += `📅 ${mesNombre.toUpperCase()}:\n`;
        reporte += `   Ventas: RD$ ${ventaTotal.toLocaleString()}\n`;
        reporte += `   Inversión: RD$ ${inversionMes.toLocaleString()}\n`;
        reporte += `   Diezmo: RD$ ${diezmoTotal.toLocaleString()}\n`;
        reporte += `   Publicidad: RD$ ${publicidad.toLocaleString()}\n`;
        reporte += `   ─────────────────────\n`;
        reporte += `   UTILIDAD: RD$ ${utilidad.toLocaleString()}\n\n`;
    });
    
    reporte += '═══════════════════════════════════\n';
    reporte += `Total prendas compradas: ${compras.length}\n`;
    reporte += `Total ventas: ${ventas.length}\n`;
    reporte += `Fecha respaldo: ${new Date().toLocaleDateString()}\n`;
    reporte += '═══════════════════════════════════';
    
    alert(reporte);
}

function exportData() {
    const data = {
        config: config,
        compras: compras,
        ventas: ventas,
        fechaRespaldo: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `calc-inversiones-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (data.config) config = data.config;
            if (data.compras) compras = data.compras;
            if (data.ventas) ventas = data.ventas;
            
            saveData();
            alert('✅ Datos restaurados correctamente');
            
            showHome();
        } catch (err) {
            alert('❌ Error al importar: ' + err.message);
        }
    };
    reader.readAsText(file);
}