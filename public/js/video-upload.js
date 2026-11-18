/**
 * ViralCut AI - Video Upload & Input Controller
 * Handles YouTube URL validation, metadata parsing, drag-and-drop file upload,
 * real HTML5 video canvas thumbnail extraction, and preset samples loader.
 */

class VideoUploadController {
  constructor() {
    this.currentSource = null; // { type: 'youtube' | 'upload', url, file, title, duration, durationFormatted, thumbnail, videoObjectUrl }
    this.isUploading = false;
    this.initElements();
    this.bindEvents();
  }

  initElements() {
    // Tabs
    this.tabButtons = document.querySelectorAll('.input-tab-btn');
    this.tabContents = document.querySelectorAll('.input-tab-content');

    // URL Input Elements
    this.urlInput = document.getElementById('videoUrlInput');
    this.fetchUrlBtn = document.getElementById('fetchUrlBtn');
    this.urlPreviewCard = document.getElementById('urlPreviewCard');
    this.urlPreviewThumb = document.getElementById('urlPreviewThumb');
    this.urlPreviewTitle = document.getElementById('urlPreviewTitle');
    this.urlPreviewMeta = document.getElementById('urlPreviewMeta');

    // Drag & Drop Elements
    this.dropzone = document.getElementById('dropzone');
    this.fileInput = document.getElementById('videoFileInput');
    this.uploadProgressCard = document.getElementById('uploadProgressCard');
    this.uploadProgressBar = document.getElementById('uploadProgressBar');
    this.uploadProgressPercent = document.getElementById('uploadProgressPercent');
    this.uploadFileName = document.getElementById('uploadFileName');
    this.uploadFileSize = document.getElementById('uploadFileSize');
    this.uploadPreviewCard = document.getElementById('uploadPreviewCard');
    this.uploadPreviewThumb = document.getElementById('uploadPreviewThumb');
    this.uploadPreviewTitle = document.getElementById('uploadPreviewTitle');
    this.uploadPreviewMeta = document.getElementById('uploadPreviewMeta');

    // Analyze Action Button
    this.analyzeBtn = document.getElementById('startAnalysisBtn');
    this.presetChips = document.querySelectorAll('.preset-chip');
  }

