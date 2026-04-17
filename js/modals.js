// js/modals.js
// Lógica de Modales y Edición

// Función para cambiar porcentaje del diezmo
function showDiezmo() {
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:10000;display:flex;align-items:center;justify-content:center;';
    
    const content = document.createElement('div');
    content.style.cssText = 'background:white;border-radius:12px;padding:20px;max-width:300px;width:90%;box-shadow:0 10px 30px rgba(0,0,0,0.3);';
    
    const porcentajeActual = config.diezmoPorciento || 10;
    
    content.innerHTML = `
        <h3 style="margin-top:0; text-align:center;">🔢 Porcentaje de Diezmo</h3>
        <p style="text-align:center; color:#666; font-size:14px;">Actual: ${porcentajeActual}%</p>
        <div style="margin:15px 0;">
            <label style="display:block; margin-bottom:5px; font-weight:bold;">Nuevo Porcentaje (%)</label>
            <input type="number" id="diezmo-input" value="${porcentajeActual}" min="0" max="100" step="0.1" style="width:100%; padding:10px; font-size:16px; border:2px solid #FF9800; border-radius:8px; text-align:center;">
        </div>
        <div style="display:flex; flex-direction:column; gap:10px; margin-top:15px;">
            <button id="btn-guardar-diezmo" style="background:#FF9800; color:white; padding:12px; border:none; border-radius:8px; font-weight:bold;">💾 Guardar</button>
            <button id="btn-cerrar-diezmo" style="background:#eee; color:#333; padding:10px; border:none; border-radius:8px;">Cancelar</button>
        </div>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    content.querySelector('#btn-cerrar-diezmo').onclick = () => modal.remove();
    content.querySelector('#btn-guardar-diezmo').onclick = () => {
        const nuevoValor = parseFloat(document.getElementById('diezmo-input').value);
        if (isNaN(nuevoValor) || nuevoValor < 0 || nuevoValor > 100) {
            alert('Ingrese un valor válido entre 0 y 100');
            return;
        }
        config.diezmoPorciento = nuevoValor;
        if (typeof saveData === 'function') saveData();
        if (typeof updateDashboard === 'function') updateDashboard();
        alert(`✅ Porcentaje de diezmo actualizado a ${nuevoValor}%`);
        modal.remove();
    };
}

function abrirModalOpciones(id) {
    const venta = ventas.find(v => String(v.id) === String(id));
    if (!venta) return;
    
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:10000;display:flex;align-items:center;justify-content:center;';
    
    const content = document.createElement('div');
    content.style.cssText = 'background:white;border-radius:12px;padding:20px;max-width:350px;width:90%;box-shadow:0 10px 30px rgba(0,0,0,0.3);';
    
    content.innerHTML = `
        <h3 style="margin-top:0; text-align:center;">Opción de Venta</h3>
        ${venta.facturaNum ? '<p style="text-align:center; color:#9C27B0; font-weight:bold; font-size:18px;">' + venta.facturaNum + '</p>' : ''}
        <p><strong>Cliente:</strong> ${venta.cliente || 'N/A'}</p>
        <p><strong>Total:</strong> ${formatCurrency(venta.totalVenta)}</p>
        <div style="display:flex; flex-direction:column; gap:10px; margin-top:20px;">
            <button id="m-wa" style="background:#25D366; color:white; padding:12px; border:none; border-radius:8px; font-weight:bold;">📱 Enviar por WhatsApp</button>
            <button id="m-ed" style="background:#FF9800; color:white; padding:10px; border:none; border-radius:8px;">✏️ Editar Venta</button>
            <button id="m-el" style="background:#f44336; color:white; padding:10px; border:none; border-radius:8px;">🗑️ Eliminar</button>
            <button id="m-ce" style="background:#eee; color:#333; padding:10px; border:none; border-radius:8px; margin-top:5px;">Cerrar</button>
        </div>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    content.querySelector('#m-wa').onclick = () => { sendVentaWhatsApp(id); modal.remove(); };
    content.querySelector('#m-ce').onclick = () => modal.remove();
    content.querySelector('#m-el').onclick = () => { eliminarVenta(id); modal.remove(); };
    content.querySelector('#m-ed').onclick = () => { editarVenta(id); modal.remove(); };
    
    modal.onclick = (e) => { if(e.target === modal) modal.remove(); };
}

function eliminarVenta(id) {
    if(!confirm('¿Eliminar esta venta?')) return;
    ventas = ventas.filter(v => String(v.id) !== String(id));
    saveData();
    updateDashboard();
    renderVentasList();
}

function editarVenta(id) {
    const v = ventas.find(vent => String(vent.id) === String(id));
    if(!v) return;
    
    // Guardar ID para edición (no eliminar aún)
    window.ventaEditandoId = id;
    
    document.getElementById('venta-articulo').value = v.articulo;
    document.getElementById('venta-precio').value = v.precioVenta;
    document.getElementById('venta-cliente').value = v.cliente || '';
    document.getElementById('venta-telefono').value = v.telefono || '';
    document.getElementById('venta-envio').value = v.costoEnvio || '';
    document.getElementById('venta-metodo-pago').value = v.metodoPago || 'efectivo';
    
    showSales();
    alert('✏️ Modo Edición: Cambia los datos y presiona "Registrar Factura" para guardar.');
}

