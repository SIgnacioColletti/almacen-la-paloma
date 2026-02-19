// ============================================
// MODELO: PRODUCTO
// Operaciones CRUD para productos
// ============================================

const { db } = require("../config/database");

class Producto {
  // ============================================
  // OBTENER TODOS LOS PRODUCTOS
  // ============================================
  static getAll() {
    return new Promise((resolve, reject) => {
      const sql = `
                SELECT 
                    p.*,
                    c.nombre as categoria_nombre
                FROM productos p
                LEFT JOIN categorias c ON p.categoria_id = c.id
                WHERE p.activo = 1
                ORDER BY p.nombre ASC
            `;

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
  // OBTENER PRODUCTOS POR CATEGORÍA
  // ============================================
  static getByCategory(categoriaId) {
    return new Promise((resolve, reject) => {
      const sql = `
                SELECT 
                    p.*,
                    c.nombre as categoria_nombre
                FROM productos p
                LEFT JOIN categorias c ON p.categoria_id = c.id
                WHERE p.categoria_id = ? AND p.activo = 1
                ORDER BY p.nombre ASC
            `;

      db.all(sql, [categoriaId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // ============================================
  // OBTENER PRODUCTO POR ID
  // ============================================
  static getById(id) {
    return new Promise((resolve, reject) => {
      const sql = `
                SELECT 
                    p.*,
                    c.nombre as categoria_nombre
                FROM productos p
                LEFT JOIN categorias c ON p.categoria_id = c.id
                WHERE p.id = ?
            `;

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
  // BUSCAR PRODUCTOS
  // ============================================
  static search(termino) {
    return new Promise((resolve, reject) => {
      const sql = `
                SELECT 
                    p.*,
                    c.nombre as categoria_nombre
                FROM productos p
                LEFT JOIN categorias c ON p.categoria_id = c.id
                WHERE p.activo = 1 
                AND (
                    p.nombre LIKE ? 
                    OR p.descripcion LIKE ?
                    OR p.codigo_barras LIKE ?
                )
                ORDER BY p.nombre ASC
            `;

      const searchTerm = `%${termino}%`;

      db.all(sql, [searchTerm, searchTerm, searchTerm], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // ============================================
  // CREAR PRODUCTO
  // ============================================
  static create(data) {
    return new Promise((resolve, reject) => {
      const sql = `
                INSERT INTO productos 
                (nombre, descripcion, precio, stock, stock_minimo, categoria_id, codigo_barras, imagen)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;

      const params = [
        data.nombre,
        data.descripcion || null,
        data.precio,
        data.stock || 0,
        data.stock_minimo || 1,
        data.categoria_id || null,
        data.codigo_barras || null,
        data.imagen || null, // ✅ YA INCLUYE IMAGEN
      ];

      db.run(sql, params, function (err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            id: this.lastID,
            ...data,
          });
        }
      });
    });
  }

  // ============================================
  // ACTUALIZAR PRODUCTO
  // ============================================
  static update(id, data) {
    return new Promise((resolve, reject) => {
      const sql = `
                UPDATE productos 
                SET nombre = ?, 
                    descripcion = ?, 
                    precio = ?, 
                    stock = ?, 
                    stock_minimo = ?, 
                    categoria_id = ?, 
                    codigo_barras = ?,
                    imagen = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `;

      const params = [
        data.nombre,
        data.descripcion || null,
        data.precio,
        data.stock,
        data.stock_minimo || 5,
        data.categoria_id || null,
        data.codigo_barras || null,
        data.imagen || null, // ✅ YA INCLUYE IMAGEN
        id,
      ];

      db.run(sql, params, function (err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });
    });
  }

  // ============================================
  // ELIMINAR PRODUCTO (soft delete)
  // ============================================
  static delete(id) {
    return new Promise((resolve, reject) => {
      const sql = "UPDATE productos SET activo = 0 WHERE id = ?";

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
  // ACTUALIZAR STOCK
  // ============================================
  static updateStock(id, cantidad) {
    return new Promise((resolve, reject) => {
      const sql = "UPDATE productos SET stock = stock + ? WHERE id = ?";

      db.run(sql, [cantidad, id], function (err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });
    });
  }

  // ============================================
  // REDUCIR STOCK (para ventas)
  // ============================================
  static reduceStock(id, cantidad) {
    return new Promise((resolve, reject) => {
      const sql =
        "UPDATE productos SET stock = stock - ? WHERE id = ? AND stock >= ?";

      db.run(sql, [cantidad, id, cantidad], function (err) {
        if (err) {
          reject(err);
        } else if (this.changes === 0) {
          reject(new Error("Stock insuficiente"));
        } else {
          resolve({ changes: this.changes });
        }
      });
    });
  }

  // ============================================
  // OBTENER PRODUCTOS CON STOCK BAJO
  // ============================================
  static getLowStock() {
    return new Promise((resolve, reject) => {
      const sql = `
                SELECT 
                    p.*,
                    c.nombre as categoria_nombre
                FROM productos p
                LEFT JOIN categorias c ON p.categoria_id = c.id
                WHERE p.stock <= p.stock_minimo AND p.activo = 1
                ORDER BY p.stock ASC
            `;

      db.all(sql, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }
}

module.exports = Producto;
