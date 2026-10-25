/**
 * HerbIT - PUBLIC BOTANICAL SCRIPT (script.js)
 * Handles plant explorer, live search, category filtering, and details modal
 */

// State Management
let allPlants = [];
let activeCategory = 'All';
let searchQuery = '';

// DOM Elements
const plantsGrid = document.getElementById('plants-grid');
const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const errorMessage = document.getElementById('error-message');
const emptyState = document.getElementById('empty-state');
const retryFetchBtn = document.getElementById('retry-fetch-btn');
const resetFilterBtn = document.getElementById('reset-filter-btn');
const countDisplay = document.getElementById('count-display');
const totalSpeciesCount = document.getElementById('total-species-count');
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search-btn');
const categoryPillsContainer = document.getElementById('category-pills');

// Modal Elements
const plantModal = document.getElementById('plant-modal');
const modalContent = document.getElementById('modal-content');
const modalCloseBtn = document.getElementById('modal-close-btn');

// Mobile Nav Toggle
const mobileToggle = document.getElementById('mobile-toggle');
const navMenu = document.getElementById('nav-menu');

// =============================================================================
// Initialization & Event Listeners
// =============================================================================
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  fetchPlants();
  setupEventListeners();
  initAuthNavbar();
  initFloatingAIButton();
}

function setupEventListeners() {
  // Mobile Nav
  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('open');
    });
  }

  // Search Input Listener
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      if (clearSearchBtn) {
        clearSearchBtn.style.display = searchQuery ? 'block' : 'none';
      }
      filterAndRenderPlants();
    });
  }

  // Clear Search Button
  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchQuery = '';
      clearSearchBtn.style.display = 'none';
      searchInput.focus();
      filterAndRenderPlants();
    });
  }

  // Category Filter Buttons
  if (categoryPillsContainer) {
    categoryPillsContainer.addEventListener('click', (e) => {
      if (e.target.classList.contains('pill-btn')) {
        // Toggle active class
        const pillBtns = categoryPillsContainer.querySelectorAll('.pill-btn');
        pillBtns.forEach((btn) => btn.classList.remove('active'));
        e.target.classList.add('active');

        activeCategory = e.target.dataset.category || 'All';
        filterAndRenderPlants();
      }
    });
  }

  // Retry & Reset Buttons
  if (retryFetchBtn) {
    retryFetchBtn.addEventListener('click', fetchPlants);
  }

  if (resetFilterBtn) {
    resetFilterBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      searchQuery = '';
      if (clearSearchBtn) clearSearchBtn.style.display = 'none';
      activeCategory = 'All';

      const pillBtns = categoryPillsContainer.querySelectorAll('.pill-btn');
      pillBtns.forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.category === 'All');
      });

      filterAndRenderPlants();
    });
  }

  // Modal Close Events
  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeModal);
  }

  if (plantModal) {
    plantModal.addEventListener('click', (e) => {
      if (e.target === plantModal) {
        closeModal();
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && plantModal.classList.contains('show')) {
      closeModal();
    }
  });
}

// =============================================================================
// API: Fetch All Plants (GET /api/plants)
// =============================================================================
async function fetchPlants() {
  showLoading();

  try {
    const response = await fetch('/api/plants');

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    const result = await response.json();

    if (result.success && Array.isArray(result.data)) {
      allPlants = result.data;
      if (totalSpeciesCount) {
        totalSpeciesCount.textContent = `${allPlants.length}+`;
      }
      filterAndRenderPlants();
    } else {
      throw new Error(result.message || 'Invalid API data format received');
    }
  } catch (error) {
    console.error('Error fetching medicinal plants:', error);
    showError(error.message);
  }
}

