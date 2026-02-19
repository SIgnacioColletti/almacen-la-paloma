// ============================================
// RUTAS: AUTENTICACIÓN
// Define rutas para login/logout
// ============================================

const express = require("express");
const router = express.Router();
const AuthController = require("../controllers/authController");
const { authMiddleware } = require("../middlewares/auth");

// ============================================
// RUTAS PÚBLICAS
// ============================================

// POST /api/auth/login - Iniciar sesión
router.post("/login", async (req, res) => {
  try {
    await AuthController.login(req, res);
  } catch (error) {
    console.error("❌ Error en ruta /login:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor",
      error: error.message,
    });
  }
});

// GET /api/auth/check - Verificar sesión
router.get("/check", async (req, res) => {
  try {
    await AuthController.checkSession(req, res);
  } catch (error) {
    console.error("❌ Error en ruta /check:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor",
      error: error.message,
    });
  }
});

// ============================================
// RUTAS PROTEGIDAS
// ============================================

// POST /api/auth/logout - Cerrar sesión
router.post("/logout", authMiddleware, async (req, res) => {
  try {
    await AuthController.logout(req, res);
  } catch (error) {
    console.error("❌ Error en ruta /logout:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor",
      error: error.message,
    });
  }
});

// GET /api/auth/me - Obtener usuario actual
router.get("/me", authMiddleware, async (req, res) => {
  try {
    await AuthController.getCurrentUser(req, res);
  } catch (error) {
    console.error("❌ Error en ruta /me:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor",
      error: error.message,
    });
  }
});

module.exports = router;
