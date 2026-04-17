// js/inventory.js
// Gestión de Inventario

function showInventario() {
    loadData();
    actualizarResumenInventario();
    renderizarInventario();
    cargarUltimoMargenInv();
    showScreen('inventario-screen');
}

function actualizarResumenInventario() {
    const totalArticulos = inventario.reduce((sum, item) => sum + item.cantidad, 0);
    const valorTotal = inventario.reduce((sum, item) => sum + (item.cantidad * item.costoUnitario), 0);
    const gananciaPotencial = inventario.reduce((sum, item) => {
        const gananciaPorUnidad = item.precioVenta - item.costoUnitario;
        return sum + (gananciaPorUnidad * item.cantidad);
    }, 0);
    const stockBajo = inventario.filter(item => item.cantidad <= (item.stockMinimo || 5)).length;

    const tasa = config.tasaCambio || 1;
    const monedaSeleccionada = document.getElementById('inv-resumen-moneda')?.value || 'USD';
    const setText = (id, text) => { if (document.getElementById(id)) document.getElementById(id).textContent = text; };

    const format = (val) => {
        if (monedaSeleccionada === 'USD') {
            return formatUSD(val / tasa);
        }
        return formatCurrency(val);
    };

    setText('inv-total-articulos', totalArticulos);
    setText('inv-valor-total', format(valorTotal));
    setText('inv-ganancia-potencial', format(gananciaPotencial));
    
    // Etiquetas de apoyo (siempre el contrario)
    setText('inv-valor-total-usd', monedaSeleccionada === 'USD' ? formatCurrency(valorTotal) : formatUSD(valorTotal / tasa));
    setText('inv-ganancia-potencial-usd', monedaSeleccionada === 'USD' ? formatCurrency(gananciaPotencial) : formatUSD(gananciaPotencial / tasa));

    // Nuevas etiquetas solicitadas
    setText('inv-resumen-costo', format(valorTotal));
    setText('inv-resumen-total-venta', format(valorTotal + gananciaPotencial));

    const stockBajoLabel = document.getElementById('inv-stock-bajo-label');
    if (stockBajoLabel) {
        stockBajoLabel.style.display = stockBajo > 0 ? 'block' : 'none';
        const stockBajoEl = document.getElementById('inv-stock-bajo');
        if (stockBajoEl) stockBajoEl.textContent = stockBajo;
    }
    
    // USD Elements
    setText('inv-valor-total-usd', '$' + (valorTotal / tasa).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' USD');
    setText('inv-ganancia-potencial-usd', '$' + (gananciaPotencial / tasa).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' USD');
}

