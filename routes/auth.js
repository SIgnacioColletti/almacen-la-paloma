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
router.post("/login", AuthController.login);

// GET /api/auth/check - Verificar sesión
router.get("/check", AuthController.checkSession);

// ============================================
// RUTAS PROTEGIDAS
// ============================================

// POST /api/auth/logout - Cerrar sesión
router.post("/logout", authMiddleware, AuthController.logout);

// GET /api/auth/me - Obtener usuario actual
router.get("/me", authMiddleware, AuthController.getCurrentUser);

module.exports = router;
