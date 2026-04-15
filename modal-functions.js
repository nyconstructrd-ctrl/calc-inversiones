
window.abrirModalOpciones = abrirModalOpciones;

function abrirModalOpciones(id) {
    const venta = ventas.find(v => v.id === id);
    if (!venta) return;
    
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; display: flex; align-items: center; justify-content: center;';
    
    const content = document.createElement('div');
    content.style.cssText = 'background: white; border-radius: 12px; padding: 20px; max-width: 350px; width: 90%; box-shadow: 0 4px 20px rgba(0,0,0,0.3);';
    
    content.innerHTML = `
        <h3 style="margin: 0 0 15px 0; color: #333; text-align: center;">⚙️ Opciones</h3>
        <div style="margin-bottom: 10px;"><strong>Cliente:</strong> ${venta.cliente || 'N/A'}</div>
        <div style="margin-bottom: 10px;"><strong>Tel:</strong> ${venta.telefono || 'N/A'}</div>
        <div style="margin-bottom: 10px;"><strong>Total:</strong> ${formatCurrency(venta.precioVenta)}</div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; margin-top: 15px;">
            <button id="btn-cerrar" style="background: #6c757d; color: white; border: none; padding: 8px 15px; border-radius: 6px; cursor: pointer;">Cerrar</button>
            ${venta.telefono ? '<button id="btn-whatsapp" style="background: #25D366; color: white; border: none; padding: 8px 15px; border-radius: 6px; cursor: pointer;">📱 WhatsApp</button>' : ''}
            <button id="btn-editar" style="background: #FF9800; color: white; border: none; padding: 8px 15px; border-radius: 6px; cursor: pointer;">✏️ Editar</button>
            <button id="btn-eliminar" style="background: #f44336; color: white; border: none; padding: 8px 15px; border-radius: 6px; cursor: pointer;">🗑️ Eliminar</button>
        </div>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    content.querySelector('#btn-cerrar').onclick = () => modal.remove();
    if (venta.telefono) {
        content.querySelector('#btn-whatsapp').onclick = () => { sendVentaWhatsApp(id); modal.remove(); };
    }
    content.querySelector('#btn-editar').onclick = () => { editarVenta(id); modal.remove(); };
    content.querySelector('#btn-eliminar').onclick = () => { eliminarVenta(id); modal.remove(); };
    
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
}
