// ============================================
// RUTAS: CATEGORÍAS
// Define todas las rutas para categorías
// ============================================

const express = require("express");
const router = express.Router();
const CategoriasController = require("../controllers/categoriasController");
const { authMiddleware } = require("../middlewares/auth");

// ============================================
// RUTAS PÚBLICAS
// ============================================

// GET /api/categorias - Listar todas las categorías
router.get("/", CategoriasController.listar);

// GET /api/categorias/:id - Obtener una categoría específica
router.get("/:id", CategoriasController.obtenerPorId);

// ============================================
// RUTAS PROTEGIDAS
// ============================================

// POST /api/categorias - Crear categoría
router.post("/", authMiddleware, CategoriasController.crear);

// PUT /api/categorias/:id - Actualizar categoría
router.put("/:id", authMiddleware, CategoriasController.actualizar);

// DELETE /api/categorias/:id - Eliminar categoría
router.delete("/:id", authMiddleware, CategoriasController.eliminar);

module.exports = router;
