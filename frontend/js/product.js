/* ============================================================
   LANA & LINO — Product.js
   Lógica de la página de detalle de producto
   ============================================================ */

/* ── Estado global de la página ── */
let productoData   = null;  // array con todos los registros del backend
let inventario     = [];    // registros agrupados y procesados
let selectedTalle  = null;  // { talle, idInventario, stock, color }
let selectedCuotas = 1;
let isFav          = false;
let productId      = null;

/* ─── Colores CSS aproximados para los swatches ─── */
const COLOR_MAP = {
  negro: '#111111', blanco: '#ffffff', gris: '#9e9e9e', rojo: '#d32f2f',
  azul: '#1565c0', celeste: '#039be5', verde: '#2e7d32', amarillo: '#f9a825',
  naranja: '#e65100', rosa: '#e91e63', violeta: '#6a1b9a', beige: '#d7ccc8',
  marron: '#4e342e', marrón: '#4e342e', marino: '#1a237e', bordo: '#880e4f',
  crema: '#fff8e1', nude: '#f5e0c8',
};

function colorToCss(colorName) {
  if (!colorName) return '#ccc';
  const key = colorName.toLowerCase().trim();
  return COLOR_MAP[key] || '#ccc';
}

/* ═══════════════════════════════════════════
   INICIALIZACIÓN
═══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  productId = params.get('id');

  if (!productId) {
    showError();
    return;
  }

  try {
    // obtenerDatosProducto no requiere token (confirmado en el controller)
    const res = await window.Api.obtenerDatosProducto(productId);

    if (!res.payload || res.payload.length === 0) {
      showError();
      return;
    }

    productoData = res.payload;
    renderProduct();

  } catch (err) {
    console.error(err);
    showError();
  }
});

/* ═══════════════════════════════════════════
   RENDER PRINCIPAL
═══════════════════════════════════════════ */
function renderProduct() {
  const p = productoData[0]; // Datos del producto (comunes en todas las filas)

  // Actualizar título de la página y breadcrumb
  document.title = `${p.producto} — Lana & Lino`;
  document.getElementById('breadcrumb-categoria').textContent = p.categoria || 'Productos';
  document.getElementById('breadcrumb-nombre').textContent    = p.producto;

  // Meta info
  document.getElementById('detail-categoria').textContent = p.categoria || '';
  document.getElementById('detail-genero').textContent    = generoLabel(p.genero);
  document.getElementById('detail-nombre').textContent    = p.producto;
  document.getElementById('detail-descripcion').textContent = p.descripcion;
  document.getElementById('detail-precio').textContent    = window.App.formatPrice(p.precio);

  // Imagen
  const imgContainer = document.getElementById('product-image-container');
  if (p.ulrImagen) {
    const img = document.createElement('img');
    img.src   = p.ulrImagen;
    img.alt   = p.producto;
    img.className = 'product-image-main';
    img.onerror = () => {
      imgContainer.innerHTML = `
        <div class="product-image-placeholder">
          <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
        </div>`;
    };
    imgContainer.appendChild(img);
  } else {
    imgContainer.innerHTML = `
      <div class="product-image-placeholder">
        <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
      </div>`;
  }

  // Procesar inventario: agrupar por talle + color
  inventario = productoData.map(row => ({
    talle      : row.talle,
    color      : row.color,
    stock      : Number(row.stock),
    idInventario: row.idInventario,
  }));

  // Verificar si TODO el producto está sin stock
  const totalStock = inventario.reduce((s, i) => s + i.stock, 0);
  if (totalStock === 0) {
    document.getElementById('detail-out-label').classList.remove('hidden');
  }

  // Colores únicos
  renderColors();

  // Talles
  renderTalles();

  // Cuotas
  initCuotas(p.precio);

  // Botón favorito (solo si está logueado)
  initFavButton();

  // Si no está logueado → mostrar hint
  if (!window.Auth.isLoggedIn()) {
    document.getElementById('login-hint').classList.remove('hidden');
  }

  // Mostrar contenido
  document.getElementById('product-loader').classList.add('hidden');
  document.getElementById('product-content').classList.remove('hidden');
}

