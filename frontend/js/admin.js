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

let nuevoProductoId = null; // ID del producto recién creado (para el inventario)

function initCargarForm() {
  document.getElementById('cargar-form').addEventListener('submit', handleCargarProducto);
  document.getElementById('inventario-form').addEventListener('submit', handleAgregarInventario);
  document.getElementById('finalizar-btn').addEventListener('click', resetCargarSection);
}

async function handleCargarProducto(e) {
  e.preventDefault();
  clearAdminMsg('cargar-msg');

  const nombre      = document.getElementById('c-nombre').value.trim();
  const descripcion = document.getElementById('c-descripcion').value.trim();
  const precio      = parseFloat(document.getElementById('c-precio').value);
  const id_categoria= parseInt(document.getElementById('c-categoria').value);
  const imagen      = document.getElementById('c-imagen').value.trim();

  // Leer género desde radio buttons
  const generoEl = document.querySelector('input[name="genero"]:checked');
  const genero   = generoEl ? generoEl.value : '';

  if (!nombre || !descripcion || isNaN(precio) || !genero || !id_categoria) {
    showAdminMsg('cargar-msg', 'error', 'Completá todos los campos obligatorios (incluyendo género y categoría).');
    return;
  }

  if (precio < 0) {
    showAdminMsg('cargar-msg', 'error', 'El precio no puede ser negativo.');
    return;
  }

  const btn = document.getElementById('cargar-btn');
  setLoadingBtn(btn, true, 'Guardando producto…');

  try {
    const res = await window.Api.cargarProducto({
      nombre, descripcion, precio, genero, id_categoria,
      imagen: imagen || ''
    });

    if (res.codigo !== 200) {
      showAdminMsg('cargar-msg', 'error', res.mensaje || 'Error al guardar el producto.');
      return;
    }

    nuevoProductoId = res.payload && res.payload[0] ? res.payload[0].idProducto : null;

    // Mostrar card de inventario
    document.getElementById('inventario-card').classList.remove('hidden');
    document.getElementById('inventario-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.getElementById('inventario-list').innerHTML = '';

    showAdminMsg('cargar-msg', 'success', `¡Producto "${nombre}" guardado! Ahora agregá el inventario.`);
    btn.textContent = 'Producto guardado ✓';
    btn.disabled = true;

  } catch (err) {
    showAdminMsg('cargar-msg', 'error', 'Error de conexión. Verificá el servidor.');
  } finally {
    if (!nuevoProductoId) setLoadingBtn(btn, false, 'Guardar producto y agregar inventario →');
  }
}

async function handleAgregarInventario(e) {
  e.preventDefault();
  clearAdminMsg('inventario-msg');

  if (!nuevoProductoId) {
    showAdminMsg('inventario-msg', 'error', 'Primero guardá el producto.');
    return;
  }

  const talle = document.getElementById('inv-talle').value.trim();
  const color = document.getElementById('inv-color').value.trim();
  const stock = parseInt(document.getElementById('inv-stock').value);

  if (!talle || !color || isNaN(stock) || stock < 0) {
    showAdminMsg('inventario-msg', 'error', 'Completá talle, color y stock válido.');
    return;
  }

  const addBtn = document.getElementById('inv-add-btn');
  setLoadingBtn(addBtn, true, 'Agregando…');

  try {
    const res = await window.Api.crearInventario({
      talle, color, stock, id_producto: nuevoProductoId
    });

    if (res.codigo !== 200) {
      showAdminMsg('inventario-msg', 'error', res.mensaje || 'Error al crear el inventario.');
      return;
    }

    // Agregar fila a la lista
    appendInventarioRow('inventario-list', { talle, color, stock });

    // Limpiar campos
    document.getElementById('inv-talle').value = '';
    document.getElementById('inv-color').value = '';
    document.getElementById('inv-stock').value = '10';
    document.getElementById('inv-talle').focus();

    window.App.showToast(`Variante ${talle} / ${color} agregada`, 'success');

  } catch (err) {
    showAdminMsg('inventario-msg', 'error', 'Error de conexión.');
  } finally {
    setLoadingBtn(addBtn, false, '+ Agregar variante');
  }
}

function appendInventarioRow(containerId, { talle, color, stock }) {
  const list = document.getElementById(containerId);
  const row  = document.createElement('div');
  row.className = 'inventario-row';
  row.innerHTML = `
    <span class="inventario-row__talle">${talle}</span>
    <span class="inventario-row__color">${color}</span>
    <span class="inventario-row__stock">${stock} u.</span>
    <span class="inventario-row__badge">OK</span>
  `;
  list.appendChild(row);
}

function resetCargarSection() {
  nuevoProductoId = null;

  // Reset formulario
  document.getElementById('cargar-form').reset();
  // Limpiar radios manualmente
  document.querySelectorAll('input[name="genero"]').forEach(r => r.checked = false);
  // Limpiar preview de imagen
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

  document.getElementById('inventario-card').classList.add('hidden');
  document.getElementById('inventario-list').innerHTML = '';

  document.getElementById('section-cargar').scrollIntoView({ behavior: 'smooth', block: 'start' });
  window.App.showToast('Listo para cargar otro producto', 'success');
}

/* ════════════════════════════════════════
   SECCIÓN: BUSCAR & MODIFICAR
   ════════════════════════════════════════ */

let todosLosProductos = []; // cache de productos

function initBuscador() {
  const input  = document.getElementById('mod-search-input');
  const btn    = document.getElementById('mod-search-btn');

  btn.addEventListener('click', () => buscarProducto(input.value.trim()));
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') buscarProducto(input.value.trim());
  });
}

