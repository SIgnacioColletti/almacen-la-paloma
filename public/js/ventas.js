// ============================================
// GESTIÓN DE VENTAS
// ============================================

let productosDisponibles = [];
let carrito = [];
let ventaModal;

// Inicializar
document.addEventListener("DOMContentLoaded", () => {
  ventaModal = new bootstrap.Modal(document.getElementById("ventaModal"));
  cargarProductos();
  cargarVentas();
  cargarTotalesHoy();

  // Configurar fecha de hoy por defecto
  const hoy = new Date().toISOString().split("T")[0];
  document.getElementById("filtro-fecha").value = hoy;
});

// Cargar productos disponibles
async function cargarProductos() {
  try {
    const response = await fetch("/api/productos");
    const result = await response.json();

    productosDisponibles = result.data.filter((p) => p.stock > 0);

    // Llenar selector de productos
    const select = document.getElementById("producto-select");
    select.innerHTML =
      '<option value="">Seleccionar producto...</option>' +
      productosDisponibles
        .map(
          (p) =>
            `<option value="${p.id}" data-precio="${p.precio}" data-stock="${p.stock}">
                    ${p.nombre} - ${formatPrice(p.precio)} (Stock: ${p.stock})
                </option>`,
        )
        .join("");
  } catch (error) {
    console.error("Error cargando productos:", error);
    showAlert("Error al cargar productos", "danger");
  }
}

// Cargar ventas
async function cargarVentas() {
  try {
    const response = await fetch("/api/ventas?limit=50");
    const result = await response.json();

    mostrarVentas(result.data);
  } catch (error) {
    console.error("Error cargando ventas:", error);
    showAlert("Error al cargar ventas", "danger");
  }
}

// Mostrar ventas en la tabla
function mostrarVentas(ventas) {
  const tbody = document.getElementById("ventas-table");

  if (ventas.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="6" class="text-center">No hay ventas registradas</td></tr>';
    return;
  }

  tbody.innerHTML = ventas
    .map(
      (v) => `
        <tr>
            <td><strong>#${v.id}</strong></td>
            <td>${formatDate(v.fecha)}</td>
            <td>
                <span class="badge ${v.metodo_pago === "efectivo" ? "bg-success" : "bg-info"}">
                    ${v.metodo_pago.toUpperCase()}
                </span>
            </td>
            <td><strong>${formatPrice(v.total)}</strong></td>
            <td>${v.cliente_nombre || "-"}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="verDetalle(${v.id})" title="Ver detalle">
                    👁️
                </button>
            </td>
        </tr>
    `,
    )
    .join("");
}

// Cargar totales del día
async function cargarTotalesHoy() {
  try {
    const response = await fetch("/api/ventas/totales-hoy");
    const result = await response.json();

    const totales = result.data;

    document.getElementById("total-ventas-hoy").textContent =
      totales.total_ventas || 0;
    document.getElementById("total-dinero-hoy").textContent = formatPrice(
      totales.total_dinero || 0,
    );
    document.getElementById("total-efectivo").textContent = formatPrice(
      totales.total_efectivo || 0,
    );
    document.getElementById("total-transferencia").textContent = formatPrice(
      totales.total_transferencia || 0,
    );
  } catch (error) {
    console.error("Error cargando totales:", error);
  }
}

// Mostrar modal de nueva venta
function nuevaVenta() {
  carrito = [];
  document.getElementById("venta-form").reset();
  document.getElementById("producto-select").value = "";
  document.getElementById("cantidad-input").value = 1;
  actualizarCarrito();
  ventaModal.show();
}

// Agregar producto al carrito
function agregarProducto() {
  const select = document.getElementById("producto-select");
  const cantidad = parseInt(document.getElementById("cantidad-input").value);

  if (!select.value) {
    showAlert("Debe seleccionar un producto", "warning");
    return;
  }

  if (!cantidad || cantidad <= 0) {
    showAlert("La cantidad debe ser mayor a 0", "warning");
    return;
  }

  const option = select.options[select.selectedIndex];
  const productoId = parseInt(select.value);
  const nombre = option.text.split(" - ")[0];
  const precio = parseFloat(option.dataset.precio);
  const stock = parseInt(option.dataset.stock);

  // Verificar stock
  if (cantidad > stock) {
    showAlert(`Stock insuficiente. Disponible: ${stock}`, "warning");
    return;
  }

  // Verificar si ya está en el carrito
  const existente = carrito.find((item) => item.producto_id === productoId);
  if (existente) {
    existente.cantidad += cantidad;
    existente.subtotal = existente.cantidad * existente.precio_unitario;
  } else {
    carrito.push({
      producto_id: productoId,
      nombre: nombre,
      cantidad: cantidad,
      precio_unitario: precio,
      subtotal: cantidad * precio,
    });
  }

  // Limpiar selección
  select.value = "";
  document.getElementById("cantidad-input").value = 1;

  actualizarCarrito();
}

