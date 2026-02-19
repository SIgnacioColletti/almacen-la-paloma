// ============================================
// MODELO: CATEGORÍA
// Operaciones CRUD para categorías
// ============================================

const { db } = require("../config/database");

class Categoria {
  // ============================================
  // OBTENER TODAS LAS CATEGORÍAS
  // ============================================
  static getAll() {
    return new Promise((resolve, reject) => {
      const sql =
        "SELECT * FROM categorias WHERE activo = 1 ORDER BY nombre ASC";

      db.all(sql, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // ============================================
  // OBTENER CATEGORÍA POR ID
  // ============================================
  static getById(id) {
    return new Promise((resolve, reject) => {
      const sql = "SELECT * FROM categorias WHERE id = ?";

      db.get(sql, [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // ============================================
  // CREAR NUEVA CATEGORÍA
  // ============================================
  static create(nombre, descripcion = null) {
    return new Promise((resolve, reject) => {
      const sql = "INSERT INTO categorias (nombre, descripcion) VALUES (?, ?)";

      db.run(sql, [nombre, descripcion], function (err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            id: this.lastID,
            nombre,
            descripcion,
          });
        }
      });
    });
  }

  // ============================================
  // ACTUALIZAR CATEGORÍA
  // ============================================
  static update(id, nombre, descripcion) {
    return new Promise((resolve, reject) => {
      const sql =
        "UPDATE categorias SET nombre = ?, descripcion = ? WHERE id = ?";

      db.run(sql, [nombre, descripcion, id], function (err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });
    });
  }

  // ============================================
  // ELIMINAR CATEGORÍA (soft delete)
  // ============================================
  static delete(id) {
    return new Promise((resolve, reject) => {
      const sql = "UPDATE categorias SET activo = 0 WHERE id = ?";

      db.run(sql, [id], function (err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });
    });
  }

  // ============================================
  // CONTAR PRODUCTOS POR CATEGORÍA
  // ============================================
  static countProducts(id) {
    return new Promise((resolve, reject) => {
      const sql =
        "SELECT COUNT(*) as total FROM productos WHERE categoria_id = ? AND activo = 1";

      db.get(sql, [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row.total);
        }
      });
    });
  }
}

module.exports = Categoria;
