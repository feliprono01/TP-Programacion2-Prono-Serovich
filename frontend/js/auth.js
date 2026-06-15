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
   * Devuelve el objeto de sesión o null si no hay sesión
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

  /** ¿Hay un usuario logueado? */
  isLoggedIn() {
    return !!this.get();
  },

  /** ¿El usuario logueado es admin? */
  isAdmin() {
    const s = this.get();
    return s && s.rol === 'admin';
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