// Actualizar vista del carrito
function actualizarCarrito() {
  const tbody = document.getElementById("carrito-items");
  const totalElement = document.getElementById("total-venta");

  if (carrito.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="5" class="text-center text-muted">Carrito vacío</td></tr>';
    totalElement.textContent = formatPrice(0);
    return;
  }

  tbody.innerHTML = carrito
    .map(
      (item, index) => `
        <tr>
            <td>${item.nombre}</td>
            <td>${formatPrice(item.precio_unitario)}</td>
            <td>${item.cantidad}</td>
            <td><strong>${formatPrice(item.subtotal)}</strong></td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="eliminarDelCarrito(${index})">
                    🗑️
                </button>
            </td>
        </tr>
    `,
    )
    .join("");

  const total = carrito.reduce((sum, item) => sum + item.subtotal, 0);
  totalElement.textContent = formatPrice(total);
}

// Eliminar del carrito
function eliminarDelCarrito(index) {
  carrito.splice(index, 1);
  actualizarCarrito();
}

// Registrar venta
async function registrarVenta() {
  if (carrito.length === 0) {
    showAlert("Debe agregar al menos un producto", "warning");
    return;
  }

  const metodoPago = document.getElementById("metodo-pago").value;
  if (!metodoPago) {
    showAlert("Debe seleccionar un método de pago", "warning");
    return;
  }

  const data = {
    items: carrito.map((item) => ({
      producto_id: item.producto_id,
      cantidad: item.cantidad,
    })),
    metodo_pago: metodoPago,
    cliente_nombre: document.getElementById("cliente-nombre").value || null,
    cliente_telefono: document.getElementById("cliente-telefono").value || null,
    observaciones: document.getElementById("observaciones").value || null,
  };

  try {
    const response = await fetch("/api/ventas", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (result.success) {
      showAlert("Venta registrada exitosamente", "success");
      ventaModal.hide();
      cargarVentas();
      cargarProductos(); // Actualizar stock disponible
      cargarTotalesHoy();
    } else {
      showAlert(result.message, "danger");
    }
  } catch (error) {
    console.error("Error registrando venta:", error);
    showAlert("Error al registrar venta", "danger");
  }
}

// Ver detalle de venta
async function verDetalle(id) {
  try {
    const response = await fetch(`/api/ventas/${id}`);
    const result = await response.json();

    if (!result.success) {
      showAlert("Error al cargar detalle", "danger");
      return;
    }

    const venta = result.data;

    // Mostrar en modal
    const detalleModal = new bootstrap.Modal(
      document.getElementById("detalleModal"),
    );

    document.getElementById("detalle-venta-id").textContent = venta.id;
    document.getElementById("detalle-fecha").textContent = formatDate(
      venta.fecha,
    );
    document.getElementById("detalle-metodo").textContent =
      venta.metodo_pago.toUpperCase();
    document.getElementById("detalle-cliente").textContent =
      venta.cliente_nombre || "-";
    document.getElementById("detalle-telefono").textContent =
      venta.cliente_telefono || "-";
    document.getElementById("detalle-total").textContent = formatPrice(
      venta.total,
    );

    const itemsHtml = venta.items
      .map(
        (item) => `
            <tr>
                <td>${item.producto_nombre}</td>
                <td>${formatPrice(item.precio_unitario)}</td>
                <td>${item.cantidad}</td>
                <td><strong>${formatPrice(item.subtotal)}</strong></td>
            </tr>
        `,
      )
      .join("");

    document.getElementById("detalle-items").innerHTML = itemsHtml;

    detalleModal.show();
  } catch (error) {
    console.error("Error cargando detalle:", error);
    showAlert("Error al cargar detalle", "danger");
  }
}

// Filtrar ventas por fecha
async function filtrarPorFecha() {
  const fecha = document.getElementById("filtro-fecha").value;

  if (!fecha) {
    cargarVentas();
    return;
  }

  try {
    const response = await fetch(`/api/ventas/por-fecha?fecha=${fecha}`);
    const result = await response.json();

    mostrarVentas(result.data);
  } catch (error) {
    console.error("Error filtrando ventas:", error);
    showAlert("Error al filtrar ventas", "danger");
  }
}
