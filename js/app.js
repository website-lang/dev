// app.js

// 1. SETUP & CONFIGURATION
const appContainer = document.getElementById('app-container');
const views = ['home', 'practice', 'volunteer', 'media', 'blog', 'team', 'donate', 'family', 'impact'];
const viewCache = {};

// 2. ROUTER: Loads content into the container
async function loadView() {
  // Get hash, remove '#', default to 'home'
  const hash = window.location.hash.replace('#', '') || 'home';

  // --- ANALYTICS TRACKING ---
  if (typeof gtag === 'function') {
      gtag('event', 'page_view', {
          // FIX: Changed 'viewName' to 'hash'
          page_title: hash.charAt(0).toUpperCase() + hash.slice(1),
          page_location: window.location.href,
          page_path: "/" + hash,
          send_to: 'G-HNNVGCQLFT' 
      });
  }
  
  // Safety Check: If the container isn't found, stop (prevents console errors)
  if (!appContainer) return;

  try {
    let html;

    // A. Check Cache First
    if (viewCache[hash]) {
      html = viewCache[hash];
    } 
    // B. Fetch from Server (Relative path fixes GitHub /dev/ issue)
    else {
      // NOTE: Ensure your files are exactly named 'home.html', 'family.html', etc.
      const response = await fetch(`views/${hash}.html`);
      
      if (!response.ok) {
        throw new Error(`View '${hash}' not found`);
      }
      
      html = await response.text();
      viewCache[hash] = html;
    }
    
    // C. Render
    appContainer.innerHTML = html;
    window.scrollTo(0, 0);
    
    // D. Initialize Page-Specific Logic
    if (hash === 'donate') initDonationLogic();
    if (hash === 'media') loadPressData();
    if (hash === 'blog') loadBlogData();
    if (hash === 'volunteer') initVolunteerTabs();

  } catch (error) {
    console.error('Router Error:', error);
    appContainer.innerHTML = `
      <div class="container section-pad text-center">
        <h2>Page Not Found</h2>
        <p>Sorry, we couldn't load this section.</p>
        <a href="#home" class="btn btn-primary">Return Home</a>
      </div>
    `;
  }
}

// 3. PRELOADER: Fetches all views in background
async function preloadAll() {
  for (const view of views) {
    if (!viewCache[view]) {
      try {
        const res = await fetch(`views/${view}.html`);
        if (res.ok) {
          viewCache[view] = await res.text();
        }
      } catch (e) {
        // Silently fail for preload, it's optional
      }
    }
  }
}

// 4. PAGE LOGIC: Donation Toggle
function initDonationLogic() {
  window.selectDonation = function(amount, intervalCode) {
    // Visual Selection
    document.querySelectorAll('.donate-option').forEach(b => b.classList.remove('selected'));
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('selected');
    }

    // Build URL
    let url = `https://donorbox.org/embed/understanding-us?default_interval=${intervalCode}`;
    
    // Only add amount if it's a specific number
    if (amount) {
      url += `&amount=${amount}`;
    }

    // Update Iframe
    const iframe = document.getElementById('dbox-iframe');
    if(iframe) {
      iframe.src = url;
    }
  };
}

// 5. PAGE LOGIC: Volunteer Tabs
function initVolunteerTabs() {
  window.switchTab = function(tabName) {
    // Hide all contents
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    // Show target content
    const target = document.getElementById('tab-' + tabName);
    if (target) target.classList.add('active');
    
    // Update Buttons
    document.querySelectorAll('.pill-btn').forEach(el => el.classList.remove('active'));
    
    // Highlight the clicked button
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }
  }
}

// 6. DATA FETCH: Press (Media Page)
async function loadPressData() {
  const container = document.getElementById('press-container'); 
  if (!container) return; // Stop if element doesn't exist on this view

  // If you don't have data/press.json, this will error.
  // Make sure that file exists, or remove this function.
  try {
    const res = await fetch('data/press.json');
    if (!res.ok) throw new Error('Press data missing');
    
    const data = await res.json();
    
    container.innerHTML = data.map(item => `
      <a href="${item.link}" target="_blank" rel="noopener noreferrer" class="press-list-item">
        <div class="press-list-date">${item.date}</div>
        <div class="press-list-content">
          <span class="press-list-source">${item.source}</span>
          <h3 class="press-list-title">${item.title}</h3>
        </div>
        <div class="press-list-arrow">→</div>
      </a>
    `).join('');
  } catch(e) { 
    console.warn("Press data error (ignore if no json file yet):", e);
    // Fallback content if JSON fails
    container.innerHTML = '<p class="text-center text-muted">News archive loading...</p>';
  }
}

// 7. DATA FETCH: Blog (Stories Page)
async function loadBlogData() {
  const container = document.getElementById('blog-container'); 
  if (!container) return;

  try {
    const res = await fetch('data/blog.json');
    if (!res.ok) throw new Error('Blog data missing');

    const data = await res.json();
    
    container.innerHTML = data.map(item => `
      <div class="press-card" style="padding: 30px; border-top: 4px solid var(--accent-earth);">
        <span style="color:var(--accent-teal); font-weight:900; letter-spacing:0.1em; text-transform:uppercase; font-size:0.75rem; display:block; margin-bottom:15px;">${item.category}</span>
        <h3 style="font-size: 1.4rem; margin-bottom: 15px;">${item.title}</h3>
        <p style="font-size: 0.95rem; color: #666; line-height: 1.6;">${item.excerpt}</p>
        <div style="margin-top: 20px; font-size: 0.8rem; color: #999; font-style: italic;">
          ${item.date}
        </div>
      </div>
    `).join('');
  } catch(e) { 
    console.warn("Blog data error (ignore if no json file yet):", e); 
    container.innerHTML = '<p class="text-center text-muted">Stories loading...</p>';
  }
}

// 8. INITIALIZATION
window.addEventListener('hashchange', loadView);
document.addEventListener('DOMContentLoaded', () => {
  loadView();
  setTimeout(preloadAll, 2000); 
});
