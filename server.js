// ============================================
// ALMACÉN DE BARRIO - Servidor Principal
// Día 10: Tienda Pública
// ============================================

require("dotenv").config();
const express = require("express");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const path = require("path");
const { db, initDatabase } = require("./config/database");

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === "production";

// ============================================
// MIDDLEWARES
// ============================================

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookies
app.use(cookieParser());

// Sesiones
app.use(
  session({
    secret: process.env.SESSION_SECRET || "almacen_secreto_default",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction, // HTTPS en producción
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24, // 24 horas
      sameSite: isProduction ? "none" : "lax",
    },
  }),
);

// Archivos estáticos
app.use(express.static(path.join(__dirname, "public")));

// Middleware para pasar datos del usuario a todas las vistas
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// ============================================
// RUTAS
// ============================================

// Importar rutas
const authRoutes = require("./routes/auth");
const productosRoutes = require("./routes/productos");
const categoriasRoutes = require("./routes/categorias");
const ventasRoutes = require("./routes/ventas");

// API Routes - DEBEN IR PRIMERO
app.use("/api/auth", authRoutes);
app.use("/api/productos", productosRoutes);
app.use("/api/categorias", categoriasRoutes);
app.use("/api/ventas", ventasRoutes);

// ============================================
// RUTAS DE DEBUG (TEMPORAL - BORRAR DESPUÉS DE CONFIGURAR)
// ============================================

