@echo off
echo ============================================
echo    Rd-investments - Verificar Despliegue
echo ============================================
echo.
echo Verificando estado del despliegue en Vercel...
echo.

echo URLs disponibles:
echo ──────────────────────────────────────────
echo Produccion: https://calc-inversiones.vercel.app
echo Preview:    https://calc-inversiones-lalxmtctk-dwdpublicidad-2061s-projects.vercel.app
echo.
echo Presiona cualquier tecla para abrir en navegador...
pause >nul

echo Abriendo navegador...
start https://calc-inversiones.vercel.app

echo.
echo Si la aplicacion no carga:
echo 1. Verifica tu conexion a internet
echo 2. Espera unos minutos (Vercel puede tardar en activarse)
echo 3. Revisa la consola del navegador (F12) para errores
echo.
echo Para desarrollo local, usa: start.bat
echo.
pause