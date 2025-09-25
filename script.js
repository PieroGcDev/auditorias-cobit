// --- Controles definidos ---
const controls = [
  { proceso: "Gestión de accesos", control: "Revisión de accesos", estado: "No Cumplido", observaciones: "" },
  { proceso: "Respaldos", control: "Pruebas de restauración", estado: "No Cumplido", observaciones: "" },
  { proceso: "Parcheo", control: "Actualización de parches críticos", estado: "No Cumplido", observaciones: "" },
  { proceso: "Incidentes", control: "Registro y análisis de incidentes", estado: "No Cumplido", observaciones: "" },
  { proceso: "Capacitación", control: "Capacitación anual", estado: "No Cumplido", observaciones: "" },
  { proceso: "Continuidad", control: "Prueba de plan de continuidad", estado: "No Cumplido", observaciones: "" },
];

// Mapeo proceso -> imagen
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


// --- Información general de la auditoría ---
let auditInfo = null;

// --- Renderizar tabla ---
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
        <input type="text" value="${c.observaciones}" 
          oninput="updateNotes(${index}, this.value)" 
          class="border rounded p-1 w-full" placeholder="Escribir...">
      </td>
      <td class="border p-2 text-center">
        <button onclick="showDiagram('${c.proceso}')" 
          class="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">
          📊 Ver diagrama
        </button>
      </td>
    `;

    tableBody.appendChild(row);
  });

  updateCharts();
}

// --- Actualizar estado ---
function updateStatus(index, value) {
  controls[index].estado = value;
  updateCharts();
}

// --- Actualizar observaciones ---
function updateNotes(index, value) {
  controls[index].observaciones = value;
}

// --- Gráficos ---
const barCtx = document.getElementById("barChart").getContext("2d");
const pieCtx = document.getElementById("pieChart").getContext("2d");

let barChart, pieChart;

function updateCharts() {
  const cumplidos = controls.filter(c => c.estado === "Cumplido").length;
  const noCumplidos = controls.length - cumplidos;

  const procesos = controls.map(c => c.proceso);
  const estados = controls.map(c => (c.estado === "Cumplido" ? 1 : 0));

  if (barChart) barChart.destroy();
  if (pieChart) pieChart.destroy();

  barChart = new Chart(barCtx, {
    type: "bar",
    data: {
      labels: procesos,
      datasets: [{
        label: "Cumplimiento (1 = Cumplido, 0 = No)",
        data: estados,
        backgroundColor: "#3b82f6"
      }]
    }
  });

  pieChart = new Chart(pieCtx, {
    type: "pie",
    data: {
      labels: ["Cumplidos", "No Cumplidos"],
      datasets: [{
        data: [cumplidos, noCumplidos],
        backgroundColor: ["#10b981", "#ef4444"]
      }]
    }
  });
}

// --- Renderizar información general ---
function renderGeneralInfo() {
  let container = document.getElementById("generalInfo");
  if (!container) {
    container = document.createElement("div");
    container.id = "generalInfo";
    container.className = "bg-white shadow-md rounded-lg p-4 mb-6";
    document.querySelector(".p-6").insertBefore(container, document.querySelector(".bg-white.shadow-md.rounded-lg.p-4.mb-6 + .bg-white"));
  }

  if (auditInfo) {
    container.innerHTML = `
      <h2 class="text-lg font-semibold mb-2">Resumen de la Auditoría</h2>
      <p><strong>Auditor:</strong> ${auditInfo.auditor}</p>
      <p><strong>Fecha:</strong> ${auditInfo.fecha}</p>
      <p><strong>Área Auditada:</strong> ${auditInfo.area}</p>
      <p><strong>Observaciones:</strong> ${auditInfo.observaciones || "Ninguna"}</p>
    `;
  }
}

// --- Manejo del formulario de información general ---
const generalForm = document.getElementById("generalForm");
generalForm.addEventListener("submit", (e) => {
  e.preventDefault();
  auditInfo = {
    auditor: document.getElementById("auditor").value,
    fecha: document.getElementById("date").value,
    area: document.getElementById("area").value,
    observaciones: document.getElementById("generalNotes").value,
  };
  renderGeneralInfo();
  generalForm.reset();
});

// --- Inicializar ---
renderTable();

// --- Configuración de Supabase ---
const { createClient } = supabase;
const supabaseUrl = "https://tphsoxsehnraatnodhay.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwaHNveHNlaG5yYWF0bm9kaGF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMTcxMTMsImV4cCI6MjA3Mzc5MzExM30.KL4VYSgRvAFEJJILBn6oXafXI11sq4q4-TBfYsqCSuw";
const client = createClient(supabaseUrl, supabaseKey);

async function cargarControles() {
  const { data, error } = await client.from("controles").select("*");
  if (error) {
    console.error("Error cargando controles:", error);
    return;
  }
  console.log("Controles desde la BD:", data);
}

cargarControles();
