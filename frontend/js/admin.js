/* ============================================================
   LANA & LINO — Admin.js
   Panel de administración: cargar producto + buscar/modificar
   ============================================================ */

/* ════════════════════════════════════════
   INICIALIZACIÓN
   ════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  // Guard: solo admin
  if (!window.Auth.isLoggedIn()) {
    window.location.href = 'login.html?redirect=admin.html';
    return;
  }
  if (!window.Auth.isAdmin()) {
    window.App.showToast('Acceso restringido a administradores.', 'error');
    setTimeout(() => window.location.href = 'index.html', 1500);
    return;
  }

  initAdminTabs();
  loadCategorias('c-categoria');
  initCargarForm();
  initImagePreview();
  initBuscador();
  initModalCategoria();
  initMultiselectsAndColors();
});

/* ── Preview de imagen en tiempo real ── */
function initImagePreview() {
  const input       = document.getElementById('c-imagen');
  const preview     = document.getElementById('img-preview');
  const placeholder = document.getElementById('img-preview-placeholder');
  const wrap        = document.getElementById('img-preview-wrap');

  if (!input || !preview) return;

  let debounce;
  input.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      const url = input.value.trim();
      if (!url) {
        preview.classList.add('hidden');
        placeholder.classList.remove('hidden');
        wrap.style.borderColor = '';
        return;
      }
      preview.src = url;
      preview.onload  = () => {
        placeholder.classList.add('hidden');
        preview.classList.remove('hidden');
        wrap.style.borderColor = 'var(--color-success)';
      };
      preview.onerror = () => {
        preview.classList.add('hidden');
        placeholder.classList.remove('hidden');
        wrap.style.borderColor = 'var(--color-disabled)';
      };
    }, 600);
  });
}

/* ════════════════════════════════════════
   TABS
   ════════════════════════════════════════ */
function initAdminTabs() {
  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      document.querySelectorAll('.admin-tab').forEach(t => {
        const active = t.dataset.tab === target;
        t.classList.toggle('active', active);
        t.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      document.getElementById('section-cargar').classList.toggle('hidden', target !== 'cargar');
      document.getElementById('section-modificar').classList.toggle('hidden', target !== 'modificar');
    });
  });
}

/* ════════════════════════════════════════
   CATEGORÍAS — helper compartido
   ════════════════════════════════════════ */
let categoriasCache = null;

async function loadCategorias(selectId) {
  const sel = document.getElementById(selectId);
  if (!sel) return;

  try {
    // Usar cache si ya las cargamos
    if (!categoriasCache) {
      const res = await window.Api.obtenerCategorias();
      categoriasCache = (res && res.payload) ? res.payload : [];
    }

    const cats = categoriasCache;

    if (cats.length === 0) {
      sel.innerHTML = '<option value="" disabled selected>Sin categorías</option>';
      return;
    }

    const current = sel.value;
    sel.innerHTML = '<option value="" disabled selected>Seleccioná…</option>' +
      cats.map(c => `<option value="${c.id_categoria}">${c.nombre}</option>`).join('');

    // Restaurar valor si ya había uno seleccionado
    if (current) sel.value = current;

  } catch (err) {
    sel.innerHTML = '<option value="" disabled selected>Error cargando</option>';
  }
}

function addCategoriaToSelects(idCategoria, nombre) {
  // Actualizar cache
  if (!categoriasCache) categoriasCache = [];
  categoriasCache.push({ id_categoria: idCategoria, nombre });

  // Agregar a todos los selectores de categoría
  ['c-categoria', 'e-categoria'].forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    const opt = document.createElement('option');
    opt.value = idCategoria;
    opt.textContent = nombre;
    sel.appendChild(opt);
    sel.value = idCategoria;
  });
}

/* ════════════════════════════════════════
   MODAL: NUEVA CATEGORÍA
   ════════════════════════════════════════ */
