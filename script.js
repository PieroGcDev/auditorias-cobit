// --- CONTROLES ---
const controls = [
  { proceso: "Gestión de accesos", control: "Revisión de accesos", estado: "No Cumplido", observaciones: "" },
  { proceso: "Respaldos", control: "Pruebas de restauración", estado: "No Cumplido", observaciones: "" },
  { proceso: "Parcheo", control: "Actualización de parches críticos", estado: "No Cumplido", observaciones: "" },
  { proceso: "Incidentes", control: "Registro y análisis de incidentes", estado: "No Cumplido", observaciones: "" },
  { proceso: "Capacitación", control: "Capacitación anual", estado: "No Cumplido", observaciones: "" },
  { proceso: "Continuidad", control: "Prueba de plan de continuidad", estado: "No Cumplido", observaciones: "" },
];

// --- DIAGRAMAS ---
const diagrams = {
  "Gestión de accesos": "img/accesos.drawio.png",
  "Respaldos": "img/respaldo.drawio.png",
  "Parcheo": "img/parcheo.drawio.png",
  "Incidentes": "img/monitoreo.drawio.png",
  "Capacitación": "img/capacitación.drawio.png",
  "Continuidad": "img/continuidad.drawio.png",
};

function showDiagram(proceso) {
  const modal = document.getElementById("diagramModal");
  const title = document.getElementById("diagramTitle");
  const image = document.getElementById("diagramImage");
  title.textContent = `Diagrama: ${proceso}`;
  image.src = diagrams[proceso] || "";
  modal.classList.remove("hidden");
}
function closeDiagram() {
  document.getElementById("diagramModal").classList.add("hidden");
}

// --- DATOS ---
let auditInfo = null;

// --- RENDER TABLA ---
const tableBody = document.getElementById("auditTable");
function renderTable() {
  tableBody.innerHTML = "";
  controls.forEach((c, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="border p-2">${c.proceso}</td>
      <td class="border p-2">${c.control}</td>
      <td class="border p-2">
        <select onchange="updateStatus(${index}, this.value)" class="border rounded p-1">
          <option value="Cumplido" ${c.estado === "Cumplido" ? "selected" : ""}>✔ Cumplido</option>
          <option value="No Cumplido" ${c.estado === "No Cumplido" ? "selected" : ""}>❌ No Cumplido</option>
        </select>
      </td>
      <td class="border p-2">
        <input type="text" value="${c.observaciones}" oninput="updateNotes(${index}, this.value)" class="border rounded p-1 w-full">
      </td>
      <td class="border p-2 text-center">
        <button onclick="showDiagram('${c.proceso}')" class="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">📊 Ver diagrama</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}
function updateStatus(index, value) { controls[index].estado = value; }
function updateNotes(index, value) { controls[index].observaciones = value; }

// --- SUPABASE ---
const { createClient } = supabase;
const supabaseUrl = "https://tphsoxsehnraatnodhay.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwaHNveHNlaG5yYWF0bm9kaGF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMTcxMTMsImV4cCI6MjA3Mzc5MzExM30.KL4VYSgRvAFEJJILBn6oXafXI11sq4q4-TBfYsqCSuw";
const client = createClient(supabaseUrl, supabaseKey);

async function cargarControles() {
  const { data, error } = await client.from("controles").select("*");
  if (error) console.error("Error cargando controles:", error);
  console.log("Controles desde la BD:", data);
}
cargarControles();

// --- BOTÓN GUARDAR ---
document.getElementById("saveBtn").addEventListener("click", async () => {
  auditInfo = {
    auditor: document.getElementById("auditor").value,
    fecha: document.getElementById("date").value,
    area: document.getElementById("area").value,
    observaciones: document.getElementById("generalNotes").value,
  };

  try {
    const { data: auditoria, error: errorAuditoria } = await client.from("auditoria_general").insert([auditInfo]).select();
    if (errorAuditoria) throw errorAuditoria;
    const auditoriaId = auditoria[0].id;

    const controlesConFK = controls.map(c => ({ ...c, auditoria_id: auditoriaId }));
    const { error: errorControles } = await client.from("controles").insert(controlesConFK);
    if (errorControles) throw errorControles;

    alert("✅ Auditoría guardada correctamente");
    renderSummary();
    renderCharts();
  } catch (err) {
    console.error(err);
    alert("❌ Error guardando auditoría");
  }
});

// Botón Historial
document.getElementById("historyBtn").addEventListener("click", () => {
  window.open("historial.html", "_blank");
});


// --- RENDER RESUMEN ---
function renderSummary() {
  const summaryContainer = document.getElementById("summarySection");
  summaryContainer.innerHTML = `
    <h2 class="text-lg font-semibold mb-2">Resumen de la Auditoría</h2>
    <p><strong>Auditor:</strong> ${auditInfo.auditor}</p>
    <p><strong>Fecha:</strong> ${auditInfo.fecha}</p>
    <p><strong>Área Auditada:</strong> ${auditInfo.area}</p>
    <p><strong>Observaciones:</strong> ${auditInfo.observaciones || "Ninguna"}</p>

    <!-- Contenedor para gráficos -->
    <div class="grid grid-cols-3 gap-4 mt-4">
      <div class="col-span-2">
        <canvas id="barChart"></canvas>
      </div>
      <div class="col-span-1 flex justify-center">
        <canvas id="pieChart" style="max-width: 250px; max-height: 250px;"></canvas>
      </div>
    </div>
  `;
}


// --- RENDER GRÁFICOS ---
function renderCharts() {
  const cumplidos = controls.filter(c => c.estado === "Cumplido").length;
  const noCumplidos = controls.length - cumplidos;
  const procesos = controls.map(c => c.proceso);
  const estados = controls.map(c => (c.estado === "Cumplido" ? 1 : 0));

  const barCtx = document.getElementById("barChart").getContext("2d");
  const pieCtx = document.getElementById("pieChart").getContext("2d");

  new Chart(barCtx, {
    type: "bar",
    data: { labels: procesos, datasets: [{ label: "Cumplimiento", data: estados, backgroundColor: "#3b82f6" }] }
  });
  new Chart(pieCtx, {
    type: "pie",
    data: { labels: ["Cumplidos", "No Cumplidos"], datasets: [{ data: [cumplidos, noCumplidos], backgroundColor: ["#10b981", "#ef4444"] }] }
  });
}

renderTable();