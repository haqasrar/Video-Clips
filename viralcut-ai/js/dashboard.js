/**
 * ViralCut AI - Dashboard Controller
 * Calculates metrics (Total Videos, Total Clips, Average Viral Score, Platform Reach)
 * and renders the Spotlight Card and Recent Projects Table.
 */

class DashboardController {
  constructor() {
    this.initElements();
    this.bindEvents();
  }

  initElements() {
    // Metric Value Elements
    this.metricVideos = document.getElementById('metricTotalVideos');
    this.metricClips = document.getElementById('metricTotalClips');
    this.metricAvgScore = document.getElementById('metricAvgScore');
    this.metricTimeSaved = document.getElementById('metricTimeSaved');

    // Spotlight Elements
    this.spotlightContainer = document.getElementById('dashboardSpotlightContainer');

    // Recent Projects Container
    this.recentProjectsContainer = document.getElementById('recentProjectsContainer');

    // Quick Actions
    this.createClipsQuickBtn = document.getElementById('dashboardCreateClipsBtn');
  }

  bindEvents() {
    if (this.createClipsQuickBtn) {
      this.createClipsQuickBtn.addEventListener('click', () => {
        window.app.navigateTo('create');
      });
    }
  }

  refreshDashboard() {
    this.updateMetrics();
    this.renderSpotlightClip();
    this.renderRecentProjects();
  }

  updateMetrics() {
    const projects = window.storageManager.getProjects();
    const allClips = window.storageManager.getAllClips();

    const totalVideos = projects.length;
    const totalClips = allClips.length;

    // Average Score
    let avgScore = '0/100';
    if (allClips.length > 0) {
      const sum = allClips.reduce((acc, c) => acc + (c.viralScore || 0), 0);
      avgScore = `${(sum / allClips.length).toFixed(1)}/100`;
    }

    const hoursSaved = Math.round((totalClips * 45) / 60);

    if (this.metricVideos) this.metricVideos.textContent = totalVideos;
    if (this.metricClips) this.metricClips.textContent = totalClips;
    if (this.metricAvgScore) this.metricAvgScore.textContent = avgScore;
    if (this.metricTimeSaved) this.metricTimeSaved.textContent = `${hoursSaved} hrs`;
  }

