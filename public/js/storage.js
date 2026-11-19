/**
 * ViralCut AI - Storage Module
 * LocalStorage management for Projects, Clips, User Preferences and Demo Seeding
 */

const STORAGE_KEYS = {
  PROJECTS: 'viralcut_projects',
  SETTINGS: 'viralcut_settings',
  ACTIVE_PROJECT: 'viralcut_active_project_id'
};

const DEFAULT_SETTINGS = {
  defaultDuration: '30',
  defaultAspectRatio: '9:16',
  captionStyle: 'hormozi',
  autoExportSRT: true,
  hookSensitivity: 'high',
  apiBaseUrl: 'http://localhost:5000',
  useRealBackend: false,
  apiKey: ''
};

// Seed sample projects with rich ranked clips
const SEED_PROJECTS = [
  {
    id: 'proj-hormozi-offer',
    title: 'Alex Hormozi: The $100M Offer Blueprint',
    sourceType: 'youtube',
    sourceUrl: 'https://www.youtube.com/watch?v=1-SvuFIQjK8',
    durationSeconds: 1122,
    durationFormatted: '18:42',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    thumbnail: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&auto=format&fit=crop&q=80',
    videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
    clipsCount: 5,
    highestScore: 96,
    clips: [
      {
        id: 'clip-hormozi-1',
        rank: 1,
        title: 'The Irresistible Offer Rule That Makes $1M',
        startTime: 134,
        endTime: 164,
        duration: 30,
        formattedRange: '02:14 - 02:44',
        viralScore: 96,
        scoreTier: 'Extremely High Potential',
        tierClass: 'tier-extremely-high',
        platformRecommendation: 'TikTok & Shorts',
        aiExplanation: 'Opens with a powerful contrarian hook: "If your price does not hurt your client a little, you are charging too little." Creates intense curiosity and high comment debate potential.',
        hookDetails: 'Contrarian financial thesis backed by immediate psychological validation.',
        suggestedTitles: [
          'The $10M Pricing Mistake Nobody Talks About 🤯',
          'Why You Should Double Your Prices Today',
          'How Rich People Actually Value Products'
        ],
        hashtags: ['#hormozi', '#business', '#entrepreneur', '#pricingstrategy', '#salesmindset', '#rich'],
        aspectRatio: '9:16',
        captionStyle: 'hormozi',
        subtitles: [
          { start: 0, end: 4, text: 'IF YOUR PRICE DOES NOT HURT' },
          { start: 4, end: 9, text: 'YOUR CLIENT A LITTLE BIT...' },
          { start: 9, end: 15, text: 'YOU ARE CHARGING TOO LITTLE.' },
          { start: 15, end: 22, text: 'VALUE IS PERCEIVED BEFORE IT IS PROVEN.' },
          { start: 22, end: 30, text: 'MAKE YOUR OFFER SO GOOD PEOPLE FEEL STUPID SAYING NO.' }
        ]
      },
      {
        id: 'clip-hormozi-2',
        rank: 2,
        title: 'Why 99% Of Startups Fail In Year One',
        startTime: 370,
        endTime: 415,
        duration: 45,
        formattedRange: '06:10 - 06:55',
        viralScore: 92,
        scoreTier: 'Very High Potential',
        tierClass: 'tier-very-high',
        platformRecommendation: 'Instagram Reels & Shorts',
        aiExplanation: 'High emotional relatability. Debunks common myths about venture funding and emphasizes cash-flow positivity with fast-paced delivery.',
        hookDetails: 'Starts with a direct question and statistical shock factor.',
        suggestedTitles: [
          'The Real Reason 99% of Startups Go Broke',
          'Stop Pitching Investors. Do This Instead.',
          'The Brutal Truth About Entrepreneurship'
        ],
        hashtags: ['#startuplife', '#businesstips', '#millionairemindset', '#growthhack', '#shorts'],
        aspectRatio: '9:16',
        captionStyle: 'hormozi',
        subtitles: [
          { start: 0, end: 8, text: 'PEOPLE ASK ME: WHY DO STARTUPS FAIL?' },
          { start: 8, end: 18, text: 'IT IS NOT LACK OF FUNDING.' },
          { start: 18, end: 30, text: 'THEY RUN OUT OF CASH BEFORE THEY FIND PRODUCT MARKET FIT.' },
          { start: 30, end: 45, text: 'IF YOU CANNOT SELL 1 PERSON MANUALLY, AUTOMATION WONT SAVE YOU.' }
        ]
      },
      {
        id: 'clip-hormozi-3',
        rank: 3,
        title: 'Pricing Psychology That 10x Your Conversions',
        startTime: 665,
        endTime: 695,
        duration: 30,
        formattedRange: '11:05 - 11:35',
        viralScore: 87,
        scoreTier: 'High Potential',
        tierClass: 'tier-high',
        platformRecommendation: 'TikTok & LinkedIn Video',
        aiExplanation: 'Actionable tactical takeaway. Clear step-by-step breakdown that drives saves and shares for future reference.',
        hookDetails: 'Fast visual demonstration of decoy pricing effect.',
        suggestedTitles: [
          'The 3-Tier Pricing Hack That Tripled Revenue',
          'How Apple Tricks You Into Spending More',
          'Psychological Pricing Secrets Revealed'
        ],
        hashtags: ['#marketingtips', '#pricing', '#ecommerce', '#businessgrowth'],
        aspectRatio: '9:16',
        captionStyle: 'clean',
        subtitles: [
          { start: 0, end: 6, text: 'Never give the customer one single price option.' },
          { start: 6, end: 16, text: 'Give them the good, the better, and the best.' },
          { start: 16, end: 30, text: '80% of your profits will come from the anchor tier.' }
        ]
      },
      {
        id: 'clip-hormozi-4',
        rank: 4,
        title: 'The Cold Outreach Framework That Never Fails',
        startTime: 860,
        endTime: 920,
        duration: 60,
        formattedRange: '14:20 - 15:20',
        viralScore: 79,
        scoreTier: 'Good Potential',
        tierClass: 'tier-high',
        platformRecommendation: 'YouTube Shorts',
        aiExplanation: 'In-depth breakdown of DM outreach scripting. Slightly longer duration but very high information density for motivated audiences.',
        hookDetails: 'Displays a live message screenshot comparison.',
        suggestedTitles: [
          'Send This Exact DM To Close 5-Figure Deals',
          'How To Network With Billionaires Without Being Weird',
          'The 3-Sentence Cold Email'
        ],
        hashtags: ['#sales', '#coldemail', '#networking', '#b2b'],
        aspectRatio: '9:16',
        captionStyle: 'clean',
        subtitles: [
          { start: 0, end: 12, text: 'Stop saying "Hey, can I pick your brain?"' },
          { start: 12, end: 30, text: 'Give value upfront without asking for anything in return.' },
          { start: 30, end: 60, text: 'Here is the exact 3-step outreach template.' }
        ]
      },
      {
        id: 'clip-hormozi-5',
        rank: 5,
        title: 'Action Beats Overthinking Every Single Time',
        startTime: 1050,
        endTime: 1065,
        duration: 15,
        formattedRange: '17:30 - 17:45',
        viralScore: 68,
        scoreTier: 'Moderate Potential',
        tierClass: 'tier-moderate',
        platformRecommendation: 'TikTok & Reels',
        aiExplanation: 'Short motivational soundbite. High replay rate, great for background audio trends.',
        hookDetails: 'High energy closing declaration.',
        suggestedTitles: [
          'The Antidote To Self-Doubt 🔥',
          'Stop Thinking. Start Doing.',
          '15 Seconds That Will Change Your Year'
        ],
        hashtags: ['#motivation', '#mindset', '#discipline', '#action'],
        aspectRatio: '9:16',
        captionStyle: 'cyber',
        subtitles: [
          { start: 0, end: 7, text: 'You do not have an information problem.' },
          { start: 7, end: 15, text: 'You have an execution problem. Get to work.' }
        ]
      }
    ]
  },
  {
    id: 'proj-steve-jobs',
    title: 'Steve Jobs: 2005 Stanford Commencement Speech',
    sourceType: 'youtube',
    sourceUrl: 'https://www.youtube.com/watch?v=UF8uR6Z6KLc',
    durationSeconds: 904,
    durationFormatted: '15:04',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    thumbnail: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&auto=format&fit=crop&q=80',
    videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
    clipsCount: 4,
    highestScore: 95,
    clips: [
      {
        id: 'clip-jobs-1',
        rank: 1,
        title: 'Stay Hungry, Stay Foolish - The Secret to Greatness',
        startTime: 820,
        endTime: 850,
        duration: 30,
        formattedRange: '13:40 - 14:10',
        viralScore: 95,
        scoreTier: 'Extremely High Potential',
        tierClass: 'tier-extremely-high',
        platformRecommendation: 'TikTok, Reels & Shorts',
        aiExplanation: 'Legendary historical quote. Timeless inspirational appeal with massive audience retention and emotional sentiment.',
        hookDetails: 'Climactic speech conclusion with profound philosophical resonance.',
        suggestedTitles: [
          'The 4 Words Steve Jobs Lived By',
          'Steve Jobs’ Most Famous Speech Ending',
          'Stay Hungry, Stay Foolish Explained'
        ],
        hashtags: ['#stevejobs', '#apple', '#inspiration', '#wisdom', '#successquote'],
        aspectRatio: '9:16',
        captionStyle: 'hormozi',
        subtitles: [
          { start: 0, end: 8, text: 'YOUR TIME IS LIMITED, SO DO NOT WASTE IT' },
          { start: 8, end: 16, text: 'LIVING SOMEONE ELSES LIFE.' },
          { start: 16, end: 24, text: 'HAVE THE COURAGE TO FOLLOW YOUR HEART.' },
          { start: 24, end: 30, text: 'STAY HUNGRY. STAY FOOLISH.' }
        ]
      },
      {
        id: 'clip-jobs-2',
        rank: 2,
        title: 'Connecting The Dots Looking Backward',
        startTime: 180,
        endTime: 225,
        duration: 45,
        formattedRange: '03:00 - 03:45',
        viralScore: 91,
        scoreTier: 'Very High Potential',
        tierClass: 'tier-very-high',
        platformRecommendation: 'Instagram Reels',
        aiExplanation: 'Powerful storytelling narrative about trusting the journey. Connects calligraphy classes to the invention of the Mac typography.',
        hookDetails: 'Vulnerable personal story of dropping out of college.',
        suggestedTitles: [
          'Why Your Struggles Today Will Make Sense Later',
          'You Can Only Connect The Dots Looking Backward',
          'Steve Jobs On Trusting Your Destiny'
        ],
        hashtags: ['#lifeadvice', '#destiny', '#trusttheprocess', '#stanford'],
        aspectRatio: '9:16',
        captionStyle: 'clean',
        subtitles: [
          { start: 0, end: 15, text: 'You cannot connect the dots looking forward.' },
          { start: 15, end: 30, text: 'You can only connect them looking backwards.' },
          { start: 30, end: 45, text: 'So you have to trust that the dots will somehow connect in your future.' }
        ]
      },
      {
        id: 'clip-jobs-3',
        rank: 3,
        title: 'Remembering You Are Going To Die',
        startTime: 490,
        endTime: 520,
        duration: 30,
        formattedRange: '08:10 - 08:40',
        viralScore: 84,
        scoreTier: 'High Potential',
        tierClass: 'tier-high',
        platformRecommendation: 'TikTok & Shorts',
        aiExplanation: 'Deep existential perspective on fear of failure and prioritization. High emotional resonance.',
        hookDetails: 'Direct mortality confrontation hook.',
        suggestedTitles: [
          'Steve Jobs: The Best Tool Against Fear of Failure',
          'Why Death Is The Best Invention Of Life',
          'Perspective Shift In 30 Seconds'
        ],
        hashtags: ['#stoicism', '#perspective', '#mindset', '#wisdom'],
        aspectRatio: '9:16',
        captionStyle: 'cyber',
        subtitles: [
          { start: 0, end: 10, text: 'Remembering that you are going to die' },
          { start: 10, end: 20, text: 'is the best way I know to avoid the trap' },
          { start: 20, end: 30, text: 'of thinking you have something to lose.' }
        ]
      },
      {
        id: 'clip-jobs-4',
        rank: 4,
        title: 'Finding What You Truly Love',
        startTime: 610,
        endTime: 655,
        duration: 45,
        formattedRange: '10:10 - 10:55',
        viralScore: 75,
        scoreTier: 'Good Potential',
        tierClass: 'tier-high',
        platformRecommendation: 'YouTube Shorts',
        aiExplanation: 'Career guidance for young professionals and career switchers.',
        hookDetails: 'Advice on loving your craft.',
        suggestedTitles: [
          'Never Settle: Steve Jobs Career Advice',
          'The Only Way To Do Great Work',
          'How To Know If You Love Your Job'
        ],
        hashtags: ['#careeradvice', '#passion', '#greatwork'],
        aspectRatio: '9:16',
        captionStyle: 'clean',
        subtitles: [
          { start: 0, end: 15, text: 'The only way to do great work is to love what you do.' },
          { start: 15, end: 30, text: 'If you have not found it yet, keep looking. Do not settle.' },
          { start: 30, end: 45, text: 'As with all matters of the heart, you will know when you find it.' }
        ]
      }
    ]
  },
  {
    id: 'proj-sam-altman',
    title: 'Lex Fridman & Sam Altman: The Future of Superintelligence',
    sourceType: 'upload',
    sourceUrl: 'sam_altman_podcast_720p.mp4',
    durationSeconds: 2535,
    durationFormatted: '42:15',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
    videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
    clipsCount: 3,
    highestScore: 94,
    clips: [
      {
        id: 'clip-altman-1',
        rank: 1,
        title: 'Will AI Replace Coding In 3 Years?',
        startTime: 480,
        endTime: 525,
        duration: 45,
        formattedRange: '08:00 - 08:45',
        viralScore: 94,
        scoreTier: 'Extremely High Potential',
        tierClass: 'tier-extremely-high',
        platformRecommendation: 'TikTok & Shorts',
        aiExplanation: 'Massive tech community interest. Provocative debate topic about the future of software engineers.',
        hookDetails: 'Direct question to the OpenAI CEO on software engineers obsolescence.',
        suggestedTitles: [
          'Sam Altman on Whether Programmers Are Obsolete 🤖',
          'Is Coding Dead? OpenAI CEO Answers',
          'What AI Will Do To Tech Jobs By 2027'
        ],
        hashtags: ['#samaltman', '#openai', '#chatgpt', '#artificialintelligence', '#techtrends'],
        aspectRatio: '9:16',
        captionStyle: 'cyber',
        subtitles: [
          { start: 0, end: 10, text: 'LEX: WILL AI WRITE 100% OF COMPUTER CODE?' },
          { start: 10, end: 22, text: 'SAM: MOST OF THE ROUTINE SYNTAX, YES.' },
          { start: 22, end: 35, text: 'BUT SYSTEM ARCHITECTURE AND PROBLEM DEFINITION' },
          { start: 35, end: 45, text: 'WILL BECOME EVEN MORE VALUABLE THAN EVER.' }
        ]
      },
      {
        id: 'clip-altman-2',
        rank: 2,
        title: 'The Hardest Problem In Artificial Superintelligence',
        startTime: 1120,
        endTime: 1150,
        duration: 30,
        formattedRange: '18:40 - 19:10',
        viralScore: 89,
        scoreTier: 'Very High Potential',
        tierClass: 'tier-very-high',
        platformRecommendation: 'Instagram Reels',
        aiExplanation: 'Fascinating alignment dilemma explained simply for general audiences.',
        hookDetails: 'Alignment problem breakdown.',
        suggestedTitles: [
          'The Real Danger of AI Nobody Talks About',
          'How Do We Control Something Smarter Than Us?',
          'Superintelligence Alignment Explained'
        ],
        hashtags: ['#agi', '#futureoftech', '#science', '#deeptech'],
        aspectRatio: '9:16',
        captionStyle: 'clean',
        subtitles: [
          { start: 0, end: 10, text: 'The hardest problem is not making it smarter.' },
          { start: 10, end: 20, text: 'The hardest problem is making sure it genuinely shares human values.' },
          { start: 20, end: 30, text: 'Because you do not get a second chance with superintelligence.' }
        ]
      },
      {
        id: 'clip-altman-3',
        rank: 3,
        title: 'What Keeps Silicon Valley Founders Awake At Night',
        startTime: 1840,
        endTime: 1885,
        duration: 45,
        formattedRange: '30:40 - 31:25',
        viralScore: 82,
        scoreTier: 'High Potential',
        tierClass: 'tier-high',
        platformRecommendation: 'TikTok & Shorts',
        aiExplanation: 'Behind the scenes glimpse into high stakes tech leadership.',
        hookDetails: 'Introspective candid confession.',
        suggestedTitles: [
          'Inside The Mind of OpenAI’s CEO',
          'The Weight of Building The Future',
          'How Leaders Handle Exponential Change'
        ],
        hashtags: ['#leadership', '#techfounder', '#siliconvalley', '#mindset'],
        aspectRatio: '9:16',
        captionStyle: 'hormozi',
        subtitles: [
          { start: 0, end: 15, text: 'WHEN THE PACE OF CHANGE DOUBLES EVERY 6 MONTHS...' },
          { start: 15, end: 30, text: 'YOU CANNOT RELY ON LAST DECADES PLAYBOOK.' },
          { start: 30, end: 45, text: 'YOU HAVE TO BE WILLING TO REINVENT YOURSELF CONTINUOUSLY.' }
        ]
      }
    ]
  }
];

