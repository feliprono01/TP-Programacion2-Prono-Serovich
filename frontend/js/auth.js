/* ============================================================
   LANA & LINO — Auth Module
   Manejo de sesión con localStorage
   ============================================================ */

const AUTH_KEY = 'll_session';

const Auth = {
  /**
   * Guarda los datos de sesión (token + info del usuario)
   * @param {Object} data - { token, id, nombre, apellido, email, rol }
   */
  save(data) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(data));
  },

  /**
   * Devuelve el objeto de sesión crudo o null.
   * Para verificación completa usar isLoggedIn().
   * @returns {Object|null}
   */
  get() {
    const raw = localStorage.getItem(AUTH_KEY);
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  /** Elimina la sesión */
  clear() {
    localStorage.removeItem(AUTH_KEY);
  },

  /**
   * Decodifica el payload del JWT sin verificar la firma.
   * @param {string} token
   * @returns {Object|null}
   */
  _decodeToken(token) {
    try {
      const base64 = token.split('.')[1]
        .replace(/-/g, '+')
        .replace(/_/g, '/');
      return JSON.parse(atob(base64));
    } catch {
      return null;
    }
  },

  /**
   * Verifica si el token JWT almacenado está expirado.
   * Compatible con exp en segundos (estándar) y en milisegundos
   * (el backend usa Date.now() + ms, que produce un número de 13 dígitos).
   * @returns {boolean} true si el token expiró
   */
  isTokenExpired() {
    const session = this.get();
    if (!session?.token) return true;

    const payload = this._decodeToken(session.token);
    if (!payload?.exp) return false; // sin claim exp → tratamos como válido

    // Si exp tiene 13 dígitos es milisegundos, si tiene 10 es segundos
    const expMs = payload.exp > 1e12 ? payload.exp : payload.exp * 1000;
    return Date.now() > expMs;
  },

  /**
   * Verificación completa:
   * 1. ¿Existe sesión en localStorage?
   * 2. ¿El token JWT no expiró?
   */
  isLoggedIn() {
    if (!this.get()) return false;
    if (this.isTokenExpired()) {
      this.clear();
      return false;
    }
    return true;
  },

  /**
   * Expira la sesión y redirige al login con aviso de expiración.
   * Pasa la URL actual para redirigir de vuelta después del login.
   */
  expire() {
    this.clear();
    const params = new URLSearchParams({ expired: '1' });
    const current = window.location.href;
    if (!current.includes('login.html')) {
      params.set('redirect', current);
    }
    window.location.href = `login.html?${params.toString()}`;
  },

  /** ¿El usuario logueado es admin? */
  isAdmin() {
    const s = this.get();
    return this.isLoggedIn() && s?.rol === 'admin';
  },

  /** Devuelve el token JWT o null */
  getToken() {
    const s = this.get();
    return s ? s.token : null;
  },

  /** Devuelve el id del usuario o null */
  getUserId() {
    const s = this.get();
    return s ? s.id : null;
  },

  /** Devuelve el nombre completo del usuario */
  getUserName() {
    const s = this.get();
    if (!s) return '';
    return `${s.nombre || ''} ${s.apellido || ''}`.trim();
  }
};

// Exponer globalmente
window.Auth = Auth;
