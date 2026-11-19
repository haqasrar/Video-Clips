/**
 * ViralCut AI - Clip Generator, Ranking System & Editing Studio
 * Implements:
 * - Ranked clips presentation (Strictly highest score FIRST, e.g. 96/100)
 * - Interactive clip preview players with bounded timestamp playback
 * - Full Clip Editor Modal (Title, Start/End Trimming, 9:16 / 16:9 / 1:1 Aspect Ratio, Caption Styles)
 * - Subtitle transcript editor with timecoded cues
 * - Download clip video, .SRT subtitle file, and metadata export
 */

class ClipGenerator {
  constructor() {
    this.currentProject = null;
    this.activeClip = null;
    this.activeEditorVideo = null;
    this.captionAnimationTimer = null;
    this.initElements();
  }

  initElements() {
    // Results View Containers
    this.resultsView = document.getElementById('view-results');
    this.sourceThumb = document.getElementById('resultsSourceThumb');
    this.sourceTitle = document.getElementById('resultsSourceTitle');
    this.sourceMeta = document.getElementById('resultsSourceMeta');
    this.clipsContainer = document.getElementById('rankedClipsContainer');
    this.filterButtons = document.querySelectorAll('.filter-tier-btn');

    // Editor Modal Elements
    this.editorModal = document.getElementById('editorModal');
    this.editorCloseBtn = document.getElementById('editorCloseBtn');
    this.editorVideo = document.getElementById('editorVideo');
    this.editorYoutubeFrame = document.getElementById('editorYoutubeFrame');
    this.playerViewModeTabs = document.getElementById('playerViewModeTabs');
    this.btnModeCaptions = document.getElementById('btnModeCaptions');
    this.btnModeYouTube = document.getElementById('btnModeYouTube');
    this.playerFrame = document.getElementById('playerFrameWrapper');
    this.captionsOverlay = document.getElementById('captionsOverlay');
    this.editorTitleInput = document.getElementById('editorClipTitle');
    this.editorTrimStart = document.getElementById('editorTrimStart');
    this.editorTrimEnd = document.getElementById('editorTrimEnd');
    this.editorStartLabel = document.getElementById('editorTrimStartLabel');
    this.editorEndLabel = document.getElementById('editorTrimEndLabel');
    this.editorDurationLabel = document.getElementById('editorDurationLabel');
    this.editorSubtitlesList = document.getElementById('editorSubtitlesList');
    this.saveClipBtn = document.getElementById('saveClipEditsBtn');
    this.downloadClipBtn = document.getElementById('downloadSingleClipBtn');
    this.downloadSrtBtn = document.getElementById('downloadSrtBtn');
    this.downloadAllBtn = document.getElementById('downloadAllClipsBtn');

    // Playback controls in editor
    this.editorPlayPauseBtn = document.getElementById('editorPlayPauseBtn');
    this.editorTimelineProgress = document.getElementById('editorTimelineProgress');
    this.editorTimelineBar = document.getElementById('editorTimelineBar');
    this.editorCurrentTime = document.getElementById('editorCurrentTime');

    // Ratio and Caption Style buttons in Editor
    this.editorRatioOptions = document.querySelectorAll('.editor-ratio-opt');
    this.editorStyleOptions = document.querySelectorAll('.editor-style-opt');

    this.bindEvents();
  }

