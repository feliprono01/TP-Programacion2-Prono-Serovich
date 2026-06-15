/* ============================================================
   LANA & LINO — Profile.js
   Lógica de la página de perfil: datos del usuario + favoritos
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  // Guard: solo usuarios logueados
  if (!window.Auth.isLoggedIn()) {
    window.location.href = 'login.html?redirect=perfil.html';
    return;
  }

  initProfileTabs();
  loadUserData();

  // Navegar a la sección correcta según el hash
  const hash = window.location.hash;
  if (hash === '#favoritos') {
    switchProfileTab('favoritos');
    loadFavorites();
    favoritesLoaded = true;
  }
});

/* ════════════════════════════════════════
   TABS
   ════════════════════════════════════════ */

let favoritesLoaded = false;

function initProfileTabs() {
  document.querySelectorAll('.profile-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      switchProfileTab(target);
      if (target === 'favoritos' && !favoritesLoaded) {
        loadFavorites();
        favoritesLoaded = true;
      }
    });
  });
}

function switchProfileTab(target) {
  document.querySelectorAll('.profile-tab').forEach(tab => {
    const isActive = tab.dataset.tab === target;
    tab.classList.toggle('active', isActive);
    tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });

  document.getElementById('section-datos').classList.toggle('hidden', target !== 'datos');
  document.getElementById('section-favoritos').classList.toggle('hidden', target !== 'favoritos');

  window.history.replaceState(null, '', target === 'favoritos' ? '#favoritos' : '#datos');
}

/* ════════════════════════════════════════
   DATOS DEL USUARIO
   ════════════════════════════════════════ */

let originalData = {};

async function loadUserData() {
  const userId = window.Auth.getUserId();
  const loader = document.getElementById('datos-loader');
  const layout = document.getElementById('profile-layout');

  try {
    const res = await window.Api.obtenerDatosUsuario(userId);

    if (!res || res.codigo !== 200) {
      loader.classList.add('hidden');
      layout.classList.remove('hidden');
      showProfileMsg('error', 'No se pudieron cargar tus datos. Intentá recargar la página.');
      return;
    }

    const user = Array.isArray(res.payload) ? res.payload[0] : res.payload;

    if (!user) {
      loader.classList.add('hidden');
      layout.classList.remove('hidden');
      showProfileMsg('error', 'No se encontraron datos del usuario.');
      return;
    }

    originalData = {
      nombre:    user.nombre    || '',
      apellido:  user.apellido  || '',
      email:     user.email     || '',
      telefono:  user.telefono  || '',
      direccion: user.direccion || '',
    };

    // Poblar formulario
    document.getElementById('pf-nombre').value    = originalData.nombre;
    document.getElementById('pf-apellido').value  = originalData.apellido;
    document.getElementById('pf-email').value     = originalData.email;
    document.getElementById('pf-telefono').value  = originalData.telefono;
    document.getElementById('pf-direccion').value = originalData.direccion;

    // Actualizar hero y sidebar
    updateHero(originalData);
    updateSidebar(originalData);

    // Mostrar layout
    loader.classList.add('hidden');
    layout.classList.remove('hidden');

    // Eventos
    document.getElementById('profile-form').addEventListener('submit', handleSave);
    document.getElementById('pf-cancel-btn').addEventListener('click', handleDiscard);

    // Limpiar errores inline de contraseña al escribir
    document.getElementById('pf-password-current').addEventListener('input', () => clearFieldError('err-password-current'));
    document.getElementById('pf-password').addEventListener('input', () => clearFieldError('err-password-new'));

  } catch (err) {
    loader.classList.add('hidden');
    layout.classList.remove('hidden');
    showProfileMsg('error', 'Error de conexión. Verificá que el servidor esté activo.');
  }
}

