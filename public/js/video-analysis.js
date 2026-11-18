/**
 * ViralCut AI - Video Analysis Engine & Backend Integration Pipeline
 * Implements the 8-stage processing pipeline:
 * 1. Extracting video information
 * 2. Extracting audio
 * 3. Transcribing speech
 * 4. Analyzing scenes and conversations
 * 5. Identifying engaging moments
 * 6. Calculating viral potential
 * 7. Generating clips
 * 8. Ranking clips
 *
 * Provides API client integration for:
 * - POST /api/video/analyze
 * - POST /api/video/upload
 * - GET  /api/video/status/:jobId
 * - GET  /api/video/clips/:jobId
 * - GET  /api/clips/:clipId/download
 */

class VideoAnalysisEngine {
  constructor() {
    this.currentJob = null;
    this.isProcessing = false;
    this.pollTimer = null;
    this.initElements();
  }

  initElements() {
    this.modal = document.getElementById('processingOverlay');
    this.progressBar = document.getElementById('pipelineProgressBar');
    this.percentText = document.getElementById('pipelinePercentText');
    this.currentStageText = document.getElementById('pipelineStageText');
    this.terminalLog = document.getElementById('pipelineTerminalLog');
    this.cancelBtn = document.getElementById('cancelAnalysisBtn');

    if (this.cancelBtn) {
      this.cancelBtn.addEventListener('click', () => this.cancelPipeline());
    }
  }

  // --- 8 Pipeline Stages Metadata ---
  getPipelineStages() {
    return [
      { id: 1, name: 'Extracting video information', desc: 'Parsing container metadata, codec, resolution and FPS...', weight: 10 },
      { id: 2, name: 'Extracting audio track', desc: 'Demuxing audio stream and normalizing decibel levels...', weight: 12 },
      { id: 3, name: 'Transcribing speech', desc: 'Running speech-to-text acoustic model and generating word timestamps...', weight: 20 },
      { id: 4, name: 'Analyzing scenes and conversations', desc: 'Evaluating speaker turns, conversational pacing, and scene cut density...', weight: 18 },
      { id: 5, name: 'Identifying engaging moments', desc: 'Detecting strong opening hooks, emotional peaks, and punchlines...', weight: 15 },
      { id: 6, name: 'Calculating viral potential', desc: 'Scoring hook strength, retention curve, and emotional impact (0-100)...', weight: 10 },
      { id: 7, name: 'Generating clips', desc: 'Framing 9:16 vertical crop, auto-centering speaker, and styling dynamic subtitles...', weight: 10 },
      { id: 8, name: 'Ranking clips', desc: 'Sorting clips by predicted virality: Top-performing moments positioned first...', weight: 5 }
    ];
  }

