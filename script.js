(() => {
  'use strict';

  const APP_VERSION = '1.5.2';
  const STORAGE_KEY = 'flashcards_v1_4';
  const OLD_STORAGE_KEYS = ['flashcards_v2'];
  const UPDATE_KEY = 'flashcards_last_seen_version';

  const STARTER_VOCABULARY = [
    { english: 'Inspiration', arabic: 'إلهام / تشجيع', category: 'عام', status: 'new' },
    { english: 'Achieve', arabic: 'يحقق / ينجز', category: 'أفعال', status: 'new' },
    { english: 'Brilliant', arabic: 'رائع / بارع', category: 'صفات', status: 'new' },
    { english: 'Challenge', arabic: 'تحدي / يتحدى', category: 'عام', status: 'new' },
    { english: 'Determine', arabic: 'يحدد / يصمم', category: 'أفعال', status: 'new' },
    { english: 'Effort', arabic: 'مجهود / سعي', category: 'عام', status: 'new' },
    { english: 'Fluent', arabic: 'فصيح / طليق', category: 'صفات', status: 'new' },
    { english: 'Grateful', arabic: 'ممتن / شاكر', category: 'صفات', status: 'new' },
    { english: 'Habit', arabic: 'عادة يومية', category: 'عام', status: 'new' },
    { english: 'Journey', arabic: 'رحلة / مسار', category: 'سفر', status: 'new' },
    { english: 'Knowledge', arabic: 'معرفة / علم', category: 'تعليم', status: 'new' },
    { english: 'Opportunity', arabic: 'فرصة ثمينة', category: 'عمل', status: 'new' },
    { english: 'Patient', arabic: 'صبور', category: 'صفات', status: 'new' },
    { english: 'Quickly', arabic: 'بسرعة', category: 'ظروف', status: 'new' },
    { english: 'Reliable', arabic: 'موثوق / يعتمد عليه', category: 'صفات', status: 'new' },
    { english: 'Success', arabic: 'نجاح / فوز', category: 'عمل', status: 'new' },
    { english: 'Target', arabic: 'هدف / غاية', category: 'عمل', status: 'new' },
    { english: 'Understand', arabic: 'يفهم / يستوعب', category: 'أفعال', status: 'new' },
    { english: 'Valuable', arabic: 'قيّم / ثمين', category: 'صفات', status: 'new' },
    { english: 'Wisdom', arabic: 'حكمة', category: 'عام', status: 'new' }
  ];

  const state = {
    vocabulary: [],
    currentIndex: 0,
    studyFilter: 'all',
    categoryFilter: 'all',
    filteredVocab: [],
    direction: 'en-ar',
    dark: false,
    currentPage: 'homePage',
    testSubMode: 'writing',
    testLocked: false,
    questionToken: null,
    selectedIds: [],
    reviewList: [],              // قائمة كلمات للمراجعة ("راجع على الكلمات دول")
    assessmentTab: 'comprehensive', // 'comprehensive' | 'final' | 'practice' | 'review'
    assessment: {
      active: false,
      mode: 'comprehensive',
      words: [],
      currentIndex: 0,
      correctCount: 0,
      wrongCount: 0,
      mistakes: [],
      processing: false
    },
    hafazni: {
      active: false,
      sessionWords: [],      // array of session word objects with temp data
      currentIndex: 0,
      totalWords: 0,
      activeLessonId: null,  // معرف الدرس أو التقييم الحالي لو الجلسة اتفتحت من خريطة المسار
      mistakes: [],
      processing: false,
      summary: { correct: 0, wrong: 0, attempts: 0, mastered: [], needsReview: [] }
    },
    hafazniLessons: {
      pathCreated: false,        // true لو المستخدم أنشأ المسار بعد تحديد الخيارات
      pathId: 'p_default',       // معرّف المسار النشط لضمان استقلالية الدروس تمامًا
      lessonSize: 10,            // عدد الكلمات في كل درس (5, 10, 15, 20)
      checkpointFrequency: 20,   // تكرار اختبار التقييم الشامل (15, 20, 30, 40)
      completedLessonIds: [],    // معرّفات الدروس المكتملة الخاصة بالمسار الحالي
      completedCheckpoints: [],  // محطات التقييم المكتملة
      notificationTime: '20:00'  // موعد التذكير المفضل
    },
    wotd: {
      wordId: null,
      dateStr: null
    },
    hafazniTab: 'lessons',       // 'lessons' أو 'custom'
    streak: {
      current: 0,
      best: 0,
      lastStudyDate: null,
      todayCompleted: false
    },
    studyTime: {
      totalSeconds: 0,
      todaySeconds: 0,
      lastDate: null
    },
    notifications: {
      enabled: false,
      time: '20:00',
      lastScheduledDate: null,
      lastActivityTime: Date.now(),
      lastReminderTime: null
    },
    search: ''
  };

  const el = {};
  let recognition = null;
  let saveTimer = null;
  let feedbackBound = false;
  let guessInputResetTimer = null;
  let hafazniSessionTimer = null;
  let hafazniSessionSeconds = 0;

  const $ = id => document.getElementById(id);

  function cacheElements() {
    [
      'fileInput','uploadArea','totalWords','learnedCount','difficultCount','remainingCount',
      'masteryPercent','masteryFill','saveStatus','flashcard','cardFront','cardBack','wordStatus',
      'pronounceBtn','prevBtn','nextBtn','flipBtn','shuffleBtn','focusDifficultBtn','dueReviewBtn',
      'testFlashcard','testCardFront','testWordStatus','testPronounceBtn','guessInput','optionsGrid',
      'voicePanel','recordBtn','voiceState','voiceResult','testFeedback','checkBtn','hintBtn','skipBtn',
      'markDifficultBtn','typeWritingBtn','typeChoiceBtn','typeVoiceBtn','enToArBtn','arToEnBtn',
      'darkToggleBtn','helpSettingsBtn','helpModal','closeHelpModal',
      'updateModal','closeUpdateModal','viewFeaturesBtn','wordList','searchInput','newEnglish','newArabic','newCategory',
      'categoryFilterBar','addWordBtn','importTextBtn','textImportInput','exportBackupBtn','importBackupBtn','backupInput',
      'selectAllBtn','clearSelectionBtn','sendToHafazniBtn','selectedWordsCount','downloadWordsBtn',
      'resetProgressBtn','resetBtn','feedbackForm','feedbackSuccess','feedbackError','hafazniSelectedCount',
      'hafazniRemainingCount','startHafazniBtn','reviewMistakesBtn','hafazniSession','hafazniProgressText',
      'hafazniProgressBar','hafazniQuestion','hafazniSpeakBtn','hafazniInput','hafazniFeedback',
      'hafazniCheckBtn','hafazniSkipBtn','hafazniStopBtn','studyFilterLabel',
      'hafazniSetupCard','hafazniSummary','summaryCorrect','summaryWrong','summaryRate','summaryAttempts',
      'summaryMastered','summaryNeedsReview','summaryMistakes','summaryReviewBtn','summaryCloseBtn',
      'hafazniQuestionTypeLabel','hafazniOptionsGrid','hafazniWordStats','hafazniAttempts','hafazniMastery',
      'hafazniLessonsCard','hafazniLessonsHint','hafazniLessonPath',
      'hafazniTodayWordsCard','hafazniTodayWordsTitle','hafazniTodayWordsList',
      'lessonCompleteNote','completedLessonNumber','nextLessonBtn',
      'hafazniTypeToggle','hafazniTabLessonsBtn','hafazniTabCustomBtn','selectWordsForHafazniBtn',
      'hafazniDailyNotifBar','hafazniDailyNotifMsg','hafazniEnableNotifBtn',
      'hafazniMapProgressBox','hafazniMapProgressTitle','hafazniMapProgressCount','hafazniMapProgressBarFill',
      'hafazniWindingWrapper','hafazniMapSvg','startCurrentLessonDirectBtn',
      'toggleNotificationsBtn','testNotificationBtn','notificationStatusText',
      'notificationStateBadge','notificationStatusBox','notifStatusIndicatorIcon',
      'notifStatusIndicatorTitle','testNotificationFeedback','hafazniModeSettingsHint',
      'hafazniStreakBar','hafazniStreakItem','hafazniStreakCount','hafazniStreakStatus',
      'hafazniStudyTimeItem','hafazniStudyTimeCount',
      'summaryStreakCelebration','summaryStreakText','summarySessionTimeText',
      // عناصر ميزات 1.5.1 الجديدة:
      'wordOfTheDayCard','wotdDate','wotdRefreshBtn','wotdBody','wotdEnglish','wotdArabic',
      'wotdPronounceBtn','wotdTag','wotdStatus','wotdStudyBtn','wotdTestBtn','wotdLearnedBtn','wotdEmpty',
      'hafazniReconfigureBtn','hafazniPathWizardBox','hafazniPathActiveView',
      'wizardLessonSizeOptions','wizardCheckpointOptions','wizardNotifTime',
      'generatePathBtn','cancelWizardBtn','settingsNotifTime','settingsQuickTimeChips',
      // عناصر نافذة تعديل الكلمة والتصنيف والحالة:
      'editWordModal','closeEditWordModal','editWordForm','editWordId','editEnglishInput',
      'editArabicInput','editCategoryInput','quickCategorySuggestions','saveEditWordBtn','cancelEditWordBtn',
      'editStatusPills','editStatusInput',
      // عناصر نافذة مشاركة الكلمة:
      'wotdShareBtn','shareWordModal','closeShareWordModal','shareWordModalTitle','sharePreviewEnglish',
      'sharePreviewArabic','sharePreviewCategory','shareCopyBtn','shareWhatsappBtn',
      'shareTelegramBtn','shareTwitterBtn','shareNativeBtn','shareCopyToast',
      // عناصر تصدير الـ PDF واحتفال الكنفيتي (v1.5.2):
      'exportWordsModal','closeExportWordsModal','exportPdfAllBtn','exportPdfDifficultBtn','exportTxtBtn',
      'confettiCanvas',
      // عناصر التقييم الشامل والنهائي وقائمة المراجعة:
      'tabComprehensiveBtn','tabFinalBtn','tabPracticeBtn','tabReviewListBtn',
      'assessmentActiveSection','assessmentProgressCard','assessmentTypeBadge',
      'assessmentCounterText','exitAssessmentBtn','assessmentProgressBarFill',
      'writingInputWrapper','assessmentControls','assessmentSummarySection',
      'assessmentTrophyIcon','assessmentSummaryTitle','assessmentSummarySubtitle',
      'summaryTotalWords','summaryCorrectWords','summaryWrongWords','summaryPercentVal',
      'assessmentMistakesBox','assessmentMistakesList','retryMistakesBtn',
      'restartAssessmentBtn','goToReviewListBtn','goToHomeFromTestBtn',
      'reviewListSection','startReviewFromListBtn','clearReviewListBtn',
      'reviewWordsContainer','reviewListActionCount','reviewBadgeDesc',
      // عناصر فريق التطوير (Team rustipx):
      'homeAboutUsBtn','settingsAboutUsBtn','aboutUsModal','closeAboutUsModal',
      'copyRepoUrlBtn','repoUrlText','repoCopyToast'
    ].forEach(id => el[id] = $(id));
  }

  function uid() {
    return (crypto && crypto.randomUUID)
      ? crypto.randomUUID()
      : 'w_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
  }

  function now() { return Date.now(); }

  function safeNumber(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function normalizeWord(word) {
    const source = word || {};
    const english = String(source.english ?? '').trim();
    const arabic = String(source.arabic ?? '').trim();
    const rawCategory = source.category || (Array.isArray(source.tags) ? source.tags[0] : (source.tag || 'عام'));
    const category = String(rawCategory || 'عام').trim() || 'عام';
    const tags = Array.isArray(source.tags) && source.tags.length
      ? source.tags.map(t => String(t).trim()).filter(Boolean)
      : [category];

    return {
      id: String(source.id || uid()),
      english: english || '?',
      arabic: arabic || '⚠️',
      category: category,
      tags: tags,
      status: ['new', 'learned', 'difficult'].includes(source.status) ? source.status : 'new',
      interval: Math.max(0, safeNumber(source.interval, 0)),
      lastReview: source.lastReview ? safeNumber(source.lastReview, null) : null,
      due: source.due ? safeNumber(source.due, now()) : now(),
      correctCount: Math.max(0, safeNumber(source.correctCount, 0)),
      wrongCount: Math.max(0, safeNumber(source.wrongCount, 0)),
      selected: Boolean(source.selected),
      createdAt: source.createdAt ? safeNumber(source.createdAt, now()) : now()
    };
  }

  function normalizeVocabulary(list) {
    if (!Array.isArray(list)) return [];
    const seen = new Set();
    const result = [];
    for (const item of list) {
      const word = normalizeWord(item);
      if (seen.has(word.id)) word.id = uid();
      seen.add(word.id);
      result.push(word);
    }
    return result;
  }

  function storageSet(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Storage error:', error);
      return false;
    }
  }

  function storageGet(key) {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Storage read error:', error);
      return null;
    }
  }

  function setSaveStatus(type, text) {
    if (!el.saveStatus) return;
    el.saveStatus.textContent = text;
    el.saveStatus.className = 'save-indicator' + (type ? ' ' + type : '');
  }

  function buildPersistedState() {
    return {
      version: APP_VERSION,
      vocabulary: state.vocabulary,
      currentIndex: state.currentIndex,
      studyFilter: state.studyFilter,
      categoryFilter: state.categoryFilter,
      direction: state.direction,
      dark: state.dark,
      currentPage: state.currentPage,
      testSubMode: state.testSubMode,
      selectedIds: state.selectedIds,
      reviewList: state.reviewList || [],
      assessmentTab: state.assessmentTab || 'comprehensive',
      hafazniLessons: state.hafazniLessons,
      hafazniTab: state.hafazniTab || 'lessons',
      wotd: state.wotd,
      streak: state.streak,
      studyTime: state.studyTime,
      notifications: state.notifications
    };
  }

  function saveState(immediate = false) {
    setSaveStatus('saving', '💾 جارٍ الحفظ...');
    if (saveTimer) clearTimeout(saveTimer);

    const save = () => {
      const data = buildPersistedState();
      const ok = storageSet(STORAGE_KEY, data);
      setSaveStatus(ok ? '' : 'error', ok ? '✅ محفوظ تلقائيًا' : '⚠️ تعذر الحفظ');
    };

    if (immediate) save();
    else saveTimer = setTimeout(save, 120);
  }

  function loadState() {
    let raw = storageGet(STORAGE_KEY);
    if (!raw) {
      for (const key of OLD_STORAGE_KEYS) {
        raw = storageGet(key);
        if (raw) break;
      }
    }
    if (!raw) return;

    try {
      const data = JSON.parse(raw);
      state.vocabulary = normalizeVocabulary(data.vocabulary || []);
      state.currentIndex = Math.max(0, safeNumber(data.currentIndex, 0));
      state.studyFilter = ['all','due','difficult'].includes(data.studyFilter)
        ? data.studyFilter : 'all';
      state.categoryFilter = typeof data.categoryFilter === 'string' ? data.categoryFilter : 'all';
      state.direction = data.direction === 'ar-en' ? 'ar-en' : 'en-ar';
      state.dark = Boolean(data.dark);
      state.currentPage = document.getElementById(data.currentPage) ? data.currentPage : 'homePage';
      state.testSubMode = ['writing','choice','voice'].includes(data.testSubMode)
        ? data.testSubMode : 'writing';
      state.selectedIds = Array.isArray(data.selectedIds) ? data.selectedIds.map(String) : [];
      state.reviewList = Array.isArray(data.reviewList) ? data.reviewList.map(String) : [];
      state.assessmentTab = ['comprehensive','final','practice','review'].includes(data.assessmentTab) ? data.assessmentTab : 'comprehensive';
      const savedLessons = data.hafazniLessons || {};
      const savedPathId = typeof savedLessons.pathId === 'string' && savedLessons.pathId ? savedLessons.pathId : 'p_default';
      const rawCompleted = Array.isArray(savedLessons.completedLessonIds) ? savedLessons.completedLessonIds : [];
      const completedLessonIds = rawCompleted.map(item => {
        const s = String(item);
        if (s.includes('_lesson_') || s.includes('_checkpoint_') || s.startsWith('path_') || s.startsWith('p_')) {
          return s;
        }
        if (s.startsWith('checkpoint-') || s.startsWith('cp-')) {
          const num = s.replace(/[^0-9]/g, '') || '1';
          return `${savedPathId}_checkpoint_${num}`;
        }
        const num = s.replace(/[^0-9]/g, '') || '1';
        return `${savedPathId}_lesson_${num}`;
      });

      state.hafazniLessons = {
        pathCreated: Boolean(savedLessons.pathCreated),
        pathId: savedPathId,
        lessonSize: Number.isFinite(savedLessons.lessonSize) && savedLessons.lessonSize > 0
          ? savedLessons.lessonSize : 10,
        checkpointFrequency: Number.isFinite(savedLessons.checkpointFrequency) && savedLessons.checkpointFrequency > 0
          ? savedLessons.checkpointFrequency : 20,
        completedLessonIds: completedLessonIds,
        completedCheckpoints: Array.isArray(savedLessons.completedCheckpoints)
          ? savedLessons.completedCheckpoints.map(String) : [],
        notificationTime: typeof savedLessons.notificationTime === 'string' && savedLessons.notificationTime
          ? savedLessons.notificationTime : '20:00'
      };
      state.hafazniTab = data.hafazniTab === 'custom' ? 'custom' : 'lessons';
      const savedWotd = data.wotd || {};
      state.wotd = {
        wordId: savedWotd.wordId || null,
        dateStr: savedWotd.dateStr || null
      };
      const savedStreak = data.streak || {};
      state.streak = {
        current: Math.max(0, safeNumber(savedStreak.current, 0)),
        best: Math.max(0, safeNumber(savedStreak.best, 0)),
        lastStudyDate: typeof savedStreak.lastStudyDate === 'string' ? savedStreak.lastStudyDate : null,
        todayCompleted: Boolean(savedStreak.todayCompleted)
      };
      const savedStudyTime = data.studyTime || {};
      state.studyTime = {
        totalSeconds: Math.max(0, safeNumber(savedStudyTime.totalSeconds, 0)),
        todaySeconds: Math.max(0, safeNumber(savedStudyTime.todaySeconds, 0)),
        lastDate: typeof savedStudyTime.lastDate === 'string' ? savedStudyTime.lastDate : null
      };
      const savedNotifs = data.notifications || {};
      state.notifications = {
        enabled: Boolean(savedNotifs.enabled),
        time: typeof savedNotifs.time === 'string' && savedNotifs.time ? savedNotifs.time : state.hafazniLessons.notificationTime || '20:00',
        lastScheduledDate: typeof savedNotifs.lastScheduledDate === 'string' ? savedNotifs.lastScheduledDate : null,
        lastActivityTime: Number.isFinite(savedNotifs.lastActivityTime) ? savedNotifs.lastActivityTime : Date.now(),
        lastReminderTime: Number.isFinite(savedNotifs.lastReminderTime) ? savedNotifs.lastReminderTime : null
      };
      state.vocabulary.forEach(w => {
        w.selected = state.selectedIds.includes(w.id) || w.selected;
      });

      applyTheme();
      applyDirectionUI();
      updateTestModeUI();

      saveState(true);
    } catch (error) {
      console.error('Invalid saved data:', error);
      setSaveStatus('error', '⚠️ بيانات الحفظ تالفة');
    }
  }

  function applyTheme() {
    document.body.classList.toggle('dark', state.dark);
    if (el.darkToggleBtn) {
      el.darkToggleBtn.textContent = state.dark ? '☀️ الوضع الفاتح' : '🌙 الوضع الداكن';
    }
  }

  function applyDirectionUI() {
    el.enToArBtn?.classList.toggle('active', state.direction === 'en-ar');
    el.arToEnBtn?.classList.toggle('active', state.direction === 'ar-en');
  }

  function createQuestionToken(word) {
    return word.id + '::' + state.currentIndex + '::' + Date.now().toString(36);
  }

  function lockTest() {
    state.testLocked = true;
  }

  function unlockTest() {
    state.testLocked = false;
  }

  function advanceQuestion() {
    unlockTest();
    moveStudy(1);
  }

  function navigateTo(pageId, fromUser = true) {
    const page = document.getElementById(pageId);
    if (!page) return;
    state.currentPage = pageId;

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    page.classList.add('active');

    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.page === pageId);
    });

    if (pageId === 'homePage') {
      renderWordOfTheDay();
      updateStats();
    }
    if (pageId === 'wordsPage') renderWordList(state.search);
    if (pageId === 'hafazniPage') updateHafazniOverview();
    if (pageId === 'testPage') {
      initAssessmentTab(state.assessmentTab || 'comprehensive');
    }
    if (pageId === 'studyPage') updateStudyView();

    if (fromUser) saveState();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function getStudyList() {
    if (state.studyFilter === 'due') {
      return state.vocabulary.filter(w => !w.due || w.due <= now());
    }
    if (state.studyFilter === 'difficult') {
      return state.vocabulary.filter(w => w.status === 'difficult');
    }
    return state.vocabulary;
  }

  function getCurrentStudyWord() {
    const list = getStudyList();
    if (!list.length) return null;
    if (state.currentIndex >= list.length) state.currentIndex = Math.max(0, list.length - 1);
    return list[state.currentIndex];
  }

  function getSourceWord(word) {
    return state.direction === 'en-ar' ? word.english : word.arabic;
  }

  function getTargetWord(word) {
    return state.direction === 'en-ar' ? word.arabic : word.english;
  }

  function getStatusLabel(status) {
    if (status === 'learned') return '✅ محفوظة';
    if (status === 'difficult') return '🔴 صعبة';
    return '📝 جديدة';
  }

  function getWordOfTheDay(forceNew = false) {
    if (!state.vocabulary || !state.vocabulary.length) {
      state.vocabulary = normalizeVocabulary(STARTER_VOCABULARY);
      saveState(true);
    }
    const today = getLocalDateStr();

    if (!forceNew && state.wotd && state.wotd.wordId && state.wotd.dateStr === today) {
      const existing = state.vocabulary.find(w => w.id === state.wotd.wordId);
      if (existing) return existing;
    }

    let selected = null;
    if (!forceNew) {
      let hash = 0;
      for (let i = 0; i < today.length; i++) {
        hash = ((hash << 5) - hash) + today.charCodeAt(i);
        hash |= 0;
      }
      const idx = Math.abs(hash) % state.vocabulary.length;
      selected = state.vocabulary[idx];
    } else {
      const currentId = state.wotd ? state.wotd.wordId : null;
      const candidates = state.vocabulary.filter(w => w.id !== currentId);
      const pool = candidates.length ? candidates : state.vocabulary;
      selected = pool[Math.floor(Math.random() * pool.length)];
    }

    if (selected) {
      if (!state.wotd) state.wotd = {};
      state.wotd.wordId = selected.id;
      state.wotd.dateStr = today;
      saveState();
    }
    return selected;
  }

  function renderWordOfTheDay(forceNew = false) {
    if (!el.wordOfTheDayCard) return;
    const word = getWordOfTheDay(forceNew);

    if (!word) {
      if (el.wotdBody) el.wotdBody.style.display = 'none';
      if (el.wotdEmpty) el.wotdEmpty.style.display = 'block';
      return;
    }

    if (el.wotdBody) el.wotdBody.style.display = 'block';
    if (el.wotdEmpty) el.wotdEmpty.style.display = 'none';

    if (el.wotdDate) {
      const d = new Date();
      try {
        el.wotdDate.textContent = d.toLocaleDateString('ar-SA', { weekday: 'short', month: 'short', day: 'numeric' });
      } catch (e) {
        el.wotdDate.textContent = getLocalDateStr();
      }
    }

    if (el.wotdEnglish) el.wotdEnglish.textContent = word.english;
    if (el.wotdArabic) el.wotdArabic.textContent = word.arabic;
    if (el.wotdTag) el.wotdTag.textContent = `🏷️ ${word.category || 'عام'}`;

    if (el.wotdStatus) {
      el.wotdStatus.textContent = getStatusLabel(word.status);
      el.wotdStatus.className = `wotd-status-pill ${word.status || 'new'}`;
    }

    if (el.wotdLearnedBtn) {
      el.wotdLearnedBtn.textContent = word.status === 'learned' ? '✅ تم حفظها' : '✅ حفظتها اليوم';
    }
  }

  // ==================== نظام مشاركة الكلمات كنص منسق (Share Word System) ====================
  let activeShareWord = null;

  function getFormattedShareText(word) {
    if (!word) return '';
    const cat = (word.category || 'عام').trim() || 'عام';
    return `🌟 كلمة اليوم الإنجليزية:
🇬🇧 الكلمة: ${word.english}
🇸🇦 الترجمة: ${word.arabic}
🏷️ التصنيف: ${cat}

📚 تعلم واحفظ المفردات الإنجليزية بذكاء وسرعة!`;
  }

  function openShareWordModal(word) {
    if (!word) word = getWordOfTheDay();
    if (!word) {
      alert('لا توجد كلمة محددة للمشاركة.');
      return;
    }
    activeShareWord = word;

    if (el.sharePreviewEnglish) el.sharePreviewEnglish.textContent = word.english;
    if (el.sharePreviewArabic) el.sharePreviewArabic.textContent = word.arabic;
    if (el.sharePreviewCategory) el.sharePreviewCategory.textContent = `🏷️ ${word.category || 'عام'}`;
    if (el.shareCopyToast) el.shareCopyToast.style.display = 'none';

    if (el.shareNativeBtn) {
      el.shareNativeBtn.style.display = (navigator && navigator.share) ? 'inline-flex' : 'none';
    }

    if (el.shareWordModal) {
      el.shareWordModal.style.display = 'flex';
    }
  }

  function closeShareWordModal() {
    if (el.shareWordModal) {
      el.shareWordModal.style.display = 'none';
    }
    activeShareWord = null;
  }

  function copyFormattedWord() {
    if (!activeShareWord) return;
    const text = getFormattedShareText(activeShareWord);

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showCopyToast();
      }).catch(() => {
        fallbackCopyText(text);
      });
    } else {
      fallbackCopyText(text);
    }
  }

  function fallbackCopyText(text) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showCopyToast();
    } catch (e) {
      alert('تم تجهيز النص:\n\n' + text);
    }
  }

  function showCopyToast() {
    if (el.shareCopyToast) {
      el.shareCopyToast.style.display = 'block';
      setTimeout(() => {
        if (el.shareCopyToast) el.shareCopyToast.style.display = 'none';
      }, 2500);
    }
  }

  function shareToWhatsapp() {
    if (!activeShareWord) return;
    const text = getFormattedShareText(activeShareWord);
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function shareToTelegram() {
    if (!activeShareWord) return;
    const text = getFormattedShareText(activeShareWord);
    const url = `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function shareToTwitter() {
    if (!activeShareWord) return;
    const text = getFormattedShareText(activeShareWord);
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  async function shareNative() {
    if (!activeShareWord || !navigator.share) return;
    const text = getFormattedShareText(activeShareWord);
    try {
      await navigator.share({
        title: `كلمة اليوم: ${activeShareWord.english}`,
        text: text
      });
    } catch (e) {
      // User cancelled
    }
  }

  function updateAllViews() {
    updateStats();
    renderWordOfTheDay();
    updateStudyView();
    updateTestView();
    if (typeof renderWordList === 'function') renderWordList(state.search);
    if (typeof updateHafazniOverview === 'function') updateHafazniOverview();
    if (typeof updateStreakAndStudyUI === 'function') updateStreakAndStudyUI();
  }

  function updateStats() {
    const total = state.vocabulary.length;
    const learned = state.vocabulary.filter(w => w.status === 'learned').length;
    const difficult = state.vocabulary.filter(w => w.status === 'difficult').length;
    const remaining = Math.max(0, total - learned - difficult);

    el.totalWords.textContent = total;
    el.learnedCount.textContent = learned;
    el.difficultCount.textContent = difficult;
    el.remainingCount.textContent = remaining;

    const mastery = total ? Math.round((learned / total) * 100) : 0;
    el.masteryPercent.textContent = mastery + '%';
    el.masteryFill.style.width = mastery + '%';
  }

  function resetStudyFlip() {
    el.flashcard.classList.remove('flipped');
  }

  function updateStudyFilterLabel() {
    const labels = { all: '📚 كل الكلمات', due: '📅 الكلمات المستحقة', difficult: '🔴 الكلمات الصعبة' };
    el.studyFilterLabel.textContent = labels[state.studyFilter] || labels.all;
    el.dueReviewBtn.textContent = state.studyFilter === 'due' ? '📚 الكل' : '📅 مستحق';
  }

  function updateStudyView() {
    updateStudyFilterLabel();
    const word = getCurrentStudyWord();

    if (!word) {
      el.cardFront.textContent = '📂 لا توجد كلمات';
      el.cardBack.textContent = 'أضف أو استورد كلمات أولاً';
      el.wordStatus.style.display = 'none';
      el.pronounceBtn.style.display = 'none';
      resetStudyFlip();
      return;
    }

    el.cardFront.textContent = getSourceWord(word);
    el.cardBack.textContent = getTargetWord(word);
    el.wordStatus.textContent = getStatusLabel(word.status);
    el.wordStatus.style.display = 'block';
    el.pronounceBtn.style.display = word.english && word.english !== '?' ? 'flex' : 'none';
    resetStudyFlip();
  }

  function moveStudy(delta) {
    if (state.testLocked) return;
    const list = getStudyList();
    if (!list.length) return;
    state.currentIndex = (state.currentIndex + delta + list.length) % list.length;
    resetStudyFlip();

    if (state.currentPage === 'testPage') {
      updateTestView();
    } else {
      updateStudyView();
    }

    saveState();
  }

  function flipStudyCard() {
    if (!getCurrentStudyWord()) return;
    el.flashcard.classList.toggle('flipped');
  }

  function detectTextLanguage(text) {
    return /[\u0600-\u06FF]/.test(String(text || '')) ? 'ar' : 'en';
  }

  function getTextLanguageForWord(word) {
    return detectTextLanguage(getSourceWord(word)) === 'ar' ? 'ar-SA' : 'en-US';
  }

  function getVoiceRecognitionLanguage(word) {
    return detectTextLanguage(getTargetWord(word)) === 'ar' ? 'ar-SA' : 'en-US';
  }

  function getAnswerLanguageName(word) {
    return getVoiceRecognitionLanguage(word) === 'ar-SA' ? 'العربية' : 'English';
  }

  function speak(text) {
    if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
      console.warn('المتصفح لا يدعم النطق الصوتي.');
      return;
    }

    const value = String(text || '').trim();
    if (!value || !/[A-Za-z]/.test(value)) {
      console.warn('English pronunciation skipped: no English text.', value);
      return;
    }

    const synth = window.speechSynthesis;

    const speakWithEnglishVoice = () => {
      try {
        synth.cancel();
        const voices = synth.getVoices ? synth.getVoices() : [];
        const englishVoice = voices.find(v =>
          /^en(?:-|_)/i.test(String(v.lang || ''))
        );

        if (!englishVoice) {
          console.warn('No English TTS voice is available yet.');
          return;
        }

        const utterance = new SpeechSynthesisUtterance(value);
        utterance.lang = String(englishVoice.lang || 'en-US');
        utterance.voice = englishVoice;
        utterance.rate = 0.86;
        utterance.pitch = 1;
        utterance.volume = 1;

        utterance.onerror = event => {
          console.warn('English speech synthesis error:', event.error);
        };

        synth.speak(utterance);
      } catch (error) {
        console.error('Speech synthesis error:', error);
      }
    };

    const voices = synth.getVoices ? synth.getVoices() : [];

    if (voices.some(v => /^en(?:-|_)/i.test(String(v.lang || '')))) {
      speakWithEnglishVoice();
      return;
    }

    let handled = false;
    const onVoicesChanged = () => {
      if (handled) return;
      handled = true;
      synth.removeEventListener?.('voiceschanged', onVoicesChanged);
      speakWithEnglishVoice();
    };

    synth.addEventListener?.('voiceschanged', onVoicesChanged);

    window.setTimeout(() => {
      if (handled) return;
      handled = true;
      synth.removeEventListener?.('voiceschanged', onVoicesChanged);
      speakWithEnglishVoice();
    }, 350);
  }

  function normalizeString(str) {
    return String(str ?? '')
      .normalize('NFKC')
      .toLowerCase()
      .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
      .replace(/[أإآٱ]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ؤ/g, 'و')
      .replace(/ئ/g, 'ي')
      .replace(/[ة]/g, 'ة')
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .replace(/[؟?.,!،؛:;"'`’“”()[\]{}]/g, '')
      .replace(/[-_/\\|]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function levenshtein(a, b) {
    const m = a.length;
    const n = b.length;
    if (!m) return n;
    if (!n) return m;

    let prev = new Array(n + 1);
    let cur = new Array(n + 1);

    for (let j = 0; j <= n; j++) prev[j] = j;

    for (let i = 1; i <= m; i++) {
      cur[0] = i;
      for (let j = 1; j <= n; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        cur[j] = Math.min(
          cur[j - 1] + 1,
          prev[j] + 1,
          prev[j - 1] + cost
        );
      }
      [prev, cur] = [cur, prev];
    }

    return prev[n];
  }

  function tokenSimilarity(a, b) {
    const aTokens = a.split(' ').filter(Boolean);
    const bTokens = b.split(' ').filter(Boolean);
    if (!aTokens.length || !bTokens.length) return 0;

    const used = new Set();
    let matched = 0;

    for (const tokenA of aTokens) {
      let best = 0;
      let bestIndex = -1;
      bTokens.forEach((tokenB, index) => {
        if (used.has(index)) return;
        const distance = levenshtein(tokenA, tokenB);
        const similarity = 1 - distance / Math.max(tokenA.length, tokenB.length, 1);
        if (similarity > best) {
          best = similarity;
          bestIndex = index;
        }
      });

      if (bestIndex >= 0 && best >= 0.72) {
        matched += best;
        used.add(bestIndex);
      }
    }

    return matched / Math.max(aTokens.length, bTokens.length);
  }

  function speechMatchScore(spoken, target) {
    const a = normalizeString(spoken);
    const b = normalizeString(target);

    if (!a || !b) {
      return { score: 0, exact: false, distance: Infinity };
    }

    if (a === b) {
      return { score: 1, exact: true, distance: 0 };
    }

    const distance = levenshtein(a, b);
    const charScore = 1 - distance / Math.max(a.length, b.length, 1);
    const tokensScore = tokenSimilarity(a, b);

    return {
      score: Math.max(charScore, tokensScore),
      exact: false,
      distance
    };
  }

  function estimateMistakes(spoken, target) {
    const match = speechMatchScore(spoken, target);

    if (match.exact) {
      return { verdict: 'correct', exact: true, count: 0, score: 1 };
    }

    const targetLength = normalizeString(target).length;
    const strongThreshold = targetLength <= 4 ? 0.92 : targetLength <= 8 ? 0.88 : 0.84;
    const probableThreshold = targetLength <= 4 ? 0.78 : 0.74;

    if (match.score >= strongThreshold) {
      return { verdict: 'probable', exact: false, count: 1, score: match.score };
    }

    if (match.score >= probableThreshold) {
      return { verdict: 'uncertain', exact: false, count: match.distance <= 2 ? 1 : 2, score: match.score };
    }

    let count = 3;
    if (match.distance === 1 || match.score >= 0.60) count = 1;
    else if (match.distance === 2 || match.score >= 0.45) count = 2;

    return { verdict: 'wrong', exact: false, count, score: match.score };
  }

  function voiceFeedback(mistakes, target, language) {
    const arabic = language.startsWith('ar');
    if (arabic) {
      if (mistakes === 1) return '⚠️ يبدو أن هناك خطأ واحدًا في النطق أو التعرف. حاول مرة أخرى.';
      if (mistakes === 2) return '⚠️ يبدو أن هناك خطأين تقريبًا. النطق لم يطابق الإجابة بالكامل.';
      return '❌ النطق بعيد عن الإجابة المطلوبة. حاول مرة أخرى بوضوح.';
    }

    if (mistakes === 1) return '⚠️ It looks like there is one pronunciation/recognition mistake. Try again.';
    if (mistakes === 2) return '⚠️ It looks like there are about two mistakes. The answer did not fully match.';
    return '❌ The recognized speech is too different from the expected answer. Try again clearly.';
  }

  function getSpeechRecognition() {
    return window.SpeechRecognition || window.webkitSpeechRecognition || null;
  }

  function stopRecognition() {
    if (!recognition) return;
    try { recognition.stop(); } catch (_) {}
    recognition = null;
    el.recordBtn?.classList.remove('recording');
    if (el.recordBtn) el.recordBtn.textContent = '🎙️ ابدأ التسجيل';
  }

  function startVoiceTest() {
    if (state.testLocked) return;
    const SpeechRecognition = getSpeechRecognition();
    const word = getCurrentStudyWord();

    if (!word) {
      alert('لا توجد كلمات للاختبار.');
      return;
    }

    if (!SpeechRecognition) {
      el.voiceState.textContent = '❌ المتصفح لا يدعم التعرف على الكلام. استخدم Chrome أو Edge.';
      return;
    }

    stopRecognition();

    recognition = new SpeechRecognition();
    const language = getVoiceRecognitionLanguage(word);

    recognition.lang = language;
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.maxAlternatives = 5;

    const currentToken = state.questionToken;

    el.voiceState.textContent = `🎙️ أتكلم الآن للإجابة بـ ${language === 'ar-SA' ? 'العربية' : 'English'}...`;
    el.recordBtn.textContent = '⏹️ أوقف التسجيل';
    el.recordBtn.classList.add('recording');

    recognition.onresult = event => {
      if (state.questionToken !== currentToken) {
        console.warn('Voice result ignored: question changed.');
        return;
      }

      const alternatives = [];

      for (const result of Array.from(event.results || [])) {
        for (const alt of Array.from(result || [])) {
          const transcript = String(alt.transcript || '').trim();
          if (!transcript) continue;
          alternatives.push({
            transcript,
            confidence: Number.isFinite(Number(alt.confidence)) ? Number(alt.confidence) : 0
          });
        }
      }

      const target = getTargetWord(word);

      if (!alternatives.length) {
        el.voiceResult.textContent = 'سمعت: —';
        el.voiceState.textContent = '⚠️ لم يصلني نص واضح. أعد التسجيل.';
        return;
      }

      const scored = alternatives
        .map(item => {
          const match = estimateMistakes(item.transcript, target);
          return {
            ...item,
            match,
            combined: match.score * 0.85 + item.confidence * 0.15
          };
        })
        .sort((a, b) => b.combined - a.combined);

      const best = scored[0];
      el.voiceResult.textContent = `سمعت: ${best.transcript}`;

      if (best.match.verdict === 'correct') {
        el.testFeedback.textContent = '✅ إجابة صحيحة تمامًا!';
        el.testFeedback.className = 'test-feedback correct';
        processTestAnswer(true);
        return;
      }

      if (best.match.verdict === 'probable' || best.match.verdict === 'uncertain') {
        el.testFeedback.textContent =
          `${voiceFeedback(best.match.count, target, language)} لم أسجلها كخطأ حتى لا أظلمك. الصحيح: ${target}`;
        el.testFeedback.className = 'test-feedback';
        el.voiceState.textContent = '🔁 النتيجة غير مؤكدة — أعد التسجيل.';
        return;
      }

      el.testFeedback.textContent =
        `${voiceFeedback(best.match.count, target, language)} الصحيح: ${target}`;
      el.testFeedback.className = 'test-feedback wrong';
      processTestAnswer(false);
    };

    recognition.onerror = event => {
      const messages = {
        'not-allowed': '❌ تم منع الوصول إلى الميكروفون. اسمح للمتصفح باستخدام الميكروفون.',
        'service-not-allowed': '❌ خدمة التعرف على الكلام غير متاحة في هذا السياق.',
        'audio-capture': '❌ لم يتم العثور على ميكروفون متاح.',
        'no-speech': '⚠️ لم يتم التقاط كلام. حاول التحدث بوضوح.',
        'network': '❌ حدثت مشكلة اتصال بخدمة التعرف على الكلام.',
        'aborted': '⚠️ تم إيقاف التسجيل.'
      };

      el.voiceState.textContent = messages[event.error] || `❌ تعذر التسجيل: ${event.error}`;
      stopRecognition();
    };

    recognition.onend = () => {
      const currentMessage = el.voiceState.textContent || '';
      stopRecognition();

      if (!currentMessage.startsWith('❌') &&
          !currentMessage.startsWith('⚠️') &&
          !currentMessage.includes('غير مؤكدة')) {
        el.voiceState.textContent = '✅ انتهى التسجيل.';
      }
    };

    try {
      recognition.start();
    } catch (error) {
      console.error(error);
      stopRecognition();
      el.voiceState.textContent = '❌ تعذر بدء التسجيل. اضغط الزر مرة أخرى.';
    }
  }

  function processTestAnswer(isCorrect) {
    if (state.testLocked) return;

    const word = getCurrentStudyWord();
    if (!word) return;

    lockTest();

    if (isCorrect) {
      word.correctCount += 1;
      word.status = 'learned';
      word.interval = word.interval > 0 ? Math.min(word.interval * 2, 720) : 1;
    } else {
      word.wrongCount += 1;
      word.status = 'difficult';
      word.interval = 0;
    }

    word.lastReview = now();
    word.due = now() + word.interval * 3600000;
    saveState(true);
    updateStats();

    window.setTimeout(() => {
      if (state.currentPage === 'testPage') {
        advanceQuestion();
      } else {
        unlockTest();
      }
    }, 900);
  }

  function updateTestModeUI() {
    const modeButtons = [
      ['writing', el.typeWritingBtn],
      ['choice', el.typeChoiceBtn],
      ['voice', el.typeVoiceBtn]
    ];
    modeButtons.forEach(([mode, btn]) => btn?.classList.toggle('active', state.testSubMode === mode));

    if (el.writingInputWrapper) el.writingInputWrapper.style.display = state.testSubMode === 'writing' ? 'flex' : 'none';
    el.guessInput.style.display = state.testSubMode === 'writing' ? '' : 'none';
    el.optionsGrid.style.display = state.testSubMode === 'choice' ? 'grid' : 'none';
    el.voicePanel.style.display = state.testSubMode === 'voice' ? 'block' : 'none';
    el.hintBtn.style.display = state.testSubMode === 'writing' ? '' : 'none';
    el.checkBtn.style.display = state.testSubMode === 'voice' ? 'none' : '';
  }

  function updateTestView() {
    const word = getCurrentStudyWord();

    if (word) {
      state.questionToken = createQuestionToken(word);
      unlockTest();
    }

    if (!word) {
      el.testCardFront.textContent = '?';
      el.testWordStatus.style.display = 'none';
      el.testPronounceBtn.style.display = 'none';
      el.optionsGrid.innerHTML = '';
      el.voiceResult.textContent = '';
      el.voiceState.textContent = 'لا توجد كلمات للاختبار.';
      return;
    }

    el.testCardFront.textContent = getSourceWord(word);
    el.testWordStatus.textContent = getStatusLabel(word.status);
    el.testWordStatus.style.display = 'block';
    el.testPronounceBtn.style.display = word.english && word.english !== '?' ? 'flex' : 'none';

    if (state.testSubMode === 'writing') {
      if (guessInputResetTimer) { clearTimeout(guessInputResetTimer); guessInputResetTimer = null; }
      el.guessInput.value = '';
      el.guessInput.className = '';
    }

    if (state.testSubMode === 'choice') generateOptions(word);
    if (state.testSubMode === 'voice') {
      el.voiceResult.textContent = '';
      el.voiceState.textContent = `🎙️ سأستمع للإجابة بـ ${getAnswerLanguageName(word)} لأن هذا هو لسان الإجابة المطلوبة.`;
    }

    if (state.currentPage === 'testPage' && state.testSubMode === 'writing') {
      window.setTimeout(() => el.guessInput.focus(), 0);
    }
  }

  function resetTestUI() {
    stopRecognition();
    el.guessInput.value = '';
    el.guessInput.className = '';
    el.testFeedback.textContent = '';
    el.testFeedback.className = 'test-feedback';
    el.optionsGrid.innerHTML = '';
  }

  // ==================== منطق التقييم الشامل والنهائي وقائمة المراجعة ====================
  
  function shuffleArrayCopy(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function updateReviewBadges() {
    const count = (state.reviewList && state.reviewList.length) || 0;
    if (el.reviewBadgeDesc) {
      el.reviewBadgeDesc.textContent = count > 0 ? `${count} كلمة للمراجعة` : 'فارغة حالياً';
    }
    if (el.reviewListActionCount) {
      el.reviewListActionCount.textContent = `${count}`;
    }
  }

  function switchAssessmentTab(tabName) {
    state.assessmentTab = tabName;
    saveState();
    initAssessmentTab(tabName);
  }

  function initAssessmentTab(tabName) {
    const tabs = [
      ['comprehensive', el.tabComprehensiveBtn],
      ['final', el.tabFinalBtn],
      ['practice', el.tabPracticeBtn],
      ['review', el.tabReviewListBtn]
    ];
    tabs.forEach(([name, btn]) => btn?.classList.toggle('active', tabName === name));
    updateReviewBadges();

    if (tabName === 'comprehensive') {
      startComprehensiveAssessment();
    } else if (tabName === 'final') {
      startFinalAssessment();
    } else if (tabName === 'practice') {
      startPracticeMode();
    } else if (tabName === 'review') {
      renderReviewListView();
    }
  }

  function startPracticeMode() {
    state.assessment.active = false;
    if (el.assessmentActiveSection) el.assessmentActiveSection.style.display = 'block';
    if (el.assessmentSummarySection) el.assessmentSummarySection.style.display = 'none';
    if (el.reviewListSection) el.reviewListSection.style.display = 'none';

    if (el.assessmentProgressCard) el.assessmentProgressCard.style.display = 'flex';
    if (el.assessmentTypeBadge) el.assessmentTypeBadge.textContent = '🎯 تمرين عام';
    if (el.assessmentCounterText) el.assessmentCounterText.textContent = `${state.currentIndex + 1} / ${state.vocabulary.length || 1}`;
    if (el.assessmentProgressBarFill) {
      const pct = ((state.currentIndex + 1) / Math.max(1, state.vocabulary.length)) * 100;
      el.assessmentProgressBarFill.style.width = `${pct}%`;
    }

    updateTestModeUI();
    resetTestUI();
    updateTestView();
  }

  function startComprehensiveAssessment() {
    // التقييم الشامل: اختبار كتابة على الكلمات المحفوظة فقط
    const learnedWords = state.vocabulary.filter(w => w.status === 'learned');

    if (!learnedWords.length) {
      if (el.assessmentActiveSection) el.assessmentActiveSection.style.display = 'none';
      if (el.assessmentSummarySection) el.assessmentSummarySection.style.display = 'none';
      if (el.reviewListSection) el.reviewListSection.style.display = 'none';
      
      alert('لم تقم بتحديد أو إنهاء أي كلمات كمحفوظة بعد.\nادرس بعض الكلمات أو حددها كمحفوظة لتفعيل "التقييم الشامل"، أو خُض "التقييم النهائي" لاختبار كافة كلماتك!');
      switchAssessmentTab('final');
      return;
    }

    state.assessment = {
      active: true,
      mode: 'comprehensive',
      words: shuffleArrayCopy(learnedWords),
      currentIndex: 0,
      correctCount: 0,
      wrongCount: 0,
      mistakes: [],
      processing: false
    };

    if (el.assessmentActiveSection) el.assessmentActiveSection.style.display = 'block';
    if (el.assessmentSummarySection) el.assessmentSummarySection.style.display = 'none';
    if (el.reviewListSection) el.reviewListSection.style.display = 'none';

    setupAssessmentUIForWriting();
    renderAssessmentQuestion();
  }

  function startFinalAssessment() {
    // التقييم النهائي: اختبار كتابة شامل على كل كلمات التطبيق
    const allWords = state.vocabulary.slice();

    if (!allWords.length) {
      alert('لا توجد كلمات مضافة في التطبيق للاختبار.');
      return;
    }

    state.assessment = {
      active: true,
      mode: 'final',
      words: shuffleArrayCopy(allWords),
      currentIndex: 0,
      correctCount: 0,
      wrongCount: 0,
      mistakes: [],
      processing: false
    };

    if (el.assessmentActiveSection) el.assessmentActiveSection.style.display = 'block';
    if (el.assessmentSummarySection) el.assessmentSummarySection.style.display = 'none';
    if (el.reviewListSection) el.reviewListSection.style.display = 'none';

    setupAssessmentUIForWriting();
    renderAssessmentQuestion();
  }

  function startReviewListAssessment(customWords = null) {
    const wordsToTest = customWords || state.vocabulary.filter(w => state.reviewList.includes(w.id));

    if (!wordsToTest.length) {
      alert('لا توجد كلمات في قائمة المراجعة حالياً.');
      return;
    }

    state.assessment = {
      active: true,
      mode: 'review',
      words: shuffleArrayCopy(wordsToTest),
      currentIndex: 0,
      correctCount: 0,
      wrongCount: 0,
      mistakes: [],
      processing: false
    };

    if (el.assessmentActiveSection) el.assessmentActiveSection.style.display = 'block';
    if (el.assessmentSummarySection) el.assessmentSummarySection.style.display = 'none';
    if (el.reviewListSection) el.reviewListSection.style.display = 'none';

    setupAssessmentUIForWriting();
    renderAssessmentQuestion();
  }

  function startMistakesReviewAssessment() {
    if (!state.assessment.mistakes || !state.assessment.mistakes.length) return;
    const mistakeIds = state.assessment.mistakes.map(m => m.id);
    const words = state.vocabulary.filter(w => mistakeIds.includes(w.id));
    startReviewListAssessment(words);
  }

  function setupAssessmentUIForWriting() {
    if (el.assessmentProgressCard) el.assessmentProgressCard.style.display = 'flex';
    if (el.writingInputWrapper) el.writingInputWrapper.style.display = 'flex';
    if (el.guessInput) el.guessInput.style.display = 'block';
    if (el.optionsGrid) el.optionsGrid.style.display = 'none';
    if (el.voicePanel) el.voicePanel.style.display = 'none';
    if (el.hintBtn) el.hintBtn.style.display = 'inline-flex';
    if (el.checkBtn) el.checkBtn.style.display = 'inline-flex';
  }

  function renderAssessmentQuestion() {
    if (!state.assessment.active) return;

    if (state.assessment.currentIndex >= state.assessment.words.length) {
      finishAssessment();
      return;
    }

    const word = state.assessment.words[state.assessment.currentIndex];
    state.assessment.processing = false;

    const modeTitles = {
      comprehensive: `🏆 تقييم شامل (${state.assessment.words.length} كلمة محفوظة)`,
      final: `🎓 التقييم النهائي (${state.assessment.words.length} كلمة)`,
      review: `📋 مراجعة وتثبيت الأخطاء (${state.assessment.words.length} كلمة)`
    };

    if (el.assessmentTypeBadge) {
      el.assessmentTypeBadge.textContent = modeTitles[state.assessment.mode] || 'اختبار تقييم';
    }

    if (el.assessmentCounterText) {
      el.assessmentCounterText.textContent = `السؤال ${state.assessment.currentIndex + 1} من ${state.assessment.words.length}`;
    }

    if (el.assessmentProgressBarFill) {
      const pct = (state.assessment.currentIndex / state.assessment.words.length) * 100;
      el.assessmentProgressBarFill.style.width = `${pct}%`;
    }

    if (el.testCardFront) el.testCardFront.textContent = getSourceWord(word);
    if (el.testWordStatus) {
      el.testWordStatus.textContent = getStatusLabel(word.status);
      el.testWordStatus.style.display = 'block';
    }
    if (el.testPronounceBtn) {
      el.testPronounceBtn.style.display = word.english && word.english !== '?' ? 'flex' : 'none';
    }

    if (el.guessInput) {
      el.guessInput.value = '';
      el.guessInput.className = '';
      setTimeout(() => el.guessInput.focus(), 50);
    }
    if (el.testFeedback) {
      el.testFeedback.textContent = '';
      el.testFeedback.className = 'test-feedback';
    }
  }

  function checkAssessmentWriting() {
    if (!state.assessment.active || state.assessment.processing) return;

    const word = state.assessment.words[state.assessment.currentIndex];
    if (!word) return;

    const input = normalizeString(el.guessInput.value);
    if (!input) {
      el.testFeedback.textContent = '⚠️ اكتب الكلمة أولًا قبل التأكيد.';
      el.testFeedback.className = 'test-feedback';
      return;
    }

    state.assessment.processing = true;
    const targetWord = getTargetWord(word);
    const correct = normalizeString(targetWord);
    const isCorrect = input === correct;

    if (isCorrect) {
      state.assessment.correctCount += 1;
      word.correctCount = (word.correctCount || 0) + 1;
      word.status = 'learned';
      word.interval = Math.max(1, (word.interval || 0) * 2);
      word.lastReview = now();
      word.due = now() + word.interval * 3600000;

      if (state.reviewList.includes(word.id)) {
        state.reviewList = state.reviewList.filter(id => id !== word.id);
      }

      el.guessInput.className = 'correct';
      el.testFeedback.textContent = '✅ إجابة صحيحة! أحسنت!';
      el.testFeedback.className = 'test-feedback correct';

      saveState(true);
      updateStats();
      updateReviewBadges();

      setTimeout(() => {
        state.assessment.currentIndex += 1;
        renderAssessmentQuestion();
      }, 450);
    } else {
      state.assessment.wrongCount += 1;
      word.wrongCount = (word.wrongCount || 0) + 1;
      word.status = 'difficult';
      word.interval = 0;
      word.lastReview = now();
      word.due = now();

      if (!state.reviewList.includes(word.id)) {
        state.reviewList.push(word.id);
      }

      state.assessment.mistakes.push({
        id: word.id,
        english: word.english,
        arabic: word.arabic,
        target: targetWord,
        userTyped: input
      });

      el.guessInput.className = 'wrong';
      el.testFeedback.textContent = `❌ الصحيح: ${targetWord} (تمت الإضافة لقائمة: راجع على الكلمات دول)`;
      el.testFeedback.className = 'test-feedback wrong';

      saveState(true);
      updateStats();
      updateReviewBadges();

      setTimeout(() => {
        state.assessment.currentIndex += 1;
        renderAssessmentQuestion();
      }, 1250);
    }
  }

  function skipAssessmentQuestion() {
    if (!state.assessment.active || state.assessment.processing) return;
    const word = state.assessment.words[state.assessment.currentIndex];
    if (!word) return;

    state.assessment.processing = true;
    state.assessment.wrongCount += 1;
    word.wrongCount = (word.wrongCount || 0) + 1;
    word.status = 'difficult';
    word.interval = 0;

    if (!state.reviewList.includes(word.id)) {
      state.reviewList.push(word.id);
    }

    state.assessment.mistakes.push({
      id: word.id,
      english: word.english,
      arabic: word.arabic,
      target: getTargetWord(word),
      userTyped: '(تم التخطي)'
    });

    el.testFeedback.textContent = `⏭️ تم التخطي. الصحيح: ${getTargetWord(word)} (أضيفت للمراجعة)`;
    el.testFeedback.className = 'test-feedback wrong';

    saveState(true);
    updateStats();
    updateReviewBadges();

    setTimeout(() => {
      state.assessment.currentIndex += 1;
      renderAssessmentQuestion();
    }, 1000);
  }

  function showAssessmentHint() {
    if (!state.assessment.active) return;
    const word = state.assessment.words[state.assessment.currentIndex];
    if (!word) return;
    const target = getTargetWord(word);
    el.testFeedback.textContent = `💡 أول حرف: "${target.charAt(0)}..."`;
    el.testFeedback.className = 'test-feedback';
  }

  function cancelAssessment() {
    if (confirm('هل تريد إنهاء التقييم الحالي والعودة؟')) {
      state.assessment.active = false;
      initAssessmentTab('comprehensive');
    }
  }

  function restartAssessment() {
    if (state.assessment.mode === 'final') {
      startFinalAssessment();
    } else if (state.assessment.mode === 'review') {
      startReviewListAssessment();
    } else {
      startComprehensiveAssessment();
    }
  }

  function finishAssessment() {
    state.assessment.active = false;
    if (el.assessmentActiveSection) el.assessmentActiveSection.style.display = 'none';
    if (el.reviewListSection) el.reviewListSection.style.display = 'none';
    if (el.assessmentSummarySection) el.assessmentSummarySection.style.display = 'block';

    const total = state.assessment.words.length;
    const correct = state.assessment.correctCount;
    const wrong = state.assessment.wrongCount;
    const pct = Math.round((correct / Math.max(1, total)) * 100);

    if (el.summaryTotalWords) el.summaryTotalWords.textContent = `${total}`;
    if (el.summaryCorrectWords) el.summaryCorrectWords.textContent = `${correct}`;
    if (el.summaryWrongWords) el.summaryWrongWords.textContent = `${wrong}`;
    if (el.summaryPercentVal) el.summaryPercentVal.textContent = `${pct}%`;

    if (pct >= 80) {
      if (el.assessmentTrophyIcon) el.assessmentTrophyIcon.textContent = '🏆';
      if (el.assessmentSummaryTitle) el.assessmentSummaryTitle.textContent = 'أداء متميز ورائع!';
      if (el.assessmentSummarySubtitle) el.assessmentSummarySubtitle.textContent = `حققت نسبة إتقان ${pct}% في هذا التقييم. واصل التألق!`;
      triggerConfetti();
    } else {
      if (el.assessmentTrophyIcon) el.assessmentTrophyIcon.textContent = '💪';
      if (el.assessmentSummaryTitle) el.assessmentSummaryTitle.textContent = 'اكتمل التقييم! مجهود طيب';
      if (el.assessmentSummarySubtitle) el.assessmentSummarySubtitle.textContent = `حققت ${pct}%. تم تسجيل الكلمات التي أخطأت فيها في قائمة المراجعة لتثبيتها.`;
    }

    if (state.assessment.mistakes && state.assessment.mistakes.length > 0) {
      if (el.assessmentMistakesBox) el.assessmentMistakesBox.style.display = 'block';
      if (el.assessmentMistakesList) {
        el.assessmentMistakesList.innerHTML = state.assessment.mistakes.map(m => `
          <div class="mistake-item-card">
            <div class="mistake-item-info">
              <strong>${escapeHtml(m.english)}</strong>
              <span>${escapeHtml(m.arabic)}</span>
            </div>
            <button type="button" class="pronounce-btn" onclick="window.pronounceWord('${escapeHtml(m.english)}')" style="position:static; width:34px; height:34px; font-size:0.9rem;" title="استمع">🔊</button>
          </div>
        `).join('');
      }
    } else {
      if (el.assessmentMistakesBox) el.assessmentMistakesBox.style.display = 'none';
    }

    saveState(true);
    updateReviewBadges();
  }

  function renderReviewListView() {
    state.assessment.active = false;
    if (el.assessmentActiveSection) el.assessmentActiveSection.style.display = 'none';
    if (el.assessmentSummarySection) el.assessmentSummarySection.style.display = 'none';
    if (el.reviewListSection) el.reviewListSection.style.display = 'block';

    const reviewWords = state.vocabulary.filter(w => state.reviewList.includes(w.id));
    updateReviewBadges();

    if (!reviewWords.length) {
      if (el.startReviewFromListBtn) el.startReviewFromListBtn.disabled = true;
      if (el.clearReviewListBtn) el.clearReviewListBtn.disabled = true;
      if (el.reviewWordsContainer) {
        el.reviewWordsContainer.innerHTML = `
          <div class="review-empty-state">
            <div class="review-empty-icon">🎉</div>
            <h4>رائع! لا توجد كلمات تحتاج مراجعة</h4>
            <p>قائمة المراجعة نظيفة تماماً. عند الخطأ في أي كلمة أثناء التقييم الشامل أو النهائي، ستُضاف هنا تلقائياً لتراجع عليها وتثبتها.</p>
          </div>
        `;
      }
    } else {
      if (el.startReviewFromListBtn) el.startReviewFromListBtn.disabled = false;
      if (el.clearReviewListBtn) el.clearReviewListBtn.disabled = false;
      if (el.reviewWordsContainer) {
        el.reviewWordsContainer.innerHTML = reviewWords.map(w => `
          <div class="review-item-card" data-id="${escapeHtml(w.id)}">
            <div class="review-item-info">
              <strong>${escapeHtml(w.english)}</strong>
              <span>${escapeHtml(w.arabic)}</span>
            </div>
            <div class="review-item-actions">
              <button type="button" class="pronounce-btn" onclick="window.pronounceWord('${escapeHtml(w.english)}')" style="position:static; width:34px; height:34px; font-size:0.9rem;" title="استمع">🔊</button>
              <button type="button" class="btn btn-outline btn-sm review-remove-btn" data-remove-id="${escapeHtml(w.id)}" style="padding:4px 10px; font-size:0.8rem; border-color:#fca5a5; color:#dc2626;" title="إزالة من قائمة المراجعة">❌ إزالة</button>
            </div>
          </div>
        `).join('');

        el.reviewWordsContainer.querySelectorAll('.review-remove-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const id = btn.dataset.removeId;
            removeReviewWord(id);
          });
        });
      }
    }
  }

  function removeReviewWord(id) {
    state.reviewList = state.reviewList.filter(wId => wId !== id);
    saveState(true);
    renderReviewListView();
  }

  function clearReviewList() {
    if (!state.reviewList || !state.reviewList.length) return;
    if (!confirm('هل أنت متأكد من رغبتك في مسح كافة الكلمات من قائمة المراجعة؟')) return;
    state.reviewList = [];
    saveState(true);
    renderReviewListView();
  }

  window.pronounceWord = function(text) {
    speak(text);
  };

  function checkWriting() {
    if (state.assessment && state.assessment.active) {
      checkAssessmentWriting();
      return;
    }

    if (state.testLocked) return;

    const word = getCurrentStudyWord();
    if (!word) return;

    const input = normalizeString(el.guessInput.value);
    if (!input) {
      el.testFeedback.textContent = '⚠️ اكتب الإجابة أولًا.';
      el.testFeedback.className = 'test-feedback';
      return;
    }

    const correct = normalizeString(getTargetWord(word));
    const isCorrect = input === correct;
    el.guessInput.className = isCorrect ? 'correct' : 'wrong';
    el.testFeedback.textContent = isCorrect ? '✅ إجابة صحيحة!' : `❌ الصحيح: ${getTargetWord(word)}`;
    el.testFeedback.className = 'test-feedback ' + (isCorrect ? 'correct' : 'wrong');

    if (guessInputResetTimer) clearTimeout(guessInputResetTimer);
    guessInputResetTimer = window.setTimeout(() => {
      el.guessInput.className = '';
    }, 500);

    processTestAnswer(isCorrect);
  }

  function generateOptions(correctWord) {
    const target = getTargetWord(correctWord);
    const candidates = state.vocabulary
      .filter(w => w.id !== correctWord.id && getTargetWord(w) !== target)
      .sort(() => Math.random() - .5)
      .slice(0, 3)
      .map(getTargetWord);

    const uniqueCandidates = [];
    const seen = new Set();
    for (const item of candidates) {
      if (!seen.has(item)) {
        seen.add(item);
        uniqueCandidates.push(item);
      }
    }

    while (uniqueCandidates.length < 3 && state.vocabulary.length) {
      const fallback = getTargetWord(state.vocabulary[uniqueCandidates.length % state.vocabulary.length]);
      if (!seen.has(fallback) && fallback !== target) {
        seen.add(fallback);
        uniqueCandidates.push(fallback);
      } else {
        break;
      }
    }

    while (uniqueCandidates.length < 3) {
      const fallback = target + (uniqueCandidates.length + 1);
      uniqueCandidates.push(fallback);
    }

    const options = [target, ...uniqueCandidates].sort(() => Math.random() - .5);
    el.optionsGrid.innerHTML = '';

    options.forEach(option => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'option-btn';
      button.textContent = option;
      button.addEventListener('click', () => handleChoice(option));
      el.optionsGrid.appendChild(button);
    });
  }

  function handleChoice(selected) {
    if (state.testLocked) return;

    const word = getCurrentStudyWord();
    if (!word) return;

    const correctAnswer = getTargetWord(word);
    const isCorrect = normalizeString(selected) === normalizeString(correctAnswer);

    el.optionsGrid.querySelectorAll('.option-btn').forEach(button => {
      button.disabled = true;
      if (normalizeString(button.textContent) === normalizeString(correctAnswer)) {
        button.classList.add('correct-choice');
      }
      if (normalizeString(button.textContent) === normalizeString(selected) && !isCorrect) {
        button.classList.add('wrong-choice');
      }
    });

    el.testFeedback.textContent = isCorrect ? '✅ إجابة صحيحة!' : `❌ الصحيح: ${correctAnswer}`;
    el.testFeedback.className = 'test-feedback ' + (isCorrect ? 'correct' : 'wrong');
    processTestAnswer(isCorrect);
  }

  function markCurrentDifficult() {
    const word = getCurrentStudyWord();
    if (!word) return;
    word.status = 'difficult';
    word.interval = 0;
    word.due = now();
    word.wrongCount += 1;
    saveState(true);
    updateStats();
    updateStudyView();
    updateTestView();
    el.testFeedback.textContent = '🔴 تم وضع الكلمة في قائمة الصعبة.';
    el.testFeedback.className = 'test-feedback wrong';
  }

  function showHint() {
    const word = getCurrentStudyWord();
    if (!word) return;
    const target = getTargetWord(word);
    el.testFeedback.textContent = `💡 أول حرف: "${target.charAt(0)}..."`;
    el.testFeedback.className = 'test-feedback';
  }

  function shuffleVocabulary() {
    if (state.vocabulary.length < 2) return;
    for (let i = state.vocabulary.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [state.vocabulary[i], state.vocabulary[j]] = [state.vocabulary[j], state.vocabulary[i]];
    }
    state.currentIndex = 0;
    saveState(true);
    updateStats();
    updateStudyView();
    updateTestView();
  }

  function setStudyFilter(filter) {
    if (filter === 'difficult' && !state.vocabulary.some(w => w.status === 'difficult')) {
      alert('لا توجد كلمات صعبة.');
      return;
    }
    if (filter === 'due' && !state.vocabulary.some(w => !w.due || w.due <= now())) {
      alert('لا توجد كلمات مستحقة للمراجعة الآن.');
      return;
    }
    state.studyFilter = state.studyFilter === filter ? 'all' : filter;
    state.currentIndex = 0;
    updateStudyView();
    updateTestView();
    saveState();
  }

  function parseCSVLine(line) {
    const result = [];
    let current = '';
    let quoted = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (quoted && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          quoted = !quoted;
        }
      } else if (char === ',' && !quoted) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  function parseFile(text) {
    const result = [];
    const lines = String(text || '').replace(/^\uFEFF/, '').split(/\r?\n/);

    for (const raw of lines) {
      const line = raw.trim();
      if (!line) continue;

      let english = '';
      let arabic = '';
      let category = 'عام';

      const csv = parseCSVLine(line);
      if (csv.length >= 3) {
        english = csv[0].trim();
        arabic = csv[1].trim();
        category = csv[2].trim() || 'عام';
      } else if (csv.length === 2) {
        english = csv[0].trim();
        arabic = csv[1].trim();
      } else if (line.includes('=')) {
        const parts = line.split('=');
        english = parts[0]?.trim() || '';
        arabic = parts[1]?.trim() || '';
        if (parts[2]) category = parts[2].trim() || 'عام';
      } else if (line.includes('→')) {
        const parts = line.split('→');
        english = parts[0]?.trim() || '';
        arabic = parts[1]?.trim() || '';
        if (parts[2]) category = parts[2].trim() || 'عام';
      } else if (line.includes(' - ')) {
        const parts = line.split(' - ');
        english = parts[0]?.trim() || '';
        arabic = parts[1]?.trim() || '';
        if (parts[2]) category = parts[2].trim() || 'عام';
      } else if (line.includes('\t')) {
        const parts = line.split('\t');
        english = parts[0]?.trim() || '';
        arabic = parts[1]?.trim() || '';
        if (parts[2]) category = parts[2].trim() || 'عام';
      } else {
        english = line;
        arabic = '⚠️';
      }

      english = english.replace(/^["']|["']$/g, '').trim();
      arabic = arabic.replace(/^["']|["']$/g, '').trim();
      arabic = arabic.replace(/\bNaN\b/gi, '').trim() || '⚠️';
      category = category.replace(/^["']|["']$/g, '').trim() || 'عام';

      if (!english) english = '?';
      result.push(normalizeWord({
        english,
        arabic,
        category,
        tags: [category],
        status: 'new',
        interval: 0,
        lastReview: null,
        due: now(),
        selected: false
      }));
    }

    return result;
  }

  async function readFileText(file) {
    if (!file) throw new Error('No file');
    if (file.size > 8 * 1024 * 1024) throw new Error('الملف كبير جدًا. الحد 8MB.');
    return file.text();
  }

  async function importTextFile(file) {
    try {
      const text = await readFileText(file);
      const incoming = parseFile(text);
      if (!incoming.length) {
        alert('لم أجد كلمات قابلة للقراءة في الملف.');
        return;
      }

      if (state.vocabulary.length) {
        const add = confirm(`تم العثور على ${incoming.length} كلمة. اضغط موافق لإضافتها للكلمات الحالية، أو إلغاء لاستبدال القائمة.`);
        if (add) {
          const existingPairs = new Set(state.vocabulary.map(w => normalizeString(w.english) + '|' + normalizeString(w.arabic)));
          for (const word of incoming) {
            const pair = normalizeString(word.english) + '|' + normalizeString(word.arabic);
            if (!existingPairs.has(pair)) {
              state.vocabulary.push(word);
              existingPairs.add(pair);
            }
          }
        } else {
          state.vocabulary = incoming;
        }
      } else {
        state.vocabulary = incoming;
      }

      state.selectedIds = state.vocabulary.filter(w => w.selected).map(w => w.id);
      state.currentIndex = 0;
      state.studyFilter = 'all';
      state.categoryFilter = 'all';
      state.search = '';
      if (el.searchInput) el.searchInput.value = '';
      saveState(true);
      updateAllViews();
      alert(`✅ تم تحميل ${incoming.length} كلمة بنجاح.`);
      navigateTo('studyPage');
    } catch (error) {
      console.error(error);
      alert('❌ تعذر قراءة الملف. تأكد أنه TXT أو CSV نصي سليم.');
    }
  }

  function addWord() {
    const english = el.newEnglish.value.trim();
    const arabic = el.newArabic.value.trim();
    const category = (el.newCategory?.value || '').trim() || 'عام';

    if (!english || !arabic) {
      alert('اكتب الكلمة الإنجليزية والترجمة معًا.');
      return;
    }

    const duplicate = state.vocabulary.some(w =>
      normalizeString(w.english) === normalizeString(english) &&
      normalizeString(w.arabic) === normalizeString(arabic)
    );
    if (duplicate) {
      alert('⚠️ هذه الكلمة موجودة بالفعل.');
      return;
    }

    state.vocabulary.push(normalizeWord({ english, arabic, category, tags: [category] }));
    el.newEnglish.value = '';
    el.newArabic.value = '';
    if (el.newCategory) el.newCategory.value = '';
    saveState(true);
    updateAllViews();
    el.newEnglish.focus();
  }

  function setWordStatus(wordOrId, newStatus) {
    const word = typeof wordOrId === 'object' && wordOrId !== null
      ? wordOrId
      : (typeof wordOrId === 'number' ? state.vocabulary[wordOrId] : state.vocabulary.find(w => w.id === String(wordOrId)));
    if (!word) return;
    if (!['new', 'difficult', 'learned'].includes(newStatus)) return;
    word.status = newStatus;
    if (newStatus === 'new') {
      word.interval = 0;
      word.due = now();
    } else if (newStatus === 'learned') {
      word.interval = Math.max(word.interval || 1, 24);
      word.due = now() + word.interval * 3600000;
      word.correctCount = Math.max(word.correctCount || 0, 3);
    } else if (newStatus === 'difficult') {
      word.interval = 0;
      word.due = now();
      word.wrongCount = (word.wrongCount || 0) + 1;
    }
    saveState(true);
    updateAllViews();
  }

  function cycleStatus(wordOrId) {
    const word = typeof wordOrId === 'object' && wordOrId !== null
      ? wordOrId
      : (typeof wordOrId === 'number' ? state.vocabulary[wordOrId] : state.vocabulary.find(w => w.id === String(wordOrId)));
    if (!word) return;
    const nextStatus = word.status === 'new' ? 'difficult' : (word.status === 'difficult' ? 'learned' : 'new');
    setWordStatus(word, nextStatus);
  }

  function deleteWord(wordOrId) {
    const idx = typeof wordOrId === 'number' ? wordOrId : state.vocabulary.findIndex(w => w.id === wordOrId || w === wordOrId);
    if (idx < 0) return;
    const word = state.vocabulary[idx];
    if (!word) return;
    if (!confirm(`حذف "${word.english}"؟`)) return;

    state.vocabulary.splice(idx, 1);
    state.selectedIds = state.vocabulary.filter(w => w.selected).map(w => w.id);
    state.currentIndex = Math.min(state.currentIndex, Math.max(0, getStudyList().length - 1));
    saveState(true);
    updateAllViews();
  }

  function getUniqueCategories() {
    const map = new Map();
    state.vocabulary.forEach(w => {
      const cat = (w.category || 'عام').trim() || 'عام';
      map.set(cat, (map.get(cat) || 0) + 1);
    });
    return map;
  }

  function openEditWordModal(wordId) {
    const word = state.vocabulary.find(w => w.id === wordId);
    if (!word) return;

    if (el.editWordId) el.editWordId.value = word.id;
    if (el.editEnglishInput) el.editEnglishInput.value = word.english;
    if (el.editArabicInput) el.editArabicInput.value = word.arabic;
    const currentStatus = word.status || 'new';
    if (el.editStatusInput) el.editStatusInput.value = currentStatus;

    if (el.editStatusPills) {
      el.editStatusPills.querySelectorAll('.status-pill-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.status === currentStatus);
      });
    }

    const currentCat = (word.category || 'عام').trim() || 'عام';
    if (el.editCategoryInput) el.editCategoryInput.value = currentCat;

    renderCategorySuggestions(currentCat);

    if (el.editWordModal) {
      el.editWordModal.style.display = 'flex';
      setTimeout(() => {
        if (el.editEnglishInput) el.editEnglishInput.focus();
      }, 50);
    }
  }

  function renderCategorySuggestions(selectedCat) {
    if (!el.quickCategorySuggestions) return;
    el.quickCategorySuggestions.innerHTML = '';

    const defaultCats = ['عام', 'أفعال', 'سفر', 'طعام', 'عمل', 'تقنية', 'صفات', 'محادثة', 'تعليم'];
    const existingCatMap = getUniqueCategories();
    const allCatSet = new Set([...Array.from(existingCatMap.keys()), ...defaultCats]);

    const fragment = document.createDocumentFragment();
    allCatSet.forEach(cat => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'cat-suggest-chip' + (cat === selectedCat ? ' active' : '');
      chip.textContent = `🏷️ ${cat}`;
      chip.addEventListener('click', () => {
        if (el.editCategoryInput) {
          el.editCategoryInput.value = cat;
          el.quickCategorySuggestions.querySelectorAll('.cat-suggest-chip').forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
        }
      });
      fragment.appendChild(chip);
    });

    el.quickCategorySuggestions.appendChild(fragment);
  }

  function closeEditWordModal() {
    if (el.editWordModal) {
      el.editWordModal.style.display = 'none';
    }
  }

  function saveEditWord() {
    const wordId = el.editWordId ? el.editWordId.value : null;
    if (!wordId) return;

    const word = state.vocabulary.find(w => w.id === wordId);
    if (!word) return;

    const newEnglish = (el.editEnglishInput?.value || '').trim();
    const newArabic = (el.editArabicInput?.value || '').trim();
    const newCategory = (el.editCategoryInput?.value || '').trim() || 'عام';
    const newStatus = el.editStatusInput?.value || word.status || 'new';

    if (!newEnglish || !newArabic) {
      alert('يرجى ملء الكلمة بالإنجليزية والترجمة بالعربية.');
      return;
    }

    word.english = newEnglish;
    word.arabic = newArabic;
    word.category = newCategory;
    word.tags = [newCategory];

    if (['new', 'difficult', 'learned'].includes(newStatus) && newStatus !== word.status) {
      setWordStatus(word, newStatus);
    } else {
      saveState(true);
      updateAllViews();
    }

    // تحديث كلمة اليوم إذا كانت هذه الكلمة هي كلمة اليوم
    if (state.wotd && state.wotd.wordId === word.id) {
      renderWordOfTheDay();
    }

    closeEditWordModal();
  }

  function renderCategoryFilterBar() {
    if (!el.categoryFilterBar) return;
    const catMap = getUniqueCategories();
    const total = state.vocabulary.length;

    el.categoryFilterBar.innerHTML = '';
    const fragment = document.createDocumentFragment();

    // زر "الكل"
    const allBtn = document.createElement('button');
    allBtn.type = 'button';
    allBtn.className = 'cat-pill-btn' + (state.categoryFilter === 'all' ? ' active' : '');
    allBtn.innerHTML = `🌟 الكل <span class="cat-pill-count">${total}</span>`;
    allBtn.addEventListener('click', () => {
      state.categoryFilter = 'all';
      renderCategoryFilterBar();
      renderWordList(state.search);
      saveState();
    });
    fragment.appendChild(allBtn);

    // أزرار باقي التصنيفات
    catMap.forEach((count, cat) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cat-pill-btn' + (state.categoryFilter === cat ? ' active' : '');
      btn.innerHTML = `🏷️ ${cat} <span class="cat-pill-count">${count}</span>`;
      btn.addEventListener('click', () => {
        state.categoryFilter = state.categoryFilter === cat ? 'all' : cat;
        renderCategoryFilterBar();
        renderWordList(state.search);
        saveState();
      });
      fragment.appendChild(btn);
    });

    el.categoryFilterBar.appendChild(fragment);
  }

  function renderWordList(filter = '') {
    const query = normalizeString(filter);
    renderCategoryFilterBar();
    el.wordList.innerHTML = '';

    const items = state.vocabulary
      .map((word, index) => ({ word, index }))
      .filter(({ word }) => {
        // فلتر التصنيف المحدد
        if (state.categoryFilter !== 'all') {
          const wordCat = (word.category || 'عام').trim();
          if (wordCat !== state.categoryFilter && !(word.tags || []).includes(state.categoryFilter)) {
            return false;
          }
        }
        // فلتر البحث
        if (!query) return true;
        const enMatch = normalizeString(word.english).includes(query);
        const arMatch = normalizeString(word.arabic).includes(query);
        const catMatch = normalizeString(word.category || '').includes(query);
        const tagMatch = (word.tags || []).some(t => normalizeString(t).includes(query));
        return enMatch || arMatch || catMatch || tagMatch;
      });

    if (!items.length) {
      el.wordList.innerHTML = '<div class="empty-state">لا توجد كلمات مطابقة.</div>';
      updateSelectionUI();
      return;
    }

    const fragment = document.createDocumentFragment();

    items.forEach(({ word, index }) => {
      const item = document.createElement('div');
      item.className = 'word-item' + (word.selected ? ' selected' : '');

      const mainRow = document.createElement('div');
      mainRow.className = 'word-item-main';

      const checkLabel = document.createElement('label');
      checkLabel.className = 'word-check-label';
      const check = document.createElement('input');
      check.type = 'checkbox';
      check.className = 'word-check';
      check.checked = word.selected;
      check.title = 'اختيار لـ حفظني';
      check.addEventListener('change', () => {
        word.selected = check.checked;
        syncSelectedIds();
        item.classList.toggle('selected', word.selected);
        updateSelectionUI();
        saveState();
      });
      checkLabel.appendChild(check);

      const pair = document.createElement('div');
      pair.className = 'word-pair';

      const pairTop = document.createElement('div');
      pairTop.className = 'word-pair-top';

      const strong = document.createElement('strong');
      strong.className = 'word-en';
      strong.textContent = word.english;

      const audioBtn = document.createElement('button');
      audioBtn.type = 'button';
      audioBtn.className = 'word-audio-btn';
      audioBtn.innerHTML = '🔊';
      audioBtn.title = 'استمع لنطق الكلمة';
      audioBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        speak(word.english);
      });

      pairTop.append(strong, audioBtn);

      const pairDetails = document.createElement('div');
      pairDetails.className = 'word-pair-details';

      const arabic = document.createElement('span');
      arabic.className = 'arabic-line';
      arabic.textContent = '← ' + word.arabic;

      const tagSpan = document.createElement('span');
      tagSpan.className = 'word-category-tag';
      tagSpan.textContent = `🏷️ ${word.category || 'عام'}`;
      tagSpan.title = 'اضغط لفلترة هذا التصنيف';
      tagSpan.addEventListener('click', (e) => {
        e.stopPropagation();
        state.categoryFilter = word.category || 'عام';
        renderCategoryFilterBar();
        renderWordList(state.search);
        saveState();
      });

      pairDetails.append(arabic, tagSpan);
      pair.append(pairTop, pairDetails);
      mainRow.append(checkLabel, pair);

      const actions = document.createElement('div');
      actions.className = 'word-actions';

      const status = document.createElement('button');
      status.type = 'button';
      status.className = 'status-btn ' + word.status;
      status.textContent = getStatusLabel(word.status);
      status.addEventListener('click', () => cycleStatus(index));

      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'edit-btn';
      editBtn.innerHTML = '✏️ تعديل';
      editBtn.title = 'تعديل الكلمة، الترجمة، أو التصنيف';
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openEditWordModal(word.id);
      });

      const shareBtn = document.createElement('button');
      shareBtn.type = 'button';
      shareBtn.className = 'share-btn';
      shareBtn.innerHTML = '📤 مشاركة';
      shareBtn.title = 'مشاركة هذه الكلمة كنص منسق';
      shareBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openShareWordModal(word);
      });

      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'delete-btn';
      del.textContent = '🗑️';
      del.title = 'حذف الكلمة';
      del.addEventListener('click', () => deleteWord(index));

      actions.append(status, editBtn, shareBtn, del);
      item.append(mainRow, actions);
      fragment.appendChild(item);
    });

    el.wordList.appendChild(fragment);
    updateSelectionUI();
  }

  function syncSelectedIds() {
    state.selectedIds = state.vocabulary.filter(w => w.selected).map(w => w.id);
  }

  function updateSelectionUI() {
    syncSelectedIds();
    const count = state.selectedIds.length;
    el.selectedWordsCount.textContent = count;
    el.hafazniSelectedCount.textContent = count;
    el.sendToHafazniBtn.disabled = count === 0;
  }

  function selectAll() {
    const query = normalizeString(state.search);
    state.vocabulary.forEach(word => {
      if (state.categoryFilter !== 'all') {
        const wordCat = (word.category || 'عام').trim();
        if (wordCat !== state.categoryFilter && !(word.tags || []).includes(state.categoryFilter)) {
          return;
        }
      }
      if (!query || normalizeString(word.english).includes(query) || normalizeString(word.arabic).includes(query) || normalizeString(word.category || '').includes(query)) {
        word.selected = true;
      }
    });
    saveState(true);
    renderWordList(state.search);
  }

  function clearSelection() {
    state.vocabulary.forEach(word => word.selected = false);
    state.selectedIds = [];
    saveState(true);
    renderWordList(state.search);
  }

  function switchHafazniTab(tab) {
    state.hafazniTab = tab === 'custom' ? 'custom' : 'lessons';
    document.querySelectorAll('[data-hafazni-tab]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.hafazniTab === state.hafazniTab);
    });
    if (!state.hafazni.active) {
      if (el.hafazniLessonsCard) el.hafazniLessonsCard.style.display = state.hafazniTab === 'lessons' ? 'block' : 'none';
      if (el.hafazniSetupCard) el.hafazniSetupCard.style.display = state.hafazniTab === 'custom' ? 'block' : 'none';
    }
    saveState();
  }

  function goToHafazni() {
    updateSelectionUI();
    if (!state.selectedIds.length) {
      alert('حدد كلمة واحدة على الأقل أولًا.');
      return;
    }
    state.hafazniTab = 'custom';
    navigateTo('hafazniPage');
  }

  function updateHafazniOverview() {
    updateSelectionUI();
    // "المتبقي" = عدد الكلمات التي لم تُتقَن بعد وما زالت في طابور المراجعة النشط
    const remaining = state.hafazni.active
      ? state.hafazni.sessionWords.length
      : state.selectedIds.length;
    if (el.hafazniRemainingCount) el.hafazniRemainingCount.textContent = remaining;
    if (el.hafazniSelectedCount) el.hafazniSelectedCount.textContent = state.selectedIds.length;

    // إذا كانت الجلسة نشطة، نحدث التقدم بناءً على عدد الكلمات المُتقَنة فعليًا من إجمالي الجلسة
    if (state.hafazni.active) {
      const total = state.hafazni.totalWords || state.hafazni.sessionWords.length;
      const done = Math.max(0, total - state.hafazni.sessionWords.length);
      if (el.hafazniProgressText) el.hafazniProgressText.textContent = `${done} / ${total}`;
      if (el.hafazniProgressBar) el.hafazniProgressBar.style.width = total ? `${(done / total) * 100}%` : '0%';
    } else {
      if (el.hafazniTypeToggle) el.hafazniTypeToggle.style.display = 'flex';
      if (el.hafazniLessonsCard) el.hafazniLessonsCard.style.display = state.hafazniTab === 'lessons' ? 'block' : 'none';
      if (el.hafazniSetupCard) el.hafazniSetupCard.style.display = state.hafazniTab === 'custom' ? 'block' : 'none';
      document.querySelectorAll('[data-hafazni-tab]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.hafazniTab === state.hafazniTab);
      });
    }
    renderLessonMap();
  }

  function getWordsByIds(ids) {
    const set = new Set(ids);
    return state.vocabulary.filter(w => set.has(w.id));
  }

  // ==================== إشعارات التذكير اليومي والمجدولة ====================

  function isNotificationSupported() {
    return 'Notification' in window;
  }

  function getNotificationPermission() {
    if (!isNotificationSupported()) return 'unsupported';
    return Notification.permission;
  }

  function markUserActivity() {
    state.notifications.lastActivityTime = Date.now();
  }

  async function requestNotificationPermission() {
    if (!isNotificationSupported()) {
      alert('عذرًا، متصفحك لا يدعم إشعارات الويب.');
      return false;
    }
    try {
      const permission = await Notification.requestPermission();
      updateNotificationUI();
      if (permission === 'granted') {
        state.notifications.enabled = true;
        saveState(true);
        const time = state.notifications.time || state.hafazniLessons.notificationTime || '20:00';
        sendNotification(
          '🔔 تم تفعيل إشعارات حفظني المجدولة!',
          `سنقوم بتنبيهك يوميًا في موعدك المفضل (${time}) بمراجعة درسك وتثبيت الكلمات في ذاكرتك 🚀`
        );
        return true;
      }
      return false;
    } catch (e) {
      console.warn('Notification permission error:', e);
      return false;
    }
  }

  function sendNotification(title, body, tag = 'hafazni-daily-reminder') {
    if (!isNotificationSupported() || Notification.permission !== 'granted') return;
    const options = {
      body,
      icon: './icons/icon-192.png',
      badge: './icons/icon-192.png',
      tag,
      data: { url: './#hafazniPage' }
    };

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then(reg => {
        reg.showNotification(title, options).catch(() => {
          try { new Notification(title, options); } catch (e) {}
        });
      }).catch(() => {
        try { new Notification(title, options); } catch (e) {}
      });
    } else {
      try {
        new Notification(title, options);
      } catch (e) {
        console.warn('Failed to trigger notification:', e);
      }
    }
  }

  function checkDailyLessonNotification(force = false) {
    if (!isNotificationSupported()) return;
    if (Notification.permission !== 'granted') return;
    if (!state.notifications.enabled && !force) return;

    const now = new Date();
    const today = getLocalDateStr(now);
    const targetTime = state.notifications.time || state.hafazniLessons.notificationTime || '20:00';
    const parts = targetTime.split(':');
    const tHour = safeNumber(parts[0], 20);
    const tMin = safeNumber(parts[1], 0);

    const curHour = now.getHours();
    const curMin = now.getMinutes();
    const isPastTargetTime = (curHour > tHour) || (curHour === tHour && curMin >= tMin);

    if (force || (isPastTargetTime && state.notifications.lastScheduledDate !== today)) {
      const nodes = computeLessons();
      const currentNode = nodes.find(n => getLessonStatus(n) === 'available');
      const title = currentNode
        ? (currentNode.type === 'checkpoint' ? '🏆 موعد محطة التقييم الشامل في حفظني!' : `🧠 موعد درسك في حفظني (${currentNode.title})!`)
        : '🧠 حان وقت مراجعة الكلمات في حفظني!';
      const desc = currentNode
        ? `حان موعد تذكيرك اليومي (${targetTime}). درسك جاهز الآن لتثبيت الكلمات وتنشيط الذاكرة 🚀`
        : 'دقائق قليلة من المراجعة اليوم تثبت الكلمات في ذاكرتك للأبد ✨';

      sendNotification(title, desc);
      state.notifications.lastScheduledDate = today;
      state.notifications.lastReminderTime = Date.now();
      saveState(true);
    }
  }

  function updateNotificationUI() {
    const status = getNotificationPermission();
    const userTime = state.notifications.time || state.hafazniLessons.notificationTime || '20:00';

    // تحديث قيم مدخلات الوقت في المعالج والإعدادات
    if (el.wizardNotifTime) el.wizardNotifTime.value = userTime;
    if (el.settingsNotifTime) el.settingsNotifTime.value = userTime;

    // تحديث شرائح الوقت السريعة النشطة
    document.querySelectorAll('.time-chip').forEach(chip => {
      chip.classList.toggle('active', chip.dataset.time === userTime);
    });

    // تحديث الشارة العلوية (Badge)
    if (el.notificationStateBadge) {
      if (status === 'granted') {
        el.notificationStateBadge.textContent = 'مفعلة ✓';
        el.notificationStateBadge.className = 'notif-state-badge active';
      } else if (status === 'denied') {
        el.notificationStateBadge.textContent = 'محظورة ❌';
        el.notificationStateBadge.className = 'notif-state-badge inactive';
      } else if (status === 'unsupported') {
        el.notificationStateBadge.textContent = 'غير مدعوم ⚠️';
        el.notificationStateBadge.className = 'notif-state-badge inactive';
      } else {
        el.notificationStateBadge.textContent = 'غير مفعلة ⏸️';
        el.notificationStateBadge.className = 'notif-state-badge inactive';
      }
    }

    // تحديث صندوق الحالة المفصل (Status Box)
    if (el.notificationStatusBox) {
      if (status === 'granted') {
        el.notificationStatusBox.className = 'notif-status-box active';
        if (el.notifStatusIndicatorIcon) el.notifStatusIndicatorIcon.textContent = '🟢';
        if (el.notifStatusIndicatorTitle) el.notifStatusIndicatorTitle.textContent = `حالة الإشعارات: مفعلة (الموعد: ${userTime})`;
        if (el.notificationStatusText) {
          el.notificationStatusText.textContent = `جاهزة تمامًا! سنرسل لك إشعارًا يوميًا في موعدك المفضل (${userTime}) لتذكيرك بمتابعة مسار دروسك.`;
        }
      } else if (status === 'denied') {
        el.notificationStatusBox.className = 'notif-status-box blocked';
        if (el.notifStatusIndicatorIcon) el.notifStatusIndicatorIcon.textContent = '🔴';
        if (el.notifStatusIndicatorTitle) el.notifStatusIndicatorTitle.textContent = 'حالة الإشعارات: محظورة في إعدادات المتصفح';
        if (el.notificationStatusText) {
          el.notificationStatusText.textContent = 'الإشعارات محظورة حاليًا. يرجى الضغط على علامة القفل بجانب شريط العنوان والسماح بالإشعارات لتفعيل التذكير.';
        }
      } else if (status === 'unsupported') {
        el.notificationStatusBox.className = 'notif-status-box blocked';
        if (el.notifStatusIndicatorIcon) el.notifStatusIndicatorIcon.textContent = '⚠️';
        if (el.notifStatusIndicatorTitle) el.notifStatusIndicatorTitle.textContent = 'حالة الإشعارات: غير مدعومة في هذا المتصفح';
        if (el.notificationStatusText) {
          el.notificationStatusText.textContent = 'المتصفح الحالي لا يدعم إشعارات الويب.';
        }
      } else {
        el.notificationStatusBox.className = 'notif-status-box inactive';
        if (el.notifStatusIndicatorIcon) el.notifStatusIndicatorIcon.textContent = '⚪';
        if (el.notifStatusIndicatorTitle) el.notifStatusIndicatorTitle.textContent = 'حالة الإشعارات: غير مفعلة بعد';
        if (el.notificationStatusText) {
          el.notificationStatusText.textContent = `اضغط على زر التفعيل بالأسفل للسماح للتطبيق بتذكيرك يوميًا في موعدك المفضل (${userTime}).`;
        }
      }
    }

    if (el.toggleNotificationsBtn) {
      if (status === 'granted') {
        el.toggleNotificationsBtn.textContent = `✅ إشعارات التذكير اليومي مفعلة (${userTime})`;
        el.toggleNotificationsBtn.classList.remove('primary');
      } else {
        el.toggleNotificationsBtn.textContent = `🔔 تفعيل إشعارات التذكير اليومي (${userTime})`;
        el.toggleNotificationsBtn.classList.add('primary');
      }
    }

    if (el.hafazniDailyNotifBar) {
      if (status === 'granted') {
        el.hafazniDailyNotifBar.classList.add('granted');
        if (el.hafazniDailyNotifMsg) el.hafazniDailyNotifMsg.textContent = `🔔 التذكير اليومي مجدول في موعدك المفضل: ${userTime}`;
        if (el.hafazniEnableNotifBtn) {
          el.hafazniEnableNotifBtn.textContent = 'مفعلة ✓';
          el.hafazniEnableNotifBtn.disabled = true;
        }
      } else {
        el.hafazniDailyNotifBar.classList.remove('granted');
        if (el.hafazniDailyNotifMsg) el.hafazniDailyNotifMsg.textContent = `فعّل التذكير لننبهك يوميًا في موعدك المفضل (${userTime})`;
        if (el.hafazniEnableNotifBtn) {
          el.hafazniEnableNotifBtn.textContent = 'تفعيل الآن';
          el.hafazniEnableNotifBtn.disabled = false;
        }
      }
    }
  }

  // ==================== نظام الستريك وساعات الحفظ اليومي ====================

  function getLocalDateStr(d = new Date()) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function getYesterdayDateStr() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return getLocalDateStr(d);
  }

  function formatStudyDuration(seconds) {
    const s = Math.max(0, safeNumber(seconds, 0));
    if (s === 0) return '0 د';
    if (s < 60) return `${s} ث`;
    const mins = Math.floor(s / 60);
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (hours === 0) {
      return `${mins} د`;
    }
    if (remMins === 0) {
      return `${hours} س`;
    }
    return `${hours} س ${remMins} د`;
  }

  function checkAndUpdateStreak() {
    const today = getLocalDateStr();
    const yesterday = getYesterdayDateStr();
    if (!state.streak) {
      state.streak = { current: 0, best: 0, lastStudyDate: null, todayCompleted: false };
    }
    if (!state.studyTime) {
      state.studyTime = { totalSeconds: 0, todaySeconds: 0, lastDate: today };
    }
    if (state.studyTime.lastDate !== today) {
      state.studyTime.todaySeconds = 0;
      state.studyTime.lastDate = today;
    }

    if (state.streak.lastStudyDate === today) {
      state.streak.todayCompleted = true;
    } else if (state.streak.lastStudyDate === yesterday) {
      state.streak.todayCompleted = false;
    } else if (state.streak.lastStudyDate) {
      state.streak.current = 0;
      state.streak.todayCompleted = false;
    } else {
      state.streak.current = 0;
      state.streak.todayCompleted = false;
    }
  }

  function recordHafazniStudyActivity(isLessonComplete = false) {
    markUserActivity();
    checkAndUpdateStreak();
    const today = getLocalDateStr();
    const yesterday = getYesterdayDateStr();

    if (!state.streak.todayCompleted && isLessonComplete) {
      if (state.streak.lastStudyDate === yesterday) {
        state.streak.current = (state.streak.current || 0) + 1;
      } else {
        state.streak.current = 1;
      }
      state.streak.lastStudyDate = today;
      state.streak.todayCompleted = true;
      state.streak.best = Math.max(state.streak.best || 0, state.streak.current);
    }
    saveState();
    updateStreakAndStudyUI();
  }

  function updateStreakAndStudyUI() {
    checkAndUpdateStreak();

    if (el.hafazniStreakCount) {
      const count = state.streak.current || 0;
      if (count === 0) {
        el.hafazniStreakCount.textContent = '0 يوم';
      } else if (count === 1) {
        el.hafazniStreakCount.textContent = '1 يوم 🔥';
      } else if (count === 2) {
        el.hafazniStreakCount.textContent = 'يومان 🔥';
      } else if (count >= 3 && count <= 10) {
        el.hafazniStreakCount.textContent = `${count} أيام 🔥`;
      } else {
        el.hafazniStreakCount.textContent = `${count} يوم 🔥`;
      }
    }

    if (el.hafazniStreakStatus) {
      el.hafazniStreakStatus.textContent = state.streak.todayCompleted ? 'أنجزت اليوم ✓' : 'الستريك';
    }

    if (el.hafazniStreakItem) {
      el.hafazniStreakItem.classList.toggle('active-today', Boolean(state.streak.todayCompleted));
    }

    if (el.hafazniStudyTimeCount) {
      el.hafazniStudyTimeCount.textContent = formatStudyDuration(state.studyTime.totalSeconds);
    }
  }

  // ==================== بناء مسار الدروس المتسلسلة ومحطات التقييم ====================

  function computeLessons() {
    const size = Math.max(1, safeNumber(state.hafazniLessons.lessonSize, 10));
    const cpFreq = Math.max(size, safeNumber(state.hafazniLessons.checkpointFrequency, 20));
    const pathPrefix = state.hafazniLessons.pathId || 'p_default';
    const nodes = [];
    const totalWords = state.vocabulary ? state.vocabulary.length : 0;
    if (!totalWords) return [];

    let wordCursor = 0;
    let lessonNum = 1;
    let checkpointNum = 1;
    let wordsSinceLastCp = 0;
    let accumulatedWordsForCp = [];
    let globalIndex = 0;

    while (wordCursor < totalWords) {
      const chunk = state.vocabulary.slice(wordCursor, wordCursor + size);
      wordCursor += size;
      wordsSinceLastCp += chunk.length;
      accumulatedWordsForCp.push(...chunk);

      const lessonId = `${pathPrefix}_lesson_${lessonNum}`;
      const legacyId = `lesson-${lessonNum}`;
      nodes.push({
        id: lessonId,
        legacyId: legacyId,
        type: 'lesson',
        index: globalIndex,
        lessonNumber: lessonNum,
        title: `الدرس ${lessonNum}`,
        words: chunk,
        ids: chunk.map(w => w.id)
      });
      globalIndex++;
      lessonNum++;

      // إدراج محطة تقييم ومراجعة شاملة (Checkpoint) كلما اجتاز المستخدم cpFreq كلمة أو عند نهاية مسار مجموعة الدروس
      const shouldInsertCp = wordsSinceLastCp >= cpFreq || (wordCursor >= totalWords && accumulatedWordsForCp.length > chunk.length);
      if (shouldInsertCp) {
        const cpId = `${pathPrefix}_checkpoint_${checkpointNum}`;
        const legacyCpId = `checkpoint-${checkpointNum}`;
        const uniqueCpWords = [];
        const seen = new Set();
        for (const w of accumulatedWordsForCp) {
          if (!seen.has(w.id)) {
            seen.add(w.id);
            uniqueCpWords.push(w);
          }
        }

        nodes.push({
          id: cpId,
          legacyId: legacyCpId,
          type: 'checkpoint',
          index: globalIndex,
          checkpointNumber: checkpointNum,
          title: `تقييم شامل ${checkpointNum}`,
          words: uniqueCpWords,
          ids: uniqueCpWords.map(w => w.id)
        });
        globalIndex++;
        checkpointNum++;
        wordsSinceLastCp = 0;
        accumulatedWordsForCp = [];
      }
    }
    return nodes;
  }

  function getLessonStatus(node) {
    if (!node) return 'locked';
    const completedList = state.hafazniLessons.completedLessonIds || [];
    if (completedList.includes(node.id) || (node.legacyId && completedList.includes(node.legacyId))) {
      return 'completed';
    }
    // العقدة الأولى في المسار مفتوحة دائماً
    if (node.index === 0) return 'available';

    // العقدة n تُفتح فقط عند إتمام العقدة n-1
    const allNodes = computeLessons();
    const prevNode = allNodes[node.index - 1];
    if (prevNode && (completedList.includes(prevNode.id) || (prevNode.legacyId && completedList.includes(prevNode.legacyId)))) {
      return 'available';
    }
    return 'locked';
  }

  function computeLessonPoints(count, width = 360, stepY = 96) {
    const points = [];
    const midX = Math.round(width / 2); // 180
    const rightX = Math.round(width * 0.76); // 274
    const leftX = Math.round(width * 0.24); // 86
    const xPattern = [midX, rightX, midX, leftX];
    for (let i = 0; i < count; i++) {
      const x = xPattern[i % 4];
      const y = 48 + i * stepY;
      points.push({ x, y });
    }
    return points;
  }

  function generateSvgWindingPath(points) {
    if (!points.length) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const dy = p2.y - p1.y;
      const cy1 = p1.y + dy * 0.5;
      const cy2 = p2.y - dy * 0.5;
      d += ` C ${p1.x} ${cy1}, ${p2.x} ${cy2}, ${p2.x} ${p2.y}`;
    }
    return d;
  }

  function renderLessonMap() {
    if (!el.hafazniLessonPath) return;

    // إذا لم ينشئ المستخدم المسار بعد، نعرض معالج الإنشاء والتخصيص أولاً
    const pathCreated = Boolean(state.hafazniLessons.pathCreated);
    if (!pathCreated) {
      if (el.hafazniPathWizardBox) el.hafazniPathWizardBox.style.display = 'block';
      if (el.hafazniPathActiveView) el.hafazniPathActiveView.style.display = 'none';
      if (el.cancelWizardBtn) el.cancelWizardBtn.style.display = 'none';
      syncWizardPills();
      return;
    }

    if (el.hafazniPathWizardBox) el.hafazniPathWizardBox.style.display = 'none';
    if (el.hafazniPathActiveView) el.hafazniPathActiveView.style.display = 'block';

    updateNotificationUI();
    updateStreakAndStudyUI();

    const nodes = computeLessons();
    const completedList = state.hafazniLessons.completedLessonIds || [];
    const completedCount = nodes.filter(n => completedList.includes(n.id) || completedList.includes(String(n.index)) || completedList.includes(Number(n.index))).length;
    const totalCount = nodes.length;
    const percent = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

    if (el.hafazniMapProgressCount) {
      el.hafazniMapProgressCount.textContent = `${completedCount} / ${totalCount} مكتمل (${percent}%)`;
    }
    if (el.hafazniMapProgressBarFill) {
      el.hafazniMapProgressBarFill.style.width = `${percent}%`;
    }

    if (!nodes.length) {
      if (el.hafazniMapSvg) el.hafazniMapSvg.innerHTML = '';
      el.hafazniLessonPath.innerHTML = '<p class="lessons-hint">أضف كلماتك من صفحة "الكلمات" ليتم توليد مسار الدروس المتسلسل تلقائيًا.</p>';
      el.hafazniLessonPath.style.height = 'auto';
      renderTodayWordsList(null);
      return;
    }

    const V_WIDTH = 360;
    const STEP_Y = 96;
    const points = computeLessonPoints(nodes.length, V_WIDTH, STEP_Y);
    const totalHeight = Math.max(180, 48 + (nodes.length - 1) * STEP_Y + 56);

    el.hafazniLessonPath.style.height = `${totalHeight}px`;

    const fullPathD = generateSvgWindingPath(points);

    let maxActiveIndex = -1;
    for (let i = 0; i < nodes.length; i++) {
      const st = getLessonStatus(nodes[i]);
      if (st === 'completed' || st === 'available') {
        maxActiveIndex = i;
      }
    }
    const activePoints = maxActiveIndex >= 0 ? points.slice(0, maxActiveIndex + 1) : [];
    const activePathD = activePoints.length > 1 ? generateSvgWindingPath(activePoints) : '';

    if (el.hafazniMapSvg) {
      el.hafazniMapSvg.setAttribute('viewBox', `0 0 ${V_WIDTH} ${totalHeight}`);
      el.hafazniMapSvg.setAttribute('preserveAspectRatio', 'none');
      el.hafazniMapSvg.innerHTML = `
        <defs>
          <linearGradient id="roadActiveGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#22c55e" />
            <stop offset="100%" stop-color="#3b82f6" />
          </linearGradient>
          <filter id="roadGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#22c55e" flood-opacity="0.35"/>
          </filter>
        </defs>
        ${fullPathD ? `<path d="${fullPathD}" stroke="var(--border)" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.85" />` : ''}
        ${fullPathD ? `<path d="${fullPathD}" stroke="var(--card-bg)" stroke-width="2.5" stroke-dasharray="6,6" stroke-linecap="round" fill="none" opacity="0.8" />` : ''}
        ${activePathD ? `<path d="${activePathD}" stroke="url(#roadActiveGrad)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none" filter="url(#roadGlow)" />` : ''}
      `;
    }

    const firstAvailableNode = nodes.find(n => getLessonStatus(n) === 'available') || null;
    const targetIndex = firstAvailableNode ? firstAvailableNode.index : (nodes[0] ? nodes[0].index : 0);

    el.hafazniLessonPath.innerHTML = nodes.map((node, idx) => {
      const status = getLessonStatus(node);
      const isTarget = node.index === targetIndex && status === 'available';
      const isCheckpoint = node.type === 'checkpoint';

      let label = '';
      if (status === 'completed') {
        label = '✓';
      } else if (status === 'locked') {
        label = '🔒';
      } else {
        label = isCheckpoint ? '🏆' : String(node.lessonNumber);
      }

      const pt = points[idx];
      const leftPercent = (pt.x / V_WIDTH) * 100;
      const topPx = pt.y;

      const tagHtml = isTarget
        ? `<span class="lesson-floating-tag">${isCheckpoint ? 'تقييم شامل 🏆' : 'الدرس الحالي 🎯'}</span>`
        : '';

      const nodeClasses = [
        'lesson-node',
        isCheckpoint ? 'checkpoint' : '',
        status,
        isTarget ? 'current-target' : ''
      ].filter(Boolean).join(' ');

      return `
        <div class="${nodeClasses}"
             data-node-id="${node.id}"
             data-node-index="${node.index}"
             style="left: ${leftPercent}%; top: ${topPx}px;"
             title="${node.title} (${node.words.length} كلمة) - ${status === 'completed' ? 'مكتمل' : (status === 'locked' ? 'مغلق (أتمم السابق لفتحه)' : 'متاح للبدء')}">
          ${tagHtml}
          <span class="node-num-icon">${label}</span>
          <span class="lesson-node-label">${node.title}</span>
        </div>
      `;
    }).join('');

    renderTodayWordsList(firstAvailableNode || nodes[0] || null);
  }

  function renderTodayWordsList(node) {
    if (!el.hafazniTodayWordsCard || !el.hafazniTodayWordsList) return;
    if (!node || !node.words || !node.words.length) {
      el.hafazniTodayWordsCard.style.display = 'none';
      el.hafazniTodayWordsList.innerHTML = '';
      return;
    }
    el.hafazniTodayWordsCard.style.display = 'block';
    const status = getLessonStatus(node);
    const statusLabel = status === 'completed' ? ' (مكتمل ✓)' : '';
    const isCheckpoint = node.type === 'checkpoint';

    el.hafazniTodayWordsTitle.textContent = isCheckpoint
      ? `🏆 كلمات التقييم الشامل (${node.words.length} كلمة)${statusLabel}`
      : `📋 كلمات الدرس ${node.lessonNumber}${statusLabel} (${node.words.length})`;

    if (el.startCurrentLessonDirectBtn) {
      el.startCurrentLessonDirectBtn.style.display = status === 'locked' ? 'none' : 'inline-block';
      el.startCurrentLessonDirectBtn.textContent = isCheckpoint ? '🏆 ابدأ التقييم الشامل' : `🚀 ابدأ الدرس ${node.lessonNumber}`;
      el.startCurrentLessonDirectBtn.dataset.nodeId = node.id;
      el.startCurrentLessonDirectBtn.dataset.nodeIndex = String(node.index);
    }

    el.hafazniTodayWordsList.innerHTML = '';
    const fragment = document.createDocumentFragment();
    node.words.forEach(w => {
      const li = document.createElement('li');
      const en = document.createElement('span');
      en.className = 'tw-en';
      en.textContent = w.english;
      const ar = document.createElement('span');
      ar.className = 'tw-ar';
      ar.textContent = w.arabic;
      li.appendChild(en);
      li.appendChild(ar);
      fragment.appendChild(li);
    });
    el.hafazniTodayWordsList.appendChild(fragment);
  }

  function startLesson(nodeIndexOrId) {
    const nodes = computeLessons();
    const node = typeof nodeIndexOrId === 'number'
      ? nodes[nodeIndexOrId]
      : nodes.find(n => n.id === nodeIndexOrId || String(n.index) === String(nodeIndexOrId));

    if (!node || !node.ids.length) return;
    if (getLessonStatus(node) === 'locked') {
      alert('🔒 هذا الدرس مقفل. أتمم الدرس السابق أولاً لتفتحه بالتسلسل.');
      return;
    }
    markUserActivity();
    state.hafazni.activeLessonId = node.id;
    state.hafazni.activeLessonIndex = node.index;
    initHafazniSession(node.ids);
  }

  function syncWizardPills() {
    const currentSize = String(state.hafazniLessons.lessonSize || 10);
    const currentCp = String(state.hafazniLessons.checkpointFrequency || 20);
    const currentTime = state.hafazniLessons.notificationTime || '20:00';

    if (el.wizardLessonSizeOptions) {
      el.wizardLessonSizeOptions.querySelectorAll('.wizard-pill-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.val === currentSize);
      });
    }

    if (el.wizardCheckpointOptions) {
      el.wizardCheckpointOptions.querySelectorAll('.wizard-pill-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.val === currentCp);
      });
    }

    if (el.wizardNotifTime) el.wizardNotifTime.value = currentTime;
    if (el.settingsNotifTime) el.settingsNotifTime.value = currentTime;

    document.querySelectorAll('.time-chip').forEach(chip => {
      chip.classList.toggle('active', chip.dataset.time === currentTime);
    });
  }

  // ==================== HAFazni Advanced Session ====================

  function initHafazniSession(ids) {
    const words = getWordsByIds(ids);
    if (!words.length) {
      alert('حدد كلمات أولًا من صفحة الكلمات.');
      return;
    }

    state.hafazni.active = true;
    if (hafazniSessionTimer) clearInterval(hafazniSessionTimer);
    hafazniSessionSeconds = 0;
    hafazniSessionTimer = setInterval(() => {
      if (state.hafazni.active) {
        state.studyTime.totalSeconds = (state.studyTime.totalSeconds || 0) + 1;
        state.studyTime.todaySeconds = (state.studyTime.todaySeconds || 0) + 1;
        hafazniSessionSeconds++;
        updateStreakAndStudyUI();
      }
    }, 1000);

    state.hafazni.sessionWords = words.map(w => ({
      id: w.id,
      attempts: 0,
      correct: 0,
      wrong: 0,
      consecutiveCorrect: 0,
      consecutiveWrong: 0,
      difficulty: 0,
      mastery: 0,
      lastShown: now(),
      nextReview: now(),
      lapses: 0,
      answered: false
    }));
    state.hafazni.currentIndex = 0;
    state.hafazni.totalWords = words.length;
    state.hafazni.mistakes = [];
    state.hafazni.processing = false;
    state.hafazni.summary = { correct: 0, wrong: 0, attempts: 0, mastered: [], needsReview: [] };

    if (el.hafazniTypeToggle) el.hafazniTypeToggle.style.display = 'none';
    if (el.hafazniLessonsCard) el.hafazniLessonsCard.style.display = 'none';
    if (el.hafazniSetupCard) el.hafazniSetupCard.style.display = 'none';
    if (el.hafazniSession) el.hafazniSession.style.display = 'block';
    if (el.hafazniSummary) el.hafazniSummary.style.display = 'none';

    updateHafazniOverview();
    renderHafazniQuestion();
  }

  function renderHafazniQuestion() {
    if (!state.hafazni.active) return;

    const session = state.hafazni;
    const words = session.sessionWords;

    // إذا وصلنا لنهاية القائمة
    if (session.currentIndex >= words.length) {
      finishHafazniSession();
      return;
    }

    // نحصل على الكلمة الحالية من الجلسة (مع البيانات المؤقتة)
    const sessionWord = words[session.currentIndex];
    if (!sessionWord) {
      session.currentIndex++;
      renderHafazniQuestion();
      return;
    }

    // نبحث عن الكلمة الأصلية للحصول على النصوص
    const originalWord = state.vocabulary.find(w => w.id === sessionWord.id);
    if (!originalWord) {
      session.currentIndex++;
      renderHafazniQuestion();
      return;
    }

    // تحديث شريط التقدم بناءً على عدد الكلمات المُتقَنة فعليًا من إجمالي الجلسة (وليس الطول المتغيّر للطابور)
    const total = session.totalWords || words.length;
    const done = Math.max(0, total - words.length);
    el.hafazniProgressText.textContent = `${done} / ${total}`;
    el.hafazniProgressBar.style.width = total ? `${(done / total) * 100}%` : '0%';

    // تحديد نوع السؤال: كتابة أو اختيار من متعدد
    // نعتمد فقط على مؤشرات تتراجع مع الأداء الجيد (difficulty يقل مع كل إجابة صحيحة،
    // consecutiveWrong يُصفَّر فور إجابة صحيحة) بدل الاعتماد على wrong التراكمي الذي لا ينخفض أبدًا
    // ويجعل الكلمة تُحبس في وضع الاختيارات للأبد حتى بعد إجابات صحيحة متتالية.
    const useChoice = sessionWord.attempts > 0 &&
      (sessionWord.difficulty > 4 || sessionWord.consecutiveWrong > 0);
    const questionType = useChoice ? 'choice' : 'writing';

    // عرض السؤال (المصدر)
    const source = getSourceWord(originalWord);
    const target = getTargetWord(originalWord);

    el.hafazniQuestion.textContent = source;
    el.hafazniQuestionTypeLabel.textContent = useChoice ? '🔘 اختر الترجمة الصحيحة' : '✍️ اكتب الترجمة';

    // إظهار/إخفاء عناصر الإدخال
    if (useChoice) {
      el.hafazniInput.style.display = 'none';
      el.hafazniOptionsGrid.style.display = 'grid';
      generateHafazniOptions(originalWord, target);
    } else {
      el.hafazniInput.style.display = 'block';
      el.hafazniOptionsGrid.style.display = 'none';
      el.hafazniInput.value = '';
      el.hafazniInput.className = '';
      el.hafazniInput.focus();
    }

    // عرض إحصائيات الكلمة
    el.hafazniWordStats.style.display = 'flex';
    el.hafazniAttempts.textContent = `المحاولات: ${sessionWord.attempts}`;
    const mastery = Math.min(100, Math.round((sessionWord.correct / Math.max(1, sessionWord.attempts)) * 100));
    el.hafazniMastery.textContent = `الإتقان: ${mastery}%`;

    // مسح الملاحظات السابقة
    el.hafazniFeedback.textContent = '';
    el.hafazniFeedback.className = 'test-feedback';

    // نطق السؤال إن كان إنجليزيًا
    if (originalWord.english && /[A-Za-z]/.test(originalWord.english)) {
      speak(originalWord.english);
    }

    // تحديث lastShown
    sessionWord.lastShown = now();
    sessionWord.answered = false;
    state.hafazni.processing = false;
    updateHafazniOverview();
  }

  function generateHafazniOptions(correctWord, correctAnswer) {
    const grid = el.hafazniOptionsGrid;
    grid.innerHTML = '';

    // نجمع خيارات من كلمات أخرى في الجلسة (أو من المفردات العامة)
    const allWords = state.vocabulary.filter(w => w.id !== correctWord.id);
    const distractors = allWords
      .map(w => getTargetWord(w))
      .filter(t => t !== correctAnswer)
      .sort(() => Math.random() - .5)
      .slice(0, 3);

    // نضمن 3 خيارات مختلفة
    const unique = [correctAnswer];
    for (const d of distractors) {
      if (!unique.includes(d) && unique.length < 4) unique.push(d);
    }
    while (unique.length < 4) {
      unique.push('?');
    }

    // خلط
    const shuffled = unique.sort(() => Math.random() - .5);

    shuffled.forEach(option => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'option-btn';
      btn.textContent = option;
      btn.addEventListener('click', () => handleHafazniChoice(option, correctAnswer, btn));
      grid.appendChild(btn);
    });
  }

  function handleHafazniChoice(selected, correctAnswer, btnElement) {
    if (state.hafazni.processing) return;
    const session = state.hafazni;
    if (!session.active) return;

    const sessionWord = session.sessionWords[session.currentIndex];
    if (!sessionWord || sessionWord.answered) return;

    state.hafazni.processing = true;
    sessionWord.answered = true;

    const isCorrect = normalizeString(selected) === normalizeString(correctAnswer);

    // تعطيل الأزرار وإظهار النتيجة
    const buttons = el.hafazniOptionsGrid.querySelectorAll('.option-btn');
    buttons.forEach(b => b.disabled = true);
    buttons.forEach(b => {
      if (normalizeString(b.textContent) === normalizeString(correctAnswer)) {
        b.classList.add('correct-choice');
      }
      if (b === btnElement && !isCorrect) {
        b.classList.add('wrong-choice');
      }
    });

    // تحديث إحصائيات الجلسة
    sessionWord.attempts++;
    session.summary.attempts++;
    if (isCorrect) {
      sessionWord.correct++;
      sessionWord.consecutiveCorrect++;
      sessionWord.consecutiveWrong = 0;
      session.summary.correct++;
    } else {
      sessionWord.wrong++;
      sessionWord.consecutiveWrong++;
      sessionWord.consecutiveCorrect = 0;
      session.summary.wrong++;
      session.mistakes.push(sessionWord.id);
    }

    // تحديث الصعوبة والإتقان
    const ratio = sessionWord.correct / Math.max(1, sessionWord.attempts);
    sessionWord.mastery = Math.min(100, Math.round(ratio * 100));
    sessionWord.difficulty = Math.min(10, Math.max(0, 
      sessionWord.difficulty + (isCorrect ? -0.5 : 1.5)
    ));

    // تحديث حالة الكلمة الأصلية (تأثير دائم)
    const originalWord = state.vocabulary.find(w => w.id === sessionWord.id);
    if (originalWord) {
      if (isCorrect) {
        originalWord.correctCount++;
        originalWord.status = originalWord.correctCount > 2 ? 'learned' : 'new';
        originalWord.interval = originalWord.interval > 0 ? Math.min(originalWord.interval * 1.5, 720) : 1;
      } else {
        originalWord.wrongCount++;
        originalWord.status = 'difficult';
        originalWord.interval = 0;
      }
      originalWord.lastReview = now();
      originalWord.due = now() + originalWord.interval * 3600000;
    }

    // عرض التغذية الراجعة
    el.hafazniFeedback.textContent = isCorrect ? '✅ إجابة صحيحة!' : `❌ الصحيح: ${correctAnswer}`;
    el.hafazniFeedback.className = 'test-feedback ' + (isCorrect ? 'correct' : 'wrong');

    // حفظ التقدم
    saveState(true);
    updateStats();

    // الانتقال إلى السؤال التالي بعد مهلة
    window.setTimeout(() => {
      // نحرك المؤشر إلى الأمام حسب الخوارزمية الذكية
      advanceHafazniIndex(isCorrect, sessionWord);
    }, 1200);
  }

  function checkHafazniWriting() {
    if (state.hafazni.processing) return;
    if (!state.hafazni.active) return;

    const session = state.hafazni;
    const sessionWord = session.sessionWords[session.currentIndex];
    if (!sessionWord || sessionWord.answered) return;

    const input = el.hafazniInput.value.trim();
    if (!input) {
      el.hafazniFeedback.textContent = '⚠️ اكتب الإجابة أولًا.';
      return;
    }

    const originalWord = state.vocabulary.find(w => w.id === sessionWord.id);
    if (!originalWord) return;

    const correctAnswer = getTargetWord(originalWord);
    const isCorrect = normalizeString(input) === normalizeString(correctAnswer);

    state.hafazni.processing = true;
    sessionWord.answered = true;

    // تحديث المظهر
    el.hafazniInput.className = isCorrect ? 'correct' : 'wrong';

    // تحديث إحصائيات الجلسة
    sessionWord.attempts++;
    session.summary.attempts++;
    if (isCorrect) {
      sessionWord.correct++;
      sessionWord.consecutiveCorrect++;
      sessionWord.consecutiveWrong = 0;
      session.summary.correct++;
    } else {
      sessionWord.wrong++;
      sessionWord.consecutiveWrong++;
      sessionWord.consecutiveCorrect = 0;
      session.summary.wrong++;
      session.mistakes.push(sessionWord.id);
    }

    // تحديث الصعوبة والإتقان
    const ratio = sessionWord.correct / Math.max(1, sessionWord.attempts);
    sessionWord.mastery = Math.min(100, Math.round(ratio * 100));
    sessionWord.difficulty = Math.min(10, Math.max(0, 
      sessionWord.difficulty + (isCorrect ? -0.5 : 1.5)
    ));

    // تحديث الكلمة الأصلية
    if (originalWord) {
      if (isCorrect) {
        originalWord.correctCount++;
        originalWord.status = originalWord.correctCount > 2 ? 'learned' : 'new';
        originalWord.interval = originalWord.interval > 0 ? Math.min(originalWord.interval * 1.5, 720) : 1;
      } else {
        originalWord.wrongCount++;
        originalWord.status = 'difficult';
        originalWord.interval = 0;
      }
      originalWord.lastReview = now();
      originalWord.due = now() + originalWord.interval * 3600000;
    }

    el.hafazniFeedback.textContent = isCorrect ? '✅ إجابة صحيحة!' : `❌ الصحيح: ${correctAnswer}`;
    el.hafazniFeedback.className = 'test-feedback ' + (isCorrect ? 'correct' : 'wrong');

    saveState(true);
    updateStats();

    window.setTimeout(() => {
      advanceHafazniIndex(isCorrect, sessionWord);
    }, 1200);
  }

  function advanceHafazniIndex(isCorrect, sessionWord) {
    const session = state.hafazni;
    if (!session.active) return;

    // خوارزمية التكرار المتباعد البسيطة:
    // إذا كانت الإجابة صحيحة وتجاوز الإتقان 80%، ننقل الكلمة إلى قائمة "متقنة" ونقلل من ظهورها.
    // إذا كانت خاطئة، نرفع أولويتها بإعادتها إلى المؤشر الحالي أو قريبًا.
    // نستخدم نظام الأولويات: نعيد ترتيب القائمة بحيث تظهر الكلمات الصعبة أكثر.

    const words = session.sessionWords;
    const currentIdx = session.currentIndex;

    // نزيل الكلمة الحالية من موضعها (سنقرر إن كانت تتخرّج نهائيًا من الجلسة أو تُعاد للطابور)
    const removed = words.splice(currentIdx, 1)[0];

    if (isCorrect && removed.mastery >= 80 && removed.attempts >= 3) {
      // الكلمة أُتقنت فعليًا: تخرج نهائيًا من طابور المراجعة النشط لهذه الجلسة.
      // لا تتم إعادتها إلى القائمة إطلاقًا — لو أُعيدت (حتى لآخر القائمة) لن يتغيّر
      // طول sessionWords أبدًا، ولن تنتهي الجلسة مهما أجاب المستخدم بشكل صحيح.
      session.summary.mastered.push(removed.id);
    } else if (!isCorrect || removed.mastery < 50) {
      // الكلمة صعبة: نضعها في موضع قريب لمراجعتها قريبًا
      // نضعها بعد 2-3 كلمات من الموضع الحالي
      const insertPos = Math.min(currentIdx + 2 + Math.floor(Math.random() * 2), words.length);
      words.splice(insertPos, 0, removed);
      // نسجلها كخطأ للمراجعة
      if (!session.mistakes.includes(removed.id)) session.mistakes.push(removed.id);
    } else {
      // متوسطة: نضعها في المنتصف
      const insertPos = Math.min(currentIdx + Math.floor(words.length / 3), words.length);
      words.splice(insertPos, 0, removed);
    }

    // تحديث المؤشر ليشير إلى الكلمة التالية (الموجودة الآن في نفس المؤشر بعد إزالة الكلمة الحالية)
    session.currentIndex = Math.min(currentIdx, Math.max(0, words.length - 1));

    // القائمة فارغة (كل الكلمات تخرّجت) => انتهت الجلسة فعليًا
    if (words.length === 0) {
      finishHafazniSession();
    } else {
      renderHafazniQuestion();
      updateHafazniOverview();
    }
  }

  function finishHafazniSession() {
    state.hafazni.active = false;
    state.hafazni.processing = false;
    if (hafazniSessionTimer) {
      clearInterval(hafazniSessionTimer);
      hafazniSessionTimer = null;
    }
    el.hafazniSession.style.display = 'none';

    // تسجيل نشاط الحفظ والستريك اليومي بنجاح
    recordHafazniStudyActivity(true);

    // لو الجلسة دي كانت درسًا أو محطة من خريطة الدروس، نعلّمها مكتملة ونجهّز اقتراح "الدرس التالي"
    const completedLessonId = state.hafazni.activeLessonId;
    const completedLessonIndex = state.hafazni.activeLessonIndex;
    state.hafazni.activeLessonId = null;
    state.hafazni.activeLessonIndex = null;

    if (completedLessonId !== null && completedLessonId !== undefined) {
      if (!state.hafazniLessons.completedLessonIds.includes(completedLessonId)) {
        state.hafazniLessons.completedLessonIds.push(completedLessonId);
      }
      if (completedLessonIndex !== null && completedLessonIndex !== undefined && !state.hafazniLessons.completedLessonIds.includes(String(completedLessonIndex))) {
        state.hafazniLessons.completedLessonIds.push(String(completedLessonIndex));
      }

      // إطلاق تأثير الاحتفال (Confetti) عند إتمام الدرس
      triggerConfetti();

      const nodes = computeLessons();
      const nextIndex = (completedLessonIndex !== null && completedLessonIndex !== undefined)
        ? completedLessonIndex + 1
        : nodes.findIndex(n => n.id === completedLessonId) + 1;

      const nextNode = nodes[nextIndex];
      const nextAvailable = nextNode && getLessonStatus(nextNode) !== 'locked';

      const currentCompletedNode = nodes.find(n => n.id === completedLessonId || n.index === completedLessonIndex);
      el.completedLessonNumber.textContent = currentCompletedNode ? currentCompletedNode.title : 'الدرس';
      el.lessonCompleteNote.style.display = 'block';

      if (nextAvailable) {
        el.nextLessonBtn.style.display = 'block';
        el.nextLessonBtn.textContent = nextNode.type === 'checkpoint' ? '🏆 الانتقال للتقييم الشامل التالي' : `الانتقال إلى ${nextNode.title} 🚀`;
        el.nextLessonBtn.dataset.nextNodeId = nextNode.id;
        el.nextLessonBtn.dataset.nextNodeIndex = String(nextNode.index);
      } else {
        el.nextLessonBtn.style.display = 'none';
      }
    } else {
      el.lessonCompleteNote.style.display = 'none';
      el.nextLessonBtn.style.display = 'none';
    }

    // عرض الملخص
    const summary = state.hafazni.summary;
    const totalAttempts = summary.attempts || 1;
    const correct = summary.correct;
    const wrong = summary.wrong;
    const rate = Math.round((correct / totalAttempts) * 100);

    el.summaryCorrect.textContent = correct;
    el.summaryWrong.textContent = wrong;
    el.summaryRate.textContent = rate + '%';
    el.summaryAttempts.textContent = totalAttempts;

    // احتفال الستريك ووقت الجلسة
    if (el.summaryStreakText) {
      const count = state.streak.current || 1;
      el.summaryStreakText.textContent = `ستريك: ${count} ${count > 2 ? 'أيام متتالية' : (count === 2 ? 'يومان متتاليان' : 'يوم')} 🔥`;
    }
    if (el.summarySessionTimeText) {
      el.summarySessionTimeText.textContent = `وقت الجلسة: ${formatStudyDuration(hafazniSessionSeconds)}`;
    }

    // الكلمات المتقنة والمحتاجة مراجعة
    const masteredCount = state.hafazni.summary.mastered.length;
    const needsReviewCount = state.hafazni.mistakes.length;
    el.summaryMastered.textContent = masteredCount;
    el.summaryNeedsReview.textContent = needsReviewCount;
    el.summaryMistakes.textContent = wrong;

    // شاشة النتيجة تظهر دايمًا إجباريًا عند انتهاء أي درس أو جلسة، بدون استثناء
    if (el.hafazniSummary) el.hafazniSummary.style.display = 'block';
    if (el.hafazniTypeToggle) el.hafazniTypeToggle.style.display = 'flex';
    if (el.hafazniLessonsCard) el.hafazniLessonsCard.style.display = state.hafazniTab === 'lessons' ? 'block' : 'none';
    if (el.hafazniSetupCard) el.hafazniSetupCard.style.display = state.hafazniTab === 'custom' ? 'block' : 'none';
    updateHafazniOverview();
    updateAllViews();
  }

  function reviewHafazniMistakes() {
    if (!state.hafazni.mistakes.length) {
      alert('لا توجد أخطاء في آخر جلسة.');
      return;
    }
    // بدء جلسة جديدة بالأخطاء فقط
    const mistakeIds = state.hafazni.mistakes;
    // نعيد ضبط قائمة الأخطاء بعد بدء الجلسة
    state.hafazni.mistakes = [];
    state.hafazni.activeLessonId = null; // جلسة مراجعة أخطاء، مش درس من الخريطة
    initHafazniSession(mistakeIds);
  }

  function stopHafazni() {
    state.hafazni.active = false;
    state.hafazni.processing = false;
    if (hafazniSessionTimer) {
      clearInterval(hafazniSessionTimer);
      hafazniSessionTimer = null;
    }
    recordHafazniStudyActivity(false);
    state.hafazni.activeLessonId = null; // إيقاف يدوي: الدرس (لو كان موجود) لا يُعتبر مكتملًا
    if (el.hafazniSession) el.hafazniSession.style.display = 'none';
    if (el.hafazniSummary) el.hafazniSummary.style.display = 'none';
    if (el.hafazniTypeToggle) el.hafazniTypeToggle.style.display = 'flex';
    if (el.hafazniLessonsCard) el.hafazniLessonsCard.style.display = state.hafazniTab === 'lessons' ? 'block' : 'none';
    if (el.hafazniSetupCard) el.hafazniSetupCard.style.display = state.hafazniTab === 'custom' ? 'block' : 'none';
    updateHafazniOverview();
  }

  // ==================== باقي الوظائف والتصدير (v1.5.2) ====================

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function exportWordsToPDF(mode = 'all') {
    const isDifficultOnly = mode === 'difficult';
    const words = isDifficultOnly
      ? state.vocabulary.filter(w => w.status === 'difficult')
      : state.vocabulary;

    if (!words.length) {
      alert(isDifficultOnly ? '⚠️ لا توجد كلمات صعبة حالياً للتصدير.' : '⚠️ لا توجد كلمات للتصدير.');
      return;
    }

    const title = isDifficultOnly ? 'قائمة الكلمات الصعبة للمراجعة' : 'قائمة الكلمات الكاملة';
    const dateStr = new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });

    const rowsHtml = words.map((w, i) => {
      const statusLabel = w.status === 'learned' ? '✅ محفوظة' : (w.status === 'difficult' ? '🔴 صعبة' : '📝 جديدة');
      const cat = escapeHtml(w.category || 'عام');
      return `
        <tr>
          <td style="text-align: center; color: #64748b; width: 40px;">${i + 1}</td>
          <td style="font-weight: 600; direction: ltr; text-align: left; font-size: 15px; color: #0f172a;">${escapeHtml(w.english)}</td>
          <td style="direction: rtl; text-align: right; font-size: 15px; color: #1e293b;">${escapeHtml(w.arabic)}</td>
          <td style="text-align: center; font-size: 13px; color: #475569;"><span style="background: #f1f5f9; padding: 3px 8px; border-radius: 6px;">${cat}</span></td>
          <td style="text-align: center; font-size: 13px;">${statusLabel}</td>
        </tr>
      `;
    }).join('');

    const printHtml = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>${escapeHtml(title)} - Flashcards v${APP_VERSION}</title>
        <style>
          @page { size: A4; margin: 15mm; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans Arabic', Tahoma, sans-serif;
            color: #0f172a;
            background: #fff;
            margin: 0;
            padding: 20px;
            direction: rtl;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 16px;
            margin-bottom: 20px;
          }
          .header h1 {
            margin: 0 0 6px 0;
            font-size: 24px;
            color: #1e293b;
          }
          .header .meta {
            font-size: 13px;
            color: #64748b;
            display: flex;
            justify-content: center;
            gap: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          th {
            background-color: #f8fafc;
            color: #334155;
            font-size: 13px;
            font-weight: 700;
            padding: 10px 12px;
            border: 1px solid #cbd5e1;
            text-align: center;
          }
          td {
            padding: 9px 12px;
            border: 1px solid #e2e8f0;
            vertical-align: middle;
          }
          tr:nth-child(even) {
            background-color: #f8fafc;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #94a3b8;
            border-top: 1px solid #e2e8f0;
            padding-top: 10px;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📖 ${escapeHtml(title)}</h1>
          <div class="meta">
            <span>📅 التاريخ: ${dateStr}</span>
            <span>📊 إجمالي الكلمات: ${words.length}</span>
            <span>⚡ تطبيق Flashcards v${APP_VERSION}</span>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th style="text-align: left;">English Word</th>
              <th style="text-align: right;">الترجمة العربية</th>
              <th>التصنيف</th>
              <th>الحالة</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        <div class="footer">
          تم إنشاء هذا الملف عبر تطبيق Flashcards للمراجعة الورقية والطباعة
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentDocument || printFrame.contentWindow?.document;
    if (frameDoc) {
      frameDoc.open();
      frameDoc.write(printHtml);
      frameDoc.close();
      setTimeout(() => {
        try {
          printFrame.remove();
        } catch (_) {}
      }, 60000);
    }
  }

  let confettiAnimId = null;
  function triggerConfetti() {
    const canvas = el.confettiCanvas || document.getElementById('confettiCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (confettiAnimId) {
      cancelAnimationFrame(confettiAnimId);
      confettiAnimId = null;
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    canvas.style.display = 'block';

    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#eab308'];
    const count = 120;
    const particles = [];

    for (let i = 0; i < count; i++) {
      particles.push({
        x: width / 2 + (Math.random() * 200 - 100),
        y: height * 0.4 + (Math.random() * 100 - 50),
        vx: (Math.random() - 0.5) * 16,
        vy: (Math.random() - 0.8) * 18 - 4,
        size: Math.random() * 8 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12,
        gravity: 0.35,
        drag: 0.98,
        opacity: 1
      });
    }

    const startTime = Date.now();
    const duration = 3500;

    function renderConfetti() {
      const elapsed = Date.now() - startTime;
      if (elapsed > duration) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.style.display = 'none';
        confettiAnimId = null;
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.vx *= p.drag;
        p.vy = (p.vy + p.gravity) * p.drag;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;

        if (elapsed > duration * 0.7) {
          p.opacity = Math.max(0, (duration - elapsed) / (duration * 0.3));
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      }

      confettiAnimId = requestAnimationFrame(renderConfetti);
    }

    confettiAnimId = requestAnimationFrame(renderConfetti);
  }

  function downloadTextWords() {
    if (!state.vocabulary.length) {
      alert('لا توجد كلمات لتنزيلها.');
      return;
    }
    const lines = state.vocabulary.map(w => `${w.english}, ${w.arabic}`).join('\n');
    downloadBlob(lines, 'words.txt', 'text/plain;charset=utf-8');
  }

  function exportBackup() {
    const backup = {
      app: 'Flashcards',
      version: APP_VERSION,
      exportedAt: new Date().toISOString(),
      data: buildPersistedState()
    };
    downloadBlob(JSON.stringify(backup, null, 2), `flashcards-backup-${APP_VERSION}.json`, 'application/json;charset=utf-8');
  }

  async function importBackup(file) {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const data = parsed.data || parsed;

      if (!data || !Array.isArray(data.vocabulary)) {
        throw new Error('Invalid backup');
      }

      state.vocabulary = normalizeVocabulary(data.vocabulary);
      state.currentIndex = Math.max(0, safeNumber(data.currentIndex, 0));
      state.studyFilter = ['all','due','difficult'].includes(data.studyFilter) ? data.studyFilter : 'all';
      state.direction = data.direction === 'ar-en' ? 'ar-en' : 'en-ar';
      state.dark = Boolean(data.dark);
      state.testSubMode = ['writing','choice','voice'].includes(data.testSubMode) ? data.testSubMode : 'writing';
      state.selectedIds = Array.isArray(data.selectedIds)
        ? data.selectedIds.map(String).filter(id => state.vocabulary.some(w => w.id === id))
        : state.vocabulary.filter(w => w.selected).map(w => w.id);
      state.vocabulary.forEach(w => w.selected = state.selectedIds.includes(w.id));

      applyTheme();
      applyDirectionUI();
      updateTestModeUI();
      saveState(true);
      updateAllViews();
      alert(`✅ تم استرجاع ${state.vocabulary.length} كلمة.`);
    } catch (error) {
      console.error(error);
      alert('❌ ملف النسخة الاحتياطية غير صالح.');
    }
  }

  function downloadBlob(content, name, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function resetProgress() {
    if (!state.vocabulary.length) return;
    if (!confirm('إعادة كل الكلمات إلى "جديدة"؟')) return;

    state.vocabulary.forEach(w => {
      w.status = 'new';
      w.interval = 0;
      w.lastReview = null;
      w.due = now();
      w.correctCount = 0;
      w.wrongCount = 0;
    });
    state.currentIndex = 0;
    state.studyFilter = 'all';
    state.hafazniLessons.completedLessonIds = [];
    state.hafazniLessons.dailyUnlockedCount = 1;
    state.hafazniLessons.lastUnlockDate = null;
    saveState(true);
    updateAllViews();
  }

  function resetAll() {
    if (!state.vocabulary.length) return;
    if (!confirm('سيتم حذف كل الكلمات والتقدم من هذا المتصفح. هل أنت متأكد؟')) return;

    state.vocabulary = [];
    state.currentIndex = 0;
    state.selectedIds = [];
    state.studyFilter = 'all';
    state.hafazni = { active: false, sessionWords: [], currentIndex: 0, totalWords: 0, activeLessonId: null, mistakes: [], processing: false, summary: { correct: 0, wrong: 0, attempts: 0, mastered: [], needsReview: [] } };
    state.hafazniLessons = { mode: 'manual', lessonSize: 10, completedLessonIds: [], dailyUnlockedCount: 1, lastUnlockDate: null };
    el.hafazniSession.style.display = 'none';
    el.hafazniSummary.style.display = 'none';
    el.hafazniLessonsCard.style.display = 'block';
    el.hafazniSetupCard.style.display = 'block';
    storageSet(STORAGE_KEY, buildPersistedState());
    updateAllViews();
    navigateTo('homePage');
  }

  function updateAllViews() {
    updateStats();
    updateStudyView();
    updateTestView();
    renderWordList(state.search);
    updateSelectionUI();
    updateHafazniOverview();
  }

  function openModal(modal) { if (modal) modal.style.display = 'flex'; }
  function closeModal(modal) { if (modal) modal.style.display = 'none'; }

  function showUpdateIfNeeded() {
    const seen = storageGet(UPDATE_KEY);
    if (seen !== APP_VERSION) {
      openModal(el.updateModal);
      try { localStorage.setItem(UPDATE_KEY, APP_VERSION); } catch (_) {}
    }
  }

  async function setupFeedbackForm() {
    if (!el.feedbackForm || feedbackBound) return;
    feedbackBound = true;

    el.feedbackForm.addEventListener('submit', async event => {
      event.preventDefault();
      el.feedbackSuccess.style.display = 'none';
      el.feedbackError.style.display = 'none';

      const button = el.feedbackForm.querySelector('button[type="submit"]');
      const original = button.textContent;
      button.disabled = true;
      button.textContent = '⏳ جارٍ الإرسال...';

      try {
        const response = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          body: new FormData(el.feedbackForm),
          headers: { Accept: 'application/json' }
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Submission failed');
        }

        el.feedbackSuccess.textContent = '✅ تم إرسال رأيك بنجاح. شكرًا لك!';
        el.feedbackSuccess.style.display = 'block';
        el.feedbackForm.reset();
      } catch (error) {
        console.error(error);
        el.feedbackError.textContent = '❌ تعذر الإرسال. هذه الميزة تحتاج اتصالًا بالإنترنت.';
        el.feedbackError.style.display = 'block';
      } finally {
        button.disabled = false;
        button.textContent = original;
      }
    });
  }

  function setupEvents() {
    document.querySelectorAll('.nav-btn[data-page]').forEach(btn => {
      btn.addEventListener('click', () => navigateTo(btn.dataset.page));
    });

    document.querySelectorAll('[data-action="navigate"]').forEach(btn => {
      btn.addEventListener('click', () => navigateTo(btn.dataset.page));
    });

    el.fileInput.addEventListener('change', event => {
      const file = event.target.files?.[0];
      if (file) importTextFile(file);
      event.target.value = '';
    });

    el.uploadArea.addEventListener('dragover', event => {
      event.preventDefault();
      el.uploadArea.classList.add('dragover');
    });

    el.uploadArea.addEventListener('dragleave', () => el.uploadArea.classList.remove('dragover'));

    el.uploadArea.addEventListener('drop', event => {
      event.preventDefault();
      el.uploadArea.classList.remove('dragover');
      const file = event.dataTransfer.files?.[0];
      if (file) importTextFile(file);
    });

    el.flashcard.addEventListener('click', event => {
      if (event.target.closest('.pronounce-btn')) return;
      flipStudyCard();
    });
    el.flashcard.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        flipStudyCard();
      }
    });

    el.flipBtn.addEventListener('click', flipStudyCard);
    el.prevBtn.addEventListener('click', () => {
      if (state.testLocked) return;
      moveStudy(-1);
    });
    el.nextBtn.addEventListener('click', () => {
      if (state.testLocked) return;
      moveStudy(1);
    });

    el.pronounceBtn.addEventListener('click', event => {
      event.stopPropagation();
      const word = getCurrentStudyWord();
      if (word) speak(word.english);
    });

    el.testPronounceBtn.addEventListener('click', event => {
      event.stopPropagation();
      const word = state.assessment?.active ? state.assessment.words[state.assessment.currentIndex] : getCurrentStudyWord();
      if (word) speak(word.english);
    });

    el.checkBtn.addEventListener('click', () => {
      if (state.assessment?.active) {
        checkAssessmentWriting();
      } else {
        checkWriting();
      }
    });

    el.hintBtn.addEventListener('click', () => {
      if (state.assessment?.active) {
        showAssessmentHint();
      } else {
        showHint();
      }
    });

    el.skipBtn.addEventListener('click', () => {
      if (state.assessment?.active) {
        skipAssessmentQuestion();
      } else {
        if (state.testLocked) return;
        moveStudy(1);
      }
    });

    el.exitAssessmentBtn?.addEventListener('click', cancelAssessment);
    el.tabComprehensiveBtn?.addEventListener('click', () => switchAssessmentTab('comprehensive'));
    el.tabFinalBtn?.addEventListener('click', () => switchAssessmentTab('final'));
    el.tabPracticeBtn?.addEventListener('click', () => switchAssessmentTab('practice'));
    el.tabReviewListBtn?.addEventListener('click', () => switchAssessmentTab('review'));

    el.retryMistakesBtn?.addEventListener('click', startMistakesReviewAssessment);
    el.restartAssessmentBtn?.addEventListener('click', restartAssessment);
    el.goToReviewListBtn?.addEventListener('click', () => switchAssessmentTab('review'));
    el.goToHomeFromTestBtn?.addEventListener('click', () => navigateTo('homePage'));
    el.startReviewFromListBtn?.addEventListener('click', () => startReviewListAssessment());
    el.clearReviewListBtn?.addEventListener('click', clearReviewList);

    el.markDifficultBtn.addEventListener('click', markCurrentDifficult);
    el.recordBtn.addEventListener('click', () => recognition ? stopRecognition() : startVoiceTest());

    el.typeWritingBtn.addEventListener('click', () => {
      state.testSubMode = 'writing';
      updateTestModeUI();
      resetTestUI();
      updateTestView();
      saveState();
    });
    el.typeChoiceBtn.addEventListener('click', () => {
      state.testSubMode = 'choice';
      updateTestModeUI();
      resetTestUI();
      updateTestView();
      saveState();
    });
    el.typeVoiceBtn.addEventListener('click', () => {
      state.testSubMode = 'voice';
      updateTestModeUI();
      resetTestUI();
      updateTestView();
      saveState();
    });

    el.enToArBtn.addEventListener('click', () => {
      state.direction = 'en-ar';
      applyDirectionUI();
      updateAllViews();
      saveState();
    });
    el.arToEnBtn.addEventListener('click', () => {
      state.direction = 'ar-en';
      applyDirectionUI();
      updateAllViews();
      saveState();
    });

    el.darkToggleBtn.addEventListener('click', () => {
      state.dark = !state.dark;
      applyTheme();
      saveState();
    });

    el.shuffleBtn.addEventListener('click', shuffleVocabulary);
    el.focusDifficultBtn.addEventListener('click', () => setStudyFilter('difficult'));
    el.dueReviewBtn.addEventListener('click', () => setStudyFilter('due'));

    el.newEnglish.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        addWord();
      }
    });
    el.newArabic.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        addWord();
      }
    });

    el.addWordBtn.addEventListener('click', addWord);

    el.importTextBtn.addEventListener('click', () => el.textImportInput.click());
    el.textImportInput.addEventListener('change', event => {
      const file = event.target.files?.[0];
      if (file) importTextFile(file);
      event.target.value = '';
    });

    el.exportBackupBtn.addEventListener('click', exportBackup);
    el.importBackupBtn.addEventListener('click', () => el.backupInput.click());
    el.backupInput.addEventListener('change', event => {
      const file = event.target.files?.[0];
      if (file) importBackup(file);
      event.target.value = '';
    });

    el.selectAllBtn.addEventListener('click', selectAll);
    el.clearSelectionBtn.addEventListener('click', clearSelection);
    el.sendToHafazniBtn.addEventListener('click', goToHafazni);
    el.downloadWordsBtn.addEventListener('click', () => {
      openModal(el.exportWordsModal);
    });
    el.closeExportWordsModal?.addEventListener('click', () => {
      closeModal(el.exportWordsModal);
    });
    el.exportPdfAllBtn?.addEventListener('click', () => {
      closeModal(el.exportWordsModal);
      exportWordsToPDF('all');
    });
    el.exportPdfDifficultBtn?.addEventListener('click', () => {
      closeModal(el.exportWordsModal);
      exportWordsToPDF('difficult');
    });
    el.exportTxtBtn?.addEventListener('click', () => {
      closeModal(el.exportWordsModal);
      downloadTextWords();
    });
    el.resetProgressBtn.addEventListener('click', resetProgress);
    el.resetBtn.addEventListener('click', resetAll);

    el.searchInput.addEventListener('input', event => {
      state.search = event.target.value;
      renderWordList(state.search);
    });

    el.startHafazniBtn.addEventListener('click', () => {
      if (!state.selectedIds.length) {
        alert('حدد كلمات أولاً من صفحة الكلمات.');
        return;
      }
      state.hafazni.activeLessonId = null; // جلسة مخصصة حرة، مش درس من الخريطة
      initHafazniSession(state.selectedIds);
    });

    document.querySelectorAll('[data-hafazni-mode]').forEach(btn => {
      btn.addEventListener('click', () => setHafazniMode(btn.dataset.hafazniMode));
    });
    el.hafazniLessonPath.addEventListener('click', event => {
      const node = event.target.closest('.lesson-node');
      if (!node) return;
      const target = node.dataset.nodeId || Number(node.dataset.nodeIndex);
      const nodes = computeLessons();
      const nodeData = nodes.find(n => n.id === target || n.index === Number(target));
      if (!nodeData) return;

      const status = getLessonStatus(nodeData);
      if (status === 'locked') {
        alert('🔒 هذا الدرس مقفل. أتمم الدرس السابق لفتحه.');
        return;
      }

      renderTodayWordsList(nodeData);
      startLesson(nodeData.id);
    });

    el.nextLessonBtn.addEventListener('click', () => {
      const target = el.nextLessonBtn.dataset.nextNodeId || Number(el.nextLessonBtn.dataset.nextNodeIndex);
      el.hafazniSummary.style.display = 'none';
      startLesson(target);
    });

    // معالج إنشاء المسار وخيارات التخصيص
    if (el.wizardLessonSizeOptions) {
      el.wizardLessonSizeOptions.addEventListener('click', event => {
        const btn = event.target.closest('.wizard-pill-btn');
        if (!btn) return;
        el.wizardLessonSizeOptions.querySelectorAll('.wizard-pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    }

    if (el.wizardCheckpointOptions) {
      el.wizardCheckpointOptions.addEventListener('click', event => {
        const btn = event.target.closest('.wizard-pill-btn');
        if (!btn) return;
        el.wizardCheckpointOptions.querySelectorAll('.wizard-pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    }

    // شرائح التوقيت السريعة
    document.querySelectorAll('.time-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const selectedTime = chip.dataset.time;
        if (!selectedTime) return;
        state.notifications.time = selectedTime;
        state.hafazniLessons.notificationTime = selectedTime;
        if (el.wizardNotifTime) el.wizardNotifTime.value = selectedTime;
        if (el.settingsNotifTime) el.settingsNotifTime.value = selectedTime;
        document.querySelectorAll('.time-chip').forEach(c => c.classList.toggle('active', c.dataset.time === selectedTime));
        saveState();
        updateNotificationUI();
      });
    });

    const handleTimeInputChange = (e) => {
      const val = e.target.value;
      if (!val) return;
      state.notifications.time = val;
      state.hafazniLessons.notificationTime = val;
      if (el.wizardNotifTime) el.wizardNotifTime.value = val;
      if (el.settingsNotifTime) el.settingsNotifTime.value = val;
      document.querySelectorAll('.time-chip').forEach(c => c.classList.toggle('active', c.dataset.time === val));
      saveState();
      updateNotificationUI();
    };

    if (el.wizardNotifTime) el.wizardNotifTime.addEventListener('change', handleTimeInputChange);
    if (el.settingsNotifTime) el.settingsNotifTime.addEventListener('change', handleTimeInputChange);

    if (el.generatePathBtn) {
      el.generatePathBtn.addEventListener('click', () => {
        const sizeBtn = el.wizardLessonSizeOptions?.querySelector('.wizard-pill-btn.active');
        const cpBtn = el.wizardCheckpointOptions?.querySelector('.wizard-pill-btn.active');
        const timeVal = el.wizardNotifTime?.value || '20:00';

        const size = sizeBtn ? safeNumber(sizeBtn.dataset.val, 10) : 10;
        const cpFreq = cpBtn ? safeNumber(cpBtn.dataset.val, 20) : 20;

        // توليد معرّف مسار جديد لضمان استقلالية دروس المسار الجديد تماماً
        state.hafazniLessons.pathId = 'path_' + uid();
        state.hafazniLessons.lessonSize = size;
        state.hafazniLessons.checkpointFrequency = cpFreq;
        state.hafazniLessons.notificationTime = timeVal;
        state.notifications.time = timeVal;
        state.hafazniLessons.pathCreated = true;
        state.hafazniLessons.completedLessonIds = [];

        saveState(true);
        updateAllViews();
        renderLessonMap();

        if (isNotificationSupported() && Notification.permission === 'default') {
          requestNotificationPermission();
        }
      });
    }

    if (el.hafazniReconfigureBtn) {
      el.hafazniReconfigureBtn.addEventListener('click', () => {
        if (el.hafazniPathWizardBox) el.hafazniPathWizardBox.style.display = 'block';
        if (el.hafazniPathActiveView) el.hafazniPathActiveView.style.display = 'none';
        if (el.cancelWizardBtn) el.cancelWizardBtn.style.display = 'inline-block';
        syncWizardPills();
      });
    }

    if (el.cancelWizardBtn) {
      el.cancelWizardBtn.addEventListener('click', () => {
        if (state.hafazniLessons.pathCreated) {
          if (el.hafazniPathWizardBox) el.hafazniPathWizardBox.style.display = 'none';
          if (el.hafazniPathActiveView) el.hafazniPathActiveView.style.display = 'block';
        }
      });
    }

    // كلمة اليوم (Word of the Day)
    if (el.wotdRefreshBtn) {
      el.wotdRefreshBtn.addEventListener('click', () => {
        renderWordOfTheDay(true);
      });
    }

    if (el.wotdPronounceBtn) {
      el.wotdPronounceBtn.addEventListener('click', () => {
        const w = getWordOfTheDay();
        if (w) speak(w.english);
      });
    }

    if (el.wotdStudyBtn) {
      el.wotdStudyBtn.addEventListener('click', () => {
        const w = getWordOfTheDay();
        if (w) {
          const idx = state.vocabulary.findIndex(item => item.id === w.id);
          if (idx >= 0) {
            state.studyFilter = 'all';
            state.currentIndex = idx;
            updateStudyView();
          }
        }
        navigateTo('studyPage');
      });
    }

    if (el.wotdTestBtn) {
      el.wotdTestBtn.addEventListener('click', () => {
        const w = getWordOfTheDay();
        if (w) {
          const idx = state.vocabulary.findIndex(item => item.id === w.id);
          if (idx >= 0) {
            state.studyFilter = 'all';
            state.currentIndex = idx;
            updateTestView();
          }
        }
        navigateTo('testPage');
      });
    }

    if (el.wotdLearnedBtn) {
      el.wotdLearnedBtn.addEventListener('click', () => {
        const w = getWordOfTheDay();
        if (!w) return;
        w.status = w.status === 'learned' ? 'new' : 'learned';
        if (w.status === 'learned') {
          w.correctCount = (w.correctCount || 0) + 1;
        }
        saveState(true);
        updateStats();
        renderWordOfTheDay();
        renderWordList(state.search);
      });
    }

    el.reviewMistakesBtn.addEventListener('click', reviewHafazniMistakes);
    el.hafazniSpeakBtn.addEventListener('click', () => {
      const session = state.hafazni;
      if (!session.active) return;
      const sessionWord = session.sessionWords[session.currentIndex];
      if (!sessionWord) return;
      const originalWord = state.vocabulary.find(w => w.id === sessionWord.id);
      if (originalWord) speak(originalWord.english);
    });

    el.hafazniCheckBtn.addEventListener('click', checkHafazniWriting);
    el.hafazniSkipBtn.addEventListener('click', () => {
      if (state.hafazni.processing) return;
      if (!state.hafazni.active) return;
      // نعد الكلمة كخطأ لتظهر مجددًا
      const session = state.hafazni;
      const sessionWord = session.sessionWords[session.currentIndex];
      if (sessionWord) {
        sessionWord.wrong++;
        session.summary.wrong++;
        session.mistakes.push(sessionWord.id);
        // نقلها للتكرار
        const words = session.sessionWords;
        const removed = words.splice(session.currentIndex, 1)[0];
        const insertPos = Math.min(session.currentIndex + 1, words.length);
        words.splice(insertPos, 0, removed);
        // حفظ التقدم
        saveState(true);
        updateStats();
      }
      renderHafazniQuestion();
      updateHafazniOverview();
    });

    el.hafazniStopBtn.addEventListener('click', stopHafazni);
    el.hafazniInput.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        checkHafazniWriting();
      }
    });

    // أزرار الملخص
    el.summaryReviewBtn.addEventListener('click', reviewHafazniMistakes);
    el.summaryCloseBtn.addEventListener('click', () => {
      if (el.hafazniSummary) el.hafazniSummary.style.display = 'none';
      if (el.hafazniTypeToggle) el.hafazniTypeToggle.style.display = 'flex';
      if (el.hafazniLessonsCard) el.hafazniLessonsCard.style.display = state.hafazniTab === 'lessons' ? 'block' : 'none';
      if (el.hafazniSetupCard) el.hafazniSetupCard.style.display = state.hafazniTab === 'custom' ? 'block' : 'none';
      updateHafazniOverview();
    });

    document.querySelectorAll('[data-hafazni-tab]').forEach(btn => {
      btn.addEventListener('click', () => switchHafazniTab(btn.dataset.hafazniTab));
    });
    el.selectWordsForHafazniBtn?.addEventListener('click', () => {
      navigateTo('wordsPage');
    });

    // أحداث الإشعارات وبدء الدرس الحالي
    el.hafazniEnableNotifBtn?.addEventListener('click', () => {
      requestNotificationPermission().then(() => updateNotificationUI());
    });
    el.toggleNotificationsBtn?.addEventListener('click', () => {
      requestNotificationPermission().then(() => updateNotificationUI());
    });
    el.testNotificationBtn?.addEventListener('click', () => {
      function showFeedback(msg, isSuccess = true) {
        if (!el.testNotificationFeedback) return;
        el.testNotificationFeedback.style.display = 'block';
        el.testNotificationFeedback.className = `test-feedback-msg ${isSuccess ? 'success' : 'error'}`;
        el.testNotificationFeedback.textContent = msg;
        setTimeout(() => {
          if (el.testNotificationFeedback) el.testNotificationFeedback.style.display = 'none';
        }, 5000);
      }

      if (!isNotificationSupported()) {
        showFeedback('❌ متصفحك الحالي لا يدعم إشعارات الويب.', false);
        return;
      }
      if (Notification.permission !== 'granted') {
        requestNotificationPermission().then(granted => {
          if (granted) {
            sendNotification('🧪 إشعار تجريبي من حفظني', 'هكذا سيبدو إشعار التذكير اليومي بدرسك الجديد! 🧠✨', 'test-reminder');
            showFeedback('✅ تم تفعيل الإشعارات وإرسال الإشعار التجريبي بنجاح!');
          } else {
            showFeedback('⚠️ يرجى الموافقة على طلب إذن الإشعارات في متصفحك.', false);
          }
          updateNotificationUI();
        });
      } else {
        sendNotification('🧪 إشعار تجريبي من حفظني', 'هكذا سيبدو إشعار التذكير اليومي بدرسك الجديد! 🧠✨', 'test-reminder');
        showFeedback('✅ تم إرسال الإشعار التجريبي بنجاح! راجع مركز إشعارات جهازك.');
        updateNotificationUI();
      }
    });

    el.startCurrentLessonDirectBtn?.addEventListener('click', () => {
      const idx = Number(el.startCurrentLessonDirectBtn.dataset.nodeIndex ?? el.startCurrentLessonDirectBtn.dataset.lessonIndex ?? 0);
      startLesson(idx);
    });

    el.helpSettingsBtn.addEventListener('click', () => openModal(el.helpModal));
    el.closeHelpModal.addEventListener('click', () => closeModal(el.helpModal));
    el.closeUpdateModal.addEventListener('click', () => closeModal(el.updateModal));
    el.viewFeaturesBtn.addEventListener('click', () => openModal(el.updateModal));

    // أحداث نافذة تعديل الكلمة والتصنيف
    el.saveEditWordBtn?.addEventListener('click', saveEditWord);
    el.cancelEditWordBtn?.addEventListener('click', closeEditWordModal);
    el.closeEditWordModal?.addEventListener('click', closeEditWordModal);
    el.editWordForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      saveEditWord();
    });

    // أحداث أزرار تبديل الحالة داخل نافذة تعديل الكلمة
    if (el.editStatusPills) {
      el.editStatusPills.addEventListener('click', (e) => {
        const btn = e.target.closest('.status-pill-btn');
        if (!btn) return;
        el.editStatusPills.querySelectorAll('.status-pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (el.editStatusInput) el.editStatusInput.value = btn.dataset.status;
      });
    }

    // أحداث نافذة مشاركة الكلمة كنص منسق
    el.wotdShareBtn?.addEventListener('click', () => {
      openShareWordModal(getWordOfTheDay());
    });
    el.closeShareWordModal?.addEventListener('click', closeShareWordModal);
    el.shareCopyBtn?.addEventListener('click', copyFormattedWord);
    el.shareWhatsappBtn?.addEventListener('click', shareToWhatsapp);
    el.shareTelegramBtn?.addEventListener('click', shareToTelegram);
    el.shareTwitterBtn?.addEventListener('click', shareToTwitter);
    el.shareNativeBtn?.addEventListener('click', shareNative);

    // مستمعات فريق التطوير Team rustipx:
    el.homeAboutUsBtn?.addEventListener('click', () => openModal(el.aboutUsModal));
    el.settingsAboutUsBtn?.addEventListener('click', () => openModal(el.aboutUsModal));
    el.closeAboutUsModal?.addEventListener('click', () => closeModal(el.aboutUsModal));

    window.addEventListener('click', event => {
      if (event.target === el.helpModal) closeModal(el.helpModal);
      if (event.target === el.updateModal) closeModal(el.updateModal);
      if (event.target === el.editWordModal) closeEditWordModal();
      if (event.target === el.shareWordModal) closeShareWordModal();
      if (event.target === el.exportWordsModal) closeModal(el.exportWordsModal);
      if (event.target === el.aboutUsModal) closeModal(el.aboutUsModal);
    });

    document.addEventListener('keydown', event => {
      const target = event.target;
      if (target && ['INPUT','TEXTAREA'].includes(target.tagName)) {
        if (event.key === 'Enter' && target === el.guessInput) {
          event.preventDefault();
          checkWriting();
        }
        return;
      }

      if (state.currentPage === 'testPage' && state.testLocked) return;

      if (event.key === 'ArrowRight') moveStudy(1);
      if (event.key === 'ArrowLeft') moveStudy(-1);
      if (event.code === 'Space' && state.currentPage === 'studyPage') {
        event.preventDefault();
        flipStudyCard();
      }
      if (event.key.toLowerCase() === 's' && state.currentPage === 'testPage' && state.testSubMode === 'voice') {
        startVoiceTest();
      }
    });

    window.addEventListener('beforeunload', () => saveState(true));
    window.addEventListener('pagehide', () => saveState(true));

    setupFeedbackForm();
  }

  async function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    try {
      // updateViaCache: 'none' يجبر المتصفح على التأكد من sw.js من السيرفر
      // مباشرة في كل مرة، بدل ما يعتمد على الكاش العادي بتاع المتصفح (اللي كان
      // بيمنع اكتشاف أي تحديث حقيقي حتى مع الـ refresh العادي على GitHub Pages).
      const registration = await navigator.serviceWorker.register('./sw.js', {
        scope: './',
        updateViaCache: 'none'
      });
      // لا نعمل reload تلقائي عند تفعيل نسخة جديدة من الـ Service Worker.
      // لو فيه تحديث وانت متصل بالنت، هيتحمّل بهدوء في الخلفية بدون ما يقاطع
      // أي جلسة شغالة (حفظني/اختبار) أو يضيّع أي بيانات غير محفوظة، وهيتفعّل
      // تلقائيًا في المرة الجاية اللي التطبيق يتفتح فيها من جديد.
      // لو مفيش نت، الطلب هيفشل بصمت وهيفضل التطبيق شغال offline من الكاش
      // الحالي زي ما هو بدون أي تغيير أو حذف.
      registration.update().catch(() => {});
      window.addEventListener('online', () => registration.update().catch(() => {}));
      // نتأكد كمان من وجود تحديث في كل مرة الصفحة ترجع تبقى ظاهرة (تبويب كان
      // مفتوح في الخلفية، أو المستخدم رجع للتطبيق بعد فترة) — بدون أي إزعاج
      // أو reload، فقط فحص هادئ في الخلفية.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          registration.update().catch(() => {});
          checkDailyLessonNotification();
          markUserActivity();
        }
      });
    } catch (error) {
      console.warn('Service worker registration failed:', error);
    }
  }

  function init() {
    cacheElements();
    loadState();
    setupEvents();
    applyTheme();
    applyDirectionUI();
    updateTestModeUI();
    updateAllViews();
    updateNotificationUI();

    if (!state.vocabulary.length) {
      state.vocabulary = normalizeVocabulary(STARTER_VOCABULARY);
      saveState(true);
    }
    
    renderWordOfTheDay();
    updateAllViews();
    navigateTo('homePage', false);

    if (location.protocol === 'http:' || location.protocol === 'https:') {
      registerServiceWorker();
    }
    showUpdateIfNeeded();

    // فحص إشعار التذكير بدرس اليوم عند الفتح وكل 15 دقيقة
    checkDailyLessonNotification();
    setInterval(() => checkDailyLessonNotification(), 15 * 60 * 1000);
  }

  init();
})();
