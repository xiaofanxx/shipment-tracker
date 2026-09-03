/**
 * DAILY SHIPMENT PROGRESS TRACKER
 * Pure JavaScript (ES6+), Offline-capable with LocalStorage
 */

const SAMPLE_MASTER = [
  { id: 1, name: "MV OCEAN PEARL / VOY 26W", bl: "BL-SIN-2026-8841", commodity: "Electronics Parts", teu: 8, trucks: 4, eta: "2026-09-03" },
  { id: 2, name: "MV PACIFIC STAR / VOY 12E", bl: "BL-SHA-2026-3392", commodity: "Furniture (Knock-down)", teu: 12, trucks: 6, eta: "2026-09-05" },
  { id: 3, name: "MV ATLAS GLORY / VOY 08S", bl: "BL-HKG-2026-7720", commodity: "Textile & Fabrics", teu: 2, trucks: 2, eta: "2026-09-02" },
  { id: 4, name: "MV BLUE HORIZON / VOY 19N", bl: "BL-NGB-2026-5518", commodity: "Machinery Spare Parts", teu: 6, trucks: 3, eta: "2026-09-07" },
  { id: 5, name: "MV SEA BREEZE / VOY 31W", bl: "BL-BKK-2026-1105", commodity: "Food Ingredients & Beverage", teu: 5, trucks: 5, eta: "2026-09-04" }
];

const SAMPLE_DAILY = [
  { id: 1, date: "2026-08-30", bl: "BL-SIN-2026-8841", status: "Booking Confirmed", location: "Origin Port – Singapore", remarks: "Booking confirmed with carrier, shipping docs submitted" },
  { id: 2, date: "2026-08-31", bl: "BL-SIN-2026-8841", status: "In Transit", location: "On Vessel – Singapore → Jakarta", remarks: "Vessel departed Singapore on schedule" },
  { id: 3, date: "2026-09-01", bl: "BL-SIN-2026-8841", status: "In Transit", location: "Sunda Strait – En route", remarks: "Vessel on track, ETA Tanjung Priok Sep 03 confirmed" },
  { id: 4, date: "2026-08-30", bl: "BL-SHA-2026-3392", status: "In Transit", location: "East China Sea", remarks: "Vessel departed Shanghai port" },
  { id: 5, date: "2026-08-31", bl: "BL-SHA-2026-3392", status: "Arrived at Port", location: "Tanjung Priok – Terminal 2", remarks: "Vessel berthed, container discharge in progress" },
  { id: 6, date: "2026-09-01", bl: "BL-SHA-2026-3392", status: "Customs Clearance", location: "Customs Office – Tanjung Priok", remarks: "PIB lodged, awaiting green line SPPB release" },
  { id: 7, date: "2026-08-31", bl: "BL-HKG-2026-7720", status: "Arrived at Port", location: "Tanjung Priok Port", remarks: "Containers discharged, SPPB customs released" },
  { id: 8, date: "2026-09-01", bl: "BL-HKG-2026-7720", status: "Trucking in Progress", location: "In transit to Cikarang Warehouse", remarks: "2 trucks departed port, delivery scheduled today" },
  { id: 9, date: "2026-09-01", bl: "BL-NGB-2026-5518", status: "Booking Confirmed", location: "Origin Terminal – Ningbo", remarks: "Container stuffing completed, loading on vessel tomorrow" },
  { id: 10, date: "2026-09-01", bl: "BL-BKK-2026-1105", status: "Trucking in Progress", location: "Port gateout to Tangerang factory", remarks: "3 trucks departed, 2 trucks loading at container yard" }
];

let masterShipments = [];
let dailyUpdates = [];