// =============================================================================
// Filtering Logic & Rendering
// =============================================================================
function filterAndRenderPlants() {
  hideAllStates();

  const filtered = allPlants.filter((plant) => {
    // 1. Category check
    const matchesCategory =
      activeCategory === 'All' ||
      plant.category?.toLowerCase() === activeCategory.toLowerCase();

    // 2. Search check (Name, English Name, Scientific Name, Family, Description, Sanskrit Synonyms)
    const nameMatch = plant.name?.toLowerCase().includes(searchQuery);
    const engMatch = plant.englishName?.toLowerCase().includes(searchQuery);
    const scientificMatch = (plant.scientificName || plant.botanical_name)?.toLowerCase().includes(searchQuery);
    const familyMatch = plant.family?.toLowerCase().includes(searchQuery);
    const descMatch = (plant.description || plant.preview)?.toLowerCase().includes(searchQuery);
    const synMatch = Array.isArray(plant.sanskritSynonyms) && plant.sanskritSynonyms.some((s) => s.toLowerCase().includes(searchQuery));
    const matchesSearch = !searchQuery || nameMatch || engMatch || scientificMatch || familyMatch || descMatch || synMatch;

    return matchesCategory && matchesSearch;
  });

  // Update count badge
  if (countDisplay) {
    countDisplay.textContent = `Showing ${filtered.length} of ${allPlants.length} plants`;
  }

  if (filtered.length === 0) {
    showEmpty();
    return;
  }

  renderPlantCards(filtered);
}

// =============================================================================
// Botanical Local Image & Fallback System
// =============================================================================
const BOTANICAL_LOCAL_IMAGE_MAP = {
  // Tulsi / Holy Basil (botanical synonyms)
  'ocimum tenuiflorum': 'images/plants/tulsi.jpg',
  'ocimum sanctum': 'images/plants/tulsi.jpg',
  'ocimum gratissimum': 'images/plants/tulsi.jpg',

  // Neem
  'azadirachta indica': 'images/plants/neem.jpg',
  'melia azadirachta': 'images/plants/neem.jpg',

  // Aloe Vera
  'aloe barbadensis miller': 'images/plants/aloe-vera.jpg',
  'aloe barbadensis': 'images/plants/aloe-vera.jpg',
  'aloe vera': 'images/plants/aloe-vera.jpg',

  // Turmeric
  'curcuma longa': 'images/plants/turmeric.jpg',
  'curcuma domestica': 'images/plants/turmeric.jpg',

  // Ginger
  'zingiber officinale': 'images/plants/ginger.jpg',

  // Mint / Peppermint
  'mentha x piperita': 'images/plants/mint.jpg',
  'mentha piperita': 'images/plants/mint.jpg',
  'mentha arvensis': 'images/plants/mint.jpg',
  'mentha spicata': 'images/plants/mint.jpg',

  // Ashwagandha
  'withania somnifera': 'images/plants/ashwagandha.jpg',

  // Lemongrass
  'cymbopogon citratus': 'images/plants/lemongrass.jpg',
  'cymbopogon flexuosus': 'images/plants/lemongrass.jpg',

  // Amla / Indian Gooseberry (botanical synonyms)
  'phyllanthus emblica': 'images/plants/amla.jpg',
  'emblica officinalis': 'images/plants/amla.jpg',

  // Brahmi
  'bacopa monnieri': 'images/plants/brahmi.jpg',
  'herpestis monniera': 'images/plants/brahmi.jpg',

  // Curry Leaf
  'murraya koenigii': 'images/plants/curry-leaf.jpg',
  'bergera koenigii': 'images/plants/curry-leaf.jpg',

  // Coriander
  'coriandrum sativum': 'images/plants/coriander.jpg',

  // Fenugreek
  'trigonella foenum-graecum': 'images/plants/fenugreek.jpg',

  // Hibiscus
  'hibiscus rosa-sinensis': 'images/plants/hibiscus.jpg',

  // Garlic
  'allium sativum': 'images/plants/garlic.jpg',

  // Gotu Kola / Mandukaparni
  'centella asiatica': 'images/plants/gotu-kola.jpg',
  'hydrocotyle asiatica': 'images/plants/gotu-kola.jpg',

  // Eucalyptus
  'eucalyptus globulus': 'images/plants/eucalyptus.jpg',
  'eucalyptus tereticornis': 'images/plants/eucalyptus.jpg',

  // Giloy / Guduchi
  'tinospora cordifolia': 'images/plants/giloy.jpg'
};

