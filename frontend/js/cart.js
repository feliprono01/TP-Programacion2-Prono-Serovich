/* ============================================================
   LANA & LINO — Cart.js
   Carrito de compras y pantalla de pago
   ============================================================ */

let cartItems = [];

/* ═══════════════════════════════════════════
   INICIALIZACIÓN
═══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async () => {
  // Redirigir si no está logueado
  if (!window.Auth.isLoggedIn()) {
    window.location.href = 'login.html?redirect=carrito.html';
    return;
  }

  await loadCart();
  bindPaymentEvents();
});

/* ═══════════════════════════════════════════
   CARGAR CARRITO
═══════════════════════════════════════════ */
async function loadCart() {
  const loader = document.getElementById('cart-loader');
  const listEl = document.getElementById('cart-items-list');
  const emptyEl = document.getElementById('cart-empty');
  const summaryEl = document.getElementById('cart-summary');

  try {
    const idUsuario = window.Auth.getUserId();
    const res = await window.Api.obtenerProductosCarrito(idUsuario);
    cartItems = res.payload || [];

    loader.style.display = 'none';

    if (cartItems.length === 0) {
      // Colapsar el grid y mostrar vacío centrado en toda la pantalla
      document.querySelector('.cart-page-layout').style.display = 'block';
      document.getElementById('cart-summary').style.display = 'none';
      emptyEl.classList.remove('hidden');
      document.getElementById('cart-item-count').textContent = '';
      return;
    }

    renderCartItems(listEl);
    renderSummary();

  } catch (err) {
    loader.style.display = 'none';
    listEl.innerHTML = `
      <div class="empty-state">
        <p class="empty-state__title">Error al cargar el carrito</p>
        <p class="empty-state__subtitle">Verificá tu conexión e intentá de nuevo.</p>
        <button class="btn btn-ghost" onclick="location.reload()">Reintentar</button>
      </div>`;
  }
}

/* ═══════════════════════════════════════════
   RENDERIZADO
═══════════════════════════════════════════ */
/* ── Helper: reemplaza imagen rota con placeholder ── */
function cartImgFallback(el) {
  el.outerHTML = `<div class="cart-item__img-placeholder">
    <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
  </div>`;
}

function renderCartItems(container) {
  const count = document.getElementById('cart-item-count');
  count.textContent = `(${cartItems.length} ${cartItems.length === 1 ? 'producto' : 'productos'})`;

  container.innerHTML = cartItems.map((item, idx) => `
    <div class="cart-item" data-inventario="${item.idInventario}" data-idx="${idx}">

      <!-- Imagen -->
      ${item.urlImagen
        ? `<img class="cart-item__img" src="${item.urlImagen}" alt="${item.producto}"
               loading="lazy" onerror="cartImgFallback(this)">`
        : `<div class="cart-item__img-placeholder">
             <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
           </div>`
      }

      <!-- Info -->
      <div class="cart-item__info">
        <a href="producto.html?id=${item.idProducto}" class="cart-item__name">${item.producto}</a>
        <span class="cart-item__meta">
          Talle: ${item.talle} &nbsp;·&nbsp; Color: ${item.color}
        </span>
        <span class="cart-item__price">${window.App.formatPrice(item.precio)}</span>
      </div>

      <!-- Acciones -->
      <div class="cart-item__actions">
        <span class="cart-item__price">${window.App.formatPrice(item.precio)}</span>
        <button class="cart-item__remove btn-remove-item"
                data-inventario="${item.idInventario}"
                aria-label="Eliminar ${item.producto} del carrito">
          <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          Eliminar
        </button>
      </div>
    </div>
  `).join('');

  // Eventos de eliminar
  container.querySelectorAll('.btn-remove-item').forEach(btn => {
    btn.addEventListener('click', () => handleRemove(parseInt(btn.dataset.inventario), btn));
  });
}

function renderSummary() {
  const total = cartItems.reduce((s, i) => s + Number(i.precio), 0);

  // Líneas por producto
  const linesEl = document.getElementById('summary-lines');
  linesEl.innerHTML = cartItems.map(i => `
    <div class="cart-summary-line">
      <span style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${i.producto}</span>
      <span>${window.App.formatPrice(i.precio)}</span>
    </div>
  `).join('');

  document.getElementById('cart-total').textContent = window.App.formatPrice(total);

  // Habilitar botón de pago
  const payBtn = document.getElementById('btn-go-pay');
  payBtn.disabled = cartItems.length === 0;
  payBtn.addEventListener('click', showPaymentSection);
}

/* ═══════════════════════════════════════════
   ELIMINAR PRODUCTO
═══════════════════════════════════════════ */
async function handleRemove(idInventario, btn) {
  btn.disabled = true;
  btn.style.opacity = '0.5';

  try {
    const idUsuario = window.Auth.getUserId();
    const res = await window.Api.eliminarProductoCarrito(idUsuario, idInventario);

    if (res.codigo === 200) {
      // Quitar del array y re-renderizar
      cartItems = cartItems.filter(i => i.idInventario !== idInventario);

      const listEl = document.getElementById('cart-items-list');
      const emptyEl = document.getElementById('cart-empty');
      const summaryEl = document.getElementById('cart-summary');

      if (cartItems.length === 0) {
        listEl.innerHTML = '';
        emptyEl.classList.remove('hidden');
        summaryEl.style.display = 'none';
        document.getElementById('cart-item-count').textContent = '';
      } else {
        renderCartItems(listEl);
        renderSummary();
      }

      window.App.showToast('Producto eliminado del carrito');
    } else {
      window.App.showToast('Error al eliminar el producto', 'error');
      btn.disabled = false;
      btn.style.opacity = '1';
    }
  } catch (err) {
    window.App.showToast('Error de conexión', 'error');
    btn.disabled = false;
    btn.style.opacity = '1';
  }
}