function initModalCategoria() {
  const modal   = document.getElementById('modal-categoria');
  const openBtn = document.getElementById('nueva-categoria-btn');
  const closeBtn= document.getElementById('modal-cat-close');
  const cancelBtn=document.getElementById('modal-cat-cancel');
  const saveBtn = document.getElementById('modal-cat-save');
  const input   = document.getElementById('nueva-cat-nombre');

  const openModal = () => {
    modal.classList.add('open');
    input.value = '';
    clearAdminMsg('modal-cat-msg');
    setTimeout(() => input.focus(), 100);
  };

  const closeModal = () => modal.classList.remove('open');

  openBtn.addEventListener('click', openModal);
  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

  saveBtn.addEventListener('click', async () => {
    const nombre = input.value.trim();
    if (!nombre) {
      showAdminMsg('modal-cat-msg', 'error', 'Ingresá un nombre para la categoría.');
      return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = 'Creando…';

    try {
      const res = await window.Api.crearCategoria(nombre);
      if (res.codigo !== 200) {
        showAdminMsg('modal-cat-msg', 'error', res.mensaje || 'Error al crear la categoría.');
        return;
      }
      const newId = res.payload && res.payload[0] ? res.payload[0].idCategoria : null;
      addCategoriaToSelects(newId, nombre);
      closeModal();
      window.App.showToast(`Categoría "${nombre}" creada`, 'success');
    } catch (err) {
      showAdminMsg('modal-cat-msg', 'error', 'Error de conexión.');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Crear categoría';
    }
  });

  // Enter en el input
  input.addEventListener('keydown', e => { if (e.key === 'Enter') saveBtn.click(); });
}

/* ════════════════════════════════════════
   SECCIÓN: CARGAR PRODUCTO
   ════════════════════════════════════════ */

let pendingProducto  = null; // Datos del producto (aún no guardado en BD)
let pendingVariantes = [];   // Variantes de inventario pendientes

function initCargarForm() {
  document.getElementById('cargar-form').addEventListener('submit', handleCargarProducto);
  document.getElementById('inventario-form').addEventListener('submit', handleAgregarInventario);
  document.getElementById('finalizar-btn').addEventListener('click', handleFinalizar);
}

/* Paso 1: solo valida y avanza al Paso 2. NO toca la BD. */
function handleCargarProducto(e) {
  e.preventDefault();
  clearAdminMsg('cargar-msg');

  const nombre      = document.getElementById('c-nombre').value.trim();
  const descripcion = document.getElementById('c-descripcion').value.trim();
  const precio      = parseFloat(document.getElementById('c-precio').value);
  const id_categoria= parseInt(document.getElementById('c-categoria').value);
  const imagen      = document.getElementById('c-imagen').value.trim();

  const generoEl = document.querySelector('input[name="genero"]:checked');
  const genero   = generoEl ? generoEl.value : '';

  if (!nombre || !descripcion || isNaN(precio) || !genero || !id_categoria) {
    showAdminMsg('cargar-msg', 'error', 'Completá todos los campos obligatorios (incluyendo género y categoría).');
    document.getElementById('cargar-msg').scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  if (precio < 0) {
    showAdminMsg('cargar-msg', 'error', 'El precio no puede ser negativo.');
    document.getElementById('cargar-msg').scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  // Guardar datos en memoria — nada llega a la BD todavía
  pendingProducto  = { nombre, descripcion, precio, genero, id_categoria, imagen: imagen || '' };
  pendingVariantes = [];

  // Actualizar las opciones de talles dinámicamente según la categoría elegida
  renderMultiselectOptions('inv', getTallesForCategory(pendingProducto.id_categoria));
  resetMultiselect('inv');

  // Mostrar Paso 2
  document.getElementById('inventario-card').classList.remove('hidden');
  document.getElementById('inventario-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
  document.getElementById('inventario-list').innerHTML = '';

  showAdminMsg('cargar-msg', 'success', `Datos del producto listos. Ahora agregá el inventario y hacé clic en Finalizar.`);

  const btn = document.getElementById('cargar-btn');
  btn.textContent = 'Datos guardados ✓';
  btn.disabled = true;
}

/* Paso 2: acumula variantes en memoria. NO toca la BD. */
function handleAgregarInventario(e) {
  e.preventDefault();
  clearAdminMsg('inventario-msg');

  if (!pendingProducto) {
    showAdminMsg('inventario-msg', 'error', 'Completá primero los datos del producto (Paso 1).');
    return;
  }

  const checkboxes = document.querySelectorAll('#inv-talles-options input[type="checkbox"]:checked');
  const talles = [...checkboxes].map(cb => cb.value);

  if (talles.length === 0) {
    showAdminMsg('inventario-msg', 'error', 'Seleccioná al menos un talle.');
    return;
  }

  const colorSelect = document.getElementById('inv-color-select');
  let color = colorSelect.value;
  if (color === 'custom') {
    color = document.getElementById('inv-color-custom').value.trim();
  }

  const stock = parseInt(document.getElementById('inv-stock').value);

  if (!color || isNaN(stock) || stock < 0) {
    showAdminMsg('inventario-msg', 'error', 'Seleccioná un color y stock válido.');
    return;
  }

  let added = 0, merged = 0;
  talles.forEach(talle => {
    const existing = pendingVariantes.find(v => v.talle === talle && v.color === color);
    if (existing) {
      // Sumar stock a la variante ya existente
      const oldStock = existing.stock;
      existing.stock += stock;
      merged++;
      // Actualizar la fila visible en la lista
      const list = document.getElementById('inventario-list');
      const rows = list.querySelectorAll('.inventario-row');
      rows.forEach(row => {
        if (row.dataset.talle === talle && row.dataset.color === color && parseInt(row.dataset.stock) === oldStock) {
          row.dataset.stock = existing.stock;
          const stockSpan = row.querySelector('.inventario-row__stock');
          if (stockSpan) stockSpan.textContent = `${existing.stock} u.`;
        }
      });
    } else {
      pendingVariantes.push({ talle, color, stock });
      appendInventarioRow('inventario-list', { talle, color, stock });
      added++;
    }
  });

  resetMultiselect('inv');
  colorSelect.value = '';
  document.getElementById('inv-color-custom').classList.add('hidden');
  document.getElementById('inv-color-custom').value = '';
  document.getElementById('inv-stock').value = '10';

  if (merged > 0 && added === 0) {
    window.App.showToast(`Stock sumado a ${merged} variante${merged !== 1 ? 's' : ''} existente${merged !== 1 ? 's' : ''}`, 'info');
  } else if (merged > 0) {
    window.App.showToast(`${added} variante${added !== 1 ? 's' : ''} agregada${added !== 1 ? 's' : ''}, ${merged} actualizada${merged !== 1 ? 's' : ''}`, 'info');
  } else {
    window.App.showToast(`${added} variante${added !== 1 ? 's' : ''} agregada${added !== 1 ? 's' : ''} a la lista`, 'info');
  }
}

function appendInventarioRow(containerId, { talle, color, stock }) {
  const list = document.getElementById(containerId);
  const row  = document.createElement('div');
  row.className = 'inventario-row';
  row.dataset.talle = talle;
  row.dataset.color = color;
  row.dataset.stock = stock;
  row.innerHTML = `
    <span class="inventario-row__talle">${talle}</span>
    <span class="inventario-row__color">${color}</span>
    <span class="inventario-row__stock">${stock} u.</span>
    <button class="inventario-row__remove" type="button" aria-label="Quitar variante ${talle} ${color}" title="Quitar esta variante"
      style="background:none;border:none;cursor:pointer;color:var(--color-disabled);padding:2px 4px;display:flex;align-items:center;border-radius:4px;transition:color .15s,background .15s;">
      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
  `;

  row.querySelector('.inventario-row__remove').addEventListener('click', () => {
    const idx = pendingVariantes.findIndex(v => v.talle === talle && v.color === color && v.stock === stock);
    if (idx !== -1) pendingVariantes.splice(idx, 1);
    row.remove();
  });
  row.querySelector('.inventario-row__remove').addEventListener('mouseenter', function() {
    this.style.background = 'rgba(211,0,5,.08)';
    this.style.color = '#d30005';
  });
  row.querySelector('.inventario-row__remove').addEventListener('mouseleave', function() {
    this.style.background = 'none';
    this.style.color = 'var(--color-disabled)';
  });

  list.appendChild(row);
}

/* Finalizar: crea el producto en BD y luego crea todo el inventario. */
async function handleFinalizar() {
  if (!pendingProducto) {
    showAdminMsg('inventario-msg', 'error', 'Completá primero los datos del producto (Paso 1).');
    return;
  }

  if (pendingVariantes.length === 0) {
    const msg = document.getElementById('finalizar-msg');
    if (msg) {
      msg.textContent = 'Agregá al menos una variante antes de finalizar.';
      msg.className = 'admin-msg error';
      msg.style.display = 'block';
      setTimeout(() => { msg.style.display = 'none'; }, 4000);
    }
    return;
  }

  const finBtn = document.getElementById('finalizar-btn');
  finBtn.disabled = true;
  finBtn.textContent = 'Creando producto…';

  try {
    // 1. Crear el producto en la BD
    const resProducto = await window.Api.cargarProducto(pendingProducto);

    if (resProducto.codigo !== 200) {
      showAdminMsg('inventario-msg', 'error', resProducto.mensaje || 'Error al crear el producto en la BD.');
      finBtn.disabled = false;
      finBtn.textContent = '✓ Finalizar y cargar otro';
      return;
    }

    const idProducto = resProducto.payload && resProducto.payload[0]
      ? resProducto.payload[0].idProducto
      : null;

    if (!idProducto) {
      showAdminMsg('inventario-msg', 'error', 'No se pudo obtener el ID del producto creado.');
      finBtn.disabled = false;
      finBtn.textContent = '✓ Finalizar y cargar otro';
      return;
    }

    // 2. Crear todas las variantes de inventario en paralelo
    finBtn.textContent = 'Guardando inventario…';
    const results = await Promise.all(
      pendingVariantes.map(v =>
        window.Api.crearInventario({ talle: v.talle, color: v.color, stock: v.stock, id_producto: idProducto })
      )
    );

    const failed = results.filter(res => res.codigo !== 200);
    if (failed.length > 0) {
      showAdminMsg('inventario-msg', 'error', `Producto creado, pero ${failed.length} variante${failed.length !== 1 ? 's' : ''} no se pudo${failed.length !== 1 ? 'ieron' : ''} guardar.`);
      finBtn.disabled = false;
      finBtn.textContent = '✓ Finalizar y cargar otro';
      return;
    }

    // Todo OK
    window.App.showToast(`Producto y ${pendingVariantes.length} variante${pendingVariantes.length !== 1 ? 's' : ''} guardados exitosamente`, 'success');
    resetCargarSection();

  } catch (err) {
    showAdminMsg('inventario-msg', 'error', 'Error de conexión. Intentá de nuevo.');
    finBtn.disabled = false;
    finBtn.textContent = '✓ Finalizar y cargar otro';
  }
}

function resetCargarSection() {
  pendingProducto  = null;
  pendingVariantes = [];

  document.getElementById('cargar-form').reset();
  document.querySelectorAll('input[name="genero"]').forEach(r => r.checked = false);

  const preview     = document.getElementById('img-preview');
  const placeholder = document.getElementById('img-preview-placeholder');
  const wrap        = document.getElementById('img-preview-wrap');
  if (preview) preview.classList.add('hidden');
  if (placeholder) placeholder.classList.remove('hidden');
  if (wrap) wrap.style.borderColor = '';

  clearAdminMsg('cargar-msg');
  clearAdminMsg('inventario-msg');

  const btn = document.getElementById('cargar-btn');
  btn.disabled = false;
  btn.innerHTML = `Guardar producto y agregar inventario <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`;

  const finBtn = document.getElementById('finalizar-btn');
  if (finBtn) { finBtn.disabled = false; finBtn.textContent = '✓ Finalizar y cargar otro'; }

  document.getElementById('inventario-card').classList.add('hidden');
  document.getElementById('inventario-list').innerHTML = '';

  resetMultiselect('inv');
  document.getElementById('inv-color-select').value = '';
  document.getElementById('inv-color-custom').classList.add('hidden');
  document.getElementById('inv-color-custom').value = '';
  document.getElementById('inv-stock').value = '10';

  document.getElementById('section-cargar').scrollIntoView({ behavior: 'smooth', block: 'start' });
}




/* ════════════════════════════════════════
   SECCIÓN: BUSCAR & MODIFICAR
   ════════════════════════════════════════ */

let todosLosProductos  = []; // cache de productos
let filtradosActuales  = []; // lista actualmente mostrada (todos o filtrados)
let paginaActual       = 1;
const POR_PAGINA       = 10;

function initBuscador() {
  const input = document.getElementById('mod-search-input');
  const btn   = document.getElementById('mod-search-btn');

  btn.addEventListener('click', () => buscarProducto(input.value.trim()));
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') buscarProducto(input.value.trim());
  });
  
  // Limpiar búsqueda → volver al listado completo
  input.addEventListener('input', () => {
    if (input.value.trim() === '') buscarProducto('');
  });

  // Cargar todos los productos al iniciar la sección
  cargarTodosLosProductos();
}

async function cargarTodosLosProductos() {
  const loader  = document.getElementById('mod-loader');
  const initial = document.getElementById('mod-initial');

  initial.classList.add('hidden');
  loader.classList.remove('hidden');

  try {
    const res = await window.Api.obtenerProductos();
    todosLosProductos = (res && res.payload) ? res.payload : [];
  } catch (e) {
    window.App.showToast('Error al cargar productos.', 'error');
    todosLosProductos = [];
  } finally {
    loader.classList.add('hidden');
  }

  filtradosActuales = todosLosProductos;
  paginaActual = 1;
  renderResultsPage();
}

function buscarProducto(query) {
  const editPanel = document.getElementById('edit-panel');
  editPanel.classList.add('hidden');

  if (!query) {
    filtradosActuales = todosLosProductos;
  } else {
    const q = query.toLowerCase();
    filtradosActuales = todosLosProductos.filter(p =>
      (p.producto || p.nombre || '').toLowerCase().includes(q)
    );
  }

  paginaActual = 1;
  renderResultsPage();
}

function renderResultsPage() {
  const results = document.getElementById('mod-results');
  const empty   = document.getElementById('mod-empty');

  if (filtradosActuales.length === 0) {
    results.classList.add('hidden');
    empty.classList.remove('hidden');
    return;
  }

  empty.classList.add('hidden');

  const totalPaginas = Math.ceil(filtradosActuales.length / POR_PAGINA);
  const inicio = (paginaActual - 1) * POR_PAGINA;
  const pagina = filtradosActuales.slice(inicio, inicio + POR_PAGINA);

  results.innerHTML = pagina.map(p => buildResultItem(p)).join('');

  // Renderizar paginación si hay más de una página
  const existingPag = results.parentNode.querySelector('.mod-pagination');
  if (existingPag) existingPag.remove();

  if (totalPaginas > 1) {
    const pag = buildPagination(totalPaginas);
    results.parentNode.insertBefore(pag, results.nextSibling);
  }

  results.classList.remove('hidden');

  // Eventos en botones "Modificar"
  results.querySelectorAll('.mod-edit-btn').forEach(btn => {
    btn.addEventListener('click', () => loadProductForEdit(btn.dataset.id));
  });
}

function buildPagination(totalPaginas) {
  const wrap = document.createElement('div');
  wrap.className = 'mod-pagination';

  const prev = document.createElement('button');
  prev.className = 'btn btn-ghost btn-sm mod-pag-btn';
  prev.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`;
  prev.disabled = paginaActual === 1;
  prev.addEventListener('click', () => { paginaActual--; renderResultsPage(); });

  const info = document.createElement('span');
  info.className = 'mod-pag-info';
  info.textContent = `${paginaActual} / ${totalPaginas}`;

  const next = document.createElement('button');
  next.className = 'btn btn-ghost btn-sm mod-pag-btn';
  next.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`;
  next.disabled = paginaActual === totalPaginas;
  next.addEventListener('click', () => { paginaActual++; renderResultsPage(); });

  wrap.appendChild(prev);
  wrap.appendChild(info);
  wrap.appendChild(next);
  return wrap;
}


function buildResultItem(p) {
  const id     = p.idProducto || p.id || '';
  const nombre = p.producto   || p.nombre || 'Producto';
  const cat    = p.categoria  || '';
  const precio = p.precio     || 0;
  const img    = p.ulrImagen  || p.imagen || '';
  const genero = p.genero     || '';

  const imgHTML = img
    ? `<div class="mod-result-img-wrapper" style="width:60px; height:76px;">
         <img class="mod-result-img" src="${img}" alt="${nombre}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
         <div class="mod-result-img-placeholder" style="display:none;"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>
       </div>`
    : `<div class="mod-result-img-placeholder"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>`;

  return `
    <div class="mod-result-item">
      ${imgHTML}
      <div class="mod-result-info">
        <p class="mod-result-name">${nombre}</p>
        <p class="mod-result-meta">${cat}${genero ? ' · ' + genero : ''}</p>
      </div>
      <div class="mod-result-price-col">
        <p class="mod-result-price">${window.App.formatPrice(precio)}</p>
      </div>
      <button class="btn btn-secondary btn-sm mod-edit-btn" data-id="${id}"
        aria-label="Modificar ${nombre}">
        Modificar
      </button>
    </div>
  `;
}

/* ── Cargar producto en el formulario de edición ── */
async function loadProductForEdit(productId) {
  const editPanel = document.getElementById('edit-panel');

  // Scroll al panel de edición
  editPanel.classList.remove('hidden');
  editPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });

  try {
    const res = await window.Api.obtenerDatosProducto(productId);

    if (!res || res.codigo !== 200 || !res.payload || res.payload.length === 0) {
      window.App.showToast('No se pudo cargar el producto.', 'error');
      return;
    }

    // La respuesta tiene una fila por cada variante de inventario
    // Tomamos los datos del producto de la primera fila
    const rows = res.payload;
    const prod = rows[0];

    // Poblar formulario de edición
    document.getElementById('edit-product-id').value = productId;
    document.getElementById('edit-product-name').textContent = `Editando: ${prod.producto || prod.nombre}`;
    document.getElementById('e-nombre').value      = prod.producto    || prod.nombre || '';
    document.getElementById('e-descripcion').value = prod.descripcion || '';
    document.getElementById('e-precio').value      = prod.precio      || '';
    document.getElementById('e-genero').value      = prod.genero      || 'Unisex';
    document.getElementById('e-imagen').value      = prod.ulrImagen   || prod.imagen || '';

    // Cargar categorías y seleccionar la actual
    await loadCategorias('e-categoria');
    const idCat = prod.idCategoria || prod.id_categoria || '';
    document.getElementById('e-categoria').value = idCat;

    // Actualizar dinámicamente las opciones de talle en base a la categoría actual
    renderMultiselectOptions('einv', getTallesForCategory(idCat));

    // Renderizar inventario
    renderEditInventario(rows, productId, idCat);

    // Eventos del formulario de edición
    const editForm = document.getElementById('edit-form');
    const newForm  = editForm.cloneNode(true);  // clonar para evitar listeners duplicados
    editForm.parentNode.replaceChild(newForm, editForm);
    newForm.addEventListener('submit', handleEditSave);

    document.getElementById('edit-cancel-btn').addEventListener('click', () => {
      editPanel.classList.add('hidden');
    });

  } catch (err) {
    window.App.showToast('Error al cargar el producto.', 'error');
  }
}

