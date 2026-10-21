/**
 * HerbIT - ADMIN SCRIPT (admin.js)
 * Full CRUD Interface for managing medicinal plants with MongoDB Atlas
 */

// State Management
let adminPlants = [];
let isEditMode = false;
let currentEditId = null;
let plantIdToDelete = null;

// DOM Elements - Form
const plantForm = document.getElementById('plant-form');
const plantIdInput = document.getElementById('plant-id');
const plantNameInput = document.getElementById('plant-name');
const plantScientificInput = document.getElementById('plant-scientific');
const plantCategoryInput = document.getElementById('plant-category');
const plantImageInput = document.getElementById('plant-image');
const plantDescInput = document.getElementById('plant-description');
const plantBenefitsInput = document.getElementById('plant-benefits');
const plantPartsInput = document.getElementById('plant-parts');
const plantCultivationInput = document.getElementById('plant-cultivation');

// Form UI Elements
const formTitle = document.getElementById('form-title');
const formSubtitle = document.getElementById('form-subtitle');
const formModeIcon = document.getElementById('form-mode-icon');
const submitBtn = document.getElementById('submit-btn');
const submitBtnText = document.getElementById('submit-btn-text');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const imagePreviewBox = document.getElementById('image-preview-box');
const imagePreviewImg = document.getElementById('image-preview-img');

// Table & UI Elements
const plantsTableBody = document.getElementById('plants-table-body');
const tableContainer = document.getElementById('table-container');
const adminLoading = document.getElementById('admin-loading');
const adminEmpty = document.getElementById('admin-empty');
const adminSearch = document.getElementById('admin-search');
const statTotalCount = document.getElementById('stat-total-count');
const statApiStatus = document.getElementById('stat-api-status');
const seedDataBtn = document.getElementById('seed-data-btn');
const seedEmptyBtn = document.getElementById('seed-empty-btn');

// Delete Modal Elements
const deleteModal = document.getElementById('delete-modal');
const deletePlantName = document.getElementById('delete-plant-name');
const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');

// Toast Container
const toastContainer = document.getElementById('toast-container');

// =============================================================================
// Initialization
// =============================================================================
document.addEventListener('DOMContentLoaded', () => {
  initAdmin();
});

function initAdmin() {
  checkAdminSession();
  setupAdminTabs();
  loadAdminStats();
  fetchAdminPlants();
  loadAdminUsers();
  loadAdminSubmissions();
  setupAdminEventListeners();
}

async function checkAdminSession() {
  try {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    if (data && data.authenticated && data.user) {
      const userDisplay = document.getElementById('admin-user-display');
      const userName = document.getElementById('admin-user-name');
      if (userDisplay && userName) {
        userName.textContent = data.user.name;
        userDisplay.style.display = 'inline-flex';
      }
    }
  } catch (err) {
    console.warn('Admin session check notice:', err);
  }
}

function setupAdminEventListeners() {
  // Admin Logout Button
  const adminLogoutBtn = document.getElementById('admin-logout-btn');
  if (adminLogoutBtn) {
    adminLogoutBtn.addEventListener('click', async () => {
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/login.html';
      } catch (err) {
        window.location.href = '/login.html';
      }
    });
  }

  // Form Submission (Add or Edit)
  if (plantForm) {
    plantForm.addEventListener('submit', handleFormSubmit);
  }

  // Cancel Edit Button
  if (cancelEditBtn) {
    cancelEditBtn.addEventListener('click', resetFormToAddMode);
  }

  // Image URL Input live preview
  if (plantImageInput) {
    plantImageInput.addEventListener('input', (e) => {
      const url = e.target.value.trim();
      if (url && isValidHttpUrl(url)) {
        imagePreviewImg.src = url;
        imagePreviewBox.style.display = 'block';
        imagePreviewImg.onerror = () => {
          imagePreviewBox.style.display = 'none';
        };
      } else {
        imagePreviewBox.style.display = 'none';
      }
    });
  }

  // Admin Table Filter
  if (adminSearch) {
    adminSearch.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      filterAdminTable(query);
    });
  }

  // Seed / Reset Sample Data Buttons
  if (seedDataBtn) {
    seedDataBtn.addEventListener('click', handleSeedData);
  }
  if (seedEmptyBtn) {
    seedEmptyBtn.addEventListener('click', handleSeedData);
  }

  // Delete Modal Buttons
  if (cancelDeleteBtn) {
    cancelDeleteBtn.addEventListener('click', closeDeleteModal);
  }
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', executeDelete);
  }

  // Close modal when clicking backdrop
  if (deleteModal) {
    deleteModal.addEventListener('click', (e) => {
      if (e.target === deleteModal) {
        closeDeleteModal();
      }
    });
  }
}

