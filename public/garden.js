/**
 * HerbIT - MY GARDEN SCRIPT (garden.js)
 * Manages user personal garden, growth statuses, favorites, and notes
 */

// State
let gardenEntries = [];
let availableCatalog = [];
let activeStatusFilter = 'All';
let searchQuery = '';

// DOM Elements
const gardenGrid = document.getElementById('garden-grid');
const gardenLoading = document.getElementById('garden-loading');
const gardenEmpty = document.getElementById('garden-empty');
const gardenSearch = document.getElementById('garden-search');
const statusPillsContainer = document.getElementById('status-pills');

// Modals
const addModal = document.getElementById('add-modal');
const openAddModalBtn = document.getElementById('open-add-modal-btn');
const closeAddModalBtn = document.getElementById('close-add-modal-btn');
const cancelAddBtn = document.getElementById('cancel-add-btn');
const addPlantForm = document.getElementById('add-plant-form');
const selectPlant = document.getElementById('select-plant');
const selectStatus = document.getElementById('select-status');
const inputNotes = document.getElementById('input-notes');
const inputFav = document.getElementById('input-fav');
const addModalAlert = document.getElementById('add-modal-alert');

const editModal = document.getElementById('edit-modal');
const closeEditModalBtn = document.getElementById('close-edit-modal-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const editEntryForm = document.getElementById('edit-entry-form');
const editEntryId = document.getElementById('edit-entry-id');
const editPlantName = document.getElementById('edit-plant-name');
const editStatus = document.getElementById('edit-status');
const editNotes = document.getElementById('edit-notes');

const logoutBtn = document.getElementById('logout-btn');
const mobileToggle = document.getElementById('mobile-toggle');
const navMenu = document.getElementById('nav-menu');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initGarden();
});

function initGarden() {
  setupEventListeners();
  loadGarden();
  loadCatalogForDropdown();
}

function setupEventListeners() {
  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => navMenu.classList.toggle('open'));
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/login.html';
      } catch (err) {
        window.location.href = '/login.html';
      }
    });
  }

  // Search input
  if (gardenSearch) {
    gardenSearch.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      renderFilteredGarden();
    });
  }

  // Status Filter Pills
  if (statusPillsContainer) {
    statusPillsContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.status-pill-btn');
      if (!btn) return;

      document.querySelectorAll('.status-pill-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      activeStatusFilter = btn.dataset.status;
      syncMetricCardsHighlight(activeStatusFilter);
      renderFilteredGarden();
    });
  }

  // Metric Cards click to filter
  document.querySelectorAll('.garden-stat-card').forEach(card => {
    card.addEventListener('click', () => {
      const filter = card.dataset.filter;
      if (!filter) return;

      activeStatusFilter = filter;
      document.querySelectorAll('.garden-stat-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');

      // Update pill active class
      document.querySelectorAll('.status-pill-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.status === filter);
      });

      renderFilteredGarden();
    });
  });

  // Modal Open/Close
  if (openAddModalBtn) openAddModalBtn.addEventListener('click', openAddModal);
  if (closeAddModalBtn) closeAddModalBtn.addEventListener('click', closeAddModal);
  if (cancelAddBtn) cancelAddBtn.addEventListener('click', closeAddModal);
  if (closeEditModalBtn) closeEditModalBtn.addEventListener('click', closeEditModal);
  if (cancelEditBtn) cancelEditBtn.addEventListener('click', closeEditModal);

  // Forms
  if (addPlantForm) addPlantForm.addEventListener('submit', handleAddPlantSubmit);
  if (editEntryForm) editEntryForm.addEventListener('submit', handleEditEntrySubmit);
}

// Load Garden Entries from Server
async function loadGarden() {
  showLoading(true);
  try {
    const res = await fetch('/api/garden');
    if (res.status === 401) {
      window.location.href = '/login.html?redirect=%2Fgarden.html';
      return;
    }

    const data = await res.json();
    if (data.success) {
      gardenEntries = data.data || [];
      updateMetrics();
      renderFilteredGarden();
    }
  } catch (err) {
    console.error('Error fetching garden entries:', err);
  } finally {
    showLoading(false);
  }
}

// Load Plant Catalog for the Dropdown Selector
async function loadCatalogForDropdown() {
  try {
    const res = await fetch('/api/plants');
    const data = await res.json();
    if (data.success && Array.isArray(data.data)) {
      availableCatalog = data.data;
      populateCatalogDropdown();
    }
  } catch (err) {
    console.warn('Could not load plant catalog dropdown:', err);
  }
}

function populateCatalogDropdown() {
  if (!selectPlant) return;

  // Preserve existing selected value
  selectPlant.innerHTML = '<option value="">-- Choose from 360+ Verified Herbs --</option>';

  // Sort alphabetically by common name
  const sorted = [...availableCatalog].sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  sorted.forEach(plant => {
    const opt = document.createElement('option');
    opt.value = plant._id;
    opt.textContent = `${plant.name} (${plant.scientificName || plant.botanical_name || 'Ayurvedic'})`;
    selectPlant.appendChild(opt);
  });
}

