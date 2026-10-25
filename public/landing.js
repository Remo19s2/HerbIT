/**
 * HerbIT - LANDING PAGE SCRIPT (landing.js)
 * Handles auth navbar state, live featured plants showcase, stats sync, and UI interactions
 */

document.addEventListener('DOMContentLoaded', () => {
  initLandingAuth();
  initMobileNav();
  loadFeaturedPlants();
  initFloatingAI();
});

// =============================================================================
// Dynamic Authentication State for Landing Navbar
// =============================================================================
async function initLandingAuth() {
  const navList = document.getElementById('nav-list');
  const finalCtaAuthBtn = document.getElementById('final-cta-auth-btn');
  if (!navList) return;

  try {
    const response = await fetch('/api/auth/me');
    const data = await response.json();

    // Remove any previous dynamic items
    document.querySelectorAll('.auth-nav-item').forEach(el => el.remove());

    if (data && data.authenticated && data.user) {
      const user = data.user;

      // 1. My Garden
      const myGardenLi = document.createElement('li');
      myGardenLi.className = 'nav-item auth-nav-item';
      myGardenLi.innerHTML = `
        <a href="garden.html" class="nav-link" id="nav-my-garden" title="My Garden">
          <i class="fa-solid fa-seedling"></i> My Garden
        </a>
      `;
      navList.appendChild(myGardenLi);

      // 2. Profile
      const profileLi = document.createElement('li');
      profileLi.className = 'nav-item auth-nav-item';
      profileLi.innerHTML = `
        <a href="profile.html" class="nav-link" id="nav-profile" title="Signed in as ${escapeLandingHTML(user.name)}">
          <i class="fa-solid fa-circle-user"></i> Profile
        </a>
      `;
      navList.appendChild(profileLi);

      // 3. Admin Dashboard (shown ONLY to authorized administrators)
      if (user.role === 'admin') {
        const adminLi = document.createElement('li');
        adminLi.className = 'nav-item auth-nav-item';
        adminLi.innerHTML = `
          <a href="admin.html" class="nav-link admin-nav-btn" id="nav-admin" title="Database Portal">
            <i class="fa-solid fa-sliders"></i> Admin Dashboard
          </a>
        `;
        navList.appendChild(adminLi);
      }

      // 4. Logout Button
      const logoutLi = document.createElement('li');
      logoutLi.className = 'nav-item auth-nav-item';
      logoutLi.innerHTML = `
        <button class="nav-btn-logout" id="nav-logout-btn" title="Sign out">
          <i class="fa-solid fa-right-from-bracket"></i> Logout
        </button>
      `;
      logoutLi.querySelector('button').addEventListener('click', handleLandingLogout);
      navList.appendChild(logoutLi);

      // Update CTA buttons if user is already logged in
      if (finalCtaAuthBtn) {
        finalCtaAuthBtn.href = 'garden.html';
        finalCtaAuthBtn.innerHTML = '<i class="fa-solid fa-seedling"></i> Go to My Garden';
      }

    } else {
      // Unauthenticated Guest State
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
    }
  } catch (err) {
    console.warn('Authentication status query failed:', err.message);
  }
}

async function handleLandingLogout() {
  try {
    const res = await fetch('/api/auth/logout', { method: 'POST' });
    const data = await res.json();
    if (res.ok && data.success) {
      window.location.reload();
    }
  } catch (err) {
    console.error('Logout error:', err);
  }
}

// =============================================================================
// Mobile Navigation
// =============================================================================
function initMobileNav() {
  const toggle = document.getElementById('mobile-toggle');
  const navMenu = document.getElementById('nav-menu');
  if (toggle && navMenu) {
    toggle.addEventListener('click', () => {
      navMenu.classList.toggle('open');
    });

    // Close when clicking nav link
    navMenu.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
      });
    });
  }
}

// =============================================================================
// Featured Plants Dynamic Loading
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

  // 2. Common / English name match using strict word-boundary regex
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
      (trimmed.startsWith('http://') || trimmed.startsWith('https://'))
    ) {
      return trimmed;
    }
  }

  // 4. Neutral botanical illustration placeholder fallback
  return 'images/plants/default-plant.jpg';
}