// =============================================================================
// READ (GET /api/plants)
// =============================================================================
async function fetchAdminPlants() {
  showAdminLoading();

  try {
    const response = await fetch('/api/plants');
    
    if (!response.ok) {
      throw new Error(`Server status: ${response.status}`);
    }

    const result = await response.json();

    if (result.success && Array.isArray(result.data)) {
      adminPlants = result.data;
      updateStats(true, adminPlants.length);
      renderAdminTable(adminPlants);
    } else {
      throw new Error(result.message || 'Failed to retrieve plants data');
    }
  } catch (error) {
    console.error('Error fetching admin plants:', error);
    updateStats(false, 0);
    showToast(`Error connecting to MongoDB: ${error.message}`, 'error');
    showAdminEmpty();
  }
}

function renderAdminTable(plants) {
  if (!plants || plants.length === 0) {
    showAdminEmpty();
    return;
  }

  showAdminTable();
  plantsTableBody.innerHTML = '';

  plants.forEach((plant) => {
    const row = document.createElement('tr');
    row.setAttribute('data-id', plant._id);

    const hasImage = plant.image && 
      plant.image.trim() !== '' && 
      !plant.image.includes('photo-1544816155-12df9643f363') && 
      !plant.image.includes('photo-1615485500704-8e990f9900f7');

    const imageCellContent = hasImage
      ? `<img 
          src="${escapeHTML(plant.image)}" 
          alt="${escapeHTML(plant.name)}" 
          class="table-img-thumb"
          onerror="this.parentElement.innerHTML='<div class=\\'table-img-placeholder\\'><i class=\\'fa-solid fa-leaf\\'></i></div>';"
        />`
      : `<div class="table-img-placeholder" title="${escapeHTML(plant.name)}"><i class="fa-solid fa-leaf"></i></div>`;

    const partsDisplay = plant.partsUsed || (Array.isArray(plant.part_used) && plant.part_used.length ? plant.part_used.join(', ') : 'Ayurvedic herb');

    row.innerHTML = `
      <td>
        ${imageCellContent}
      </td>
      <td class="table-name-cell">
        <strong>${escapeHTML(plant.name)} ${plant.englishName ? `<span style="font-weight:400;color:var(--text-muted);">(${escapeHTML(plant.englishName)})</span>` : ''}</strong>
        <span>${escapeHTML(plant.scientificName || plant.botanical_name || '')}</span>
      </td>
      <td>
        <span class="table-badge">${escapeHTML(plant.category || 'Ayurvedic')}</span>
      </td>
      <td>
        <span style="font-size:0.85rem; color:var(--text-muted);">${escapeHTML(partsDisplay)}</span>
      </td>
      <td class="table-actions-cell">
        <button class="action-btn action-edit" title="Edit Plant" data-id="${plant._id}">
          <i class="fa-solid fa-pen-to-square"></i>
        </button>
        <button class="action-btn action-delete" title="Delete Plant" data-id="${plant._id}" data-name="${escapeHTML(plant.name)}">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </td>
    `;

    // Attach row events
    const editBtn = row.querySelector('.action-edit');
    const deleteBtn = row.querySelector('.action-delete');

    editBtn.addEventListener('click', () => loadPlantForEdit(plant._id));
    deleteBtn.addEventListener('click', () => openDeleteModal(plant._id, plant.name));

    plantsTableBody.appendChild(row);
  });
}

function filterAdminTable(query) {
  if (!query) {
    renderAdminTable(adminPlants);
    return;
  }

  const filtered = adminPlants.filter((plant) => {
    return (
      plant.name?.toLowerCase().includes(query) ||
      plant.scientificName?.toLowerCase().includes(query) ||
      plant.englishName?.toLowerCase().includes(query) ||
      plant.category?.toLowerCase().includes(query)
    );
  });

  renderAdminTable(filtered);
}

