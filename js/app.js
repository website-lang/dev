const appContainer = document.getElementById('app-container');
const views = ['home', 'practice', 'volunteer', 'media', 'blog', 'team', 'donate', 'family'];
const viewCache = {};

// 1. ROUTER: Loads content into the container
async function loadView() {
  const hash = window.location.hash.replace('#', '') || 'home';
  
  try {
    let html;
    if (viewCache[hash]) {
      html = viewCache[hash];
    } else {
      const response = await fetch(`views/${hash}.html`);
      if (!response.ok) throw new Error('View not found');
      html = await response.text();
      viewCache[hash] = html;
    }
    
    appContainer.innerHTML = html;
    window.scrollTo(0, 0);
    
    // Initialize specific page logic
    if(hash === 'donate') initDonationLogic();
    if(hash === 'media') loadPressData();
    if(hash === 'blog') loadBlogData();
    if(hash === 'volunteer') initVolunteerTabs(); // Ensure tabs work

  } catch (error) {
    appContainer.innerHTML = `<div class="container text-center" style="padding:50px;"><h2>404</h2><p>Page not found.</p></div>`;
  }
}

// 2. PRELOADER: Fetches all views in background
async function preloadAll() {
  for (const view of views) {
    if (!viewCache[view]) {
      try {
        const res = await fetch(`views/${view}.html`);
        viewCache[view] = await res.text();
      } catch (e) {}
    }
  }
}

// 3. PAGE LOGIC: Donation Toggle
function initDonationLogic() {
  window.selectDonation = function(amount, intervalCode) {
    // 1. Visual Selection
    document.querySelectorAll('.donate-option').forEach(b => b.classList.remove('selected'));
    event.currentTarget.classList.add('selected');

    // 2. Build URL
    let url = `https://donorbox.org/embed/understanding-us?default_interval=${intervalCode}`;
    
    // Only add amount if it's a specific number (not custom)
    if (amount) {
      url += `&amount=${amount}`;
    }

    // 3. Update Iframe
    const iframe = document.getElementById('dbox-iframe');
    if(iframe) {
      iframe.src = url;
    }
  };
}

// 4. PAGE LOGIC: Volunteer Tabs
function initVolunteerTabs() {
  window.switchTab = function(tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.getElementById('tab-' + tabName).classList.add('active');
    
    document.querySelectorAll('.pill-btn').forEach(el => el.classList.remove('active'));
    // Find the button that was clicked (approximate)
    const buttons = document.querySelectorAll('.pill-btn');
    buttons.forEach(btn => {
      if(btn.textContent.toLowerCase().includes(tabName === 'park' ? 'park' : tabName === 'food' ? 'food' : 'admin')) {
         btn.classList.add('active');
      }
    });
  }
}

// 5. DATA FETCH: Press
async function loadPressData() {
  try {
    const res = await fetch('data/press.json');
    const data = await res.json();
    const container = document.getElementById('press-container');
    
    if(container) {
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
    }
  } catch(e) { console.error("Press data error", e); }
}

// 6. DATA FETCH: Blog
async function loadBlogData() {
  try {
    const res = await fetch('data/blog.json');
    const data = await res.json();
    const container = document.getElementById('blog-container');
    if(container) {
      container.innerHTML = data.map(item => `
        <div style="border-bottom:1px solid #eee; padding-bottom:30px; margin-bottom:30px;">
          <small style="color:#888;">${item.date} • ${item.author}</small>
          <h2>${item.title}</h2>
          <p>${item.preview}</p>
          <a href="#" class="btn btn-outline" style="padding:8px 16px; font-size:0.8rem;">Read More</a>
        </div>
      `).join('');
    }
  } catch(e) {}
}

// INIT
window.addEventListener('hashchange', loadView);
document.addEventListener('DOMContentLoaded', () => {
  loadView();
  setTimeout(preloadAll, 1000);
});
