/* ============================================================
   LANA & LINO — App.js
   Lógica global: Header dinámico, Modo Oscuro, Toast, Utilidades
   ============================================================ */

/* ════════════════════════════════════════
   MODO OSCURO / CLARO
   ════════════════════════════════════════ */
const THEME_KEY = 'll_theme';

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY) || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeIcon(saved);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem(THEME_KEY, next);
  updateThemeIcon(next);
}

function updateThemeIcon(theme) {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  // Moon = dark mode activo, Sun = light mode activo
  btn.innerHTML = theme === 'dark' ? SVG.sun() : SVG.moon();
  btn.title = theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
}

/* ════════════════════════════════════════
   SVG ICONS
   ════════════════════════════════════════ */
const SVG = {
  moon: () => `<svg viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
  sun: () => `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`,
  search: () => `<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  heart: (filled = false) => filled
    ? `<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`
    : `<svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
  cart: () => `<svg viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>`,
  user: () => `<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  settings: () => `<svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
  chevronDown: () => `<svg viewBox="0 0 24 24" class="chevron"><polyline points="6 9 12 15 18 9"/></svg>`,
  x: () => `<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  package: () => `<svg viewBox="0 0 24 24"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
  image: () => `<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
};

/* ════════════════════════════════════════
   HEADER DINÁMICO
   ════════════════════════════════════════ */

/**
 * Inyecta el header en el elemento con id="header-mount"
 * Adapta los botones según el estado de sesión.
 */
function renderHeader() {
  const mount = document.getElementById('header-mount');
  if (!mount) return; // Páginas sin header (ej: login.html)

  const isLogged = window.Auth.isLoggedIn();
  const isAdmin  = window.Auth.isAdmin();
  const pagePath = window.location.pathname;

  mount.innerHTML = `
    <header class="global-header" id="global-header">
      <div class="header-inner">

        <!-- Izquierda: Categorías + Buscador -->
        <div class="header-left">
          <div class="dropdown" id="categories-dropdown">
            <button class="dropdown-trigger" id="categories-trigger" aria-label="Categorías">
              Categorías ${SVG.chevronDown()}
            </button>
            <div class="dropdown-menu" id="categories-menu" role="menu">
              <button class="dropdown-item" data-category="all" role="menuitem">Todos los productos</button>
              <div class="dropdown-divider"></div>
              <div id="categories-list">
                <div style="padding: var(--spacing-sm) var(--spacing-md); color: var(--color-mute); font-size: 13px;">
                  Cargando…
                </div>
              </div>
            </div>
          </div>

          <div class="search-wrapper" id="search-wrapper">
            <input
              class="search-input"
              id="search-input"
              type="search"
              placeholder="Buscar producto..."
              autocomplete="off"
              aria-label="Buscar producto"
            />
            <button class="search-icon-btn" id="search-btn" aria-label="Buscar" title="Buscar">
              ${SVG.search()}
            </button>
          </div>
        </div>

        <!-- Centro: Marca -->
        <div class="header-center">
          <a href="index.html" class="brand-name" aria-label="Lana &amp; Lino — Inicio">
            Lana &amp; Lino
          </a>
        </div>

        <!-- Derecha: Tema + Separador + Favoritos + Perfil + Carrito + Auth + Admin -->
        <div class="header-right">
          <button class="icon-btn" id="theme-toggle" aria-label="Cambiar tema">
            ${SVG.moon()}
          </button>

          <div class="header-sep"></div>

          <button class="icon-btn" id="favorites-nav-btn" aria-label="Favoritos" title="Favoritos">
            ${SVG.heart()}
          </button>

          ${isLogged ? `
            <button class="icon-btn" id="profile-btn" aria-label="Mi perfil" title="Mi perfil">
              ${SVG.user()}
            </button>
            <button class="icon-btn" id="cart-nav-btn" aria-label="Carrito" title="Carrito">
              ${SVG.cart()}
              <span class="badge hidden" id="cart-badge">0</span>
            </button>
            ${isAdmin ? `
              <button class="btn btn-secondary btn-sm" id="admin-btn" aria-label="Gestionar productos">
                ${SVG.settings()}
                Gestionar
              </button>
            ` : ''}
            <button class="btn btn-primary btn-sm" id="auth-btn" aria-label="Cerrar sesión">
              Cerrar sesión
            </button>
          ` : `
            <button class="icon-btn" id="cart-nav-btn" aria-label="Carrito" title="Carrito">
              ${SVG.cart()}
            </button>
            <button class="btn btn-primary btn-sm" id="auth-btn" aria-label="Iniciar sesión">
              Iniciar sesión
            </button>
          `}
        </div>

      </div>
    </header>
  `;

  // Eventos post-render
  bindHeaderEvents();
  initCategories();

  // Aplicar tema correcto al ícono
  const saved = localStorage.getItem('ll_theme') || 'light';
  updateThemeIcon(saved);
}

