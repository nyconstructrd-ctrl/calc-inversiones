// js/shopping.js
// Registro de Compras

function loadShoppingForm() {
    const ids = ['compra-proveedor', 'compra-detalles', 'compra-precio-venta', 'compra-costo', 'compra-envio', 'compra-otros'];
    ids.forEach(id => { if (document.getElementById(id)) document.getElementById(id).value = ''; });
    
    if (document.getElementById('compra-total')) document.getElementById('compra-total').textContent = '$ 0.00';
    if (document.getElementById('compra-costo-tipo')) document.getElementById('compra-costo-tipo').value = 'USD';
    
    const savedMoneda = localStorage.getItem('calc_moneda_general');
    if (savedMoneda && document.getElementById('compra-moneda-general')) {
        document.getElementById('compra-moneda-general').value = savedMoneda;
    }
    
    if (typeof renderMetodosPago === 'function') {
        renderMetodosPago();
    }
    
    // Doble click en label para cambiar moneda rápidamente
    const labelMoneda = document.getElementById('label-moneda-general');
    const selectMoneda = document.getElementById('compra-moneda-general');
    
    if (labelMoneda && selectMoneda && !labelMoneda.dataset.dblclickSet) {
        labelMoneda.dataset.dblclickSet = 'true';
        labelMoneda.addEventListener('dblclick', () => {
            const nuevaMoneda = selectMoneda.value === 'USD' ? 'RD$' : 'USD';
            selectMoneda.value = nuevaMoneda;
            localStorage.setItem('calc_moneda_general', nuevaMoneda);
            updateShoppingPreview();
            // Feedback visual
            labelMoneda.style.transform = 'scale(1.05)';
            setTimeout(() => labelMoneda.style.transform = 'scale(1)', 200);
        });
    }
}

function updateShoppingPreview() {
    const idValue = id => parseFloat(document.getElementById(id)?.value) || 0;
    const costo = idValue('compra-costo');
    const costoTipo = document.getElementById('compra-costo-tipo')?.value || 'USD';
    const envio = idValue('compra-envio');
    const otros = idValue('compra-otros');
    const otrosTipo = document.getElementById('compra-otros-tipo')?.value || 'USD';
    const monedaGeneral = document.getElementById('compra-moneda-general')?.value || 'USD';
    
    const tasa = config.tasaCambio || 1;
    
    // Suma automática de detalles - los precios deben estar en la moneda seleccionada
    const detallesTexto = document.getElementById('compra-detalles')?.value || '';
    const sumaDetalles = extraerSumaDetalles(detallesTexto);
    
    if (document.getElementById('compra-precio-venta')) {
        // Los precios en detalles ya están en la moneda seleccionada (no requieren conversión)
        document.getElementById('compra-precio-venta').value = sumaDetalles > 0 ? sumaDetalles.toFixed(2) : '';
    }
    
    const totalRD = (costoTipo === 'USD' ? costo * tasa : costo) + envio + (otrosTipo === 'USD' ? otros * tasa : otros);
    
    // Actualizar labels de conversión
    const setConv = (id, val, tipo) => {
        const el = document.getElementById(id);
        if (el) el.textContent = (tipo === 'USD' && val > 0) ? '🇩🇴 RD$ ' + (val * tasa).toLocaleString() : '';
    };
    
    setConv('compra-costo-conversion', costo, costoTipo);
    setConv('compra-envio-conversion', envio, 'USD'); // Envio suele ser USD en tu app
    setConv('compra-otros-conversion', otros, otrosTipo);
    
    const totalMostrar = monedaGeneral === 'USD' ? totalRD / tasa : totalRD;
    const simbolo = monedaGeneral === 'USD' ? '$' : 'RD$';
    
    if (document.getElementById('compra-total')) {
        document.getElementById('compra-total').textContent = `${simbolo} ${totalMostrar.toLocaleString('en-US', {minimumFractionDigits: 2})}`;
    }
}

function extraerSumaDetalles(texto) {
    if (!texto) return 0;
    const lineas = texto.split('\n');
    let suma = 0;
    lineas.forEach(linea => {
        const match = linea.match(/[-\s]*(\d+(?:\.\d{2})?)\s*$/);
        if (match) suma += parseFloat(match[1]);
    });
    return suma;
}

