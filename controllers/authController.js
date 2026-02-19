// ============================================
// CONTROLADOR: AUTENTICACIÓN
// Maneja login, logout y verificación de sesión
// ============================================

const Usuario = require("../models/Usuario");

class AuthController {
  // ============================================
  // LOGIN - AUTENTICAR USUARIO
  // ============================================
  static async login(req, res) {
    try {
      const { username, password } = req.body;

      // Validaciones
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: "Usuario y contraseña son requeridos",
        });
      }

      // Autenticar usuario
      const user = await Usuario.authenticate(username, password);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Usuario o contraseña incorrectos",
        });
      }

      // Crear sesión
      req.session.user = {
        id: user.id,
        username: user.username,
        nombre: user.nombre,
        rol: user.rol,
      };

      // Guardar sesión antes de responder
      req.session.save((err) => {
        if (err) {
          console.error("Error al guardar sesión:", err);
          return res.status(500).json({
            success: false,
            message: "Error al crear sesión",
          });
        }

        res.json({
          success: true,
          message: "Login exitoso",
          user: {
            id: user.id,
            username: user.username,
            nombre: user.nombre,
            rol: user.rol,
          },
          redirectTo: "/admin/dashboard",
        });
      });
    } catch (error) {
      console.error("Error en login:", error);
      res.status(500).json({
        success: false,
        message: "Error en el servidor",
        error: error.message,
      });
    }
  }

  // ============================================
  // LOGOUT - CERRAR SESIÓN
  // ============================================
  static logout(req, res) {
    req.session.destroy((err) => {
      if (err) {
        console.error("Error al cerrar sesión:", err);
        return res.status(500).json({
          success: false,
          message: "Error al cerrar sesión",
        });
      }

      res.json({
        success: true,
        message: "Sesión cerrada exitosamente",
        redirectTo: "/admin/login",
      });
    });
  }

  // ============================================
  // VERIFICAR SESIÓN ACTIVA
  // ============================================
  static checkSession(req, res) {
    if (req.session && req.session.user) {
      res.json({
        success: true,
        authenticated: true,
        user: req.session.user,
      });
    } else {
      res.json({
        success: true,
        authenticated: false,
        user: null,
      });
    }
  }

  // ============================================
  // OBTENER USUARIO ACTUAL
  // ============================================
  static getCurrentUser(req, res) {
    if (req.session && req.session.user) {
      res.json({
        success: true,
        user: req.session.user,
      });
    } else {
      res.status(401).json({
        success: false,
        message: "No hay sesión activa",
      });
    }
  }
}

module.exports = AuthController;