function bindHeaderEvents() {
  // Tema
  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

  // Buscador: Enter, clic en lupa, o vaciado con X
  const searchInput = document.getElementById('search-input');
  const searchBtn   = document.getElementById('search-btn');

  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') doSearch(searchInput.value.trim());
    });
    // Cuando se borra con la X nativa del input[type=search] o se vacía el campo
    searchInput.addEventListener('input', () => {
      if (searchInput.value === '') doSearchReset();
    });
  }
  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      const q = searchInput ? searchInput.value.trim() : '';
      doSearch(q);
    });
  }

  // Dropdown categorías
  const trigger = document.getElementById('categories-trigger');
  const dropdown = document.getElementById('categories-dropdown');
  if (trigger && dropdown) {
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('open');
    });
    document.addEventListener('click', () => dropdown.classList.remove('open'));
  }

  // Favoritos
  const favBtn = document.getElementById('favorites-nav-btn');
  if (favBtn) {
    favBtn.addEventListener('click', () => {
      if (!window.Auth.isLoggedIn()) {
        window.location.href = 'login.html';
      } else {
        window.location.href = 'perfil.html#favoritos';
      }
    });
  }

  // Carrito
  const cartBtn = document.getElementById('cart-nav-btn');
  if (cartBtn) cartBtn.addEventListener('click', () => {
    if (!window.Auth.isLoggedIn()) {
      showToast('Iniciá sesión para ver tu carrito', 'info');
      setTimeout(() => window.location.href = 'login.html', 1200);
    } else {
      window.location.href = 'carrito.html';
    }
  });

  // Perfil
  const profileBtn = document.getElementById('profile-btn');
  if (profileBtn) profileBtn.addEventListener('click', () => {
    window.location.href = 'perfil.html';
  });

  // Admin
  const adminBtn = document.getElementById('admin-btn');
  if (adminBtn) adminBtn.addEventListener('click', () => {
    window.location.href = 'admin.html';
  });

  // Auth (login / logout)
  const authBtn = document.getElementById('auth-btn');
  if (authBtn) {
    authBtn.addEventListener('click', () => {
      if (window.Auth.isLoggedIn()) {
        window.Auth.clear();
        showToast('Sesión cerrada correctamente');
        setTimeout(() => window.location.href = 'index.html', 800);
      } else {
        window.location.href = 'login.html';
      }
    });
  }
}

/* ─ Búsqueda: redirige a index.html con ?q=... ─ */
function doSearch(query) {
  if (!query) return;
  const isOnIndex = window.location.pathname.includes('index.html') ||
                    window.location.pathname.endsWith('/frontend/') ||
                    window.location.pathname.endsWith('/frontend');

  if (isOnIndex && typeof window.handleSearch === 'function') {
    // Si estamos en el catálogo, llamar directamente la función
    window.handleSearch(query);
  } else {
    window.location.href = `index.html?q=${encodeURIComponent(query)}`;
  }
}

/* ─ Reset de búsqueda: vuelve a mostrar todos los productos ─ */
function doSearchReset() {
  const isOnIndex = window.location.pathname.includes('index.html') ||
                    window.location.pathname.endsWith('/frontend/') ||
                    window.location.pathname.endsWith('/frontend');

  if (isOnIndex && typeof window.handleCategoryFilter === 'function') {
    window.handleCategoryFilter('all'); // Mostrar todos los productos
  } else if (!isOnIndex) {
    window.location.href = 'index.html'; // Si está en otra página, volver al catálogo
  }
}

