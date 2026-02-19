// ============================================
// MIDDLEWARE: AUTENTICACIÓN
// Protege rutas que requieren login
// ============================================

const authMiddleware = (req, res, next) => {
  // Verificar si existe sesión activa
  if (req.session && req.session.user) {
    // Usuario autenticado, continuar
    return next();
  }

  // No autenticado, retornar error
  return res.status(401).json({
    success: false,
    message: "No autorizado. Debe iniciar sesión.",
    redirectTo: "/admin/login",
  });
};

// Middleware opcional: verificar si ya está logueado
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    // Ya está logueado
    req.isAuthenticated = true;
    req.user = req.session.user;
  } else {
    req.isAuthenticated = false;
    req.user = null;
  }
  next();
};

module.exports = {
  authMiddleware,
  isAuthenticated,
};