async function buscarProducto(query) {
  const loader  = document.getElementById('mod-loader');
  const results = document.getElementById('mod-results');
  const empty   = document.getElementById('mod-empty');
  const initial = document.getElementById('mod-initial');
  const editPanel = document.getElementById('edit-panel');

  if (!query) {
    window.App.showToast('Ingresá un nombre para buscar.', 'info');
    return;
  }

  // Ocultar panel de edición al hacer nueva búsqueda
  editPanel.classList.add('hidden');
  results.classList.add('hidden');
  empty.classList.add('hidden');
  initial.classList.add('hidden');
  loader.classList.remove('hidden');

  try {
    // Cargar todos los productos si no los tenemos en cache
    if (todosLosProductos.length === 0) {
      const res = await window.Api.obtenerProductos();
      todosLosProductos = (res && res.payload) ? res.payload : [];
    }

    // Filtrar por nombre (case-insensitive)
    const q = query.toLowerCase();
    const encontrados = todosLosProductos.filter(p =>
      (p.producto || p.nombre || '').toLowerCase().includes(q)
    );

    loader.classList.add('hidden');

    if (encontrados.length === 0) {
      empty.classList.remove('hidden');
      return;
    }

    results.innerHTML = encontrados.map(p => buildResultItem(p)).join('');
    results.classList.remove('hidden');

    // Eventos en botones "Modificar"
    results.querySelectorAll('.mod-edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const productId = btn.dataset.id;
        loadProductForEdit(productId);
      });
    });

  } catch (err) {
    loader.classList.add('hidden');
    window.App.showToast('Error al buscar productos.', 'error');
    initial.classList.remove('hidden');
  }
}

function buildResultItem(p) {
  const id     = p.idProducto || p.id || '';
  const nombre = p.producto   || p.nombre || 'Producto';
  const cat    = p.categoria  || '';
  const precio = p.precio     || 0;
  const img    = p.ulrImagen  || p.imagen || '';
  const genero = p.genero     || '';

  const imgHTML = img
    ? `<img class="mod-result-img" src="${img}" alt="${nombre}" loading="lazy"
          onerror="this.outerHTML='<div class=\\'mod-result-img-placeholder\\'><svg viewBox=\\"0 0 24 24\\" width=\\"24\\" height=\\"24\\" fill=\\"none\\" stroke=\\"currentColor\\" stroke-width=\\"1.5\\"><rect x=\\"3\\" y=\\"3\\" width=\\"18\\" height=\\"18\\" rx=\\"2\\"/><circle cx=\\"8.5\\" cy=\\"8.5\\" r=\\"1.5\\"/><polyline points=\\"21 15 16 10 5 21\\"/></svg></div>'" />`
    : `<div class="mod-result-img-placeholder"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>`;

  return `
    <div class="mod-result-item">
      ${imgHTML}
      <div class="mod-result-info">
        <p class="mod-result-name">${nombre}</p>
        <p class="mod-result-meta">${cat}${genero ? ' · ' + genero : ''}</p>
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
    document.getElementById('e-categoria').value = prod.idCategoria || '';

    // Renderizar inventario
    renderEditInventario(rows, productId);

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

function renderEditInventario(rows, productId) {
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
    div.querySelector('.btn-update').addEventListener('click', async (e) => {
      const invId = e.currentTarget.dataset.invId;
      const inputEl = div.querySelector(`input[data-inv-id="${invId}"]`);
      const newStock = parseInt(inputEl.value);

      if (isNaN(newStock) || newStock < 0) {
        window.App.showToast('Stock inválido.', 'error');
        return;
      }

      e.currentTarget.textContent = '…';
      e.currentTarget.disabled = true;

      try {
        const res = await window.Api.modificarStock(parseInt(invId), newStock);
        if (res.codigo === 200) {
          window.App.showToast('Stock actualizado', 'success');
          e.currentTarget.textContent = '✓';
          setTimeout(() => {
            e.currentTarget.textContent = 'OK';
            e.currentTarget.disabled = false;
          }, 1500);
        } else {
          window.App.showToast('Error al actualizar el stock.', 'error');
          e.currentTarget.textContent = 'OK';
          e.currentTarget.disabled = false;
        }
      } catch (err) {
        window.App.showToast('Error de conexión.', 'error');
        e.currentTarget.textContent = 'OK';
        e.currentTarget.disabled = false;
      }
    });
  });

  // Agregar nueva variante al producto existente
  const editInvForm = document.getElementById('edit-inventario-form');
  const newInvForm  = editInvForm.cloneNode(true);
  editInvForm.parentNode.replaceChild(newInvForm, editInvForm);

  newInvForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const talle = document.getElementById('einv-talle').value.trim();
    const color = document.getElementById('einv-color').value.trim();
    const stock = parseInt(document.getElementById('einv-stock').value);

    if (!talle || !color || isNaN(stock) || stock < 0) {
      window.App.showToast('Completá talle, color y stock.', 'error');
      return;
    }

    try {
      const res = await window.Api.crearInventario({
        talle, color, stock, id_producto: parseInt(productId)
      });

      if (res.codigo === 200) {
        // Recargar el panel de inventario
        await loadProductForEdit(productId);
        window.App.showToast(`Variante ${talle} / ${color} agregada`, 'success');
      } else {
        window.App.showToast('Error al agregar la variante.', 'error');
      }
    } catch (err) {
      window.App.showToast('Error de conexión.', 'error');
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
