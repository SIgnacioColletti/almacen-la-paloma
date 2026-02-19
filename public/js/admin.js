// ============================================
// FUNCIONES GENERALES DEL ADMIN
// ============================================

// Verificar autenticación al cargar
document.addEventListener("DOMContentLoaded", async () => {
  await checkAuth();
});

// Verificar si el usuario está autenticado
async function checkAuth() {
  try {
    const response = await fetch("/api/auth/check");
    const result = await response.json();

    if (!result.authenticated) {
      // No autenticado, redirigir a login
      window.location.href = "/admin/login";
    } else {
      // Autenticado, mostrar nombre de usuario
      if (document.getElementById("username-display")) {
        document.getElementById("username-display").textContent =
          result.user.nombre || result.user.username;
      }
    }
  } catch (error) {
    console.error("Error verificando autenticación:", error);
    window.location.href = "/admin/login";
  }
}

// Cerrar sesión
async function logout() {
  if (confirm("¿Está seguro que desea cerrar sesión?")) {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      const result = await response.json();

      if (result.success) {
        window.location.href = "/admin/login";
      }
    } catch (error) {
      console.error("Error cerrando sesión:", error);
      alert("Error al cerrar sesión");
    }
  }
}

// Mostrar alertas
function showAlert(message, type = "success") {
  const alertContainer = document.getElementById("alert-container");
  if (!alertContainer) return;

  const alertDiv = document.createElement("div");
  alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
  alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

  alertContainer.innerHTML = "";
  alertContainer.appendChild(alertDiv);

  // Auto-cerrar después de 5 segundos
  setTimeout(() => {
    alertDiv.remove();
  }, 5000);
}

// Formatear precio
function formatPrice(price) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(price);
}

// Formatear fecha
function formatDate(dateString) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("es-AR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

// Obtener clase de badge según stock
function getStockBadgeClass(stock, stockMinimo) {
  if (stock === 0) return "badge bg-danger";
  if (stock <= stockMinimo) return "badge stock-bajo";
  if (stock <= stockMinimo * 2) return "badge stock-medio";
  return "badge stock-alto";
}

// Obtener texto de estado de stock
function getStockStatus(stock, stockMinimo) {
  if (stock === 0) return "Sin stock";
  if (stock <= stockMinimo) return "Stock bajo";
  if (stock <= stockMinimo * 2) return "Stock medio";
  return "Stock disponible";
}
