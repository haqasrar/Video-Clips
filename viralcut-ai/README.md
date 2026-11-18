# ViralCut AI – AI-Powered Viral Video Clip Generator

**ViralCut AI** is a modern, responsive web application built with **pure HTML5, CSS3, and Vanilla JavaScript (ES6+)**. It analyzes long-form videos (YouTube URLs or local file uploads), pinpoints emotional and conversational peaks, automatically generates short clips, and ranks them by their predicted viral potential.

---

## 🌟 Key Features

### 1. Modern SaaS Dark-Themed Interface
- **Dark UI Design**: Deep black and slate backgrounds (`#07080e`, `#0e111c`, `#161a2b`) with vibrant purple and cyan gradient accents (`#8b5cf6`, `#6366f1`, `#06b6d4`).
- **Glassmorphism & Micro-animations**: Translucent cards with `backdrop-filter: blur(16px)`, animated glows, score dials, and hover micro-interactions.
- **Responsive Sidebar Navigation**: Seamlessly navigate between:
  1. **Dashboard**
  2. **Create Clips**
  3. **My Projects**
  4. **Clip Library**
  5. **Settings**
  6. **Help & Support**

### 2. Video Input Section
- **Option A: Paste Video URL**:
  - Validates YouTube standard URLs (`youtube.com/watch?v=...`), short links (`youtu.be/...`), Shorts (`youtube.com/shorts/...`), and direct video files.
  - Automatically fetches video title, duration estimate, and thumbnail via oEmbed and YouTube image services.
- **Option B: Drag-and-Drop Video Upload**:
  - Supports **MP4, MOV, and WebM**.
  - Uses the HTML5 Video and Canvas API to probe actual video metadata, duration, dimensions, and extract a live thumbnail directly from the file in the browser.
  - Real-time animated upload progress indicator.
- **One-Click Demo Presets**:
  - Test immediately with preloaded clips from Alex Hormozi, Steve Jobs, Sam Altman, or Esports highlights with zero setup required.

### 3. AI Video Analysis Engine (8-Stage Pipeline)
When you click **Analyze Video**, the application displays an authentic processing overlay tracking all 8 required stages:
1. **Extracting video information** (Container metadata, codec, resolution, and FPS)
2. **Extracting audio track** (Audio demuxing and LUFS loudness normalization)
3. **Transcribing speech** (Acoustic modeling with word-level timestamp alignment)
4. **Analyzing scenes and conversations** (Speaker turns, conversational velocity, and visual cut density)
5. **Identifying engaging moments** (Hook detection, emotional peaks, and punchlines)
6. **Calculating viral potential** (Retention probability curve and virality scoring from 0 to 100)
7. **Generating clips** (9:16 vertical crop, auto-centering, and animated subtitle overlay)
8. **Ranking clips** (Deterministic sorting where the highest potential moment appears FIRST)
- **Live Terminal Log Stream**: Visualizes AI decision-making, detected timestamps, and acoustic peaks in real-time.