/* ═══════════════════════════════════════════
   PANTALLA DE PAGO
═══════════════════════════════════════════ */
function showPaymentSection() {
  document.getElementById('cart-section').style.display = 'none';
  const paySection = document.getElementById('payment-section');
  paySection.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Renderizar resumen de productos en pago
  const itemsList = document.getElementById('payment-items-list');
  itemsList.innerHTML = cartItems.map(i => `
    <div class="payment-item-row">
      <div>
        <div class="payment-item-name">${i.producto}</div>
        <div class="payment-item-meta">Talle ${i.talle} · ${i.color}</div>
      </div>
      <span class="payment-item-price">${window.App.formatPrice(i.precio)}</span>
    </div>
  `).join('');

  const total = cartItems.reduce((s, i) => s + Number(i.precio), 0);
  document.getElementById('payment-total').textContent = window.App.formatPrice(total);
}

function bindPaymentEvents() {
  // Volver al carrito
  const backBtn = document.getElementById('btn-back-to-cart');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      document.getElementById('payment-section').classList.add('hidden');
      document.getElementById('cart-section').style.display = '';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Tipo de pago → mostrar/ocultar campos de tarjeta
  const typeSelect = document.getElementById('payment-type');
  const cardFields = document.getElementById('card-fields');
  if (typeSelect) {
    typeSelect.addEventListener('change', () => {
      const needsCard = ['debito', 'credito'].includes(typeSelect.value);
      cardFields.classList.toggle('hidden', !needsCard);

      // Limpiar campos si se ocultan
      if (!needsCard) {
        ['card-number', 'card-expiry', 'card-cvv', 'card-name'].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.value = '';
        });
      }

      validatePayForm();
    });
  }

  // Formatear número de tarjeta con espacios
  const cardNumber = document.getElementById('card-number');
  if (cardNumber) {
    cardNumber.addEventListener('input', () => {
      let v = cardNumber.value.replace(/\D/g, '').slice(0, 16);
      cardNumber.value = v.match(/.{1,4}/g)?.join(' ') || v;
      validatePayForm();
    });
  }

  // Formatear vencimiento MM/AA
  const cardExpiry = document.getElementById('card-expiry');
  if (cardExpiry) {
    cardExpiry.addEventListener('input', () => {
      let v = cardExpiry.value.replace(/\D/g, '').slice(0, 4);
      if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2);
      cardExpiry.value = v;
      validatePayForm();
    });
  }

  // CVV
  const cardCvv = document.getElementById('card-cvv');
  if (cardCvv) {
    cardCvv.addEventListener('input', () => {
      cardCvv.value = cardCvv.value.replace(/\D/g, '').slice(0, 4);
      validatePayForm();
    });
  }

  // Nombre tarjeta
  const cardName = document.getElementById('card-name');
  if (cardName) {
    cardName.addEventListener('input', () => {
      cardName.value = cardName.value.toUpperCase();
      validatePayForm();
    });
  }

  // Submit pago
  const payForm = document.getElementById('payment-form');
  if (payForm) {
    payForm.addEventListener('submit', handlePay);
  }
}

/* ── Validación del formulario de pago ── */
function validatePayForm() {
  const payBtn = document.getElementById('btn-pay');
  const typeVal = document.getElementById('payment-type')?.value;
  const needsCard = ['debito', 'credito'].includes(typeVal);

  if (!typeVal) { payBtn.disabled = true; return; }

  if (needsCard) {
    const num = document.getElementById('card-number')?.value.replace(/\s/g, '');
    const expiry = document.getElementById('card-expiry')?.value;
    const cvv = document.getElementById('card-cvv')?.value;
    const name = document.getElementById('card-name')?.value.trim();

    const valid = num?.length >= 16 &&
      /^\d{2}\/\d{2}$/.test(expiry) &&
      cvv?.length >= 3 &&
      name?.length >= 2;
    payBtn.disabled = !valid;
  } else {
    payBtn.disabled = false;
  }
}

/* ── Procesar pago (simulado) ── */
function handlePay(e) {
  e.preventDefault();
  const payBtn = document.getElementById('btn-pay');
  payBtn.disabled = true;
  payBtn.textContent = 'Procesando…';

  // Simular demora de procesamiento
  setTimeout(async () => {
    const idUsuario = window.Auth.getUserId();
    if (idUsuario && cartItems.length > 0) {
      try {
        // Procesar compra: descontar stock y vaciar carrito por cada item
        for (const item of cartItems) {
          // Obtener el stock actual del producto
          const resProducto = await window.Api.obtenerDatosProducto(item.idProducto);
          if (resProducto && resProducto.codigo === 200 && resProducto.payload) {
            const inventarioData = resProducto.payload.find(i => i.idInventario === item.idInventario);
            if (inventarioData) {
              const stockActual = Number(inventarioData.stock);
              const nuevoStock = stockActual > 0 ? stockActual - 1 : 0;
              // Descontar stock
              await window.Api.modificarStock(item.idInventario, nuevoStock);
            }
          }
          // Eliminar del carrito
          await window.Api.eliminarProductoCarrito(idUsuario, item.idInventario);
        }
        cartItems = [];
        window.dispatchEvent(new CustomEvent('cart-updated')); // Actualizar globito del header
      } catch (err) {
        console.error('Error al vaciar carrito tras el pago:', err);
      }
    }

    const session = window.Auth.get();
    const nombre = session ? session.nombre : 'Cliente';
    document.getElementById('success-name').textContent = nombre;
    document.getElementById('success-overlay').classList.add('open');
  }, 1200);
}
