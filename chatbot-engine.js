// =========================================================================
// GOOGLE AI STUDIO GEMINI API ENTEGRASYONU
// Güvenlik & Dağıtım: Uygulama derlendiğinde dahili anahtar boştur.
// Kullanıcı kendi anahtarını arayüzdeki ☰ menüsünden girer ve test eder.
// =========================================================================
let GEMINI_API_KEY = "";
const GEMINI_MODELS = ["gemini-flash-lite-latest", "gemini-2.5-flash-lite", "gemini-flash-latest"];

function getSavedGeminiApiKey() {
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('user_gemini_api_key');
      if (saved && saved.trim()) return saved.trim();
    }
  } catch (_) {}
  return GEMINI_API_KEY ? GEMINI_API_KEY.trim() : "";
}

function saveGeminiApiKey(key) {
  const cleanKey = (key || '').trim();
  GEMINI_API_KEY = cleanKey;
  try {
    if (typeof localStorage !== 'undefined') {
      if (cleanKey) {
        localStorage.setItem('user_gemini_api_key', cleanKey);
      } else {
        localStorage.removeItem('user_gemini_api_key');
      }
    }
  } catch (_) {}
  return cleanKey;
}

function hasValidApiKey() {
  const k = getSavedGeminiApiKey();
  return Boolean(k && k.length >= 5);
}