// =============================================================================
// CREATE & UPDATE (POST /api/plants & PUT /api/plants/:id)
// =============================================================================
async function handleFormSubmit(e) {
  e.preventDefault();

  if (!validateForm()) {
    showToast('Please fill all required fields correctly.', 'error');
    return;
  }

  const payload = {
    name: plantNameInput.value.trim(),
    scientificName: plantScientificInput.value.trim(),
    category: plantCategoryInput.value,
    image: plantImageInput.value.trim(),
    description: plantDescInput.value.trim(),
    benefits: plantBenefitsInput.value.trim(),
    partsUsed: plantPartsInput.value.trim(),
    cultivation: plantCultivationInput.value.trim()
  };

  // Disable button while processing
  submitBtn.disabled = true;
  submitBtnText.textContent = isEditMode ? 'Updating...' : 'Adding...';

  try {
    let url = '/api/plants';
    let method = 'POST';

    if (isEditMode && currentEditId) {
      url = `/api/plants/${currentEditId}`;
      method = 'PUT';
    }

    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || (result.errors ? result.errors.join(', ') : 'Operation failed'));
    }

    // Success notification
    const successMsg = isEditMode
      ? `"${payload.name}" updated successfully!`
      : `"${payload.name}" added to herbal database!`;

    showToast(successMsg, 'success');
    resetFormToAddMode();
    await fetchAdminPlants();

  } catch (error) {
    console.error('Form submission error:', error);
    showToast(error.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtnText.textContent = isEditMode ? 'Update Plant' : 'Add Plant';
  }
}

