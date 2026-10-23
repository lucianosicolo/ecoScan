# EcoScan

EcoScan es una prueba de concepto desarrollada como trabajo final de la Licenciatura en Sistemas de la Universidad de Palermo.

La aplicación permite capturar o seleccionar una imagen de un residuo y analizarla mediante inteligencia artificial para identificar su categoría, material, estado de reciclabilidad y recomendaciones de preparación.

## Alcance

EcoScan trabaja con cinco categorías objetivo:

- botella plástica de bebida PET
- lata de aluminio
- botella o frasco de vidrio
- papel limpio
- cartón limpio

Los elementos fuera del alcance o que no pueden identificarse con suficiente claridad se presentan como resultados desconocidos.

## Funcionalidades principales

- registro e inicio de sesión
- análisis de imágenes mediante IA
- estados apto, no apto y desconocido
- historial por usuario con imagen asociada
- EcoPuntos y EcoMundo
- consulta de puntos verdes
- geolocalización y cálculo de distancia
- edición de perfil

## Tecnologías

- Ionic
- Angular
- Capacitor
- TypeScript
- NestJS en el backend
- Gemini API para análisis multimodal
- Google Maps para puntos verdes y geolocalización

## Desarrollo local

Instalar dependencias:

```bash
npm install
```

Levantar el frontend:

```bash
ionic serve
```

Por defecto, el frontend espera el backend en:

```text
http://localhost:3000
```

La URL del backend se centraliza en `src/app/config/api.config.ts` y en `src/environments/environment*.ts`. Desde la pantalla de inicio de sesión se puede tocar **Configurar servidor** para cambiar la dirección sin recompilar la aplicación; la selección se guarda localmente en el dispositivo.

### Android en un teléfono físico (misma red local)

1. Ejecutar el backend NestJS en la computadora (`npm run start:dev`). Debe escuchar en `0.0.0.0:3000`, como ya está configurado en el backend.
2. Conectar la computadora y el teléfono a la misma red Wi-Fi. Obtener la dirección IPv4 local de la computadora con `ipconfig` (Windows).
3. En el login de EcoScan, tocar **Configurar servidor** e ingresar una URL similar a `http://192.168.1.100:3000`, reemplazando la IP del ejemplo por la real.
4. Comprobar desde el navegador del teléfono que `http://IP_DE_TU_PC:3000/` responde; si no responde, revisar el firewall y la conectividad de la red.

Para emulador Android, configurar `http://10.0.2.2:3000`. Para pruebas con USB + `adb reverse`, se puede dejar `http://localhost:3000`.

**Seguridad:** el HTTP local es solo para desarrollo. Para un servidor accesible desde Internet, usar una URL HTTPS. No usar direcciones de ejemplo como si fueran servidores reales.

## Android

Compilar el frontend:

```bash
ionic build
```

Sincronizar Capacitor:

```bash
npx cap sync android
```

Para probar contra el backend local desde un dispositivo conectado por ADB:

```bash
adb reverse tcp:3000 tcp:3000
```

Luego puede abrirse el proyecto Android con Android Studio.

## Notas para la demostración

- Google Maps requiere una API key válida, billing habilitado y la configuración correspondiente del proyecto de Google Cloud.
- El backend debe estar ejecutándose en el puerto 3000.
- Los EcoPuntos se calculan a partir de los escaneos con estado `apto`: cada uno suma 10 EP.
- El progreso de EcoMundo se deriva del historial del usuario.

## Versión

EcoScan 1.0.0