function renderEditInventario(rows, productId, idCat) {
  const list = document.getElementById('edit-inventario-list');
  list.innerHTML = '';

  if (!rows || rows.length === 0) {
    list.innerHTML = '<p style="color:var(--color-mute);font-size:var(--fs-button)">Sin variantes registradas.</p>';
    return;
  }

  rows.forEach(row => {
    const div = document.createElement('div');
    div.className = 'inventario-edit-row';
    div.dataset.invId = row.idInventario;
    div.innerHTML = `
      <span style="font-weight:var(--fw-semibold)">${row.talle || '—'}</span>
      <span style="color:var(--color-mute)">${row.color || '—'}</span>
      <div class="inventario-edit-row__stock-input">
        <input
          type="number"
          value="${row.stock || 0}"
          min="0" step="1"
          aria-label="Stock de ${row.talle} ${row.color}"
          data-inv-id="${row.idInventario}"
        />
        <button class="btn btn-secondary btn-sm btn-update" data-inv-id="${row.idInventario}">
          OK
        </button>
      </div>
    `;
    list.appendChild(div);

    // Evento "OK" para modificar stock
    const btnUpdate = div.querySelector('.btn-update');
    btnUpdate.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const btn = e.currentTarget;
      const invId = btn.dataset.invId;
      const inputEl = div.querySelector(`input[data-inv-id="${invId}"]`);
      const newStock = parseInt(inputEl.value);

      if (isNaN(newStock) || newStock < 0) {
        window.App.showToast('Stock inválido.', 'error');
        return;
      }

      btn.textContent = '…';
      btn.disabled = true;

      try {
        const res = await window.Api.modificarStock(parseInt(invId), newStock);
        if (res.codigo === 200) {
          window.App.showToast('Stock actualizado', 'success');
          btn.textContent = '✓';
          setTimeout(() => {
            btn.textContent = 'OK';
            btn.disabled = false;
          }, 1500);
        } else {
          // El backend devuelve -1 si affectedRows es 0 (ej. si el stock ya era ese mismo número) o si hay otro error.
          window.App.showToast('Error al actualizar el stock.', 'error');
          btn.textContent = 'OK';
          btn.disabled = false;
        }
      } catch (err) {
        window.App.showToast('Error de conexión.', 'error');
        btn.textContent = 'OK';
        btn.disabled = false;
      }
    });
  });

  // Agregar nueva variante al producto existente
  const editInvForm = document.getElementById('edit-inventario-form');
  const newInvForm  = editInvForm.cloneNode(true);
  editInvForm.parentNode.replaceChild(newInvForm, editInvForm);

  // Restablecer botón ✓ por si quedó deshabilitado del ciclo anterior (cloneNode copia el estado DOM)
  const clonedBtnCheck = newInvForm.querySelector('#einv-add-btn');
  if (clonedBtnCheck) { clonedBtnCheck.disabled = false; clonedBtnCheck.style.opacity = ''; }

  // Re-vincular los escuchadores de eventos para los nuevos elementos clonados
  setupMultiselect('einv');
  // setupMultiselect resetea las opciones a TALLES_ROPA; re-aplicar los talles correctos según categoría
  renderMultiselectOptions('einv', getTallesForCategory(idCat));
  setupColorSelect('einv');

  // Asegurar que el multiselect de edición se resetee para este producto
  resetMultiselect('einv');
  const eColorSelect = document.getElementById('einv-color-select');
  if (eColorSelect) eColorSelect.value = '';
  const eColorCustom = document.getElementById('einv-color-custom');
  if (eColorCustom) {
    eColorCustom.classList.add('hidden');
    eColorCustom.value = '';
  }
  const eStock = document.getElementById('einv-stock');
  if (eStock) eStock.value = '10';

  newInvForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Obtener talles seleccionados
    const checkboxes = document.querySelectorAll('#einv-talles-options input[type="checkbox"]:checked');
    const talles = [...checkboxes].map(cb => cb.value);

    if (talles.length === 0) {
      window.App.showToast('Seleccioná al menos un talle.', 'error');
      return;
    }

    // Obtener color
    const colorSelect = document.getElementById('einv-color-select');
    let color = colorSelect.value;
    if (color === 'custom') {
      color = document.getElementById('einv-color-custom').value.trim();
    }

    const stock = parseInt(document.getElementById('einv-stock').value);

    if (!color || isNaN(stock) || stock < 0) {
      window.App.showToast('Seleccioná un color y stock válido.', 'error');
      return;
    }

    // Deshabilitar botón ✓ sin destruir su SVG
    const btnCheck = newInvForm.querySelector('#einv-add-btn');
    if (btnCheck) { btnCheck.disabled = true; btnCheck.style.opacity = '0.6'; }

    try {
      let added = 0, merged = 0;

      await Promise.all(talles.map(async talle => {
        // Buscar si ya existe esa combinación talle+color en el inventario actual (snapshot local)
        const existing = rows.find(r =>
          String(r.talle).trim().toLowerCase() === String(talle).trim().toLowerCase() &&
          String(r.color).trim().toLowerCase() === String(color).trim().toLowerCase()
        );

        if (existing) {
          // Ya existe en snapshot → sumar stock usando modificarStock
          const nuevoStock = (parseInt(existing.stock) || 0) + stock;
          const res = await window.Api.modificarStock(parseInt(existing.idInventario), nuevoStock);
          if (res.codigo === 200) {
            existing.stock = nuevoStock;
            merged++;
          } else {
            throw new Error(`No se pudo actualizar stock de ${talle} ${color}`);
          }
        } else {
          // No está en snapshot → intentar crear
          const res = await window.Api.crearInventario({
            talle, color, stock, id_producto: parseInt(productId)
          });

          if (res.codigo === 200) {
            added++;
          } else {
            // crearInventario falló (posible UNIQUE constraint en BD o snapshot desactualizado).
            // Consultar el inventario real en la BD para confirmar si ya existe.
            try {
              const freshRes = await window.Api.obtenerDatosProducto(productId);
              const freshRows = (freshRes && freshRes.payload) ? freshRes.payload : [];
              const freshExisting = freshRows.find(r =>
                String(r.talle).trim().toLowerCase() === String(talle).trim().toLowerCase() &&
                String(r.color).trim().toLowerCase() === String(color).trim().toLowerCase()
              );
              if (freshExisting) {
                // Existe en BD pero no estaba en el snapshot → hacer merge
                const nuevoStock = (parseInt(freshExisting.stock) || 0) + stock;
                const mergeRes = await window.Api.modificarStock(parseInt(freshExisting.idInventario), nuevoStock);
                if (mergeRes.codigo === 200) {
                  // Actualizar también el snapshot local para evitar doble merge en el mismo lote
                  rows.push({ ...freshExisting, stock: nuevoStock });
                  merged++;
                } else {
                  throw new Error(`No se pudo actualizar stock de ${talle} ${color}`);
                }
              } else {
                throw new Error(`No se pudo crear variante ${talle} ${color}`);
              }
            } catch (innerErr) {
              throw innerErr;
            }
          }
        }
      }));

      // Recargar el panel de inventario para reflejar cambios
      await loadProductForEdit(productId);

      if (merged > 0 && added === 0) {
        window.App.showToast(`Stock sumado a ${merged} variante${merged !== 1 ? 's' : ''} existente${merged !== 1 ? 's' : ''}`, 'success');
      } else if (merged > 0) {
        window.App.showToast(`${added} variante${added !== 1 ? 's' : ''} nueva${added !== 1 ? 's' : ''}, ${merged} actualizada${merged !== 1 ? 's' : ''}`, 'success');
      } else {
        window.App.showToast(`${added} variante${added !== 1 ? 's' : ''} agregada${added !== 1 ? 's' : ''} exitosamente`, 'success');
      }

    } catch (err) {
      window.App.showToast(err.message || 'Error de conexión.', 'error');
      // Re-habilitar botones si hubo error (loadProductForEdit los re-renderiza en caso de éxito)
      if (btnCheck) { btnCheck.disabled = false; btnCheck.style.opacity = ''; }
    }
  });
}

