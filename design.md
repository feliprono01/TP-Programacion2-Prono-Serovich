# Design System - Lana & Lino

## Overview
[Inferencia] Este sistema de diseño establece las bases visuales mediante tokens CSS nativos.
La empresa Lana & Lino dedicada a la venta de indumentaria quiere disponer de una página web para poder realizar ventas online.[cite: 1]
Lana & Lino se dedica a la venta de diferentes productos como ser: remeras, buzos, camperas, bermudas, pantalones, calzado, entre otros.[cite: 1]
Solo podrán utilizar HTML, CSS y Javascript, no se permite el uso de ningún framework.[cite: 1]
La web deberá contar con un modo claro y un modo oscuro, el usuario podrá alternar cada vez que lo desee entre esas dos configuraciones.[cite: 1]

## Colors
[Inferencia] Para cumplir con el requisito de los modos de visualización, se definen estas variables exactas en el `:root` de CSS para ser invertidas.
* **`--color-canvas`**: `#ffffff` (Claro) / `#121212` (Oscuro) - Fondo principal que permite la visualización de todo el catálogo para cualquier usuario.[cite: 1]
* **`--color-surface`**: `#f5f5f5` (Claro) / `#1e1e1e` (Oscuro) - Fondos de tarjetas donde deberá visualizarse la foto del mismo, una descripción, los talles disponibles, el color, la cantidad de stock disponible, el precio y un botón de agregar al carrito.[cite: 1]
* **`--color-ink`**: `#111111` (Claro) / `#ffffff` (Oscuro) - Textos principales y color para el texto que indique el nombre de la empresa en el medio del mismo header.[cite: 1]
* **`--color-hairline`**: `#e5e5e5` (Claro) / `#333333` (Oscuro) - Líneas divisorias de 1px.
* **`--color-mute`**: `#707072` (Claro) / `#a0a0a0` (Oscuro) - Textos secundarios y color para el texto del footer que debe especificar que fue desarrollada por los integrantes del grupo.[cite: 1]
* **`--color-success`**: `#007d48` - Color exclusivo que deberá indicar pago aprobado con éxito, sin realizar ninguna transacción ni validación.[cite: 1]
* **`--color-disabled`**: `#d30005` - Color de alerta porque si el producto no tiene unidades disponibles deberá visualizarse esta situación de alguna manera y no permitir agregar al carrito el producto.[cite: 1]

## Typography
[Inferencia] Escala tipográfica y pesos de fuente definidos para mantener la jerarquía sin frameworks.
* **`--font-display`**: 32px, font-weight 700, line-height 1.2 - Para el texto que indique el nombre de la empresa en el medio del mismo header.[cite: 1]
* **`--font-heading`**: 24px, font-weight 600, line-height 1.3 - Para títulos de secciones generales.
* **`--font-body-strong`**: 16px, font-weight 600, line-height 1.5 - Para el nombre del producto, o los labels del campo para ingresar el número de tarjeta, fecha de vencimiento, nombre de la tarjeta.[cite: 1]
* **`--font-body-md`**: 16px, font-weight 400, line-height 1.5 - Para los textos de descripción general y el visualizador de cuotas permitiendo 1,3,6,9 o 12 cuotas.[cite: 1]
* **`--font-button`**: 14px, font-weight 600, line-height 1.5 - Para el texto del botón pagar que llevará a la pantalla de pago o el botón guardar para confirmar los cambios realizados.[cite: 1]

## Layout & Spacing
[Inferencia] Sistema de grillas y márgenes basados en una escala matemática de 8px.
* **`--spacing-xs`**: 4px
* **`--spacing-sm`**: 8px - Espacio mínimo entre elementos de texto.
* **`--spacing-md`**: 16px - Padding interno estándar.
* **`--spacing-lg`**: 24px - Separación general en el catálogo de productos.
* **`--spacing-xl`**: 48px - Separación rítmica entre secciones mayores.

## Components

### Buttons
[Inferencia] Formas geométricas tipo "pill" con bordes redondeados al máximo.
* **`.btn-primary`**: Fondo `--color-ink`, texto `--color-canvas`, `border-radius: 30px`, padding `12px 24px`. Para el botón pagar o el botón de agregar al carrito.[cite: 1]
* **`.btn-secondary`**: Fondo `--color-surface`, texto `--color-ink`, `border-radius: 30px`. Para la opción de eliminar el producto del carrito o la opción de eliminar el producto de favoritos.[cite: 1]

### Inputs & Forms
* **`.search-pill`**: `border-radius: 24px` y padding `8px 16px`. [Inferencia] Debe ingresarse el nombre del producto, presionar enter o un botón buscar y deberá cargar los productos que coincidan con esa descripción.[cite: 1]
* **`.payment-select`**: Un select para elegir el tipo de pago (transferencia, débito, crédito).[cite: 1]

### Cards
* **`.product-card`**: Tarjetas con `border-radius: 0px`. [Inferencia] Deberá visualizarse la foto del mismo, una descripción, los talles disponibles, el color, la cantidad de stock disponible, el precio y un botón de agregar al carrito.[cite: 1]
* **`.cart-row`**: Fila horizontal que deberá mostrar los productos agregados al carrito, con una foto del mismo, el nombre, el precio y el total del carrito.[cite: 1]

### Navigation
* **`.global-header`**: El header debe ser visible en todo momento.[cite: 1] Debe contar con un buscador de productos por nombre, una opción de favoritos, un desplegable de productos por categorías.[cite: 1] Además en el lado derecho deberá tener un botón para iniciar sesión/cerrar sesión, un botón para ir al carrito, un botón para ir a los datos del usuario.[cite: 1]
* **`.global-footer`**: Debe contar con un footer que tenga información de la empresa como ser datos de contactos (email, whatsapp, teléfono, etc), redes sociales y especificar que fue desarrollada por los integrantes del grupo.[cite: 1]

## Do's and Don'ts
* La web deberá contar con un modo claro y un modo oscuro, el usuario podrá alternar cada vez que lo desee entre esas dos configuraciones.[cite: 1]
* El botón pagar solo se habilitará si están todos los datos completos.[cite: 1]
* Si el producto no tiene unidades disponibles deberá visualizarse esta situación de alguna manera y no permitir agregar al carrito el producto.[cite: 1]
* La página deberá estar conectada con un backend proporcionado por la cátedra, no se permite modificar ningún archivo del backend.[cite: 1]
* Los estilos y diseño de la página web quedan a consideración de cada grupo, solo deben respetar lo descrito en las especificaciones.[cite: 1]