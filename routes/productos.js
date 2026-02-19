// ============================================
// RUTAS: PRODUCTOS
// Define todas las rutas para productos
// ============================================

const express = require("express");
const router = express.Router();
const ProductosController = require("../controllers/productosController");
const { authMiddleware } = require("../middlewares/auth");
const upload = require("../config/multer");

// ============================================
// RUTAS PÚBLICAS (sin autenticación)
// ============================================
// POST /api/productos/upload-imagen - Subir imagen (debe ir ANTES de las otras rutas)
router.post(
  "/upload-imagen",
  authMiddleware,
  upload.single("imagen"),
  ProductosController.subirImagen,
);
// GET /api/productos - Listar todos los productos
router.get("/", ProductosController.listar);

// GET /api/productos/buscar?q=termino - Buscar productos
router.get("/buscar", ProductosController.buscar);

// GET /api/productos/stock-bajo - Productos con stock bajo
router.get("/stock-bajo", ProductosController.stockBajo);

// GET /api/productos/categoria/:categoriaId - Productos por categoría
router.get("/categoria/:categoriaId", ProductosController.listarPorCategoria);

// GET /api/productos/:id - Obtener un producto específico
router.get("/:id", ProductosController.obtenerPorId);

// ============================================
// RUTAS PROTEGIDAS (requieren autenticación)
// ============================================

// POST /api/productos - Crear producto
router.post("/", authMiddleware, ProductosController.crear);

// PUT /api/productos/:id - Actualizar producto
router.put("/:id", authMiddleware, ProductosController.actualizar);

// DELETE /api/productos/:id - Eliminar producto
router.delete("/:id", authMiddleware, ProductosController.eliminar);

// PATCH /api/productos/:id/stock - Actualizar stock
router.patch("/:id/stock", authMiddleware, ProductosController.actualizarStock);

module.exports = router;
