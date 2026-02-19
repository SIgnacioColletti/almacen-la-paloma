// ============================================
// TIENDA PÚBLICA - GESTIÓN DE PRODUCTOS Y CARRITO
// ============================================

let productosDisponibles = [];
let categoriasDisponibles = [];
let carrito = [];
let modalConfirmacion;
let metodoPagoSeleccionado = null;

// Inicializar
document.addEventListener("DOMContentLoaded", () => {
  cargarCategorias();
  cargarProductos();
  cargarCarritoDesdeLocalStorage();
  actualizarBadgeCarrito();
  inicializarModalConfirmacion();
});

// Inicializar modal de confirmación
function inicializarModalConfirmacion() {
  modalConfirmacion = new bootstrap.Modal(
    document.getElementById("modalConfirmacion"),
  );
}

// Cargar categorías
async function cargarCategorias() {
  try {
    const response = await fetch("/api/categorias");
    const result = await response.json();

    categoriasDisponibles = result.data;

    const select = document.getElementById("filtro-categoria");
    select.innerHTML =
      '<option value="">Todas las categorías</option>' +
      categoriasDisponibles
        .map((cat) => `<option value="${cat.id}">${cat.nombre}</option>`)
        .join("");
  } catch (error) {
    console.error("Error cargando categorías:", error);
  }
}

// Cargar productos
async function cargarProductos() {
  try {
    const response = await fetch("/api/productos");
    const result = await response.json();

    productosDisponibles = result.data.filter((p) => p.activo);

    mostrarProductos(productosDisponibles);
  } catch (error) {
    console.error("Error cargando productos:", error);
    mostrarError();
  }
}

