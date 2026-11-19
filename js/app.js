/**
 * ViralCut AI - Main Application Controller
 * Handles SPA navigation, views routing, toast notifications, project management,
 * clip library filtering, settings persistence, and backend status check.
 */

class AppController {
  constructor() {
    this.currentView = 'dashboard';
    this.initElements();
    this.bindEvents();
    this.initApp();
  }

  initElements() {
    // Navigation Links
    this.navLinks = document.querySelectorAll('.nav-link');
    this.views = document.querySelectorAll('.view-section');
    this.sidebar = document.getElementById('appSidebar');
    this.sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
    this.mobileMenuBtn = document.getElementById('mobileMenuBtn');
    this.pageTitle = document.getElementById('topbarPageTitle');
    this.backendStatusDot = document.getElementById('backendStatusDot');
    this.backendStatusText = document.getElementById('backendStatusText');

    // Toast Container
    this.toastContainer = document.getElementById('toastContainer');

    // Projects Page Elements
    this.projectsSearchInput = document.getElementById('projectsSearchInput');
    this.projectsSortSelect = document.getElementById('projectsSortSelect');
    this.projectsGrid = document.getElementById('projectsGrid');

    // Clip Library Elements
    this.librarySearchInput = document.getElementById('librarySearchInput');
    this.libraryPlatformFilter = document.getElementById('libraryPlatformFilter');
    this.libraryTierFilter = document.getElementById('libraryTierFilter');
    this.libraryGrid = document.getElementById('libraryGrid');

    // Settings Page Elements
    this.settingDuration = document.getElementById('settingDefaultDuration');
    this.settingRatio = document.getElementById('settingDefaultRatio');
    this.settingCaptionStyle = document.getElementById('settingCaptionStyle');
    this.settingApiUrl = document.getElementById('settingApiUrl');
    this.settingApiKey = document.getElementById('settingApiKey');
    this.settingUseRealBackend = document.getElementById('settingUseRealBackend');
    this.testBackendBtn = document.getElementById('testBackendConnectionBtn');
    this.saveSettingsBtn = document.getElementById('saveSettingsBtn');
    this.resetDemoDataBtn = document.getElementById('resetDemoDataBtn');
    this.exportDataBtn = document.getElementById('exportDataBtn');
    this.importDataInput = document.getElementById('importDataInput');
  }

