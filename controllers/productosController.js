// ============================================
// CONTROLADOR: PRODUCTOS
// Lógica de negocio para productos
// ============================================

const Producto = require("../models/Producto");

class ProductosController {
  // ============================================
  // LISTAR TODOS LOS PRODUCTOS
  // ============================================
  static async listar(req, res) {
    try {
      const productos = await Producto.getAll();
      res.json({
        success: true,
        data: productos,
        total: productos.length,
      });
    } catch (error) {
      console.error("Error al listar productos:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener productos",
        error: error.message,
      });
    }
  }

  // ============================================
  // OBTENER PRODUCTO POR ID
  // ============================================
  static async obtenerPorId(req, res) {
    try {
      const { id } = req.params;
      const producto = await Producto.getById(id);

      if (!producto) {
        return res.status(404).json({
          success: false,
          message: "Producto no encontrado",
        });
      }

      res.json({
        success: true,
        data: producto,
      });
    } catch (error) {
      console.error("Error al obtener producto:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener producto",
        error: error.message,
      });
    }
  }

  // ============================================
  // OBTENER PRODUCTOS POR CATEGORÍA
  // ============================================
  static async listarPorCategoria(req, res) {
    try {
      const { categoriaId } = req.params;
      const productos = await Producto.getByCategory(categoriaId);

      res.json({
        success: true,
        data: productos,
        total: productos.length,
      });
    } catch (error) {
      console.error("Error al listar productos por categoría:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener productos",
        error: error.message,
      });
    }
  }

  // ============================================
  // BUSCAR PRODUCTOS
  // ============================================
  static async buscar(req, res) {
    try {
      const { q } = req.query;

      if (!q || q.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Debe proporcionar un término de búsqueda",
        });
      }

      const productos = await Producto.search(q);

      res.json({
        success: true,
        data: productos,
        total: productos.length,
        termino: q,
      });
    } catch (error) {
      console.error("Error al buscar productos:", error);
      res.status(500).json({
        success: false,
        message: "Error al buscar productos",
        error: error.message,
      });
    }
  } // ============================================
  // SUBIR IMAGEN DE PRODUCTO
  // ============================================
  static subirImagen(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No se recibió ninguna imagen",
        });
      }

      // Devolver la ruta de la imagen
      const imagenUrl = `/uploads/productos/${req.file.filename}`;

      res.json({
        success: true,
        imagen: imagenUrl,
        message: "Imagen subida exitosamente",
      });
    } catch (error) {
      console.error("Error subiendo imagen:", error);
      res.status(500).json({
        success: false,
        message: "Error al subir la imagen",
        error: error.message,
      });
    }
  }

  // ============================================
  // CREAR PRODUCTO
  // ============================================
  static async crear(req, res) {
    try {
      const {
        nombre,
        descripcion,
        precio,
        stock,
        stock_minimo,
        categoria_id,
        codigo_barras,
        imagen,
      } = req.body;

      // Validaciones
      if (!nombre || !precio) {
        return res.status(400).json({
          success: false,
          message: "Nombre y precio son obligatorios",
        });
      }

      if (precio <= 0) {
        return res.status(400).json({
          success: false,
          message: "El precio debe ser mayor a 0",
        });
      }

      const nuevoProducto = await Producto.create({
        nombre,
        descripcion,
        precio: parseFloat(precio),
        stock: parseInt(stock) || 0,
        stock_minimo: parseInt(stock_minimo) || 5,
        categoria_id: categoria_id || null,
        codigo_barras: codigo_barras || null,
        imagen: imagen || null,
      });

      res.status(201).json({
        success: true,
        message: "Producto creado exitosamente",
        data: nuevoProducto,
      });
    } catch (error) {
      console.error("Error al crear producto:", error);

      // Manejar error de código de barras duplicado
      if (error.message.includes("UNIQUE constraint failed")) {
        return res.status(400).json({
          success: false,
          message: "El código de barras ya existe",
        });
      }

      res.status(500).json({
        success: false,
        message: "Error al crear producto",
        error: error.message,
      });
    }
  }

  // ============================================
  // ACTUALIZAR PRODUCTO
  // ============================================
  static async actualizar(req, res) {
    try {
      const { id } = req.params;
      const {
        nombre,
        descripcion,
        precio,
        stock,
        stock_minimo,
        categoria_id,
        codigo_barras,
        imagen,
      } = req.body;

      // Verificar que el producto existe
      const productoExistente = await Producto.getById(id);
      if (!productoExistente) {
        return res.status(404).json({
          success: false,
          message: "Producto no encontrado",
        });
      }

      // Validaciones
      if (!nombre || !precio) {
        return res.status(400).json({
          success: false,
          message: "Nombre y precio son obligatorios",
        });
      }

      if (precio <= 0) {
        return res.status(400).json({
          success: false,
          message: "El precio debe ser mayor a 0",
        });
      }

      await Producto.update(id, {
        nombre,
        descripcion,
        precio: parseFloat(precio),
        stock: parseInt(stock) || 0,
        stock_minimo: parseInt(stock_minimo) || 5,
        categoria_id: categoria_id || null,
        codigo_barras: codigo_barras || null,
        imagen: imagen || null,
      });

      const productoActualizado = await Producto.getById(id);

      res.json({
        success: true,
        message: "Producto actualizado exitosamente",
        data: productoActualizado,
      });
    } catch (error) {
      console.error("Error al actualizar producto:", error);

      if (error.message.includes("UNIQUE constraint failed")) {
        return res.status(400).json({
          success: false,
          message: "El código de barras ya existe",
        });
      }

      res.status(500).json({
        success: false,
        message: "Error al actualizar producto",
        error: error.message,
      });
    }
  }

  // ============================================
  // ELIMINAR PRODUCTO
  // ============================================
  static async eliminar(req, res) {
    try {
      const { id } = req.params;

      // Verificar que el producto existe
      const producto = await Producto.getById(id);
      if (!producto) {
        return res.status(404).json({
          success: false,
          message: "Producto no encontrado",
        });
      }

      await Producto.delete(id);

      res.json({
        success: true,
        message: "Producto eliminado exitosamente",
      });
    } catch (error) {
      console.error("Error al eliminar producto:", error);
      res.status(500).json({
        success: false,
        message: "Error al eliminar producto",
        error: error.message,
      });
    }
  }

  // ============================================
  // ACTUALIZAR STOCK
  // ============================================
  static async actualizarStock(req, res) {
    try {
      const { id } = req.params;
      const { cantidad } = req.body;

      if (!cantidad || isNaN(cantidad)) {
        return res.status(400).json({
          success: false,
          message: "Debe proporcionar una cantidad válida",
        });
      }

      // Verificar que el producto existe
      const producto = await Producto.getById(id);
      if (!producto) {
        return res.status(404).json({
          success: false,
          message: "Producto no encontrado",
        });
      }

      await Producto.updateStock(id, parseInt(cantidad));

      const productoActualizado = await Producto.getById(id);

      res.json({
        success: true,
        message: "Stock actualizado exitosamente",
        data: productoActualizado,
      });
    } catch (error) {
      console.error("Error al actualizar stock:", error);
      res.status(500).json({
        success: false,
        message: "Error al actualizar stock",
        error: error.message,
      });
    }
  }

  // ============================================
  // OBTENER PRODUCTOS CON STOCK BAJO
  // ============================================
  static async stockBajo(req, res) {
    try {
      const productos = await Producto.getLowStock();

      res.json({
        success: true,
        data: productos,
        total: productos.length,
      });
    } catch (error) {
      console.error("Error al obtener productos con stock bajo:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener productos",
        error: error.message,
      });
    }
  }
}

module.exports = ProductosController;