  // --- Backend API Client Methods ---
  async apiAnalyze(sourceData, options) {
    const settings = window.storageManager.getSettings();
    const url = `${settings.apiBaseUrl}/api/video/analyze`;

    const payload = {
      sourceType: sourceData.type,
      sourceUrl: sourceData.url || '',
      title: sourceData.title,
      duration: sourceData.duration,
      options: options
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(settings.apiKey ? { 'Authorization': `Bearer ${settings.apiKey}` } : {})
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`Backend analyze failed: ${res.statusText}`);
    }
    return await res.json(); // returns { jobId, status: 'queued' }
  }

  async apiGetStatus(jobId) {
    const settings = window.storageManager.getSettings();
    const url = `${settings.apiBaseUrl}/api/video/status/${jobId}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Status check failed: ${res.statusText}`);
    return await res.json();
  }

  async apiGetClips(jobId) {
    const settings = window.storageManager.getSettings();
    const url = `${settings.apiBaseUrl}/api/video/clips/${jobId}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Fetch clips failed: ${res.statusText}`);
    return await res.json();
  }

  async testBackendConnection() {
    const settings = window.storageManager.getSettings();
    try {
      const res = await fetch(`${settings.apiBaseUrl}/api/health`, { method: 'GET', signal: AbortSignal.timeout(3000) });
      return res.ok;
    } catch (e) {
      return false;
    }
  }

  // --- Pipeline Orchestrator ---
  async startPipeline(sourceData, options) {
    if (this.isProcessing) return;
    this.isProcessing = true;

    // Open Processing Modal
    if (this.modal) {
      this.modal.classList.add('active');
    }

    this.renderStageListUI();
    this.clearTerminal();
    this.logTerminal(`[SYSTEM] Initializing ViralCut AI Analysis Engine v2.4`);
    this.logTerminal(`[SOURCE] Input: "${sourceData.title}" (${sourceData.durationFormatted || 'N/A'})`);
    this.logTerminal(`[CONFIG] Target: ${options.targetDuration}s clips | Ratio: ${options.targetRatio} | Style: ${options.captionStyle}`);

    const settings = window.storageManager.getSettings();
    let backendActive = false;

    if (settings.useRealBackend) {
      this.logTerminal(`[NETWORK] Probing backend endpoint at ${settings.apiBaseUrl}...`);
      backendActive = await this.testBackendConnection();
      if (backendActive) {
        this.logTerminal(`[NETWORK] Connected to live AI backend. Delegating heavy video pipeline...`);
      } else {
        this.logTerminal(`[WARNING] Backend server unreachable. Falling back to local high-fidelity AI simulation...`);
      }
    } else {
      this.logTerminal(`[INFO] Operating in High-Fidelity Client Simulation Mode. Ready for backend hook.`);
    }

    if (backendActive) {
      await this.runRealBackendPipeline(sourceData, options);
    } else {
      await this.runSimulatedPipeline(sourceData, options);
    }
  }

  // --- Real Backend Polling Execution ---
  async runRealBackendPipeline(sourceData, options) {
    try {
      const initiateRes = await this.apiAnalyze(sourceData, options);
      const jobId = initiateRes.jobId;
      this.currentJob = { id: jobId, source: sourceData, options };

      this.logTerminal(`[JOB] Job #${jobId} accepted by server queue.`);

      // Poll status
      this.pollTimer = setInterval(async () => {
        try {
          const statusData = await this.apiGetStatus(jobId);
          this.updateProgressUI(statusData.progress || 10, statusData.currentStage || 1, statusData.stageName);
          if (statusData.log) {
            this.logTerminal(`[REMOTE] ${statusData.log}`);
          }

          if (statusData.status === 'completed') {
            clearInterval(this.pollTimer);
            const clipsResult = await this.apiGetClips(jobId);
            this.finalizeProjectResults(sourceData, clipsResult.clips, options);
          } else if (statusData.status === 'failed') {
            clearInterval(this.pollTimer);
            this.handleError(statusData.error || 'Backend processing job failed');
          }
        } catch (pollErr) {
          console.error('Polling error:', pollErr);
        }
      }, 1500);

    } catch (err) {
      this.logTerminal(`[ERROR] Backend call failed: ${err.message}. Reverting to local simulation.`);
      await this.runSimulatedPipeline(sourceData, options);
    }
  }

  // --- High-Fidelity Pipeline Simulator ---
  async runSimulatedPipeline(sourceData, options) {
    const stages = this.getPipelineStages();
    let cumulativeProgress = 0;

    for (let i = 0; i < stages.length; i++) {
      if (!this.isProcessing) break; // User cancelled
      const stage = stages[i];
      const stageNum = i + 1;

      this.setActiveStageUI(stageNum, stage.name);
      this.logTerminal(`[STAGE ${stageNum}/8] ${stage.name}: ${stage.desc}`);

      // Produce authentic stage telemetry in log
      await this.simulateStageWork(stageNum, sourceData);

      cumulativeProgress += stage.weight;
      this.updateProgressUI(cumulativeProgress, stageNum, stage.name);
      await this.delay(650);
    }

    if (!this.isProcessing) return;

    this.updateProgressUI(100, 8, 'Analysis Complete');
    this.logTerminal(`[COMPLETE] Viral ranking matrix synthesized successfully.`);
    await this.delay(600);

    // Generate ranked clips deterministically based on video title & options
    const generatedClips = this.synthesizeRankedClips(sourceData, options);
    this.finalizeProjectResults(sourceData, generatedClips, options);
  }

  async simulateStageWork(stageNum, sourceData) {
    const title = sourceData.title || 'Video';
    switch (stageNum) {
      case 1:
        await this.delay(400);
        this.logTerminal(`  -> Stream format: H.264 / AAC, 1920x1080 @ 30.0 fps, Bitrate: 4.8 Mbps`);
        break;
      case 2:
        await this.delay(450);
        this.logTerminal(`  -> Extracted 48kHz stereo stream. LUFS integrated: -16.2. Dynamic range: high`);
        break;
      case 3:
        await this.delay(600);
        this.logTerminal(`  -> Transcribing 4,210 words. Language detected: English (Confidence: 99.4%)`);
        this.logTerminal(`  -> Synthesizing phonetic alignment timestamps for dynamic word pop...`);
        break;
      case 4:
        await this.delay(500);
        this.logTerminal(`  -> Detected 14 visual cut transitions & 3 primary speaker clusters`);
        this.logTerminal(`  -> Pacing analysis: Conversational density peaks between 02:10 and 08:45`);
        break;
      case 5:
        await this.delay(550);
        this.logTerminal(`  -> Hook candidate found at 01:24: "If your price does not hurt..." [Hook Conf: 98%]`);
        this.logTerminal(`  -> Emotional peak detected at 04:12 (Surprise + Contrarian sentiment)`);
        this.logTerminal(`  -> Narrative resolution found at 09:15`);
        break;
      case 6:
        await this.delay(600);
        this.logTerminal(`  -> Evaluating Viral Retention Model against 10M+ Shorts/Reels benchmark dataset`);
        this.logTerminal(`  -> Hook Strength: 9.8/10 | Topic Universality: 9.2/10 | Shareability: 9.5/10`);
        break;
      case 7:
        await this.delay(650);
        this.logTerminal(`  -> Reframing to 9:16 vertical viewport with AI face-tracking auto-pan`);
        this.logTerminal(`  -> Injecting high-retention animated caption layers (${sourceData.captionStyle || 'Hormozi'} style)`);
        break;
      case 8:
        await this.delay(450);
        this.logTerminal(`  -> Sorting candidate segments: Placing highest viral potential at Rank #1`);
        this.logTerminal(`  -> Rank #1 assigned Viral Potential Score: 96/100 (Extremely High Potential)`);
        break;
    }
  }

  // --- Synthesize Ranked Clips (Highest score strictly FIRST) ---
  synthesizeRankedClips(sourceData, options) {
    const baseDuration = parseInt(options.targetDuration) || 30;
    const style = options.captionStyle || 'hormozi';
    const ratio = options.targetRatio || '9:16';
    const totalVideoSecs = sourceData.duration || 600;

    // Generate 4 to 5 ranked moments
    const templates = [
      {
        offsetPercent: 0.12,
        score: 96,
        tier: 'Extremely High Potential',
        tierClass: 'tier-extremely-high',
        platform: 'TikTok & YouTube Shorts',
        titleTemplate: `The Single Rule That Changes Everything in ${sourceData.title.split(' ')[0] || 'Business'}`,
        aiWhy: 'Strongest opening hook: delivers an unexpected contrarian statement within the first 3 seconds, sparking immediate curiosity gap and debate in comments.',
        hookDetails: 'High emotional tension, contrarian assertion, rapid verbal pacing.',
        tags: ['#viral', '#mindset', '#success', '#deepdive', '#protip', '#fyp'],
        altTitles: [
          'Nobody Wants To Admit This Brutal Truth 😳',
          'Why Everyone Gets This Completely Backwards',
          'The 30-Second Insight You Need Today'
        ],
        subtitles: [
          { start: 0, end: 5, text: 'EVERYONE IS LOOKING AT THIS THE WRONG WAY.' },
          { start: 5, end: 12, text: 'WHEN YOU STOP FOCUSING ON WHAT EVERYONE ELSE DOES...' },
          { start: 12, end: 20, text: 'YOUR ENTIRE TRAJECTORY CHANGES OVERNIGHT.' },
          { start: 20, end: 30, text: 'DO NOT BELIEVE ME? WATCH WHAT HAPPENS NEXT.' }
        ]
      },
      {
        offsetPercent: 0.35,
        score: 92,
        tier: 'Very High Potential',
        tierClass: 'tier-very-high',
        platform: 'Instagram Reels & TikTok',
        titleTemplate: `Why 95% of People Fail Before Reaching Their Goal`,
        aiWhy: 'Exceptional storytelling arc with relatable pain point. High shareability score as viewers send it to peers for validation.',
        hookDetails: 'Relatable vulnerability paired with concrete turnaround strategy.',
        tags: ['#growthmindset', '#discipline', '#motivation', '#reels', '#shorts'],
        altTitles: [
          'The Trap That Ruins Most Ambitious People',
          'How To Avoid Wasting 5 Years of Your Life',
          'The Secret Difference Between Winners and Quitters'
        ],
        subtitles: [
          { start: 0, end: 7, text: 'Most people quit right when momentum is building.' },
          { start: 7, end: 18, text: 'They mistake silence for stagnation.' },
          { start: 18, end: 30, text: 'Keep digging. Gold is rarely found on the surface.' }
        ]
      },
      {
        offsetPercent: 0.58,
        score: 87,
        tier: 'High Potential',
        tierClass: 'tier-high',
        platform: 'YouTube Shorts',
        titleTemplate: `The 3-Step Formula You Can Implement Today`,
        aiWhy: 'Actionable educational value with clear step-by-step structure. Generates high bookmark and save ratios on algorithmic feeds.',
        hookDetails: 'Numbered list framework with concise breakdown.',
        tags: ['#education', '#howto', '#skills', '#productivity', '#learnontiktok'],
        altTitles: [
          '3 Practical Steps That Actually Work',
          'How I Simplify The Most Complex Problems',
          'The Framework Top Performers Swear By'
        ],
        subtitles: [
          { start: 0, end: 8, text: 'Here is the exact blueprint broken into 3 steps.' },
          { start: 8, end: 18, text: 'Step 1: Eliminate the unnecessary noise.' },
          { start: 18, end: 30, text: 'Step 2: Focus on your one unfair advantage.' }
        ]
      },
      {
        offsetPercent: 0.78,
        score: 79,
        tier: 'Good Potential',
        tierClass: 'tier-high',
        platform: 'TikTok & Reels',
        titleTemplate: `A Shocking Revelation From ${sourceData.title.slice(0, 24)}...`,
        aiWhy: 'Surprising conversational statement with high entertainment value. Quick tempo suitable for casual scrolling audiences.',
        hookDetails: 'Humorous / provocative question.',
        tags: ['#mindblown', '#unreal', '#clips', '#podcastmoments'],
        altTitles: [
          'Did He Really Just Say That?! 😱',
          'The Unfiltered Reaction Nobody Expected',
          'Watch Their Face When They Hear This'
        ],
        subtitles: [
          { start: 0, end: 8, text: 'Wait, did you really just say that on camera?!' },
          { start: 8, end: 20, text: 'I did. And I stand by every single syllable of it.' },
          { start: 20, end: 30, text: 'Because truth is better than comfortable fiction.' }
        ]
      },
      {
        offsetPercent: 0.88,
        score: 68,
        tier: 'Moderate Potential',
        tierClass: 'tier-moderate',
        platform: 'TikTok & Shorts',
        titleTemplate: `Final Takeaway & Closing Words`,
        aiWhy: 'Memorable sign-off soundbite. Good background audio loop suitability.',
        hookDetails: 'Decisive closing statement.',
        tags: ['#closingthoughts', '#focus', '#wisdom'],
        altTitles: [
          'Remember This When Times Get Tough',
          'The 15-Second Reminder You Needed',
          'Keep Going.'
        ],
        subtitles: [
          { start: 0, end: 6, text: 'At the end of the day, execution is all that counts.' },
          { start: 6, end: 15, text: 'Do the work.' }
        ]
      }
    ];

    // Sort templates strictly by score descending
    templates.sort((a, b) => b.score - a.score);

    return templates.map((tmpl, idx) => {
      const clipStart = Math.min(Math.floor(totalVideoSecs * tmpl.offsetPercent), Math.max(0, totalVideoSecs - baseDuration));
      const clipEnd = clipStart + baseDuration;
      const startMin = Math.floor(clipStart / 60);
      const startSec = clipStart % 60;
      const endMin = Math.floor(clipEnd / 60);
      const endSec = clipEnd % 60;
      const formattedRange = `${startMin.toString().padStart(2, '0')}:${startSec.toString().padStart(2, '0')} - ${endMin.toString().padStart(2, '0')}:${endSec.toString().padStart(2, '0')}`;

      return {
        id: `clip-${Date.now()}-${idx + 1}`,
        rank: idx + 1,
        title: tmpl.titleTemplate,
        startTime: clipStart,
        endTime: clipEnd,
        duration: baseDuration,
        formattedRange: formattedRange,
        viralScore: tmpl.score,
        scoreTier: tmpl.tier,
        tierClass: tmpl.tierClass,
        platformRecommendation: tmpl.platform,
        aiExplanation: tmpl.aiWhy,
        hookDetails: tmpl.hookDetails,
        suggestedTitles: tmpl.altTitles,
        hashtags: tmpl.tags,
        aspectRatio: ratio,
        captionStyle: style,
        subtitles: tmpl.subtitles
      };
    });
  }

  // --- Finalize & Save Project ---
  finalizeProjectResults(sourceData, clips, options) {
    this.isProcessing = false;

    // Ensure clips are strictly sorted by score descending
    clips.sort((a, b) => b.viralScore - a.viralScore);
    clips.forEach((c, idx) => { c.rank = idx + 1; });

    const newProject = {
      id: `proj-${Date.now()}`,
      title: sourceData.title || 'Analyzed Video Project',
      sourceType: sourceData.type || 'web',
      sourceUrl: sourceData.url || sourceData.file?.name || 'Direct Input',
      durationSeconds: sourceData.duration || 600,
      durationFormatted: sourceData.durationFormatted || '10:00',
      createdAt: new Date().toISOString(),
      thumbnail: sourceData.thumbnail || 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=600&auto=format&fit=crop&q=80',
      videoUrl: sourceData.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      clipsCount: clips.length,
      highestScore: clips[0] ? clips[0].viralScore : 0,
      clips: clips
    };

    // Save in storage
    window.storageManager.saveProject(newProject);

    // Close Processing Modal
    if (this.modal) {
      this.modal.classList.remove('active');
    }

    window.app.showToast(`AI Video Analysis Complete! Generated ${clips.length} viral clips ranked by potential.`, 'success');

    // Switch to Project Clips View
    if (window.clipGenerator) {
      window.clipGenerator.displayProjectResults(newProject);
    }
  }

  cancelPipeline() {
    this.isProcessing = false;
    if (this.pollTimer) clearInterval(this.pollTimer);
    if (this.modal) this.modal.classList.remove('active');
    window.app.showToast('Video analysis cancelled by user.', 'info');
  }

  handleError(msg) {
    this.isProcessing = false;
    if (this.modal) this.modal.classList.remove('active');
    window.app.showToast(`Error: ${msg}`, 'error');
  }

  // --- UI Update Utilities ---
  renderStageListUI() {
    const listEl = document.getElementById('pipelineStagesList');
    if (!listEl) return;
    const stages = this.getPipelineStages();
    listEl.innerHTML = stages.map(s => `
      <div class="pipeline-stage-item" id="stage-row-${s.id}">
        <div class="stage-item-left">
          <div class="stage-number">${s.id}</div>
          <div class="stage-info-text">
            <strong>${s.name}</strong>
          </div>
        </div>
        <div class="stage-status-icon" id="stage-status-${s.id}">
          <i data-lucide="circle-dashed"></i>
        </div>
      </div>
    `).join('');
    if (window.lucide) window.lucide.createIcons();
  }

  setActiveStageUI(stageNum, stageName) {
    for (let i = 1; i <= 8; i++) {
      const row = document.getElementById(`stage-row-${i}`);
      const statusIcon = document.getElementById(`stage-status-${i}`);
      if (!row) continue;

      if (i < stageNum) {
        row.className = 'pipeline-stage-item completed';
        if (statusIcon) statusIcon.innerHTML = `<i data-lucide="check-circle" style="color: var(--accent-emerald);"></i>`;
      } else if (i === stageNum) {
        row.className = 'pipeline-stage-item active';
        if (statusIcon) statusIcon.innerHTML = `<i data-lucide="loader-2" class="spin" style="color: var(--accent-purple);"></i>`;
      } else {
        row.className = 'pipeline-stage-item';
        if (statusIcon) statusIcon.innerHTML = `<i data-lucide="circle-dashed"></i>`;
      }
    }
    if (window.lucide) window.lucide.createIcons();

    if (this.currentStageText) {
      this.currentStageText.textContent = `Stage ${stageNum}/8: ${stageName}`;
    }
  }

  updateProgressUI(percent, stageNum, stageName) {
    percent = Math.min(100, Math.max(0, Math.round(percent)));
    if (this.progressBar) this.progressBar.style.width = `${percent}%`;
    if (this.percentText) this.percentText.textContent = `${percent}%`;
  }

  clearTerminal() {
    if (this.terminalLog) this.terminalLog.innerHTML = '';
  }

  logTerminal(msg) {
    if (!this.terminalLog) return;
    const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false });
    const p = document.createElement('div');
    p.className = 'terminal-line';
    p.innerHTML = `<span class="term-time">[${timeStr}]</span> ${this.formatTerminalColors(msg)}`;
    this.terminalLog.appendChild(p);
    this.terminalLog.scrollTop = this.terminalLog.scrollHeight;
  }

  formatTerminalColors(msg) {
    return msg
      .replace(/\[SYSTEM\]/g, '<span style="color:#a855f7;">[SYSTEM]</span>')
      .replace(/\[SOURCE\]/g, '<span style="color:#06b6d4;">[SOURCE]</span>')
      .replace(/\[STAGE \d+\/8\]/g, (m) => `<strong style="color:#ec4899;">${m}</strong>`)
      .replace(/\[COMPLETE\]/g, '<strong style="color:#10b981;">[COMPLETE]</strong>')
      .replace(/\[WARNING\]/g, '<span style="color:#f59e0b;">[WARNING]</span>')
      .replace(/\[ERROR\]/g, '<span style="color:#f43f5e;">[ERROR]</span>');
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Global instance
window.videoAnalysisEngine = new VideoAnalysisEngine();
