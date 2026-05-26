// Daily Rhythm App - Main Application Controller

// ========== STATE MANAGEMENT ==========

const appState = {
  currentPage: 'dashboard',
  user: {
    name: 'Barnes',
    email: 'barnes@thestrategypitch.com'
  },
  isMobile: window.innerWidth < 1024,
  sidebarOpen: false
};

// Page configurations
const pages = {
  dashboard: {
    title: 'Dashboard',
    subtitle: "Today's content status and outreach activity"
  },
  calendar: {
    title: 'Content Calendar',
    subtitle: 'Plan your 7-day content cadence'
  },
  assets: {
    title: 'Visual Assets',
    subtitle: 'Manage your real-person photography library'
  },
  composer: {
    title: 'Compose Post',
    subtitle: 'Create and schedule content across LinkedIn and Instagram'
  },
  outreach: {
    title: 'Outreach Hub',
    subtitle: 'Track conversations and inbound DMs'
  },
  analytics: {
    title: 'Analytics',
    subtitle: 'Measure post performance and engagement'
  },
  settings: {
    title: 'Settings',
    subtitle: 'Manage your account and preferences'
  }
};

// ========== DOM ELEMENTS ==========

const elements = {
  sidebar: document.getElementById('sidebar'),
  sidebarOverlay: document.getElementById('sidebarOverlay'),
  menuToggle: document.getElementById('menuToggle'),
  pageTitle: document.getElementById('pageTitle'),
  pageSubtitle: document.getElementById('pageSubtitle'),
  primaryAction: document.getElementById('primaryAction'),
  logoutBtn: document.getElementById('logoutBtn'),
  navLinks: document.querySelectorAll('.sidebar-nav-link')
};

// ========== PAGE NAVIGATION ==========

/**
 * Switch to a different page
 * @param {string} pageName - The page to navigate to
 */
function goToPage(pageName) {
  if (!pages[pageName]) {
    console.warn(`Page "${pageName}" not found`);
    return;
  }

  // Update state
  appState.currentPage = pageName;

  // Hide all pages
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
    page.style.display = 'none';
  });

  // Show selected page
  const selectedPage = document.getElementById(pageName);
  if (selectedPage) {
    selectedPage.classList.add('active');
    selectedPage.style.display = 'block';
  }

  // Update header
  const pageConfig = pages[pageName];
  elements.pageTitle.textContent = pageConfig.title;
  elements.pageSubtitle.textContent = pageConfig.subtitle;

  // Update active nav link
  elements.navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('data-page') === pageName) {
      link.classList.add('active');
    }
  });

  // Update primary action button
  updatePrimaryAction(pageName);

  // Close sidebar on mobile
  if (appState.isMobile) {
    closeSidebar();
  }

  // Scroll to top
  document.querySelector('.main-content').scrollTop = 0;
}

/**
 * Update the primary action button based on current page
 * @param {string} pageName - Current page
 */
function updatePrimaryAction(pageName) {
  const buttonText = pageName === 'composer' ? 'Back to Dashboard' : 'Compose Post';
  const buttonAction = pageName === 'composer' ? 'goToPage("dashboard")' : 'goToPage("composer")';

  elements.primaryAction.textContent = buttonText;
  elements.primaryAction.onclick = () => eval(buttonAction);
}

// ========== SIDEBAR NAVIGATION ==========

/**
 * Initialize navigation event listeners
 */
function initNavigation() {
  elements.navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const pageName = link.getAttribute('data-page');
      goToPage(pageName);
    });
  });
}

/**
 * Toggle sidebar on mobile
 */
function toggleSidebar() {
  if (appState.sidebarOpen) {
    closeSidebar();
  } else {
    openSidebar();
  }
}

/**
 * Open sidebar on mobile
 */
function openSidebar() {
  elements.sidebar.classList.add('open');
  elements.sidebarOverlay.classList.add('open');
  appState.sidebarOpen = true;
}

/**
 * Close sidebar on mobile
 */
function closeSidebar() {
  elements.sidebar.classList.remove('open');
  elements.sidebarOverlay.classList.remove('open');
  appState.sidebarOpen = false;
}

// ========== MOBILE RESPONSIVENESS ==========