function abrirModalCompra(id) {
    const compra = compras.find(c => String(c.id) === String(id));
    if (!compra) return;
    
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:10000;display:flex;align-items:center;justify-content:center;';
    
    const content = document.createElement('div');
    content.style.cssText = 'background:white;border-radius:12px;padding:20px;max-width:350px;width:90%;';
    
    content.innerHTML = `
        <h3>Opciones de Compra</h3>
        <p><strong>Proveedor:</strong> ${compra.proveedor}</p>
        <p><strong>Inversión:</strong> ${formatCurrency(compra.costoTotalLocal)}</p>
        <div style="display:flex; flex-direction:column; gap:10px; margin-top:15px;">
            <button id="c-ed" style="background:#2196F3; color:white; padding:10px; border:none; border-radius:8px;">✏️ Editar Compra</button>
            <button id="c-el" style="background:#f44336; color:white; padding:10px; border:none; border-radius:8px;">🗑️ Eliminar</button>
            <button id="c-ce" style="background:#eee; padding:10px; border:none; border-radius:8px;">Cerrar</button>
        </div>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    content.querySelector('#c-ce').onclick = () => modal.remove();
    content.querySelector('#c-el').onclick = () => { deleteCompra(id); modal.remove(); };
    content.querySelector('#c-ed').onclick = () => { editarCompra(id); modal.remove(); };
    
    modal.onclick = (e) => { if(e.target === modal) modal.remove(); };
}

function deleteCompra(id) {
    if(!confirm('¿Eliminar esta compra?')) return;
    compras = compras.filter(c => String(c.id) !== String(id));
    saveData();
    renderComprasList();
    updateDashboard();
}

function editarCompra(id) {
    const c = compras.find(comp => String(comp.id) === String(id));
    if(!c) return;
    
    showShopping(); // Esto limpia el formulario antes de rellenarlo
    
    // Guardar ID para edición (NO eliminar la compra)
    window.compraEditandoId = id;
    
    document.getElementById('compra-proveedor').value = c.proveedor;
    document.getElementById('compra-detalles').value = c.detalles || '';
    document.getElementById('compra-precio-venta').value = c.precioVenta || '';
    
    if (document.getElementById('compra-costo')) document.getElementById('compra-costo').value = c.costoTotalLocal || 0;
    if (document.getElementById('compra-costo-tipo')) document.getElementById('compra-costo-tipo').value = 'RD$';
    if (document.getElementById('compra-envio')) document.getElementById('compra-envio').value = '';
    if (document.getElementById('compra-otros')) document.getElementById('compra-otros').value = '';
    
    if (document.getElementById('compra-metodo-pago') && c.metodoPago) {
        document.getElementById('compra-metodo-pago').value = c.metodoPago;
    }
    
    if (typeof updateShoppingPreview === 'function') updateShoppingPreview();
    
    alert('✏️ Modo Edición: Cambia los datos y presiona "Guardar Compra" para actualizar.');
}

function mostrarHistorialDiezmo() {
    // Reutilizando la lógica que tenías para el modal de diezmo
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:10000;display:flex;align-items:center;justify-content:center;';
    const content = document.createElement('div');
    content.style.cssText = 'background:white;border-radius:12px;padding:20px;max-width:350px;width:90%;max-height:80vh;overflow-y:auto;';
    
    let html = '<h3 style="text-align:center; color:#FF9800;">🙏 Diezmo de los últimos meses</h3>';
    const now = new Date();
    for (let i = 0; i < 6; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const mNm = d.toLocaleString('es-DO', { month: 'long', year: 'numeric' });
        const vMes = ventas.filter(v => { const vd = new Date(v.fecha); return vd.getMonth() === d.getMonth() && vd.getFullYear() === d.getFullYear(); });
        const dTotal = vMes.reduce((s, v) => s + (v.diezmo || 0), 0);
        html += `<div style="display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid #eee;">
            <span>${mNm}</span>
            <strong style="color:#FF9800;">${formatCurrency(dTotal)}</strong>
        </div>`;
    }
    
    html += '<button id="d-ce" style="width:100%; margin-top:20px; padding:10px; background:#666; color:white; border:none; border-radius:8px;">Cerrar</button>';
    content.innerHTML = html;
    modal.appendChild(content);
    document.body.appendChild(modal);
    content.querySelector('#d-ce').onclick = () => modal.remove();
}

// Exponer funciones
window.abrirModalOpciones = abrirModalOpciones;
window.abrirModalCompra = abrirModalCompra;
window.eliminarVenta = eliminarVenta;
window.editarVenta = editarVenta;
window.deleteCompra = deleteCompra;
window.editarCompra = editarCompra;
window.mostrarHistorialDiezmo = mostrarHistorialDiezmo;
window.showDiezmo = showDiezmo;