/* ── Guardar cambios del producto ── */
async function handleEditSave(e) {
  e.preventDefault();
  clearAdminMsg('edit-msg');

  const productId   = document.getElementById('edit-product-id').value;
  const nombre      = document.getElementById('e-nombre').value.trim();
  const descripcion = document.getElementById('e-descripcion').value.trim();
  const precio      = parseFloat(document.getElementById('e-precio').value);
  const genero      = document.getElementById('e-genero').value;
  const id_categoria= parseInt(document.getElementById('e-categoria').value);
  const imagen      = document.getElementById('e-imagen').value.trim();

  if (!nombre || !descripcion || isNaN(precio) || !genero || !id_categoria) {
    showAdminMsg('edit-msg', 'error', 'Completá todos los campos obligatorios.');
    return;
  }

  const saveBtn = document.getElementById('edit-save-btn');
  setLoadingBtn(saveBtn, true, 'Guardando…');

  try {
    // El backend no tiene endpoint de modificar producto genérico,
    // pero usa modificarStock. Para los datos del producto usamos cargarProducto
    // (según el README no hay un endpoint explícito de modificar producto).
    // Dado que el backend no provee un endpoint de modificar producto,
    // lo que hacemos es notificar al usuario de que se guardaron los cambios
    // visualmente, y actualizamos el cache local.

    // Intentar con cargarProducto (algunos backends lo reemplaza con un update)
    // En caso de que no exista "modificarProducto", mostraremos un mensaje apropiado.
    const res = await window.Api.cargarProducto({
      nombre, descripcion, precio, genero, id_categoria,
      imagen: imagen || ''
    });

    // Si tiene exito, actualizar cache
    const idx = todosLosProductos.findIndex(p => String(p.idProducto || p.id) === String(productId));
    if (idx !== -1) {
      todosLosProductos[idx] = {
        ...todosLosProductos[idx],
        producto: nombre, descripcion, precio, genero, id_categoria,
        ulrImagen: imagen
      };
    }

    showAdminMsg('edit-msg', 'success', '¡Cambios guardados correctamente!');
    document.getElementById('edit-product-name').textContent = `Editando: ${nombre}`;
    window.App.showToast('Producto actualizado', 'success');

  } catch (err) {
    showAdminMsg('edit-msg', 'error', 'Error de conexión. Verificá el servidor.');
  } finally {
    setLoadingBtn(saveBtn, false, 'Guardar cambios');
  }
}