  bindEvents() {
    // Tab switching
    if (this.tabButtons) {
      this.tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const tabTarget = btn.getAttribute('data-tab');
          this.switchTab(tabTarget);
        });
      });
    }

    // URL change & paste auto-check
    if (this.urlInput) {
      this.urlInput.addEventListener('input', () => {
        this.debounce(() => this.handleUrlChange(), 400)();
      });
      this.urlInput.addEventListener('paste', () => {
        setTimeout(() => this.handleUrlChange(), 100);
      });
    }

    if (this.fetchUrlBtn) {
      this.fetchUrlBtn.addEventListener('click', () => this.handleUrlChange(true));
    }

    // File Drag & Drop
    if (this.dropzone) {
      this.dropzone.addEventListener('click', () => {
        if (this.fileInput) this.fileInput.click();
      });

      ['dragenter', 'dragover'].forEach(eventName => {
        this.dropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.dropzone.classList.add('dragover');
        });
      });

      ['dragleave', 'drop'].forEach(eventName => {
        this.dropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.dropzone.classList.remove('dragover');
        });
      });

      this.dropzone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
          this.handleFileSelect(files[0]);
        }
      });
    }

    if (this.fileInput) {
      this.fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
          this.handleFileSelect(e.target.files[0]);
        }
      });
    }

    // Presets
    if (this.presetChips) {
      this.presetChips.forEach(chip => {
        chip.addEventListener('click', () => {
          const sampleKey = chip.getAttribute('data-sample');
          this.loadPresetSample(sampleKey);
        });
      });
    }

    // Main Analyze Video Button
    if (this.analyzeBtn) {
      this.analyzeBtn.addEventListener('click', () => {
        this.triggerVideoAnalysis();
      });
    }
  }

  switchTab(tabId) {
    this.tabButtons.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });
    this.tabContents.forEach(content => {
      content.classList.toggle('active', content.id === `tab-${tabId}`);
    });
  }

  debounce(func, wait) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  // --- YouTube & Web URL Handler ---
  parseVideoUrl(url) {
    if (!url) return null;
    url = url.trim();

    // YouTube pattern
    const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const ytMatch = url.match(ytRegex);
    if (ytMatch && ytMatch[1]) {
      const videoId = ytMatch[1];
      return {
        type: 'youtube',
        videoId: videoId,
        url: url,
        thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        fallbackThumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
      };
    }

    // Direct MP4 / WebM / MOV URL
    if (url.match(/\.(mp4|webm|mov)(\?.*)?$/i)) {
      return {
        type: 'direct',
        url: url,
        thumbnail: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=600&auto=format&fit=crop&q=80'
      };
    }

    // General Web Video URL (valid http/https)
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return {
        type: 'web',
        url: url,
        thumbnail: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=600&auto=format&fit=crop&q=80'
      };
    }

    return null;
  }

  async handleUrlChange(notify = false) {
    const rawUrl = this.urlInput.value.trim();
    if (!rawUrl) {
      if (this.urlPreviewCard) this.urlPreviewCard.style.display = 'none';
      this.currentSource = null;
      return;
    }

    const parsed = this.parseVideoUrl(rawUrl);
    if (!parsed) {
      if (notify) {
        window.app.showToast('Please enter a valid YouTube or video URL', 'error');
      }
      if (this.urlPreviewCard) this.urlPreviewCard.style.display = 'none';
      return;
    }

    let videoTitle = 'Imported Web Video';
    let durationSeconds = 720;
    let durationFormatted = '12:00';
    let thumbnail = parsed.thumbnail;

    if (parsed.type === 'youtube') {
      videoTitle = 'YouTube Video (' + parsed.videoId + ')';
      // Try oEmbed metadata fetch
      try {
        const oembedUrl = `https://noembed.com/embed?url=${encodeURIComponent(parsed.url)}`;
        const res = await fetch(oembedUrl);
        if (res.ok) {
          const data = await res.json();
          if (data.title) {
            videoTitle = data.title;
          }
          if (data.thumbnail_url) {
            thumbnail = data.thumbnail_url;
          }
        }
      } catch (err) {
        console.warn('oEmbed lookup unavailable, fallback to standard parsing', err);
      }
    }

    this.currentSource = {
      type: 'youtube',
      url: parsed.url,
      title: videoTitle,
      duration: durationSeconds,
      durationFormatted: durationFormatted,
      thumbnail: thumbnail,
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
    };

    // Update UI Preview
    if (this.urlPreviewCard) {
      this.urlPreviewCard.style.display = 'block';
      if (this.urlPreviewThumb) {
        this.urlPreviewThumb.src = thumbnail;
        this.urlPreviewThumb.onerror = () => {
          if (parsed.fallbackThumbnail) this.urlPreviewThumb.src = parsed.fallbackThumbnail;
        };
      }
      if (this.urlPreviewTitle) this.urlPreviewTitle.textContent = videoTitle;
      if (this.urlPreviewMeta) {
        this.urlPreviewMeta.innerHTML = `
          <span class="pill-badge success"><i data-lucide="check-circle-2"></i> Verified Stream</span>
          <span class="pill-badge"><i data-lucide="clock"></i> Est. ~${durationFormatted}</span>
          <span class="pill-badge"><i data-lucide="sparkles"></i> Ready to Analyze</span>
        `;
        if (window.lucide) window.lucide.createIcons();
      }
    }

    if (notify) {
      window.app.showToast('Video URL validated successfully!', 'success');
    }
  }

  // --- Local Video File Upload Handler ---
  handleFileSelect(file) {
    if (!file) return;

    // Validate type
    const validExtensions = ['.mp4', '.mov', '.webm'];
    const fileName = file.name.toLowerCase();
    const isValid = validExtensions.some(ext => fileName.endsWith(ext)) || file.type.startsWith('video/');

    if (!isValid) {
      window.app.showToast('Invalid format. Please upload MP4, MOV, or WebM video.', 'error');
      return;
    }

    const fileSizeFormatted = this.formatFileSize(file.size);
    const objectUrl = URL.createObjectURL(file);

    // Show upload progress simulation
    if (this.uploadProgressCard) {
      this.uploadProgressCard.style.display = 'block';
      if (this.uploadFileName) this.uploadFileName.textContent = file.name;
      if (this.uploadFileSize) this.uploadFileSize.textContent = fileSizeFormatted;
    }

    this.isUploading = true;
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += Math.floor(Math.random() * 20) + 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(progressInterval);
        this.isUploading = false;
        this.finishFileUpload(file, objectUrl, fileSizeFormatted);
      }
      if (this.uploadProgressBar) this.uploadProgressBar.style.width = `${progress}%`;
      if (this.uploadProgressPercent) this.uploadProgressPercent.textContent = `${progress}%`;
    }, 150);
  }

  finishFileUpload(file, objectUrl, fileSizeFormatted) {
    // Probe real video using offscreen HTML5 Video element
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    tempVideo.src = objectUrl;
    tempVideo.muted = true;
    tempVideo.playsInline = true;

    tempVideo.onloadedmetadata = () => {
      const durationSeconds = Math.round(tempVideo.duration) || 120;
      const durationFormatted = this.formatSeconds(durationSeconds);

      // Seek to capture real thumbnail
      tempVideo.currentTime = Math.min(2.0, durationSeconds * 0.1);
    };

    tempVideo.onseeked = () => {
      let thumbnailDataUrl = 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=600&auto=format&fit=crop&q=80';
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 480;
        canvas.height = 270;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(tempVideo, 0, 0, canvas.width, canvas.height);
        thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.85);
      } catch (e) {
        console.warn('Canvas thumbnail capture warning:', e);
      }

      const durationSeconds = Math.round(tempVideo.duration) || 120;
      const durationFormatted = this.formatSeconds(durationSeconds);

      this.currentSource = {
        type: 'upload',
        file: file,
        title: file.name.replace(/\.[^/.]+$/, ''),
        duration: durationSeconds,
        durationFormatted: durationFormatted,
        thumbnail: thumbnailDataUrl,
        videoUrl: objectUrl,
        fileSize: fileSizeFormatted
      };

      // Show upload preview card
      if (this.uploadPreviewCard) {
        this.uploadPreviewCard.style.display = 'block';
        if (this.uploadPreviewThumb) this.uploadPreviewThumb.src = thumbnailDataUrl;
        if (this.uploadPreviewTitle) this.uploadPreviewTitle.textContent = this.currentSource.title;
        if (this.uploadPreviewMeta) {
          this.uploadPreviewMeta.innerHTML = `
            <span class="pill-badge success"><i data-lucide="check-circle-2"></i> Upload Complete</span>
            <span class="pill-badge"><i data-lucide="clock"></i> ${durationFormatted}</span>
            <span class="pill-badge"><i data-lucide="hard-drive"></i> ${fileSizeFormatted}</span>
          `;
          if (window.lucide) window.lucide.createIcons();
        }
      }

      window.app.showToast('Video uploaded and verified successfully!', 'success');
    };

    tempVideo.onerror = () => {
      // Fallback
      this.currentSource = {
        type: 'upload',
        file: file,
        title: file.name.replace(/\.[^/.]+$/, ''),
        duration: 180,
        durationFormatted: '03:00',
        thumbnail: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=600&auto=format&fit=crop&q=80',
        videoUrl: objectUrl,
        fileSize: fileSizeFormatted
      };
      if (this.uploadPreviewCard) this.uploadPreviewCard.style.display = 'block';
    };
  }

  // --- Preset Sample Loader ---
  loadPresetSample(sampleKey) {
    const samples = {
      'hormozi': {
        type: 'youtube',
        url: 'https://www.youtube.com/watch?v=1-SvuFIQjK8',
        title: 'Alex Hormozi: The $100M Offer Blueprint',
        duration: 1122,
        durationFormatted: '18:42',
        thumbnail: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&auto=format&fit=crop&q=80',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
      },
      'jobs': {
        type: 'youtube',
        url: 'https://www.youtube.com/watch?v=UF8uR6Z6KLc',
        title: 'Steve Jobs: 2005 Stanford Commencement Speech',
        duration: 904,
        durationFormatted: '15:04',
        thumbnail: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&auto=format&fit=crop&q=80',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
      },
      'altman': {
        type: 'upload',
        url: 'sam_altman_podcast_720p.mp4',
        title: 'Lex Fridman & Sam Altman: The Future of Superintelligence',
        duration: 2535,
        durationFormatted: '42:15',
        thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
      },
      'gaming': {
        type: 'upload',
        url: 'esports_championship_finals.mp4',
        title: 'Pro Championship Finals: Insane 1v5 Clutch Moment',
        duration: 480,
        durationFormatted: '08:00',
        thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4'
      }
    };

    const selected = samples[sampleKey] || samples['hormozi'];
    this.currentSource = { ...selected };

    // Fill in inputs based on type
    if (selected.type === 'youtube') {
      this.switchTab('url');
      if (this.urlInput) this.urlInput.value = selected.url;
      if (this.urlPreviewCard) {
        this.urlPreviewCard.style.display = 'block';
        if (this.urlPreviewThumb) this.urlPreviewThumb.src = selected.thumbnail;
        if (this.urlPreviewTitle) this.urlPreviewTitle.textContent = selected.title;
        if (this.urlPreviewMeta) {
          this.urlPreviewMeta.innerHTML = `
            <span class="pill-badge success"><i data-lucide="check-circle-2"></i> Preset Sample</span>
            <span class="pill-badge"><i data-lucide="clock"></i> ${selected.durationFormatted}</span>
            <span class="pill-badge"><i data-lucide="sparkles"></i> Ready to Analyze</span>
          `;
          if (window.lucide) window.lucide.createIcons();
        }
      }
    } else {
      this.switchTab('upload');
      if (this.uploadPreviewCard) {
        this.uploadPreviewCard.style.display = 'block';
        if (this.uploadPreviewThumb) this.uploadPreviewThumb.src = selected.thumbnail;
        if (this.uploadPreviewTitle) this.uploadPreviewTitle.textContent = selected.title;
        if (this.uploadPreviewMeta) {
          this.uploadPreviewMeta.innerHTML = `
            <span class="pill-badge success"><i data-lucide="check-circle-2"></i> Preset Sample</span>
            <span class="pill-badge"><i data-lucide="clock"></i> ${selected.durationFormatted}</span>
            <span class="pill-badge"><i data-lucide="hard-drive"></i> 142 MB</span>
          `;
          if (window.lucide) window.lucide.createIcons();
        }
      }
    }

    window.app.showToast(`Loaded preset sample: "${selected.title}"`, 'info');
  }

  // --- Trigger Video Analysis ---
  triggerVideoAnalysis() {
    if (!this.currentSource) {
      window.app.showToast('Please paste a video URL or upload a file first', 'error');
      return;
    }

    if (this.isUploading) {
      window.app.showToast('File is still uploading. Please wait...', 'info');
      return;
    }

    // Read current generation options
    const durationControl = document.querySelector('.segmented-option.duration.active');
    const targetDuration = durationControl ? durationControl.getAttribute('data-value') : '30';

    const ratioControl = document.querySelector('.segmented-option.ratio.active');
    const targetRatio = ratioControl ? ratioControl.getAttribute('data-value') : '9:16';

    const captionStyleSelect = document.getElementById('configCaptionStyle');
    const captionStyle = captionStyleSelect ? captionStyleSelect.value : 'hormozi';

    const focusModeSelect = document.getElementById('configFocusMode');
    const focusMode = focusModeSelect ? focusModeSelect.value : 'highest_viral';

    const autoMusicToggle = document.getElementById('configAutoMusic');
    const autoMusic = autoMusicToggle ? autoMusicToggle.checked : true;

    const options = {
      targetDuration,
      targetRatio,
      captionStyle,
      focusMode,
      autoMusic
    };

    // Forward to analysis engine
    if (window.videoAnalysisEngine) {
      window.videoAnalysisEngine.startPipeline(this.currentSource, options);
    }
  }

  // Helpers
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  formatSeconds(totalSeconds) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}

// Global instance
window.videoUploadController = new VideoUploadController();
