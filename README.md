# ⚽ JK Noova Academy - Plataforma Integral de Gestión Deportiva

> **Sistema web profesional para la gestión de academias y clubes de fútbol base.**
> Incluye gestión de jugadores, equipos, convocatorias, control de equipaciones oficiales Adidas, logística de transporte y una **pizarra táctica interactiva** en tiempo real.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-Ready-purple?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## 🌟 Características Principales

### 1. 📋 Base de Datos de Jugadores (`jugadores.html`)
- **Ficha técnica completa**: Nombre, apellidos, dorsal, fecha de nacimiento, edad exacta desglosada en **años y meses** (ej. *10 años y 3 meses*), foto con recorte inteligente, pie dominante (*Diestro*, *Zurdo*, *Ambidiestro*) y datos de contacto de tutores.
- **Filtros rápidos conmutables**:
  - 🩺 *Solo con alerta médica* (alergias, asma, medicación).
  - 👕 *Falta equipación* (jugadores que no disponen de las prendas oficiales obligatorias).
  - ⚠️ *Conflicto de dorsales* (jugadores que comparten el mismo número dentro del mismo equipo).
- **Control de indumentaria oficial Adidas**:
  - Tabla de tallas oficial Adidas para fútbol infantil y juvenil (ej. `9-10Y / 140cm`, calzado estándar europeo).
  - Control de posesión de prendas obligatorias: Camiseta celeste de entrenamiento, camiseta azul de competición, pantalón corto negro y medias negras.
  - Registro de accesorios: botas, espinilleras, sudaderas, chubasqueros, guantes y gorros.

### 2. 🛡️ Equipos y Categorías (`equipos.html`)
- Organización de plantillas por categorías (Prebenjamín, Benjamín, Alevín, Infantil, Cadete, Juvenil).
- **Alerta de dorsales repetidos**: Si dos o más jugadores coinciden en dorsal dentro de una plantilla, se muestra un banner animado de advertencia y un distintivo individual.
- Control de asistencia interactivo para sesiones de entrenamiento (Presente, Ausente, Justificado, Lesionado).

### 3. ⚽ Pizarra Táctica Interactiva (`calendario.html`)
- **Formatos reglamentarios**: Fútbol 7, Fútbol 8 y Fútbol 11 con esquemas clásicos predefinidos (`1-3-2-1`, `1-2-3-1`, `1-3-3-1`, `1-4-3-3`, `1-4-4-2`, etc.).
- **Motor de movimiento en tiempo real (Zero Lag)**: Arrastre ultra-fluido a 60 fps mediante Pointer Events, sin copias fantasma translúcidas.
- **Balón de fútbol ⚽ inteligente**:
  - Arrastre libre por el campo o **acople magnético** al pie de cualquier jugador titular o rival.
  - Movimiento solidario: al desplazar al jugador con balón, el esférico le acompaña en vivo.
- **Fichas de jugadores rivales 🔴**:
  - Creación de fichas oponentes en múltiples colores (rojo, morado, naranja, negro, blanco, cian).
  - **Edición en 1 clic**: Nombres y posiciones editables directamente en la ficha (ej. `DC`, `POR`, `MCD`, `Mbappé`, `Haaland`).
- **Iluminación de receptor (*Swap*)**: Al acercar un compañero sobre otro, el receptor se ilumina en dorado intenso (`0 0 18px #facc15`) y permite intercambiar posiciones automáticamente.
- **Herramientas de dibujo táctico**: Lienzo digital sobre el césped con lápiz libre, flechas vectoriales de desmarque/pase, borrador y botón de deshacer (*Undo*).
- **Exportación para WhatsApp**: Generación automática de alineación oficial formateada con un solo clic.

### 4. 🚐 Logística de Transporte Oficial (`transporte.html`)
- Gestión de la flota de vehículos de padres y entrenadores (turismos, SUV, furgonetas).
- Asignación de plazas para jugadores convocados por vehículo.
- **Algoritmo de auto-asignación rápida**: Distribuye automáticamente a todos los convocados sin vehículo en las plazas libres disponibles.
- Modo de impresión optimizado para el día del partido.

