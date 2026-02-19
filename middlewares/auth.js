// ============================================
// MIDDLEWARE: AUTENTICACIÓN
// Protege rutas que requieren login
// ============================================

const authMiddleware = (req, res, next) => {
  console.log(
    "🔒 [AUTH] Verificando autenticación para:",
    req.method,
    req.path,
  );
  console.log("🔒 [AUTH] Session ID:", req.sessionID);
  console.log("🔒 [AUTH] Session exists:", !!req.session);
  console.log(
    "🔒 [AUTH] Session.user:",
    req.session?.user?.username || "No user",
  );

  // Verificar si existe sesión activa
  if (req.session && req.session.user) {
    console.log("✅ [AUTH] Usuario autenticado:", req.session.user.username);
    // Usuario autenticado, continuar
    return next();
  }

  // No autenticado, retornar error
  console.log("❌ [AUTH] No autorizado - redirigiendo al login");

  return res.status(401).json({
    success: false,
    message: "No autorizado. Debe iniciar sesión.",
    redirectTo: "/admin/login",
  });
};

// Middleware opcional: verificar si ya está logueado
const isAuthenticated = (req, res, next) => {
  console.log("🔍 [IS_AUTH] Verificando estado de autenticación");

  if (req.session && req.session.user) {
    console.log("✅ [IS_AUTH] Usuario ya logueado:", req.session.user.username);
    // Ya está logueado
    req.isAuthenticated = true;
    req.user = req.session.user;
  } else {
    console.log("ℹ️ [IS_AUTH] Usuario no autenticado");
    req.isAuthenticated = false;
    req.user = null;
  }
  next();
};

module.exports = {
  authMiddleware,
  isAuthenticated,
};