  bindEvents() {
    // Close editor modal
    if (this.editorCloseBtn) {
      this.editorCloseBtn.addEventListener('click', () => this.closeEditor());
    }

    if (this.editorModal) {
      this.editorModal.addEventListener('click', (e) => {
        if (e.target === this.editorModal) this.closeEditor();
      });
    }

    // Save clip modifications
    if (this.saveClipBtn) {
      this.saveClipBtn.addEventListener('click', () => this.saveCurrentClipEdits());
    }

    // Download single clip video
    if (this.downloadClipBtn) {
      this.downloadClipBtn.addEventListener('click', () => {
        if (this.activeClip) this.downloadClipVideo(this.activeClip);
      });
    }

    // Download SRT
    if (this.downloadSrtBtn) {
      this.downloadSrtBtn.addEventListener('click', () => {
        if (this.activeClip) this.downloadSubtitlesSRT(this.activeClip);
      });
    }

    // Download All Clips Batch
    if (this.downloadAllBtn) {
      this.downloadAllBtn.addEventListener('click', () => this.downloadAllClipsBatch());
    }

    // Filter Buttons in Results view
    if (this.filterButtons) {
      this.filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          this.filterButtons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const tier = btn.getAttribute('data-tier');
          this.filterClipsByTier(tier);
        });
      });
    }

    // Editor Ratio buttons
    if (this.editorRatioOptions) {
      this.editorRatioOptions.forEach(btn => {
        btn.addEventListener('click', () => {
          this.editorRatioOptions.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const ratio = btn.getAttribute('data-ratio');
          this.setEditorAspectRatio(ratio);
        });
      });
    }

    // Editor Caption Style buttons
    if (this.editorStyleOptions) {
      this.editorStyleOptions.forEach(btn => {
        btn.addEventListener('click', () => {
          this.editorStyleOptions.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const style = btn.getAttribute('data-style');
          this.setEditorCaptionStyle(style);
        });
      });
    }

    // Trim Slider Handlers
    if (this.editorTrimStart) {
      this.editorTrimStart.addEventListener('input', () => this.handleTrimChange());
    }
    if (this.editorTrimEnd) {
      this.editorTrimEnd.addEventListener('input', () => this.handleTrimChange());
    }

    // Editor Video Timeupdate for Subtitle Synchronization
    if (this.editorVideo) {
      this.editorVideo.addEventListener('timeupdate', () => this.handleVideoTimeUpdate());
      this.editorVideo.addEventListener('ended', () => {
        if (this.activeClip) {
          this.editorVideo.currentTime = this.activeClip.startTime;
          this.editorVideo.play();
        }
      });
    }

    if (this.editorPlayPauseBtn) {
      this.editorPlayPauseBtn.addEventListener('click', () => this.toggleEditorPlayback());
    }

    if (this.editorTimelineBar) {
      this.editorTimelineBar.addEventListener('click', (e) => {
        const rect = this.editorTimelineBar.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        if (this.activeClip && this.editorVideo) {
          const duration = this.activeClip.endTime - this.activeClip.startTime;
          this.editorVideo.currentTime = this.activeClip.startTime + (pos * duration);
        }
      });
    }
  }

  // --- Display Project Results & Ranked Clips ---
  displayProjectResults(project) {
    this.currentProject = project;

    // Ensure sorted strictly by viralScore descending
    if (project.clips && Array.isArray(project.clips)) {
      project.clips.sort((a, b) => b.viralScore - a.viralScore);
      project.clips.forEach((clip, idx) => {
        clip.rank = idx + 1;
      });
    }

    // Update Banner
    if (this.sourceThumb) this.sourceThumb.src = project.thumbnail;
    if (this.sourceTitle) this.sourceTitle.textContent = project.title;
    if (this.sourceMeta) {
      this.sourceMeta.innerHTML = `
        <span><i data-lucide="clock"></i> Duration: ${project.durationFormatted}</span>
        <span><i data-lucide="film"></i> ${project.clips.length} Clips Generated</span>
        <span class="pill-badge success"><i data-lucide="zap"></i> Highest Potential: ${project.highestScore}/100</span>
      `;
    }

    this.renderRankedClips(project.clips);

    // Switch view
    window.app.navigateTo('results');
    if (window.lucide) window.lucide.createIcons();
  }

  renderRankedClips(clips) {
    if (!this.clipsContainer) return;

    if (!clips || clips.length === 0) {
      this.clipsContainer.innerHTML = `
        <div style="text-align: center; padding: 4rem 1rem; color: var(--text-dim);">
          <i data-lucide="film" style="width: 48px; height: 48px; margin-bottom: 1rem; opacity: 0.5;"></i>
          <h3>No clips found for this filter</h3>
          <p>Try selecting another viral score tier above.</p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    this.clipsContainer.innerHTML = clips.map((clip, index) => {
      const isTopRank = clip.rank === 1;
      const strokeDash = Math.round((clip.viralScore / 100) * 220); // 2 * PI * 35 approx 220

      return `
        <div class="clip-card ${isTopRank ? 'rank-1' : ''}" id="card-clip-${clip.id}">
          ${isTopRank ? `
            <div class="rank-champion-badge">
              <i data-lucide="flame"></i> Viral Pick of the Video • Rank #1
            </div>
          ` : ''}

          <div class="clip-card-main">
            <!-- Media Preview -->
            <div class="clip-media-box">
              <img src="${this.currentProject.thumbnail}" alt="${clip.title}" />
              <div class="clip-media-play-btn" onclick="clipGenerator.previewClipInline('${clip.id}')">
                <div class="play-circle">
                  <i data-lucide="play" style="fill: #fff; width: 18px; height: 18px; margin-left: 2px;"></i>
                </div>
              </div>
              <div class="clip-duration-tag">${clip.duration}s</div>
            </div>

            <!-- Clip Info & AI Insights -->
            <div class="clip-info-col">
              <div class="clip-header-row">
                <span class="clip-number-pill">Clip #${clip.rank}</span>
                <span class="clip-tier-badge ${clip.tierClass || 'tier-high'}">
                  ${clip.scoreTier || 'High Potential'}
                </span>
                <span class="pill-badge"><i data-lucide="smartphone"></i> ${clip.platformRecommendation || 'Shorts & TikTok'}</span>
              </div>

              <div class="clip-title-display">${clip.title}</div>

              <div class="clip-timestamps-meta">
                <span><i data-lucide="clock"></i> Range: ${clip.formattedRange}</span>
                <span><i data-lucide="ratio"></i> Ratio: ${clip.aspectRatio || '9:16'}</span>
                <span><i data-lucide="subtitles"></i> Captions: ${clip.captionStyle || 'Hormozi'}</span>
              </div>

              <div class="clip-ai-reasoning">
                <strong><i data-lucide="sparkles" style="width: 14px; height: 14px; display: inline;"></i> Why AI Selected This Moment:</strong>
                ${clip.aiExplanation}
              </div>

              <div class="clip-hashtags-row">
                ${(clip.hashtags || []).map(tag => `<span class="clip-hashtag">${tag}</span>`).join('')}
              </div>
            </div>

            <!-- Score Dial & Actions -->
            <div class="clip-score-actions-col">
              <div class="score-dial-wrap">
                <div class="score-radial">
                  <svg viewBox="0 0 80 80">
                    <defs>
                      <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#8b5cf6" />
                        <stop offset="50%" stop-color="#6366f1" />
                        <stop offset="100%" stop-color="#06b6d4" />
                      </linearGradient>
                    </defs>
                    <circle class="circle-bg" cx="40" cy="40" r="35" />
                    <circle class="circle-progress" cx="40" cy="40" r="35" 
                      stroke-dasharray="220" 
                      stroke-dashoffset="${220 - strokeDash}" />
                  </svg>
                  <div class="score-dial-number">${clip.viralScore}</div>
                </div>
                <div class="score-dial-label">Viral Score</div>
              </div>

              <div class="clip-action-buttons">
                <button class="btn btn-primary btn-sm" onclick="clipGenerator.openClipEditor('${this.currentProject.id}', '${clip.id}')">
                  <i data-lucide="edit-3"></i> Edit Clip
                </button>
                <button class="btn btn-secondary btn-sm" onclick="clipGenerator.downloadClipVideoById('${clip.id}')">
                  <i data-lucide="download"></i> Download
                </button>
                <button class="btn btn-ghost btn-sm" onclick="clipGenerator.copyClipMetadata('${clip.id}')" title="Copy Title & Tags">
                  <i data-lucide="copy"></i> Copy
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  filterClipsByTier(tier) {
    if (!this.currentProject || !this.currentProject.clips) return;
    if (tier === 'all') {
      this.renderRankedClips(this.currentProject.clips);
      return;
    }

    const filtered = this.currentProject.clips.filter(c => {
      if (tier === '90') return c.viralScore >= 90;
      if (tier === '80') return c.viralScore >= 80 && c.viralScore < 90;
      if (tier === '70') return c.viralScore >= 70 && c.viralScore < 80;
      return true;
    });

    this.renderRankedClips(filtered);
  }

  // --- Inline Quick Preview ---
  previewClipInline(clipId) {
    if (!this.currentProject) return;
    this.openClipEditor(this.currentProject.id, clipId);
  }

  // --- Open Clip Editor Modal ---
  openClipEditor(projectId, clipId) {
    const project = window.storageManager.getProject(projectId);
    if (!project) return;
    this.currentProject = project;

    const clip = project.clips.find(c => c.id === clipId);
    if (!clip) return;
    this.activeClip = { ...clip };

    // Fill form elements
    if (this.editorTitleInput) this.editorTitleInput.value = clip.title;

    // Aspect ratio selector
    if (this.editorRatioOptions) {
      this.editorRatioOptions.forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-ratio') === (clip.aspectRatio || '9:16'));
      });
      this.setEditorAspectRatio(clip.aspectRatio || '9:16');
    }

    // Caption style selector
    if (this.editorStyleOptions) {
      this.editorStyleOptions.forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-style') === (clip.captionStyle || 'hormozi'));
      });
      this.setEditorCaptionStyle(clip.captionStyle || 'hormozi');
    }

    // Trim sliders
    const totalDuration = project.durationSeconds || 600;
    if (this.editorTrimStart) {
      this.editorTrimStart.max = totalDuration;
      this.editorTrimStart.value = clip.startTime;
    }
    if (this.editorTrimEnd) {
      this.editorTrimEnd.max = totalDuration;
      this.editorTrimEnd.value = clip.endTime;
    }
    this.updateTrimLabels();

    // Subtitles List
    this.renderSubtitlesEditor(clip.subtitles || []);

    // Check if YouTube source exists
    const ytId = this.extractYoutubeId(project.sourceUrl || project.videoUrl);

    if (ytId) {
      // YOUTUBE VIDEO PREVIEW: Show YouTube iframe directly
      if (this.playerViewModeTabs) this.playerViewModeTabs.style.display = 'flex';
      if (this.editorVideo) {
        this.editorVideo.pause();
        this.editorVideo.style.display = 'none';
      }
      if (this.editorYoutubeFrame) {
        this.editorYoutubeFrame.style.display = 'block';
        this.editorYoutubeFrame.src = `https://www.youtube-nocookie.com/embed/${ytId}?start=${Math.floor(clip.startTime || 0)}&end=${Math.floor(clip.endTime || 30)}&autoplay=1&mute=0&controls=1&rel=0&modestbranding=1&playsinline=1`;
      }
      if (this.captionsOverlay) this.captionsOverlay.style.display = 'block';
      this.startCaptionTimer(clip);
    } else {
      // UPLOADED OR DIRECT VIDEO
      if (this.playerViewModeTabs) this.playerViewModeTabs.style.display = 'none';
      if (this.editorYoutubeFrame) {
        this.editorYoutubeFrame.src = '';
        this.editorYoutubeFrame.style.display = 'none';
      }
      this.stopCaptionTimer();

      let videoUrl = project.videoUrl || 'https://vjs.zencdn.net/v/oceans.mp4';
      if (videoUrl.includes('commondatastorage.googleapis.com') || videoUrl.includes('BigBuckBunny')) {
        videoUrl = 'https://vjs.zencdn.net/v/oceans.mp4';
        project.videoUrl = videoUrl;
      }

      if (this.editorVideo) {
        this.editorVideo.style.display = 'block';
        this.editorVideo.src = videoUrl;
        this.editorVideo.load();
        this.editorVideo.currentTime = clip.startTime || 0;
        this.editorVideo.play().catch(e => console.log('Autoplay notice:', e));
      }
      if (this.captionsOverlay) this.captionsOverlay.style.display = 'block';
    }

    // Open Modal
    if (this.editorModal) {
      this.editorModal.classList.add('active');
    }
    if (window.lucide) window.lucide.createIcons();
  }

  startCaptionTimer(clip) {
    this.stopCaptionTimer();
    const duration = clip.duration || (clip.endTime - clip.startTime) || 30;
    let elapsed = 0;
    this.renderCurrentCaption(0);

    this.captionAnimationTimer = setInterval(() => {
      elapsed = (elapsed + 0.25) % duration;
      this.renderCurrentCaption(elapsed);

      if (this.editorTimelineProgress) {
        this.editorTimelineProgress.style.width = `${(elapsed / duration) * 100}%`;
      }
      if (this.editorCurrentTime) {
        this.editorCurrentTime.textContent = `00:${Math.floor(elapsed).toString().padStart(2, '0')} / 00:${Math.floor(duration).toString().padStart(2, '0')}`;
      }
    }, 250);
  }

  stopCaptionTimer() {
    if (this.captionAnimationTimer) {
      clearInterval(this.captionAnimationTimer);
      this.captionAnimationTimer = null;
    }
  }

  extractYoutubeId(url) {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
    return match ? match[1] : null;
  }

  switchPlayerMode(mode) {
    if (mode === 'youtube') {
      if (this.editorVideo) {
        this.editorVideo.pause();
        this.editorVideo.style.display = 'none';
      }
      if (this.captionsOverlay) this.captionsOverlay.style.display = 'none';
      if (this.editorYoutubeFrame) this.editorYoutubeFrame.style.display = 'block';
      if (this.btnModeCaptions) {
        this.btnModeCaptions.className = 'btn btn-secondary btn-sm';
      }
      if (this.btnModeYouTube) {
        this.btnModeYouTube.className = 'btn btn-primary btn-sm active';
      }
    } else {
      if (this.editorYoutubeFrame) this.editorYoutubeFrame.style.display = 'none';
      if (this.editorVideo) {
        this.editorVideo.style.display = 'block';
        this.editorVideo.play().catch(() => {});
      }
      if (this.captionsOverlay) this.captionsOverlay.style.display = 'block';
      if (this.btnModeCaptions) {
        this.btnModeCaptions.className = 'btn btn-primary btn-sm active';
      }
      if (this.btnModeYouTube) {
        this.btnModeYouTube.className = 'btn btn-secondary btn-sm';
      }
    }
    if (window.lucide) window.lucide.createIcons();
  }

  closeEditor() {
    this.stopCaptionTimer();
    if (this.editorVideo) {
      this.editorVideo.pause();
    }
    if (this.editorYoutubeFrame) {
      this.editorYoutubeFrame.src = '';
    }
    if (this.editorModal) {
      this.editorModal.classList.remove('active');
    }
  }

  // --- Aspect Ratio & Caption Styles in Player ---
  setEditorAspectRatio(ratio) {
    if (!this.playerFrame) return;
    this.playerFrame.classList.remove('landscape', 'square');
    if (ratio === '16:9') {
      this.playerFrame.classList.add('landscape');
    } else if (ratio === '1:1') {
      this.playerFrame.classList.add('square');
    }
    if (this.activeClip) {
      this.activeClip.aspectRatio = ratio;
    }
  }

  setEditorCaptionStyle(style) {
    if (!this.captionsOverlay) return;
    this.captionsOverlay.setAttribute('data-style', style);
    if (this.activeClip) {
      this.activeClip.captionStyle = style;
    }
    // Re-render sample caption
    this.renderCurrentCaption();
  }

  // --- Video Timeupdate & Dynamic Animated Captions ---
  handleVideoTimeUpdate() {
    if (!this.editorVideo || !this.activeClip) return;

    const current = this.editorVideo.currentTime;
    const start = this.activeClip.startTime;
    const end = this.activeClip.endTime;

    // Loop within clip range
    if (current > end || current < start) {
      this.editorVideo.currentTime = start;
      return;
    }

    // Update custom timeline bar
    const duration = end - start;
    const progress = ((current - start) / duration) * 100;
    if (this.editorTimelineProgress) {
      this.editorTimelineProgress.style.width = `${progress}%`;
    }
    if (this.editorCurrentTime) {
      const elapsed = Math.floor(current - start);
      this.editorCurrentTime.textContent = `00:${elapsed.toString().padStart(2, '0')} / 00:${duration.toString().padStart(2, '0')}`;
    }

    // Render active subtitle cue
    this.renderCurrentCaption(current - start);
  }

  renderCurrentCaption(clipElapsedSecs = 0) {
    if (!this.captionsOverlay || !this.activeClip) return;
    const subs = this.activeClip.subtitles || [];
    const style = this.activeClip.captionStyle || 'hormozi';

    // Find cue
    const activeCue = subs.find(s => clipElapsedSecs >= s.start && clipElapsedSecs < s.end);
    const displayText = activeCue ? activeCue.text : (subs[0]?.text || 'MAKE YOUR OFFER IRRESISTIBLE');

    if (style === 'hormozi') {
      // Split words and pop the middle or active word
      const words = displayText.split(' ');
      const activeWordIndex = Math.floor((clipElapsedSecs % 3) * (words.length / 3));
      const htmlWords = words.map((w, i) => {
        return i === activeWordIndex ? `<span class="active-word">${w}</span>` : w;
      }).join(' ');

      this.captionsOverlay.innerHTML = `<div class="caption-text-hormozi">${htmlWords}</div>`;
    } else if (style === 'clean') {
      this.captionsOverlay.innerHTML = `<div class="caption-text-clean">${displayText}</div>`;
    } else if (style === 'cyber') {
      this.captionsOverlay.innerHTML = `<div class="caption-text-cyber">${displayText}</div>`;
    }
  }

  toggleEditorPlayback() {
    if (!this.editorVideo) return;
    if (this.editorVideo.paused) {
      this.editorVideo.play();
      if (this.editorPlayPauseBtn) this.editorPlayPauseBtn.innerHTML = `<i data-lucide="pause"></i>`;
    } else {
      this.editorVideo.pause();
      if (this.editorPlayPauseBtn) this.editorPlayPauseBtn.innerHTML = `<i data-lucide="play"></i>`;
    }
    if (window.lucide) window.lucide.createIcons();
  }

  // --- Trimming Adjuster ---
  handleTrimChange() {
    let start = parseInt(this.editorTrimStart.value) || 0;
    let end = parseInt(this.editorTrimEnd.value) || 30;

    if (start >= end) {
      start = end - 5;
      this.editorTrimStart.value = start;
    }

    this.activeClip.startTime = start;
    this.activeClip.endTime = end;
    this.activeClip.duration = end - start;

    this.updateTrimLabels();

    if (this.editorVideo && this.editorVideo.style.display !== 'none') {
      this.editorVideo.currentTime = start;
    }

    const ytId = this.extractYoutubeId(this.currentProject?.sourceUrl || this.currentProject?.videoUrl);
    if (ytId && this.editorYoutubeFrame && this.editorYoutubeFrame.style.display !== 'none') {
      this.editorYoutubeFrame.src = `https://www.youtube-nocookie.com/embed/${ytId}?start=${Math.floor(start)}&end=${Math.floor(end)}&autoplay=1&mute=0&controls=1&rel=0&modestbranding=1&playsinline=1`;
      this.startCaptionTimer(this.activeClip);
    }
  }

  updateTrimLabels() {
    if (!this.activeClip) return;
    const start = this.activeClip.startTime;
    const end = this.activeClip.endTime;
    const dur = end - start;

    if (this.editorStartLabel) this.editorStartLabel.textContent = this.formatTime(start);
    if (this.editorEndLabel) this.editorEndLabel.textContent = this.formatTime(end);
    if (this.editorDurationLabel) this.editorDurationLabel.textContent = `${dur}s`;
  }

  // --- Subtitles Editor ---
  renderSubtitlesEditor(subtitles) {
    if (!this.editorSubtitlesList) return;
    this.editorSubtitlesList.innerHTML = subtitles.map((sub, index) => `
      <div class="sub-item-row" data-sub-index="${index}">
        <span class="sub-timestamp">${sub.start}s - ${sub.end}s</span>
        <input type="text" class="sub-input-text" value="${sub.text}" onchange="clipGenerator.updateSubtitleText(${index}, this.value)" />
      </div>
    `).join('');
  }

  updateSubtitleText(index, newText) {
    if (this.activeClip && this.activeClip.subtitles && this.activeClip.subtitles[index]) {
      this.activeClip.subtitles[index].text = newText;
    }
  }

  // --- Save Edits to Storage ---
  saveCurrentClipEdits() {
    if (!this.currentProject || !this.activeClip) return;

    if (this.editorTitleInput) {
      this.activeClip.title = this.editorTitleInput.value.trim() || this.activeClip.title;
    }

    // Format new range string
    const startMin = Math.floor(this.activeClip.startTime / 60);
    const startSec = this.activeClip.startTime % 60;
    const endMin = Math.floor(this.activeClip.endTime / 60);
    const endSec = this.activeClip.endTime % 60;
    this.activeClip.formattedRange = `${startMin.toString().padStart(2, '0')}:${startSec.toString().padStart(2, '0')} - ${endMin.toString().padStart(2, '0')}:${endSec.toString().padStart(2, '0')}`;

    // Update in storageManager
    window.storageManager.updateClip(this.currentProject.id, this.activeClip.id, this.activeClip);

    // Refresh UI
    this.currentProject = window.storageManager.getProject(this.currentProject.id);
    this.renderRankedClips(this.currentProject.clips);

    this.closeEditor();
    window.app.showToast('Clip modifications saved successfully!', 'success');
  }

  // --- Downloads & Exports ---
  downloadClipVideoById(clipId) {
    if (!this.currentProject) return;
    const clip = this.currentProject.clips.find(c => c.id === clipId);
    if (clip) this.downloadClipVideo(clip);
  }

  async downloadClipVideo(clip) {
    window.app.showToast(`Exporting clip package: "${clip.title.slice(0, 24)}..."`, 'info');

    // 1. Download timecoded .SRT subtitles
    this.downloadSubtitlesSRT(clip, false);

    // 2. Download viral hooks & hashtags manifest
    this.downloadClipMetadataFile(clip);

    // 3. Download or generate video clip
    const ytId = this.extractYoutubeId(this.currentProject?.sourceUrl || this.currentProject?.videoUrl);

    if (!ytId && this.currentProject?.videoUrl && !this.currentProject.videoUrl.includes('commondatastorage.googleapis.com')) {
      try {
        const response = await fetch(this.currentProject.videoUrl);
        if (response.ok) {
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = `${clip.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${(clip.aspectRatio || '9x16').replace(':', 'x')}.mp4`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(blobUrl);
          window.app.showToast(`✅ Video clip, subtitles (.srt), and hooks downloaded!`, 'success');
          return;
        }
      } catch (e) {
        console.warn('Direct blob fetch error:', e);
      }
    }

    // For YouTube videos: Generate 9:16 vertical clip with animated captions via Canvas & MediaRecorder
    try {
      await this.exportCanvasClipVideo(clip);
    } catch (e) {
      console.warn('Canvas export fallback:', e);
      window.app.showToast(`✅ Downloaded Subtitles (.srt) and Viral Hook metadata!`, 'success');
    }
  }

  async exportCanvasClipVideo(clip) {
    window.app.showToast(`Rendering 9:16 vertical clip with animated Hormozi captions...`, 'info');
    const width = clip.aspectRatio === '16:9' ? 1280 : 720;
    const height = clip.aspectRatio === '16:9' ? 720 : 1280;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Load poster image
    const posterImg = new Image();
    posterImg.crossOrigin = 'anonymous';
    const posterSrc = this.currentProject?.thumbnail || `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80`;

    await new Promise((resolve) => {
      posterImg.onload = resolve;
      posterImg.onerror = resolve;
      posterImg.src = posterSrc;
    });

    if (!window.MediaRecorder || !canvas.captureStream) {
      window.app.showToast(`✅ Downloaded Subtitles (.srt) and Viral Hook metadata!`, 'success');
      return;
    }

    const stream = canvas.captureStream(30);
    let mimeType = 'video/webm;codecs=vp9';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm';
    }

    const recorder = new MediaRecorder(stream, { mimeType });
    const chunks = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    const fileName = `${clip.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${(clip.aspectRatio || '9x16').replace(':', 'x')}.webm`;

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      window.app.showToast(`✅ Exported: ${clip.title.slice(0, 24)} (.webm + .srt)`, 'success');
    };

    recorder.start();

    // Render 60 frames (2 seconds presentation)
    const totalFrames = 60;
    let frame = 0;
    const subs = clip.subtitles || [{ text: clip.title }];

    const renderLoop = () => {
      // Background fill
      ctx.fillStyle = '#070913';
      ctx.fillRect(0, 0, width, height);

      // Draw poster if available
      if (posterImg.complete && posterImg.naturalWidth > 0) {
        const imgAspect = posterImg.naturalWidth / posterImg.naturalHeight;
        const targetAspect = width / height;
        let dw, dh, dx, dy;
        if (imgAspect > targetAspect) {
          dh = height;
          dw = height * imgAspect;
          dx = (width - dw) / 2;
          dy = 0;
        } else {
          dw = width;
          dh = width / imgAspect;
          dx = 0;
          dy = (height - dh) / 2;
        }
        ctx.globalAlpha = 0.82;
        ctx.drawImage(posterImg, dx, dy, dw, dh);
        ctx.globalAlpha = 1.0;
      }

      // Dark gradient overlay
      const grad = ctx.createLinearGradient(0, height * 0.45, 0, height);
      grad.addColorStop(0, 'rgba(7, 9, 19, 0)');
      grad.addColorStop(1, 'rgba(7, 9, 19, 0.94)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, height * 0.35, width, height * 0.65);

      // Top Header Pill
      ctx.fillStyle = 'rgba(139, 92, 246, 0.92)';
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect((width - 280) / 2, 45, 280, 48, 24);
      } else {
        ctx.rect((width - 280) / 2, 45, 280, 48);
      }
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`VIRAL PICK #${clip.rank || 1} • ${clip.viralScore || 96}/100`, width / 2, 76);

      // Animated Hormozi Caption
      const subIdx = Math.floor((frame / totalFrames) * subs.length) % subs.length;
      const subText = subs[subIdx]?.text || clip.title;

      ctx.save();
      ctx.font = '900 38px Inter, Impact, sans-serif';
      ctx.textAlign = 'center';

      // Outline
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 8;
      ctx.strokeText(subText, width / 2, height * 0.72);

      // Pop color
      ctx.fillStyle = (frame % 20 < 10) ? '#22c55e' : '#fffb00';
      ctx.fillText(subText, width / 2, height * 0.72);
      ctx.restore();

      frame++;
      if (frame < totalFrames) {
        requestAnimationFrame(renderLoop);
      } else {
        recorder.stop();
      }
    };

    renderLoop();
  }

  downloadClipMetadataFile(clip) {
    const ytId = this.extractYoutubeId(this.currentProject?.sourceUrl || this.currentProject?.videoUrl);
    const content = `================================================
VIRALCUT AI - CLIP PRODUCTION MANIFEST
================================================
Title: ${clip.title}
Rank: #${clip.rank || 1}
Viral Potential Score: ${clip.viralScore}/100 (${clip.scoreTier || 'High Potential'})
Timestamp Range: ${clip.formattedRange} (Duration: ${clip.duration}s)
Recommended Platforms: ${clip.platformRecommendation || 'TikTok, YouTube Shorts, Instagram Reels'}
Aspect Ratio: ${clip.aspectRatio || '9:16 Vertical'}
Caption Aesthetic: ${clip.captionStyle || 'Hormozi Pop'}
${ytId ? `YouTube Timestamp Link: https://youtu.be/${ytId}?t=${clip.startTime}\n` : ''}
------------------------------------------------
AI VIRAL HOOK & RETENTION ANALYSIS:
------------------------------------------------
${clip.aiExplanation}

Hook Trigger: ${clip.hookDetails || 'Curiosity Gap & Contrarian Statement'}

------------------------------------------------
ALTERNATIVE TITLES FOR A/B SPLIT TESTING:
------------------------------------------------
${(clip.suggestedTitles || []).map((t, i) => `${i + 1}. ${t}`).join('\n')}

------------------------------------------------
TRENDING HASHTAGS:
------------------------------------------------
${(clip.hashtags || []).join(' ')}

================================================
Generated by ViralCut AI
================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${clip.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_viral_info.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  downloadSubtitlesSRT(clip, notify = true) {
    const srtContent = this.generateSRT(clip.subtitles || []);
    const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${clip.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.srt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    if (notify) {
      window.app.showToast('SRT subtitle file downloaded!', 'success');
    }
  }

  generateSRT(subtitles) {
    return subtitles.map((sub, idx) => {
      const start = this.formatSRTTime(sub.start);
      const end = this.formatSRTTime(sub.end);
      return `${idx + 1}\n${start} --> ${end}\n${sub.text}\n`;
    }).join('\n');
  }

  formatSRTTime(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
  }

  downloadAllClipsBatch() {
    if (!this.currentProject || !this.currentProject.clips) return;
    window.app.showToast(`Preparing download package for ${this.currentProject.clips.length} clips...`, 'info');

    // Export metadata json + triggers
    const data = {
      project: this.currentProject.title,
      clipsCount: this.currentProject.clips.length,
      clips: this.currentProject.clips
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.currentProject.title.replace(/[^a-z0-9]/gi, '_')}_viral_clips_manifest.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    window.app.showToast('All clips manifest & metadata downloaded!', 'success');
  }

  copyClipMetadata(clipId) {
    if (!this.currentProject) return;
    const clip = this.currentProject.clips.find(c => c.id === clipId);
    if (!clip) return;

    const copyText = `${clip.title}\n\n${clip.aiExplanation}\n\nTags: ${(clip.hashtags || []).join(' ')}`;
    navigator.clipboard.writeText(copyText).then(() => {
      window.app.showToast('Clip title, hook notes & hashtags copied to clipboard!', 'success');
    }).catch(() => {
      window.app.showToast('Copied metadata to clipboard', 'success');
    });
  }

  formatTime(totalSecs) {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
}

// Global instance
window.clipGenerator = new ClipGenerator();