async function loadFeaturedPlants() {
  const container = document.getElementById('featured-plants-container');
  const speciesCountBadge = document.getElementById('hero-species-count');
  if (!container) return;

  // Curated foundational herbs with reliable local images
  const fallbackPlants = [
    {
      name: "Tulsi (Holy Basil)",
      scientificName: "Ocimum tenuiflorum",
      category: "Ayurvedic",
      description: "Revered as the 'Queen of Herbs', Tulsi is celebrated for its adaptogenic properties and vital respiratory support.",
      image: "images/plants/tulsi.jpg"
    },
    {
      name: "Neem",
      scientificName: "Azadirachta indica",
      category: "Medicinal",
      description: "A fast-growing evergreen celebrated across centuries for skin wellness, oral hygiene, and natural insect deterrence.",
      image: "images/plants/neem.jpg"
    },
    {
      name: "Aloe Vera",
      scientificName: "Aloe barbadensis miller",
      category: "Medicinal",
      description: "Thick, nutrient-dense succulent leaves containing soothing gel traditionally used to soothe minor burns and hydrate skin.",
      image: "images/plants/aloe-vera.jpg"
    },
    {
      name: "Ashwagandha",
      scientificName: "Withania somnifera",
      category: "Ayurvedic",
      description: "Renowned Rasayana rejuvenator in classical Ayurveda, traditionally used to manage daily stress and support stamina.",
      image: "images/plants/ashwagandha.jpg"
    }
  ];

  try {
    const res = await fetch('/api/plants');
    if (res.ok) {
      const result = await res.json();
      if (result.success && Array.isArray(result.data) && result.data.length > 0) {
        if (speciesCountBadge) {
          speciesCountBadge.textContent = `${result.data.length}+`;
        }

        // Pick distinct celebrated herbs from dataset if available
        const targetHerbs = ['tulsi', 'neem', 'aloe', 'ashwagandha'];
        const chosen = [];
        for (const target of targetHerbs) {
          const match = result.data.find(p => (p.name || '').toLowerCase().includes(target));
          if (match && !chosen.some(c => c._id === match._id)) {
            chosen.push(match);
          }
        }

        // Fill up to 4 if any were missing
        for (const p of result.data) {
          if (chosen.length >= 4) break;
          if (!chosen.some(c => c._id === p._id)) {
            chosen.push(p);
          }
        }

        renderFeaturedCards(container, chosen.length === 4 ? chosen : fallbackPlants);
        return;
      }
    }
  } catch (err) {
    console.warn('Using curated fallback for featured plants:', err.message);
  }

  // Fallback rendering
  renderFeaturedCards(container, fallbackPlants);
}

function renderFeaturedCards(container, plants) {
  container.innerHTML = plants.map(plant => {
    const resolvedImg = resolvePlantImage(plant);
    return `
      <div class="featured-plant-card">
        <div class="plant-card-media">
          <img src="${escapeLandingHTML(resolvedImg)}" 
               alt="${escapeLandingHTML(plant.name)}" 
               loading="lazy" 
               onerror="this.onerror=null; this.src='images/plants/default-plant.jpg';" />
          <span class="plant-card-tag">${escapeLandingHTML(plant.category || 'Herbal')}</span>
        </div>
        <div class="plant-card-body">
          <h3 class="plant-card-name">${escapeLandingHTML(plant.name)}</h3>
          <p class="plant-card-scientific">${escapeLandingHTML(plant.scientificName || plant.botanical_name || 'Botanical specimen')}</p>
          <p class="plant-card-desc">${escapeLandingHTML(plant.description || plant.preview || 'Rich in traditional therapeutic principles.')}</p>
          <div class="plant-card-action">
            <a href="explore.html" class="plant-card-btn">
              <span>Explore Details</span>
              <i class="fa-solid fa-arrow-right"></i>
            </a>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// =============================================================================
// Floating AI Assistant Button scroll visibility
// =============================================================================
function initFloatingAI() {
  const floatingBtn = document.getElementById('floating-ai-btn');
  if (!floatingBtn) return;

  function checkScroll() {
    if (window.scrollY > 300) {
      floatingBtn.classList.add('visible');
    } else {
      floatingBtn.classList.remove('visible');
    }
  }

  window.addEventListener('scroll', checkScroll, { passive: true });
  checkScroll();
}

function escapeLandingHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