function renderizarInventario() {
    const container = document.getElementById('inventario-list');
    if (!container) return;
    
    if (inventario.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">No hay artículos en el inventario</p>';
        return;
    }
    
    // Migrar productos antiguos (compatibilidad con formato tallas object)
    let necesitaGuardar = false;
    inventario.forEach(item => {
        // Si tiene el formato antiguo con tallas object, convertir a string
        if (item.tallas && typeof item.tallas === 'object' && !item.talla) {
            const tallasList = Object.keys(item.tallas);
            if (tallasList.length > 0) {
                item.talla = tallasList.join(', ');
                // Calcular cantidad total de las tallas
                item.cantidad = Object.values(item.tallas).reduce((sum, c) => sum + c, 0);
                necesitaGuardar = true;
            }
        }
    });
    
    // Guardar cambios si se migró algún producto
    if (necesitaGuardar) saveData();
    
    const busqueda = document.getElementById('inv-buscar')?.value.toLowerCase() || '';
    const categoriaFiltro = document.getElementById('inv-filtro-categoria')?.value || '';
    
    let filtrados = inventario.filter(item => {
        const matchesBusqueda = item.nombre && item.nombre.toLowerCase().includes(busqueda) || (item.proveedor && item.proveedor.toLowerCase().includes(busqueda));
        const matchesCategoria = !categoriaFiltro || item.categoria === categoriaFiltro;
        return matchesBusqueda && matchesCategoria;
    });
    
    filtrados.sort((a, b) => a.nombre.localeCompare(b.nombre));
    
    const tasa = config.tasaCambio || 1;
    const vistaTabla = localStorage.getItem('calc_inventario_vista') === 'tabla';
    
    // Botón para cambiar vista
    let html = `<div style="display: flex; justify-content: flex-end; margin-bottom: 15px; gap: 8px;">
        <button onclick="cambiarVistaInventario('tarjetas')" style="padding: 6px 12px; border: 1px solid #ddd; border-radius: 6px; background: ${!vistaTabla ? '#e3f2fd' : '#f5f5f5'}; color: ${!vistaTabla ? '#2196F3' : '#666'}; cursor: pointer; font-size: 12px;">🎴 Tarjetas</button>
        <button onclick="cambiarVistaInventario('tabla')" style="padding: 6px 12px; border: 1px solid #ddd; border-radius: 6px; background: ${vistaTabla ? '#e3f2fd' : '#f5f5f5'}; color: ${vistaTabla ? '#2196F3' : '#666'}; cursor: pointer; font-size: 12px;">📊 Tabla</button>
    </div>`;
    
    if (vistaTabla) {
        // VISTA TABLA
        html += `<div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; font-size: 12px; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <thead>
                    <tr style="background: linear-gradient(135deg, #795548, #5D4037); color: white;">
                        <th style="padding: 10px 8px; text-align: left;">Producto</th>
                        <th style="padding: 10px 8px; text-align: center;">📦 Stock</th>
                        <th style="padding: 10px 8px; text-align: right;">💰 Costo</th>
                        <th style="padding: 10px 8px; text-align: right;">🏷️ Venta</th>
                        <th style="padding: 10px 8px; text-align: right;">📈 Margen</th>
                        <th style="padding: 10px 8px; text-align: right;">💵 Valor Inv.</th>
                        <th style="padding: 10px 8px; text-align: center;">Acciones</th>
                    </tr>
                </thead>
                <tbody>`;
        
        filtrados.forEach((item, index) => {
            const stockBajo = item.cantidad <= (item.stockMinimo || 5);
            const valorInventario = item.cantidad * item.costoUnitario;
            const gananciaUnit = item.precioVenta - item.costoUnitario;
            const margen = item.costoUnitario > 0 ? ((gananciaUnit / item.costoUnitario) * 100).toFixed(0) : 0;
            const bgColor = index % 2 === 0 ? '#fff' : '#f9f9f9';
            const stockColor = stockBajo ? '#f44336' : '#4CAF50';
            
            html += `<tr style="background: ${bgColor}; border-bottom: 1px solid #eee;">
                <td style="padding: 8px;">
                    <div style="font-weight: bold; color: #333;">${item.nombre}</div>
                    <div style="font-size: 10px; color: #666;">${item.categoria || 'General'} ${item.talla ? '| 📏 ' + item.talla : ''}</div>
                    <div style="font-size: 10px; color: #999;">${item.proveedor || 'Sin proveedor'}</div>
                </td>
                <td style="padding: 8px; text-align: center;">
                    <span style="display: inline-block; padding: 2px 8px; border-radius: 12px; background: ${stockBajo ? '#FFEBEE' : '#E8F5E9'}; color: ${stockColor}; font-weight: bold;">${item.cantidad}</span>
                    ${stockBajo ? '<span style="font-size: 9px; color: #f44336;">⚠️</span>' : ''}
                </td>
                <td style="padding: 8px; text-align: right; color: #666;">${formatCurrency(item.costoUnitario)}</td>
                <td style="padding: 8px; text-align: right; color: #2E7D32; font-weight: bold;">${formatCurrency(item.precioVenta)}</td>
                <td style="padding: 8px; text-align: right;">
                    <span style="color: #7B1FA2; font-weight: bold;">${margen}%</span>
                    <div style="font-size: 10px; color: #999;">+${formatCurrency(gananciaUnit)}</div>
                </td>
                <td style="padding: 8px; text-align: right; color: #1976D2; font-weight: bold;">${formatCurrency(valorInventario)}</td>
                <td style="padding: 8px; text-align: center;">
                    <button onclick="editarInventario(${item.id})" style="background: #e3f2fd; color: #2196F3; border: none; padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer; margin-right: 4px;">✏️</button>
                    <button onclick="eliminarInventario(${item.id})" style="background: #ffebee; color: #f44336; border: none; padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer;">🗑️</button>
                </td>
            </tr>`;
        });
        
        html += `</tbody></table></div>`;
    } else {
        // VISTA TARJETAS (original)
        filtrados.forEach(item => {
        const stockBajo = item.cantidad <= (item.stockMinimo || 5);
        const valorInventario = item.cantidad * item.costoUnitario;
        const gananciaUnit = item.precioVenta - item.costoUnitario;
        const margen = item.costoUnitario > 0 ? ((gananciaUnit / item.costoUnitario) * 100).toFixed(0) : 0;
        
        // Colores según stock
        const stockColor = stockBajo ? '#f44336' : (item.cantidad < (item.stockMinimo || 5) * 2 ? '#FF9800' : '#4CAF50');
        const stockBg = stockBajo ? '#FFEBEE' : (item.cantidad < (item.stockMinimo || 5) * 2 ? '#FFF3E0' : '#E8F5E9');
        
        const categoriaEmoji = { 'ropa': '👕', 'calzado': '👟', 'accesorios': '👜', 'otros': '📦' }[item.categoria] || '📦';
        
        // Mostrar talla/variante si existe
        let tallaHtml = '';
        if (item.talla) {
            tallaHtml = `<span style="display: inline-block; background: #E3F2FD; color: #1976D2; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; margin: 4px 0;">📏 ${item.talla}</span>`;
        }
        
        html += `
        <div class="card" style="margin-bottom: 15px; border-left: 5px solid ${stockColor}; padding: 15px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                <div style="flex: 1;">
                    <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #888; display: block; margin-bottom: 4px;">${item.categoria || 'General'}</span>
                    <h3 style="margin: 0; font-size: 17px; color: #333;">${categoriaEmoji} ${item.nombre}</h3>
                    ${tallaHtml}
                    <div style="font-size: 12px; color: #666; margin-top: 4px;">Proveedor: ${item.proveedor || 'N/A'}</div>
                </div>
                <div style="text-align: right;">
                    <div style="font-weight: bold; color: #2E7D32; font-size: 18px;">${formatCurrency(item.precioVenta)}</div>
                    <div style="font-size: 11px; color: #888;">Costo: ${formatCurrency(item.costoUnitario)}</div>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                <div style="background: ${stockBg}; padding: 8px 12px; border-radius: 8px; display: flex; align-items: center; justify-content: space-between;">
                    <span style="font-size: 12px; color: #333;">Stock Total: <strong>${item.cantidad}</strong></span>
                    <span style="font-size: 10px; font-weight: bold; color: ${stockColor};">${stockBajo ? '⚠️ BAJO' : '✅ OK'}</span>
                </div>
                <div style="background: #F3E5F5; padding: 8px 12px; border-radius: 8px; display: flex; align-items: center; justify-content: space-between;">
                    <span style="font-size: 12px; color: #333;">Margen: <strong>${margen}%</strong></span>
                    <span style="font-size: 10px; font-weight: bold; color: #7B1FA2;">+${formatCurrency(gananciaUnit)}</span>
                </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 1px solid #eee;">
                <div style="font-size: 11px; color: #999;">Agregado: ${formatDate(item.fecha)}</div>
                <div style="display: flex; gap: 8px;">
                    <button onclick="editarInventario(${item.id})" style="background: #e3f2fd; color: #2196F3; border: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: bold; cursor: pointer;">✏️</button>
                    <button onclick="eliminarInventario(${item.id})" style="background: #ffebee; color: #f44336; border: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: bold; cursor: pointer;">🗑️</button>
                </div>
            </div>
        </div>
        `;
    });
    } // Cierre del else (vista tarjetas)
    
    container.innerHTML = html;
}

function filtrarInventario() { renderizarInventario(); }

function cambiarVistaInventario(vista) {
    localStorage.setItem('calc_inventario_vista', vista);
    renderizarInventario();
}

function agregarInventario() {
    const nombre = document.getElementById('inv-nombre').value.trim();
    const categoria = document.getElementById('inv-categoria').value;
    const cantidad = parseInt(document.getElementById('inv-cantidad').value) || 0;
    const costo = parseFloat(document.getElementById('inv-costo').value) || 0;
    const precio = parseFloat(document.getElementById('inv-precio').value) || 0;
    const talla = document.getElementById('inv-talla')?.value.trim() || '';
    const proveedor = document.getElementById('inv-proveedor')?.value.trim() || '';
    const notas = document.getElementById('inv-notas')?.value.trim() || '';
    const moneda = document.getElementById('inv-moneda')?.value || 'RD$';
    const tasa = config.tasaCambio || 1;
    
    if (!nombre || cantidad <= 0 || costo <= 0 || precio <= 0) { alert('Cargue todos los campos correctamente'); return; }
    
    const costoEnRD = moneda === 'USD' ? costo * tasa : costo;
    const precioEnRD = moneda === 'USD' ? precio * tasa : precio;
    
    // Construir nombre completo con talla si existe
    const nombreCompleto = talla ? `${nombre} (${talla})` : nombre;
    
    inventario.push({
        id: Date.now(),
        nombre: nombreCompleto,
        nombreBase: nombre,
        talla: talla,
        categoria,
        cantidad,
        costoUnitario: Math.round(costoEnRD * 100) / 100,
        precioVenta: Math.round(precioEnRD * 100) / 100,
        proveedor,
        notas,
        stockMinimo: 5,
        fecha: new Date().toISOString().split('T')[0],
        vendidos: 0
    });
    
    saveData();
    actualizarResumenInventario();
    renderizarInventario();
    
    // Confirmación de guardado
    alert(`✅ "${nombreCompleto}" agregado al inventario\nCantidad: ${cantidad} | Precio: ${formatCurrency(precioEnRD)}`);
    
    // Limpiar campos (excepto margen que se mantiene)
    ['inv-nombre', 'inv-cantidad', 'inv-costo', 'inv-precio', 'inv-talla', 'inv-proveedor', 'inv-notas'].forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
}

