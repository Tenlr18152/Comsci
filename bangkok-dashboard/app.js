/**
 * Bangkok Smart City Live Dashboard
 * Main Application Script
 */

let map;
let geojsonLayer;
let currentLayer = 'pm25'; // 'pm25' | 'flood' | 'complaints'
let selectedDistrictCode = null;
let districtsDataMap = new Map();
let rawGeojsonData = null;

// Chart JS instances
let pm25HistoryChart = null;
let complaintsBreakdownChart = null;

// Sidebar state tracking
let leftPanelOpen = true;
let rightPanelOpen = true;
let megaMapMode = false;

// ───────────────────────────────────────────────
// Sidebar Toggle Functions
// ───────────────────────────────────────────────

/**
 * Toggle left or right sidebar visibility.
 * @param {'left'|'right'} side
 */
function toggleSidebar(side) {
  const grid = document.querySelector('.workspace-grid');
  if (side === 'left') {
    leftPanelOpen = !leftPanelOpen;
    grid.classList.toggle('left-collapsed', !leftPanelOpen);
    const iconEl = document.getElementById('icon-toggle-left');
    iconEl.setAttribute('data-lucide', leftPanelOpen ? 'panel-left-close' : 'panel-left-open');
    const btnEl = document.getElementById('btn-toggle-left');
    btnEl.classList.toggle('panel-open', leftPanelOpen);
  } else {
    rightPanelOpen = !rightPanelOpen;
    grid.classList.toggle('right-collapsed', !rightPanelOpen);
    const iconEl = document.getElementById('icon-toggle-right');
    iconEl.setAttribute('data-lucide', rightPanelOpen ? 'panel-right-close' : 'panel-right-open');
    const btnEl = document.getElementById('btn-toggle-right');
    btnEl.classList.toggle('panel-open', rightPanelOpen);
  }
  // Update mega map button state
  megaMapMode = !leftPanelOpen && !rightPanelOpen;
  document.getElementById('btn-mega-map').classList.toggle('active-mega', megaMapMode);
  document.getElementById('icon-mega-map').setAttribute('data-lucide', megaMapMode ? 'shrink' : 'expand');
  // Re-render icons and resize the Leaflet map
  lucide.createIcons();
  setTimeout(() => { if (map) map.invalidateSize(); }, 380);
}

/**
 * Toggle mega map mode — collapses both sidebars simultaneously.
 */
function toggleMegaMap() {
  megaMapMode = !megaMapMode;
  const grid = document.querySelector('.workspace-grid');
  if (megaMapMode) {
    // Collapse both
    leftPanelOpen = false;
    rightPanelOpen = false;
    grid.classList.add('left-collapsed', 'right-collapsed');
    document.getElementById('icon-toggle-left').setAttribute('data-lucide', 'panel-left-open');
    document.getElementById('icon-toggle-right').setAttribute('data-lucide', 'panel-right-open');
    document.getElementById('btn-toggle-left').classList.remove('panel-open');
    document.getElementById('btn-toggle-right').classList.remove('panel-open');
    document.getElementById('icon-mega-map').setAttribute('data-lucide', 'shrink');
    document.getElementById('btn-mega-map').classList.add('active-mega');
  } else {
    // Restore both
    leftPanelOpen = true;
    rightPanelOpen = true;
    grid.classList.remove('left-collapsed', 'right-collapsed');
    document.getElementById('icon-toggle-left').setAttribute('data-lucide', 'panel-left-close');
    document.getElementById('icon-toggle-right').setAttribute('data-lucide', 'panel-right-close');
    document.getElementById('btn-toggle-left').classList.add('panel-open');
    document.getElementById('btn-toggle-right').classList.add('panel-open');
    document.getElementById('icon-mega-map').setAttribute('data-lucide', 'expand');
    document.getElementById('btn-mega-map').classList.remove('active-mega');
  }
  lucide.createIcons();
  setTimeout(() => { if (map) map.invalidateSize(); }, 380);
}