// Crear usuario admin manualmente
app.get("/create-admin", async (req, res) => {
  const bcrypt = require("bcryptjs");

  try {
    console.log("🔧 Creando usuario admin...");
    const passwordHash = await bcrypt.hash("admin123", 10);

    db.run(
      `INSERT OR REPLACE INTO usuarios (id, username, password, nombre, rol, activo, created_at, updated_at) 
       VALUES (1, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      ["admin", passwordHash, "Administrador", "admin"],
      function (err) {
        if (err) {
          console.error("❌ Error creando admin:", err);
          return res.json({
            success: false,
            error: err.message,
          });
        }

        console.log("✅ Usuario admin creado/actualizado con ID:", this.lastID);

        res.json({
          success: true,
          message: "Usuario admin creado/actualizado correctamente",
          id: this.lastID || 1,
          username: "admin",
          password: "admin123",
        });
      },
    );
  } catch (error) {
    console.error("❌ Error:", error);
    res.json({
      success: false,
      error: error.message,
    });
  }
});

// Verificar usuarios en la base de datos
app.get("/check-users", (req, res) => {
  console.log("🔍 Verificando usuarios...");
  db.all(
    "SELECT id, username, nombre, rol, activo FROM usuarios",
    [],
    (err, users) => {
      if (err) {
        console.error("❌ Error:", err);
        return res.json({
          success: false,
          error: err.message,
        });
      }

      console.log("✅ Usuarios encontrados:", users.length);
      res.json({
        success: true,
        total: users.length,
        users: users,
      });
    },
  );
});

// Verificar estructura de base de datos
app.get("/check-db-structure", (req, res) => {
  console.log("🔍 Verificando estructura de BD...");
  db.all(
    "SELECT name FROM sqlite_master WHERE type='table'",
    [],
    (err, tables) => {
      if (err) {
        console.error("❌ Error:", err);
        return res.json({
          success: false,
          error: err.message,
        });
      }

      console.log(
        "✅ Tablas encontradas:",
        tables.map((t) => t.name),
      );
      res.json({
        success: true,
        tables: tables.map((t) => t.name),
      });
    },
  );
});

// ============================================
// RUTAS DE PÁGINAS HTML
// ============================================

// Ruta principal - Redirigir a tienda
app.get("/", (req, res) => {
  res.redirect("/tienda");
});

// Redirigir /admin a /admin/login
app.get("/admin", (req, res) => {
  res.redirect("/admin/login");
});

// Ruta de tienda pública (HTML)
app.get("/tienda", (req, res) => {
  res.sendFile(path.join(__dirname, "views/public/tienda.html"));
});

// Ruta de login (HTML)
app.get("/admin/login", (req, res) => {
  res.sendFile(path.join(__dirname, "views/admin/login.html"));
});

// Ruta de dashboard (HTML)
app.get("/admin/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "views/admin/dashboard.html"));
});

// Ruta de productos (HTML)
app.get("/admin/productos", (req, res) => {
  res.sendFile(path.join(__dirname, "views/admin/productos.html"));
});

// Ruta de categorías (HTML)
app.get("/admin/categorias", (req, res) => {
  res.sendFile(path.join(__dirname, "views/admin/categorias.html"));
});

// Ruta de ventas (HTML)
app.get("/admin/ventas", (req, res) => {
  res.sendFile(path.join(__dirname, "views/admin/ventas.html"));
});

// Ruta de caja (HTML)
app.get("/admin/caja", (req, res) => {
  res.sendFile(path.join(__dirname, "views/admin/caja.html"));
});

// Ruta de prueba de base de datos
app.get("/test-db", (req, res) => {
  db.all("SELECT * FROM categorias", [], (err, categorias) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    db.get("SELECT COUNT(*) as total FROM productos", [], (err, productos) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      db.get("SELECT COUNT(*) as total FROM usuarios", [], (err, usuarios) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        // Obtener info del usuario admin (sin password)
        db.get(
          "SELECT id, username, rol FROM usuarios WHERE username = 'admin'",
          [],
          (err, admin) => {
            res.json({
              message: "✅ Base de datos funcionando correctamente",
              environment: isProduction ? "production" : "development",
              tablas: {
                categorias: categorias,
                total_productos: productos.total,
                total_usuarios: usuarios.total,
                admin_exists: admin ? true : false,
                admin_info: admin || null,
              },
            });
          },
        );
      });
    });
  });
});

// ============================================
// MANEJO DE ERRORES
// ============================================

// Ruta no encontrada
app.use((req, res) => {
  res.status(404).send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>404 - Página no encontrada</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                    background: #f0f0f0;
                }
                .error-container {
                    text-align: center;
                }
                h1 { font-size: 4em; color: #667eea; margin: 0; }
                p { font-size: 1.2em; color: #666; }
                a { color: #667eea; text-decoration: none; }
            </style>
        </head>
        <body>
            <div class="error-container">
                <h1>404</h1>
                <p>Página no encontrada</p>
                <a href="/">← Volver al inicio</a>
            </div>
        </body>
        </html>
    `);
});

// Error del servidor
app.use((err, req, res, next) => {
  console.error("❌ Error del servidor:", err.stack);
  res.status(500).send("Error interno del servidor");
});

// ============================================
// INICIAR SERVIDOR
// ============================================

const startServer = async () => {
  try {
    // Inicializar base de datos
    console.log("📦 Inicializando base de datos...");
    await initDatabase();
    console.log("✅ Base de datos inicializada");

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log("\n╔════════════════════════════════════════════╗");
      console.log("║  🏪  ALMACÉN DE BARRIO - SISTEMA ACTIVO   ║");
      console.log("╚════════════════════════════════════════════╝\n");
      console.log(`✅ Servidor corriendo en: http://localhost:${PORT}`);
      console.log(`🌍 Entorno: ${isProduction ? "PRODUCCIÓN" : "DESARROLLO"}`);
      console.log(`📅 Día 10 completado - Tienda Pública\n`);
      console.log("💡 Presioná Ctrl+C para detener el servidor\n");
    });
  } catch (error) {
    console.error("❌ Error al iniciar el servidor:", error);
    process.exit(1);
  }
};

// Iniciar
startServer();

// Cerrar base de datos al terminar
process.on("SIGINT", () => {
  db.close((err) => {
    if (err) {
      console.error("❌ Error al cerrar la base de datos:", err.message);
    }
    console.log("\n👋 Servidor detenido. Base de datos cerrada.\n");
    process.exit(0);
  });
});