function eliminarInventario(id) {
    if (!confirm('¿Eliminar artículo?')) return;
    inventario = inventario.filter(i => i.id !== id);
    saveData();
    actualizarResumenInventario();
    renderizarInventario();
}

function editarInventario(id) {
    const item = inventario.find(i => i.id === id);
    if (!item) return;
    
    document.getElementById('editar-inv-id').value = id;
    document.getElementById('editar-inv-nombre').value = item.nombre;
    document.getElementById('editar-inv-cantidad').value = item.cantidad;
    document.getElementById('editar-inv-costo').value = item.costoUnitario;
    document.getElementById('editar-inv-precio').value = item.precioVenta;
    
    document.getElementById('modal-editar-inventario').style.display = 'block';
}

function guardarEdicionInventario() {
    const id = parseFloat(document.getElementById('editar-inv-id').value);
    const item = inventario.find(i => i.id === id);
    if (!item) return;
    
    item.nombre = document.getElementById('editar-inv-nombre').value;
    item.cantidad = parseInt(document.getElementById('editar-inv-cantidad').value);
    item.costoUnitario = parseFloat(document.getElementById('editar-inv-costo').value);
    item.precioVenta = parseFloat(document.getElementById('editar-inv-precio').value);
    
    saveData();
    actualizarResumenInventario();
    renderizarInventario();
    cerrarModalEditarInventario();
    
    alert(`✅ "${item.nombre}" actualizado correctamente`);
}

function cerrarModalEditarInventario() {
    document.getElementById('modal-editar-inventario').style.display = 'none';
}

function updateInventarioPreview() {
    const tasa = config.tasaCambio || 1;
    const moneda = document.getElementById('inv-moneda')?.value || 'RD$';
    
    const costo = parseFloat(document.getElementById('inv-costo')?.value) || 0;
    const precio = parseFloat(document.getElementById('inv-precio')?.value) || 0;
    
    if (document.getElementById('inv-costo-conversion')) {
        document.getElementById('inv-costo-conversion').textContent = moneda === 'USD' && costo > 0 ? 'RD$ ' + (costo * tasa).toFixed(2) : '';
    }
    if (document.getElementById('inv-precio-conversion')) {
        document.getElementById('inv-precio-conversion').textContent = moneda === 'USD' && precio > 0 ? 'RD$ ' + (precio * tasa).toFixed(2) : '';
    }
}

function calcularPrecioDesdeMargenInv() {
    const costo = parseFloat(document.getElementById('inv-costo')?.value) || 0;
    const margen = parseFloat(document.getElementById('inv-margen')?.value) || 50;
    const precioEl = document.getElementById('inv-precio');
    
    if (costo > 0 && precioEl) {
        const precioVenta = costo * (1 + margen / 100);
        precioEl.value = Math.round(precioVenta * 100) / 100;
    }
    
    // Guardar margen
    localStorage.setItem('calc_ultimo_margen_inv', margen.toString());
    updateInventarioPreview();
}

function actualizarMargenInv() {
    const costo = parseFloat(document.getElementById('inv-costo')?.value) || 0;
    const precio = parseFloat(document.getElementById('inv-precio')?.value) || 0;
    const margenEl = document.getElementById('inv-margen');
    
    if (costo > 0 && precio > 0 && margenEl) {
        const margen = ((precio - costo) / costo * 100);
        margenEl.value = Math.round(margen).toString();
        localStorage.setItem('calc_ultimo_margen_inv', margenEl.value);
    }
    updateInventarioPreview();
}

function cargarUltimoMargenInv() {
    const ultimoMargen = localStorage.getItem('calc_ultimo_margen_inv') || localStorage.getItem('calc_ultimo_margen') || '50';
    const margenEl = document.getElementById('inv-margen');
    if (margenEl) margenEl.value = ultimoMargen;
}

// Exponer funciones
window.showInventario = showInventario;
window.filtrarInventario = filtrarInventario;
window.cambiarVistaInventario = cambiarVistaInventario;
window.agregarInventario = agregarInventario;
window.eliminarInventario = eliminarInventario;
window.editarInventario = editarInventario;
window.guardarEdicionInventario = guardarEdicionInventario;
window.cerrarModalEditarInventario = cerrarModalEditarInventario;
window.updateInventarioPreview = updateInventarioPreview;
window.calcularPrecioDesdeMargenInv = calcularPrecioDesdeMargenInv;
window.actualizarMargenInv = actualizarMargenInv;
window.cargarUltimoMargenInv = cargarUltimoMargenInv;

// --- AGREGADO DE PRODUCTOS EN BLOQUE (DESDE COMPRAS) ---