/* ─ Cargar categorías en el dropdown ─ */
async function initCategories() {
  const list = document.getElementById('categories-list');
  if (!list) return;

  // Las categorías las sacamos de los productos (endpoint público),
  // así evitamos necesitar token para usuarios no logueados.
  try {
    const res = await window.Api.obtenerProductos();
    const productos = res.payload || [];

    // Extraer categorías únicas
    const catMap = {};
    productos.forEach(p => {
      if (p.idCategoria && p.categoria) {
        catMap[p.idCategoria] = p.categoria;
      }
    });

    const cats = Object.entries(catMap);

    if (cats.length === 0) {
      list.innerHTML = `<div style="padding: var(--spacing-sm) var(--spacing-md); color: var(--color-mute); font-size: 13px;">Sin categorías</div>`;
      return;
    }

    list.innerHTML = cats.map(([id, nombre]) =>
      `<button class="dropdown-item" data-category="${id}" role="menuitem">${nombre}</button>`
    ).join('');

    // Evento en cada categoría
    list.querySelectorAll('.dropdown-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const catId = btn.dataset.category;
        const dropdown = document.getElementById('categories-dropdown');
        if (dropdown) dropdown.classList.remove('open');

        const isOnIndex = window.location.pathname.includes('index.html') ||
                          window.location.pathname.endsWith('/frontend/') ||
                          window.location.pathname.endsWith('/frontend');
        if (isOnIndex && typeof window.handleCategoryFilter === 'function') {
          window.handleCategoryFilter(catId);
        } else {
          window.location.href = `index.html?cat=${catId}`;
        }
      });
    });

    // Evento "Todos los productos"
    const allBtn = document.querySelector('[data-category="all"]');
    if (allBtn) {
      allBtn.addEventListener('click', () => {
        const dropdown = document.getElementById('categories-dropdown');
        if (dropdown) dropdown.classList.remove('open');
        const isOnIndex = window.location.pathname.includes('index.html') ||
                          window.location.pathname.endsWith('/frontend/') ||
                          window.location.pathname.endsWith('/frontend');
        if (isOnIndex && typeof window.handleCategoryFilter === 'function') {
          window.handleCategoryFilter('all');
        } else {
          window.location.href = 'index.html';
        }
      });
    }

  } catch (err) {
    list.innerHTML = `<div style="padding: var(--spacing-sm) var(--spacing-md); color: var(--color-mute); font-size: 13px;">No disponible</div>`;
  }
}

/* ════════════════════════════════════════
   TOAST NOTIFICATIONS
   ════════════════════════════════════════ */

/**
 * Muestra una notificación temporal
 * @param {string} message
 * @param {'info'|'success'|'error'} type
 * @param {number} duration ms
 */
function showToast(message, type = 'info', duration = 3000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast${type === 'success' ? ' toast-success' : type === 'error' ? ' toast-error' : ''}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(12px)';
    toast.style.transition = 'opacity 300ms, transform 300ms';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/* ════════════════════════════════════════
   UTILIDADES GENERALES
   ════════════════════════════════════════ */

/** Formatea un número como precio en ARS */
function formatPrice(price) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
}

/** Calcula precio por cuota */
function calcCuota(precio, cuotas) {
  const recargos = { 1: 1, 3: 1, 6: 1.10, 9: 1.18, 12: 1.25 };
  const factor = recargos[cuotas] || 1;
  return Math.ceil((precio * factor) / cuotas);
}

/** Genera placeholder SVG como data-URI para imágenes rotas */
function imgPlaceholder() {
  return `<div class="product-card__img-placeholder">${SVG.image()}</div>`;
}

/* ════════════════════════════════════════
   VERIFICACIÓN PERIÓDICA DE SESIÓN
   ════════════════════════════════════════ */

/**
 * Chequea cada 60 segundos si el token sigue siendo válido.
 * Si expiró, expira la sesión y redirige al login.
 */
function startSessionWatcher() {
  setInterval(() => {
    // Si hay sesión guardada pero el token ya expiró → redirigir al login
    if (window.Auth.get() && !window.Auth.isLoggedIn()) {
      window.Auth.expire();
    }
  }, 60_000); // cada 60 segundos
}

/* ════════════════════════════════════════
   INICIALIZACIÓN
   ════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  renderHeader();
  startSessionWatcher();
});

// Exponer globalmente lo que otras páginas necesitan
window.App = {
  showToast,
  formatPrice,
  calcCuota,
  imgPlaceholder,
  SVG,
  renderHeader,
};