### 5. 📱 Vista Pública para Familias (`partido.html`)
- Página web ligera optimizada para dispositivos móviles.
- Generación de **código QR** para compartir con padres y jugadores los detalles del partido, mapa del campo, horario y plazas de coche asignadas.

### 6. 🌐 Multilingüe Completo (i18n)
- Soporte 100% nativo para 4 idiomas con cambio instantáneo sin recargar:
  - 🇪🇸 **Español**
  - 🇬🇧 **English**
  - 🇪🇪 **Eesti**
  - 🇷🇺 **Русский**

---

## 📂 Estructura del Proyecto

```text
jk-noova-academy/
├── index.html              # Panel principal y base de datos
├── jugadores.html          # Gestión y fichas detalladas de jugadores
├── equipos.html            # Plantillas, categorías y asistencia
├── calendario.html         # Calendario, convocatorias y pizarra táctica
├── transporte.html         # Gestión de vehículos y flota de transporte
├── partido.html            # Vista móvil para familias (con QR)
├── server.js               # Servidor local Node.js (cero dependencias externas)
├── package.json            # Configuración y scripts npm
├── sw.js                   # Service Worker para funcionamiento offline (PWA)
├── manifest.json           # Manifiesto para instalación como App de escritorio/móvil
├── .gitignore              # Exclusiones de Git
├── README.md               # Documentación oficial
├── css/
│   └── style.css           # Hoja de estilos principal, temas y animaciones
├── icons/
│   └── icon.svg            # Logotipo vectorial oficial
└── js/
    ├── app.js              # Controlador principal y navegación
    ├── asistencia.js       # Registro de asistencia a entrenamientos
    ├── calendario.js       # Gestión de eventos, partidos y convocatorias
    ├── data.js             # Capa de almacenamiento local (StorageService)
    ├── equipos.js          # Control de equipos, plantillas y dorsales
    ├── i18n.js             # Diccionario y motor multilingüe (ES, EN, ET, RU)
    ├── jugadores.js        # Lógica de jugadores, filtros y tallas Adidas
    ├── navbar.js           # Barra de navegación reactiva y selector de idioma
    ├── partido-familia.js  # Vista de partido para familias
    ├── photo-cropper.js    # Editor y recortador de fotos de jugadores
    ├── qr-code.js          # Generador de códigos QR vectoriales
    ├── tattica.js          # Motor táctico 2D, balón, rivales y canvas
    └── transporte.js       # Asignación de vehículos y plazas
```

---

## 🚀 Cómo Ejecutar en Local

### Opción 1: Con Node.js (Recomendada)
No requiere instalar dependencias adicionales (utiliza únicamente módulos nativos de Node.js):

```bash
# Iniciar el servidor
npm start

# O directamente:
node server.js
```
Abre tu navegador en: [http://localhost:3000](http://localhost:3000)

---

### Opción 2: Como Web Estática (Directo en Navegador)
Simplemente abre `index.html` con doble clic en cualquier navegador moderno (Google Chrome, Microsoft Edge, Firefox, Safari) o usa una extensión como *Live Server* en VS Code.

---

## 🌐 Publicar Gratis en GitHub Pages

Puedes alojar esta plataforma de manera totalmente gratuita y accesible desde cualquier lugar del mundo siguiendo estos sencillos pasos:

1. Ve a tu repositorio en **GitHub**.
2. Haz clic en **Settings** (Ajustes) en la barra superior.
3. En el menú lateral izquierdo, haz clic en **Pages**.
4. En **Build and deployment** > **Branch**:
   - Selecciona la rama `main` (o `master`).
   - Selecciona la carpeta `/ (root)`.
   - Pulsa **Save**.
5. En 1 o 2 minutos, GitHub te proporcionará una URL pública (ejemplo: `https://tu-usuario.github.io/tu-repositorio/`). ¡Listo para usar desde cualquier móvil, tablet o PC!

---

## 📄 Licencia

Este proyecto está bajo la Licencia **MIT**. Consulta el archivo de licencia o úsalo libremente para tu club o academia.