/* ─── Colores ─── */
function renderColors() {
  const coloresUnicos = [...new Map(inventario.map(i => [i.color, i])).values()];
  const container = document.getElementById('color-options');

  if (coloresUnicos.length === 0) {
    document.getElementById('color-section').style.display = 'none';
    return;
  }

  if (coloresUnicos.length === 1) {
    // Un solo color: mostrarlo como info, no como selector
    const c = coloresUnicos[0];
    container.innerHTML = `
      <div class="color-display">
        <span class="color-swatch" style="background-color:${colorToCss(c.color)};" title="${c.color}"></span>
        <span>${c.color}</span>
      </div>`;
    return;
  }

  // Múltiples colores: chips seleccionables
  container.innerHTML = coloresUnicos.map(c => `
    <button class="talle-chip" data-color="${c.color}" aria-label="Color ${c.color}"
            style="display:flex;align-items:center;gap:6px;">
      <span class="color-swatch" style="background-color:${colorToCss(c.color)};width:14px;height:14px;" aria-hidden="true"></span>
      ${c.color}
    </button>
  `).join('');

  container.querySelectorAll('.talle-chip[data-color]').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.talle-chip[data-color]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderTalles(btn.dataset.color);
    });
  });
}

/* ─── Talles ─── */
function renderTalles(colorFilter = null) {
  const container = document.getElementById('talle-options');
  const infoEl    = document.getElementById('talle-info');

  // Filtrar por color si hay múltiples
  const items = colorFilter
    ? inventario.filter(i => i.color === colorFilter)
    : inventario;

  // Ordenar talles
  const talleOrder = ['XS','S','M','L','XL','XXL','XXXL'];
  items.sort((a, b) => {
    const ai = talleOrder.indexOf(a.talle.toUpperCase());
    const bi = talleOrder.indexOf(b.talle.toUpperCase());
    if (ai >= 0 && bi >= 0) return ai - bi;
    return a.talle.localeCompare(b.talle);
  });

  container.innerHTML = items.map(item => {
    const sinStock = item.stock === 0;
    return `
      <button class="talle-chip ${sinStock ? 'disabled' : ''}"
              data-inventario="${item.idInventario}"
              data-talle="${item.talle}"
              data-stock="${item.stock}"
              data-color="${item.color}"
              ${sinStock ? 'aria-disabled="true"' : ''}
              aria-label="Talle ${item.talle}${sinStock ? ' (sin stock)' : ''}">
        ${item.talle}
      </button>`;
  }).join('');

  // Reset selección de talle
  selectedTalle = null;
  infoEl.textContent = 'Seleccioná un talle para ver el stock disponible.';
  updateCartButton();

  // Eventos
  container.querySelectorAll('.talle-chip:not(.disabled)').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.talle-chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      selectedTalle = {
        talle       : btn.dataset.talle,
        idInventario: parseInt(btn.dataset.inventario),
        stock       : parseInt(btn.dataset.stock),
        color       : btn.dataset.color,
      };

      // Mostrar stock
      const stock = selectedTalle.stock;
      if (stock === 0) {
        infoEl.innerHTML = `<span class="stock-indicator stock-none"><span class="stock-dot"></span>Sin stock</span>`;
      } else if (stock <= 5) {
        infoEl.innerHTML = `<span class="stock-indicator stock-low"><span class="stock-dot"></span>Últimas ${stock} unidades</span>`;
      } else {
        infoEl.innerHTML = `<span class="stock-indicator stock-ok"><span class="stock-dot"></span>${stock} unidades disponibles</span>`;
      }

      updateCartButton();
    });
  });
}

/* ─── Cuotas ─── */
function initCuotas(precio) {
  const resultEl = document.getElementById('cuotas-result');

  // Renderizar 1 cuota inicial
  updateCuotasResult(precio, 1, resultEl);

  document.querySelectorAll('.cuota-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.cuota-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      selectedCuotas = parseInt(chip.dataset.cuotas);
      updateCuotasResult(precio, selectedCuotas, resultEl);
    });
  });
}

function updateCuotasResult(precio, cuotas, el) {
  const precioCuota = window.App.calcCuota(precio, cuotas);
  const recargos = { 1: 0, 3: 0, 6: 10, 9: 18, 12: 25 };
  const recargo  = recargos[cuotas] || 0;

  if (cuotas === 1) {
    el.innerHTML = `<strong>${window.App.formatPrice(precio)}</strong> al contado — Sin interés`;
  } else if (recargo === 0) {
    el.innerHTML = `<strong>${cuotas}x ${window.App.formatPrice(precioCuota)}</strong> — Sin interés`;
  } else {
    const total = precioCuota * cuotas;
    el.innerHTML = `<strong>${cuotas}x ${window.App.formatPrice(precioCuota)}</strong> — Total: ${window.App.formatPrice(total)} (+${recargo}% interés)`;
  }
}