// Initialize when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  initDateTime();
  initMap();
  loadDashboardData();
  
  // Initialize Lucide icons
  lucide.createIcons();
});

// 1. Clock and Date Widget
function initDateTime() {
  const timeEl = document.getElementById('live-time');
  const dateEl = document.getElementById('live-date');
  
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  
  function updateTime() {
    const now = new Date();
    timeEl.textContent = now.toLocaleTimeString('th-TH');
    dateEl.textContent = now.toLocaleDateString('th-TH', options);
  }
  
  updateTime();
  setInterval(updateTime, 1000);
}

// 2. Initialize Leaflet Map
function initMap() {
  // Center of Bangkok
  map = L.map('map', {
    zoomControl: false, // Custom position instead
    attributionControl: true
  }).setView([13.7563, 100.5018], 10);
  
  // Custom Zoom Control Position
  L.control.zoom({
    position: 'bottomright'
  }).addTo(map);

  // CartoDB Dark Matter tile layer (Sleek dark map)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
  }).addTo(map);
}

// Reset Zoom helper
function resetMapZoom() {
  if (geojsonLayer) {
    map.fitBounds(geojsonLayer.getBounds(), { padding: [20, 20] });
  } else {
    map.setView([13.7563, 100.5018], 10);
  }
}

// 3. Load GeoJSON & Generate Data
function loadDashboardData() {
  fetch('bangkok-districts.geojson')
    .then(response => {
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    })
    .then(data => {
      rawGeojsonData = data;
      processData(data);
      renderMapLayer();
      renderDistrictsList();
      updateTopOverviewStats();
      renderWelcomeStateRankings();
    })
    .catch(error => {
      console.error('Error loading geojson data:', error);
      document.getElementById('districts-list-container').innerHTML = `
        <div class="loading-state text-danger">
          <i data-lucide="alert-circle" style="width:32px;height:32px;color:red;"></i>
          <span>ไม่สามารถโหลดข้อมูลแผนที่ได้ กรุณารัน server.js และลองใหม่อีกครั้ง</span>
        </div>
      `;
      lucide.createIcons();
    });
}

// Enrich each feature and store in map
function processData(geojson) {
  geojson.features.forEach(feature => {
    const props = feature.properties;
    
    // Extracted properties
    const dcode = props.dcode || String(props.OBJECTID);
    const nameTh = props.dname || 'ไม่ระบุชื่อเขต';
    // Clean district prefix if present
    const cleanNameTh = nameTh.startsWith('เขต') ? nameTh.substring(3) : nameTh;
    const nameEn = props.dname_e || 'Unknown';
    const areaSqm = props.AREA || 10000000;
    const popMale = props.no_male || 0;
    const popFemale = props.no_female || 0;
    const population = popMale + popFemale;

    // Generate dynamic mock smart city stats
    const registry = window.BKKDataRegistry;
    const metrics = registry.generateDistrictMetrics(dcode, nameEn, areaSqm, population);

    // Save enriched metadata
    districtsDataMap.set(dcode, {
      dcode,
      nameTh: cleanNameTh,
      nameEn,
      postcode: props.dcode ? `${props.dcode.substring(0, 2)}000` : '10XXX', // Simplified zip
      areaKm2: parseFloat((areaSqm / 1000000).toFixed(2)),
      population,
      density: Math.round(population / (areaSqm / 1000000)),
      metrics
    });
  });
}

// 4. Tab Switcher
function switchLayer(layerName) {
  currentLayer = layerName;
  
  // Update UI active tab state
  document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
  document.getElementById(`tab-${layerName}`).classList.add('active');
  
  // Re-style map
  renderMapLayer();
  
  // Refresh list sidebar
  renderDistrictsList();
  
  // Update legend
  updateLegend();
  
  // If a district is currently selected, refresh its detail views to display correct layer details
  if (selectedDistrictCode) {
    showDistrictDetails(selectedDistrictCode);
  }
}

