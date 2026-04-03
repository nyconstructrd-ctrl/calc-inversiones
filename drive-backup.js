// CALC INVERSIONES - Google Drive Backup
// Sistema de respaldo automático a Google Drive

const GOOGLE_CLIENT_ID = 'AIzaSyBmWmfduZ5fhYaHul9JFQVZYBThkmb0Lyk';
const DRIVE_FOLDER_NAME = 'Calc Inversiones Backup';
let driveFolderId = null;
let isConnected = false;
let tokenClient = null;

// ============================================
// INICIALIZACIÓN
// ============================================

window.addEventListener('load', function() {
    initGoogleDrive();
});

function initGoogleDrive() {
    // Cargar script de Google Identity Services
    if (typeof google !== 'undefined' && google.accounts) {
        initializeTokenClient();
    }
}

function initializeTokenClient() {
    try {
        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: 'https://www.googleapis.com/auth/drive.file',
            callback: handleAuthCallback,
        });
    } catch (e) {
        console.log('Google OAuth no disponible aún');
    }
}

// ============================================
// AUTENTICACIÓN
// ============================================

function connectDrive() {
    if (!tokenClient) {
        initializeTokenClient();
        setTimeout(connectDrive, 1000);
        return;
    }
    
    try {
        tokenClient.requestAccessToken({ prompt: 'consent' });
    } catch (e) {
        alert('Error al conectar: ' + e.message);
    }
}

function handleAuthCallback(response) {
    if (response.access_token) {
        isConnected = true;
        localStorage.setItem('calc_drive_connected', 'true');
        updateDriveStatus(true);
        getOrCreateFolder();
        
        // Configurar backup automático
        setupAutoBackup();
    }
}

function disconnectDrive() {
    google.accounts.oauth2.revoke(accessToken => {
        isConnected = false;
        localStorage.removeItem('calc_drive_connected');
        updateDriveStatus(false);
    });
}

// ============================================
// UI
// ============================================

function updateDriveStatus(connected) {
    const statusText = document.getElementById('drive-status-text');
    const connectBtn = document.getElementById('drive-connect-btn');
    const configSection = document.getElementById('drive-config');
    
    if (connected) {
        statusText.textContent = '✅ Conectado';
        statusText.style.color = '#4CAF50';
        connectBtn.textContent = '🔴 Desconectar';
        connectBtn.onclick = disconnectDrive;
        connectBtn.style.background = '#f44336';
        connectBtn.style.color = 'white';
        configSection.style.display = 'block';
    } else {
        statusText.textContent = 'No conectado';
        statusText.style.color = 'white';
        connectBtn.textContent = '🔗 Conectar Google Drive';
        connectBtn.onclick = connectDrive;
        connectBtn.style.background = 'white';
        connectBtn.style.color = '#4285F4';
        configSection.style.display = 'none';
    }
}

// ============================================
// CARPETA EN DRIVE
// ============================================

