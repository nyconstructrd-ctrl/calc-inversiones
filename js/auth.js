// js/auth.js
// Gestión de autenticación y seguridad

var isLoggedIn = false;
var INACTIVITY_TIMEOUT = 60 * 60 * 1000; // 1 hora
var inactivityTimer;

function verificarPassword() {
    const passwordInput = document.getElementById('login-password');
    const password = passwordInput ? passwordInput.value : '';
    
    // Contraseña persistente en config si existe, sino default
    const PASSWORD_CORRECTA = config.password || '1234';
    
    if (password === PASSWORD_CORRECTA) {
        authenticateUser();
    } else {
        alert('Contraseña incorrecta. Intenta de nuevo.');
        if (passwordInput) passwordInput.value = '';
    }
}

function authenticateUser() {
    isLoggedIn = true;
    localStorage.setItem('calc_authenticated', 'true');
    localStorage.setItem('calc_last_activity', Date.now().toString());
    showHome();
    startInactivityTimer();
}

function startInactivityTimer() {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(function() {
        logoutUser();
    }, INACTIVITY_TIMEOUT);
}

function logoutUser() {
    isLoggedIn = false;
    localStorage.removeItem('calc_authenticated');
    localStorage.removeItem('calc_last_activity');
    showScreen('login-screen');
    alert('Sesión expirada por inactividad');
}

async function cambiarPassword() {
    const actual = document.getElementById('password-actual').value;
    const nueva = document.getElementById('password-nueva').value;
    const confirmar = document.getElementById('password-confirmar').value;
    const errorEl = document.getElementById('password-error');
    const successEl = document.getElementById('password-success');
    
    errorEl.style.display = 'none';
    successEl.style.display = 'none';
    
    const actualHash = await hashPassword(actual);
    const storedHash = localStorage.getItem('calc_app_password_hash') || '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4';
    
    if (actualHash !== storedHash) {
        errorEl.textContent = '❌ La contraseña actual es incorrecta';
        errorEl.style.display = 'block';
        return;
    }
    
    if (nueva.length < 4) {
        errorEl.textContent = '❌ La nueva contraseña debe tener al menos 4 caracteres';
        errorEl.style.display = 'block';
        return;
    }
    
    if (nueva !== confirmar) {
        errorEl.textContent = '❌ Las contraseñas nuevas no coinciden';
        errorEl.style.display = 'block';
        return;
    }
    
    const nuevaHash = await hashPassword(nueva);
    localStorage.setItem('calc_app_password_hash', nuevaHash);
    
    successEl.style.display = 'block';
    document.getElementById('password-actual').value = '';
    document.getElementById('password-nueva').value = '';
    document.getElementById('password-confirmar').value = '';
    
    setTimeout(() => {
        showConfig();
    }, 2000);
}

async function hashPassword(password) {
    if (!crypto || !crypto.subtle) {
        return password; // Fallback para conexiones HTTP locales donde no hay Crypto API
    }
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Exponer funciones
window.verificarPassword = verificarPassword;
window.cambiarPassword = cambiarPassword;
window.startInactivityTimer = startInactivityTimer;
window.hashPassword = hashPassword;
window.logoutUser = logoutUser;
