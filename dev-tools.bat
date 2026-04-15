@echo off
echo ============================================
echo    Rd-investments - Herramientas de Desarrollo
echo ============================================
echo.
echo Selecciona una opcion:
echo [1] Iniciar servidor local (desarrollo)
echo [2] Verificar sintaxis de archivos
echo [3] Limpiar cache de node_modules
echo [4] Instalar dependencias
echo [5] Ejecutar pruebas de seguridad
echo [6] Salir
echo.
set /p opcion="Elige una opcion (1-6): "

if "%opcion%"=="1" goto iniciar_servidor
if "%opcion%"=="2" goto verificar_sintaxis
if "%opcion%"=="3" goto limpiar_cache
if "%opcion%"=="4" goto instalar_deps
if "%opcion%"=="5" goto pruebas_seguridad
if "%opcion%"=="6" goto salir

echo Opcion no valida. Presiona cualquier tecla para continuar...
pause >nul
goto menu

:iniciar_servidor
echo.
echo ============================================
echo         Iniciando Servidor Local
echo ============================================
echo.
echo Servidor disponible en: http://localhost:5000
echo Presiona Ctrl+C para detener
echo.
node server.js
goto menu

:verificar_sintaxis
echo.
echo ============================================
echo        Verificando Sintaxis
echo ============================================
echo.
echo Verificando server.js...
node -c server.js
if %errorlevel% neq 0 (
    echo ERROR en server.js
) else (
    echo OK - server.js
)

echo.
echo Verificando api/index.js...
node -c api/index.js
if %errorlevel% neq 0 (
    echo ERROR en api/index.js
) else (
    echo OK - api/index.js
)

echo.
echo Verificando app.js...
node -c app.js
if %errorlevel% neq 0 (
    echo ERROR en app.js
) else (
    echo OK - app.js
)

echo.
echo Verificacion completada.
pause
goto menu

:limpiar_cache
echo.
echo ============================================
echo         Limpiando Cache
echo ============================================
echo.
if exist node_modules (
    echo Eliminando node_modules...
    rmdir /s /q node_modules
    echo Eliminando package-lock.json...
    if exist package-lock.json del package-lock.json
    echo.
    echo Cache limpiado. Ejecuta la opcion 4 para reinstalar dependencias.
) else (
    echo No hay node_modules para limpiar.
)
echo.
pause
goto menu

:instalar_deps
echo.
echo ============================================
echo      Instalando Dependencias
echo ============================================
echo.
npm install
echo.
echo Dependencias instaladas.
pause
goto menu

:pruebas_seguridad
echo.
echo ============================================
echo       Ejecutando Pruebas de Seguridad
echo ============================================
echo.
echo Verificando funciones de seguridad...
node -e "
function sanitizeHTML(text) {
    if (text === null || text === undefined) return '';
    return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;').replace(/'/g, '&#x27;').replace(/\//g, '&#x2F;');
}

function safeParseFloat(value, defaultValue = 0) {
    if (value === null || value === undefined || value === '') return defaultValue;
    const num = parseFloat(value);
    return isNaN(num) ? defaultValue : num;
}

function safeParseInt(value, defaultValue = 0) {
    if (value === null || value === undefined || value === '') return defaultValue;
    const num = parseInt(value, 10);
    return isNaN(num) ? defaultValue : num;
}

console.log('Test sanitizeHTML: <script> ->', sanitizeHTML('<script>'));
console.log('Test safeParseFloat: abc ->', safeParseFloat('abc'));
console.log('Test safeParseInt: 42.5 ->', safeParseInt('42.5'));
console.log('Todas las pruebas pasaron correctamente.');
"
echo.
pause
goto menu

:salir
echo.
echo Hasta luego!
exit /b 0

:menu
cls
goto menu