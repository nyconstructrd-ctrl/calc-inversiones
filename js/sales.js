// js/sales.js
// Registro de Ventas

// Variable global para almacenar ID de venta en edición
window.ventaEditandoId = null;

// Rastrear stock reservado para poder devolverlo al limpiar
window._stockReservado = [];

// Obtener siguiente número de factura secuencial
function getNextFacturaNumber() {
    let num = parseInt(localStorage.getItem('calc_factura_contador') || '0') + 1;
    localStorage.setItem('calc_factura_contador', num.toString());
    return '#' + String(num).padStart(3, '0');
}

function getFacturaContador() {
    return parseInt(localStorage.getItem('calc_factura_contador') || '0');
}

function renderVentasList() {
    const container = document.getElementById('ventas-list');
    if (!container) return;
    const ultimas = ventas.slice(-10).reverse();
    
    if (ultimas.length === 0) {
        container.innerHTML = '<p style="color:#999;text-align:center;">Sin ventas registradas</p>';
        return;
    }
    
    let html = '';
    ultimas.forEach(v => {
        const metodoIcon = v.metodoPago === 'efectivo' ? '💵' : v.metodoPago === 'tarjeta' ? '💳' : '🏦';
        const numFactura = v.facturaNum || '';
        html += `<div class="list-item" style="position: relative;">
            <div class="item-title">${numFactura ? '<span style="color:#9C27B0; font-weight:bold;">' + numFactura + '</span> ' : ''}${v.articulo.split('\n')[0]} ${v.cliente ? '→ ' + v.cliente : ''}</div>
            <div class="item-detail">Total: ${formatCurrency(v.totalVenta)} | ${metodoIcon} ${v.metodoPago}</div>
            <div class="item-date">${formatDate(v.fecha)}</div>
            <button onclick="abrirModalOpciones(${v.id})" style="position: absolute; top: 10px; right: 10px; background: #607D8B; color: white; border: none; border-radius: 4px; padding: 5px;">⚙️</button>
        </div>`;
    });
    container.innerHTML = html;
}

function saveVenta() {
    const articulo = document.getElementById('venta-articulo').value.trim();
    const precio = parseFloat(document.getElementById('venta-precio').value) || 0;
    const cliente = document.getElementById('venta-cliente').value.trim();
    const costoEnvio = parseFloat(document.getElementById('venta-envio').value) || 0;
    
    if (!articulo || !precio) { alert('Ingrese artículo y precio'); return; }
    
    // Obtener número de factura (nuevo o mantener el existente en edición)
    let facturaNum;
    if (window.ventaEditandoId) {
        const ventaExistente = ventas.find(v => String(v.id) === String(window.ventaEditandoId));
        facturaNum = ventaExistente?.facturaNum || getNextFacturaNumber();
    } else {
        facturaNum = getNextFacturaNumber();
    }
    
    const venta = {
        id: window.ventaEditandoId || Date.now(),
        facturaNum,
        fecha: new Date().toISOString(),
        articulo,
        precioVenta: precio,
        cliente,
        telefono: document.getElementById('venta-telefono').value.trim(),
        costoEnvio,
        totalVenta: precio + costoEnvio,
        metodoPago: document.getElementById('venta-metodo-pago').value,
        diezmo: precio * ((config.diezmoPorciento || 10) / 100)
    };
    
    // Si estamos editando, reemplazar la venta existente
    if (window.ventaEditandoId) {
        const index = ventas.findIndex(v => String(v.id) === String(window.ventaEditandoId));
        if (index !== -1) {
            ventas[index] = venta;
        } else {
            ventas.push(venta);
        }
        window.ventaEditandoId = null; // Resetear
        alert('✅ Venta actualizada exitosamente');
    } else {
        ventas.push(venta);
        alert('✅ Venta registrada exitosamente');
    }
    
    saveData();
    updateDashboard();
    renderVentasList();
    
    // Limpiar campos y vaciar stock reservado (la venta se confirmó)
    ['venta-articulo', 'venta-precio', 'venta-cliente', 'venta-telefono', 'venta-envio'].forEach(id => document.getElementById(id).value = '');
    window._stockReservado = [];
}