function updateMetrics() {
  const total = gardenEntries.length;
  const growing = gardenEntries.filter(e => e.status === 'Growing').length;
  const mature = gardenEntries.filter(e => e.status === 'Mature').length;
  const favorites = gardenEntries.filter(e => e.isFavorite).length;

  document.getElementById('count-total').textContent = total;
  document.getElementById('count-growing').textContent = growing;
  document.getElementById('count-mature').textContent = mature;
  document.getElementById('count-favorites').textContent = favorites;
}

function syncMetricCardsHighlight(filter) {
  document.querySelectorAll('.garden-stat-card').forEach(c => {
    c.classList.toggle('active', c.dataset.filter === filter);
  });
}

function renderFilteredGarden() {
  let filtered = [...gardenEntries];

  // 1. Status/Favorite Filter
  if (activeStatusFilter === 'Favorites') {
    filtered = filtered.filter(e => e.isFavorite);
  } else if (activeStatusFilter !== 'All') {
    filtered = filtered.filter(e => e.status === activeStatusFilter);
  }

  // 2. Search Query Filter
  if (searchQuery) {
    filtered = filtered.filter(e => {
      const p = e.plantId || {};
      const name = (p.name || '').toLowerCase();
      const sci = (p.scientificName || p.botanical_name || '').toLowerCase();
      const notes = (e.personalNotes || '').toLowerCase();
      return name.includes(searchQuery) || sci.includes(searchQuery) || notes.includes(searchQuery);
    });
  }

  // Render Grid
  gardenGrid.innerHTML = '';

  if (filtered.length === 0) {
    gardenEmpty.style.display = 'block';
    if (gardenEntries.length === 0) {
      document.getElementById('empty-title').textContent = 'Your Garden is Awaiting Its First Seed';
      document.getElementById('empty-sub').textContent = 'Explore over 360+ traditional Ayurvedic herbs in our botanical collection and save them to track their cultivation and care.';
    } else {
      document.getElementById('empty-title').textContent = 'No Matching Herbs Found';
      document.getElementById('empty-sub').textContent = 'Try resetting your search query or selecting a different growth status tab.';
    }
  } else {
    gardenEmpty.style.display = 'none';
    filtered.forEach(entry => {
      const card = createGardenCard(entry);
      gardenGrid.appendChild(card);
    });
  }
}

function createGardenCard(entry) {
  const plant = entry.plantId || {};
  const card = document.createElement('div');
  card.className = 'garden-card';
  card.dataset.id = entry._id;

  const statusClass = 'status-' + (entry.status || '').toLowerCase().replace(/\s+/g, '-');

  // Media HTML (Placeholder leaf badge if image missing or broken)
  const mediaHtml = plant.image
    ? `<img src="${escapeHTML(plant.image)}" alt="${escapeHTML(plant.name)}" onerror="this.onerror=null; this.parentElement.innerHTML=renderPlaceholder('${escapeHTML(plant.name)}', '${escapeHTML(plant.category || 'Ayurvedic')}');">`
    : renderPlaceholder(plant.name, plant.category || 'Ayurvedic');

  card.innerHTML = `
    <div class="garden-card-media">
      ${mediaHtml}
      <button class="garden-fav-btn ${entry.isFavorite ? 'favorited' : ''}" title="${entry.isFavorite ? 'Remove from favorites' : 'Mark as favorite'}" onclick="toggleFavorite('${entry._id}', ${!entry.isFavorite})">
        <i class="fa-${entry.isFavorite ? 'solid' : 'regular'} fa-heart"></i>
      </button>
    </div>

    <div class="garden-card-body">
      <span class="garden-status-tag ${statusClass}">
        ${getStatusIcon(entry.status)} ${escapeHTML(entry.status)}
      </span>

      <h3 class="garden-card-title">${escapeHTML(plant.name || 'Medicinal Herb')}</h3>
      <div class="garden-card-sub">${escapeHTML(plant.scientificName || plant.botanical_name || 'Traditional Flora')}</div>

      ${entry.personalNotes ? `
        <div class="garden-notes-box">
          <i class="fa-solid fa-quote-left" style="color:var(--accent); font-size:0.75rem; margin-right:0.3rem;"></i>
          ${escapeHTML(entry.personalNotes)}
        </div>
      ` : ''}

      <div class="garden-card-actions">
        <button class="btn btn-outline btn-sm" onclick="openEditModal('${entry._id}')" style="border-radius:99px; padding:0.4rem 0.85rem;">
          <i class="fa-solid fa-pen"></i> Update
        </button>
        <button class="btn btn-sm" onclick="confirmDeleteEntry('${entry._id}', '${escapeHTML(plant.name)}')" style="color:#b91c1c; background:none; border:none; margin-left:auto; cursor:pointer;" title="Remove from My Garden">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    </div>
  `;

  return card;
}

