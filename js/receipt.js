// js/receipt.js
// Generador de Facturas Dinámicas para WhatsApp

function sendVentaWhatsApp(id) {
    const venta = ventas.find(v => String(v.id) === String(id));
    if (!venta || !venta.telefono) {
        alert('Venta no encontrada o cliente sin teléfono');
        return;
    }

    const { articulo, precioVenta, costoEnvio, totalVenta, cliente, telefono, fecha, metodoPago } = venta;
    const lineasArticulos = articulo.split('\n');
    
    // --- CÁLCULO DE ALTURA DINÁMICA (Recomendación 4) ---
    const alturaLinea = 20;
    const margenBase = 450; // Cabecera, datos cliente y pie fijo
    const alturaArticulos = lineasArticulos.length * alturaLinea;
    const canvasHeight = margenBase + alturaArticulos;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 400;
    canvas.height = canvasHeight;

    // Fondo
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let y = 40;
    ctx.textAlign = 'center';
    
    // Encabezado
    const brandColor = config.facturaColor || '#4CAF50';
    ctx.fillStyle = brandColor;
    ctx.font = 'bold 22px Arial';
    ctx.fillText(config.nombre || 'RD-INVESTMENTS', canvas.width / 2, y);
    
    y += 20;
    ctx.font = '11px Arial';
    ctx.fillStyle = '#666';
    const subHeader = config.facturaEncabezado || config.slogan || '';
    subHeader.split('\n').forEach(lh => {
        ctx.fillText(lh, canvas.width / 2, y);
        y += 12;
    });
    
    y += 10;
    if (config.telefono && !config.facturaEncabezado) { ctx.fillText('Tel: ' + config.telefono, canvas.width / 2, y); y += 20; }
    
    y += 10;
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = '#ddd';
    ctx.beginPath(); ctx.moveTo(20, y); ctx.lineTo(380, y); ctx.stroke(); ctx.setLineDash([]);
    
    y += 30;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#333';
    ctx.font = 'bold 15px Arial';
    ctx.fillText('CLIENTE: ' + (cliente || 'Público General'), 25, y);
    y += 22;
    ctx.font = '13px Arial';
    ctx.fillText('FECHA: ' + formatDate(fecha), 25, y);
    y += 20;
    if (venta.facturaNum) {
        ctx.fillStyle = '#9C27B0';
        ctx.font = 'bold 13px Arial';
        ctx.fillText('FACTURA: ' + venta.facturaNum, 25, y);
        ctx.fillStyle = '#333';
        ctx.font = '13px Arial';
        y += 20;
    }
    ctx.fillText('PAGO: ' + (metodoPago || 'efectivo').toUpperCase(), 25, y);
    
    y += 30;
    ctx.font = 'bold 14px Arial';
    ctx.fillText('DETALLES DEL PEDIDO:', 25, y);
    y += 25;
    
    // Artículos
    ctx.font = '13px Courier New'; // Fuente monoespaciada para alinear
    lineasArticulos.forEach(linea => {
        ctx.fillText(linea.substring(0, 45), 35, y);
        y += alturaLinea;
    });

    y += 20;
    ctx.setLineDash([2, 5]);
    ctx.beginPath(); ctx.moveTo(25, y); ctx.lineTo(375, y); ctx.stroke(); ctx.setLineDash([]);
    
    y += 30;
    ctx.textAlign = 'right';
    ctx.font = '14px Arial';
    ctx.fillText('Subtotal: ' + formatCurrency(precioVenta), 370, y);
    if (costoEnvio > 0) {
        y += 20;
        ctx.fillText('Envío: ' + formatCurrency(costoEnvio), 370, y);
    }
    
    y += 30;
    ctx.fillStyle = brandColor;
    ctx.font = 'bold 20px Arial';
    ctx.fillText('TOTAL: ' + formatCurrency(totalVenta), 370, y);

    // Pie
    y += 50;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#888';
    ctx.font = 'italic 12px Arial';
    const pie = config.facturaPie || '¡Gracias por su preferencia!';
    pie.split('\n').forEach(lp => {
        ctx.fillText(lp, canvas.width / 2, y);
        y += 18;
    });

    // Enviar a WhatsApp
    canvas.toBlob(blob => {
        const file = new File([blob], 'factura.png', { type: 'image/png' });
        const facturaLabel = venta.facturaNum ? ` ${venta.facturaNum}` : '';
        const text = `*Factura${facturaLabel} de ${config.nombre}*\n\nHola ${cliente || ''}, adjunto tu recibo de compra del día ${formatDate(fecha)}.`;
        
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            navigator.share({ files: [file], title: 'Factura', text }).catch(() => openWhatsAppText(telefono, text));
        } else {
            openWhatsAppText(telefono, text);
        }
    });
}

function openWhatsAppText(tel, text) {
    const cleanTel = tel.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanTel}?text=${encodeURIComponent(text)}`, '_blank');
}

window.sendVentaWhatsApp = sendVentaWhatsApp;
