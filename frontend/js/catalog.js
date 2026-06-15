/* ============================================================
   LANA & LINO — Catalog.js (Etapa 1: estructura base)
   La lógica completa de carga/filtros se completa en Etapa 2.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  // CTA del hero → scroll al catálogo
  const heroCta = document.getElementById('hero-cta');
  if (heroCta) {
    heroCta.addEventListener('click', () => {
      document.getElementById('catalog-section').scrollIntoView({ behavior: 'smooth' });
    });
  }

  // Botón "Ver todos" en empty state
  const clearBtn = document.getElementById('clear-search-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      window.handleSearch('');
    });
  }

  // Leer parámetros de URL (si vienen de otra página)
  const params = new URLSearchParams(window.location.search);
  const qParam   = params.get('q');
  const catParam = params.get('cat');

  // Rellenar buscador con el término si viene en URL
  if (qParam) {
    const input = document.getElementById('search-input');
    if (input) input.value = qParam;
  }

  // Iniciar carga de productos
  loadProducts(qParam, catParam);
});

/* ─────────────────────────────────────
   Estado de filtros activo
───────────────────────────────────── */
let allProducts = [];
let activeFilters = { genero: 'all', color: 'all', categoria: 'all', q: '' };

/* ─────────────────────────────────────
   Carga y renderizado
───────────────────────────────────── */
async function loadProducts(initialQ = null, initialCat = null) {
  const grid    = document.getElementById('product-grid');
  const loader  = document.getElementById('catalog-loader');
  const empty   = document.getElementById('empty-state');

  try {
    const res = await window.Api.obtenerProductos();
    allProducts = res.payload || [];

    // Inicializar filtros de color con los colores únicos del catálogo
    buildColorFilters(allProducts);
    bindFilterEvents();

    // Aplicar filtros iniciales si vienen por URL
    if (initialQ)   activeFilters.q         = initialQ;
    if (initialCat) activeFilters.categoria  = initialCat;

    renderGrid();

  } catch (err) {
    console.error('Error al cargar productos:', err);
    if (loader) loader.remove();
    if (grid) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <p class="empty-state__title">Error de conexión</p>
          <p class="empty-state__subtitle">No se pudo conectar con el servidor. Asegurate de que el backend esté corriendo en el puerto 4000.</p>
          <button class="btn btn-ghost" onclick="location.reload()">Reintentar</button>
        </div>`;
    }
  }
}

function renderGrid() {
  const grid   = document.getElementById('product-grid');
  const empty  = document.getElementById('empty-state');
  const count  = document.getElementById('catalog-count');
  const heading = document.getElementById('catalog-heading');
  if (!grid) return;

  // Filtrar
  let filtered = allProducts.filter(p => {
    const matchQ    = !activeFilters.q || p.producto.toLowerCase().includes(activeFilters.q.toLowerCase());
    const matchGen  = activeFilters.genero === 'all' || p.genero === activeFilters.genero;
    const matchCat  = activeFilters.categoria === 'all' || String(p.idCategoria) === String(activeFilters.categoria);
    const matchColor= activeFilters.color === 'all' || (p.color && p.color.toLowerCase() === activeFilters.color.toLowerCase());
    return matchQ && matchGen && matchCat && matchColor;
  });

  // Actualizar heading y contador
  if (activeFilters.q) {
    if (heading) heading.textContent = `Resultados para "${activeFilters.q}"`;
  } else if (activeFilters.categoria !== 'all') {
    const cat = allProducts.find(p => String(p.idCategoria) === String(activeFilters.categoria));
    if (heading) heading.textContent = cat ? cat.categoria : 'Categoría';
  } else {
    if (heading) heading.textContent = 'Todos los productos';
  }
  if (count) count.textContent = `${filtered.length} producto${filtered.length !== 1 ? 's' : ''}`;

  // Vacío
  if (filtered.length === 0) {
    grid.innerHTML = '';
    if (empty) {
      empty.classList.remove('hidden');
      const msg = document.getElementById('empty-state-msg');
      if (msg) msg.textContent = activeFilters.q
        ? `No encontramos productos para "${activeFilters.q}".`
        : 'No hay productos en esta categoría con los filtros seleccionados.';
    }
    return;
  }

  if (empty) empty.classList.add('hidden');

  // Renderizar tarjetas
  grid.innerHTML = filtered.map(p => renderProductCard(p)).join('');

  // Eventos en tarjetas
  grid.querySelectorAll('.product-card[data-id]').forEach(card => {
    card.addEventListener('click', (e) => {
      // No navegar si hicieron clic en el botón de favorito
      if (e.target.closest('.product-card__fav-btn')) return;
      window.location.href = `producto.html?id=${card.dataset.id}`;
    });
  });

  // Eventos del botón de favorito en tarjeta
  grid.querySelectorAll('.product-card__fav-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!window.Auth.isLoggedIn()) {
        window.App.showToast('Iniciá sesión para guardar favoritos', 'info');
        return;
      }
      const idProducto = btn.dataset.productId;
      const idUsuario  = window.Auth.getUserId();
      const isActive   = btn.classList.contains('active');

      try {
        if (isActive) {
          await window.Api.eliminarFavorito(idUsuario, idProducto);
          btn.classList.remove('active');
          btn.innerHTML = window.App.SVG.heart(false);
          window.App.showToast('Eliminado de favoritos');
        } else {
          await window.Api.agregarFavorito(idProducto, idUsuario);
          btn.classList.add('active');
          btn.innerHTML = window.App.SVG.heart(true);
          window.App.showToast('Agregado a favoritos', 'success');
        }
      } catch (err) {
        window.App.showToast('Error al actualizar favoritos', 'error');
      }
    });
  });
}

function renderProductCard(p) {
  const precio = window.App.formatPrice(p.precio);
  const sinStock = p.stock === 0;
  const isLogged = window.Auth.isLoggedIn();

  return `
    <article class="product-card" data-id="${p.idProducto}" role="listitem" tabindex="0"
             aria-label="${p.producto} — ${precio}"
             onkeydown="if(event.key==='Enter')window.location.href='producto.html?id=${p.idProducto}'">
      <div class="product-card__image-wrap">
        ${p.ulrImagen
          ? `<img src="${p.ulrImagen}" alt="${p.producto}" loading="lazy" onerror="this.parentNode.innerHTML=window.App.imgPlaceholder()">`
          : window.App.imgPlaceholder()
        }
        ${sinStock ? `<span class="product-card__out-badge" aria-label="Sin stock">Sin stock</span>` : ''}
        ${isLogged ? `
          <button class="product-card__fav-btn" data-product-id="${p.idProducto}"
                  aria-label="Agregar a favoritos" title="Agregar a favoritos">
            ${window.App.SVG.heart(false)}
          </button>` : ''}
      </div>
      <div class="product-card__body">
        <span class="product-card__category">${p.categoria || ''}</span>
        <p class="product-card__name">${p.producto}</p>
        <p class="product-card__price">${precio}</p>
        ${sinStock ? `<p class="product-card__out-of-stock" aria-live="polite">Sin unidades disponibles</p>` : ''}
      </div>
    </article>`;
}

/* ─────────────────────────────────────
   Filtros
───────────────────────────────────── */
function buildColorFilters(productos) {
  const colorContainer = document.getElementById('color-filters');
  if (!colorContainer) return;

  const colores = [...new Set(
    productos.flatMap(p => p.color ? [p.color] : []).filter(Boolean)
  )].sort();

  colorContainer.innerHTML = colores.map(c =>
    `<button class="filter-chip" data-filter="color" data-value="${c}">${c}</button>`
  ).join('');
}

function bindFilterEvents() {
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const filterType = chip.dataset.filter;
      const value      = chip.dataset.value;

      // Actualizar estado activo visual
      document.querySelectorAll(`.filter-chip[data-filter="${filterType}"]`)
        .forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      // Aplicar filtro
      activeFilters[filterType] = value;
      renderGrid();
    });
  });
}

/* ─────────────────────────────────────
   Funciones globales (llamadas desde app.js)
───────────────────────────────────── */
window.handleSearch = function(query) {
  activeFilters.q = query || '';
  const input = document.getElementById('search-input');
  if (input) input.value = query || '';
  renderGrid();
};

window.handleCategoryFilter = function(catId) {
  activeFilters.categoria = catId || 'all';
  renderGrid();
};
