// ============================================
// RUTAS: VENTAS
// Define todas las rutas para ventas
// ============================================

const express = require("express");
const router = express.Router();
const VentasController = require("../controllers/ventasController");
const { authMiddleware } = require("../middlewares/auth");

// ============================================
// TODAS LAS RUTAS REQUIEREN AUTENTICACIÓN
// ============================================

// GET /api/ventas - Listar ventas
router.get("/", authMiddleware, VentasController.listar);

// GET /api/ventas/totales-hoy - Totales del día
router.get("/totales-hoy", authMiddleware, VentasController.totalesHoy);

// GET /api/ventas/por-metodo - Totales por método de pago
router.get("/por-metodo", authMiddleware, VentasController.totalesPorMetodo);

// GET /api/ventas/por-fecha - Ventas por fecha
router.get("/por-fecha", authMiddleware, VentasController.obtenerPorFecha);

// GET /api/ventas/:id - Obtener venta específica
router.get("/:id", authMiddleware, VentasController.obtenerPorId);

// POST /api/ventas - Registrar nueva venta
router.post("/", authMiddleware, VentasController.registrar);

module.exports = router;