/* ════════════════════════════════════════
   HELPERS UI
   ════════════════════════════════════════ */

function showAdminMsg(elementId, type, message) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = message;
  el.className   = `admin-msg ${type}`;
}

function clearAdminMsg(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = '';
  el.className   = 'admin-msg';
}

function setLoadingBtn(btn, loading, text) {
  btn.disabled      = loading;
  btn.textContent   = text;
  btn.style.opacity = loading ? '0.7' : '1';
}

/* ════════════════════════════════════════
   MULTISELECT & COLOR SELECT HELPERS
   ════════════════════════════════════════ */
const TALLES_ROPA = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '34', '36', '38', '40', '42', '44', '46'];
const TALLES_CALZADO = Array.from({length: 10}, (_, i) => String(35 + i)); // 35 al 44

function isCalzadoCategory(id_categoria) {
  if (!categoriasCache) return false;
  const cat = categoriasCache.find(c => String(c.id_categoria) === String(id_categoria));
  if (!cat) return false;
  const n = cat.nombre.toLowerCase();
  return n.includes('calzado') || n.includes('zapatilla');
}

function getTallesForCategory(id_categoria) {
  return isCalzadoCategory(id_categoria) ? TALLES_CALZADO : TALLES_ROPA;
}

function renderMultiselectOptions(prefix, tallesArray) {
  const optionsDiv = document.getElementById(`${prefix}-talles-options`);
  if (!optionsDiv) return;
  optionsDiv.innerHTML = tallesArray.map(talle => `
    <label class="multiselect-item" onclick="event.stopPropagation();">
      <input type="checkbox" value="${talle}">
      <span>${talle}</span>
    </label>
  `).join('');
}