function updateHero(data) {
  const name     = `${data.nombre} ${data.apellido}`.trim();
  const initials = buildInitials(data.nombre, data.apellido);

  const heroName  = document.getElementById('profile-hero-name');
  const heroEmail = document.getElementById('profile-hero-email');
  const avatar    = document.getElementById('profile-avatar');

  if (heroName)  heroName.textContent  = name || 'Mi perfil';
  if (heroEmail) heroEmail.textContent = data.email || '';
  if (avatar)    avatar.textContent    = initials;
}

function updateSidebar(data) {
  const nombre    = `${data.nombre} ${data.apellido}`.trim();
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val || '—';
  };
  setVal('sidebar-nombre',    nombre);
  setVal('sidebar-email',     data.email);
  setVal('sidebar-telefono',  data.telefono);
  setVal('sidebar-direccion', data.direccion);
}

function buildInitials(nombre, apellido) {
  const n = (nombre   || '').trim().charAt(0).toUpperCase();
  const a = (apellido || '').trim().charAt(0).toUpperCase();
  return `${n}${a}` || '?';
}

/* ── Guardar cambios ── */
async function handleSave(e) {
  e.preventDefault();
  clearProfileMsg();

  const nombre    = document.getElementById('pf-nombre').value.trim();
  const apellido  = document.getElementById('pf-apellido').value.trim();
  const email     = document.getElementById('pf-email').value.trim();
  const telefono  = document.getElementById('pf-telefono').value.trim();
  const direccion = document.getElementById('pf-direccion').value.trim();
  const passwordActual = document.getElementById('pf-password-current').value;
  const password       = document.getElementById('pf-password').value;

  if (!nombre || !apellido || !email || !telefono || !direccion) {
    showProfileMsg('error', 'Completá todos los campos obligatorios.');
    return;
  }
  if (!isValidEmail(email)) {
    showProfileMsg('error', 'Ingresá un email válido.');
    return;
  }

  // Si se quiere cambiar la contraseña, ambos campos son obligatorios
  clearFieldError('err-password-current');
  clearFieldError('err-password-new');

  if (password && !passwordActual) {
    showFieldError('err-password-current', 'Ingresá tu contraseña actual para poder cambiarla.');
    document.getElementById('pf-password-current').focus();
    return;
  }
  if (passwordActual && !password) {
    showFieldError('err-password-new', 'Ingresá la nueva contraseña.');
    document.getElementById('pf-password').focus();
    return;
  }
  if (password && (password.length < 6 || password.length > 20)) {
    showFieldError('err-password-new', 'La contraseña debe tener entre 6 y 20 caracteres.');
    document.getElementById('pf-password').focus();
    return;
  }

  const saveBtn = document.getElementById('pf-save-btn');
  setLoadingBtn(saveBtn, true, 'Guardando…');

  try {
    // Si quiere cambiar la contraseña, verificar la actual via login
    if (password && passwordActual) {
      const emailActual = originalData.email || email;
      let loginOk = false;
      try {
        const loginRes = await window.Api.login(emailActual, passwordActual);
        loginOk = loginRes.codigo === 200 && loginRes.payload && loginRes.payload.length > 0;
      } catch (_) {
        loginOk = false;
      }
      if (!loginOk) {
        showFieldError('err-password-current', 'La contraseña actual es incorrecta.');
        document.getElementById('pf-password-current').focus();
        setLoadingBtn(saveBtn, false, 'Guardar cambios');
        return;
      }
    }

    const payload = { nombre, apellido, email, telefono, direccion };
    if (password) payload.password = password;

    const userId = window.Auth.getUserId();
    const res = await window.Api.modificarUsuario(userId, payload);

    if (res.codigo !== 200) {
      showProfileMsg('error', res.mensaje || 'No se pudo guardar los cambios.');
      return;
    }

    originalData = { nombre, apellido, email, telefono, direccion };
    updateHero(originalData);
    updateSidebar(originalData);

    document.getElementById('pf-password-current').value = '';
    document.getElementById('pf-password').value = '';
    showProfileMsg('success', '¡Cambios guardados correctamente!');
    window.App.showToast('Perfil actualizado', 'success');

    const session = window.Auth.get();
    if (session) {
      session.nombre   = nombre;
      session.apellido = apellido;
      window.Auth.save(session);
    }

  } catch (err) {
    showProfileMsg('error', 'Error de conexión. Verificá que el servidor esté activo.');
  } finally {
    setLoadingBtn(saveBtn, false, 'Guardar cambios');
  }
}

