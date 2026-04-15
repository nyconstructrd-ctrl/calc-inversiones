// js/init.js
// Inicialización de la aplicación al cargar el DOM

document.addEventListener('DOMContentLoaded', function() {
    console.log('=== CALCULADORA INVERSIONES - INICIALIZANDO ===');
    
    try {
        // 1. Cargar datos
        loadData();
        console.log('✓ Datos cargados');
        
        // 1.5 Cargar modo oscuro guardado
        if (typeof loadDarkMode === 'function') {
            loadDarkMode();
            console.log('✓ Modo oscuro cargado');
        }
        
        // 2. Verificar autenticación
        const isAuthenticated = localStorage.getItem('calc_authenticated');
        const lastActivity = localStorage.getItem('calc_last_activity');
        const now = Date.now();
        const TIMEOUT = 60 * 60 * 1000; // 1 hora
        
        console.log('Auth:', isAuthenticated, 'LastActivity:', lastActivity);
        
        // Asegurar que isLoggedIn esté definida
        if (typeof isLoggedIn === 'undefined') {
            window.isLoggedIn = false;
        }
        
        if (isAuthenticated === 'true' && lastActivity && (now - parseInt(lastActivity)) < TIMEOUT) {
            // Restaurar sesión
            isLoggedIn = true;
            const savedScreen = localStorage.getItem('calc_current_screen') || 'home-screen';
            console.log('Restaurando sesión, pantalla:', savedScreen);
            if (typeof showScreen === 'function') {
                showScreen(savedScreen);
            } else {
                console.error('showScreen no está definida');
                // Fallback: mostrar login manualmente
                document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
                const loginScreen = document.getElementById('login-screen');
                if (loginScreen) loginScreen.classList.add('active');
            }
            if (typeof startInactivityTimer === 'function') {
                startInactivityTimer();
            }
        } else {
            // Ir a login
            console.log('No hay sesión, mostrando login');
            if (typeof showScreen === 'function') {
                showScreen('login-screen');
            } else {
                console.error('showScreen no está definida');
                // Fallback manual
                document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
                const loginScreen = document.getElementById('login-screen');
                if (loginScreen) {
                    loginScreen.classList.add('active');
                    console.log('Login screen activada manualmente');
                } else {
                    console.error('No se encontró login-screen');
                }
            }
        }
        
        // 3. Inicializar Dashboard si estamos en el home
        if (isLoggedIn && typeof updateDashboard === 'function') {
            updateDashboard();
        }
        
        // 4. Agregar listeners de eventos para cálculos en tiempo real
        setupEventListeners();
        
    } catch (e) {
        console.error('Error en inicialización:', e);
        // Mostrar login como fallback
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        const loginScreen = document.getElementById('login-screen');
        if (loginScreen) loginScreen.classList.add('active');
    }
});

function setupEventListeners() {
    // Compras
    const shoppingInputs = ['compra-costo', 'compra-costo-tipo', 'compra-envio', 'compra-otros', 'compra-otros-tipo', 'compra-detalles', 'compra-moneda-general'];
    shoppingInputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', updateShoppingPreview);
    });
    
    // Ventas
    const salesInputs = ['venta-precio', 'venta-envio'];
    salesInputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', updateShoppingPreview); // o updateVentaPreview si existiera específica
    });
    
    // Gastos
    const gastoMonto = document.getElementById('gasto-monto');
    const gastoTipo = document.getElementById('gasto-monto-tipo');
    if (gastoMonto) gastoMonto.addEventListener('input', updateGastoPreview);
    if (gastoTipo) gastoTipo.addEventListener('change', updateGastoPreview);
    
    // Inventario
    const invCosto = document.getElementById('inv-costo');
    const invPrecio = document.getElementById('inv-precio');
    const invMoneda = document.getElementById('inv-moneda');
    if (invCosto) invCosto.addEventListener('input', updateInventarioPreview);
    if (invPrecio) invPrecio.addEventListener('input', updateInventarioPreview);
    if (invMoneda) invMoneda.addEventListener('change', updateInventarioPreview);
}

// ==================== SERVICE WORKER - AUTO ACTUALIZACIÓN ====================

let refreshing = false;
let newVersionAvailable = false;

// Registrar Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('[APP] Service Worker registrado:', registration.scope);
                
                // Verificar si hay nueva versión
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    console.log('[APP] Nueva versión encontrada, instalando...');
                    
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // Hay nueva versión lista
                            console.log('[APP] Nueva versión lista para activar');
                            newVersionAvailable = true;
                            showUpdateNotification(newWorker);
                        }
                    });
                });
                
                // Escuchar mensajes del SW
                navigator.serviceWorker.addEventListener('message', (event) => {
                    if (event.data === 'UPDATE_AVAILABLE') {
                        console.log('[APP] Mensaje de actualización recibido');
                        window.location.reload();
                    }
                });
                
                // Verificar actualizaciones INMEDIATAMENTE al cargar
                console.log('[APP] Verificando actualizaciones inmediatamente...');
                registration.update();
                
                // Verificar cada 30 segundos mientras la app esté abierta
                setInterval(() => {
                    console.log('[APP] Verificando actualizaciones...');
                    registration.update();
                }, 30 * 1000);
                
                // Verificar INMEDIATAMENTE al volver a la app
                document.addEventListener('visibilitychange', () => {
                    if (document.visibilityState === 'visible') {
                        console.log('[APP] App visible, verificando actualizaciones AHORA');
                        registration.update();
                    }
                });
            })
            .catch((err) => {
                console.error('[APP] Error registrando Service Worker:', err);
            });
    });
    
    // Detectar cuando se active un nuevo SW
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        console.log('[APP] Nuevo Service Worker activado, recargando...');
        window.location.reload();
    });
}

// Mostrar notificación de actualización disponible
function showUpdateNotification(worker) {
    // Crear banner de actualización
    const banner = document.createElement('div');
    banner.id = 'update-banner';
    banner.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: linear-gradient(135deg, #4CAF50, #388E3C);
        color: white;
        padding: 15px 20px;
        text-align: center;
        z-index: 99999;
        font-family: Arial, sans-serif;
        font-size: 14px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 15px;
    `;
    
    banner.innerHTML = `
        <span>🔄 Nueva versión disponible</span>
        <button id="btn-update-now" style="
            background: white;
            color: #4CAF50;
            border: none;
            padding: 8px 20px;
            border-radius: 20px;
            cursor: pointer;
            font-weight: bold;
            font-size: 13px;
        ">Actualizar ahora</button>
        <button id="btn-update-later" style="
            background: transparent;
            color: white;
            border: 1px solid white;
            padding: 8px 15px;
            border-radius: 20px;
            cursor: pointer;
            font-size: 13px;
        ">Después</button>
    `;
    
    document.body.appendChild(banner);
    
    // Botón actualizar ahora
    document.getElementById('btn-update-now').addEventListener('click', () => {
        console.log('[APP] Usuario aceptó actualización');
        worker.postMessage('SKIP_WAITING');
        banner.remove();
    });
    
    // Botón más tarde
    document.getElementById('btn-update-later').addEventListener('click', () => {
        console.log('[APP] Usuario pospuso actualización');
        banner.remove();
        // Recordar que hay actualización pendiente
        localStorage.setItem('calc_update_pending', 'true');
    });
}

// Verificar si hay actualización pendiente al iniciar
if (localStorage.getItem('calc_update_pending') === 'true') {
    localStorage.removeItem('calc_update_pending');
    // Forzar verificación de actualización
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
            registration.update();
        });
    }
}
