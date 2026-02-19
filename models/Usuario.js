// ============================================
// MODELO: USUARIO
// Operaciones para autenticación y usuarios
// ============================================

const { db } = require("../config/database");
const bcrypt = require("bcryptjs");

class Usuario {
  // ============================================
  // OBTENER TODOS LOS USUARIOS
  // ============================================
  static getAll() {
    return new Promise((resolve, reject) => {
      const sql =
        "SELECT id, username, nombre, rol, activo, created_at, last_login FROM usuarios WHERE activo = 1";

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
  // OBTENER USUARIO POR ID
  // ============================================
  static getById(id) {
    return new Promise((resolve, reject) => {
      const sql =
        "SELECT id, username, nombre, rol, activo, created_at, last_login FROM usuarios WHERE id = ?";

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
  // BUSCAR USUARIO POR USERNAME
  // ============================================
  static getByUsername(username) {
    return new Promise((resolve, reject) => {
      const sql = "SELECT * FROM usuarios WHERE username = ? AND activo = 1";

      db.get(sql, [username], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // ============================================
  // AUTENTICAR USUARIO
  // ============================================
  static async authenticate(username, password) {
    try {
      const user = await this.getByUsername(username);

      if (!user) {
        return null;
      }

      const isValid = await bcrypt.compare(password, user.password);

      if (!isValid) {
        return null;
      }

      // Actualizar último login
      await this.updateLastLogin(user.id);

      // Retornar usuario sin contraseña
      delete user.password;
      return user;
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // CREAR USUARIO
  // ============================================
  static async create(username, password, nombre, rol = "admin") {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      return new Promise((resolve, reject) => {
        const sql =
          "INSERT INTO usuarios (username, password, nombre, rol) VALUES (?, ?, ?, ?)";

        db.run(sql, [username, hashedPassword, nombre, rol], function (err) {
          if (err) {
            reject(err);
          } else {
            resolve({
              id: this.lastID,
              username,
              nombre,
              rol,
            });
          }
        });
      });
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // ACTUALIZAR USUARIO
  // ============================================
  static update(id, username, nombre, rol) {
    return new Promise((resolve, reject) => {
      const sql =
        "UPDATE usuarios SET username = ?, nombre = ?, rol = ? WHERE id = ?";

      db.run(sql, [username, nombre, rol, id], function (err) {
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
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      return new Promise((resolve, reject) => {
        const sql = "UPDATE usuarios SET password = ? WHERE id = ?";

        db.run(sql, [hashedPassword, id], function (err) {
          if (err) {
            reject(err);
          } else {
            resolve({ changes: this.changes });
          }
        });
      });
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // ACTUALIZAR ÚLTIMO LOGIN
  // ============================================
  static updateLastLogin(id) {
    return new Promise((resolve, reject) => {
      const sql =
        "UPDATE usuarios SET last_login = CURRENT_TIMESTAMP WHERE id = ?";

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
  // ELIMINAR USUARIO (soft delete)
  // ============================================
  static delete(id) {
    return new Promise((resolve, reject) => {
      const sql = "UPDATE usuarios SET activo = 0 WHERE id = ?";

      db.run(sql, [id], function (err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });
    });
  }
}

module.exports = Usuario;