/* ─── Botón Carrito ─── */
function updateCartButton() {
  const btn = document.getElementById('btn-add-cart');
  const isLogged = window.Auth.isLoggedIn();

  if (!isLogged) {
    btn.disabled = true;
    btn.textContent = 'Iniciá sesión para comprar';
    return;
  }

  if (!selectedTalle) {
    btn.disabled = true;
    btn.textContent = 'Seleccioná un talle';
    return;
  }

  if (selectedTalle.stock === 0) {
    btn.disabled = true;
    btn.textContent = 'Sin stock en este talle';
    return;
  }

  btn.disabled = false;
  btn.textContent = 'Agregar al carrito';

  // Listener (solo registrar una vez)
  if (!btn._listenerSet) {
    btn._listenerSet = true;
    btn.addEventListener('click', handleAddToCart);
  }
}

async function handleAddToCart() {
  const btn = document.getElementById('btn-add-cart');
  if (!selectedTalle) return;

  const idInventario = selectedTalle.idInventario;
  const idUsuario    = window.Auth.getUserId();

  btn.disabled = true;
  btn.textContent = 'Agregando…';

  try {
    const res = await window.Api.agregarACarrito(idInventario, idUsuario);
    if (res.codigo === 200) {
      window.App.showToast('Producto agregado al carrito', 'success');
      btn.textContent = '✓ Agregado';
      setTimeout(() => {
        btn.disabled = false;
        btn.textContent = 'Agregar al carrito';
      }, 2000);
    } else {
      window.App.showToast(res.mensaje || 'Error al agregar al carrito', 'error');
      btn.disabled = false;
      btn.textContent = 'Agregar al carrito';
    }
  } catch (err) {
    window.App.showToast('Error de conexión', 'error');
    btn.disabled = false;
    btn.textContent = 'Agregar al carrito';
  }
}

/* ─── Botón Favorito ─── */
async function initFavButton() {
  const btn = document.getElementById('btn-fav');
  if (!window.Auth.isLoggedIn()) return;

  btn.classList.remove('hidden');
  btn.innerHTML = `${window.App.SVG.heart(false)} Guardar en favoritos`;

  // Verificar si ya está en favoritos
  try {
    const idUsuario = window.Auth.getUserId();
    const res = await window.Api.obtenerFavoritos(idUsuario);
    const favs = res.payload || [];
    isFav = favs.some(f => String(f.idProducto) === String(productId));
    updateFavButton();
  } catch (e) { /* silencioso */ }

  btn.addEventListener('click', handleToggleFav);
}

function updateFavButton() {
  const btn = document.getElementById('btn-fav');
  if (isFav) {
    btn.innerHTML = `${window.App.SVG.heart(true)} Guardado en favoritos`;
    btn.classList.add('active');
  } else {
    btn.innerHTML = `${window.App.SVG.heart(false)} Guardar en favoritos`;
    btn.classList.remove('active');
  }
}

async function handleToggleFav() {
  const btn = document.getElementById('btn-fav');
  const idProducto = parseInt(productId);
  const idUsuario  = window.Auth.getUserId();

  btn.disabled = true;

  try {
    if (isFav) {
      await window.Api.eliminarFavorito(idUsuario, idProducto);
      isFav = false;
      window.App.showToast('Eliminado de favoritos');
    } else {
      await window.Api.agregarFavorito(idProducto, idUsuario);
      isFav = true;
      window.App.showToast('Guardado en favoritos', 'success');
    }
    updateFavButton();
  } catch (err) {
    window.App.showToast('Error al actualizar favoritos', 'error');
  } finally {
    btn.disabled = false;
  }
}

/* ─── Error state ─── */
function showError() {
  document.getElementById('product-loader').classList.add('hidden');
  document.getElementById('product-error').classList.remove('hidden');
}

/* ─── Helper: label de género ─── */
function generoLabel(g) {
  const map = { M: 'Hombre', F: 'Mujer', U: 'Unisex', m: 'Hombre', f: 'Mujer', u: 'Unisex' };
  return map[g] || g || '';
}
