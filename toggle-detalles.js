
window.toggleDetallesCompra = toggleDetallesCompra;

function toggleDetallesCompra() {
    const textarea = document.getElementById('compra-detalles');
    const btn = document.getElementById('btn-toggle-detalles');
    
    if (textarea.style.display === 'none') {
        // Expandir
        textarea.style.display = 'block';
        btn.innerHTML = '📥 Colapsar';
    } else {
        // Colapsar
        textarea.style.display = 'none';
        btn.innerHTML = '📤 Expandir';
    }
}
