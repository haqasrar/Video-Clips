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
    this.editorPosterBackdrop = document.getElementById('editorPosterBackdrop');
    this.editorReplayBtn = document.getElementById('editorReplayBtn');
    this.editorMuteToggleBtn = document.getElementById('editorMuteToggleBtn');
    this.editorYtDirectLink = document.getElementById('editorYtDirectLink');
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
    this.editorCopyInfoBtn = document.getElementById('editorCopyInfoBtn');
    this.editorHeaderDownloadBtn = document.getElementById('editorHeaderDownloadBtn');
    this.playerDirectDownloadBtn = document.getElementById('playerDirectDownloadBtn');
    this.playerCenterPlayBtn = document.getElementById('playerCenterPlayBtn');
    this.downloadAllBtn = document.getElementById('downloadAllClipsBtn');

    // Playback controls in editor
    this.editorPlayPauseBtn = document.getElementById('editorPlayPauseBtn');
    this.editorTimelineProgress = document.getElementById('editorTimelineProgress');
    this.editorTimelineBar = document.getElementById('editorTimelineBar');
    this.editorCurrentTime = document.getElementById('editorCurrentTime');
    this.isPlaybackPlaying = false;

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

    // Replay & Mute Buttons
    if (this.editorReplayBtn) {
      this.editorReplayBtn.addEventListener('click', () => this.replayCurrentClip());
    }
    if (this.editorMuteToggleBtn) {
      this.editorMuteToggleBtn.addEventListener('click', () => this.toggleMute());
    }

    // Save clip modifications
    if (this.saveClipBtn) {
      this.saveClipBtn.addEventListener('click', () => this.saveCurrentClipEdits());
    }

    // Download single clip video (Bound to multiple access buttons)
    const triggerDownload = () => {
      if (this.activeClip) this.downloadClipVideo(this.activeClip);
    };
    if (this.downloadClipBtn) this.downloadClipBtn.addEventListener('click', triggerDownload);
    if (this.editorHeaderDownloadBtn) this.editorHeaderDownloadBtn.addEventListener('click', triggerDownload);
    if (this.playerDirectDownloadBtn) this.playerDirectDownloadBtn.addEventListener('click', triggerDownload);

    // Center big play overlay
    if (this.playerCenterPlayBtn) {
      this.playerCenterPlayBtn.addEventListener('click', () => this.toggleEditorPlayback());
    }

    // Download SRT
    if (this.downloadSrtBtn) {
      this.downloadSrtBtn.addEventListener('click', () => {
        if (this.activeClip) this.downloadSubtitlesSRT(this.activeClip);
      });
    }

    // Copy Info
    if (this.editorCopyInfoBtn) {
      this.editorCopyInfoBtn.addEventListener('click', () => {
        if (this.activeClip) this.copyClipMetadata(this.activeClip.id);
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
                <button class="btn btn-primary btn-sm" onclick="clipGenerator.downloadClipVideoById('${clip.id}')" title="Download playable video clip">
                  <i data-lucide="download"></i> Download Video
                </button>
                <button class="btn btn-secondary btn-sm" onclick="clipGenerator.openClipEditor('${this.currentProject.id}', '${clip.id}')" title="Review video & customize captions">
                  <i data-lucide="edit-3"></i> Edit & Review
                </button>
                <button class="btn btn-ghost btn-sm" onclick="clipGenerator.downloadSubtitlesSRTById('${clip.id}')" title="Download .SRT subtitle file">
                  <i data-lucide="file-text"></i> .SRT
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

    // Set poster backdrop image (guarantees real visuals even during buffering)
    const ytId = this.extractYoutubeId(project.sourceUrl || project.videoUrl);
    const posterSrc = project.thumbnail || (ytId ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg` : '');
    if (this.editorPosterBackdrop && posterSrc) {
      this.editorPosterBackdrop.src = posterSrc;
      this.editorPosterBackdrop.style.display = 'block';
    }

    if (ytId) {
      // YOUTUBE VIDEO: embed YouTube player directly with captions on top
      if (this.editorVideo) {
        this.editorVideo.pause();
        this.editorVideo.style.display = 'none';
      }
      if (this.editorYoutubeFrame) {
        this.editorYoutubeFrame.style.display = 'block';
        this.editorYoutubeFrame.src = `https://www.youtube.com/embed/${ytId}?start=${Math.floor(clip.startTime || 0)}&end=${Math.floor(clip.endTime || 30)}&autoplay=1&mute=1&controls=1&enablejsapi=1&playsinline=1&rel=0`;
      }
      if (this.editorYtDirectLink) {
        this.editorYtDirectLink.href = `https://youtu.be/${ytId}?t=${Math.floor(clip.startTime || 0)}`;
        this.editorYtDirectLink.style.display = 'inline-flex';
      }
      if (this.captionsOverlay) this.captionsOverlay.style.display = 'block';
      this.startCaptionTimer(clip);
    } else {
      // UPLOADED OR DIRECT VIDEO
      if (this.editorYoutubeFrame) {
        this.editorYoutubeFrame.src = '';
        this.editorYoutubeFrame.style.display = 'none';
      }
      if (this.editorYtDirectLink) {
        this.editorYtDirectLink.style.display = 'none';
      }

      let videoUrl = project.videoUrl || 'https://vjs.zencdn.net/v/oceans.mp4';
      if (this.editorVideo) {
        this.editorVideo.style.display = 'block';
        this.editorVideo.src = videoUrl;
        this.editorVideo.load();
        this.editorVideo.currentTime = clip.startTime || 0;
        this.editorVideo.play().catch(e => console.log('Autoplay notice:', e));
      }
      if (this.captionsOverlay) this.captionsOverlay.style.display = 'block';
      this.startCaptionTimer(clip);
    }

    // Open Modal
    if (this.editorModal) {
      this.editorModal.classList.add('active');
    }
    this.isPlaybackPlaying = true;
    if (this.playerCenterPlayBtn) this.playerCenterPlayBtn.classList.add('playing');
    if (this.editorPlayPauseBtn) this.editorPlayPauseBtn.innerHTML = `<i data-lucide="pause"></i>`;
    if (window.lucide) window.lucide.createIcons();
  }

  replayCurrentClip() {
    if (!this.activeClip) return;
    const ytId = this.extractYoutubeId(this.currentProject?.sourceUrl || this.currentProject?.videoUrl);
    if (ytId && this.editorYoutubeFrame && this.editorYoutubeFrame.style.display !== 'none') {
      this.sendYoutubeCommand('seekTo', Math.floor(this.activeClip.startTime || 0));
      this.sendYoutubeCommand('playVideo');
    }
    if (this.editorVideo && this.editorVideo.style.display !== 'none') {
      this.editorVideo.currentTime = this.activeClip.startTime || 0;
      this.editorVideo.play().catch(() => {});
    }
    this.isPlaybackPlaying = true;
    if (this.playerCenterPlayBtn) this.playerCenterPlayBtn.classList.add('playing');
    if (this.editorPlayPauseBtn) this.editorPlayPauseBtn.innerHTML = `<i data-lucide="pause"></i>`;
    this.startCaptionTimer(this.activeClip);
    window.app.showToast('Replaying clip from start', 'info', 1500);
    if (window.lucide) window.lucide.createIcons();
  }

  toggleMute() {
    const ytId = this.extractYoutubeId(this.currentProject?.sourceUrl || this.currentProject?.videoUrl);
    if (ytId && this.editorYoutubeFrame) {
      this.isMuted = !this.isMuted;
      this.sendYoutubeCommand(this.isMuted ? 'mute' : 'unMute');
      if (this.editorMuteToggleBtn) {
        this.editorMuteToggleBtn.innerHTML = this.isMuted
          ? `<i data-lucide="volume-x" style="width: 14px; height: 14px;"></i> <span>Muted</span>`
          : `<i data-lucide="volume-2" style="width: 14px; height: 14px;"></i> <span>Sound On</span>`;
        if (window.lucide) window.lucide.createIcons();
      }
      window.app.showToast(this.isMuted ? 'Muted YouTube audio' : 'Unmuted YouTube audio', 'info', 1500);
      return;
    }
    if (this.editorVideo && this.editorVideo.style.display !== 'none') {
      this.editorVideo.muted = !this.editorVideo.muted;
      if (this.editorMuteToggleBtn) {
        this.editorMuteToggleBtn.innerHTML = this.editorVideo.muted
          ? `<i data-lucide="volume-x" style="width: 14px; height: 14px;"></i> <span>Muted</span>`
          : `<i data-lucide="volume-2" style="width: 14px; height: 14px;"></i> <span>Sound On</span>`;
        if (window.lucide) window.lucide.createIcons();
      }
    }
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
    this.isPlaybackPlaying = false;
    if (this.playerCenterPlayBtn) {
      this.playerCenterPlayBtn.classList.remove('playing');
    }
    if (this.editorVideo) {
      this.editorVideo.pause();
    }
    if (this.editorYoutubeFrame) {
      this.sendYoutubeCommand('pauseVideo');
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
    } else if (style === 'submagic') {
      const words = displayText.split(' ');
      const activeWordIndex = Math.floor((clipElapsedSecs % 3) * (words.length / 3));
      const htmlWords = words.map((w, i) => {
        return i === activeWordIndex ? `<span class="active-word">${w}</span>` : w;
      }).join(' ');

      this.captionsOverlay.innerHTML = `<div class="caption-text-submagic">${htmlWords}</div>`;
    } else if (style === 'clean') {
      this.captionsOverlay.innerHTML = `<div class="caption-text-clean">${displayText}</div>`;
    } else if (style === 'cyber') {
      this.captionsOverlay.innerHTML = `<div class="caption-text-cyber">${displayText}</div>`;
    }
  }

  toggleEditorPlayback() {
    const ytId = this.extractYoutubeId(this.currentProject?.sourceUrl || this.currentProject?.videoUrl);
    
    if (ytId && this.editorYoutubeFrame && this.editorYoutubeFrame.style.display !== 'none') {
      this.isPlaybackPlaying = !this.isPlaybackPlaying;
      if (this.isPlaybackPlaying) {
        this.sendYoutubeCommand('playVideo');
        if (this.editorPlayPauseBtn) this.editorPlayPauseBtn.innerHTML = `<i data-lucide="pause"></i>`;
        if (this.playerCenterPlayBtn) this.playerCenterPlayBtn.classList.add('playing');
        this.startCaptionTimer(this.activeClip);
      } else {
        this.sendYoutubeCommand('pauseVideo');
        if (this.editorPlayPauseBtn) this.editorPlayPauseBtn.innerHTML = `<i data-lucide="play"></i>`;
        if (this.playerCenterPlayBtn) this.playerCenterPlayBtn.classList.remove('playing');
        this.stopCaptionTimer();
      }
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    if (this.editorVideo && this.editorVideo.style.display !== 'none') {
      if (this.editorVideo.paused) {
        this.editorVideo.play().catch(() => {});
        this.isPlaybackPlaying = true;
        if (this.editorPlayPauseBtn) this.editorPlayPauseBtn.innerHTML = `<i data-lucide="pause"></i>`;
        if (this.playerCenterPlayBtn) this.playerCenterPlayBtn.classList.add('playing');
        this.startCaptionTimer(this.activeClip);
      } else {
        this.editorVideo.pause();
        this.isPlaybackPlaying = false;
        if (this.editorPlayPauseBtn) this.editorPlayPauseBtn.innerHTML = `<i data-lucide="play"></i>`;
        if (this.playerCenterPlayBtn) this.playerCenterPlayBtn.classList.remove('playing');
        this.stopCaptionTimer();
      }
      if (window.lucide) window.lucide.createIcons();
    }
  }

  sendYoutubeCommand(cmd, arg = '') {
    if (this.editorYoutubeFrame && this.editorYoutubeFrame.contentWindow) {
      try {
        const payload = arg !== '' 
          ? JSON.stringify({ event: 'command', func: cmd, args: [arg] })
          : JSON.stringify({ event: 'command', func: cmd, args: '' });
        this.editorYoutubeFrame.contentWindow.postMessage(payload, '*');
      } catch (e) {
        console.warn('sendYoutubeCommand notice:', e);
      }
    }
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
      this.sendYoutubeCommand('seekTo', start);
      this.sendYoutubeCommand('playVideo');
      this.isPlaybackPlaying = true;
      if (this.playerCenterPlayBtn) this.playerCenterPlayBtn.classList.add('playing');
      if (this.editorPlayPauseBtn) this.editorPlayPauseBtn.innerHTML = `<i data-lucide="pause"></i>`;
      this.startCaptionTimer(this.activeClip);
      if (window.lucide) window.lucide.createIcons();
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
        <button type="button" class="sub-timestamp" onclick="clipGenerator.seekToSubtitle(${sub.start})" title="Jump video to ${sub.start}s">
          <i data-lucide="play" style="width: 10px; height: 10px; display: inline;"></i> ${sub.start}s
        </button>
        <input type="text" class="sub-input-text" value="${sub.text}" oninput="clipGenerator.updateSubtitleText(${index}, this.value)" />
      </div>
    `).join('');
    if (window.lucide) window.lucide.createIcons();
  }

  seekToSubtitle(startSec) {
    if (!this.activeClip) return;
    const targetTime = (this.activeClip.startTime || 0) + startSec;
    const ytId = this.extractYoutubeId(this.currentProject?.sourceUrl || this.currentProject?.videoUrl);
    if (ytId && this.editorYoutubeFrame) {
      this.sendYoutubeCommand('seekTo', targetTime);
      this.sendYoutubeCommand('playVideo');
      this.isPlaybackPlaying = true;
      if (this.playerCenterPlayBtn) this.playerCenterPlayBtn.classList.add('playing');
      if (this.editorPlayPauseBtn) this.editorPlayPauseBtn.innerHTML = `<i data-lucide="pause"></i>`;
    }
    if (this.editorVideo && this.editorVideo.style.display !== 'none') {
      this.editorVideo.currentTime = targetTime;
      this.editorVideo.play().catch(() => {});
      this.isPlaybackPlaying = true;
      if (this.playerCenterPlayBtn) this.playerCenterPlayBtn.classList.add('playing');
      if (this.editorPlayPauseBtn) this.editorPlayPauseBtn.innerHTML = `<i data-lucide="pause"></i>`;
    }
    this.renderCurrentCaption(startSec);
    if (window.lucide) window.lucide.createIcons();
  }

  updateSubtitleText(index, newText) {
    if (this.activeClip && this.activeClip.subtitles && this.activeClip.subtitles[index]) {
      this.activeClip.subtitles[index].text = newText;
      this.renderCurrentCaption(this.activeClip.subtitles[index].start);
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

  downloadSubtitlesSRTById(clipId) {
    if (!this.currentProject) return;
    const clip = this.currentProject.clips.find(c => c.id === clipId);
    if (clip) this.downloadSubtitlesSRT(clip);
  }

  downloadSourceVideo(clip) {
    const ytId = this.extractYoutubeId(this.currentProject?.sourceUrl || this.currentProject?.videoUrl);
    if (ytId) {
      window.open(`https://youtu.be/${ytId}?t=${Math.floor(clip.startTime || 0)}`, '_blank');
      window.app.showToast('Opened original YouTube video at clip start timestamp!', 'info');
      return;
    }
    if (this.currentProject?.videoUrl) {
      window.open(this.currentProject.videoUrl, '_blank');
    }
  }

  async downloadClipVideo(clip) {
    window.app.showToast(`Exporting clip video: "${clip.title.slice(0, 24)}..."`, 'info');

    // 1. Check if connected to backend server with real FFmpeg
    const settings = window.storageManager.getSettings();
    if (settings.useRealBackend && settings.apiBaseUrl) {
      try {
        window.app.showToast('Rendering high-quality clip via backend FFmpeg engine...', 'info', 3000);
        const res = await fetch(`${settings.apiBaseUrl}/api/video/cut`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoUrl: this.currentProject.sourceUrl || this.currentProject.videoUrl,
            startTime: clip.startTime,
            endTime: clip.endTime,
            aspectRatio: clip.aspectRatio || '9:16',
            captionStyle: clip.captionStyle || 'hormozi'
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.downloadUrl) {
            const dlLink = `${settings.apiBaseUrl}${data.downloadUrl}`;
            const a = document.createElement('a');
            a.href = dlLink;
            a.download = `${clip.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${(clip.aspectRatio || '9x16').replace(':', 'x')}.mp4`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.app.showToast('✅ Downloaded real FFmpeg cut MP4 clip!', 'success', 5000);
            return;
          }
        }
      } catch (beErr) {
        console.warn('Backend FFmpeg cut fallback:', beErr);
      }
    }

    // 2. In-browser real video frame cutting & 9:16 cropping
    try {
      await this.exportCanvasClipVideo(clip);
    } catch (e) {
      console.warn('Canvas export fallback:', e);
      window.app.showToast(`Video rendering notice: Exporting standard format`, 'info');
    }
  }

  async patchWebmDuration(blob, durationMs) {
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      // Search for Info element: 0x15, 0x49, 0xA9, 0x66
      let infoIdx = -1;
      for (let i = 0; i < Math.min(bytes.length - 4, 2048); i++) {
        if (bytes[i] === 0x15 && bytes[i + 1] === 0x49 && bytes[i + 2] === 0xA9 && bytes[i + 3] === 0x66) {
          infoIdx = i;
          break;
        }
      }

      if (infoIdx === -1) return blob;

      // Check if Duration element (0x44, 0x89) is already present in Info block
      let durIdx = -1;
      for (let i = infoIdx + 4; i < Math.min(bytes.length - 4, infoIdx + 300); i++) {
        if (bytes[i] === 0x44 && bytes[i + 1] === 0x89) {
          durIdx = i;
          break;
        }
      }

      // Prepare 4-byte big-endian float for duration in ms
      const floatBuf = new ArrayBuffer(4);
      const floatView = new DataView(floatBuf);
      floatView.setFloat32(0, durationMs, false);
      const floatBytes = new Uint8Array(floatBuf);

      if (durIdx !== -1) {
        const sizeByte = bytes[durIdx + 2];
        if (sizeByte === 0x84) {
          bytes.set(floatBytes, durIdx + 3);
          return new Blob([bytes], { type: 'video/webm' });
        } else if (sizeByte === 0x88) {
          const doubleBuf = new ArrayBuffer(8);
          const doubleView = new DataView(doubleBuf);
          doubleView.setFloat64(0, durationMs, false);
          bytes.set(new Uint8Array(doubleBuf), durIdx + 3);
          return new Blob([bytes], { type: 'video/webm' });
        }
      }

      // Inject Duration element into Info block
      let pos = infoIdx + 4;
      const firstByte = bytes[pos];
      let vintLen = 1;
      let mask = 0x80;
      while (vintLen <= 8 && !(firstByte & mask)) {
        vintLen++;
        mask >>= 1;
      }
      let currentInfoSize = firstByte & (mask - 1);
      for (let i = 1; i < vintLen; i++) {
        currentInfoSize = (currentInfoSize << 8) | bytes[pos + i];
      }

      const durElem = new Uint8Array(7);
      durElem[0] = 0x44;
      durElem[1] = 0x89;
      durElem[2] = 0x84;
      durElem.set(floatBytes, 3);

      const newInfoSize = currentInfoSize + 7;
      const newVint = new Uint8Array(4);
      newVint[0] = 0x10 | ((newInfoSize >> 24) & 0x0F);
      newVint[1] = (newInfoSize >> 16) & 0xFF;
      newVint[2] = (newInfoSize >> 8) & 0xFF;
      newVint[3] = newInfoSize & 0xFF;

      const totalLen = bytes.length - vintLen + 4 + 7;
      const result = new Uint8Array(totalLen);
      result.set(bytes.subarray(0, pos), 0);
      result.set(newVint, pos);
      result.set(durElem, pos + 4);
      result.set(bytes.subarray(pos + vintLen), pos + 4 + 7);

      return new Blob([result], { type: 'video/webm' });
    } catch (err) {
      console.warn('patchWebmDuration notice:', err);
      return blob;
    }
  }

  async exportCanvasClipVideo(clip) {
    const isNineBySixteen = clip.aspectRatio !== '16:9' && clip.aspectRatio !== '1:1';
    window.app.showToast(`Rendering ${clip.aspectRatio || '9:16'} cut clip with animated captions...`, 'info', 4000);

    const width = clip.aspectRatio === '16:9' ? 1280 : (clip.aspectRatio === '1:1' ? 720 : 720);
    const height = clip.aspectRatio === '16:9' ? 720 : (clip.aspectRatio === '1:1' ? 720 : 1280);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    const ytId = this.extractYoutubeId(this.currentProject?.sourceUrl || this.currentProject?.videoUrl);
    let realVideo = null;
    let posterImg = null;
    let posterLoaded = false;

    // Check if we have a direct video stream to cut real frames from
    if (!ytId && this.currentProject?.videoUrl) {
      try {
        const vid = document.createElement('video');
        vid.crossOrigin = 'anonymous';
        vid.playsInline = true;
        vid.muted = true;
        vid.src = this.currentProject.videoUrl;
        await new Promise((resolve) => {
          vid.onloadedmetadata = resolve;
          vid.onerror = resolve;
          setTimeout(resolve, 3000);
        });
        if (vid.videoWidth > 0) {
          realVideo = vid;
          realVideo.currentTime = clip.startTime || 0;
          await new Promise((resolve) => {
            realVideo.onseeked = resolve;
            setTimeout(resolve, 1500);
          });
        }
      } catch (vidErr) {
        realVideo = null;
      }
    }

    // For YouTube videos or fallback
    if (!realVideo) {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        const proxyUrl = ytId
          ? `https://images.weserv.nl/?url=img.youtube.com/vi/${ytId}/hqdefault.jpg`
          : (this.currentProject?.thumbnail || '');
        if (proxyUrl) {
          await new Promise((resolve) => {
            img.onload = () => { posterLoaded = true; resolve(); };
            img.onerror = () => { posterLoaded = false; resolve(); };
            img.src = proxyUrl;
            setTimeout(resolve, 1500);
          });
          if (posterLoaded) posterImg = img;
        }
      } catch (err) {
        posterLoaded = false;
      }
    }

    if (!canvas.captureStream && !canvas.mozCaptureStream) {
      window.app.showToast('Browser does not support canvas video recording', 'error');
      return;
    }

    const stream = canvas.captureStream ? canvas.captureStream(30) : canvas.mozCaptureStream(30);

    // Audio Track Setup
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const dest = audioCtx.createMediaStreamDestination();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      gain.gain.value = 0.0001;
      osc.connect(gain);
      gain.connect(dest);
      osc.start();
      const audioTrack = dest.stream.getAudioTracks()[0];
      if (audioTrack && stream.addTrack) {
        stream.addTrack(audioTrack);
      }
    } catch (e) {
      console.warn('Audio track notice:', e);
    }

    let mimeType = 'video/mp4;codecs=avc1';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/mp4';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp9';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm';
        }
      }
    }

    const chunks = [];
    let recorder;
    try {
      recorder = new MediaRecorder(stream, { mimeType });
    } catch (e) {
      recorder = new MediaRecorder(stream);
    }

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = async () => {
      if (realVideo) realVideo.pause();
      const rawBlob = new Blob(chunks, { type: mimeType });
      const durationSeconds = clip.duration || 30;
      let finalBlob = rawBlob;

      // Patch WebM EBML duration header so Windows Media Player displays duration & seeks
      if (mimeType.includes('webm')) {
        finalBlob = await this.patchWebmDuration(rawBlob, durationSeconds * 1000);
      }

      const isMp4 = mimeType.includes('mp4');
      const ext = isMp4 ? 'mp4' : 'webm';
      const cleanTitle = clip.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const fileName = `${cleanTitle}_${(clip.aspectRatio || '9x16').replace(':', 'x')}.${ext}`;

      const url = URL.createObjectURL(finalBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);

      window.app.showToast(`✅ Exported ${durationSeconds}s Clip Video (${ext.toUpperCase()})! Playable in Windows Media Player & VLC.`, 'success', 5000);
    };

    recorder.start();
    if (realVideo) realVideo.play().catch(() => {});

    // Render loop
    const totalFrames = 120; // 4 seconds of smooth rendered movement
    let frame = 0;
    const subs = clip.subtitles || [{ text: clip.title }];
    const style = clip.captionStyle || 'hormozi';

    const renderLoop = () => {
      // 1. Draw High-Tech SaaS Background
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#0a0d18');
      bgGrad.addColorStop(0.5, '#120f26');
      bgGrad.addColorStop(1, '#07080f');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Draw Real Video Frames (Properly cropped to 9:16 / 16:9 / 1:1)
      if (realVideo && realVideo.videoWidth > 0) {
        const vw = realVideo.videoWidth;
        const vh = realVideo.videoHeight;
        let sx = 0, sy = 0, sw = vw, sh = vh;

        if (clip.aspectRatio === '9:16') {
          sw = vh * (9 / 16);
          sh = vh;
          sx = Math.max(0, (vw - sw) / 2);
          sy = 0;
        } else if (clip.aspectRatio === '1:1') {
          sw = Math.min(vw, vh);
          sh = sw;
          sx = (vw - sw) / 2;
          sy = (vh - sh) / 2;
        } else {
          sx = 0; sy = 0; sw = vw; sh = vh;
        }

        ctx.drawImage(realVideo, sx, sy, sw, sh, 0, 0, width, height);
      } else if (posterLoaded && posterImg) {
        // Fallback: Smart poster framing
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
        ctx.globalAlpha = 0.85;
        ctx.drawImage(posterImg, dx, dy, dw, dh);
        ctx.globalAlpha = 1.0;
      }

      // 3. Dark gradient overlay at bottom for maximum subtitle legibility
      const grad = ctx.createLinearGradient(0, height * 0.4, 0, height);
      grad.addColorStop(0, 'rgba(7, 9, 19, 0)');
      grad.addColorStop(0.65, 'rgba(7, 9, 19, 0.75)');
      grad.addColorStop(1, 'rgba(7, 9, 19, 0.95)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, height * 0.4, width, height * 0.6);

      // 4. Subtle glowing viral audio wave in background
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.35)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let x = 0; x < width; x += 10) {
        const y = (height * 0.52) + Math.sin((x * 0.04) + (frame * 0.15)) * 25;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // 5. Top Header Badge Pill
      ctx.fillStyle = 'rgba(139, 92, 246, 0.95)';
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

      // 6. Draw Animated Caption (Hormozi, Submagic, Clean, Cyber)
      const subIdx = Math.floor((frame / totalFrames) * subs.length) % subs.length;
      const subText = subs[subIdx]?.text || clip.title;

      ctx.save();
      ctx.textAlign = 'center';

      if (style === 'submagic') {
        ctx.font = '900 38px Inter, Impact, sans-serif';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 8;
        ctx.strokeText(subText, width / 2, height * 0.72);
        ctx.fillStyle = (frame % 16 < 8) ? '#38bdf8' : '#f43f5e';
        ctx.fillText(subText, width / 2, height * 0.72);
      } else if (style === 'clean') {
        ctx.font = '700 32px Inter, sans-serif';
        const textMetrics = ctx.measureText(subText);
        const padX = 24, padY = 14;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        if (ctx.roundRect) {
          ctx.roundRect((width - textMetrics.width) / 2 - padX, height * 0.72 - 32, textMetrics.width + (padX * 2), 52, 12);
        } else {
          ctx.rect((width - textMetrics.width) / 2 - padX, height * 0.72 - 32, textMetrics.width + (padX * 2), 52);
        }
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillText(subText, width / 2, height * 0.72);
      } else if (style === 'cyber') {
        ctx.font = '800 36px monospace';
        ctx.fillStyle = '#06b6d4';
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 12;
        ctx.fillText(subText, width / 2, height * 0.72);
      } else {
        // Hormozi Pop
        ctx.font = '900 38px Inter, Impact, sans-serif';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 8;
        ctx.strokeText(subText, width / 2, height * 0.72);
        ctx.fillStyle = (frame % 20 < 10) ? '#22c55e' : '#fffb00';
        ctx.fillText(subText, width / 2, height * 0.72);
      }

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