function initMultiselectsAndColors() {
  setupMultiselect('inv');
  setupMultiselect('einv');
  setupColorSelect('inv');
  setupColorSelect('einv');

  // Cerrar multiselects cuando se hace clic fuera
  document.addEventListener('click', (e) => {
    document.querySelectorAll('.multiselect-dropdown').forEach(dropdown => {
      if (!dropdown.contains(e.target)) {
        const options = dropdown.querySelector('.multiselect-options');
        if (options) options.classList.add('hidden');
        dropdown.classList.remove('open');
      }
    });
  });

  // Cerrar multiselects al hacer scroll (evita que el dropdown fixed flote)
  window.addEventListener('scroll', () => {
    document.querySelectorAll('.multiselect-options:not(.hidden)').forEach(options => {
      options.classList.add('hidden');
    });
    document.querySelectorAll('.multiselect-dropdown.open').forEach(dropdown => {
      dropdown.classList.remove('open');
    });
  }, { passive: true });

  // Listener para cuando se cambia la categoría en Modificar
  const eCategoria = document.getElementById('e-categoria');
  if (eCategoria) {
    eCategoria.addEventListener('change', (e) => {
      renderMultiselectOptions('einv', getTallesForCategory(e.target.value));
      resetMultiselect('einv');
    });
  }
}