// =============================================================================
// EDIT MODE HELPERS
// =============================================================================
function loadPlantForEdit(id) {
  const plant = adminPlants.find((p) => p._id === id);
  if (!plant) {
    showToast('Plant details not found.', 'error');
    return;
  }

  isEditMode = true;
  currentEditId = plant._id;
  plantIdInput.value = plant._id;

  plantNameInput.value = plant.name || '';
  plantScientificInput.value = plant.scientificName || '';
  plantCategoryInput.value = plant.category || '';
  plantImageInput.value = plant.image || '';
  plantDescInput.value = plant.description || '';
  plantBenefitsInput.value = plant.benefits || '';
  plantPartsInput.value = plant.partsUsed || '';
  plantCultivationInput.value = plant.cultivation || '';

  // Show Image preview
  if (plant.image) {
    imagePreviewImg.src = plant.image;
    imagePreviewBox.style.display = 'block';
  }

  // Update UI to edit mode
  formTitle.textContent = 'Edit Plant Details';
  formSubtitle.textContent = `Modifying record: ${plant.name}`;
  formModeIcon.innerHTML = '<i class="fa-solid fa-pen-to-square"></i>';
  submitBtnText.textContent = 'Update Plant';
  cancelEditBtn.style.display = 'inline-flex';

  // Scroll to form on mobile
  plantForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function resetFormToAddMode() {
  isEditMode = false;
  currentEditId = null;
  plantForm.reset();
  plantIdInput.value = '';
  imagePreviewBox.style.display = 'none';

  formTitle.textContent = 'Add New Plant';
  formSubtitle.textContent = 'Enter botanical and traditional properties to insert a record into MongoDB.';
  formModeIcon.innerHTML = '<i class="fa-solid fa-plus"></i>';
  submitBtnText.textContent = 'Add Plant';
  cancelEditBtn.style.display = 'none';

  clearValidationErrors();
}

// =============================================================================
// DELETE (DELETE /api/plants/:id)
// =============================================================================
function openDeleteModal(id, name) {
  plantIdToDelete = id;
  deletePlantName.textContent = `"${name}"`;
  deleteModal.classList.add('show');
  deleteModal.setAttribute('aria-hidden', 'false');
}

function closeDeleteModal() {
  plantIdToDelete = null;
  deleteModal.classList.remove('show');
  deleteModal.setAttribute('aria-hidden', 'true');
}

async function executeDelete() {
  if (!plantIdToDelete) return;

  confirmDeleteBtn.disabled = true;
  confirmDeleteBtn.textContent = 'Deleting...';

  try {
    const response = await fetch(`/api/plants/${plantIdToDelete}`, {
      method: 'DELETE'
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to delete plant');
    }

    showToast('Plant deleted successfully from database', 'info');
    closeDeleteModal();

    // If currently editing the same plant, reset form
    if (isEditMode && currentEditId === plantIdToDelete) {
      resetFormToAddMode();
    }

    await fetchAdminPlants();
  } catch (error) {
    console.error('Delete error:', error);
    showToast(`Failed to delete: ${error.message}`, 'error');
  } finally {
    confirmDeleteBtn.disabled = false;
    confirmDeleteBtn.innerHTML = '<i class="fa-solid fa-trash"></i> Delete Plant';
  }
}

// =============================================================================
// SEED SAMPLE DATA (POST /api/plants/seed)
// =============================================================================
async function handleSeedData() {
  const confirmed = confirm('This will reset the plant database to the default 10 sample medicinal plants. Continue?');
  if (!confirmed) return;

  showToast('Seeding sample plants into MongoDB...', 'info');

  try {
    const response = await fetch('/api/plants/seed', {
      method: 'POST'
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Seeding failed');
    }

    showToast(`Successfully seeded ${result.count || 10} sample plants!`, 'success');
    resetFormToAddMode();
    await fetchAdminPlants();
  } catch (error) {
    console.error('Seed error:', error);
    showToast(`Seeding error: ${error.message}`, 'error');
  }
}

// =============================================================================
// VALIDATION & HELPERS
// =============================================================================
function validateForm() {
  let isValid = true;
  clearValidationErrors();

  const requiredFields = [
    { input: plantNameInput, errorId: 'error-name', msg: 'Plant name is required' },
    { input: plantScientificInput, errorId: 'error-scientific', msg: 'Scientific name is required' },
    { input: plantCategoryInput, errorId: 'error-category', msg: 'Please select a category' },
    { input: plantImageInput, errorId: 'error-image', msg: 'Valid image URL is required' },
    { input: plantDescInput, errorId: 'error-description', msg: 'Description is required' },
    { input: plantBenefitsInput, errorId: 'error-benefits', msg: 'Benefits are required' },
    { input: plantPartsInput, errorId: 'error-parts', msg: 'Parts used is required' },
    { input: plantCultivationInput, errorId: 'error-cultivation', msg: 'Cultivation info is required' }
  ];

  requiredFields.forEach(({ input, errorId, msg }) => {
    if (!input.value.trim()) {
      showFieldError(input, errorId, msg);
      isValid = false;
    }
  });

  // URL format check
  if (plantImageInput.value.trim() && !isValidHttpUrl(plantImageInput.value.trim())) {
    showFieldError(plantImageInput, 'error-image', 'Please enter a valid HTTP or HTTPS image URL');
    isValid = false;
  }

  return isValid;
}

function showFieldError(input, errorId, message) {
  input.classList.add('invalid');
  const errorEl = document.getElementById(errorId);
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.add('visible');
  }
}

function clearValidationErrors() {
  const inputs = plantForm.querySelectorAll('.form-control');
  inputs.forEach((input) => input.classList.remove('invalid'));

  const errors = plantForm.querySelectorAll('.field-error');
  errors.forEach((err) => {
    err.textContent = '';
    err.classList.remove('visible');
  });
}

function isValidHttpUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

// Toast Notifications
function showToast(message, type = 'success') {
  if (!toastContainer) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let icon = 'fa-circle-check';
  if (type === 'error') icon = 'fa-circle-xmark';
  if (type === 'info') icon = 'fa-circle-info';

  toast.innerHTML = `
    <i class="fa-solid ${icon}"></i>
    <span>${escapeHTML(message)}</span>
  `;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// State display helpers
function showAdminLoading() {
  if (adminLoading) adminLoading.style.display = 'block';
  if (adminEmpty) adminEmpty.style.display = 'none';
  if (tableContainer) tableContainer.style.display = 'none';
}

function showAdminTable() {
  if (adminLoading) adminLoading.style.display = 'none';
  if (adminEmpty) adminEmpty.style.display = 'none';
  if (tableContainer) tableContainer.style.display = 'block';
}

function showAdminEmpty() {
  if (adminLoading) adminLoading.style.display = 'none';
  if (adminEmpty) adminEmpty.style.display = 'block';
  if (tableContainer) tableContainer.style.display = 'none';
}

function updateStats(isConnected, count) {
  if (statTotalCount) statTotalCount.textContent = count;
  if (statApiStatus) {
    if (isConnected) {
      statApiStatus.innerHTML = '<i class="fa-solid fa-circle-check"></i> Connected';
      statApiStatus.style.color = '#a7f3d0';
    } else {
      statApiStatus.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> Disconnected';
      statApiStatus.style.color = '#fca5a5';
    }
  }
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

// =============================================================================
// Phase 6: Tab Switching & Enhanced Admin Modules
// =============================================================================
let currentUserPage = 1;
let currentSubmissionList = [];

function setupAdminTabs() {
  const tabs = [
    { btn: 'tab-btn-overview', view: 'view-admin-overview' },
    { btn: 'tab-btn-plants', view: 'view-admin-plants' },
    { btn: 'tab-btn-users', view: 'view-admin-users' },
    { btn: 'tab-btn-submissions', view: 'view-admin-submissions' }
  ];

  tabs.forEach(t => {
    const el = document.getElementById(t.btn);
    if (el) {
      el.addEventListener('click', () => {
        tabs.forEach(other => {
          document.getElementById(other.btn)?.classList.remove('active');
          const v = document.getElementById(other.view);
          if (v) v.style.display = 'none';
        });
        el.classList.add('active');
        const activeV = document.getElementById(t.view);
        if (activeV) activeV.style.display = 'block';

        // Refresh relevant data on tab activate
        if (t.view === 'view-admin-overview') loadAdminStats();
        if (t.view === 'view-admin-users') loadAdminUsers(currentUserPage);
        if (t.view === 'view-admin-submissions') loadAdminSubmissions();
      });
    }
  });

  // Quick Action Buttons on Overview Tab
  document.getElementById('btn-quick-plants')?.addEventListener('click', () => switchToTab('plants'));
  document.getElementById('btn-quick-submissions')?.addEventListener('click', () => switchToTab('submissions'));
  document.getElementById('btn-quick-users')?.addEventListener('click', () => switchToTab('users'));
}

window.switchToTab = function(name) {
  const btnId = `tab-btn-${name}`;
  document.getElementById(btnId)?.click();
};

// Overview Statistics
async function loadAdminStats() {
  try {
    const res = await fetch('/api/admin/stats');
    const data = await res.json();
    if (data.success && data.data) {
      const s = data.data;
      document.getElementById('kpi-plants').textContent = s.totalPlants || 0;
      document.getElementById('kpi-users').textContent = s.totalUsers || 0;
      document.getElementById('kpi-gardens').textContent = s.totalGardenEntries || 0;
      document.getElementById('kpi-pending-subs').textContent = s.pendingSubmissions || 0;
      document.getElementById('kpi-approved-subs').textContent = s.approvedSubmissions || 0;
      document.getElementById('kpi-rejected-subs').textContent = s.rejectedSubmissions || 0;
    }
  } catch (err) {
    console.warn('Error loading admin stats:', err);
  }
}

// User Management
async function loadAdminUsers(page = 1, search = '') {
  currentUserPage = page;
  const tbody = document.getElementById('admin-users-tbody');
  const pageInfo = document.getElementById('user-page-info');
  if (!tbody) return;

  try {
    const res = await fetch(`/api/admin/users?page=${page}&limit=8&search=${encodeURIComponent(search)}`);
    const data = await res.json();
    if (data.success && Array.isArray(data.data)) {
      tbody.innerHTML = '';
      if (data.data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--text-muted);">No users found</td></tr>';
        return;
      }

      data.data.forEach(user => {
        const tr = document.createElement('tr');
        const isCurrentAdmin = user._id === currentSessionUserId;
        const registeredDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-';

        tr.innerHTML = `
          <td><strong>${escapeHTML(user.name)}</strong></td>
          <td>${escapeHTML(user.email)}</td>
          <td><span class="role-badge ${user.role}">${escapeHTML(user.role)}</span></td>
          <td><span class="status-badge ${user.isActive !== false ? 'active' : 'inactive'}">${user.isActive !== false ? 'Active' : 'Deactivated'}</span></td>
          <td>${registeredDate}</td>
          <td class="text-right">
            ${isCurrentAdmin ? `
              <span style="font-size:0.75rem; color:var(--text-light); font-style:italic;">Your Account</span>
            ` : `
              <button class="btn btn-sm ${user.isActive !== false ? 'btn-outline' : 'btn-primary'}" onclick="toggleUserStatus('${user._id}', ${user.isActive !== false})" style="font-size:0.75rem; padding:0.25rem 0.65rem;">
                ${user.isActive !== false ? '<i class="fa-solid fa-user-slash"></i> Deactivate' : '<i class="fa-solid fa-user-check"></i> Activate'}
              </button>
            `}
          </td>
        `;
        tbody.appendChild(tr);
      });

      if (pageInfo) {
        pageInfo.textContent = `Page ${data.currentPage} of ${data.totalPages || 1} (${data.total} total accounts)`;
      }

      // Pagination buttons
      const prevBtn = document.getElementById('user-prev-page-btn');
      const nextBtn = document.getElementById('user-next-page-btn');
      if (prevBtn) prevBtn.disabled = data.currentPage <= 1;
      if (nextBtn) nextBtn.disabled = data.currentPage >= data.totalPages;
    }
  } catch (err) {
    console.error('Error loading users:', err);
  }
}

let currentSessionUserId = null;
async function checkAdminSession() {
  try {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    if (data && data.authenticated && data.user) {
      currentSessionUserId = data.user.id;
      const userDisplay = document.getElementById('admin-user-display');
      const userName = document.getElementById('admin-user-name');
      if (userDisplay && userName) {
        userName.textContent = data.user.name;
        userDisplay.style.display = 'inline-flex';
      }
    }
  } catch (err) {
    console.warn('Admin session check notice:', err);
  }
}

// User Search & Pagination Listeners
document.getElementById('admin-user-search')?.addEventListener('input', (e) => {
  const query = e.target.value.trim();
  loadAdminUsers(1, query);
});

document.getElementById('user-prev-page-btn')?.addEventListener('click', () => {
  if (currentUserPage > 1) {
    const query = document.getElementById('admin-user-search')?.value.trim() || '';
    loadAdminUsers(currentUserPage - 1, query);
  }
});

document.getElementById('user-next-page-btn')?.addEventListener('click', () => {
  const query = document.getElementById('admin-user-search')?.value.trim() || '';
  loadAdminUsers(currentUserPage + 1, query);
});

window.toggleUserStatus = async function(id, currentActive) {
  const actionText = currentActive ? 'deactivate' : 'activate';
  if (!confirm(`Are you sure you want to ${actionText} this user account?`)) return;

  try {
    const res = await fetch(`/api/admin/users/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !currentActive })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      showToast(data.message || 'User status updated', 'success');
      const query = document.getElementById('admin-user-search')?.value.trim() || '';
      loadAdminUsers(currentUserPage, query);
    } else {
      showToast(data.message || 'Could not update user status', 'error');
    }
  } catch (err) {
    showToast('Network error updating user', 'error');
  }
};

// Submission Moderation
async function loadAdminSubmissions() {
  const tbody = document.getElementById('admin-submissions-tbody');
  const filter = document.getElementById('admin-submission-filter')?.value || 'all';
  if (!tbody) return;

  try {
    const res = await fetch(`/api/admin/submissions?status=${filter}`);
    const data = await res.json();
    if (data.success && Array.isArray(data.data)) {
      currentSubmissionList = data.data;
      tbody.innerHTML = '';

      if (data.data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--text-muted);">No submissions found matching this filter</td></tr>';
        return;
      }

      data.data.forEach(sub => {
        const tr = document.createElement('tr');
        const p = sub.plantData || {};
        const submitter = sub.submittedBy ? `${sub.submittedBy.name} (${sub.submittedBy.email})` : 'Anonymous';
        const dateStr = sub.createdAt ? new Date(sub.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-';

        let statusClass = 'sub-pending';
        if (sub.status === 'approved') statusClass = 'sub-approved';
        if (sub.status === 'rejected') statusClass = 'sub-rejected';

        tr.innerHTML = `
          <td><strong>${escapeHTML(p.name)}</strong></td>
          <td><em>${escapeHTML(p.scientificName)}</em></td>
          <td><span style="font-size:0.85rem;">${escapeHTML(submitter)}</span></td>
          <td><span class="sub-pill ${statusClass}">${escapeHTML(sub.status)}</span></td>
          <td>${dateStr}</td>
          <td class="text-right">
            <button class="btn btn-outline btn-sm" onclick="openReviewModal('${sub._id}')" style="font-size:0.75rem; padding:0.25rem 0.65rem;">
              <i class="fa-solid fa-microscope"></i> Review
            </button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }
  } catch (err) {
    console.error('Error loading submissions:', err);
  }
}

document.getElementById('admin-submission-filter')?.addEventListener('change', () => {
  loadAdminSubmissions();
});

// Review Modal Logic
window.openReviewModal = function(id) {
  const sub = currentSubmissionList.find(s => s._id === id);
  if (!sub) return;

  const modal = document.getElementById('review-modal');
  const detailsBox = document.getElementById('review-modal-details');
  const idInput = document.getElementById('review-submission-id');
  const feedbackInput = document.getElementById('review-feedback');
  if (!modal || !detailsBox) return;

  idInput.value = sub._id;
  feedbackInput.value = sub.adminFeedback || '';

  const p = sub.plantData || {};
  detailsBox.innerHTML = `
    <div><strong>Proposed Herb:</strong> ${escapeHTML(p.name)}</div>
    <div><strong>Scientific Name:</strong> <em>${escapeHTML(p.scientificName)}</em></div>
    <div><strong>Category:</strong> ${escapeHTML(p.category)} | <strong>Family:</strong> ${escapeHTML(p.family || 'N/A')}</div>
    <div><strong>Parts Used:</strong> ${escapeHTML(p.partsUsed || 'N/A')}</div>
    <div style="margin-top:0.5rem;"><strong>Description:</strong> ${escapeHTML(p.description)}</div>
    ${p.benefits ? `<div style="margin-top:0.4rem;"><strong>Traditional Uses:</strong> ${escapeHTML(p.benefits)}</div>` : ''}
    ${p.cultivation ? `<div style="margin-top:0.4rem;"><strong>Cultivation:</strong> ${escapeHTML(p.cultivation)}</div>` : ''}
    ${p.sourceUrl ? `<div style="margin-top:0.4rem;"><strong>Source:</strong> <a href="${escapeHTML(p.sourceUrl)}" target="_blank" style="color:var(--primary); text-decoration:underline;">Citation Link</a></div>` : ''}
  `;

  modal.style.display = 'flex';
};

document.getElementById('close-review-modal-btn')?.addEventListener('click', closeReviewModal);
document.getElementById('cancel-review-btn')?.addEventListener('click', closeReviewModal);

function closeReviewModal() {
  const modal = document.getElementById('review-modal');
  if (modal) modal.style.display = 'none';
}

document.getElementById('approve-submission-btn')?.addEventListener('click', () => handleReviewAction('approve'));
document.getElementById('reject-submission-btn')?.addEventListener('click', () => handleReviewAction('reject'));

async function handleReviewAction(action) {
  const id = document.getElementById('review-submission-id')?.value;
  const adminFeedback = document.getElementById('review-feedback')?.value.trim() || '';

  if (!id) return;

  try {
    const res = await fetch(`/api/admin/submissions/${id}/review`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, adminFeedback })
    });
    const data = await res.json();

    if (res.ok && data.success) {
      showToast(`Submission has been ${action}d successfully!`, 'success');
      closeReviewModal();
      loadAdminStats();
      loadAdminSubmissions();
      if (action === 'approve') {
        fetchAdminPlants(); // Refresh plant catalog if new plant was integrated!
      }
    } else {
      showToast(data.message || 'Error reviewing submission', 'error');
    }
  } catch (err) {
    showToast('Network error reviewing submission', 'error');
  }
}

