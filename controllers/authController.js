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

      console.log("🔐 Intento de login:", username);
      console.log("📦 Body recibido:", {
        username,
        password: password ? "***" : "vacío",
      });

      // Validaciones
      if (!username || !password) {
        console.log("❌ Datos incompletos");
        return res.status(400).json({
          success: false,
          message: "Usuario y contraseña son requeridos",
        });
      }

      // Autenticar usuario
      console.log("🔍 Buscando usuario en la base de datos...");
      const user = await Usuario.authenticate(username, password);

      if (!user) {
        console.log("❌ Autenticación fallida para:", username);
        return res.status(401).json({
          success: false,
          message: "Usuario o contraseña incorrectos",
        });
      }

      console.log("✅ Usuario encontrado:", user.username);

      // Crear sesión
      req.session.userId = user.id;
      req.session.username = user.username;
      req.session.rol = user.rol;
      req.session.user = {
        id: user.id,
        username: user.username,
        nombre: user.nombre,
        rol: user.rol,
      };

      console.log("💾 Guardando sesión...");

      // Guardar sesión antes de responder
      req.session.save((err) => {
        if (err) {
          console.error("❌ Error al guardar sesión:", err);
          return res.status(500).json({
            success: false,
            message: "Error al crear sesión",
            error: err.message,
          });
        }

        console.log("✅ Sesión guardada exitosamente");
        console.log("🎫 Session ID:", req.sessionID);

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
      console.error("❌ Error en login:", error);
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
    console.log("🚪 Cerrando sesión para:", req.session?.user?.username);

    req.session.destroy((err) => {
      if (err) {
        console.error("❌ Error al cerrar sesión:", err);
        return res.status(500).json({
          success: false,
          message: "Error al cerrar sesión",
        });
      }

      console.log("✅ Sesión cerrada exitosamente");

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
    console.log("🔍 Verificando sesión...");
    console.log("Session ID:", req.sessionID);
    console.log("Session data:", req.session);

    if (req.session && req.session.user) {
      console.log("✅ Sesión activa para:", req.session.user.username);
      res.json({
        success: true,
        authenticated: true,
        user: req.session.user,
      });
    } else {
      console.log("❌ No hay sesión activa");
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
      console.log("✅ Usuario actual:", req.session.user.username);
      res.json({
        success: true,
        user: req.session.user,
      });
    } else {
      console.log("❌ No hay sesión activa");
      res.status(401).json({
        success: false,
        message: "No hay sesión activa",
      });
    }
  }
}

module.exports = AuthController;