// 5. Get colors based on layer values
function getMetricColor(dcode) {
  const item = districtsDataMap.get(dcode);
  if (!item) return '#475569'; // Slate 600 default
  
  if (currentLayer === 'pm25') {
    const val = item.metrics.pm25.value;
    if (val <= 25) return '#10b981'; // Emerald
    if (val <= 37) return '#84cc16'; // Light Green
    if (val <= 50) return '#eab308'; // Yellow
    if (val <= 75) return '#f97316'; // Orange
    return '#ef4444'; // Red
  } 
  
  if (currentLayer === 'flood') {
    const lvl = item.metrics.flood.level;
    if (lvl.includes('ปกติ') || lvl.includes('Safe')) return '#3b82f6'; // Blue
    if (lvl.includes('เฝ้าระวัง') || lvl.includes('Watch')) return '#eab308'; // Yellow
    if (lvl.includes('เตือนภัย') || lvl.includes('Warning')) return '#f97316'; // Orange
    return '#ef4444'; // Red
  }
  
  if (currentLayer === 'complaints') {
    // Solved complaints rate coloring
    const rate = item.metrics.complaints.rate;
    if (rate >= 90) return '#10b981'; // Green (high resolution)
    if (rate >= 85) return '#84cc16'; // Light Green
    if (rate >= 80) return '#eab308'; // Yellow
    if (rate >= 75) return '#f97316'; // Orange
    return '#ef4444'; // Red
  }
}

// Get string display value for list or tooltip
function getFormattedMetricValue(dcode) {
  const item = districtsDataMap.get(dcode);
  if (!item) return '--';

  if (currentLayer === 'pm25') {
    return `${item.metrics.pm25.value} µg/m³`;
  }
  if (currentLayer === 'flood') {
    return item.metrics.flood.level.split(' ')[0]; // Returns Thai status
  }
  if (currentLayer === 'complaints') {
    return `${item.metrics.complaints.rate}% แก้ไข`;
  }
}

// 6. Render Map Choropleth Overlay
function renderMapLayer() {
  if (geojsonLayer) {
    map.removeLayer(geojsonLayer);
  }

  // Create style function
  function style(feature) {
    const dcode = feature.properties.dcode || String(feature.properties.OBJECTID);
    const color = getMetricColor(dcode);
    const isSelected = selectedDistrictCode === dcode;

    return {
      fillColor: color,
      weight: isSelected ? 3 : 1,
      opacity: 1,
      color: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.25)',
      fillOpacity: isSelected ? 0.75 : 0.45,
      dashArray: isSelected ? '' : '3'
    };
  }

  // Actions for hover/click
  function onEachFeature(feature, layer) {
    const dcode = feature.properties.dcode || String(feature.properties.OBJECTID);
    const data = districtsDataMap.get(dcode);
    
    if (data) {
      // Bind hover tooltip
      let metricLabel = '';
      if (currentLayer === 'pm25') metricLabel = `ค่าฝุ่น PM2.5: <b>${data.metrics.pm25.value} µg/m³</b> (${data.metrics.pm25.status.split(' ')[0]})`;
      if (currentLayer === 'flood') metricLabel = `ระดับเตือนภัยน้ำท่วม: <b style="color:${data.metrics.flood.color}">${data.metrics.flood.level}</b>`;
      if (currentLayer === 'complaints') metricLabel = `ร้องเรียนเสร็จสิ้น: <b>${data.metrics.complaints.rate}%</b> (${data.metrics.complaints.solved}/${data.metrics.complaints.total} เรื่อง)`;

      const tooltipContent = `
        <div style="font-family:'Kanit',sans-serif;">
          <strong style="font-size:1.1em; color:#fff;">เขต${data.nameTh} (${data.nameEn})</strong><br>
          <span style="color:#94a3b8; font-size:0.9em;">กลุ่มเขต: ${data.zoneTh}</span>
          <hr style="border:none; border-top:1px solid rgba(255,255,255,0.1); margin:6px 0;">
          <span>${metricLabel}</span>
        </div>
      `;
      layer.bindTooltip(tooltipContent, {
        sticky: true,
        className: 'leaflet-tooltip-custom'
      });
    }

    layer.on({
      mouseover: (e) => {
        const lyr = e.target;
        lyr.setStyle({
          fillOpacity: selectedDistrictCode === dcode ? 0.8 : 0.65,
          weight: selectedDistrictCode === dcode ? 3 : 2,
          color: selectedDistrictCode === dcode ? '#fff' : 'rgba(255, 255, 255, 0.6)'
        });
        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
          lyr.bringToFront();
        }
      },
      mouseout: (e) => {
        geojsonLayer.resetStyle(e.target);
      },
      click: (e) => {
        selectDistrict(dcode);
        map.fitBounds(e.target.getBounds(), { padding: [40, 40] });
      }
    });
  }

  // Load geojson layer
  geojsonLayer = L.geoJSON(rawGeojsonData, {
    style: style,
    onEachFeature: onEachFeature
  }).addTo(map);

  updateLegend();
}