function agregarDetallesAInventario() {
    console.log('=== agregarDetallesAInventario() ===');
    
    const detallesEl = document.getElementById('compra-detalles');
    if (!detallesEl) {
        console.error('No se encontró textarea compra-detalles');
        alert('Error: No se encontró el campo de detalles');
        return;
    }
    
    const detalles = detallesEl.value.trim();
    console.log('Detalles:', detalles);
    
    if (!detalles) { alert('No hay detalles para agregar. Escribe los productos en el formato: Nombre - Precio'); return; }
    
    const lineas = detalles.split('\n');
    const productos = [];
    
    lineas.forEach((linea, index) => {
        linea = linea.trim();
        if (!linea) return;
        
        // Formato: "Nombre - Precio"
        const match = linea.match(/[-\s]*(\d+(?:\.\d{2})?)\s*$/);
        const precioSugerido = match ? parseFloat(match[1]) : 0;
        const nombre = match ? linea.replace(/[-\s]*\d+(?:\.\d{2})?\s*$/, '').trim() : linea;
        
        console.log(`Producto ${index}:`, { nombre, precioSugerido });
        productos.push({ nombre, precioSugerido });
    });
    
    if (productos.length === 0) {
        alert('No se detectaron productos. Usa el formato: Nombre - Precio');
        return;
    }
    
    // Detectar moneda seleccionada en compras
    const monedaSeleccionada = document.getElementById('compra-moneda-general')?.value || 'USD';
    const simbolo = monedaSeleccionada === 'USD' ? '$' : 'RD$';
    
    let html = `<div style="background:#e3f2fd; padding:10px; border-radius:8px; margin-bottom:15px;">
        <strong>📦 Detectados ${productos.length} productos</strong>
        <div style="font-size:12px; color:#666; margin-top:5px;">Moneda: ${monedaSeleccionada}</div>
    </div>`;
    
    productos.forEach((p, i) => {
        html += `<div style="background:#f9f9f9; padding:10px; border-radius:8px; border:1px solid #ddd; margin-bottom:10px;">
            <div style="font-weight:bold; margin-bottom:10px; color:#795548;">${i+1}. ${p.nombre}</div>
            
            <div style="margin-bottom:8px;">
                <label style="font-size:11px; color:#666; display:block; margin-bottom:2px;">📏 Tallas y Cantidades (ej: S:20,M:30)</label>
                <input type="text" id="p-tallas-${i}" placeholder="S:20,M:30,L:25" style="padding:5px; width:100%;" onchange="calcularCantidadTotal(${i})">
            </div>
            
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:8px;">
                <div>
                    <label style="font-size:11px; color:#666; display:block; margin-bottom:2px;">📦 Cantidad Total</label>
                    <input type="number" id="p-cantidad-${i}" value="1" min="1" style="padding:5px; width:100%; background:#e8f5e9;" readonly>
                </div>
                <div>
                    <label style="font-size:11px; color:#666; display:block; margin-bottom:2px;">💰 Costo Unitario (${simbolo})</label>
                    <input type="number" id="p-costo-${i}" placeholder="Ej: 500" step="0.01" style="padding:5px; width:100%;">
                </div>
            </div>
            
            <div style="display:grid; grid-template-columns:1fr 2fr; gap:10px; align-items:end;">
                <div>
                    <label style="font-size:11px; color:#666; display:block; margin-bottom:2px;">📈 Margen %</label>
                    <select id="p-margen-${i}" onchange="calcularPrecioVenta(${i})" style="padding:5px; width:100%; font-size:12px;">
                        <option value="30">30%</option>
                        <option value="40">40%</option>
                        <option value="50" selected>50%</option>
                        <option value="60">60%</option>
                        <option value="70">70%</option>
                        <option value="80">80%</option>
                        <option value="100">100%</option>
                    </select>
                </div>
                <div>
                    <label style="font-size:11px; color:#666; display:block; margin-bottom:2px;">🏷️ Precio de Venta (${simbolo})</label>
                    <input type="number" id="p-precio-${i}" value="${p.precioSugerido}" placeholder="Ej: 800" step="0.01" style="padding:5px; width:100%;" onchange="actualizarMargen(${i})">
                </div>
            </div>
            
            <input type="hidden" id="p-nombre-${i}" value="${p.nombre}">
            
            <div style="font-size:10px; color:#888; margin-top:8px; background:#fffde7; padding:5px; border-radius:4px;">
                💡 <b>Tip:</b> Escribe <b>S:20,M:30,L:25</b> para crear 3 productos con tallas. Déjalo vacío para producto sin talla.
            </div>
        </div>`;
    });
    
    html += `<script>
        // Cargar último margen usado
        const ultimoMargen = localStorage.getItem('calc_ultimo_margen') || '50';
        
        function calcularCantidadTotal(index) {
            const tallasInput = document.getElementById('p-tallas-' + index)?.value || '';
            let total = 0;
            if (tallasInput) {
                tallasInput.split(',').forEach(t => {
                    const match = t.match(/:(\\d+)/);
                    if (match) total += parseInt(match[1]) || 0;
                });
            }
            const cantidadEl = document.getElementById('p-cantidad-' + index);
            if (cantidadEl) cantidadEl.value = total || 1;
        }
        
        function calcularPrecioVenta(index) {
            const costo = parseFloat(document.getElementById('p-costo-' + index)?.value) || 0;
            const margen = parseFloat(document.getElementById('p-margen-' + index)?.value) || 50;
            const precioEl = document.getElementById('p-precio-' + index);
            
            if (costo > 0 && precioEl) {
                const precioVenta = costo * (1 + margen / 100);
                precioEl.value = Math.round(precioVenta * 100) / 100;
            }
            
            // Guardar margen para próxima vez
            localStorage.setItem('calc_ultimo_margen', margen.toString());
        }
        
        function actualizarMargen(index) {
            const costo = parseFloat(document.getElementById('p-costo-' + index)?.value) || 0;
            const precio = parseFloat(document.getElementById('p-precio-' + index)?.value) || 0;
            const margenEl = document.getElementById('p-margen-' + index);
            
            if (costo > 0 && precio > 0 && margenEl) {
                const margen = ((precio - costo) / costo * 100);
                margenEl.value = Math.round(margen).toString();
                localStorage.setItem('calc_ultimo_margen', margenEl.value);
            }
        }
        
        // Aplicar último margen a todos los selects y calcular precios
        document.querySelectorAll('[id^="p-margen-"]').forEach((el, index) => {
            el.value = ultimoMargen;
            // Calcular precio cuando se ingrese costo
            const costoEl = document.getElementById('p-costo-' + index);
            if (costoEl) {
                costoEl.addEventListener('input', () => calcularPrecioVenta(index));
            }
        });
    </script>`;
    
    window.batchCount = productos.length;
    document.getElementById('modal-inventario-contenido').innerHTML = html;
    document.getElementById('modal-inventario-batch').style.display = 'block';
}

function cerrarModalInventarioBatch() {
    document.getElementById('modal-inventario-batch').style.display = 'none';
}

function guardarProductosInventarioBatch() {
    console.log('=== guardarProductosInventarioBatch() ===');
    
    const count = window.batchCount || 0;
    const tasa = config.tasaCambio || 1;
    
    console.log('Productos base a procesar:', count);
    
    // Detectar moneda seleccionada en compras
    const monedaSeleccionada = document.getElementById('compra-moneda-general')?.value || 'USD';
    
    let guardados = 0;
    let itemId = Date.now();
    
    for (let i = 0; i < count; i++) {
        const nombre = document.getElementById(`p-nombre-${i}`)?.value || '';
        const tallasInput = document.getElementById(`p-tallas-${i}`)?.value?.trim() || '';
        const costo = parseFloat(document.getElementById(`p-costo-${i}`)?.value) || 0;
        const precio = parseFloat(document.getElementById(`p-precio-${i}`)?.value) || 0;
        
        console.log(`Producto ${i}:`, { nombre, tallasInput, costo, precio });
        
        if (!nombre || costo <= 0 || precio <= 0) {
            console.log(`Producto ${i} omitido - faltan datos`);
            continue;
        }
        
        // Si la moneda es USD, convertir a RD$. Si es RD$, guardar directo.
        const costoFinal = monedaSeleccionada === 'USD' ? costo * tasa : costo;
        const precioFinal = monedaSeleccionada === 'USD' ? precio * tasa : precio;
        
        // Procesar tallas
        if (tallasInput) {
            // Formato: S:20,M:30,L:25
            const tallasArray = tallasInput.split(',');
            tallasArray.forEach(tallaItem => {
                const match = tallaItem.match(/^\s*([^:]+):(\d+)\s*$/);
                if (match) {
                    const talla = match[1].trim();
                    const cantidadTalla = parseInt(match[2]) || 1;
                    
                    inventario.push({
                        id: itemId++,
                        nombre: `${nombre} (${talla})`,
                        nombreBase: nombre,
                        talla: talla,
                        categoria: 'otros',
                        cantidad: cantidadTalla,
                        costoUnitario: Math.round(costoFinal * 100) / 100,
                        precioVenta: Math.round(precioFinal * 100) / 100,
                        stockMinimo: 5,
                        fecha: new Date().toISOString().split('T')[0]
                    });
                    guardados++;
                }
            });
        } else {
            // Sin talla - producto simple
            const cantidadTotal = parseInt(document.getElementById(`p-cantidad-${i}`)?.value) || 1;
            
            inventario.push({
                id: itemId++,
                nombre: nombre,
                nombreBase: nombre,
                talla: '',
                categoria: 'otros',
                cantidad: cantidadTotal,
                costoUnitario: Math.round(costoFinal * 100) / 100,
                precioVenta: Math.round(precioFinal * 100) / 100,
                stockMinimo: 5,
                fecha: new Date().toISOString().split('T')[0]
            });
            guardados++;
        }
    }
    
    console.log('Total items guardados:', guardados);
    
    saveData();
    actualizarResumenInventario();
    renderizarInventario();
    cerrarModalInventarioBatch();
    alert(`${guardados} producto(s) agregado(s) al inventario`);
}

