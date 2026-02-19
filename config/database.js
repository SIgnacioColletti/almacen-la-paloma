// ============================================
// CONFIGURACIÓN DE BASE DE DATOS
// SQLite3 + Inicialización automática
// ============================================

const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcryptjs");
const path = require("path");
const fs = require("fs");

// Determinar la ruta de la base de datos
const dbDir = path.join(__dirname, "../database");
const dbPath = path.join(dbDir, "almacen.db");

// Crear directorio database si no existe
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log("📁 Directorio database/ creado");
}

// Conectar a la base de datos
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("❌ Error al conectar con la base de datos:", err.message);
  } else {
    console.log("✅ Conectado a la base de datos SQLite");
  }
});

// Función para inicializar la base de datos
const initDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(async () => {
      try {
        // Tabla: categorias
        db.run(`
          CREATE TABLE IF NOT EXISTS categorias (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL UNIQUE,
            descripcion TEXT,
            activo INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Tabla: productos
        db.run(`
          CREATE TABLE IF NOT EXISTS productos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            descripcion TEXT,
            precio REAL NOT NULL,
            stock INTEGER DEFAULT 0,
            stock_minimo INTEGER DEFAULT 5,
            categoria_id INTEGER,
            codigo_barras TEXT,
            imagen TEXT,
            activo INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (categoria_id) REFERENCES categorias(id)
          )
        `);

        // Tabla: usuarios
        db.run(`
          CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            nombre TEXT,
            email TEXT,
            rol TEXT DEFAULT 'vendedor',
            activo INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Tabla: ventas
        db.run(`
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
        `);

        // Tabla: ventas_detalle
        db.run(
          `
          CREATE TABLE IF NOT EXISTS ventas_detalle (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            venta_id INTEGER NOT NULL,
            producto_id INTEGER NOT NULL,
            cantidad INTEGER NOT NULL,
            precio_unitario REAL NOT NULL,
            subtotal REAL NOT NULL,
            FOREIGN KEY (venta_id) REFERENCES ventas(id),
            FOREIGN KEY (producto_id) REFERENCES productos(id)
          )
        `,
          async (err) => {
            if (err) {
              console.error("❌ Error creando tablas:", err);
              reject(err);
              return;
            }

            // Insertar datos iniciales
            await insertInitialData();
            resolve();
          },
        );
      } catch (error) {
        console.error("❌ Error en la inicialización:", error);
        reject(error);
      }
    });
  });
};

// Función para insertar datos iniciales
const insertInitialData = () => {
  return new Promise((resolve, reject) => {
    // Verificar si ya existe el usuario admin
    db.get(
      "SELECT * FROM usuarios WHERE username = ?",
      ["admin"],
      async (err, row) => {
        if (err) {
          console.error("❌ Error verificando usuario admin:", err);
          reject(err);
          return;
        }

        if (!row) {
          // Crear usuario admin
          const passwordHash = await bcrypt.hash("admin123", 10);
          db.run(
            "INSERT INTO usuarios (username, password, nombre, rol) VALUES (?, ?, ?, ?)",
            ["admin", passwordHash, "Administrador", "admin"],
            (err) => {
              if (err) {
                console.error("❌ Error creando usuario admin:", err);
              } else {
                console.log("✅ Usuario admin creado");
              }
            },
          );
        }

        // Verificar si ya existen categorías
        db.get("SELECT COUNT(*) as count FROM categorias", [], (err, row) => {
          if (err) {
            console.error("❌ Error verificando categorías:", err);
            reject(err);
            return;
          }

          if (row.count === 0) {
            // Insertar categorías iniciales
            const categorias = [
              ["Bebidas", "Gaseosas, jugos, aguas"],
              ["Almacén", "Productos básicos de almacén"],
              ["Bebidas Alcohólicas", "Cervezas, vinos, etc"],
              ["Snacks", "Papas, galletitas, golosinas"],
              ["Lácteos", "Leche, yogur, quesos"],
              ["Limpieza", "Productos de limpieza del hogar"],
              ["Otros", "Otros productos"],
            ];

            const stmt = db.prepare(
              "INSERT INTO categorias (nombre, descripcion) VALUES (?, ?)",
            );

            categorias.forEach((cat) => {
              stmt.run(cat);
            });

            stmt.finalize(() => {
              console.log("✅ Categorías iniciales creadas");
              resolve();
            });
          } else {
            resolve();
          }
        });
      },
    );
  });
};

module.exports = { db, initDatabase };