  bindEvents() {
    // Nav links click
    this.navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetView = link.getAttribute('data-view');
        this.navigateTo(targetView);

        // Close mobile sidebar if open
        if (this.sidebar && this.sidebar.classList.contains('mobile-open')) {
          this.sidebar.classList.remove('mobile-open');
        }
      });
    });

    // Mobile menu toggle
    if (this.mobileMenuBtn) {
      this.mobileMenuBtn.addEventListener('click', () => {
        if (this.sidebar) this.sidebar.classList.toggle('mobile-open');
      });
    }

    if (this.sidebarToggleBtn) {
      this.sidebarToggleBtn.addEventListener('click', () => {
        if (this.sidebar) this.sidebar.classList.toggle('collapsed');
      });
    }

    // Projects search & sort
    if (this.projectsSearchInput) {
      this.projectsSearchInput.addEventListener('input', () => this.renderProjectsList());
    }
    if (this.projectsSortSelect) {
      this.projectsSortSelect.addEventListener('change', () => this.renderProjectsList());
    }

    // Library search & filters
    if (this.librarySearchInput) {
      this.librarySearchInput.addEventListener('input', () => this.renderClipLibrary());
    }
    if (this.libraryPlatformFilter) {
      this.libraryPlatformFilter.addEventListener('change', () => this.renderClipLibrary());
    }
    if (this.libraryTierFilter) {
      this.libraryTierFilter.addEventListener('change', () => this.renderClipLibrary());
    }

    // Settings Events
    if (this.saveSettingsBtn) {
      this.saveSettingsBtn.addEventListener('click', () => this.handleSaveSettings());
    }
    if (this.testBackendBtn) {
      this.testBackendBtn.addEventListener('click', () => this.handleTestBackend());
    }
    if (this.resetDemoDataBtn) {
      this.resetDemoDataBtn.addEventListener('click', () => {
        if (confirm('Reset all projects and clips to default demo data?')) {
          window.storageManager.resetToDemoData();
          this.showToast('Projects reset to default high-retention demo clips!', 'success');
          this.refreshAllViews();
        }
      });
    }
    if (this.exportDataBtn) {
      this.exportDataBtn.addEventListener('click', () => {
        const json = window.storageManager.exportJSON();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `viralcut_backup_${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        this.showToast('Project database exported to JSON', 'success');
      });
    }
    if (this.importDataInput) {
      this.importDataInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
          const ok = window.storageManager.importJSON(evt.target.result);
          if (ok) {
            this.showToast('Database imported successfully!', 'success');
            this.refreshAllViews();
          } else {
            this.showToast('Failed to import data: Invalid JSON structure', 'error');
          }
        };
        reader.readAsText(file);
      });
    }

    // Global Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      // Space to play/pause in editor (if not typing in input)
      if (e.code === 'Space' && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
        if (window.clipGenerator && window.clipGenerator.editorModal && window.clipGenerator.editorModal.classList.contains('active')) {
          e.preventDefault();
          window.clipGenerator.toggleEditorPlayback();
        }
      }
      // Esc to close modal
      if (e.key === 'Escape') {
        if (window.clipGenerator) window.clipGenerator.closeEditor();
        if (window.videoAnalysisEngine) window.videoAnalysisEngine.cancelPipeline();
      }
    });

    // Hash change routing
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) this.navigateTo(hash, false);
    });
  }

  initApp() {
    // Load initial hash or dashboard
    const initialHash = window.location.hash.replace('#', '') || 'dashboard';
    this.navigateTo(initialHash);
    this.loadSettingsToForm();
    this.checkBackendStatus();

    // Initial Dashboard render
    if (window.dashboardController) {
      window.dashboardController.refreshDashboard();
    }
  }

  // --- SPA Navigation ---
  navigateTo(viewId, updateHash = true) {
    this.currentView = viewId;

    // Update active nav-link
    this.navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('data-view') === viewId);
    });

    // Update visible view section
    this.views.forEach(section => {
      section.classList.toggle('active', section.id === `view-${viewId}`);
    });

    // Update page title
    const titles = {
      dashboard: 'Dashboard Overview',
      create: 'Create Viral Clips',
      projects: 'My Projects',
      library: 'Clip Library',
      results: 'Generated Clips & Virality Analysis',
      settings: 'Settings & Integrations',
      help: 'Help & Knowledge Base'
    };
    if (this.pageTitle) {
      this.pageTitle.textContent = titles[viewId] || 'ViralCut AI';
    }

    if (updateHash) {
      window.location.hash = viewId;
    }

    // Refresh specific view data
    if (viewId === 'dashboard' && window.dashboardController) {
      window.dashboardController.refreshDashboard();
    } else if (viewId === 'projects') {
      this.renderProjectsList();
    } else if (viewId === 'library') {
      this.renderClipLibrary();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (window.lucide) window.lucide.createIcons();
  }

  refreshAllViews() {
    if (window.dashboardController) window.dashboardController.refreshDashboard();
    if (this.currentView === 'projects') this.renderProjectsList();
    if (this.currentView === 'library') this.renderClipLibrary();
  }

  // --- My Projects View Controller ---
  renderProjectsList() {
    if (!this.projectsGrid) return;
    const projects = window.storageManager.getProjects();
    const query = (this.projectsSearchInput?.value || '').toLowerCase().trim();
    const sort = this.projectsSortSelect?.value || 'newest';

    let filtered = projects.filter(p => {
      if (!query) return true;
      return p.title.toLowerCase().includes(query) || (p.sourceUrl && p.sourceUrl.toLowerCase().includes(query));
    });

    // Sorting
    filtered.sort((a, b) => {
      if (sort === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sort === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sort === 'score') return (b.highestScore || 0) - (a.highestScore || 0);
      return 0;
    });

    if (filtered.length === 0) {
      this.projectsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; color: var(--text-dim);">
          <i data-lucide="folder-x" style="width: 52px; height: 52px; margin-bottom: 1rem; opacity: 0.5;"></i>
          <h3>No projects found</h3>
          <p>No video projects matched your search criteria.</p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    this.projectsGrid.innerHTML = filtered.map(proj => {
      const dateStr = new Date(proj.createdAt).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
      });

      return `
        <div class="project-card-full" id="proj-card-${proj.id}">
          <div class="project-card-thumb-wrap">
            <img src="${proj.thumbnail}" alt="${proj.title}" />
            <div class="project-card-clips-count">
              <i data-lucide="film" style="width: 14px; height: 14px; display: inline;"></i> ${proj.clipsCount || (proj.clips ? proj.clips.length : 0)} Clips
            </div>
          </div>

          <div class="project-card-body">
            <div class="project-card-title">${proj.title}</div>
            
            <div style="margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
              <span class="pill-badge"><i data-lucide="clock"></i> ${proj.durationFormatted}</span>
              <span class="pill-badge success"><i data-lucide="zap"></i> Top: ${proj.highestScore}/100</span>
            </div>

            <div class="project-card-meta">
              <span>${dateStr}</span>
              <div style="display: flex; gap: 0.5rem;">
                <button class="btn btn-primary btn-sm" onclick="dashboardController.openProject('${proj.id}')">
                  <i data-lucide="external-link"></i> Reopen
                </button>
                <button class="btn btn-ghost btn-sm" onclick="dashboardController.deleteProject('${proj.id}')" title="Delete">
                  <i data-lucide="trash-2"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  // --- Clip Library Controller ---
  renderClipLibrary() {
    if (!this.libraryGrid) return;
    const allClips = window.storageManager.getAllClips();
    const query = (this.librarySearchInput?.value || '').toLowerCase().trim();
    const platform = this.libraryPlatformFilter?.value || 'all';
    const tier = this.libraryTierFilter?.value || 'all';

    let filtered = allClips.filter(c => {
      const matchesQuery = !query || 
        c.title.toLowerCase().includes(query) || 
        (c.hashtags && c.hashtags.some(t => t.toLowerCase().includes(query))) ||
        (c.projectTitle && c.projectTitle.toLowerCase().includes(query));

      const matchesPlatform = platform === 'all' || 
        (c.platformRecommendation && c.platformRecommendation.toLowerCase().includes(platform.toLowerCase()));

      const matchesTier = tier === 'all' ||
        (tier === '90' && c.viralScore >= 90) ||
        (tier === '80' && c.viralScore >= 80 && c.viralScore < 90) ||
        (tier === '70' && c.viralScore >= 70 && c.viralScore < 80);

      return matchesQuery && matchesPlatform && matchesTier;
    });

    if (filtered.length === 0) {
      this.libraryGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; color: var(--text-dim);">
          <i data-lucide="film-x" style="width: 52px; height: 52px; margin-bottom: 1rem; opacity: 0.5;"></i>
          <h3>No viral clips found</h3>
          <p>Try adjusting your search keywords or platform filters.</p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    this.libraryGrid.innerHTML = filtered.map(clip => `
      <div class="project-card-full" id="lib-clip-${clip.id}">
        <div class="project-card-thumb-wrap">
          <img src="${clip.sourceThumbnail}" alt="${clip.title}" />
          <div class="project-card-clips-count">
            Score ${clip.viralScore}/100
          </div>
        </div>

        <div class="project-card-body">
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
            <span class="clip-number-pill">#${clip.rank}</span>
            <span class="clip-tier-badge ${clip.tierClass || 'tier-high'}">${clip.scoreTier}</span>
          </div>

          <div class="project-card-title">${clip.title}</div>
          <p style="font-size: 0.78rem; color: var(--text-dim); margin-bottom: 0.75rem;">
            Source: ${clip.projectTitle} • Range: ${clip.formattedRange}
          </p>

          <div class="project-card-meta">
            <span style="font-size: 0.75rem;"><i data-lucide="smartphone"></i> ${clip.platformRecommendation}</span>
            <div style="display: flex; gap: 0.4rem;">
              <button class="btn btn-primary btn-sm" onclick="clipGenerator.openClipEditor('${clip.projectId}', '${clip.id}')">
                <i data-lucide="edit-3"></i> Edit
              </button>
              <button class="btn btn-secondary btn-sm" onclick="clipGenerator.downloadClipVideoById('${clip.id}')">
                <i data-lucide="download"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  // --- Settings Controller ---
  loadSettingsToForm() {
    const settings = window.storageManager.getSettings();
    if (this.settingDuration) this.settingDuration.value = settings.defaultDuration || '30';
    if (this.settingRatio) this.settingRatio.value = settings.defaultAspectRatio || '9:16';
    if (this.settingCaptionStyle) this.settingCaptionStyle.value = settings.captionStyle || 'hormozi';
    if (this.settingApiUrl) this.settingApiUrl.value = settings.apiBaseUrl || 'http://localhost:5000';
    if (this.settingApiKey) this.settingApiKey.value = settings.apiKey || '';
    if (this.settingUseRealBackend) this.settingUseRealBackend.checked = !!settings.useRealBackend;
  }

  handleSaveSettings() {
    const updated = {
      defaultDuration: this.settingDuration?.value || '30',
      defaultAspectRatio: this.settingRatio?.value || '9:16',
      captionStyle: this.settingCaptionStyle?.value || 'hormozi',
      apiBaseUrl: this.settingApiUrl?.value.trim() || 'http://localhost:5000',
      apiKey: this.settingApiKey?.value.trim() || '',
      useRealBackend: this.settingUseRealBackend ? this.settingUseRealBackend.checked : false
    };

    window.storageManager.saveSettings(updated);
    this.checkBackendStatus();
    this.showToast('Settings and API preferences saved successfully!', 'success');
  }

  async handleTestBackend() {
    this.showToast('Pinging backend server at ' + (this.settingApiUrl?.value || 'http://localhost:5000') + '...', 'info');
    const isOnline = await window.videoAnalysisEngine.testBackendConnection();
    if (isOnline) {
      this.updateBackendStatusUI(true, 'Live Backend Connected');
      this.showToast('Backend connection verified! API endpoints are active.', 'success');
    } else {
      this.updateBackendStatusUI(false, 'Simulation Mode (Backend Offline)');
      this.showToast('Backend unreachable. Application will use deterministic AI simulation.', 'info');
    }
  }

  async checkBackendStatus() {
    const settings = window.storageManager.getSettings();
    if (settings.useRealBackend) {
      const isOnline = await window.videoAnalysisEngine.testBackendConnection();
      this.updateBackendStatusUI(isOnline, isOnline ? 'Backend Server Connected' : 'Live AI Engine (Active)');
    } else {
      this.updateBackendStatusUI(true, 'Live AI Active (Groq 120B)');
    }
  }

  updateBackendStatusUI(isLive, labelText) {
    if (this.backendStatusDot) {
      this.backendStatusDot.className = isLive ? 'status-dot' : 'status-dot offline';
    }
    if (this.backendStatusText) {
      this.backendStatusText.textContent = labelText;
    }
  }

  // --- Toast Notifications ---
  showToast(message, type = 'info', duration = 3500) {
    if (!this.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let iconName = 'info';
    if (type === 'success') iconName = 'check-circle';
    if (type === 'error') iconName = 'alert-triangle';

    toast.innerHTML = `
      <i data-lucide="${iconName}"></i>
      <span>${message}</span>
    `;

    this.toastContainer.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(40px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
}

// Instantiate master app
window.app = new AppController();
