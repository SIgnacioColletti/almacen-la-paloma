// ============================================
// GESTIÓN DE CATEGORÍAS
// ============================================

let allCategorias = [];
let categoriaModal;

// Inicializar
document.addEventListener("DOMContentLoaded", () => {
  categoriaModal = new bootstrap.Modal(
    document.getElementById("categoriaModal"),
  );
  loadCategorias();
});

// Cargar categorías
async function loadCategorias() {
  try {
    const response = await fetch("/api/categorias");
    const result = await response.json();

    allCategorias = result.data;

    // Cargar productos count para cada categoría
    await loadProductCounts();

    displayCategorias(allCategorias);
  } catch (error) {
    console.error("Error cargando categorías:", error);
    showAlert("Error al cargar categorías", "danger");
  }
}

// Cargar conteo de productos por categoría
async function loadProductCounts() {
  try {
    const response = await fetch("/api/productos");
    const result = await response.json();

    // Contar productos por categoría
    allCategorias.forEach((cat) => {
      cat.producto_count = result.data.filter(
        (p) => p.categoria_id === cat.id,
      ).length;
    });
  } catch (error) {
    console.error("Error cargando conteo de productos:", error);
  }
}

// Mostrar categorías en la tabla
function displayCategorias(categorias) {
  const tbody = document.getElementById("categorias-table");

  if (categorias.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="5" class="text-center">No hay categorías registradas</td></tr>';
    return;
  }

  tbody.innerHTML = categorias
    .map(
      (cat) => `
        <tr>
            <td><strong>#${cat.id}</strong></td>
            <td>
                <strong>${cat.nombre}</strong>
                ${cat.descripcion ? '<br><small class="text-muted">' + cat.descripcion + "</small>" : ""}
            </td>
            <td>
                <span class="badge bg-primary">${cat.producto_count || 0} productos</span>
            </td>
            <td>
                <span class="badge ${cat.activo ? "bg-success" : "bg-secondary"}">
                    ${cat.activo ? "Activa" : "Inactiva"}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="showEditModal(${cat.id})" title="Editar">
                    ✏️ Editar
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteCategoria(${cat.id})" title="Eliminar">
                    🗑️ Eliminar
                </button>
            </td>
        </tr>
    `,
    )
    .join("");
}

// Mostrar modal de crear
function showCreateModal() {
  document.getElementById("modal-title").textContent = "Nueva Categoría";
  document.getElementById("categoria-form").reset();
  document.getElementById("categoria-id").value = "";
  categoriaModal.show();
}

// Mostrar modal de editar
function showEditModal(id) {
  const categoria = allCategorias.find((c) => c.id === id);
  if (!categoria) return;

  document.getElementById("modal-title").textContent = "Editar Categoría";
  document.getElementById("categoria-id").value = categoria.id;
  document.getElementById("categoria-nombre").value = categoria.nombre;
  document.getElementById("categoria-descripcion").value =
    categoria.descripcion || "";

  categoriaModal.show();
}

// Guardar categoría
async function saveCategoria() {
  const id = document.getElementById("categoria-id").value;
  const nombre = document.getElementById("categoria-nombre").value.trim();
  const descripcion = document
    .getElementById("categoria-descripcion")
    .value.trim();

  if (!nombre) {
    showAlert("El nombre es obligatorio", "warning");
    return;
  }

  const data = {
    nombre: nombre,
    descripcion: descripcion || null,
  };

  try {
    const url = id ? `/api/categorias/${id}` : "/api/categorias";
    const method = id ? "PUT" : "POST";

    const response = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (result.success) {
      showAlert(result.message, "success");
      categoriaModal.hide();
      loadCategorias();
    } else {
      showAlert(result.message, "danger");
    }
  } catch (error) {
    console.error("Error guardando categoría:", error);
    showAlert("Error al guardar categoría", "danger");
  }
}

// Eliminar categoría
async function deleteCategoria(id) {
  const categoria = allCategorias.find((c) => c.id === id);
  if (!categoria) return;

  // Verificar si tiene productos
  if (categoria.producto_count > 0) {
    showAlert(
      `No se puede eliminar. La categoría "${categoria.nombre}" tiene ${categoria.producto_count} producto(s) asociado(s).`,
      "warning",
    );
    return;
  }

  if (
    !confirm(`¿Está seguro de eliminar la categoría "${categoria.nombre}"?`)
  ) {
    return;
  }

  try {
    const response = await fetch(`/api/categorias/${id}`, {
      method: "DELETE",
    });

    const result = await response.json();

    if (result.success) {
      showAlert(result.message, "success");
      loadCategorias();
    } else {
      showAlert(result.message, "danger");
    }
  } catch (error) {
    console.error("Error eliminando categoría:", error);
    showAlert("Error al eliminar categoría", "danger");
  }
}
