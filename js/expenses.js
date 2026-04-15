// js/expenses.js
// Gestión de Gastos

function showGastos() {
    loadData();
    renderGastosList();
    showScreen('gastos-screen');
}

function agregarGasto() {
    const desc = document.getElementById('gasto-desc').value.trim();
    const monto = parseFloat(document.getElementById('gasto-monto').value) || 0;
    const tipo = document.getElementById('gasto-monto-tipo').value;
    
    if (!desc || monto <= 0) { alert('Ingrese descripción y monto válido'); return; }
    
    const tasa = config.tasaCambio || 1;
    const montoEnRD = tipo === 'USD' ? monto * tasa : monto;
    
    if (!config.gastos) config.gastos = [];
    
    config.gastos.push({
        id: Date.now(),
        desc,
        monto: montoEnRD,
        fecha: new Date().toISOString()
    });
    
    saveData();
    renderGastosList();
    updateDashboard();
    
    document.getElementById('gasto-desc').value = '';
    document.getElementById('gasto-monto').value = '';
}

function eliminarGasto(id) {
    if (!confirm('¿Eliminar gasto?')) return;
    config.gastos = config.gastos.filter(g => g.id !== id);
    saveData();
    renderGastosList();
    updateDashboard();
}

function renderGastosList() {
    const container = document.getElementById('gastos-list');
    const totalEl = document.getElementById('gastos-total');
    if (!container) return;
    
    const gastos = config.gastos || [];
    let html = '';
    let total = 0;
    
    gastos.slice().reverse().forEach(g => {
        total += g.monto;
        html += `<div class="list-item" style="display:flex; justify-content:space-between; align-items:center;">
            <div>
                <strong>${sanitizeHTML(g.desc)}</strong><br>
                <small>${formatDate(g.fecha)}</small>
            </div>
            <div style="text-align:right;">
                <span style="color:#f44336; font-weight:bold;">${formatCurrency(g.monto)}</span><br>
                <button onclick="eliminarGasto(${g.id})" style="background:none; border:none; color:#999; font-size:11px; cursor:pointer;">Eliminar</button>
            </div>
        </div>`;
    });
    
    container.innerHTML = html || '<p style="text-align:center; padding:20px; color:#999;">Sin gastos registrados</p>';
    if (totalEl) totalEl.textContent = formatCurrency(total);
}

function updateGastoPreview() {
    const monto = parseFloat(document.getElementById('gasto-monto').value) || 0;
    const tipo = document.getElementById('gasto-monto-tipo').value;
    const conv = document.getElementById('gasto-monto-conversion');
    
    if (conv) {
        conv.textContent = (tipo === 'USD' && monto > 0) ? 'RD$ ' + (monto * (config.tasaCambio || 1)).toLocaleString() : '';
    }
}

// Exponer funciones
window.showGastos = showGastos;
window.agregarGasto = agregarGasto;
window.eliminarGasto = eliminarGasto;
window.updateGastoPreview = updateGastoPreview;