/* ── Descartar cambios ── */
function handleDiscard() {
  document.getElementById('pf-nombre').value    = originalData.nombre    || '';
  document.getElementById('pf-apellido').value  = originalData.apellido  || '';
  document.getElementById('pf-email').value     = originalData.email     || '';
  document.getElementById('pf-telefono').value  = originalData.telefono  || '';
  document.getElementById('pf-direccion').value = originalData.direccion || '';
  document.getElementById('pf-password-current').value = '';
  document.getElementById('pf-password').value  = '';
  clearProfileMsg();
  window.App.showToast('Cambios descartados', 'info');
}

/* ════════════════════════════════════════
   FAVORITOS
   ════════════════════════════════════════ */

async function loadFavorites() {
  const userId = window.Auth.getUserId();
  const loader = document.getElementById('favs-loader');
  const grid   = document.getElementById('favs-grid');
  const empty  = document.getElementById('favs-empty');

  loader.classList.remove('hidden');
  grid.classList.add('hidden');
  empty.classList.add('hidden');

  try {
    const res = await window.Api.obtenerFavoritos(userId);
    const favIds = (res && res.payload) ? res.payload : [];

    if (!Array.isArray(favIds) || favIds.length === 0) {
      loader.classList.add('hidden');
      empty.classList.remove('hidden');
      return;
    }

    // Pedir los datos de cada producto favorito individualmente
    const favProducts = [];
    await Promise.all(favIds.map(async (fav) => {
      const idStr = String(fav.id_producto || fav.idProducto || fav.id);
      try {
        const prodRes = await window.Api.obtenerDatosProducto(idStr);
        // Si tiene payload y al menos una fila (tiene inventario), lo mostramos
        if (prodRes && prodRes.payload && prodRes.payload.length > 0) {
          const prodData = prodRes.payload[0];
          // Le inyectamos el ID porque obtenerDatosProducto no lo devuelve
          prodData.idProducto = idStr;
          favProducts.push(prodData);
        }
      } catch (e) {
        // Si falla (ej. borrado o sin inventario), simplemente no se muestra
      }
    }));

    loader.classList.add('hidden');

    if (favProducts.length === 0) {
      empty.classList.remove('hidden');
      return;
    }

    grid.innerHTML = favProducts.map(prod => buildFavCard(prod)).join('');
    grid.classList.remove('hidden');

    bindFavCardEvents();

  } catch (err) {
    loader.classList.add('hidden');
    empty.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <p class="empty-state__title">Error al cargar favoritos</p>
      <p class="empty-state__subtitle">Verificá tu conexión e intentá nuevamente.</p>
      <button class="btn btn-secondary" onclick="loadFavorites()">Reintentar</button>
    `;
    empty.classList.remove('hidden');
  }
}

window.handleFavImgError = function(img) {
  img.outerHTML = `<div class="fav-card__img-placeholder">${buildImgSVG()}</div>`;
};

function buildFavCard(fav) {
  const id        = fav.id_producto   || fav.idProducto || fav.id      || '';
  const nombre    = fav.nombre        || fav.producto   || fav.name     || 'Producto';
  const categoria = fav.categoria     || fav.category || '';
  const precio    = fav.precio        || fav.price    || 0;
  const imagen    = fav.imagen        || fav.ulrImagen || fav.image    || '';
  const stock     = (fav.stock !== undefined) ? fav.stock : 1;
  const hayStock  = stock > 0;

  const imgHTML = imagen
    ? `<img src="${imagen}" alt="${nombre}" loading="lazy" onerror="window.handleFavImgError(this)" />`
    : `<div class="fav-card__img-placeholder">${buildImgSVG()}</div>`;

  return `
    <article class="fav-card" data-product-id="${id}">
      <div class="fav-card__image-wrap" role="button" tabindex="0"
           onclick="window.location.href='producto.html?id=${id}'"
           onkeydown="if(event.key==='Enter') window.location.href='producto.html?id=${id}'"
           aria-label="Ver producto ${nombre}">
        ${imgHTML}
        ${!hayStock ? '<span class="product-card__out-badge">Sin stock</span>' : ''}
      </div>
      <div class="fav-card__body">
        ${categoria ? `<span class="fav-card__category">${categoria}</span>` : ''}
        <p class="fav-card__name">${nombre}</p>
        ${hayStock
          ? `<p class="fav-card__price">${window.App.formatPrice(precio)}</p>`
          : `<p class="fav-card__out">Sin stock</p>`
        }
      </div>
      <div class="fav-card__footer">
        <button class="btn btn-primary btn-sm" style="flex:1"
          onclick="window.location.href='producto.html?id=${id}'"
          ${!hayStock ? 'disabled aria-disabled="true"' : ''}
          title="${hayStock ? 'Ver producto' : 'Sin stock'}">
          ${hayStock ? 'Ver producto' : 'Sin stock'}
        </button>
        <button class="btn btn-ghost btn-sm fav-remove-btn"
          data-product-id="${id}" aria-label="Eliminar de favoritos" title="Eliminar de favoritos">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6M14 11v6"/>
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
        </button>
      </div>
    </article>
  `;
}

function buildImgSVG() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;
}

function bindFavCardEvents() {
  document.querySelectorAll('.fav-remove-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await removeFavorite(btn.dataset.productId, btn);
    });
  });
}

async function removeFavorite(productId, btn) {
  const userId = window.Auth.getUserId();
  const card   = btn.closest('.fav-card');

  btn.disabled = true;
  btn.style.opacity = '0.5';

  try {
    const res = await window.Api.eliminarFavorito(userId, productId);

    if (res && res.codigo === 200) {
      card.style.transition = 'opacity 300ms, transform 300ms';
      card.style.opacity    = '0';
      card.style.transform  = 'scale(0.95)';
      setTimeout(() => {
        card.remove();
        const remaining = document.querySelectorAll('.fav-card');
        if (remaining.length === 0) {
          document.getElementById('favs-grid').classList.add('hidden');
          document.getElementById('favs-empty').classList.remove('hidden');
        }
      }, 300);
      window.App.showToast('Eliminado de favoritos', 'info');
    } else {
      btn.disabled = false;
      btn.style.opacity = '1';
      window.App.showToast('No se pudo eliminar el favorito', 'error');
    }
  } catch (err) {
    btn.disabled = false;
    btn.style.opacity = '1';
    window.App.showToast('Error de conexión', 'error');
  }
}

/* ════════════════════════════════════════
   HELPERS UI
   ════════════════════════════════════════ */

function showProfileMsg(type, message) {
  const el = document.getElementById('profile-msg');
  if (!el) return;
  el.textContent = message;
  el.className = `profile-msg ${type}`;
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function clearProfileMsg() {
  const el = document.getElementById('profile-msg');
  if (!el) return;
  el.textContent = '';
  el.className = 'profile-msg';
}

/* ── Errores inline por campo ── */
function showFieldError(elementId, message) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = message;
  el.classList.remove('hidden');
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function clearFieldError(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = '';
  el.classList.add('hidden');
}

function setLoadingBtn(btn, loading, text) {
  btn.disabled      = loading;
  btn.textContent   = text;
  btn.style.opacity = loading ? '0.7' : '1';
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