const COMMON_HERB_IMAGE_MAP = {
  // Tulsi / Holy Basil (Aliases - same botanical species)
  'tulsi': 'images/plants/tulsi.jpg',
  'holy basil': 'images/plants/tulsi.jpg',
  'sacred basil': 'images/plants/tulsi.jpg',

  // Neem
  'neem': 'images/plants/neem.jpg',
  'indian lilac': 'images/plants/neem.jpg',
  'nimba': 'images/plants/neem.jpg',

  // Aloe Vera
  'aloe vera': 'images/plants/aloe-vera.jpg',
  'aloe': 'images/plants/aloe-vera.jpg',
  'ghritkumari': 'images/plants/aloe-vera.jpg',
  'kumari': 'images/plants/aloe-vera.jpg',

  // Turmeric
  'turmeric': 'images/plants/turmeric.jpg',
  'haridra': 'images/plants/turmeric.jpg',
  'haldi': 'images/plants/turmeric.jpg',

  // Ginger
  'ginger': 'images/plants/ginger.jpg',
  'adrak': 'images/plants/ginger.jpg',
  'ardraka': 'images/plants/ginger.jpg',
  'shunthi': 'images/plants/ginger.jpg',

  // Mint
  'peppermint': 'images/plants/mint.jpg',
  'spearmint': 'images/plants/mint.jpg',
  'mint': 'images/plants/mint.jpg',
  'pudina': 'images/plants/mint.jpg',

  // Ashwagandha
  'ashwagandha': 'images/plants/ashwagandha.jpg',
  'indian ginseng': 'images/plants/ashwagandha.jpg',
  'asgandh': 'images/plants/ashwagandha.jpg',

  // Lemongrass
  'lemongrass': 'images/plants/lemongrass.jpg',
  'lemon grass': 'images/plants/lemongrass.jpg',
  'bhutika': 'images/plants/lemongrass.jpg',

  // Amla / Indian Gooseberry (Aliases - same botanical species)
  'amla': 'images/plants/amla.jpg',
  'indian gooseberry': 'images/plants/amla.jpg',
  'amalaki': 'images/plants/amla.jpg',
  'dhatri': 'images/plants/amla.jpg',

  // Brahmi
  'brahmi': 'images/plants/brahmi.jpg',
  'water hyssop': 'images/plants/brahmi.jpg',

  // Curry Leaf
  'curry leaf': 'images/plants/curry-leaf.jpg',
  'curry leaves': 'images/plants/curry-leaf.jpg',
  'karivepaku': 'images/plants/curry-leaf.jpg',
  'kaidarya': 'images/plants/curry-leaf.jpg',
  'kadipatta': 'images/plants/curry-leaf.jpg',

  // Coriander
  'coriander': 'images/plants/coriander.jpg',
  'cilantro': 'images/plants/coriander.jpg',
  'dhanyaka': 'images/plants/coriander.jpg',
  'dhaniya': 'images/plants/coriander.jpg',

  // Fenugreek
  'fenugreek': 'images/plants/fenugreek.jpg',
  'methi': 'images/plants/fenugreek.jpg',
  'methika': 'images/plants/fenugreek.jpg',

  // Hibiscus
  'hibiscus': 'images/plants/hibiscus.jpg',
  'china rose': 'images/plants/hibiscus.jpg',
  'japa': 'images/plants/hibiscus.jpg',

  // Garlic
  'garlic': 'images/plants/garlic.jpg',
  'rasona': 'images/plants/garlic.jpg',
  'lahsun': 'images/plants/garlic.jpg',
  'lasun': 'images/plants/garlic.jpg',

  // Gotu Kola
  'gotu kola': 'images/plants/gotu-kola.jpg',
  'gotukola': 'images/plants/gotu-kola.jpg',
  'mandukaparni': 'images/plants/gotu-kola.jpg',
  'mandukparni': 'images/plants/gotu-kola.jpg',
  'indian pennywort': 'images/plants/gotu-kola.jpg',

  // Eucalyptus
  'eucalyptus': 'images/plants/eucalyptus.jpg',
  'tailaparna': 'images/plants/eucalyptus.jpg',
  'nilgiri': 'images/plants/eucalyptus.jpg',

  // Giloy
  'giloy': 'images/plants/giloy.jpg',
  'guduchi': 'images/plants/giloy.jpg',
  'amrita': 'images/plants/giloy.jpg',
  'heart-leaved moonseed': 'images/plants/giloy.jpg'
};

