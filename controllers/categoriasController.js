// ============================================
// CONTROLADOR: CATEGORÍAS
// Lógica de negocio para categorías
// ============================================

const Categoria = require("../models/Categoria");

class CategoriasController {
  // ============================================
  // LISTAR TODAS LAS CATEGORÍAS
  // ============================================
  static async listar(req, res) {
    try {
      const categorias = await Categoria.getAll();
      res.json({
        success: true,
        data: categorias,
        total: categorias.length,
      });
    } catch (error) {
      console.error("Error al listar categorías:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener categorías",
        error: error.message,
      });
    }
  }

  // ============================================
  // OBTENER CATEGORÍA POR ID
  // ============================================
  static async obtenerPorId(req, res) {
    try {
      const { id } = req.params;
      const categoria = await Categoria.getById(id);

      if (!categoria) {
        return res.status(404).json({
          success: false,
          message: "Categoría no encontrada",
        });
      }

      // Contar productos de la categoría
      const totalProductos = await Categoria.countProducts(id);

      res.json({
        success: true,
        data: {
          ...categoria,
          total_productos: totalProductos,
        },
      });
    } catch (error) {
      console.error("Error al obtener categoría:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener categoría",
        error: error.message,
      });
    }
  }

  // ============================================
  // CREAR CATEGORÍA
  // ============================================
  static async crear(req, res) {
    try {
      const { nombre, descripcion } = req.body;

      // Validación
      if (!nombre || nombre.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "El nombre es obligatorio",
        });
      }

      const nuevaCategoria = await Categoria.create(
        nombre.trim(),
        descripcion || null,
      );

      res.status(201).json({
        success: true,
        message: "Categoría creada exitosamente",
        data: nuevaCategoria,
      });
    } catch (error) {
      console.error("Error al crear categoría:", error);

      if (error.message.includes("UNIQUE constraint failed")) {
        return res.status(400).json({
          success: false,
          message: "Ya existe una categoría con ese nombre",
        });
      }

      res.status(500).json({
        success: false,
        message: "Error al crear categoría",
        error: error.message,
      });
    }
  }

  // ============================================
  // ACTUALIZAR CATEGORÍA
  // ============================================
  static async actualizar(req, res) {
    try {
      const { id } = req.params;
      const { nombre, descripcion } = req.body;

      // Verificar que la categoría existe
      const categoriaExistente = await Categoria.getById(id);
      if (!categoriaExistente) {
        return res.status(404).json({
          success: false,
          message: "Categoría no encontrada",
        });
      }

      // Validación
      if (!nombre || nombre.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "El nombre es obligatorio",
        });
      }

      await Categoria.update(id, nombre.trim(), descripcion || null);

      const categoriaActualizada = await Categoria.getById(id);

      res.json({
        success: true,
        message: "Categoría actualizada exitosamente",
        data: categoriaActualizada,
      });
    } catch (error) {
      console.error("Error al actualizar categoría:", error);

      if (error.message.includes("UNIQUE constraint failed")) {
        return res.status(400).json({
          success: false,
          message: "Ya existe una categoría con ese nombre",
        });
      }

      res.status(500).json({
        success: false,
        message: "Error al actualizar categoría",
        error: error.message,
      });
    }
  }

  // ============================================
  // ELIMINAR CATEGORÍA
  // ============================================
  static async eliminar(req, res) {
    try {
      const { id } = req.params;

      // Verificar que la categoría existe
      const categoria = await Categoria.getById(id);
      if (!categoria) {
        return res.status(404).json({
          success: false,
          message: "Categoría no encontrada",
        });
      }

      // Verificar si tiene productos asociados
      const totalProductos = await Categoria.countProducts(id);
      if (totalProductos > 0) {
        return res.status(400).json({
          success: false,
          message: `No se puede eliminar. La categoría tiene ${totalProductos} producto(s) asociado(s)`,
        });
      }

      await Categoria.delete(id);

      res.json({
        success: true,
        message: "Categoría eliminada exitosamente",
      });
    } catch (error) {
      console.error("Error al eliminar categoría:", error);
      res.status(500).json({
        success: false,
        message: "Error al eliminar categoría",
        error: error.message,
      });
    }
  }
}

module.exports = CategoriasController;