// 7. Update Map Legend Dynamically
function updateLegend() {
  const legendEl = document.getElementById('map-legend');
  
  if (currentLayer === 'pm25') {
    legendEl.innerHTML = `
      <div class="legend-title">ระดับฝุ่น PM2.5</div>
      <div class="legend-item"><div class="legend-color" style="background:#10b981"></div><span>0 - 25: ดีมาก</span></div>
      <div class="legend-item"><div class="legend-color" style="background:#84cc16"></div><span>26 - 37: ดี</span></div>
      <div class="legend-item"><div class="legend-color" style="background:#eab308"></div><span>38 - 50: ปานกลาง</span></div>
      <div class="legend-item"><div class="legend-color" style="background:#f97316"></div><span>51 - 75: เริ่มมีผลต่อสุขภาพ</span></div>
      <div class="legend-item"><div class="legend-color" style="background:#ef4444"></div><span>> 75: มีผลต่อสุขภาพ</span></div>
    `;
  } else if (currentLayer === 'flood') {
    legendEl.innerHTML = `
      <div class="legend-title">ความเสี่ยงภัยน้ำท่วม</div>
      <div class="legend-item"><div class="legend-color" style="background:#3b82f6"></div><span>ปกติ (Safe)</span></div>
      <div class="legend-item"><div class="legend-color" style="background:#eab308"></div><span>เฝ้าระวัง (Watch)</span></div>
      <div class="legend-item"><div class="legend-color" style="background:#f97316"></div><span>เตือนภัย (Warning)</span></div>
      <div class="legend-item"><div class="legend-color" style="background:#ef4444"></div><span>วิกฤต (Critical)</span></div>
    `;
  } else if (currentLayer === 'complaints') {
    legendEl.innerHTML = `
      <div class="legend-title">อัตราแก้เรื่องร้องเรียน (Traffy)</div>
      <div class="legend-item"><div class="legend-color" style="background:#10b981"></div><span>>= 90%: ยอดเยี่ยม (Excellent)</span></div>
      <div class="legend-item"><div class="legend-color" style="background:#84cc16"></div><span>85 - 89%: ดีมาก (Very Good)</span></div>
      <div class="legend-item"><div class="legend-color" style="background:#eab308"></div><span>80 - 84%: ปานกลาง (Moderate)</span></div>
      <div class="legend-item"><div class="legend-color" style="background:#f97316"></div><span>75 - 79%: ต้องปรับปรุง</span></div>
      <div class="legend-item"><div class="legend-color" style="background:#ef4444"></div><span>< 75%: วิกฤต (Critical)</span></div>
    `;
  }
}

