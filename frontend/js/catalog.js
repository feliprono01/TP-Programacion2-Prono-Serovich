/* ============================================================
   LANA & LINO — catalog.js
   Catálogo con filter drawer lateral
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
  const clearSearchBtn = document.getElementById('clear-search-btn');
  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => window.handleSearch(''));
  }

  // Leer parámetros de URL (si vienen de otra página)
  const params   = new URLSearchParams(window.location.search);
  const qParam   = params.get('q');
  const catParam = params.get('cat');

  if (qParam) {
    const input = document.getElementById('search-input');
    if (input) input.value = qParam;
  }

  loadProducts(qParam, catParam);
  initFilterDrawer();
});

/* ─────────────────────────────────────
   Estado de filtros
───────────────────────────────────── */
let allProducts    = [];
let activeFilters  = { generos: [], colores: [], categoria: 'all', q: '' };
let userFavorites  = [];
let productColorMap = {}; // idProducto (string) → Set<color>

/* ─────────────────────────────────────
   Carga de productos
───────────────────────────────────── */
async function loadProducts(initialQ = null, initialCat = null) {
  const grid   = document.getElementById('product-grid');
  const loader = document.getElementById('catalog-loader');
  const empty  = document.getElementById('empty-state');

  try {
    const res  = await window.Api.obtenerProductos();
    allProducts = res.payload || [];

    if (window.Auth.isLoggedIn()) {
      try {
        const favsRes = await window.Api.obtenerFavoritos(window.Auth.getUserId());
        if (favsRes && favsRes.payload) {
          userFavorites = favsRes.payload.map(f => String(f.id_producto || f.idProducto || f.id));
        }
      } catch (e) { /* silencioso */ }
    }

    // Cargar colores desde el detalle de cada producto en paralelo.
    // El endpoint /obtenerProductos no incluye JOIN con inventario (sin color),
    // por lo que se hace un fetch individual por producto para extraer colores únicos.
    await loadColorOptions(allProducts);

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

/**
 * Hace fetch del detalle de cada producto en paralelo para extraer los colores
 * del inventario (ya que /obtenerProductos no incluye JOIN con inventario).
 * Construye productColorMap: idProducto → Set<color>, usado en renderGrid.
 */
async function loadColorOptions(productos) {
  const ids = [...new Set(productos.map(p => p.idProducto).filter(Boolean))];

  const results = await Promise.allSettled(
    ids.map(id => window.Api.obtenerDatosProducto(id).then(res => ({ id, res })))
  );

  const coloresSet = new Set();
  productColorMap  = {};

  results.forEach(r => {
    if (r.status === 'fulfilled' && r.value?.res?.payload) {
      const idStr = String(r.value.id);
      productColorMap[idStr] = new Set();
      r.value.res.payload.forEach(item => {
        if (item.color) {
          const color = item.color.trim();
          coloresSet.add(color);
          productColorMap[idStr].add(color);
        }
      });
    }
  });

  buildColorFilterOptions([...coloresSet].sort());
}


/* ─────────────────────────────────────
   Renderizado del grid
───────────────────────────────────── */
function renderGrid() {
  const grid    = document.getElementById('product-grid');
  const empty   = document.getElementById('empty-state');
  const count   = document.getElementById('catalog-count');
  const heading = document.getElementById('catalog-heading');
  if (!grid) return;

  let filtered = allProducts.filter(p => {
    const matchQ     = !activeFilters.q || p.producto.toLowerCase().includes(activeFilters.q.toLowerCase());
    const matchGen   = activeFilters.generos.length === 0 || activeFilters.generos.includes(p.genero);
    const matchCat   = activeFilters.categoria === 'all' || String(p.idCategoria) === String(activeFilters.categoria);
    const prodColors = productColorMap[String(p.idProducto)];
    const matchColor  = activeFilters.colores.length === 0 ||
      (prodColors && activeFilters.colores.some(c => prodColors.has(c)));
    return matchQ && matchGen && matchCat && matchColor;
  });

  // Heading dinámico
  if (activeFilters.q) {
    if (heading) heading.innerHTML = `
      Resultados para &ldquo;${activeFilters.q}&rdquo;
      <button class="search-clear-btn" id="search-clear-btn"
              aria-label="Limpiar búsqueda" title="Limpiar búsqueda">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>`;
    // Evento del botón × (se inyecta cada vez que se renderiza)
    const clearBtn = document.getElementById('search-clear-btn');
    if (clearBtn) clearBtn.addEventListener('click', () => window.handleSearch(''));
  } else if (activeFilters.categoria !== 'all') {
    const cat = allProducts.find(p => String(p.idCategoria) === String(activeFilters.categoria));
    if (heading) heading.textContent = cat ? cat.categoria : 'Categoría';
  } else {
    if (heading) heading.textContent = 'Todos los productos';
  }
  if (count) count.textContent = `${filtered.length} producto${filtered.length !== 1 ? 's' : ''}`;

  // Estado vacío
  if (filtered.length === 0) {
    grid.innerHTML = '';
    if (empty) {
      empty.classList.remove('hidden');
      const msg = document.getElementById('empty-state-msg');
      if (msg) msg.textContent = activeFilters.q
        ? `No encontramos productos para "${activeFilters.q}".`
        : 'No hay productos con los filtros seleccionados.';
    }
    return;
  }

  if (empty) empty.classList.add('hidden');
  grid.innerHTML = filtered.map(p => renderProductCard(p)).join('');

  // Eventos en tarjetas
  grid.querySelectorAll('.product-card[data-id]').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.closest('.product-card__fav-btn')) return;
      window.location.href = `producto.html?id=${card.dataset.id}`;
    });
  });

  grid.querySelectorAll('.product-card__fav-btn').forEach(btn => {
    btn.addEventListener('click', async e => {
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
          btn.setAttribute('aria-label', "Agregar a favoritos");
          btn.setAttribute('title', "Agregar a favoritos");
          userFavorites = userFavorites.filter(id => id !== String(idProducto));
          window.App.showToast('Eliminado de favoritos');
        } else {
          await window.Api.agregarFavorito(idProducto, idUsuario);
          btn.classList.add('active');
          btn.innerHTML = window.App.SVG.heart(true);
          btn.setAttribute('aria-label', "Eliminar de favoritos");
          btn.setAttribute('title', "Eliminar de favoritos");
          if (!userFavorites.includes(String(idProducto))) userFavorites.push(String(idProducto));
          window.App.showToast('Agregado a favoritos', 'success');
        }
      } catch {
        window.App.showToast('Error al actualizar favoritos', 'error');
      }
    });
  });
}

