@echo off
chcp 65001 >nul
title JK Noova Academy - Gestor de Base de Datos
echo ===============================================================
echo            JK NOOVA ACADEMY - GESTOR EN ORDENADOR
echo ===============================================================
echo.
echo 1. Iniciando servidor local en http://localhost:3000/...
echo 2. Abriendo aplicacion en tu navegador...
echo.
echo [MODO PERSISTENTE ACTIVO]
echo  - Todos los cambios (borrar, anadir, editar jugadores y fotos)
echo    se guardan de forma permanente e instantanea entre pestanas.
echo.
echo  * Para salir, simplemente cierra esta ventana negra.
echo ===============================================================
echo.
start "" http://localhost:3000/
node server.js
pause
