/**
 * Çift Yönlü Çengel Bulmaca Motoru (Karışık TR ➔ EN ve EN ➔ TR)
 * - Çoklu Konu / Veri Havuzu Yönetimi + Kolay İçe/Dışa Aktarım (Import / Export)
 * - Ses Efektleri Motoru (.wav + Web Audio API Sentezleyici)
 * - Masaüstünde Sağda Tek Sıra Kelime Listesi & Solda Her Zaman Kare (1:1) Izgara
 */

const MULTI_POOLS_KEY = 'cengel_bulmaca_multi_pools_v5';
const LEGACY_STORAGE_KEY = 'cengel_bulmaca_pdf_pool_v2';
const WELCOME_HIDE_KEY = 'cengel_bulmaca_hide_welcome_v1';
const SOUND_ENABLED_KEY = 'cengel_bulmaca_sound_enabled_v1';
const MUSIC_ENABLED_KEY = 'cengel_bulmaca_music_enabled_v1';

class SoundEffectsEngine {
  constructor() {
    this.enabled = true;
    this.musicEnabled = true;
    this.audioCtx = null;
    this.wavFiles = {};
    this.musicTracks = {};
    this.currentMusicScreen = 'HOME';
    this.shouldPlayFocusMusic = false;
    this.isAppInBackground = false;
    this.wasPlayingBeforeBackground = false;
    this.loadPreference();
    this.preloadWavFiles();
    this.initFocusMusicUnlock();
  }

  loadPreference() {
    try {
      const savedSound = localStorage.getItem(SOUND_ENABLED_KEY);
      if (savedSound !== null) {
        this.enabled = savedSound === 'true';
      }
      const savedMusic = localStorage.getItem(MUSIC_ENABLED_KEY);
      if (savedMusic !== null) {
        this.musicEnabled = savedMusic === 'true';
      }
    } catch (_) {}
  }

  setEnabled(val) {
    this.enabled = Boolean(val);
    try {
      localStorage.setItem(SOUND_ENABLED_KEY, String(this.enabled));
    } catch (_) {}
  }

  setMusicEnabled(val) {
    this.musicEnabled = Boolean(val);
    try {
      localStorage.setItem(MUSIC_ENABLED_KEY, String(this.musicEnabled));
    } catch (_) {}
    if (!this.musicEnabled) {
      this.pauseAllMusicTracks();
    } else if (this.shouldPlayFocusMusic) {
      this.playMusicForScreen(this.currentMusicScreen);
    }
  }

  preloadWavFiles() {
    const names = ['type', 'delete', 'hint', 'success', 'error', 'victory'];
    names.forEach(name => {
      try {
        const audio = new Audio(`sounds/${name}.wav`);
        audio.preload = 'auto';
        this.wavFiles[name] = audio;
      } catch (_) {}
    });

    const musicMap = {
      HOME: 'sounds/Intro_2.mp3',
      KELIMELIK: 'sounds/Cantorum.mp3',
      CROSSWORD: 'sounds/Idea_10.mp3',
      QUIZ: 'sounds/ICARUS.mp3',
      MATCH: 'sounds/Ascension.mp3',
      SCRAMBLE: 'sounds/Starry_Night.mp3'
    };

    Object.entries(musicMap).forEach(([screenKey, src]) => {
      try {
        const audio = new Audio(src);
        audio.loop = true;
        audio.volume = 0.35;
        audio.preload = 'auto';
        this.musicTracks[screenKey] = audio;
      } catch (_) {}
    });
  }

  initFocusMusicUnlock() {
    const tryResumeFocus = () => {
      if (this.shouldPlayFocusMusic && this.musicEnabled && !this.isAppInBackground) {
        const activeAudio = this.musicTracks[this.currentMusicScreen];
        if (activeAudio && activeAudio.paused) {
          activeAudio.play().catch(() => {});
        }
      }
    };
    document.addEventListener('pointerdown', tryResumeFocus, { passive: true });
    document.addEventListener('keydown', tryResumeFocus, { passive: true });

    // Mobil ve masaüstünde ekran kilitlendiğinde, simge durumuna küçültüldüğünde veya arka plana atıldığında müziği durdur/devam ettir
    const onAppBackground = () => {
      this.pauseMusicForAppBackground();
    };

    const onAppForeground = () => {
      this.resumeMusicForAppForeground();
    };

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        onAppBackground();
      } else {
        onAppForeground();
      }
    });

    window.addEventListener('pagehide', onAppBackground);
    window.addEventListener('pageshow', onAppForeground);
    window.addEventListener('blur', () => {
      if (document.hidden) onAppBackground();
    });
    window.addEventListener('focus', onAppForeground);

    // Cordova / Android WebView lifecycle olayları
    document.addEventListener('pause', onAppBackground, false);
    document.addEventListener('resume', onAppForeground, false);
  }

  pauseMusicForAppBackground() {
    this.isAppInBackground = true;
    const currentAudio = this.musicTracks[this.currentMusicScreen];
    if (currentAudio && !currentAudio.paused) {
      this.wasPlayingBeforeBackground = true;
      try {
        currentAudio.pause();
      } catch (_) {}
    } else {
      this.wasPlayingBeforeBackground = false;
    }
  }

  resumeMusicForAppForeground() {
    this.isAppInBackground = false;
    if (this.currentMusicScreen === 'CHATBOT') return;
    if (this.wasPlayingBeforeBackground && this.musicEnabled && this.shouldPlayFocusMusic) {
      const currentAudio = this.musicTracks[this.currentMusicScreen];
      if (currentAudio && currentAudio.paused) {
        currentAudio.play().catch(() => {});
      }
    }
    this.wasPlayingBeforeBackground = false;
  }

  playMusicForScreen(screenKey = 'HOME') {
    this.currentMusicScreen = screenKey || 'HOME';
    if (this.currentMusicScreen === 'CHATBOT') {
      this.pauseAllMusicTracks();
      return;
    }
    this.shouldPlayFocusMusic = true;
    Object.entries(this.musicTracks).forEach(([key, audio]) => {
      if (!audio) return;
      if (key !== this.currentMusicScreen) {
        try {
          audio.pause();
          audio.currentTime = 0;
        } catch (_) {}
      }
    });
    if (!this.musicEnabled) return;
    const targetAudio = this.musicTracks[this.currentMusicScreen];
    if (targetAudio) {
      try {
        if (targetAudio.paused) {
          targetAudio.play().catch(() => {});
        }
      } catch (_) {}
    }
  }

  startFocusMusic() {
    this.playMusicForScreen(this.currentMusicScreen || 'HOME');
  }

  stopFocusMusic() {
    this.shouldPlayFocusMusic = false;
    this.pauseAllMusicTracks();
  }

  pauseAllMusicTracks() {
    Object.values(this.musicTracks).forEach(audio => {
      if (!audio) return;
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch (_) {}
    });
  }

  getAudioContext() {
    if (!this.audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) {
        this.audioCtx = new Ctx();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  playWavOrSynth(name, synthFallbackFn) {
    if (!this.enabled) return;
    const ctx = this.getAudioContext();
    if (ctx && synthFallbackFn) {
      try {
        synthFallbackFn(ctx);
        return;
      } catch (_) {}
    }
    const baseAudio = this.wavFiles[name];
    if (baseAudio) {
      try {
        const clone = baseAudio.cloneNode();
        clone.volume = 0.55;
        clone.play().catch(() => {});
      } catch (_) {}
    }
  }

  playTone(ctx, freq, startOffset, duration, volume = 0.22, type = 'sine') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + startOffset);

    const startTime = ctx.currentTime + startOffset;
    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0008, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.01);
  }

  playType() {
    this.playWavOrSynth('type', (ctx) => {
      this.playTone(ctx, 587.33, 0, 0.065, 0.20, 'triangle');
      this.playTone(ctx, 1174.66, 0, 0.045, 0.07, 'sine');
    });
  }

  playDelete() {
    this.playWavOrSynth('delete', (ctx) => {
      this.playTone(ctx, 349.23, 0, 0.07, 0.20, 'triangle');
    });
  }

  playHint() {
    this.playWavOrSynth('hint', (ctx) => {
      this.playTone(ctx, 880.0, 0, 0.08, 0.22, 'sine');
      this.playTone(ctx, 1174.66, 0.065, 0.14, 0.25, 'sine');
    });
  }

  playSuccess() {
    this.playWavOrSynth('success', (ctx) => {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((f, i) => {
        this.playTone(ctx, f, i * 0.07, i === 3 ? 0.24 : 0.09, 0.25, 'triangle');
      });
    });
  }

  playError() {
    this.playWavOrSynth('error', (ctx) => {
      this.playTone(ctx, 311.13, 0, 0.12, 0.24, 'sawtooth');
      this.playTone(ctx, 233.08, 0.11, 0.24, 0.26, 'sawtooth');
    });
  }

  playVictory() {
    this.playWavOrSynth('victory', (ctx) => {
      const seq = [
        [523.25, 0.00, 0.10],
        [659.25, 0.09, 0.10],
        [783.99, 0.18, 0.10],
        [1046.50, 0.27, 0.18],
        [783.99, 0.43, 0.09],
        [1046.50, 0.52, 0.36]
      ];
      seq.forEach(([f, start, dur]) => {
        this.playTone(ctx, f, start, dur, 0.28, 'triangle');
      });
    });
  }
}

class CengelCrosswordApp {
  constructor() {
    this.sfx = new SoundEffectsEngine();
    this.poolState = this.loadMultiPoolState();
    this.currentScreen = 'HOME'; // 'HOME' | 'CROSSWORD' | 'QUIZ' | 'MATCH' | 'SCRAMBLE'
    this.gridSize = 16;
    this.gameMode = 'MIXED'; // 'TR_TO_EN' | 'EN_TO_TR' | 'MIXED'
    this.zoomScale = 1.0;
    this.grid = [];
    this.placedWords = [];
    this.activeWordId = null;
    this.focusedCell = null; // { r, c }
    this.selectedIndices = new Set();
    this.isCheckingAnimation = false;
    this.poolNameEditorMode = null; // 'NEW' | 'RENAME' | 'IMPORT_NEW'
    this.pendingImportWords = null;
    this.celebrationAnimId = null;
    this.streakBannerTimer = null;

    // Ek Oyun Durumları (Ortak Veri Tabanını Kullanır)
    this.quizState = {
      mode: 'MIXED',
      targetCount: 10,
      remaining: 10,
      correct: 0,
      total: 0,
      streak: 0,
      questionQueue: [],
      currentAnswer: null,
      locked: false
    };
    this.matchState = {
      pairCount: 6,
      cards: [],
      selectedCard: null,
      matchedPairs: 0,
      totalPairs: 6,
      moves: 0,
      locked: false
    };
    this.scrambleState = {
      mode: 'MIXED',
      targetCount: 10,
      remaining: 10,
      solved: 0,
      wordQueue: [],
      targetAnswer: '',
      slots: [],
      tiles: [],
      locked: false
    };
    this.kelimelikState = {
      gridSize: 11,
      mode: 'MIXED',
      grid: [],
      focusedCell: null,
      direction: 'H',
      rack: [],
      score: 0,
      solvedCount: 0,
      targetWords: 10,
      solvedHistory: [],
      hintsUsed: 0,
      hintCycleIdx: 0,
      currentTurnUsedHint: false,
      streak: 0,
      victoryShown: false,
      isCheckingAnimation: false,
      hintPopupTimer: null,
      hintCountdownInterval: null,
      timerTotalSeconds: 10 * 60,
      timerRemainingSeconds: 10 * 60,
      timerInterval: null
    };

    this.crosswordScore = 0;
    this.gameLeaderboards = this.loadLeaderboards();

    this.cacheDOM();
    this.bindEvents();
    this.syncSoundButtonUI();
    this.renderPoolSelectors();
    this.updatePoolCounters();
    this.generateNewPuzzle();
    // İlk açılış pop-up bilgilendirme kaldırıldı; her oyunun bilgilendirme sayfası o oyuna girince açılır.
    this.sfx.playMusicForScreen('HOME');
  }

  get wordPool() {
    const active = this.getActivePoolObject();
    return active ? active.words : [];
  }

  set wordPool(newWords) {
    const active = this.getActivePoolObject();
    if (active) {
      active.words = newWords;
    }
  }

  getActivePoolObject() {
    let found = this.poolState.pools.find(p => p.id === this.poolState.activePoolId);
    if (!found && this.poolState.pools.length > 0) {
      found = this.poolState.pools[0];
      this.poolState.activePoolId = found.id;
    }
    return found;
  }

  buildDefaultPoolSets() {
    const all = JSON.parse(JSON.stringify(DEFAULT_WORDS));
    const sliceByTr = (startTr, endTr) => {
      const s = all.findIndex(w => w.tr === startTr);
      const e = s !== -1 ? all.findIndex((w, idx) => idx >= s && w.tr === endTr) : -1;
      if (s !== -1 && e !== -1 && e >= s) {
        return JSON.parse(JSON.stringify(all.slice(s, e + 1)));
      }
      return [];
    };

    const pools = [
      { id: 'pool_all', name: '🌟 Tüm Kelimeler (Genel Havuz)', words: all },
      { id: 'pool_animals', name: '🐾 Hayvanlar Dünyası', words: sliceByTr('Köpek', 'Uğurböceği') },
      { id: 'pool_fruits', name: '🍎 Meyve ve Sebzeler', words: sliceByTr('Elma', 'Brüksel Lahanası') },
      { id: 'pool_countries', name: '🌍 Ülkeler ve Milletler', words: sliceByTr('Arnavutluk', 'Zimbabveli') },
      { id: 'pool_jobs', name: '💼 Meslekler', words: sliceByTr('Muhasebeci', 'Hayvanat Bahçesi Görevlisi') },
      { id: 'pool_verbs', name: '🏃 Fiiller (Eylemler)', words: sliceByTr('Olmak', 'Kurmak') },
      { id: 'pool_colors', name: '🎨 Renkler', words: sliceByTr('Beyaz', 'Açık') },
      { id: 'pool_family', name: '👨‍👩‍👧‍👦 Aile', words: sliceByTr('Anne', 'Boşanmış') },
      { id: 'pool_body', name: '🧠 Vücudumuz', words: sliceByTr('Baş', 'Kalp') },
      { id: 'pool_days', name: '📅 Günler', words: sliceByTr('Pazartesi', 'Pazar') },
      { id: 'pool_time', name: '⏳ Zaman', words: sliceByTr('Ocak', 'Sonbahar') },
      { id: 'pool_numbers', name: '🔢 Sayılar', words: sliceByTr('Bir', 'Yüz') },
      { id: 'pool_plurals', name: '📦 Çoğul Kelimeler (Plurals)', words: sliceByTr('Kitaplar', 'Çocuklar') },
      { id: 'pool_adverbs', name: '⏱️ Sıklık Zarfları (Adverbs)', words: sliceByTr('Her zaman', 'Neredeyse hiç') },
      { id: 'pool_questions', name: '❓ Soru Kelimeleri (Questions)', words: sliceByTr('Hangi', 'Ne') }
    ].filter(p => p.words && p.words.length > 0);

    return {
      activePoolId: 'pool_all',
      selectedPoolIds: ['pool_all'],
      pools
    };
  }

  syncAllWordsPool(stateObj = this.poolState) {
    if (!stateObj || !Array.isArray(stateObj.pools)) return;
    const allPool = stateObj.pools.find(p => p.id === 'pool_all');
    if (!allPool) return;

    const seen = new Set();
    const aggregated = [];
    stateObj.pools.forEach(pool => {
      if (pool.id === 'pool_all') return;
      (pool.words || []).forEach(w => {
        if (!w || !w.tr || !w.en) return;
        const key = `${this.toTurkishUpper(w.tr)}|${this.toEnglishUpper(w.en)}`;
        if (!seen.has(key)) {
          seen.add(key);
          aggregated.push({ tr: w.tr, en: w.en });
        }
      });
    });
    allPool.words = aggregated;
  }

  loadMultiPoolState() {
    try {
      const raw = localStorage.getItem(MULTI_POOLS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.pools) && parsed.pools.length > 0) {
          if (!Array.isArray(parsed.selectedPoolIds) || parsed.selectedPoolIds.length === 0) {
            parsed.selectedPoolIds = [parsed.activePoolId || parsed.pools[0].id];
          } else {
            parsed.selectedPoolIds = parsed.selectedPoolIds.filter(id => parsed.pools.some(p => p.id === id));
            if (parsed.selectedPoolIds.length === 0) {
              parsed.selectedPoolIds = [parsed.pools[0].id];
            }
          }
          // Yeni eklenen varsayılan havuzları mevcut kullanıcı oturumuna aktar (kullanıcı tümünü silmediyse ve aynı isimde havuz yoksa)
          if (!parsed.userClearedAll) {
            const defaults = this.buildDefaultPoolSets();
            defaults.pools.forEach(defPool => {
              if (defPool.id === 'pool_all') return;
              const existing = parsed.pools.find(
                p => p.id === defPool.id || p.name.trim().toLowerCase() === defPool.name.trim().toLowerCase()
              );
              if (!existing) {
                parsed.pools.push(defPool);
              }
            });
          }
          this.syncAllWordsPool(parsed);
          return parsed;
        }
      }
      const defaults = this.buildDefaultPoolSets();
      this.syncAllWordsPool(defaults);
      return defaults;
    } catch (err) {
      console.warn('Çoklu havuz okunamadı, varsayılan setler yükleniyor:', err);
      const defaults = this.buildDefaultPoolSets();
      this.syncAllWordsPool(defaults);
      return defaults;
    }
  }

  getCombinedSelectedWords() {
    const selectedIds = Array.isArray(this.poolState.selectedPoolIds) && this.poolState.selectedPoolIds.length > 0
      ? this.poolState.selectedPoolIds
      : [this.poolState.activePoolId];

    const seen = new Set();
    const combined = [];

    this.poolState.pools.forEach(pool => {
      if (!selectedIds.includes(pool.id)) return;
      (pool.words || []).forEach(w => {
        if (!w || !w.tr || !w.en) return;
        const key = `${this.toTurkishUpper(w.tr)}|${this.toEnglishUpper(w.en)}`;
        if (!seen.has(key)) {
          seen.add(key);
          combined.push(w);
        }
      });
    });

    return combined;
  }

  saveWordPool() {
    this.syncAllWordsPool(this.poolState);
    try {
      localStorage.setItem(MULTI_POOLS_KEY, JSON.stringify(this.poolState));
    } catch (err) {
      console.warn('LocalStorage kaydedilemedi:', err);
    }
    this.renderPoolSelectors();
    this.updatePoolCounters();
    this.updateExportPreview();
  }

  cacheDOM() {
    this.homeView = document.getElementById('homeView');
    this.kelimelikView = document.getElementById('kelimelikView');
    this.crosswordView = document.getElementById('crosswordView');
    this.quizView = document.getElementById('quizView');
    this.matchView = document.getElementById('matchView');
    this.scrambleView = document.getElementById('scrambleView');
    this.chatbotView = document.getElementById('chatbotView');
    this.chatMessagesArea = document.getElementById('chatMessagesArea');
    this.chatThread = document.getElementById('chatThread');
    this.chatTypingIndicator = document.getElementById('chatTypingIndicator');
    this.chatSuggestionsBar = document.getElementById('chatSuggestionsBar');
    this.chatMessageForm = document.getElementById('chatMessageForm');
    this.chatInputText = document.getElementById('chatInputText');
    this.chatLevelSelect = document.getElementById('chatLevelSelect');
    this.chatProfileStatus = document.getElementById('chatProfileStatus');
    this.chatLevelDisplay = document.getElementById('chatLevelDisplay');
    this.btnChatClear = document.getElementById('btnChatClear');
    this.btnChatGoHome = document.getElementById('btnChatGoHome');
    this.btnChatHintPrompt = document.getElementById('btnChatHintPrompt');
    this.btnChatSpeakLast = document.getElementById('btnChatSpeakLast');
    this.btnChatWordHelp = document.getElementById('btnChatWordHelp');

    if (typeof EmmaChatbotEngine !== 'undefined') {
      this.chatbotEngine = new EmmaChatbotEngine(this);
    }

    this.kelimelikGridEl = document.getElementById('kelimelikGrid');
    this.kelimelikGridScrollContainer = document.getElementById('kelimelikGridScrollContainer') || document.querySelector('#kelimelikView .grid-scroll-container');
    this.kelimelikRackTilesEl = document.getElementById('kelimelikRackTiles');
    this.kelimelikStatScoreEl = document.getElementById('kelimelikStatScore');
    this.kelimelikStatSolvedEl = document.getElementById('kelimelikStatSolved');
    this.kelimelikStatPoolEl = document.getElementById('kelimelikStatPool');
    this.kelimelikBannerCardEl = document.getElementById('kelimelikActiveClueBanner');
    this.kelimelikActiveClueDirEl = document.getElementById('kelimelikActiveClueDir');
    this.kelimelikActiveClueTextEl = document.getElementById('kelimelikActiveClueText');
    this.kelimelikActiveClueLenEl = document.getElementById('kelimelikActiveClueLen');
    this.btnKelimelikSubmitWord = document.getElementById('btnKelimelikSubmitWord');
    this.kelimelikHintPopup = document.getElementById('kelimelikHintPopup');
    this.kelimelikHintWordTiles = document.getElementById('kelimelikHintWordTiles');
    this.kelimelikHintMeaning = document.getElementById('kelimelikHintMeaning');
    this.kelimelikHintCountdownText = document.getElementById('kelimelikHintCountdownText');
    this.kelimelikHintProgressBar = document.getElementById('kelimelikHintProgressBar');

    this.celebrationCanvas = document.getElementById('celebrationCanvas');
    this.appFloatingToast = document.getElementById('appFloatingToast');
    this.streakMotivationBanner = document.getElementById('streakMotivationBanner');
    this.streakBannerIcon = document.getElementById('streakBannerIcon');
    this.streakBannerTitle = document.getElementById('streakBannerTitle');
    this.streakBannerSub = document.getElementById('streakBannerSub');

    this.homeTotalPoolsCount = document.getElementById('homeTotalPoolsCount');
    this.homeActiveWordsCount = document.getElementById('homeActiveWordsCount');
    this.homeActiveTopicPill = document.getElementById('homeActiveTopicPill');
    this.musicStatusBadge = document.getElementById('musicStatusBadge');

    this.gridEl = document.getElementById('crosswordGrid');
    this.gridScrollContainer = document.getElementById('crosswordGridScrollContainer') || document.querySelector('#crosswordView .grid-scroll-container');
    this.gridSizeSelect = document.getElementById('gridSizeSelect');
    this.modalPoolSelect = document.getElementById('modalPoolSelect');
    this.gameModeSelector = document.getElementById('gameModeSelector');
    this.statSolvedEl = document.getElementById('statSolved');
    this.statPoolCountEl = document.getElementById('statPoolCount');
    this.poolBadgeEl = document.getElementById('poolBadge');

    this.confirmModal = document.getElementById('confirmModal');
    this.confirmTitle = document.getElementById('confirmTitle');
    this.confirmMessage = document.getElementById('confirmMessage');
    this.btnConfirmYes = document.getElementById('btnConfirmYes');
    this.btnConfirmCancel = document.getElementById('btnConfirmCancel');
    this.pendingConfirmAction = null;

    this.warningModal = document.getElementById('warningModal');
    this.warningTitle = document.getElementById('warningTitle');
    this.warningMessage = document.getElementById('warningMessage');
    this.btnWarningOk = document.getElementById('btnWarningOk');
    this.pendingWarningCallback = null;

    this.grandVictoryModal = document.getElementById('grandVictoryModal');
    this.victoryBurstIcon = document.getElementById('grandVictoryBurstIcon');
    this.victoryGameBadge = document.getElementById('grandVictoryBadge');
    this.victoryModalTitle = document.getElementById('grandVictoryTitle');
    this.victoryModalSubtitle = document.getElementById('grandVictorySubtitle');
    this.victoryStat1Label = document.getElementById('gvStat1Label');
    this.victoryStat1Val = document.getElementById('gvStat1Val');
    this.victoryStat2Label = document.getElementById('gvStat2Label');
    this.victoryStat2Val = document.getElementById('gvStat2Val');
    this.btnVictoryReplay = document.getElementById('btnVictoryReplay');
    this.btnVictoryHome = document.getElementById('btnVictoryHome');

    this.activeClueDirEl = document.getElementById('activeClueDir');
    this.activeClueTextEl = document.getElementById('activeClueText');
    this.activeClueLenEl = document.getElementById('activeClueLen');
    this.cellAllCluesBoxEl = document.getElementById('cellAllCluesBox');
    this.activeWordsListEl = document.getElementById('activeWordsList');

    this.poolModal = document.getElementById('poolModal');
    this.poolModalScrollArea = document.getElementById('poolModalScrollArea');
    this.poolTableBody = document.getElementById('poolTableBody');
    this.searchPoolInput = document.getElementById('searchPoolInput');
    this.selectAllCheckbox = document.getElementById('selectAllCheckbox');
    this.btnDeleteSelected = document.getElementById('btnDeleteSelected');
    this.selectedCountEl = document.getElementById('selectedCount');
    this.poolStatusMsg = document.getElementById('poolStatusMsg');

    this.poolNameModal = document.getElementById('poolNameModal');
    this.poolNameModalTitle = document.getElementById('poolNameModalTitle');
    this.poolNameModalSubtitle = document.getElementById('poolNameModalSubtitle');
    this.poolNameInput = document.getElementById('poolNameInput');
    this.poolNameModalStatus = document.getElementById('poolNameModalStatus');

    this.importExportModal = document.getElementById('importExportModal');
    this.iePoolSelect = document.getElementById('iePoolSelect');
    this.importFileInput = document.getElementById('importFileInput');
    this.importTextarea = document.getElementById('importTextarea');
    this.exportTextarea = document.getElementById('exportTextarea');
    this.exportPoolNameLabel = document.getElementById('exportPoolNameLabel');
    this.ieModalStatus = document.getElementById('ieModalStatus');

    this.addWordModal = document.getElementById('addWordModal');
    this.addWordPoolSelect = document.getElementById('addWordPoolSelect');
    this.addWordTargetPoolName = document.getElementById('addWordTargetPoolName');
    this.addWordModalStatus = document.getElementById('addWordModalStatus');
    this.addWordForm = document.getElementById('addWordForm');
    this.inputTr = document.getElementById('inputTr');
    this.inputEn = document.getElementById('inputEn');

    this.victoryToast = document.getElementById('victoryToast');
    this.hiddenInput = document.getElementById('hiddenMobileInput');

    this.welcomeModal = document.getElementById('welcomeModal');
    this.chkDontShowWelcome = document.getElementById('chkDontShowWelcome');

    this.questionCountModal = document.getElementById('questionCountModal');
    this.questionCountModalTitle = document.getElementById('questionCountModalTitle');
    this.questionCountModalSub = document.getElementById('questionCountModalSub');
    this.questionCountForm = document.getElementById('questionCountForm');
    this.questionCountInput = document.getElementById('questionCountInput');
    this.questionCountInputLabel = document.getElementById('questionCountInputLabel');
    this.questionCountStatusMsg = document.getElementById('questionCountStatusMsg');
    this.qcMinVal = document.getElementById('qcMinVal');
    this.qcMaxVal = document.getElementById('qcMaxVal');
    this.qcHintMax = document.getElementById('qcHintMax');
    this.quizQuestionCountLabel = document.getElementById('quizQuestionCountLabel');
    this.scrambleQuestionCountLabel = document.getElementById('scrambleQuestionCountLabel');

    // Oyun Özel Rehber / Yardım Modalı
    this.gameHelpModal = document.getElementById('gameHelpModal');
    this.gameHelpLogo = document.getElementById('gameHelpLogo');
    this.gameHelpTitle = document.getElementById('gameHelpTitle');
    this.gameHelpSub = document.getElementById('gameHelpSub');
    this.gameHelpBody = document.getElementById('gameHelpBody');
    this.btnCloseGameHelp = document.getElementById('btnCloseGameHelp');
    this.btnOkGameHelp = document.getElementById('btnOkGameHelp');

    // Puan Tablosu (Leaderboard) Modalı
    this.leaderboardModal = document.getElementById('leaderboardModal');
    this.leaderboardTitle = document.getElementById('leaderboardTitle');
    this.leaderboardSub = document.getElementById('leaderboardSub');
    this.leaderboardList = document.getElementById('leaderboardList');
    this.btnCloseLeaderboard = document.getElementById('btnCloseLeaderboard');
    this.btnCloseLeaderboardBtn = document.getElementById('btnCloseLeaderboardBtn');
    this.btnResetLeaderboard = document.getElementById('btnResetLeaderboard');

    // Skor İstatistik Göstergeleri
    this.cwStatScoreEl = document.getElementById('cwStatScore');
    this.quizStatTotalScoreEl = document.getElementById('quizStatTotalScore');
    this.matchStatScoreEl = document.getElementById('matchStatScore');
    this.scrambleStatScoreEl = document.getElementById('scrambleStatScore');
  }

  bindEvents() {
    // Puan Tablosu butonları
    ['btnKelimelikScores', 'btnCrosswordScores', 'btnQuizScores', 'btnMatchScores', 'btnScrambleScores'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener('click', () => {
          const gKey = id.replace('btn', '').replace('Scores', '').toLowerCase();
          this.openLeaderboardModal(gKey);
        });
      }
    });

    if (this.btnCloseLeaderboard) this.btnCloseLeaderboard.addEventListener('click', () => this.closeLeaderboardModal());
    if (this.btnCloseLeaderboardBtn) this.btnCloseLeaderboardBtn.addEventListener('click', () => this.closeLeaderboardModal());
    if (this.btnResetLeaderboard) {
      this.btnResetLeaderboard.addEventListener('click', () => {
        this.askConfirmation(
          'Skor Tablosunu Sıfırla',
          'Bu oyunun puan tablosundaki tüm geçmiş skorları silmek istediğinize emin misiniz? Bu işlem geri alınamaz.',
          () => {
            this.resetLeaderboard(this.activeLeaderboardGameKey);
          }
        );
      });
    }

    if (this.btnCloseGameHelp) this.btnCloseGameHelp.addEventListener('click', () => this.closeGameHelpModal());
    if (this.btnOkGameHelp) this.btnOkGameHelp.addEventListener('click', () => this.closeGameHelpModal());

    document.getElementById('btnNewPuzzle').addEventListener('click', () => {
      this.sfx.playType();
      this.generateNewPuzzle();
    });
    document.getElementById('btnToastNew').addEventListener('click', () => {
      this.victoryToast.classList.add('hidden');
      this.generateNewPuzzle();
    });

    this.gridSizeSelect.addEventListener('change', (e) => {
      this.gridSize = parseInt(e.target.value, 10);
      this.generateNewPuzzle();
    });

    // Tüm oyunlardaki çoklu konu/havuz (checkbox) açılır menülerini bağla
    document.querySelectorAll('[data-topic-dropdown]').forEach(wrapper => {
      const trigger = wrapper.querySelector('[data-topic-trigger]');
      const menu = wrapper.querySelector('[data-topic-menu]');
      const btnSelectAll = wrapper.querySelector('[data-topic-select-all]');
      const btnApply = wrapper.querySelector('[data-topic-apply]');

      if (trigger && menu) {
        trigger.addEventListener('click', (e) => {
          e.stopPropagation();
          document.querySelectorAll('[data-topic-menu]').forEach(m => {
            if (m !== menu) m.classList.add('hidden');
          });
          menu.classList.toggle('hidden');
        });
      }

      if (btnSelectAll) {
        btnSelectAll.addEventListener('click', (e) => {
          e.stopPropagation();
          const allPoolIds = this.poolState.pools.map(p => p.id);
          const currentSelected = this.poolState.selectedPoolIds || [];
          const isAllSelected = allPoolIds.length > 0 && allPoolIds.every(id => currentSelected.includes(id));
          if (isAllSelected) {
            // Tümü seçiliyse tümünü bırak (yalnızca ilk havuzu aktif tut)
            this.poolState.selectedPoolIds = [this.poolState.pools[0]?.id || 'pool_all'];
            this.poolState.activePoolId = this.poolState.selectedPoolIds[0];
          } else {
            // Değilse tümünü seç
            this.poolState.selectedPoolIds = [...allPoolIds];
          }
          this.saveWordPool();
          this.sfx.playType();
          this.renderTopicDropdowns();
          this.refreshCurrentGame();
        });
      }

      if (btnApply && menu) {
        btnApply.addEventListener('click', (e) => {
          e.stopPropagation();
          menu.classList.add('hidden');
          this.sfx.playType();
          this.refreshCurrentGame();
        });
      }
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('[data-topic-dropdown]')) {
        document.querySelectorAll('[data-topic-menu]').forEach(m => m.classList.add('hidden'));
      }
    });

    // Silme onay modalı ("Emin misiniz?") olayları
    if (this.btnConfirmYes) {
      this.btnConfirmYes.addEventListener('click', () => {
        const fn = this.pendingConfirmAction;
        this.closeConfirmModal();
        if (typeof fn === 'function') fn();
      });
    }
    if (this.btnConfirmCancel) {
      this.btnConfirmCancel.addEventListener('click', () => this.closeConfirmModal());
    }

    // Uyarı modalı (Yetersiz kelime vb.)
    if (this.btnWarningOk) {
      this.btnWarningOk.addEventListener('click', () => {
        const cb = this.pendingWarningCallback;
        this.closeWarningModal();
        if (typeof cb === 'function') cb();
      });
    }

    // Gösterişli Zafer / Bitti Modalı butonları
    if (this.btnVictoryReplay) {
      this.btnVictoryReplay.addEventListener('click', () => {
        this.closeGrandVictoryModal();
        this.sfx.playType();
        this.refreshCurrentGame();
      });
    }
    if (this.btnVictoryHome) {
      this.btnVictoryHome.addEventListener('click', () => {
        this.closeGrandVictoryModal();
        this.goToHomePage();
      });
    }

    // Modal içinden düzenlenecek konu/havuz seçimi
    if (this.modalPoolSelect) {
      this.modalPoolSelect.addEventListener('change', (e) => {
        this.switchActivePool(e.target.value, false);
      });
    }

    // Ses Efektleri ve Odak Müziği açma/kapatma butonları (Ana sayfa + tüm oyunlar)
    document.querySelectorAll('[data-action="toggle-sound"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const nextState = !this.sfx.enabled;
        this.sfx.setEnabled(nextState);
        this.syncSoundButtonUI();
        try { btn.blur(); } catch (_) {}
        if (this.sfx.enabled) this.sfx.playType();
      });
    });

    document.querySelectorAll('[data-action="toggle-music"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const nextMusic = !this.sfx.musicEnabled;
        this.sfx.setMusicEnabled(nextMusic);
        this.syncSoundButtonUI();
        try { btn.blur(); } catch (_) {}
        if (this.sfx.enabled) this.sfx.playType();
      });
    });

    // Ana Sayfa oyun giriş butonları ve oyunlardan Ana Sayfaya dönüş butonları
    document.querySelectorAll('[data-enter-game]').forEach(btn => {
      btn.addEventListener('click', () => {
        const gameId = btn.getAttribute('data-enter-game');
        this.enterGame(gameId);
      });
    });

    document.querySelectorAll('[data-action="go-home"]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.goToHomePage();
      });
    });

    window.addEventListener('popstate', () => {
      if (this.currentScreen !== 'HOME') {
        this.goToHomePage(true);
      }
    });

    const btnHomeQuickPool = document.getElementById('btnHomeQuickPool');
    if (btnHomeQuickPool) {
      btnHomeQuickPool.addEventListener('click', () => this.openPoolModal());
    }
    const btnHomeOpenWelcome = document.getElementById('btnHomeOpenWelcome');
    if (btnHomeOpenWelcome) {
      btnHomeOpenWelcome.addEventListener('click', () => this.openWelcomeModal());
    }

    this.bindSubgameEvents();

    if (this.gameModeSelector) {
      this.gameModeSelector.addEventListener('click', (e) => {
        const btn = e.target.closest('.mode-btn');
        if (!btn) return;
        const selectedMode = btn.dataset.mode;
        if (!selectedMode || selectedMode === this.gameMode) return;

        this.gameMode = selectedMode;
        this.gameModeSelector.querySelectorAll('.mode-btn').forEach(b => {
          b.classList.toggle('active', b.dataset.mode === this.gameMode);
        });
        this.sfx.playType();
        this.generateNewPuzzle();
      });
    }

    // Ekran boyutu değiştiğinde ölçekleri kontrol et
    window.addEventListener('resize', () => {
      this.applyResponsiveGridScale();
      this.applyKelimelikResponsiveGridScale();
    });
    if (window.ResizeObserver && this.gridScrollContainer) {
      this.gridResizeObserver = new ResizeObserver(() => this.applyResponsiveGridScale());
      this.gridResizeObserver.observe(this.gridScrollContainer);
    }
    if (window.ResizeObserver && this.kelimelikGridScrollContainer) {
      this.kelimelikResizeObserver = new ResizeObserver(() => this.applyKelimelikResponsiveGridScale());
      this.kelimelikResizeObserver.observe(this.kelimelikGridScrollContainer);
    }
    this.initDragToPanGrid();
    this.initMobileKeyboardViewportHandler();

    document.getElementById('btnHint').addEventListener('click', () => this.giveLetterHint());
    document.getElementById('btnRevealAll').addEventListener('click', () => this.revealAllWords());

    // Fiziksel klavye dinleyicisi (Kelimelik, Çengel Bulmaca, Kelime Eşleştirme '.' İpucu ve Harf Avı '.' İpucu)
    window.addEventListener('keydown', (e) => {
      if (this.isAnyOverlayModalOpen()) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const isDotKey = (e.key === '.' || e.code === 'NumpadDecimal' || e.code === 'Period');

      if (this.currentScreen === 'KELIMELIK') {
        if (isDotKey) {
          e.preventDefault();
          this.giveKelimelikHint();
        } else if (e.key === 'Enter') {
          e.preventDefault();
          this.submitKelimelikWord();
        } else if (e.key === 'Backspace' || e.key === 'Delete') {
          e.preventDefault();
          this.handleKelimelikBackspace();
        } else if (e.key === 'Tab' || e.key === ' ') {
          e.preventDefault();
          this.toggleKelimelikDirectionAtFocusedCell();
        } else if (e.key.startsWith('Arrow')) {
          e.preventDefault();
          this.moveKelimelikFocusByArrow(e.key);
        } else if (e.key.length === 1 && /^[a-zA-ZçğıöşüÇĞİÖŞÜ]$/.test(e.key)) {
          e.preventDefault();
          this.handleKelimelikKeyLetter(e.key);
        }
        return;
      }

      if (this.currentScreen === 'QUIZ') {
        if (isDotKey) {
          e.preventDefault();
          this.giveQuizHint();
        }
        return;
      }

      if (this.currentScreen === 'MATCH') {
        if (isDotKey) {
          e.preventDefault();
          this.giveMatchHint();
        }
        return;
      }

      if (this.currentScreen === 'SCRAMBLE') {
        if (isDotKey) {
          e.preventDefault();
          this.giveScrambleHint();
        } else if (e.key === 'Backspace' || e.key === 'Delete') {
          e.preventDefault();
          this.handleScrambleBackspace();
        } else if (e.key.length === 1 && /^[a-zA-ZçğıöşüÇĞİÖŞÜ]$/.test(e.key)) {
          e.preventDefault();
          this.handleScrambleKeyInput(e.key);
        }
        return;
      }

      if (this.currentScreen !== 'CROSSWORD') return;

      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        this.triggerCleanBackspace();
      } else if (isDotKey) {
        e.preventDefault();
        this.resetMobileInputSentinel();
        this.giveLetterHint();
      } else if (e.key === 'Tab' || e.key === ' ') {
        e.preventDefault();
        this.toggleDirectionAtFocusedCell();
      } else if (e.key.startsWith('Arrow')) {
        e.preventDefault();
        this.moveFocusByArrow(e.key);
      } else if (e.key.length === 1 && /^[a-zA-ZçğıöşüÇĞİÖŞÜ]$/.test(e.key)) {
        if (e.target === this.hiddenInput) return;
        e.preventDefault();
        const activeWord = this.placedWords.find(w => w.id === this.activeWordId);
        const upperChar = this.normalizeInputLetter(e.key, activeWord ? activeWord.mode : 'TR_TO_EN');
        this.handleLetterInput(upperChar);
      }
    });

    // Mobil cihazlarda sistem klavyesinden (IME) anında harf, nokta (ipucu) ve tek basışta silme girişi
    if (this.hiddenInput) {
      this.resetMobileInputSentinel();

      this.hiddenInput.addEventListener('beforeinput', (e) => {
        if (
          e.inputType === 'deleteContentBackward' ||
          e.inputType === 'deleteContentForward' ||
          e.inputType === 'deleteWordBackward'
        ) {
          e.preventDefault();
          this.triggerCleanBackspace();
          return;
        }

        const data = e.data;
        if (data && data.includes('.')) {
          e.preventDefault();
          this.resetMobileInputSentinel();
          this.giveLetterHint();
        }
      });

      this.hiddenInput.addEventListener('input', (e) => {
        const currentVal = this.hiddenInput.value || '';

        if (
          e.inputType === 'deleteContentBackward' ||
          e.inputType === 'deleteContentForward' ||
          currentVal.length === 0
        ) {
          this.triggerCleanBackspace();
          return;
        }

        const cleanData = currentVal.replace(/\u200B/g, '') || e.data || '';
        this.resetMobileInputSentinel();

        if (!cleanData) return;

        if (cleanData.includes('.')) {
          this.giveLetterHint();
          return;
        }

        const lastChar = cleanData.slice(-1);
        if (/^[a-zA-ZçğıöşüÇĞİÖŞÜ]$/.test(lastChar)) {
          const activeWord = this.placedWords.find(w => w.id === this.activeWordId);
          const upperChar = this.normalizeInputLetter(lastChar, activeWord ? activeWord.mode : 'TR_TO_EN');
          this.handleLetterInput(upperChar);
        }
      });
    }

    // Veri Havuzu / Ayarlar Modal Olayları
    document.getElementById('btnTogglePool').addEventListener('click', () => this.openPoolModal());
    document.getElementById('btnClosePool').addEventListener('click', () => this.closePoolModal());
    document.getElementById('btnApplyAndRegenerate').addEventListener('click', () => {
      this.closePoolModal();
      this.refreshCurrentGame();
    });

    // Yeni Kelime Ekle alt sayfası (modal) olayları
    const btnOpenAddWordModal = document.getElementById('btnOpenAddWordModal');
    if (btnOpenAddWordModal) {
      btnOpenAddWordModal.addEventListener('click', () => this.openAddWordModal());
    }
    const btnCloseAddWordModal = document.getElementById('btnCloseAddWordModal');
    if (btnCloseAddWordModal) {
      btnCloseAddWordModal.addEventListener('click', () => this.closeAddWordModal());
    }
    const btnCancelAddWordModal = document.getElementById('btnCancelAddWordModal');
    if (btnCancelAddWordModal) {
      btnCancelAddWordModal.addEventListener('click', () => this.closeAddWordModal());
    }
    if (this.addWordPoolSelect) {
      this.addWordPoolSelect.addEventListener('change', (e) => {
        const targetPool = this.poolState.pools.find(p => p.id === e.target.value);
        if (targetPool && this.addWordTargetPoolName) {
          this.addWordTargetPoolName.textContent = targetPool.name;
        }
      });
    }

    // Yeni Havuz Oluştur / Ad Değiştir alt sayfası (modal) olayları
    document.getElementById('btnNewPoolSet').addEventListener('click', () => this.showPoolNameEditor('NEW'));
    document.getElementById('btnRenamePoolSet').addEventListener('click', () => this.showPoolNameEditor('RENAME'));
    document.getElementById('btnDeletePoolSet').addEventListener('click', () => this.deleteActivePoolSet());
    document.getElementById('btnSavePoolName').addEventListener('click', () => this.savePoolNameEditor());
    document.getElementById('btnCancelPoolName').addEventListener('click', () => this.hidePoolNameEditor());
    const btnClosePoolNameModal = document.getElementById('btnClosePoolNameModal');
    if (btnClosePoolNameModal) {
      btnClosePoolNameModal.addEventListener('click', () => this.hidePoolNameEditor());
    }
    this.poolNameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.savePoolNameEditor();
      }
    });

    // İçe / Dışa Aktar alt sayfası (modal) olayları
    document.getElementById('btnToggleImportExport').addEventListener('click', () => {
      this.openImportExportModal();
    });
    const btnCloseImportExportModal = document.getElementById('btnCloseImportExportModal');
    if (btnCloseImportExportModal) {
      btnCloseImportExportModal.addEventListener('click', () => this.closeImportExportModal());
    }
    const btnCancelImportExportModal = document.getElementById('btnCancelImportExportModal');
    if (btnCancelImportExportModal) {
      btnCancelImportExportModal.addEventListener('click', () => this.closeImportExportModal());
    }
    const btnBackFromImportExport = document.getElementById('btnBackFromImportExport');
    if (btnBackFromImportExport) {
      btnBackFromImportExport.addEventListener('click', () => this.closeImportExportModal());
    }
    if (this.iePoolSelect) {
      this.iePoolSelect.addEventListener('change', (e) => {
        this.switchActivePool(e.target.value, false);
        this.updateExportPreview();
      });
    }

    this.importFileInput.addEventListener('change', (e) => this.handleImportFileSelect(e));
    document.getElementById('btnImportToCurrent').addEventListener('click', () => this.importWordsToCurrentPool());
    document.getElementById('btnImportAsNewPool').addEventListener('click', () => this.importWordsAsNewPool());

    document.getElementById('btnCopyExportText').addEventListener('click', () => this.copyExportToClipboard());
    document.getElementById('btnDownloadTxt').addEventListener('click', () => this.downloadExportFile('txt'));
    document.getElementById('btnDownloadJson').addEventListener('click', () => this.downloadExportFile('json'));
    const btnExportAllPoolsTxt = document.getElementById('btnExportAllPoolsTxt');
    if (btnExportAllPoolsTxt) {
      btnExportAllPoolsTxt.addEventListener('click', () => this.exportAllPoolsToTxt());
    }
    const btnDeleteAllPools = document.getElementById('btnDeleteAllPools');
    if (btnDeleteAllPools) {
      btnDeleteAllPools.addEventListener('click', () => this.deleteAllPools());
    }

    this.addWordForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.addWordToPool();
    });

    this.searchPoolInput.addEventListener('input', () => this.renderPoolTable());

    this.selectAllCheckbox.addEventListener('change', (e) => {
      const filtered = this.getFilteredPoolWithIndices();
      if (e.target.checked) {
        filtered.forEach(item => this.selectedIndices.add(item.index));
      } else {
        filtered.forEach(item => this.selectedIndices.delete(item.index));
      }
      this.renderPoolTable();
    });

    this.btnDeleteSelected.addEventListener('click', () => this.deleteSelectedFromPool());

    // Karşılama ve Rehber Modalı Olayları
    const btnOpenWelcome = document.getElementById('btnOpenWelcome');
    if (btnOpenWelcome) {
      btnOpenWelcome.addEventListener('click', () => this.openWelcomeModal());
    }
    const btnCloseWelcome = document.getElementById('btnCloseWelcome');
    if (btnCloseWelcome) {
      btnCloseWelcome.addEventListener('click', () => this.closeWelcomeModal());
    }

    // Mobilde modal açıkken arka plandaki oyun sayfasının kaymasını kesin olarak engelle
    document.addEventListener('touchmove', (e) => {
      if (!document.body.classList.contains('modal-open')) return;
      const scrollable = e.target.closest('.pool-modal-scroll-area, .welcome-features, textarea, .topic-checkbox-list');
      if (!scrollable) {
        e.preventDefault();
      }
    }, { passive: false });

    // Yeni Modern Ana Sayfa Vitrin ve Navigasyon Bağlantıları
    this.initModernHomeHub();
  }

  isAnyOverlayModalOpen() {
    return Boolean(
      (this.poolModal && !this.poolModal.classList.contains('hidden')) ||
      (this.addWordModal && !this.addWordModal.classList.contains('hidden')) ||
      (this.poolNameModal && !this.poolNameModal.classList.contains('hidden')) ||
      (this.importExportModal && !this.importExportModal.classList.contains('hidden')) ||
      (this.questionCountModal && !this.questionCountModal.classList.contains('hidden')) ||
      (this.welcomeModal && !this.welcomeModal.classList.contains('hidden')) ||
      (this.confirmModal && !this.confirmModal.classList.contains('hidden')) ||
      (this.warningModal && !this.warningModal.classList.contains('hidden')) ||
      (this.grandVictoryModal && !this.grandVictoryModal.classList.contains('hidden')) ||
      document.querySelector('#mainNavDrawerModal:not(.hidden)') ||
      document.querySelector('#gameRulesModal:not(.hidden)') ||
      document.querySelector('#howToPlayModal:not(.hidden)') ||
      document.querySelector('#statsModal:not(.hidden)')
    );
  }

  syncBodyModalLock() {
    const anyModalOpen = this.isAnyOverlayModalOpen();
    document.body.classList.toggle('modal-open', anyModalOpen);
    document.documentElement.classList.toggle('modal-open', anyModalOpen);
  }

  syncSoundButtonUI() {
    const soundOn = this.sfx.enabled;
    const musicOn = this.sfx.musicEnabled;

    const soundSvgOn = `<svg class="btn-svg-icon" viewBox="0 0 24 24" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>`;
    const soundSvgOff = `<svg class="btn-svg-icon" viewBox="0 0 24 24" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="22" x2="16" y1="9" y2="15"/><line x1="16" x2="22" y1="9" y2="15"/></svg>`;

    const musicSvgOn = `<svg class="btn-svg-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`;
    const musicSvgOff = `<svg class="btn-svg-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/><line x1="2" x2="22" y1="2" y2="22"/></svg>`;

    document.querySelectorAll('[data-action="toggle-sound"]').forEach(btn => {
      btn.classList.toggle('muted', !soundOn);
      btn.classList.toggle('active', soundOn);
      if (btn.classList.contains('modern-header-btn')) {
        btn.innerHTML = soundOn ? soundSvgOn : soundSvgOff;
      } else {
        const svg = btn.querySelector('svg');
        if (svg) svg.outerHTML = soundOn ? soundSvgOn : soundSvgOff;
        const label = btn.querySelector('.sound-btn-label, [data-sound-label]');
        if (label) label.textContent = 'Ses';
      }
    });

    document.querySelectorAll('[data-action="toggle-music"]').forEach(btn => {
      btn.classList.toggle('muted', !musicOn);
      btn.classList.toggle('active', musicOn);
      if (btn.classList.contains('modern-header-btn')) {
        btn.innerHTML = musicOn ? musicSvgOn : musicSvgOff;
      } else {
        const svg = btn.querySelector('svg');
        if (svg) svg.outerHTML = musicOn ? musicSvgOn : musicSvgOff;
        const label = btn.querySelector('.music-btn-label, [data-music-label]');
        if (label) label.textContent = 'Müzik';
      }
    });

    if (this.musicStatusBadge) {
      this.musicStatusBadge.classList.toggle('is-muted', !musicOn);
      this.musicStatusBadge.style.display = 'none'; // Kullanıcı isteği: Başlık altındaki müzik yazısı kaldırıldı
    }
  }

  refreshCurrentGame() {
    if (this.currentScreen === 'KELIMELIK') {
      this.generateNewKelimelikPuzzle();
    } else if (this.currentScreen === 'CROSSWORD') {
      this.generateNewPuzzle();
    } else if (this.currentScreen === 'QUIZ') {
      this.startQuizGame();
    } else if (this.currentScreen === 'MATCH') {
      this.startMatchGame();
    } else if (this.currentScreen === 'SCRAMBLE') {
      this.startScrambleGame();
    } else {
      this.generateNewPuzzle();
    }
  }

  enterGame(gameId) {
    this.sfx.playType();
    this.closeGrandVictoryModal();
    this.hideKelimelikHintPopup();

    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    if (this.homeView) this.homeView.classList.add('hidden');
    if (this.kelimelikView) this.kelimelikView.classList.add('hidden');
    if (this.crosswordView) this.crosswordView.classList.add('hidden');
    if (this.quizView) this.quizView.classList.add('hidden');
    if (this.matchView) this.matchView.classList.add('hidden');
    if (this.scrambleView) this.scrambleView.classList.add('hidden');
    if (this.chatbotView) this.chatbotView.classList.add('hidden');

    try {
      history.pushState({ screen: gameId }, '');
    } catch (_) {}

    if (gameId === 'kelimelik') {
      this.currentScreen = 'KELIMELIK';
      this.sfx.playMusicForScreen('KELIMELIK');
      if (this.kelimelikView) this.kelimelikView.classList.remove('hidden');
      this.generateNewKelimelikPuzzle();
      this.openGameHelpModal('kelimelik');
      requestAnimationFrame(() => {
        window.scrollTo(0, 0);
        this.applyKelimelikResponsiveGridScale();
        setTimeout(() => this.applyKelimelikResponsiveGridScale(), 80);
      });
    } else if (gameId === 'crossword') {
      this.currentScreen = 'CROSSWORD';
      this.sfx.playMusicForScreen('CROSSWORD');
      if (this.crosswordView) this.crosswordView.classList.remove('hidden');
      this.generateNewPuzzle();
      this.openGameHelpModal('crossword');
      requestAnimationFrame(() => {
        window.scrollTo(0, 0);
        this.applyResponsiveGridScale();
        setTimeout(() => this.applyResponsiveGridScale(), 80);
      });
    } else if (gameId === 'quiz') {
      this.currentScreen = 'QUIZ';
      this.sfx.playMusicForScreen('QUIZ');
      if (this.quizView) this.quizView.classList.remove('hidden');
      this.openGameHelpModal('quiz');
      this.startQuizGame();
    } else if (gameId === 'match') {
      this.currentScreen = 'MATCH';
      this.sfx.playMusicForScreen('MATCH');
      if (this.matchView) this.matchView.classList.remove('hidden');
      this.openGameHelpModal('match');
      this.startMatchGame();
    } else if (gameId === 'scramble') {
      this.currentScreen = 'SCRAMBLE';
      this.sfx.playMusicForScreen('SCRAMBLE');
      if (this.scrambleView) this.scrambleView.classList.remove('hidden');
      this.openGameHelpModal('scramble');
      this.startScrambleGame();
    } else if (gameId === 'chatbot') {
      this.currentScreen = 'CHATBOT';
      this.sfx.playMusicForScreen('CHATBOT');
      if (this.chatbotView) this.chatbotView.classList.remove('hidden');
      this.initChatbotView();
    }
  }

  goToHomePage(fromPopState = false) {
    if (this.hiddenInput) {
      this.hiddenInput.blur();
    }
    if (this.victoryToast) {
      this.victoryToast.classList.add('hidden');
    }
    this.closeGrandVictoryModal();
    this.closeGameHelpModal();
    this.closeLeaderboardModal();
    this.closeNavDrawerModal();
    this.closeGameRulesModal();
    this.closeHowToPlayModal();
    this.closePoolGuideModal();
    this.closeStatsModal();
    this.stopKelimelikTimer();
    this.hideKelimelikHintPopup();
    if (this.kelimelikView) this.kelimelikView.classList.add('hidden');
    if (this.crosswordView) this.crosswordView.classList.add('hidden');
    if (this.quizView) this.quizView.classList.add('hidden');
    if (this.matchView) this.matchView.classList.add('hidden');
    if (this.scrambleView) this.scrambleView.classList.add('hidden');
    if (this.chatbotView) this.chatbotView.classList.add('hidden');
    if (this.chatbotEngine) this.chatbotEngine.stopSpeech();
    if (this.homeView) this.homeView.classList.remove('hidden');

    this.currentScreen = 'HOME';
    this.updatePoolCounters();
    this.selectHomeGame(this.selectedHomeGameKey || 'kelimelik');

    // Ana sayfaya dönüldüğünde ana sayfa odaklanma müziğini başlat
    this.sfx.playMusicForScreen('HOME');
  }

  checkAndShowWelcomeModal() {
    if (!this.welcomeModal) return;
    try {
      const hideWelcome = localStorage.getItem(WELCOME_HIDE_KEY) === 'true';
      if (this.chkDontShowWelcome) {
        this.chkDontShowWelcome.checked = hideWelcome;
      }
      if (!hideWelcome) {
        this.welcomeModal.classList.remove('hidden');
      }
    } catch (_) {
      this.welcomeModal.classList.remove('hidden');
    }
    this.syncBodyModalLock();
  }

  openWelcomeModal() {
    if (!this.welcomeModal) return;
    try {
      const hideWelcome = localStorage.getItem(WELCOME_HIDE_KEY) === 'true';
      if (this.chkDontShowWelcome) {
        this.chkDontShowWelcome.checked = hideWelcome;
      }
    } catch (_) {}
    this.welcomeModal.classList.remove('hidden');
    this.syncBodyModalLock();
  }

  closeWelcomeModal() {
    if (!this.welcomeModal) return;
    try {
      if (this.chkDontShowWelcome && this.chkDontShowWelcome.checked) {
        localStorage.setItem(WELCOME_HIDE_KEY, 'true');
      } else {
        localStorage.removeItem(WELCOME_HIDE_KEY);
      }
    } catch (_) {}
    this.welcomeModal.classList.add('hidden');
    this.syncBodyModalLock();
  }

  /* ==============================================================
     YENİ MODERN ANA SAYFA (HERO VİTRİN & BOTTOM NAV & DRAWER MENÜ)
     ============================================================== */
  initModernHomeHub() {
    this.selectedHomeGameKey = 'kelimelik';
    this.gpcSelectedPoolIds = ['all'];
    this.customWordCount = null;

    this.homeGameProfiles = {
      kelimelik: {
        key: 'kelimelik',
        title: 'Kelimelik',
        badge: '10 Harf Sürükle-Bırak • Çarpanlı Izgara',
        desc: '10 harfli ıstakanızdan taşları tahtaya sürükleyip bırakarak yatay ve dikey İngilizce kelimeler üretin! Çarpanlı bonus karelerle puanınızı katlayın.',
        difficulty: '11×11 (10 Dk)'
      },
      crossword: {
        key: 'crossword',
        title: 'Çengel Bulmaca',
        badge: 'Klasik Gazete Formatı • İpucu (.)',
        desc: 'Seçtiğiniz konu havuzlarından üretilen klasik Türkçe ⇄ İngilizce çengel bulmaca! Nokta tuşuyla harf ipucu alın, tüm kareleri doldurun.',
        difficulty: '16×16 (Orta)'
      },
      quiz: {
        key: 'quiz',
        title: 'Hızlı Kelime Testi',
        badge: '4 Seçenekli Test • 5x Seri Kutlamalı',
        desc: 'İstediğiniz soru sayısı ve konu havuzlarıyla yarışın! Kalem simgesine dokunarak soru sayısını serbestçe belirleyebilirsiniz.',
        difficulty: '20'
      },
      match: {
        key: 'match',
        title: 'Kelime Eşleştirme',
        badge: 'Kart Hafızası • 3 Zorluk Derecesi',
        desc: 'Türkçe ve İngilizce kart çiftlerini en az hamleyle eşleştirin! Nokta veya ipucu butonuyla eşleşen kartları turuncu görün.',
        difficulty: 'Orta (10 Çift)'
      },
      scramble: {
        key: 'scramble',
        title: 'Harf Avı (Kelime Kur)',
        badge: 'Karışık Harfler • Hızlı Yazım',
        desc: 'Karışık harf taşlarına sırasıyla dokunarak veya klavyeden yazarak kelimeyi tamamlayın! Kalem simgesiyle kelime sayısını belirleyin.',
        difficulty: '10'
      },
      chatbot: {
        key: 'chatbot',
        title: 'AI Sohbet (Emma)',
        badge: 'Yapay Zeka Konuşma Partneri • Canlı Pratik',
        desc: 'Seçtiğiniz İngilizce seviyesinde (A2, B1, B2) ve kelime havuzunuzdaki kelimelerle kişisel AI eğitmeniniz Emma ile gerçek zamanlı yazışarak pratik yapın!',
        difficulty: 'A2 İngilizce'
      }
    };

    // Alt navigasyon butonlarını dinle
    const navItems = document.querySelectorAll('.home-bottom-nav .home-nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const gKey = item.dataset.game;
        if (gKey) this.selectHomeGame(gKey);
      });
    });

    // Kocaman ▶ OYNA butonunu dinle
    const btnLaunch = document.getElementById('btnLaunchActiveGame');
    if (btnLaunch) {
      btnLaunch.addEventListener('click', () => {
        this.launchGame(this.selectedHomeGameKey || 'kelimelik');
      });
    }

    // 3 Çizgi Hamburger Menü Butonunu dinle
    const btnHomeMenu = document.getElementById('btnHomeMenu');
    if (btnHomeMenu) {
      btnHomeMenu.addEventListener('click', () => this.openNavDrawerModal());
    }

    const btnCloseNavDrawer = document.getElementById('btnCloseNavDrawer');
    if (btnCloseNavDrawer) {
      btnCloseNavDrawer.addEventListener('click', () => this.closeNavDrawerModal());
    }

    // Kullanıcı İsteği: Menüdeki butonlara tıklamak yerine boşluğa tıklanırsa çarpıya basılmış gibi ana sayfaya dönsün
    const drawerModal = document.getElementById('mainNavDrawerModal');
    if (drawerModal) {
      drawerModal.addEventListener('click', (e) => {
        if (e.target === drawerModal || !e.target.closest('.modern-drawer-card')) {
          this.closeNavDrawerModal();
        }
      });
    }

    // Çoklu Havuz Seçici Kontrolleri
    this.setupGpcMultiPoolPicker();

    // Kalem Simgeli Özel Sayı Kontrolleri
    this.setupCustomCountControl();

    // Drawer içindeki bağlantılar
    const btnDrawerHow = document.getElementById('btnDrawerOpenHowToPlay');
    if (btnDrawerHow) {
      btnDrawerHow.addEventListener('click', () => {
        this.closeNavDrawerModal();
        this.openHowToPlayModal();
      });
    }

    const btnDrawerPoolGuide = document.getElementById('btnDrawerOpenPoolGuide');
    if (btnDrawerPoolGuide) {
      btnDrawerPoolGuide.addEventListener('click', () => {
        this.closeNavDrawerModal();
        this.openPoolGuideModal();
      });
    }

    const btnDrawerRules = document.getElementById('btnDrawerOpenRules');
    if (btnDrawerRules) {
      btnDrawerRules.addEventListener('click', () => {
        this.closeNavDrawerModal();
        this.openGameRulesModal();
      });
    }

    const btnDrawerStats = document.getElementById('btnDrawerOpenStats');
    if (btnDrawerStats) {
      btnDrawerStats.addEventListener('click', () => {
        this.closeNavDrawerModal();
        this.openStatsModal();
      });
    }

    // Modal Kapatma Olayları
    const btnCloseRules = document.getElementById('btnCloseGameRules');
    if (btnCloseRules) btnCloseRules.addEventListener('click', () => this.closeGameRulesModal());

    const btnCloseRulesBtn = document.getElementById('btnCloseGameRulesBtn');
    if (btnCloseRulesBtn) btnCloseRulesBtn.addEventListener('click', () => this.closeGameRulesModal());

    const btnCloseHow = document.getElementById('btnCloseHowToPlay');
    if (btnCloseHow) btnCloseHow.addEventListener('click', () => this.closeHowToPlayModal());

    const btnHowGoSettings = document.getElementById('btnHowToPlayGoSettings');
    if (btnHowGoSettings) {
      btnHowGoSettings.addEventListener('click', () => {
        this.closeHowToPlayModal();
        this.openPoolGuideModal();
      });
    }

    const btnClosePoolGuide = document.getElementById('btnClosePoolGuide');
    if (btnClosePoolGuide) btnClosePoolGuide.addEventListener('click', () => this.closePoolGuideModal());

    const btnClosePoolGuideBtn = document.getElementById('btnClosePoolGuideBtn');
    if (btnClosePoolGuideBtn) btnClosePoolGuideBtn.addEventListener('click', () => this.closePoolGuideModal());

    const btnPoolGuideOpenActualPool = document.getElementById('btnPoolGuideOpenActualPool');
    if (btnPoolGuideOpenActualPool) {
      btnPoolGuideOpenActualPool.addEventListener('click', () => {
        this.closePoolGuideModal();
        this.openPoolModal();
      });
    }

    const btnHowStart = document.getElementById('btnHowToPlayStart');
    if (btnHowStart) {
      btnHowStart.addEventListener('click', () => {
        this.closeHowToPlayModal();
        this.launchGame(this.selectedHomeGameKey || 'kelimelik');
      });
    }

    const btnCloseStats = document.getElementById('btnCloseStatsModal');
    if (btnCloseStats) btnCloseStats.addEventListener('click', () => this.closeStatsModal());

    const btnCloseStatsBtn = document.getElementById('btnCloseStatsModalBtn');
    if (btnCloseStatsBtn) btnCloseStatsBtn.addEventListener('click', () => this.closeStatsModal());

    const btnResetStats = document.getElementById('btnResetAllStats');
    if (btnResetStats) {
      btnResetStats.addEventListener('click', () => {
        this.askConfirmation(
          'İstatistikleri Sıfırla',
          'Tüm oyunlardaki geçmiş istatistik ve skorları sıfırlamak istediğinize emin misiniz? Bu işlem geri alınamaz.',
          () => {
            this.resetAllStats();
          },
          '🗑️ Sıfırla'
        );
      });
    }

    // Başlangıç oyununu seç
    this.selectHomeGame('kelimelik');
  }

  /* Merkezi ve Çoklu Havuz Açılır Menü Sistemi */
  setupGpcMultiPoolPicker() {
    const trigger = document.getElementById('btnCentralPoolToggle') || document.getElementById('btnGpcPoolToggle');
    const panel = document.getElementById('centralPoolDropdownMenu') || document.getElementById('gpcPoolDropdownMenu');
    const btnSelectAll = document.getElementById('btnCentralSelectAllPools') || document.getElementById('btnGpcSelectAllPools');
    const btnApply = document.getElementById('btnCentralApplyPools') || document.getElementById('btnGpcApplyPools');

    if (trigger && panel) {
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        panel.classList.toggle('hidden');
        if (!panel.classList.contains('hidden')) {
          this.renderGpcPoolChecklist();
        }
      });

      document.addEventListener('click', (e) => {
        if (!panel.contains(e.target) && !trigger.contains(e.target)) {
          panel.classList.add('hidden');
        }
      });
    }

    if (btnSelectAll) {
      btnSelectAll.addEventListener('click', () => {
        const allPoolIds = (this.poolState?.pools || []).map(p => p.id);
        const current = this.gpcSelectedPoolIds || [];
        const isAllSelected = allPoolIds.length > 0 && allPoolIds.every(id => current.includes(id));
        if (isAllSelected) {
          // Tümünü Bırak: Sadece ilk havuzu bırak
          this.gpcSelectedPoolIds = allPoolIds.length > 0 ? [allPoolIds[0]] : [];
        } else {
          // Tümünü Seç
          this.gpcSelectedPoolIds = [...allPoolIds];
        }
        this.poolState.selectedPoolIds = [...this.gpcSelectedPoolIds];
        this.saveWordPool();
        this.renderGpcPoolChecklist();
        this.updateGpcPoolSummary();
      });
    }

    if (btnApply && panel) {
      btnApply.addEventListener('click', () => {
        panel.classList.add('hidden');
        this.poolState.selectedPoolIds = [...this.gpcSelectedPoolIds];
        this.saveWordPool();
        this.updateGpcPoolSummary();
      });
    }

    // Oyun Modu Seçici (Kullanıcı İsteği: Oyun kartındaki TR-EN / EN-TR / Karışık modu)
    const modeSelect = document.getElementById('gpcGameModeSelect');
    if (modeSelect) {
      const validModes = ['MIXED', 'TR_TO_EN', 'EN_TO_TR'];
      if (!validModes.includes(this.gameMode)) {
        this.gameMode = 'MIXED';
      }
      modeSelect.value = this.gameMode;
      modeSelect.addEventListener('change', () => {
        const val = modeSelect.value;
        if (validModes.includes(val)) {
          this.gameMode = val;
        }
        if (this.quizState) this.quizState.mode = this.gameMode;
        if (this.scrambleState) this.scrambleState.mode = this.gameMode;
        if (this.kelimelikState) this.kelimelikState.mode = this.gameMode;
        this.matchMode = this.gameMode;
        this.sfx.playType();
      });
    }
  }

  renderGpcPoolChecklist() {
    const container = document.getElementById('centralPoolChecklist') || document.getElementById('gpcPoolChecklist');
    const btnSelectAll = document.getElementById('btnCentralSelectAllPools') || document.getElementById('btnGpcSelectAllPools');
    if (!container) return;
    container.innerHTML = '';

    const allPoolIds = (this.poolState?.pools || []).map(p => p.id);
    if (!this.gpcSelectedPoolIds || this.gpcSelectedPoolIds.length === 0 || this.gpcSelectedPoolIds.includes('all')) {
      this.gpcSelectedPoolIds = [...allPoolIds];
    }

    const isAllSelected = allPoolIds.length > 0 && allPoolIds.every(id => this.gpcSelectedPoolIds.includes(id));
    if (btnSelectAll) {
      btnSelectAll.textContent = isAllSelected ? 'Tümünü Bırak' : 'Tümünü Seç';
    }

    // Yalnızca gerçek havuzlar listelenir (yapay 'all' mükerrer kaydı kaldırıldı)
    if (this.poolState && Array.isArray(this.poolState.pools)) {
      this.poolState.pools.forEach(p => {
        const pCount = Array.isArray(p.words) ? p.words.length : 0;
        const isChecked = this.gpcSelectedPoolIds.includes(p.id);
        const lbl = document.createElement('label');
        lbl.className = 'pool-check-item';
        lbl.innerHTML = `
          <input type="checkbox" value="${this.escapeHTML(p.id)}" ${isChecked ? 'checked' : ''} />
          <span>${this.escapeHTML(p.name || 'Havuz')} (${pCount})</span>
        `;
        const chk = lbl.querySelector('input');
        chk.addEventListener('change', () => {
          if (chk.checked) {
            if (!this.gpcSelectedPoolIds.includes(p.id)) this.gpcSelectedPoolIds.push(p.id);
          } else {
            this.gpcSelectedPoolIds = this.gpcSelectedPoolIds.filter(id => id !== p.id);
          }
          if (this.gpcSelectedPoolIds.length === 0) {
            this.gpcSelectedPoolIds = [p.id];
          }
          this.poolState.selectedPoolIds = [...this.gpcSelectedPoolIds];
          this.saveWordPool();
          this.renderGpcPoolChecklist();
          this.updateGpcPoolSummary();
        });
        container.appendChild(lbl);
      });
    }
  }

  getSelectedPoolsTotalWords() {
    if (!this.poolState || !Array.isArray(this.poolState.pools)) {
      return Array.isArray(this.wordPool) ? this.wordPool.length : 0;
    }
    const allPoolIds = this.poolState.pools.map(p => p.id);
    if (!this.gpcSelectedPoolIds || this.gpcSelectedPoolIds.length === 0 || this.gpcSelectedPoolIds.includes('all') || (allPoolIds.length > 0 && allPoolIds.every(id => this.gpcSelectedPoolIds.includes(id)))) {
      return this.getUniqueWordsCount();
    }
    const set = new Set();
    this.poolState.pools.forEach(p => {
      if (this.gpcSelectedPoolIds.includes(p.id)) {
        (p.words || []).forEach(w => {
          const key = `${(w.tr || '').trim().toLowerCase()}|${(w.en || '').trim().toLowerCase()}`;
          if (key !== '|') set.add(key);
        });
      }
    });
    return Math.max(set.size, 10);
  }

  updateGpcPoolSummary() {
    const summaryEl = document.getElementById('centralPoolSummaryText') || document.getElementById('gpcPoolSummaryText');
    const hintEl = document.getElementById('centralPoolSelectedCountHint') || document.getElementById('gpcPoolSelectedCountHint');
    const totalWords = this.getSelectedPoolsTotalWords();
    const allPools = this.poolState?.pools || [];
    const isAll = allPools.length > 0 && allPools.every(p => (this.gpcSelectedPoolIds || []).includes(p.id));

    // Kullanıcı İsteği: Sabit olarak simgeden sonra "Kelime Havuzu (toplam kelime)" yazsın
    if (summaryEl) {
      summaryEl.textContent = `Kelime Havuzu (${totalWords})`;
    }

    if (hintEl) {
      if (isAll || !this.gpcSelectedPoolIds || this.gpcSelectedPoolIds.length === 0 || this.gpcSelectedPoolIds.includes('all')) {
        hintEl.textContent = `Tüm kelimeler dahil (${totalWords})`;
      } else if (this.gpcSelectedPoolIds.length === 1) {
        const pId = this.gpcSelectedPoolIds[0];
        const p = allPools.find(x => x.id === pId);
        const name = p ? p.name : 'Seçili Havuz';
        hintEl.textContent = `${name} (${totalWords} kelime)`;
      } else {
        hintEl.textContent = `${this.gpcSelectedPoolIds.length} havuz seçili (${totalWords} kelime)`;
      }
    }

    // Kalem simgesi sınırını da güncelle
    const maxHint = document.getElementById('customCountMaxHint');
    const inp = document.getElementById('inputCustomWordCount');
    const desc = document.getElementById('customCountDesc');
    if (maxHint) maxHint.textContent = `/ ${totalWords}`;
    if (inp) inp.max = totalWords;
    if (desc) desc.textContent = `Seçiniz: 10-${totalWords} arası`;
  }

  /* Kalem Simgesi ile 10 ila Toplam Kelime Arası Serbest Sayı Girişi (Aynı Hücrede İnline Düzenleme) */
  setupCustomCountControl() {
    const btnToggle = document.getElementById('btnCustomCountToggle');
    const inlineDisplay = document.getElementById('gpcInlineCountDisplay');
    const inlineInput = document.getElementById('gpcInlineCountInput');

    const pencilSvg = `<svg class="icon-pencil-svg" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>`;
    const checkSvg = `<svg class="icon-check-svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;

    const cancelCount = () => {
      if (!inlineInput || !inlineDisplay || !btnToggle) return;
      inlineInput.classList.add('hidden');
      inlineDisplay.classList.remove('hidden');
      btnToggle.innerHTML = pencilSvg;
      btnToggle.title = 'Sayıyı Düzenle';
      btnToggle.setAttribute('aria-label', 'Sayıyı Düzenle');
      btnToggle.classList.remove('editing');
    };

    const applyCount = () => {
      if (!inlineInput || !inlineDisplay || !btnToggle) return;
      const maxWords = this.getSelectedPoolsTotalWords();
      const val = parseInt(inlineInput.value, 10);
      if (isNaN(val) || val < 10) {
        this.showFloatingToast('En az 10 kelime seçmelisiniz!', 'warning');
        inlineInput.value = 10;
        inlineInput.focus();
        return;
      }
      if (val > maxWords) {
        this.showFloatingToast(`Seçili havuzda en fazla ${maxWords} kelime var!`, 'warning');
        inlineInput.value = maxWords;
        inlineInput.focus();
        return;
      }

      this.customWordCount = val;
      inlineDisplay.textContent = String(val);
      inlineInput.classList.add('hidden');
      inlineDisplay.classList.remove('hidden');
      btnToggle.innerHTML = pencilSvg;
      btnToggle.title = 'Sayıyı Düzenle';
      btnToggle.setAttribute('aria-label', 'Sayıyı Düzenle');
      btnToggle.classList.remove('editing');

      const currentGame = this.selectedHomeGameKey || 'quiz';
      if (currentGame === 'quiz') {
        this.quizTotalQuestions = val;
      } else if (currentGame === 'scramble') {
        this.scrambleTotalCount = val;
      }

      const gpcDiff = document.getElementById('gpcStatDifficulty');
      if (gpcDiff) {
        gpcDiff.textContent = `${val} ${currentGame === 'quiz' ? 'Soru' : 'Kelime'}`;
      }

      this.showFloatingToast(`🎯 ${val} olarak belirlendi!`, 'success');
    };

    if (btnToggle && inlineDisplay && inlineInput) {
      btnToggle.addEventListener('click', () => {
        const isEditing = !inlineInput.classList.contains('hidden');
        if (isEditing) {
          applyCount();
        } else {
          // Düzenleme moduna geç
          inlineDisplay.classList.add('hidden');
          inlineInput.classList.remove('hidden');
          const maxWords = this.getSelectedPoolsTotalWords();
          inlineInput.min = 10;
          inlineInput.max = maxWords;
          inlineInput.value = parseInt(inlineDisplay.textContent, 10) || 10;
          inlineInput.placeholder = `10-${maxWords}`;
          btnToggle.innerHTML = checkSvg;
          btnToggle.title = 'Onayla';
          btnToggle.setAttribute('aria-label', 'Onayla');
          btnToggle.classList.add('editing');
          inlineInput.focus();
          inlineInput.select();
        }
      });

      inlineInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          applyCount();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          cancelCount();
        }
      });
    }
  }

  getUniqueWordsCount() {
    try {
      if (this.poolState && Array.isArray(this.poolState.pools)) {
        const set = new Set();
        this.poolState.pools.forEach(p => {
          (p.words || []).forEach(w => {
            const tr = (w.tr || '').trim().toLowerCase();
            const en = (w.en || '').trim().toLowerCase();
            if (tr || en) set.add(`${tr}|${en}`);
          });
        });
        return set.size;
      }
    } catch (_) {}
    return Array.isArray(this.wordPool) ? this.wordPool.length : 0;
  }

  populateGpcGameOptions(gameKey) {
    const optGroup = document.getElementById('gpcOptionGroup');
    const optLabel = document.getElementById('gpcOptionLabel');
    const optSel = document.getElementById('gpcGameOptionSelect');
    const inlineWrap = document.getElementById('gpcInlineCountWrapper');
    const inlineDisplay = document.getElementById('gpcInlineCountDisplay');
    const inlineInput = document.getElementById('gpcInlineCountInput');
    const btnCustom = document.getElementById('btnCustomCountToggle');
    const customPanel = document.getElementById('gpcCustomCountPanel');
    if (!optGroup || !optLabel || !optSel) return;

    optSel.innerHTML = '';
    optSel.disabled = false;
    optSel.style.opacity = '1';
    optSel.style.cursor = 'pointer';
    if (customPanel) customPanel.classList.add('hidden');
    if (btnCustom) {
      btnCustom.classList.remove('active', 'editing');
      btnCustom.innerHTML = `<svg class="icon-pencil-svg" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>`;
      btnCustom.title = 'Sayıyı Düzenle';
      btnCustom.setAttribute('aria-label', 'Sayıyı Düzenle');
    }
    if (inlineInput) inlineInput.classList.add('hidden');
    if (inlineDisplay) inlineDisplay.classList.remove('hidden');

    if (gameKey === 'quiz' || gameKey === 'scramble') {
      optGroup.style.display = 'flex';
      optSel.classList.add('hidden');
      if (inlineWrap) inlineWrap.classList.remove('hidden');
      if (btnCustom) btnCustom.style.display = 'inline-flex';

      if (gameKey === 'quiz') {
        optLabel.innerHTML = '<span class="gpc-cfg-icon">❓</span> Soru Sayısı:';
        const qCount = this.customWordCount || this.quizTotalQuestions || 20;
        if (inlineDisplay) inlineDisplay.textContent = String(qCount);
      } else {
        optLabel.innerHTML = '<span class="gpc-cfg-icon">🔤</span> Kelime Sayısı:';
        const sCount = this.customWordCount || this.scrambleTotalCount || 10;
        if (inlineDisplay) inlineDisplay.textContent = String(sCount);
      }
    } else {
      // Kelimelik, Crossword, Match: Klasik select göster, inline ve kalemi gizle
      if (inlineWrap) inlineWrap.classList.add('hidden');
      if (btnCustom) btnCustom.style.display = 'none';
      optSel.classList.remove('hidden');

      if (gameKey === 'kelimelik') {
        optGroup.style.display = 'flex';
        optLabel.innerHTML = '<span class="gpc-cfg-icon">⏱️</span> Zorluk / Süre:';
        const opts = [
          { val: '11', text: '11×11 (10 Dk - Kolay)' },
          { val: '13', text: '13×13 (15 Dk - Orta)' },
          { val: '15', text: '15×15 (20 Dk - Usta)' }
        ];
        opts.forEach(o => {
          const el = document.createElement('option');
          el.value = o.val;
          el.textContent = o.text;
          if (this.kelimelikState && this.kelimelikState.gridSize === parseInt(o.val, 10)) el.selected = true;
          optSel.appendChild(el);
        });
      } else if (gameKey === 'crossword') {
        optGroup.style.display = 'flex';
        optLabel.innerHTML = '<span class="gpc-cfg-icon">🎯</span> Izgara Zorluğu:';
        const opts = [
          { val: '12', text: '12×12 (Kolay - 15 Soru)' },
          { val: '16', text: '16×16 (Orta - 30 Soru)' },
          { val: '20', text: '20×20 (Zor - 45+ Soru)' }
        ];
        opts.forEach(o => {
          const el = document.createElement('option');
          el.value = o.val;
          el.textContent = o.text;
          if (this.gridSize === parseInt(o.val, 10)) el.selected = true;
          optSel.appendChild(el);
        });
      } else if (gameKey === 'match') {
        optGroup.style.display = 'flex';
        optLabel.innerHTML = '<span class="gpc-cfg-icon">🃏</span> Kart Sayısı:';
        const opts = [
          { val: '6', text: '6 Çift (12 Kart - Kolay)' },
          { val: '10', text: '10 Çift (20 Kart - Orta)' },
          { val: '16', text: '16 Çift (32 Kart - Zor)' }
        ];
        opts.forEach(o => {
          const el = document.createElement('option');
          el.value = o.val;
          el.textContent = o.text;
          if ((this.matchPairCount || 10) === parseInt(o.val, 10)) el.selected = true;
          optSel.appendChild(el);
        });
      } else if (gameKey === 'chatbot') {
        optGroup.style.display = 'flex';
        optLabel.innerHTML = '<span class="gpc-cfg-icon">💬</span> Pratik Alanı:';
        optSel.innerHTML = '<option value="free" selected>✨ Serbest Konuşma (Sonsuz Pratik)</option>';
        optSel.disabled = true;
        optSel.style.opacity = '0.9';
        optSel.style.cursor = 'default';
      }
    }
  }

  /* Kartın Arka Planındaki Tematik Resim Sahnesini Güncelle */
  updateGpcArtBackdrop(gameKey) {
    const backdrop = document.getElementById('gpcArtBackdrop');
    if (!backdrop) return;

    if (gameKey === 'kelimelik') {
      backdrop.innerHTML = `
        <svg viewBox="0 0 800 300" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="kelBg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f59e0b" stop-opacity="0.35"/><stop offset="100%" stop-color="#b45309" stop-opacity="0.55"/></linearGradient>
          </defs>
          <rect width="800" height="300" fill="url(#kelBg)"/>
          <g fill="#fef3c7" opacity="0.3">
            <rect x="50" y="30" width="70" height="70" rx="12"/><rect x="130" y="30" width="70" height="70" rx="12"/><rect x="210" y="30" width="70" height="70" rx="12"/>
            <rect x="130" y="110" width="70" height="70" rx="12"/><rect x="130" y="190" width="70" height="70" rx="12"/>
            <rect x="550" y="50" width="80" height="80" rx="14"/><rect x="640" y="50" width="80" height="80" rx="14"/><rect x="640" y="140" width="80" height="80" rx="14"/>
          </g>
          <polygon points="400,60 420,110 470,115 430,150 442,200 400,170 358,200 370,150 330,115 380,110" fill="#fde047" opacity="0.45"/>
        </svg>
      `;
    } else if (gameKey === 'crossword') {
      backdrop.innerHTML = `
        <svg viewBox="0 0 800 300" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="crBg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#10b981" stop-opacity="0.35"/><stop offset="100%" stop-color="#047857" stop-opacity="0.55"/></linearGradient>
          </defs>
          <rect width="800" height="300" fill="url(#crBg)"/>
          <g stroke="#ffffff" stroke-width="3" fill="#ecfdf5" opacity="0.25">
            <rect x="60" y="40" width="55" height="55"/><rect x="115" y="40" width="55" height="55"/><rect x="170" y="40" width="55" height="55"/><rect x="225" y="40" width="55" height="55"/>
            <rect x="115" y="95" width="55" height="55"/><rect x="115" y="150" width="55" height="55"/><rect x="115" y="205" width="55" height="55"/>
            <rect x="520" y="70" width="60" height="60"/><rect x="580" y="70" width="60" height="60"/><rect x="640" y="70" width="60" height="60"/>
            <rect x="580" y="130" width="60" height="60"/><rect x="580" y="190" width="60" height="60"/>
          </g>
        </svg>
      `;
    } else if (gameKey === 'quiz') {
      backdrop.innerHTML = `
        <svg viewBox="0 0 800 300" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="qzBg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#8b5cf6" stop-opacity="0.35"/><stop offset="100%" stop-color="#6d28d9" stop-opacity="0.55"/></linearGradient>
          </defs>
          <rect width="800" height="300" fill="url(#qzBg)"/>
          <g fill="#fde047" opacity="0.3">
            <polygon points="180,20 120,130 160,130 140,240 230,110 185,110"/>
            <polygon points="680,40 620,150 660,150 640,260 730,130 685,130"/>
          </g>
          <circle cx="400" cy="150" r="110" fill="none" stroke="#ffffff" stroke-width="6" stroke-dasharray="16 12" opacity="0.35"/>
        </svg>
      `;
    } else if (gameKey === 'match') {
      backdrop.innerHTML = `
        <svg viewBox="0 0 800 300" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="mtBg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#ec4899" stop-opacity="0.35"/><stop offset="100%" stop-color="#be185d" stop-opacity="0.55"/></linearGradient>
          </defs>
          <rect width="800" height="300" fill="url(#mtBg)"/>
          <g fill="#ffffff" opacity="0.3" stroke="#9d174d" stroke-width="4">
            <rect x="80" y="60" width="100" height="150" rx="16" transform="rotate(-15 130 135)"/>
            <rect x="220" y="50" width="100" height="150" rx="16" transform="rotate(10 270 125)"/>
            <rect x="520" y="60" width="110" height="160" rx="16" transform="rotate(-10 575 140)"/>
            <rect x="650" y="50" width="110" height="160" rx="16" transform="rotate(15 705 130)"/>
          </g>
        </svg>
      `;
    } else if (gameKey === 'scramble') {
      backdrop.innerHTML = `
        <svg viewBox="0 0 800 300" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="scBg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#0284c7" stop-opacity="0.35"/><stop offset="100%" stop-color="#0369a1" stop-opacity="0.55"/></linearGradient>
          </defs>
          <rect width="800" height="300" fill="url(#scBg)"/>
          <g fill="none" stroke="#e0f2fe" stroke-width="5" stroke-dasharray="14 10" opacity="0.35">
            <circle cx="200" cy="150" r="100"/><circle cx="600" cy="150" r="110"/>
          </g>
          <g fill="#ffffff" opacity="0.35">
            <circle cx="140" cy="90" r="30"/><circle cx="260" cy="100" r="30"/><circle cx="200" cy="210" r="30"/>
            <circle cx="540" cy="90" r="32"/><circle cx="660" cy="100" r="32"/><circle cx="600" cy="210" r="32"/>
          </g>
        </svg>
      `;
    } else if (gameKey === 'chatbot') {
      backdrop.innerHTML = `
        <svg viewBox="0 0 800 300" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="cbBg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#0f766e" stop-opacity="0.38"/><stop offset="100%" stop-color="#115e59" stop-opacity="0.6"/></linearGradient>
          </defs>
          <rect width="800" height="300" fill="url(#cbBg)"/>
          <g fill="#fde68a" opacity="0.3">
            <rect x="70" y="50" width="160" height="80" rx="20"/>
            <polygon points="100,130 90,155 125,130"/>
            <rect x="560" y="100" width="170" height="85" rx="20"/>
            <polygon points="700,185 715,210 675,185"/>
          </g>
          <circle cx="400" cy="140" r="70" fill="none" stroke="#f59e0b" stroke-width="4" stroke-dasharray="12 8" opacity="0.45"/>
        </svg>
      `;
    }
  }

  launchGame(gameKey) {
    const targetKey = gameKey || this.selectedHomeGameKey || 'kelimelik';

    // 1. Çoklu seçilen kelime havuzlarını uygula
    if (this.gpcSelectedPoolIds && this.gpcSelectedPoolIds.length > 0) {
      if (this.gpcSelectedPoolIds.includes('all')) {
        this.poolState.activePoolId = 'pool_all';
        this.poolState.selectedPoolIds = (this.poolState.pools || []).map(p => p.id);
      } else {
        this.poolState.activePoolId = this.gpcSelectedPoolIds[0];
        this.poolState.selectedPoolIds = [...this.gpcSelectedPoolIds];
      }
      this.saveWordPool();
    }

    // 1b. Vitrindeki seçili oyun modunu oku ve tüm oyunlara uygula (TR_TO_EN, EN_TO_TR, MIXED)
    const modeSel = document.getElementById('gpcGameModeSelect');
    const validModes = ['MIXED', 'TR_TO_EN', 'EN_TO_TR'];
    const selectedMode = (modeSel && validModes.includes(modeSel.value))
      ? modeSel.value
      : (validModes.includes(this.gameMode) ? this.gameMode : 'MIXED');
    this.gameMode = selectedMode;
    if (this.quizState) this.quizState.mode = selectedMode;
    if (this.scrambleState) this.scrambleState.mode = selectedMode;
    if (this.kelimelikState) this.kelimelikState.mode = selectedMode;
    this.matchMode = selectedMode;

    if (this.gameModeSelector) {
      this.gameModeSelector.querySelectorAll('.mode-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.mode === selectedMode);
      });
    }
    const qModeSel = document.getElementById('quizModeSelector');
    if (qModeSel) {
      qModeSel.querySelectorAll('.mode-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.mode === selectedMode);
      });
    }
    const sModeSel = document.getElementById('scrambleModeSelector');
    if (sModeSel) {
      sModeSel.querySelectorAll('.mode-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.mode === selectedMode);
      });
    }

    // 2. Vitrindeki seçili zorluk / süre / soru sayısını oyuna uygula
    const optSel = document.getElementById('gpcGameOptionSelect');
    const optVal = optSel ? optSel.value : null;

    if (targetKey === 'kelimelik') {
      const size = parseInt(optVal, 10) || 11;
      const mins = size === 15 ? 20 : size === 13 ? 15 : 10;
      this.kelimelikState.gridSize = size;
      this.kelimelikState.timerTotalSeconds = mins * 60;
      const kSel = document.getElementById('kelimelikGridSizeSelect');
      if (kSel) kSel.value = String(size);
    } else if (targetKey === 'crossword') {
      const size = parseInt(optVal, 10) || 16;
      this.gridSize = size;
      const cSel = document.getElementById('gridSizeSelect');
      if (cSel) cSel.value = String(size);
    } else if (targetKey === 'quiz') {
      const inlineDisplay = document.getElementById('gpcInlineCountDisplay');
      const inlineVal = inlineDisplay ? parseInt(inlineDisplay.textContent, 10) : NaN;
      const count = this.customWordCount || (!isNaN(inlineVal) ? inlineVal : (parseInt(optVal, 10) || 20));
      this.quizTotalQuestions = count;
      this.quizState.targetCount = count;
      if (this.quizQuestionCountLabel) {
        this.quizQuestionCountLabel.textContent = String(count);
      }
      const qSel = document.getElementById('quizCountSelect') || document.getElementById('questionCountSelect');
      if (qSel) qSel.value = String(count);
    } else if (targetKey === 'match') {
      const pairs = parseInt(optVal, 10) || 10;
      this.matchPairCount = pairs;
      const mSel = document.getElementById('matchCountSelect');
      if (mSel) mSel.value = String(pairs);
    } else if (targetKey === 'scramble') {
      const inlineDisplay = document.getElementById('gpcInlineCountDisplay');
      const inlineVal = inlineDisplay ? parseInt(inlineDisplay.textContent, 10) : NaN;
      const count = this.customWordCount || (!isNaN(inlineVal) ? inlineVal : (parseInt(optVal, 10) || 10));
      this.scrambleTotalCount = count;
      this.scrambleState.targetCount = count;
      if (this.scrambleQuestionCountLabel) {
        this.scrambleQuestionCountLabel.textContent = String(count);
      }
      const sSel = document.getElementById('scrambleCountSelect');
      if (sSel) sSel.value = String(count);
    } else if (targetKey === 'chatbot') {
      const modeSel = document.getElementById('gpcGameModeSelect');
      const lvl = (modeSel && ['A2', 'B1', 'B2'].includes(modeSel.value)) ? modeSel.value : 'A2';
      if (this.chatbotEngine) {
        this.chatbotEngine.setLevel(lvl);
      }
    }

    // 3. Oyuna geçiş yap
    this.enterGame(targetKey);
  }

  selectHomeGame(gameKey) {
    const prof = this.homeGameProfiles[gameKey];
    if (!prof) return;

    this.selectedHomeGameKey = gameKey;

    // Alt bar butonlarını güncelle
    document.querySelectorAll('.home-bottom-nav .home-nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.game === gameKey);
    });

    // Vitrin Kartı İkonunu Game-icons.net SVG ile güncelle
    const gpcIcon = document.getElementById('gpcIcon');
    const gpcBadge = document.getElementById('gpcBadge');
    const gpcTitle = document.getElementById('gpcTitle');
    const gpcDesc = document.getElementById('gpcDesc');
    const gpcDiff = document.getElementById('gpcStatDifficulty');
    const gpcHigh = document.getElementById('gpcStatHighscore');
    const gpcSolved = document.getElementById('gpcStatSolved');

    if (gpcIcon) {
      if (gameKey === 'kelimelik') {
        gpcIcon.innerHTML = `
          <svg viewBox="0 0 512 512" class="gi-svg" aria-hidden="true">
            <rect x="40" y="40" width="432" height="432" rx="64" fill="#f59e0b"/>
            <rect x="60" y="60" width="392" height="392" rx="50" fill="#fbbf24"/>
            <path d="M160 140h48v100l80-100h60l-88 108 96 124h-62l-86-112v112h-48z" fill="#78350f"/>
            <text x="345" y="380" font-family="system-ui, sans-serif" font-weight="900" font-size="105" fill="#92400e">1</text>
          </svg>`;
      } else if (gameKey === 'crossword') {
        gpcIcon.innerHTML = `
          <svg viewBox="0 0 512 512" class="gi-svg" aria-hidden="true">
            <rect x="40" y="40" width="432" height="432" rx="64" fill="#10b981"/>
            <rect x="60" y="60" width="392" height="392" rx="50" fill="#34d399"/>
            <path d="M120 120h80v80h-80zM216 120h80v80h-80zM312 120h80v80h-80zM216 216h80v80h-80zM216 312h80v80h-80zM120 312h80v80h-80z" fill="#ffffff"/>
            <polygon points="256 142 272 168 240 168" fill="#047857"/>
            <polygon points="256 370 272 344 240 344" fill="#047857"/>
            <polygon points="142 160 168 144 168 176" fill="#047857"/>
          </svg>`;
      } else if (gameKey === 'quiz') {
        gpcIcon.innerHTML = `
          <svg viewBox="0 0 512 512" class="gi-svg" aria-hidden="true">
            <rect x="40" y="40" width="432" height="432" rx="64" fill="#8b5cf6"/>
            <rect x="60" y="60" width="392" height="392" rx="50" fill="#a78bfa"/>
            <circle cx="256" cy="256" r="145" fill="#6d28d9"/>
            <polygon points="280 110 170 270 245 270 215 402 342 232 268 232" fill="#fde047" stroke="#ffffff" stroke-width="12" stroke-linejoin="round"/>
          </svg>`;
      } else if (gameKey === 'match') {
        gpcIcon.innerHTML = `
          <svg viewBox="0 0 512 512" class="gi-svg" aria-hidden="true">
            <rect x="40" y="40" width="432" height="432" rx="64" fill="#ec4899"/>
            <rect x="60" y="60" width="392" height="392" rx="50" fill="#f472b6"/>
            <rect x="115" y="160" width="160" height="230" rx="20" transform="rotate(-14 195 275)" fill="#ffffff" stroke="#9d174d" stroke-width="10"/>
            <rect x="235" y="140" width="160" height="230" rx="20" transform="rotate(14 315 255)" fill="#ffffff" stroke="#9d174d" stroke-width="10"/>
            <circle cx="195" cy="275" r="32" fill="#ef4444"/>
            <polygon points="315 224 327 248 353 252 334 270 338 296 315 284 292 296 296 270 277 252 303 248" fill="#eab308"/>
          </svg>`;
      } else if (gameKey === 'scramble') {
        gpcIcon.innerHTML = `
          <svg viewBox="0 0 512 512" class="gi-svg" aria-hidden="true">
            <rect x="40" y="40" width="432" height="432" rx="64" fill="#0284c7"/>
            <rect x="60" y="60" width="392" height="392" rx="50" fill="#38bdf8"/>
            <circle cx="256" cy="256" r="145" fill="none" stroke="#e0f2fe" stroke-width="16" stroke-dasharray="24 16"/>
            <circle cx="256" cy="148" r="42" fill="#ffffff" stroke="#0369a1" stroke-width="6"/>
            <text x="240" y="163" font-family="system-ui, sans-serif" font-weight="900" font-size="44" fill="#0369a1">A</text>
            <circle cx="348" cy="296" r="42" fill="#ffffff" stroke="#0369a1" stroke-width="6"/>
            <text x="333" y="311" font-family="system-ui, sans-serif" font-weight="900" font-size="44" fill="#0369a1">B</text>
            <circle cx="164" cy="296" r="42" fill="#ffffff" stroke="#0369a1" stroke-width="6"/>
            <text x="149" y="311" font-family="system-ui, sans-serif" font-weight="900" font-size="44" fill="#0369a1">C</text>
            <polygon points="256 220 276 276 256 264 236 276" fill="#facc15"/>
          </svg>`;
      } else if (gameKey === 'chatbot') {
        gpcIcon.innerHTML = `
          <svg viewBox="0 0 512 512" class="gi-svg" aria-hidden="true">
            <rect x="40" y="40" width="432" height="432" rx="64" fill="#0f766e"/>
            <rect x="60" y="60" width="392" height="392" rx="50" fill="#14b8a6"/>
            <!-- Emma Bayan Eğitmen Vitrin İkonu -->
            <circle cx="256" cy="230" r="140" fill="#0f172a" stroke="#f59e0b" stroke-width="12"/>
            <path d="M160 210c0-65 42-100 96-100s96 35 96 100c0 40-8 75-20 100-14-25-24-40-76-40s-62 15-76 40c-12-25-20-60-20-100z" fill="#78350f"/>
            <path d="M140 230c-10 35-5 75 10 105 5 15 20 40 30 40 10 0 5-25 0-40-5-30-10-70-5-105z" fill="#92400e"/>
            <path d="M372 230c10 35 5 75-10 105-5 15-20 40-30 40-10 0-5-25 0-40 5-30 10-70 5-105z" fill="#92400e"/>
            <circle cx="256" cy="210" r="70" fill="#fde68a"/>
            <path d="M190 190c6-45 30-70 66-70s66 25 66 70c-18-30-38-40-66-40s-48 10-66 40z" fill="#92400e"/>
            <circle cx="225" cy="205" r="10" fill="#0f172a"/>
            <circle cx="287" cy="205" r="10" fill="#0f172a"/>
            <ellipse cx="205" cy="225" rx="10" ry="6" fill="#fca5a5" opacity="0.6"/>
            <ellipse cx="307" cy="225" rx="10" ry="6" fill="#fca5a5" opacity="0.6"/>
            <path d="M232 245c14 14 34 14 48 0" fill="none" stroke="#be123c" stroke-width="8" stroke-linecap="round"/>
            <circle cx="185" cy="235" r="8" fill="#fbbf24"/>
            <circle cx="327" cy="235" r="8" fill="#fbbf24"/>
            <!-- Konuşma Baloncuğu Rozeti -->
            <rect x="140" y="370" width="232" height="60" rx="20" fill="#ffffff" stroke="#0d9488" stroke-width="7"/>
            <polygon points="230 430 256 455 270 430" fill="#ffffff"/>
            <circle cx="200" cy="400" r="7" fill="#10b981"/>
            <circle cx="256" cy="400" r="7" fill="#f59e0b"/>
            <circle cx="312" cy="400" r="7" fill="#0284c7"/>
          </svg>`;
      }
    }

    if (gpcBadge) gpcBadge.textContent = prof.badge;
    if (gpcTitle) gpcTitle.textContent = prof.title;
    if (gpcDesc) gpcDesc.textContent = prof.desc;
    if (gpcDiff) gpcDiff.textContent = prof.difficulty;

    // Kartın Arka Planındaki Resimli Tematik Sahneyi Güncelle
    this.updateGpcArtBackdrop(gameKey);

    // Çoklu havuz özetini ve oyun seçeneklerini güncelle
    this.updateGpcPoolSummary();
    this.populateGpcGameOptions(gameKey);

    // Oyun modu etiket metnini oyuna göre ayarla (Chatbot için "Konuşma Dili:", diğerleri için "Oyun Modu:")
    const modeLabel = document.getElementById('gpcGameModeLabelText') || document.querySelector('.gpc-mode-group .gpc-config-label span');
    if (modeLabel) {
      modeLabel.textContent = gameKey === 'chatbot' ? 'Konuşma Dili:' : 'Oyun Modu:';
    }

    // AI Sohbet modunda tüm havuzlar sabit ve kilitli olsun (Kelimelik gibi)
    const poolTrigger = document.getElementById('btnCentralPoolToggle') || document.getElementById('btnGpcPoolToggle');
    if (poolTrigger) {
      if (gameKey === 'chatbot') {
        poolTrigger.style.pointerEvents = 'none';
        poolTrigger.style.opacity = '0.75';
        poolTrigger.title = 'AI Sohbet modunda tüm kelime havuzları otomatik aktiftir';
      } else {
        poolTrigger.style.pointerEvents = 'auto';
        poolTrigger.style.opacity = '1';
        poolTrigger.title = 'Aktif kelime havuzlarını seçin';
      }
    }

    // Oyun modu seçicisini oyuna göre uyarla (Kelimelik ve Eşleştirme tek tiptir ve seçim yapılamaz; Chatbot A2/B1/B2 seviyeleridir)
    const modeSelect = document.getElementById('gpcGameModeSelect');
    if (modeSelect) {
      modeSelect.onchange = null;
      if (gameKey === 'chatbot') {
        const currentLevel = (this.chatbotEngine && this.chatbotEngine.level) || 'A2';
        modeSelect.innerHTML = `
          <option value="A2"${currentLevel === 'A2' ? ' selected' : ''}>🟢 A2 İngilizce (Temel)</option>
          <option value="B1"${currentLevel === 'B1' ? ' selected' : ''}>🟡 B1 İngilizce (Orta)</option>
          <option value="B2"${currentLevel === 'B2' ? ' selected' : ''}>🔵 B2 İngilizce (İleri)</option>
        `;
        modeSelect.disabled = false;
        modeSelect.style.opacity = '1';
        modeSelect.style.cursor = 'pointer';
        modeSelect.value = currentLevel;
        modeSelect.onchange = () => {
          const val = modeSelect.value;
          if (this.chatbotEngine) this.chatbotEngine.setLevel(val);
          this.homeGameProfiles.chatbot.difficulty = val + ' İngilizce';
          if (gpcDiff) gpcDiff.textContent = val + ' İngilizce';
        };
      } else if (gameKey === 'kelimelik') {
        modeSelect.innerHTML = `
          <option value="EN_ONLY" selected>🔤 Standart (Yalnızca İngilizce)</option>
        `;
        modeSelect.disabled = true;
        modeSelect.style.opacity = '0.75';
        modeSelect.style.cursor = 'not-allowed';
      } else if (gameKey === 'match') {
        modeSelect.innerHTML = `
          <option value="MATCH_PAIR" selected>🔄 TR ⟷ EN Kart Eşleştirme</option>
        `;
        modeSelect.disabled = true;
        modeSelect.style.opacity = '0.75';
        modeSelect.style.cursor = 'not-allowed';
      } else {
        const validModes = ['MIXED', 'TR_TO_EN', 'EN_TO_TR'];
        const currentMode = validModes.includes(this.gameMode) ? this.gameMode : 'MIXED';
        this.gameMode = currentMode;
        modeSelect.innerHTML = `
          <option value="MIXED"${currentMode === 'MIXED' ? ' selected' : ''}>🔀 Karışık (İki Yönlü)</option>
          <option value="TR_TO_EN"${currentMode === 'TR_TO_EN' ? ' selected' : ''}>🇹🇷 Türkçe ➔ 🇬🇧 İngilizce</option>
          <option value="EN_TO_TR"${currentMode === 'EN_TO_TR' ? ' selected' : ''}>🇬🇧 İngilizce ➔ 🇹🇷 Türkçe</option>
        `;
        modeSelect.disabled = false;
        modeSelect.style.opacity = '1';
        modeSelect.style.cursor = 'pointer';
        modeSelect.value = currentMode;
      }
    }

    // Skor ve İstatistikleri Güncelle (Chatbot serbest pratik modudur)
    if (gameKey === 'chatbot') {
      if (gpcHigh) gpcHigh.textContent = '-';
      if (gpcSolved) gpcSolved.textContent = 'Serbest';
    } else {
      try {
        const records = JSON.parse(localStorage.getItem(`english_easy_lb_${gameKey}`) || '[]');
        const high = records.length > 0 ? Math.max(...records.map(r => r.score || 0)) : 0;
        if (gpcHigh) gpcHigh.textContent = high > 0 ? `${high} P` : '-';
        if (gpcSolved) gpcSolved.textContent = records.length > 0 ? `${records.length} Tur` : '0';
      } catch (_) {
        if (gpcHigh) gpcHigh.textContent = '-';
        if (gpcSolved) gpcSolved.textContent = '0';
      }
    }
  }

  openNavDrawerModal() {
    const el = document.getElementById('mainNavDrawerModal');
    if (el) el.classList.remove('hidden');
    this.syncBodyModalLock();
  }

  closeNavDrawerModal() {
    const el = document.getElementById('mainNavDrawerModal');
    if (el) el.classList.add('hidden');
    this.syncBodyModalLock();
  }

  openGameRulesModal() {
    const el = document.getElementById('gameRulesModal');
    if (el) el.classList.remove('hidden');
    this.syncBodyModalLock();
  }

  closeGameRulesModal() {
    const el = document.getElementById('gameRulesModal');
    if (el) el.classList.add('hidden');
    this.syncBodyModalLock();
  }

  openHowToPlayModal() {
    const el = document.getElementById('howToPlayModal');
    if (el) el.classList.remove('hidden');
    this.syncBodyModalLock();
  }

  closeHowToPlayModal() {
    const el = document.getElementById('howToPlayModal');
    if (el) el.classList.add('hidden');
    this.syncBodyModalLock();
  }

  openPoolGuideModal() {
    const el = document.getElementById('poolGuideModal');
    if (el) el.classList.remove('hidden');
    this.syncBodyModalLock();
  }

  closePoolGuideModal() {
    const el = document.getElementById('poolGuideModal');
    if (el) el.classList.add('hidden');
    this.syncBodyModalLock();
  }

  openStatsModal() {
    this.updateStatsModalView();
    const el = document.getElementById('statsModal');
    if (el) el.classList.remove('hidden');
    this.syncBodyModalLock();
  }

  closeStatsModal() {
    const el = document.getElementById('statsModal');
    if (el) el.classList.add('hidden');
    this.syncBodyModalLock();
  }

  updateStatsModalView() {
    const poolWords = this.getUniqueWordsCount();
    const stWords = document.getElementById('stGaugeWords');
    if (stWords) stWords.textContent = poolWords;

    const gameKeys = ['kelimelik', 'crossword', 'quiz', 'match', 'scramble'];
    let totalGames = 0;
    let totalScoreSum = 0;
    const leaderboards = this.gameLeaderboards || this.loadLeaderboards();

    gameKeys.forEach(gKey => {
      try {
        let records = [];
        if (leaderboards && Array.isArray(leaderboards[gKey]) && leaderboards[gKey].length > 0) {
          records = leaderboards[gKey];
        } else {
          records = JSON.parse(localStorage.getItem(`english_easy_lb_${gKey}`) || '[]');
        }

        const count = records.length;
        const high = count > 0 ? Math.max(...records.map(r => r.score || 0)) : 0;
        totalGames += count;
        records.forEach(r => totalScoreSum += (r.score || 0));

        if (gKey === 'kelimelik') {
          const elH = document.getElementById('stKelimelikHigh');
          const elS = document.getElementById('stKelimelikSolved');
          const elG = document.getElementById('stKelimelikGames');
          if (elH) elH.textContent = `${high} P`;
          if (elS) elS.textContent = count > 0 ? `${count * 5}` : '0';
          if (elG) elG.textContent = `${count}`;
        } else if (gKey === 'crossword') {
          const elH = document.getElementById('stCrosswordHigh');
          const elS = document.getElementById('stCrosswordSolved');
          const elStr = document.getElementById('stCrosswordStreak');
          if (elH) elH.textContent = `${high} P`;
          if (elS) elS.textContent = `${count}`;
          if (elStr) elStr.textContent = count > 0 ? `${Math.min(30, count * 3)}x` : '0x';
        } else if (gKey === 'quiz') {
          const elH = document.getElementById('stQuizHigh');
          const elS = document.getElementById('stQuizSolved');
          const elStr = document.getElementById('stQuizStreak');
          if (elH) elH.textContent = `${high} P`;
          if (elS) elS.textContent = count > 0 ? `${count * 15}` : '0';
          if (elStr) elStr.textContent = count > 0 ? `${Math.min(25, count * 5)}x` : '0x';
        } else if (gKey === 'match') {
          const elH = document.getElementById('stMatchHigh');
          const elG = document.getElementById('stMatchGames');
          const elB = document.getElementById('stMatchBestMoves');
          if (elH) elH.textContent = `${high} P`;
          if (elG) elG.textContent = `${count}`;
          if (elB) elB.textContent = count > 0 ? '14 Hamle' : '-';
        } else if (gKey === 'scramble') {
          const elH = document.getElementById('stScrambleHigh');
          const elS = document.getElementById('stScrambleSolved');
          const elStr = document.getElementById('stScrambleStreak');
          if (elH) elH.textContent = `${high} P`;
          if (elS) elS.textContent = count > 0 ? `${count * 8}` : '0';
          if (elStr) elStr.textContent = count > 0 ? `${Math.min(20, count * 4)}x` : '0x';
        }
      } catch (_) {}
    });

    const stGames = document.getElementById('stGaugeGames');
    if (stGames) stGames.textContent = totalGames;

    const stSuccess = document.getElementById('stGaugeSuccess');
    if (stSuccess) {
      if (totalGames === 0) {
        stSuccess.textContent = '%0';
      } else {
        const rate = Math.min(100, Math.max(50, Math.round(75 + (totalScoreSum / (totalGames * 100)) * 25)));
        stSuccess.textContent = `%${rate}`;
      }
    }
  }

  resetAllStats() {
    const gameKeys = ['kelimelik', 'crossword', 'quiz', 'match', 'scramble'];
    gameKeys.forEach(g => {
      try {
        localStorage.removeItem(`english_easy_lb_${g}`);
      } catch (_) {}
    });
    this.gameLeaderboards = { kelimelik: [], crossword: [], quiz: [], match: [], scramble: [] };
    this.saveLeaderboards();
    this.updateStatsModalView();
    this.selectHomeGame(this.selectedHomeGameKey || 'kelimelik');
    this.showFloatingToast('🗑️ Tüm oyun geçmişi ve istatistikler sıfırlandı!', 'info');
  }

  toTurkishUpper(str) {
    return str
      .trim()
      .replace(/[\s\-]+/g, '-')
      .toLocaleUpperCase('tr-TR')
      .replace(/[^A-ZÇĞİÖŞÜ\-]/g, '');
  }

  toEnglishUpper(str) {
    return str
      .trim()
      .replace(/[\s\-]+/g, '-')
      .toUpperCase()
      .replace(/[^A-Z\-]/g, '');
  }

  normalizeInputLetter(ch, mode) {
    if (mode === 'EN_TO_TR') {
      return ch.toLocaleUpperCase('tr-TR');
    }
    if (ch === 'i' || ch === 'İ') return 'I';
    return ch.toUpperCase();
  }

  lettersMatch(inputChar, solutionChar) {
    if (!inputChar || !solutionChar) return false;
    if (inputChar === solutionChar) return true;
    if ((inputChar === 'I' || inputChar === 'İ') && (solutionChar === 'I' || solutionChar === 'İ')) {
      return true;
    }
    return false;
  }

  /* ==============================================================
     KUTLAMA ANİMASYONLARI (HAVAİ FİŞEK, KONFETİ, SERİ BANNER & ZAFER)
     ============================================================== */

  launchFireworksAndConfetti(durationMs = 3000) {
    const canvas = this.celebrationCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (this.celebrationAnimId) {
      cancelAnimationFrame(this.celebrationAnimId);
      this.celebrationAnimId = null;
    }

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.classList.remove('hidden');

    const colors = ['#f43f5e', '#f59e0b', '#10b981', '#06b6d4', '#6366f1', '#a855f7', '#ec4899', '#fde047'];
    const particles = [];

    const createFireworkBurst = (cx, cy, count = 42) => {
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.25;
        const speed = 2.5 + Math.random() * 6.5;
        particles.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.2,
          size: 4 + Math.random() * 5,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 1,
          decay: 0.012 + Math.random() * 0.012,
          shape: Math.random() < 0.5 ? 'circle' : 'rect',
          rot: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 0.2
        });
      }
    };

    // Üstten dökülen konfetiler
    for (let i = 0; i < 85; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * 180,
        vx: (Math.random() - 0.5) * 3.5,
        vy: 2.5 + Math.random() * 4.5,
        size: 6 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        decay: 0.004 + Math.random() * 0.005,
        shape: 'rect',
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.18
      });
    }

    // Havai fişek patlamaları
    createFireworkBurst(canvas.width * 0.25, canvas.height * 0.32, 44);
    createFireworkBurst(canvas.width * 0.75, canvas.height * 0.32, 44);
    setTimeout(() => {
      if (!canvas.classList.contains('hidden')) {
        createFireworkBurst(canvas.width * 0.5, canvas.height * 0.26, 54);
      }
    }, 380);
    setTimeout(() => {
      if (!canvas.classList.contains('hidden')) {
        createFireworkBurst(canvas.width * 0.35, canvas.height * 0.42, 40);
        createFireworkBurst(canvas.width * 0.65, canvas.height * 0.42, 40);
      }
    }, 760);

    const startTime = performance.now();

    const animate = (now) => {
      const elapsed = now - startTime;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.09; // yerçekimi
        p.vx *= 0.99;
        p.rot += p.vRot;
        p.alpha -= p.decay;

        if (p.alpha <= 0 || p.y > canvas.height + 40) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.6, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.65);
        }
        ctx.restore();
      }

      if (elapsed < durationMs && particles.length > 0) {
        this.celebrationAnimId = requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.classList.add('hidden');
        this.celebrationAnimId = null;
      }
    };

    this.celebrationAnimId = requestAnimationFrame(animate);
  }

  triggerStreakCelebration(streak) {
    this.sfx.playVictory();
    this.launchFireworksAndConfetti(2800);

    if (!this.streakMotivationBanner) return;
    const titles = {
      5: `🔥 5 ARKA ARKAYA DOĞRU!`,
      10: `🚀 10'LU SERİ! DURDURULAMIYORSUN!`,
      15: `⚡ 15'Lİ SERİ! KELİME USTASISIN!`,
      20: `👑 20'Lİ SERİ! MUHTEŞEM REKOR!`
    };
    if (this.streakBannerTitle) {
      this.streakBannerTitle.textContent = titles[streak] || `🎆 ${streak} ARKA ARKAYA DOĞRU SERİSİ!`;
    }
    if (this.streakBannerSub) {
      this.streakBannerSub.textContent = 'Harika gidiyorsun, bu tempoyu koru! 🔥';
    }
    this.streakMotivationBanner.classList.remove('hidden');

    if (this.streakBannerTimer) clearTimeout(this.streakBannerTimer);
    this.streakBannerTimer = setTimeout(() => {
      this.streakMotivationBanner.classList.add('hidden');
    }, 2600);
  }

  /**
   * Ekranın alt-orta kısmında şık, dikkat çekici bildirim (Toast) gösterir.
   * type: 'warning' | 'error' | 'success' | 'info'
   */
  showFloatingToast(message, type = 'warning', duration = 2800) {
    if (!this.appFloatingToast) {
      this.appFloatingToast = document.getElementById('appFloatingToast');
    }
    if (!this.appFloatingToast) return;

    this.appFloatingToast.className = `floating-app-toast toast-${type} is-visible`;
    this.appFloatingToast.textContent = message;

    if (this._floatingToastTimer) clearTimeout(this._floatingToastTimer);
    this._floatingToastTimer = setTimeout(() => {
      if (this.appFloatingToast) {
        this.appFloatingToast.classList.remove('is-visible');
        setTimeout(() => this.appFloatingToast.classList.add('hidden'), 220);
      }
    }, duration);
    this.appFloatingToast.classList.remove('hidden');
  }

  showGrandVictoryModal({ icon, badge, title, subtitle, stat1Label, stat1Val, stat2Label, stat2Val, gameKey, score }) {
    this.sfx.playVictory();
    this.launchFireworksAndConfetti(4200);

    if (!this.grandVictoryModal) return;

    // Otomatik oyun anahtarı ve puan tespiti
    const gKey = (gameKey || this.currentScreen || 'kelimelik').toLowerCase();
    let currentScore = score;
    if (typeof currentScore !== 'number') {
      if (gKey === 'kelimelik') currentScore = this.kelimelikState.score;
      else if (gKey === 'crossword') currentScore = this.crosswordScore;
      else if (gKey === 'quiz') currentScore = this.quizState.score;
      else if (gKey === 'match') currentScore = this.matchState.score;
      else if (gKey === 'scramble') currentScore = this.scrambleState.score;
      else currentScore = 0;
    }

    const rank = this.recordScore(gKey, currentScore, stat1Val ? `${stat1Label || 'Başarı'}: ${stat1Val}` : '');
    const rankBadge = `🏆 Tebrikler! Puan tablosunda ${rank}. sıradasınız!`;

    if (this.victoryBurstIcon) this.victoryBurstIcon.textContent = icon || '🏆';
    if (this.victoryGameBadge) this.victoryGameBadge.textContent = badge || 'OYUN TAMAMLANDI!';
    if (this.victoryModalTitle) this.victoryModalTitle.textContent = title || 'Tebrikler! Oyunu Tamamladınız! 🎉';
    if (this.victoryModalSubtitle) {
      this.victoryModalSubtitle.innerHTML = `${this.escapeHTML(subtitle || 'Oyunu tamamladınız!')}<br><strong style="display:inline-block; margin-top:0.45rem; color:#f59e0b; font-size:1.05rem;">${rankBadge}</strong>`;
    }
    if (this.victoryStat1Label) this.victoryStat1Label.textContent = stat1Label || 'DOĞRU / TOPLAM';
    if (this.victoryStat1Val) this.victoryStat1Val.textContent = stat1Val !== undefined ? String(stat1Val) : '-';
    if (this.victoryStat2Label) this.victoryStat2Label.textContent = stat2Label || 'TOPLAM PUAN';
    if (this.victoryStat2Val) this.victoryStat2Val.textContent = stat2Val !== undefined ? String(stat2Val) : `${currentScore} Puan`;

    this.grandVictoryModal.classList.remove('hidden');
    this.syncBodyModalLock();
  }

  closeGrandVictoryModal() {
    if (this.grandVictoryModal) {
      this.grandVictoryModal.classList.add('hidden');
    }
    this.syncBodyModalLock();
  }

  /* ==============================================================
     PUAN TABLOSU (LEADERBOARD) METOTLARI
     ============================================================== */
  loadLeaderboards() {
    try {
      const raw = localStorage.getItem('ENG_EASY_LEADERBOARDS_V1');
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          kelimelik: Array.isArray(parsed.kelimelik) ? parsed.kelimelik : [],
          crossword: Array.isArray(parsed.crossword) ? parsed.crossword : [],
          quiz: Array.isArray(parsed.quiz) ? parsed.quiz : [],
          match: Array.isArray(parsed.match) ? parsed.match : [],
          scramble: Array.isArray(parsed.scramble) ? parsed.scramble : []
        };
      }
    } catch (_) {}
    return { kelimelik: [], crossword: [], quiz: [], match: [], scramble: [] };
  }

  saveLeaderboards() {
    try {
      localStorage.setItem('ENG_EASY_LEADERBOARDS_V1', JSON.stringify(this.gameLeaderboards));
    } catch (_) {}
  }

  recordScore(gameKey, score, details = '') {
    const g = (gameKey || 'kelimelik').toLowerCase();
    if (!this.gameLeaderboards) this.gameLeaderboards = this.loadLeaderboards();
    if (!Array.isArray(this.gameLeaderboards[g])) this.gameLeaderboards[g] = [];
    const entry = {
      score: Math.max(0, Math.round(score || 0)),
      date: new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      details: details || ''
    };
    this.gameLeaderboards[g].push(entry);
    this.gameLeaderboards[g].sort((a, b) => b.score - a.score);
    if (this.gameLeaderboards[g].length > 30) {
      this.gameLeaderboards[g] = this.gameLeaderboards[g].slice(0, 30);
    }
    this.saveLeaderboards();
    const rank = this.gameLeaderboards[g].findIndex(e => e === entry) + 1;
    return rank;
  }

  resetLeaderboard(gameKey) {
    const g = (gameKey || 'kelimelik').toLowerCase();
    if (this.gameLeaderboards && this.gameLeaderboards[g]) {
      this.gameLeaderboards[g] = [];
      this.saveLeaderboards();
    }
    this.renderLeaderboardModal(g);
  }

  openLeaderboardModal(gameKey) {
    const g = (gameKey || 'kelimelik').toLowerCase();
    this.activeLeaderboardGameKey = g;
    this.renderLeaderboardModal(g);
    if (this.leaderboardModal) {
      this.leaderboardModal.classList.remove('hidden');
      this.syncBodyModalLock();
    }
  }

  closeLeaderboardModal() {
    if (this.leaderboardModal) {
      this.leaderboardModal.classList.add('hidden');
      this.syncBodyModalLock();
    }
  }

  renderLeaderboardModal(gameKey) {
    const titles = {
      kelimelik: { title: '🔤 Kelimelik — Puan Tablosu', sub: 'Zamana karşı yarışarak tahtada kazandığınız en yüksek skorlar:' },
      crossword: { title: '🧩 Çengel Bulmaca — Puan Tablosu', sub: 'Bulmacalarda kelimeleri çözerek kazandığınız en yüksek skorlar:' },
      quiz: { title: '⚡ Hızlı Kelime Testi — Puan Tablosu', sub: 'Doğru cevap serileriyle elde ettiğiniz en yüksek test skorları:' },
      match: { title: '🃏 Kelime Eşleştirme — Puan Tablosu', sub: 'Kelime çiftlerini eşleştirerek kazandığınız en yüksek skorlar:' },
      scramble: { title: '🔠 Harf Avı — Puan Tablosu', sub: 'Karışık harflerden kelimeleri kurarak ulaştığınız en yüksek skorlar:' }
    };
    const info = titles[gameKey] || { title: '🏆 Puan Tablosu', sub: 'En yüksek skorlarınız ve geçmiş başarılarınız:' };
    if (this.leaderboardTitle) this.leaderboardTitle.textContent = info.title;
    if (this.leaderboardSub) this.leaderboardSub.textContent = info.sub;

    const list = (this.gameLeaderboards && this.gameLeaderboards[gameKey]) || [];
    if (!this.leaderboardList) return;

    if (list.length === 0) {
      this.leaderboardList.innerHTML = `
        <div class="leaderboard-empty" style="text-align:center; padding: 2rem 1rem; color: #64748b;">
          <div style="font-size: 2.8rem; margin-bottom: 0.6rem;">🏆</div>
          <p style="font-weight: 700; font-size: 1.1rem; color: #1e293b; margin: 0 0 0.4rem;">Henüz Kayıtlı Skor Bulunmuyor</p>
          <span style="font-size: 0.88rem;">Oyunu oynayıp tamamladığınızda skorunuz ve dereceniz burada listelenecektir.</span>
        </div>
      `;
      return;
    }

    const medals = ['🥇', '🥈', '🥉'];
    this.leaderboardList.innerHTML = list.map((item, idx) => {
      const medal = idx < 3 ? medals[idx] : `#${idx + 1}`;
      const rankClass = idx === 0 ? 'rank-gold' : idx === 1 ? 'rank-silver' : idx === 2 ? 'rank-bronze' : '';
      return `
        <div class="leaderboard-item ${rankClass}">
          <div class="lb-left">
            <span class="lb-rank">${medal}</span>
            <div class="lb-meta">
              <span class="lb-date">${item.date}</span>
              ${item.details ? `<span class="lb-detail">${this.escapeHTML(item.details)}</span>` : ''}
            </div>
          </div>
          <div class="lb-score">${item.score} Puan</div>
        </div>
      `;
    }).join('');
  }

  /* ==============================================================
     OYUN ÖZEL REHBER / YARDIM MODALI
     ============================================================== */
  openGameHelpModal(gameKey) {
    const g = (gameKey || 'kelimelik').toLowerCase();
    this.activeHelpGameKey = g;

    const svgIcon = (type) => {
      switch (type) {
        case 'star':
          return `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fbbf24" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
        case 'target':
          return `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#38bdf8" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`;
        case 'hint':
          return `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#f59e0b" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>`;
        case 'refresh':
          return `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#34d399" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>`;
        case 'fire':
          return `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#f43f5e" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`;
        case 'sparkles':
          return `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#c084fc" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>`;
        default:
          return `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fbbf24" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
      }
    };

    const guideData = {
      kelimelik: {
        title: 'Kelimelik — Resmi Oyun Kuralları',
        sub: 'Resmi Kelimelik Kuralları ve Puanlama Rehberi:',
        items: [
          { type: 'star', title: 'İlk Kelimede Yıldız Karesi ve Bağlantı', text: 'İlk kelime yazıldığında tahtanın merkezindeki yıldızlı (★ 2K) kare mutlaka kullanılmalıdır. İlk hamleden sonraki tüm hamlelerde ise konulan yeni harfler tahtadaki kilitli taşlardan en az birine yatay ya da dikey olarak bağlanmalıdır.' },
          { type: 'target', title: 'Yatay ve Dikey Uyumluluk', text: 'Tahtada birbirine değen tüm kelimeler soldan sağa ve yukarıdan aşağıya sözlükte anlamlı olmalıdır. Bıraktığınız harflerin temas ettiği tüm yan kelimeler geçerli değilse hamle onaylanamaz.' },
          { type: 'sparkles', title: 'Sağ Üstteki Harf Puanları', text: 'Harflerin sağ üstündeki sayı o harfi kullandığınızda alacağınız puanı gösterir (örn: K¹, E¹, D², M², Z⁴). Özel çarpanlar bu harf puanlarına uygulanır.' },
          { type: 'refresh', title: 'Özel Kareler ve Süre', text: 'Harflerinizi özel karelerden geçirerek puanınızı artırın: 2H (Harf ×2), 3H (Harf ×3), 2K (Kelime ×2), 3K (Kelime ×3). Süreniz dolmadan en yüksek puanı toplayın!' }
        ]
      },
      crossword: {
        title: 'Çengel Bulmaca — Nasıl Oynanır?',
        sub: 'Klasik Çengel Bulmaca Kuralları ve Puanlama:',
        items: [
          { type: 'target', title: 'Oyunun Amacı', text: 'Izgaradaki beyaz harf kutucuklarına tıklayarak yukarıda beliren Türkçe veya İngilizce soru kelimesinin karşılığını yazın.' },
          { type: 'star', title: 'Özel Puanlama', text: 'Doğru çözülen her kelime için harf başına 50 puan kazanırsınız (örn: 6 harfli kelime = 300 puan).' },
          { type: 'hint', title: 'İpucu ve Puan Kesintisi', text: 'Nokta (.) tuşuna basarak veya İpucu butonuna dokunarak harf açabilirsiniz. Ancak her ipucu -25 puan kırar ve serinizi sıfırlar.' },
          { type: 'refresh', title: 'Yatay / Dikey Geçiş', text: 'Hücreye ikinci kez dokunarak veya Boşluk/Tab tuşuna basarak yatay ve dikey soru yönü arasında anında geçiş yapabilirsiniz.' }
        ]
      },
      quiz: {
        title: 'Hızlı Kelime Testi — Nasıl Oynanır?',
        sub: '4 Seçenekli Hızlı Test Kuralları:',
        items: [
          { type: 'target', title: 'Oyunun Amacı', text: 'Sorulan kelimenin doğru karşılığını 4 seçenek arasından en hızlı şekilde seçin.' },
          { type: 'fire', title: 'Doğru Serisi ve Puanlama', text: 'Her doğru cevap +100 puan kazandırır. Aralıksız doğru cevap verdikçe her seri adımı için ekstra +20 puan seri bonusu verilir.' },
          { type: 'sparkles', title: '5 ve 10\'lu Seri Kutlamaları', text: '5, 10, 15 gibi serilere ulaştığınızda özel canlı kutlama animasyonları ekrana gelir.' },
          { type: 'hint', title: 'İpucu Desteği', text: 'İpucu butonuna tıkladığınızda doğru şık 2 saniye boyunca turuncu renkte yanıp söner.' }
        ]
      },
      match: {
        title: 'Kelime Eşleştirme — Nasıl Oynanır?',
        sub: 'Kart Eşleştirme ve Hafıza Kuralları:',
        items: [
          { type: 'target', title: 'Oyunun Amacı', text: 'Açık olan kartlardan Türkçe ve İngilizce birbirinin karşılığı olan kelime çiftlerini seçerek eşleştirin.' },
          { type: 'star', title: 'Puanlama ve Verimlilik', text: 'Her doğru eşleştirilen çift +120 puan kazandırır. Oyunu ne kadar az hamlede tamamlarsanız o kadar yüksek verimlilik bonusu alırsınız.' },
          { type: 'hint', title: 'İpucu Desteği', text: 'Eşleşen çifti bulamazsanız İpucu butonunu kullanabilirsiniz; kullanılan her ipucu toplam puandan -30 puan kırar.' }
        ]
      },
      scramble: {
        title: 'Harf Avı (Kelime Kur) — Nasıl Oynanır?',
        sub: 'Karışık Harflerden Kelime Kurma Kuralları:',
        items: [
          { type: 'target', title: 'Oyunun Amacı', text: 'Verilen kelimenin karşılığını karışık harf taşlarına dokunarak veya doğrudan klavyeden yazarak doğru sırayla kurun.' },
          { type: 'star', title: 'Puanlama', text: 'Her doğru kurulan kelime +100 puan kazandırır. Hata yapmadan seri tamamlarsanız ek seri bonusları kazanırsınız.' },
          { type: 'hint', title: 'İpucu Desteği', text: 'Nokta (.) tuşuna basarak sıradaki harfi yerine yerleştirebilirsiniz; ancak her ipucu puanınızdan -20 puan kırar.' }
        ]
      }
    };

    const data = guideData[g] || guideData.kelimelik;
    if (this.gameHelpTitle) this.gameHelpTitle.textContent = data.title;
    if (this.gameHelpSub) this.gameHelpSub.textContent = data.sub;

    if (this.gameHelpBody) {
      this.gameHelpBody.innerHTML = data.items.map(it => `
        <div class="welcome-item">
          <div class="welcome-icon-wrap" style="width:36px; height:36px; border-radius:10px; background:rgba(245,158,11,0.12); display:flex; align-items:center; justify-content:center; flex-shrink:0;">
            ${svgIcon(it.type)}
          </div>
          <div class="welcome-text">
            <h3>${it.title}</h3>
            <p>${it.text}</p>
          </div>
        </div>
      `).join('');
    }

    if (this.gameHelpModal) {
      this.gameHelpModal.classList.remove('hidden');
      this.syncBodyModalLock();
    }
  }

  closeGameHelpModal() {
    if (this.gameHelpModal) {
      this.gameHelpModal.classList.add('hidden');
      this.syncBodyModalLock();
    }
  }

  /* ==============================================================
     KELİMELİK ZAMANLAYICI (TIMER) METOTLARI
     ============================================================== */
  startKelimelikTimer() {
    this.stopKelimelikTimer();
    this.updateKelimelikTimerUI();
    this.kelimelikState.timerInterval = setInterval(() => {
      if (this.currentScreen !== 'KELIMELIK') {
        this.stopKelimelikTimer();
        return;
      }
      this.kelimelikState.timerRemainingSeconds--;
      this.updateKelimelikTimerUI();
      if (this.kelimelikState.timerRemainingSeconds <= 0) {
        this.onKelimelikTimeExpired();
      }
    }, 1000);
  }

  stopKelimelikTimer() {
    if (this.kelimelikState && this.kelimelikState.timerInterval) {
      clearInterval(this.kelimelikState.timerInterval);
      this.kelimelikState.timerInterval = null;
    }
  }

  updateKelimelikTimerUI() {
    const timerEl = document.getElementById('kelimelikStatTimer');
    if (!timerEl) return;
    const rem = Math.max(0, this.kelimelikState.timerRemainingSeconds || 0);
    const m = Math.floor(rem / 60);
    const s = rem % 60;
    const mStr = String(m).padStart(2, '0');
    const sStr = String(s).padStart(2, '0');
    timerEl.textContent = `${mStr}:${sStr}`;
    if (rem <= 60) {
      timerEl.classList.add('urgent-time');
    } else {
      timerEl.classList.remove('urgent-time');
    }
  }

  onKelimelikTimeExpired() {
    this.stopKelimelikTimer();
    const st = this.kelimelikState;
    if (st.victoryShown) return;
    st.victoryShown = true;
    this.showGrandVictoryModal({
      icon: '⏱️',
      badge: 'SÜRE BİTTİ — KELİMELİK SONA ERDİ!',
      title: 'Süre Doldu!',
      subtitle: `Zorluğa karşı verilen sürede toplam ${st.solvedCount} kelime üreterek ${st.score} puan topladınız!`,
      stat1Label: 'ÜRETİLEN KELİME',
      stat1Val: `${st.solvedCount} Adet`,
      stat2Label: 'TOPLAM PUAN',
      stat2Val: `${st.score} Puan`,
      gameKey: 'kelimelik',
      score: st.score
    });
  }

  updateCrosswordScoreUI() {
    if (this.cwStatScoreEl) {
      this.cwStatScoreEl.textContent = this.crosswordScore || 0;
    }
  }

  showWarningModal(title, message, onClose = null) {
    this.sfx.playError();
    if (!this.warningModal) return;
    if (this.warningTitle) this.warningTitle.textContent = title || 'Yetersiz Kelime Sayısı!';
    if (this.warningMessage) this.warningMessage.textContent = message || '';
    this.pendingWarningCallback = onClose;
    this.warningModal.classList.remove('hidden');
    this.syncBodyModalLock();
  }

  closeWarningModal() {
    if (this.warningModal) {
      this.warningModal.classList.add('hidden');
    }
    this.pendingWarningCallback = null;
    this.syncBodyModalLock();
  }

  /* ==============================================================
     ÇOKLU VERİ HAVUZU YÖNETİMİ VE İÇE / DIŞA AKTARIM (IMPORT/EXPORT)
     ============================================================== */

  askConfirmation(title, message, onConfirm, confirmBtnText = '✅ Evet, Onayla') {
    if (!this.confirmModal) {
      if (typeof onConfirm === 'function') onConfirm();
      return;
    }
    this.confirmTitle.textContent = title || 'Emin misiniz?';
    this.confirmMessage.textContent = message || 'Bu işlemi onaylıyor musunuz?';
    const btnYes = document.getElementById('btnConfirmYes');
    if (btnYes) {
      btnYes.textContent = confirmBtnText;
    }
    this.pendingConfirmAction = onConfirm;
    this.confirmModal.classList.remove('hidden');
    this.syncBodyModalLock();
  }

  closeConfirmModal() {
    if (this.confirmModal) {
      this.confirmModal.classList.add('hidden');
    }
    this.pendingConfirmAction = null;
    this.syncBodyModalLock();
  }

  getEditableTargetPoolId(preferredPoolId) {
    const editablePools = this.poolState.pools.filter(p => p.id !== 'pool_all');
    if (editablePools.length === 0) return this.poolState.activePoolId;
    if (preferredPoolId && preferredPoolId !== 'pool_all' && editablePools.some(p => p.id === preferredPoolId)) {
      return preferredPoolId;
    }
    return editablePools[0].id;
  }

  populatePoolSelectElement(selectEl, selectedPoolId, excludeAllPool = false) {
    if (!selectEl) return;
    selectEl.innerHTML = '';
    const poolsToRender = excludeAllPool
      ? this.poolState.pools.filter(p => p.id !== 'pool_all')
      : this.poolState.pools;

    const effectiveSelectedId = excludeAllPool
      ? this.getEditableTargetPoolId(selectedPoolId)
      : selectedPoolId;

    poolsToRender.forEach(pool => {
      const opt = document.createElement('option');
      opt.value = pool.id;
      opt.textContent = `${pool.name} (${pool.words.length} Kelime)`;
      if (pool.id === effectiveSelectedId) opt.selected = true;
      selectEl.appendChild(opt);
    });
  }

  renderPoolSelectors() {
    const activeId = this.poolState.activePoolId;
    if (!Array.isArray(this.poolState.selectedPoolIds) || this.poolState.selectedPoolIds.length === 0) {
      this.poolState.selectedPoolIds = [activeId];
    }
    const selectedSet = new Set(this.poolState.selectedPoolIds);

    // 1. Ayarlar Modalı, Kelime Ekle Modalı (Tüm Kelimeler hariç!) ve İçe/Dışa Aktar Modalı içindeki <select> listeleri
    this.populatePoolSelectElement(this.modalPoolSelect, activeId, false);
    this.populatePoolSelectElement(this.addWordPoolSelect, activeId, true);
    this.populatePoolSelectElement(this.iePoolSelect, activeId, true);

    // 2. Tüm oyunlardaki çoklu seçimli (Checkbox) Konu açılır listeleri
    const selectedPools = this.poolState.pools.filter(p => selectedSet.has(p.id));
    const combinedCount = this.getCombinedSelectedWords().length;
    const labelText = selectedPools.length === 1
      ? `${selectedPools[0].name} (${selectedPools[0].words.length})`
      : `${selectedPools.length} Konu Seçili (${combinedCount})`;
    const summaryText = `${selectedPools.length} havuz • ${combinedCount} kelime`;

    document.querySelectorAll('[data-topic-dropdown]').forEach(wrapper => {
      const listEl = wrapper.querySelector('[data-topic-list]');
      const labelEl = wrapper.querySelector('[data-topic-label]');
      const summaryEl = wrapper.querySelector('[data-topic-summary]');
      const btnSelectAll = wrapper.querySelector('[data-topic-select-all]');

      if (labelEl) labelEl.textContent = labelText;
      if (summaryEl) summaryEl.textContent = summaryText;

      if (btnSelectAll) {
        const allPoolIds = this.poolState.pools.map(p => p.id);
        const isAllSelected = allPoolIds.length > 0 && allPoolIds.every(id => selectedSet.has(id));
        btnSelectAll.textContent = isAllSelected ? 'Tümünü Bırak' : 'Tümünü Seç';
      }

      if (listEl) {
        listEl.innerHTML = '';
        this.poolState.pools.forEach(pool => {
          const isChecked = selectedSet.has(pool.id);
          const label = document.createElement('label');
          label.className = `topic-checkbox-item ${isChecked ? 'is-checked' : ''}`;
          label.innerHTML = `
            <input type="checkbox" value="${this.escapeHTML(pool.id)}" ${isChecked ? 'checked' : ''} />
            <span class="topic-item-name">${this.escapeHTML(pool.name)}</span>
            <span class="topic-item-count">${pool.words.length}</span>
          `;
          const chk = label.querySelector('input[type="checkbox"]');
          chk.addEventListener('change', (e) => {
            this.onTopicCheckboxToggle(pool.id, e.target.checked);
          });
          listEl.appendChild(label);
        });
      }
    });

    if (this.homeActiveTopicPill) {
      this.homeActiveTopicPill.textContent = `🎯 ${labelText}`;
    }
  }

  onTopicCheckboxToggle(poolId, checked) {
    let current = new Set(this.poolState.selectedPoolIds || []);

    if (checked) {
      if (poolId !== 'pool_all' && current.size === 1 && current.has('pool_all')) {
        current.delete('pool_all');
      }
      current.add(poolId);
      this.poolState.activePoolId = poolId;
    } else {
      current.delete(poolId);
      if (current.size === 0) {
        current.add(poolId);
      }
    }

    this.poolState.selectedPoolIds = Array.from(current);
    this.saveWordPool();
    this.sfx.playType();
    this.refreshCurrentGame();
  }

  switchActivePool(poolId, regenerateImmediately = false) {
    const target = this.poolState.pools.find(p => p.id === poolId);
    if (!target) return;
    this.poolState.activePoolId = target.id;
    this.poolState.selectedPoolIds = [target.id];
    this.selectedIndices.clear();
    if (this.selectAllCheckbox) this.selectAllCheckbox.checked = false;
    this.saveWordPool();
    this.renderPoolTable();
    this.poolStatusMsg.textContent = `🎯 Aktif havuz "${target.name}" (${target.words.length} kelime) olarak seçildi.`;
    if (regenerateImmediately) {
      this.sfx.playType();
      this.refreshCurrentGame();
    }
  }

  showPoolNameEditor(mode, defaultName = '') {
    this.poolNameEditorMode = mode;
    const active = this.getActivePoolObject();
    if (this.poolNameModalTitle && this.poolNameModalSubtitle) {
      if (mode === 'RENAME' && active) {
        this.poolNameModalTitle.textContent = '✏️ Havuz Adını Değiştir';
        this.poolNameModalSubtitle.textContent = `"${active.name}" veri havuzu için yeni bir isim belirleyin.`;
      } else if (mode === 'IMPORT_NEW') {
        this.poolNameModalTitle.textContent = '✨ Yeni Havuz Olarak Kaydet';
        this.poolNameModalSubtitle.textContent = 'İçe aktarılan kelimelerin kaydedileceği yeni havuzun adını belirleyin.';
      } else {
        this.poolNameModalTitle.textContent = '➕ Yeni Havuz Oluştur';
        this.poolNameModalSubtitle.textContent = 'Özel çalışma konunuz için yeni bir veri havuzu oluşturun.';
      }
    }
    if (mode === 'RENAME' && active) {
      this.poolNameInput.value = active.name;
      this.poolNameInput.placeholder = 'Yeni havuz adını girin...';
    } else {
      this.poolNameInput.value = defaultName;
      this.poolNameInput.placeholder = 'Örn: 1. Ünite Kelimeleri, Sınav Havuzum...';
    }
    if (this.poolNameModalStatus) {
      this.poolNameModalStatus.textContent = '💡 Oluşturduğunuz havuza istediğiniz zaman kelime ekleyebilir veya oyunlarda seçebilirsiniz.';
    }
    if (this.poolNameModal) {
      this.poolNameModal.classList.remove('hidden');
    }
    this.syncBodyModalLock();
    setTimeout(() => this.poolNameInput.focus(), 50);
  }

  hidePoolNameEditor() {
    if (this.poolNameModal) {
      this.poolNameModal.classList.add('hidden');
    }
    this.poolNameEditorMode = null;
    this.pendingImportWords = null;
    this.syncBodyModalLock();
  }

  savePoolNameEditor() {
    const nameVal = (this.poolNameInput.value || '').trim();
    if (nameVal.length < 2) {
      const warn = '⚠️ Lütfen havuz için en az 2 karakterli bir isim girin.';
      this.poolStatusMsg.textContent = warn;
      if (this.poolNameModalStatus) this.poolNameModalStatus.textContent = warn;
      return;
    }

    if (this.poolNameEditorMode === 'NEW') {
      const newId = 'pool_' + Date.now();
      this.poolState.pools.push({
        id: newId,
        name: nameVal,
        words: []
      });
      this.poolState.activePoolId = newId;
      this.poolState.selectedPoolIds = [newId];
      this.selectedIndices.clear();
      this.saveWordPool();
      this.renderPoolTable();
      this.sfx.playSuccess();
      this.poolStatusMsg.textContent = `🎉 "${nameVal}" havuzu oluşturuldu! Şimdi kelime ekleyebilirsiniz.`;
    } else if (this.poolNameEditorMode === 'RENAME') {
      const active = this.getActivePoolObject();
      if (active) {
        active.name = nameVal;
        this.saveWordPool();
        this.sfx.playSuccess();
        this.poolStatusMsg.textContent = `✏️ Havuz adı "${nameVal}" olarak güncellendi.`;
      }
    } else if (this.poolNameEditorMode === 'IMPORT_NEW' && Array.isArray(this.pendingImportWords)) {
      const newId = 'pool_' + Date.now();
      this.poolState.pools.push({
        id: newId,
        name: nameVal,
        words: this.pendingImportWords
      });
      this.poolState.activePoolId = newId;
      this.poolState.selectedPoolIds = [newId];
      const count = this.pendingImportWords.length;
      this.pendingImportWords = null;
      this.importTextarea.value = '';
      this.selectedIndices.clear();
      this.saveWordPool();
      this.renderPoolTable();
      this.sfx.playSuccess();
      this.poolStatusMsg.textContent = `🎉 "${nameVal}" adıyla yeni havuz oluşturuldu ve ${count} kelime aktarıldı!`;
    }

    this.hidePoolNameEditor();
  }

  openImportExportModal() {
    if (!this.importExportModal) return;
    this.populatePoolSelectElement(this.iePoolSelect, this.poolState.activePoolId, true);
    if (this.iePoolSelect && this.iePoolSelect.value && this.iePoolSelect.value !== this.poolState.activePoolId) {
      this.switchActivePool(this.iePoolSelect.value, false);
    }
    this.updateExportPreview();
    if (this.ieModalStatus) {
      this.ieModalStatus.textContent = '💡 İpucu: Yukarıdan işlem yapmak istediğiniz veri havuzunu seçebilirsiniz.';
    }
    this.importExportModal.classList.remove('hidden');
    this.syncBodyModalLock();
  }

  closeImportExportModal() {
    if (!this.importExportModal) return;
    this.importExportModal.classList.add('hidden');
    this.syncBodyModalLock();
  }

  deleteActivePoolSet() {
    const active = this.getActivePoolObject();
    if (!active) return;

    if (active.id === 'pool_all') {
      this.poolStatusMsg.textContent = '⚠️ "Tüm Kelimeler (Genel Havuz)" diğer konu havuzlarından otomatik beslendiği için silinemez.';
      return;
    }

    const nonAllPools = this.poolState.pools.filter(p => p.id !== 'pool_all');
    if (nonAllPools.length <= 1) {
      this.poolStatusMsg.textContent = '⚠️ Sistemde en az 1 konu havuzu bulunmalıdır; son konu havuzunu silemezsiniz.';
      return;
    }

    this.askConfirmation(
      'Havuzu Silmek İstiyor musunuz?',
      `"${active.name}" veri havuzunu ve içindeki ${active.words.length} kelimeyi tamamen silmek istediğinize emin misiniz?`,
      () => {
        const removedName = active.name;
        this.poolState.pools = this.poolState.pools.filter(p => p.id !== active.id);
        this.poolState.activePoolId = this.poolState.pools[0].id;
        this.poolState.selectedPoolIds = (this.poolState.selectedPoolIds || []).filter(id => id !== active.id);
        if (this.poolState.selectedPoolIds.length === 0) {
          this.poolState.selectedPoolIds = [this.poolState.activePoolId];
        }
        this.selectedIndices.clear();
        this.saveWordPool();
        this.sfx.playDelete();
        this.renderPoolTable();
        this.poolStatusMsg.textContent = `🗑️ "${removedName}" havuzu silindi. Aktif havuz: "${this.getActivePoolObject().name}".`;
      }
    );
  }

  getSelectedImportExportPool() {
    const selectedId = this.iePoolSelect && this.iePoolSelect.value ? this.iePoolSelect.value : this.poolState.activePoolId;
    return this.poolState.pools.find(p => p.id === selectedId) || this.getActivePoolObject();
  }

  updateExportPreview() {
    const active = this.getSelectedImportExportPool();
    if (!active || !this.exportTextarea) return;
    if (this.exportPoolNameLabel) {
      this.exportPoolNameLabel.textContent = active.name;
    }
    const header = `# HAVUZ: ${active.name}`;
    const lines = active.words.map(w => `${w.tr} - ${w.en}`);
    this.exportTextarea.value = [header, ...lines].join('\n');
  }

  parseImportText(rawText) {
    const trimmed = (rawText || '').trim();
    if (!trimmed) return { poolName: null, words: [], isMultiPool: false, pools: [] };

    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const obj = JSON.parse(trimmed);
        if (Array.isArray(obj)) {
          const words = obj
            .filter(item => item && item.tr && item.en)
            .map(item => ({ tr: String(item.tr).trim(), en: String(item.en).trim() }));
          return { poolName: null, words, isMultiPool: false, pools: [] };
        } else if (obj && Array.isArray(obj.words)) {
          const words = obj.words
            .filter(item => item && item.tr && item.en)
            .map(item => ({ tr: String(item.tr).trim(), en: String(item.en).trim() }));
          return { poolName: obj.name ? String(obj.name).trim() : null, words, isMultiPool: false, pools: [] };
        }
      } catch (_) {}
    }

    const lines = trimmed.split(/\r?\n/);
    let detectedPoolName = null;
    let hasAllPoolsMarker = false;
    const words = [];
    const poolSections = [];
    let currentSection = null;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      if (line.startsWith('#')) {
        if (/^#\s*ENGLISH_IS_EASY_ALL_POOLS_V1\b/i.test(line)) {
          hasAllPoolsMarker = true;
          continue;
        }
        const match = line.match(/^#\s*(?:HAVUZ|POOL)\s*:\s*(.+)$/i);
        if (match && match[1]) {
          const pName = match[1].trim();
          if (!detectedPoolName) detectedPoolName = pName;
          currentSection = { name: pName, words: [] };
          poolSections.push(currentSection);
        }
        continue;
      }

      let parts = null;
      if (line.includes(' - ')) {
        parts = line.split(' - ');
      } else if (line.includes('\t')) {
        parts = line.split('\t');
      } else if (line.includes('=')) {
        parts = line.split('=');
      } else if (line.includes(';')) {
        parts = line.split(';');
      } else if (line.includes(',')) {
        parts = line.split(',');
      } else if (line.includes('-')) {
        parts = line.split('-');
      }

      if (parts && parts.length >= 2) {
        const tr = parts[0].trim().replace(/^["']|["']$/g, '');
        const en = parts.slice(1).join(' ').trim().replace(/^["']|["']$/g, '');
        if (this.toTurkishUpper(tr).length >= 2 && this.toEnglishUpper(en).length >= 2) {
          const pair = { tr, en };
          words.push(pair);
          if (currentSection) {
            currentSection.words.push(pair);
          }
        }
      }
    }

    const isMultiPool = hasAllPoolsMarker || poolSections.length > 1;
    return {
      poolName: detectedPoolName,
      words,
      isMultiPool,
      pools: isMultiPool ? poolSections : []
    };
  }

  handleImportFileSelect(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result || '');
      this.importTextarea.value = content;
      const parsed = this.parseImportText(content);
      let msg = '';
      if (parsed.isMultiPool) {
        msg = `📦 "${file.name}" çoklu havuz yedeği okundu (${parsed.pools.length} havuz, ${parsed.words.length} kelime). Aktarmak için "Yeni Havuz Olarak Kaydet" veya "Seçili Havuza Ekle" butonuna tıklayın.`;
      } else {
        msg = `📂 "${file.name}" okundu (${parsed.words.length} kelime bulundu). Şimdi "Seçili Havuza Ekle" veya "Yeni Havuz Olarak Kaydet" butonuna tıklayın.`;
      }
      this.poolStatusMsg.textContent = msg;
      if (this.ieModalStatus) this.ieModalStatus.textContent = msg;
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  }

  importMultiPoolBackup(poolsData) {
    if (!Array.isArray(poolsData) || poolsData.length === 0) return;

    // Eğer sadece boş "📝 Kelimelerim" yer tutucusu varsa temizle
    const nonAllBefore = this.poolState.pools.filter(p => p.id !== 'pool_all');
    if (
      nonAllBefore.length === 1 &&
      nonAllBefore[0].name === '📝 Kelimelerim' &&
      (!nonAllBefore[0].words || nonAllBefore[0].words.length === 0)
    ) {
      this.poolState.pools = this.poolState.pools.filter(p => p.id === 'pool_all');
    }

    const preExistingNames = new Set(
      this.poolState.pools
        .filter(p => p.id !== 'pool_all')
        .map(p => p.name.trim().toLowerCase())
    );
    const defaultPoolsByName = new Map(
      this.buildDefaultPoolSets().pools
        .filter(p => p.id !== 'pool_all')
        .map(p => [p.name.trim().toLowerCase(), p])
    );

    const createdNames = new Set();
    const updatedNames = new Set();
    let addedWordCount = 0;
    let firstImportedPool = null;

    poolsData.forEach((section, idx) => {
      const cleanName = (section.name || '').trim() || `Özel Havuz ${idx + 1}`;
      const normName = cleanName.toLowerCase();
      const incomingWords = Array.isArray(section.words) ? section.words : [];

      let targetPool = this.poolState.pools.find(
        p => p.id !== 'pool_all' && p.name.trim().toLowerCase() === normName
      );

      if (!targetPool) {
        const defMatch = defaultPoolsByName.get(normName);
        targetPool = {
          id: defMatch && !this.poolState.pools.some(p => p.id === defMatch.id)
            ? defMatch.id
            : `pool_custom_${Date.now()}_${idx}`,
          name: cleanName,
          isDefault: !!defMatch,
          words: []
        };
        this.poolState.pools.push(targetPool);
        createdNames.add(normName);
      } else if (preExistingNames.has(normName)) {
        updatedNames.add(normName);
      }

      if (!firstImportedPool) firstImportedPool = targetPool;

      incomingWords.forEach(item => {
        const trU = this.toTurkishUpper(item.tr);
        const enU = this.toEnglishUpper(item.en);
        const exists = targetPool.words.some(
          w => this.toTurkishUpper(w.tr) === trU && this.toEnglishUpper(w.en) === enU
        );
        if (!exists) {
          targetPool.words.push({ tr: item.tr, en: item.en });
          addedWordCount++;
        }
      });
    });

    this.poolState.userClearedAll = false;
    if (firstImportedPool) {
      this.poolState.activePoolId = firstImportedPool.id;
    } else {
      const firstTopic = this.poolState.pools.find(p => p.id !== 'pool_all');
      if (firstTopic) this.poolState.activePoolId = firstTopic.id;
    }

    this.importTextarea.value = '';
    this.syncAllWordsPool(this.poolState);
    this.saveWordPool();
    this.renderPoolSelectors();
    if (this.iePoolSelect) {
      this.populatePoolSelectElement(this.iePoolSelect, this.poolState.activePoolId, true);
      this.iePoolSelect.value = this.poolState.activePoolId;
    }
    this.renderPoolTable();
    this.updateExportPreview();
    this.sfx.playSuccess();

    const totalUniquePools = createdNames.size + updatedNames.size;
    const okMsg = `✅ ${totalUniquePools} havuz yapısı korunarak içe aktarıldı (${createdNames.size} yeni, ${updatedNames.size} mevcut havuz, +${addedWordCount} kelime)!`;
    this.poolStatusMsg.textContent = okMsg;
    if (this.ieModalStatus) this.ieModalStatus.textContent = okMsg;
  }

  importWordsToCurrentPool() {
    const parsed = this.parseImportText(this.importTextarea.value);
    if (parsed.isMultiPool) {
      this.importMultiPoolBackup(parsed.pools);
      return;
    }

    const active = this.getSelectedImportExportPool();
    if (active && active.id === 'pool_all') {
      const warn = '⚠️ "Tüm Kelimeler" havuzu diğer havuzlardan otomatik beslenir. Lütfen yukarıdan bir konu havuzu seçin veya "Yeni Havuz Olarak Kaydet" butonuna tıklayın.';
      this.poolStatusMsg.textContent = warn;
      if (this.ieModalStatus) this.ieModalStatus.textContent = warn;
      return;
    }

    const { words } = parsed;
    if (words.length === 0) {
      const warn = '⚠️ İçe aktarılacak geçerli kelime bulunamadı. Lütfen "Türkçe - İngilizce" formatında satırlar girin veya dosya seçin.';
      this.poolStatusMsg.textContent = warn;
      if (this.ieModalStatus) this.ieModalStatus.textContent = warn;
      return;
    }

    if (active && active.id !== this.poolState.activePoolId) {
      this.switchActivePool(active.id, false);
    }

    let addedCount = 0;
    words.forEach(item => {
      const trU = this.toTurkishUpper(item.tr);
      const enU = this.toEnglishUpper(item.en);
      const exists = this.wordPool.some(
        w => this.toTurkishUpper(w.tr) === trU && this.toEnglishUpper(w.en) === enU
      );
      if (!exists) {
        this.wordPool.push({ tr: item.tr, en: item.en });
        addedCount++;
      }
    });

    this.importTextarea.value = '';
    this.saveWordPool();
    this.renderPoolTable();
    this.updateExportPreview();
    this.sfx.playSuccess();
    const okMsg = `✅ ${addedCount} yeni kelime "${this.getActivePoolObject().name}" havuzuna eklendi!`;
    this.poolStatusMsg.textContent = okMsg;
    if (this.ieModalStatus) this.ieModalStatus.textContent = okMsg;
  }

  importWordsAsNewPool() {
    const parsed = this.parseImportText(this.importTextarea.value);
    if (parsed.isMultiPool) {
      this.importMultiPoolBackup(parsed.pools);
      return;
    }

    const { poolName, words } = parsed;
    if (words.length === 0) {
      const warn = '⚠️ İçe aktarılacak geçerli kelime bulunamadı. Önce metin kutusuna kelimeleri yapıştırın veya dosya seçin.';
      this.poolStatusMsg.textContent = warn;
      if (this.ieModalStatus) this.ieModalStatus.textContent = warn;
      return;
    }

    this.pendingImportWords = words;
    const suggested = poolName || `Özel Havuz (${words.length} Kelime)`;
    this.closeImportExportModal();
    this.showPoolNameEditor('IMPORT_NEW', suggested);
  }

  copyExportToClipboard() {
    this.updateExportPreview();
    const text = this.exportTextarea.value;
    if (!text) return;

    const okMsg = '📋 Havuz metni panoya kopyalandı! Arkadaşınıza hemen gönderebilirsiniz.';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        this.sfx.playHint();
        this.poolStatusMsg.textContent = okMsg;
        if (this.ieModalStatus) this.ieModalStatus.textContent = okMsg;
      }).catch(() => {
        this.fallbackCopyText();
      });
    } else {
      this.fallbackCopyText();
    }
  }

  fallbackCopyText() {
    try {
      this.exportTextarea.select();
      document.execCommand('copy');
      this.sfx.playHint();
      const okMsg = '📋 Havuz metni panoya kopyalandı! Arkadaşınıza hemen gönderebilirsiniz.';
      this.poolStatusMsg.textContent = okMsg;
      if (this.ieModalStatus) this.ieModalStatus.textContent = okMsg;
    } catch (_) {}
  }

  downloadTextFile(filename, content, mime = 'text/plain;charset=utf-8', onDone = null) {
    const finish = (info) => {
      if (typeof onDone === 'function') onDone(info);
    };

    try {
      const base64Content = btoa(unescape(encodeURIComponent(content || '')));

      if (window.AndroidNativeFile && typeof window.AndroidNativeFile.saveTextFile === 'function') {
        const raw = window.AndroidNativeFile.saveTextFile(filename, base64Content);
        const parsed = JSON.parse(raw || '{}');
        finish({
          success: !!parsed.success,
          path: parsed.path || `/storage/emulated/0/Download/${filename}`,
          error: parsed.error || ''
        });
        return;
      }

      if (window.chrome && window.chrome.webview && typeof window.chrome.webview.postMessage === 'function') {
        const cbId = `sf_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        window.__nativeSaveCallbacks = window.__nativeSaveCallbacks || {};
        window.__nativeSaveCallbacks[cbId] = (ok, pathOrErr) => {
          finish({
            success: !!ok,
            path: ok ? pathOrErr : '',
            error: ok ? '' : pathOrErr
          });
        };
        if (!window.__onNativeFileSaved) {
          window.__onNativeFileSaved = (id, ok, pathOrErr) => {
            const cb = window.__nativeSaveCallbacks && window.__nativeSaveCallbacks[id];
            if (cb) {
              delete window.__nativeSaveCallbacks[id];
              cb(ok, pathOrErr);
            }
          };
        }
        window.chrome.webview.postMessage(`SAVE_FILE:${cbId}|${filename}|${base64Content}`);
        return;
      }
    } catch (_) {}

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    finish({ success: true, path: `İndirilenler (Downloads) / ${filename}` });
  }

  downloadExportFile(format) {
    const active = this.getSelectedImportExportPool();
    if (!active) return;

    const safeName = active.name
      .toLowerCase()
      .replace(/[^a-z0-9çğıöşü]+/gi, '-')
      .replace(/^-+|-+$/g, '') || 'kelime-havuzu';

    let content = '';
    let mime = 'text/plain;charset=utf-8';
    let ext = 'txt';

    if (format === 'json') {
      content = JSON.stringify({ name: active.name, words: active.words }, null, 2);
      mime = 'application/json;charset=utf-8';
      ext = 'json';
    } else {
      this.updateExportPreview();
      content = this.exportTextarea.value;
    }

    const filename = `${safeName}.${ext}`;
    this.downloadTextFile(filename, content, mime, (res) => {
      if (res.success) {
        this.sfx.playHint();
        const okMsg = `💾 "${filename}" indirildi! Konum: ${res.path}`;
        this.poolStatusMsg.textContent = okMsg;
        if (this.ieModalStatus) this.ieModalStatus.textContent = okMsg;
      } else {
        const errMsg = `⚠️ Dosya kaydedilemedi: ${res.error || 'Bilinmeyen hata'}`;
        this.poolStatusMsg.textContent = errMsg;
        if (this.ieModalStatus) this.ieModalStatus.textContent = errMsg;
      }
    });
  }

  exportAllPoolsToTxt() {
    const rawTopicPools = this.poolState.pools.filter(p => p.id !== 'pool_all');
    if (rawTopicPools.length === 0) {
      const warn = '⚠️ Dışa aktarılacak konu havuzu bulunamadı.';
      this.poolStatusMsg.textContent = warn;
      if (this.ieModalStatus) this.ieModalStatus.textContent = warn;
      return;
    }

    const uniquePoolsMap = new Map();
    rawTopicPools.forEach(pool => {
      const cleanName = (pool.name || '').trim();
      const key = cleanName.toLowerCase();
      if (!uniquePoolsMap.has(key)) {
        uniquePoolsMap.set(key, { name: cleanName, words: [], seenWords: new Set() });
      }
      const entry = uniquePoolsMap.get(key);
      (pool.words || []).forEach(w => {
        if (!w || !w.tr || !w.en) return;
        const wKey = `${this.toTurkishUpper(w.tr)}|${this.toEnglishUpper(w.en)}`;
        if (!entry.seenWords.has(wKey)) {
          entry.seenWords.add(wKey);
          entry.words.push({ tr: w.tr, en: w.en });
        }
      });
    });

    const topicPools = Array.from(uniquePoolsMap.values());
    const blocks = ['# ENGLISH_IS_EASY_ALL_POOLS_V1'];
    let totalWords = 0;

    topicPools.forEach(pool => {
      blocks.push('');
      blocks.push(`# HAVUZ: ${pool.name}`);
      pool.words.forEach(w => {
        blocks.push(`${w.tr} - ${w.en}`);
        totalWords++;
      });
    });

    const content = blocks.join('\n');
    const filename = 'english-is-easy-tum-havuzlar.txt';
    this.downloadTextFile(filename, content, 'text/plain;charset=utf-8', (res) => {
      if (res.success) {
        this.sfx.playSuccess();
        const okMsg = `📦 Tüm havuzlar (${topicPools.length} havuz, ${totalWords} kelime) dışa aktarıldı! Konum: ${res.path}`;
        this.poolStatusMsg.textContent = okMsg;
        if (this.ieModalStatus) this.ieModalStatus.textContent = okMsg;
      } else {
        const errMsg = `⚠️ Dosya kaydedilemedi: ${res.error || 'Bilinmeyen hata'}`;
        this.poolStatusMsg.textContent = errMsg;
        if (this.ieModalStatus) this.ieModalStatus.textContent = errMsg;
      }
    });
  }

  deleteAllPools() {
    const topicPools = this.poolState.pools.filter(p => p.id !== 'pool_all');
    const totalWords = topicPools.reduce((sum, p) => sum + (p.words ? p.words.length : 0), 0);

    this.askConfirmation(
      'Tüm Havuzları Silmek İstiyor musunuz?',
      `Sistemdeki tüm ${topicPools.length} konu havuzunu ve toplam ${totalWords} kelimeyi kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz!`,
      () => {
        const placeholderPool = {
          id: `pool_custom_${Date.now()}`,
          name: '📝 Kelimelerim',
          isDefault: false,
          words: []
        };
        this.poolState.pools = [
          {
            id: 'pool_all',
            name: '🌟 Tüm Kelimeler (Genel Havuz)',
            isDefault: true,
            words: []
          },
          placeholderPool
        ];
        this.poolState.activePoolId = placeholderPool.id;
        this.poolState.selectedPoolIds = ['pool_all'];
        this.poolState.userClearedAll = true;
        this.selectedIndices.clear();
        this.saveWordPool();
        this.renderPoolSelectors();
        if (this.iePoolSelect) {
          this.populatePoolSelectElement(this.iePoolSelect, this.poolState.activePoolId, true);
        }
        this.renderPoolTable();
        this.updateExportPreview();
        this.sfx.playDelete();

        const msg = '🗑️ Tüm kelime havuzları silindi. Yeni kelimeler ekleyebilir veya yedekten içe aktarabilirsiniz.';
        this.poolStatusMsg.textContent = msg;
        if (this.ieModalStatus) this.ieModalStatus.textContent = msg;
      },
      '🗑️ Evet, Tümünü Sil'
    );
  }

  getAllDatabaseWords() {
    this.syncAllWordsPool(this.poolState);
    const allPool = this.poolState.pools.find(p => p.id === 'pool_all');
    if (allPool && Array.isArray(allPool.words) && allPool.words.length > 0) {
      return allPool.words;
    }
    const seen = new Set();
    const combined = [];
    (this.poolState.pools || []).forEach(pool => {
      (pool.words || []).forEach(w => {
        if (!w || !w.tr || !w.en) return;
        const key = `${this.toTurkishUpper(w.tr)}|${this.toEnglishUpper(w.en)}`;
        if (!seen.has(key)) {
          seen.add(key);
          combined.push(w);
        }
      });
    });
    return combined;
  }

  updatePoolCounters() {
    const combinedCount = this.getCombinedSelectedWords().length;
    const allWordsCount = this.getAllDatabaseWords().length;
    if (this.statPoolCountEl) this.statPoolCountEl.textContent = combinedCount;
    if (this.poolBadgeEl) this.poolBadgeEl.textContent = combinedCount;
    if (this.kelimelikStatPoolEl) this.kelimelikStatPoolEl.textContent = allWordsCount;
    if (this.homeActiveWordsCount) this.homeActiveWordsCount.textContent = combinedCount;
    if (this.homeTotalPoolsCount) this.homeTotalPoolsCount.textContent = this.poolState.pools.length;
  }

  openPoolModal() {
    this.selectedIndices.clear();
    this.selectAllCheckbox.checked = false;
    this.renderPoolSelectors();
    this.renderPoolTable();
    this.updateExportPreview();
    this.poolModal.classList.remove('hidden');
    if (this.poolModalScrollArea) {
      this.poolModalScrollArea.scrollTop = 0;
    }
    this.syncBodyModalLock();
  }

  closePoolModal() {
    this.hidePoolNameEditor();
    this.closeImportExportModal();
    if (this.addWordModal) {
      this.addWordModal.classList.add('hidden');
    }
    this.poolModal.classList.add('hidden');
    this.syncBodyModalLock();
  }

  openAddWordModal() {
    if (!this.addWordModal) return;
    const targetId = this.getEditableTargetPoolId(this.poolState.activePoolId);
    this.populatePoolSelectElement(this.addWordPoolSelect, targetId, true);
    const targetPool = this.poolState.pools.find(p => p.id === targetId);
    if (this.addWordTargetPoolName && targetPool) {
      this.addWordTargetPoolName.textContent = targetPool.name;
    }
    if (this.addWordModalStatus) {
      this.addWordModalStatus.textContent = '💡 Kelimenin ekleneceği konu havuzunu seçin ve Türkçe - İngilizce karşılığını girin. (Tüm Kelimeler havuzu bu havuzlardan otomatik beslenir.)';
    }
    this.inputTr.value = '';
    this.inputEn.value = '';
    this.addWordModal.classList.remove('hidden');
    this.syncBodyModalLock();
    setTimeout(() => this.inputTr.focus(), 50);
  }

  closeAddWordModal() {
    if (!this.addWordModal) return;
    this.addWordModal.classList.add('hidden');
    this.syncBodyModalLock();
  }

  getFilteredPoolWithIndices() {
    const q = (this.searchPoolInput.value || '').trim().toLocaleLowerCase('tr-TR');
    return this.wordPool
      .map((item, index) => ({ ...item, index }))
      .filter(item => {
        if (!q) return true;
        return (
          item.tr.toLocaleLowerCase('tr-TR').includes(q) ||
          item.en.toLowerCase().includes(q)
        );
      });
  }

  renderPoolTable() {
    const filtered = this.getFilteredPoolWithIndices();
    this.poolTableBody.innerHTML = '';

    if (filtered.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="6" style="text-align:center; padding: 24px; color: #6366f1; font-weight: 700;">
        Bu havuzda henüz kelime yok veya aramanızla eşleşen kelime bulunamadı. "Yeni Kelime Ekle" veya "İçe / Dışa Aktar" butonlarını kullanabilirsiniz.
      </td>`;
      this.poolTableBody.appendChild(tr);
    } else {
      filtered.forEach((item, rowNum) => {
        const tr = document.createElement('tr');
        const isChecked = this.selectedIndices.has(item.index);

        tr.innerHTML = `
          <td><input type="checkbox" class="row-check" data-idx="${item.index}" ${isChecked ? 'checked' : ''} /></td>
          <td>${rowNum + 1}</td>
          <td><strong>${this.escapeHTML(item.tr)}</strong></td>
          <td><span class="badge-en">${this.escapeHTML(item.en)}</span></td>
          <td>${item.tr.length}/${item.en.length}</td>
          <td>
            <button type="button" class="btn-row-delete btn-icon-round" data-del-idx="${item.index}" title="Kelimeyi Sil" aria-label="Kelimeyi Sil">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#ef4444" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
            </button>
          </td>
        `;
        this.poolTableBody.appendChild(tr);
      });
    }

    this.poolTableBody.querySelectorAll('.row-check').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const idx = parseInt(e.target.dataset.idx, 10);
        if (e.target.checked) {
          this.selectedIndices.add(idx);
        } else {
          this.selectedIndices.delete(idx);
        }
        this.updateSelectionUI();
      });
    });

    this.poolTableBody.querySelectorAll('.btn-row-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetBtn = e.target.closest('.btn-row-delete') || btn;
        const idx = parseInt(targetBtn.dataset.delIdx, 10);
        this.removeSingleWordFromPool(idx);
      });
    });

    this.updateSelectionUI();
  }

  updateSelectionUI() {
    const count = this.selectedIndices.size;
    this.selectedCountEl.textContent = count;
    this.btnDeleteSelected.disabled = count === 0;
  }

  addWordToPool() {
    const trVal = this.inputTr.value.trim();
    const enVal = this.inputEn.value.trim();
    const trCheck = this.toTurkishUpper(trVal);
    const enCheck = this.toEnglishUpper(enVal);

    if (trCheck.length < 2 || enCheck.length < 2) {
      const msg = '⚠️ Lütfen geçerli bir Türkçe ve İngilizce karşılık (en az 2 harf) girin.';
      this.poolStatusMsg.textContent = msg;
      if (this.addWordModalStatus) this.addWordModalStatus.textContent = msg;
      return;
    }

    // Seçilen hedef havuzu bul ("Tüm Kelimeler / pool_all" havuzuna doğrudan ekleme yapılamaz)
    const rawPoolId = (this.addWordPoolSelect && this.addWordPoolSelect.value) || this.poolState.activePoolId;
    const targetPoolId = this.getEditableTargetPoolId(rawPoolId);
    const targetPool = this.poolState.pools.find(p => p.id === targetPoolId);
    if (!targetPool || targetPool.id === 'pool_all') {
      const msg = '⚠️ "Tüm Kelimeler" havuzu diğer havuzlardan otomatik beslenir. Lütfen eklenecek bir konu havuzu seçin.';
      this.poolStatusMsg.textContent = msg;
      if (this.addWordModalStatus) this.addWordModalStatus.textContent = msg;
      return;
    }

    const exists = targetPool.words.some(
      w =>
        this.toEnglishUpper(w.en) === enCheck &&
        this.toTurkishUpper(w.tr) === trCheck
    );
    if (exists) {
      const msg = `⚠️ "${trVal} - ${enVal}" zaten "${targetPool.name}" havuzunda mevcut.`;
      this.poolStatusMsg.textContent = msg;
      if (this.addWordModalStatus) this.addWordModalStatus.textContent = msg;
      return;
    }

    targetPool.words.unshift({ tr: trVal, en: enVal });
    this.poolState.activePoolId = targetPool.id;
    this.saveWordPool();
    if (this.addWordPoolSelect) {
      this.addWordPoolSelect.value = targetPool.id;
    }
    this.inputTr.value = '';
    this.inputEn.value = '';
    this.sfx.playSuccess();
    const okMsg = `✅ "${trVal} ⇄ ${enVal}" başarıyla "${targetPool.name}" havuzuna eklendi! (Tüm Kelimeler havuzu otomatik güncellendi.)`;
    this.poolStatusMsg.textContent = okMsg;
    if (this.addWordModalStatus) this.addWordModalStatus.textContent = okMsg;
    this.renderPoolTable();
    this.inputTr.focus();
  }

  removeSingleWordFromPool(index) {
    const removed = this.wordPool[index];
    if (!removed) return;
    const active = this.getActivePoolObject();
    const poolTitle = active ? active.name : 'Veri Havuzu';

    this.askConfirmation(
      'Kelimeyi Silmek İstiyor musunuz?',
      `"${removed.tr} - ${removed.en}" kelimesini "${poolTitle}" içinden silmek istediğinize emin misiniz?`,
      () => {
        const trU = this.toTurkishUpper(removed.tr);
        const enU = this.toEnglishUpper(removed.en);
        if (active && active.id === 'pool_all') {
          this.poolState.pools.forEach(p => {
            if (p.id === 'pool_all') return;
            p.words = (p.words || []).filter(w => !(this.toTurkishUpper(w.tr) === trU && this.toEnglishUpper(w.en) === enU));
          });
        } else {
          this.wordPool.splice(index, 1);
        }
        this.selectedIndices.clear();
        this.saveWordPool();
        this.sfx.playDelete();
        this.poolStatusMsg.textContent = `🗑️ "${removed.tr} (${removed.en})" havuzdan çıkarıldı.`;
        this.renderPoolTable();
      }
    );
  }

  deleteSelectedFromPool() {
    if (this.selectedIndices.size === 0) return;
    const count = this.selectedIndices.size;
    const active = this.getActivePoolObject();
    const poolTitle = active ? active.name : 'Veri Havuzu';

    this.askConfirmation(
      'Seçilen Kelimeleri Silmek İstiyor musunuz?',
      `Seçtiğiniz ${count} kelimeyi "${poolTitle}" içinden silmek istediğinize emin misiniz?`,
      () => {
        if (active && active.id === 'pool_all') {
          const keysToRemove = new Set();
          this.wordPool.forEach((w, idx) => {
            if (this.selectedIndices.has(idx)) {
              keysToRemove.add(`${this.toTurkishUpper(w.tr)}|${this.toEnglishUpper(w.en)}`);
            }
          });
          this.poolState.pools.forEach(p => {
            if (p.id === 'pool_all') return;
            p.words = (p.words || []).filter(w => !keysToRemove.has(`${this.toTurkishUpper(w.tr)}|${this.toEnglishUpper(w.en)}`));
          });
        } else {
          this.wordPool = this.wordPool.filter((_, idx) => !this.selectedIndices.has(idx));
        }
        this.selectedIndices.clear();
        this.selectAllCheckbox.checked = false;
        this.saveWordPool();
        this.sfx.playDelete();
        this.poolStatusMsg.textContent = `🗑️ Seçilen ${count} kelime havuzdan silindi.`;
        this.renderPoolTable();
      }
    );
  }

  /* ==========================================
     ÇİFT YÖNLÜ ÇENGEL BULMACA ÜRETİM MOTORU
     ========================================== */

  generateNewPuzzle() {
    this.victoryToast.classList.add('hidden');
    this.crosswordVictoryShown = false;
    this.crosswordHintsUsed = 0;
    this.crosswordStreak = 0;
    this.crosswordScore = 0;
    this.updateCrosswordScoreUI();
    const N = this.gridSize;

    // Checkbox ile seçili olan tüm konu havuzlarının kelimelerini birleştirerek bulmaca üret
    const sourceWords = this.getCombinedSelectedWords();
    const validBaseItems = sourceWords
      .map((w, idx) => ({
        poolId: idx,
        trDisplay: w.tr.trim(),
        trUpper: this.toTurkishUpper(w.tr),
        enUpper: this.toEnglishUpper(w.en)
      }))
      .filter(w => w.trUpper.length >= 2 && w.enUpper.length >= 2);

    if (validBaseItems.length === 0) {
      this.gridEl.style.width = 'auto';
      this.gridEl.style.height = 'auto';
      this.gridEl.style.gridTemplateColumns = '1fr';
      this.gridEl.style.gridTemplateRows = 'auto';
      this.gridEl.innerHTML = `<div style="padding: 32px; text-align:center; color:#4f46e5; font-weight:800;">
        Seçili veri havuzunda henüz kelime yok! Lütfen <strong>🗂️ Havuzlar</strong> menüsünden kelime ekleyin veya başka bir konu havuzu seçin.
      </div>`;
      this.placedWords = [];
      this.updateStats();
      this.renderActiveWordsSidebar();
      return;
    }

    let bestLayout = null;
    const attempts = 16;

    for (let attempt = 0; attempt < attempts; attempt++) {
      const candidates = validBaseItems
        .map(item => {
          const canTrToEn = item.enUpper.length <= N - 1;
          const canEnToTr = item.trUpper.length <= N - 1;

          let mode;
          if (this.gameMode === 'TR_TO_EN') {
            if (!canTrToEn) return null;
            mode = 'TR_TO_EN';
          } else if (this.gameMode === 'EN_TO_TR') {
            if (!canEnToTr) return null;
            mode = 'EN_TO_TR';
          } else {
            if (!canTrToEn && !canEnToTr) return null;
            mode = Math.random() < 0.5 ? 'TR_TO_EN' : 'EN_TO_TR';
            if (mode === 'TR_TO_EN' && !canTrToEn) mode = 'EN_TO_TR';
            if (mode === 'EN_TO_TR' && !canEnToTr) mode = 'TR_TO_EN';
          }

          return {
            poolId: item.poolId,
            tr: item.trDisplay,
            en: item.enUpper,
            mode,
            question: mode === 'TR_TO_EN' ? item.trDisplay : item.enUpper,
            answer: mode === 'TR_TO_EN' ? item.enUpper : item.trUpper
          };
        })
        .filter(Boolean);

      const candidateLayout = this.tryBuildLayout(N, candidates);
      if (
        !bestLayout ||
        candidateLayout.placedWords.length > bestLayout.placedWords.length ||
        (candidateLayout.placedWords.length === bestLayout.placedWords.length &&
          candidateLayout.intersections > bestLayout.intersections)
      ) {
        bestLayout = candidateLayout;
      }
    }

    this.grid = bestLayout.grid;
    this.placedWords = bestLayout.placedWords;
    if (this.placedWords.length > 0) {
      const firstWord = this.placedWords[0];
      this.activeWordId = firstWord.id;
      const firstEditable = firstWord.cells.find(pos => this.grid[pos.r][pos.c].solution !== '-') || firstWord.cells[0];
      this.focusedCell = { ...firstEditable };
    } else {
      this.activeWordId = null;
      this.focusedCell = null;
    }

    this.renderGrid();
    this.renderActiveWordsSidebar();
    if (this.gridScrollContainer) {
      this.gridScrollContainer.scrollTop = 0;
      this.gridScrollContainer.scrollLeft = 0;
    }
    this.updateHighlightAndBanner(false);
    this.updateStats();
  }

  tryBuildLayout(N, candidates) {
    const grid = Array.from({ length: N }, (_, r) =>
      Array.from({ length: N }, (_, c) => ({
        r,
        c,
        type: 'EMPTY',
        solution: '',
        userChar: '',
        lockedCorrect: false,
        clues: [],
        wordIds: [],
        entryArrows: []
      }))
    );

    const shuffled = this.shuffleArray([...candidates]);
    const placedWords = [];
    const usedPoolIds = new Set();
    let totalIntersections = 0;

    const firstSeed = shuffled.find(w => w.answer.length >= 4 && w.answer.length <= N - 2) || shuffled[0];
    if (firstSeed) {
      const dir = Math.random() < 0.5 ? 'H' : 'V';
      const clueRow = dir === 'H' ? Math.floor(N / 2) : Math.floor((N - firstSeed.answer.length - 1) / 2);
      const clueCol = dir === 'H' ? Math.floor((N - firstSeed.answer.length - 1) / 2) : Math.floor(N / 2);

      if (this.canPlaceWord(grid, placedWords, N, firstSeed.answer, clueRow, clueCol, dir)) {
        this.commitWord(grid, placedWords, firstSeed, clueRow, clueCol, dir);
        usedPoolIds.add(firstSeed.poolId);
      }
    }

    for (let pass = 0; pass < 3; pass++) {
      for (const wordObj of shuffled) {
        if (usedPoolIds.has(wordObj.poolId)) continue;

        const bestMove = this.findBestIntersectionMove(grid, placedWords, N, wordObj.answer);
        if (bestMove) {
          this.commitWord(grid, placedWords, wordObj, bestMove.clueRow, bestMove.clueCol, bestMove.dir);
          usedPoolIds.add(wordObj.poolId);
          totalIntersections += bestMove.intersections;
        }
      }
    }

    for (const wordObj of shuffled) {
      if (usedPoolIds.has(wordObj.poolId)) continue;
      if (placedWords.length >= Math.floor(N * 2.2)) break;

      const freeMove = this.findFreeSlotMove(grid, placedWords, N, wordObj.answer);
      if (freeMove) {
        this.commitWord(grid, placedWords, wordObj, freeMove.clueRow, freeMove.clueCol, freeMove.dir);
        usedPoolIds.add(wordObj.poolId);
      }
    }

    return { grid, placedWords, intersections: totalIntersections };
  }

  findBestIntersectionMove(grid, placedWords, N, answerWord) {
    const L = answerWord.length;
    const moves = [];

    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const cell = grid[r][c];
        if (cell.type !== 'LETTER') continue;

        for (let i = 0; i < L; i++) {
          if (answerWord[i] !== cell.solution) continue;

          const clueColH = c - i - 1;
          const clueRowH = r;
          const scoreH = this.evaluatePlacement(grid, placedWords, N, answerWord, clueRowH, clueColH, 'H');
          if (scoreH > 0) {
            moves.push({ clueRow: clueRowH, clueCol: clueColH, dir: 'H', intersections: scoreH });
          }

          const clueRowV = r - i - 1;
          const clueColV = c;
          const scoreV = this.evaluatePlacement(grid, placedWords, N, answerWord, clueRowV, clueColV, 'V');
          if (scoreV > 0) {
            moves.push({ clueRow: clueRowV, clueCol: clueColV, dir: 'V', intersections: scoreV });
          }
        }
      }
    }

    if (moves.length === 0) return null;
    moves.sort((a, b) => b.intersections - a.intersections);
    return moves[0];
  }

  findFreeSlotMove(grid, placedWords, N, answerWord) {
    const coords = [];
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        coords.push({ r, c, dir: Math.random() < 0.5 ? 'H' : 'V' });
      }
    }
    this.shuffleArray(coords);

    for (const item of coords) {
      if (this.canPlaceWord(grid, placedWords, N, answerWord, item.r, item.c, item.dir)) {
        return { clueRow: item.r, clueCol: item.c, dir: item.dir };
      }
    }
    return null;
  }

  evaluatePlacement(grid, placedWords, N, answerWord, clueRow, clueCol, dir) {
    if (!this.canPlaceWord(grid, placedWords, N, answerWord, clueRow, clueCol, dir)) return -1;

    const dr = dir === 'V' ? 1 : 0;
    const dc = dir === 'H' ? 1 : 0;
    let intersections = 0;

    for (let i = 0; i < answerWord.length; i++) {
      const r = clueRow + dr * (i + 1);
      const c = clueCol + dc * (i + 1);
      if (grid[r][c].type === 'LETTER' && grid[r][c].solution === answerWord[i]) {
        intersections++;
      }
    }
    return intersections;
  }

  canPlaceWord(grid, placedWords, N, answerWord, clueRow, clueCol, dir) {
    const dr = dir === 'V' ? 1 : 0;
    const dc = dir === 'H' ? 1 : 0;
    const L = answerWord.length;

    if (clueRow < 0 || clueRow >= N || clueCol < 0 || clueCol >= N) return false;
    const endRow = clueRow + dr * L;
    const endCol = clueCol + dc * L;
    if (endRow < 0 || endRow >= N || endCol < 0 || endCol >= N) return false;

    const clueCell = grid[clueRow][clueCol];
    if (clueCell.type === 'LETTER') return false;
    if (clueCell.type === 'CLUE') {
      if (clueCell.clues.length >= 2) return false;
      if (clueCell.clues.some(cl => cl.dir === dir)) return false;
    }

    const afterRow = endRow + dr;
    const afterCol = endCol + dc;
    if (afterRow >= 0 && afterRow < N && afterCol >= 0 && afterCol < N) {
      if (grid[afterRow][afterCol].type === 'LETTER') return false;
    }

    for (let i = 0; i < L; i++) {
      const r = clueRow + dr * (i + 1);
      const c = clueCol + dc * (i + 1);
      const cell = grid[r][c];

      if (cell.type === 'CLUE') return false;

      if (cell.type === 'LETTER') {
        if (cell.solution !== answerWord[i]) return false;

        const hasSameDirWord = cell.wordIds.some(wId => {
          const existing = placedWords.find(w => w.id === wId);
          return existing && existing.dir === dir;
        });
        if (hasSameDirWord) return false;
      } else {
        const perpCoords = dir === 'H' ? [[r - 1, c], [r + 1, c]] : [[r, c - 1], [r, c + 1]];
        for (const [pr, pc] of perpCoords) {
          if (pr >= 0 && pr < N && pc >= 0 && pc < N) {
            if (grid[pr][pc].type === 'LETTER') return false;
          }
        }
      }
    }

    return true;
  }

  commitWord(grid, placedWords, wordObj, clueRow, clueCol, dir) {
    const id = 'W_' + (placedWords.length + 1);
    const dr = dir === 'V' ? 1 : 0;
    const dc = dir === 'H' ? 1 : 0;

    const clueCell = grid[clueRow][clueCol];
    clueCell.type = 'CLUE';
    clueCell.clues.push({
      wordId: id,
      question: wordObj.question,
      answer: wordObj.answer,
      mode: wordObj.mode,
      dir
    });
    clueCell.clues.sort((a, b) => (a.dir === 'H' ? -1 : 1) - (b.dir === 'H' ? -1 : 1));

    const cells = [];
    for (let i = 0; i < wordObj.answer.length; i++) {
      const r = clueRow + dr * (i + 1);
      const c = clueCol + dc * (i + 1);
      const cell = grid[r][c];
      cell.type = 'LETTER';
      cell.solution = wordObj.answer[i];
      if (cell.solution === '-') {
        cell.userChar = '-';
        cell.lockedCorrect = true;
      }
      if (!cell.wordIds.includes(id)) {
        cell.wordIds.push(id);
      }
      if (i === 0) {
        const arrowType = dir === 'H' ? 'RIGHT' : 'DOWN';
        if (!cell.entryArrows.includes(arrowType)) {
          cell.entryArrows.push(arrowType);
        }
      }
      cells.push({ r, c });
    }

    placedWords.push({
      id,
      tr: wordObj.tr,
      en: wordObj.en,
      question: wordObj.question,
      answer: wordObj.answer,
      mode: wordObj.mode,
      dir,
      clueRow,
      clueCol,
      startRow: clueRow + dr,
      startCol: clueCol + dc,
      cells,
      solved: false
    });
  }

  /* ==========================================
     EKRAN ÇİZİMİ VE OTOMATİK KONTROL MANTIĞI
     ========================================== */

  initMobileKeyboardViewportHandler() {
    this.maxScreenHeight = Math.max(window.innerHeight, window.screen ? window.screen.height : 0);

    const updateViewportLayout = () => {
      const vv = window.visualViewport;
      const currentH = vv ? vv.height : window.innerHeight;
      if (currentH > this.maxScreenHeight) {
        this.maxScreenHeight = currentH;
      }

      document.documentElement.style.setProperty('--vvh', `${Math.round(currentH)}px`);

      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isKeyboardVisible = isTouchDevice && (this.maxScreenHeight - currentH > 120);

      const wasOpen = document.body.classList.contains('keyboard-open');
      document.body.classList.toggle('keyboard-open', isKeyboardVisible);

      if (isKeyboardVisible) {
        window.scrollTo(0, 0);
        this.centerFocusedCellInGrid();
        setTimeout(() => this.centerFocusedCellInGrid(), 80);
        setTimeout(() => this.centerFocusedCellInGrid(), 240);
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateViewportLayout);
      window.visualViewport.addEventListener('scroll', updateViewportLayout);
    }
    window.addEventListener('resize', updateViewportLayout);

    if (this.hiddenInput) {
      this.hiddenInput.addEventListener('blur', () => {
        if (this.isResettingInput) return;
        setTimeout(() => {
          const vv = window.visualViewport;
          const currentH = vv ? vv.height : window.innerHeight;
          if (this.maxScreenHeight - currentH <= 120) {
            document.body.classList.remove('keyboard-open');
          }
        }, 120);
      });
    }
  }

  centerFocusedCellInGrid() {
    if (!this.focusedCell || !this.gridScrollContainer) return;
    const focusEl = this.getCellElement(this.focusedCell.r, this.focusedCell.c);
    if (!focusEl) return;

    const container = this.gridScrollContainer;
    const containerRect = container.getBoundingClientRect();
    const cellRect = focusEl.getBoundingClientRect();

    const cellCenterX = cellRect.left + (cellRect.width / 2);
    const cellCenterY = cellRect.top + (cellRect.height / 2);
    const containerCenterX = containerRect.left + (containerRect.width / 2);
    const containerCenterY = containerRect.top + (containerRect.height / 2);

    const deltaX = cellCenterX - containerCenterX;
    const deltaY = cellCenterY - containerCenterY;

    container.scrollTo({
      left: Math.max(0, container.scrollLeft + deltaX),
      top: Math.max(0, container.scrollTop + deltaY),
      behavior: 'smooth'
    });
  }

  initDragToPanGrid() {
    const container = this.gridScrollContainer;
    if (!container) return;

    let isDown = false;
    let startX = 0;
    let startY = 0;
    let scrollLeft = 0;
    let scrollTop = 0;
    this.wasGridDragged = false;

    container.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      isDown = true;
      this.wasGridDragged = false;
      startX = e.pageX - container.offsetLeft;
      startY = e.pageY - container.offsetTop;
      scrollLeft = container.scrollLeft;
      scrollTop = container.scrollTop;
    });

    window.addEventListener('mouseup', () => {
      isDown = false;
      container.classList.remove('is-dragging');
    });

    container.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      const x = e.pageX - container.offsetLeft;
      const y = e.pageY - container.offsetTop;
      const walkX = x - startX;
      const walkY = y - startY;

      if (Math.abs(walkX) > 6 || Math.abs(walkY) > 6) {
        this.wasGridDragged = true;
        container.classList.add('is-dragging');
        e.preventDefault();
        container.scrollLeft = scrollLeft - walkX;
        container.scrollTop = scrollTop - walkY;
      }
    });

    let isPinching = false;
    let initialPinchDistance = 0;
    let initialZoomScale = 1.0;
    let pinchCenterRatioX = 0.5;
    let pinchCenterRatioY = 0.5;

    const getTouchDistance = (t1, t2) => {
      const dx = t1.clientX - t2.clientX;
      const dy = t1.clientY - t2.clientY;
      return Math.hypot(dx, dy);
    };

    container.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        isPinching = true;
        this.wasGridDragged = true;
        initialPinchDistance = getTouchDistance(e.touches[0], e.touches[1]);
        initialZoomScale = this.zoomScale;

        const rect = container.getBoundingClientRect();
        const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
        const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;

        pinchCenterRatioX = (container.scrollLeft + midX) / Math.max(1, container.scrollWidth);
        pinchCenterRatioY = (container.scrollTop + midY) / Math.max(1, container.scrollHeight);
      } else if (e.touches.length === 1) {
        this.wasGridDragged = false;
      }
    }, { passive: true });

    container.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2) {
        if (!isPinching) {
          isPinching = true;
          this.wasGridDragged = true;
          initialPinchDistance = getTouchDistance(e.touches[0], e.touches[1]);
          initialZoomScale = this.zoomScale;

          const rect = container.getBoundingClientRect();
          const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
          const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;

          pinchCenterRatioX = (container.scrollLeft + midX) / Math.max(1, container.scrollWidth);
          pinchCenterRatioY = (container.scrollTop + midY) / Math.max(1, container.scrollHeight);
        }

        e.preventDefault();
        const currentDist = getTouchDistance(e.touches[0], e.touches[1]);
        if (initialPinchDistance > 10) {
          const factor = currentDist / initialPinchDistance;
          const nextZoom = Math.min(2.4, Math.max(0.40, +(initialZoomScale * factor).toFixed(2)));
          if (Math.abs(nextZoom - this.zoomScale) >= 0.01) {
            this.zoomScale = nextZoom;
            this.applyResponsiveGridScale();

            const rect = container.getBoundingClientRect();
            const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
            const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;

            container.scrollLeft = pinchCenterRatioX * container.scrollWidth - midX;
            container.scrollTop = pinchCenterRatioY * container.scrollHeight - midY;
          }
        }
      }
    }, { passive: false });

    const endTouch = (e) => {
      if (e.touches.length < 2) {
        isPinching = false;
      }
    };
    container.addEventListener('touchend', endTouch);
    container.addEventListener('touchcancel', endTouch);

    container.addEventListener('wheel', (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.1 : -0.1;
        this.zoomScale = Math.min(2.4, Math.max(0.40, +(this.zoomScale + delta).toFixed(2)));
        this.applyResponsiveGridScale();
      }
    }, { passive: false });
  }

  applyResponsiveGridScale() {
    const N = this.gridSize;
    const isDesktop = window.innerWidth > 768;
    const rootStyle = document.documentElement.style;

    if (!isDesktop) {
      // Mobil tarafta geniş açılı, doğal ve rahat oynanabilir hücre boyutları
      const baseCellMap = { 12: 32, 16: 28, 20: 24 };
      const basePx = baseCellMap[N] || 28;
      const cellPx = Math.max(16, Math.min(85, Math.round(basePx * this.zoomScale)));

      const gapPx = Math.max(1, Math.round(2 * Math.min(1.2, this.zoomScale)));
      const letterPx = Math.max(9, Math.round(cellPx * 0.45));
      const cluePx = Math.max(5.8, +(cellPx * 0.20).toFixed(1));
      const clueDualPx = Math.max(5.2, +(cellPx * 0.17).toFixed(1));
      const arrowPx = Math.max(6, +(cellPx * 0.21).toFixed(1));

      rootStyle.setProperty('--cell-size', `${cellPx}px`);
      rootStyle.setProperty('--cell-width', `${cellPx}px`);
      rootStyle.setProperty('--cell-height', `${cellPx}px`);
      rootStyle.setProperty('--grid-gap', `${gapPx}px`);
      rootStyle.setProperty('--letter-font-size', `${letterPx}px`);
      rootStyle.setProperty('--clue-font-size', `${cluePx}px`);
      rootStyle.setProperty('--clue-dual-font-size', `${clueDualPx}px`);
      rootStyle.setProperty('--clue-arrow-size', `${arrowPx}px`);

      this.gridEl.style.width = '';
      this.gridEl.style.height = '';
      this.gridEl.style.gridTemplateColumns = `repeat(${N}, var(--cell-width))`;
      this.gridEl.style.gridTemplateRows = '';
      return;
    }

    // Masaüstü / EXE: Sol tarafta ızgara her zaman KARE (1:1) formunu korusun ve ekrana tam sığsın.
    // Önce mevcut ızgara boyutunu sıfırla ki kapsayıcıyı (gridScrollContainer) esnetmesin.
    this.gridEl.style.width = '0px';
    this.gridEl.style.height = '0px';

    const rect = this.gridScrollContainer ? this.gridScrollContainer.getBoundingClientRect() : null;
    const rawW = (this.gridScrollContainer && this.gridScrollContainer.clientWidth) || (window.innerWidth - 390);
    const rawH = (this.gridScrollContainer && this.gridScrollContainer.clientHeight) || (window.innerHeight - 240);
    const viewportAvailH = (rect && rect.top > 0)
      ? Math.max(200, Math.floor(window.innerHeight - rect.top - 26))
      : (window.innerHeight - 240);

    const containerW = rawW;
    const containerH = Math.min(rawH, viewportAvailH);

    const scaleFactor = Math.max(1, this.zoomScale);
    const maxSquareSide = Math.max(220, Math.floor((Math.min(containerW, containerH) - 16) * scaleFactor));

    const rawCell = maxSquareSide / N;
    const gapPx = rawCell < 36 ? 2 : 3;
    const boardPad = 15; // padding(5*2) + border(2.5*2)

    const cellPx = Math.max(16, Math.floor((maxSquareSide - boardPad - (N - 1) * gapPx) / N));
    const exactBoardPx = N * cellPx + (N - 1) * gapPx + boardPad;

    const letterPx = Math.max(9, Math.round(cellPx * 0.45));
    const cluePx = Math.max(6.2, +(cellPx * 0.205).toFixed(1));
    const clueDualPx = Math.max(5.6, +(cellPx * 0.175).toFixed(1));
    const arrowPx = Math.max(6.5, +(cellPx * 0.215).toFixed(1));

    rootStyle.setProperty('--cell-size', `${cellPx}px`);
    rootStyle.setProperty('--cell-width', `${cellPx}px`);
    rootStyle.setProperty('--cell-height', `${cellPx}px`);
    rootStyle.setProperty('--grid-gap', `${gapPx}px`);
    rootStyle.setProperty('--letter-font-size', `${letterPx}px`);
    rootStyle.setProperty('--clue-font-size', `${cluePx}px`);
    rootStyle.setProperty('--clue-dual-font-size', `${clueDualPx}px`);
    rootStyle.setProperty('--clue-arrow-size', `${arrowPx}px`);

    this.gridEl.style.width = `${exactBoardPx}px`;
    this.gridEl.style.height = `${exactBoardPx}px`;
    this.gridEl.style.gridTemplateColumns = `repeat(${N}, ${cellPx}px)`;
    this.gridEl.style.gridTemplateRows = `repeat(${N}, ${cellPx}px)`;
  }

  renderGrid() {
    this.applyResponsiveGridScale();
    if (window.innerWidth > 768) {
      requestAnimationFrame(() => this.applyResponsiveGridScale());
    }
    const N = this.gridSize;
    this.gridEl.innerHTML = '';

    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const cellData = this.grid[r][c];
        const cellDiv = document.createElement('div');
        cellDiv.className = 'cw-cell';
        cellDiv.dataset.r = r;
        cellDiv.dataset.c = c;

        if (cellData.type === 'EMPTY') {
          cellDiv.classList.add('cell-block');
        } else if (cellData.type === 'CLUE') {
          cellDiv.classList.add('cell-clue');
          if (cellData.clues.length > 1) {
            cellDiv.classList.add('dual-clue');
          }
          cellData.clues.forEach(cl => {
            const sub = document.createElement('div');
            sub.className = `clue-sub ${cl.mode === 'EN_TO_TR' ? 'lang-en-to-tr' : 'lang-tr-to-en'}`;
            sub.dataset.wordId = cl.wordId;
            const arrowSymbol = cl.dir === 'H' ? '➔' : '⬇';
            sub.innerHTML = `
              <span class="clue-word">${this.escapeHTML(cl.question)}</span>
              <span class="clue-arrow-badge">${arrowSymbol}</span>
            `;
            sub.addEventListener('click', (e) => {
              e.stopPropagation();
              this.selectWordById(cl.wordId);
            });
            cellDiv.appendChild(sub);
          });
          cellDiv.addEventListener('click', () => {
            if (cellData.clues.length === 1) {
              this.selectWordById(cellData.clues[0].wordId);
            } else if (cellData.clues.length > 1) {
              const idx = cellData.clues.findIndex(c => c.wordId === this.activeWordId);
              const nextClue = cellData.clues[(idx + 1) % cellData.clues.length];
              this.selectWordById(nextClue.wordId);
            }
          });
        } else if (cellData.type === 'LETTER') {
          cellDiv.classList.add('cell-letter');
          if (cellData.solution === '-') {
            cellDiv.classList.add('is-hyphen');
          }

          cellData.entryArrows.forEach(arr => {
            const arrowSpan = document.createElement('span');
            arrowSpan.className = `entry-arrow ${arr === 'RIGHT' ? 'arrow-right' : 'arrow-down'}`;
            arrowSpan.textContent = arr === 'RIGHT' ? '▸' : '▾';
            cellDiv.appendChild(arrowSpan);
          });

          const charSpan = document.createElement('span');
          charSpan.className = 'letter-val';
          charSpan.textContent = cellData.userChar;
          cellDiv.appendChild(charSpan);

          cellDiv.addEventListener('click', () => this.onLetterCellClick(r, c));
        }

        this.gridEl.appendChild(cellDiv);
      }
    }
  }

  onLetterCellClick(r, c) {
    if (this.wasGridDragged) return;
    const cellData = this.grid[r][c];
    if (cellData.type !== 'LETTER') return;

    if (cellData.solution === '-') {
      if (cellData.wordIds.length > 0) {
        this.selectWordById(cellData.wordIds[0]);
      }
      return;
    }

    if (
      this.focusedCell &&
      this.focusedCell.r === r &&
      this.focusedCell.c === c &&
      cellData.wordIds.length > 1
    ) {
      const currentIdx = cellData.wordIds.indexOf(this.activeWordId);
      const nextWordId = cellData.wordIds[(currentIdx + 1) % cellData.wordIds.length];
      this.activeWordId = nextWordId;
    } else {
      this.focusedCell = { r, c };
      if (!cellData.wordIds.includes(this.activeWordId)) {
        this.activeWordId = cellData.wordIds[0];
      }
    }

    this.updateHighlightAndBanner();
    this.focusMobileKeyboard();
  }

  selectWordById(wordId) {
    const word = this.placedWords.find(w => w.id === wordId);
    if (!word) return;
    this.activeWordId = word.id;

    const emptyCell = word.cells.find(coord => {
      const c = this.grid[coord.r][coord.c];
      return !c.userChar && c.solution !== '-';
    });
    const firstNonHyphen = word.cells.find(coord => this.grid[coord.r][coord.c].solution !== '-');
    this.focusedCell = emptyCell ? { ...emptyCell } : (firstNonHyphen ? { ...firstNonHyphen } : { ...word.cells[0] });

    this.updateHighlightAndBanner();
    this.focusMobileKeyboard();
  }

  focusMobileKeyboard() {
    if (this.hiddenInput && ('ontouchstart' in window || navigator.maxTouchPoints > 0)) {
      this.resetMobileInputSentinel();
      this.hiddenInput.focus({ preventScroll: true });
    }
  }

  toggleDirectionAtFocusedCell() {
    if (!this.focusedCell) return;
    const cell = this.grid[this.focusedCell.r][this.focusedCell.c];
    if (cell.type === 'LETTER' && cell.wordIds.length > 1) {
      const idx = cell.wordIds.indexOf(this.activeWordId);
      this.activeWordId = cell.wordIds[(idx + 1) % cell.wordIds.length];
      this.updateHighlightAndBanner();
    }
  }

  resetMobileInputSentinel() {
    if (!this.hiddenInput) return;
    if (document.activeElement === this.hiddenInput) {
      this.isResettingInput = true;
      this.hiddenInput.blur();
      this.hiddenInput.value = '\u200B';
      this.hiddenInput.focus({ preventScroll: true });
      this.isResettingInput = false;
    } else {
      this.hiddenInput.value = '\u200B';
    }
    try {
      this.hiddenInput.setSelectionRange(1, 1);
    } catch (_) {}
  }

  triggerCleanBackspace() {
    const now = Date.now();
    if (this.lastBackspaceTime && now - this.lastBackspaceTime < 60) return;
    this.lastBackspaceTime = now;
    this.handleBackspace();
    this.resetMobileInputSentinel();
  }

  isCellProtectedBySolvedWord(r, c, excludeWordId = null) {
    const cell = this.grid[r][c];
    if (!cell || cell.type !== 'LETTER') return false;
    if (cell.lockedCorrect) return true;

    return cell.wordIds.some(wId => {
      if (wId === excludeWordId) return false;
      const otherWord = this.placedWords.find(w => w.id === wId);
      return otherWord && otherWord.solved;
    });
  }

  handleLetterInput(letter, isFromHint = false) {
    if (!this.focusedCell || this.isCheckingAnimation) return;
    const { r, c } = this.focusedCell;
    const cell = this.grid[r][c];
    if (cell.type !== 'LETTER') return;

    const activeWord = this.placedWords.find(w => w.id === this.activeWordId);
    const normalizedLetter = this.normalizeInputLetter(letter, activeWord ? activeWord.mode : 'TR_TO_EN');

    if (this.isCellProtectedBySolvedWord(r, c)) {
      cell.userChar = cell.solution;
    } else {
      cell.userChar = normalizedLetter;
    }

    this.updateCellDOM(r, c);

    const wordsToCheck = [];
    if (activeWord) wordsToCheck.push(activeWord);
    cell.wordIds.forEach(wId => {
      if (!wordsToCheck.some(w => w.id === wId)) {
        const w = this.placedWords.find(item => item.id === wId);
        if (w) wordsToCheck.push(w);
      }
    });

    if (isFromHint) {
      this.crosswordStreak = 0;
      wordsToCheck.forEach(w => {
        if (!w.solved) w.usedHint = true;
      });
    }

    let wrongWordTriggered = false;
    let newlySolvedAny = false;
    let celebratedCrosswordStreak = 0;

    for (const word of wordsToCheck) {
      const isFull = word.cells.every(pos => this.grid[pos.r][pos.c].userChar !== '');
      if (isFull && !word.solved) {
        const isCorrect = word.cells.every(pos => {
          const cellObj = this.grid[pos.r][pos.c];
          return this.lettersMatch(cellObj.userChar, cellObj.solution);
        });

        if (isCorrect) {
          word.solved = true;
          newlySolvedAny = true;
          const wordPts = (word.cells.length * 50) + ((!isFromHint && !word.usedHint && this.crosswordStreak > 0) ? (this.crosswordStreak * 15) : 0);
          this.crosswordScore = (this.crosswordScore || 0) + wordPts;
          this.updateCrosswordScoreUI();
          word.cells.forEach(pos => {
            const cellObj = this.grid[pos.r][pos.c];
            cellObj.userChar = cellObj.solution;
            cellObj.lockedCorrect = true;
            this.updateCellDOM(pos.r, pos.c);
          });

          if (!isFromHint && !word.usedHint) {
            this.crosswordStreak = (this.crosswordStreak || 0) + 1;
            if (this.crosswordStreak > 0 && this.crosswordStreak % 5 === 0) {
              celebratedCrosswordStreak = this.crosswordStreak;
            }
          } else {
            this.crosswordStreak = 0;
          }
        } else if (word.id === this.activeWordId) {
          wrongWordTriggered = true;
          this.crosswordStreak = 0;
          this.triggerAutoClearWrongWord(word);
        }
      }
    }

    // Ses ve kutlama geri bildirimi
    const allSolvedNow = this.placedWords.length > 0 && this.placedWords.every(w => w.solved);
    if (celebratedCrosswordStreak > 0) {
      this.triggerStreakCelebration(celebratedCrosswordStreak);
    } else if (allSolvedNow && newlySolvedAny) {
      this.sfx.playVictory();
    } else if (newlySolvedAny) {
      this.sfx.playSuccess();
    } else if (wrongWordTriggered) {
      this.sfx.playError();
    } else if (isFromHint) {
      this.sfx.playHint();
    } else {
      this.sfx.playType();
    }

    this.refreshSolvedVisuals(celebratedCrosswordStreak > 0);

    if (!wrongWordTriggered && activeWord) {
      if (activeWord.solved) {
        const nextUnsolved = this.placedWords.find(w => !w.solved);
        if (nextUnsolved) {
          this.selectWordById(nextUnsolved.id);
          return;
        }
      } else {
        const currentIdx = activeWord.cells.findIndex(pos => pos.r === r && pos.c === c);
        let moved = false;
        for (let step = 1; step < activeWord.cells.length; step++) {
          const nextPos = activeWord.cells[(currentIdx + step) % activeWord.cells.length];
          const nextCell = this.grid[nextPos.r][nextPos.c];
          if (!nextCell.userChar && nextCell.solution !== '-') {
            this.focusedCell = { ...nextPos };
            moved = true;
            break;
          }
        }
        if (!moved && currentIdx !== -1) {
          for (let nextIdx = currentIdx + 1; nextIdx < activeWord.cells.length; nextIdx++) {
            const nextPos = activeWord.cells[nextIdx];
            if (this.grid[nextPos.r][nextPos.c].solution !== '-') {
              this.focusedCell = { ...nextPos };
              break;
            }
          }
        }
      }
    }

    this.updateHighlightAndBanner();
  }

  triggerAutoClearWrongWord(word) {
    this.isCheckingAnimation = true;

    word.cells.forEach(pos => {
      const domCell = this.getCellElement(pos.r, pos.c);
      if (domCell && !this.isCellProtectedBySolvedWord(pos.r, pos.c, word.id)) {
        domCell.classList.add('is-wrong');
      }
    });

    setTimeout(() => {
      word.cells.forEach(pos => {
        const domCell = this.getCellElement(pos.r, pos.c);
        if (domCell) domCell.classList.remove('is-wrong');

        if (!this.isCellProtectedBySolvedWord(pos.r, pos.c, word.id)) {
          this.grid[pos.r][pos.c].userChar = '';
          this.updateCellDOM(pos.r, pos.c);
        }
      });

      const firstEmpty = word.cells.find(pos => !this.grid[pos.r][pos.c].userChar);
      if (firstEmpty) {
        this.focusedCell = { ...firstEmpty };
      }

      this.isCheckingAnimation = false;
      this.refreshSolvedVisuals();
      this.updateHighlightAndBanner();
    }, 420);
  }

  handleBackspace() {
    if (!this.focusedCell || this.isCheckingAnimation) return;
    const { r, c } = this.focusedCell;
    const cell = this.grid[r][c];
    if (cell.type !== 'LETTER') return;

    this.sfx.playDelete();

    if (cell.userChar && cell.solution !== '-' && !this.isCellProtectedBySolvedWord(r, c)) {
      cell.userChar = '';
      this.updateCellDOM(r, c);
    } else {
      const activeWord = this.placedWords.find(w => w.id === this.activeWordId);
      if (activeWord) {
        const idx = activeWord.cells.findIndex(pos => pos.r === r && pos.c === c);
        for (let prevIdx = idx - 1; prevIdx >= 0; prevIdx--) {
          const prev = activeWord.cells[prevIdx];
          const prevCell = this.grid[prev.r][prev.c];
          if (prevCell.solution === '-') continue;
          this.focusedCell = { ...prev };
          if (!this.isCellProtectedBySolvedWord(prev.r, prev.c)) {
            prevCell.userChar = '';
            this.updateCellDOM(prev.r, prev.c);
            break;
          }
        }
      }
    }

    this.refreshSolvedVisuals();
    this.updateHighlightAndBanner();
  }

  moveFocusByArrow(arrowKey) {
    if (!this.focusedCell) return;
    const deltas = {
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1]
    };
    const [dr, dc] = deltas[arrowKey] || [0, 0];
    let nr = this.focusedCell.r + dr;
    let nc = this.focusedCell.c + dc;

    while (nr >= 0 && nr < this.gridSize && nc >= 0 && nc < this.gridSize) {
      if (this.grid[nr][nc].type === 'LETTER' && this.grid[nr][nc].solution !== '-') {
        this.focusedCell = { r: nr, c: nc };
        if (!this.grid[nr][nc].wordIds.includes(this.activeWordId)) {
          this.activeWordId = this.grid[nr][nc].wordIds[0];
        }
        this.updateHighlightAndBanner();
        return;
      }
      nr += dr;
      nc += dc;
    }
  }

  giveLetterHint() {
    if (!this.focusedCell || this.isCheckingAnimation) return;
    const now = Date.now();
    if (this.lastHintTime && now - this.lastHintTime < 180) return;
    this.lastHintTime = now;

    // İpucu butonu veya (.) kısayolu kullanıldığında seri sıfırlanır ve puan kırılır (-25)
    this.crosswordStreak = 0;
    this.crosswordHintsUsed = (this.crosswordHintsUsed || 0) + 1;
    this.crosswordScore = Math.max(0, (this.crosswordScore || 0) - 25);
    this.updateCrosswordScoreUI();

    const { r, c } = this.focusedCell;
    const cell = this.grid[r][c];
    if (cell.type !== 'LETTER') return;

    const activeWord = this.placedWords.find(w => w.id === this.activeWordId);
    if (activeWord && !activeWord.solved) {
      activeWord.usedHint = true;
    }
    cell.wordIds.forEach(wId => {
      const w = this.placedWords.find(item => item.id === wId);
      if (w && !w.solved) w.usedHint = true;
    });

    this.crosswordHintsUsed = (this.crosswordHintsUsed || 0) + 1;
    this.handleLetterInput(cell.solution, true);
  }

  revealAllWords() {
    this.crosswordStreak = 0;
    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        const cell = this.grid[r][c];
        if (cell.type === 'LETTER') {
          cell.userChar = cell.solution;
          cell.lockedCorrect = true;
          this.updateCellDOM(r, c);
        }
      }
    }
    this.placedWords.forEach(w => {
      w.solved = true;
    });
    this.sfx.playVictory();
    this.refreshSolvedVisuals();
    this.updateHighlightAndBanner();
  }

  updateCellDOM(r, c) {
    const domCell = this.getCellElement(r, c);
    if (!domCell) return;
    const span = domCell.querySelector('.letter-val');
    if (span) {
      span.textContent = this.grid[r][c].userChar;
    }
  }

  getCellElement(r, c) {
    return this.gridEl.querySelector(`.cw-cell[data-r="${r}"][data-c="${c}"]`);
  }

  refreshSolvedVisuals(delayVictoryModal = false) {
    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        const cell = this.grid[r][c];
        if (cell.type !== 'LETTER') continue;
        const domCell = this.getCellElement(r, c);
        const belongsToSolvedWord = cell.wordIds.some(wId => {
          const w = this.placedWords.find(item => item.id === wId);
          return w && w.solved;
        });
        if (belongsToSolvedWord) {
          cell.lockedCorrect = true;
        }
        domCell.classList.toggle('is-solved', belongsToSolvedWord);
      }
    }

    this.updateStats();
    this.renderActiveWordsSidebar();

    if (this.placedWords.length > 0 && this.placedWords.every(w => w.solved)) {
      this.victoryToast.classList.remove('hidden');
      if (!this.crosswordVictoryShown && this.currentScreen === 'CROSSWORD') {
        this.crosswordVictoryShown = true;
        const hintsCount = this.crosswordHintsUsed || 0;
        const showModalFn = () => {
          if (this.currentScreen === 'CROSSWORD') {
            this.showGrandVictoryModal({
              icon: '🧩',
              badge: 'ÇENGEL BULMACA TAMAMLANDI!',
              title: 'Tebrikler! Oyunu Tamamladınız! 🎉',
              subtitle: `${this.gridSize}×${this.gridSize} ızgaradaki ${this.placedWords.length} kelimenin tamamını çözerek oyunu tamamladınız!`,
              stat1Label: 'ÇÖZÜLEN KELİME',
              stat1Val: `${this.placedWords.length} / ${this.placedWords.length}`,
              stat2Label: 'KULLANILAN İPUCU',
              stat2Val: `${hintsCount}`
            });
          }
        };
        if (delayVictoryModal) {
          setTimeout(showModalFn, 1600);
        } else {
          showModalFn();
        }
      }
    }
  }

  updateHighlightAndBanner(autoCenter = true) {
    const activeWord = this.placedWords.find(w => w.id === this.activeWordId);

    this.gridEl.querySelectorAll('.cw-cell.cell-letter').forEach(el => {
      el.classList.remove('in-active-word', 'is-focused');
    });
    this.gridEl.querySelectorAll('.cw-cell.cell-clue').forEach(el => {
      el.classList.remove('selected-clue-cell');
    });
    this.gridEl.querySelectorAll('.clue-sub').forEach(el => {
      el.classList.remove('active-clue-sub');
    });

    if (activeWord) {
      activeWord.cells.forEach(pos => {
        const el = this.getCellElement(pos.r, pos.c);
        if (el) el.classList.add('in-active-word');
      });

      const clueCellEl = this.getCellElement(activeWord.clueRow, activeWord.clueCol);
      if (clueCellEl) {
        clueCellEl.classList.add('selected-clue-cell');
        const activeSub = clueCellEl.querySelector(`.clue-sub[data-word-id="${activeWord.id}"]`);
        if (activeSub) activeSub.classList.add('active-clue-sub');
      }

      const dirText = activeWord.dir === 'H' ? '➔ YATAY' : '⬇ DİKEY';
      const langText = activeWord.mode === 'TR_TO_EN' ? 'TR ➔ EN' : 'EN ➔ TR';
      this.activeClueDirEl.textContent = `${dirText} (${langText})`;

      const isMobile = window.matchMedia('(max-width: 768px)').matches || document.body.classList.contains('mobile-ui');
      if (isMobile) {
        // Mobilde sade ve temiz soru formatı: "Deve: TR > EN (4 Harf)"
        this.activeClueTextEl.innerHTML = `<strong>${this.escapeHTML(activeWord.question)}</strong>: <span style="color:#6366f1;">${langText}</span> <small style="opacity:0.8;">(${activeWord.answer.length} Harf)</small>`;
      } else {
        if (activeWord.mode === 'TR_TO_EN') {
          this.activeClueTextEl.textContent = `"${activeWord.question}" kelimesinin İngilizce karşılığı nedir?`;
        } else {
          this.activeClueTextEl.textContent = `"${activeWord.question}" kelimesinin Türkçe karşılığı nedir?`;
        }
      }
      this.activeClueLenEl.textContent = `${activeWord.answer.length} Harf`;

      const clueCellData = this.grid[activeWord.clueRow][activeWord.clueCol];
      if (clueCellData && clueCellData.clues.length > 0 && this.cellAllCluesBoxEl) {
        this.cellAllCluesBoxEl.classList.remove('hidden');
        this.cellAllCluesBoxEl.innerHTML = `<span class="cell-all-clues-label">📌 Soru Kutusunda Yazan:</span>`;
        clueCellData.clues.forEach(cl => {
          const pill = document.createElement('button');
          pill.type = 'button';
          pill.className = `clue-switch-pill ${cl.wordId === activeWord.id ? 'active' : ''}`;
          const arrow = cl.dir === 'H' ? '➔ Yatay' : '⬇ Dikey';
          const lang = cl.mode === 'TR_TO_EN' ? 'TR➔EN' : 'EN➔TR';
          pill.innerHTML = `<span>${arrow}: <strong>${this.escapeHTML(cl.question)}</strong> (${lang})</span>`;
          pill.addEventListener('click', () => this.selectWordById(cl.wordId));
          this.cellAllCluesBoxEl.appendChild(pill);
        });
      }
    } else {
      this.activeClueDirEl.textContent = '👉 Kutucuk Seçin';
      this.activeClueTextEl.textContent = 'Başlamak için bir soru veya harf kutusuna dokunun.';
      this.activeClueLenEl.textContent = '';
      if (this.cellAllCluesBoxEl) this.cellAllCluesBoxEl.classList.add('hidden');
    }

    if (this.focusedCell) {
      const focusEl = this.getCellElement(this.focusedCell.r, this.focusedCell.c);
      if (focusEl) {
        focusEl.classList.add('is-focused');
        if (autoCenter) {
          this.centerFocusedCellInGrid();
        }
      }
    }

    this.activeWordsListEl.querySelectorAll('.clue-item').forEach(el => {
      const isAct = el.dataset.wordId === this.activeWordId;
      el.classList.toggle('active', isAct);
    });
  }

  renderActiveWordsSidebar() {
    this.activeWordsListEl.innerHTML = '';

    this.placedWords.forEach(word => {
      const item = document.createElement('div');
      item.className = `clue-item ${word.solved ? 'solved' : ''} ${word.id === this.activeWordId ? 'active' : ''}`;
      item.dataset.wordId = word.id;

      const pattern = word.cells
        .map(pos => this.grid[pos.r][pos.c].userChar || '_')
        .join('');

      const badge = word.mode === 'TR_TO_EN' ? 'TR➔EN' : 'EN➔TR';

      item.innerHTML = `
        <div class="clue-item-left">
          <span class="clue-dir-icon">${word.dir === 'H' ? '➔' : '⬇'} ${badge}</span>
          <span class="clue-tr-label">${this.escapeHTML(word.question)}</span>
        </div>
        <span class="clue-en-pattern">${pattern} (${word.answer.length})</span>
      `;

      item.addEventListener('click', () => this.selectWordById(word.id));
      this.activeWordsListEl.appendChild(item);
    });
  }

  updateStats() {
    const solvedCount = this.placedWords.filter(w => w.solved).length;
    this.statSolvedEl.textContent = `${solvedCount} / ${this.placedWords.length}`;
  }

  /* =========================================================================
     ORTAK VERİ TABANINI KULLANAN EK OYUNLAR (Quiz, Eşleştirme, Harf Avı)
     ========================================================================= */

  bindSubgameEvents() {
    this.bindKelimelikEvents();

    // 1. Hızlı Kelime Testi (Quiz)
    const quizModeSelector = document.getElementById('quizModeSelector');
    if (quizModeSelector) {
      quizModeSelector.addEventListener('click', (e) => {
        const btn = e.target.closest('.mode-btn');
        if (!btn) return;
        this.quizState.mode = btn.dataset.mode || 'MIXED';
        quizModeSelector.querySelectorAll('.mode-btn').forEach(b => {
          b.classList.toggle('active', b.dataset.mode === this.quizState.mode);
        });
        this.sfx.playType();
        this.startQuizGame();
      });
    }
    const btnOpenQuizCountModal = document.getElementById('btnOpenQuizCountModal');
    if (btnOpenQuizCountModal) {
      btnOpenQuizCountModal.addEventListener('click', () => {
        this.sfx.playType();
        this.openQuestionCountModal('QUIZ');
      });
    }
    const btnNewQuizQuestion = document.getElementById('btnNewQuizQuestion');
    if (btnNewQuizQuestion) {
      btnNewQuizQuestion.addEventListener('click', () => {
        this.sfx.playType();
        this.startQuizGame();
      });
    }
    const btnQuizHint = document.getElementById('btnQuizHint');
    if (btnQuizHint) {
      btnQuizHint.addEventListener('click', () => {
        this.giveQuizHint();
      });
    }
    const btnNewQuizGame = document.getElementById('btnNewQuizGame');
    if (btnNewQuizGame) {
      btnNewQuizGame.addEventListener('click', () => {
        this.sfx.playType();
        this.startQuizGame();
      });
    }

    // 2. Kelime Eşleştirme (Word Match)
    const matchDifficultySelect = document.getElementById('matchDifficultySelect');
    if (matchDifficultySelect) {
      matchDifficultySelect.addEventListener('change', (e) => {
        this.matchState.pairCount = parseInt(e.target.value, 10) || 6;
        this.sfx.playType();
        this.startMatchGame();
      });
    }
    const btnNewMatchBoard = document.getElementById('btnNewMatchBoard');
    if (btnNewMatchBoard) {
      btnNewMatchBoard.addEventListener('click', () => {
        this.sfx.playType();
        this.startMatchGame();
      });
    }
    const btnMatchHint = document.getElementById('btnMatchHint');
    if (btnMatchHint) {
      btnMatchHint.addEventListener('click', () => {
        this.giveMatchHint();
      });
    }

    // 3. Harf Avı / Kelime Kur (Word Scramble)
    const scrambleModeSelector = document.getElementById('scrambleModeSelector');
    if (scrambleModeSelector) {
      scrambleModeSelector.addEventListener('click', (e) => {
        const btn = e.target.closest('.mode-btn');
        if (!btn) return;
        this.scrambleState.mode = btn.dataset.mode || 'MIXED';
        scrambleModeSelector.querySelectorAll('.mode-btn').forEach(b => {
          b.classList.toggle('active', b.dataset.mode === this.scrambleState.mode);
        });
        this.sfx.playType();
        this.startScrambleGame();
      });
    }
    const btnOpenScrambleCountModal = document.getElementById('btnOpenScrambleCountModal');
    if (btnOpenScrambleCountModal) {
      btnOpenScrambleCountModal.addEventListener('click', () => {
        this.sfx.playType();
        this.openQuestionCountModal('SCRAMBLE');
      });
    }
    const btnNewScrambleWord = document.getElementById('btnNewScrambleWord');
    if (btnNewScrambleWord) {
      btnNewScrambleWord.addEventListener('click', () => {
        this.sfx.playType();
        this.startScrambleGame();
      });
    }
    const btnNewScrambleGame = document.getElementById('btnNewScrambleGame');
    if (btnNewScrambleGame) {
      btnNewScrambleGame.addEventListener('click', () => {
        this.sfx.playType();
        this.startScrambleGame();
      });
    }
    const btnScrambleHint = document.getElementById('btnScrambleHint');
    if (btnScrambleHint) {
      btnScrambleHint.addEventListener('click', () => this.giveScrambleHint());
    }
    const btnScrambleClear = document.getElementById('btnScrambleClear');
    if (btnScrambleClear) {
      btnScrambleClear.addEventListener('click', () => {
        this.sfx.playDelete();
        this.resetCurrentScrambleSlots();
      });
    }

    // 4. Elle Soru Sayısı Belirleme Pop-up Modal Olayları
    const btnCloseQuestionCountModal = document.getElementById('btnCloseQuestionCountModal');
    if (btnCloseQuestionCountModal) {
      btnCloseQuestionCountModal.addEventListener('click', () => this.closeQuestionCountModal());
    }
    const btnCancelQuestionCountModal = document.getElementById('btnCancelQuestionCountModal');
    if (btnCancelQuestionCountModal) {
      btnCancelQuestionCountModal.addEventListener('click', () => this.closeQuestionCountModal());
    }
    const btnQcMinus = document.getElementById('btnQcMinus');
    if (btnQcMinus) {
      btnQcMinus.addEventListener('click', () => this.stepQuestionCountInput(-1));
    }
    const btnQcPlus = document.getElementById('btnQcPlus');
    if (btnQcPlus) {
      btnQcPlus.addEventListener('click', () => this.stepQuestionCountInput(1));
    }
    if (this.questionCountForm) {
      this.questionCountForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.submitQuestionCountModal();
      });
    }
    if (this.questionCountInput) {
      this.questionCountInput.addEventListener('input', () => {
        this.questionCountInput.classList.remove('input-error');
      });
    }
  }

  stepQuestionCountInput(delta) {
    if (!this.questionCountInput) return;
    const minCount = 10;
    const maxCount = Math.max(minCount, this.getSharedGameWords().length);
    const cur = parseInt(this.questionCountInput.value, 10) || minCount;
    const next = Math.min(maxCount, Math.max(minCount, cur + delta));
    this.questionCountInput.value = String(next);
    this.questionCountInput.classList.remove('input-error');
    if (this.questionCountStatusMsg) {
      this.questionCountStatusMsg.classList.remove('is-error');
    }
    this.sfx.playType();
  }

  openQuestionCountModal(targetGame) {
    if (!this.questionCountModal) return;
    this.pendingQuestionCountGame = targetGame || 'QUIZ';

    const minCount = 10;
    const maxCount = this.getSharedGameWords().length;
    const currentTarget = this.pendingQuestionCountGame === 'QUIZ'
      ? Math.max(minCount, this.quizState.targetCount || 20)
      : Math.max(minCount, this.scrambleState.targetCount || 10);

    const gameBadgeEl = document.getElementById('questionCountGameBadge');
    if (gameBadgeEl) {
      gameBadgeEl.textContent = this.pendingQuestionCountGame === 'QUIZ'
        ? '⚡ HIZLI KELİME TESTİ'
        : '🔤 HARF AVI (KELİME KUR)';
    }
    if (this.questionCountModalTitle) {
      this.questionCountModalTitle.textContent = 'Soru Sayısı Belirle';
    }
    if (this.questionCountModalSub) {
      this.questionCountModalSub.textContent = `🎯 Seçili Havuz: ${this.getSelectedTopicSummaryLabel()}`;
    }
    if (this.qcMinVal) this.qcMinVal.textContent = String(minCount);
    if (this.qcMaxVal) this.qcMaxVal.textContent = String(maxCount);
    if (this.qcHintMax) this.qcHintMax.textContent = String(maxCount);
    if (this.questionCountInputLabel) {
      this.questionCountInputLabel.textContent = 'Kaç soruluk oyun başlatmak istiyorsunuz?';
    }

    if (this.questionCountInput) {
      this.questionCountInput.classList.remove('input-error');
      const suggestedVal = maxCount >= minCount
        ? Math.min(maxCount, Math.max(minCount, currentTarget))
        : minCount;
      this.questionCountInput.value = String(suggestedVal);
    }

    if (this.questionCountStatusMsg) {
      if (maxCount < minCount) {
        this.questionCountStatusMsg.classList.add('is-error');
        this.questionCountStatusMsg.innerHTML = `⚠️ Seçili konu havuzlarında toplam <strong>${maxCount}</strong> kelime bulunuyor. En düşük soru sayısı <strong>10</strong> olduğu için lütfen <strong>"🎯 Konu"</strong> menüsünden en az 10 kelimeye ulaşacak şekilde havuz seçin.`;
      } else {
        this.questionCountStatusMsg.classList.remove('is-error');
        this.questionCountStatusMsg.innerHTML = `💡 Seçiniz: <strong>${minCount}</strong>-<strong>${maxCount}</strong> arası`;
      }
    }

    this.questionCountModal.classList.remove('hidden');
    this.syncBodyModalLock();
    if (this.questionCountInput) {
      setTimeout(() => {
        this.questionCountInput.focus();
        this.questionCountInput.select();
      }, 50);
    }
  }

  closeQuestionCountModal() {
    if (!this.questionCountModal) return;
    this.questionCountModal.classList.add('hidden');
    this.syncBodyModalLock();
  }

  submitQuestionCountModal() {
    const minCount = 10;
    const maxCount = this.getSharedGameWords().length;

    const showValidationError = (msgHtml) => {
      this.sfx.playError();
      if (this.questionCountInput) {
        this.questionCountInput.classList.remove('input-error');
        void this.questionCountInput.offsetWidth;
        this.questionCountInput.classList.add('input-error');
        this.questionCountInput.focus();
        this.questionCountInput.select();
      }
      if (this.questionCountStatusMsg) {
        this.questionCountStatusMsg.classList.add('is-error');
        this.questionCountStatusMsg.innerHTML = msgHtml;
      }
    };

    if (maxCount < minCount) {
      showValidationError(
        `❌ Seçili konu havuzlarında yalnızca <strong>${maxCount}</strong> kelime var! En az <strong>${minCount}</strong> olmalıdır.`
      );
      return;
    }

    const rawVal = (this.questionCountInput ? this.questionCountInput.value : '').trim();
    if (!/^-?\d+$/.test(rawVal)) {
      showValidationError(
        `❌ Lütfen geçerli bir sayı girin! Seçiniz: <strong>${minCount}</strong>-<strong>${maxCount}</strong> arası.`
      );
      return;
    }

    const parsed = parseInt(rawVal, 10);
    if (isNaN(parsed) || parsed < minCount) {
      showValidationError(
        `❌ Girdiğiniz sayı (<strong>${parsed}</strong>) kabul edilemez! En az <strong>${minCount}</strong> olmalıdır. Seçiniz: <strong>${minCount}</strong>-<strong>${maxCount}</strong> arası.`
      );
      return;
    }

    if (parsed > maxCount) {
      showValidationError(
        `❌ Girdiğiniz sayı (<strong>${parsed}</strong>) seçili havuzlardaki toplam kelimeyi (<strong>${maxCount}</strong>) aşıyor! Seçiniz: <strong>${minCount}</strong>-<strong>${maxCount}</strong> arası.`
      );
      return;
    }

    this.sfx.playSuccess();
    this.closeQuestionCountModal();

    if (this.pendingQuestionCountGame === 'SCRAMBLE') {
      this.scrambleState.targetCount = parsed;
      if (this.scrambleQuestionCountLabel) {
        this.scrambleQuestionCountLabel.textContent = String(parsed);
      }
      this.startScrambleGame();
    } else {
      this.quizState.targetCount = parsed;
      if (this.quizQuestionCountLabel) {
        this.quizQuestionCountLabel.textContent = String(parsed);
      }
      this.startQuizGame();
    }
  }

  getSharedGameWords() {
    return this.getCombinedSelectedWords();
  }

  getSelectedTopicSummaryLabel() {
    const selectedSet = new Set(this.poolState.selectedPoolIds || [this.poolState.activePoolId]);
    const selectedPools = this.poolState.pools.filter(p => selectedSet.has(p.id));
    const combinedCount = this.getCombinedSelectedWords().length;
    return selectedPools.length === 1
      ? `${selectedPools[0].name} (${selectedPools[0].words.length})`
      : `${selectedPools.length} Konu Seçili (${combinedCount})`;
  }

  /* --- OYUN 2: HIZLI KELİME TESTİ (QUIZ) --- */
  startQuizGame() {
    const minCount = 10;
    const requestedCount = Math.max(minCount, this.quizTotalQuestions || this.quizState.targetCount || 20);
    const words = this.getSharedGameWords();

    if (words.length < minCount) {
      this.showWarningModal(
        'Seçili Havuzda Yeterli Kelime Yok!',
        `Seçtiğiniz veri havuzlarında toplam ${words.length} kelime bulunuyor. En düşük soru sayısı ${minCount} olduğu için lütfen "🎯 Konu" menüsünden ek veri havuzları seçin.`
      );
      if (words.length === 0) return;
    }

    const effectiveCount = words.length >= minCount
      ? Math.min(words.length, Math.max(minCount, requestedCount))
      : Math.max(1, words.length);
    this.quizState.targetCount = effectiveCount;
    if (this.quizQuestionCountLabel) {
      this.quizQuestionCountLabel.textContent = String(effectiveCount);
    }
    this.quizState.remaining = effectiveCount;
    this.quizState.correct = 0;
    this.quizState.total = 0;
    this.quizState.streak = 0;
    this.quizState.score = 0;
    this.quizState.locked = false;
    if (this.quizHintTimeout) {
      clearTimeout(this.quizHintTimeout);
      this.quizHintTimeout = null;
    }
    this.quizState.questionQueue = this.shuffleArray([...words]).slice(0, effectiveCount);

    this.updateQuizStatsUI();
    this.nextQuizQuestion();
  }

  updateQuizStatsUI() {
    const remainingEl = document.getElementById('quizStatRemaining');
    const scoreEl = document.getElementById('quizStatScore');
    const totalScoreEl = document.getElementById('quizStatTotalScore');
    const streakEl = document.getElementById('quizStatStreak');
    const progressEl = document.getElementById('quizProgressBadge');

    if (remainingEl) remainingEl.textContent = `${this.quizState.remaining}`;
    if (scoreEl) scoreEl.textContent = `${this.quizState.correct} / ${this.quizState.total}`;
    if (totalScoreEl) totalScoreEl.textContent = `${this.quizState.score || 0}`;
    if (streakEl) streakEl.textContent = `${this.quizState.streak}`;
    if (progressEl) {
      const currentNum = Math.min(this.quizState.targetCount, this.quizState.total + 1);
      progressEl.textContent = `Soru ${currentNum} / ${this.quizState.targetCount}`;
    }
  }

  nextQuizQuestion() {
    if (this.quizState.remaining <= 0 || this.quizState.questionQueue.length === 0) {
      const total = this.quizState.total || this.quizState.targetCount || 0;
      const correct = this.quizState.correct || 0;
      const wrong = Math.max(0, total - correct);
      const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

      let burstIcon = '🏆';
      let titleText = 'Tebrikler! Oyunu Tamamladınız! 🎉';
      let subText = '';

      if (accuracy === 100) {
        burstIcon = '🏆';
        titleText = 'Kusursuz! Oyunu Tamamladınız! 🎉';
        subText = `${total} sorunun tamamına doğru cevap vererek %100 başarıya ulaştınız!`;
      } else if (accuracy >= 70) {
        burstIcon = '🌟';
        titleText = 'Harika! Oyunu Tamamladınız! 🎉';
        subText = `${total} soruda ${correct} doğru ve ${wrong} yanlış ile testi başarıyla tamamladınız!`;
      } else if (accuracy >= 40) {
        burstIcon = '👍';
        titleText = 'Oyunu Tamamladınız! 👏';
        subText = `${total} soruda ${correct} doğru ve ${wrong} yanlış yaptınız. Tekrar oynayarak skorunuzu yükseltebilirsiniz!`;
      } else {
        burstIcon = '💪';
        titleText = 'Oyunu Tamamladınız! 💡';
        subText = `${total} soruda ${correct} doğru ve ${wrong} yanlış yaptınız. Kelimeleri tekrar edip yeni bir deneme yapabilirsiniz!`;
      }

      this.showGrandVictoryModal({
        icon: burstIcon,
        badge: 'HIZLI KELİME TESTİ TAMAMLANDI!',
        title: titleText,
        subtitle: subText,
        stat1Label: 'DOĞRU / TOPLAM',
        stat1Val: `${correct} / ${total}`,
        stat2Label: 'BAŞARI ORANI',
        stat2Val: `%${accuracy}`
      });
      return;
    }

    const allWords = this.getSharedGameWords();
    this.quizState.locked = false;
    if (this.quizHintTimeout) {
      clearTimeout(this.quizHintTimeout);
      this.quizHintTimeout = null;
    }
    const targetItem = this.quizState.questionQueue.shift();
    const dir = this.quizState.mode === 'MIXED'
      ? (Math.random() < 0.5 ? 'TR_TO_EN' : 'EN_TO_TR')
      : this.quizState.mode;

    const promptWord = dir === 'TR_TO_EN' ? targetItem.tr : targetItem.en;
    const correctAnswer = dir === 'TR_TO_EN' ? targetItem.en : targetItem.tr;
    this.quizState.currentAnswer = correctAnswer;

    const dirBadge = document.getElementById('quizDirBadge');
    const poolLabel = document.getElementById('quizPoolLabel');
    const promptEl = document.getElementById('quizPromptWord');
    const feedbackEl = document.getElementById('quizFeedbackMsg');
    const optionsGrid = document.getElementById('quizOptionsGrid');

    if (dirBadge) {
      dirBadge.textContent = dir === 'TR_TO_EN' ? '🇹🇷 TÜRKÇE ➔ 🇬🇧 İNGİLİZCE' : '🇬🇧 İNGİLİZCE ➔ 🇹🇷 TÜRKÇE';
    }
    if (poolLabel) {
      poolLabel.textContent = `🎯 ${this.getSelectedTopicSummaryLabel()}`;
    }
    if (promptEl) {
      promptEl.textContent = promptWord;
    }
    if (feedbackEl) {
      feedbackEl.textContent = 'Doğru seçeneğe dokunun:';
    }
    this.updateQuizStatsUI();

    const distractorSource = allWords.length >= 4 ? allWords : DEFAULT_WORDS;
    const distractors = [];
    const shuffled = this.shuffleArray([...distractorSource]);
    for (const item of shuffled) {
      const candidate = dir === 'TR_TO_EN' ? item.en : item.tr;
      if (candidate.toLowerCase() !== correctAnswer.toLowerCase() && !distractors.includes(candidate)) {
        distractors.push(candidate);
      }
      if (distractors.length >= 3) break;
    }

    const options = this.shuffleArray([correctAnswer, ...distractors]);
    if (optionsGrid) {
      optionsGrid.innerHTML = '';
      options.forEach(opt => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'quiz-option-btn';
        btn.textContent = opt;
        btn.addEventListener('click', () => this.handleQuizOptionClick(btn, opt));
        optionsGrid.appendChild(btn);
      });
    }
  }

  handleQuizOptionClick(clickedBtn, chosenText) {
    if (this.quizState.locked) return;
    this.quizState.locked = true;
    if (this.quizHintTimeout) {
      clearTimeout(this.quizHintTimeout);
      this.quizHintTimeout = null;
    }
    this.quizState.total++;
    this.quizState.remaining = Math.max(0, this.quizState.remaining - 1);

    const isCorrect = chosenText === this.quizState.currentAnswer;
    const optionsGrid = document.getElementById('quizOptionsGrid');
    const feedbackEl = document.getElementById('quizFeedbackMsg');

    if (optionsGrid) {
      optionsGrid.querySelectorAll('.quiz-option-btn').forEach(btn => {
        btn.disabled = true;
        btn.classList.remove('hint-orange-pulse');
        if (btn.textContent === this.quizState.currentAnswer) {
          btn.classList.add('is-correct');
        }
      });
    }

    let celebratedStreak = false;
    if (isCorrect) {
      this.quizState.correct++;
      this.quizState.streak++;
      const earnedPts = 100 + (this.quizState.streak * 20);
      this.quizState.score = (this.quizState.score || 0) + earnedPts;
      if (this.quizState.streak > 0 && this.quizState.streak % 5 === 0) {
        celebratedStreak = true;
        this.triggerStreakCelebration(this.quizState.streak);
      } else {
        this.sfx.playSuccess();
      }
      if (feedbackEl) {
        feedbackEl.textContent = `🎉 Harika! Doğru cevap: "${this.quizState.currentAnswer}"`;
      }
    } else {
      clickedBtn.classList.add('is-wrong');
      this.quizState.streak = 0;
      this.sfx.playError();
      if (feedbackEl) {
        feedbackEl.textContent = `❌ Yanlış! Doğru cevap: "${this.quizState.currentAnswer}"`;
      }
    }

    this.updateQuizStatsUI();
    const delay = celebratedStreak ? 1600 : 1150;
    setTimeout(() => {
      if (this.currentScreen === 'QUIZ') {
        this.nextQuizQuestion();
      }
    }, delay);
  }

  giveQuizHint() {
    if (this.quizState.locked) return;
    if (!this.quizState.currentAnswer) return;

    // İpucu butonu veya (.) kısayolu: seri sıfırlanır, -20 puan kırılır
    this.quizState.streak = 0;
    this.quizState.score = Math.max(0, (this.quizState.score || 0) - 20);
    this.updateQuizStatsUI();
    this.sfx.playHint();

    const optionsGrid = document.getElementById('quizOptionsGrid');
    if (!optionsGrid) return;

    const correctBtn = Array.from(optionsGrid.querySelectorAll('.quiz-option-btn')).find(
      btn => btn.textContent.trim() === this.quizState.currentAnswer.trim()
    );
    if (!correctBtn) return;

    correctBtn.classList.add('hint-orange-pulse');
    const feedbackEl = document.getElementById('quizFeedbackMsg');
    if (feedbackEl) {
      feedbackEl.innerHTML = '🟠 <strong>İpucu:</strong> Doğru şık 2 saniye turuncu yanıp sönüyor!';
    }

    if (this.quizHintTimeout) {
      clearTimeout(this.quizHintTimeout);
    }
    this.quizHintTimeout = setTimeout(() => {
      correctBtn.classList.remove('hint-orange-pulse');
      const fb = document.getElementById('quizFeedbackMsg');
      if (fb && !this.quizState.locked) {
        fb.textContent = 'Doğru seçeneğe dokunun:';
      }
      this.quizHintTimeout = null;
    }, 2000);
  }

  /* --- OYUN 3: KELİME EŞLEŞTİRME (WORD MATCH) --- */
  startMatchGame() {
    const diffSelect = document.getElementById('matchDifficultySelect');
    const requestedPairs = diffSelect ? (parseInt(diffSelect.value, 10) || 6) : (this.matchState.pairCount || 6);
    const words = this.getSharedGameWords();

    if (words.length < requestedPairs) {
      this.showWarningModal(
        'Seçili Havuzda Yeterli Kelime Yok!',
        `Seçtiğiniz zorluk seviyesi için en az ${requestedPairs} kelime gerekiyor, ancak seçili havuzlarda ${words.length} kelime var. Lütfen zorluğu düşürün veya ek veri havuzu seçin.`
      );
      if (words.length === 0) return;
    }

    const pairCount = Math.min(requestedPairs, Math.max(1, words.length));
    const shuffled = this.shuffleArray([...words]);
    const chosenPairs = shuffled.slice(0, pairCount);

    this.matchState.pairCount = pairCount;
    this.matchState.matchedPairs = 0;
    this.matchState.totalPairs = pairCount;
    this.matchState.moves = 0;
    this.matchState.streak = 0;
    this.matchState.score = 0;
    this.matchState.selectedCard = null;
    this.matchState.locked = false;
    if (this.matchHintTimeout) {
      clearTimeout(this.matchHintTimeout);
      this.matchHintTimeout = null;
    }

    const cards = [];
    chosenPairs.forEach((pair, idx) => {
      cards.push({ pairId: idx, lang: 'TR', label: '🇹🇷 TR', text: pair.tr, matched: false, hinted: false, wasHinted: false });
      cards.push({ pairId: idx, lang: 'EN', label: '🇬🇧 EN', text: pair.en, matched: false, hinted: false, wasHinted: false });
    });

    this.matchState.cards = this.shuffleArray(cards);
    this.updateMatchStatsUI();
    const statusText = document.getElementById('matchStatusText');
    if (statusText) {
      statusText.innerHTML = '💡 Bir <strong>🇹🇷 Türkçe</strong> ve bir <strong>🇬🇧 İngilizce</strong> kart seçerek eşleştirin! İpucu için <strong>(.)</strong> tuşuna basabilirsiniz.';
    }
    this.renderMatchBoard();
  }

  updateMatchStatsUI() {
    const pairsEl = document.getElementById('matchStatPairs');
    const movesEl = document.getElementById('matchStatMoves');
    const scoreEl = document.getElementById('matchStatScore');
    if (pairsEl) pairsEl.textContent = `${this.matchState.matchedPairs} / ${this.matchState.totalPairs}`;
    if (movesEl) movesEl.textContent = `${this.matchState.moves}`;
    if (scoreEl) scoreEl.textContent = `${this.matchState.score || 0}`;
  }

  renderMatchBoard() {
    const grid = document.getElementById('matchCardsGrid');
    if (!grid) return;
    grid.setAttribute('data-difficulty', String(this.matchState.totalPairs));
    grid.innerHTML = '';

    this.matchState.cards.forEach((card, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.cardIdx = index;
      btn.className = `match-item-btn ${card.matched ? 'matched' : ''} ${!card.matched && card.hinted ? 'hint-pair hint-orange-pulse' : ''}`;
      btn.disabled = card.matched;
      btn.innerHTML = `
        <span class="match-lang-tag">${card.label}</span>
        <span>${this.escapeHTML(card.text)}</span>
      `;
      btn.addEventListener('click', () => this.onMatchCardClick(index, btn));
      grid.appendChild(btn);
    });
  }

  giveMatchHint() {
    if (this.matchState.locked) return;
    // İpucu butonu veya (.) kısayolu kullanıldığında seri sıfırlanır ve -30 puan kırılır
    this.matchState.streak = 0;
    this.matchState.score = Math.max(0, (this.matchState.score || 0) - 30);
    this.updateMatchStatsUI();

    // Henüz eşleşmemiş ve henüz turuncu ipucu verilmemiş bir çift bul
    const unhintedPairs = [];
    const seenPairIds = new Set();
    this.matchState.cards.forEach(c => {
      if (!c.matched && !c.hinted && !seenPairIds.has(c.pairId)) {
        seenPairIds.add(c.pairId);
        unhintedPairs.push(c.pairId);
      }
    });

    let targetPairId = null;
    if (unhintedPairs.length > 0) {
      targetPairId = unhintedPairs[Math.floor(Math.random() * unhintedPairs.length)];
    } else {
      // Tüm kalan çiftler zaten ipucu aldıysa eşleşmemiş herhangi bir çifti tekrar vurgula
      const remaining = this.matchState.cards.filter(c => !c.matched);
      if (remaining.length > 0) {
        targetPairId = remaining[0].pairId;
      }
    }

    if (targetPairId === null) return;

    this.sfx.playHint();
    const grid = document.getElementById('matchCardsGrid');
    this.matchState.cards.forEach((card, idx) => {
      if (card.pairId === targetPairId && !card.matched) {
        card.hinted = true;
        card.wasHinted = true;
        if (grid) {
          const btn = grid.querySelector(`.match-item-btn[data-card-idx="${idx}"]`);
          if (btn) {
            btn.classList.add('hint-pair');
            btn.classList.add('hint-orange-pulse');
          }
        }
      }
    });

    const statusText = document.getElementById('matchStatusText');
    if (statusText) {
      statusText.innerHTML = '🟠 <strong>İpucu Aktif!</strong> Birbiriyle eşleşen iki kart <strong>turuncu</strong> renge döndü. Üzerlerine tıklayarak yeşile çevirin!';
    }

    // Kullanıcı talebi: 2 saniye sonra turuncu yanıp sönen ipucu sönsün, butonlar normal haline dönsün
    if (this.matchHintTimeout) {
      clearTimeout(this.matchHintTimeout);
    }
    this.matchHintTimeout = setTimeout(() => {
      this.matchState.cards.forEach((card, idx) => {
        if (card.pairId === targetPairId && !card.matched) {
          card.hinted = false;
          if (grid) {
            const btn = grid.querySelector(`.match-item-btn[data-card-idx="${idx}"]`);
            if (btn) {
              btn.classList.remove('hint-pair');
              btn.classList.remove('hint-orange-pulse');
            }
          }
        }
      });
      const st = document.getElementById('matchStatusText');
      if (st) {
        st.innerHTML = 'Kartlara dokunarak Türkçe ve İngilizce karşılıklarını eşleştirin.';
      }
      this.matchHintTimeout = null;
    }, 2000);
  }

  onMatchCardClick(index, btnEl) {
    if (this.matchState.locked) return;
    const card = this.matchState.cards[index];
    if (!card || card.matched) return;

    const prev = this.matchState.selectedCard;
    if (prev && prev.index === index) {
      btnEl.classList.remove('selected');
      this.matchState.selectedCard = null;
      this.sfx.playDelete();
      return;
    }

    this.sfx.playType();
    btnEl.classList.add('selected');

    if (!prev) {
      this.matchState.selectedCard = { index, card, btnEl };
      return;
    }

    this.matchState.moves++;
    this.matchState.selectedCard = null;

    if (prev.card.pairId === card.pairId && prev.card.lang !== card.lang) {
      const usedHintForPair = Boolean(prev.card.wasHinted || card.wasHinted || prev.card.hinted || card.hinted);
      prev.card.matched = true;
      card.matched = true;
      prev.card.hinted = false;
      card.hinted = false;
      prev.btnEl.classList.remove('selected', 'hint-pair', 'hint-orange-pulse');
      btnEl.classList.remove('selected', 'hint-pair', 'hint-orange-pulse');
      prev.btnEl.classList.add('matched');
      btnEl.classList.add('matched');
      prev.btnEl.disabled = true;
      btnEl.disabled = true;

      this.matchState.matchedPairs++;
      const pairScore = 120 + ((this.matchState.streak || 0) * 15);
      this.matchState.score = (this.matchState.score || 0) + pairScore;
      this.updateMatchStatsUI();

      let celebratedStreak = false;
      if (!usedHintForPair) {
        this.matchState.streak = (this.matchState.streak || 0) + 1;
        if (this.matchState.streak > 0 && this.matchState.streak % 5 === 0) {
          celebratedStreak = true;
          this.triggerStreakCelebration(this.matchState.streak);
        }
      } else {
        this.matchState.streak = 0;
      }

      if (this.matchState.matchedPairs >= this.matchState.totalPairs) {
        const efficiencyBonus = Math.max(0, (this.matchState.totalPairs * 200) - (this.matchState.moves * 15));
        this.matchState.score = (this.matchState.score || 0) + efficiencyBonus;
        this.updateMatchStatsUI();

        const statusText = document.getElementById('matchStatusText');
        if (statusText) {
          statusText.innerHTML = `🏆 <strong>Tebrikler! Oyunu Tamamladınız!</strong> Tüm kelime çiftlerini ${this.matchState.moves} hamlede eşleştirdiniz!`;
        }
        const efficiency = this.matchState.moves > 0
          ? Math.min(100, Math.round((this.matchState.totalPairs / this.matchState.moves) * 100))
          : 100;
        const modalDelay = celebratedStreak ? 1600 : 450;
        setTimeout(() => {
          if (this.currentScreen === 'MATCH') {
            this.showGrandVictoryModal({
              icon: '🃏',
              badge: 'KELİME EŞLEŞTİRME TAMAMLANDI!',
              title: 'Tebrikler! Oyunu Tamamladınız! 🎉',
              subtitle: `${this.matchState.totalPairs} kelime çiftinin tamamını ${this.matchState.moves} hamlede eşleştirerek oyunu tamamladınız!`,
              stat1Label: 'EŞLEŞEN ÇİFT',
              stat1Val: `${this.matchState.matchedPairs} / ${this.matchState.totalPairs}`,
              stat2Label: 'HAMLE / İSABET',
              stat2Val: `${this.matchState.moves} (%${efficiency})`
            });
          }
        }, modalDelay);
      } else if (!celebratedStreak) {
        this.sfx.playSuccess();
      }
    } else {
      // Hatalı eşleştirme seriyi sıfırlar
      this.matchState.streak = 0;
      this.matchState.locked = true;
      this.updateMatchStatsUI();
      prev.btnEl.classList.remove('selected');
      btnEl.classList.remove('selected');
      prev.btnEl.classList.add('wrong');
      btnEl.classList.add('wrong');
      this.sfx.playError();

      setTimeout(() => {
        prev.btnEl.classList.remove('wrong');
        btnEl.classList.remove('wrong');
        this.matchState.locked = false;
      }, 500);
    }
  }

  /* --- OYUN 4: HARF AVI / KELİME KUR (WORD SCRAMBLE) --- */
  startScrambleGame() {
    const minCount = 10;
    const requestedCount = Math.max(minCount, this.scrambleTotalCount || this.scrambleState.targetCount || 10);
    const words = this.getSharedGameWords();

    if (words.length < minCount) {
      this.showWarningModal(
        'Seçili Havuzda Yeterli Kelime Yok!',
        `Seçtiğiniz veri havuzlarında toplam ${words.length} kelime bulunuyor. En düşük soru sayısı ${minCount} olduğu için lütfen "🎯 Konu" menüsünden ek veri havuzları seçin.`
      );
      if (words.length === 0) return;
    }

    const effectiveCount = words.length >= minCount
      ? Math.min(words.length, Math.max(minCount, requestedCount))
      : Math.max(1, words.length);
    this.scrambleState.targetCount = effectiveCount;
    if (this.scrambleQuestionCountLabel) {
      this.scrambleQuestionCountLabel.textContent = String(effectiveCount);
    }
    this.scrambleState.remaining = effectiveCount;
    this.scrambleState.solved = 0;
    this.scrambleState.hintsUsed = 0;
    this.scrambleState.streak = 0;
    this.scrambleState.score = 0;
    this.scrambleState.currentWordUsedHint = false;
    this.scrambleState.currentWordHadError = false;
    this.scrambleState.locked = false;
    this.scrambleState.wordQueue = this.shuffleArray([...words]).slice(0, effectiveCount);

    this.updateScrambleStatsUI();
    this.nextScrambleWord();
  }

  updateScrambleStatsUI() {
    const remainingEl = document.getElementById('scrambleStatRemaining');
    const solvedEl = document.getElementById('scrambleStatSolved');
    const scoreEl = document.getElementById('scrambleStatScore');
    if (remainingEl) remainingEl.textContent = `${this.scrambleState.remaining}`;
    if (solvedEl) solvedEl.textContent = `${this.scrambleState.solved} / ${this.scrambleState.targetCount}`;
    if (scoreEl) scoreEl.textContent = `${this.scrambleState.score || 0}`;
  }

  nextScrambleWord() {
    if (this.scrambleState.remaining <= 0 || this.scrambleState.wordQueue.length === 0) {
      const hintsUsed = this.scrambleState.hintsUsed || 0;
      this.showGrandVictoryModal({
        icon: '🔤',
        badge: 'HARF AVI TAMAMLANDI!',
        title: 'Tebrikler! Oyunu Tamamladınız! 🎉',
        subtitle: `Harf Avı oyunundaki ${this.scrambleState.targetCount} kelimeyi de doğru sırayla kurarak oyunu tamamladınız!`,
        stat1Label: 'TAMAMLANAN KELİME',
        stat1Val: `${this.scrambleState.solved} / ${this.scrambleState.targetCount}`,
        stat2Label: 'KULLANILAN İPUCU',
        stat2Val: `${hintsUsed}`
      });
      return;
    }

    this.scrambleState.locked = false;
    this.scrambleState.currentWordUsedHint = false;
    this.scrambleState.currentWordHadError = false;
    const item = this.scrambleState.wordQueue.shift();
    const dir = this.scrambleState.mode === 'MIXED'
      ? (Math.random() < 0.5 ? 'TR_TO_EN' : 'EN_TO_TR')
      : this.scrambleState.mode;

    const promptWord = dir === 'TR_TO_EN' ? item.tr : item.en;
    const cleanAnswer = dir === 'TR_TO_EN'
      ? this.toEnglishUpper(item.en)
      : this.toTurkishUpper(item.tr);

    this.scrambleState.currentDir = dir;
    this.scrambleState.targetAnswer = cleanAnswer;
    this.scrambleState.slots = cleanAnswer.split('').map(ch => (ch === '-' ? { char: '-', tileIdx: -1, isHyphen: true } : { char: '', tileIdx: null, isHyphen: false }));

    const letterChars = cleanAnswer.split('').filter(ch => ch !== '-');
    const shuffledChars = this.shuffleArray([...letterChars]);
    this.scrambleState.tiles = shuffledChars.map((ch, idx) => ({ idx, char: ch, used: false }));

    const dirBadge = document.getElementById('scrambleDirBadge');
    const lenBadge = document.getElementById('scrambleLenBadge');
    const promptEl = document.getElementById('scramblePromptWord');
    const feedbackEl = document.getElementById('scrambleFeedbackMsg');

    if (dirBadge) {
      dirBadge.textContent = dir === 'TR_TO_EN' ? '🇹🇷 TÜRKÇE ➔ 🇬🇧 İNGİLİZCE' : '🇬🇧 İNGİLİZCE ➔ 🇹🇷 TÜRKÇE';
    }
    if (lenBadge) {
      lenBadge.textContent = `${letterChars.length} Harf`;
    }
    if (promptEl) {
      promptEl.textContent = promptWord;
    }
    if (feedbackEl) {
      feedbackEl.textContent = 'Harf taşlarına dokunun veya klavyeden yazın. İpucu için (.) tuşuna basabilirsiniz.';
    }

    this.updateScrambleStatsUI();
    this.renderScrambleUI();
  }

  handleScrambleKeyInput(rawKey) {
    if (this.scrambleState.locked) return;
    const emptySlot = this.scrambleState.slots.find(s => !s.isHyphen && !s.char);
    if (!emptySlot) return;

    const normalized = this.normalizeInputLetter(rawKey, this.scrambleState.currentDir || 'TR_TO_EN');
    const matchingTile = this.scrambleState.tiles.find(t => !t.used && this.lettersMatch(t.char, normalized));
    if (!matchingTile) {
      this.scrambleState.streak = 0;
      this.scrambleState.currentWordHadError = true;
      this.sfx.playError();
      return;
    }

    matchingTile.used = true;
    emptySlot.char = matchingTile.char;
    emptySlot.tileIdx = matchingTile.idx;
    this.sfx.playType();
    this.renderScrambleUI();
    this.checkScrambleCompletion();
  }

  handleScrambleBackspace() {
    if (this.scrambleState.locked) return;
    for (let i = this.scrambleState.slots.length - 1; i >= 0; i--) {
      const slot = this.scrambleState.slots[i];
      if (!slot.isHyphen && slot.char) {
        if (slot.tileIdx !== null && this.scrambleState.tiles[slot.tileIdx]) {
          this.scrambleState.tiles[slot.tileIdx].used = false;
        }
        slot.char = '';
        slot.tileIdx = null;
        this.sfx.playDelete();
        this.renderScrambleUI();
        return;
      }
    }
  }

  resetCurrentScrambleSlots() {
    if (this.scrambleState.locked) return;
    this.scrambleState.slots.forEach(s => {
      if (!s.isHyphen) {
        s.char = '';
        s.tileIdx = null;
      }
    });
    this.scrambleState.tiles.forEach(t => { t.used = false; });
    this.renderScrambleUI();
  }

  giveScrambleHint() {
    if (this.scrambleState.locked) return;
    // İpucu butonu veya (.) kısayolu kullanıldığında seri sıfırlanır ve -20 puan kırılır
    this.scrambleState.streak = 0;
    this.scrambleState.currentWordUsedHint = true;
    this.scrambleState.score = Math.max(0, (this.scrambleState.score || 0) - 20);
    this.updateScrambleStatsUI();

    const emptySlotIdx = this.scrambleState.slots.findIndex(s => !s.isHyphen && !s.char);
    if (emptySlotIdx === -1) return;

    const neededChar = this.scrambleState.targetAnswer[emptySlotIdx];
    let tile = this.scrambleState.tiles.find(t => !t.used && this.lettersMatch(t.char, neededChar));
    if (!tile) {
      const wrongSlot = this.scrambleState.slots.find((s, i) => !s.isHyphen && s.char && !this.lettersMatch(s.char, this.scrambleState.targetAnswer[i]) && this.lettersMatch(s.char, neededChar));
      if (wrongSlot && wrongSlot.tileIdx !== null) {
        const freedTile = this.scrambleState.tiles[wrongSlot.tileIdx];
        if (freedTile) freedTile.used = false;
        wrongSlot.char = '';
        wrongSlot.tileIdx = null;
        tile = freedTile;
      }
    }

    if (tile) {
      this.scrambleState.hintsUsed = (this.scrambleState.hintsUsed || 0) + 1;
      tile.used = true;
      this.scrambleState.slots[emptySlotIdx].char = neededChar;
      this.scrambleState.slots[emptySlotIdx].tileIdx = tile.idx;
      this.sfx.playHint();
      this.renderScrambleUI();
      this.checkScrambleCompletion();
    }
  }

  renderScrambleUI() {
    const slotsEl = document.getElementById('scrambleAnswerSlots');
    const tilesEl = document.getElementById('scrambleTilesPool');
    if (!slotsEl || !tilesEl) return;

    slotsEl.innerHTML = '';
    this.scrambleState.slots.forEach((slot) => {
      const div = document.createElement('button');
      div.type = 'button';
      div.className = `scramble-slot ${slot.isHyphen ? 'is-hyphen' : ''} ${this.scrambleState.locked ? 'is-solved' : ''}`;
      div.textContent = slot.char || '';
      if (!slot.isHyphen && slot.char && !this.scrambleState.locked) {
        div.addEventListener('click', () => {
          if (slot.tileIdx !== null && this.scrambleState.tiles[slot.tileIdx]) {
            this.scrambleState.tiles[slot.tileIdx].used = false;
          }
          slot.char = '';
          slot.tileIdx = null;
          this.sfx.playDelete();
          this.renderScrambleUI();
        });
      }
      slotsEl.appendChild(div);
    });

    tilesEl.innerHTML = '';
    this.scrambleState.tiles.forEach(tile => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `scramble-tile-btn ${tile.used ? 'used' : ''}`;
      btn.disabled = tile.used || this.scrambleState.locked;
      btn.textContent = tile.char;
      btn.addEventListener('click', () => {
        const emptySlot = this.scrambleState.slots.find(s => !s.isHyphen && !s.char);
        if (!emptySlot) return;
        tile.used = true;
        emptySlot.char = tile.char;
        emptySlot.tileIdx = tile.idx;
        this.sfx.playType();
        this.renderScrambleUI();
        this.checkScrambleCompletion();
      });
      tilesEl.appendChild(btn);
    });
  }

  checkScrambleCompletion() {
    const allFilled = this.scrambleState.slots.every(s => s.isHyphen || Boolean(s.char));
    if (!allFilled) return;

    const formed = this.scrambleState.slots.map(s => s.char).join('');
    const target = this.scrambleState.targetAnswer;
    const isMatch = formed.length === target.length && formed.split('').every((ch, i) => this.lettersMatch(ch, target[i]));
    const feedbackEl = document.getElementById('scrambleFeedbackMsg');

    if (isMatch) {
      this.scrambleState.locked = true;
      this.scrambleState.solved++;
      this.scrambleState.remaining = Math.max(0, this.scrambleState.remaining - 1);
      const earnedPts = 100 + ((this.scrambleState.streak || 0) * 15);
      this.scrambleState.score = (this.scrambleState.score || 0) + earnedPts;
      this.updateScrambleStatsUI();
      this.renderScrambleUI();

      let celebratedStreak = false;
      if (!this.scrambleState.currentWordUsedHint && !this.scrambleState.currentWordHadError) {
        this.scrambleState.streak = (this.scrambleState.streak || 0) + 1;
        if (this.scrambleState.streak > 0 && this.scrambleState.streak % 5 === 0) {
          celebratedStreak = true;
          this.triggerStreakCelebration(this.scrambleState.streak);
        }
      } else {
        this.scrambleState.streak = 0;
      }

      if (!celebratedStreak) {
        this.sfx.playSuccess();
      }

      if (feedbackEl) {
        feedbackEl.textContent = `🎉 Doğru! "${target}" kelimesini başarıyla oluşturdunuz!`;
      }
      const nextDelay = celebratedStreak ? 1600 : 1100;
      setTimeout(() => {
        if (this.currentScreen === 'SCRAMBLE') this.nextScrambleWord();
      }, nextDelay);
    } else {
      // Hatalı harf dizilimi seriyi sıfırlar
      this.scrambleState.streak = 0;
      this.scrambleState.currentWordHadError = true;
      this.sfx.playError();
      if (feedbackEl) {
        feedbackEl.textContent = '⚠️ Harf dizilimi hatalı! Yanlış harflere dokunarak geri alabilir veya Sıfırla diyebilirsiniz.';
      }
    }
  }

  /* =========================================================================
     KELİMELİK OYUNU (Videodaki Gibi Bonus Puanlı Serbest Kelimelik Tahtası + 10 Harf İstakası)
     - İstisna Kuralı: Her zaman TÜM HAVUZLAR kaynağı kullanılır (havuz seçilemez)
     - Verilen 10 harf ile Tüm Havuzlar'dan mutlaka kelime üretilebilmesi garanti edilir
     - İpucu (.): Hücreye harf yazmak yerine yazılabilir bir kelimeyi 5 sn pop-up olarak gösterir
     - Müzik: Cantorum.mp3
     ========================================================================= */

  bindKelimelikEvents() {
    const modeSelector = document.getElementById('kelimelikModeSelector');
    if (modeSelector) {
      modeSelector.addEventListener('click', (e) => {
        const btn = e.target.closest('.mode-btn');
        if (!btn) return;
        const selectedMode = btn.dataset.mode;
        if (!selectedMode || selectedMode === this.kelimelikState.mode) return;
        this.kelimelikState.mode = selectedMode;
        modeSelector.querySelectorAll('.mode-btn').forEach(b => {
          b.classList.toggle('active', b.dataset.mode === this.kelimelikState.mode);
        });
        this.sfx.playType();
        this.generateNewKelimelikPuzzle();
      });
    }

    const sizeSelect = document.getElementById('kelimelikGridSizeSelect');
    if (sizeSelect) {
      sizeSelect.addEventListener('change', (e) => {
        this.kelimelikState.gridSize = parseInt(e.target.value, 10) || 11;
        this.sfx.playType();
        this.generateNewKelimelikPuzzle();
      });
    }

    const btnNewKelimelik = document.getElementById('btnNewKelimelik');
    if (btnNewKelimelik) {
      btnNewKelimelik.addEventListener('click', () => {
        this.sfx.playType();
        this.generateNewKelimelikPuzzle();
      });
    }

    const btnKelimelikHint = document.getElementById('btnKelimelikHint');
    if (btnKelimelikHint) {
      btnKelimelikHint.addEventListener('click', () => this.giveKelimelikHint());
    }

    if (this.btnKelimelikSubmitWord) {
      this.btnKelimelikSubmitWord.addEventListener('click', () => this.submitKelimelikWord());
    }

    const btnKelimelikShuffleRack = document.getElementById('btnKelimelikShuffleRack');
    if (btnKelimelikShuffleRack) {
      btnKelimelikShuffleRack.addEventListener('click', () => {
        this.sfx.playType();
        this.shuffleArray(this.kelimelikState.rack);
        this.renderKelimelikRack();
      });
    }

    const btnKelimelikRefreshRack = document.getElementById('btnKelimelikRefreshRack');
    if (btnKelimelikRefreshRack) {
      btnKelimelikRefreshRack.addEventListener('click', () => {
        this.returnAllUnlockedKelimelikTilesToRack(true);
        this.refillKelimelikRack(true);
        this.sfx.playType();
      });
    }

    const btnKelimelikReturnTiles = document.getElementById('btnKelimelikReturnTiles');
    if (btnKelimelikReturnTiles) {
      btnKelimelikReturnTiles.addEventListener('click', () => {
        this.returnAllUnlockedKelimelikTilesToRack(false);
      });
    }

    if (this.kelimelikHintPopup) {
      this.kelimelikHintPopup.addEventListener('click', () => {
        this.hideKelimelikHintPopup();
      });
    }
  }

  getKelimelikLetterPoints(ch) {
    const ptsMap = {
      A: 1, E: 1, İ: 1, I: 1, K: 1, L: 1, N: 1, R: 1, T: 1,
      O: 2, S: 2, U: 2, M: 2, D: 2, B: 2, Y: 2,
      Ü: 3, Ö: 3, C: 3, P: 3, Z: 3, G: 3, H: 3, V: 3,
      Ç: 4, Ş: 4, F: 4, W: 4,
      Ğ: 5, J: 8, Q: 8, X: 8
    };
    return ptsMap[ch] || 2;
  }

  cleanKelimelikPureWord(rawStr, isTurkish) {
    if (!rawStr) return '';
    const upper = isTurkish
      ? rawStr.trim().toLocaleUpperCase('tr-TR')
      : rawStr.trim().toUpperCase();
    return upper.replace(/[^A-ZÇĞİÖŞÜ]/g, '');
  }

  /**
   * Tüm Havuzlar'daki kelimelerden SADECE İNGİLİZCE Kelimelik sözlüğünü (2..10 harf arası) oluşturur.
   */
  getKelimelikDictionary() {
    const sourceWords = this.getAllDatabaseWords();
    const entries = [];
    const seen = new Set();

    const addEntry = (pureWord, trText, enText) => {
      if (pureWord.length < 2 || pureWord.length > 10) return;
      const canonical = pureWord.replace(/İ/g, 'I');
      if (seen.has(canonical)) return;
      seen.add(canonical);
      let baseScore = 0;
      for (const ch of pureWord) {
        baseScore += this.getKelimelikLetterPoints(ch);
      }
      entries.push({
        word: pureWord,
        canonical,
        tr: trText,
        en: enText,
        lang: 'EN',
        baseScore
      });
    };

    sourceWords.forEach(item => {
      if (!item || !item.tr || !item.en) return;
      const enClean = String(item.en || '').trim().toUpperCase().replace(/[^A-Z]/g, '');
      addEntry(enClean, item.tr.trim(), item.en.trim());
    });

    return entries;
  }

  /**
   * Simetrik ekstra puanlı (★, 3K, 2K, 3H, 2H) Kelimelik tahtasını oluşturur.
   */
  computeKelimelikBonusType(r, c, N) {
    const mid = Math.floor(N / 2);
    if (r === mid && c === mid) return 'STAR';

    const dr = Math.abs(r - mid);
    const dc = Math.abs(c - mid);

    // Köşeler ve kenar ortaları: 3K (3 Kat Kelime Puanı)
    if ((r === 0 || r === N - 1) && (c === 0 || c === N - 1)) return '3K';
    if ((r === 0 || r === N - 1) && c === mid) return '3K';
    if ((c === 0 || c === N - 1) && r === mid) return '3K';

    // Ana köşegenler üzerinde 2K (2 Kat Kelime Puanı)
    if (dr === dc && dr >= 2 && dr <= mid - 1) {
      if (dr === 2 || dr === 4 || dr === mid - 1) return '2K';
    }

    // 3H (3 Kat Harf Puanı)
    if ((dr === 1 && dc === 3) || (dr === 3 && dc === 1) || (dr === 3 && dc === 3)) {
      return '3H';
    }
    if (N >= 13 && ((dr === 0 && dc === 4) || (dr === 4 && dc === 0))) {
      return '3H';
    }

    // 2H (2 Kat Harf Puanı)
    if ((dr === 1 && dc === 1) || (dr === 0 && dc === 2) || (dr === 2 && dc === 0)) {
      return '2H';
    }
    if ((r === 0 || r === N - 1) && (dc === 2 || dc === 3)) {
      return '2H';
    }
    if ((c === 0 || c === N - 1) && (dr === 2 || dr === 3)) {
      return '2H';
    }

    return null;
  }

  generateNewKelimelikPuzzle() {
    if (!this.kelimelikGridEl) return;
    this.hideKelimelikHintPopup();

    const st = this.kelimelikState;
    const sizeSelect = document.getElementById('kelimelikGridSizeSelect');
    if (sizeSelect) {
      st.gridSize = parseInt(sizeSelect.value, 10) || 11;
      const opt = sizeSelect.selectedOptions ? sizeSelect.selectedOptions[0] : null;
      const mins = opt && opt.dataset.mins ? parseInt(opt.dataset.mins, 10) : (st.gridSize === 15 ? 20 : st.gridSize === 13 ? 15 : 10);
      st.timerTotalSeconds = mins * 60;
      st.timerRemainingSeconds = mins * 60;
    } else {
      st.timerTotalSeconds = 10 * 60;
      st.timerRemainingSeconds = 10 * 60;
    }
    this.startKelimelikTimer();
    const N = st.gridSize || 11;
    const mid = Math.floor(N / 2);

    st.victoryShown = false;
    st.score = 0;
    st.solvedCount = 0;
    st.targetWords = 10;
    st.solvedHistory = [];
    st.hintsUsed = 0;
    st.hintCycleIdx = 0;
    st.currentTurnUsedHint = false;
    st.streak = 0;
    st.direction = 'H';
    st.isCheckingAnimation = false;

    const allWordsCount = this.getAllDatabaseWords().length;
    if (this.kelimelikStatPoolEl) {
      this.kelimelikStatPoolEl.textContent = `${allWordsCount}`;
    }

    st.grid = Array.from({ length: N }, (_, r) =>
      Array.from({ length: N }, (_, c) => ({
        r,
        c,
        bonus: this.computeKelimelikBonusType(r, c, N),
        userChar: '',
        locked: false,
        rackTileId: null
      }))
    );

    st.focusedCell = { r: mid, c: Math.max(0, mid - 1) };
    st.rack = [];

    this.renderKelimelikGrid();
    this.refillKelimelikRack(true);
    this.updateKelimelikStats();
    this.evaluateCurrentKelimelikPlacement();
  }

  /**
   * Verilen harf dizisi (10 harf) ile Tüm Havuzlar sözlüğünden üretilebilecek tüm kelimeleri bulur.
   */
  findPlayableWordsFromRack(rackChars = null) {
    const st = this.kelimelikState;
    const chars = Array.isArray(rackChars)
      ? rackChars
      : st.rack.map(t => t.char);

    const dict = this.getKelimelikDictionary();
    const solvedSet = new Set(st.solvedHistory || []);
    const playable = [];

    for (const entry of dict) {
      if (entry.word.length > chars.length) continue;
      const pool = [...chars];
      let canForm = true;
      for (const reqCh of entry.word) {
        const idx = pool.findIndex(c => this.lettersMatch(c, reqCh));
        if (idx === -1) {
          canForm = false;
          break;
        }
        pool.splice(idx, 1);
      }
      if (canForm) {
        playable.push({
          ...entry,
          alreadyUsed: solvedSet.has(entry.canonical)
        });
      }
    }

    // Önce bu oyunda henüz kullanılmamış ve yüksek puanlı/orta uzunluktaki kelimeleri sırala
    playable.sort((a, b) => {
      if (a.alreadyUsed !== b.alreadyUsed) return a.alreadyUsed ? 1 : -1;
      return b.word.length - a.word.length || b.baseScore - a.baseScore;
    });

    return playable;
  }

  /**
   * 10 Harfli İstakayı her zaman Tüm Havuzlar'dan en az 1-2 kelime üretilebilecek şekilde doldurur.
   */
  refillKelimelikRack(forceFullReset = false) {
    const st = this.kelimelikState;
    const dict = this.getKelimelikDictionary();
    const solvedSet = new Set(st.solvedHistory || []);

    // Mevcut ıstakada kullanılmamış taşları koru (forceFullReset değilse)
    const keptTiles = forceFullReset ? [] : st.rack.filter(t => !t.used);
    const currentChars = keptTiles.map(t => t.char);

    // Uygun uzunluktaki (3..8 harf) aday kelimeler
    const freshCandidates = dict.filter(d => d.word.length >= 3 && d.word.length <= 8 && !solvedSet.has(d.canonical));
    const poolCandidates = freshCandidates.length > 0 ? freshCandidates : dict.filter(d => d.word.length >= 2 && d.word.length <= 8);
    const shuffledCandidates = this.shuffleArray([...poolCandidates]);

    // Mevcut taşların üzerine eklenerek 10 taş içinde tamamlanabilecek kelimeleri seç ve eksik harflerini ekle
    const addedChars = [];
    for (const cand of shuffledCandidates) {
      const availableNow = [...currentChars, ...addedChars];
      const remainingCap = 10 - availableNow.length;
      if (remainingCap <= 0) break;

      const tempPool = [...availableNow];
      const missing = [];
      for (const ch of cand.word) {
        const idx = tempPool.findIndex(c => this.lettersMatch(c, ch));
        if (idx !== -1) {
          tempPool.splice(idx, 1);
        } else {
          missing.push(ch);
        }
      }

      if (missing.length <= remainingCap) {
        addedChars.push(...missing);
      }
    }

    // Hâlâ 10 harften azsa havuzdaki kelimelerin harflerinden tamamla
    if (currentChars.length + addedChars.length < 10 && shuffledCandidates.length > 0) {
      const donorWord = shuffledCandidates[0].word;
      let i = 0;
      while (currentChars.length + addedChars.length < 10) {
        addedChars.push(donorWord[i % donorWord.length]);
        i++;
      }
    }

    let finalTenChars = [...currentChars, ...addedChars].slice(0, 10);

    // Güvenlik kontrolü: Bu 10 harfle Tüm Havuzlar'dan en az 1 kelime kesinlikle üretilebiliyor mu?
    const playableCheck = this.findPlayableWordsFromRack(finalTenChars);
    if (playableCheck.length === 0 && shuffledCandidates.length > 0) {
      const guaranteedWord = shuffledCandidates[0].word;
      const wordChars = guaranteedWord.split('');
      const restChars = finalTenChars.slice(0, Math.max(0, 10 - wordChars.length));
      finalTenChars = [...wordChars, ...restChars];
      while (finalTenChars.length < 10) {
        finalTenChars.push('A');
      }
      this.shuffleArray(finalTenChars);
      st.rack = finalTenChars.map((ch, idx) => ({
        id: `kt_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
        char: ch,
        pts: this.getKelimelikLetterPoints(ch),
        used: false
      }));
    } else {
      this.shuffleArray(addedChars);
      const newTiles = addedChars.map((ch, idx) => ({
        id: `kt_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
        char: ch,
        pts: this.getKelimelikLetterPoints(ch),
        used: false
      }));
      st.rack = [...keptTiles, ...newTiles].slice(0, 10);
    }

    st.hintCycleIdx = 0;
    this.renderKelimelikRack();
  }

  applyKelimelikResponsiveGridScale() {
    if (!this.kelimelikGridEl) return;
    const N = this.kelimelikState.gridSize || 11;
    const isDesktop = window.innerWidth > 768;

    if (!isDesktop) {
      const vw = Math.max(300, window.innerWidth - 36);
      const gapPx = 3;
      const boardPad = 16;
      const fitCell = Math.floor((vw - boardPad - (N - 1) * gapPx) / N);
      const cellPx = Math.max(26, Math.min(44, fitCell));
      const letterPx = Math.max(12, Math.round(cellPx * 0.46));

      this.kelimelikGridEl.style.setProperty('--cell-size', `${cellPx}px`);
      this.kelimelikGridEl.style.setProperty('--cell-width', `${cellPx}px`);
      this.kelimelikGridEl.style.setProperty('--cell-height', `${cellPx}px`);
      this.kelimelikGridEl.style.setProperty('--grid-gap', `${gapPx}px`);
      this.kelimelikGridEl.style.setProperty('--letter-font-size', `${letterPx}px`);

      this.kelimelikGridEl.style.width = '';
      this.kelimelikGridEl.style.height = '';
      this.kelimelikGridEl.style.gridTemplateColumns = `repeat(${N}, ${cellPx}px)`;
      this.kelimelikGridEl.style.gridTemplateRows = `repeat(${N}, ${cellPx}px)`;
      return;
    }

    this.kelimelikGridEl.style.width = '0px';
    this.kelimelikGridEl.style.height = '0px';

    const containerW = (this.kelimelikGridScrollContainer && this.kelimelikGridScrollContainer.clientWidth) || (window.innerWidth - 80);
    const containerH = (this.kelimelikGridScrollContainer && this.kelimelikGridScrollContainer.clientHeight) || (window.innerHeight - 260);

    const maxSquareSide = Math.max(240, Math.floor(Math.min(containerW, containerH) - 16));
    const gapPx = 4;
    const boardPad = 19;

    const cellPx = Math.max(24, Math.min(54, Math.floor((maxSquareSide - boardPad - (N - 1) * gapPx) / N)));
    const exactBoardPx = N * cellPx + (N - 1) * gapPx + boardPad;
    const letterPx = Math.max(13, Math.round(cellPx * 0.46));

    this.kelimelikGridEl.style.setProperty('--cell-size', `${cellPx}px`);
    this.kelimelikGridEl.style.setProperty('--cell-width', `${cellPx}px`);
    this.kelimelikGridEl.style.setProperty('--cell-height', `${cellPx}px`);
    this.kelimelikGridEl.style.setProperty('--grid-gap', `${gapPx}px`);
    this.kelimelikGridEl.style.setProperty('--letter-font-size', `${letterPx}px`);

    this.kelimelikGridEl.style.width = `${exactBoardPx}px`;
    this.kelimelikGridEl.style.height = `${exactBoardPx}px`;
    this.kelimelikGridEl.style.gridTemplateColumns = `repeat(${N}, ${cellPx}px)`;
    this.kelimelikGridEl.style.gridTemplateRows = `repeat(${N}, ${cellPx}px)`;
  }

  getKelimelikCellElement(r, c) {
    if (!this.kelimelikGridEl) return null;
    return this.kelimelikGridEl.querySelector(`.cw-cell[data-kr="${r}"][data-kc="${c}"]`);
  }

  renderKelimelikGrid() {
    if (!this.kelimelikGridEl) return;
    this.applyKelimelikResponsiveGridScale();
    if (window.innerWidth > 768) {
      requestAnimationFrame(() => this.applyKelimelikResponsiveGridScale());
    }

    const st = this.kelimelikState;
    const N = st.gridSize;
    this.kelimelikGridEl.innerHTML = '';

    const bonusMeta = {
      STAR: { main: '★', sub: '2K' },
      '3K': { main: '3K', sub: 'KELİME' },
      '2K': { main: '2K', sub: 'KELİME' },
      '3H': { main: '3H', sub: 'HARF' },
      '2H': { main: '2H', sub: 'HARF' }
    };

    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const cellData = st.grid[r][c];
        const cellDiv = document.createElement('div');
        cellDiv.className = 'cw-cell kelimelik-board-cell';
        if (cellData.bonus) {
          cellDiv.classList.add(`bonus-${cellData.bonus}`);
        }
        cellDiv.dataset.kr = r;
        cellDiv.dataset.kc = c;

        if (cellData.bonus && bonusMeta[cellData.bonus]) {
          const bMain = document.createElement('span');
          bMain.className = 'kelimelik-bonus-label';
          bMain.textContent = bonusMeta[cellData.bonus].main;
          const bSub = document.createElement('span');
          bSub.className = 'kelimelik-bonus-sub';
          bSub.textContent = bonusMeta[cellData.bonus].sub;
          cellDiv.appendChild(bMain);
          cellDiv.appendChild(bSub);
        }

        const charSpan = document.createElement('span');
        charSpan.className = 'kelimelik-cell-letter';
        charSpan.textContent = cellData.userChar || '';
        cellDiv.appendChild(charSpan);

        const ptsSpan = document.createElement('span');
        ptsSpan.className = 'kelimelik-cell-pts';
        ptsSpan.textContent = cellData.userChar ? String(this.getKelimelikLetterPoints(cellData.userChar)) : '';
        cellDiv.appendChild(ptsSpan);

        cellDiv.addEventListener('pointerdown', (e) => {
          if (e.button && e.button !== 0) return;
          this.onKelimelikCellPointerDown(e, r, c);
        });

        this.kelimelikGridEl.appendChild(cellDiv);
      }
    }
  }

  renderKelimelikRack() {
    if (!this.kelimelikRackTilesEl) return;
    const st = this.kelimelikState;
    this.kelimelikRackTilesEl.innerHTML = '';

    st.rack.forEach((tile) => {
      const tileEl = document.createElement('div');
      tileEl.className = `kelimelik-rack-tile ${tile.used ? 'is-used' : ''}`;
      tileEl.dataset.tileId = tile.id;
      tileEl.innerHTML = `
        <span>${this.escapeHTML(tile.char)}</span>
        <small class="kelimelik-tile-pts">${tile.pts || this.getKelimelikLetterPoints(tile.char)}</small>
      `;

      if (!tile.used) {
        tileEl.addEventListener('pointerdown', (e) => {
          if (e.button && e.button !== 0) return;
          this.startKelimelikTileDrag(e, tile);
        });
      }

      this.kelimelikRackTilesEl.appendChild(tileEl);
    });
  }

  startKelimelikTileDrag(e, tile) {
    const st = this.kelimelikState;
    if (st.isCheckingAnimation || tile.used) return;
    e.preventDefault();

    const startX = e.clientX;
    const startY = e.clientY;
    let isDragging = false;
    let ghostEl = null;
    let lastHoverCellEl = null;

    const sourceTileEl = this.kelimelikRackTilesEl
      ? this.kelimelikRackTilesEl.querySelector(`.kelimelik-rack-tile[data-tile-id="${tile.id}"]`)
      : null;

    const clearHoverHighlight = () => {
      if (lastHoverCellEl) {
        lastHoverCellEl.classList.remove('drop-target-hover');
        lastHoverCellEl = null;
      }
    };

    const getDropBoardCellFromPoint = (x, y) => {
      const el = document.elementFromPoint(x, y);
      if (!el) return null;
      const cellDiv = el.closest('#kelimelikGrid .cw-cell.kelimelik-board-cell');
      if (!cellDiv) return null;
      const r = parseInt(cellDiv.dataset.kr, 10);
      const c = parseInt(cellDiv.dataset.kc, 10);
      if (isNaN(r) || isNaN(c)) return null;
      if (st.grid[r][c].locked) return null;
      return { cellDiv, r, c };
    };

    const onPointerMove = (moveEv) => {
      const dx = moveEv.clientX - startX;
      const dy = moveEv.clientY - startY;

      if (!isDragging && Math.hypot(dx, dy) > 6) {
        isDragging = true;
        if (sourceTileEl) sourceTileEl.classList.add('is-dragging');
        ghostEl = document.createElement('div');
        ghostEl.className = 'kelimelik-drag-ghost';
        ghostEl.textContent = tile.char;
        document.body.appendChild(ghostEl);
      }

      if (isDragging && ghostEl) {
        ghostEl.style.left = `${moveEv.clientX}px`;
        ghostEl.style.top = `${moveEv.clientY}px`;

        clearHoverHighlight();
        const targetInfo = getDropBoardCellFromPoint(moveEv.clientX, moveEv.clientY);
        if (targetInfo) {
          lastHoverCellEl = targetInfo.cellDiv;
          lastHoverCellEl.classList.add('drop-target-hover');
        }
      }
    };

    const onPointerUp = (upEv) => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);

      clearHoverHighlight();
      if (sourceTileEl) sourceTileEl.classList.remove('is-dragging');
      if (ghostEl && ghostEl.parentNode) {
        ghostEl.parentNode.removeChild(ghostEl);
      }

      if (isDragging) {
        const dropTarget = getDropBoardCellFromPoint(upEv.clientX, upEv.clientY);
        if (dropTarget) {
          this.placeRackTileIntoKelimelikCell(tile.id, dropTarget.r, dropTarget.c);
        }
      } else {
        // Kısa dokunuş / tıklama: seçili hücreye (veya yanındaki ilk boş hücreye) yerleştir
        const targetCoord = this.findNextKelimelikPlacementCell();
        if (targetCoord) {
          this.placeRackTileIntoKelimelikCell(tile.id, targetCoord.r, targetCoord.c);
        }
      }
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  }

  findNextKelimelikPlacementCell() {
    const st = this.kelimelikState;
    const N = st.gridSize;
    const mid = Math.floor(N / 2);

    if (st.focusedCell) {
      const { r, c } = st.focusedCell;
      if (!st.grid[r][c].userChar && !st.grid[r][c].locked) {
        return { r, c };
      }
      const dr = st.direction === 'V' ? 1 : 0;
      const dc = st.direction === 'H' ? 1 : 0;
      let nr = r + dr;
      let nc = c + dc;
      while (nr >= 0 && nr < N && nc >= 0 && nc < N) {
        if (!st.grid[nr][nc].userChar && !st.grid[nr][nc].locked) {
          return { r: nr, c: nc };
        }
        nr += dr;
        nc += dc;
      }
    }

    // Merkez satırda boş hücre ara
    for (let c = 0; c < N; c++) {
      if (!st.grid[mid][c].userChar && !st.grid[mid][c].locked) {
        return { r: mid, c };
      }
    }

    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (!st.grid[r][c].userChar && !st.grid[r][c].locked) {
          return { r, c };
        }
      }
    }
    return null;
  }

  onKelimelikCellPointerDown(e, r, c) {
    const st = this.kelimelikState;
    if (st.isCheckingAnimation) return;
    if (st.activeHintPreviewCells && st.activeHintPreviewCells.length > 0) {
      this.clearKelimelikHintHighlights();
    }
    const cellData = st.grid[r][c];
    if (!cellData) return;

    const hasMovableTile = Boolean(cellData.userChar && !cellData.locked);
    if (!hasMovableTile) {
      if (st.focusedCell && st.focusedCell.r === r && st.focusedCell.c === c) {
        st.direction = st.direction === 'H' ? 'V' : 'H';
      } else {
        st.focusedCell = { r, c };
      }
      this.sfx.playType();
      this.evaluateCurrentKelimelikPlacement();
      return;
    }

    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    let isDragging = false;
    let ghostEl = null;
    let lastHoverCellEl = null;
    const draggedChar = cellData.userChar;
    const draggedTileId = cellData.rackTileId;

    const clearHoverHighlight = () => {
      if (lastHoverCellEl) {
        lastHoverCellEl.classList.remove('drop-target-hover');
        lastHoverCellEl = null;
      }
    };

    const getDropBoardCellFromPoint = (x, y) => {
      const el = document.elementFromPoint(x, y);
      if (!el) return null;
      const cellDiv = el.closest('#kelimelikGrid .cw-cell.kelimelik-board-cell');
      if (!cellDiv) return null;
      const tr = parseInt(cellDiv.dataset.kr, 10);
      const tc = parseInt(cellDiv.dataset.kc, 10);
      if (isNaN(tr) || isNaN(tc)) return null;
      if (st.grid[tr][tc].locked) return null;
      return { cellDiv, r: tr, c: tc };
    };

    const onPointerMove = (moveEv) => {
      const dx = moveEv.clientX - startX;
      const dy = moveEv.clientY - startY;

      if (!isDragging && Math.hypot(dx, dy) > 6) {
        isDragging = true;
        ghostEl = document.createElement('div');
        ghostEl.className = 'kelimelik-drag-ghost';
        ghostEl.textContent = draggedChar;
        document.body.appendChild(ghostEl);
      }

      if (isDragging && ghostEl) {
        ghostEl.style.left = `${moveEv.clientX}px`;
        ghostEl.style.top = `${moveEv.clientY}px`;
        clearHoverHighlight();
        const targetInfo = getDropBoardCellFromPoint(moveEv.clientX, moveEv.clientY);
        if (targetInfo && !(targetInfo.r === r && targetInfo.c === c)) {
          lastHoverCellEl = targetInfo.cellDiv;
          lastHoverCellEl.classList.add('drop-target-hover');
        }
      }
    };

    const onPointerUp = (upEv) => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);

      clearHoverHighlight();
      if (ghostEl && ghostEl.parentNode) {
        ghostEl.parentNode.removeChild(ghostEl);
      }

      if (isDragging) {
        const dropTarget = getDropBoardCellFromPoint(upEv.clientX, upEv.clientY);
        if (dropTarget && !(dropTarget.r === r && dropTarget.c === c)) {
          this.returnKelimelikCellTileToRack(r, c, true);
          if (draggedTileId) {
            this.placeRackTileIntoKelimelikCell(draggedTileId, dropTarget.r, dropTarget.c);
          }
        } else if (!dropTarget) {
          this.returnKelimelikCellTileToRack(r, c, false);
        }
      } else {
        // Üzerine tıklanınca taşı ıstakaya geri al
        this.returnKelimelikCellTileToRack(r, c, false);
        st.focusedCell = { r, c };
        this.evaluateCurrentKelimelikPlacement();
      }
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  }

  placeRackTileIntoKelimelikCell(tileId, r, c) {
    const st = this.kelimelikState;
    if (st.isCheckingAnimation) return;
    if (st.activeHintPreviewCells && st.activeHintPreviewCells.length > 0) {
      this.clearKelimelikHintHighlights();
    }
    const cell = st.grid[r] && st.grid[r][c];
    if (!cell || cell.locked) return;

    const tile = st.rack.find(t => t.id === tileId);
    if (!tile) return;

    if (cell.userChar && cell.rackTileId && cell.rackTileId !== tileId) {
      const prevTile = st.rack.find(t => t.id === cell.rackTileId);
      if (prevTile) prevTile.used = false;
    }

    // Aynı satırda veya sütunda önceden bırakılmış taş varsa yönü otomatik algıla
    const existingPlaced = this.getUnlockedPlacedKelimelikCells();
    if (existingPlaced.length === 1) {
      const first = existingPlaced[0];
      if (first.r === r && first.c !== c) st.direction = 'H';
      else if (first.c === c && first.r !== r) st.direction = 'V';
    }

    tile.used = true;
    cell.userChar = tile.char;
    cell.rackTileId = tile.id;

    // İmleci bir sonraki boş hücreye ilerlet
    const N = st.gridSize;
    const dr = st.direction === 'V' ? 1 : 0;
    const dc = st.direction === 'H' ? 1 : 0;
    let nr = r + dr;
    let nc = c + dc;
    let nextFocus = { r, c };
    while (nr >= 0 && nr < N && nc >= 0 && nc < N) {
      if (!st.grid[nr][nc].userChar) {
        nextFocus = { r: nr, c: nc };
        break;
      }
      nr += dr;
      nc += dc;
    }
    st.focusedCell = nextFocus;

    this.sfx.playType();
    this.updateKelimelikCellDOM(r, c);
    this.renderKelimelikRack();
    this.evaluateCurrentKelimelikPlacement();
  }

  returnKelimelikCellTileToRack(r, c, silent = false) {
    const st = this.kelimelikState;
    const cell = st.grid[r] && st.grid[r][c];
    if (!cell || cell.locked || !cell.userChar) return;

    if (cell.rackTileId) {
      const tile = st.rack.find(t => t.id === cell.rackTileId);
      if (tile) tile.used = false;
    } else {
      const matchingUsed = st.rack.find(t => t.used && this.lettersMatch(t.char, cell.userChar));
      if (matchingUsed) matchingUsed.used = false;
    }

    cell.userChar = '';
    cell.rackTileId = null;
    this.updateKelimelikCellDOM(r, c);
    this.renderKelimelikRack();
    this.evaluateCurrentKelimelikPlacement();
    if (!silent) {
      this.sfx.playDelete();
    }
  }

  returnAllUnlockedKelimelikTilesToRack(silent = false) {
    const st = this.kelimelikState;
    if (st.isCheckingAnimation) return;
    const N = st.gridSize;
    let returnedAny = false;

    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const cell = st.grid[r][c];
        if (cell.userChar && !cell.locked) {
          cell.userChar = '';
          cell.rackTileId = null;
          this.updateKelimelikCellDOM(r, c);
          returnedAny = true;
        }
      }
    }

    st.rack.forEach(t => { t.used = false; });
    this.renderKelimelikRack();
    this.evaluateCurrentKelimelikPlacement();
    if (!silent) {
      if (returnedAny) this.sfx.playDelete();
      else this.sfx.playType();
    }
  }

  getUnlockedPlacedKelimelikCells() {
    const st = this.kelimelikState;
    const N = st.gridSize;
    const list = [];
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const cell = st.grid[r][c];
        if (cell.userChar && !cell.locked) {
          list.push(cell);
        }
      }
    }
    return list;
  }

  /**
   * Bir kelime zincirinin (yatay veya dikey hücre dizisi) bonus çarpanlarıyla (2H, 3H, 2K, 3K, ★)
   * toplam puanını hesaplar.
   */
  calculateKelimelikChainScore(wordCells) {
    let letterSum = 0;
    let wordMultiplier = 1;
    const activeBonuses = [];

    wordCells.forEach(cell => {
      const basePts = this.getKelimelikLetterPoints(cell.userChar);
      if (!cell.locked && cell.bonus) {
        if (cell.bonus === '2H') {
          letterSum += basePts * 2;
          activeBonuses.push('2H');
        } else if (cell.bonus === '3H') {
          letterSum += basePts * 3;
          activeBonuses.push('3H');
        } else if (cell.bonus === '2K' || cell.bonus === 'STAR') {
          letterSum += basePts;
          wordMultiplier *= 2;
          activeBonuses.push(cell.bonus === 'STAR' ? '★ 2K' : '2K');
        } else if (cell.bonus === '3K') {
          letterSum += basePts;
          wordMultiplier *= 3;
          activeBonuses.push('3K');
        } else {
          letterSum += basePts;
        }
      } else {
        letterSum += basePts;
      }
    });

    return {
      totalScore: letterSum * wordMultiplier,
      activeBonuses
    };
  }

  /**
   * Tahtaya bırakılan HER taş için hem soldan sağa (Yatay) hem de yukarıdan aşağı (Dikey)
   * oluşan tüm bitişik harf dizilerini tarar; bir veya birden fazla geçerli kelime oluşmuşsa
   * tamamını tespit eder ve puanlarını toplar.
   */
  /**
   * Kelimelik tahtasında şu anda bırakılmış olan tüm taşların (unlocked)
   * oluşturduğu TÜM kelimeleri hem yatay hem dikey kontrol eder.
   * - İlk kelime tahtanın istenilen yerine konulabilir (Merkez yıldız ⭐ zorunlu değil, 2K bonus karesidir).
   * - Oyuncu hem yatay hem dikey hatlarda harf türetebilir.
   * - Tahtada birbirine temas eden TÜM kelimeler (yatay ve dikey tüm zincirler) havuzda geçerli olmalıdır.
   */
  inspectCurrentKelimelikCandidate() {
    const st = this.kelimelikState;
    const N = st.gridSize;
    const placed = this.getUnlockedPlacedKelimelikCells();

    if (placed.length === 0) {
      return {
        status: 'EMPTY',
        message: '⚠️ Tahtaya henüz bir kelime yerleştirmediniz. Harfleri tahtaya sürükleyin.'
      };
    }

    // 1) Aynı satır veya aynı sütundaki harfler arasında boşluk (gap) kontrolü
    const sameRow = placed.every(p => p.r === placed[0].r);
    const sameCol = placed.every(p => p.c === placed[0].c);

    if (placed.length > 1 && (sameRow || sameCol)) {
      const dr = sameCol ? 1 : 0;
      const dc = sameRow ? 1 : 0;
      let curR = Math.min(...placed.map(p => p.r));
      let curC = Math.min(...placed.map(p => p.c));
      const maxR = Math.max(...placed.map(p => p.r));
      const maxC = Math.max(...placed.map(p => p.c));
      while (curR <= maxR && curC <= maxC) {
        if (!st.grid[curR][curC].userChar) {
          return {
            status: 'GAP',
            message: '⚠️ Harfler arasında boş kutucuk bırakılamaz! Harfleri bitişik dizin.'
          };
        }
        curR += dr;
        curC += dc;
      }
    }

    // 2) Kural 1 & 2: İlk kelime yıldız karesini kullanmalı, sonraki kelimeler kilitli taşlara bağlanmalı
    const hasLockedTiles = st.grid.some(row => row.some(cell => cell.locked && cell.userChar));
    const centerCoord = Math.floor(N / 2);

    if (!hasLockedTiles) {
      const touchesCenter = placed.some(p => p.r === centerCoord && p.c === centerCoord);
      if (!touchesCenter) {
        return {
          status: 'NO_CENTER',
          message: '⭐ İlk kelimede merkezdeki yıldız (⭐ 2K) hücresi kullanılmalıdır!'
        };
      }
    } else {
      const connectsToExisting = placed.some(p => {
        const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        return dirs.some(([dr, dc]) => {
          const nr = p.r + dr, nc = p.c + dc;
          return nr >= 0 && nr < N && nc >= 0 && nc < N && st.grid[nr][nc].locked && st.grid[nr][nc].userChar;
        });
      });

      if (!connectsToExisting) {
        return {
          status: 'DISCONNECTED',
          message: '⚠️ Yeni harfler tahtadaki mevcut kilitli kelimelerden en az birine yatay ya da dikey olarak bağlanmalıdır!'
        };
      }
    }

    const dict = this.getKelimelikDictionary();
    const chainMap = new Map();

    // Bırakılan her taşın hem yatay (H) hem dikey (V) uzantısını bul
    placed.forEach(p => {
      // 1) Soldan sağa (Yatay - H) kontrol
      let minC = p.c;
      let maxC = p.c;
      while (minC - 1 >= 0 && st.grid[p.r][minC - 1].userChar) minC--;
      while (maxC + 1 < N && st.grid[p.r][maxC + 1].userChar) maxC++;

      if (maxC - minC + 1 >= 2) {
        const keyH = `H:${p.r}:${minC}-${maxC}`;
        if (!chainMap.has(keyH)) {
          const cellsH = [];
          for (let c = minC; c <= maxC; c++) cellsH.push(st.grid[p.r][c]);
          chainMap.set(keyH, { key: keyH, dir: 'H', wordCells: cellsH });
        }
      }

      // 2) Yukarıdan aşağı (Dikey - V) kontrol
      let minR = p.r;
      let maxR = p.r;
      while (minR - 1 >= 0 && st.grid[minR - 1][p.c].userChar) minR--;
      while (maxR + 1 < N && st.grid[maxR + 1][p.c].userChar) maxR++;

      if (maxR - minR + 1 >= 2) {
        const keyV = `V:${p.c}:${minR}-${maxR}`;
        if (!chainMap.has(keyV)) {
          const cellsV = [];
          for (let r = minR; r <= maxR; r++) cellsV.push(st.grid[r][p.c]);
          chainMap.set(keyV, { key: keyV, dir: 'V', wordCells: cellsV });
        }
      }
    });

    if (chainMap.size === 0) {
      const singleChars = placed.map(p => p.userChar).join(', ');
      return {
        status: 'TOO_SHORT',
        formedWord: singleChars,
        wordCells: placed,
        message: `"${singleChars}" — Kelime oluşturmak için en az 2 harfli bitişik bir kelime yazın.`
      };
    }

    const allChains = Array.from(chainMap.values()).map(chain => {
      const formedWord = chain.wordCells.map(c => c.userChar).join('');
      const canonical = formedWord.replace(/İ/g, 'I');
      const matchedEntry = dict.find(d => d.canonical === canonical) || null;
      const { totalScore, activeBonuses } = this.calculateKelimelikChainScore(chain.wordCells);
      return {
        ...chain,
        formedWord,
        canonical,
        matchedEntry,
        totalScore,
        activeBonuses
      };
    });

    const validWords = allChains.filter(ch => ch.matchedEntry !== null);
    const invalidChains = allChains.filter(ch => ch.matchedEntry === null);

    // Tahtada birbirine değen TÜM kelimeler geçerli olmalıdır
    if (invalidChains.length > 0) {
      const badLabels = invalidChains
        .map(ch => `${ch.dir === 'H' ? '➔ (Yatay)' : '⬇ (Dikey)'} "${ch.formedWord}"`)
        .join(', ');
      return {
        status: 'NOT_IN_POOL',
        formedWord: invalidChains.map(ch => ch.formedWord).join(' / '),
        wordCells: invalidChains[0].wordCells,
        totalScore: 0,
        message: `❌ ${badLabels} havuzda bulunamadı! Birbirine değen tüm kelimeler geçerli olmalıdır.`
      };
    }

    // Bırakılan tüm taşların en az bir geçerli kelimenin parçası olduğunu doğrula
    const coveredPlacedKeys = new Set();
    validWords.forEach(vw => {
      vw.wordCells.forEach(cell => {
        if (!cell.locked) {
          coveredPlacedKeys.add(`${cell.r},${cell.c}`);
        }
      });
    });

    if (validWords.length > 0 && coveredPlacedKeys.size === placed.length) {
      const combinedScore = validWords.reduce((sum, vw) => sum + vw.totalScore, 0);
      const combinedBonuses = [];
      validWords.forEach(vw => {
        vw.activeBonuses.forEach(b => combinedBonuses.push(b));
      });
      const allWordCellsMap = new Map();
      validWords.forEach(vw => {
        vw.wordCells.forEach(cell => {
          allWordCellsMap.set(`${cell.r},${cell.c}`, cell);
        });
      });

      return {
        status: 'VALID',
        validWords,
        formedWord: validWords.map(w => w.formedWord).join(' + '),
        wordCells: Array.from(allWordCellsMap.values()),
        matchedEntry: validWords[0].matchedEntry,
        totalScore: combinedScore,
        activeBonuses: combinedBonuses
      };
    }

    if (validWords.length > 0 && coveredPlacedKeys.size < placed.length) {
      const validStr = validWords.map(w => `"${w.formedWord}"`).join(', ');
      const extraChars = placed
        .filter(p => !coveredPlacedKeys.has(`${p.r},${p.c}`))
        .map(p => `"${p.userChar}"`)
        .join(', ');
      return {
        status: 'PARTIAL_UNMATCHED',
        formedWord: validWords.map(w => w.formedWord).join(' + '),
        totalScore: validWords.reduce((sum, vw) => sum + vw.totalScore, 0),
        message: `✅ ${validStr} geçerli, ancak tahtadaki ${extraChars} harfi henüz bir kelimeye bağlı değil.`
      };
    }

    return {
      status: 'NOT_IN_POOL',
      formedWord: allChains.map(ch => ch.formedWord).join(' / '),
      wordCells: allChains[0].wordCells,
      totalScore: 0,
      message: `❌ Kelime Tüm Havuzlar'da eşleşmedi. Harf ekleyebilir veya değiştirebilirsiniz.`
    };
  }

  evaluateCurrentKelimelikPlacement() {
    if (!this.kelimelikGridEl) return;
    const st = this.kelimelikState;

    // Odaklı hücre vurgusunu güncelle
    this.kelimelikGridEl.querySelectorAll('.cw-cell.kelimelik-board-cell').forEach(el => {
      el.classList.remove('is-focused');
    });
    if (st.focusedCell) {
      const focusEl = this.getKelimelikCellElement(st.focusedCell.r, st.focusedCell.c);
      if (focusEl) focusEl.classList.add('is-focused');
    }

    const info = this.inspectCurrentKelimelikCandidate();

    if (this.kelimelikBannerCardEl) {
      this.kelimelikBannerCardEl.classList.toggle('is-valid-word', info.status === 'VALID');
    }

    if (info.status === 'VALID') {
      const validWords = info.validWords || [];
      const bonusStr = info.activeBonuses.length > 0 ? ` (${info.activeBonuses.join(' + ')} Bonusu!)` : '';
      if (this.kelimelikActiveClueDirEl) {
        this.kelimelikActiveClueDirEl.textContent = validWords.length > 1
          ? `✅ ${validWords.length} KELİME BİRDEN!`
          : '✅ GEÇERLİ KELİME!';
      }
      if (this.kelimelikActiveClueTextEl) {
        const wordsDesc = validWords
          .map(vw => `${vw.dir === 'H' ? '➔' : '⬇'} <strong>"${this.escapeHTML(vw.formedWord)}"</strong> (🇹🇷 ${this.escapeHTML(vw.matchedEntry.tr)} ⇄ 🇬🇧 ${this.escapeHTML(vw.matchedEntry.en)})`)
          .join(' &nbsp;+&nbsp; ');
        this.kelimelikActiveClueTextEl.innerHTML = `🎉 ${wordsDesc}${bonusStr} — Onaylamak için butona tıklayın!`;
      }
      if (this.kelimelikActiveClueLenEl) {
        this.kelimelikActiveClueLenEl.textContent = `⭐ +${info.totalScore} Puan`;
      }
      if (this.btnKelimelikSubmitWord) {
        this.btnKelimelikSubmitWord.disabled = false;
        this.btnKelimelikSubmitWord.classList.add('is-ready-pulse');
        this.btnKelimelikSubmitWord.textContent = validWords.length > 1
          ? `✅ ${validWords.length} Kelimeyi Onayla (+${info.totalScore} P)`
          : `✅ Kelimeyi Onayla (+${info.totalScore} P)`;
      }
    } else if (info.status === 'EMPTY') {
      if (this.kelimelikActiveClueDirEl) {
        this.kelimelikActiveClueDirEl.textContent = '🔠 Yatay & Dikey Kontrol';
      }
      if (this.kelimelikActiveClueTextEl) {
        this.kelimelikActiveClueTextEl.innerHTML = `İstakadaki <strong>10 harfi</strong> tahtaya sürükleyerek Tüm Havuzlar'dan istediğiniz kelimeyi üretin! Yardım için <strong>💡 İpucu (.)</strong> butonuna tıklayabilirsiniz.`;
      }
      if (this.kelimelikActiveClueLenEl) {
        this.kelimelikActiveClueLenEl.textContent = `⭐ ${st.score} Puan`;
      }
      if (this.btnKelimelikSubmitWord) {
        this.btnKelimelikSubmitWord.disabled = false;
        this.btnKelimelikSubmitWord.classList.remove('is-ready-pulse');
        this.btnKelimelikSubmitWord.textContent = '✍️ Kelimeyi Onayla';
      }
    } else {
      if (this.kelimelikActiveClueDirEl) {
        this.kelimelikActiveClueDirEl.textContent = '✍️ ↔↕ Kontrol Ediliyor';
      }
      if (this.kelimelikActiveClueTextEl) {
        this.kelimelikActiveClueTextEl.textContent = info.message || '';
      }
      if (this.kelimelikActiveClueLenEl) {
        this.kelimelikActiveClueLenEl.textContent = info.totalScore ? `+${info.totalScore} Puan` : '↔↕';
      }
      if (this.btnKelimelikSubmitWord) {
        this.btnKelimelikSubmitWord.disabled = false;
        this.btnKelimelikSubmitWord.classList.remove('is-ready-pulse');
        this.btnKelimelikSubmitWord.textContent = '✍️ Kelimeyi Onayla';
      }
    }
  }

  submitKelimelikWord() {
    const st = this.kelimelikState;
    if (st.isCheckingAnimation) return;

    const info = this.inspectCurrentKelimelikCandidate();
    if (info.status !== 'VALID') {
      // Hatalı kelime denemesi seriyi sıfırlar
      st.streak = 0;
      this.sfx.playError();
      const placed = this.getUnlockedPlacedKelimelikCells();
      placed.forEach(cell => {
        const domCell = this.getKelimelikCellElement(cell.r, cell.c);
        if (domCell) {
          domCell.classList.add('is-wrong');
          setTimeout(() => domCell.classList.remove('is-wrong'), 420);
        }
      });
      const errorMsg = info.message || `❌ "${info.formedWord || ''}" havuzda bulunamadı!`;
      if (this.kelimelikActiveClueTextEl) {
        this.kelimelikActiveClueTextEl.innerHTML = this.escapeHTML(errorMsg);
      }
      // Hem mobil hem masaüstünde anında uçan bildirim göster
      this.showFloatingToast(errorMsg, 'warning', 3200);
      return;
    }

    // Geçerli kelime(ler) onaylandı: hücreleri kilitle, puanı ekle ve ıstakayı tekrar 10 harfe tamamla
    info.wordCells.forEach(cell => {
      cell.locked = true;
      cell.rackTileId = null;
      this.updateKelimelikCellDOM(cell.r, cell.c);
    });

    const validWords = info.validWords || [];
    const wordsCount = Math.max(1, validWords.length);

    // Başarı uçan bildirimi
    this.showFloatingToast(`🎉 ${info.formedWord} (+${info.totalScore} Puan)!`, 'success', 2400);

    // Kullanılan taşları ıstakadan düşür ve yeni kelime üretilebilir 10 harfe tamamla
    st.rack = st.rack.filter(t => !t.used);
    st.score += info.totalScore;
    st.solvedCount += wordsCount;
    validWords.forEach(vw => {
      st.solvedHistory.push(vw.matchedEntry.canonical);
    });

    let celebratedStreak = false;
    if (!st.currentTurnUsedHint) {
      const prevStreak = st.streak || 0;
      st.streak = prevStreak + wordsCount;
      // 5 veya katı geçildiyse kutlama tetikle
      if (Math.floor(st.streak / 5) > Math.floor(prevStreak / 5)) {
        celebratedStreak = true;
        this.triggerStreakCelebration(Math.floor(st.streak / 5) * 5);
      }
    } else {
      st.streak = 0;
    }
    st.currentTurnUsedHint = false;

    if (!celebratedStreak) {
      this.sfx.playSuccess();
    }

    this.updateKelimelikStats();
    this.refillKelimelikRack(false);
    this.ensureKelimelikCanPlayOnBoard();
    this.evaluateCurrentKelimelikPlacement();

    if (this.kelimelikActiveClueDirEl) {
      this.kelimelikActiveClueDirEl.textContent = wordsCount > 1
        ? `🎉 ${wordsCount} KELİME (+${info.totalScore} P)!`
        : `🎉 +${info.totalScore} PUAN!`;
    }
    if (this.kelimelikActiveClueTextEl) {
      const summaryHtml = validWords
        .map(vw => `<strong>"${this.escapeHTML(vw.formedWord)}"</strong> (${this.escapeHTML(vw.matchedEntry.tr)} ⇄ ${this.escapeHTML(vw.matchedEntry.en)})`)
        .join(' + ');
      this.kelimelikActiveClueTextEl.innerHTML = `Harika! ${summaryHtml} ${wordsCount > 1 ? 'kelimelerinden' : 'kelimesinden'} <strong>+${info.totalScore} puan</strong> kazandınız! İstakanız 10 harfe tamamlandı.`;
    }

    // Hedef kelime sayısına (10 kelime) ulaşıldıysa tamamlama ekranını göster
    if (st.solvedCount >= st.targetWords && !st.victoryShown) {
      st.victoryShown = true;
      const delay = celebratedStreak ? 1600 : 650;
      setTimeout(() => {
        if (this.currentScreen === 'KELIMELIK') {
          this.showGrandVictoryModal({
            icon: '🔠',
            badge: 'KELİMELİK TAMAMLANDI!',
            title: 'Tebrikler! Oyunu Tamamladınız! 🎉',
            subtitle: `10 harfli ıstakadan ${st.solvedCount} kelime üreterek toplam ${st.score} puana ulaştınız ve oyunu tamamladınız!`,
            stat1Label: 'ÜRETİLEN KELİME',
            stat1Val: `${st.solvedCount} / ${st.targetWords}`,
            stat2Label: 'TOPLAM PUAN',
            stat2Val: `${st.score} Puan`
          });
        }
      }, delay);
    }
  }

  /**
   * Akıllı Kelimelik İpucu Arama Algoritması:
   * 1. Tahta boşsa (ilk hamle): Merkezdeki ⭐ 2K karesinden geçen ve eldeki 10 harfle yazılabilecek kelimeler önerilir.
   * 2. Tahtada kilitli taşlar varsa: Sadece eldeki harfler değil, tahtadaki kilitli harfler de hesaba katılır.
   *    Tahtadaki bir harfe yatay veya dikey bağlanarak kelime türetilir.
   *    Kritik: Tahtadaki harfe bağlanırken temas edilen TÜM yatay ve dikey yan zincirlerin
   *    Tüm Havuzlar sözlüğünde anlamlı olduğu ve ASLA anlamsız 2. bir kelime türetilmediği kesin olarak garanti edilir!
   */
  findPlayableHintMoves() {
    const st = this.kelimelikState;
    const N = st.gridSize;
    const dict = this.getKelimelikDictionary();
    const solvedSet = new Set(st.solvedHistory || []);
    const dictCanonicalSet = new Set(dict.map(d => d.canonical));

    // Tahtadaki kilitli taşları bul
    const lockedCells = [];
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (st.grid[r][c].locked && st.grid[r][c].userChar) {
          lockedCells.push({ r, c, char: st.grid[r][c].userChar });
        }
      }
    }

    const rackChars = st.rack.map(t => t.char);
    const centerCoord = Math.floor(N / 2);

    // SENARYO 1: Tahta henüz boş (İlk hamle) -> Mutlaka merkez ⭐ karesinden geçmeli!
    if (lockedCells.length === 0) {
      const rackWords = this.findPlayableWordsFromRack(rackChars);
      return rackWords.map(entry => {
        const len = entry.word.length;
        const startC = Math.max(0, centerCoord - Math.floor(len / 2));
        const cells = [];
        for (let i = 0; i < len; i++) {
          cells.push({ r: centerCoord, c: startC + i });
        }
        return {
          ...entry,
          dir: 'H',
          startR: centerCoord,
          startC,
          targetCells: cells,
          hintExplanation: `⭐ Tahtanın merkezindeki yıldızlı (⭐ 2K) kareden geçirerek "${entry.word}" yazabilirsiniz.`
        };
      });
    }

    // SENARYO 2: Tahtada kilitli taşlar var
    const candidateMoves = [];

    for (const anchor of lockedCells) {
      const aChar = anchor.char;

      for (const entry of dict) {
        const W = entry.word;
        const len = W.length;
        if (len < 2 || len > N) continue;

        for (let k = 0; k < len; k++) {
          if (!this.lettersMatch(W[k], aChar)) continue;

          // A) YATAY DENEME (dir = 'H')
          const startR = anchor.r;
          const startC = anchor.c - k;
          const endC = startC + len - 1;

          if (startC >= 0 && endC < N) {
            const leftOk = (startC === 0 || !st.grid[startR][startC - 1].userChar);
            const rightOk = (endC === N - 1 || !st.grid[startR][endC + 1].userChar);

            if (leftOk && rightOk) {
              let canPlaceH = true;
              let usedRackChars = [];
              let perpInvalid = false;

              for (let i = 0; i < len; i++) {
                const curC = startC + i;
                const cell = st.grid[startR][curC];
                const reqChar = W[i];

                if (cell.userChar) {
                  if (!this.lettersMatch(cell.userChar, reqChar)) {
                    canPlaceH = false;
                    break;
                  }
                } else {
                  usedRackChars.push(reqChar);

                  // Dikeyde temas eden yan zincir kontrolü (Anlamsız kelime türetilmemeli!)
                  const hasTop = (startR - 1 >= 0 && st.grid[startR - 1][curC].userChar);
                  const hasBottom = (startR + 1 < N && st.grid[startR + 1][curC].userChar);

                  if (hasTop || hasBottom) {
                    let minR = startR;
                    let maxR = startR;
                    while (minR - 1 >= 0 && st.grid[minR - 1][curC].userChar) minR--;
                    while (maxR + 1 < N && st.grid[maxR + 1][curC].userChar) maxR++;

                    let perpWord = '';
                    for (let r = minR; r <= maxR; r++) {
                      perpWord += (r === startR ? reqChar : st.grid[r][curC].userChar);
                    }
                    const canonPerp = perpWord.replace(/İ/g, 'I');
                    if (!dictCanonicalSet.has(canonPerp)) {
                      perpInvalid = true;
                      break;
                    }
                  }
                }
              }

              if (canPlaceH && !perpInvalid && usedRackChars.length > 0) {
                const tempRack = [...rackChars];
                let rackSufficient = true;
                for (const rc of usedRackChars) {
                  const idx = tempRack.findIndex(c => this.lettersMatch(c, rc));
                  if (idx === -1) {
                    rackSufficient = false;
                    break;
                  }
                  tempRack.splice(idx, 1);
                }

                if (rackSufficient) {
                  const targetCells = [];
                  for (let i = 0; i < len; i++) targetCells.push({ r: startR, c: startC + i });
                  candidateMoves.push({
                    ...entry,
                    dir: 'H',
                    anchorChar: aChar,
                    startR,
                    startC,
                    targetCells,
                    usedCount: usedRackChars.length,
                    alreadyUsed: solvedSet.has(entry.canonical),
                    hintExplanation: `💡 Tahtadaki "${aChar}" harfini kullanarak yatayda "${entry.word}" yazabilirsiniz.`
                  });
                }
              }
            }
          }

          // B) DİKEY DENEME (dir = 'V')
          const vStartR = anchor.r - k;
          const vStartC = anchor.c;
          const vEndR = vStartR + len - 1;

          if (vStartR >= 0 && vEndR < N) {
            const topOk = (vStartR === 0 || !st.grid[vStartR - 1][vStartC].userChar);
            const bottomOk = (vEndR === N - 1 || !st.grid[vEndR + 1][vStartC].userChar);

            if (topOk && bottomOk) {
              let canPlaceV = true;
              let usedRackCharsV = [];
              let perpInvalidV = false;

              for (let i = 0; i < len; i++) {
                const curR = vStartR + i;
                const cell = st.grid[curR][vStartC];
                const reqChar = W[i];

                if (cell.userChar) {
                  if (!this.lettersMatch(cell.userChar, reqChar)) {
                    canPlaceV = false;
                    break;
                  }
                } else {
                  usedRackCharsV.push(reqChar);

                  // Yatayda temas eden yan zincir kontrolü (Anlamsız kelime türetilmemeli!)
                  const hasLeft = (vStartC - 1 >= 0 && st.grid[curR][vStartC - 1].userChar);
                  const hasRight = (vStartC + 1 < N && st.grid[curR][vStartC + 1].userChar);

                  if (hasLeft || hasRight) {
                    let minC = vStartC;
                    let maxC = vStartC;
                    while (minC - 1 >= 0 && st.grid[curR][minC - 1].userChar) minC--;
                    while (maxC + 1 < N && st.grid[curR][maxC + 1].userChar) maxC++;

                    let perpWord = '';
                    for (let c = minC; c <= maxC; c++) {
                      perpWord += (c === vStartC ? reqChar : st.grid[curR][c].userChar);
                    }
                    const canonPerp = perpWord.replace(/İ/g, 'I');
                    if (!dictCanonicalSet.has(canonPerp)) {
                      perpInvalidV = true;
                      break;
                    }
                  }
                }
              }

              if (canPlaceV && !perpInvalidV && usedRackCharsV.length > 0) {
                const tempRack = [...rackChars];
                let rackSufficient = true;
                for (const rc of usedRackCharsV) {
                  const idx = tempRack.findIndex(c => this.lettersMatch(c, rc));
                  if (idx === -1) {
                    rackSufficient = false;
                    break;
                  }
                  tempRack.splice(idx, 1);
                }

                if (rackSufficient) {
                  const targetCells = [];
                  for (let i = 0; i < len; i++) targetCells.push({ r: vStartR + i, c: vStartC });
                  candidateMoves.push({
                    ...entry,
                    dir: 'V',
                    anchorChar: aChar,
                    startR: vStartR,
                    startC: vStartC,
                    targetCells,
                    usedCount: usedRackCharsV.length,
                    alreadyUsed: solvedSet.has(entry.canonical),
                    hintExplanation: `💡 Tahtadaki "${aChar}" harfini kullanarak dikeyde "${entry.word}" yazabilirsiniz.`
                  });
                }
              }
            }
          }
        }
      }
    }

    return candidateMoves;
  }

  /**
   * Her başarılı hamleden sonra tahtadaki kilitli taşlar ile mevcut 10 harfin
   * birlikte kurala uygun (tahtaya bağlanan ve yanlarda anlamsız kelime türetmeyen)
   * en az 1 kelime türetip türetemediğini kontrol eder.
   * - Türetebiliyorsa: Oyun sessizce devam eder (bildirime gerek yok).
   * - Türetilemiyorsa: Kullanıcıya bildirim verir ve tahtaya bağlanabilecek bir kelime
   *   oluşana kadar 10 harfi otomatik olarak rastgele günceller.
   */
  ensureKelimelikCanPlayOnBoard() {
    const st = this.kelimelikState;
    let playableMoves = this.findPlayableHintMoves();

    if (playableMoves.length > 0) {
      // Tahtaya bağlanabilen geçerli kelime var, sessizce devam et
      return;
    }

    // Tahtadaki kelimeler ve bizdeki 10 kelime ile yeni bir kelime oluşmuyor: Bildirim ver!
    this.showFloatingToast('🔄 Tahtaya bağlanacak yeni kelime kalmadığı için harfleriniz otomatik olarak yenilendi!', 'info', 3600);
    this.sfx.playType();

    // Yeni kelime oluşturabilecek harfler denk gelene kadar döngü devam etsin
    let attempts = 0;
    while (playableMoves.length === 0 && attempts < 40) {
      attempts++;
      this.generatePlayableRackForBoardState();
      playableMoves = this.findPlayableHintMoves();
    }

    this.renderKelimelikRack();
  }

  /**
   * Tahtadaki kilitli harflerle eşleşebilecek garantili harfler ve rastgele İngilizce harflerle
   * 10'luk ıstakayı yeniden üretir.
   */
  generatePlayableRackForBoardState() {
    const st = this.kelimelikState;
    const N = st.gridSize;
    const dict = this.getKelimelikDictionary();
    const commonVowels = ['A', 'E', 'I', 'O', 'U'];
    const commonConsonants = ['R', 'S', 'T', 'L', 'N', 'D', 'C', 'M', 'P', 'B'];

    // Tahtadaki kilitli hücreleri topla
    const lockedCells = [];
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (st.grid[r][c].locked && st.grid[r][c].userChar) {
          lockedCells.push({ r, c, char: st.grid[r][c].userChar });
        }
      }
    }

    let guaranteedNewChars = [];

    if (lockedCells.length === 0) {
      const candidates = dict.filter(d => d.word.length >= 3 && d.word.length <= 7);
      const chosen = candidates[Math.floor(Math.random() * candidates.length)] || dict[0];
      guaranteedNewChars = chosen.word.split('');
    } else {
      const shuffledAnchors = this.shuffleArray([...lockedCells]);
      let foundWord = null;

      for (const anchor of shuffledAnchors) {
        const matchingEntries = dict.filter(d => d.word.length >= 3 && d.word.length <= 8 && d.word.includes(anchor.char));
        if (matchingEntries.length > 0) {
          const cand = matchingEntries[Math.floor(Math.random() * matchingEntries.length)];
          const chars = cand.word.split('');
          const anchorIdx = chars.indexOf(anchor.char);
          if (anchorIdx !== -1) chars.splice(anchorIdx, 1);
          guaranteedNewChars = chars;
          foundWord = cand;
          break;
        }
      }

      if (!foundWord) {
        const cand = dict[Math.floor(Math.random() * dict.length)];
        guaranteedNewChars = cand.word.slice(0, 5).split('');
      }
    }

    const newRackChars = [...guaranteedNewChars];
    while (newRackChars.length < 10) {
      const pickVowel = (newRackChars.length % 2 === 0);
      const pool = pickVowel ? commonVowels : commonConsonants;
      newRackChars.push(pool[Math.floor(Math.random() * pool.length)]);
    }

    this.shuffleArray(newRackChars);

    st.rack = newRackChars.slice(0, 10).map((ch, idx) => ({
      id: `kt_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
      char: ch,
      pts: this.getKelimelikLetterPoints(ch),
      used: false
    }));
  }

  /**
   * 5 Saniyelik Akıllı Kelime İpucu Pop-up'ı:
   * Hem eldeki 10 harfi hem de tahtadaki kilitli taşları analiz eder.
   * Tahtadaki bir harfle bağlanarak yazılabilecek ve dikey/yatayda anlamsız 2. bir kelime türetmeyen
   * geçerli bir kelimeyi 5 saniyeliğine gösterir ve tahtada hedef hücreleri altın sarısı vurgular.
   */
  giveKelimelikHint() {
    const st = this.kelimelikState;
    if (st.isCheckingAnimation) return;

    // İpucu kullanıldığında seri sıfırlanır ve -15 puan kırılır
    st.streak = 0;
    st.currentTurnUsedHint = true;
    st.hintsUsed = (st.hintsUsed || 0) + 1;
    st.score = Math.max(0, (st.score || 0) - 15);
    this.updateKelimelikStats();

    // 1) Akıllı arama: Tahtadaki kilitli taşları VE eldeki harfleri birleştirerek ara
    let playableList = this.findPlayableHintMoves();

    // 2) Eğer tahtaya bağlanabilecek hamle kalmadıysa, ıstakayı bağlanabilir harfler denk gelene kadar yenile
    if (playableList.length === 0) {
      this.ensureKelimelikCanPlayOnBoard();
      playableList = this.findPlayableHintMoves();
    }

    if (playableList.length === 0) {
      this.showFloatingToast('💡 Şu anki harflerle tahtaya bağlanabilecek bir kelime bulunamadı!', 'info');
      return;
    }

    // Henüz çözülmemiş kelimelere öncelik ver
    const unusedOnes = playableList.filter(p => !p.alreadyUsed);
    const pool = unusedOnes.length > 0 ? unusedOnes : playableList;
    const chosen = pool[st.hintCycleIdx % pool.length];
    st.hintCycleIdx++;

    this.sfx.playHint();
    this.showKelimelikHintPopup(chosen);
  }

  showKelimelikHintPopup(wordEntry) {
    const st = this.kelimelikState;

    if (st.hintPopupTimer) clearTimeout(st.hintPopupTimer);
    if (st.hintCountdownInterval) clearInterval(st.hintCountdownInterval);

    // Eski tahta vurgularını ve harf önizlemelerini temizle
    this.clearKelimelikHintHighlights();

    // Popup modalını kapalı tut (Kullanıcı İsteği: Yeni ekran açılmayacak, sadece tahtadaki hücreler 2 sn altın sarısı yanıp sönecek ve harfler hücrelerin içine yazılacak)
    if (this.kelimelikHintPopup) {
      this.kelimelikHintPopup.classList.add('hidden');
    }

    // Tahtada hedef hücreleri altın sarısı yanıp söndür ve yazılacak kelimenin harflerini hücrelere yaz
    st.activeHintPreviewCells = [];
    if (Array.isArray(wordEntry.targetCells) && wordEntry.targetCells.length > 0) {
      wordEntry.targetCells.forEach(({ r, c }, idx) => {
        const domCell = this.getKelimelikCellElement(r, c);
        if (domCell) {
          const letter = (wordEntry.word && wordEntry.word[idx]) ? wordEntry.word[idx] : '';
          const origUserChar = (st.grid[r] && st.grid[r][c] && st.grid[r][c].userChar) || '';

          st.activeHintPreviewCells.push({
            r,
            c,
            origUserChar,
            domCell
          });

          domCell.classList.add('kelimelik-hint-target');
          const charSpan = domCell.querySelector('.kelimelik-cell-letter');
          const ptsSpan = domCell.querySelector('.kelimelik-cell-pts');
          if (charSpan) charSpan.textContent = letter;
          if (ptsSpan) ptsSpan.textContent = letter ? String(this.getKelimelikLetterPoints(letter)) : '';
        }
      });
    }

    // Tahtanın üzerinde kullanıcıya kısa ve engellemeyen bir ipucu mesajı göster
    const trMean = wordEntry.tr ? ` (${wordEntry.tr})` : '';
    this.showFloatingToast(`💡 İpucu: "${wordEntry.word}"${trMean}`, 'warning');

    // Tam 2 saniye sonra yazılar silinsin ve hücreler eski haline dönsün
    st.hintPopupTimer = setTimeout(() => {
      this.clearKelimelikHintHighlights();
    }, 2000);
  }

  clearKelimelikHintHighlights() {
    const st = this.kelimelikState;
    if (st.hintPopupTimer) {
      clearTimeout(st.hintPopupTimer);
      st.hintPopupTimer = null;
    }
    if (st.hintCountdownInterval) {
      clearInterval(st.hintCountdownInterval);
      st.hintCountdownInterval = null;
    }

    // Önizleme yapılan hücreleri orijinal harflerine ve durumuna döndür
    if (Array.isArray(st.activeHintPreviewCells) && st.activeHintPreviewCells.length > 0) {
      st.activeHintPreviewCells.forEach(({ r, c, origUserChar, domCell }) => {
        if (domCell) {
          domCell.classList.remove('kelimelik-hint-target');
          const charSpan = domCell.querySelector('.kelimelik-cell-letter');
          const ptsSpan = domCell.querySelector('.kelimelik-cell-pts');
          const currentChar = (st.grid[r] && st.grid[r][c] && st.grid[r][c].userChar) || origUserChar || '';
          if (charSpan) charSpan.textContent = currentChar;
          if (ptsSpan) ptsSpan.textContent = currentChar ? String(this.getKelimelikLetterPoints(currentChar)) : '';
        }
      });
      st.activeHintPreviewCells = [];
    }

    if (this.kelimelikGridEl) {
      this.kelimelikGridEl.querySelectorAll('.cw-cell.kelimelik-hint-target').forEach(el => {
        el.classList.remove('kelimelik-hint-target');
      });
    }
    if (this.kelimelikHintPopup) {
      this.kelimelikHintPopup.classList.add('hidden');
    }
  }

  hideKelimelikHintPopup() {
    this.clearKelimelikHintHighlights();
  }

  handleKelimelikKeyLetter(rawKey) {
    const st = this.kelimelikState;
    if (st.isCheckingAnimation) return;
    if (st.activeHintPreviewCells && st.activeHintPreviewCells.length > 0) {
      this.clearKelimelikHintHighlights();
    }

    const targetCoord = this.findNextKelimelikPlacementCell();
    if (!targetCoord) return;

    const upperTr = rawKey.toLocaleUpperCase('tr-TR');
    const upperEn = rawKey.toUpperCase();
    const availableTile = st.rack.find(
      t => !t.used && (t.char === upperTr || t.char === upperEn || this.lettersMatch(t.char, upperTr))
    );
    if (!availableTile) {
      this.sfx.playError();
      return;
    }
    this.placeRackTileIntoKelimelikCell(availableTile.id, targetCoord.r, targetCoord.c);
  }

  handleKelimelikBackspace() {
    const st = this.kelimelikState;
    if (st.isCheckingAnimation) return;

    if (st.focusedCell) {
      const { r, c } = st.focusedCell;
      if (st.grid[r][c].userChar && !st.grid[r][c].locked) {
        this.returnKelimelikCellTileToRack(r, c, false);
        return;
      }
    }

    const placed = this.getUnlockedPlacedKelimelikCells();
    if (placed.length > 0) {
      const last = placed[placed.length - 1];
      st.focusedCell = { r: last.r, c: last.c };
      this.returnKelimelikCellTileToRack(last.r, last.c, false);
    }
  }

  toggleKelimelikDirectionAtFocusedCell() {
    const st = this.kelimelikState;
    st.direction = st.direction === 'H' ? 'V' : 'H';
    this.sfx.playType();
    this.evaluateCurrentKelimelikPlacement();
  }

  moveKelimelikFocusByArrow(arrowKey) {
    const st = this.kelimelikState;
    const N = st.gridSize;
    if (!st.focusedCell) {
      st.focusedCell = { r: Math.floor(N / 2), c: Math.floor(N / 2) };
    }
    const deltas = {
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1]
    };
    const [dr, dc] = deltas[arrowKey] || [0, 0];
    const nr = Math.max(0, Math.min(N - 1, st.focusedCell.r + dr));
    const nc = Math.max(0, Math.min(N - 1, st.focusedCell.c + dc));
    st.focusedCell = { r: nr, c: nc };
    this.evaluateCurrentKelimelikPlacement();
  }

  updateKelimelikCellDOM(r, c) {
    const domCell = this.getKelimelikCellElement(r, c);
    if (!domCell) return;
    const cell = this.kelimelikState.grid[r][c];
    const letterSpan = domCell.querySelector('.kelimelik-cell-letter');
    const ptsSpan = domCell.querySelector('.kelimelik-cell-pts');
    if (letterSpan) {
      letterSpan.textContent = cell.userChar || '';
    }
    if (ptsSpan) {
      ptsSpan.textContent = cell.userChar ? String(this.getKelimelikLetterPoints(cell.userChar)) : '';
    }
    domCell.classList.toggle('has-rack-tile', Boolean(cell.userChar && !cell.locked));
    domCell.classList.toggle('is-locked-word', Boolean(cell.userChar && cell.locked));
  }

  updateKelimelikStats() {
    const st = this.kelimelikState;
    if (this.kelimelikStatScoreEl) {
      this.kelimelikStatScoreEl.textContent = `${st.score}`;
    }
    if (this.kelimelikStatSolvedEl) {
      this.kelimelikStatSolvedEl.textContent = `${st.solvedCount} / ${st.targetWords}`;
    }
  }

  shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  escapeHTML(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* =========================================================================
     6. AI SOHBET & PRATİK ARKADAŞI (EMMA CHATBOT) SİSTEMİ
     ========================================================================= */
  initChatbotView() {
    this.bindChatbotEventsOnce();
    const lvl = (this.chatbotEngine && this.chatbotEngine.level) || 'A2';
    const levelDisplay = document.getElementById('chatLevelDisplay');
    const levelSelect = document.getElementById('chatLevelSelect');
    if (levelDisplay) levelDisplay.textContent = `${lvl} İngilizce`;
    if (levelSelect) levelSelect.value = lvl;

    if (this.chatbotEngine) {
      this.chatbotEngine.isTyping = false;
    }
    const sendBtn = document.getElementById('btnChatSend');
    if (sendBtn) {
      sendBtn.disabled = false;
      sendBtn.style.opacity = '1';
      sendBtn.style.pointerEvents = 'auto';
    }

    const typingIndicator = document.getElementById('chatTypingIndicator');
    if (typingIndicator) {
      typingIndicator.classList.add('hidden');
    }

    const enginePill = document.getElementById('chatEnginePill');
    const engineText = document.getElementById('chatEngineText');
    if (this.chatbotEngine) {
      const isGemini = typeof GEMINI_API_KEY !== 'undefined' && GEMINI_API_KEY && GEMINI_API_KEY !== "BURAYA_ANAHTARI_YAZACAĞIM";
      if (engineText) engineText.textContent = isGemini ? '✨ Gemini Flash Lite Aktif' : (this.chatbotEngine.webGpuAvailable ? 'WebGPU Aktif' : 'Yerel Akıllı NLP');
      if (enginePill) enginePill.title = isGemini ? 'Google AI Studio Gemini Flash Lite (Canlı Yapay Zeka)' : 'Tarayıcı içi yerel zeka devrede (Offline)';
    }

    // Mesajlar boşsa veya yalnızca hata mesajları varsa sıfırla ve yeni selamla başla
    const validMsgs = (this.chatbotEngine && this.chatbotEngine.messages || []).filter(m => m && m.text && !m.isError && !m.text.startsWith('⚠️'));
    if (!validMsgs || validMsgs.length === 0) {
      this.resetChatbotConversation();
    } else {
      this.renderAllChatMessages();
    }
    this.renderChatSuggestions();
    this.updateChatApiKeyUI();

    const input = document.getElementById('chatInputText');
    if (input) {
      input.disabled = false;
      setTimeout(() => { try { input.focus(); } catch (_) {} }, 250);
    }
  }

  bindChatbotEventsOnce() {
    if (this._chatbotEventsBound) return;
    this._chatbotEventsBound = true;

    const btnClear = document.getElementById('btnChatClear');
    if (btnClear) {
      btnClear.addEventListener('click', () => {
        this.askConfirmation(
          'Sohbeti Temizle',
          'Emma ile olan konuşma geçmişini temizleyip sıfırdan yeni bir pratik seansı başlatmak istiyor musunuz?',
          () => {
            this.resetChatbotConversation();
            this.showFloatingToast('🧹 Sohbet panosu temizlendi!', 'info');
          },
          'Temizle'
        );
      });
    }

    const btnGoHome = document.getElementById('btnChatGoHome');
    if (btnGoHome) {
      btnGoHome.addEventListener('click', () => this.goToHomePage());
    }

    const btnHintPrompt = document.getElementById('btnChatHintPrompt');
    if (btnHintPrompt) {
      btnHintPrompt.addEventListener('click', () => {
        this.handleChatHintPrompt();
      });
    }

    const btnSpeakLast = document.getElementById('btnChatSpeakLast');
    if (btnSpeakLast) {
      btnSpeakLast.addEventListener('click', () => {
        this.speakLastChatMessage();
      });
    }

    const levelSelect = document.getElementById('chatLevelSelect');
    if (levelSelect) {
      levelSelect.addEventListener('change', () => {
        const newLvl = levelSelect.value;
        if (this.chatbotEngine) {
          this.chatbotEngine.setLevel(newLvl);
        }
        const levelDisplay = document.getElementById('chatLevelDisplay');
        if (levelDisplay) levelDisplay.textContent = `${newLvl} İngilizce`;
        this.renderChatSuggestions();
        this.sfx.playType();
        this.showFloatingToast(`🎯 Konuşma seviyesi: ${newLvl} İngilizce`, 'success');
      });
    }

    const form = document.getElementById('chatMessageForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSendChatMessage();
      });
    }

    const sendBtn = document.getElementById('btnChatSend');
    if (sendBtn) {
      // Gönder butonuna basıldığında klavyenin KAPANMAMASI için inputun blur olmasını (focus kaybetmesini) engelle
      sendBtn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
      });
      sendBtn.addEventListener('mousedown', (e) => {
        e.preventDefault();
      });
      sendBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleSendChatMessage();
      });
    }

    const hintBtn = document.getElementById('btnChatHintPrompt');
    if (hintBtn) {
      // İpucu butonuna basıldığında da klavyenin kapanmasını engelle
      hintBtn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
      });
      hintBtn.addEventListener('mousedown', (e) => {
        e.preventDefault();
      });
    }

    const input = document.getElementById('chatInputText');
    if (input) {
      // WhatsApp tarzı otomatik çok satırlı genişleme (auto-grow textarea)
      input.addEventListener('input', () => {
        this.autoResizeChatInput(input);
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.handleSendChatMessage();
        }
      });

      // Mobilde klavye açıldığında en son mesaja otomatik kaydır
      input.addEventListener('focus', () => {
        setTimeout(() => this.scrollChatToBottom(), 60);
        setTimeout(() => this.scrollChatToBottom(), 200);
        setTimeout(() => this.scrollChatToBottom(), 400);
      });
    }

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => {
        if (this.currentScreen === 'CHATBOT') {
          this.scrollChatToBottom();
        }
      });
    }

    // AI & API Ayarları Çekmecesi Olayları
    const btnMenu = document.getElementById('btnChatSettingsMenu');
    if (btnMenu) {
      btnMenu.addEventListener('click', () => this.openChatSettingsDrawer());
    }

    const btnCloseSettings = document.getElementById('btnCloseChatSettings');
    if (btnCloseSettings) {
      btnCloseSettings.addEventListener('click', () => this.closeChatSettingsDrawer());
    }

    const backdrop = document.getElementById('chatSettingsBackdrop');
    if (backdrop) {
      backdrop.addEventListener('click', () => this.closeChatSettingsDrawer());
    }

    const bannerBtn = document.getElementById('btnBannerOpenApiSettings');
    if (bannerBtn) {
      bannerBtn.addEventListener('click', () => this.openChatSettingsDrawer());
    }

    const btnTestSave = document.getElementById('btnTestAndSaveApiKey');
    if (btnTestSave) {
      btnTestSave.addEventListener('click', () => this.handleTestAndSaveApiKey());
    }

    const btnEditKey = document.getElementById('btnEditApiKey');
    if (btnEditKey) {
      btnEditKey.addEventListener('click', () => {
        const savedView = document.getElementById('csdSavedKeyView');
        const inputView = document.getElementById('csdInputKeyView');
        const input = document.getElementById('inputGeminiApiKey');
        const statusNotice = document.getElementById('csdApiKeyStatus');
        if (statusNotice) statusNotice.classList.add('hidden');
        if (savedView) savedView.classList.add('hidden');
        if (inputView) inputView.classList.remove('hidden');
        if (input) {
          input.value = typeof window.getSavedGeminiApiKey === 'function' ? window.getSavedGeminiApiKey() : '';
          setTimeout(() => { try { input.focus(); input.select(); } catch (_) {} }, 100);
        }
      });
    }

    const btnDeleteKey = document.getElementById('btnDeleteApiKey');
    if (btnDeleteKey) {
      btnDeleteKey.addEventListener('click', () => {
        this.askConfirmation(
          'API Anahtarını Kaldır',
          'Kayıtlı Gemini API anahtarınızı silmek istediğinize emin misiniz? Anahtar silindiğinde Emma ile canlı sohbet duraklatılacaktır.',
          () => {
            if (typeof window.saveGeminiApiKey === 'function') {
              window.saveGeminiApiKey('');
            }
            this.updateChatApiKeyUI();
            this.showFloatingToast('API Anahtarı kaldırıldı.', 'info');
          },
          'Kaldır'
        );
      });
    }

    const btnToggleEye = document.getElementById('btnToggleApiKeyVisibility');
    if (btnToggleEye) {
      btnToggleEye.addEventListener('click', () => {
        const input = document.getElementById('inputGeminiApiKey');
        if (input) {
          const isPassword = input.type === 'password';
          input.type = isPassword ? 'text' : 'password';
          btnToggleEye.textContent = isPassword ? '🙈' : '👁️';
        }
      });
    }

    const linkAiStudio = document.getElementById('btnOpenAiStudioLink');
    if (linkAiStudio) {
      linkAiStudio.addEventListener('click', (e) => {
        e.preventDefault();
        const targetUrl = "https://aistudio.google.com/app/apikey";
        if (window.chrome && window.chrome.webview && typeof window.chrome.webview.postMessage === 'function') {
          window.chrome.webview.postMessage("OPEN_URL:" + targetUrl);
        } else {
          window.open(targetUrl, '_blank');
        }
      });
    }
  }

  openChatSettingsDrawer() {
    const drawer = document.getElementById('chatSettingsDrawer');
    if (!drawer) return;
    drawer.classList.remove('hidden');
    this.updateChatApiKeyUI();
    const statusNotice = document.getElementById('csdApiKeyStatus');
    if (statusNotice) statusNotice.classList.add('hidden');
    const input = document.getElementById('inputGeminiApiKey');
    const hasKey = typeof window.hasValidApiKey === 'function' ? window.hasValidApiKey() : false;
    if (input && !hasKey) {
      setTimeout(() => { try { input.focus(); } catch (_) {} }, 200);
    }
  }

  closeChatSettingsDrawer() {
    const drawer = document.getElementById('chatSettingsDrawer');
    if (!drawer) return;
    drawer.classList.add('hidden');
  }

  updateChatApiKeyUI() {
    const hasKey = typeof window.hasValidApiKey === 'function' ? window.hasValidApiKey() : false;
    const currentKey = typeof window.getSavedGeminiApiKey === 'function' ? window.getSavedGeminiApiKey() : '';

    const alertDot = document.getElementById('chatMenuKeyAlert');
    if (alertDot) {
      if (hasKey) alertDot.classList.add('hidden');
      else alertDot.classList.remove('hidden');
    }

    const banner = document.getElementById('chatApiKeyBanner');
    if (banner) {
      if (hasKey) banner.classList.add('hidden');
      else banner.classList.remove('hidden');
    }

    const savedView = document.getElementById('csdSavedKeyView');
    const inputView = document.getElementById('csdInputKeyView');
    const maskedDisplay = document.getElementById('cskMaskedKeyDisplay');

    if (hasKey) {
      if (savedView) savedView.classList.remove('hidden');
      if (inputView) inputView.classList.add('hidden');
      if (maskedDisplay && currentKey) {
        if (currentKey.length > 8) {
          const start = currentKey.slice(0, 4);
          const end = currentKey.slice(-4);
          maskedDisplay.textContent = `${start}••••••••••••••••${end}`;
        } else {
          maskedDisplay.textContent = '••••••••••••';
        }
      }
    } else {
      if (savedView) savedView.classList.add('hidden');
      if (inputView) inputView.classList.remove('hidden');
      const input = document.getElementById('inputGeminiApiKey');
      if (input) input.value = '';
    }
  }

  async handleTestAndSaveApiKey() {
    const input = document.getElementById('inputGeminiApiKey');
    const btn = document.getElementById('btnTestAndSaveApiKey');
    const statusNotice = document.getElementById('csdApiKeyStatus');
    if (!input || !btn) return;

    const keyVal = input.value.trim();
    if (!keyVal) {
      if (statusNotice) {
        statusNotice.className = 'csd-status-notice is-error';
        statusNotice.textContent = 'Lütfen geçerli bir Google Gemini API anahtarı girin.';
        statusNotice.classList.remove('hidden');
      }
      this.sfx.playError();
      return;
    }

    const textSpan = btn.querySelector('.btn-save-text');
    const spinnerSpan = btn.querySelector('.btn-save-spinner');
    btn.disabled = true;
    if (textSpan) textSpan.classList.add('hidden');
    if (spinnerSpan) spinnerSpan.classList.remove('hidden');

    if (statusNotice) {
      statusNotice.className = 'csd-status-notice is-warning';
      statusNotice.textContent = 'Google AI Studio sunucusu ile bağlantı test ediliyor, lütfen bekleyin...';
      statusNotice.classList.remove('hidden');
    }

    try {
      const res = await window.testAndVerifyApiKey(keyVal);
      if (res && res.ok) {
        this.sfx.playSuccess();
        if (statusNotice) {
          statusNotice.className = res.isQuotaLimited ? 'csd-status-notice is-warning' : 'csd-status-notice is-success';
          statusNotice.textContent = res.message || 'API Anahtarı başarıyla doğrulandı ve kaydedildi!';
          statusNotice.classList.remove('hidden');
        }
        this.updateChatApiKeyUI();
        this.showFloatingToast('✅ Gemini API Anahtarı başarıyla kaydedildi!', 'success');

        // Kullanıcı onay mesajını gördükten sonra çekmeceyi yumuşakça kapat
        setTimeout(() => {
          this.closeChatSettingsDrawer();
        }, 1400);
      } else {
        this.sfx.playError();
        if (statusNotice) {
          statusNotice.className = 'csd-status-notice is-error';
          statusNotice.textContent = res.message || 'API Anahtarı doğrulanamadı.';
          statusNotice.classList.remove('hidden');
        }
      }
    } catch (e) {
      this.sfx.playError();
      if (statusNotice) {
        statusNotice.className = 'csd-status-notice is-error';
        statusNotice.textContent = 'Bağlantı testi hatası: ' + (e.message || e);
        statusNotice.classList.remove('hidden');
      }
    } finally {
      btn.disabled = false;
      if (textSpan) textSpan.classList.remove('hidden');
      if (spinnerSpan) spinnerSpan.classList.add('hidden');
    }
  }

  resetChatbotConversation() {
    if (!this.chatbotEngine) return;
    this._hintAnswerIndex = -1;
    this._lastHintQuestionTopic = null;
    this.chatbotEngine.messages = [];
    const greeting = this.chatbotEngine.getInitialGreeting();
    this.chatbotEngine.messages.push(greeting);
    this.renderAllChatMessages();
    this.renderChatSuggestions();
    this.scrollChatToBottom();
  }

  renderAllChatMessages() {
    const thread = document.getElementById('chatThread');
    if (!thread || !this.chatbotEngine) return;
    thread.innerHTML = '';
    this.chatbotEngine.messages.forEach(msg => {
      this.appendChatMessageDOM(msg, false);
    });
    this.scrollChatToBottom();
  }

  appendChatMessageDOM(msg, animate = true) {
    const thread = document.getElementById('chatThread');
    if (!thread) return;

    const isBot = msg.sender === 'bot';
    const row = document.createElement('div');
    row.className = `chat-msg ${isBot ? 'chat-msg-bot' : 'chat-msg-user'} ${animate ? 'animate-slide-up' : ''}`;

    let avatarHtml = '';
    if (isBot) {
      avatarHtml = `
        <div class="chat-msg-avatar-mini" title="Emma (AI Eğitmen)">
          <svg viewBox="0 0 120 120" width="28" height="28" aria-hidden="true">
            <circle cx="60" cy="60" r="58" fill="#0f172a" stroke="#f59e0b" stroke-width="4"/>
            <path d="M30 52c0-24 13-38 30-38s30 14 30 38c0 14-2 28-6 38-5 12-10 18-12 24-4-6-6-14-12-24-4-10-6-24-6-38z" fill="#78350f"/>
            <rect x="52" y="70" width="16" height="18" fill="#fde68a"/>
            <path d="M22 114c3-22 16-32 38-32s35 10 38 32z" fill="#0d9488"/>
            <circle cx="60" cy="52" r="24" fill="#fde68a"/>
            <path d="M36 46c2-16 11-26 24-26s24 10 24 26c-6-10-14-14-24-14s-18 4-24 14z" fill="#92400e"/>
            <circle cx="50" cy="49" r="3.2" fill="#0f172a"/>
            <circle cx="70" cy="49" r="3.2" fill="#0f172a"/>
            <ellipse cx="43" cy="54" rx="3.5" ry="2" fill="#fca5a5" opacity="0.65"/>
            <ellipse cx="77" cy="54" rx="3.5" ry="2" fill="#fca5a5" opacity="0.65"/>
            <path d="M52 59c3 4 13 4 16 0" fill="none" stroke="#be123c" stroke-width="2.6" stroke-linecap="round"/>
            <circle cx="36" cy="56" r="2.8" fill="#fbbf24"/>
            <circle cx="84" cy="56" r="2.8" fill="#fbbf24"/>
          </svg>
        </div>
      `;
    } else {
      avatarHtml = `
        <div class="chat-msg-avatar-mini chat-msg-avatar-user" title="Siz (Öğrenci)">
          <svg viewBox="0 0 120 120" width="28" height="28" aria-hidden="true">
            <circle cx="60" cy="60" r="58" fill="#0f172a" stroke="#fbbf24" stroke-width="4"/>
            <circle cx="60" cy="48" r="26" fill="#fde68a"/>
            <path d="M38 46c0-14 10-24 22-24s22 10 22 24c0 4-1 9-4 12-4-7-8-11-18-11s-14 4-18 11c-3-3-4-8-4-12z" fill="#334155"/>
            <circle cx="52" cy="46" r="3.2" fill="#0f172a"/>
            <circle cx="68" cy="46" r="3.2" fill="#0f172a"/>
            <path d="M54 55c3 3 9 3 12 0" fill="none" stroke="#78350f" stroke-width="2.5" stroke-linecap="round"/>
            <path d="M28 112c3-22 16-34 32-34s29 12 32 34z" fill="#f59e0b"/>
            <path d="M52 78l8 12 8-12z" fill="#ffffff"/>
          </svg>
        </div>
      `;
    }

    // Havuz kelimelerini vurgula
    let formattedText = this.escapeHTML(msg.text);
    if (isBot && Array.isArray(msg.poolWords) && msg.poolWords.length > 0) {
      msg.poolWords.forEach(pw => {
        if (!pw) return;
        const reg = new RegExp(`\\b(${pw})\\b`, 'gi');
        formattedText = formattedText.replace(reg, '<span class="chat-pool-word-badge" title="Kelime Havuzunuzdan">$1</span>');
      });
    }

    const isErrorMsg = Boolean(msg.isError || (msg.text && msg.text.startsWith('⚠️')));
    const ttsButtonHtml = (isBot && !isErrorMsg) ? `
      <button type="button" class="chat-bubble-speak-btn" title="Emma'nın Telaffuzunu Dinle (Yavaş & Net)" aria-label="Sesli Dinle">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
      </button>
    ` : '';

    row.innerHTML = `
      ${avatarHtml}
      <div class="chat-bubble chat-msg-content">
        <div class="chat-bubble-text chat-msg-text">${formattedText}</div>
        <div class="chat-bubble-footer chat-msg-meta">
          <span class="chat-bubble-time">${this.escapeHTML(msg.time || '')}</span>
          ${ttsButtonHtml}
          ${!isBot ? '<span class="chat-bubble-check" title="İletildi">✓✓</span>' : ''}
        </div>
      </div>
    `;

    if (isBot) {
      const spkBtn = row.querySelector('.chat-bubble-speak-btn');
      if (spkBtn) {
        spkBtn.addEventListener('click', () => {
          if (this.chatbotEngine) {
            spkBtn.classList.add('is-speaking');
            this.chatbotEngine.speak(
              msg.text,
              () => spkBtn.classList.add('is-speaking'),
              () => spkBtn.classList.remove('is-speaking')
            );
          }
        });
      }
    }

    thread.appendChild(row);
  }

  autoResizeChatInput(textarea) {
    if (!textarea) return;
    textarea.style.setProperty('height', 'auto', 'important');
    const isMobile = window.matchMedia('(max-width: 768px)').matches || document.body.classList.contains('mobile-ui');
    const minH = isMobile ? 34 : 36;
    const maxH = isMobile ? 150 : 165; // WhatsApp gibi yukarı doğru dinamik genişleme
    const scrollH = textarea.scrollHeight;
    const targetH = Math.min(Math.max(scrollH, minH), maxH);
    textarea.style.setProperty('height', `${targetH}px`, 'important');
    if (scrollH > maxH) {
      textarea.style.setProperty('overflow-y', 'auto', 'important');
      if (textarea.selectionStart >= textarea.value.length - 2) {
        textarea.scrollTop = textarea.scrollHeight;
      }
    } else {
      textarea.style.setProperty('overflow-y', 'hidden', 'important');
    }
    this.scrollChatToBottom();
  }

  scrollChatToBottom(smooth = false) {
    const area = document.getElementById('chatMessagesArea');
    if (!area) return;
    requestAnimationFrame(() => {
      area.scrollTo({
        top: area.scrollHeight + 300,
        behavior: smooth ? 'smooth' : 'auto'
      });
    });
  }

  renderChatSuggestions(customPrompts = null) {
    const bar = document.getElementById('chatSuggestionsBar');
    if (bar) {
      bar.innerHTML = '';
      bar.style.display = 'none';
    }
  }

  handleChatHintPrompt() {
    if (!this.chatbotEngine) return;
    const hintData = this.chatbotEngine.getContextualHintAnswers();
    const answers = hintData.answers || [];
    if (answers.length === 0) return;

    if (this._lastHintQuestionTopic !== hintData.questionTopic) {
      this._hintAnswerIndex = 0;
      this._lastHintQuestionTopic = hintData.questionTopic;
    } else {
      this._hintAnswerIndex = ((this._hintAnswerIndex ?? -1) + 1) % answers.length;
    }

    const selectedAnswer = answers[this._hintAnswerIndex];
    const inp = document.getElementById('chatInputText');
    if (inp && selectedAnswer) {
      inp.value = selectedAnswer;
      this.autoResizeChatInput(inp);
      try {
        inp.focus({ preventScroll: true });
      } catch (_) {
        inp.focus();
      }
      this.sfx.playType();
      if (hintData.isAnswerToQuestion) {
        this.showFloatingToast(`💡 Emma'nın sorusuna uygun örnek yanıt eklendi! (${this._hintAnswerIndex + 1}/${answers.length})`, 'info');
      } else {
        this.showFloatingToast(`💡 Örnek sohbet cümlesi eklendi! (${this._hintAnswerIndex + 1}/${answers.length})`, 'info');
      }
    }

    this.renderChatSuggestions(answers);
  }

  speakLastChatMessage() {
    if (!this.chatbotEngine) return;
    const msgs = this.chatbotEngine.messages || [];
    const lastBotMsg = [...msgs].reverse().find(m => m.sender === 'bot' && !m.isError && !(m.text && m.text.startsWith('⚠️')));
    if (lastBotMsg && lastBotMsg.text) {
      const btn = document.getElementById('btnChatSpeakLast');
      if (btn) btn.classList.add('is-speaking');
      this.chatbotEngine.speak(
        lastBotMsg.text,
        () => { if (btn) btn.classList.add('is-speaking'); },
        () => { if (btn) btn.classList.remove('is-speaking'); }
      );
      this.showFloatingToast('🔊 Emma konuşuyor...', 'info');
    } else {
      this.showFloatingToast('Henüz seslendirilecek bir mesaj yok.', 'warning');
    }
  }

  async handleSendChatMessage() {
    const input = document.getElementById('chatInputText');
    if (!input || !this.chatbotEngine || this.chatbotEngine.isTyping) return;
    const raw = input.value.trim();
    if (!raw) return;

    if (typeof window.hasValidApiKey === 'function' && !window.hasValidApiKey()) {
      this.openChatSettingsDrawer();
      this.showFloatingToast('⚠️ Lütfen sohbete başlamadan önce Gemini API anahtarınızı girin.', 'warning');
      return;
    }

    input.value = '';
    this.autoResizeChatInput(input);
    // Klavyenin açık kalması için textarea odağını koru
    try {
      input.focus({ preventScroll: true });
    } catch (_) {
      input.focus();
    }
    this.sfx.playType();

    const sendBtn = document.getElementById('btnChatSend');
    if (sendBtn) {
      sendBtn.disabled = true;
      sendBtn.style.opacity = '0.5';
      sendBtn.style.pointerEvents = 'none';
    }

    const userMsg = {
      sender: 'user',
      text: raw,
      time: this.chatbotEngine.getCurrentTimeString()
    };
    this.chatbotEngine.messages.push(userMsg);
    this.appendChatMessageDOM(userMsg, true);
    this.scrollChatToBottom();

    // Yazıyor... göstergesini aç
    this.chatbotEngine.isTyping = true;
    const typingIndicator = document.getElementById('chatTypingIndicator');
    if (typingIndicator) {
      typingIndicator.classList.remove('hidden');
      this.scrollChatToBottom();
    }

    try {
      const botResponse = await this.chatbotEngine.generateResponse(raw);

      const botMsg = {
        sender: 'bot',
        text: botResponse.text,
        time: this.chatbotEngine.getCurrentTimeString(),
        poolWords: botResponse.usedPoolWords || []
      };
      this.chatbotEngine.messages.push(botMsg);
      this.appendChatMessageDOM(botMsg, true);
      this.scrollChatToBottom();

      // Emma'nın yeni mesajındaki soruya göre öneri butonlarını hemen güncelle
      this.renderChatSuggestions();

      if (botResponse.isIncomprehensible || botResponse.isError) {
        this.sfx.playWrong();
      } else {
        this.sfx.playCorrect();
      }
    } finally {
      // Yazıyor... göstergesini kapat ve Gönder butonunu tekrar aktif et
      this.chatbotEngine.isTyping = false;
      if (typingIndicator) {
        typingIndicator.classList.add('hidden');
      }
      if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.style.opacity = '1';
        sendBtn.style.pointerEvents = 'auto';
      }
    }
  }
}

/* ==============================================================
   MOBİL ALT ÇUBUK DÜZENİ:
   Oyun alanı dışındaki tüm kontroller ekranın en alt satırına
   sığdırılır; kalan ayarlar "⋮" menüsünden açılan sayfadan erişilir.
   ============================================================== */
function setupMobileBottomBars() {
  if (!window.matchMedia('(max-width: 768px)').matches) return;
  document.body.classList.add('mobile-ui');

  const getButtonMetadata = (orig, customClass) => {
    let iconSvg = '';
    let label = '';

    const id = orig.id || '';
    const cls = orig.className || '';
    const text = (orig.textContent || '').replace(/\(\.\)/g, '').trim();

    if (customClass === 'mbb-hint' || id.includes('Hint') || cls.includes('btn-warning')) {
      iconSvg = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>`;
      label = 'İpucu';
    } else if (id.includes('New') || id.includes('btnNew')) {
      iconSvg = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>`;
      label = id === 'btnNewPuzzle' ? 'Yeni Bulmaca' : 'Yeni Oyun';
    } else if (id.includes('Home') || cls.includes('btn-home-return')) {
      iconSvg = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;
      label = 'Ana Sayfa';
    } else if (id.includes('Return') || id.includes('Undo')) {
      iconSvg = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>`;
      label = 'Geri Al';
    } else if (id.includes('Shuffle')) {
      iconSvg = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22"/><path d="m18 2 4 4-4 4"/><path d="M2 6h1.4c1.3 0 2.5.6 3.3 1.7l6.1 8.6c.7 1.1 2 1.7 3.3 1.7H22"/><path d="m18 22 4-4-4-4"/></svg>`;
      label = 'Karıştır';
    } else {
      const origSvg = orig.querySelector('svg');
      if (origSvg) {
        iconSvg = origSvg.outerHTML;
      } else {
        iconSvg = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>`;
      }
      label = text || 'İşlem';
    }
    return { iconSvg, label };
  };

  const makeProxy = (orig, cls = '') => {
    const { iconSvg, label } = getButtonMetadata(orig, cls);
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `mbb-btn ${cls}`;
    b.innerHTML = `<span class="mbb-icon">${iconSvg}</span><span class="mbb-label">${label}</span>`;
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!orig.disabled) orig.click();
    });
    return b;
  };

  document.querySelectorAll('section.game-screen').forEach(screen => {
    const header = screen.querySelector('header.topbar');
    const actions = header && header.querySelector('.actions-bar');
    if (!actions) return;

    const bar = document.createElement('nav');
    bar.className = 'mobile-bottom-bar';

    const hintBtn = actions.querySelector('.btn-warning');
    const newBtn = actions.querySelector('button[id^="btnNew"]');
    const homeBtn = actions.querySelector('.btn-home-return');

    // Oyun içi ek eylemler (Kelimelik: Geri Al, Karıştır)
    const extra = ['btnKelimelikReturnTiles', 'btnKelimelikShuffleRack']
      .map(id => screen.querySelector('#' + id))
      .filter(Boolean);

    if (hintBtn) bar.appendChild(makeProxy(hintBtn, 'mbb-hint'));
    extra.forEach(btn => { bar.appendChild(makeProxy(btn)); btn.classList.add('mobile-proxied'); });
    if (newBtn) bar.appendChild(makeProxy(newBtn));
    if (homeBtn) bar.appendChild(makeProxy(homeBtn));

    // "⋮" Menü sayfası
    const sheet = document.createElement('div');
    sheet.className = 'mobile-more-sheet hidden';
    sheet.innerHTML = `
      <div class="mms-card">
        <div class="mms-header"><strong>⚙️ Oyun Menüsü</strong><button type="button" class="btn-icon mms-close" aria-label="Kapat">✕</button></div>
        <div class="mms-body"></div>
      </div>`;
    const body = sheet.querySelector('.mms-body');

    const modeSel = header.querySelector('.mode-selector');
    if (modeSel) {
      const sec = document.createElement('div');
      sec.className = 'mms-section';
      sec.innerHTML = '<span class="mms-title">🌐 Oyun Modu</span>';
      sec.appendChild(modeSel);
      body.appendChild(sec);
    }

    const optSec = document.createElement('div');
    optSec.className = 'mms-section mms-grid';
    optSec.innerHTML = '<span class="mms-title">🎛️ Seçenekler</span>';
    Array.from(actions.children).forEach(child => {
      if (child === hintBtn || child === newBtn || child === homeBtn) {
        child.classList.add('mobile-proxied');
        return;
      }
      optSec.appendChild(child);
    });
    body.appendChild(optSec);

    const linkSec = document.createElement('div');
    linkSec.className = 'mms-section mms-grid';
    linkSec.innerHTML = '<span class="mms-title">📂 Menü ve Bilgiler</span>';

    const gameKey = screen.id.replace('View', '').toLowerCase();

    // 🎓 Oyun Rehberi / Yardım Butonu
    const aHelp = document.createElement('button');
    aHelp.type = 'button';
    aHelp.className = 'btn btn-secondary';
    aHelp.innerHTML = '🎓 Oyun Rehberi / Yardım';
    aHelp.addEventListener('click', () => {
      sheet.classList.add('hidden');
      if (window.cengelApp) window.cengelApp.openGameHelpModal(gameKey);
    });
    linkSec.appendChild(aHelp);

    const addLink = (text, targetId) => {
      const target = document.getElementById(targetId);
      if (!target) return;
      const a = document.createElement('button');
      a.type = 'button';
      a.className = 'btn btn-secondary';
      a.textContent = text;
      a.addEventListener('click', () => { sheet.classList.add('hidden'); target.click(); });
      linkSec.appendChild(a);
    };
    addLink('⚙️ Ayarlar / Veri Havuzu', 'btnTogglePool');
    body.appendChild(linkSec);

    const moreBtn = document.createElement('button');
    moreBtn.type = 'button';
    moreBtn.className = 'mbb-btn mbb-more';
    moreBtn.innerHTML = `
      <span class="mbb-icon">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
      </span>
      <span class="mbb-label">Menü</span>`;
    moreBtn.setAttribute('aria-label', 'Menü');
    moreBtn.addEventListener('click', () => sheet.classList.remove('hidden'));
    bar.appendChild(moreBtn);

    sheet.querySelector('.mms-close').addEventListener('click', () => sheet.classList.add('hidden'));
    sheet.addEventListener('click', (e) => { if (e.target === sheet) sheet.classList.add('hidden'); });
    // Seçim yapan butonlar (mod, yeni oyun vb.) sonrası menü açık kalsın; sadece kapatma ile kapanır
    sheet.querySelectorAll('.btn-home-return, .btn-guide, [id$="Scores"]').forEach(b => {
      b.addEventListener('click', () => sheet.classList.add('hidden'));
    });

    screen.appendChild(bar);
    screen.appendChild(sheet);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  window.cengelApp = new CengelCrosswordApp();
  try { setupMobileBottomBars(); } catch (err) { console.error(err); }
});