async function getOrCreateFolder() {
    try {
        // Buscar carpeta existente
        const response = await gapi.client.drive.files.list({
            q: `name='${DRIVE_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
            fields: 'files(id, name)'
        });
        
        if (response.result.files && response.result.files.length > 0) {
            driveFolderId = response.result.files[0].id;
            console.log('Carpeta encontrada:', driveFolderId);
        } else {
            // Crear carpeta
            const createResponse = await gapi.client.drive.files.create({
                name: DRIVE_FOLDER_NAME,
                mimeType: 'application/vnd.google-apps.folder'
            });
            driveFolderId = createResponse.result.id;
            console.log('Carpeta creada:', driveFolderId);
        }
    } catch (e) {
        console.error('Error con carpeta:', e);
    }
}

// ============================================
// BACKUP
// ============================================

async function uploadBackupToDrive() {
    if (!isConnected) {
        alert('⚠️ Conecta Google Drive primero');
        return;
    }
    
    // Cargar API de Drive si no está
    if (!window.gapi) {
        await loadGapiClient();
    }
    
    // Preparar datos
    const data = {
        config: config,
        compras: compras,
        ventas: ventas,
        fechaRespaldo: new Date().toISOString(),
        version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const filename = `calc-inversiones-backup-${new Date().toISOString().split('T')[0]}.json`;
    
    //metadata
    const metadata = {
        name: filename,
        parents: [driveFolderId]
    };
    
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', blob);
    
    try {
        const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + google.accounts.oauth2.getToken().access_token
            },
            body: form
        });
        
        if (response.ok) {
            alert('✅ Backup subido a Google Drive');
            localStorage.setItem('calc_last_backup', Date.now().toString());
            showDriveBackups();
        } else {
            alert('❌ Error al subir backup');
        }
    } catch (e) {
        console.error('Error upload:', e);
        alert('❌ Error: ' + e.message);
    }
}

async function loadGapiClient() {
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.onload = () => {
            gapi.load('client', resolve);
        };
        document.body.appendChild(script);
    });
}

// ============================================
// VER BACKUPS
// ============================================

async function showDriveBackups() {
    if (!isConnected) {
        alert('⚠️ Conecta Google Drive primero');
        return;
    }
    
    const listSection = document.getElementById('drive-backups-list');
    const container = document.getElementById('backups-container');
    listSection.style.display = 'block';
    
    try {
        const response = await gapi.client.drive.files.list({
            q: `'${driveFolderId}' in parents and mimeType='application/json' and trashed=false`,
            fields: 'files(id, name, createdTime)',
            orderBy: 'createdTime desc'
        });
        
        if (response.result.files && response.result.files.length > 0) {
            let html = '';
            response.result.files.forEach(file => {
                const date = new Date(file.createdTime).toLocaleDateString();
                html += `
                    <div style="padding: 10px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <p style="margin: 0; font-weight: bold;">${file.name}</p>
                            <p style="margin: 3px 0 0 0; font-size: 12px; color: #666;">${date}</p>
                        </div>
                        <button onclick="restoreFromDrive('${file.id}')" style="background: #4CAF50; color: white; border: none; padding: 8px 12px; border-radius: 6px; font-size: 12px;">
                            📥 Restaurar
                        </button>
                    </div>
                `;
            });
            container.innerHTML = html;
        } else {
            container.innerHTML = '<p style="color: #999; text-align: center;">No hay backups en Drive</p>';
        }
    } catch (e) {
        console.error('Error listando:', e);
        container.innerHTML = '<p style="color: #999;">Error al cargar backups</p>';
    }
}

async function restoreFromDrive(fileId) {
    if (!confirm('⚠️ Esto reemplazará todos los datos actuales. ¿Continuar?')) return;
    
    try {
        const response = await gapi.client.drive.files.get({
            fileId: fileId,
            alt: 'media'
        });
        
        const data = JSON.parse(response.body);
        
        if (data.config) config = data.config;
        if (data.compras) compras = data.compras;
        if (data.ventas) ventas = data.ventas;
        
        saveData();
        alert('✅ Datos restaurados correctamente');
        showHome();
        
    } catch (e) {
        console.error('Error restoring:', e);
        alert('❌ Error al restaurar: ' + e.message);
    }
}

// ============================================
// BACKUP AUTOMÁTICO
// ============================================

function saveBackupFrequency() {
    const frequency = document.getElementById('backup-frequency').value;
    localStorage.setItem('calc_backup_frequency', frequency);
    
    if (frequency !== '0' && isConnected) {
        scheduleAutoBackup(parseInt(frequency));
    }
}

function setupAutoBackup() {
    const frequency = localStorage.getItem('calc_backup_frequency') || '7';
    document.getElementById('backup-frequency').value = frequency;
    
    if (frequency !== '0') {
        scheduleAutoBackup(parseInt(frequency));
    }
}

function scheduleAutoBackup(days) {
    const lastBackup = localStorage.getItem('calc_last_backup');
    const now = Date.now();
    const daysMs = days * 24 * 60 * 60 * 1000;
    
    if (!lastBackup || (now - parseInt(lastBackup)) > daysMs) {
        // Tiempo de hacer backup
        console.log('⏰ Programando backup automático...');
        uploadBackupToDrive();
    }
}

// ============================================
// MOSTRAR ESTADO AL INICIO
// ============================================

// Verificar si ya estaba conectado (para session actual)
if (localStorage.getItem('calc_drive_connected') === 'true') {
    // Requires re-auth on page load for security
    console.log('Drive previously connected, user needs to reconnect');
}