window.agregarDetallesAInventario = agregarDetallesAInventario;
window.cerrarModalInventarioBatch = cerrarModalInventarioBatch;
window.guardarProductosInventarioBatch = guardarProductosInventarioBatch;

// --- FUNCIONES INSTAGRAM / REDES SOCIALES ---

let productoSeleccionadoIG = null;

function mostrarMenuInstagram() {
    document.getElementById('modal-instagram').style.display = 'block';
    volverASeleccion();
    actualizarListaProductosInstagram();
    cargarMensajesRapidos(); // Cargar mensajes personalizados
}

function cerrarModalInstagram() {
    document.getElementById('modal-instagram').style.display = 'none';
    productoSeleccionadoIG = null;
}

function actualizarListaProductosInstagram() {
    const container = document.getElementById('ig-lista-productos');
    if (!container) return;
    
    if (inventario.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">No hay productos en el inventario</p>';
        return;
    }
    
    let html = '';
    inventario.forEach(item => {
        const categoriaEmoji = { 'ropa': '👕', 'calzado': '👟', 'accesorios': '👜', 'otros': '📦' }[item.categoria] || '📦';
        html += `<div onclick="seleccionarProductoInstagram(${item.id})" style="background: #f5f5f5; border: 2px solid #ddd; border-radius: 8px; padding: 12px; margin-bottom: 8px; cursor: pointer; transition: all 0.2s;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong>${categoriaEmoji} ${item.nombre}</strong>
                    <div style="font-size: 11px; color: #666;">Stock: ${item.cantidad} | ${formatCurrency(item.precioVenta)}</div>
                </div>
                <span style="color: #E1306C; font-size: 20px;">→</span>
            </div>
        </div>`;
    });
    
    container.innerHTML = html;
}

function seleccionarProductoInstagram(id) {
    productoSeleccionadoIG = inventario.find(i => i.id === id);
    if (!productoSeleccionadoIG) return;
    
    document.getElementById('ig-seleccion-producto').style.display = 'none';
    document.getElementById('ig-opciones-producto').style.display = 'block';
    document.getElementById('ig-btn-volver').style.display = 'inline-block';
    
    document.getElementById('ig-nombre-producto').textContent = productoSeleccionadoIG.nombre;
    document.getElementById('ig-detalles-producto').textContent = `Precio: ${formatCurrency(productoSeleccionadoIG.precioVenta)} | Stock: ${productoSeleccionadoIG.cantidad} unidades`;
}

function volverASeleccion() {
    document.getElementById('ig-seleccion-producto').style.display = 'block';
    document.getElementById('ig-opciones-producto').style.display = 'none';
    document.getElementById('ig-btn-volver').style.display = 'none';
    document.getElementById('ig-preview-container').style.display = 'none';
    productoSeleccionadoIG = null;
    actualizarListaProductosInstagram();
}

function copiarTextoInstagram() {
    if (!productoSeleccionadoIG) return;
    
    const texto = `🛍️ ${productoSeleccionadoIG.nombre}
💰 Precio: ${formatCurrency(productoSeleccionadoIG.precioVenta)}
${productoSeleccionadoIG.talla ? '📏 Talla/Variante: ' + productoSeleccionadoIG.talla : ''}
✨ ¡Escríbeme al DM para ordenar!
`;
    
    navigator.clipboard.writeText(texto).then(() => {
        alert('✅ Texto copiado para Instagram');
    }).catch(() => {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = texto;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        alert('✅ Texto copiado para Instagram');
    });
}

function generarLinkWhatsApp() {
    if (!productoSeleccionadoIG) return;
    
    const mensaje = `Hola, me interesa: ${productoSeleccionadoIG.nombre} - Precio: ${formatCurrency(productoSeleccionadoIG.precioVenta)}`;
    const telefono = config.telefono || '18000000000';
    const link = `https://wa.me/${telefono.replace(/\D/g, '')}?text=${encodeURIComponent(mensaje)}`;
    
    navigator.clipboard.writeText(link).then(() => {
        alert('✅ Link de WhatsApp copiado:\n' + link);
    });
}

// Mensajes rápidos por defecto
const MENSAJES_DEFAULT = {
    precio: '¡Hola! El precio es {precio}. ¿Te interesa?',
    tallas: 'Tengo en talla {talla}. ¿Cuál necesitas?',
    envio: 'Hago envíos a todo el país. El costo depende de la zona. ¿De dónde eres?',
    pago: 'Acepto transferencia bancaria, efectivo y tarjetas. ¿Cómo prefieres pagar?',
    confirmar: '¡Perfecto! Tu pedido está confirmado. Total: {precio}. ¿Cómo deseas pagar?'
};

// Variable para mensajes personalizados
let mensajesRapidos = { ...MENSAJES_DEFAULT };

// Cargar mensajes guardados
function cargarMensajesRapidos() {
    const guardados = localStorage.getItem('calc_mensajes_rapidos');
    if (guardados) {
        try {
            mensajesRapidos = { ...MENSAJES_DEFAULT, ...JSON.parse(guardados) };
        } catch (e) {
            mensajesRapidos = { ...MENSAJES_DEFAULT };
        }
    }
}

// Guardar mensajes
function guardarMensajesRapidos() {
    const precio = document.getElementById('msg-precio')?.value || MENSAJES_DEFAULT.precio;
    const tallas = document.getElementById('msg-tallas')?.value || MENSAJES_DEFAULT.tallas;
    const envio = document.getElementById('msg-envio')?.value || MENSAJES_DEFAULT.envio;
    const pago = document.getElementById('msg-pago')?.value || MENSAJES_DEFAULT.pago;
    const confirmar = document.getElementById('msg-confirmar')?.value || MENSAJES_DEFAULT.confirmar;
    
    mensajesRapidos = { precio, tallas, envio, pago, confirmar };
    localStorage.setItem('calc_mensajes_rapidos', JSON.stringify(mensajesRapidos));
    
    alert('✅ Mensajes guardados');
    toggleEditarMensajes();
}

// Restaurar mensajes por defecto
function restaurarMensajesDefault() {
    if (confirm('¿Restaurar mensajes por defecto?')) {
        mensajesRapidos = { ...MENSAJES_DEFAULT };
        localStorage.removeItem('calc_mensajes_rapidos');
        cargarMensajesEnFormulario();
        alert('✅ Mensajes restaurados');
    }
}

