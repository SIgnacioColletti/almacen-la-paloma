// ============================================
// CONFIGURACIÓN DE BASE DE DATOS SQLite
// ============================================

const sqlite3 = require("sqlite3").verbose();
const path = require("path");
require("dotenv").config();

// Ruta de la base de datos
const DB_PATH =
  process.env.DB_PATH || path.join(__dirname, "../database/almacen.db");

// ============================================
// CREAR CONEXIÓN
// ============================================

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error("❌ Error al conectar con la base de datos:", err.message);
    process.exit(1);
  }
  console.log("✅ Conectado a la base de datos SQLite");
});

// Habilitar claves foráneas
db.run("PRAGMA foreign_keys = ON");

// ============================================
// CREAR TABLAS
// ============================================

const createTables = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Tabla de categorías
      db.run(
        `
                CREATE TABLE IF NOT EXISTS categorias (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    nombre TEXT NOT NULL UNIQUE,
                    descripcion TEXT,
                    activo INTEGER DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `,
        (err) => {
          if (err) {
            console.error("❌ Error creando tabla categorias:", err.message);
          } else {
            console.log('✅ Tabla "categorias" creada/verificada');
          }
        },
      );

      // Tabla de productos
      db.run(
        `
                CREATE TABLE IF NOT EXISTS productos (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    nombre TEXT NOT NULL,
                    descripcion TEXT,
                    precio REAL NOT NULL,
                    stock INTEGER DEFAULT 0,
                    stock_minimo INTEGER DEFAULT 5,
                    categoria_id INTEGER,
                    codigo_barras TEXT UNIQUE,
                    imagen TEXT,
                    activo INTEGER DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (categoria_id) REFERENCES categorias(id)
                )
            `,
        (err) => {
          if (err) {
            console.error("❌ Error creando tabla productos:", err.message);
          } else {
            console.log('✅ Tabla "productos" creada/verificada');
          }
        },
      );

      // Tabla de usuarios (admin)
      db.run(
        `
                CREATE TABLE IF NOT EXISTS usuarios (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT NOT NULL UNIQUE,
                    password TEXT NOT NULL,
                    nombre TEXT,
                    rol TEXT DEFAULT 'admin',
                    activo INTEGER DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    last_login DATETIME
                )
            `,
        (err) => {
          if (err) {
            console.error("❌ Error creando tabla usuarios:", err.message);
          } else {
            console.log('✅ Tabla "usuarios" creada/verificada');
          }
        },
      );

      // Tabla de ventas
      db.run(
        `
                CREATE TABLE IF NOT EXISTS ventas (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    total REAL NOT NULL,
                    metodo_pago TEXT NOT NULL,
                    usuario_id INTEGER,
                    cliente_nombre TEXT,
                    cliente_telefono TEXT,
                    observaciones TEXT,
                    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
                )
            `,
        (err) => {
          if (err) {
            console.error("❌ Error creando tabla ventas:", err.message);
          } else {
            console.log('✅ Tabla "ventas" creada/verificada');
          }
        },
      );

      // Tabla de detalle de ventas
      db.run(
        `
                CREATE TABLE IF NOT EXISTS ventas_detalle (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    venta_id INTEGER NOT NULL,
                    producto_id INTEGER NOT NULL,
                    cantidad INTEGER NOT NULL,
                    precio_unitario REAL NOT NULL,
                    subtotal REAL NOT NULL,
                    FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
                    FOREIGN KEY (producto_id) REFERENCES productos(id)
                )
            `,
        (err) => {
          if (err) {
            console.error(
              "❌ Error creando tabla ventas_detalle:",
              err.message,
            );
          } else {
            console.log('✅ Tabla "ventas_detalle" creada/verificada');
            resolve();
          }
        },
      );
    });
  });
};

// ============================================
// INSERTAR DATOS INICIALES
// ============================================

const insertInitialData = () => {
  return new Promise((resolve, reject) => {
    // Verificar si ya hay categorías
    db.get("SELECT COUNT(*) as count FROM categorias", (err, row) => {
      if (err) {
        console.error("❌ Error verificando categorías:", err.message);
        reject(err);
        return;
      }

      if (row.count === 0) {
        // Insertar categorías iniciales
        const categorias = [
          ["Bebidas", "Gaseosas, jugos, aguas"],
          ["Almacén", "Productos de almacén general"],
          ["Bebidas Alcohólicas", "Vinos, cervezas, licores"],
          ["Snacks", "Papas fritas, galletitas, golosinas"],
          ["Lácteos", "Leche, yogurt, quesos"],
          ["Limpieza", "Productos de limpieza"],
          ["Otros", "Productos varios"],
        ];

        const stmt = db.prepare(
          "INSERT INTO categorias (nombre, descripcion) VALUES (?, ?)",
        );

        categorias.forEach((cat) => {
          stmt.run(cat, (err) => {
            if (err)
              console.error("❌ Error insertando categoría:", err.message);
          });
        });

        stmt.finalize(() => {
          console.log("✅ Categorías iniciales creadas");
          resolve();
        });
      } else {
        console.log("ℹ️  Categorías ya existen");
        resolve();
      }
    });
  });
};

// ============================================
// CREAR USUARIO ADMIN INICIAL
// ============================================

const createAdminUser = () => {
  const bcrypt = require("bcryptjs");

  return new Promise((resolve, reject) => {
    // Verificar si ya existe un usuario
    db.get("SELECT COUNT(*) as count FROM usuarios", (err, row) => {
      if (err) {
        console.error("❌ Error verificando usuarios:", err.message);
        reject(err);
        return;
      }

      if (row.count === 0) {
        // Crear usuario admin por defecto
        const username = process.env.ADMIN_USER || "admin";
        const password = process.env.ADMIN_PASSWORD || "admin123";

        bcrypt.hash(password, 10, (err, hash) => {
          if (err) {
            console.error("❌ Error encriptando contraseña:", err.message);
            reject(err);
            return;
          }

          db.run(
            "INSERT INTO usuarios (username, password, nombre, rol) VALUES (?, ?, ?, ?)",
            [username, hash, "Administrador", "admin"],
            (err) => {
              if (err) {
                console.error("❌ Error creando usuario admin:", err.message);
                reject(err);
              } else {
                console.log("✅ Usuario admin creado");
                console.log(`   👤 Usuario: ${username}`);
                console.log(`   🔑 Contraseña: ${password}`);
                resolve();
              }
            },
          );
        });
      } else {
        console.log("ℹ️  Usuario admin ya existe");
        resolve();
      }
    });
  });
};

// ============================================
// INICIALIZAR BASE DE DATOS
// ============================================

const initDatabase = async () => {
  try {
    console.log("\n🔄 Inicializando base de datos...\n");
    await createTables();
    await insertInitialData();
    await createAdminUser();
    console.log("\n✅ Base de datos inicializada correctamente\n");
  } catch (error) {
    console.error("\n❌ Error inicializando base de datos:", error);
    process.exit(1);
  }
};

// ============================================
// EXPORTAR
// ============================================

module.exports = {
  db,
  initDatabase,
};