function renderProductCard(p) {
  const precio   = window.App.formatPrice(p.precio);
  const sinStock = p.stock === 0;
  const isLogged = window.Auth.isLoggedIn();
  const isFav    = userFavorites.includes(String(p.idProducto));
  const favClass = isFav ? 'product-card__fav-btn active' : 'product-card__fav-btn';
  const favIcon  = window.App.SVG.heart(isFav);

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
          <button class="${favClass}" data-product-id="${p.idProducto}"
                  aria-label="${isFav ? 'Eliminar de favoritos' : 'Agregar a favoritos'}" 
                  title="${isFav ? 'Eliminar de favoritos' : 'Agregar a favoritos'}">
            ${favIcon}
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
   FILTER DRAWER
───────────────────────────────────── */
function buildColorFilterOptions(colores) {
  const container = document.getElementById('filter-body-color');
  if (!container) return;

  if (colores.length === 0) {
    container.innerHTML = `<p style="padding:8px 0;font-size:13px;color:var(--color-mute);">Sin colores disponibles</p>`;
    return;
  }

  // Wrapper con scroll interno para no ocupar todo el drawer
  container.innerHTML = `<div class="color-scroll-list">${
    colores.map(c => `
      <label class="filter-checkbox-item">
        <input type="checkbox" name="color" value="${c}" id="fcheck-color-${c.replace(/[\s/]/g,'-')}">
        ${c}
      </label>`
    ).join('')
  }</div>`;
}

function initFilterDrawer() {
  const toggleBtn  = document.getElementById('filter-toggle-btn');
  const drawer     = document.getElementById('filter-drawer');
  const backdrop   = document.getElementById('filter-backdrop');
  const closeBtn   = document.getElementById('filter-drawer-close');
  const applyBtn   = document.getElementById('filter-apply-btn');
  const clearBtn   = document.getElementById('filter-clear-btn');
  const resultCount= document.getElementById('filter-result-count');
  const activeDot  = document.getElementById('filter-active-dot');

  if (!toggleBtn || !drawer || !backdrop) return;

  // Abrir
  toggleBtn.addEventListener('click', () => openDrawer());

  // Cerrar con X
  if (closeBtn) closeBtn.addEventListener('click', () => closeDrawer());

  // Cerrar con backdrop
  backdrop.addEventListener('click', () => closeDrawer());

  // Escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && drawer.classList.contains('open')) closeDrawer();
  });

  // Aplicar filtros
  if (applyBtn) applyBtn.addEventListener('click', () => {
    applyDrawerFilters();
    closeDrawer();
  });

  // Limpiar filtros
  if (clearBtn) clearBtn.addEventListener('click', () => {
    clearDrawerFilters();
    updateResultCount();
  });

  // Secciones colapsables
  document.querySelectorAll('.filter-section-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const section = btn.dataset.section;
      const body    = document.getElementById(`filter-body-${section}`);
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!expanded));
      body.classList.toggle('collapsed', expanded);
    });
  });

  // Actualizar contador en tiempo real al cambiar checkboxes
  drawer.addEventListener('change', () => updateResultCount());

  function openDrawer() {
    backdrop.classList.remove('hidden');
    requestAnimationFrame(() => {
      backdrop.classList.add('open');
      drawer.classList.remove('hidden');
      drawer.classList.add('open');
    });
    toggleBtn.setAttribute('aria-expanded', 'true');
    updateResultCount();
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    backdrop.classList.remove('open');
    drawer.classList.remove('open');
    toggleBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    setTimeout(() => {
      backdrop.classList.add('hidden');
    }, 250);
  }

  function applyDrawerFilters() {
    const generoChecks = [...document.querySelectorAll('input[name="genero"]:checked')].map(i => i.value);
    const colorChecks  = [...document.querySelectorAll('input[name="color"]:checked')].map(i => i.value);

    activeFilters.generos = generoChecks;
    activeFilters.colores = colorChecks;

    renderGrid();
    updateActiveDot();
  }

  function clearDrawerFilters() {
    document.querySelectorAll('input[name="genero"], input[name="color"]').forEach(i => i.checked = false);
    activeFilters.generos = [];
    activeFilters.colores = [];
    renderGrid();
    updateActiveDot();
  }

  function updateResultCount() {
    // Calcula cuántos productos coincidirían con los filtros seleccionados en el drawer
    const generoChecks = [...document.querySelectorAll('input[name="genero"]:checked')].map(i => i.value);
    const colorChecks  = [...document.querySelectorAll('input[name="color"]:checked')].map(i => i.value);

    const count = allProducts.filter(p => {
      const matchQ      = !activeFilters.q || p.producto.toLowerCase().includes(activeFilters.q.toLowerCase());
      const matchGen    = generoChecks.length === 0 || generoChecks.includes(p.genero);
      const matchCat    = activeFilters.categoria === 'all' || String(p.idCategoria) === String(activeFilters.categoria);
      const prodColors  = productColorMap[String(p.idProducto)];
      const matchColor  = colorChecks.length === 0 || (prodColors && colorChecks.some(c => prodColors.has(c)));
      return matchQ && matchGen && matchCat && matchColor;
    }).length;

    if (resultCount) resultCount.textContent = `${count} producto${count !== 1 ? 's' : ''}`;
    if (applyBtn) applyBtn.textContent = `Mostrar ${count} producto${count !== 1 ? 's' : ''}`;
  }

  function updateActiveDot() {
    const hasFilters = activeFilters.generos.length > 0 || activeFilters.colores.length > 0;
    if (activeDot) activeDot.classList.toggle('hidden', !hasFilters);
  }
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