// Toggle modo edición
function toggleEditarMensajes() {
    const botonesDiv = document.getElementById('mensajes-botones');
    const edicionDiv = document.getElementById('mensajes-edicion');
    const btnEditar = document.getElementById('btn-editar-mensajes');
    
    if (edicionDiv.style.display === 'none') {
        // Mostrar edición
        cargarMensajesEnFormulario();
        botonesDiv.style.display = 'none';
        edicionDiv.style.display = 'block';
        btnEditar.textContent = '✕ Cancelar';
    } else {
        // Mostrar botones
        botonesDiv.style.display = 'flex';
        edicionDiv.style.display = 'none';
        btnEditar.textContent = '✏️ Editar';
    }
}

// Cargar mensajes en los campos de texto
function cargarMensajesEnFormulario() {
    if (document.getElementById('msg-precio')) {
        document.getElementById('msg-precio').value = mensajesRapidos.precio;
        document.getElementById('msg-tallas').value = mensajesRapidos.tallas;
        document.getElementById('msg-envio').value = mensajesRapidos.envio;
        document.getElementById('msg-pago').value = mensajesRapidos.pago;
        document.getElementById('msg-confirmar').value = mensajesRapidos.confirmar;
    }
}

function copiarMensajeRapido(tipo) {
    if (!productoSeleccionadoIG) return;
    
    // Cargar mensajes si no están cargados
    if (!mensajesRapidos.precio) cargarMensajesRapidos();
    
    let mensaje = mensajesRapidos[tipo] || MENSAJES_DEFAULT[tipo];
    
    // Reemplazar variables
    mensaje = mensaje
        .replace(/\{nombre\}/g, productoSeleccionadoIG.nombre)
        .replace(/\{precio\}/g, formatCurrency(productoSeleccionadoIG.precioVenta))
        .replace(/\{talla\}/g, productoSeleccionadoIG.talla || 'disponible')
        .replace(/\{stock\}/g, productoSeleccionadoIG.cantidad);
    
    navigator.clipboard.writeText(mensaje).then(() => {
        alert('✅ Mensaje copiado');
    });
}

function previewFotoInstagram(input) {
    if (!input.files || !input.files[0] || !productoSeleccionadoIG) return;
    
    const file = input.files[0];
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            generarImagenConEstilo(img);
        };
        img.src = e.target.result;
    };
    
    reader.readAsDataURL(file);
}

