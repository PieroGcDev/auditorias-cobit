// ⚡ Configura tu conexión
const SUPABASE_URL = 'https://tphsoxsehnraatnodhay.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwaHNveHNlaG5yYWF0bm9kaGF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMTcxMTMsImV4cCI6MjA3Mzc5MzExM30.KL4VYSgRvAFEJJILBn6oXafXI11sq4q4-TBfYsqCSuw';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const form = document.getElementById('auditForm');
const tableBody = document.querySelector('#auditTable tbody');
const kpiResults = document.getElementById('kpiResults');

// 📥 Al cargar, mostrar auditorías existentes
document.addEventListener('DOMContentLoaded', loadAudits);

async function loadAudits() {
  const { data, error } = await supabase.from('auditorias').select('*');
  if (error) {
    console.error('Error al cargar auditorías:', error);
    return;
  }
  console.log('Datos recibidos de Supabase:', data); 
  renderTable(data);
  calculateKPIs(data);
}

// 📤 Al enviar formulario
form.addEventListener('submit', async e => {
  e.preventDefault();

  const auditor = document.getElementById('auditor').value;
  const process = document.getElementById('process').value;
  const controls = parseInt(document.getElementById('controls').value);
  const complied = parseInt(document.getElementById('complied').value);
  const compliance = ((complied / controls) * 100).toFixed(2);

  const { data, error } = await supabase.from('auditorias').insert([
    { auditor, process, controls, complied, compliance }
  ]);

  if (error) {
    alert('Error al guardar auditoría');
    console.error(error);
    return;
  }

  form.reset();
  loadAudits(); // recargar tabla
});

// 📋 Renderizar tabla
function renderTable(audits) {
  tableBody.innerHTML = '';
  audits.forEach(a => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${a.auditor}</td>
      <td>${a.process}</td>
      <td>${a.controls}</td>
      <td>${a.complied}</td>
      <td>${a.compliance}%</td>
    `;
    tableBody.appendChild(row);
  });
}

// 📊 Calcular KPIs
function calculateKPIs(audits) {
  if (audits.length === 0) {
    kpiResults.innerHTML = '<p>No hay datos registrados.</p>';
    return;
  }

  const totalAudits = audits.length;
  const avgCompliance = (
    audits.reduce((sum, a) => sum + parseFloat(a.compliance), 0) / totalAudits
  ).toFixed(2);

  const failedAudits = audits.filter(a => a.compliance < 70).length;

  kpiResults.innerHTML = `
    <p>🔢 Total de auditorías: <strong>${totalAudits}</strong></p>
    <p>📈 Promedio de cumplimiento: <strong>${avgCompliance}%</strong></p>
    <p>⚠️ Auditorías con bajo cumplimiento (&lt;70%): <strong>${failedAudits}</strong></p>
  `;
}