function buscarArticulosInventario() {
    const busqueda = document.getElementById('buscar-inventario').value.trim().toLowerCase();
    const container = document.getElementById('resultados-inventario');
    
    if (!busqueda) { container.innerHTML = ''; return; }
    
    const resultados = inventario.filter(item => item.nombre.toLowerCase().includes(busqueda) && item.cantidad > 0);
    
    let html = '';
    resultados.forEach(item => {
        const tieneTalla = item.talla && item.talla.trim();
        
        html += `<div onclick="seleccionarArticuloInventario(${item.id})" style="background:#f5f5f5; border:1px solid #ddd; border-radius:6px; padding:10px; margin-bottom:5px; cursor:pointer;">
            <strong>${item.nombre}</strong><br>
            <span style="color:#2E7D32;">${formatCurrency(item.precioVenta)}</span> 
            <span style="color:#666; font-size:11px;">(Stock: ${item.cantidad}${tieneTalla ? ` - ${item.talla}` : ''})</span>
        </div>`;
    });
    container.innerHTML = html || '<p style="color:#999; font-size:12px;">Sin resultados</p>';
}

function seleccionarArticuloInventario(id) {
    const item = inventario.find(i => i.id === id);
    if (!item) return;
    
    const cant = prompt(`Cantidad de "${item.nombre}" (Stock: ${item.cantidad})`, '1');
    if (cant === null) return;
    
    const cantidad = parseInt(cant);
    if (isNaN(cantidad) || cantidad <= 0 || cantidad > item.cantidad) { 
        alert('Cantidad inválida o insuficiente stock'); 
        return; 
    }
    
    const textarea = document.getElementById('venta-articulo');
    const precioInput = document.getElementById('venta-precio');
    
    const nuevaLinea = `${cantidad}x ${item.nombre} - ${formatCurrency(item.precioVenta * cantidad)}`;
    textarea.value = textarea.value ? textarea.value + '\n' + nuevaLinea : nuevaLinea;
    
    const precioActual = parseFloat(precioInput.value) || 0;
    precioInput.value = (precioActual + (item.precioVenta * cantidad)).toFixed(2);
    
    // Restar de inventario inmediatamente para evitar sobreventa
    item.cantidad -= cantidad;
    
    // Guardar referencia para poder devolver stock si se limpia
    window._stockReservado.push({ itemId: item.id, cantidad: cantidad });
    
    saveData();
    
    document.getElementById('buscar-inventario').value = '';
    document.getElementById('resultados-inventario').innerHTML = '';
}

function limpiarArticulosSeleccionados() {
    if (!confirm('¿Limpiar artículos seleccionados?')) return;
    
    // Devolver stock reservado al inventario
    if (window._stockReservado && window._stockReservado.length > 0) {
        window._stockReservado.forEach(reserva => {
            const item = inventario.find(i => i.id === reserva.itemId);
            if (item) {
                item.cantidad += reserva.cantidad;
            }
        });
        window._stockReservado = [];
        saveData();
        console.log('[APP] Stock devuelto al inventario');
    }
    
    document.getElementById('venta-articulo').value = '';
    document.getElementById('venta-precio').value = '';
}

// Auto-suma de precios en los detalles del textarea
function actualizarTotalVentaDesdeDetalles() {
    const textarea = document.getElementById('venta-articulo');
    if (!textarea) return;
    
    const lineas = textarea.value.split('\n');
    let total = 0;
    lineas.forEach(linea => {
        // Busca patrones tipo "- 1500" o "- RD$ 1500" al final de cada línea
        const match = linea.match(/[-–]\s*(?:RD\$\s*)?([\d,]+(?:\.\d+)?)\s*$/);
        if (match) {
            total += parseFloat(match[1].replace(',', '')) || 0;
        }
    });
    
    if (total > 0) {
        const precioInput = document.getElementById('venta-precio');
        if (precioInput && !precioInput.value) {
            precioInput.value = total.toFixed(2);
            if (typeof updateVentaPreview === 'function') updateVentaPreview();
        }
    }
}

// Exponer funciones
window.renderVentasList = renderVentasList;
window.saveVenta = saveVenta;
window.buscarArticulosInventario = buscarArticulosInventario;
window.seleccionarArticuloInventario = seleccionarArticuloInventario;
window.limpiarArticulosSeleccionados = limpiarArticulosSeleccionados;
window.actualizarTotalVentaDesdeDetalles = actualizarTotalVentaDesdeDetalles;
