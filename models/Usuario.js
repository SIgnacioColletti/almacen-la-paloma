// ============================================
// MODELO: USUARIO
// Operaciones CRUD para usuarios
// ============================================

const { db } = require("../config/database");
const bcrypt = require("bcryptjs");

class Usuario {
  // ============================================
  // AUTENTICAR USUARIO
  // ============================================
  static authenticate(username, password) {
    return new Promise((resolve, reject) => {
      console.log("🔍 [Usuario.authenticate] Buscando usuario:", username);

      db.get(
        "SELECT * FROM usuarios WHERE username = ? AND activo = 1",
        [username],
        async (err, user) => {
          if (err) {
            console.error("❌ [Usuario.authenticate] Error en BD:", err);
            reject(err);
            return;
          }

          if (!user) {
            console.log("❌ [Usuario.authenticate] Usuario no encontrado");
            resolve(null);
            return;
          }

          console.log(
            "✅ [Usuario.authenticate] Usuario encontrado:",
            user.username,
          );

          try {
            // Comparar contraseñas
            const passwordMatch = await bcrypt.compare(password, user.password);

            if (!passwordMatch) {
              console.log("❌ [Usuario.authenticate] Contraseña incorrecta");
              resolve(null);
              return;
            }

            console.log("✅ [Usuario.authenticate] Contraseña correcta");

            // Retornar usuario sin el password
            resolve({
              id: user.id,
              username: user.username,
              nombre: user.nombre,
              email: user.email,
              rol: user.rol,
            });
          } catch (error) {
            console.error(
              "❌ [Usuario.authenticate] Error comparando password:",
              error,
            );
            reject(error);
          }
        },
      );
    });
  }

  // ============================================
  // OBTENER TODOS LOS USUARIOS
  // ============================================
  static getAll() {
    return new Promise((resolve, reject) => {
      db.all(
        "SELECT id, username, nombre, email, rol, activo FROM usuarios",
        [],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        },
      );
    });
  }

  // ============================================
  // OBTENER USUARIO POR ID
  // ============================================
  static getById(id) {
    return new Promise((resolve, reject) => {
      db.get(
        "SELECT id, username, nombre, email, rol, activo FROM usuarios WHERE id = ?",
        [id],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        },
      );
    });
  }

  // ============================================
  // CREAR USUARIO
  // ============================================
  static async create(data) {
    return new Promise(async (resolve, reject) => {
      try {
        // Hash de la contraseña
        const passwordHash = await bcrypt.hash(data.password, 10);

        db.run(
          `INSERT INTO usuarios (username, password, nombre, email, rol, activo) 
           VALUES (?, ?, ?, ?, ?, 1)`,
          [
            data.username,
            passwordHash,
            data.nombre || null,
            data.email || null,
            data.rol || "vendedor",
          ],
          function (err) {
            if (err) {
              reject(err);
            } else {
              resolve({
                id: this.lastID,
                username: data.username,
                nombre: data.nombre,
                email: data.email,
                rol: data.rol,
              });
            }
          },
        );
      } catch (error) {
        reject(error);
      }
    });
  }

  // ============================================
  // ACTUALIZAR USUARIO
  // ============================================
  static update(id, data) {
    return new Promise((resolve, reject) => {
      let query = "UPDATE usuarios SET ";
      const params = [];
      const updates = [];

      if (data.nombre !== undefined) {
        updates.push("nombre = ?");
        params.push(data.nombre);
      }
      if (data.email !== undefined) {
        updates.push("email = ?");
        params.push(data.email);
      }
      if (data.rol !== undefined) {
        updates.push("rol = ?");
        params.push(data.rol);
      }
      if (data.activo !== undefined) {
        updates.push("activo = ?");
        params.push(data.activo);
      }

      updates.push("updated_at = CURRENT_TIMESTAMP");
      query += updates.join(", ") + " WHERE id = ?";
      params.push(id);

      db.run(query, params, function (err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });
    });
  }

  // ============================================
  // CAMBIAR CONTRASEÑA
  // ============================================
  static async changePassword(id, newPassword) {
    return new Promise(async (resolve, reject) => {
      try {
        const passwordHash = await bcrypt.hash(newPassword, 10);

        db.run(
          "UPDATE usuarios SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
          [passwordHash, id],
          function (err) {
            if (err) {
              reject(err);
            } else {
              resolve({ changes: this.changes });
            }
          },
        );
      } catch (error) {
        reject(error);
      }
    });
  }

  // ============================================
  // ELIMINAR USUARIO (soft delete)
  // ============================================
  static delete(id) {
    return new Promise((resolve, reject) => {
      db.run(
        "UPDATE usuarios SET activo = 0 WHERE id = ?",
        [id],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve({ changes: this.changes });
          }
        },
      );
    });
  }
}

module.exports = Usuario;
