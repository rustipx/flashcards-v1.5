(() => {
  'use strict';

  const APP_VERSION = '1.5.3';
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
    hafazni: {
      active: false,
      sessionWords: [],      // array of session word objects with temp data
      currentIndex: 0,
      totalWords: 0,
      activeLessonId: null,  // معرف الدرس أو التقييم الحالي لو الجلسة اتفتحت من خريطة المسار
      activeLessonIndex: null,
      isCheckpoint: false,   // جلسة تقييم شامل (اختبار لمرة واحدة)
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
    badges: {
      unlocked: {}
    },
    dailySprint: {
      lastCompletedDate: null,
      totalCompleted: 0
    },
    voiceCorrectTotal: 0,
    vaultMasteredCount: 0,
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
      'selectAllBtn','clearSelectionBtn','deleteSelectedBtn','sendToHafazniBtn','selectedWordsCount','downloadWordsBtn',
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
      'hafazniMapProgressBox','hafazniMapProgressTitle','hafazniMapProgressCount','hafazniMapProgressBarFill','jumpToCurrentLessonBtn',
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
      'deleteWordFromModalBtn',
      'editStatusPills','editStatusInput',
      // عناصر نافذة مشاركة الكلمة:
      'wotdShareBtn','shareWordModal','closeShareWordModal','shareWordModalTitle','sharePreviewEnglish',
      'sharePreviewArabic','sharePreviewCategory','shareCopyBtn','shareWhatsappBtn',
      'shareTelegramBtn','shareTwitterBtn','shareNativeBtn','shareCopyToast',
      // عناصر تصدير الـ PDF واحتفال الكنفيتي (v1.5.2):
      'exportWordsModal','closeExportWordsModal','exportPdfAllBtn','exportPdfDifficultBtn','exportTxtBtn',
      'confettiCanvas',
      // عناصر ميزات 1.5.3 (TSV, Sprint, Badges, Vault):
      'exportTsvAllBtn','exportTsvDifficultBtn',
      'dailySprintCard','sprintCardSubtitle','sprintStatusBadge','sprintCardBody','sprintCardDesc',
      'startDailySprintBtn','dailySprintModal','closeSprintModal','sprintModalTitle',
      'sprintProgressLabel','sprintTimerChip','sprintTimerText','sprintActiveBody',
      'sprintQuestionPrompt','sprintQuestionWord','sprintPronounceBtn',
      'sprintWritingPanel','sprintInput','sprintCheckBtn','sprintHintBtn','sprintSkipBtn','sprintFeedback',
      'sprintResultBody','sprintStatCorrect','sprintStatTime','finishSprintBtn',
      'achievementsBannerCard','achieveBannerSub','viewAchievementsBtn','achieveMiniChips',
      'settingsAchievementsBtn','achievementsModal','closeAchievementsModal',
      'achieveModalCount','achieveModalTotal','achievementsGrid',
      'vaultCard','vaultSubtitle','vaultCounterBadge','startVaultReviewBtn','filterVaultWordsBtn',
      // عناصر مراجعة أخطاء التقييم الشامل في حفظني:
      'hafazniMistakesBox','hafazniMistakesList',
      // عناصر فريق التطوير (Team rustipx):
      'homeAboutUsBtn','settingsAboutUsBtn','aboutUsModal','closeAboutUsModal',
      'copyRepoUrlBtn','repoUrlText','repoCopyToast',
      // عناصر نافذة التأكيد المخصصة والتوست (v1.5.3):
      'confirmActionModal','closeConfirmModal','confirmModalIcon','confirmModalTitle',
      'confirmModalSubtitle','confirmModalMessage','confirmModalDetails',
      'confirmModalOkBtn','confirmModalCancelBtn','appToast',
      'forceUpdateAppBtn','checkUpdateAppBtn',
      'appUpdateBanner','updateBannerVersion','applyUpdateBtn','dismissUpdateBtn'
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
      vaultStreak: Math.max(0, safeNumber(source.vaultStreak, 0)),
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
      hafazniLessons: state.hafazniLessons,
      hafazniTab: state.hafazniTab || 'lessons',
      wotd: state.wotd,
      streak: state.streak,
      studyTime: state.studyTime,
      notifications: state.notifications,
      badges: state.badges,
      dailySprint: state.dailySprint,
      voiceCorrectTotal: state.voiceCorrectTotal,
      vaultMasteredCount: state.vaultMasteredCount
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
      const savedBadges = data.badges || {};
      state.badges = {
        unlocked: (savedBadges.unlocked && typeof savedBadges.unlocked === 'object') ? savedBadges.unlocked : {}
      };
      const savedSprint = data.dailySprint || {};
      state.dailySprint = {
        lastCompletedDate: typeof savedSprint.lastCompletedDate === 'string' ? savedSprint.lastCompletedDate : null,
        totalCompleted: Math.max(0, safeNumber(savedSprint.totalCompleted, 0))
      };
      state.voiceCorrectTotal = Math.max(0, safeNumber(data.voiceCorrectTotal, 0));
      state.vaultMasteredCount = Math.max(0, safeNumber(data.vaultMasteredCount, 0));
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
      resetTestUI();
      updateTestModeUI();
      updateTestView();
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
      return null;
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
      showToast('⚠️ لا توجد كلمة محددة للمشاركة.', 'warning');
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
    if (typeof renderWordOfTheDay === 'function') renderWordOfTheDay();
    updateStudyView();
    updateTestView();
    if (typeof renderWordList === 'function') renderWordList(state.search);
    if (typeof updateSelectionUI === 'function') updateSelectionUI();
    if (typeof updateHafazniOverview === 'function') updateHafazniOverview();
    if (typeof updateStreakAndStudyUI === 'function') updateStreakAndStudyUI();
    if (typeof renderSprintCard === 'function') renderSprintCard();
    if (typeof renderAchievementsUI === 'function') renderAchievementsUI();
    if (typeof renderVaultCard === 'function') renderVaultCard();
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
      showToast('⚠️ لا توجد كلمات متاحة للاختبار حالياً.', 'warning');
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
      if (state.testSubMode === 'voice') {
        state.voiceCorrectTotal = (state.voiceCorrectTotal || 0) + 1;
      }
      if ((word.wrongCount || 0) > 2 && (word.vaultStreak || 0) < 3) {
        word.vaultStreak = (word.vaultStreak || 0) + 1;
        if (word.vaultStreak >= 3) {
          word.status = 'learned';
          state.vaultMasteredCount = (state.vaultMasteredCount || 0) + 1;
          showToast(`🎉 أتقنت كلمة "${word.english}" بنسبة 100% وتخرجت من الخزنة!`, 'success');
          triggerConfetti();
        }
      } else {
        word.status = 'learned';
      }
      word.interval = word.interval > 0 ? Math.min(word.interval * 2, 720) : 1;
    } else {
      word.wrongCount += 1;
      word.status = 'difficult';
      word.interval = 0;
      if ((word.wrongCount || 0) > 2) {
        word.vaultStreak = 0;
      }
    }

    word.lastReview = now();
    word.due = now() + word.interval * 3600000;
    saveState(true);
    updateStats();
    if (typeof checkAchievements === 'function') checkAchievements();

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

  window.pronounceWord = function(text) {
    speak(text);
  };

  function checkWriting() {
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
      showToast('⚠️ لا توجد كلمات محددة كـ "صعبة" حالياً.', 'warning');
      return;
    }
    if (filter === 'due' && !state.vocabulary.some(w => !w.due || w.due <= now())) {
      showToast('🎉 رائع! لا توجد كلمات مستحقة للمراجعة الآن.', 'success');
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

      if (line.includes('\t')) {
        const parts = line.split('\t');
        english = parts[0]?.trim() || '';
        arabic = parts[1]?.trim() || '';
        if (parts[2]) category = parts[2].trim() || 'عام';
      } else {
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
        } else {
          english = line;
          arabic = '⚠️';
        }
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
        showToast('⚠️ لم يتم العثور على كلمات قابلة للقراءة في الملف.', 'warning');
        return;
      }

      if (state.vocabulary.length) {
        const add = await showConfirmDialog({
          title: '📥 استيراد مفردات جديدة',
          subtitle: `تم العثور على ${incoming.length} كلمة في الملف`,
          message: `هل ترغب في دمج الكلمات الجديدة مع بنك الكلمات الحالي أم استبدال القائمة بالكامل؟`,
          details: 'اختر "إضافة ودمج" للإبقاء على كلماتك الحالية وإضافة الجديد إليها، أو "استبدال القائمة" لبدء قائمة جديدة تماماً بكلمات الملف فقط.',
          okText: '➕ إضافة ودمج',
          cancelText: '🔄 استبدال القائمة',
          isDanger: false,
          icon: '📥'
        });
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
      showToast(`✅ تم استيراد ${incoming.length} كلمة بنجاح.`, 'success');
      navigateTo('studyPage');
    } catch (error) {
      console.error(error);
      showToast('❌ تعذر قراءة الملف. تأكد أنه ملف TXT أو CSV نصي سليم.', 'error');
    }
  }

  function addWord() {
    const english = el.newEnglish.value.trim();
    const arabic = el.newArabic.value.trim();
    const category = (el.newCategory?.value || '').trim() || 'عام';

    if (!english || !arabic) {
      showToast('⚠️ يرجى كتابة الكلمة بالإنجليزية وترجمتها بالعربية معاً.', 'warning');
      return;
    }

    const duplicate = state.vocabulary.some(w =>
      normalizeString(w.english) === normalizeString(english) &&
      normalizeString(w.arabic) === normalizeString(arabic)
    );
    if (duplicate) {
      showToast('⚠️ هذه الكلمة وترجمتها موجودة بالفعل في بنك المفردات.', 'warning');
      return;
    }

    state.vocabulary.push(normalizeWord({ english, arabic, category, tags: [category] }));
    el.newEnglish.value = '';
    el.newArabic.value = '';
    if (el.newCategory) el.newCategory.value = '';
    saveState(true);
    updateAllViews();
    showToast(`✅ تم إضافة "${english}" بنجاح`, 'success');
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
    const statusLabels = { 'new': 'جديدة 🆕', 'difficult': 'صعبة ⚠️', 'learned': 'متقنة ✅' };
    showToast(`تم تعيين حالة "${word.english}" إلى: ${statusLabels[nextStatus] || nextStatus}`, 'info', 1800);
  }

  async function deleteWord(wordOrId) {
    let idx = -1;
    if (typeof wordOrId === 'number') {
      idx = wordOrId >= 0 && wordOrId < state.vocabulary.length ? wordOrId : -1;
    } else if (typeof wordOrId === 'object' && wordOrId !== null) {
      idx = state.vocabulary.findIndex(w => w.id === wordOrId.id || w === wordOrId);
    } else {
      idx = state.vocabulary.findIndex(w => w.id === String(wordOrId));
    }
    if (idx < 0) return;
    const word = state.vocabulary[idx];
    if (!word) return;

    const confirmed = await showConfirmDialog({
      title: '🗑️ حذف كلمة من القائمة',
      subtitle: 'حذف مفردة محددة من بنك الكلمات',
      message: `هل أنت متأكد من رغبتك في حذف الكلمة نهائياً من بنك المفردات؟`,
      details: `${word.english}  ←  ${word.arabic} (التصنيف: ${word.category || 'عام'})`,
      okText: '🗑️ حذف الكلمة',
      cancelText: 'إلغاء',
      isDanger: true,
      icon: '🗑️'
    });
    if (!confirmed) return;

    state.vocabulary.splice(idx, 1);
    state.selectedIds = state.vocabulary.filter(w => w.selected).map(w => w.id);
    state.currentIndex = Math.min(state.currentIndex, Math.max(0, getStudyList().length - 1));
    saveState(true);
    updateAllViews();
    showToast(`✅ تم حذف الكلمة "${word.english}" بنجاح`, 'success');
  }

  async function deleteSelectedWords() {
    const selected = state.vocabulary.filter(w => w.selected);
    if (!selected.length) {
      showToast('⚠️ حدد كلمة واحدة على الأقل أولاً عبر المربعات (☑️) لحذفها.', 'warning');
      return;
    }

    const count = selected.length;
    const confirmed = await showConfirmDialog({
      title: '🗑️ حذف الكلمات المحددة',
      subtitle: `حذف ${count} كلمة تم اختيارها`,
      message: `هل أنت متأكد من رغبتك في حذف ${count} كلمة محددة نهائياً من بنك المفردات؟`,
      details: `سيتم إزالة جميع الكلمات المحددة حالياً من القائمة وتحديث مسارات التعلم التلقائية.`,
      okText: `🗑️ نعم، احذف (${count}) كلمات`,
      cancelText: 'إلغاء',
      isDanger: true,
      icon: '🗑️'
    });
    if (!confirmed) return;

    const selectedIdSet = new Set(selected.map(w => w.id));
    state.vocabulary = state.vocabulary.filter(w => !selectedIdSet.has(w.id));
    state.selectedIds = [];
    state.currentIndex = Math.min(state.currentIndex, Math.max(0, getStudyList().length - 1));
    saveState(true);
    updateAllViews();
    showToast(`✅ تم حذف ${count} كلمة محددة بنجاح`, 'success');
  }

  function restoreDefaultWords() {
    if (state.vocabulary.length) {
      showConfirmDialog({
        title: '✨ استعادة الكلمات المبدئية',
        subtitle: 'إضافة الكلمات النموذجية التوضيحية',
        message: 'هل تريد إضافة الكلمات المبدئية (20 كلمة نموذجية) إلى بنك مفرداتك الحالي؟',
        details: 'سيتم دمج الكلمات النموذجية دون تكرار الكلمات الموجودة مسبقاً لديك.',
        okText: '✨ نعم، استعادة الكلمات',
        cancelText: 'إلغاء',
        isDanger: false,
        icon: '📚'
      }).then(confirmed => {
        if (!confirmed) return;
        const existingSet = new Set(state.vocabulary.map(w => normalizeString(w.english)));
        const toAdd = STARTER_VOCABULARY.filter(w => !existingSet.has(normalizeString(w.english)));
        if (!toAdd.length) {
          showToast('⚠️ كل الكلمات المبدئية موجودة لديك بالفعل في القائمة.', 'warning');
          return;
        }
        state.vocabulary.push(...normalizeVocabulary(toAdd));
        saveState(true);
        updateAllViews();
        showToast(`✅ تم إضافة ${toAdd.length} كلمة نموذجية بنجاح.`, 'success');
      });
      return;
    }

    state.vocabulary = normalizeVocabulary(STARTER_VOCABULARY);
    saveState(true);
    updateAllViews();
    showToast('✅ تم استعادة الكلمات المبدئية (20 كلمة) بنجاح.', 'success');
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
      showToast('⚠️ يرجى ملء الكلمة بالإنجليزية والترجمة بالعربية.', 'warning');
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
    showToast(`✅ تم حفظ تعديلات "${word.english}" بنجاح`, 'success');
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

    const vaultWordsCount = (typeof getVaultWords === 'function') ? getVaultWords().length : 0;
    if (vaultWordsCount > 0) {
      const vaultBtn = document.createElement('button');
      vaultBtn.type = 'button';
      vaultBtn.className = 'cat-pill-btn' + (state.categoryFilter === '__vault__' ? ' active' : '');
      vaultBtn.style.borderColor = 'var(--red-border)';
      vaultBtn.innerHTML = `🧠 الخزنة <span class="cat-pill-count" style="background:var(--red-bg);color:var(--red-text);font-weight:800;">${vaultWordsCount}</span>`;
      vaultBtn.addEventListener('click', () => {
        state.categoryFilter = state.categoryFilter === '__vault__' ? 'all' : '__vault__';
        renderCategoryFilterBar();
        renderWordList(state.search);
        if (typeof renderVaultCard === 'function') renderVaultCard();
        saveState();
      });
      fragment.appendChild(vaultBtn);
    }

    el.categoryFilterBar.appendChild(fragment);
  }

  function renderWordList(filter = '') {
    const query = normalizeString(filter);
    renderCategoryFilterBar();
    el.wordList.innerHTML = '';

    const items = state.vocabulary
      .map((word, index) => ({ word, index }))
      .filter(({ word }) => {
        // فلتر التصنيف المحدد أو الخزنة
        if (state.categoryFilter === '__vault__') {
          if (!((word.wrongCount || 0) > 2 && (word.vaultStreak || 0) < 3)) {
            return false;
          }
        } else if (state.categoryFilter !== 'all') {
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
      if (!state.vocabulary.length) {
        el.wordList.innerHTML = `
          <div class="empty-state" style="padding: 36px 16px; text-align: center;">
            <div style="font-size: 2.8rem; margin-bottom: 10px;">📂</div>
            <h4 style="margin: 0 0 8px; font-weight: 800; font-size: 1.15rem;">بنك المفردات فارغ حالياً</h4>
            <p style="margin: 0 0 18px; font-size: 0.9rem; color: var(--text-secondary); max-width: 440px; margin-inline: auto; line-height: 1.6;">تم مسح أو تفريغ جميع الكلمات. يمكنك إضافة كلمات جديدة من النموذج بالأعلى، أو استيراد ملف، أو استعادة الكلمات النموذجية في أي وقت.</p>
            <button type="button" class="ctrl-btn primary" id="restoreDefaultWordsBtn" style="margin: 0 auto; padding: 10px 20px;">✨ استعادة الكلمات المبدئية (20 كلمة)</button>
          </div>
        `;
        const restoreBtn = $('restoreDefaultWordsBtn');
        if (restoreBtn) restoreBtn.addEventListener('click', restoreDefaultWords);
      } else {
        el.wordList.innerHTML = '<div class="empty-state">لا توجد كلمات مطابقة للبحث أو التصنيف المحدد.</div>';
      }
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

      if ((word.wrongCount || 0) > 2 && (word.vaultStreak || 0) < 3) {
        const vaultBadge = document.createElement('span');
        vaultBadge.className = 'word-vault-tag';
        vaultBadge.textContent = `🧠 بالخزنة (${word.vaultStreak || 0}/3)`;
        vaultBadge.title = 'كلمة متعثرة في الخزنة — تتخرج بعد 3 إجابات صحيحة متتالية';
        pairDetails.append(vaultBadge);
      }

      pair.append(pairTop, pairDetails);
      mainRow.append(checkLabel, pair);

      const actions = document.createElement('div');
      actions.className = 'word-actions';

      const status = document.createElement('button');
      status.type = 'button';
      status.className = 'status-btn ' + word.status;
      status.textContent = getStatusLabel(word.status);
      status.addEventListener('click', (e) => {
        e.stopPropagation();
        cycleStatus(word.id);
      });

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
      del.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteWord(word.id);
      });

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
    if (el.selectedWordsCount) el.selectedWordsCount.textContent = count;
    if (el.hafazniSelectedCount) el.hafazniSelectedCount.textContent = count;
    if (el.sendToHafazniBtn) el.sendToHafazniBtn.disabled = count === 0;
    if (el.deleteSelectedBtn) {
      el.deleteSelectedBtn.disabled = count === 0;
      el.deleteSelectedBtn.style.opacity = count === 0 ? '0.5' : '1';
    }
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
    const selCount = state.vocabulary.filter(w => w.selected).length;
    showToast(`☑️ تم تحديد ${selCount} كلمة`, 'info', 1800);
  }

  function clearSelection() {
    state.vocabulary.forEach(word => word.selected = false);
    state.selectedIds = [];
    saveState(true);
    renderWordList(state.search);
    showToast('⚪ تم إلغاء تحديد جميع الكلمات', 'info', 1600);
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
      showToast('⚠️ حدد كلمة واحدة على الأقل أولاً عبر المربعات (☑️).', 'warning');
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
      showToast('⚠️ متصفحك الحالي لا يدعم إشعارات الويب المباشرة.', 'warning');
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
    const midX = Math.round(width / 2); // 180 (50%)
    const rightX = Math.round(width * 0.64); // 230 (64%)
    const leftX = Math.round(width * 0.36); // 130 (36%)
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
      showToast('🔒 هذا الدرس مقفل حالياً. أتمم الدرس السابق أولاً لتفتحه بالتسلسل.', 'warning');
      return;
    }
    markUserActivity();
    state.hafazni.activeLessonId = node.id;
    state.hafazni.activeLessonIndex = node.index;
    state.hafazni.isCheckpoint = (node.type === 'checkpoint');
    navigateTo('hafazniPage');
    initHafazniSession(node.ids);
    const title = node.type === 'checkpoint' ? '🏆 التقييم الشامل' : `🚀 الدرس ${node.lessonNumber}`;
    showToast(`بالتوفيق! بدأت ${title} بنشاط وتركيز ✨`, 'info', 2200);
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
      showToast('⚠️ حدد كلمات أولاً من صفحة الكلمات لبدء جلسة حفظني.', 'warning');
      return;
    }

    const activeNode = computeLessons().find(n => n.id === state.hafazni.activeLessonId || (state.hafazni.activeLessonIndex !== null && n.index === state.hafazni.activeLessonIndex));
    const isCheckpoint = Boolean(activeNode && activeNode.type === 'checkpoint');
    state.hafazni.isCheckpoint = isCheckpoint;

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

    // إذا كانت الجلسة عبارة عن تقييم شامل (محطة تقييم على المسار):
    // اختبار بسيط لمرة واحدة، لا تكرار ولا نسب إتقان ولا محاولات متكررة
    if (session.isCheckpoint) {
      el.hafazniProgressText.textContent = `السؤال ${session.currentIndex + 1} من ${words.length}`;
      el.hafazniProgressBar.style.width = words.length ? `${((session.currentIndex) / words.length) * 100}%` : '0%';
      el.hafazniQuestionTypeLabel.textContent = '🏆 تقييم شامل (اختبار لمرة واحدة)';
      el.hafazniWordStats.style.display = 'none';

      const source = getSourceWord(originalWord);
      el.hafazniQuestion.textContent = source;

      el.hafazniInput.style.display = 'block';
      el.hafazniOptionsGrid.style.display = 'none';
      el.hafazniInput.value = '';
      el.hafazniInput.className = '';
      el.hafazniInput.placeholder = '✍️ اكتب الترجمة...';
      window.setTimeout(() => el.hafazniInput.focus(), 50);

      el.hafazniFeedback.textContent = '';
      el.hafazniFeedback.className = 'test-feedback';

      if (originalWord.english && /[A-Za-z]/.test(originalWord.english)) {
        speak(originalWord.english);
      }

      sessionWord.lastShown = now();
      sessionWord.answered = false;
      state.hafazni.processing = false;
      updateHafazniOverview();
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
      if (!session.mistakes.includes(sessionWord.id)) session.mistakes.push(sessionWord.id);
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

    // لو الجلسة تقييم شامل: مفيش إتقان ومفيش محاولات، هي مرة واحدة فقط لكل كلمة
    if (session.isCheckpoint) {
      session.currentIndex++;
      if (session.currentIndex >= session.sessionWords.length) {
        finishHafazniSession();
      } else {
        renderHafazniQuestion();
        updateHafazniOverview();
      }
      return;
    }

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

    // عرض صندوق مراجعة الكلمات التي تم ارتكاب خطأ فيها
    if (el.hafazniMistakesBox && el.hafazniMistakesList) {
      if (state.hafazni.mistakes && state.hafazni.mistakes.length > 0) {
        const mistakeWords = getWordsByIds(state.hafazni.mistakes);
        el.hafazniMistakesList.innerHTML = '';
        mistakeWords.forEach(w => {
          const item = document.createElement('div');
          item.className = 'hafazni-mistake-item';
          item.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: var(--card-bg); border-radius: 8px; border: 1px solid var(--border); font-size: 0.9rem;';

          const leftDiv = document.createElement('div');
          leftDiv.style.cssText = 'display: flex; align-items: center; gap: 8px;';

          const spkBtn = document.createElement('button');
          spkBtn.type = 'button';
          spkBtn.className = 'action-btn';
          spkBtn.title = 'نطق';
          spkBtn.style.cssText = 'padding: 4px 8px; font-size: 0.85rem;';
          spkBtn.textContent = '🔊';
          spkBtn.addEventListener('click', () => speak(w.english));

          const enSpan = document.createElement('strong');
          enSpan.style.color = 'var(--text)';
          enSpan.textContent = w.english;

          leftDiv.appendChild(spkBtn);
          leftDiv.appendChild(enSpan);

          const arSpan = document.createElement('span');
          arSpan.style.color = 'var(--text-secondary)';
          arSpan.textContent = w.arabic;

          item.appendChild(leftDiv);
          item.appendChild(arSpan);
          el.hafazniMistakesList.appendChild(item);
        });
        el.hafazniMistakesBox.style.display = 'block';
      } else {
        el.hafazniMistakesBox.style.display = 'none';
      }
    }

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
      showToast('🎉 رائع! لا توجد أخطاء في آخر جلسة مراجعة.', 'success');
      return;
    }
    // بدء جلسة جديدة بالأخطاء فقط
    const mistakeIds = [...state.hafazni.mistakes];
    // نعيد ضبط قائمة الأخطاء بعد بدء الجلسة
    state.hafazni.mistakes = [];
    state.hafazni.activeLessonId = null; // جلسة مراجعة أخطاء، مش درس من الخريطة
    state.hafazni.activeLessonIndex = null;
    state.hafazni.isCheckpoint = false;
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
      showToast(isDifficultOnly ? '⚠️ لا توجد كلمات صعبة حالياً لتصديرها كـ PDF.' : '⚠️ بنك المفردات فارغ، لا توجد كلمات لتصديرها.', 'warning');
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

  function playCelebrationChime() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      const notes = [
        { freq: 523.25, time: 0.00, dur: 0.22 }, // C5
        { freq: 659.25, time: 0.10, dur: 0.24 }, // E5
        { freq: 783.99, time: 0.20, dur: 0.26 }, // G5
        { freq: 1046.50, time: 0.32, dur: 0.50 } // C6
      ];
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.12, ctx.currentTime);
      masterGain.connect(ctx.destination);

      notes.forEach(note => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note.freq, ctx.currentTime + note.time);
        gain.gain.setValueAtTime(0, ctx.currentTime + note.time);
        gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + note.time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + note.time + note.dur);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(ctx.currentTime + note.time);
        osc.stop(ctx.currentTime + note.time + note.dur);
      });

      setTimeout(() => {
        try { ctx.close(); } catch (_) {}
      }, 1200);
    } catch (_) {}
  }

  function drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
    let rot = (Math.PI / 2) * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;
      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
  }

  function triggerConfetti(options = {}) {
    const canvas = el.confettiCanvas || document.getElementById('confettiCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (confettiAnimId) {
      cancelAnimationFrame(confettiAnimId);
      confettiAnimId = null;
    }

    if (options.withSound !== false) {
      playCelebrationChime();
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    canvas.style.display = 'block';

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const colors = [
      '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
      '#ec4899', '#06b6d4', '#eab308', '#6366f1', '#14b8a6'
    ];
    const isMobile = width < 600;
    const count = isMobile ? 80 : 130;
    const particles = [];
    const shapes = ['ribbon', 'ribbon', 'star', 'circle'];

    for (let i = 0; i < count; i++) {
      const sourceSide = i % 3; // 0: يسار, 1: يمين, 2: وسط
      let startX, vx, vy;

      if (sourceSide === 0) {
        startX = width * (0.05 + Math.random() * 0.2);
        vx = Math.random() * 9 + 2;
        vy = -(Math.random() * 12 + 8);
      } else if (sourceSide === 1) {
        startX = width * (0.75 + Math.random() * 0.2);
        vx = -(Math.random() * 9 + 2);
        vy = -(Math.random() * 12 + 8);
      } else {
        startX = width * 0.5 + (Math.random() * 120 - 60);
        vx = (Math.random() - 0.5) * 12;
        vy = -(Math.random() * 14 + 10);
      }

      particles.push({
        x: startX,
        y: height * 0.85 + (Math.random() * 60),
        vx: vx,
        vy: vy,
        size: Math.random() * 6 + (isMobile ? 5 : 7),
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 8,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: Math.random() * 0.12 + 0.05,
        gravity: 0.32,
        drag: 0.985,
        opacity: 1
      });
    }

    const startTime = Date.now();
    const duration = 3600;

    function renderConfetti() {
      const elapsed = Date.now() - startTime;
      if (elapsed > duration) {
        ctx.clearRect(0, 0, width, height);
        canvas.style.display = 'none';
        confettiAnimId = null;
        return;
      }

      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.vx *= p.drag;
        p.vy = (p.vy + p.gravity) * p.drag;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.wobble += p.wobbleSpeed;

        if (elapsed > duration * 0.65) {
          p.opacity = Math.max(0, (duration - elapsed) / (duration * 0.35));
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        const scaleX = Math.cos(p.wobble);
        ctx.scale(scaleX, 1);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;

        if (p.shape === 'star') {
          drawStar(ctx, 0, 0, 5, p.size, p.size * 0.5);
        } else if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        }

        ctx.restore();
      }

      confettiAnimId = requestAnimationFrame(renderConfetti);
    }

    confettiAnimId = requestAnimationFrame(renderConfetti);
  }

  const triggerCelebration = triggerConfetti;

  function downloadTextWords() {
    if (!state.vocabulary.length) {
      showToast('⚠️ لا توجد كلمات لتنزيلها، بنك المفردات فارغ.', 'warning');
      return;
    }
    const lines = state.vocabulary.map(w => `${w.english}, ${w.arabic}`).join('\n');
    downloadBlob(lines, 'words.txt', 'text/plain;charset=utf-8');
    showToast(`📄 تم تنزيل ${state.vocabulary.length} كلمة كملف نصي.`, 'success');
  }

  /* ============================================================
     1) Feature 1: Anki & Quizlet Export (TSV)
     ============================================================ */
  function exportTsvWords(filter = 'all') {
    let words = state.vocabulary;
    if (filter === 'difficult') {
      words = words.filter(w => w.status === 'difficult');
    }
    if (!words.length) {
      showToast(filter === 'difficult'
        ? '⚠️ لا توجد كلمات صعبة حالياً لتصديرها.'
        : '⚠️ لا توجد كلمات لتصديرها، بنك المفردات فارغ.', 'warning');
      return;
    }
    const dateStr = getLocalDateStr();
    const lines = words.map(w => {
      const en = String(w.english || '').replace(/\t|\r?\n/g, ' ').trim();
      const ar = String(w.arabic || '').replace(/\t|\r?\n/g, ' ').trim();
      const cat = String(w.category || 'عام').replace(/\t|\r?\n/g, ' ').trim();
      return `${en}\t${ar}\t${cat}`;
    }).join('\n');

    const fileName = filter === 'difficult'
      ? `flashcards-difficult-anki-${dateStr}.tsv`
      : `flashcards-all-anki-${dateStr}.tsv`;

    downloadBlob(lines, fileName, 'text/tab-separated-values;charset=utf-8');
    showToast(`📋 تم تصدير ${words.length} كلمة بصيغة TSV متوافقة مع Anki و Quizlet.`, 'success');
  }

  /* ============================================================
     2) Feature 4: Mistake Bank (Weak Words Vault)
     ============================================================ */
  function getVaultWords() {
    return state.vocabulary.filter(w => (w.wrongCount || 0) > 2 && (w.vaultStreak || 0) < 3);
  }

  function renderVaultCard() {
    if (!el.vaultCard) return;
    const vaultWords = getVaultWords();
    const count = vaultWords.length;

    if (el.vaultCounterBadge) {
      if (count > 0) {
        el.vaultCounterBadge.textContent = `${count} كلمة بالخزنة`;
        el.vaultCounterBadge.className = 'vault-counter-badge has-words';
      } else {
        el.vaultCounterBadge.textContent = 'الخزنة فارغة ✨';
        el.vaultCounterBadge.className = 'vault-counter-badge empty';
      }
    }

    if (el.vaultSubtitle) {
      if (count > 0) {
        el.vaultSubtitle.textContent = `تضم الكلمات التي تكرر خطؤك فيها 3 مرات أو أكثر (${count} كلمة حالياً).`;
      } else {
        el.vaultSubtitle.textContent = 'رائع! لا توجد كلمات متعثرة حالياً، أداؤك ممتاز ومتقن.';
      }
    }

    if (el.startVaultReviewBtn) {
      el.startVaultReviewBtn.disabled = count === 0;
      el.startVaultReviewBtn.style.opacity = count === 0 ? '0.6' : '1';
      el.startVaultReviewBtn.style.cursor = count === 0 ? 'not-allowed' : 'pointer';
    }

    if (el.filterVaultWordsBtn) {
      const isFiltering = state.categoryFilter === '__vault__';
      el.filterVaultWordsBtn.textContent = isFiltering ? '🌟 عرض كل الكلمات' : '🔍 فلترة كلمات الخزنة بالجدول';
      el.filterVaultWordsBtn.disabled = count === 0 && !isFiltering;
      el.filterVaultWordsBtn.style.opacity = (count === 0 && !isFiltering) ? '0.6' : '1';
    }
  }

  /* ============================================================
     3) Feature 2: Badges & Achievements System
     ============================================================ */
  const ACHIEVEMENTS = [
    {
      id: 'first_word',
      title: 'الخطوة الأولى',
      description: 'إضافة أول كلمة إلى بنك المفردات',
      icon: '🌱',
      check: () => state.vocabulary.length >= 1
    },
    {
      id: 'vocab_50',
      title: 'جامع الكلمات',
      description: 'الوصول إلى 50 كلمة في بنك المفردات',
      icon: '📚',
      check: () => state.vocabulary.length >= 50
    },
    {
      id: 'first_mastered',
      title: 'بداية الإتقان',
      description: 'إتقان وحفظ أول كلمة بنجاح',
      icon: '🎯',
      check: () => state.vocabulary.some(w => w.status === 'learned')
    },
    {
      id: 'mastered_20',
      title: 'عقل متقد',
      description: 'إتقان وحفظ 20 كلمة على الأقل',
      icon: '🏆',
      check: () => state.vocabulary.filter(w => w.status === 'learned').length >= 20
    },
    {
      id: 'streak_3',
      title: 'شعلة الاستمرار',
      description: 'الحفاظ على الستريك اليومي لمدة 3 أيام متتالية',
      icon: '🔥',
      check: () => (state.streak?.current || 0) >= 3 || (state.streak?.best || 0) >= 3
    },
    {
      id: 'sprint_runner',
      title: 'عدّاء التحديات',
      description: 'إكمال تحدي الـ 5 دقائق اليومي لأول مرة',
      icon: '⚡',
      check: () => (state.dailySprint?.totalCompleted || 0) >= 1
    },
    {
      id: 'vault_graduate',
      title: 'طبيب الأخطاء',
      description: 'تخريج كلمة متعثرة واحدة على الأقل من الخزنة بإتقان تام',
      icon: '🧠',
      check: () => (state.vaultMasteredCount || 0) >= 1
    },
    {
      id: 'voice_master',
      title: 'فصيح اللسان',
      description: 'الإجابة بنجاح على 5 أسئلة عبر النطق الصوتي',
      icon: '🎙️',
      check: () => (state.voiceCorrectTotal || 0) >= 5
    },
    {
      id: 'path_explorer',
      title: 'فاتح المسار',
      description: 'إكمال أول درس في خريطة حفظني المتعرجة',
      icon: '🗺️',
      check: () => (state.hafazniLessons?.completedLessonIds || []).length >= 1
    }
  ];

  function checkAchievements(options = {}) {
    const isSilent = Boolean(options && options.silent);
    if (!state.badges) state.badges = { unlocked: {} };
    if (!state.badges.unlocked) state.badges.unlocked = {};

    let newlyUnlocked = [];
    ACHIEVEMENTS.forEach(ach => {
      if (!state.badges.unlocked[ach.id]) {
        try {
          if (ach.check()) {
            state.badges.unlocked[ach.id] = Date.now();
            newlyUnlocked.push(ach);
          }
        } catch (e) {
          console.error('Achievement check error:', e);
        }
      }
    });

    if (newlyUnlocked.length > 0) {
      saveState();
      renderAchievementsUI();
      if (!isSilent) {
        newlyUnlocked.forEach(ach => {
          showToast(`🏅 وسام جديد مفتوح: "${ach.title}" ${ach.icon}!`, 'success', 4500);
        });
        triggerCelebration();
      }
    }
  }

  function renderAchievementsUI() {
    if (!state.badges) state.badges = { unlocked: {} };
    if (!state.badges.unlocked) state.badges.unlocked = {};

    const unlockedCount = Object.keys(state.badges.unlocked).length;
    const totalCount = ACHIEVEMENTS.length;

    if (el.achieveBannerSub) {
      el.achieveBannerSub.textContent = `فتحت ${unlockedCount} من ${totalCount} وسام`;
    }
    if (el.achieveModalCount) {
      el.achieveModalCount.textContent = unlockedCount;
    }
    if (el.achieveModalTotal) {
      el.achieveModalTotal.textContent = totalCount;
    }

    if (el.achieveMiniChips) {
      el.achieveMiniChips.innerHTML = '';
      ACHIEVEMENTS.forEach(ach => {
        const isUnlocked = Boolean(state.badges.unlocked[ach.id]);
        const chip = document.createElement('div');
        chip.className = 'achieve-mini-chip ' + (isUnlocked ? 'unlocked' : 'locked');
        chip.textContent = ach.icon;
        chip.title = `${ach.title}: ${ach.description} (${isUnlocked ? 'مفتوح' : 'مغلق'})`;
        chip.onclick = () => {
          renderAchievementsUI();
          openModal(el.achievementsModal);
        };
        el.achieveMiniChips.appendChild(chip);
      });
    }

    if (el.achievementsGrid) {
      el.achievementsGrid.innerHTML = '';
      ACHIEVEMENTS.forEach(ach => {
        const isUnlocked = Boolean(state.badges.unlocked[ach.id]);
        const card = document.createElement('div');
        card.className = 'achievement-card ' + (isUnlocked ? 'unlocked' : 'locked');

        card.innerHTML = `
          <div class="achievement-icon-wrap">
            <span>${ach.icon}</span>
            ${isUnlocked ? '<div class="achievement-check">✓</div>' : '<div class="achievement-lock">🔒</div>'}
          </div>
          <div class="achievement-details">
            <h4 class="achievement-title">${ach.title}</h4>
            <p class="achievement-desc">${ach.description}</p>
            <span class="achievement-status-badge">
              ${isUnlocked ? '🏅 تم الفتح' : '⏳ مقفل'}
            </span>
          </div>
        `;
        el.achievementsGrid.appendChild(card);
      });
    }
  }

  /* ============================================================
     4) Feature 3: Daily 5-Min Sprint
     ============================================================ */
  function buildSprintWords() {
    const list = state.vocabulary || [];
    if (!list.length) return [];

    const currentTime = now();
    const dueWords = list.filter(w => (w.due || 0) <= currentTime);
    const difficultWords = list.filter(w => w.status === 'difficult' || (w.wrongCount || 0) > 2);
    const otherWords = list.filter(w => !dueWords.includes(w) && !difficultWords.includes(w));

    const shuffle = arr => [...arr].sort(() => Math.random() - 0.5);
    const combined = [];
    const seen = new Set();

    [shuffle(dueWords), shuffle(difficultWords), shuffle(otherWords)].forEach(grp => {
      grp.forEach(w => {
        if (!seen.has(w.id) && combined.length < 10) {
          seen.add(w.id);
          combined.push(w);
        }
      });
    });

    return combined;
  }

  function renderSprintCard() {
    if (!el.dailySprintCard) return;
    const today = getLocalDateStr();
    const completedToday = state.dailySprint?.lastCompletedDate === today;
    const sprintWords = buildSprintWords();

    if (el.sprintStatusBadge) {
      if (completedToday) {
        el.sprintStatusBadge.textContent = '✅ مكتمل اليوم';
        el.sprintStatusBadge.className = 'sprint-status-badge completed';
      } else {
        el.sprintStatusBadge.textContent = '⚡ متاح الآن';
        el.sprintStatusBadge.className = 'sprint-status-badge ready';
      }
    }

    if (el.sprintCardSubtitle) {
      const totalRuns = state.dailySprint?.totalCompleted || 0;
      el.sprintCardSubtitle.textContent = completedToday
        ? `أكملت تحدي اليوم بنجاح! إجمالي التحديات المنجزة: ${totalRuns}`
        : `10 أسئلة سريعة مختارة بذكاء في 5 دقائق (أنجزت ${totalRuns} تحدٍ سابقاً)`;
    }

    if (el.startDailySprintBtn) {
      if (sprintWords.length === 0) {
        el.startDailySprintBtn.disabled = true;
        el.startDailySprintBtn.textContent = '⚠️ أضف كلمات لبدء التحدي';
        el.startDailySprintBtn.style.opacity = '0.6';
      } else {
        el.startDailySprintBtn.disabled = false;
        el.startDailySprintBtn.textContent = completedToday ? '🔄 تدريب إضافي (تكرار التحدي)' : '✍️ ابدأ تحدي الكتابة (5 دقائق)';
        el.startDailySprintBtn.style.opacity = '1';
      }
    }
  }

  let sprintQuizState = {
    active: false,
    processing: false,
    isVault: false,
    words: [],
    currentIndex: 0,
    correctCount: 0,
    secondsLeft: 300,
    timerId: null,
    startTime: 0
  };

  function startSprintSession(isVault = false) {
    const words = isVault ? getVaultWords() : buildSprintWords();
    if (!words.length) {
      showToast(isVault ? '🎉 لا توجد كلمات في الخزنة حالياً.' : '⚠️ لا توجد كلمات كافية لبدء التحدي.', 'warning');
      return;
    }

    sprintQuizState = {
      active: true,
      processing: false,
      isVault: isVault,
      words: words,
      currentIndex: 0,
      correctCount: 0,
      secondsLeft: isVault ? Math.min(300, Math.max(60, words.length * 30)) : 300,
      timerId: null,
      startTime: Date.now()
    };

    if (el.sprintModalTitle) {
      el.sprintModalTitle.textContent = isVault ? '🧠 اختبار كتابة لمراجعة الخزنة' : '✍️ تحدي الـ 5 دقائق الكتابي';
    }

    if (el.sprintActiveBody) el.sprintActiveBody.style.display = 'block';
    if (el.sprintResultBody) el.sprintResultBody.style.display = 'none';

    openModal(el.dailySprintModal);
    renderSprintQuestion();
    showToast(isVault ? '🎯 بدأت مراجعة كلمات الخزنة لتثبيتها 100% ✨' : '⚡ انطلق تحدي الـ 5 دقائق! بالتوفيق في الكتابة والإملاء ✨', 'info', 2200);

    if (sprintQuizState.timerId) clearInterval(sprintQuizState.timerId);
    sprintQuizState.timerId = setInterval(() => {
      sprintQuizState.secondsLeft--;
      updateSprintTimerUI();
      if (sprintQuizState.secondsLeft <= 0) {
        clearInterval(sprintQuizState.timerId);
        finishSprintSession(true);
      }
    }, 1000);
    updateSprintTimerUI();
  }

  function updateSprintTimerUI() {
    if (!el.sprintTimerText) return;
    const mins = Math.floor(Math.max(0, sprintQuizState.secondsLeft) / 60);
    const secs = Math.max(0, sprintQuizState.secondsLeft) % 60;
    el.sprintTimerText.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    if (el.sprintTimerChip) {
      el.sprintTimerChip.classList.toggle('warning', sprintQuizState.secondsLeft <= 30);
    }
  }

  function isSprintWritingMatch(input, target) {
    const normInput = normalizeString(input);
    const normTarget = normalizeString(target);
    if (!normInput) return false;
    if (normInput === normTarget) return true;

    // فحص المعاني المتعددة المفصولة بفاصلة أو سلاش
    const variants = target.split(/[/،,؛;]+/).map(s => normalizeString(s)).filter(Boolean);
    if (variants.includes(normInput)) return true;

    // مسامحة خطأ إملائي طفيف بحرف واحد للكلمات الأطول من 4 حروف
    if (normTarget.length >= 5 && levenshtein(normInput, normTarget) <= 1) return true;
    for (const v of variants) {
      if (v.length >= 5 && levenshtein(normInput, v) <= 1) return true;
    }
    return false;
  }

  function updateSprintPromptAndInputs(currentWord) {
    const isEnAr = state.direction === 'en-ar';

    if (el.sprintQuestionPrompt) {
      el.sprintQuestionPrompt.textContent = isEnAr ? 'اكتب المعنى العربي للكلمة:' : 'اكتب الكلمة بالإنجليزية (English):';
    }

    if (el.sprintInput) {
      el.sprintInput.value = '';
      el.sprintInput.className = 'sprint-input';
      el.sprintInput.disabled = false;
      el.sprintInput.placeholder = isEnAr ? 'اكتب المعنى بالعربية واضغط Enter...' : 'Type English word & press Enter...';
      setTimeout(() => el.sprintInput?.focus(), 80);
    }

    if (el.sprintCheckBtn) el.sprintCheckBtn.disabled = false;
    if (el.sprintHintBtn) el.sprintHintBtn.disabled = false;
    if (el.sprintSkipBtn) el.sprintSkipBtn.disabled = false;
  }

  function renderSprintQuestion() {
    const { words, currentIndex } = sprintQuizState;
    const currentWord = words[currentIndex];
    if (!currentWord) {
      finishSprintSession();
      return;
    }

    sprintQuizState.processing = false;

    if (el.sprintProgressLabel) {
      el.sprintProgressLabel.textContent = `السؤال ${currentIndex + 1} من ${words.length}`;
    }

    const isEnAr = state.direction === 'en-ar';
    const promptWord = isEnAr ? currentWord.english : currentWord.arabic;

    if (el.sprintQuestionWord) {
      el.sprintQuestionWord.textContent = promptWord;
    }

    if (el.sprintFeedback) {
      el.sprintFeedback.textContent = '';
      el.sprintFeedback.className = 'sprint-feedback';
    }

    if (el.sprintPronounceBtn) {
      el.sprintPronounceBtn.onclick = () => speak(currentWord.english);
    }

    updateSprintPromptAndInputs(currentWord);
  }

  function checkSprintWriting() {
    if (!sprintQuizState.active || sprintQuizState.processing) return;
    const currentWord = sprintQuizState.words[sprintQuizState.currentIndex];
    if (!currentWord) return;

    const input = (el.sprintInput?.value || '').trim();
    if (!input) {
      if (el.sprintFeedback) {
        el.sprintFeedback.textContent = '⚠️ يرجى كتابة الإجابة أولاً.';
        el.sprintFeedback.className = 'sprint-feedback';
      }
      el.sprintInput?.focus();
      return;
    }

    const isEnAr = state.direction === 'en-ar';
    const target = isEnAr ? currentWord.arabic : currentWord.english;
    const isMatch = isSprintWritingMatch(input, target);

    if (el.sprintInput) {
      el.sprintInput.className = `sprint-input ${isMatch ? 'correct' : 'wrong'}`;
      el.sprintInput.disabled = true;
    }

    handleSprintAnswer(isMatch ? target : input, target, currentWord);
  }

  function showSprintHint() {
    if (!sprintQuizState.active || sprintQuizState.processing) return;
    const currentWord = sprintQuizState.words[sprintQuizState.currentIndex];
    if (!currentWord) return;

    const isEnAr = state.direction === 'en-ar';
    const target = isEnAr ? currentWord.arabic : currentWord.english;
    const firstChar = target.trim().charAt(0);
    const len = target.trim().length;

    if (el.sprintFeedback) {
      el.sprintFeedback.textContent = `💡 تلميح: تبدأ بحرف "${firstChar}" وطول الكلمة ${len} أحرف.`;
      el.sprintFeedback.className = 'sprint-feedback';
    }
    el.sprintInput?.focus();
  }

  function skipSprintQuestion() {
    if (!sprintQuizState.active || sprintQuizState.processing) return;
    const currentWord = sprintQuizState.words[sprintQuizState.currentIndex];
    if (!currentWord) return;

    const isEnAr = state.direction === 'en-ar';
    const target = isEnAr ? currentWord.arabic : currentWord.english;

    if (el.sprintInput) {
      el.sprintInput.className = 'sprint-input wrong';
      el.sprintInput.disabled = true;
    }
    handleSprintAnswer('', target, currentWord);
  }

  function handleSprintAnswer(selected, correct, word) {
    if (!sprintQuizState.active || sprintQuizState.processing) return;
    sprintQuizState.processing = true;

    if (el.sprintCheckBtn) el.sprintCheckBtn.disabled = true;
    if (el.sprintHintBtn) el.sprintHintBtn.disabled = true;
    if (el.sprintSkipBtn) el.sprintSkipBtn.disabled = true;

    const isCorrect = isSprintWritingMatch(selected, correct);

    if (isCorrect) {
      sprintQuizState.correctCount++;
      word.correctCount = (word.correctCount || 0) + 1;
      if ((word.wrongCount || 0) > 2 && (word.vaultStreak || 0) < 3) {
        word.vaultStreak = (word.vaultStreak || 0) + 1;
        if (word.vaultStreak >= 3) {
          word.status = 'learned';
          state.vaultMasteredCount = (state.vaultMasteredCount || 0) + 1;
          showToast(`🎉 أتقنت كلمة "${word.english}" بنسبة 100% وتخرجت من الخزنة!`, 'success');
          triggerConfetti();
        }
      }
      if (el.sprintFeedback) {
        el.sprintFeedback.textContent = '✅ إجابة صحيحة ومتقنة!';
        el.sprintFeedback.className = 'sprint-feedback correct';
      }
    } else {
      word.wrongCount = (word.wrongCount || 0) + 1;
      word.status = 'difficult';
      word.due = now();
      if ((word.wrongCount || 0) > 2) {
        word.vaultStreak = 0;
      }
      if (el.sprintFeedback) {
        el.sprintFeedback.textContent = `❌ الإجابة الصحيحة: ${correct}`;
        el.sprintFeedback.className = 'sprint-feedback wrong';
      }
    }

    saveState(true);
    updateStats();

    setTimeout(() => {
      sprintQuizState.currentIndex++;
      if (sprintQuizState.currentIndex < sprintQuizState.words.length) {
        renderSprintQuestion();
      } else {
        finishSprintSession();
      }
    }, isCorrect ? 750 : 1300);
  }

  function finishSprintSession(timedOut = false) {
    if (sprintQuizState.timerId) {
      clearInterval(sprintQuizState.timerId);
      sprintQuizState.timerId = null;
    }
    sprintQuizState.active = false;

    const timeSpentSeconds = Math.max(1, Math.round((Date.now() - sprintQuizState.startTime) / 1000));
    const mins = Math.floor(timeSpentSeconds / 60);
    const secs = timeSpentSeconds % 60;
    const timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    if (el.sprintStatCorrect) {
      el.sprintStatCorrect.textContent = `${sprintQuizState.correctCount} / ${sprintQuizState.words.length}`;
    }
    if (el.sprintStatTime) {
      el.sprintStatTime.textContent = timeFormatted;
    }

    if (!sprintQuizState.isVault) {
      const today = getLocalDateStr();
      state.dailySprint.lastCompletedDate = today;
      state.dailySprint.totalCompleted = (state.dailySprint.totalCompleted || 0) + 1;
      if (typeof markUserActivity === 'function') markUserActivity();
    }

    saveState(true);
    updateAllViews();
    checkAchievements();

    if (el.sprintActiveBody) el.sprintActiveBody.style.display = 'none';
    if (el.sprintResultBody) el.sprintResultBody.style.display = 'block';

    if (sprintQuizState.correctCount >= Math.ceil(sprintQuizState.words.length * 0.7)) {
      triggerConfetti();
    }
  }

  function exportBackup() {
    if (!state.vocabulary.length) {
      showToast('⚠️ لا توجد كلمات لحفظها في النسخة الاحتياطية.', 'warning');
      return;
    }
    const backup = {
      app: 'Flashcards',
      version: APP_VERSION,
      exportedAt: new Date().toISOString(),
      data: buildPersistedState()
    };
    downloadBlob(JSON.stringify(backup, null, 2), `flashcards-backup-${APP_VERSION}.json`, 'application/json;charset=utf-8');
    showToast('💾 تم حفظ وتنزيل النسخة الاحتياطية بنجاح.', 'success');
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
      showToast(`✅ تم استرجاع ${state.vocabulary.length} كلمة بنجاح.`, 'success');
    } catch (error) {
      console.error(error);
      showToast('❌ ملف النسخة الاحتياطية غير صالح.', 'error');
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

  async function resetProgress() {
    if (!state.vocabulary.length) {
      showToast('⚠️ لا توجد كلمات لتصفير تقدمها.', 'warning');
      return;
    }
    const count = state.vocabulary.length;
    const ok = await showConfirmDialog({
      title: '🔄 تصفير التقدم وإعادة الضبط',
      subtitle: 'إعادة ضبط حالات جميع الكلمات إلى "جديدة"',
      message: `هل أنت متأكد من رغبتك في تصفير تقدم ومراجعات جميع الكلمات (${count} كلمة)؟`,
      details: 'ستظل الكلمات موجودة في بنك المفردات، ولكن ستعود حالتها إلى "جديدة" وستُصفّر عدادات الحفظ ومحطات مسار حفظني لتبدأ رحلتك من الصفر.',
      okText: '🔄 نعم، تصفير التقدم',
      cancelText: 'إلغاء',
      isDanger: false,
      icon: '🔄'
    });
    if (!ok) return;

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
    showToast('🔄 تم تصفير جميع حالات الكلمات والتقدم بنجاح.', 'success');
  }

  async function resetAll() {
    if (!state.vocabulary.length) {
      showToast('⚠️ لا توجد كلمات لحذفها، القائمة فارغة بالفعل.', 'warning');
      return;
    }

    const count = state.vocabulary.length;
    const ok = await showConfirmDialog({
      title: '🗑️ مسح كل الكلمات والتقدم',
      subtitle: 'حذف نهائي وشامل لجميع المفردات',
      message: `تحذير: هل أنت متأكد تماماً من حذف جميع الكلمات (${count} كلمة) ومسح كل السجلات والتقدم نهائياً؟`,
      details: 'سيتم مسح كل المفردات وسجلات حفظني من هذا المتصفح ولن يمكنك استرجاعها إلا في حال وجود ملف نسخة احتياطية (JSON) لديك.',
      okText: `🗑️ نعم، امسح كل الكلمات (${count})`,
      cancelText: 'تراجع',
      isDanger: true,
      icon: '⚠️'
    });
    if (!ok) return;

    state.vocabulary = [];
    state.currentIndex = 0;
    state.selectedIds = [];
    state.studyFilter = 'all';
    state.hafazni = { active: false, sessionWords: [], currentIndex: 0, totalWords: 0, activeLessonId: null, mistakes: [], processing: false, summary: { correct: 0, wrong: 0, attempts: 0, mastered: [], needsReview: [] } };
    state.hafazniLessons = { mode: 'manual', lessonSize: 10, completedLessonIds: [], dailyUnlockedCount: 1, lastUnlockDate: null };
    if (el.hafazniSession) el.hafazniSession.style.display = 'none';
    if (el.hafazniSummary) el.hafazniSummary.style.display = 'none';
    if (el.hafazniLessonsCard) el.hafazniLessonsCard.style.display = 'block';
    if (el.hafazniSetupCard) el.hafazniSetupCard.style.display = 'block';
    storageSet(STORAGE_KEY, buildPersistedState());
    saveState(true);
    updateAllViews();
    navigateTo('homePage');
    showToast(`🗑️ تم مسح جميع الكلمات (${count} كلمة) بنجاح.`, 'success');
  }

  function openModal(modal) { if (modal) modal.style.display = 'flex'; }
  function closeModal(modal) { if (modal) modal.style.display = 'none'; }

  let activeConfirmResolve = null;

  function showConfirmDialog({
    title = 'تأكيد الإجراء',
    subtitle = 'يرجى التأكيد للمتابعة',
    message = 'هل أنت متأكد من تنفيذ هذا الإجراء؟',
    details = '',
    okText = 'تأكيد',
    cancelText = 'إلغاء',
    isDanger = true,
    icon = '🗑️'
  } = {}) {
    return new Promise((resolve) => {
      if (activeConfirmResolve) {
        activeConfirmResolve(false);
        activeConfirmResolve = null;
      }

      if (!el.confirmActionModal) {
        try {
          resolve(window.confirm(message));
        } catch (_) {
          resolve(true);
        }
        return;
      }

      activeConfirmResolve = resolve;

      if (el.confirmModalTitle) el.confirmModalTitle.textContent = title;
      if (el.confirmModalSubtitle) el.confirmModalSubtitle.textContent = subtitle;
      if (el.confirmModalMessage) el.confirmModalMessage.textContent = message;
      if (el.confirmModalIcon) {
        el.confirmModalIcon.textContent = icon;
        el.confirmModalIcon.className = 'confirm-modal-icon ' + (isDanger ? 'danger' : 'primary');
      }

      if (el.confirmModalDetails) {
        if (details) {
          el.confirmModalDetails.textContent = details;
          el.confirmModalDetails.style.display = 'block';
        } else {
          el.confirmModalDetails.style.display = 'none';
        }
      }

      if (el.confirmModalOkBtn) {
        el.confirmModalOkBtn.textContent = okText;
        el.confirmModalOkBtn.className = isDanger ? 'ctrl-btn danger-btn' : 'ctrl-btn primary';
      }

      if (el.confirmModalCancelBtn) {
        el.confirmModalCancelBtn.textContent = cancelText;
      }

      openModal(el.confirmActionModal);
    });
  }

  function closeConfirmDialog(result = false) {
    if (el.confirmActionModal) {
      closeModal(el.confirmActionModal);
    }
    if (activeConfirmResolve) {
      const res = activeConfirmResolve;
      activeConfirmResolve = null;
      res(Boolean(result));
    }
  }

  let toastTimer = null;
  function showToast(message, type = 'info', duration = 3200) {
    if (!el.appToast) return;
    if (toastTimer) clearTimeout(toastTimer);

    el.appToast.textContent = message;
    el.appToast.className = `app-toast ${type} visible`;

    toastTimer = setTimeout(() => {
      if (el.appToast) {
        el.appToast.classList.remove('visible');
      }
    }, duration);
  }

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
      const word = getCurrentStudyWord();
      if (word) speak(word.english);
    });

    el.checkBtn.addEventListener('click', () => {
      checkWriting();
    });

    el.hintBtn.addEventListener('click', () => {
      showHint();
    });

    el.skipBtn.addEventListener('click', () => {
      if (state.testLocked) return;
      moveStudy(1);
    });

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
    el.deleteSelectedBtn?.addEventListener('click', deleteSelectedWords);
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
    el.exportTsvAllBtn?.addEventListener('click', () => {
      closeModal(el.exportWordsModal);
      exportTsvWords('all');
    });
    el.exportTsvDifficultBtn?.addEventListener('click', () => {
      closeModal(el.exportWordsModal);
      exportTsvWords('difficult');
    });
    el.resetProgressBtn.addEventListener('click', resetProgress);
    el.resetBtn.addEventListener('click', resetAll);

    el.searchInput.addEventListener('input', event => {
      state.search = event.target.value;
      renderWordList(state.search);
    });

    el.startHafazniBtn.addEventListener('click', () => {
      if (!state.selectedIds.length) {
        showToast('⚠️ حدد كلمات أولاً من صفحة الكلمات للبدء.', 'warning');
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
        showToast('🔒 هذا الدرس مقفل. أتمم الدرس السابق لفتحه بالتسلسل.', 'warning');
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
      const session = state.hafazni;
      const sessionWord = session.sessionWords[session.currentIndex];
      if (sessionWord) {
        sessionWord.wrong++;
        session.summary.wrong++;
        if (!session.mistakes.includes(sessionWord.id)) session.mistakes.push(sessionWord.id);

        const originalWord = state.vocabulary.find(w => w.id === sessionWord.id);
        if (originalWord) {
          originalWord.wrongCount++;
          originalWord.status = 'difficult';
          originalWord.interval = 0;
          originalWord.lastReview = now();
          originalWord.due = now();
        }

        saveState(true);
        updateStats();

        if (session.isCheckpoint) {
          session.currentIndex++;
          if (session.currentIndex >= session.sessionWords.length) {
            finishHafazniSession();
            return;
          }
        } else {
          // نقلها للتكرار في الجلسة العادية
          const words = session.sessionWords;
          const removed = words.splice(session.currentIndex, 1)[0];
          const insertPos = Math.min(session.currentIndex + 1, words.length);
          words.splice(insertPos, 0, removed);
        }
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

    el.jumpToCurrentLessonBtn?.addEventListener('click', () => {
      if (!el.hafazniLessonPath) return;
      const target = el.hafazniLessonPath.querySelector('.lesson-node.current-target')
        || el.hafazniLessonPath.querySelector('.lesson-node.available')
        || el.hafazniLessonPath.querySelector('.lesson-node');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });

    el.helpSettingsBtn.addEventListener('click', () => openModal(el.helpModal));
    el.closeHelpModal.addEventListener('click', () => closeModal(el.helpModal));
    el.closeUpdateModal.addEventListener('click', () => closeModal(el.updateModal));
    el.viewFeaturesBtn.addEventListener('click', () => openModal(el.updateModal));

    // أحداث نافذة تعديل الكلمة والتصنيف
    el.saveEditWordBtn?.addEventListener('click', saveEditWord);
    el.cancelEditWordBtn?.addEventListener('click', closeEditWordModal);
    el.closeEditWordModal?.addEventListener('click', closeEditWordModal);
    el.deleteWordFromModalBtn?.addEventListener('click', () => {
      const wordId = el.editWordId?.value;
      if (!wordId) return;
      closeEditWordModal();
      deleteWord(wordId);
    });
    el.editWordForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      saveEditWord();
    });

    // أحداث نافذة تأكيد الإجراءات المخصصة
    el.confirmModalOkBtn?.addEventListener('click', () => closeConfirmDialog(true));
    el.confirmModalCancelBtn?.addEventListener('click', () => closeConfirmDialog(false));
    el.closeConfirmModal?.addEventListener('click', () => closeConfirmDialog(false));

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

    // أحداث الميزات الجديدة v1.5.3:
    el.startDailySprintBtn?.addEventListener('click', () => {
      startSprintSession(false);
    });
    el.closeSprintModal?.addEventListener('click', () => {
      if (sprintQuizState.timerId) {
        clearInterval(sprintQuizState.timerId);
        sprintQuizState.timerId = null;
      }
      sprintQuizState.active = false;
      closeModal(el.dailySprintModal);
    });
    el.finishSprintBtn?.addEventListener('click', () => {
      closeModal(el.dailySprintModal);
    });
    el.sprintCheckBtn?.addEventListener('click', checkSprintWriting);
    el.sprintHintBtn?.addEventListener('click', showSprintHint);
    el.sprintSkipBtn?.addEventListener('click', skipSprintQuestion);

    el.viewAchievementsBtn?.addEventListener('click', () => {
      renderAchievementsUI();
      openModal(el.achievementsModal);
    });
    el.settingsAchievementsBtn?.addEventListener('click', () => {
      renderAchievementsUI();
      openModal(el.achievementsModal);
    });
    el.closeAchievementsModal?.addEventListener('click', () => {
      closeModal(el.achievementsModal);
    });

    el.startVaultReviewBtn?.addEventListener('click', () => {
      startSprintSession(true);
    });
    el.filterVaultWordsBtn?.addEventListener('click', () => {
      state.categoryFilter = state.categoryFilter === '__vault__' ? 'all' : '__vault__';
      renderCategoryFilterBar();
      renderWordList(state.search);
      renderVaultCard();
      saveState();
    });

    window.addEventListener('click', event => {
      if (event.target === el.helpModal) closeModal(el.helpModal);
      if (event.target === el.updateModal) closeModal(el.updateModal);
      if (event.target === el.editWordModal) closeEditWordModal();
      if (event.target === el.shareWordModal) closeShareWordModal();
      if (event.target === el.exportWordsModal) closeModal(el.exportWordsModal);
      if (event.target === el.aboutUsModal) closeModal(el.aboutUsModal);
      if (event.target === el.confirmActionModal) closeConfirmDialog(false);
      if (event.target === el.dailySprintModal) {
        if (sprintQuizState.timerId) {
          clearInterval(sprintQuizState.timerId);
          sprintQuizState.timerId = null;
        }
        sprintQuizState.active = false;
        closeModal(el.dailySprintModal);
      }
      if (event.target === el.achievementsModal) closeModal(el.achievementsModal);
    });

    document.addEventListener('keydown', event => {
      const target = event.target;
      if (target && ['INPUT','TEXTAREA'].includes(target.tagName)) {
        if (event.key === 'Enter' && target === el.guessInput) {
          event.preventDefault();
          checkWriting();
        }
        if (event.key === 'Enter' && target === el.sprintInput) {
          event.preventDefault();
          checkSprintWriting();
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

    el.checkUpdateAppBtn?.addEventListener('click', () => {
      updateEngine.checkForUpdates(true);
    });

    el.forceUpdateAppBtn?.addEventListener('click', () => {
      updateEngine.applyUpdateSafely();
    });

    el.applyUpdateBtn?.addEventListener('click', () => {
      updateEngine.applyUpdateSafely();
    });

    el.dismissUpdateBtn?.addEventListener('click', () => {
      updateEngine.hideUpdateBanner();
    });

    window.addEventListener('beforeunload', () => saveState(true));
    window.addEventListener('pagehide', () => saveState(true));

    setupFeedbackForm();
  }

  // ============================================================
  // خوارزمية الفحص والتحديث الذاتي التلقائي الذكي (Auto-Update Engine)
  // ============================================================
  const updateEngine = {
    checking: false,
    updateReady: false,
    newVersionFound: null,

    // 1. فحص الاتصال بالإنترنت وسرعته وجودة الاستجابة
    async checkNetworkQuality() {
      if (!navigator.onLine) {
        return { online: false, goodSpeed: false, latency: null };
      }
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500); // مهلة صارمة 3.5 ثوانٍ
        const startTime = performance.now();
        const res = await fetch(`./version.json?_ping=${Date.now()}`, {
          method: 'GET',
          cache: 'no-store',
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        const latency = Math.round(performance.now() - startTime);
        if (!res.ok) {
          return { online: true, goodSpeed: false, latency };
        }
        const data = await res.json();
        return { online: true, goodSpeed: latency <= 3500, latency, remoteData: data };
      } catch (err) {
        return { online: false, goodSpeed: false, latency: null };
      }
    },

    // 2. التحقق هل توجد ملفات جديدة أو نسخة أحدث
    async checkForUpdates(manualTrigger = false) {
      if (this.checking) return;
      this.checking = true;

      if (manualTrigger) {
        showToast('🔍 جارٍ فحص سرعة الإنترنت والتأكد من وجود تحديثات...', 'info');
      }

      // فحص الإنترنت وجودة الاتصال
      const net = await this.checkNetworkQuality();

      // حالة عدم وجود إنترنت: لا نفعل شيئاً على الإطلاق
      if (!net.online) {
        this.checking = false;
        if (manualTrigger) {
          showToast('📡 لا يوجد اتصال بالإنترنت حالياً. التطبيق يعمل بنمط Offline بكامل كلماته وبياناته بأمان.', 'info');
        }
        return;
      }

      // حالة الإنترنت بطيء أو غير مستقر: لا نفعل شيئاً
      if (!net.goodSpeed) {
        this.checking = false;
        if (manualTrigger) {
          showToast('⚠️ اتصال الإنترنت بطيء حالياً. يفضل الانتظار حتى يستقر الاتصال لضمان سرعة التحديث.', 'warning');
        }
        return;
      }

      // مقارنة الإصدار الحالي مع إصدار السيرفر المباشر
      const remoteVersion = net.remoteData?.version;
      const isNewVersion = remoteVersion && (remoteVersion !== APP_VERSION);

      // فحص هل السيرفيس ووركر اكتشف ملفات جديدة أيضاً
      let swHasUpdate = false;
      if ('serviceWorker' in navigator) {
        try {
          const reg = await navigator.serviceWorker.getRegistration();
          if (reg) {
            await reg.update();
            if (reg.waiting || reg.installing) {
              swHasUpdate = true;
            }
          }
        } catch (_) {}
      }

      // إذا لم توجد ملفات جديدة: لا نفعل أي شيء إطلاقاً
      if (!isNewVersion && !swHasUpdate) {
        this.checking = false;
        if (manualTrigger) {
          showToast(`✅ تطبيقك محدث بالكامل على أحدث إصدار (${APP_VERSION}) ولا توجد أي ملفات جديدة!`, 'success');
        }
        return;
      }

      // توجد ملفات جديدة بالفعل!
      this.updateReady = true;
      this.newVersionFound = remoteVersion || APP_VERSION;

      if (manualTrigger) {
        await this.applyUpdateSafely();
      } else {
        // فحص: هل المستخدم منشغل بجلسة كتابة أو حفظني أو اختبار؟
        const isBusy = (sprintQuizState?.active || hafazniState?.active || testModeState?.active);
        if (!isBusy) {
          this.showUpdateBanner(this.newVersionFound);
        } else {
          // الانتظار بهدوء حتى ينتهي المستخدم من جلسته دون مقاطعة
          const pollFree = setInterval(() => {
            const stillBusy = (sprintQuizState?.active || hafazniState?.active || testModeState?.active);
            if (!stillBusy) {
              clearInterval(pollFree);
              this.showUpdateBanner(this.newVersionFound);
            }
          }, 3500);
        }
      }
      this.checking = false;
    },

    // 3. تطبيق التحديث مع الحفاظ التام بنسبة 100% على كل كلمات وتقدم ودروس المستخدم
    async applyUpdateSafely() {
      // حفظ بيانات المستخدم فوراً قبل مس أي شيء!
      saveState(true);
      showToast('🔄 جارٍ تحديث كود التطبيق مع الحفاظ التام على جميع كلماتك وتقدمك...', 'info');

      try {
        // حذف كاش ملفات الكود القديمة فقط
        if ('caches' in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map(k => caches.delete(k)));
        }
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.getRegistration();
          if (reg && reg.waiting) {
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
        }
      } catch (err) {
        console.warn('Update clear notice:', err);
      }

      // إعادة تحميل آمنة بالملفات الجديدة
      setTimeout(() => {
        const url = new URL(window.location.href);
        url.searchParams.set('refresh', Date.now().toString());
        window.location.replace(url.toString());
      }, 450);
    },

    showUpdateBanner(version) {
      if (!el.appUpdateBanner) return;
      if (el.updateBannerVersion) el.updateBannerVersion.textContent = version || APP_VERSION;
      el.appUpdateBanner.classList.remove('hidden');
    },

    hideUpdateBanner() {
      if (el.appUpdateBanner) el.appUpdateBanner.classList.add('hidden');
    }
  };

  async function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    try {
      const hadPreviousController = !!navigator.serviceWorker.controller;
      let isRefreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (hadPreviousController && !isRefreshing) {
          isRefreshing = true;
          window.location.reload();
        }
      });

      const registration = await navigator.serviceWorker.register('./sw.js', {
        scope: './',
        updateViaCache: 'none'
      });

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker?.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // كود جديد تم تنزيله في الخلفية
            updateEngine.checkForUpdates(false);
          }
        });
      });

      registration.update().catch(() => {});
      window.addEventListener('online', () => {
        registration.update().catch(() => {});
        updateEngine.checkForUpdates(false);
      });

      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          registration.update().catch(() => {});
          updateEngine.checkForUpdates(false);
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

    const hasPriorStorage = storageGet(STORAGE_KEY) !== null;
    if (!hasPriorStorage && !state.vocabulary.length) {
      state.vocabulary = normalizeVocabulary(STARTER_VOCABULARY);
      saveState(true);
    }
    
    renderWordOfTheDay();
    updateAllViews();
    checkAchievements({ silent: true });
    navigateTo('homePage', false);

    if (location.protocol === 'http:' || location.protocol === 'https:') {
      registerServiceWorker();
    }
    showUpdateIfNeeded();

    // فحص ذكي وتلقائي للتحديثات في الخلفية بعد اكتمال التحميل
    setTimeout(() => {
      updateEngine.checkForUpdates(false);
    }, 2500);

    // فحص إشعار التذكير بدرس اليوم عند الفتح وكل 15 دقيقة
    checkDailyLessonNotification();
    setInterval(() => checkDailyLessonNotification(), 15 * 60 * 1000);
  }

  init();
})();
