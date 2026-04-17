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
    const alturaLinea = 25;
    const margenBase = 580; // Cabecera ampliada
    const alturaArticulos = lineasArticulos.length * alturaLinea;
    const canvasHeight = margenBase + alturaArticulos;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 450;
    canvas.height = canvasHeight;

    // Fondo
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let y = 50;
    const center = canvas.width / 2;
    const marginLR = 25;
    const brandColor = config.facturaColor || '#4CAF50';
    
    const drawDashedLine = (color = '#ccc') => {
        y += 10;
        ctx.setLineDash([6, 4]);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(marginLR, y); ctx.lineTo(canvas.width - marginLR, y); ctx.stroke(); ctx.setLineDash([]);
        y += 25;
    };
    
    ctx.textAlign = 'center';
    ctx.fillStyle = brandColor;
    ctx.font = 'bold 22px "Courier New", Courier, monospace';
    ctx.fillText('🧾 FACTURA', center, y);
    
    y += 35;
    ctx.fillStyle = '#333';
    ctx.font = 'bold 24px "Courier New", Courier, monospace';
    ctx.fillText(config.nombre || 'Chic Divine', center, y);
    
    y += 25;
    ctx.font = 'italic 16px "Courier New", Courier, monospace';
    ctx.fillStyle = '#666';
    const subHeader = config.facturaEncabezado || '';
    subHeader.split('\n').forEach(lh => {
        ctx.fillText(lh, center, y);
        y += 22;
    });
    
    if (config.telefono && !config.facturaEncabezado) { ctx.fillText('Tel: ' + config.telefono, center, y); y += 22; }
    
    drawDashedLine();
    
    ctx.font = '16px "Courier New", Courier, monospace';
    ctx.fillStyle = '#333';
    ctx.fillText('Fecha: ' + new Date(fecha).toLocaleString('es-DO'), center, y);
    y += 25;
    if (venta.facturaNum) {
        ctx.fillText('Factura ' + venta.facturaNum, center, y);
        y += 25;
    }
    
    drawDashedLine();
    
    ctx.font = 'bold 18px "Courier New", Courier, monospace';
    ctx.fillText('Cliente: ' + (cliente || 'Público General'), center, y);
    y += 25;
    if (telefono) {
        ctx.font = '16px "Courier New", Courier, monospace';
        ctx.fillText('Tel: ' + telefono, center, y);
        y += 25;
    }
    
    drawDashedLine();
    
    ctx.font = 'bold 18px "Courier New", Courier, monospace';
    ctx.fillText('ARTÍCULOS:', center, y);
    y += 40;
    
    ctx.font = '16px "Courier New", Courier, monospace';
    lineasArticulos.forEach(linea => {
        let textLeft = linea;
        let textRight = '';
        const idx = linea.lastIndexOf(' - ');
        if (idx !== -1) {
            textLeft = linea.substring(0, idx).trim();
            textRight = linea.substring(idx + 3).trim();
        }
        ctx.textAlign = 'left';
        ctx.fillText(textLeft.substring(0, 30), marginLR, y);
        if (textRight) {
            ctx.textAlign = 'right';
            ctx.fillText(textRight, canvas.width - marginLR, y);
        }
        y += alturaLinea;
    });
    
    drawDashedLine();
    
    ctx.textAlign = 'left';
    ctx.fillText('Subtotal:', marginLR, y);
    ctx.textAlign = 'right';
    ctx.fillText(formatCurrency(precioVenta), canvas.width - marginLR, y);
    y += 30;
    
    if (costoEnvio > 0) {
        ctx.textAlign = 'left';
        ctx.fillText('Envío:', marginLR, y);
        ctx.textAlign = 'right';
        ctx.fillText(formatCurrency(costoEnvio), canvas.width - marginLR, y);
        y += 30;
    }
    
    // TOTAL
    ctx.textAlign = 'left';
    ctx.fillStyle = brandColor;
    ctx.font = 'bold 22px "Courier New", Courier, monospace';
    ctx.fillText('TOTAL:', marginLR, y);
    ctx.textAlign = 'right';
    ctx.fillText(formatCurrency(totalVenta), canvas.width - marginLR, y);
    
    y += 15;
    drawDashedLine(brandColor); // Colorful dashed limit
    
    // Footer pie
    ctx.textAlign = 'center';
    const pie = config.facturaPie || '¡Gracias por su compra!\nDios le bendiga\nVuelva pronto';
    pie.split('\n').forEach((lp, index) => {
        if (index === 0) {
            ctx.fillStyle = brandColor;
            ctx.font = 'bold 18px "Courier New", Courier, monospace';
        } else {
            ctx.fillStyle = '#666';
            ctx.font = '16px "Courier New", Courier, monospace';
        }
        ctx.fillText(lp, center, y);
        y += 28;
    });
    
    y -= 10;
    drawDashedLine(brandColor);

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