// 8. Render Districts List Sidebar (Left)
function renderDistrictsList() {
  const container = document.getElementById('districts-list-container');
  const searchVal = document.getElementById('district-search').value.toLowerCase().trim();
  const zoneVal = document.getElementById('zone-filter').value;
  
  let html = '';
  let count = 0;

  // Sort districts alphabetically by Thai name
  const sortedDistricts = Array.from(districtsDataMap.values()).sort((a, b) => a.nameTh.localeCompare(b.nameTh));

  sortedDistricts.forEach(dist => {
    // Filter matching
    const matchesSearch = dist.nameTh.toLowerCase().includes(searchVal) || dist.nameEn.toLowerCase().includes(searchVal);
    const matchesZone = zoneVal === 'all' || dist.metrics.zoneEn === zoneVal;
    
    if (matchesSearch && matchesZone) {
      count++;
      const isSelected = selectedDistrictCode === dist.dcode;
      const color = getMetricColor(dist.dcode);
      const valText = getFormattedMetricValue(dist.dcode);
      
      // Determine badge text color (dark text for yellow/light-green, light text for others)
      const isLightBg = ['#eab308', '#84cc16'].includes(color);
      const badgeTextColor = isLightBg ? '#0f172a' : '#ffffff';

      html += `
        <div class="district-item ${isSelected ? 'selected' : ''}" onclick="selectDistrict('${dist.dcode}')" id="list-item-${dist.dcode}">
          <div class="dist-name-block">
            <span class="dist-name-th">เขต${dist.nameTh}</span>
            <span class="dist-name-en">${dist.nameEn} • ${dist.metrics.zoneTh}</span>
          </div>
          <span class="dist-val-badge" style="background:${color}; color:${badgeTextColor}; shadow: 0 2px 8px ${color}33">
            ${valText}
          </span>
        </div>
      `;
    }
  });

  if (count === 0) {
    html = `
      <div class="loading-state">
        <i data-lucide="alert-circle" style="width:24px;height:24px;"></i>
        <span>ไม่พบชื่อเขตที่ท่านกำลังค้นหา</span>
      </div>
    `;
  }

  container.innerHTML = html;
  document.getElementById('districts-count').textContent = `${count} เขต`;
  lucide.createIcons();
}

// Filter triggers
function filterDistricts() {
  renderDistrictsList();
}

// 9. Update Top Panel Overview Stats (Averages of all BKK)
function updateTopOverviewStats() {
  const districts = Array.from(districtsDataMap.values());
  if (districts.length === 0) return;

  // Calculate PM2.5 Average
  const pm25Avg = Math.round(districts.reduce((sum, d) => sum + d.metrics.pm25.value, 0) / districts.length);
  document.getElementById('bkk-avg-pm25').textContent = pm25Avg;
  
  const pm25Badge = document.getElementById('bkk-pm25-badge');
  if (pm25Avg <= 37) {
    pm25Badge.textContent = 'คุณภาพดี';
    pm25Badge.className = 'badge badge-success';
  } else if (pm25Avg <= 50) {
    pm25Badge.textContent = 'ปานกลาง';
    pm25Badge.className = 'badge';
    pm25Badge.style.color = '#eab308';
  } else {
    pm25Badge.textContent = 'เริ่มสะสม';
    pm25Badge.className = 'badge';
    pm25Badge.style.color = '#f97316';
  }

  // Calculate Active Flood Zones (Warning or Critical flood alert)
  const activeFloods = districts.filter(d => ['เตือนภัย (Warning)', 'วิกฤต (Critical)'].includes(d.metrics.flood.level)).length;
  document.getElementById('bkk-active-flood').textContent = activeFloods;
  const floodBadge = document.getElementById('bkk-flood-badge');
  if (activeFloods === 0) {
    floodBadge.textContent = 'ปลอดภัย';
    floodBadge.className = 'badge badge-success';
    document.getElementById('bkk-active-flood').className = 'value text-success';
  } else if (activeFloods < 5) {
    floodBadge.textContent = 'เฝ้าระวัง';
    floodBadge.className = 'badge badge-warning';
    document.getElementById('bkk-active-flood').className = 'value text-warning';
  } else {
    floodBadge.textContent = 'ภัยพิบัติ';
    floodBadge.className = 'badge';
    floodBadge.style.background = 'rgba(239, 68, 68, 0.15)';
    floodBadge.style.color = '#ef4444';
    document.getElementById('bkk-active-flood').className = 'value text-danger';
  }

  // Average Traffy Solution Rate
  const avgRate = Math.round(districts.reduce((sum, d) => sum + d.metrics.complaints.rate, 0) / districts.length);
  document.getElementById('bkk-traffy-rate').textContent = avgRate;
}

