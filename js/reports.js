// js/reports.js
// Historial, Búsquedas y Backups

function loadHistoryMonths() {
    const select = document.getElementById('history-month');
    if (!select) return;
    const now = new Date();
    let html = '<option value="">Seleccionar mes</option>';
    
    for (let i = 0; i < 12; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const mes = d.toLocaleString('es-DO', { month: 'long', year: 'numeric' });
        const valor = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
        html += `<option value="${valor}">${mes}</option>`;
    }
    select.innerHTML = html;
}

function loadMonthData() {
    const val = document.getElementById('history-month').value;
    if (!val) return;
    const [year, month] = val.split('-').map(Number);
    
    const vMes = ventas.filter(v => { const d = new Date(v.fecha); return d.getMonth() === month - 1 && d.getFullYear() === year; });
    const gMes = (config.gastos || []).filter(g => { const d = new Date(g.fecha); return d.getMonth() === month - 1 && d.getFullYear() === year; });
    
    const ventaT = vMes.reduce((s, v) => s + v.precioVenta, 0);
    const diezmoT = vMes.reduce((s, v) => s + v.diezmo, 0);
    const gastoT = gMes.reduce((s, g) => s + g.monto, 0);
    
    let html = `<div style="background:#f9f9f9; padding:20px; border-radius:12px;">
        <h3>📊 Resumen ${val}</h3>
        <p>Ventas: ${formatCurrency(ventaT)}</p>
        <p>Diezmo: ${formatCurrency(diezmoT)}</p>
        <p>Gastos: ${formatCurrency(gastoT)}</p>
        <div style="background:#4CAF50; color:white; padding:15px; border-radius:8px; margin-top:10px; text-align:center;">
            <strong>Utilidad Neta: ${formatCurrency(ventaT - diezmoT - gastoT)}</strong>
        </div>
    </div>`;
    
    document.getElementById('history-data').innerHTML = html;
}

function searchMovimientos() {
    const query = document.getElementById('search-movimientos').value.toLowerCase().trim();
    const container = document.getElementById('search-results');
    if (!query) { container.innerHTML = ''; return; }
    
    let results = [];
    ventas.forEach(v => {
        if (v.articulo.toLowerCase().includes(query) || (v.cliente && v.cliente.toLowerCase().includes(query))) {
            results.push({ tipo: 'VENTA', desc: v.articulo.split('\n')[0], monto: v.totalVenta, fecha: v.fecha });
        }
    });
    
    let html = '<h4>Resultados:</h4>';
    results.forEach(r => {
        html += `<div class="list-item">
            <strong>[${r.tipo}]</strong> ${r.desc} <br>
            <span style="color:#2E7D32;">${formatCurrency(r.monto)}</span> - ${formatDate(r.fecha)}
        </div>`;
    });
    container.innerHTML = html;
}

function descargarBackup() {
    const data = { config, compras, ventas, inventario, exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-${config.nombre || 'rd-inv'}-${new Date().toLocaleDateString()}.json`;
    a.click();
    alert('Backup descargado. Guárdalo en un lugar seguro.');
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (data.config) config = data.config;
            if (data.compras) compras = data.compras;
            if (data.ventas) ventas = data.ventas;
            if (data.inventario) inventario = data.inventario;
            saveData();
            alert('Datos importados con éxito');
            location.reload();
        } catch (err) { alert('Error al importar archivo'); }
    };
    reader.readAsText(file);
}

// Exponer funciones
window.loadHistoryMonths = loadHistoryMonths;
window.loadMonthData = loadMonthData;
window.searchMovimientos = searchMovimientos;
window.descargarBackup = descargarBackup;
window.importData = importData;