function loadData() {
  try {
    const rawMaster = localStorage.getItem('masterShipments');
    const rawDaily = localStorage.getItem('dailyUpdates');

    masterShipments = rawMaster ? JSON.parse(rawMaster) : [...SAMPLE_MASTER];
    dailyUpdates = rawDaily ? JSON.parse(rawDaily) : [...SAMPLE_DAILY];

    masterShipments.forEach((s, idx) => {
      if (!s.id) s.id = idx + 1;
      s.teu = Number(s.teu) || 0;
      s.trucks = Number(s.trucks) || 0;
    });

    dailyUpdates.forEach((u, idx) => {
      if (!u.id) u.id = idx + 1;
    });

    if (!rawMaster) localStorage.setItem('masterShipments', JSON.stringify(masterShipments));
    if (!rawDaily) localStorage.setItem('dailyUpdates', JSON.stringify(dailyUpdates));

    autoRepairData();
  } catch (e) {
    console.error('Error loading data:', e);
    masterShipments = [...SAMPLE_MASTER];
    dailyUpdates = [...SAMPLE_DAILY];
  }
}

function autoRepairData() {
  let modified = false;
  SAMPLE_MASTER.forEach((sample, idx) => {
    if (masterShipments[idx]) {
      const currentBL = masterShipments[idx].bl;
      if (currentBL && currentBL !== sample.bl) {
        dailyUpdates.forEach(u => {
          if (String(u.bl).trim().toUpperCase() === String(sample.bl).trim().toUpperCase()) {
            u.bl = currentBL;
            modified = true;
          }
        });
      }
    }
  });
  if (modified) saveData();
}

function saveData() {
  try {
    localStorage.setItem('masterShipments', JSON.stringify(masterShipments));
    localStorage.setItem('dailyUpdates', JSON.stringify(dailyUpdates));
  } catch(e) {
    console.error('Save error:', e);
  }
  updateKPIs();
}

function resetToSampleData() {
  if (!confirm('Are you sure you want to reset all data back to the demo sample? Any custom entries will be replaced.')) return;
  masterShipments = JSON.parse(JSON.stringify(SAMPLE_MASTER));
  dailyUpdates = JSON.parse(JSON.stringify(SAMPLE_DAILY));
  saveData();
  renderAll();
  showToast('Reset to demo sample data successfully!', 'info');
}

function getShipmentByBL(bl) {
  if (!bl) return null;
  const targetBL = String(bl).trim().toUpperCase();
  return masterShipments.find(s => String(s.bl).trim().toUpperCase() === targetBL) || null;
}

function getLatestUpdateForBL(bl) {
  if (!bl) return null;
  const targetBL = String(bl).trim().toUpperCase();
  const updates = dailyUpdates
    .filter(u => String(u.bl).trim().toUpperCase() === targetBL)
    .sort((a, b) => b.date.localeCompare(a.date) || Number(b.id) - Number(a.id));
  return updates[0] || null;
}

function getAllUpdatesForBL(bl) {
  if (!bl) return [];
  const targetBL = String(bl).trim().toUpperCase();
  return dailyUpdates
    .filter(u => String(u.bl).trim().toUpperCase() === targetBL)
    .sort((a, b) => b.date.localeCompare(a.date) || Number(b.id) - Number(a.id));
}

function formatDate(isoDate) {
  if (!isoDate) return '—';
  try {
    const parts = String(isoDate).split('-');
    if (parts.length !== 3) return isoDate;
    const [y, m, d] = parts;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthName = months[parseInt(m, 10) - 1] || m;
    return `${d} ${monthName} ${y}`;
  } catch (e) {
    return isoDate;
  }
}

