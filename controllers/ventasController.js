// ============================================
// CONTROLADOR: VENTAS
// Lógica de negocio para ventas
// ============================================

const Venta = require("../models/Venta");
const Producto = require("../models/Producto");

class VentasController {
  // ============================================
  // LISTAR TODAS LAS VENTAS
  // ============================================
  static async listar(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 100;
      const ventas = await Venta.getAll(limit);

      res.json({
        success: true,
        data: ventas,
        total: ventas.length,
      });
    } catch (error) {
      console.error("Error al listar ventas:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener ventas",
        error: error.message,
      });
    }
  }

  // ============================================
  // OBTENER VENTA POR ID
  // ============================================
  static async obtenerPorId(req, res) {
    try {
      const { id } = req.params;
      const venta = await Venta.getById(id);

      if (!venta) {
        return res.status(404).json({
          success: false,
          message: "Venta no encontrada",
        });
      }

      res.json({
        success: true,
        data: venta,
      });
    } catch (error) {
      console.error("Error al obtener venta:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener venta",
        error: error.message,
      });
    }
  }

  // ============================================
  // REGISTRAR NUEVA VENTA
  // ============================================
  static async registrar(req, res) {
    try {
      const {
        items,
        metodo_pago,
        cliente_nombre,
        cliente_telefono,
        observaciones,
      } = req.body;
      const usuarioId = req.session.user ? req.session.user.id : null;

      // Validaciones
      if (!items || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Debe agregar al menos un producto",
        });
      }

      if (!metodo_pago) {
        return res.status(400).json({
          success: false,
          message: "Debe seleccionar un método de pago",
        });
      }

      // Validar stock disponible para cada producto
      for (const item of items) {
        const producto = await Producto.getById(item.producto_id);

        if (!producto) {
          return res.status(404).json({
            success: false,
            message: `Producto con ID ${item.producto_id} no encontrado`,
          });
        }

        if (producto.stock < item.cantidad) {
          return res.status(400).json({
            success: false,
            message: `Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stock}, solicitado: ${item.cantidad}`,
          });
        }
      }

      // Calcular total
      let total = 0;
      const itemsConPrecio = [];

      for (const item of items) {
        const producto = await Producto.getById(item.producto_id);
        const subtotal = producto.precio * item.cantidad;

        itemsConPrecio.push({
          producto_id: item.producto_id,
          cantidad: item.cantidad,
          precio_unitario: producto.precio,
          subtotal: subtotal,
        });

        total += subtotal;
      }

      // Crear venta
      const ventaData = {
        total: total,
        metodo_pago: metodo_pago,
        cliente_nombre: cliente_nombre || null,
        cliente_telefono: cliente_telefono || null,
        observaciones: observaciones || null,
      };

      const venta = await Venta.create(ventaData, itemsConPrecio, usuarioId);

      res.status(201).json({
        success: true,
        message: "Venta registrada exitosamente",
        data: venta,
      });
    } catch (error) {
      console.error("Error al registrar venta:", error);

      if (error.message === "Stock insuficiente") {
        return res.status(400).json({
          success: false,
          message: "Stock insuficiente para completar la venta",
        });
      }

      res.status(500).json({
        success: false,
        message: "Error al registrar venta",
        error: error.message,
      });
    }
  }

  // ============================================
  // OBTENER VENTAS POR FECHA
  // ============================================
  static async obtenerPorFecha(req, res) {
    try {
      const { fecha } = req.query;

      if (!fecha) {
        return res.status(400).json({
          success: false,
          message: "Debe proporcionar una fecha",
        });
      }

      const ventas = await Venta.getByDate(fecha);

      res.json({
        success: true,
        data: ventas,
        total: ventas.length,
      });
    } catch (error) {
      console.error("Error al obtener ventas por fecha:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener ventas",
        error: error.message,
      });
    }
  }

  // ============================================
  // OBTENER TOTALES DEL DÍA
  // ============================================
  static async totalesHoy(req, res) {
    try {
      const totales = await Venta.getTotalsToday();

      res.json({
        success: true,
        data: totales,
      });
    } catch (error) {
      console.error("Error al obtener totales:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener totales",
        error: error.message,
      });
    }
  }

  // ============================================
  // OBTENER TOTALES POR MÉTODO DE PAGO
  // ============================================
  static async totalesPorMetodo(req, res) {
    try {
      const { fecha } = req.query;
      const fechaConsulta = fecha || new Date().toISOString().split("T")[0];

      const totales = await Venta.getTotalsByPaymentMethod(fechaConsulta);

      res.json({
        success: true,
        data: totales,
        fecha: fechaConsulta,
      });
    } catch (error) {
      console.error("Error al obtener totales por método:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener totales",
        error: error.message,
      });
    }
  }
}

module.exports = VentasController;