async function testAndVerifyApiKey(candidateKey) {
  const key = (candidateKey || '').trim();
  if (!key) {
    return { ok: false, message: "Lütfen bir API anahtarı girin." };
  }
  if (key.length < 5) {
    return { ok: false, message: "Lütfen geçerli bir API anahtarı girin." };
  }
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${encodeURIComponent(key)}`;
    const payload = JSON.stringify({
      contents: [{ role: "user", parts: [{ text: "ping" }] }],
      generationConfig: { maxOutputTokens: 2 }
    });
    const data = await requestNativeHttpAsync(url, payload);
    if (data && data.error) {
      const errCode = data.error.code || 0;
      const errMsg = data.error.message || "Bilinmeyen hata";
      if (errCode === 400 || errMsg.toLowerCase().includes("not valid") || errMsg.toLowerCase().includes("invalid")) {
        return { ok: false, message: "❌ Geçersiz API Anahtarı: Google sunucusu anahtarı onaylamadı. Lütfen kontrol edin." };
      }
      if (errCode === 403 || errMsg.toLowerCase().includes("permission")) {
        return { ok: false, message: "❌ Yetki Hatası (403): Bu API anahtarının Gemini API kullanım izni bulunmuyor." };
      }
      if (errCode === 429 || errMsg.toLowerCase().includes("quota") || errMsg.toLowerCase().includes("resource_exhausted")) {
        saveGeminiApiKey(key);
        return { ok: true, isQuotaLimited: true, message: "⚠️ Anahtar onaylandı ancak ücretsiz dakikalık kota sınırında. Yine de başarıyla kaydedildi!" };
      }
      return { ok: false, message: `❌ Doğrulama Hatası (${errCode}): ${errMsg}` };
    }
    if (data && data.candidates && data.candidates.length > 0) {
      saveGeminiApiKey(key);
      return { ok: true, message: "✅ API Anahtarı başarıyla doğrulandı ve kaydedildi!" };
    }
    return { ok: false, message: "❌ Sunucudan geçerli bir yanıt alınamadı." };
  } catch (err) {
    return { ok: false, message: "❌ Bağlantı testi başarısız oldu: " + (err.message || err) };
  }
}

if (typeof window !== 'undefined') {
  window.getSavedGeminiApiKey = getSavedGeminiApiKey;
  window.saveGeminiApiKey = saveGeminiApiKey;
  window.hasValidApiKey = hasValidApiKey;
  window.testAndVerifyApiKey = testAndVerifyApiKey;
}

// Android & Windows Masaüstü Ortak Asenkron HTTP Köprüsü (CORS ve Zaman Aşımı Korumalı)
if (typeof window !== 'undefined') {
  window.__httpCallbacks = window.__httpCallbacks || {};
  window.__onNativeHttpResult = function(callbackId, jsonString) {
    if (window.__httpCallbacks && window.__httpCallbacks[callbackId]) {
      const cb = window.__httpCallbacks[callbackId];
      delete window.__httpCallbacks[callbackId];
      try {
        if (typeof jsonString === 'object' && jsonString !== null) {
          cb(jsonString);
        } else {
          cb(JSON.parse(jsonString));
        }
      } catch (err) {
        cb({ error: { message: "JSON ayrıştırma hatası: " + err.message } });
      }
    }
  };
  window.__onAndroidHttpComplete = window.__onNativeHttpResult;
}

function requestNativeHttpAsync(url, jsonBody) {
  return new Promise((resolve) => {
    const callbackId = 'req_' + Date.now() + '_' + Math.floor(Math.random() * 1000000);
    const timer = setTimeout(() => {
      if (window.__httpCallbacks && window.__httpCallbacks[callbackId]) {
        delete window.__httpCallbacks[callbackId];
        resolve({ error: { message: "Ağ zaman aşımı (45 saniye)" } });
      }
    }, 45000);

    window.__httpCallbacks[callbackId] = (data) => {
      clearTimeout(timer);
      resolve(data);
    };

    try {
      // 1. Android Native Köprüsü
      if (typeof window !== 'undefined' && window.AndroidNativeHttp && typeof window.AndroidNativeHttp.postAsync === 'function') {
        window.AndroidNativeHttp.postAsync(callbackId, url, jsonBody);
        return;
      }
      // 2. Windows Masaüstü (WebView2) C# Köprüsü
      if (typeof window !== 'undefined' && window.chrome && window.chrome.webview && typeof window.chrome.webview.postMessage === 'function') {
        window.chrome.webview.postMessage("HTTP_POST:" + callbackId + "|" + url + "|" + jsonBody);
        return;
      }
      // 3. Tarayıcı (Standart fetch)
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: jsonBody
      })
      .then(res => {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(data => {
        if (window.__httpCallbacks[callbackId]) {
          clearTimeout(timer);
          delete window.__httpCallbacks[callbackId];
          resolve(data);
        }
      })
      .catch(err => {
        if (window.__httpCallbacks[callbackId]) {
          clearTimeout(timer);
          delete window.__httpCallbacks[callbackId];
          resolve({ error: { message: err.message || "Fetch hatası" } });
        }
      });
    } catch (e) {
      clearTimeout(timer);
      delete window.__httpCallbacks[callbackId];
      resolve({ error: { message: "İstek başlatılamadı: " + e.message } });
    }
  });
}

/**
 * Local In-Browser AI Chatbot Engine for "English is easy"
 * Emma - Kişisel İngilizce Konuşma Eğitmeni & Pratik Partneri
 * 
 * Özellikler:
 * - Google Gemini 1.5 Flash REST API bağlantısı (Canlı yapay zeka)
 * - Sohbet geçmişi (Chat history) bağlam hafızası
 * - Oyundaki kelime havuzu veritabanı entegrasyonu (System instruction)
 * - Çevrimdışı / Hata durumunda anında yerel kural motoruna (Fallback) geçiş
 * - Web Speech API ile doğal kadın sesiyle İngilizce seslendirme (TTS)
 */

class EmmaChatbotEngine {
  constructor(app) {
    this.app = app;
    this.name = "Emma";
    this.role = "İngilizce Konuşma Partneri";
    this.level = "A2"; // 'A2' | 'B1' | 'B2'
    this.ttsEnabled = true;
    this.isTyping = false;
    this.messages = [];
    this.webGpuAvailable = Boolean(typeof navigator !== 'undefined' && navigator.gpu);
    this.engineStatus = this.webGpuAvailable ? 'WebGPU Hazır' : 'Yerel Motor';
    this.webllmEngine = null;
    this.webllmLoading = false;
    this.webllmReady = false;

    // İngilizce kadın ses motorunu önbelleğe al
    this.selectedVoice = null;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => this.initVoice();
      this.initVoice();
    }
  }

  findBestFemaleEnglishVoice() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    // Erkek sesleri KESİNLİKLE ele (David, Mark, Guy, Tolga vb.)
    const maleTokens = [
      'david', 'mark', 'george', 'oliver', 'guy', 'ryan', 'richard', 'james',
      'stefan', 'steffan', 'steve', 'christopher', 'chris', 'eric', 'roger',
      'brian', 'andrew', 'william', 'paul', 'peter', 'tom', 'thomas', 'mike',
      'michael', 'alex', 'fred', 'daniel', 'sam', 'jack', 'jason', 'jacob',
      'joseph', 'charles', 'henry', 'edward', 'harry', 'noah', 'liam',
      'male', 'boy', 'man', 'men', 'cosmo', 'john', 'tolga', 'ahmet',
      'mehmet', 'cem', 'alper', 'erkek', 'adam'
    ];

    const isMale = (name) => {
      const n = (name || '').toLowerCase();
      return maleTokens.some(m => {
        const regex = new RegExp(`(^|\\b|_|-|\\s)${m}(\\b|_|-|\\s|$)`, 'i');
        return regex.test(n) || n.includes(m);
      });
    };

    // Sadece İngilizce sesleri değerlendir (Türkçe vb. diller İngilizce telaffuz için KESİNLİKLE seçilmemeli)
    const englishVoices = voices.filter(v => {
      const l = (v.lang || '').toLowerCase().replace('_', '-');
      return l.startsWith('en') || l.includes('en-');
    });

    // Doğal kadın sesleri için öncelik sırası (Zira Windows'ta en stabil yerel kadın sesidir!)
    const femaleTokens = [
      'zira', 'jenny', 'aria', 'samantha', 'victoria', 'hazel', 'susan',
      'cathy', 'karen', 'allison', 'ava', 'fiona', 'stephanie', 'serena',
      'sonia', 'ana', 'michelle', 'clara', 'libby', 'maisie', 'natasha',
      'claire', 'emma', 'amy', 'female', 'woman', 'en-us-x-sfg', 'en-us-x-iol',
      'en-us-x-tpf', 'google us english female', 'google uk english female'
    ];

    // 1. Öncelik: İngilizce + Kadın ses ismi + Kesinlikle erkek olmayan
    for (const token of femaleTokens) {
      const candidate = englishVoices.find(v => {
        const name = (v.name || '').toLowerCase();
        return name.includes(token) && !isMale(name);
      });
      if (candidate) return candidate;
    }

    // 2. Öncelik: Erkek listesinde olmayan herhangi bir İngilizce ses
    const nonMaleEnglish = englishVoices.find(v => !isMale(v.name));
    if (nonMaleEnglish) return nonMaleEnglish;

    // 3. Öncelik: Tüm ses havuzundan kadın sesi
    for (const token of femaleTokens) {
      const candidate = voices.find(v => {
        const name = (v.name || '').toLowerCase();
        return name.includes(token) && !isMale(name);
      });
      if (candidate) return candidate;
    }

    // Erkek ses ASLA dönme
    return null;
  }

  initVoice() {
    this.selectedVoice = this.findBestFemaleEnglishVoice();
  }

  setLevel(level) {
    if (['A2', 'B1', 'B2'].includes(level)) {
      this.level = level;
    }
  }

  getInitialGreeting() {
    if (this.level === 'A2') {
      return {
        sender: 'bot',
        text: "Hello! I am Emma. How are you today?",
        time: this.getCurrentTimeString(),
        poolWords: []
      };
    } else if (this.level === 'B1') {
      return {
        sender: 'bot',
        text: "Hello there! Nice to meet you. How is your day going so far? What would you like to talk about today?",
        time: this.getCurrentTimeString(),
        poolWords: []
      };
    } else {
      return {
        sender: 'bot',
        text: "Hi there! It's great to connect with you. How's everything going? Tell me a bit about what's on your mind today.",
        time: this.getCurrentTimeString(),
        poolWords: []
      };
    }
  }

  getSystemPromptForLevel(level) {
    if (level === 'B2') {
      return `You are Emma, an articulate English practice partner. The user is at B2 level.
Rules:
1. Always answer the user's questions directly first.
2. Engage in natural, nuanced conversation with rich vocabulary and varied sentence structures.
3. Keep your reply between 2 to 4 sentences.
4. End your response with one thoughtful, open-ended follow-up question.`;
    } else if (level === 'B1') {
      return `You are Emma, a friendly English practice partner. The user is at B1 level.
Rules:
1. Always answer the user's questions directly first.
2. Use clear, natural conversational English with moderate sentence complexity.
3. Keep your reply between 2 to 3 sentences.
4. End your response with one relevant follow-up question.`;
    } else {
      // Default: A2 (Temel - Kısa ve Basit)
      return `You are Emma, a friendly English practice partner. The user is at A2 level.
Rules:
1. Always answer the user's specific questions directly first.
2. Use very simple, short sentences (subject + verb + object).
3. Maximum 2 short, simple sentences.
4. End your response with one simple, easy follow-up question.
5. Use basic everyday vocabulary. Do not use complex words or difficult idioms.`;
    }
  }

  getCurrentTimeString() {
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }

  /**
   * Kullanıcının girdiği cümlenin anlamlı bir İngilizce cümle olup olmadığını denetler.
   */
  isMeaningfulEnglish(rawText) {
    if (!rawText || typeof rawText !== 'string') return false;
    const text = rawText.trim();
    if (text.length < 2) return false;

    // Tekrarlayan anlamsız tuş vuruşları (örn: asdasd, fffff, qwert)
    if (/^(.)\1{3,}$/i.test(text)) return false;
    if (/^[b-df-hj-np-tv-z]{5,}$/i.test(text)) return false; // Sesli harf içermeyen rastgele ünsüz dizisi

    // En az bir sesli harf veya yaygın İngilizce kelime içermeli
    const hasVowels = /[aeiouy]/i.test(text);
    if (!hasVowels && text.length > 3) return false;

    // Çok yaygın İngilizce kelimelerden veya selamlaşmalardan biri var mı?
    const commonTokens = [
      'hi', 'hello', 'hey', 'yes', 'no', 'ok', 'okay', 'good', 'fine', 'how', 'what', 'why',
      'who', 'where', 'when', 'is', 'are', 'am', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
      'my', 'your', 'and', 'but', 'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'with',
      'like', 'love', 'do', 'did', 'have', 'had', 'go', 'went', 'see', 'saw', 'can', 'will',
      'work', 'today', 'day', 'night', 'time', 'book', 'car', 'house', 'water', 'food', 'cat', 'dog'
    ];
    
    const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
    if (words.length === 0) return false;

    // Eğer havuzdaki herhangi bir kelime geçiyorsa anlamlı kabul et
    const poolWords = this.getAvailablePoolWords().map(w => w.en.toLowerCase());
    const matchesPool = words.some(w => poolWords.includes(w));
    if (matchesPool) return true;

    // Yaygın İngilizce kelimelerden en az biri geçiyorsa veya kelime sayısı 2+ ise anlamlı
    const matchesCommon = words.some(w => commonTokens.includes(w));
    if (matchesCommon) return true;

    if (words.length >= 2 && hasVowels) return true;

    return false;
  }

  getAvailablePoolWords() {
    try {
      if (this.app && Array.isArray(this.app.wordPool) && this.app.wordPool.length > 0) {
        return this.app.wordPool;
      }
      if (typeof DEFAULT_WORDS !== 'undefined' && Array.isArray(DEFAULT_WORDS)) {
        return DEFAULT_WORDS;
      }
    } catch (_) {}
    return [
      { tr: "Kitap", en: "BOOK" }, { tr: "Elma", en: "APPLE" }, { tr: "Su", en: "WATER" },
      { tr: "Kedi", en: "CAT" }, { tr: "Köpek", en: "DOG" }, { tr: "Araba", en: "CAR" },
      { tr: "Zaman", en: "TIME" }, { tr: "Arkadaş", en: "FRIEND" }, { tr: "Ev", en: "HOUSE" }
    ];
  }

  /**
   * Gemini Flash REST API'sine (Fetch + Android Native Bridge) doğrudan bağlantı kurarak yanıt üretir.
   * Kullanıcının seçtiği oyun moduna (A2, B1, B2) göre seviyeli ve özgür İngilizce pratik yanıtı oluşturur.
   */
  async callGeminiAPI(userInput) {
    const levelStr = this.level || 'A2';
    const systemPromptText = this.getSystemPromptForLevel(levelStr);

    // Sohbet geçmişini (Chat history) Gemini API formatına çevir
    const contents = [];
    const msgs = this.messages || [];

    for (const m of msgs) {
      // Hata mesajlarını (⚠️) veya geçersiz mesajları geçmişe ASLA ekleme
      if (!m || !m.text || m.isError || m.text.startsWith('⚠️')) continue;
      const role = m.sender === 'user' ? 'user' : 'model';
      // Gemini API kuralı: contents dizisi mutlaka role: 'user' ile başlamalıdır
      if (contents.length === 0 && role !== 'user') continue;

      const last = contents[contents.length - 1];
      if (last && last.role === role) {
        last.parts[0].text += "\n" + m.text;
      } else {
        contents.push({
          role: role,
          parts: [{ text: m.text }]
        });
      }
    }

    // Kullanıcının son mesajı contents içinde yoksa ekle
    const lastEntry = contents[contents.length - 1];
    if (!lastEntry || lastEntry.role !== 'user' || !lastEntry.parts[0].text.includes(userInput)) {
      if (lastEntry && lastEntry.role === 'user') {
        lastEntry.parts[0].text = userInput;
      } else {
        contents.push({
          role: 'user',
          parts: [{ text: userInput }]
        });
      }
    }

    const payload = {
      system_instruction: {
        parts: [{ text: systemPromptText }]
      },
      contents: contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 250
      }
    };

    const activeApiKey = getSavedGeminiApiKey();
    if (!activeApiKey) {
      throw new Error("API_KEY_REQUIRED");
    }

    let lastError = null;
    for (const model of GEMINI_MODELS) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(activeApiKey)}`;
        const data = await requestNativeHttpAsync(url, JSON.stringify(payload));

        if (data && data.error) {
          const errCode = data.error.code || 0;
          const errMsg = data.error.message || JSON.stringify(data.error);
          lastError = new Error(`Google API Error (${errCode}): ${errMsg}`);
          if (errCode === 429 || errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('resource_exhausted')) {
            break;
          }
          continue;
        }

        const candidate = data && data.candidates && data.candidates[0];
        let botText = "";
        if (candidate && candidate.content && Array.isArray(candidate.content.parts)) {
          // Modelin iç düşünme bloğu (p.thought === true) haricindeki tüm metin parçalarını birleştir
          const textParts = candidate.content.parts.filter(p => p.text && p.thought !== true);
          botText = textParts.map(p => p.text).join(" ").trim();
        }

        // Eğer model cevabında meta-talimat sızıntısı varsa temizle
        botText = botText.replace(/:\s*["']Maximum 2 short sentences\.["'][^\n]*/gi, '').trim();
        botText = botText.replace(/^\*\s*Sentence[^\n]*/gim, '').trim();
        botText = botText.replace(/^[":\s*]+/, '').trim();

        if (botText) {
          return {
            text: botText,
            usedPoolWords: [],
            source: 'gemini'
          };
        } else if (candidate) {
          lastError = new Error(`Model yanıtı boş metin üretti (finishReason: ${candidate.finishReason || 'STOP'})`);
        }
      } catch (e) {
        lastError = e;
      }
    }

    throw lastError || new Error("Gemini API yanıt vermedi");
  }

  /**
   * Kullanıcı mesajını doğrudan Google Gemini API'ye gönderir.
   * Yerel sahte yanıt fallback'i KESİNLİKLE YAPILMAZ; internet veya API bağlantı hatası varsa
   * kullanıcıya Türkçe açık ve net bir hata bildirimi döner.
   */
  async generateResponse(userInput) {
    const raw = (userInput || '').trim();
    if (!raw) {
      return {
        text: "Lütfen bir mesaj yazın.",
        usedPoolWords: [],
        isError: true
      };
    }

    const activeApiKey = getSavedGeminiApiKey();
    if (!activeApiKey) {
      return {
        text: "⚠️ API Anahtarı Tanımlanmadı: Emma ile canlı sohbet edebilmek için lütfen sağ üstteki menüden (☰) ücretsiz Google Gemini API anahtarınızı girin.",
        usedPoolWords: [],
        isError: true,
        requiresApiKey: true
      };
    }

    try {
      const geminiRes = await this.callGeminiAPI(raw);
      if (geminiRes && geminiRes.text) {
        return geminiRes;
      }
      throw new Error("Yapay zekadan boş yanıt döndü.");
    } catch (err) {
      console.error("[Emma Gemini Error]", err);
      let errMsg = "";
      const errStr = (err && (err.message || String(err))) || '';

      if (errStr.includes("429") || errStr.toLowerCase().includes("quota") || errStr.toLowerCase().includes("rate") || errStr.toLowerCase().includes("resource_exhausted")) {
        errMsg = "⚠️ API Kota Sınırı: Çok hızlı mesaj gönderildi veya ücretsiz planın dakikalık sınırı aşıldı. Lütfen 20-30 saniye bekleyip tekrar deneyin.";
      } else if (errStr.includes("403") || errStr.toLowerCase().includes("permission") || errStr.toLowerCase().includes("api_key")) {
        errMsg = "⚠️ API Yetki Hatası: Google AI Studio API anahtarınız geçersiz veya kısıtlı. Lütfen anahtarınızı kontrol edin.";
      } else if (errStr.toLowerCase().includes("timed out") || errStr.toLowerCase().includes("timeout")) {
        errMsg = "⚠️ Bağlantı Zaman Aşımı: Yapay zeka sunucusundan yanıt alınamadı. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.";
      } else if (errStr.includes("Failed to fetch") || errStr.includes("NetworkError") || errStr.includes("internet") || errStr.includes("UnknownHost") || errStr.includes("ConnectException")) {
        errMsg = "⚠️ Bağlantı Hatası: Cihazınız internete bağlı değil veya yapay zeka sunucusuna (Google Gemini) erişilemiyor. Lütfen internet bağlantınızı kontrol edin.";
      } else {
        errMsg = `⚠️ Yapay Zeka Bağlantı Hatası: API sunucusu ile haberleşilemedi (${errStr}). Lütfen internet bağlantınızı kontrol edip tekrar deneyin.`;
      }

      return {
        text: errMsg,
        usedPoolWords: [],
        isError: true
      };
    }
  }

  /**
   * Çevrimdışı / Bağlantısız yerel kural motoru (Fallback).
   */
  generateLocalFallbackResponse(userInput) {
    const raw = (userInput || '').trim();
    if (!this.isMeaningfulEnglish(raw)) {
      return this.getIncomprehensibleResponse();
    }

    const lower = raw.toLowerCase();
    const poolWords = this.getAvailablePoolWords();

    // Havuzdan rastgele bir kelime seçip doğal ve eğitici şekilde cümleye yerleştirmek için hazırla
    const samplePoolWord = poolWords[Math.floor(Math.random() * poolWords.length)];
    const poolWordEn = samplePoolWord ? samplePoolWord.en.toLowerCase() : 'book';
    const poolWordTr = samplePoolWord ? samplePoolWord.tr : 'kitap';

    // 1. Kullanıcı mesajındaki temel ögeleri (yaş, ülke, iyi hissetme) önceden analiz et
    const hasFineSentiment = /(i am|i'm|doing) (good|fine|great|happy|well|okay|ok)/i.test(lower) || /^im fine/i.test(lower) || /^fine/i.test(lower);
    
    // Yaş tespiti (örn: "I am 30", "30 years old", "I am 24")
    const ageMatch = lower.match(/\b(?:i am|i'm)?\s*(\d{1,2})\s*(?:years old|year old)?\b/i);
    let userAge = null;
    if (ageMatch && /\d/.test(lower) && !/clock|time|am|pm|at \d/i.test(lower)) {
      const num = parseInt(ageMatch[1], 10);
      if (num >= 5 && num <= 99) {
        userAge = num;
      }
    }

    // Ülke / Şehir tespiti
    const userFromTurkey = /(?:i am|i'm|i live|from) (?:turkey|türkiye|istanbul|ankara|izmir|antalya|bursa|trabzon)/i.test(lower) || /^(?:turkey|türkiye|istanbul|ankara|izmir)$/i.test(lower);

    // =========================================================================
    // ÖNCELİK 1: KULLANICININ SORDUĞU SORULAR (Her zaman İLK olarak yanıtlanır!)
    // Kullanıcı hem bilgi verip hem soru sorduğunda (örn: "I am 30. Do you like coffee")
    // soru asla atlanmaz, verilen bilgi de onaylanarak cevaplanır.
    // =========================================================================

    // 1.0 "How are you?" / "How do you do" / "How's your day"
    if (/how are you|how do you do|how's it going|how are things|how is your day|how was your day/i.test(lower)) {
      return {
        text: `I am doing great, thank you! How is your day?`,
        usedPoolWords: []
      };
    }

    // 1.1 "Are you [X]?" (örn: "Are you Cad / Cat?", "Are you a bot?", "Are you real?")
    if (/(?:^|\s)are you\b/i.test(lower) && !/how are you/i.test(lower)) {
      if (/\bare you (?:a |an )?(?:cat|cad|dog|animal|pet)\b/i.test(lower)) {
        return {
          text: "Haha, no, I am not a cat! I am Emma, your English teacher. But I love cats! 🐱 Are you ready to practice?",
          usedPoolWords: ['cat']
        };
      }
      if (/\bare you (?:a |an )?(?:bot|ai|robot|computer|virtual|machine)\b/i.test(lower)) {
        return {
          text: "Yes, I am an AI English teacher and your speaking buddy! I am here to help you practice English anytime. What should we talk about?",
          usedPoolWords: []
        };
      }
      if (/\bare you (?:a |an )?(?:human|real|person)\b/i.test(lower)) {
        return {
          text: "I am an AI assistant and English teacher, but I chat just like a real friend! How was your day?",
          usedPoolWords: []
        };
      }
      if (/\bare you (?:a |an )?teacher\b/i.test(lower)) {
        return {
          text: "Yes, I am your English teacher and conversation partner! What would you like to practice today?",
          usedPoolWords: []
        };
      }
      if (/\bare you (?:happy|fine|good|well|ok|okay)\b/i.test(lower)) {
        return {
          text: "Yes, I feel very happy and energetic chatting with you! How are you feeling today?",
          usedPoolWords: []
        };
      }
      if (/\bare you (?:sad|tired|angry|busy|bored)\b/i.test(lower)) {
        return {
          text: "No, I am not sad at all! Chatting with you always makes me happy. How are you doing?",
          usedPoolWords: []
        };
      }
      if (/\bare you ready\b/i.test(lower)) {
        return {
          text: "Yes, I am always ready to practice English with you! What would you like to talk about?",
          usedPoolWords: []
        };
      }
      // Genel "are you ..."
      return {
        text: "No, I am Emma! I am your English teacher and speaking partner 😊 Are you ready to practice?",
        usedPoolWords: []
      };
    }

    // 1.2 "Do you like [X]?" (örn: "Do you like coffee", "Do you like books", vb.)
    if (/\bdo you like\b/i.test(lower)) {
      const ageIntro = userAge ? `${userAge} is a great age! And ` : "";
      const turkeyIntro = userFromTurkey ? `Turkey is wonderful! And ` : "";
      const fineIntro = hasFineSentiment ? `Glad to hear that! And ` : "";
      const prefix = ageIntro || turkeyIntro || fineIntro || "";

      if (/\bcoffee\b/i.test(lower)) {
        return {
          text: `${prefix}Yes, I love drinking warm coffee every day! Do you drink coffee in the morning?`,
          usedPoolWords: []
        };
      }
      if (/\btea\b/i.test(lower)) {
        return {
          text: `${prefix}Yes, I really enjoy hot tea! Do you prefer black tea or green tea?`,
          usedPoolWords: []
        };
      }
      if (/\b(?:pizza|food|burger|pasta|apple|chocolate|lunch|dinner)\b/i.test(lower)) {
        return {
          text: `${prefix}Yes, I love delicious food! Pizza and pasta are my favorites. What is your favorite food?`,
          usedPoolWords: []
        };
      }
      if (/\b(?:music|song|singing)\b/i.test(lower)) {
        return {
          text: `${prefix}Yes, I love listening to music! It brings great energy. What kind of music do you like?`,
          usedPoolWords: []
        };
      }
      if (/\b(?:book|books|reading)\b/i.test(lower)) {
        return {
          text: `${prefix}Yes, I love reading books! Books teach us so much. What book do you like?`,
          usedPoolWords: ['book']
        };
      }
      if (/\b(?:cat|cats|dog|dogs|animal|animals|pet|pets)\b/i.test(lower)) {
        return {
          text: `${prefix}Yes, I love animals! Cats and dogs are so lovely. Do you have any pets?`,
          usedPoolWords: ['cat']
        };
      }
      if (/\b(?:football|sport|sports|gym|basketball)\b/i.test(lower)) {
        return {
          text: `${prefix}Yes, sports are great for health and energy! Do you play football or exercise?`,
          usedPoolWords: []
        };
      }
      return {
        text: `${prefix}Yes, I like it very much! It is very enjoyable. Do you like it too?`,
        usedPoolWords: []
      };
    }

    // 1.3 "And you?" / "What about you?" / "How about you?" / "You?" (Emma'nın sorduğu soruyu geri sorma)
    if (/\b(?:and you|what about you|how about you|you\?)\b/i.test(lower)) {
      const msgs = this.messages || [];
      const lastBotMsg = [...msgs].reverse().find(m => m.sender === 'bot');
      const lastText = (lastBotMsg && lastBotMsg.text) ? lastBotMsg.text.toLowerCase() : '';

      if (/how (was|is) your day|how are you/i.test(lastText)) {
        return {
          text: "I am doing great, thank you! I love chatting with you and teaching English. How can I help you today?",
          usedPoolWords: []
        };
      }
      if (/how old are you/i.test(lastText)) {
        return {
          text: "I am 24 years old! What about your hobbies?",
          usedPoolWords: []
        };
      }
      if (/where are you from|what city/i.test(lastText)) {
        return {
          text: "I am from London, England! What is your favorite city in the world?",
          usedPoolWords: []
        };
      }
      if (/favorite food/i.test(lastText)) {
        return {
          text: "My favorite food is Italian pizza and pasta! Do you like cooking?",
          usedPoolWords: []
        };
      }
      return {
        text: "I am doing wonderfully, thank you for asking! What would you like to talk about next?",
        usedPoolWords: []
      };
    }

    // 1.4 "Where are you from?" / "Where do you live?" / "Which country?"
    if (/where (are|r) you (from|living|located)|where do you (live|come from)|which country (are|r) you from|what country (are|r) you from|where were you born/i.test(lower)) {
      const prefix = hasFineSentiment ? "I am glad to hear you are doing well! " : (userAge ? `${userAge} is a great age! ` : "");
      if (this.level === 'A2') {
        return {
          text: `${prefix}I am from London, England! Where are you from?`,
          usedPoolWords: []
        };
      } else if (this.level === 'B1') {
        return {
          text: `${prefix}I am originally from London, in the UK! Where are you from?`,
          usedPoolWords: []
        };
      } else {
        return {
          text: `${prefix}I hail from London, England. Which part of the world are you from?`,
          usedPoolWords: []
        };
      }
    }

    // 1.5 "How old are you?" / "What is your age?"
    if (/how old are you|what is your age|what's your age/i.test(lower)) {
      if (this.level === 'A2') {
        return {
          text: `I am 24 years old! How old are you?`,
          usedPoolWords: []
        };
      } else if (this.level === 'B1') {
        return {
          text: `I'm 24 years old! Age is just a number when discovering new passions. How old are you?`,
          usedPoolWords: []
        };
      } else {
        return {
          text: `I am 24 years old! Lifelong learning is deeply rewarding at every stage of life. What about yourself?`,
          usedPoolWords: []
        };
      }
    }

    // 1.6 "What is your name?" / "Who are you?"
    if (/what('s| is) your name|who are you/i.test(lower)) {
      if (this.level === 'A2') {
        return {
          text: `My name is Emma! I am your English teacher. What is your name?`,
          usedPoolWords: ['name']
        };
      }
      return {
        text: `My name is Emma! I'm your interactive AI English speaking buddy. My mission is to help you build confidence in speaking English, step by step. What name would you like me to call you?`,
        usedPoolWords: ['name']
      };
    }

    // 1.7 "What is your job?" / "What do you do?" / "What do you work?"
    if (/what('s| is) your job|what do you do|what do you work/i.test(lower)) {
      if (this.level === 'A2') {
        return {
          text: `I am an English teacher and speaking buddy! What is your job?`,
          usedPoolWords: []
        };
      } else if (this.level === 'B1') {
        return {
          text: `I am an AI English teacher and your conversational partner! What kind of work or studies do you do?`,
          usedPoolWords: []
        };
      } else {
        return {
          text: `I am your dedicated AI language companion, engineered to facilitate natural and fluent dialogues. What profession or field are you in?`,
          usedPoolWords: []
        };
      }
    }

    // 1.8 "What are you doing?" / "What's up?"
    if (/what are you doing|what are you up to|what's up|what is up/i.test(lower)) {
      if (this.level === 'A2') {
        return {
          text: `I am chatting with you and teaching English! What are you doing right now?`,
          usedPoolWords: []
        };
      } else if (this.level === 'B1') {
        return {
          text: `I'm right here chatting with you and enjoying our practice session. What are you up to today?`,
          usedPoolWords: []
        };
      } else {
        return {
          text: `I am actively conversing with you and exploring stimulating English expressions. How is your schedule unfolding today?`,
          usedPoolWords: []
        };
      }
    }

    // 1.9 Türkçe konuşabiliyor musun? / "Can you speak Turkish?"
    if (/can you speak turkish|do you (know|speak) turkish|speak turkish|türkçe (biliyor|konuşuyor) musun|türkçe konuş/i.test(lower)) {
      if (this.level === 'A2') {
        return {
          text: `I know a little Turkish, but let's speak English together! 😊 What is your favorite word?`,
          usedPoolWords: []
        };
      } else if (this.level === 'B1') {
        return {
          text: `I can understand some Turkish, but our goal is to practice English! What would you like to talk about today?`,
          usedPoolWords: []
        };
      } else {
        return {
          text: `While I can comprehend Turkish, practicing English will accelerate your fluency noticeably. Shall we continue in English?`,
          usedPoolWords: []
        };
      }
    }

    // 1.10 Hobiler: "What are your hobbies?" / "What do you like to do?"
    if (/what (are|r) your hobbies|what is your hobby|what do you like to do|what are your interests/i.test(lower)) {
      if (this.level === 'A2') {
        return {
          text: `I love reading books, listening to music, and drinking coffee! What are your hobbies?`,
          usedPoolWords: ['book']
        };
      } else if (this.level === 'B1') {
        return {
          text: `I really enjoy reading classic literature, learning new languages, and discovering acoustic music. How do you spend your leisure time?`,
          usedPoolWords: []
        };
      } else {
        return {
          text: `I have a keen affinity for literature, linguistics, and cultural arts. What activities bring you the greatest creative satisfaction?`,
          usedPoolWords: []
        };
      }
    }

    // 1.11 "What is your favorite [X]?"
    if (/what('s| is) your (?:favorite|favourite|favori) (food|color|movie|book|song|music|sport|animal|season|place)/i.test(lower) || /(?:favorite|favourite|favori) (?:color|food|book|music|movie)/i.test(lower)) {
      if (/food/i.test(lower)) {
        return { text: "My favorite food is Italian pasta and pizza! What is your favorite food?", usedPoolWords: [] };
      }
      if (/music|song/i.test(lower)) {
        return { text: "I love acoustic and pop music! What kind of music do you like?", usedPoolWords: [] };
      }
      if (/color/i.test(lower)) {
        return { text: "I love golden yellow and blue! What is your favorite color?", usedPoolWords: [] };
      }
      if (this.level === 'A2') {
        return {
          text: `I love reading good books and sunny days! What is your favorite?`,
          usedPoolWords: ['book']
        };
      } else {
        return {
          text: `I'm very fond of inspiring books, warm coffee, and autumn days. What about you?`,
          usedPoolWords: []
        };
      }
    }

    // 1.12 Aile / Evcil Hayvan: "Do you have pets / family?"
    if (/do you have (a )?(family|sister|brother|pet|cat|dog|kids|children)/i.test(lower)) {
      if (this.level === 'A2') {
        return {
          text: `I have a cute cat! Do you have any pets or a big family?`,
          usedPoolWords: ['cat']
        };
      } else {
        return {
          text: `I love animals and consider all my learners part of a global family! Do you have pets or siblings?`,
          usedPoolWords: []
        };
      }
    }

    // 1.13 "Can you help me?" / "Help"
    if (/can you help me|help me|i need help/i.test(lower)) {
      if (this.level === 'A2') {
        return {
          text: `Yes, of course! I am here to help you practice English. What do you want to talk about?`,
          usedPoolWords: []
        };
      } else {
        return {
          text: `I'd love to help! We can practice vocabulary, daily conversation, or grammar. What would you like to focus on?`,
          usedPoolWords: []
        };
      }
    }

    // 1.14 "How are you" / "How's your day"
    if (/how are you|how do you do|how's it going|how are things|how is your day|how was your day/i.test(lower)) {
      if (this.level === 'A2') {
        return {
          text: `I am good, thank you! How is your day?`,
          usedPoolWords: []
        };
      } else if (this.level === 'B1') {
        return {
          text: `I'm doing fantastic, thanks for asking! Every conversation with you brightens my day. Have you done anything fun or relaxing recently?`,
          usedPoolWords: ['day']
        };
      } else {
        return {
          text: `I'm doing wonderfully well, thank you! I'm genuinely looking forward to our discussion. What kind of topics are you in the mood to explore today?`,
          usedPoolWords: []
        };
      }
    }

    // =========================================================================
    // ÖNCELİK 2: KULLANICI BEYANLARI (Soru sormadıysa, verilen bilgiyi yanıtla)
    // =========================================================================

    // 2.1 Kullanıcı yaşını söyledi (örn: "I am 30", "30 years old")
    if (userAge) {
      if (this.level === 'A2') {
        return {
          text: `Nice! ${userAge} is a great age to practice English. Do you study or work?`,
          usedPoolWords: []
        };
      } else {
        return {
          text: `That's a wonderful age! Learning English opens countless opportunities. Do you currently work or study?`,
          usedPoolWords: []
        };
      }
    }

    // 2.2 Kullanıcı nereli olduğunu söyledi (örn: "I am from Turkey", "I live in Istanbul")
    if (userFromTurkey) {
      if (this.level === 'A2') {
        return {
          text: `Wonderful! Turkey is a beautiful country. What city do you live in?`,
          usedPoolWords: []
        };
      } else if (this.level === 'B1') {
        return {
          text: `That is fantastic! Turkey has an incredible history, delicious cuisine, and rich culture. What do you love most about your city?`,
          usedPoolWords: []
        };
      } else {
        return {
          text: `Fascinating! Turkey bridges remarkable cultural heritage and geographical significance. How long have you lived there?`,
          usedPoolWords: []
        };
      }
    }
    if (/(i am|i'm|i live|from) (germany|england|france|italy|spain|usa|america|canada|japan)/i.test(lower)) {
      if (this.level === 'A2') {
        return {
          text: `Awesome! That is a very nice place. Do you like living there?`,
          usedPoolWords: []
        };
      } else {
        return {
          text: `That sounds like a wonderful region! What is your favorite thing about life there?`,
          usedPoolWords: []
        };
      }
    }

    // 2.3 Saf Selamlaşma: "Hello", "Hi Emma", "Good morning" (Cümlede başka konu yoksa)
    if (/^(hi|hello|hey|good morning|good afternoon|good evening)[.!]?\s*(emma|teacher|friend)?[.!]?$/i.test(lower)) {
      const msgs = this.messages || [];
      const hasPriorUserMsg = msgs.some(m => m.sender === 'user');
      if (hasPriorUserMsg) {
        return {
          text: `Hello again! What would you like to talk about today?`,
          usedPoolWords: []
        };
      }
      if (this.level === 'A2') {
        return {
          text: `Hello! Nice to meet you. How are you today?`,
          usedPoolWords: []
        };
      } else if (this.level === 'B1') {
        return {
          text: `Hi there! It's always a pleasure chatting with you. How has your week been turning out so far?`,
          usedPoolWords: ['day']
        };
      } else {
        return {
          text: `Hello! I'm delighted to see you here today. What exciting projects or ideas have been keeping you engaged lately?`,
          usedPoolWords: ['day']
        };
      }
    }

    // 2.4 İyiyim / Harikayım
    if (hasFineSentiment) {
      if (this.level === 'A2') {
        return {
          text: `Great! Did you have a good day today?`,
          usedPoolWords: []
        };
      } else if (this.level === 'B1') {
        return {
          text: `That's awesome! A positive mood makes language learning so much easier. What kind of hobbies do you usually turn to when you want to unwind?`,
          usedPoolWords: []
        };
      } else {
        return {
          text: `That is delightful news! Maintaining positive energy is essential. Speaking of daily life, how do you usually balance your work and leisure activities?`,
          usedPoolWords: []
        };
      }
    }

    // 2.5 Yorgunum / Meşgulüm / Üzgünüm
    if (/i am (tired|exhausted|sleepy|busy|stressed|sad)/i.test(lower)) {
      if (this.level === 'A2') {
        return {
          text: `Oh! Please rest and drink some water. What did you do today?`,
          usedPoolWords: ['water']
        };
      } else if (this.level === 'B1') {
        return {
          text: `I'm sorry to hear that you're feeling that way. It's really important to pause, take a deep breath, and recharge. What helps you unwind after a long day?`,
          usedPoolWords: ['day']
        };
      } else {
        return {
          text: `I completely understand; demanding days can be physically and mentally draining. Don't push yourself too hard. What is your favorite ritual for decompressing?`,
          usedPoolWords: []
        };
      }
    }

    // =========================================================================
    // ÖNCELİK 3: KISA ONAYLAR (Yes / No / Ok)
    // =========================================================================
    if (/^(yes|yeah|yep|sure|of course|definitely|ok|okay)[.!]?$/i.test(lower)) {
      if (this.level === 'A2') {
        return {
          text: `Great! Tell me more about it.`,
          usedPoolWords: []
        };
      }
      return {
        text: `Wonderful! Could you share a few more details about that?`,
        usedPoolWords: []
      };
    }
    if (/^(no|nope|not really|never|neither)[.!]?$/i.test(lower)) {
      if (this.level === 'A2') {
        return {
          text: `I understand! What do you like instead?`,
          usedPoolWords: []
        };
      }
      return {
        text: `I completely understand. What would you prefer instead?`,
        usedPoolWords: []
      };
    }

    // =========================================================================
    // ÖNCELİK 4: TEMATİK CÜMLELER (Yemek, Spor, Müzik, İş, Seyahat, Kitap vb.)
    // =========================================================================

    // 4.1 Yemek, İçecek, Kahvaltı
    if (/eat|food|breakfast|lunch|dinner|coffee|tea|water|pizza|apple/i.test(lower)) {
      if (this.level === 'A2') {
        return {
          text: `Yummy! What is your favorite food?`,
          usedPoolWords: []
        };
      } else if (this.level === 'B1') {
        return {
          text: `That sounds mouth-watering! Cuisine tells so much about culture and personal taste. Do you prefer eating traditional dishes or experimenting with international recipes?`,
          usedPoolWords: []
        };
      } else {
        return {
          text: `Gastronomy is indeed one of life's greatest pleasures. The interplay of flavors and social bonding over food is fascinating. Would you consider yourself a passionate foodie?`,
          usedPoolWords: []
        };
      }
    }

    // 4.2 Spor & Egzersiz
    if (/sport|football|soccer|basketball|gym|run|running|fitness|swimming|walk/i.test(lower)) {
      if (this.level === 'A2') {
        return {
          text: `Sports are great for health! Do you play football or do sports often?`,
          usedPoolWords: []
        };
      } else {
        return {
          text: `Staying active physically has a tremendous benefit for mental focus! How often do you make time for exercise or sports?`,
          usedPoolWords: []
        };
      }
    }

    // 4.3 Müzik, Film, Sinema
    if (/music|song|sing|listen|movie|film|cinema|watch/i.test(lower)) {
      if (this.level === 'A2') {
        return {
          text: `Music and movies are so fun! What kind of music or movies do you like?`,
          usedPoolWords: []
        };
      } else {
        return {
          text: `Arts and entertainment are wonderful avenues for cultural expression. Do you have a favorite artist, genre, or movie you'd recommend?`,
          usedPoolWords: []
        };
      }
    }

    // 4.4 Seyahat & Tatil
    if (/travel|trip|holiday|vacation|flight|hotel|beach|summer/i.test(lower)) {
      if (this.level === 'A2') {
        return {
          text: `Traveling is amazing! Where is your dream holiday place?`,
          usedPoolWords: []
        };
      } else {
        return {
          text: `Traveling broadens our perspective unlike anything else. What has been the most memorable destination you've visited so far?`,
          usedPoolWords: []
        };
      }
    }

    // 4.5 Çalışma, Ders, İngilizce Öğrenme
    if (/english|study|learn|lesson|school|work|job|exam|test/i.test(lower)) {
      if (this.level === 'A2') {
        return {
          text: `Good job! Do you like learning English?`,
          usedPoolWords: []
        };
      } else if (this.level === 'B1') {
        return {
          text: `Dedication is the true secret of language fluency! Practicing daily with vocabulary pools makes an incredible difference. What aspect of English do you find most challenging: speaking, grammar, or vocabulary?`,
          usedPoolWords: []
        };
      } else {
        return {
          text: `Acquiring a foreign language is a profound cognitive journey that broadens your perspective. With persistent practice, expressing nuanced ideas becomes second nature. How do you assess your progress so far?`,
          usedPoolWords: []
        };
      }
    }

    // 4.6 Hayvanlar, Doğa, Hava Durumu
    if (/cat|dog|animal|pet|weather|sun|rain|cold|hot|sunny/i.test(lower)) {
      if (this.level === 'A2') {
        return {
          text: `Nice! Do you like cats or dogs?`,
          usedPoolWords: []
        };
      } else if (this.level === 'B1') {
        return {
          text: `Animals and nature truly have a calming effect on our lives. Good weather also changes our mood instantly. How does the weather outside look like right now where you are?`,
          usedPoolWords: []
        };
      } else {
        return {
          text: `Nature has an innate ability to restore our equilibrium. The weather often subliminally dictates our daily rhythm and productivity. How does changing weather influence your routine?`,
          usedPoolWords: []
        };
      }
    }

    // 4.7 Teşekkür / Veda
    if (/thank you|thanks|bye|goodbye|see you|have a nice day|good night/i.test(lower)) {
      if (/good night/i.test(lower)) {
        return {
          text: `Good night! Sleep well and see you tomorrow for more English practice! 🌙`,
          usedPoolWords: []
        };
      }
      if (this.level === 'A2') {
        return {
          text: `You are welcome! Have a good day! 😊`,
          usedPoolWords: []
        };
      }
      return {
        text: `You are most welcome! It was a real pleasure chatting with you. Keep practicing English, you're doing amazing! Have a fantastic day ahead! 🌟`,
        usedPoolWords: ['day']
      };
    }

    // 4.8 Kitap / Okuma
    if (/book|read|reading/i.test(lower)) {
      if (this.level === 'A2') {
        return {
          text: `Great! What book do you like?`,
          usedPoolWords: ['book']
        };
      }
    }

    // =========================================================================
    // ÖNCELİK 5: GENEL VE EĞİTİCİ YANIT (Doğal & Akıcı)
    // =========================================================================
    if (this.level === 'A2') {
      const a2Responses = [
        `Speaking of English words, do you know '${poolWordEn}' (${poolWordTr})? Can you make a simple sentence with it?`,
        `That is very interesting! Tell me more in simple words.`,
        `Nice! What else do you like to do in your free time?`,
        `Great sentence! By the way, how was your day today?`
      ];
      return {
        text: a2Responses[Math.floor(Math.random() * a2Responses.length)],
        usedPoolWords: [poolWordEn]
      };
    } else if (this.level === 'B1') {
      const b1Responses = [
        `I see exactly what you mean! It's wonderful how you phrased that thought. If you had the opportunity, how would you develop this further?`,
        `That makes a lot of sense. Communicating clearly in a second language is a huge achievement. What was your main reason for thinking so?`,
        `Fascinating point! In connection with that, how do people around you usually react to such situations?`
      ];
      return {
        text: b1Responses[Math.floor(Math.random() * b1Responses.length)],
        usedPoolWords: []
      };
    } else {
      const b2Responses = [
        `That's an insightful observation. Your ability to articulate that perspective highlights your growing fluency. How would you weigh the trade-offs involved in that?`,
        `A very compelling remark! It invites a deeper discussion about personal habits and social dynamics. Could you elaborate on what led you to that conclusion?`,
        `I appreciate the clarity and nuance in your thought. Exploring diverse angles on this topic is truly rewarding. What would be the next step in your view?`
      ];
      return {
        text: b2Responses[Math.floor(Math.random() * b2Responses.length)],
        usedPoolWords: []
      };
    }
  }

  getIncomprehensibleResponse() {
    if (this.level === 'A2') {
      return {
        text: "I did not understand. Please write simple English! 😊",
        usedPoolWords: [],
        isIncomprehensible: true
      };
    }
    const responses = [
      "I'm not quite sure I understood what you meant! Could you please try writing that again in simpler English? 😊",
      "Demek istediğinizi tam olarak anlayamadım. İngilizce olarak daha sade bir cümleyle tekrar ifade edebilir misiniz?",
      "I didn't catch that clearly. Could you rephrase your sentence in English? For example: 'Today was good' or 'I like reading'."
    ];
    return {
      text: responses[Math.floor(Math.random() * responses.length)],
      usedPoolWords: [],
      isIncomprehensible: true
    };
  }

  cleanTextForSpeech(rawText) {
    if (!rawText || typeof rawText !== 'string') return '';
    let t = rawText;
    // 1. Parantez içindeki Türkçe çevirileri temizle (ör. (kitap), (Deve) vb.)
    t = t.replace(/\s*\([^)]*\)/g, '');
    // 2. Emojileri ve özel sembolleri temizle
    t = t.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}]/gu, '');
    t = t.replace(/[✓★☆⚡💬💡🔊📚]/g, '');
    // 3. Noktalama ve boşlukları toparla
    t = t.replace(/\s+/g, ' ').trim();
    return t;
  }

  speak(rawText, onStart = null, onEnd = null) {
    if (!this.ttsEnabled || typeof window === 'undefined') {
      if (typeof onEnd === 'function') onEnd();
      return;
    }

    const textToSpeak = this.cleanTextForSpeech(rawText);
    if (!textToSpeak) {
      if (typeof onEnd === 'function') onEnd();
      return;
    }

    if (typeof onStart === 'function') onStart();

    // 1. ÖNCELİK: DESKTOP WINDOWS (C# StandaloneProgram.cs SAPI Language=409 Microsoft Zira)
    // C# bridge üzerinden Windows'un doğrudan Amerikan İngilizcesi kadın sesini (Zira) tetikler.
    if (window.chrome && window.chrome.webview && typeof window.chrome.webview.postMessage === 'function') {
      try {
        window.chrome.webview.postMessage('SPEAK:' + textToSpeak);
        const estMs = Math.max(1600, Math.min(12000, textToSpeak.split(' ').length * 550));
        setTimeout(() => { if (typeof onEnd === 'function') onEnd(); }, estMs);
        return;
      } catch (_) {}
    }

    // 2. ÖNCELİK: ANDROID MOBIL (Android Native TextToSpeech Bridge - Locale.US)
    // Android MainActivity üzerinden telefonun dilinden bağımsız olarak zorunlu US English kadın sesiyle seslendirir.
    if (window.AndroidNativeTTS && typeof window.AndroidNativeTTS.speak === 'function') {
      try {
        window.AndroidNativeTTS.speak(textToSpeak);
        const estMs = Math.max(1600, Math.min(12000, textToSpeak.split(' ').length * 550));
        setTimeout(() => { if (typeof onEnd === 'function') onEnd(); }, estMs);
        return;
      } catch (_) {}
    }

    // 3. ÖNCELİK: DOĞAL AKICI İNGİLİZCE KADIN SESİ (Google Translate US English Kadın Sesi)
    // Bu kaynak "I'm Emma" ifadesini Türkçe gibi değil, kusursuz Amerikan aksanıyla ("Aym Emma") okur!
    if (typeof Audio !== 'undefined' && navigator.onLine) {
      try {
        if (this._currentAudio) {
          try { this._currentAudio.pause(); } catch (_) {}
          this._currentAudio = null;
        }
        const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en&q=${encodeURIComponent(textToSpeak)}`;
        const audio = new Audio(audioUrl);
        this._currentAudio = audio;
        audio.playbackRate = 0.86; // Sakin, tane tane, çok anlaşılır konuşma
        audio.onended = () => { if (typeof onEnd === 'function') onEnd(); };
        audio.onerror = () => { this._fallbackWebSpeech(textToSpeak, onStart, onEnd); };
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            this._fallbackWebSpeech(textToSpeak, onStart, onEnd);
          });
        }
        return;
      } catch (_) {}
    }

    // 4. ÇEVRİMDIŞI WEB SPEECH FALLBACK
    this._fallbackWebSpeech(textToSpeak, onStart, onEnd);
  }

  _fallbackWebSpeech(textToSpeak, onStart, onEnd) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (typeof onEnd === 'function') onEnd();
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const runSpeech = () => {
        try {
          const utterance = new SpeechSynthesisUtterance(textToSpeak);
          utterance.lang = 'en-US';

          const bestFemaleVoice = this.findBestFemaleEnglishVoice();
          let hasExplicitFemale = false;

          if (bestFemaleVoice) {
            utterance.voice = bestFemaleVoice;
            this.selectedVoice = bestFemaleVoice;
            hasExplicitFemale = true;
          } else if (this.selectedVoice) {
            utterance.voice = this.selectedVoice;
            hasExplicitFemale = true;
          }

          utterance.rate = 0.88;
          utterance.pitch = 0.96; // Doğal, tok, olgun ve sıcak kadın ses frekansı (tiz/ince değil)
          utterance.volume = 1.0;

          if (typeof onEnd === 'function') {
            utterance.onend = onEnd;
            utterance.onerror = onEnd;
          }

          window.speechSynthesis.speak(utterance);
        } catch (_) {
          if (typeof onEnd === 'function') onEnd();
        }
      };
      setTimeout(runSpeech, 40);
    } catch (_) {
      if (typeof onEnd === 'function') onEnd();
    }
  }

  stopSpeech() {
    if (window.chrome && window.chrome.webview && typeof window.chrome.webview.postMessage === 'function') {
      try { window.chrome.webview.postMessage('STOP_SPEECH'); } catch (_) {}
    }
    if (window.AndroidNativeTTS && typeof window.AndroidNativeTTS.stop === 'function') {
      try { window.AndroidNativeTTS.stop(); } catch (_) {}
    }
    if (this._currentAudio) {
      try { this._currentAudio.pause(); this._currentAudio = null; } catch (_) {}
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch (_) {}
    }
  }

  getSamplePromptsForLevel() {
    if (this.level === 'A2') {
      return [
        "Today was a very busy day for me.",
        "I love drinking coffee in the morning.",
        "My favorite hobby is reading books.",
        "What is your favorite animal?"
      ];
    } else if (this.level === 'B1') {
      return [
        "I think learning languages opens up great opportunities.",
        "Recently, I have been trying to improve my daily routine.",
        "Do you prefer living in a quiet town or a bustling city?",
        "Could you suggest some effective ways to practice vocabulary?"
      ];
    } else {
      return [
        "Artificial intelligence is fundamentally reshaping how we acquire new skills.",
        "Balancing career ambitions with personal well-being is a constant challenge.",
        "What are the most significant cultural differences in your perspective?",
        "I believe that consistent habits yield far greater results than sudden motivation."
      ];
    }
  }

  /**
   * Emma'nın son mesajını analiz eder:
   * 1. Eğer Emma bir soru sormuşsa (mesajda ? varsa), sorunun konusunu tespit edip
   *    kullanıcının seçili İngilizce seviyesine (A2, B1, B2) uygun doğal yanıt cümleleri üretir.
   * 2. Eğer bir soru sorulmamışsa, genel seviye başlatıcı cümleleri döner.
   */
/**
   * Emma'nın son mesajını analiz eder:
   * 1. Eğer Emma bir soru sormuşsa (mesajda ? varsa), sorunun konusunu tespit edip
   *    kullanıcının seçili İngilizce seviyesine (A2, B1, B2) uygun doğal yanıt cümleleri üretir.
   * 2. Eğer bir soru sorulmamışsa, genel seviye başlatıcı cümleleri döner.
   */
  getContextualHintAnswers() {
    const msgs = this.messages || [];
    const lastBotMsg = [...msgs].reverse().find(m => m.sender === 'bot' && !m.isError && !(m.text && m.text.startsWith('⚠️')));
    const botText = (lastBotMsg && lastBotMsg.text) ? lastBotMsg.text : '';

    const hasQuestion = botText.includes('?');

    if (!hasQuestion) {
      return {
        isAnswerToQuestion: false,
        questionTopic: null,
        answers: this.getSamplePromptsForLevel()
      };
    }

    const lower = botText.toLowerCase();

    // Soru cümlesini tebrik ve selamlardan (ör: "That is great!", "Hello!", "Good job!") izole et
    // Böylece önceki cümlelerdeki "great" kelimesi "eat" (yemek) ile karışmaz!
    let targetText = lower;
    const sentences = lower.split(/(?<=[.!?\n])\s+/);
    const questionSentence = [...sentences].reverse().find(s => s.includes('?'));
    if (questionSentence) {
      targetText = questionSentence.trim();
    }

    // 1. Hobiler / Eğlence / Serbest Zaman / Hafta Sonu: "for fun", "free time", "hobbies", "weekend", "like to do"
    if (/\b(fun|hobby|hobbies|free time|spare time|weekend|weekends|leisure|pastime)\b/i.test(targetText) || /what do you like to do|what do you do for fun|what do you enjoy/i.test(targetText)) {
      if (this.level === 'A2') {
        return {
          isAnswerToQuestion: true,
          questionTopic: 'fun_hobbies',
          answers: [
            "In my free time, I like listening to music and watching movies.",
            "I like playing games and walking in the park with my friends.",
            "I enjoy reading books and resting at home.",
            "I like riding my bicycle and spending time outside."
          ]
        };
      } else if (this.level === 'B1') {
        return {
          isAnswerToQuestion: true,
          questionTopic: 'fun_hobbies',
          answers: [
            "For fun, I really enjoy photography and exploring new cafes on weekends.",
            "In my spare time, I usually watch English movies and read fascinating novels.",
            "I like staying active; I often go jogging or play sports with friends."
          ]
        };
      } else {
        return {
          isAnswerToQuestion: true,
          questionTopic: 'fun_hobbies',
          answers: [
            "I find engaging in creative hobbies like writing and documentary watching deeply rewarding.",
            "During my leisure hours, I pursue outdoor trekking and cultural exhibitions."
          ]
        };
      }
    }

    // 2. Renkler ve Kıyafetler: "favorite color", "yellow shirt", "what colors"
    if (/\b(color|colors|colour|colours|shirt|clothes|wear|wearing|yellow|blue|red|green|black|white|purple|orange|pink|dress)\b/i.test(targetText)) {
      if (this.level === 'A2') {
        return {
          isAnswerToQuestion: true,
          questionTopic: 'colors_clothes',
          answers: [
            "My favorite color is blue because it is calm and beautiful.",
            "Yes, I have a yellow shirt and I like wearing it in summer.",
            "I like black and white colors because they look very modern.",
            "My favorite color is green because it reminds me of nature."
          ]
        };
      } else if (this.level === 'B1') {
        return {
          isAnswerToQuestion: true,
          questionTopic: 'colors_clothes',
          answers: [
            "My favorite color is deep blue; it feels peaceful and elegant.",
            "Yes, I do! I think bright colors like yellow always brighten up my mood.",
            "I tend to wear neutral colors like gray and navy, but I love vibrant accents."
          ]
        };
      } else {
        return {
          isAnswerToQuestion: true,
          questionTopic: 'colors_clothes',
          answers: [
            "I naturally gravitate toward warm earth tones and subtle minimalist palettes.",
            "I appreciate bold contrasts in fashion, though muted shades dominate my wardrobe."
          ]
        };
      }
    }

    // 3. Müzik / Şarkı / Enstrüman: "music", "songs", "instrument", "guitar", "piano"
    if (/\b(music|song|songs|sing|singing|band|instrument|guitar|piano|concert)\b/i.test(targetText) || /listen to/i.test(targetText)) {
      if (this.level === 'A2') {
        return {
          isAnswerToQuestion: true,
          questionTopic: 'music',
          answers: [
            "I love listening to pop and acoustic music while relaxing.",
            "My favorite music is rock and jazz because they have great rhythm.",
            "I don't play an instrument, but I would love to learn the guitar.",
            "Listening to calm music helps me focus when I study."
          ]
        };
      } else if (this.level === 'B1') {
        return {
          isAnswerToQuestion: true,
          questionTopic: 'music',
          answers: [
            "I enjoy an eclectic mix of genres, ranging from indie rock to classical melodies.",
            "Listening to instrumental soundtracks helps me concentrate while working."
          ]
        };
      } else {
        return {
          isAnswerToQuestion: true,
          questionTopic: 'music',
          answers: [
            "Music is an integral part of my day; I appreciate ambient compositions with emotional depth."
          ]
        };
      }
    }

    // 4. Yemek, İçecek, Kahvaltı: "breakfast", "coffee", "food", "cook", "eat", "pizza", "tea" (Strict \b!)
    if (/\b(food|foods|breakfast|lunch|dinner|meal|meals|cook|cooking|eat|eating|dish|dishes|coffee|tea|pizza|pasta|fruit|fruits|drink|drinking)\b/i.test(targetText)) {
      if (this.level === 'A2') {
        return {
          isAnswerToQuestion: true,
          questionTopic: 'food',
          answers: [
            "I really love eating fresh fruits and drinking cold orange juice.",
            "My favorite food is Italian pasta with cheese and tomatoes.",
            "I had a warm cup of coffee and eggs for breakfast this morning.",
            "I like cooking simple, delicious meals at home on weekends."
          ]
        };
      } else if (this.level === 'B1') {
        return {
          isAnswerToQuestion: true,
          questionTopic: 'food',
          answers: [
            "I usually prefer preparing traditional homemade dishes, though I enjoy Italian pasta too.",
            "Starting my morning with freshly brewed coffee gives me energy for the whole day.",
            "I'm fond of experimenting with different spices and cooking Mediterranean recipes."
          ]
        };
      } else {
        return {
          isAnswerToQuestion: true,
          questionTopic: 'food',
          answers: [
            "I appreciate balanced nutrition and take pleasure in exploring diverse culinary traditions.",
            "Cooking from scratch is therapeutic for me; I especially appreciate authentic Mediterranean flavors."
          ]
        };
      }
    }

    // 5. Seyahat / Şehirler / Ülkeler / Tatil
    if (/\b(travel|traveling|vacation|holiday|trip|visit|visited|country|countries|city|cities|abroad)\b/i.test(targetText)) {
      if (this.level === 'A2') {
        return {
          isAnswerToQuestion: true,
          questionTopic: 'travel',
          answers: [
            "I would love to visit Italy and see historical places one day.",
            "My dream vacation is a peaceful beach where I can relax in the sun.",
            "I like exploring new cities and trying local foods when I travel."
          ]
        };
      } else if (this.level === 'B1') {
        return {
          isAnswerToQuestion: true,
          questionTopic: 'travel',
          answers: [
            "Traveling and immersing myself in different cultural landscapes is one of my biggest passions.",
            "I would love to explore Japan to experience both historic traditions and ultra-modern cities."
          ]
        };
      } else {
        return {
          isAnswerToQuestion: true,
          questionTopic: 'travel',
          answers: [
            "Experiencing foreign cultures firsthand broadens one's perspective in an irreplaceable way."
          ]
        };
      }
    }

    // 6. Film / Dizi / Sinema
    if (/\b(movie|movies|film|films|cinema|series|actor|actress|netflix)\b/i.test(targetText) || /watch (movies|films|tv)/i.test(targetText)) {
      if (this.level === 'A2') {
        return {
          isAnswerToQuestion: true,
          questionTopic: 'movies',
          answers: [
            "I love watching comedy and science-fiction movies on weekends.",
            "I watched an exciting action film recently and really enjoyed it.",
            "Watching movies with English subtitles helps me improve my vocabulary."
          ]
        };
      } else {
        return {
          isAnswerToQuestion: true,
          questionTopic: 'movies',
          answers: [
            "I'm drawn to psychological thrillers and thought-provoking documentaries.",
            "Watching films in original English audio has been instrumental for my listening comprehension."
          ]
        };
      }
    }

    // 7. Kitap / Okuma
    if (/\b(book|books|read|reading|novel|novels|author)\b/i.test(targetText)) {
      if (this.level === 'A2') {
        return {
          isAnswerToQuestion: true,
          questionTopic: 'books',
          answers: [
            "Yes, I like reading books about history and interesting stories.",
            "I try to read a few pages of an English book every evening.",
            "Reading books helps me relax and learn new words."
          ]
        };
      } else {
        return {
          isAnswerToQuestion: true,
          questionTopic: 'books',
          answers: [
            "Immersing myself in a compelling book allows me to completely disconnect from daily stress.",
            "I particularly enjoy non-fiction and biographies that explore remarkable life journeys."
          ]
        };
      }
    }

    // 8. Hayvanlar / Evcil Hayvan
    if (/\b(pet|pets|dog|dogs|cat|cats|animal|animals|puppy|kitten)\b/i.test(targetText)) {
      if (this.level === 'A2') {
        return {
          isAnswerToQuestion: true,
          questionTopic: 'animals',
          answers: [
            "I have a lovely cat at home, and I really adore friendly animals.",
            "My favorite animal is a dog because they are loyal, playful, and loving.",
            "I don't have any pets right now, but I would love to adopt a dog in the future."
          ]
        };
      } else {
        return {
          isAnswerToQuestion: true,
          questionTopic: 'animals',
          answers: [
            "I've always believed that having a pet brings incredible warmth and joy to a household.",
            "Although I don't own a pet currently, I am an avid animal lover."
          ]
        };
      }
    }

    // 9. Hava Durumu / Mevsim
    if (/\b(weather|rain|raining|sunny|cold|hot|snow|snowing|windy|season|summer|winter|spring|autumn|fall)\b/i.test(targetText)) {
      if (this.level === 'A2') {
        return {
          isAnswerToQuestion: true,
          questionTopic: 'weather',
          answers: [
            "The weather is very sunny and pleasant here today.",
            "It is a bit cold and cloudy outside today, so I prefer staying warm indoors.",
            "My favorite season is spring because the weather is warm and flowers bloom."
          ]
        };
      } else {
        return {
          isAnswerToQuestion: true,
          questionTopic: 'weather',
          answers: [
            "The weather outside is remarkably crisp and clear today, ideal for a walk.",
            "We have overcast skies today, which creates a rather cozy and reflective atmosphere."
          ]
        };
      }
    }

    // 10. Nerelisin / Nerede yaşıyorsun: "where are you from", "where do you live", "what city", "which country"
    if (/where (are|r) you (from|living|located)|where do you (live|come from)|which (country|city)|what (country|city)/i.test(targetText)) {
      if (this.level === 'A2') {
        return {
          isAnswerToQuestion: true,
          questionTopic: 'origin',
          answers: [
            "I am from Turkey!",
            "I live in Istanbul, Turkey.",
            "I am from Ankara, Turkey."
          ]
        };
      } else if (this.level === 'B1') {
        return {
          isAnswerToQuestion: true,
          questionTopic: 'origin',
          answers: [
            "I am originally from Turkey, and I live in Istanbul.",
            "I live in Ankara, Turkey, which has a wonderful culture and history.",
            "I am from Turkey; it is a very beautiful place to live."
          ]
        };
      } else {
        return {
          isAnswerToQuestion: true,
          questionTopic: 'origin',
          answers: [
            "I reside in Istanbul, Turkey, a dynamic city bridging two continents.",
            "I hail from Turkey, where rich cultural heritage and vibrant life meet."
          ]
        };
      }
    }

    // 11. Yaş: "how old are you", "your age"
    if (/how old are you|your age/i.test(targetText)) {
      if (this.level === 'A2') {
        return {
          isAnswerToQuestion: true,
          questionTopic: 'age',
          answers: [
            "I am 25 years old.",
            "I am 28 years old and learning English.",
            "I am 30 years old."
          ]
        };
      } else {
        return {
          isAnswerToQuestion: true,
          questionTopic: 'age',
          answers: [
            "I am in my twenties and enjoying learning English every day.",
            "I am 28 years old, focusing on personal development and communication."
          ]
        };
      }
    }

    // 12. Meslek / İş: "what is your job", "what do you do", "work or study"
    if (/what('s| is) your job|what do you do|work or study|do you work/i.test(targetText) || /\b(job|work|career|study|studying|university|school|office|company|engineer|student)\b/i.test(targetText)) {
      if (this.level === 'A2') {
        return {
          isAnswerToQuestion: true,
          questionTopic: 'job',
          answers: [
            "I work at an office and practice English every day.",
            "I am a student and I study hard.",
            "I work as an engineer in a company."
          ]
        };
      } else {
        return {
          isAnswerToQuestion: true,
          questionTopic: 'job',
          answers: [
            "I work in a creative professional field and actively expand my skills.",
            "I am pursuing my academic studies while improving my English fluency."
          ]
        };
      }
    }

    // 13. Gün / Hal hatır soruları: "how was your day?", "how are you today?", "how's your day going?"
    if (/how (was|is) your day|how are you|how's it going|how are things|how do you do/i.test(targetText)) {
      if (this.level === 'A2') {
        return {
          isAnswerToQuestion: true,
          questionTopic: 'day',
          answers: [
            "I'm doing great today, thank you! Just practicing English with you.",
            "My day was very good, thank you! I did some work and read a book.",
            "It was a busy day, but I am doing well! How about you?",
            "I had a relaxing day today. I listened to music and rested at home."
          ]
        };
      } else if (this.level === 'B1') {
        return {
          isAnswerToQuestion: true,
          questionTopic: 'day',
          answers: [
            "My day has been quite productive so far, thanks for asking! How is yours going?",
            "It was a bit hectic earlier, but everything turned out fine in the end.",
            "I'm feeling energized today and eager to improve my English fluency."
          ]
        };
      } else {
        return {
          isAnswerToQuestion: true,
          questionTopic: 'day',
          answers: [
            "It has been remarkably fulfilling, balancing work commitments with some leisure time.",
            "Everything has been proceeding smoothly, though I have had a rather demanding schedule."
          ]
        };
      }
    }

    // 14. İsim / Tanışma: "what name", "call you", "who are you"
    if (/name|call you|who are you/i.test(targetText)) {
      return {
        isAnswerToQuestion: true,
        questionTopic: 'name',
        answers: [
          "You can call me friend! It's a real pleasure practicing with you.",
          "My name is Alex! I'm excited to practice English with you every day."
        ]
      };
    }

    // 15. Evet / Hayır Soruları (Do you... / Have you... / Can you... / Are you... / Did you... / Would you...)
    if (/^(do you|did you|have you|can you|are you|will you|would you)\b/i.test(targetText) || /\b(do you|did you|have you|can you|are you)\b/i.test(targetText)) {
      if (this.level === 'A2') {
        return {
          isAnswerToQuestion: true,
          questionTopic: 'yes_no',
          answers: [
            "Yes, I do! I enjoy it very much.",
            "No, not really, but I would like to try it in the future!",
            "Yes, absolutely! It is one of my favorite things.",
            "I haven't done that yet, but it sounds very interesting."
          ]
        };
      } else {
        return {
          isAnswerToQuestion: true,
          questionTopic: 'yes_no',
          answers: [
            "Yes, definitely! It has been an enriching experience for me.",
            "Not currently, although it's something I'm certainly open to exploring.",
            "Indeed, I find that approach very practical and rewarding."
          ]
        };
      }
    }

    // 16. Genel Soru Yanıtı (Herhangi bir diğer ? içeren soru için seviyeye uygun yanıtlar)
    if (this.level === 'A2') {
      return {
        isAnswerToQuestion: true,
        questionTopic: 'general',
        answers: [
          "Yes, I think that is a very good idea!",
          "That sounds really interesting and fun!",
          "I agree with you! What do you think about it?",
          "That is a great question. In my opinion, it is very nice."
        ]
      };
    } else if (this.level === 'B1') {
      return {
        isAnswerToQuestion: true,
        questionTopic: 'general',
        answers: [
          "That's a very thoughtful question. From my perspective, it brings great value.",
          "I believe that striking a sensible balance is the most crucial aspect to consider here.",
          "I haven't considered it from that specific angle before, but it makes complete sense."
        ]
      };
    } else {
      return {
        isAnswerToQuestion: true,
        questionTopic: 'general',
        answers: [
          "I appreciate that insightful inquiry. In my view, the advantages significantly outweigh any potential drawbacks.",
          "It largely hinges on individual priorities, though maintaining consistency is arguably paramount."
        ]
      };
    }
  }
}

// Global scope'a ata
if (typeof window !== 'undefined') {
  window.EmmaChatbotEngine = EmmaChatbotEngine;
}