function formatDateShort(isoDate) {
  if (!isoDate) return '—';
  const parts = String(isoDate).split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function getStatusSlug(status) {
  if (!status) return 'unknown';
  return 'status-' + String(status).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function renderStatusBadge(status) {
  if (!status) return '<span class="status-badge status-unknown">No Status</span>';
  const slug = getStatusSlug(status);
  return `<span class="status-badge ${slug}">${escapeHtml(status)}</span>`;
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function nextId(list) {
  return list.length ? Math.max(...list.map(x => Number(x.id) || 0)) + 1 : 1;
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

function updateKPIs() {
  const masterCount = masterShipments.length;
  const totalTEU = masterShipments.reduce((acc, s) => acc + (Number(s.teu) || 0), 0);
  const totalTrucks = masterShipments.reduce((acc, s) => acc + (Number(s.trucks) || 0), 0);
  const totalUpdates = dailyUpdates.length;

  const elCount = document.getElementById('kpiMasterCount');
  const elTEU = document.getElementById('kpiTotalTEU');
  const elTrucks = document.getElementById('kpiTotalTrucks');
  const elUpdates = document.getElementById('kpiTotalUpdates');

  if (elCount) elCount.textContent = masterCount;
  if (elTEU) elTEU.textContent = totalTEU;
  if (elTrucks) elTrucks.textContent = totalTrucks;
  if (elUpdates) elUpdates.textContent = totalUpdates;
}

function renderDaily() {
  const filterDateInput = document.getElementById('filterDate');
  const filterDate = filterDateInput ? filterDateInput.value : '';
  const searchInput = document.getElementById('dailySearchInput');
  const searchTerm = (searchInput ? searchInput.value : '').trim().toLowerCase();
  const noticeBanner = document.getElementById('dailyFilterNotice');
  const noticeText = document.getElementById('filterNoticeDate');

  if (noticeBanner && noticeText) {
    if (filterDate) {
      noticeBanner.style.display = 'flex';
      noticeText.textContent = formatDate(filterDate);
    } else {
      noticeBanner.style.display = 'none';
    }
  }

  let filtered = [...dailyUpdates];
  if (filterDate) filtered = filtered.filter(u => u.date === filterDate);
  if (searchTerm) {
    filtered = filtered.filter(u => {
      const ship = getShipmentByBL(u.bl);
      const searchTarget = [
        u.bl, u.status, u.location, u.remarks,
        ship ? ship.name : '', ship ? ship.commodity : ''
      ].join(' ').toLowerCase();
      return searchTarget.includes(searchTerm);
    });
  }

  filtered.sort((a, b) => b.date.localeCompare(a.date) || Number(b.id) - Number(a.id));
  const tbody = document.getElementById('dailyBody');

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="11" class="empty-state">
          <h4>No daily updates found</h4>
          <p>${filterDate || searchTerm ? 'Try clearing your filters.' : 'Click "+ Add Daily Update" to record an update.'}</p>
        </td>
      </tr>
    `;
  } else {
    tbody.innerHTML = filtered.map(item => {
      const ship = getShipmentByBL(item.bl);
      const teuDisplay = ship ? Number(ship.teu) : '—';
      const trucksDisplay = ship ? Number(ship.trucks) : '—';
      const etaDisplay = ship ? formatDate(ship.eta) : '—';
      const vesselDisplay = ship ? escapeHtml(ship.name) : '<span style="color:#94A3B8;">(Unknown Vessel)</span>';
      const commodityDisplay = ship ? escapeHtml(ship.commodity) : '—';

      return `
        <tr>
          <td><strong>${formatDateShort(item.date)}</strong></td>
          <td><span class="bl-badge">${escapeHtml(item.bl)}</span></td>
          <td><strong>${vesselDisplay}</strong></td>
          <td>${commodityDisplay}</td>
          <td class="text-center meta-count">${teuDisplay}</td>
          <td class="text-center meta-count">${trucksDisplay}</td>
          <td>${etaDisplay}</td>
          <td>${renderStatusBadge(item.status)}</td>
          <td>${escapeHtml(item.location) || '—'}</td>
          <td style="max-width: 240px; font-size: 0.83rem; color: #475569;">${escapeHtml(item.remarks) || '—'}</td>
          <td>
            <div class="cell-actions">
              <button class="btn btn-sm btn-action-edit" onclick="editDaily('${escapeHtml(item.id)}')" title="Edit Update">Edit</button>
              <button class="btn btn-sm btn-action-del" onclick="deleteDaily('${escapeHtml(item.id)}')" title="Delete Update">Del</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  let teuSum = 0;
  let trucksSum = 0;
  const countedBLs = new Set();
  filtered.forEach(r => {
    const key = String(r.bl).trim().toUpperCase();
    if (!countedBLs.has(key)) {
      countedBLs.add(key);
      const ship = getShipmentByBL(r.bl);
      if (ship) {
        teuSum += Number(ship.teu) || 0;
        trucksSum += Number(ship.trucks) || 0;
      }
    }
  });

  const elUpdates = document.getElementById('totalUpdates');
  const elTEU = document.getElementById('totalTEU');
  const elTrucks = document.getElementById('totalTrucks');
  if (elUpdates) elUpdates.textContent = filtered.length;
  if (elTEU) elTEU.textContent = teuSum;
  if (elTrucks) elTrucks.textContent = trucksSum;
}

function setQuickDate(type) {
  if (type === 'today') {
    document.getElementById('filterDate').value = new Date().toISOString().slice(0, 10);
  }
  renderDaily();
}

function clearDateFilter() {
  const filterDateInput = document.getElementById('filterDate');
  const searchInput = document.getElementById('dailySearchInput');
  if (filterDateInput) filterDateInput.value = '';
  if (searchInput) searchInput.value = '';
  renderDaily();
}

function openAddDailyModal() {
  if (masterShipments.length === 0) {
    alert('Please add at least one Master Shipment first before logging daily updates.');
    return;
  }
  document.getElementById('dailyModalTitle').textContent = 'Add Daily Progress Update';
  document.getElementById('dailyForm').reset();
  document.getElementById('dailyId').value = '';
  document.getElementById('dailyDate').value = new Date().toISOString().slice(0, 10);
  populateDailyBLDropdown('');
  clearDailyAutofill();
  openModal('dailyModal');
}

function editDaily(id) {
  const item = dailyUpdates.find(u => String(u.id) === String(id));
  if (!item) return;
  document.getElementById('dailyModalTitle').textContent = 'Edit Daily Progress Update';
  document.getElementById('dailyId').value = String(item.id);
  document.getElementById('dailyDate').value = item.date || '';
  populateDailyBLDropdown(item.bl);
  document.getElementById('dailyBL').value = item.bl;
  document.getElementById('dailyStatus').value = item.status || '';
  document.getElementById('dailyLocation').value = item.location || '';
  document.getElementById('dailyRemarks').value = item.remarks || '';
  autoFillFromBL();
  openModal('dailyModal');
}

function populateDailyBLDropdown(selectedBL) {
  const select = document.getElementById('dailyBL');
  const targetBL = String(selectedBL || '').trim().toUpperCase();
  select.innerHTML = '<option value="">-- Choose Master Shipment --</option>' +
    masterShipments.map(s => {
      const isSel = String(s.bl).trim().toUpperCase() === targetBL ? 'selected' : '';
      return `<option value="${escapeHtml(s.bl)}" ${isSel}>${escapeHtml(s.bl)} — ${escapeHtml(s.name)} (${s.teu} TEU)</option>`;
    }).join('');
}

function autoFillFromBL() {
  const bl = document.getElementById('dailyBL').value;
  const ship = getShipmentByBL(bl);
  if (ship) {
    document.getElementById('dailyShipment').value = ship.name || '';
    document.getElementById('dailyCommodity').value = ship.commodity || '';
    document.getElementById('dailyTEU').value = ship.teu !== undefined ? ship.teu : '';
    document.getElementById('dailyTrucks').value = ship.trucks !== undefined ? ship.trucks : '';
    document.getElementById('dailyETA').value = formatDate(ship.eta);
  } else {
    clearDailyAutofill();
  }
}

function clearDailyAutofill() {
  ['dailyShipment', 'dailyCommodity', 'dailyTEU', 'dailyTrucks', 'dailyETA'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
}

function saveDaily(e) {
  if (e) e.preventDefault();
  const id = document.getElementById('dailyId').value.trim();
  const date = document.getElementById('dailyDate').value;
  const bl = document.getElementById('dailyBL').value.trim();
  const status = document.getElementById('dailyStatus').value;
  const location = document.getElementById('dailyLocation').value.trim();
  const remarks = document.getElementById('dailyRemarks').value.trim();

  if (!date || !bl || !status) {
    alert('Please complete all required fields (Date, BL Number, Status).');
    return;
  }

  const data = { date, bl, status, location, remarks };
  let idx = -1;
  if (id) idx = dailyUpdates.findIndex(u => String(u.id) === String(id));

  if (idx > -1) {
    const currentId = dailyUpdates[idx].id || Number(id) || nextId(dailyUpdates);
    dailyUpdates[idx] = { id: currentId, ...data };
    showToast('Daily update saved successfully!', 'success');
  } else {
    dailyUpdates.unshift({ id: nextId(dailyUpdates), ...data });
    showToast('New daily update added!', 'success');
  }

  saveData();
  closeModal('dailyModal');
  clearDateFilter();
  renderAll();
}

function deleteDaily(id) {
  if (!confirm('Are you sure you want to delete this daily update log?')) return;
  dailyUpdates = dailyUpdates.filter(u => String(u.id) !== String(id));
  saveData();
  renderAll();
  showToast('Daily update deleted.', 'info');
}

function renderMaster() {
  const searchInput = document.getElementById('masterSearchInput');
  const searchTerm = (searchInput ? searchInput.value : '').trim().toLowerCase();
  let list = [...masterShipments];

  if (searchTerm) {
    list = list.filter(s =>
      String(s.name || '').toLowerCase().includes(searchTerm) ||
      String(s.bl || '').toLowerCase().includes(searchTerm) ||
      String(s.commodity || '').toLowerCase().includes(searchTerm)
    );
  }

  const tbody = document.getElementById('masterBody');
  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="empty-state">
          <h4>No Master Shipments Found</h4>
          <p>${searchTerm ? 'No shipments matched your search.' : 'Click "+ Add New Shipment" to create a shipment.'}</p>
        </td>
      </tr>
    `;
  } else {
    tbody.innerHTML = list.map((ship, idx) => {
      const latest = getLatestUpdateForBL(ship.bl);
      return `
        <tr>
          <td class="text-center" style="font-weight: 600; color: #94A3B8;">${idx + 1}</td>
          <td><strong>${escapeHtml(ship.name)}</strong></td>
          <td><span class="bl-badge">${escapeHtml(ship.bl)}</span></td>
          <td>${escapeHtml(ship.commodity)}</td>
          <td class="text-center meta-count">${ship.teu}</td>
          <td class="text-center meta-count">${ship.trucks}</td>
          <td>${formatDate(ship.eta)}</td>
          <td>${latest ? renderStatusBadge(latest.status) : '<span style="color:#94A3B8;font-size:0.8rem;">No update yet</span>'}</td>
          <td>
            <div class="cell-actions">
              <button class="btn btn-sm btn-action-edit" onclick="editMaster('${escapeHtml(ship.id)}')" title="Edit Shipment">Edit</button>
              <button class="btn btn-sm btn-action-history" onclick="viewBLHistory('${escapeHtml(ship.bl)}')" title="View History Timeline">History</button>
              <button class="btn btn-sm btn-action-del" onclick="deleteMaster('${escapeHtml(ship.id)}')" title="Delete Shipment">Del</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  const totalTEU = masterShipments.reduce((sum, s) => sum + (Number(s.teu) || 0), 0);
  const totalTrucks = masterShipments.reduce((sum, s) => sum + (Number(s.trucks) || 0), 0);

  const elCount = document.getElementById('masterTotalCount');
  const elTEU = document.getElementById('masterTotalTEU');
  const elTrucks = document.getElementById('masterTotalTrucks');
  if (elCount) elCount.textContent = masterShipments.length;
  if (elTEU) elTEU.textContent = totalTEU;
  if (elTrucks) elTrucks.textContent = totalTrucks;
}

function openAddMasterModal() {
  document.getElementById('masterModalTitle').textContent = 'Add New Master Shipment';
  document.getElementById('masterForm').reset();
  document.getElementById('masterId').value = '';
  const autoLogWrap = document.getElementById('masterAutoLogDailyWrap');
  if (autoLogWrap) autoLogWrap.style.display = 'block';
  const autoLogCheckbox = document.getElementById('masterAutoLogDaily');
  if (autoLogCheckbox) autoLogCheckbox.checked = true;
  openModal('masterModal');
}

function editMaster(id) {
  let item = masterShipments.find(s => String(s.id) === String(id));
  if (!item) item = masterShipments.find(s => Number(s.id) === Number(id));
  if (!item) return;

  document.getElementById('masterModalTitle').textContent = 'Edit Master Shipment';
  document.getElementById('masterId').value = String(item.id);
  document.getElementById('masterName').value = item.name || '';
  document.getElementById('masterBL').value = item.bl || '';
  document.getElementById('masterCommodity').value = item.commodity || '';
  document.getElementById('masterTEU').value = item.teu !== undefined ? item.teu : '';
  document.getElementById('masterTrucks').value = item.trucks !== undefined ? item.trucks : '';
  document.getElementById('masterETA').value = item.eta || '';

  const autoLogWrap = document.getElementById('masterAutoLogDailyWrap');
  if (autoLogWrap) autoLogWrap.style.display = 'none';

  openModal('masterModal');
}

function saveMaster(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }

  const id = document.getElementById('masterId').value.trim();
  const newBL = document.getElementById('masterBL').value.trim();
  const name = document.getElementById('masterName').value.trim();
  const commodity = document.getElementById('masterCommodity').value.trim();
  const rawTEU = document.getElementById('masterTEU').value;
  const rawTrucks = document.getElementById('masterTrucks').value;
  const eta = document.getElementById('masterETA').value;

  const teu = Number(rawTEU);
  const trucks = Number(rawTrucks);

  if (!name) { alert('Please enter Shipment Name / Vessel.'); return; }
  if (!newBL) { alert('Please enter BL Number.'); return; }
  if (!commodity) { alert('Please enter Commodity.'); return; }
  if (isNaN(teu) || rawTEU === '') { alert('Please enter a valid Volume (TEU).'); return; }
  if (isNaN(trucks) || rawTrucks === '') { alert('Please enter a valid Trucking Needed count.'); return; }
  if (!eta) { alert('Please select an ETA Date.'); return; }

  let isDuplicate = false;
  for (let i = 0; i < masterShipments.length; i++) {
    const s = masterShipments[i];
    if (String(s.bl).trim().toUpperCase() === newBL.toUpperCase()) {
      if (id && String(s.id) !== String(id)) {
        isDuplicate = true;
        break;
      } else if (!id) {
        isDuplicate = true;
        break;
      }
    }
  }

  if (isDuplicate) {
    alert('A shipment with BL Number "' + newBL + '" already exists. BL Number must be unique!');
    return;
  }

  let updatedIdx = -1;
  if (id) {
    updatedIdx = masterShipments.findIndex(s => String(s.id) === String(id));
    if (updatedIdx === -1) {
      updatedIdx = masterShipments.findIndex(s => String(s.bl).trim().toUpperCase() === newBL.toUpperCase());
    }
  }

  if (updatedIdx > -1) {
    const oldBL = masterShipments[updatedIdx].bl;
    const targetId = masterShipments[updatedIdx].id || id || nextId(masterShipments);

    masterShipments[updatedIdx] = {
      id: targetId,
      name: name,
      bl: newBL,
      commodity: commodity,
      teu: teu,
      trucks: trucks,
      eta: eta
    };

    if (oldBL && oldBL !== newBL) {
      dailyUpdates.forEach(u => {
        if (String(u.bl).trim().toUpperCase() === String(oldBL).trim().toUpperCase()) {
          u.bl = newBL;
        }
      });
    }

    saveData();
    showToast('Shipment updated! Volume: ' + teu + ' TEU, Trucks: ' + trucks, 'success');
  } else {
    const newId = nextId(masterShipments);
    masterShipments.push({
      id: newId,
      name: name,
      bl: newBL,
      commodity: commodity,
      teu: teu,
      trucks: trucks,
      eta: eta
    });

    const autoLogDaily = document.getElementById('masterAutoLogDaily');
    if (autoLogDaily && autoLogDaily.checked) {
      const today = new Date().toISOString().slice(0, 10);
      dailyUpdates.unshift({
        id: nextId(dailyUpdates),
        date: today,
        bl: newBL,
        status: "Booking Confirmed",
        location: "Origin Port / Warehouse",
        remarks: "Shipment registered (" + teu + " TEU, " + trucks + " Trucks needed)"
      });
    }

    saveData();
    showToast('New shipment added! Volume: ' + teu + ' TEU, Trucks: ' + trucks, 'success');
  }

  closeModal('masterModal');
  renderAll();
}

function deleteMaster(id) {
  const ship = masterShipments.find(s => String(s.id) === String(id));
  if (!ship) return;
  const count = dailyUpdates.filter(u => String(u.bl).trim().toUpperCase() === String(ship.bl).trim().toUpperCase()).length;
  const msg = count > 0
    ? `Delete shipment "${ship.bl}" (${ship.name})?\n\nNOTE: This shipment has ${count} recorded daily update(s). Deleting will also remove its associated update logs.`
    : `Delete shipment "${ship.bl}" (${ship.name})?`;

  if (!confirm(msg)) return;

  masterShipments = masterShipments.filter(s => String(s.id) !== String(id));
  dailyUpdates = dailyUpdates.filter(u => String(u.bl).trim().toUpperCase() !== String(ship.bl).trim().toUpperCase());

  saveData();
  renderAll();
  showToast('Shipment and related records deleted.', 'info');
}

function renderSummary() {
  const container = document.getElementById('summaryContent');
  if (!container) return;

  const statusFilterEl = document.getElementById('summaryStatusFilter');
  const statusFilter = statusFilterEl ? statusFilterEl.value : '';
  const searchEl = document.getElementById('summarySearchInput');
  const searchTerm = (searchEl ? searchEl.value : '').trim().toLowerCase();

  let list = [...masterShipments];
  list = list.filter(ship => {
    const latest = getLatestUpdateForBL(ship.bl);
    const latestStatus = latest ? latest.status : '';
    if (statusFilter && latestStatus !== statusFilter) return false;
    if (searchTerm) {
      const target = [
        ship.name, ship.bl, ship.commodity, latestStatus,
        latest ? latest.location : '', latest ? latest.remarks : ''
      ].join(' ').toLowerCase();
      if (!target.includes(searchTerm)) return false;
    }
    return true;
  });

  if (list.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <h4>No Shipments to display</h4>
        <p>${statusFilter || searchTerm ? 'Try adjusting your search or filter.' : 'Master shipment records will appear here.'}</p>
      </div>
    `;
    return;
  }

  container.innerHTML = list.map(ship => {
    const history = getAllUpdatesForBL(ship.bl);
    const latest = history[0];
    return `
      <div class="summary-card">
        <div class="card-top">
          <h3 class="card-title">${escapeHtml(ship.name)}</h3>
          ${latest ? renderStatusBadge(latest.status) : '<span class="status-badge status-unknown">No Status</span>'}
        </div>
        <div class="card-bl-wrap">
          <span class="bl-badge">${escapeHtml(ship.bl)}</span>
          <span class="commodity-tag">${escapeHtml(ship.commodity)}</span>
        </div>
        <div class="card-metrics">
          <div class="metric-col">
            <span class="metric-col-label">Volume</span>
            <span class="metric-col-val" style="color:#1F4E79;">${ship.teu} TEU</span>
          </div>
          <div class="metric-col">
            <span class="metric-col-label">Trucks</span>
            <span class="metric-col-val" style="color:#1F4E79;">${ship.trucks} Trucks</span>
          </div>
          <div class="metric-col">
            <span class="metric-col-label">ETA</span>
            <span class="metric-col-val">${formatDate(ship.eta)}</span>
          </div>
        </div>
        <div class="card-latest-section">
          <div class="latest-header">
            <span class="latest-title-label">Latest Progress Update</span>
            <span style="font-size:0.75rem; font-weight:600; color:#64748B;">${latest ? formatDate(latest.date) : '—'}</span>
          </div>
          ${latest ? `
            <div class="latest-location">
              📍 ${escapeHtml(latest.location) || 'Location not specified'}
            </div>
            <div class="latest-remarks">
              "${escapeHtml(latest.remarks) || 'No remarks recorded.'}"
            </div>
          ` : `
            <div style="color: #94A3B8; font-size: 0.85rem; padding: 6px 0;">No daily progress updates recorded yet.</div>
          `}
        </div>
        <div class="card-footer">
          <span><strong>${history.length}</strong> update log(s) recorded</span>
          <button class="btn btn-sm btn-secondary" onclick="viewBLHistory('${escapeHtml(ship.bl)}')">
            View Timeline &rarr;
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function viewBLHistory(bl) {
  const ship = getShipmentByBL(bl);
  const updates = getAllUpdatesForBL(bl);

  document.getElementById('historyModalTitle').textContent = `Shipment Timeline: ${bl}`;
  document.getElementById('historyModalSub').textContent = ship ? `${ship.name} • ${ship.commodity} (${ship.teu} TEU, ${ship.trucks} Trucks)` : `BL: ${bl}`;

  const container = document.getElementById('historyTimelineContent');
  if (updates.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <h4>No timeline logs found</h4>
        <p>No daily progress has been recorded for BL: ${escapeHtml(bl)}.</p>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div class="timeline-list">
        ${updates.map(item => `
          <div class="timeline-item">
            <div class="timeline-dot"></div>
            <div class="timeline-content">
              <div class="timeline-meta">
                <span class="timeline-date">${formatDate(item.date)}</span>
                ${renderStatusBadge(item.status)}
              </div>
              <div style="font-size: 0.88rem; font-weight: 600; color: #1E293B; margin-bottom: 4px;">
                📍 ${escapeHtml(item.location) || 'Location not specified'}
              </div>
              <div style="font-size: 0.84rem; color: #475569;">
                ${escapeHtml(item.remarks) || '—'}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }
  openModal('historyModal');
}

function exportDataToCSV() {
  if (dailyUpdates.length === 0) {
    alert('No data available to export.');
    return;
  }
  const headers = ["Log Date", "BL Number", "Shipment Name / Vessel", "Commodity", "TEU", "Trucks Needed", "ETA", "Status", "Location / Stage", "Remarks / Activity"];
  const rows = dailyUpdates.map(item => {
    const ship = getShipmentByBL(item.bl);
    return [
      item.date,
      item.bl,
      ship ? ship.name : '',
      ship ? ship.commodity : '',
      ship ? ship.teu : '',
      ship ? ship.trucks : '',
      ship ? ship.eta : '',
      item.status,
      `"${(item.location || '').replace(/"/g, '""')}"`,
      `"${(item.remarks || '').replace(/"/g, '""')}"`
    ];
  });

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  const today = new Date().toISOString().slice(0, 10);
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `daily_shipment_progress_${today}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('CSV export downloaded successfully!', 'success');
}

function openModal(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.remove('open');
    document.body.style.overflow = '';
  }
}

document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
    document.body.style.overflow = '';
  }
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach(m => {
      m.classList.remove('open');
    });
    document.body.style.overflow = '';
  }
});

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const targetTab = btn.dataset.tab;
    document.querySelectorAll('.tab-btn').forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
    const panel = document.getElementById(`tab-${targetTab}`);
    if (panel) panel.classList.add('active');

    if (targetTab === 'summary') renderSummary();
    if (targetTab === 'master') renderMaster();
    if (targetTab === 'daily') renderDaily();
  });
});

const dailyBLSelect = document.getElementById('dailyBL');
if (dailyBLSelect) {
  dailyBLSelect.addEventListener('change', autoFillFromBL);
  dailyBLSelect.addEventListener('input', autoFillFromBL);
}

const filterDateEl = document.getElementById('filterDate');
if (filterDateEl) {
  filterDateEl.addEventListener('change', renderDaily);
}

function renderAll() {
  updateKPIs();
  renderMaster();
  renderDaily();
  renderSummary();
}

function init() {
  loadData();
  const now = new Date();
  const options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
  const dateStr = now.toLocaleDateString('en-GB', options);
  const todayDateText = document.getElementById('todayDateText');
  if (todayDateText) todayDateText.textContent = dateStr;
  renderAll();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
