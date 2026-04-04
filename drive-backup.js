// CALC INVERSIONES - Google Drive Backup
// Sistema de respaldo automático a Google Drive

const GOOGLE_CLIENT_ID = 'AIzaSyBmWmfduZ5fhYaHul9JFQVZYBThkmb0Lyk';
const DRIVE_FOLDER_NAME = 'Calc Inversiones Backup';
let driveFolderId = null;
let isConnected = false;
let accessToken = null;

// ============================================
// INICIALIZACIÓN
// ============================================

function initGoogleDrive() {
    console.log('🔄 Inicializando Google Drive...');
}

// ============================================
// AUTENTICACIÓN - Google OAuth 2.0
// ============================================

function connectDrive() {
    console.log('🔗 Intentando conectar a Google Drive...');
    
    if (typeof google === 'undefined' || !google.accounts) {
        alert('⚠️ Google no está cargado. Recarga la página e intenta de nuevo.');
        return;
    }
    
    const client = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/drive.file',
        callback: (response) => {
            if (response.access_token) {
                accessToken = response.access_token;
                isConnected = true;
                localStorage.setItem('calc_drive_connected', 'true');
                updateDriveStatus(true);
                alert('✅ ¡Conectado a Google Drive!');
                getOrCreateFolder();
            } else if (response.error) {
                alert('❌ Error: ' + response.error);
            }
        },
    });
    
    client.requestAccessToken({ prompt: 'consent' });
}

function disconnectDrive() {
    if (accessToken) {
        google.accounts.oauth2.revoke(accessToken, () => {
            accessToken = null;
            isConnected = false;
            localStorage.removeItem('calc_drive_connected');
            updateDriveStatus(false);
            alert('🔴 Desconectado de Google Drive');
        });
    }
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
    if (!accessToken) return;
    
    try {
        // Buscar carpeta existente
        const searchResponse = await fetch(
            'https://www.googleapis.com/drive/v3/files?q=name%3D%27' + encodeURIComponent(DRIVE_FOLDER_NAME) + %27%20and%20mimeType%3D%27application%2Fvnd.google-apps.folder%27%20and%20trashed%3Dfalse',
            { headers: { 'Authorization': 'Bearer ' + accessToken } }
        );
        const searchData = await searchResponse.json();
        
        if (searchData.files && searchData.files.length > 0) {
            driveFolderId = searchData.files[0].id;
            console.log('📁 Carpeta encontrada:', driveFolderId);
        } else {
            // Crear carpeta
            const createResponse = await fetch(
                'https://www.googleapis.com/drive/v3/files',
                {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer ' + accessToken,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name: DRIVE_FOLDER_NAME,
                        mimeType: 'application/vnd.google-apps.folder'
                    })
                }
            );
            const createData = await createResponse.json();
            driveFolderId = createData.id;
            console.log('📁 Carpeta creada:', driveFolderId);
        }
    } catch (e) {
        console.error('❌ Error con carpeta:', e);
    }
}

// ============================================
// BACKUP - SUBIR A DRIVE
// ============================================

async function uploadBackupToDrive() {
    console.log('📤 Subiendo backup...');
    
    if (!accessToken) {
        alert('⚠️ Conecta Google Drive primero');
        return;
    }
    
    if (!driveFolderId) {
        await getOrCreateFolder();
    }
    
    // Preparar datos
    const data = {
        config: window.config,
        compras: window.compras,
        ventas: window.ventas,
        fechaRespaldo: new Date().toISOString(),
        version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const filename = `calc-inversiones-backup-${new Date().toISOString().split('T')[0]}.json`;
    
    // Metadata
    const metadata = {
        name: filename,
        parents: [driveFolderId]
    };
    
    // Crear multipart request
    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const closeDelimiter = "\r\n--" + boundary + "--";
    
    const metadataJson = JSON.stringify(metadata);
    const fileContent = await blob.text();
    
    const requestBody = 
        delimiter + 
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' + 
        metadataJson + 
        delimiter + 
        'Content-Type: application/octet-stream\r\n\r\n' + 
        fileContent + 
        closeDelimiter;
    
    try {
        const response = await fetch(
            'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
            {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + accessToken,
                    'Content-Type': 'multipart/related; boundary="' + boundary + '"'
                },
                body: requestBody
            }
        );
        
        if (response.ok) {
            alert('✅ Backup subido a Google Drive');
            localStorage.setItem('calc_last_backup', Date.now().toString());
            showDriveBackups();
        } else {
            const error = await response.text();
            console.error('Error:', error);
            alert('❌ Error al subir backup');
        }
    } catch (e) {
        console.error('❌ Error upload:', e);
        alert('❌ Error: ' + e.message);
    }
}

// ============================================
// VER BACKUPS
// ============================================

async function showDriveBackups() {
    console.log('📂 Obteniendo lista de backups...');
    
    if (!accessToken) {
        alert('⚠️ Conecta Google Drive primero');
        return;
    }
    
    const listSection = document.getElementById('drive-backups-list');
    const container = document.getElementById('backups-container');
    listSection.style.display = 'block';
    
    try {
        const response = await fetch(
            `https://www.googleapis.com/drive/v3/files?q='${driveFolderId}'%20in%20parents%20and%20mimeType%3D'application%2Fjson'%20and%20trashed%3Dfalse&orderBy=createdTime%20desc`,
            { headers: { 'Authorization': 'Bearer ' + accessToken } }
        );
        
        const data = await response.json();
        
        if (data.files && data.files.length > 0) {
            let html = '';
            data.files.forEach(file => {
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

// ============================================
// RESTAURAR DESDE DRIVE
// ============================================

async function restoreFromDrive(fileId) {
    if (!confirm('⚠️ Esto reemplazará todos los datos actuales. ¿Continuar?')) return;
    
    console.log('📥 Restaurando archivo:', fileId);
    
    try {
        const response = await fetch(
            `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
            { headers: { 'Authorization': 'Bearer ' + accessToken } }
        );
        
        const data = await response.json();
        
        if (data.config) window.config = data.config;
        if (data.compras) window.compras = data.compras;
        if (data.ventas) window.ventas = data.ventas;
        
        window.saveData();
        alert('✅ Datos restaurados correctamente');
        window.showHome();
        
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
    const freqSelect = document.getElementById('backup-frequency');
    if (freqSelect) {
        freqSelect.value = frequency;
    }
    
    if (frequency !== '0' && isConnected) {
        scheduleAutoBackup(parseInt(frequency));
    }
}

function scheduleAutoBackup(days) {
    const lastBackup = localStorage.getItem('calc_last_backup');
    const now = Date.now();
    const daysMs = days * 24 * 60 * 60 * 1000;
    
    if (!lastBackup || (now - parseInt(lastBackup)) > daysMs) {
        console.log('⏰ Programando backup automático...');
        uploadBackupToDrive();
    }
}

// Inicializar
console.log('📦 Calc Inversiones - Drive Backup loaded');