function resolvePlantImage(plant) {
  if (!plant) return 'images/plants/default-plant.jpg';

  // 1. Botanical / Scientific Name match (Highest priority & precision)
  const botName = (plant.scientificName || plant.botanical_name || '').toLowerCase().trim();
  if (botName) {
    if (BOTANICAL_LOCAL_IMAGE_MAP[botName]) {
      return BOTANICAL_LOCAL_IMAGE_MAP[botName];
    }
    for (const [key, path] of Object.entries(BOTANICAL_LOCAL_IMAGE_MAP)) {
      if (botName.includes(key)) {
        return path;
      }
    }
  }

  // 2. Common / English name match using word-boundary regex (avoids substring errors like vrikshamla matching amla)
  const name = (plant.name || '').toLowerCase().trim();
  const engName = (plant.english_name || plant.englishName || '').toLowerCase().trim();
  const combinedText = `${name} ${engName}`;

  for (const [key, path] of Object.entries(COMMON_HERB_IMAGE_MAP)) {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp('(^|[^a-z0-9])' + escaped + '([^a-z0-9]|$)', 'i');
    if (regex.test(combinedText)) {
      return path;
    }
  }

  // 3. Existing local image path with sanity verification
  if (plant.image && typeof plant.image === 'string') {
    const trimmed = plant.image.trim();
    if (trimmed.startsWith('images/plants/') || trimmed.startsWith('/images/plants/')) {
      const filename = trimmed.split('/').pop().toLowerCase();
      if (filename === 'default-plant.jpg' || filename === 'default-plant.svg') {
        return 'images/plants/default-plant.jpg';
      }
      const herbBase = filename.replace('.jpg', '').replace('.png', '').replace('-', ' ');
      if (combinedText.includes(herbBase) || botName.includes(herbBase)) {
        return trimmed;
      }
    } else if (
      trimmed.length > 5 &&
      !trimmed.includes('photo-1544816155-12df9643f363') &&
      !trimmed.includes('photo-1615485500704-8e990f9900f7') &&
      !trimmed.includes('photo-1596797882870-8c33deeac224') &&
      !trimmed.includes('photo-1546868871-7041f2a55e12') &&
      !trimmed.includes('photo-1615485290382-441e4d049cb5') &&
      !trimmed.includes('photo-1545241047-6083a3684587') &&
      (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/'))
    ) {
      return trimmed;
    }
  }

  // 4. Neutral botanical illustration placeholder fallback
  return 'images/plants/default-plant.jpg';
}

function renderPlantCards(plants) {
  plantsGrid.innerHTML = '';

  plants.forEach((plant) => {
    const card = document.createElement('article');
    card.className = 'plant-card';
    card.setAttribute('data-id', plant._id);

    // Dynamic Category Badge Class
    const categoryClass = getCategoryClass(plant.category);
    const resolvedImg = resolvePlantImage(plant);

    const imageMarkup = `<img 
      src="${escapeHTML(resolvedImg)}" 
      alt="${escapeHTML(plant.name)}" 
      loading="lazy"
      onerror="this.onerror=null; this.src='images/plants/default-plant.jpg';"
    />`;

    const englishText = plant.englishName ? `<span class="plant-english">(${escapeHTML(plant.englishName)})</span>` : '';
    const familyText = plant.family ? ` • <span class="plant-family">${escapeHTML(plant.family)}</span>` : '';
    const partsDisplay = plant.partsUsed || (Array.isArray(plant.part_used) && plant.part_used.length ? plant.part_used.join(', ') : 'Ayurvedic Herb');
    const descExcerpt = plant.description || plant.preview || 'Authentic Ayurvedic medicinal herb documented in classical compendia.';

    card.innerHTML = `
      <div class="card-image-wrap">
        ${imageMarkup}
        <span class="card-category-badge ${categoryClass}">${escapeHTML(plant.category || 'Ayurvedic')}</span>
      </div>

      <div class="card-body">
        <div class="card-title-group">
          <h3 class="plant-name">${escapeHTML(plant.name)} ${englishText}</h3>
          <p class="plant-scientific">${escapeHTML(plant.scientificName || plant.botanical_name || '')}${familyText}</p>
        </div>

        <p class="plant-desc-excerpt">${escapeHTML(descExcerpt)}</p>

        <div class="card-footer">
          <span class="parts-pill" title="Parts Used: ${escapeHTML(partsDisplay)}">
            <i class="fa-solid fa-seedling"></i> ${escapeHTML(partsDisplay)}
          </span>
          <button class="btn btn-primary btn-sm view-details-btn" data-id="${plant._id}">
            View Details <i class="fa-solid fa-arrow-right"></i>
          </button>
        </div>
      </div>
    `;

    // Attach click handler to details button
    const viewBtn = card.querySelector('.view-details-btn');
    viewBtn.addEventListener('click', () => openPlantDetails(plant._id));

    plantsGrid.appendChild(card);
  });
}

// =============================================================================
// Modal: Plant Details View (GET /api/plants/:id)
// =============================================================================
async function openPlantDetails(plantId) {
  // First look in cached state, otherwise fetch single item
  let plant = allPlants.find((p) => p._id === plantId);

  if (!plant) {
    try {
      const response = await fetch(`/api/plants/${plantId}`);
      const result = await response.json();
      if (result.success) {
        plant = result.data;
      } else {
        alert('Could not load plant details.');
        return;
      }
    } catch (err) {
      console.error('Error fetching plant details:', err);
      alert('Error fetching plant details.');
      return;
    }
  }

  const categoryClass = getCategoryClass(plant.category);
  const resolvedImg = resolvePlantImage(plant);
  const modalBannerMarkup = `<img 
    src="${escapeHTML(resolvedImg)}" 
    alt="${escapeHTML(plant.name)}"
    onerror="this.onerror=null; this.src='images/plants/default-plant.jpg';"
  />`;

  const synonymsHtml = Array.isArray(plant.sanskritSynonyms) && plant.sanskritSynonyms.length > 0
    ? `<div class="detail-tags-group">
        <span class="detail-tags-label"><i class="fa-solid fa-scroll"></i> Sanskrit Synonyms:</span>
        <div class="tags-cluster">
          ${plant.sanskritSynonyms.map((s) => `<span class="detail-chip">${escapeHTML(s)}</span>`).join('')}
        </div>
      </div>`
    : '';

  const indicationsHtml = Array.isArray(plant.mainIndications) && plant.mainIndications.length > 0
    ? `<div class="detail-tags-group">
        <span class="detail-tags-label"><i class="fa-solid fa-stethoscope"></i> Ayurvedic Indications:</span>
        <div class="tags-cluster">
          ${plant.mainIndications.map((ind) => `<span class="detail-chip chip-indication">${escapeHTML(ind)}</span>`).join('')}
        </div>
      </div>`
    : '';

  const hasDravyaguna = (plant.rasa && plant.rasa.length > 0) ||
    (plant.guna && plant.guna.length > 0) ||
    plant.virya || plant.vipaka ||
    (plant.pacify && plant.pacify.length > 0) ||
    (plant.aggravate && plant.aggravate.length > 0) ||
    (plant.prabhav && plant.prabhav.length > 0);

  const dravyagunaHtml = hasDravyaguna
    ? `<div class="detail-section ayurvedic-props-section">
        <h4><i class="fa-solid fa-mortar-pestle"></i> Ayurvedic Pharmacology (Dravyaguna)</h4>
        <div class="ayurvedic-grid">
          ${plant.rasa?.length ? `<div class="ayur-item"><strong>Rasa (Taste):</strong> <span>${escapeHTML(plant.rasa.join(', '))}</span></div>` : ''}
          ${plant.guna?.length ? `<div class="ayur-item"><strong>Guna (Qualities):</strong> <span>${escapeHTML(plant.guna.join(', '))}</span></div>` : ''}
          ${plant.virya ? `<div class="ayur-item"><strong>Virya (Potency):</strong> <span>${escapeHTML(plant.virya)}</span></div>` : ''}
          ${plant.vipaka ? `<div class="ayur-item"><strong>Vipaka (Post-Digestive):</strong> <span>${escapeHTML(plant.vipaka)}</span></div>` : ''}
          ${plant.prabhav?.length ? `<div class="ayur-item"><strong>Prabhava (Special Action):</strong> <span>${escapeHTML(plant.prabhav.join(', '))}</span></div>` : ''}
          ${plant.pacify?.length ? `<div class="ayur-item"><strong>Pacifies Dosha:</strong> <span class="dosha-pacify">${escapeHTML(plant.pacify.join(', '))}</span></div>` : ''}
          ${plant.aggravate?.length ? `<div class="ayur-item"><strong>Aggravates Dosha:</strong> <span class="dosha-aggravate">${escapeHTML(plant.aggravate.join(', '))}</span></div>` : ''}
        </div>
      </div>`
    : '';

  const partsDisplay = plant.partsUsed || (Array.isArray(plant.part_used) && plant.part_used.length ? plant.part_used.join(', ') : 'Herbal anatomical parts');
  const cultivationDisplay = plant.cultivation || 'Cultivation details not specified in herb dataset (Wildcrafted / Traditional habitat)';
  const descDisplay = plant.description || plant.preview || 'Comprehensive botanical and Ayurvedic profile documented in classical compendia.';
  const benefitsDisplay = plant.benefits || (Array.isArray(plant.mainIndications) && plant.mainIndications.length ? `Traditionally utilized in therapeutic formulations for: ${plant.mainIndications.join(', ')}` : 'Valued in traditional holistic wellness and natural wellness preparations.');

  const sourceLinkHtml = plant.link
    ? `<div class="source-link-row">
        <a href="${escapeHTML(plant.link)}" target="_blank" rel="noopener noreferrer" class="source-link-btn">
          <i class="fa-solid fa-arrow-up-right-from-square"></i> View Amidha Ayurveda Source Page
        </a>
      </div>`
    : '';

  modalContent.innerHTML = `
    <div class="modal-image-banner">
      ${modalBannerMarkup}
      <span class="card-category-badge ${categoryClass}" style="position:absolute; top:1.25rem; left:1.25rem; z-index:2;">
        ${escapeHTML(plant.category || 'Ayurvedic')}
      </span>
    </div>

    <div class="modal-body-content">
      <div class="modal-header-info">
        <h2 class="modal-plant-title">${escapeHTML(plant.name)} ${plant.englishName ? `<span class="modal-english-sub">(${escapeHTML(plant.englishName)})</span>` : ''}</h2>
        <p class="modal-scientific-name">Botanical Name: ${escapeHTML(plant.scientificName || plant.botanical_name || '')} ${plant.family ? `• Family: ${escapeHTML(plant.family)}` : ''}</p>
        ${synonymsHtml}
      </div>

      <div class="detail-section">
        <h4><i class="fa-solid fa-book-open"></i> Botanical Overview</h4>
        <p>${escapeHTML(descDisplay)}</p>
      </div>

      <div class="detail-section">
        <h4><i class="fa-solid fa-heart-pulse"></i> Traditional Benefits & Uses</h4>
        <div class="benefits-box">
          <p>${escapeHTML(benefitsDisplay)}</p>
        </div>
        ${indicationsHtml}
      </div>

      ${dravyagunaHtml}

      <div class="info-pills-row">
        <div class="info-pill-item">
          <strong><i class="fa-solid fa-leaf"></i> Parts Used</strong>
          <span>${escapeHTML(partsDisplay)}</span>
        </div>
        <div class="info-pill-item">
          <strong><i class="fa-solid fa-sun"></i> Cultivation</strong>
          <span>${escapeHTML(cultivationDisplay)}</span>
        </div>
      </div>

      ${sourceLinkHtml}

      <div style="margin-top: 1.5rem; padding-top: 1.25rem; border-top: 1px solid var(--border); display: flex; justify-content: flex-end;">
        <button type="button" class="btn btn-primary" onclick="quickAddToGarden('${plant._id}', '${escapeHTML(plant.name)}')" style="border-radius:99px; padding:0.6rem 1.4rem;">
          <i class="fa-solid fa-seedling"></i> Add to My Garden
        </button>
      </div>
    </div>
  `;

  plantModal.classList.add('show');
  plantModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  if (plantModal) {
    plantModal.classList.remove('show');
    plantModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = 'auto';
  }
}

// =============================================================================
// UI State Helpers
// =============================================================================
function showLoading() {
  hideAllStates();
  if (loadingState) loadingState.style.display = 'block';
  if (countDisplay) countDisplay.textContent = 'Connecting to database...';
}

function showError(msg) {
  hideAllStates();
  if (errorState) errorState.style.display = 'block';
  if (errorMessage) errorMessage.textContent = msg || 'Could not connect to the Express/MongoDB server.';
  if (countDisplay) countDisplay.textContent = 'Database error';
}

function showEmpty() {
  hideAllStates();
  if (emptyState) emptyState.style.display = 'block';
}

function hideAllStates() {
  if (loadingState) loadingState.style.display = 'none';
  if (errorState) errorState.style.display = 'none';
  if (emptyState) emptyState.style.display = 'none';
  if (plantsGrid) plantsGrid.innerHTML = '';
}

function getCategoryClass(category) {
  if (!category) return 'category-other';
  const cat = category.toLowerCase().replace(/\s+/g, '-');
  return `category-${cat}`;
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
// Phase 2: Dynamic Authentication Navbar Management
// =============================================================================
async function initAuthNavbar() {
  const navList = document.getElementById('nav-list');
  const heroAdminBtn = document.getElementById('btn-hero-admin');
  if (!navList) return;

  try {
    const response = await fetch('/api/auth/me');
    const data = await response.json();

    // Clean up any previously injected dynamic auth items
    document.querySelectorAll('.auth-nav-item').forEach(el => el.remove());

    if (data && data.authenticated && data.user) {
      const user = data.user;

      // 1. "My Garden" Link
      const myGardenLi = document.createElement('li');
      myGardenLi.className = 'nav-item auth-nav-item';
      myGardenLi.innerHTML = `
        <a href="garden.html" class="nav-link" id="nav-my-garden" title="My Garden">
          <i class="fa-solid fa-seedling"></i> My Garden
        </a>
      `;
      navList.appendChild(myGardenLi);

      // 2. "Profile" Link
      const profileLi = document.createElement('li');
      profileLi.className = 'nav-item auth-nav-item';
      profileLi.innerHTML = `
        <a href="profile.html" class="nav-link" id="nav-profile" title="Signed in as ${escapeHTML(user.name)}">
          <i class="fa-solid fa-circle-user"></i> Profile
        </a>
      `;
      navList.appendChild(profileLi);

      // 3. Admin Dashboard link ONLY for authorized administrators
      if (user.role === 'admin') {
        const adminLi = document.createElement('li');
        adminLi.className = 'nav-item auth-nav-item';
        adminLi.innerHTML = `
          <a href="admin.html" class="nav-link admin-nav-btn" id="admin-portal-link" title="Admin Database Dashboard">
            <i class="fa-solid fa-sliders"></i> Admin Dashboard
          </a>
        `;
        navList.appendChild(adminLi);

        if (heroAdminBtn) {
          heroAdminBtn.style.display = 'inline-flex';
          heroAdminBtn.href = 'admin.html';
        }
      } else {
        if (heroAdminBtn) {
          heroAdminBtn.style.display = 'none';
        }
      }

      // 4. Logout button
      const logoutLi = document.createElement('li');
      logoutLi.className = 'nav-item auth-nav-item';
      logoutLi.innerHTML = `
        <button class="nav-btn-logout" id="nav-logout-btn" title="Sign out of account">
          <i class="fa-solid fa-right-from-bracket"></i> Logout
        </button>
      `;
      logoutLi.querySelector('button').addEventListener('click', handleLogout);
      navList.appendChild(logoutLi);

    } else {
      // Unauthenticated state: show Login and Register
      const loginLi = document.createElement('li');
      loginLi.className = 'nav-item auth-nav-item';
      loginLi.innerHTML = `
        <a href="login.html" class="nav-link" id="nav-login-link">
          <i class="fa-solid fa-right-to-bracket"></i> Login
        </a>
      `;
      navList.appendChild(loginLi);

      const registerLi = document.createElement('li');
      registerLi.className = 'nav-item auth-nav-item';
      registerLi.innerHTML = `
        <a href="register.html" class="btn btn-primary nav-btn-cta" id="nav-register-link">
          <i class="fa-solid fa-user-plus"></i> Register
        </a>
      `;
      navList.appendChild(registerLi);

      if (heroAdminBtn) {
        heroAdminBtn.style.display = 'inline-flex';
        heroAdminBtn.href = 'login.html?redirect=%2Fadmin.html';
      }
    }
  } catch (err) {
    console.warn('Could not retrieve authentication state:', err.message);
  }
}

// Quick Add To Garden from Modal Details
window.quickAddToGarden = async function(plantId, plantName) {
  try {
    const res = await fetch('/api/garden', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plantId, status: 'Want to Grow' })
    });

    if (res.status === 401) {
      showBotanicalToast('🌱 Please log in to add herbs to your personal garden.');
      setTimeout(() => {
        window.location.href = '/login.html?redirect=%2Fexplore.html';
      }, 1200);
      return;
    }

    const data = await res.json();
    if (res.ok && data.success) {
      showBotanicalToast(`🌿 "${plantName}" successfully added to your garden!`);
    } else {
      showBotanicalToast(`ℹ️ ${data.message || 'Already in your garden.'}`);
    }
  } catch (err) {
    showBotanicalToast('Could not add plant to garden.');
  }
};