// Mostrar productos en el grid
function mostrarProductos(productos) {
  const grid = document.getElementById("productos-grid");

  if (productos.length === 0) {
    grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div class="icon">📦</div>
                <h3>No hay productos disponibles</h3>
                <p>Vuelve pronto para ver nuestras ofertas</p>
            </div>
        `;
    return;
  }

  grid.innerHTML = productos
    .map((p) => {
      const stockClass =
        p.stock === 0
          ? "stock-agotado"
          : p.stock <= p.stock_minimo
            ? "stock-bajo"
            : "stock-disponible";

      const stockText =
        p.stock === 0
          ? "❌ Agotado"
          : p.stock <= p.stock_minimo
            ? `⚠️ Quedan ${p.stock}`
            : `✅ Disponible (${p.stock})`;

      const imagenHtml = p.imagen
        ? `<img src="${p.imagen}" alt="${p.nombre}">`
        : `<div class="producto-imagen-placeholder">${getIconoCategoria(p.categoria_nombre)}</div>`;

      return `
            <div class="producto-card">
                <div class="producto-imagen">
                    ${imagenHtml}
                </div>
                <div class="producto-info">
                    <div class="producto-nombre">${p.nombre}</div>
                    <div class="producto-descripcion">
                        ${p.descripcion || "Producto de calidad"}
                    </div>
                    <div class="producto-precio">$${p.precio.toFixed(2)}</div>
                    <div class="producto-stock ${stockClass}">
                        ${stockText}
                    </div>
                    <button 
                        class="btn-agregar" 
                        onclick="agregarAlCarrito(${p.id})"
                        ${p.stock === 0 ? "disabled" : ""}
                    >
                        ${p.stock === 0 ? "No disponible" : "🛒 Agregar al carrito"}
                    </button>
                </div>
            </div>
        `;
    })
    .join("");
}

// Obtener icono según categoría
function getIconoCategoria(categoria) {
  const iconos = {
    Bebidas: "🥤",
    Almacén: "🍝",
    "Bebidas Alcohólicas": "🍺",
    Snacks: "🍿",
    Lácteos: "🥛",
    Limpieza: "🧹",
    Panadería: "🥖",
    Congelados: "🧊",
    Golosinas: "🍬",
  };
  return iconos[categoria] || "📦";
}

// Filtrar productos
function filtrarProductos() {
  const busqueda = document
    .getElementById("buscar-producto")
    .value.toLowerCase();
  const categoriaId = document.getElementById("filtro-categoria").value;

  let productosFiltrados = productosDisponibles;

  if (busqueda) {
    productosFiltrados = productosFiltrados.filter(
      (p) =>
        p.nombre.toLowerCase().includes(busqueda) ||
        (p.descripcion && p.descripcion.toLowerCase().includes(busqueda)),
    );
  }

  if (categoriaId) {
    productosFiltrados = productosFiltrados.filter(
      (p) => p.categoria_id == categoriaId,
    );
  }

  mostrarProductos(productosFiltrados);
}

// Agregar al carrito
function agregarAlCarrito(productoId) {
  const producto = productosDisponibles.find((p) => p.id === productoId);

  if (!producto || producto.stock === 0) {
    return;
  }

  const itemExistente = carrito.find((item) => item.id === productoId);

  if (itemExistente) {
    if (itemExistente.cantidad < producto.stock) {
      itemExistente.cantidad++;
    } else {
      mostrarNotificacion("No hay más stock disponible", "warning");
      return;
    }
  } else {
    carrito.push({
      id: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      cantidad: 1,
      stockDisponible: producto.stock,
    });
  }

  guardarCarritoEnLocalStorage();
  actualizarBadgeCarrito();
  mostrarNotificacion("Producto agregado al carrito", "success");

  const btn = event.target;
  btn.style.transform = "scale(0.9)";
  setTimeout(() => {
    btn.style.transform = "scale(1)";
  }, 200);
}

// Mostrar/ocultar carrito
function toggleCarrito() {
  const modal = document.getElementById("carrito-modal");
  const overlay = document.getElementById("carrito-overlay");

  modal.classList.toggle("active");
  overlay.classList.toggle("active");

  if (modal.classList.contains("active")) {
    actualizarVistaCarrito();
  }
}

// Actualizar vista del carrito
function actualizarVistaCarrito() {
  const container = document.getElementById("carrito-items-container");
  const totalElement = document.getElementById("carrito-total");

  if (carrito.length === 0) {
    container.innerHTML = `
            <div class="empty-state">
                <div class="icon">🛒</div>
                <h4>Tu carrito está vacío</h4>
                <p>Agrega productos para comenzar</p>
            </div>
        `;
    totalElement.textContent = "$0.00";
    return;
  }

  container.innerHTML = carrito
    .map(
      (item, index) => `
        <div class="carrito-item">
            <div class="carrito-item-info">
                <div class="carrito-item-nombre">${item.nombre}</div>
                <div class="carrito-item-precio">$${item.precio.toFixed(2)}</div>
                <div class="carrito-item-cantidad">
                    <button class="btn-cantidad" onclick="cambiarCantidad(${index}, -1)">-</button>
                    <span><strong>${item.cantidad}</strong></span>
                    <button class="btn-cantidad" onclick="cambiarCantidad(${index}, 1)">+</button>
                    <span style="margin-left: 10px;">Subtotal: $${(item.precio * item.cantidad).toFixed(2)}</span>
                </div>
            </div>
            <button class="carrito-item-eliminar" onclick="eliminarDelCarrito(${index})">
                🗑️
            </button>
        </div>
    `,
    )
    .join("");

  const total = carrito.reduce(
    (sum, item) => sum + item.precio * item.cantidad,
    0,
  );
  totalElement.textContent = `$${total.toFixed(2)}`;
}

// Cambiar cantidad
function cambiarCantidad(index, cambio) {
  const item = carrito[index];
  const nuevaCantidad = item.cantidad + cambio;

  if (nuevaCantidad <= 0) {
    eliminarDelCarrito(index);
    return;
  }

  if (nuevaCantidad > item.stockDisponible) {
    mostrarNotificacion("No hay más stock disponible", "warning");
    return;
  }

  item.cantidad = nuevaCantidad;
  guardarCarritoEnLocalStorage();
  actualizarVistaCarrito();
  actualizarBadgeCarrito();
}

// Eliminar del carrito
function eliminarDelCarrito(index) {
  carrito.splice(index, 1);
  guardarCarritoEnLocalStorage();
  actualizarVistaCarrito();
  actualizarBadgeCarrito();
  mostrarNotificacion("Producto eliminado", "info");
}

// Actualizar badge del carrito
function actualizarBadgeCarrito() {
  const badge = document.getElementById("carrito-badge");
  const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);

  badge.textContent = totalItems;
  badge.style.display = totalItems > 0 ? "flex" : "none";
}

// Mostrar modal de confirmación
function mostrarModalConfirmacion() {
  if (carrito.length === 0) {
    mostrarNotificacion("El carrito está vacío", "warning");
    return;
  }

  // Resetear método de pago
  metodoPagoSeleccionado = null;
  document.getElementById("btn-confirmar-envio").disabled = true;
  document.getElementById("alerta-transferencia").style.display = "none";

  // Quitar selección visual
  document.querySelectorAll(".metodo-pago-btn").forEach((btn) => {
    btn.classList.remove("active");
    btn.style.background = "";
    btn.style.color = "";
    btn.style.borderColor = "";
  });

  // Calcular totales
  const total = carrito.reduce(
    (sum, item) => sum + item.precio * item.cantidad,
    0,
  );
  const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);

  // Actualizar contenido del modal
  document.getElementById("modal-total-items").textContent = totalItems;
  document.getElementById("modal-total-precio").textContent =
    `$${total.toFixed(2)}`;

  // Mostrar modal
  modalConfirmacion.show();
}

// Seleccionar método de pago
function seleccionarMetodoPago(metodo) {
  metodoPagoSeleccionado = metodo;

  // Habilitar botón de envío
  document.getElementById("btn-confirmar-envio").disabled = false;

  // Actualizar estilos de botones
  document.querySelectorAll(".metodo-pago-btn").forEach((btn) => {
    btn.classList.remove("active");
    btn.style.background = "";
    btn.style.color = "";
    btn.style.borderColor = "";
  });

  const btnSeleccionado = document.getElementById(`btn-${metodo}`);
  btnSeleccionado.style.background =
    "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)";
  btnSeleccionado.style.color = "white";
  btnSeleccionado.style.borderColor = "#6366f1";

  // Mostrar/ocultar alerta de transferencia
  const alerta = document.getElementById("alerta-transferencia");
  if (metodo === "transferencia") {
    alerta.style.display = "block";
  } else {
    alerta.style.display = "none";
  }
}

// Confirmar y enviar pedido
function confirmarEnvio() {
  if (!metodoPagoSeleccionado) {
    mostrarNotificacion("Por favor seleccioná un método de pago", "warning");
    return;
  }

  // Construir mensaje según método de pago
  let mensaje = "*🛒 NUEVO PEDIDO - Almacén de Barrio*\n\n";

  // Método de pago
  if (metodoPagoSeleccionado === "efectivo") {
    mensaje += "*💵 Método de Pago: EFECTIVO*\n";
    mensaje += "_Pago al recibir el pedido_\n\n";
  } else {
    mensaje += "*💳 Método de Pago: TRANSFERENCIA*\n";
    mensaje += "*Alias:* nachocolletti\n";
    mensaje += "*CVU/CBU:* 0000003100012345678901\n";
    mensaje += "_⏰ El pedido se prepara al confirmar el pago_\n\n";
  }

  // Productos
  mensaje += "*Productos:*\n";
  carrito.forEach((item) => {
    mensaje += `\n• ${item.nombre}\n`;
    mensaje += `  Cantidad: ${item.cantidad}\n`;
    mensaje += `  Precio: $${item.precio.toFixed(2)}\n`;
    mensaje += `  Subtotal: $${(item.precio * item.cantidad).toFixed(2)}\n`;
  });

  const total = carrito.reduce(
    (sum, item) => sum + item.precio * item.cantidad,
    0,
  );
  mensaje += `\n*TOTAL: $${total.toFixed(2)}*`;

  if (metodoPagoSeleccionado === "transferencia") {
    mensaje += `\n\n_Por favor enviá el comprobante de pago por este mismo chat_`;
  }

  mensaje += `\n\n_Pedido realizado desde la tienda web_`;

  // Usar número de WhatsApp configurado
  const telefono = window.WHATSAPP_NUMBER || "5493414123456";
  const url = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;

  // Abrir WhatsApp
  window.open(url, "_blank");

  // Cerrar modal de confirmación
  modalConfirmacion.hide();

  // Mostrar notificación según método de pago
  if (metodoPagoSeleccionado === "efectivo") {
    mostrarNotificacion("¡Pedido enviado! Preparando tu pedido...", "success");
  } else {
    mostrarNotificacion(
      "¡Pedido enviado! Esperando confirmación de pago...",
      "info",
    );
  }

  // Limpiar carrito con animación
  setTimeout(() => {
    vaciarCarritoConAnimacion();
    toggleCarrito();
    mostrarNotificacion(
      "✅ Carrito limpiado. ¡Gracias por tu compra!",
      "success",
    );
  }, 2000);
}

// Vaciar carrito con animación
function vaciarCarritoConAnimacion() {
  if (carrito.length === 0) {
    return;
  }

  // Animar items antes de eliminar
  const items = document.querySelectorAll(".carrito-item");
  items.forEach((item, index) => {
    setTimeout(() => {
      item.classList.add("removing");
    }, index * 50);
  });

  // Limpiar después de la animación
  setTimeout(
    () => {
      carrito = [];
      guardarCarritoEnLocalStorage();
      actualizarVistaCarrito();
      actualizarBadgeCarrito();
    },
    items.length * 50 + 300,
  );
}

// Vaciar carrito normal (botón vaciar)
function vaciarCarrito() {
  if (carrito.length === 0) {
    mostrarNotificacion("El carrito ya está vacío", "info");
    return;
  }

  vaciarCarritoConAnimacion();
  mostrarNotificacion("Carrito vaciado", "info");
}

// Copiar alias al portapapeles
function copiarAlias() {
  const alias = "nachocolletti"; // ← TU ALIAS REAL

  // Copiar al portapapeles
  navigator.clipboard
    .writeText(alias)
    .then(() => {
      // Cambiar el texto y el icono temporalmente
      const iconoCopiar = document.getElementById("icono-copiar");
      const textoCopiar = document.getElementById("texto-copiar");

      const iconoOriginal = iconoCopiar.textContent;
      const textoOriginal = textoCopiar.textContent;

      iconoCopiar.textContent = "✅";
      textoCopiar.textContent = "¡Copiado!";

      // Mostrar notificación
      mostrarNotificacion("Alias copiado al portapapeles", "success");

      // Restaurar después de 2 segundos
      setTimeout(() => {
        iconoCopiar.textContent = iconoOriginal;
        textoCopiar.textContent = textoOriginal;
      }, 2000);
    })
    .catch(() => {
      // Fallback para navegadores antiguos
      mostrarNotificacion(
        "No se pudo copiar. Por favor copiá manualmente",
        "warning",
      );
    });
}

// LocalStorage
function guardarCarritoEnLocalStorage() {
  localStorage.setItem("carrito_almacen", JSON.stringify(carrito));
}

function cargarCarritoDesdeLocalStorage() {
  const carritoGuardado = localStorage.getItem("carrito_almacen");
  if (carritoGuardado) {
    carrito = JSON.parse(carritoGuardado);
  }
}

// Notificaciones
function mostrarNotificacion(mensaje, tipo = "info") {
  const container = document.getElementById("notificaciones");

  const colores = {
    success: "#4CAF50",
    warning: "#ff9800",
    danger: "#f44336",
    info: "#2196F3",
  };

  const notif = document.createElement("div");
  notif.style.cssText = `
        background: ${colores[tipo]};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        margin-bottom: 10px;
        box-shadow: 0 3px 10px rgba(0,0,0,0.2);
        animation: slideIn 0.3s;
    `;
  notif.textContent = mensaje;

  container.appendChild(notif);

  setTimeout(() => {
    notif.style.animation = "slideOut 0.3s";
    setTimeout(() => notif.remove(), 300);
  }, 3000);
}

function mostrarError() {
  const grid = document.getElementById("productos-grid");
  grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
            <div class="icon">⚠️</div>
            <h3>Error al cargar productos</h3>
            <p>Por favor, intenta nuevamente</p>
            <button class="btn-agregar" style="max-width: 200px; margin: 20px auto;" onclick="cargarProductos()">
                🔄 Reintentar
            </button>
        </div>
    `;
}
