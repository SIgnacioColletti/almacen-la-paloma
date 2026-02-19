// ============================================
// GESTIÓN DE CAJA DIARIA
// ============================================

let ventasDelDia = [];
let fechaSeleccionada = new Date().toISOString().split("T")[0];

// Inicializar
document.addEventListener("DOMContentLoaded", () => {
  configurarFecha();
  cargarDatosCaja();
});

// Configurar fecha
function configurarFecha() {
  const inputFecha = document.getElementById("fecha-caja");
  const hoy = new Date().toISOString().split("T")[0];

  inputFecha.value = hoy;
  inputFecha.max = hoy; // No permitir fechas futuras
  fechaSeleccionada = hoy;
}

// Cargar datos de caja
async function cargarDatosCaja() {
  const fecha = document.getElementById("fecha-caja").value;
  fechaSeleccionada = fecha;

  try {
    // Cargar ventas del día
    const ventasResponse = await fetch(`/api/ventas/por-fecha?fecha=${fecha}`);
    const ventasResult = await ventasResponse.json();
    ventasDelDia = ventasResult.data || [];

    // Cargar totales por método de pago
    const totalesResponse = await fetch(
      `/api/ventas/por-metodo?fecha=${fecha}`,
    );
    const totalesResult = await totalesResponse.json();

    // Actualizar vista
    actualizarResumenCaja(totalesResult.data);
    mostrarVentasDelDia(ventasDelDia);
    generarGrafico(totalesResult.data);
  } catch (error) {
    console.error("Error cargando datos de caja:", error);
    showAlert("Error al cargar datos de caja", "danger");
  }
}

// Actualizar resumen de caja
function actualizarResumenCaja(totales) {
  // Calcular totales
  const totalEfectivo =
    totales.find((t) => t.metodo_pago === "efectivo")?.total || 0;
  const totalTransferencia =
    totales.find((t) => t.metodo_pago === "transferencia")?.total || 0;
  const cantidadVentas = totales.reduce((sum, t) => sum + (t.cantidad || 0), 0);
  const totalGeneral = totalEfectivo + totalTransferencia;

  // Actualizar cards
  document.getElementById("total-ventas").textContent = cantidadVentas;
  document.getElementById("total-efectivo").textContent =
    formatPrice(totalEfectivo);
  document.getElementById("total-transferencia").textContent =
    formatPrice(totalTransferencia);
  document.getElementById("total-general").textContent =
    formatPrice(totalGeneral);

  // Actualizar tabla de resumen
  const tbody = document.getElementById("resumen-metodos");
  tbody.innerHTML = `
        <tr>
            <td><strong>💵 Efectivo</strong></td>
            <td class="text-center">${totales.find((t) => t.metodo_pago === "efectivo")?.cantidad || 0}</td>
            <td class="text-end"><strong>${formatPrice(totalEfectivo)}</strong></td>
        </tr>
        <tr>
            <td><strong>💳 Transferencia</strong></td>
            <td class="text-center">${totales.find((t) => t.metodo_pago === "transferencia")?.cantidad || 0}</td>
            <td class="text-end"><strong>${formatPrice(totalTransferencia)}</strong></td>
        </tr>
        <tr class="table-primary">
            <td><strong>TOTAL</strong></td>
            <td class="text-center"><strong>${cantidadVentas}</strong></td>
            <td class="text-end"><strong>${formatPrice(totalGeneral)}</strong></td>
        </tr>
    `;
}

// Mostrar ventas del día
function mostrarVentasDelDia(ventas) {
  const tbody = document.getElementById("ventas-dia-table");

  if (ventas.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="5" class="text-center text-muted">No hay ventas en esta fecha</td></tr>';
    return;
  }

  tbody.innerHTML = ventas
    .map(
      (v) => `
        <tr>
            <td><strong>#${v.id}</strong></td>
            <td>${formatTime(v.fecha)}</td>
            <td>
                <span class="badge ${v.metodo_pago === "efectivo" ? "bg-success" : "bg-info"}">
                    ${v.metodo_pago === "efectivo" ? "💵" : "💳"} ${v.metodo_pago.toUpperCase()}
                </span>
            </td>
            <td><strong>${formatPrice(v.total)}</strong></td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="verDetalleVenta(${v.id})">
                    👁️ Ver
                </button>
            </td>
        </tr>
    `,
    )
    .join("");
}

