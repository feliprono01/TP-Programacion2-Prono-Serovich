# LAMA & LING - Sistema de Gestión y Catálogo

Este proyecto es un sistema web que incluye un catálogo de productos para clientes y un panel de gestión de inventario para administradores. Cuenta con un backend desarrollado en Node.js y un frontend estructurado en HTML/CSS, conectados a una base de datos MySQL.

##  Requisitos Previos

Asegúrate de tener instalados los siguientes programas antes de comenzar:
* [XAMPP](https://www.apachefriends.org/) (para servidor Apache y MySQL)
* [Node.js](https://nodejs.org/)
* [Visual Studio Code](https://code.visualstudio.com/) (o tu IDE de preferencia)

##  Guía de Arranque

Sigue estos pasos en orden para ejecutar el sistema localmente.

### 1. Configurar la Base de Datos
1. Inicia los módulos **Apache** y **MySQL** desde el Panel de Control de XAMPP (ambos deben estar en verde).
2. Abre tu navegador y dirígete a `http://localhost/phpmyadmin`.
3. Crea una nueva base de datos llamada `lamayling` con cotejamiento `utf8mb4_general_ci`.
4. Ve a la pestaña **Importar**, selecciona el archivo `Scripts/Lamayline.sql` ubicado en el proyecto y ejecútalo.

### 2. Levantar el Backend
1. Abre una terminal y posiciónate en la carpeta del backend:
   ```bash
   cd Backend-2024-2-cuatrimestre
   ```
2. Instala las dependencias necesarias (solo la primera vez):
   ```bash
   npm install
   ```
3. Inicia el servidor del backend:
   ```bash
   npm run dev
   ```
> **Nota:** Verás el mensaje `Server running at 4000`. Mantén esta terminal abierta.

### 3. Levantar el Frontend
1. Abre una **nueva** terminal y asegúrate de estar en la raíz del proyecto (`TP-Programacion2-Prono-Serovich`).
2. Ejecuta el servidor del frontend:
   ```bash
   node server.js
   ```
> **Nota:** Verás el mensaje `Servidor corriendo en http://localhost:3000`. Mantén esta terminal abierta.

##  Acceso al Sistema

Ingresa a `http://localhost:3000` desde tu navegador. Puedes utilizar las siguientes credenciales de prueba:

| Rol | Correo Electrónico | Contraseña |
| :--- | :--- | :--- |
| **Administrador** | `admin@lamayling.com` | `admin123` |
| **Empleado** | `sara@lamayling.com` | `1234` |
| **Cliente** | `carlos@lamayling.com` | `1234` |

*Para acceder al panel de gestión de inventario, ingresa con la cuenta de Administrador y haz clic en "Gestionar" en la barra de navegación superior.*

##  Solución de Problemas Frecuentes

* **`Cannot connect to database`**: Verifica que MySQL esté activo en XAMPP.
* **`Port 4000 is already in use`**: El backend ya se está ejecutando. Cierra terminales duplicadas o reinicia XAMPP.
* **`Cannot GET /`**: El `server.js` no está corriendo desde la carpeta raíz. Revisa el paso 3.
* **Error al importar el SQL**: Asegúrate de usar MySQL 5.7+ o MariaDB 10.4+.
