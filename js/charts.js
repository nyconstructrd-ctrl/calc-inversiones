// js/charts.js
// Visualización de Datos con Chart.js

let charts = {};

function renderCharts() {
    console.log('📊 Generando gráficos...');
    
    // 1. Gráfico de Ventas Mensuales (Últimos 6 meses)
    renderVentasChart();
    
    // 2. Gráfico de Categorías (Participación)
    renderCategoriasChart();
    
    // 3. Gráfico de Comparativa (Ventas vs Gastos)
    renderComparativaChart();
}

function renderVentasChart() {
    const ctx = document.getElementById('chart-ventas')?.getContext('2d');
    if (!ctx) return;
    
    // Preparar datos
    const ultimos6Meses = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        ultimos6Meses.push({
            label: d.toLocaleString('es-DO', { month: 'short' }),
            year: d.getFullYear(),
            month: d.getMonth(),
            total: 0
        });
    }
    
    ventas.forEach(v => {
        const dv = new Date(v.fecha);
        const m = ultimos6Meses.find(mes => mes.month === dv.getMonth() && mes.year === dv.getFullYear());
        if (m) m.total += v.totalVenta;
    });
    
    if (charts.ventas) charts.ventas.destroy();
    
    charts.ventas = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ultimos6Meses.map(m => m.label),
            datasets: [{
                label: 'Ventas Reales',
                data: ultimos6Meses.map(m => m.total),
                borderColor: '#4CAF50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
        }
    });
}

function renderCategoriasChart() {
    const ctx = document.getElementById('chart-categorias')?.getContext('2d');
    if (!ctx) return;
    
    const cats = { 'ropa': 0, 'calzado': 0, 'accesorios': 0, 'otros': 0 };
    inventario.forEach(i => {
        if (cats[i.categoria] !== undefined) cats[i.categoria] += i.cantidad;
    });
    
    if (charts.categorias) charts.categorias.destroy();
    
    charts.categorias = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(cats).map(c => c.toUpperCase()),
            datasets: [{
                data: Object.values(cats),
                backgroundColor: ['#2196F3', '#FF9800', '#9C27B0', '#607D8B']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }
        }
    });
}

function renderComparativaChart() {
    const ctx = document.getElementById('chart-comparativa')?.getContext('2d');
    if (!ctx) return;
    
    const vTotal = ventas.reduce((s, v) => s + v.totalVenta, 0);
    const gTotal = (config.gastos || []).reduce((s, g) => s + g.monto, 0);
    
    if (charts.comparativa) charts.comparativa.destroy();
    
    charts.comparativa = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Ventas', 'Gastos'],
            datasets: [{
                data: [vTotal, gTotal],
                backgroundColor: ['#4CAF50', '#f44336']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }
        }
    });
}

// Exponer funciones
window.renderCharts = renderCharts;
window.renderVentasChart = renderVentasChart;
window.renderCategoriasChart = renderCategoriasChart;
window.renderComparativaChart = renderComparativaChart;
