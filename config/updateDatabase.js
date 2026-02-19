// ============================================
// ACTUALIZAR BASE DE DATOS - AGREGAR CAMPO IMAGEN
// ============================================

const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "../database/almacen.db");
const db = new sqlite3.Database(dbPath);

// Agregar columna imagen si no existe
db.run(
  `
    ALTER TABLE productos ADD COLUMN imagen TEXT
`,
  (err) => {
    if (err) {
      if (err.message.includes("duplicate column name")) {
        console.log("✅ La columna imagen ya existe");
      } else {
        console.error("❌ Error:", err.message);
      }
    } else {
      console.log("✅ Columna imagen agregada correctamente");
    }

    db.close();
  },
);