// Ver detalle de venta
async function verDetalleVenta(id) {
  try {
    const response = await fetch(`/api/ventas/${id}`);
    const result = await response.json();

    if (!result.success) {
      showAlert("Error al cargar detalle", "danger");
      return;
    }

    const venta = result.data;

    // Mostrar en modal
    const modal = new bootstrap.Modal(document.getElementById("detalleModal"));

    document.getElementById("detalle-venta-id").textContent = venta.id;
    document.getElementById("detalle-fecha").textContent = formatDateTime(
      venta.fecha,
    );
    document.getElementById("detalle-metodo").innerHTML = `
            <span class="badge ${venta.metodo_pago === "efectivo" ? "bg-success" : "bg-info"}">
                ${venta.metodo_pago === "efectivo" ? "💵" : "💳"} ${venta.metodo_pago.toUpperCase()}
            </span>
        `;
    document.getElementById("detalle-cliente").textContent =
      venta.cliente_nombre || "-";
    document.getElementById("detalle-telefono").textContent =
      venta.cliente_telefono || "-";
    document.getElementById("detalle-usuario").textContent =
      venta.usuario_nombre || "Sistema";
    document.getElementById("detalle-observaciones").textContent =
      venta.observaciones || "-";
    document.getElementById("detalle-total").textContent = formatPrice(
      venta.total,
    );

    const itemsHtml = venta.items
      .map(
        (item) => `
            <tr>
                <td>${item.producto_nombre}</td>
                <td class="text-center">${item.cantidad}</td>
                <td class="text-end">${formatPrice(item.precio_unitario)}</td>
                <td class="text-end"><strong>${formatPrice(item.subtotal)}</strong></td>
            </tr>
        `,
      )
      .join("");

    document.getElementById("detalle-items").innerHTML = itemsHtml;

    modal.show();
  } catch (error) {
    console.error("Error cargando detalle:", error);
    showAlert("Error al cargar detalle", "danger");
  }
}

// Generar gráfico
function generarGrafico(totales) {
  const canvas = document.getElementById("grafico-metodos");
  const ctx = canvas.getContext("2d");

  const totalEfectivo =
    totales.find((t) => t.metodo_pago === "efectivo")?.total || 0;
  const totalTransferencia =
    totales.find((t) => t.metodo_pago === "transferencia")?.total || 0;
  const total = totalEfectivo + totalTransferencia;

  if (total === 0) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = "16px Arial";
    ctx.fillStyle = "#666";
    ctx.textAlign = "center";
    ctx.fillText(
      "Sin ventas en esta fecha",
      canvas.width / 2,
      canvas.height / 2,
    );
    return;
  }

  // Limpiar canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Configuración del gráfico de barras
  const barWidth = 100;
  const maxHeight = 200;
  const spacing = 50;
  const startX = 50;
  const startY = canvas.height - 50;

  // Calcular alturas proporcionales
  const alturaEfectivo = (totalEfectivo / total) * maxHeight;
  const alturaTransferencia = (totalTransferencia / total) * maxHeight;

  // Dibujar barra de efectivo
  ctx.fillStyle = "#4CAF50";
  ctx.fillRect(startX, startY - alturaEfectivo, barWidth, alturaEfectivo);

  // Dibujar barra de transferencia
  ctx.fillStyle = "#2196F3";
  ctx.fillRect(
    startX + barWidth + spacing,
    startY - alturaTransferencia,
    barWidth,
    alturaTransferencia,
  );

  // Etiquetas
  ctx.fillStyle = "#333";
  ctx.font = "bold 14px Arial";
  ctx.textAlign = "center";

  // Efectivo
  ctx.fillText("💵 Efectivo", startX + barWidth / 2, startY + 20);
  ctx.fillText(
    formatPrice(totalEfectivo),
    startX + barWidth / 2,
    startY - alturaEfectivo - 10,
  );

  // Transferencia
  ctx.fillText(
    "💳 Transferencia",
    startX + barWidth + spacing + barWidth / 2,
    startY + 20,
  );
  ctx.fillText(
    formatPrice(totalTransferencia),
    startX + barWidth + spacing + barWidth / 2,
    startY - alturaTransferencia - 10,
  );
}

