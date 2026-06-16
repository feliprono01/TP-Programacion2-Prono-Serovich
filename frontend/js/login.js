/* ============================================================
   LANA & LINO — Login.js
   Lógica de autenticación: Login y Registro
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  // Si ya hay sesión activa, redirigir al inicio
  if (window.Auth.isLoggedIn()) {
    window.location.href = 'index.html';
    return;
  }

  // Inicializar tema (sin header completo en esta página)
  initThemeSimple();

  // Tabs
  initTabs();

  // Leer parámetros de URL
  const params = new URLSearchParams(window.location.search);

  // Mostrar aviso si la sesión expiró o el browser fue reiniciado
  if (params.get('expired') === '1') {
    const errEl = document.getElementById('login-error');
    if (errEl) {
      errEl.textContent = 'Tu sesión expiró. Por favor, iniciá sesión nuevamente.';
      errEl.style.display      = 'block';
      errEl.style.backgroundColor = 'rgba(230, 92, 0, .08)';
      errEl.style.borderColor     = 'rgba(230, 92, 0, .30)';
      errEl.style.color           = '#c45000';
    }
  }

  if (params.get('tab') === 'register') {
    switchTab('register');
  }

  // Formularios
  document.getElementById('login-form').addEventListener('submit', handleLogin);
  document.getElementById('register-form').addEventListener('submit', handleRegister);

  // Links "¿No tenés cuenta?" / "¿Ya tenés cuenta?"
  document.querySelectorAll('.auth-tab-switch').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.target));
  });
});

/* ── Tema simplificado (sin header en auth pages) ── */
function initThemeSimple() {
  const saved = localStorage.getItem('ll_theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);

  const btn = document.getElementById('theme-toggle');
  if (!btn) return;

  const moonSVG = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
  const sunSVG  = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;

  btn.innerHTML = saved === 'dark' ? sunSVG : moonSVG;
  btn.title = saved === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';

  btn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('ll_theme', next);
    btn.innerHTML = next === 'dark' ? sunSVG : moonSVG;
    btn.title = next === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
  });
}

/* ── Tabs ── */
function initTabs() {
  document.getElementById('tab-login').addEventListener('click', () => switchTab('login'));
  document.getElementById('tab-register').addEventListener('click', () => switchTab('register'));
}

function switchTab(target) {
  const panels = { login: 'panel-login', register: 'panel-register' };
  const tabs   = { login: 'tab-login',   register: 'tab-register'   };

  // Actualizar tabs
  Object.keys(tabs).forEach(key => {
    const tab = document.getElementById(tabs[key]);
    tab.classList.toggle('active', key === target);
    tab.setAttribute('aria-selected', key === target ? 'true' : 'false');
  });

  // Mostrar/ocultar panels
  Object.keys(panels).forEach(key => {
    document.getElementById(panels[key]).classList.toggle('hidden', key !== target);
  });

  // Actualizar título de la página
  document.title = target === 'login'
    ? 'Lana & Lino — Iniciar sesión'
    : 'Lana & Lino — Crear cuenta';

  // Limpiar errores
  clearError('login-error');
  clearError('register-error');
}

/* ── LOGIN ── */
async function handleLogin(e) {
  e.preventDefault();
  clearError('login-error');

  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  // Validación básica
  if (!email || !password) {
    showError('login-error', 'Completá todos los campos.');
    return;
  }

  const submitBtn = document.getElementById('login-submit');
  setLoading(submitBtn, true, 'Iniciando sesión…');

  try {
    const res = await window.Api.login(email, password);

    if (res.codigo !== 200 || !res.payload || res.payload.length === 0) {
      showError('login-error', res.mensaje || 'Email o contraseña incorrectos.');
      return;
    }

    // Guardar sesión
    const user = res.payload[0];
    window.Auth.save({
      token   : res.jwt,
      id      : user.id_usuario,
      nombre  : user.nombre,
      apellido: user.apellido,
      rol     : user.rol,
    });

    // Redirigir
    const redirect = new URLSearchParams(window.location.search).get('redirect') || 'index.html';
    window.location.href = redirect;

  } catch (err) {
    showError('login-error', 'Error de conexión. Verificá que el servidor esté activo.');
  } finally {
    setLoading(submitBtn, false, 'Iniciar sesión');
  }
}

/* ── REGISTRO ── */
async function handleRegister(e) {
  e.preventDefault();
  clearError('register-error');

  const nombre    = document.getElementById('reg-nombre').value.trim();
  const apellido  = document.getElementById('reg-apellido').value.trim();
  const email     = document.getElementById('reg-email').value.trim();
  const telefono  = document.getElementById('reg-telefono').value.trim();
  const direccion = document.getElementById('reg-direccion').value.trim();
  const password  = document.getElementById('reg-password').value;

  // Validaciones
  if (!nombre || !apellido || !email || !telefono || !direccion || !password) {
    showError('register-error', 'Completá todos los campos.');
    return;
  }

  if (password.length < 6 || password.length > 20) {
    showError('register-error', 'La contraseña debe tener entre 6 y 20 caracteres.');
    return;
  }

  if (!isValidEmail(email)) {
    showError('register-error', 'Ingresá un email válido.');
    return;
  }

  const submitBtn = document.getElementById('register-submit');
  setLoading(submitBtn, true, 'Creando cuenta…');

  try {
    const res = await window.Api.registrarUsuario({
      nombre,
      apellido,
      email,
      telefono,
      direccion,
      password,
      rol: 'user',
    });

    if (res.codigo !== 200) {
      showError('register-error', res.mensaje || 'Error al registrar el usuario.');
      return;
    }

    // Registro exitoso → hacer login automáticamente
    const loginRes = await window.Api.login(email, password);

    if (loginRes.codigo === 200 && loginRes.payload && loginRes.payload.length > 0) {
      const user = loginRes.payload[0];
      window.Auth.save({
        token   : loginRes.jwt,
        id      : user.id_usuario,
        nombre  : user.nombre,
        apellido: user.apellido,
        rol     : user.rol,
      });
      window.location.href = 'index.html';
    } else {
      // Registro OK pero login falló → ir al tab de login
      switchTab('login');
      // Pre-llenar email
      document.getElementById('login-email').value = email;
      showSuccess('login-error', '¡Cuenta creada! Ahora podés iniciar sesión.');
    }

  } catch (err) {
    showError('register-error', 'Error de conexión. Verificá que el servidor esté activo.');
  } finally {
    setLoading(submitBtn, false, 'Crear cuenta');
  }
}

/* ── Helpers UI ── */
function showError(elementId, message) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = message;
  el.style.display = 'block';
  el.style.backgroundColor = 'rgba(211, 0, 5, .08)';
  el.style.borderColor = 'rgba(211, 0, 5, .25)';
  el.style.color = 'var(--color-disabled)';
}

function showSuccess(elementId, message) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = message;
  el.style.display = 'block';
  el.style.backgroundColor = 'rgba(0, 125, 72, .08)';
  el.style.borderColor = 'rgba(0, 125, 72, .25)';
  el.style.color = 'var(--color-success)';
}

function clearError(elementId) {
  const el = document.getElementById(elementId);
  if (el) el.style.display = 'none';
}

function setLoading(btn, loading, text) {
  btn.disabled = loading;
  btn.textContent = text;
  btn.style.opacity = loading ? '0.7' : '1';
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