function renderPlaceholder(name, category) {
  return `
    <div style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; background:linear-gradient(135deg, #1b4332, #2d6a4f); color:#fff; text-align:center; padding:1rem;">
      <i class="fa-solid fa-leaf" style="font-size:2.2rem; color:#6ee7b7; margin-bottom:0.4rem;"></i>
      <span style="font-weight:700; font-size:1.05rem; font-family:var(--font-heading);">${escapeHTML(name || 'Ayurvedic Plant')}</span>
      <span style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.06em; color:#d1fae5; background:rgba(0,0,0,0.25); padding:0.2rem 0.6rem; border-radius:99px; margin-top:0.25rem;">${escapeHTML(category)}</span>
    </div>
  `;
}

function getStatusIcon(status) {
  switch (status) {
    case 'Want to Grow': return '<i class="fa-solid fa-seedling"></i>';
    case 'Growing': return '<i class="fa-solid fa-sun"></i>';
    case 'Mature': return '<i class="fa-solid fa-tree"></i>';
    case 'Learning': return '<i class="fa-solid fa-book-open"></i>';
    case 'No Longer Growing': return '<i class="fa-solid fa-ban"></i>';
    default: return '<i class="fa-solid fa-leaf"></i>';
  }
}

// Toggle Favorite
window.toggleFavorite = async function(id, newState) {
  try {
    const res = await fetch(`/api/garden/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isFavorite: newState })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      const idx = gardenEntries.findIndex(e => e._id === id);
      if (idx !== -1) {
        gardenEntries[idx].isFavorite = newState;
        updateMetrics();
        renderFilteredGarden();
      }
    }
  } catch (err) {
    console.error('Failed to toggle favorite:', err);
  }
};

// Open Edit Modal
window.openEditModal = function(id) {
  const entry = gardenEntries.find(e => e._id === id);
  if (!entry) return;

  editEntryId.value = entry._id;
  editPlantName.textContent = entry.plantId ? entry.plantId.name : 'Medicinal Herb';
  editStatus.value = entry.status || 'Want to Grow';
  editNotes.value = entry.personalNotes || '';

  editModal.style.display = 'flex';
};

function closeEditModal() {
  editModal.style.display = 'none';
}

async function handleEditEntrySubmit(e) {
  e.preventDefault();
  const id = editEntryId.value;
  const newStatus = editStatus.value;
  const newNotes = editNotes.value.trim();

  try {
    const res = await fetch(`/api/garden/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, personalNotes: newNotes })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      const idx = gardenEntries.findIndex(e => e._id === id);
      if (idx !== -1) {
        gardenEntries[idx].status = newStatus;
        gardenEntries[idx].personalNotes = newNotes;
        updateMetrics();
        renderFilteredGarden();
      }
      closeEditModal();
    } else {
      alert(data.message || 'Error updating entry');
    }
  } catch (err) {
    console.error('Failed to update garden entry:', err);
  }
}

// Confirm & Delete Entry
window.confirmDeleteEntry = async function(id, plantName) {
  const confirmed = confirm(`Are you sure you want to remove "${plantName}" from your personal garden?\n\n(This will not delete the herb from the botanical repository.)`);
  if (!confirmed) return;

  try {
    const res = await fetch(`/api/garden/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (res.ok && data.success) {
      gardenEntries = gardenEntries.filter(e => e._id !== id);
      updateMetrics();
      renderFilteredGarden();
    } else {
      alert(data.message || 'Could not remove entry');
    }
  } catch (err) {
    console.error('Error removing garden entry:', err);
  }
};

// Add Plant Modal Handlers
function openAddModal() {
  addModalAlert.style.display = 'none';
  addPlantForm.reset();
  addModal.style.display = 'flex';
}

function closeAddModal() {
  addModal.style.display = 'none';
}

async function handleAddPlantSubmit(e) {
  e.preventDefault();
  addModalAlert.style.display = 'none';

  const plantId = selectPlant.value;
  const status = selectStatus.value;
  const personalNotes = inputNotes.value.trim();
  const isFavorite = inputFav.checked;

  if (!plantId) {
    showAddAlert('Please choose a medicinal plant from the catalog', 'error');
    return;
  }

  try {
    const res = await fetch('/api/garden', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plantId, status, personalNotes, isFavorite })
    });
    const data = await res.json();

    if (res.ok && data.success) {
      gardenEntries.unshift(data.data);
      updateMetrics();
      renderFilteredGarden();
      closeAddModal();
    } else {
      showAddAlert(data.message || 'Could not add plant to garden', 'error');
    }
  } catch (err) {
    showAddAlert('Network error adding plant', 'error');
  }
}

function showAddAlert(msg, type) {
  addModalAlert.className = `auth-alert ${type}`;
  addModalAlert.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> <span>${escapeHTML(msg)}</span>`;
  addModalAlert.style.display = 'flex';
}

function showLoading(show) {
  if (gardenLoading) gardenLoading.style.display = show ? 'block' : 'none';
  if (show && gardenGrid) gardenGrid.innerHTML = '';
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