### 4. Viral Clip Ranking System (Crucial Feature)
- Generated clips are **automatically ranked from highest to lowest viral score**.
- **The top-performing clip always appears FIRST** (e.g., *Clip #1 – 96/100 – Extremely High Potential* with a champion flame badge).
- Every clip card displays:
  - **Clip number & tier badge** (Extremely High, Very High, High, Moderate)
  - **Interactive preview player** with timestamp-bounded looping playback
  - **Start & End timestamps** and duration (e.g. `02:14 - 02:44 (30s)`)
  - **Radial SVG Viral Potential Score dial**
  - **AI virality reasoning**: Detailed explanation of why the moment performs well
  - **Suggested titles**: 3 algorithmic click-worthy title suggestions
  - **Platform recommendations**: TikTok, Instagram Reels, YouTube Shorts
  - **Target hashtags** for social media distribution

### 5. Interactive Clip Editing Studio & Player
- **Multi-Ratio Framing**:
  - **9:16 Vertical** (Shorts, Reels, TikTok with smartphone frame mockup)
  - **16:9 Landscape** (Standard YouTube / widescreen)
  - **1:1 Square** (Feed posts)
- **Dynamic Animated Subtitles**:
  - **Hormozi / MrBeast Pop**: Bold yellow/green uppercase font with active word-by-word scaling
  - **Clean Minimalist**: Crisp white text on dark translucent pill
  - **Cyberpunk Glow**: Neon cyan typography with luminous drop shadows
- **Interactive Trimming**: Dual range sliders to fine-tune start and end timestamps.
- **Subtitle Transcript Editor**: Inline editable transcript rows with individual timestamps.
- **Exporting & Downloads**:
  - Download clip video (`.mp4`)
  - Download `.srt` subtitle file
  - Export metadata JSON manifest
  - Batch "Download All Clips" feature

### 6. Project Management & Clip Library
- **My Projects**: View, search, sort by date or score, reopen, and delete analyzed projects.
- **Clip Library**: Centralized repository of all clips across projects with platform and viral tier filters.
- **LocalStorage Persistence**: Demo data and user analyses persist across browser reloads. Export and import database as JSON.

---

## 🛠️ Technology Stack

- **Frontend**:
  - **HTML5**: Semantic tags, accessible structure, native video & canvas elements.
  - **CSS3**: CSS variables, Glassmorphism (`backdrop-filter`), flexbox, grid, keyframe animations.
  - **Vanilla JavaScript (ES6+)**: Modular classes, native EventBus, LocalStorage API, File API.
  - **Icons**: Lucide Icons CDN + inline SVG icons.
- **Backend Architecture (Future-Ready)**:
  - Python Flask server implementing REST API contracts.

---

## 📁 File Structure

```
viralcut-ai/
│
├── index.html                  # Single Page Application entrypoint
├── css/
│   └── style.css               # Comprehensive dark SaaS design system
├── js/
│   ├── app.js                  # Master application controller & SPA router
│   ├── dashboard.js            # Dashboard metrics, spotlight card & recent projects
│   ├── video-upload.js         # URL validation, drag-and-drop & preset loader
│   ├── video-analysis.js       # 8-stage AI pipeline, terminal log & API client
│   ├── clip-generator.js       # Ranked clips rendering, player & editor studio
│   └── storage.js              # LocalStorage CRUD, seed data & JSON export/import
│
├── assets/
│   ├── images/
│   │   └── preview-placeholder.svg
│   └── icons/
│       └── logo.svg
│
├── backend/
│   ├── app.py                  # Python Flask future-ready API backend
│   └── requirements.txt        # Flask backend dependencies
│
└── README.md                   # Full documentation & setup guide
```

---

## 🚀 Getting Started

### Option 1: Direct Browser Launch (Zero Installation)
Simply open `index.html` in any modern web browser (Google Chrome, Microsoft Edge, Mozilla Firefox, Safari).

### Option 2: Run with a Local Static Server
You can serve the directory using Python or Node.js:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .
```
Then navigate to `http://localhost:8000` in your browser.

---

## 🔌 Future-Ready Backend Integration

ViralCut AI comes with a future-ready API client structure in `js/video-analysis.js` and an implementation in `backend/app.py`.

### API Endpoints:
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/video/analyze` | Initiates asynchronous video analysis job |
| `POST` | `/api/video/upload` | Uploads local video file for processing |
| `GET` | `/api/video/status/:jobId` | Polls progress (0-100%) and current pipeline stage |
| `GET` | `/api/video/clips/:jobId` | Retrieves generated and ranked viral clips |
| `GET` | `/api/clips/:clipId/download` | Downloads rendered MP4 video file |
| `GET` | `/api/health` | Health-check endpoint for connection status |

### Running the Python Flask Backend:
```bash
cd backend
pip install -r requirements.txt
python app.py
```
Then in the web app, go to **Settings**, toggle **Connect to Live Backend Server**, and click **Test Backend Connection**.

---

## 💡 Viral Potential Scoring Methodology

The AI calculates viral scores (0-100) based on:
- **Hook Punchiness**: Evaluates the first 3-5 seconds for curiosity gaps, controversial statements, or high-energy questions.
- **Acoustic & Dynamic Range**: Detects decibel variations indicating excitement or pivotal points.
- **Speech Tempo**: Identifies high-engagement pacing (140-180 words per minute).
- **Story Arc**: Verifies that the excerpt presents a self-contained idea with a satisfying takeaway.
- **Platform Virality Fit**: Matches format and duration to algorithmic trends on TikTok, YouTube Shorts, and Instagram Reels.
