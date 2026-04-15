# Rd-investments - Gestión de Inventario

Aplicación web para gestión financiera de compras y ventas de ropa.

## 🚀 Características

- Gestión de compras con cálculo automático de costos
- Registro de ventas con cálculo de ganancias
- Dashboard con métricas financieras
- Sistema de gastos mensuales
- Configuración de tasas de cambio
- Sistema de usuarios básico
- Respaldo de datos local
- Interfaz PWA (Progressive Web App)

## 🖥️ Desarrollo Local

### Inicio Rápido
```bash
# Opción 1: Archivo batch simple
start.bat

# Opción 2: Herramientas completas de desarrollo
dev-tools.bat
```

### Scripts Disponibles

#### `start.bat`
- Inicia el servidor local en http://localhost:5000
- Ideal para desarrollo rápido

#### `dev-tools.bat`
- **Iniciar servidor local**: Opción 1
- **Verificar sintaxis**: Revisa errores en archivos JavaScript
- **Limpiar cache**: Elimina node_modules y reinstala dependencias
- **Instalar dependencias**: Ejecuta `npm install`
- **Pruebas de seguridad**: Valida funciones de sanitización y parseo

#### `check-deploy.bat`
- Verifica el estado del despliegue en Vercel
- Abre automáticamente el navegador con la URL de producción
- Muestra información de troubleshooting

### Comandos Manuales
```bash
# Iniciar servidor
node server.js

# Verificar sintaxis
node -c server.js
node -c api/index.js
node -c app.js

# Limpiar e instalar dependencias
rmdir /s /q node_modules
del package-lock.json
npm install
```

## 🔒 Seguridad Implementada

### Servidor
- ✅ CORS configurado para orígenes específicos (no wildcard)
- ✅ Validación de rutas para prevenir directory traversal
- ✅ Validación de tipos de archivos permitidos
- ✅ Límites de tamaño en payloads de API
- ✅ Validación de estructura de datos en APIs

### Cliente
- ✅ Sanitización básica de HTML para prevenir XSS
- ✅ Validación segura de entrada numérica
- ✅ Hash simple para contraseñas (mejorar en producción)
- ✅ Eliminación de datos hardcodeados de muestra

### Configuración PWA
- ✅ Manifest.json completo con shortcuts
- ✅ Categorías y metadata apropiada
- ✅ Orientación y scope definidos

## 🚀 Despliegue en Vercel

### Requisitos Previos
- Cuenta en [Vercel](https://vercel.com)
- Git instalado (opcional, pero recomendado)

### Pasos para Desplegar

1. **Conecta tu repositorio:**
   - Ve a [vercel.com](https://vercel.com) y haz login
   - Haz clic en "New Project"
   - Importa tu repositorio de GitHub/GitLab o sube los archivos manualmente

2. **Configuración del proyecto:**
   - **Framework Preset:** Other
   - **Root Directory:** `./` (raíz del proyecto)
   - **Build Command:** `npm run build` (aunque no necesitamos build)
   - **Output Directory:** `./`
   - **Install Command:** `npm install`

3. **Variables de entorno (opcional):**
   - Puedes configurar variables de entorno en Vercel Dashboard
   - `DEFAULT_PASSWORD`: Para cambiar la contraseña por defecto
   - `ALLOWED_ORIGINS`: Lista de orígenes permitidos separados por coma

4. **Deploy:**
   - Haz clic en "Deploy"
   - Vercel detectará automáticamente la configuración en `vercel.json`

### URL del Despliegue
Después del despliegue, Vercel te dará una URL como:
`https://calc-inversiones.vercel.app`

### Configuración CORS para Producción
Actualiza los orígenes permitidos en `api/index.js`:
```javascript
const allowedOrigins = [
    'https://tu-dominio.vercel.app',
    'https://calc-inversiones-nyconstructrd-ctrl.vercel.app'
];
```

### Notas Importantes
- Vercel tiene limitaciones de escritura en el sistema de archivos
- Los datos de usuarios se almacenan localmente (considera usar una base de datos para producción)
- Las funciones serverless tienen un timeout máximo de 30 segundos
- El almacenamiento local del navegador funciona normalmente

## 🔐 Configuración de Seguridad

### Contraseña por Defecto
La contraseña por defecto es `admin123`. Cámbiala inmediatamente después del primer login.

### Variables de Entorno (Recomendado)
Para producción, configura estas variables:
- `DEFAULT_PASSWORD`: Contraseña por defecto
- `ALLOWED_ORIGINS`: Lista de orígenes permitidos separados por coma

## 📱 Uso como PWA

1. Abre la aplicación en un navegador compatible
2. Haz clic en "Instalar aplicación" en la barra de direcciones
3. La app funcionará offline con las funcionalidades básicas

## 🔧 Desarrollo

### Estructura del Proyecto
```
/
├── index.html          # Interfaz principal
├── app.js             # Lógica principal del cliente
├── server.js          # Servidor Node.js
├── manifest.json      # Configuración PWA
├── styles.css         # Estilos CSS
├── app_users.js       # Sistema de usuarios
├── modal-functions.js # Funciones de modales
├── toggle-detalles.js # Utilidades de UI
└── vercel.json        # Configuración de despliegue
```

## 🚨 Problemas Conocidos y Soluciones Aplicadas

### Problemas de Seguridad Corregidos
1. **XSS Prevention**: Implementada sanitización de HTML
2. **Directory Traversal**: Validación de rutas en servidor
3. **CORS Misconfiguration**: Origen específico en lugar de wildcard
4. **Input Validation**: Funciones seguras para parseo numérico

### Mejoras de Calidad
1. **Datos Hardcodeados**: Eliminados datos de muestra
2. **Console Logs**: Removidos logs de producción
3. **Error Handling**: Mejorado manejo de errores
4. **Code Comments**: Limpiado código comentado innecesario

## 📊 API Endpoints

- `GET /api/usuarios` - Obtener lista de usuarios
- `POST /api/usuarios` - Guardar lista de usuarios

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## ⚠️ Advertencias de Seguridad

- Esta aplicación usa un sistema de hash simple para contraseñas. Para producción real, implementa bcrypt o similar.
- El servidor actual no tiene rate limiting. Implementa uno para producción.
- Revisa y actualiza las dependencias regularmente.
- Configura HTTPS en producción.
- La validación de entrada es básica; fortalece según necesidades.