// 10. Render Welcome Sidebar Data (Default state ranking list)
function renderWelcomeStateRankings() {
  const rankingContainer = document.getElementById('top-pm25-ranking');
  if (districtsDataMap.size === 0) return;

  // Get top 5 districts with highest PM2.5
  const ranked = Array.from(districtsDataMap.values())
    .sort((a, b) => b.metrics.pm25.value - a.metrics.pm25.value)
    .slice(0, 5);

  let html = '';
  ranked.forEach((dist, idx) => {
    html += `
      <div class="rank-item">
        <div class="rank-name-box">
          <span class="rank-num">#${idx + 1}</span>
          <span>เขต${dist.nameTh}</span>
        </div>
        <span class="rank-val">${dist.metrics.pm25.value} µg/m³</span>
      </div>
    `;
  });
  rankingContainer.innerHTML = html;
}

// 11. Select and Highlight District
function selectDistrict(dcode) {
  selectedDistrictCode = dcode;
  
  // Re-style map layer to highlight selection
  if (geojsonLayer) {
    geojsonLayer.eachLayer(layer => {
      const featCode = layer.feature.properties.dcode || String(layer.feature.properties.OBJECTID);
      // Reset or style specifically
      geojsonLayer.resetStyle(layer);
    });
  }

  // Refresh left sidebar selected row style
  document.querySelectorAll('.district-item').forEach(item => item.classList.remove('selected'));
  const listItem = document.getElementById(`list-item-${dcode}`);
  if (listItem) {
    listItem.classList.add('selected');
    listItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // Show detailed sidebar right
  showDistrictDetails(dcode);
}

// Deselect selected district
function deselectDistrict() {
  selectedDistrictCode = null;
  
  // Reset map styles
  if (geojsonLayer) {
    geojsonLayer.eachLayer(layer => geojsonLayer.resetStyle(layer));
  }
  
  // Reset left sidebar list items
  document.querySelectorAll('.district-item').forEach(item => item.classList.remove('selected'));

  // Toggle detail sidebar visibility
  document.getElementById('details-default-state').classList.remove('hidden');
  document.getElementById('details-active-state').classList.add('hidden');
  
  // Re-render rankings in default state
  renderWelcomeStateRankings();
}

// 12. Populate District Data & Render Charts in Sidebar Right
function showDistrictDetails(dcode) {
  const item = districtsDataMap.get(dcode);
  if (!item) return;

  // Toggle visibility of panels
  document.getElementById('details-default-state').classList.add('hidden');
  document.getElementById('details-active-state').classList.remove('hidden');

  // Fill text details
  document.getElementById('det-name-th').textContent = `เขต${item.nameTh}`;
  document.getElementById('det-name-en').textContent = `${item.nameEn} District`;
  document.getElementById('det-postcode').textContent = `รหัสไปรษณีย์ ${item.postcode}`;
  document.getElementById('det-zone').textContent = item.metrics.zoneTh;
  
  // Fill demographics
  document.getElementById('det-pop').textContent = item.population.toLocaleString();
  document.getElementById('det-area').textContent = item.areaKm2.toLocaleString();
  document.getElementById('det-density').textContent = item.density.toLocaleString();

  // Show only details relating to active layer tab
  document.querySelectorAll('.layer-details-section').forEach(sec => sec.classList.add('hidden'));

  if (currentLayer === 'pm25') {
    document.getElementById('detail-section-pm25').classList.remove('hidden');
    document.getElementById('det-pm25-val').textContent = item.metrics.pm25.value;
    
    const statusEl = document.getElementById('det-pm25-status');
    statusEl.textContent = item.metrics.pm25.status;
    statusEl.style.color = item.metrics.pm25.color;
    
    // Set circle border color of gauge display
    document.querySelector('.gauge-display').style.borderColor = item.metrics.pm25.color;

    // Render PM2.5 Chart
    renderPm25Chart(item.dcode, item.metrics.pm25.value);

  } else if (currentLayer === 'flood') {
    document.getElementById('detail-section-flood').classList.remove('hidden');
    
    const lvlEl = document.getElementById('det-flood-lvl');
    lvlEl.textContent = item.metrics.flood.level;
    lvlEl.style.color = item.metrics.flood.color;
    
    document.getElementById('det-flood-status').textContent = item.metrics.flood.status;
    
    // Update wave animation height and display
    const percentVal = item.metrics.flood.waterLevelPercent;
    document.getElementById('det-flood-percent').textContent = `${percentVal}%`;
    
    const waveEl = document.getElementById('det-flood-fluid');
    waveEl.style.height = `${percentVal}%`;
    waveEl.style.background = `linear-gradient(to top, ${item.metrics.flood.color}, ${item.metrics.flood.color}77)`;
    document.querySelector('.fluid-container').style.borderColor = `${item.metrics.flood.color}55`;

  } else if (currentLayer === 'complaints') {
    document.getElementById('detail-section-complaints').classList.remove('hidden');
    
    document.getElementById('det-comp-total').textContent = item.metrics.complaints.total.toLocaleString();
    document.getElementById('det-comp-solved').textContent = item.metrics.complaints.solved.toLocaleString();
    document.getElementById('det-comp-pending').textContent = item.metrics.complaints.pending.toLocaleString();
    document.getElementById('det-comp-rate').textContent = `${item.metrics.complaints.rate}% แก้แล้ว`;

    // Render Chart.js breakdown
    renderComplaintsChart(item.metrics.complaints.breakdown);
  }
  
  lucide.createIcons();
}

// 13. PM2.5 History Chart rendering
function renderPm25Chart(dcode, currentVal) {
  // Generate deterministic past 7 days based on code
  const idNum = parseInt(dcode) || 1000;
  const labels = [];
  const data = [];
  
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    labels.push(d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }));
    
    if (i === 0) {
      data.push(currentVal);
    } else {
      const rand = window.BKKDataRegistry.generateDistrictMetrics(dcode, `Day-${i}`, 10000000, 50000);
      data.push(Math.round(currentVal * 0.75 + rand.pm25.value * 0.25));
    }
  }

  // Clear previous chart instance if exists
  if (pm25HistoryChart) {
    pm25HistoryChart.destroy();
  }

  const ctx = document.getElementById('pm25-history-chart').getContext('2d');
  pm25HistoryChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'แนวโน้ม PM2.5 ย้อนหลัง 7 วัน',
        data: data,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        borderWidth: 2,
        fill: true,
        tension: 0.3,
        pointBackgroundColor: '#10b981'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#94a3b8', font: { size: 9 } }
        },
        x: {
          grid: { display: false },
          ticks: { color: '#94a3b8', font: { size: 9 } }
        }
      }
    }
  });
}

// 14. Complaints categories Breakdown Chart
function renderComplaintsChart(breakdown) {
  if (complaintsBreakdownChart) {
    complaintsBreakdownChart.destroy();
  }

  const ctx = document.getElementById('complaints-breakdown-chart').getContext('2d');
  complaintsBreakdownChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['ถนน/ทางเท้า', 'ขยะ/ความสะอาด', 'ไฟฟ้า/แสงสว่าง', 'น้ำท่วมขัง', 'อื่นๆ'],
      datasets: [{
        data: [
          breakdown.roads,
          breakdown.trash,
          breakdown.lighting,
          breakdown.flooding,
          breakdown.others
        ],
        backgroundColor: [
          '#a855f7', // Purple
          '#14b8a6', // Teal
          '#f59e0b', // Amber
          '#3b82f6', // Blue
          '#64748b'  // Slate
        ],
        borderWidth: 0,
        borderRadius: 4
      }]
    },
    options: {
      indexAxis: 'y', // Horizontal bar chart
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#94a3b8', font: { size: 8 } }
        },
        y: {
          grid: { display: false },
          ticks: { color: '#f8fafc', font: { size: 9 } }
        }
      }
    }
  });
}