async function handleLogout() {
  try {
    const res = await fetch('/api/auth/logout', { method: 'POST' });
    const data = await res.json();
    if (res.ok && data.success) {
      showBotanicalToast('🌿 Logged out successfully. Have a serene day!');
      setTimeout(() => {
        initAuthNavbar();
      }, 500);
    }
  } catch (err) {
    console.error('Logout error:', err);
  }
}

function showBotanicalToast(message) {
  const existing = document.querySelector('.botanical-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'botanical-toast';
  toast.innerHTML = `<i class="fa-solid fa-circle-info" style="color:var(--accent);"></i> <span>${escapeHTML(message)}</span>`;
  document.body.appendChild(toast);

  setTimeout(() => {
    if (toast.parentNode) {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }
  }, 4000);
}

/**
 * Floating Santhamithra AI Button controller (Homepage only)
 * Hidden at the top, appears smoothly once user scrolls past the hero section
 */
function initFloatingAIButton() {
  const floatingBtn = document.getElementById('floating-ai-btn');
  if (!floatingBtn) return;

  const heroSection = document.querySelector('.hero-section');

  function updateVisibility() {
    let threshold = 300;
    if (heroSection) {
      threshold = Math.max(200, (heroSection.offsetTop + heroSection.offsetHeight) * 0.75);
    }

    if (window.scrollY > threshold) {
      floatingBtn.classList.add('visible');
    } else {
      floatingBtn.classList.remove('visible');
    }
  }

  window.addEventListener('scroll', updateVisibility, { passive: true });
  // Check once on load in case the page is already scrolled
  updateVisibility();
}


