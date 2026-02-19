// ============================================
// MODELO: VENTA
// Operaciones para registro de ventas
// ============================================

const { db } = require("../config/database");
const Producto = require("./Producto");

class Venta {
  // ============================================
  // OBTENER TODAS LAS VENTAS
  // ============================================
  static getAll(limit = 100) {
    return new Promise((resolve, reject) => {
      const sql = `
                SELECT 
                    v.*,
                    u.username as usuario_nombre
                FROM ventas v
                LEFT JOIN usuarios u ON v.usuario_id = u.id
                ORDER BY v.fecha DESC
                LIMIT ?
            `;

      db.all(sql, [limit], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // ============================================
  // OBTENER VENTA POR ID CON DETALLE
  // ============================================
  static getById(id) {
    return new Promise((resolve, reject) => {
      const sqlVenta = `
                SELECT 
                    v.*,
                    u.username as usuario_nombre
                FROM ventas v
                LEFT JOIN usuarios u ON v.usuario_id = u.id
                WHERE v.id = ?
            `;

      db.get(sqlVenta, [id], (err, venta) => {
        if (err) {
          reject(err);
          return;
        }

        if (!venta) {
          resolve(null);
          return;
        }

        // Obtener detalle de la venta
        const sqlDetalle = `
                    SELECT 
                        vd.*,
                        p.nombre as producto_nombre
                    FROM ventas_detalle vd
                    LEFT JOIN productos p ON vd.producto_id = p.id
                    WHERE vd.venta_id = ?
                `;

        db.all(sqlDetalle, [id], (err, detalle) => {
          if (err) {
            reject(err);
          } else {
            venta.items = detalle;
            resolve(venta);
          }
        });
      });
    });
  }

  // ============================================
  // CREAR VENTA
  // ============================================
  static async create(ventaData, items, usuarioId = null) {
    return new Promise(async (resolve, reject) => {
      db.serialize(async () => {
        db.run("BEGIN TRANSACTION");

        try {
          // 1. Insertar venta
          const sqlVenta = `
                        INSERT INTO ventas 
                        (total, metodo_pago, usuario_id, cliente_nombre, cliente_telefono, observaciones)
                        VALUES (?, ?, ?, ?, ?, ?)
                    `;

          const ventaId = await new Promise((res, rej) => {
            db.run(
              sqlVenta,
              [
                ventaData.total,
                ventaData.metodo_pago,
                usuarioId,
                ventaData.cliente_nombre || null,
                ventaData.cliente_telefono || null,
                ventaData.observaciones || null,
              ],
              function (err) {
                if (err) rej(err);
                else res(this.lastID);
              },
            );
          });

          // 2. Insertar detalle y actualizar stock
          const sqlDetalle = `
                        INSERT INTO ventas_detalle 
                        (venta_id, producto_id, cantidad, precio_unitario, subtotal)
                        VALUES (?, ?, ?, ?, ?)
                    `;

          for (const item of items) {
            // Insertar detalle
            await new Promise((res, rej) => {
              db.run(
                sqlDetalle,
                [
                  ventaId,
                  item.producto_id,
                  item.cantidad,
                  item.precio_unitario,
                  item.subtotal,
                ],
                (err) => {
                  if (err) rej(err);
                  else res();
                },
              );
            });

            // Reducir stock
            await Producto.reduceStock(item.producto_id, item.cantidad);
          }

          db.run("COMMIT", (err) => {
            if (err) {
              db.run("ROLLBACK");
              reject(err);
            } else {
              resolve({ id: ventaId, ...ventaData });
            }
          });
        } catch (error) {
          db.run("ROLLBACK");
          reject(error);
        }
      });
    });
  }

  // ============================================
  // OBTENER VENTAS POR FECHA
  // ============================================
  static getByDate(fecha) {
    return new Promise((resolve, reject) => {
      const sql = `
                SELECT 
                    v.*,
                    u.username as usuario_nombre
                FROM ventas v
                LEFT JOIN usuarios u ON v.usuario_id = u.id
                WHERE DATE(v.fecha) = DATE(?)
                ORDER BY v.fecha DESC
            `;

      db.all(sql, [fecha], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // ============================================
  // OBTENER VENTAS POR RANGO DE FECHAS
  // ============================================
  static getByDateRange(fechaInicio, fechaFin) {
    return new Promise((resolve, reject) => {
      const sql = `
                SELECT 
                    v.*,
                    u.username as usuario_nombre
                FROM ventas v
                LEFT JOIN usuarios u ON v.usuario_id = u.id
                WHERE DATE(v.fecha) BETWEEN DATE(?) AND DATE(?)
                ORDER BY v.fecha DESC
            `;

      db.all(sql, [fechaInicio, fechaFin], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // ============================================
  // OBTENER TOTALES DEL DÍA
  // ============================================
  static getTotalsToday() {
    return new Promise((resolve, reject) => {
      const sql = `
                SELECT 
                    COUNT(*) as total_ventas,
                    SUM(total) as total_dinero,
                    SUM(CASE WHEN metodo_pago = 'efectivo' THEN total ELSE 0 END) as total_efectivo,
                    SUM(CASE WHEN metodo_pago = 'transferencia' THEN total ELSE 0 END) as total_transferencia
                FROM ventas
                WHERE DATE(fecha) = DATE('now')
            `;

      db.get(sql, [], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // ============================================
  // OBTENER TOTALES POR MÉTODO DE PAGO
  // ============================================
  static getTotalsByPaymentMethod(fecha) {
    return new Promise((resolve, reject) => {
      const sql = `
                SELECT 
                    metodo_pago,
                    COUNT(*) as cantidad,
                    SUM(total) as total
                FROM ventas
                WHERE DATE(fecha) = DATE(?)
                GROUP BY metodo_pago
            `;

      db.all(sql, [fecha], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }
}

module.exports = Venta;