  renderSpotlightClip() {
    if (!this.spotlightContainer) return;
    const allClips = window.storageManager.getAllClips();

    if (allClips.length === 0) {
      this.spotlightContainer.innerHTML = `
        <div class="spotlight-card" style="text-align: center; padding: 3rem 1.5rem;">
          <div style="width: 52px; height: 52px; border-radius: 50%; background: rgba(139, 92, 246, 0.15); display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; color: var(--accent-purple);">
            <i data-lucide="sparkles" style="width: 26px; height: 26px;"></i>
          </div>
          <h3 style="margin-bottom: 0.4rem;">No Videos Analyzed Yet</h3>
          <p style="max-width: 420px; margin: 0 auto 1.5rem; color: var(--text-muted); font-size: 0.9rem;">
            Paste a YouTube URL or upload a video file to generate and rank your first viral clips!
          </p>
          <button class="btn btn-primary btn-sm" onclick="app.navigateTo('create')">
            <i data-lucide="plus"></i> Create New Clips
          </button>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    // The clip with the highest score
    const topClip = allClips[0]; // already sorted descending in getAllClips()

    this.spotlightContainer.innerHTML = `
      <div class="spotlight-card">
        <div class="spotlight-badge">
          <i data-lucide="crown"></i> Top Viral Pick • Score ${topClip.viralScore}/100
        </div>

        <div class="spotlight-body">
          <div class="spotlight-preview-wrap">
            <img src="${topClip.sourceThumbnail}" alt="${topClip.title}" />
            <div class="spotlight-play-overlay" onclick="dashboardController.openTopClip('${topClip.projectId}', '${topClip.id}')">
              <div class="play-circle">
                <i data-lucide="play" style="fill: #fff; width: 20px; height: 20px; margin-left: 2px;"></i>
              </div>
            </div>
          </div>

          <div class="spotlight-info">
            <div class="spotlight-score-row">
              <span class="score-pill-large">
                <i data-lucide="zap"></i> ${topClip.viralScore}/100 Viral Prediction
              </span>
              <span class="pill-badge success">
                <i data-lucide="trending-up"></i> ${topClip.scoreTier}
              </span>
            </div>

            <h3>${topClip.title}</h3>
            
            <p style="font-size: 0.82rem; color: var(--text-dim); margin-bottom: 0.75rem;">
              <i data-lucide="film" style="width: 14px; height: 14px; display: inline;"></i> Source: ${topClip.projectTitle} • Range: ${topClip.formattedRange}
            </p>

            <div class="spotlight-ai-reason">
              <strong>AI Virality Factor:</strong>
              ${topClip.aiExplanation}
            </div>

            <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
              <button class="btn btn-primary btn-sm" onclick="dashboardController.openTopClip('${topClip.projectId}', '${topClip.id}')">
                <i data-lucide="edit-3"></i> Open in Editor
              </button>
              <button class="btn btn-secondary btn-sm" onclick="clipGenerator.downloadClipVideoById('${topClip.id}')">
                <i data-lucide="download"></i> Export Clip
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  }

  openTopClip(projectId, clipId) {
    window.clipGenerator.openClipEditor(projectId, clipId);
  }

  renderRecentProjects() {
    if (!this.recentProjectsContainer) return;
    const projects = window.storageManager.getProjects();

    if (projects.length === 0) {
      this.recentProjectsContainer.innerHTML = `
        <div style="padding: 3rem 1.5rem; text-align: center; color: var(--text-dim);">
          <i data-lucide="film" style="width: 38px; height: 38px; opacity: 0.35; margin-bottom: 0.75rem;"></i>
          <h4 style="color: var(--text-main); font-size: 0.95rem;">No Projects Yet</h4>
          <p style="font-size: 0.82rem; color: var(--text-muted); margin-top: 0.25rem;">
            Your analyzed videos and generated clips will be saved here automatically.
          </p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    // Show up to 5 recent projects
    const recent = projects.slice(0, 5);

    this.recentProjectsContainer.innerHTML = recent.map(proj => {
      const formattedDate = new Date(proj.createdAt).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });

      return `
        <div class="project-item" id="recent-proj-${proj.id}">
          <div class="project-item-left">
            <img class="project-thumb" src="${proj.thumbnail}" alt="${proj.title}" />
            <div class="project-meta">
              <h4>${proj.title}</h4>
              <div class="project-meta-details">
                <span><i data-lucide="clock"></i> ${proj.durationFormatted}</span>
                <span><i data-lucide="film"></i> ${proj.clipsCount || (proj.clips ? proj.clips.length : 0)} Clips</span>
                <span><i data-lucide="calendar"></i> ${formattedDate}</span>
                <span style="color: var(--accent-cyan); font-weight: 700;">★ Best: ${proj.highestScore}/100</span>
              </div>
            </div>
          </div>

          <div class="project-item-right">
            <button class="btn btn-secondary btn-sm" onclick="dashboardController.openProject('${proj.id}')">
              <i data-lucide="external-link"></i> View Clips
            </button>
            <button class="btn btn-ghost btn-sm" onclick="dashboardController.deleteProject('${proj.id}')" title="Delete Project">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  openProject(projectId) {
    const proj = window.storageManager.getProject(projectId);
    if (!proj) return;
    window.clipGenerator.displayProjectResults(proj);
  }

  deleteProject(projectId) {
    if (confirm('Are you sure you want to delete this project and all its generated clips?')) {
      window.storageManager.deleteProject(projectId);
      this.refreshDashboard();
      if (window.app.projectsController) {
        window.app.projectsController.renderProjectsList();
      }
      window.app.showToast('Project deleted successfully', 'info');
    }
  }
}

// Global instance
window.dashboardController = new DashboardController();