function saveCompra() {
    const proveedor = document.getElementById('compra-proveedor').value;
    const costo = parseFloat(document.getElementById('compra-costo').value) || 0;
    
    if (!proveedor || !costo) { alert('Complete los campos obligatorios'); return; }
    
    const tasa = config.tasaCambio || 1;
    const costoTipo = document.getElementById('compra-costo-tipo').value;
    const envio = parseFloat(document.getElementById('compra-envio').value) || 0;
    const otros = parseFloat(document.getElementById('compra-otros').value) || 0;
    const otrosTipo = document.getElementById('compra-otros-tipo').value;
    
    const costoEnRD = costoTipo === 'USD' ? costo * tasa : costo;
    const otrosEnRD = otrosTipo === 'USD' ? otros * tasa : otros;
    const totalRD = costoEnRD + envio + otrosEnRD;
    
    const metodoPagoVal = document.getElementById('compra-metodo-pago')?.value;
    if (!metodoPagoVal) {
        alert('❌ Error: Debes seleccionar una Tarjeta de Crédito para registrar esta compra.');
        return;
    }

    const compra = {
        id: window.compraEditandoId || Date.now(),
        fecha: new Date().toISOString(),
        proveedor,
        detalles: document.getElementById('compra-detalles').value,
        precioVenta: parseFloat(document.getElementById('compra-precio-venta').value) || 0,
        costoTotalLocal: totalRD,
        metodoPago: metodoPagoVal,
        vendido: false
    };
    
    // Si estamos editando, reemplazar la compra existente
    if (window.compraEditandoId) {
        const index = compras.findIndex(c => String(c.id) === String(window.compraEditandoId));
        if (index !== -1) {
            compra.fecha = compras[index].fecha; // Mantener fecha original
            compras[index] = compra;
        } else {
            compras.push(compra);
        }
        window.compraEditandoId = null;
        alert('✅ Compra actualizada exitosamente');
    } else {
        compras.push(compra);
        alert('✅ Compra guardada exitosamente');
    }
    
    saveData();
    loadShoppingForm();
    renderComprasList();
    updateDashboard();
}

function renderComprasList() {
    const container = document.getElementById('compras-list');
    const pendientes = compras.filter(c => !c.vendido).reverse();
    
    if (pendientes.length === 0) {
        container.innerHTML = '<p style="color:#999;text-align:center;">Sin compras pendientes</p>';
        return;
    }
    
    let html = '';
    pendientes.forEach(c => {
        let paymentBadge = '';
        if (c.metodoPago && c.metodoPago !== 'efectivo') {
            const tj = window.tarjetas.find(t => String(t.id) === String(c.metodoPago));
            if (tj) {
                paymentBadge = `<span style="font-size: 10px; background: #E1BEE7; color: #6A1B9A; padding: 2px 6px; border-radius: 4px; font-weight: bold; margin-left: 5px;">💳 ${tj.banco} *${tj.ultimos4}</span>`;
            }
        }
        
        html += `<div class="list-item" style="position: relative;">
            <div class="item-title">${c.proveedor} ${paymentBadge}</div>
            <div class="item-detail">${formatCurrency(c.costoTotalLocal)}</div>
            <div class="item-date">${formatDate(c.fecha)}</div>
            <button onclick="abrirModalCompra(${c.id})" style="position: absolute; top: 10px; right: 10px; background: #607D8B; color: white; border: none; border-radius: 4px; padding: 5px;">⚙️</button>
        </div>`;
    });
    container.innerHTML = html;
}

function renderLastCompras() {
    const container = document.getElementById('home-compras');
    if (!container) return;
    const ultimas = compras.slice(-5).reverse();
    
    container.innerHTML = ultimas.length === 0 ? '<p style="color:#999;text-align:center;">Sin compras</p>' : '';
    ultimas.forEach(c => {
        const estado = c.vendido ? '<span style="color:#4CAF50">(Vendida)</span>' : '<span style="color:#FF9800">(Pendiente)</span>';
        container.innerHTML += `<div class="list-item">
            <div class="item-title">${c.proveedor} ${estado}</div>
            <div class="item-detail">${formatCurrency(c.costoTotalLocal)}</div>
        </div>`;
    });
}

// Exponer funciones
window.loadShoppingForm = loadShoppingForm;
window.updateShoppingPreview = updateShoppingPreview;
window.saveCompra = saveCompra;
window.renderComprasList = renderComprasList;
window.renderLastCompras = renderLastCompras;