// Imprimir reporte
function imprimirReporte() {
  const fecha = document.getElementById("fecha-caja").value;
  const fechaFormateada = new Date(fecha + "T00:00:00").toLocaleDateString(
    "es-AR",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );

  // Obtener datos
  const totalVentas = document.getElementById("total-ventas").textContent;
  const totalEfectivo = document.getElementById("total-efectivo").textContent;
  const totalTransferencia = document.getElementById(
    "total-transferencia",
  ).textContent;
  const totalGeneral = document.getElementById("total-general").textContent;

  // Crear ventana de impresión
  const ventana = window.open("", "", "width=800,height=600");

  ventana.document.write(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <title>Reporte de Caja - ${fechaFormateada}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    padding: 20px;
                    max-width: 800px;
                    margin: 0 auto;
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                    border-bottom: 2px solid #333;
                    padding-bottom: 20px;
                }
                .header h1 {
                    margin: 0;
                    color: #667eea;
                }
                .info-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 20px;
                    margin: 30px 0;
                }
                .info-card {
                    border: 1px solid #ddd;
                    padding: 15px;
                    border-radius: 8px;
                }
                .info-card h3 {
                    margin: 0 0 10px 0;
                    color: #666;
                    font-size: 14px;
                }
                .info-card .value {
                    font-size: 24px;
                    font-weight: bold;
                    color: #333;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px;
                }
                th, td {
                    border: 1px solid #ddd;
                    padding: 12px;
                    text-align: left;
                }
                th {
                    background: #f5f5f5;
                    font-weight: bold;
                }
                .total-row {
                    background: #e3f2fd;
                    font-weight: bold;
                }
                .footer {
                    margin-top: 50px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                    text-align: center;
                    color: #666;
                    font-size: 12px;
                }
                @media print {
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🏪 Almacén de Barrio</h1>
                <h2>Reporte de Caja Diaria</h2>
                <p>${fechaFormateada}</p>
            </div>
            
            <div class="info-grid">
                <div class="info-card">
                    <h3>Total de Ventas</h3>
                    <div class="value">${totalVentas}</div>
                </div>
                <div class="info-card">
                    <h3>Total General</h3>
                    <div class="value">${totalGeneral}</div>
                </div>
                <div class="info-card">
                    <h3>💵 Efectivo</h3>
                    <div class="value">${totalEfectivo}</div>
                </div>
                <div class="info-card">
                    <h3>💳 Transferencia</h3>
                    <div class="value">${totalTransferencia}</div>
                </div>
            </div>
            
            <h3>Detalle de Ventas</h3>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Hora</th>
                        <th>Método</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${ventasDelDia
                      .map(
                        (v) => `
                        <tr>
                            <td>#${v.id}</td>
                            <td>${formatTime(v.fecha)}</td>
                            <td>${v.metodo_pago.toUpperCase()}</td>
                            <td>${formatPrice(v.total)}</td>
                        </tr>
                    `,
                      )
                      .join("")}
                </tbody>
            </table>
            
            <div class="footer">
                <p>Generado el ${new Date().toLocaleString("es-AR")}</p>
                <p>Almacén de Barrio - Sistema de Gestión</p>
            </div>
            
            <div class="no-print" style="text-align: center; margin-top: 30px;">
                <button onclick="window.print()" style="padding: 10px 30px; font-size: 16px; cursor: pointer;">
                    🖨️ Imprimir
                </button>
                <button onclick="window.close()" style="padding: 10px 30px; font-size: 16px; cursor: pointer; margin-left: 10px;">
                    ✖️ Cerrar
                </button>
            </div>
        </body>
        </html>
    `);

  ventana.document.close();
}

// Exportar a CSV
function exportarCSV() {
  if (ventasDelDia.length === 0) {
    showAlert("No hay ventas para exportar", "warning");
    return;
  }

  const fecha = document.getElementById("fecha-caja").value;

  // Crear CSV
  let csv = "ID,Fecha,Hora,Método de Pago,Total,Cliente,Teléfono\n";

  ventasDelDia.forEach((v) => {
    const fechaHora = new Date(v.fecha);
    const fecha = fechaHora.toLocaleDateString("es-AR");
    const hora = fechaHora.toLocaleTimeString("es-AR");

    csv += `${v.id},"${fecha}","${hora}","${v.metodo_pago}",${v.total},"${v.cliente_nombre || ""}","${v.cliente_telefono || ""}"\n`;
  });

  // Descargar
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", `caja_${fecha}.csv`);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showAlert("CSV exportado exitosamente", "success");
}

// Funciones de formato
function formatTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
