/**
 * HerbIT - SUBMIT PLANT SCRIPT (submit-plant.js)
 */

let mySubmissions = [];

// Elements
const tabSubmitBtn = document.getElementById('tab-submit-btn');
const tabHistoryBtn = document.getElementById('tab-history-btn');
const viewSubmit = document.getElementById('view-submit');
const viewHistory = document.getElementById('view-history');
const plantSubmissionForm = document.getElementById('plant-submission-form');
const submitAlert = document.getElementById('submit-alert');
const historyContainer = document.getElementById('history-container');
const mySubmissionsCount = document.getElementById('my-submissions-count');

const logoutBtn = document.getElementById('logout-btn');
const mobileToggle = document.getElementById('mobile-toggle');
const navMenu = document.getElementById('nav-menu');

document.addEventListener('DOMContentLoaded', () => {
  initSubmissions();
});

function initSubmissions() {
  setupEventListeners();
  loadSubmissions();
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

  tabSubmitBtn.addEventListener('click', () => {
    tabSubmitBtn.classList.add('active');
    tabHistoryBtn.classList.remove('active');
    viewSubmit.style.display = 'block';
    viewHistory.style.display = 'none';
  });

  tabHistoryBtn.addEventListener('click', () => {
    tabHistoryBtn.classList.add('active');
    tabSubmitBtn.classList.remove('active');
    viewSubmit.style.display = 'none';
    viewHistory.style.display = 'block';
    loadSubmissions();
  });

  plantSubmissionForm.addEventListener('submit', handleFormSubmit);
}

async function loadSubmissions() {
  try {
    const res = await fetch('/api/submissions/mine');
    if (res.status === 401) {
      window.location.href = '/login.html?redirect=%2Fsubmit-plant.html';
      return;
    }

    const data = await res.json();
    if (data.success) {
      mySubmissions = data.data || [];
      mySubmissionsCount.textContent = mySubmissions.length;
      renderHistory();
    }
  } catch (err) {
    console.error('Error loading submissions:', err);
  }
}

function renderHistory() {
  historyContainer.innerHTML = '';

  if (mySubmissions.length === 0) {
    historyContainer.innerHTML = `
      <div style="text-align:center; padding:3rem; background:var(--surface); border-radius:var(--radius-lg); border:1px solid var(--border);">
        <i class="fa-solid fa-seedling" style="font-size:2rem; color:var(--accent); margin-bottom:0.75rem;"></i>
        <h4 style="font-family:var(--font-heading); font-size:1.3rem; color:var(--primary); margin-bottom:0.4rem;">No Contributions Yet</h4>
        <p style="color:var(--text-muted); font-size:0.95rem;">You haven't submitted any medicinal plants yet. Share an indigenous herb you cultivate!</p>
      </div>
    `;
    return;
  }

  mySubmissions.forEach(sub => {
    const item = document.createElement('div');
    item.className = 'submission-item';

    const p = sub.plantData || {};
    const dateStr = new Date(sub.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    let statusClass = 'sub-pending';
    let statusIcon = '<i class="fa-solid fa-clock"></i>';
    if (sub.status === 'approved') {
      statusClass = 'sub-approved';
      statusIcon = '<i class="fa-solid fa-circle-check"></i>';
    } else if (sub.status === 'rejected') {
      statusClass = 'sub-rejected';
      statusIcon = '<i class="fa-solid fa-circle-xmark"></i>';
    }

    item.innerHTML = `
      <div class="submission-header">
        <div>
          <h3 class="submission-title">${escapeHTML(p.name)}</h3>
          <div style="font-size:0.875rem; font-style:italic; color:var(--text-muted);">${escapeHTML(p.scientificName)} • ${escapeHTML(p.category)}</div>
        </div>
        <div style="display:flex; align-items:center; gap:0.75rem;">
          <span class="sub-pill ${statusClass}">${statusIcon} ${escapeHTML(sub.status)}</span>
          <span style="font-size:0.8rem; color:var(--text-light);">${dateStr}</span>
        </div>
      </div>

      <p style="font-size:0.9rem; color:var(--text-main); line-height:1.5;">${escapeHTML(p.description)}</p>

      ${sub.adminFeedback ? `
        <div class="feedback-box">
          <strong><i class="fa-solid fa-comment-dots"></i> Reviewer Feedback:</strong> ${escapeHTML(sub.adminFeedback)}
        </div>
      ` : ''}

      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:0.5rem; font-size:0.8rem; color:var(--text-light);">
        <div>${p.sourceUrl ? `<a href="${escapeHTML(p.sourceUrl)}" target="_blank" style="color:var(--primary-light); text-decoration:underline;"><i class="fa-solid fa-arrow-up-right-from-square"></i> Citation Source</a>` : 'No citation provided'}</div>
        <div>
          ${sub.status === 'pending' ? `
            <button class="btn btn-sm" onclick="withdrawSubmission('${sub._id}', '${escapeHTML(p.name)}')" style="color:#b91c1c; background:none; border:none; cursor:pointer;">
              <i class="fa-solid fa-trash-can"></i> Withdraw
            </button>
          ` : ''}
        </div>
      </div>
    `;

    historyContainer.appendChild(item);
  });
}

window.withdrawSubmission = async function(id, name) {
  const confirmed = confirm(`Are you sure you want to withdraw your pending submission for "${name}"?`);
  if (!confirmed) return;

  try {
    const res = await fetch(`/api/submissions/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (res.ok && data.success) {
      mySubmissions = mySubmissions.filter(s => s._id !== id);
      mySubmissionsCount.textContent = mySubmissions.length;
      renderHistory();
    } else {
      alert(data.message || 'Could not withdraw submission');
    }
  } catch (err) {
    console.error('Error withdrawing submission:', err);
  }
};

async function handleFormSubmit(e) {
  e.preventDefault();
  submitAlert.style.display = 'none';

  const name = document.getElementById('sub-name').value.trim();
  const scientificName = document.getElementById('sub-scientific').value.trim();
  const englishName = document.getElementById('sub-english').value.trim();
  const family = document.getElementById('sub-family').value.trim();
  const category = document.getElementById('sub-category').value;
  const partsUsed = document.getElementById('sub-parts').value.trim();
  const description = document.getElementById('sub-description').value.trim();
  const benefits = document.getElementById('sub-benefits').value.trim();
  const cultivation = document.getElementById('sub-cultivation').value.trim();
  const image = document.getElementById('sub-image').value.trim();
  const sourceUrl = document.getElementById('sub-source').value.trim();

  if (!name || !scientificName || !description) {
    showAlert('Please fill in all required fields (Name, Scientific Name, Description).', 'error');
    return;
  }

  const payload = {
    name,
    scientificName,
    englishName,
    family,
    category,
    partsUsed,
    description,
    benefits,
    cultivation,
    image,
    sourceUrl
  };

  try {
    const res = await fetch('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (res.ok && data.success) {
      showAlert('🌿 Plant submitted successfully! It has entered the botanical review queue.', 'success');
      plantSubmissionForm.reset();
      loadSubmissions();
    } else {
      showAlert(data.message || 'Error submitting plant', 'error');
    }
  } catch (err) {
    showAlert('Network error submitting plant record', 'error');
  }
}

function showAlert(msg, type) {
  submitAlert.className = `auth-alert ${type}`;
  submitAlert.innerHTML = `<i class="fa-solid ${type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check'}"></i> <span>${escapeHTML(msg)}</span>`;
  submitAlert.style.display = 'flex';
  if (type === 'success') {
    setTimeout(() => { submitAlert.style.display = 'none'; }, 6000);
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