function generarImagenConEstilo(img) {
    if (!productoSeleccionadoIG) return;
    
    const estilo = document.getElementById('ig-estilo-fondo')?.value || 'rosa';
    const canvas = document.getElementById('ig-canvas');
    const ctx = canvas.getContext('2d');
    
    // Tamaño cuadrado para Instagram
    canvas.width = 1080;
    canvas.height = 1080;
    
    // Configuración según estilo
    let textColor = 'white';
    let priceColor = '#FFD700';
    let imgX = 0, imgY = 0, imgW = canvas.width, imgH = canvas.height;
    let textY = canvas.height - 150;
    let priceY = canvas.height - 60;
    let showBadge = true;
    let textBg = false;
    
    // Aplicar fondo y configurar layout según estilo
    if (estilo === 'full') {
        // Imagen completa de fondo, texto arriba
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        textColor = 'white';
        priceColor = '#FFD700';
        textY = 150;
        priceY = 230;
        showBadge = false;
        // Overlay oscuro para legibilidad
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(0, 0, canvas.width, 280);
    } else if (estilo === 'split') {
        // Split: imagen a la izquierda (60%), texto a la derecha (40%)
        const splitX = Math.floor(canvas.width * 0.6);
        const imgScale = Math.min(splitX / img.width, canvas.height / img.height);
        const drawW = img.width * imgScale;
        const drawH = img.height * imgScale;
        ctx.drawImage(img, 0, (canvas.height - drawH) / 2, drawW, drawH);
        const gradient = ctx.createLinearGradient(splitX, 0, canvas.width, 0);
        gradient.addColorStop(0, '#E1306C');
        gradient.addColorStop(1, '#C13584');
        ctx.fillStyle = gradient;
        ctx.fillRect(splitX, 0, canvas.width - splitX, canvas.height);
        textColor = 'white';
        priceColor = '#FFD700';
        imgW = splitX;
        textY = canvas.height / 2 - 30;
        priceY = canvas.height / 2 + 50;
    } else if (estilo === 'overlay') {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const gradient = ctx.createLinearGradient(0, canvas.height - 350, 0, canvas.height);
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.8)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, canvas.height - 350, canvas.width, 350);
        textColor = 'white';
        priceColor = '#FFD700';
        textY = canvas.height - 150;
        priceY = canvas.height - 70;
        showBadge = true;
    } else if (estilo === 'minimal') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        textColor = '#333333';
        priceColor = '#795548';
        showBadge = false;
        const scale = Math.min(canvas.width * 0.95 / img.width, canvas.height * 0.65 / img.height);
        const drawW = img.width * scale;
        const drawH = img.height * scale;
        imgX = (canvas.width - drawW) / 2;
        imgY = 30;
        ctx.drawImage(img, imgX, imgY, drawW, drawH);
        textY = canvas.height - 90;
        priceY = canvas.height - 30;
    } else if (estilo === 'ninguno') {
        ctx.fillStyle = '#f5f5f5';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const scale = Math.min(canvas.width * 0.95 / img.width, canvas.height * 0.75 / img.height);
        const drawW = img.width * scale;
        const drawH = img.height * scale;
        imgX = (canvas.width - drawW) / 2;
        imgY = 40;
        ctx.drawImage(img, imgX, imgY, drawW, drawH);
        textColor = '#333';
        priceColor = '#795548';
        showBadge = false;
        textY = canvas.height - 80;
        priceY = canvas.height - 20;
        textBg = true;
    } else if (estilo === 'neon') {
        // Neon Party - Imagen limpia arriba, texto con glow
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Imagen grande sin marco
        const scale = Math.min(canvas.width / img.width, (canvas.height * 0.70) / img.height);
        const drawH = img.height * scale;
        ctx.drawImage(img, 0, 0, canvas.width, drawH);
        textColor = '#00ffff';
        priceColor = '#ff00ff';
        textY = canvas.height - 100;
        priceY = canvas.height - 40;
    } else if (estilo === 'luxury') {
        // Luxury Gold - Imagen limpia con texto dorado
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Imagen grande centrada sin marco
        const scale = Math.min(canvas.width / img.width, (canvas.height * 0.70) / img.height);
        const drawH = img.height * scale;
        ctx.drawImage(img, 0, 0, canvas.width, drawH);
        textColor = '#D4AF37';
        priceColor = '#FFD700';
        textY = canvas.height - 90;
        priceY = canvas.height - 30;
    } else if (estilo === 'tropical') {
        // Tropical Vibes - Imagen limpia, texto abajo
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#00b09b');
        gradient.addColorStop(0.5, '#96c93d');
        gradient.addColorStop(1, '#f7971e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Imagen arriba SIN overlay
        const scale = Math.min(canvas.width / img.width, (canvas.height * 0.70) / img.height);
        const drawH = img.height * scale;
        ctx.drawImage(img, 0, 0, canvas.width, drawH);
        textColor = '#ffffff';
        priceColor = '#ffff00';
        textY = canvas.height - 90;
        priceY = canvas.height - 30;
    } else if (estilo === 'sunset') {
        // Sunset Glow - Naranja rosa atardecer
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#ff6e7f');
        gradient.addColorStop(0.5, '#bfe9ff');
        gradient.addColorStop(1, '#ff9966');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Imagen arriba con overlay
        const scale = Math.min(canvas.width / img.width, (canvas.height * 0.65) / img.height);
        const drawH = img.height * scale;
        ctx.drawImage(img, 0, 0, canvas.width, drawH);
        textColor = '#ffffff';
        priceColor = '#ff4757';
        textY = canvas.height - 130;
        priceY = canvas.height - 60;
    } else if (estilo === 'ocean') {
        // Ocean Blue - Imagen limpia sin círculos
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#2193b0');
        gradient.addColorStop(0.5, '#6dd5ed');
        gradient.addColorStop(1, '#cc2b5e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Imagen arriba sin decoraciones
        const scale = Math.min(canvas.width / img.width, (canvas.height * 0.70) / img.height);
        const drawH = img.height * scale;
        ctx.drawImage(img, 0, 0, canvas.width, drawH);
        textColor = '#ffffff';
        priceColor = '#00d2ff';
        textY = canvas.height - 90;
        priceY = canvas.height - 30;
    } else if (estilo === 'cherry') {
        // Cherry Pop - Imagen limpia sin círculos
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#eb3349');
        gradient.addColorStop(1, '#f45c43');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Imagen arriba sin decoraciones
        const scale = Math.min(canvas.width / img.width, (canvas.height * 0.70) / img.height);
        const drawH = img.height * scale;
        ctx.drawImage(img, 0, 0, canvas.width, drawH);
        textColor = '#ffffff';
        priceColor = '#ffeb3b';
        textY = canvas.height - 90;
        priceY = canvas.height - 30;
    } else if (estilo === 'lavender') {
        // Lavender Dream - Imagen limpia sin sombra
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#e0c3fc');
        gradient.addColorStop(0.5, '#8ec5fc');
        gradient.addColorStop(1, '#c2e9fb');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Imagen arriba sin marco ni sombra
        const scale = Math.min(canvas.width / img.width, (canvas.height * 0.70) / img.height);
        const drawH = img.height * scale;
        ctx.drawImage(img, 0, 0, canvas.width, drawH);
        textColor = '#6b5b95';
        priceColor = '#9b59b6';
        textY = canvas.height - 90;
        priceY = canvas.height - 30;
    } else if (estilo === 'golden') {
        // Golden Royal - Imagen limpia sin rayos ni marco
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#FDB931');
        gradient.addColorStop(0.5, '#FFD700');
        gradient.addColorStop(1, '#B8860B');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Imagen arriba sin patrones ni marco
        const scale = Math.min(canvas.width / img.width, (canvas.height * 0.70) / img.height);
        const drawH = img.height * scale;
        ctx.drawImage(img, 0, 0, canvas.width, drawH);
        textColor = '#5c4033';
        priceColor = '#8B4513';
        textY = canvas.height - 90;
        priceY = canvas.height - 30;
    } else if (estilo === 'cyber') {
        // Cyberpunk - Imagen limpia sin cuadrícula ni borde
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#0f0c29');
        gradient.addColorStop(0.5, '#302b63');
        gradient.addColorStop(1, '#24243e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Imagen arriba sin cuadrícula
        const scale = Math.min(canvas.width / img.width, (canvas.height * 0.70) / img.height);
        const drawH = img.height * scale;
        ctx.drawImage(img, 0, 0, canvas.width, drawH);
        textColor = '#00ffff';
        priceColor = '#ff00ff';
        textY = canvas.height - 90;
        priceY = canvas.height - 30;
    } else if (estilo === 'elegant') {
        // Elegant Black - Imagen limpia sin marco ornamental
        ctx.fillStyle = '#0d0d0d';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Imagen arriba sin marco ni esquinas decorativas
        const scale = Math.min(canvas.width / img.width, (canvas.height * 0.70) / img.height);
        const drawH = img.height * scale;
        ctx.drawImage(img, 0, 0, canvas.width, drawH);
        textColor = '#c9a961';
        priceColor = '#ffffff';
        textY = canvas.height - 90;
        priceY = canvas.height - 30;
    } else {
        // Estilos originales: rosa, oscuro, cafe - foto arriba, texto abajo SIN MARCO
        if (estilo === 'rosa') {
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, '#E1306C');
            gradient.addColorStop(1, '#C13584');
            ctx.fillStyle = gradient;
        } else if (estilo === 'oscuro') {
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, '#2c3e50');
            gradient.addColorStop(1, '#000000');
            ctx.fillStyle = gradient;
        } else if (estilo === 'cafe') {
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, '#795548');
            gradient.addColorStop(1, '#5D4037');
            ctx.fillStyle = gradient;
        }
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Imagen sin marco, ocupando todo el ancho arriba
        const scale = Math.min(canvas.width / img.width, (canvas.height * 0.65) / img.height);
        const drawW = img.width * scale;
        const drawH = img.height * scale;
        imgX = 0; // Sin margen lateral
        imgY = 0; // Sin margen arriba
        ctx.drawImage(img, imgX, imgY, canvas.width, drawH); // Estirar al ancho completo
    }
    
    // Dibujar imagen para estilos que no lo hicieron arriba
    if (estilo !== 'full' && estilo !== 'split' && estilo !== 'overlay' && estilo !== 'minimal' && estilo !== 'ninguno') {
        // Estilos rosa/oscuro/cafe - imagen ya dibujada arriba
    } else if (estilo === 'full' || estilo === 'overlay') {
        // Ya dibujada
    } else if (estilo === 'split') {
        // Ya dibujada
    }
    // minimal y ninguno ya dibujaron arriba
    
    // Fondo semitransparente para texto si es necesario
    if (textBg) {
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.fillRect(0, textY - 60, canvas.width, 100);
    }
    
    // Configuración de fondos semitransparentes VARIADOS por estilo
    const fondosTexto = {
        rosa:        { nombre: 'rgba(255,255,255,0.25)', precio: 'rgba(255,215,0,0.3)', blur: 15 },
        oscuro:      { nombre: 'rgba(0,0,0,0.5)', precio: 'rgba(255,215,0,0.4)', blur: 20 },
        cafe:        { nombre: 'rgba(121,85,72,0.4)', precio: 'rgba(255,255,255,0.3)', blur: 15 },
        ninguno:     { nombre: 'rgba(255,255,255,0.9)', precio: 'rgba(121,85,72,0.15)', blur: 10 },
        full:        { nombre: 'rgba(0,0,0,0.6)', precio: 'rgba(255,215,0,0.5)', blur: 25 },
        split:       { nombre: 'rgba(255,255,255,0.2)', precio: 'rgba(255,215,0,0.4)', blur: 15 },
        overlay:     { nombre: 'rgba(0,0,0,0.0)', precio: 'rgba(255,215,0,0.0)', blur: 20 },
        minimal:     { nombre: 'rgba(255,255,255,0.8)', precio: 'rgba(121,85,72,0.1)', blur: 5 },
        neon:        { nombre: 'rgba(10,10,10,0.7)', precio: 'rgba(255,0,255,0.3)', blur: 20 },
        luxury:      { nombre: 'rgba(26,26,26,0.8)', precio: 'rgba(212,175,55,0.3)', blur: 20 },
        tropical:    { nombre: 'rgba(0,176,155,0.4)', precio: 'rgba(255,255,0,0.3)', blur: 15 },
        sunset:      { nombre: 'rgba(255,110,127,0.4)', precio: 'rgba(255,255,255,0.4)', blur: 15 },
        ocean:       { nombre: 'rgba(33,147,176,0.5)', precio: 'rgba(0,210,255,0.4)', blur: 15 },
        cherry:      { nombre: 'rgba(235,51,73,0.5)', precio: 'rgba(255,235,59,0.4)', blur: 15 },
        lavender:    { nombre: 'rgba(224,195,252,0.6)', precio: 'rgba(155,89,182,0.3)', blur: 12 },
        golden:      { nombre: 'rgba(253,185,49,0.4)', precio: 'rgba(139,69,19,0.3)', blur: 15 },
        cyber:       { nombre: 'rgba(15,12,41,0.8)', precio: 'rgba(0,255,255,0.3)', blur: 20 },
        elegant:     { nombre: 'rgba(13,13,13,0.85)', precio: 'rgba(201,169,97,0.4)', blur: 20 }
    };
    
    const fondo = fondosTexto[estilo] || fondosTexto.rosa;
    const precioTexto = formatCurrency(productoSeleccionadoIG.precioVenta);
    const centerX = canvas.width / 2;
    
    // Medir texto para fondos
    ctx.font = 'bold 50px Arial';
    const nombreWidth = ctx.measureText(productoSeleccionadoIG.nombre).width;
    ctx.font = 'bold 70px Arial';
    const precioWidth = ctx.measureText(precioTexto).width;
    
    // Fondo semitransparente para nombre (glassmorphism)
    ctx.save();
    ctx.fillStyle = fondo.nombre;
    ctx.roundRect = ctx.roundRect || function(x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    };
    if (ctx.roundRect) {
        ctx.roundRect(centerX - nombreWidth / 2 - 15, textY - 50, nombreWidth + 30, 65, 12);
        ctx.fill();
    }
    ctx.restore();
    
    // Nombre del producto
    ctx.fillStyle = textColor;
    ctx.font = 'bold 50px Arial';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = fondo.blur;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.fillText(productoSeleccionadoIG.nombre, canvas.width / 2, textY);
    
    // Fondo semitransparente para precio (diferente estilo)
    ctx.save();
    ctx.fillStyle = fondo.precio;
    if (ctx.roundRect) {
        // Forma diferente: más ancha y baja
        ctx.roundRect(centerX - precioWidth / 2 - 25, priceY - 55, precioWidth + 50, 75, 20);
        ctx.fill();
    }
    ctx.restore();
    
    // Iconos brillantes alrededor del precio - VARIADOS por estilo
    ctx.font = '40px Arial';
    ctx.fillStyle = priceColor;
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 8;
    
    const iconosPorEstilo = {
        rosa:        { left: '💕', right: '🌸', sparkles: ['✨', '💖'] },
        oscuro:      { left: '🖤', right: '💎', sparkles: ['✦', '✧'] },
        cafe:        { left: '☕', right: '🤎', sparkles: ['✦', '✨'] },
        ninguno:     { left: '📷', right: '✨', sparkles: ['⭐', '✦'] },
        full:        { left: '🖼️', right: '💫', sparkles: ['✨', '🌟'] },
        split:       { left: '⚡', right: '🔥', sparkles: ['✦', '✧'] },
        overlay:     { left: '✨', right: '💎', sparkles: ['🌟', '⭐'] },
        minimal:     { left: '⬜', right: '💠', sparkles: ['✦', '◆'] },
        neon:        { left: '💜', right: '💚', sparkles: ['✨', '⚡'] },
        luxury:      { left: '👑', right: '💎', sparkles: ['✦', '👑'] },
        tropical:    { left: '🌴', right: '🌺', sparkles: ['🌸', '🌺'] },
        sunset:      { left: '🌅', right: '🧡', sparkles: ['✨', '☀️'] },
        ocean:       { left: '🌊', right: '💙', sparkles: ['✦', '🐚'] },
        cherry:      { left: '🍒', right: '❤️', sparkles: ['✨', '🍒'] },
        lavender:    { left: '💜', right: '🪻', sparkles: ['✨', '💜'] },
        golden:      { left: '👑', right: '🏆', sparkles: ['✨', '⭐'] },
        cyber:       { left: '🤖', right: '⚡', sparkles: ['⚡', '💠'] },
        elegant:     { left: '🎩', right: '🍷', sparkles: ['✦', '◆'] }
    };
    
    const iconos = iconosPorEstilo[estilo] || iconosPorEstilo.rosa;
    
    // Iconos laterales (más separados para no tapar)
    ctx.fillText(iconos.left, centerX - precioWidth / 2 - 70, priceY - 5);
    ctx.fillText(iconos.right, centerX + precioWidth / 2 + 30, priceY - 5);
    
    // Destellos decorativos
    ctx.font = '22px Arial';
    ctx.fillText(iconos.sparkles[0], centerX - precioWidth / 2 - 100, priceY - 25);
    ctx.fillText(iconos.sparkles[1] || iconos.sparkles[0], centerX + precioWidth / 2 + 60, priceY - 25);
    
    // Texto del precio
    ctx.font = 'bold 70px Arial';
    ctx.fillStyle = priceColor;
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.fillText(precioTexto, centerX, priceY);
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    
    // Badge "En stock"
    if (showBadge && productoSeleccionadoIG.cantidad > 0) {
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(canvas.width - 250, 50, 200, 50);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 25px Arial';
        ctx.fillText('✓ EN STOCK', canvas.width - 150, 82);
    }
    
    document.getElementById('ig-preview-container').style.display = 'block';
}

