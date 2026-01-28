// Converte dd/mm/aaaa para Date válida
 const filtroBox = document.createElement("div");
 filtroBox.id = "filterBox";
 filtroBox.className = "controls";
 filtroBox.style.right = "12px";
 filtroBox.style.left = "auto";
 filtroBox.style.top = "12px";
 filtroBox.style.zIndex = "600";

 filtroBox.innerHTML = `
  <div style="display:flex;justify-content:space-between;align-items:center;">
      <strong style="font-size:13px;">Filtro de Acidentes</strong>
      <button id="minFilter" aria-label="Minimizar" style="
        background:#7c7b78;color:#fff;border:none;padding:4px 8px;
        border-radius:6px;cursor:pointer;font-size:12px;">–</button>
  </div>

  <label class="legend">Data inicial:</label>
  <input type="date" id="filterStart">

  <label class="legend">Data final:</label>
  <input type="date" id="filterEnd">

  <label class="legend">Tipo de acidente:</label>
  <select id="filterType" style="margin-bottom:6px;">
    <option value="">Todos</option>
    <option value="Colisão">Colisão</option>
    <option value="Abalroamento">Abalroamento</option>
    <option value="Choque">Choque</option>
    <option value="Queda">Queda</option>
    <option value="Atropelamento">Atropelamento</option>
    <option value="Tombamento/Capotamento">Tombamento/Capotamento</option>
    <option value="Danos ao patrimônio público">Danos ao patrimônio público</option>
    <option value="Incêndio/Pane elétrica">Incêndio/Pane elétrica</option>
    <option value="Passageiro passando mal">Passageiro passando mal</option>
  </select>

  <br>

  <label class="legend">Cor do acidente:</label>
  <select id="filterColor" style="margin-bottom:6px;">
  <option value="">Todas</option>
  <option value="red">Vermelho</option>
  <option value="orange">Amarelo</option>
  </select>


  <button id="btnApplyFilter" style="
    background:#1e88e5;color:#fff;border:none;padding:6px;
    border-radius:6px;cursor:pointer;width:100%;margin-top:4px;">
    Aplicar filtros
  </button>
  
  <button id="btnClearFilter" style="
  background:#6b6b6b;
  color:#fff;
  border:none;
  padding:6px;
  border-radius:6px;
  cursor:pointer;
  width:100%;
  margin-top:6px;">
  Limpar filtros
 </button>

  
  <hr style="margin:8px 0;">

  <strong style="font-size:12px;">Dashboard</strong>
  <canvas id="pieChart" width="200" height="200"></canvas>
`;

// adicionar ao body
document.body.appendChild(filtroBox);

// Ícone quando minimizado
const miniFilterIcon = document.createElement("div");
miniFilterIcon.id = "miniFilterIcon";
miniFilterIcon.style = `
  position:absolute; right:12px; top:12px; z-index:600; display:none;
`;
miniFilterIcon.innerHTML = `
  <button style="
    background:#7c7b78;color:#fff;border:none;padding:8px 10px;
    border-radius:10px;cursor:pointer;font-size:13px;">
    Filtros ▸
  </button>
`;
document.body.appendChild(miniFilterIcon);

// Minimizar painel
document.getElementById("minFilter").onclick = () => {
  filtroBox.style.display = "none";
  miniFilterIcon.style.display = "block";
};

miniFilterIcon.onclick = () => {
  filtroBox.style.display = "block";
  miniFilterIcon.style.display = "none";
};

//---------------------------------------------
// GRÁFICO DE PIZZA (TOTAL x FILTRADOS)
//---------------------------------------------
let pieChart = null;

function atualizarGrafico(total, filtrados) {
  const ctx = document.getElementById("pieChart").getContext("2d");

  if (pieChart) {
    pieChart.destroy();
  }

  pieChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Total", "Filtrados"],
      datasets: [{
        data: [total, filtrados],
        backgroundColor: ["#7c7b78", "#1e88e5"]
      }]
    }
  });
}

  document.getElementById("btnApplyFilter").onclick = () => {
  const start = document.getElementById("filterStart").value;
  const end = document.getElementById("filterEnd").value;
  const type = document.getElementById("filterType").value;
  const color = document.getElementById("filterColor").value;

  const di = start ? new Date(start + "T00:00:00") : null;
  const df = end ? new Date(end + "T23:59:59") : null;

  const filtrados = window.allPoints.filter(p => {
    const dataP = p.date ? new Date(p.date + "T12:00:00") : null;
    if (!dataP || isNaN(dataP)) return false;

    if (di && dataP < di) return false;
    if (df && dataP > df) return false;
    if (type && p.type !== type) return false;
    if (color && p.color !== color) return false;

    return true;
  });

  atualizarGrafico(window.allPoints.length, filtrados.length);
  renderizarAcidentes(filtrados);
};


 function applyDateFilter(startDate, endDate) {
    const from = startDate ? new Date(startDate) : null;
    const to = endDate ? new Date(endDate) : null;

    let visibleCount = 0;

    accidents.getLayers().forEach(layer => {
    const d = layer._date ? new Date(layer._date) : null;

    let visible = true;

    if (from && (!d || d < from)) visible = false;
    if (to && (!d || d > to)) visible = false;

    if (visible) {
        layer.addTo(map);
        visibleCount++; // ✅ conta TODOS os acidentes visíveis
    } else {
        map.removeLayer(layer);
    }
});

    document.getElementById("filteredCount").textContent =
        "Total: " + visibleCount;
}


  document.getElementById("btnClearFilter").onclick = () => {
  document.getElementById("filterStart").value = '';
  document.getElementById("filterEnd").value = '';
  document.getElementById("filterType").value = '';
  document.getElementById("filterColor").value = '';

  atualizarGrafico(window.allPoints.length, 0);
  renderizarAcidentes(window.allPoints);
};


window.renderizarAcidentes = function(points) {
  if (!map.hasLayer(accidents)) {
    accidents.addTo(map);
  }

  accidents.clearLayers();

  points.forEach(p => {
    // Marker
    const icon = L.divIcon({
      className: '',
      html: `<div class="heat-circle ${p.color === 'red' ? 'heat-red' : 'heat-yellow'}">${escapeHtml(p.bus)}</div>`,
      iconSize: [18,18]
    });

    L.marker([p.lat, p.lng], { icon }).addTo(accidents);

    // Heat circle
    L.circle([p.lat, p.lng], {
      radius: p.radius || 80,
      fillColor: p.color === 'orange'
        ? 'rgba(255,140,0,0.35)'
        : 'rgba(220,20,60,0.35)',
      fillOpacity: 0.6,
      stroke: false
    }).addTo(accidents);
  });

  console.log("Renderizados:", points.length);
};