class StorageManager {
  constructor() {
    this.init();
  }

  init() {
    const existing = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    if (!existing || existing.includes('proj-hormozi-offer')) {
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify([]));
    } else {
      try {
        const projects = JSON.parse(existing);
        let changed = false;
        projects.forEach(p => {
          if (!p.videoUrl || p.videoUrl.includes('commondatastorage.googleapis.com') || p.videoUrl.includes('BigBuckBunny')) {
            p.videoUrl = 'https://vjs.zencdn.net/v/oceans.mp4';
            changed = true;
          }
        });
        if (changed) {
          localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
        }
      } catch (e) {
        localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify([]));
      }
    }
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      this.saveSettings(DEFAULT_SETTINGS);
    }
  }

  // Projects CRUD
  getProjects() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      if (!data) return [];
      const projects = JSON.parse(data);
      // Auto-sanitize legacy broken Google Cloud Storage URLs
      let changed = false;
      projects.forEach(p => {
        if (!p.videoUrl || p.videoUrl.includes('commondatastorage.googleapis.com') || p.videoUrl.includes('BigBuckBunny')) {
          p.videoUrl = 'https://vjs.zencdn.net/v/oceans.mp4';
          changed = true;
        }
      });
      if (changed) {
        localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
      }
      return projects;
    } catch (e) {
      console.error('Error reading projects from storage:', e);
      return [];
    }
  }

  getProject(id) {
    const projects = this.getProjects();
    return projects.find(p => p.id === id) || null;
  }

  saveProject(project) {
    const projects = this.getProjects();
    const index = projects.findIndex(p => p.id === project.id);
    if (index >= 0) {
      projects[index] = project;
    } else {
      projects.unshift(project);
    }
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    return project;
  }

  deleteProject(id) {
    let projects = this.getProjects();
    projects = projects.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    return true;
  }

  // Clips Helpers
  getAllClips() {
    const projects = this.getProjects();
    const allClips = [];
    projects.forEach(project => {
      if (project.clips && Array.isArray(project.clips)) {
        project.clips.forEach(clip => {
          allClips.push({
            ...clip,
            projectTitle: project.title,
            projectId: project.id,
            sourceThumbnail: project.thumbnail,
            videoSource: project.videoUrl
          });
        });
      }
    });
    // Sort all clips by viralScore descending
    return allClips.sort((a, b) => b.viralScore - a.viralScore);
  }

  getClip(clipId) {
    const projects = this.getProjects();
    for (const project of projects) {
      if (project.clips) {
        const found = project.clips.find(c => c.id === clipId);
        if (found) {
          return { ...found, project };
        }
      }
    }
    return null;
  }

  updateClip(projectId, clipId, updatedData) {
    const project = this.getProject(projectId);
    if (!project || !project.clips) return null;

    const clipIndex = project.clips.findIndex(c => c.id === clipId);
    if (clipIndex === -1) return null;

    project.clips[clipIndex] = {
      ...project.clips[clipIndex],
      ...updatedData
    };

    // Re-sort clips by viralScore descending if score was modified
    project.clips.sort((a, b) => b.viralScore - a.viralScore);
    // Re-assign ranks
    project.clips.forEach((clip, idx) => {
      clip.rank = idx + 1;
    });
    project.highestScore = project.clips[0] ? project.clips[0].viralScore : 0;

    this.saveProject(project);
    return project.clips[clipIndex];
  }

  // Settings
  getSettings() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  }

  saveSettings(newSettings) {
    const current = this.getSettings();
    const merged = { ...current, ...newSettings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(merged));
    return merged;
  }

  // Demo Reset & Export/Import
  resetToDemoData() {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(SEED_PROJECTS));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    return SEED_PROJECTS;
  }

  exportJSON() {
    const payload = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      projects: this.getProjects(),
      settings: this.getSettings()
    };
    return JSON.stringify(payload, null, 2);
  }

  importJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.projects && Array.isArray(parsed.projects)) {
        localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(parsed.projects));
      }
      if (parsed.settings) {
        this.saveSettings(parsed.settings);
      }
      return true;
    } catch (e) {
      console.error('Failed to import data:', e);
      return false;
    }
  }
}

// Global instance
window.storageManager = new StorageManager();
