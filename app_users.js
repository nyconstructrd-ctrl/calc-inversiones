
// ==================== SISTEMA DE USUARIOS (SERVER-SIDE) ====================

let usuarios = [];
let usuarioActual = null;

const API_URL = window.location.origin;

async function cargarUsuarios() {
    try {
        const response = await fetch(`${API_URL}/api/usuarios`);
        if (response.ok) {
            usuarios = await response.json();
        }
    } catch (e) {
        console.error('Error cargando usuarios:', e);
        usuarios = [];
    }
}

async function guardarUsuarios() {
    try {
        const response = await fetch(`${API_URL}/api/usuarios`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(usuarios)
        });
        return response.ok;
    } catch (e) {
        console.error('Error guardando usuarios:', e);
        return false;
    }
}

function showLogin() {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('login-screen').classList.add('active');
    cargarListaUsuariosLogin();
}

function showGestionUsuarios() {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('gestion-usuarios-screen').classList.add('active');
    cargarListaUsuariosGestion();
}

function cargarListaUsuariosLogin() {
    const select = document.getElementById('login-usuario');
    if (!select) return;
    
    cargarUsuarios();
    select.innerHTML = '<option value="">Seleccionar usuario</option>';
    usuarios.forEach(u => {
        const option = document.createElement('option');
        option.value = u.nombre;
        option.textContent = u.nombre;
        select.appendChild(option);
    });
}

function cargarListaUsuariosGestion() {
    const select = document.getElementById('eliminar-usuario-select');
    const lista = document.getElementById('lista-usuarios');
    if (!select || !lista) return;
    
    cargarUsuarios();
    
    select.innerHTML = '<option value="">Seleccionar usuario a eliminar</option>';
    usuarios.forEach(u => {
        const option = document.createElement('option');
        option.value = u.nombre;
        option.textContent = u.nombre;
        select.appendChild(option);
    });
    
    if (usuarios.length === 0) {
        lista.innerHTML = '<p style="color: #666; margin: 0;">No hay usuarios creados</p>';
    } else {
        lista.innerHTML = usuarios.map(u => `<div style="padding: 5px 0; border-bottom: 1px solid #ddd;">👤 ${u.nombre}</div>`).join('');
    }
}

async function iniciarSesion() {
    const nombre = document.getElementById('login-usuario').value;
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');
    
    if (!nombre || !password) {
        errorEl.textContent = 'Complete todos los campos';
        errorEl.style.display = 'block';
        return;
    }
    
    await cargarUsuarios();
    const usuario = usuarios.find(u => u.nombre === nombre && u.password === password);
    
    if (usuario) {
        usuarioActual = usuario;
        try {
            localStorage.setItem('calc_sesion_activa', nombre);
        } catch (e) {}
        
        document.getElementById('login-password').value = '';
        errorEl.style.display = 'none';
        
        // Inicializar datos y mostrar home
        loadData();
        updateDashboard();
        showHome();
    } else {
        errorEl.textContent = 'Usuario o contraseña incorrectos';
        errorEl.style.display = 'block';
    }
}

async function crearUsuario() {
    const nombre = document.getElementById('nuevo-usuario-nombre').value.trim();
    const password = document.getElementById('nuevo-usuario-password').value;
    const confirmar = document.getElementById('nuevo-usuario-confirmar').value;
    const errorEl = document.getElementById('crear-usuario-error');
    
    if (!nombre || !password) {
        errorEl.textContent = 'Complete todos los campos';
        errorEl.style.display = 'block';
        return;
    }
    
    if (password !== confirmar) {
        errorEl.textContent = 'Las contraseñas no coinciden';
        errorEl.style.display = 'block';
        return;
    }
    
    await cargarUsuarios();
    
    if (usuarios.find(u => u.nombre === nombre)) {
        errorEl.textContent = 'El usuario ya existe';
        errorEl.style.display = 'block';
        return;
    }
    
    usuarios.push({ nombre, password });
    await guardarUsuarios();
    
    document.getElementById('nuevo-usuario-nombre').value = '';
    document.getElementById('nuevo-usuario-password').value = '';
    document.getElementById('nuevo-usuario-confirmar').value = '';
    errorEl.style.display = 'none';
    
    cargarListaUsuariosGestion();
    alert('✅ Usuario creado exitosamente');
}

async function eliminarUsuario() {
    const nombre = document.getElementById('eliminar-usuario-select').value;
    
    if (!nombre) {
        alert('Seleccione un usuario para eliminar');
        return;
    }
    
    if (!confirm(`¿Eliminar el usuario "${nombre}"?`)) {
        return;
    }
    
    await cargarUsuarios();
    usuarios = usuarios.filter(u => u.nombre !== nombre);
    await guardarUsuarios();
    
    // Si es el usuario actual, cerrar sesión
    if (usuarioActual && usuarioActual.nombre === nombre) {
        usuarioActual = null;
        try {
            localStorage.removeItem('calc_sesion_activa');
        } catch (e) {}
    }
    
    cargarListaUsuariosGestion();
    alert('✅ Usuario eliminado');
}

function cerrarSesion() {
    usuarioActual = null;
    try {
        localStorage.removeItem('calc_sesion_activa');
    } catch (e) {}
    showLogin();
}

function verificarSesion() {
    try {
        const sesion = localStorage.getItem('calc_sesion_activa');
        if (sesion) {
            cargarUsuarios();
            const usuario = usuarios.find(u => u.nombre === sesion);
            if (usuario) {
                usuarioActual = usuario;
                loadData();
                updateDashboard();
                showHome();
                return true;
            }
        }
    } catch (e) {}
    
    showLogin();
    return false;
}

// Inicializar usuarios y verificar sesión al cargar
cargarUsuarios();

// Hacer funciones globales
window.showLogin = showLogin;
window.showGestionUsuarios = showGestionUsuarios;
window.iniciarSesion = iniciarSesion;
window.crearUsuario = crearUsuario;
window.eliminarUsuario = eliminarUsuario;
window.cerrarSesion = cerrarSesion;
window.cargarUsuarios = cargarUsuarios;

// ==================== AUTO-LOGOUT POR INACTIVIDAD ====================

let inactivityTimer;
const INACTIVITY_LIMIT = 60 * 60 * 1000; // 1 hora en milisegundos

function resetInactivityTimer() {
    // Solo activar si hay sesión iniciada
    if (!usuarioActual) return;
    
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
        alert('⏱️ Sesión cerrada por inactividad (1 hora). Por seguridad, debes iniciar sesión nuevamente.');
        cerrarSesion();
    }, INACTIVITY_LIMIT);
}

function initInactivityTracking() {
    // Eventos que indican actividad del usuario
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
        document.addEventListener(event, resetInactivityTimer, true);
    });
    
    // Iniciar el timer al cargar
    resetInactivityTimer();
}

// Iniciar tracking cuando se autentica
const originalVerificarSesion = verificarSesion;
verificarSesion = function() {
    const result = originalVerificarSesion();
    if (result && usuarioActual) {
        initInactivityTracking();
    }
    return result;
};

// Reiniciar tracking al iniciar sesión
const originalIniciarSesion = iniciarSesion;
iniciarSesion = function() {
    const result = originalIniciarSesion();
    if (usuarioActual) {
        initInactivityTracking();
    }
    return result;
};
