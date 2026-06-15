/* ============================================================
   LANA & LINO — API Module
   Centraliza todas las llamadas fetch al backend (puerto 4000)
   NOTA: El token se envía SIN prefijo "Bearer " (así lo espera el backend)
   ============================================================ */

// Apuntamos al proxy local (mismo origen), que reenvía al backend en :4000
const API_BASE = '/api';

const Api = {
  /** Helper interno: headers con o sin token */
  _headers(withAuth = false) {
    const headers = { 'Content-Type': 'application/json' };
    if (withAuth) {
      const token = window.Auth.getToken();
      if (token) headers['Authorization'] = token;
    }
    return headers;
  },

  /** Helper interno: fetch + parse + check codigo */
  async _req(url, options = {}) {
    const res = await fetch(`${API_BASE}${url}`, options);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `HTTP ${res.status}`);
    }
    return res.json();
  },

  /* ── AUTH ── */
  async login(email, password) {
    return this._req('/login', {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify({ email, password })
    });
  },

  /* ── USUARIOS ── */
  async registrarUsuario(data) {
    return this._req('/registrarUsuario', {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify(data)
    });
  },

  async obtenerDatosUsuario(id) {
    return this._req(`/obtenerDatosUsuario/${id}`, {
      headers: this._headers(true)
    });
  },

  async modificarUsuario(id, data) {
    return this._req(`/modificarUsuario/${id}`, {
      method: 'POST',
      headers: this._headers(true),
      body: JSON.stringify(data)
    });
  },

  /* ── PRODUCTOS ── */
  async obtenerProductos() {
    return this._req('/obtenerProductos', {
      headers: this._headers()
    });
  },

  async obtenerDatosProducto(id) {
    return this._req(`/obtenerDatosProducto/${id}`, {
      headers: this._headers(false) // no requiere token
    });
  },

  async cargarProducto(data) {
    return this._req('/cargarProducto', {
      method: 'POST',
      headers: this._headers(true),
      body: JSON.stringify(data)
    });
  },

  async modificarStock(id_inventario, stock) {
    return this._req('/modificarStock', {
      method: 'PUT',
      headers: this._headers(true),
      body: JSON.stringify({ id_inventario, stock })
    });
  },

  /* ── CATEGORÍAS ── */
  async obtenerCategorias() {
    return this._req('/obtenerCategorias', {
      headers: this._headers(true)
    });
  },

  async crearCategoria(nombre) {
    return this._req('/crearCategoria', {
      method: 'POST',
      headers: this._headers(true),
      body: JSON.stringify({ nombre })
    });
  },

  /* ── INVENTARIO ── */
  async crearInventario(data) {
    return this._req('/crearInventario', {
      method: 'POST',
      headers: this._headers(true),
      body: JSON.stringify(data)
    });
  },

  /* ── FAVORITOS ── */
  async agregarFavorito(id_producto, id_usuario) {
    return this._req('/agregarFavorito', {
      method: 'POST',
      headers: this._headers(true),
      body: JSON.stringify({ id_producto, id_usuario })
    });
  },

  async obtenerFavoritos(id_usuario) {
    return this._req(`/obtenerFavoritos/${id_usuario}`, {
      headers: this._headers(true)
    });
  },

  async eliminarFavorito(id_usuario, id_producto) {
    return this._req('/eliminarFavorito', {
      method: 'DELETE',
      headers: this._headers(true),
      body: JSON.stringify({ id_usuario, id_producto })
    });
  },

  /* ── CARRITO ── */
  async agregarACarrito(id_inventario, id_usuario) {
    return this._req('/agregarACarrito', {
      method: 'POST',
      headers: this._headers(true),
      body: JSON.stringify({ id_inventario, id_usuario })
    });
  },

  async obtenerProductosCarrito(id_usuario) {
    return this._req(`/obtenerProductosCarrito/${id_usuario}`, {
      headers: this._headers(true)
    });
  },

  async eliminarProductoCarrito(id_usuario, id_inventario) {
    return this._req('/eliminarProductoCarrito', {
      method: 'DELETE',
      headers: this._headers(true),
      body: JSON.stringify({ id_usuario, id_inventario })
    });
  }
};

// Exponer globalmente
window.Api = Api;