function cambiarEstiloFondo() {
    const input = document.getElementById('ig-foto-producto');
    if (input.files && input.files[0]) {
        // Regenerar imagen si ya hay una foto subida
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                generarImagenConEstilo(img);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function descargarImagenInstagram() {
    const canvas = document.getElementById('ig-canvas');
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.download = `instagram-${productoSeleccionadoIG?.nombre?.replace(/\s+/g, '-') || 'producto'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
}

window.mostrarMenuInstagram = mostrarMenuInstagram;
window.cerrarModalInstagram = cerrarModalInstagram;
window.seleccionarProductoInstagram = seleccionarProductoInstagram;
window.volverASeleccion = volverASeleccion;
window.copiarTextoInstagram = copiarTextoInstagram;
window.generarLinkWhatsApp = generarLinkWhatsApp;
window.copiarMensajeRapido = copiarMensajeRapido;
window.toggleEditarMensajes = toggleEditarMensajes;
window.guardarMensajesRapidos = guardarMensajesRapidos;
window.restaurarMensajesDefault = restaurarMensajesDefault;
window.previewFotoInstagram = previewFotoInstagram;
window.generarImagenConEstilo = generarImagenConEstilo;
window.cambiarEstiloFondo = cambiarEstiloFondo;
window.descargarImagenInstagram = descargarImagenInstagram;