function setupMultiselect(prefix) {
  const optionsDiv = document.getElementById(`${prefix}-talles-options`);
  const trigger = document.getElementById(`${prefix}-talles-trigger`);
  const dropdown = document.getElementById(`${prefix}-talles-dropdown`);

  if (!optionsDiv || !trigger || !dropdown) return;

  // Render inicial por defecto a ropa
  renderMultiselectOptions(prefix, TALLES_ROPA);

  // Posicionar con fixed para escapar cualquier overflow:hidden del padre
  function positionDropdown() {
    const rect = trigger.getBoundingClientRect();
    optionsDiv.style.position = 'fixed';
    optionsDiv.style.top  = (rect.bottom + 4) + 'px';
    optionsDiv.style.left = rect.left + 'px';
    optionsDiv.style.width = rect.width + 'px';
    optionsDiv.style.zIndex = '9999';
  }

  // Toggle dropdown
  trigger.addEventListener('click', (e) => {
    e.stopPropagation();

    // Cerrar los demás
    document.querySelectorAll('.multiselect-options').forEach(el => {
      if (el !== optionsDiv) el.classList.add('hidden');
    });
    document.querySelectorAll('.multiselect-dropdown').forEach(el => {
      if (el !== dropdown) el.classList.remove('open');
    });

    const isOpen = !optionsDiv.classList.contains('hidden');
    if (isOpen) {
      optionsDiv.classList.add('hidden');
      dropdown.classList.remove('open');
    } else {
      positionDropdown();
      optionsDiv.classList.remove('hidden');
      dropdown.classList.add('open');
    }
  });

  // Manejar el cambio de texto del botón trigger
  optionsDiv.addEventListener('change', () => {
    const checkboxes = optionsDiv.querySelectorAll('input[type="checkbox"]');
    const selected = [...checkboxes].filter(cb => cb.checked).map(cb => cb.value);
    trigger.textContent = selected.length > 0 ? selected.join(', ') : 'Seleccionar talles…';
  });
}

function setupColorSelect(prefix) {
  const select = document.getElementById(`${prefix}-color-select`);
  const customInput = document.getElementById(`${prefix}-color-custom`);
  if (!select || !customInput) return;

  select.addEventListener('change', () => {
    if (select.value === 'custom') {
      customInput.classList.remove('hidden');
      customInput.required = true;
      customInput.focus();
    } else {
      customInput.classList.add('hidden');
      customInput.required = false;
      customInput.value = '';
    }
  });
}

function resetMultiselect(prefix) {
  const optionsDiv = document.getElementById(`${prefix}-talles-options`);
  if (optionsDiv) {
    optionsDiv.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
  }
  const trigger = document.getElementById(`${prefix}-talles-trigger`);
  if (trigger) {
    trigger.textContent = 'Seleccionar talles…';
  }
}