/**
 * Handle window resize
 */
function handleResize() {
  const wasMobile = appState.isMobile;
  appState.isMobile = window.innerWidth < 1024;

  // Show/hide mobile menu toggle
  if (appState.isMobile && !wasMobile) {
    elements.menuToggle.style.display = 'flex';
  } else if (!appState.isMobile && wasMobile) {
    elements.menuToggle.style.display = 'none';
    closeSidebar();
  }
}

// ========== USER AUTHENTICATION ==========

/**
 * Handle logout
 */
function handleLogout() {
  if (confirm('Are you sure you want to logout?')) {
    console.log('Logging out...');
    // TODO: Call logout API
    // For now, just show a message
    alert('Logout functionality coming soon');
  }
}

// ========== THEME & TIME ==========

/**
 * Get today's theme based on day of week
 */
function getTodayTheme() {
  const themes = {
    0: 'SUNDAY: Founder Reality',
    1: 'MONDAY: Opportunity Leakage',
    2: 'TUESDAY: Wasted Lead Spend',
    3: 'WEDNESDAY: Stalled Proposal Recovery',
    4: 'THURSDAY: Warm Referrals',
    5: 'FRIDAY: Follow-up Rhythm',
    6: 'SATURDAY: Case Study Lesson'
  };

  const today = new Date().getDay();
  return themes[today];
}

/**
 * Update today's theme in dashboard
 */
function updateTodayTheme() {
  const themeElement = document.getElementById('todayTheme');
  if (themeElement) {
    themeElement.textContent = getTodayTheme();
  }
}

// ========== UTILS ==========

/**
 * Format date to readable string
 * @param {Date} date
 * @returns {string}
 */
function formatDate(date) {
  const options = { weekday: 'long', month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

/**
 * Log message to console with app prefix
 * @param {string} message
 * @param {any} data
 */
function log(message, data = null) {
  console.log(`[Daily Rhythm] ${message}`, data || '');
}

// ========== ACCESSIBILITY ==========

/**
 * Enable focus visible support for older browsers
 */
function initFocusVisible() {
  const root = document.documentElement;
  const body = document.body;

  // Add .js-focus-visible class to document
  root.classList.add('js-focus-visible');

  // Handle keyboard and mouse interactions
  let hadKeyboardEvent = true;

  const updateKeyboardEvent = (e) => {
    hadKeyboardEvent = true;
  };

  const updateMouseEvent = (e) => {
    hadKeyboardEvent = false;
  };

  document.addEventListener('keydown', updateKeyboardEvent, true);
  document.addEventListener('keyup', updateKeyboardEvent, true);
  document.addEventListener('mousedown', updateMouseEvent, true);
  document.addEventListener('mouseup', updateMouseEvent, true);

  // Remove focus-visible for mouse clicks on non-focus-visible elements
  const focusVisibleListener = (e) => {
    if (!hadKeyboardEvent && e.type === 'focus') {
      e.target.classList.remove('focus-visible');
    }
  };

  document.addEventListener('focus', focusVisibleListener, true);
}

// ========== INITIALIZATION ==========

/**
 * Initialize the entire app
 */
function initApp() {
  log('Initializing app...');

  // Setup navigation
  initNavigation();

  // Setup mobile menu toggle
  if (elements.menuToggle) {
    elements.menuToggle.addEventListener('click', toggleSidebar);
  }

  // Setup sidebar overlay click
  if (elements.sidebarOverlay) {
    elements.sidebarOverlay.addEventListener('click', closeSidebar);
  }

  // Setup logout button
  if (elements.logoutBtn) {
    elements.logoutBtn.addEventListener('click', handleLogout);
  }

  // Setup resize listener
  window.addEventListener('resize', handleResize);

  // Initialize focus visible for accessibility
  initFocusVisible();

  // Update mobile state on initial load
  handleResize();

  // Update today's theme
  updateTodayTheme();

  // Go to dashboard
  goToPage('dashboard');

  log('App initialized successfully');
}

// ========== DOCUMENT READY ==========

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// ========== EXPORT FOR OTHER MODULES ==========

// Make functions globally available
window.goToPage = goToPage;
window.appState = appState;
window.log = log;
