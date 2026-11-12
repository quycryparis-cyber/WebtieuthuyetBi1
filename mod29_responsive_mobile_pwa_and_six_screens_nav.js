/**
 * ============================================================================
 * NOIR STUDIO v38.0 — MODULE 29: BỘ ĐIỀU HƯỚNG 6 MÀN HÌNH TÁCH BIỆT,
 * RESPONSIVE MÁY TÍNH / ĐIỆN THOẠI & TRẢI NGHIỆM ỨNG DỤNG PWA
 * ============================================================================
 * Nhiệm vụ:
 *  - Quản lý duy nhất luồng chuyển đổi giữa 6 Màn hình (Tab 1 -> Tab 6) mà
 *    không bao giờ làm xung đột trạng thái hiển thị trên Desktop & Mobile.
 *  - Đồng bộ 100% thanh Tab trên đỉnh màn hình lớn (#desktop-six-tabs-nav)
 *    với thanh 6 nút dưới đáy điện thoại (#mobile-bottom-nav) & nút Quay lại.
 *  - Tối ưu hóa khung nhìn khi mở bàn phím ảo trên điện thoại (VisualViewport),
 *    lưu vị trí cuộn riêng cho từng màn hình, phím tắt Alt+1..6 & PWA Install.
 * ============================================================================
 */
(function initMod29ResponsiveNavAndPwa(globalScope) {
  'use strict';

  const NS = (globalScope.NoirStudio = globalScope.NoirStudio || {});

  /**
   * Bảng định nghĩa cấu hình 6 màn hình chuẩn hóa thống nhất với index.html & Mod 01.
   */
  const SIX_SCREENS_ROUTING_TABLE = Object.freeze({
    SCREEN_1_WRITE: {
      id: 'SCREEN_1_WRITE',
      order: 1,
      shortcutKey: '1',
      title: 'Bàn Viết Truyện',
      shortLabel: '1. Viết',
      icon: '✍️',
      documentTitleSuffix: 'Bàn Viết Truyện',
      showLeftSidebar: false,
      showCenterPaneOnDesktop: true,
      showCenterPaneOnMobile: true,
      centerSubMode: 'MANUSCRIPT',
      exclusiveSectionId: null,
      mobileQuickbarVisible: true,
    },
    SCREEN_2_FILES: {
      id: 'SCREEN_2_FILES',
      order: 2,
      shortcutKey: '2',
      title: 'Chương & File Nguồn',
      shortLabel: '2. Chương',
      icon: '📂',
      documentTitleSuffix: 'Quản Lý Chương & Nguồn',
      showLeftSidebar: true,
      showCenterPaneOnDesktop: true,
      showCenterPaneOnMobile: false,
      centerSubMode: 'MANUSCRIPT',
      exclusiveSectionId: null,
      mobileQuickbarVisible: false,
    },
    SCREEN_3_AI: {
      id: 'SCREEN_3_AI',
      order: 3,
      shortcutKey: '3',
      title: 'Trợ Lý AI & 5 Chế Độ',
      shortLabel: '3. AI',
      icon: '🤖',
      documentTitleSuffix: 'Trợ Lý AI & Biểu Đồ',
      showLeftSidebar: false,
      showCenterPaneOnDesktop: true,
      showCenterPaneOnMobile: true,
      centerSubMode: 'AI_STUDIO',
      exclusiveSectionId: null,
      mobileQuickbarVisible: false,
    },
    SCREEN_4_BIBLE: {
      id: 'SCREEN_4_BIBLE',
      order: 4,
      shortcutKey: '4',
      title: 'Story Bible & Nhân Vật',
      shortLabel: '4. Bible',
      icon: '🏛️',
      documentTitleSuffix: 'Story Bible & Nhân Vật',
      showLeftSidebar: false,
      showCenterPaneOnDesktop: false,
      showCenterPaneOnMobile: false,
      centerSubMode: 'NONE',
      exclusiveSectionId: 'right-bible-pane',
      mobileQuickbarVisible: false,
    },
    SCREEN_5_AMBIENCE: {
      id: 'SCREEN_5_AMBIENCE',
      order: 5,
      shortcutKey: '5',
      title: 'Nhạc, Pomodoro & Kiểu Chữ',
      shortLabel: '5. Nhạc',
      icon: '🎵',
      documentTitleSuffix: 'Nhạc Nền & Pomodoro',
      showLeftSidebar: false,
      showCenterPaneOnDesktop: false,
      showCenterPaneOnMobile: false,
      centerSubMode: 'NONE',
      exclusiveSectionId: 's14-screen-5-ambience',
      mobileQuickbarVisible: false,
    },
    SCREEN_6_SYSTEM: {
      id: 'SCREEN_6_SYSTEM',
      order: 6,
      shortcutKey: '6',
      title: 'Phiên Bản, Xuất File & Cài Đặt',
      shortLabel: '6. Cài đặt',
      icon: '⚙️',
      documentTitleSuffix: 'Kho Phiên Bản & Xuất Sách',
      showLeftSidebar: false,
      showCenterPaneOnDesktop: false,
      showCenterPaneOnMobile: false,
      centerSubMode: 'NONE',
      exclusiveSectionId: 's14-screen-6-system',
      mobileQuickbarVisible: false,
    },
  });

  const VALID_SCREEN_ORDER = Object.freeze([
    'SCREEN_1_WRITE',
    'SCREEN_2_FILES',
    'SCREEN_3_AI',
    'SCREEN_4_BIBLE',
    'SCREEN_5_AMBIENCE',
    'SCREEN_6_SYSTEM',
  ]);

  const BREAKPOINT_DESKTOP_PX = 1024;
  const BREAKPOINT_TABLET_PX = 640;

  /**
   * Theo dõi kích thước khung nhìn, chế độ dọc/ngang và chiều cao thật khi bàn phím ảo điện thoại mở lên.
   */
  class ResponsiveViewportProfiler {
    constructor() {
      this.currentProfile = {
        width: 1280,
        height: 800,
        tier: 'desktop',
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isLandscape: true,
        keyboardOpenLikely: false,
        keyboardHeightPx: 0,
      };
      this.listeners = new Set();
      this.baselineInnerHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
      this.boundResize = null;
      this.boundVisualResize = null;
    }

    init() {
      this.measureAndUpdate(false);
      if (typeof window === 'undefined') return;
      if (!this.boundResize) {
        this.boundResize = () => this.measureAndUpdate(true);
        window.addEventListener('resize', this.boundResize, { passive: true });
        window.addEventListener('orientationchange', () => {
          setTimeout(() => {
            this.baselineInnerHeight = window.innerHeight || this.baselineInnerHeight;
            this.measureAndUpdate(true);
          }, 120);
        });
      }
      if (window.visualViewport && !this.boundVisualResize) {
        this.boundVisualResize = () => this.measureAndUpdate(true);
        window.visualViewport.addEventListener('resize', this.boundVisualResize, { passive: true });
      }
    }

    subscribe(fn) {
      if (typeof fn === 'function') this.listeners.add(fn);
      return () => this.listeners.delete(fn);
    }

    measureAndUpdate(emitChanges = true) {
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        return this.currentProfile;
      }
      const w = Math.max(320, window.innerWidth || 1280);
      const h = Math.max(240, window.innerHeight || 800);
      const vvHeight = window.visualViewport ? window.visualViewport.height : h;

      if (h > this.baselineInnerHeight) {
        this.baselineInnerHeight = h;
      }

      const isDesktop = w >= BREAKPOINT_DESKTOP_PX;
      const isTablet = w >= BREAKPOINT_TABLET_PX && w < BREAKPOINT_DESKTOP_PX;
      const isMobile = w < BREAKPOINT_TABLET_PX;
      const tier = isDesktop ? 'desktop' : isTablet ? 'tablet' : 'mobile';

      const potentialKeyboardDelta = Math.max(0, Math.round(this.baselineInnerHeight - vvHeight));
      const keyboardOpenLikely = !isDesktop && potentialKeyboardDelta > 140;

      const prevTier = this.currentProfile.tier;
      const prevKb = this.currentProfile.keyboardOpenLikely;

      this.currentProfile = {
        width: w,
        height: h,
        visualViewportHeight: Math.round(vvHeight),
        tier,
        isMobile,
        isTablet,
        isDesktop,
        isLandscape: w > h,
        keyboardOpenLikely,
        keyboardHeightPx: keyboardOpenLikely ? potentialKeyboardDelta : 0,
      };

      const rootEl = document.documentElement;
      rootEl.dataset.studioViewport = tier;
      rootEl.dataset.keyboardOpen = keyboardOpenLikely ? 'true' : 'false';
      rootEl.style.setProperty('--studio-vh', `${(vvHeight * 0.01).toFixed(2)}px`);

      // Trên điện thoại khi mở bàn phím gõ truyện, tự động ẩn tạm thanh Bottom Nav để không che mất vùng gõ
      const mobileBottomNav = document.getElementById('mobile-bottom-nav');
      if (mobileBottomNav) {
        if (keyboardOpenLikely && document.activeElement?.matches?.('textarea, input')) {
          mobileBottomNav.classList.add('hidden');
        } else {
          mobileBottomNav.classList.remove('hidden');
        }
      }

      if (emitChanges && (prevTier !== tier || prevKb !== keyboardOpenLikely)) {
        this.listeners.forEach((fn) => {
          try {
            fn(this.currentProfile);
          } catch (_err) {
            // Bỏ qua lỗi listener đơn lẻ
          }
        });
      }
      return this.currentProfile;
    }

    getProfile() {
      return { ...this.currentProfile };
    }
  }

  /**
   * Quản lý trạng thái cài đặt ứng dụng Web App (PWA) & khả năng chạy ngoại tuyến qua Service Worker.
   */
  class PwaInstallAndOfflineManager {
    constructor() {
      this.deferredInstallPrompt = null;
      this.isInstalledStandalone = false;
      this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine !== false : true;
      this.statusListeners = new Set();
    }

    init() {
      if (typeof window === 'undefined') return;
      this.detectStandaloneMode();
      window.addEventListener('beforeinstallprompt', (ev) => {
        ev.preventDefault();
        this.deferredInstallPrompt = ev;
        this.notifyStatusChanged();
      });
      window.addEventListener('appinstalled', () => {
        this.deferredInstallPrompt = null;
        this.isInstalledStandalone = true;
        this.notifyStatusChanged();
        NS.uiUtils?.showToast?.('Đã cài Noir Studio thành ứng dụng độc lập trên thiết bị!', 'success');
      });
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.notifyStatusChanged();
      });
      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.notifyStatusChanged();
      });
    }

    detectStandaloneMode() {
      if (typeof window === 'undefined') return false;
      const byMedia =
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(display-mode: standalone)').matches;
      const byIosStandalone = Boolean(window.navigator?.standalone);
      this.isInstalledStandalone = Boolean(byMedia || byIosStandalone);
      return this.isInstalledStandalone;
    }

    canPromptInstall() {
      return Boolean(this.deferredInstallPrompt) && !this.isInstalledStandalone;
    }

    async triggerPwaInstall() {
      if (!this.deferredInstallPrompt) {
        if (this.isInstalledStandalone) {
          NS.uiUtils?.showToast?.('Ứng dụng đã được cài đặt ở chế độ độc lập.', 'info');
          return { outcome: 'already_installed' };
        }
        NS.uiUtils?.showToast?.(
          'Hãy chọn menu trình duyệt -> "Thêm vào màn hình chính / Cài đặt ứng dụng" để cài làm App.',
          'info'
        );
        return { outcome: 'manual_guide' };
      }
      try {
        this.deferredInstallPrompt.prompt();
        const choice = await this.deferredInstallPrompt.userChoice;
        this.deferredInstallPrompt = null;
        this.notifyStatusChanged();
        return choice || { outcome: 'dismissed' };
      } catch (_err) {
        return { outcome: 'error' };
      }
    }

    subscribe(cb) {
      if (typeof cb === 'function') this.statusListeners.add(cb);
      return () => this.statusListeners.delete(cb);
    }

    notifyStatusChanged() {
      const snap = this.getStatusSummary();
      this.statusListeners.forEach((fn) => {
        try {
          fn(snap);
        } catch (_err) {
          // Không chặn luồng chính
        }
      });
    }

    getStatusSummary() {
      return {
        isInstalledStandalone: this.isInstalledStandalone,
        canPromptInstall: this.canPromptInstall(),
        isOnline: this.isOnline,
        protocol: typeof location !== 'undefined' ? location.protocol : 'file:',
      };
    }
  }

  /**
   * Ghi nhớ vị trí cuộn của từng màn hình & lưu trạng thái đóng mở các bảng phụ trong Tab 5.
   */
  class ScreenScrollAndPanelMemory {
    constructor(storageKey = 'noir_nav_state_v38') {
      this.storageKey = storageKey;
      this.scrollMap = new Map();
      this.persisted = this.loadState();
    }

    loadState() {
      try {
        if (typeof localStorage === 'undefined') return { activeScreen: 'SCREEN_1_WRITE' };
        const raw = localStorage.getItem(this.storageKey);
        if (!raw) return { activeScreen: 'SCREEN_1_WRITE' };
        const parsed = JSON.parse(raw);
        return {
          activeScreen: SIX_SCREENS_ROUTING_TABLE[parsed?.activeScreen]
            ? parsed.activeScreen
            : 'SCREEN_1_WRITE',
          subPanelsHidden: parsed?.subPanelsHidden && typeof parsed.subPanelsHidden === 'object'
            ? parsed.subPanelsHidden
            : {},
        };
      } catch (_err) {
        return { activeScreen: 'SCREEN_1_WRITE', subPanelsHidden: {} };
      }
    }

    saveState() {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(this.storageKey, JSON.stringify(this.persisted));
        }
      } catch (_err) {
        // Không làm gián đoạn quá trình chuyển Tab nếu Storage đầy
      }
    }

    getLastActiveScreen() {
      return this.persisted.activeScreen || 'SCREEN_1_WRITE';
    }

    setLastActiveScreen(screenId) {
      if (!SIX_SCREENS_ROUTING_TABLE[screenId]) return;
      this.persisted.activeScreen = screenId;
      this.saveState();
    }

    captureScrollPosition(screenId) {
      if (typeof document === 'undefined' || !screenId) return;
      const containerIds = {
        SCREEN_1_WRITE: 'textarea-chapter-content',
        SCREEN_2_FILES: 'chapter-tree-container',
        SCREEN_3_AI: 'pane-left-beats',
        SCREEN_4_BIBLE: 'right-bible-pane',
        SCREEN_5_AMBIENCE: 's14-screen-5-ambience',
        SCREEN_6_SYSTEM: 's14-screen-6-system',
      };
      const el = document.getElementById(containerIds[screenId]);
      if (el) {
        this.scrollMap.set(screenId, el.scrollTop || 0);
      }
    }

    restoreScrollPosition(screenId) {
      if (typeof document === 'undefined' || !screenId) return;
      if (!this.scrollMap.has(screenId)) return;
      const containerIds = {
        SCREEN_1_WRITE: 'textarea-chapter-content',
        SCREEN_2_FILES: 'chapter-tree-container',
        SCREEN_3_AI: 'pane-left-beats',
        SCREEN_4_BIBLE: 'right-bible-pane',
        SCREEN_5_AMBIENCE: 's14-screen-5-ambience',
        SCREEN_6_SYSTEM: 's14-screen-6-system',
      };
      const el = document.getElementById(containerIds[screenId]);
      if (el) {
        const savedTop = this.scrollMap.get(screenId) || 0;
        if (typeof requestAnimationFrame === 'function') {
          requestAnimationFrame(() => {
            el.scrollTop = savedTop;
          });
        } else {
          el.scrollTop = savedTop;
        }
      }
    }
  }

  /**
   * Hỗ trợ vuốt ngang nhẹ trên màn hình cảm ứng (bỏ qua vùng soạn thảo để không cản trở bôi đen chữ)
   * và tối ưu trải nghiệm gõ chữ trên điện thoại.
   */
  class TouchSwipeAndMobileErgonomics {
    constructor(navigatorRef) {
      this.navigator = navigatorRef;
      this.swipeEnabled = false;
      this.touchStartX = 0;
      this.touchStartY = 0;
      this.touchStartTimeMs = 0;
      this.trackingSwipe = false;
      this.minSwipeDistancePx = 88;
      this.maxVerticalDriftPx = 44;
      this.maxSwipeDurationMs = 450;
      this.boundStart = null;
      this.boundEnd = null;
    }

    init() {
      if (typeof document === 'undefined') return;
      this.applyTouchViewportMetaAndOverscroll();
      const workspace = document.getElementById('app-main-workspace');
      if (!workspace || workspace.dataset.mod29TouchBound === 'true') return;
      workspace.dataset.mod29TouchBound = 'true';

      this.boundStart = (ev) => this.handleTouchStart(ev);
      this.boundEnd = (ev) => this.handleTouchEnd(ev);
      workspace.addEventListener('touchstart', this.boundStart, { passive: true });
      workspace.addEventListener('touchend', this.boundEnd, { passive: true });
    }

    setSwipeEnabled(flag) {
      this.swipeEnabled = Boolean(flag);
    }

    triggerSoftHapticTap(ms = 6) {
      try {
        if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
          navigator.vibrate(ms);
        }
      } catch (_err) {
        // Không làm gián đoạn trên thiết bị không hỗ trợ rung
      }
    }

    applyTouchViewportMetaAndOverscroll() {
      if (typeof document === 'undefined') return;
      document.documentElement.style.overscrollBehaviorY = 'contain';
      if (document.body) {
        document.body.style.overscrollBehaviorY = 'contain';
      }
    }

    isTouchBlockedElement(target) {
      if (!target || typeof target.closest !== 'function') return true;
      return Boolean(
        target.closest(
          'textarea, input, select, button, a, pre, code, canvas, svg, .select-text, [contenteditable="true"]'
        )
      );
    }

    handleTouchStart(ev) {
      if (!this.swipeEnabled) return;
      if (!ev.touches || ev.touches.length !== 1) {
        this.trackingSwipe = false;
        return;
      }
      if (this.isTouchBlockedElement(ev.target)) {
        this.trackingSwipe = false;
        return;
      }
      const touch = ev.touches[0];
      this.touchStartX = touch.clientX;
      this.touchStartY = touch.clientY;
      this.touchStartTimeMs = Date.now();
      this.trackingSwipe = true;
    }

    handleTouchEnd(ev) {
      if (!this.trackingSwipe || !this.swipeEnabled) return;
      this.trackingSwipe = false;
      if (!ev.changedTouches || ev.changedTouches.length !== 1) return;

      const touch = ev.changedTouches[0];
      const dx = touch.clientX - this.touchStartX;
      const dy = Math.abs(touch.clientY - this.touchStartY);
      const elapsed = Date.now() - this.touchStartTimeMs;

      if (elapsed > this.maxSwipeDurationMs || dy > this.maxVerticalDriftPx) return;
      if (Math.abs(dx) < this.minSwipeDistancePx) return;

      const curId = this.navigator.getCurrentScreen();
      const idx = VALID_SCREEN_ORDER.indexOf(curId);
      if (idx < 0) return;

      if (dx < 0 && idx < VALID_SCREEN_ORDER.length - 1) {
        this.triggerSoftHapticTap(8);
        this.navigator.navigateToScreen(VALID_SCREEN_ORDER[idx + 1]);
      } else if (dx > 0 && idx > 0) {
        this.triggerSoftHapticTap(8);
        this.navigator.navigateToScreen(VALID_SCREEN_ORDER[idx - 1]);
      }
    }
  }

  /**
   * Quản lý phím tắt điều hướng nhanh giữa 6 màn hình (Alt+1..6) và Zen Mode.
   */
  class KeyboardNavigationController {
    constructor(navigatorRef) {
      this.navigator = navigatorRef;
      this.hasBound = false;
    }

    init() {
      if (typeof document === 'undefined' || this.hasBound) return;
      this.hasBound = true;
      document.addEventListener('keydown', (ev) => this.handleGlobalKeydown(ev));
    }

    isModalCurrentlyOpen() {
      if (NS.modalStack?.hasOpenModals?.()) return true;
      if (typeof document === 'undefined') return false;
      const openBackdrop = document.querySelector(
        '[id^="modal-"]:not(.hidden), #global-ai-blocking-loader:not(.hidden)'
      );
      return Boolean(openBackdrop);
    }

    handleGlobalKeydown(ev) {
      if (!ev) return;

      // Alt + 1..6: Nhảy thẳng tới 1 trong 6 màn hình chính
      if (ev.altKey && !ev.ctrlKey && !ev.metaKey && !ev.shiftKey) {
        const keyDigit = ev.key;
        const matched = Object.values(SIX_SCREENS_ROUTING_TABLE).find(
          (cfg) => cfg.shortcutKey === keyDigit
        );
        if (matched) {
          ev.preventDefault();
          this.navigator.navigateToScreen(matched.id);
          return;
        }
        if (ev.key === 'ArrowLeft') {
          ev.preventDefault();
          this.navigator.stepScreen(-1);
          return;
        }
        if (ev.key === 'ArrowRight') {
          ev.preventDefault();
          this.navigator.stepScreen(1);
          return;
        }
      }

      // Phím F11 bật/tắt Zen Mode trên trình duyệt mà không phá Modal đang mở
      if (ev.key === 'F11' && !this.isModalCurrentlyOpen()) {
        if (typeof NS.ambience?.toggleZenFullscreenMode === 'function') {
          ev.preventDefault();
          NS.ambience.toggleZenFullscreenMode();
        }
      }
    }
  }

  /**
   * Bộ chuyển đổi DOM thuần khiết đảm bảo 6 màn hình không bao giờ xung đột hiển thị.
   */
  class ResponsiveNavigationLayoutApplier {
    constructor(viewportProfiler) {
      this.viewportProfiler = viewportProfiler;
    }

    getPaneElements() {
      if (typeof document === 'undefined') return {};
      return {
        body: document.body,
        leftSidebarPane: document.getElementById('left-sidebar-pane'),
        centerEditorPane: document.getElementById('center-editor-pane'),
        paneLeftBeats: document.getElementById('pane-left-beats'),
        paneRightManuscript: document.getElementById('pane-right-manuscript'),
        stage2MountPoint: document.getElementById('stage2-telemetry-mount-point'),
        rightBiblePane: document.getElementById('right-bible-pane'),
        screen5Ambience: document.getElementById('s14-screen-5-ambience'),
        screen6System: document.getElementById('s14-screen-6-system'),
        mobileQuickbar: document.getElementById('mobile-writer-quickbar'),
      };
    }

    applyScreenVisibility(screenId, viewportSnapshot) {
      const cfg = SIX_SCREENS_ROUTING_TABLE[screenId] || SIX_SCREENS_ROUTING_TABLE.SCREEN_1_WRITE;
      const panes = this.getPaneElements();
      const vp = viewportSnapshot || this.viewportProfiler.getProfile();

      if (panes.body) {
        panes.body.dataset.s14Screen = cfg.id;
      }

      // 1. Cột Trái (Tab 2: Chương & Nguồn)
      if (panes.leftSidebarPane) {
        panes.leftSidebarPane.classList.toggle('hidden', !cfg.showLeftSidebar);
      }

      // 2. Khu vực Giữa (Tab 1 & Tab 3, đồng thời xem kèm trên Desktop ở Tab 2)
      if (panes.centerEditorPane) {
        const visibleOnDesktop = cfg.showCenterPaneOnDesktop;
        const visibleOnMobile = cfg.showCenterPaneOnMobile;

        // Xóa sạch trạng thái lớp Tailwind cũ trước khi đặt lại chính xác
        panes.centerEditorPane.classList.remove('hidden', 'lg:flex');

        if (!visibleOnDesktop && !visibleOnMobile) {
          panes.centerEditorPane.classList.add('hidden');
        } else if (visibleOnDesktop && !visibleOnMobile) {
          // Tab 2: Trên điện thoại ẩn khu giữa để danh sách chương tràn màn hình; Desktop vẫn chia 2 cột đẹp
          panes.centerEditorPane.classList.add('hidden', 'lg:flex');
        } else if (!vp.isDesktop && !visibleOnMobile) {
          panes.centerEditorPane.classList.add('hidden');
        }
      }

      // 3. Chia chế độ con trong #center-editor-pane giữa Tab 1 (Bản thảo) và Tab 3 (AI 5 Chế độ)
      if (panes.paneLeftBeats) {
        panes.paneLeftBeats.classList.toggle('hidden', cfg.centerSubMode !== 'AI_STUDIO');
      }
      if (panes.paneRightManuscript) {
        panes.paneRightManuscript.classList.toggle('hidden', cfg.centerSubMode !== 'MANUSCRIPT');
      }
      if (panes.stage2MountPoint) {
        panes.stage2MountPoint.classList.toggle('hidden', cfg.centerSubMode !== 'AI_STUDIO');
      }
      if (panes.mobileQuickbar) {
        panes.mobileQuickbar.classList.toggle('invisible', !cfg.mobileQuickbarVisible);
      }

      // 4. Các Màn hình Độc lập Toàn Trang (Tab 4 Bible, Tab 5 Ambience, Tab 6 System)
      if (panes.rightBiblePane) {
        panes.rightBiblePane.classList.toggle('hidden', cfg.exclusiveSectionId !== 'right-bible-pane');
      }
      if (panes.screen5Ambience) {
        panes.screen5Ambience.classList.toggle('hidden', cfg.exclusiveSectionId !== 's14-screen-5-ambience');
      }
      if (panes.screen6System) {
        panes.screen6System.classList.toggle('hidden', cfg.exclusiveSectionId !== 's14-screen-6-system');
      }

      this.syncNavigationTabActiveStates(cfg.id);
      this.syncDocumentTitle(cfg);
      return cfg;
    }

    syncNavigationTabActiveStates(activeScreenId) {
      if (typeof document === 'undefined') return;
      const allNavTabs = document.querySelectorAll('.s14-nav-tab[data-s14-tab]');
      allNavTabs.forEach((btn) => {
        const tabId = btn.getAttribute('data-s14-tab');
        const isActive = tabId === activeScreenId;
        btn.classList.toggle('active-tab', isActive);
        btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
        if (isActive) {
          btn.setAttribute('aria-current', 'page');
        } else {
          btn.removeAttribute('aria-current');
        }

        // Cập nhật màu chữ trực quan cho nút dưới đáy điện thoại
        const insideMobile = Boolean(btn.closest('#mobile-bottom-nav'));
        if (insideMobile) {
          btn.classList.toggle('text-emerald-400', isActive);
          btn.classList.toggle('bg-emerald-500/15', isActive);
          btn.classList.toggle('text-zinc-400', !isActive);
        }
      });
    }

    syncDocumentTitle(screenConfig) {
      if (typeof document === 'undefined' || !screenConfig) return;
      const baseBrand = 'Noir Studio';
      document.title = `${screenConfig.documentTitleSuffix} — ${baseBrand}`;
    }

    ensureTab5SubPanelArrowsSynced() {
      if (typeof document === 'undefined') return;
      document.querySelectorAll('.bug13-toggle-option-btn[data-bug13-target]').forEach((btn) => {
        const targetId = btn.getAttribute('data-bug13-target');
        const panel = targetId ? document.getElementById(targetId) : null;
        if (!panel) return;
        const hidden = panel.classList.contains('hidden');
        btn.setAttribute('aria-expanded', hidden ? 'false' : 'true');
        const arrow = btn.querySelector('.bug13-arrow');
        if (arrow) {
          arrow.textContent = hidden ? '▾' : '▴';
        }
      });
    }

    openSpecificTab5Panel(targetPanelId, collapseOthers = false) {
      if (typeof document === 'undefined' || !targetPanelId) return false;
      const panelIds = ['s14-panel-music-box', 's14-panel-pomodoro-box', 's14-panel-typography-box'];
      let opened = false;
      for (const pid of panelIds) {
        const panelEl = document.getElementById(pid);
        if (!panelEl) continue;
        if (pid === targetPanelId) {
          panelEl.classList.remove('hidden');
          opened = true;
        } else if (collapseOthers) {
          panelEl.classList.add('hidden');
        }
      }
      this.ensureTab5SubPanelArrowsSynced();
      return opened;
    }
  }

  /**
   * Điều chỉnh khoảng trống an toàn cho Bottom Nav & vị trí các thanh nổi trên màn hình điện thoại.
   */
  class MobileFloatingElementsCoexistenceAdapter {
    constructor(viewportProfiler) {
      this.viewportProfiler = viewportProfiler;
    }

    adjustFloatingOverlaysForViewport(screenId, vpProfile) {
      if (typeof document === 'undefined') return;
      const vp = vpProfile || this.viewportProfiler.getProfile();
      const floatingPomo = document.getElementById('s15-floating-pomodoro-pill');
      const mascotEl = document.getElementById('bi-so-8-mascot-widget') || document.getElementById('bi-mascot-pill');
      const appMain = document.getElementById('app-main-workspace');

      if (appMain) {
        if (!vp.isDesktop && !vp.keyboardOpenLikely) {
          appMain.style.paddingBottom = '56px';
        } else {
          appMain.style.paddingBottom = '0px';
        }
      }

      if (floatingPomo) {
        if (!vp.isDesktop) {
          floatingPomo.style.bottom = vp.keyboardOpenLikely ? '10px' : '66px';
        } else {
          floatingPomo.style.bottom = '';
        }
      }

      if (mascotEl) {
        if (!vp.isDesktop) {
          mascotEl.style.bottom = vp.keyboardOpenLikely ? '12px' : '68px';
        } else {
          mascotEl.style.bottom = '';
        }
      }

      // Đảm bảo ở Tab 1 trên điện thoại, thanh viết nhanh không bị che mất phần cuối trang
      const editorTextarea =
        document.getElementById('textarea-chapter-content') ||
        document.getElementById('manuscript-editor');
      if (editorTextarea && screenId === 'SCREEN_1_WRITE') {
        editorTextarea.style.scrollPaddingBottom = vp.isDesktop ? '24px' : '80px';
      }
    }
  }

  /**
   * Chạy các tác vụ đồng bộ giao diện nhẹ khi người dùng vừa chuyển sang một trong 6 màn hình.
   */
  class ScreenEntryContextCoordinator {
    onEnterScreen(screenId, _previousScreenId, layoutApplier) {
      try {
        switch (screenId) {
          case 'SCREEN_1_WRITE': {
            NS.chapterManager?.updateActiveStatusBadgeUI?.();
            NS.webNovelFeatures?.updateDailyGoalFromActiveProject?.();
            break;
          }
          case 'SCREEN_2_FILES': {
            NS.chapterManager?.renderChapterTreeAndQuickSwitcher?.();
            break;
          }
          case 'SCREEN_3_AI': {
            NS.sceneBuilder?.liveBadgeBridge?.refreshAllCommandBadges?.();
            NS.tab3Controller?.renderCurrentActiveModeView?.();
            NS.mode5Studio?.refreshChapterChecklist?.();
            break;
          }
          case 'SCREEN_4_BIBLE': {
            NS.storyBible?.renderAllViews?.();
            NS.storyBible?.renderAll?.();
            break;
          }
          case 'SCREEN_5_AMBIENCE': {
            NS.pomodoro?.syncAllViews?.();
            layoutApplier?.ensureTab5SubPanelArrowsSynced?.();
            break;
          }
          case 'SCREEN_6_SYSTEM': {
            NS.versionVault?.renderVersionListUI?.();
            NS.geminiRouter?.populateAllModelDropdowns?.();
            break;
          }
          default:
            break;
        }
      } catch (_err) {
        // Luôn bảo vệ luồng chuyển màn hình nếu 1 mô-đun con chưa sẵn sàng
      }
    }
  }

  /**
   * Nhật ký lịch sử điều hướng giữa 6 màn hình hỗ trợ nút Quay Lại thông minh.
   */
  class ScreenHistoryStackManager {
    constructor(maxDepth = 30) {
      this.maxDepth = maxDepth;
      this.stack = ['SCREEN_1_WRITE'];
      this.pointer = 0;
    }

    pushScreen(screenId) {
      if (!SIX_SCREENS_ROUTING_TABLE[screenId]) return;
      if (this.stack[this.pointer] === screenId) return;
      this.stack = this.stack.slice(0, this.pointer + 1);
      this.stack.push(screenId);
      if (this.stack.length > this.maxDepth) {
        this.stack.shift();
      } else {
        this.pointer += 1;
      }
      this.pointer = this.stack.length - 1;
    }

    canGoBack() {
      return this.pointer > 0;
    }

    canGoForward() {
      return this.pointer < this.stack.length - 1;
    }

    stepBack() {
      if (!this.canGoBack()) return null;
      this.pointer -= 1;
      return this.stack[this.pointer];
    }

    stepForward() {
      if (!this.canGoForward()) return null;
      this.pointer += 1;
      return this.stack[this.pointer];
    }

    getBreadcrumbSummary() {
      return this.stack.slice(Math.max(0, this.pointer - 3), this.pointer + 1);
    }
  }

  /**
   * Trình giữ kích thước font & hiển thị thanh trạng thái đồng bộ đa thiết bị trên Header.
   */
  class ResponsiveHeaderBadgeHelper {
    syncDeviceStatusIndicators(vpProfile, pwaStatus) {
      if (typeof document === 'undefined') return;
      const body = document.body;
      if (body && vpProfile) {
        body.dataset.deviceTier = vpProfile.tier;
        body.dataset.isTouch = vpProfile.isDesktop ? 'false' : 'true';
      }
      const root = document.documentElement;
      if (root && pwaStatus) {
        root.dataset.pwaStandalone = pwaStatus.isInstalledStandalone ? 'true' : 'false';
        root.dataset.networkStatus = pwaStatus.isOnline ? 'online' : 'offline';
      }
    }

    focusBestTargetForScreen(screenId) {
      if (typeof document === 'undefined') return;
      // Không tự động cướp bàn phím trên điện thoại khi người dùng chỉ lướt tab
      const isDesktop =
        typeof window !== 'undefined' && window.innerWidth >= BREAKPOINT_DESKTOP_PX;
      if (!isDesktop) return;

      if (screenId === 'SCREEN_2_FILES') {
        document.getElementById('rag-search-input')?.focus?.({ preventScroll: true });
      }
    }
  }

  /**
   * Quản lý trạng thái mở/đóng từng hộp con trong Tab 5 và đồng bộ không xung đột với Mod 21.
   */
  class Tab5AccordionSafetyGuard {
    ensureSafeFallbackBindings(panelMemory, layoutApplier) {
      if (typeof document === 'undefined') return;
      const btns = document.querySelectorAll('.bug13-toggle-option-btn[data-bug13-target]');
      btns.forEach((btn) => {
        // Nếu Mod 21 đã gắn sự kiện click, chỉ gắn thêm listener đồng bộ arrow sau tick, KHÔNG toggle ngược lại!
        if (btn.dataset.mod21Bound === 'true') {
          if (!btn.dataset.mod29AriaSynced) {
            btn.dataset.mod29AriaSynced = 'true';
            btn.addEventListener('click', () => {
              setTimeout(() => {
                layoutApplier.ensureTab5SubPanelArrowsSynced();
                const targetId = btn.getAttribute('data-bug13-target');
                const panel = targetId ? document.getElementById(targetId) : null;
                if (panel && panelMemory?.persisted?.subPanelsHidden) {
                  panelMemory.persisted.subPanelsHidden[targetId] = panel.classList.contains('hidden');
                  panelMemory.saveState();
                }
              }, 0);
            });
          }
          return;
        }

        // Trường hợp Mod 21 chưa chạy kịp, Mod 29 đảm nhận làm cầu nối dự phòng duy nhất
        if (btn.dataset.mod29FallbackBound === 'true') return;
        btn.dataset.mod29FallbackBound = 'true';
        btn.addEventListener('click', () => {
          if (btn.dataset.mod21Bound === 'true') return;
          const targetId = btn.getAttribute('data-bug13-target');
          const panel = targetId ? document.getElementById(targetId) : null;
          if (!panel) return;
          const isHidden = panel.classList.toggle('hidden');
          layoutApplier.ensureTab5SubPanelArrowsSynced();
          if (panelMemory?.persisted?.subPanelsHidden) {
            panelMemory.persisted.subPanelsHidden[targetId] = isHidden;
            panelMemory.saveState();
          }
        });
      });

      layoutApplier.ensureTab5SubPanelArrowsSynced();
    }
  }

  /**
   * Kiểm tra tùy chọn giảm chuyển động, độ tương phản và thông số vùng an toàn trên thiết bị di động.
   */
  class DeviceAccessibilityAndSafeAreaMonitor {
    constructor() {
      this.prefersReducedMotion = false;
      this.prefersDarkScheme = true;
    }

    init() {
      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
      const motionMq = window.matchMedia('(prefers-reduced-motion: reduce)');
      const darkMq = window.matchMedia('(prefers-color-scheme: dark)');

      this.prefersReducedMotion = Boolean(motionMq.matches);
      this.prefersDarkScheme = Boolean(darkMq.matches);
      this.applyAccessibilityAttributes();

      if (typeof motionMq.addEventListener === 'function') {
        motionMq.addEventListener('change', (ev) => {
          this.prefersReducedMotion = Boolean(ev.matches);
          this.applyAccessibilityAttributes();
        });
      }
      if (typeof darkMq.addEventListener === 'function') {
        darkMq.addEventListener('change', (ev) => {
          this.prefersDarkScheme = Boolean(ev.matches);
          this.applyAccessibilityAttributes();
        });
      }
    }

    applyAccessibilityAttributes() {
      if (typeof document === 'undefined') return;
      document.documentElement.dataset.reducedMotion = this.prefersReducedMotion ? 'true' : 'false';
      document.documentElement.dataset.osColorScheme = this.prefersDarkScheme ? 'dark' : 'light';
    }

    getSummary() {
      return {
        prefersReducedMotion: this.prefersReducedMotion,
        prefersDarkScheme: this.prefersDarkScheme,
      };
    }
  }

  /**
   * Đồng bộ URL Hash (#tab=1..6) nhẹ nhàng để có thể chia sẻ hoặc giữ ngữ cảnh khi tải lại trang.
   */
  class ScreenUrlHashRouterBridge {
    resolveScreenFromUrlHash() {
      if (typeof window === 'undefined' || !window.location) return null;
      const hash = String(window.location.hash || '').trim();
      if (!hash) return null;
      const match = hash.match(/tab=([1-6])/i) || hash.match(/screen=(SCREEN_[1-6]_[A-Z]+)/i);
      if (!match) return null;
      const token = match[1];
      if (/^[1-6]$/.test(token)) {
        return VALID_SCREEN_ORDER[parseInt(token, 10) - 1] || null;
      }
      return SIX_SCREENS_ROUTING_TABLE[token] ? token : null;
    }

    updateUrlHashSilently(screenId) {
      if (typeof window === 'undefined' || !window.history || !SIX_SCREENS_ROUTING_TABLE[screenId]) {
        return;
      }
      const order = SIX_SCREENS_ROUTING_TABLE[screenId].order;
      const targetHash = `#tab=${order}`;
      if (window.location.hash === targetHash) return;
      try {
        window.history.replaceState(null, '', targetHash);
      } catch (_err) {
        // Bỏ qua trong môi trường sandbox file:// không hỗ trợ replaceState
      }
    }
  }

  /**
   * Trình tạo thẻ hướng dẫn & nút cài đặt PWA trực quan có thể gắn vào Tab 6 khi trình duyệt cho phép.
   */
  class PwaInstallBannerInjector {
    constructor(pwaManager) {
      this.pwaManager = pwaManager;
    }

    mountInstallStatusWidgetIfPossible() {
      if (typeof document === 'undefined') return null;
      const systemScreen = document.getElementById('s14-screen-6-system');
      if (!systemScreen) return null;
      let pill = document.getElementById('mod29-pwa-install-banner');
      const status = this.pwaManager.getStatusSummary();

      if (!pill) {
        const host = systemScreen.querySelector('.max-w-6xl');
        if (!host) return null;
        pill = document.createElement('div');
        pill.id = 'mod29-pwa-install-banner';
        pill.className =
          'p-3.5 rounded-2xl border border-teal-500/35 bg-teal-950/25 flex flex-wrap items-center justify-between gap-3';
        host.appendChild(pill);
      }

      const modeBadge = status.isInstalledStandalone
        ? '✅ Đang chạy ở chế độ Ứng Dụng Độc Lập (PWA Standalone)'
        : status.canPromptInstall
          ? '📲 Sẵn sàng cài đặt thành Ứng Dụng trên Máy Tính / Điện Thoại'
          : '🌐 Chế độ Trình Duyệt Web Đáp Ứng Mọi Màn Hình';

      const netBadge = status.isOnline ? '🟢 Trực tuyến' : '🟠 Ngoại tuyến (Local IndexedDB vẫn an toàn)';

      pill.innerHTML = `
        <div class="space-y-0.5">
          <div class="font-extrabold text-xs text-teal-300">${modeBadge}</div>
          <div class="text-[11px] text-zinc-400">Trạng thái mạng: <strong class="text-zinc-200">${netBadge}</strong> • Giao thức: <span class="font-monoCode">${status.protocol}</span></div>
        </div>
        <div class="flex items-center gap-2">
          <button type="button" id="mod29-btn-trigger-pwa-install" class="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow transition">
            ${status.isInstalledStandalone ? 'ℹ️ Thông Tin Ứng Dụng' : '📲 Cài Thành App Trên Thiết Bị'}
          </button>
        </div>
      `;

      const installBtn = document.getElementById('mod29-btn-trigger-pwa-install');
      if (installBtn && !installBtn.dataset.mod29Bound) {
        installBtn.dataset.mod29Bound = 'true';
        installBtn.addEventListener('click', () => this.pwaManager.triggerPwaInstall());
      }
      return pill;
    }
  }

  /**
   * Bộ điều phối Điều Hướng 6 Màn Hình Thống Nhất (Single Source of Truth cho chuyển Tab).
   */
  class ResponsiveSixScreensNavigator {
    constructor() {
      this.hasInitialized = false;
      this.currentScreenId = 'SCREEN_1_WRITE';
      this.previousScreenId = 'SCREEN_1_WRITE';
      this.viewportProfiler = new ResponsiveViewportProfiler();
      this.pwaManager = new PwaInstallAndOfflineManager();
      this.screenMemory = new ScreenScrollAndPanelMemory();
      this.layoutApplier = new ResponsiveNavigationLayoutApplier(this.viewportProfiler);
      this.floatingAdapter = new MobileFloatingElementsCoexistenceAdapter(this.viewportProfiler);
      this.entryCoordinator = new ScreenEntryContextCoordinator();
      this.historyStack = new ScreenHistoryStackManager();
      this.headerBadgeHelper = new ResponsiveHeaderBadgeHelper();
      this.tab5Guard = new Tab5AccordionSafetyGuard();
      this.touchErgonomics = new TouchSwipeAndMobileErgonomics(this);
      this.keyboardController = new KeyboardNavigationController(this);
      this.accessibilityMonitor = new DeviceAccessibilityAndSafeAreaMonitor();
      this.hashBridge = new ScreenUrlHashRouterBridge();
      this.pwaBannerInjector = new PwaInstallBannerInjector(this.pwaManager);
    }

    init() {
      if (this.hasInitialized) return this;
      this.hasInitialized = true;

      this.viewportProfiler.init();
      this.pwaManager.init();
      this.accessibilityMonitor.init();
      this.touchErgonomics.init();
      this.keyboardController.init();

      this.bindNavigationTriggers();
      this.tab5Guard.ensureSafeFallbackBindings(this.screenMemory, this.layoutApplier);

      this.viewportProfiler.subscribe((vpProfile) => {
        this.layoutApplier.applyScreenVisibility(this.currentScreenId, vpProfile);
        this.floatingAdapter.adjustFloatingOverlaysForViewport(this.currentScreenId, vpProfile);
        this.headerBadgeHelper.syncDeviceStatusIndicators(
          vpProfile,
          this.pwaManager.getStatusSummary()
        );
      });

      this.pwaManager.subscribe((pwaStatus) => {
        this.headerBadgeHelper.syncDeviceStatusIndicators(
          this.viewportProfiler.getProfile(),
          pwaStatus
        );
        if (this.currentScreenId === 'SCREEN_6_SYSTEM') {
          this.pwaBannerInjector.mountInstallStatusWidgetIfPossible();
        }
      });

      // Luôn ưu tiên khôi phục đúng Tab hợp lệ (Hash -> Bộ nhớ cục bộ -> Tab 1 mặc định)
      const hashScreen = this.hashBridge.resolveScreenFromUrlHash();
      const savedScreen = this.screenMemory.getLastActiveScreen();
      const startScreen = hashScreen || savedScreen || 'SCREEN_1_WRITE';
      this.navigateToScreen(startScreen, {
        skipScrollCapture: true,
        skipHistoryPush: true,
        silentFocus: true,
      });

      this.headerBadgeHelper.syncDeviceStatusIndicators(
        this.viewportProfiler.getProfile(),
        this.pwaManager.getStatusSummary()
      );
      return this;
    }

    bindNavigationTriggers() {
      if (typeof document === 'undefined') return;

      const bindClickOnce = (el, key, handler) => {
        if (!el) return;
        if (typeof NS.bindOnce === 'function') {
          NS.bindOnce(el, 'click', handler, key);
        } else if (!el.dataset[key]) {
          el.dataset[key] = '1';
          el.addEventListener('click', handler);
        }
      };

      // 1. Gắn đồng bộ tất cả nút Tab trên Desktop lẫn thanh đáy Mobile
      const navButtons = document.querySelectorAll('.s14-nav-tab[data-s14-tab]');
      navButtons.forEach((btn, idx) => {
        const targetScreen = btn.getAttribute('data-s14-tab');
        bindClickOnce(btn, `mod29NavTab_${idx}`, () => {
          this.touchErgonomics.triggerSoftHapticTap(5);
          this.navigateToScreen(targetScreen || 'SCREEN_1_WRITE');
        });
      });

      // 2. Nút "✍️ Quay Lại Bàn Viết Truyện" ở các Tab 4, 5, 6
      const backBtns = document.querySelectorAll('.btn-s14-back-to-write');
      backBtns.forEach((btn, idx) => {
        bindClickOnce(btn, `mod29BackWrite_${idx}`, () => {
          this.touchErgonomics.triggerSoftHapticTap(5);
          this.navigateToScreen('SCREEN_1_WRITE');
        });
      });

      // 3. Nếu người dùng bấm biểu tượng phiên bản nhanh trên header, mở Modal preview hoặc Tab 6 tùy ngữ cảnh
      if (typeof window !== 'undefined' && !window.__mod29HashListenerBound) {
        window.__mod29HashListenerBound = true;
        window.addEventListener('hashchange', () => {
          const fromHash = this.hashBridge.resolveScreenFromUrlHash();
          if (fromHash && fromHash !== this.currentScreenId) {
            this.navigateToScreen(fromHash, { silentFocus: true });
          }
        });
      }
    }

    navigateToScreen(targetScreenId, options = {}) {
      const normalizedId = SIX_SCREENS_ROUTING_TABLE[targetScreenId]
        ? targetScreenId
        : 'SCREEN_1_WRITE';

      if (!options.skipScrollCapture && this.currentScreenId) {
        this.screenMemory.captureScrollPosition(this.currentScreenId);
      }

      const prevScreen = this.currentScreenId;
      this.previousScreenId = prevScreen;
      this.currentScreenId = normalizedId;

      if (!options.skipHistoryPush) {
        this.historyStack.pushScreen(normalizedId);
      }

      // Cập nhật State tập trung của toàn bộ hệ thống Studio
      if (NS.state) {
        NS.state.previousScreen = prevScreen;
        NS.state.activeScreen = normalizedId;
      }

      const vp = this.viewportProfiler.measureAndUpdate(false);
      this.layoutApplier.applyScreenVisibility(normalizedId, vp);
      this.floatingAdapter.adjustFloatingOverlaysForViewport(normalizedId, vp);
      this.screenMemory.setLastActiveScreen(normalizedId);

      if (!options.skipHashUpdate) {
        this.hashBridge.updateUrlHashSilently(normalizedId);
      }

      this.entryCoordinator.onEnterScreen(normalizedId, prevScreen, this.layoutApplier);

      if (normalizedId === 'SCREEN_6_SYSTEM') {
        this.pwaBannerInjector.mountInstallStatusWidgetIfPossible();
      }

      if (!options.skipScrollRestore) {
        this.screenMemory.restoreScrollPosition(normalizedId);
      }
      if (!options.silentFocus) {
        this.headerBadgeHelper.focusBestTargetForScreen(normalizedId);
      }

      // Phát sự kiện chuẩn thống nhất trên Event Bus
      const screenEventName = NS.constants?.EVENTS?.SCREEN_CHANGED || 'nav:screen_changed';
      if (NS.bus?.emit) {
        NS.bus.emit(screenEventName, {
          screenId: normalizedId,
          previousScreenId: prevScreen,
          viewport: vp,
          timestamp: Date.now(),
        });
      }

      return normalizedId;
    }

    goToScreen(screenId, options = {}) {
      return this.navigateToScreen(screenId, options);
    }

    switchScreen(screenId, options = {}) {
      return this.navigateToScreen(screenId, options);
    }

    getCurrentScreen() {
      return this.currentScreenId;
    }

    getPreviousScreen() {
      return this.previousScreenId;
    }

    stepScreen(delta) {
      const idx = VALID_SCREEN_ORDER.indexOf(this.currentScreenId);
      if (idx < 0) return this.navigateToScreen('SCREEN_1_WRITE');
      const nextIdx = (idx + delta + VALID_SCREEN_ORDER.length) % VALID_SCREEN_ORDER.length;
      return this.navigateToScreen(VALID_SCREEN_ORDER[nextIdx]);
    }

    goBack() {
      const prev = this.historyStack.stepBack();
      if (!prev) return this.navigateToScreen('SCREEN_1_WRITE', { skipHistoryPush: true });
      return this.navigateToScreen(prev, { skipHistoryPush: true });
    }

    goForward() {
      const next = this.historyStack.stepForward();
      if (!next) return null;
      return this.navigateToScreen(next, { skipHistoryPush: true });
    }

    openTab5Panel(targetPanelId, collapseOthers = false) {
      this.navigateToScreen('SCREEN_5_AMBIENCE');
      return this.layoutApplier.openSpecificTab5Panel(targetPanelId, collapseOthers);
    }

    openTab6VersionVaultSection() {
      this.navigateToScreen('SCREEN_6_SYSTEM');
      if (typeof document !== 'undefined') {
        const vaultEl = document.getElementById('tab6-version-history-vault');
        vaultEl?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
      }
    }

    getViewportDiagnostics() {
      return {
        currentScreenId: this.currentScreenId,
        previousScreenId: this.previousScreenId,
        viewport: this.viewportProfiler.getProfile(),
        pwa: this.pwaManager.getStatusSummary(),
        accessibility: this.accessibilityMonitor.getSummary(),
        historyBreadcrumbs: this.historyStack.getBreadcrumbSummary(),
      };
    }
  }

  /**
   * Tự động tối ưu độ thoáng lưới hiển thị trên màn hình rộng (Ultrawide) và điện thoại màn hình hẹp.
   */
  class ResponsiveGridAndSplitColumnOptimizer {
    constructor(viewportProfiler) {
      this.viewportProfiler = viewportProfiler;
      this.wideSplitModeEnabled = true;
    }

    optimizeContainersForCurrentViewport(screenId) {
      if (typeof document === 'undefined') return null;
      const vp = this.viewportProfiler.getProfile();
      const body = document.body;
      if (!body) return null;

      body.classList.toggle('studio-viewport-mobile', vp.isMobile);
      body.classList.toggle('studio-viewport-tablet', vp.isTablet);
      body.classList.toggle('studio-viewport-desktop', vp.isDesktop);
      body.classList.toggle('studio-keyboard-active', vp.keyboardOpenLikely);

      // Thu gọn khoảng trống trên màn hình điện thoại siêu nhỏ (< 380px)
      const headerEl = document.querySelector('header');
      if (headerEl) {
        if (vp.width <= 380) {
          headerEl.style.paddingLeft = '6px';
          headerEl.style.paddingRight = '6px';
        } else {
          headerEl.style.paddingLeft = '';
          headerEl.style.paddingRight = '';
        }
      }

      // Đảm bảo thanh tiêu đề chương Tab 1 không tràn ngang gây cuộn ngang trên mobile
      const chapterHeaderBar = document.getElementById('s18-minimal-chapter-header-bar');
      if (chapterHeaderBar) {
        if (vp.isMobile) {
          chapterHeaderBar.style.gap = '6px';
        } else {
          chapterHeaderBar.style.gap = '';
        }
      }

      // Trên Tab 2 ở màn hình máy tính, giữ thanh bên kích thước cân đối
      const leftSidebar = document.getElementById('left-sidebar-pane');
      if (leftSidebar && screenId === 'SCREEN_2_FILES') {
        if (vp.width >= 1536 && this.wideSplitModeEnabled) {
          leftSidebar.style.maxWidth = '440px';
        } else {
          leftSidebar.style.maxWidth = '';
        }
      }

      return {
        width: vp.width,
        height: vp.height,
        tier: vp.tier,
        compactHeaderApplied: vp.width <= 380,
      };
    }

    setWideSplitModeEnabled(flag) {
      this.wideSplitModeEnabled = Boolean(flag);
      return this.wideSplitModeEnabled;
    }
  }

  /**
   * Kiểm tra toàn diện cấu trúc DOM của 6 màn hình và xác minh không có trạng thái kẹt lớp CSS.
   */
  class CrossDeviceResponsiveAuditEngine {
    inspectDomLayoutIntegrity(activeScreenId) {
      if (typeof document === 'undefined') {
        return { healthy: false, reason: 'no_document' };
      }

      const requiredIds = [
        'desktop-six-tabs-nav',
        'mobile-bottom-nav',
        'left-sidebar-pane',
        'center-editor-pane',
        'pane-left-beats',
        'pane-right-manuscript',
        'right-bible-pane',
        's14-screen-5-ambience',
        's14-screen-6-system',
      ];

      const missingIds = [];
      const elementStates = {};

      for (const id of requiredIds) {
        const el = document.getElementById(id);
        if (!el) {
          missingIds.push(id);
        } else {
          elementStates[id] = {
            hiddenClass: el.classList.contains('hidden'),
            hasLgFlex: el.classList.contains('lg:flex'),
          };
        }
      }

      const desktopTabsCount = document.querySelectorAll('#desktop-six-tabs-nav .s14-nav-tab').length;
      const mobileTabsCount = document.querySelectorAll('#mobile-bottom-nav .s14-nav-tab').length;
      const activeMarkedTabs = document.querySelectorAll('.s14-nav-tab.active-tab');
      const activeMatchesScreen = Array.from(activeMarkedTabs).every(
        (el) => el.getAttribute('data-s14-tab') === activeScreenId
      );

      // Kiểm tra xung đột: Không được mở cùng lúc Pane AI (Tab 3) và Pane Bản Thảo (Tab 1)
      const beatsVisible = !elementStates['pane-left-beats']?.hiddenClass;
      const manuscriptVisible = !elementStates['pane-right-manuscript']?.hiddenClass;
      const centerDualSubConflict = beatsVisible && manuscriptVisible;

      // Kiểm tra xung đột: Tab 4 / 5 / 6 là độc lập, chỉ được phép hiện tối đa 1 trang nếu đang ở nhóm 4-6
      const exclusiveVisibleCount = [
        !elementStates['right-bible-pane']?.hiddenClass,
        !elementStates['s14-screen-5-ambience']?.hiddenClass,
        !elementStates['s14-screen-6-system']?.hiddenClass,
      ].filter(Boolean).length;

      return {
        healthy:
          missingIds.length === 0 &&
          desktopTabsCount === 6 &&
          mobileTabsCount === 6 &&
          activeMatchesScreen &&
          !centerDualSubConflict &&
          exclusiveVisibleCount <= 1,
        activeScreenId,
        bodyDatasetScreen: document.body?.dataset?.s14Screen || '',
        missingIds,
        desktopTabsCount,
        mobileTabsCount,
        activeMarkedCount: activeMarkedTabs.length,
        activeMatchesScreen,
        centerDualSubConflict,
        exclusiveVisibleCount,
        elementStates,
      };
    }

    autoHealLayoutIfCorrupted(navigatorInstance) {
      const cur = navigatorInstance.getCurrentScreen() || 'SCREEN_1_WRITE';
      const report = this.inspectDomLayoutIntegrity(cur);
      if (!report.healthy) {
        navigatorInstance.navigateToScreen(cur, {
          skipHistoryPush: true,
          skipScrollCapture: true,
          silentFocus: true,
        });
      }
      return this.inspectDomLayoutIntegrity(cur);
    }
  }

  /**
   * Trình hỗ trợ ghi nhớ gợi ý chuyển Tab nhẹ nhàng và điều hướng sâu tới từng chức năng cụ thể.
   */
  class ScreenDeepActionNavigatorBridge {
    constructor(navigatorInstance) {
      this.navigator = navigatorInstance;
    }

    jumpToFeatureAction(actionKey) {
      const action = String(actionKey || '').trim().toUpperCase();
      switch (action) {
        case 'WRITE_MANUSCRIPT': {
          this.navigator.navigateToScreen('SCREEN_1_WRITE');
          (
            document.getElementById('textarea-chapter-content') ||
            document.getElementById('manuscript-editor')
          )?.focus?.();
          return true;
        }
        case 'OPEN_CHAPTER_MANAGER': {
          this.navigator.navigateToScreen('SCREEN_2_FILES');
          return true;
        }
        case 'OPEN_RAG_MEMORY_SEARCH': {
          this.navigator.navigateToScreen('SCREEN_2_FILES');
          document.getElementById('rag-search-input')?.focus?.();
          return true;
        }
        case 'OPEN_AI_FIVE_MODES': {
          this.navigator.navigateToScreen('SCREEN_3_AI');
          return true;
        }
        case 'OPEN_MODE5_TIMELINE_DIAGRAM': {
          this.navigator.navigateToScreen('SCREEN_3_AI');
          const modeSelect = document.getElementById('s20-quad-tab-selector');
          if (modeSelect) {
            modeSelect.value = 'MODE_5';
            modeSelect.dispatchEvent(new Event('change', { bubbles: true }));
          }
          return true;
        }
        case 'OPEN_STORY_BIBLE': {
          this.navigator.navigateToScreen('SCREEN_4_BIBLE');
          return true;
        }
        case 'OPEN_MUSIC_STUDIO': {
          return this.navigator.openTab5Panel('s14-panel-music-box', false);
        }
        case 'OPEN_POMODORO_SETTINGS': {
          return this.navigator.openTab5Panel('s14-panel-pomodoro-box', false);
        }
        case 'OPEN_TYPOGRAPHY_AND_CANVAS': {
          return this.navigator.openTab5Panel('s14-panel-typography-box', false);
        }
        case 'OPEN_VERSION_TIME_MACHINE': {
          this.navigator.openTab6VersionVaultSection();
          return true;
        }
        case 'OPEN_PDF_EXPORTER': {
          this.navigator.navigateToScreen('SCREEN_6_SYSTEM');
          if (typeof NS.exporter?.openModal === 'function') {
            NS.exporter.openModal();
          } else {
            document.getElementById('btn-s6-card-export')?.click();
          }
          return true;
        }
        case 'OPEN_API_KEY_VAULT': {
          this.navigator.navigateToScreen('SCREEN_6_SYSTEM');
          if (typeof NS.geminiRouter?.openApiKeyModal === 'function') {
            NS.geminiRouter.openApiKeyModal();
          } else {
            document.getElementById('btn-s6-card-apikey')?.click();
          }
          return true;
        }
        case 'OPEN_VIDEO_TUTORIAL': {
          this.navigator.navigateToScreen('SCREEN_6_SYSTEM');
          if (typeof NS.tutorialAndChangelog?.openModal === 'function') {
            NS.tutorialAndChangelog.openModal('VIDEO');
          } else {
            document.getElementById('btn-s6-card-tutorial')?.click();
          }
          return true;
        }
        default:
          return false;
      }
    }

    listAvailableDeepActions() {
      return [
        { key: 'WRITE_MANUSCRIPT', label: 'Vào Bàn Viết Truyện (Tab 1)', screen: 'SCREEN_1_WRITE' },
        { key: 'OPEN_CHAPTER_MANAGER', label: 'Quản Lý Chương & Nguồn (Tab 2)', screen: 'SCREEN_2_FILES' },
        { key: 'OPEN_RAG_MEMORY_SEARCH', label: 'Tìm Ký Ức Cũ BM25 (Tab 2)', screen: 'SCREEN_2_FILES' },
        { key: 'OPEN_AI_FIVE_MODES', label: 'Mở Trợ Lý AI 5 Chế Độ (Tab 3)', screen: 'SCREEN_3_AI' },
        { key: 'OPEN_MODE5_TIMELINE_DIAGRAM', label: 'Mở Chế Độ 5 Biểu Đồ Cốt Truyện', screen: 'SCREEN_3_AI' },
        { key: 'OPEN_STORY_BIBLE', label: 'Mở Trung Tâm Story Bible (Tab 4)', screen: 'SCREEN_4_BIBLE' },
        { key: 'OPEN_MUSIC_STUDIO', label: 'Mở Phòng Nhạc MP3 & A-B (Tab 5)', screen: 'SCREEN_5_AMBIENCE' },
        { key: 'OPEN_POMODORO_SETTINGS', label: 'Mở Đồng Hồ Pomodoro (Tab 5)', screen: 'SCREEN_5_AMBIENCE' },
        { key: 'OPEN_TYPOGRAPHY_AND_CANVAS', label: 'Mở Cỡ Chữ & Hiệu Ứng Nền (Tab 5)', screen: 'SCREEN_5_AMBIENCE' },
        { key: 'OPEN_VERSION_TIME_MACHINE', label: 'Mở Kho Phiên Bản Preview (Tab 6)', screen: 'SCREEN_6_SYSTEM' },
        { key: 'OPEN_PDF_EXPORTER', label: 'Mở Xuất Sách PDF Font & Cỡ Chữ', screen: 'SCREEN_6_SYSTEM' },
        { key: 'OPEN_API_KEY_VAULT', label: 'Mở Két Sắt Gemini API Key', screen: 'SCREEN_6_SYSTEM' },
        { key: 'OPEN_VIDEO_TUTORIAL', label: 'Mở Video Hướng Dẫn Có Phụ Đề', screen: 'SCREEN_6_SYSTEM' },
      ];
    }
  }

  /**
   * Trình ghi nhận thống kê thời lượng tác giả làm việc tại từng màn hình trong phiên hiện tại.
   */
  class ScreenDwellTelemetryTracker {
    constructor() {
      this.enteredAtMs = Date.now();
      this.currentScreen = 'SCREEN_1_WRITE';
      this.durationByScreenMs = {
        SCREEN_1_WRITE: 0,
        SCREEN_2_FILES: 0,
        SCREEN_3_AI: 0,
        SCREEN_4_BIBLE: 0,
        SCREEN_5_AMBIENCE: 0,
        SCREEN_6_SYSTEM: 0,
      };
      this.switchCount = 0;
    }

    recordScreenTransition(nextScreenId) {
      const now = Date.now();
      const delta = Math.max(0, now - this.enteredAtMs);
      if (this.currentScreen && this.durationByScreenMs[this.currentScreen] !== undefined) {
        this.durationByScreenMs[this.currentScreen] += delta;
      }
      this.currentScreen = nextScreenId;
      this.enteredAtMs = now;
      this.switchCount += 1;
    }

    getTelemetryReport() {
      const now = Date.now();
      const liveTotals = { ...this.durationByScreenMs };
      if (this.currentScreen && liveTotals[this.currentScreen] !== undefined) {
        liveTotals[this.currentScreen] += Math.max(0, now - this.enteredAtMs);
      }
      const formattedSeconds = {};
      for (const [k, ms] of Object.entries(liveTotals)) {
        formattedSeconds[k] = Number((ms / 1000).toFixed(1));
      }
      return {
        totalScreenSwitches: this.switchCount,
        activeScreen: this.currentScreen,
        secondsSpentPerScreen: formattedSeconds,
      };
    }
  }

  const navigatorInstance = new ResponsiveSixScreensNavigator();
  const gridOptimizer = new ResponsiveGridAndSplitColumnOptimizer(navigatorInstance.viewportProfiler);
  const layoutAuditor = new CrossDeviceResponsiveAuditEngine();
  const deepActionBridge = new ScreenDeepActionNavigatorBridge(navigatorInstance);
  const dwellTracker = new ScreenDwellTelemetryTracker();

  navigatorInstance.gridOptimizer = gridOptimizer;
  navigatorInstance.layoutAuditor = layoutAuditor;
  navigatorInstance.deepActionBridge = deepActionBridge;
  navigatorInstance.dwellTracker = dwellTracker;

  const originalNavigate = navigatorInstance.navigateToScreen.bind(navigatorInstance);
  navigatorInstance.navigateToScreen = (screenId, options = {}) => {
    const resultScreen = originalNavigate(screenId, options);
    gridOptimizer.optimizeContainersForCurrentViewport(resultScreen);
    dwellTracker.recordScreenTransition(resultScreen);
    return resultScreen;
  };

  navigatorInstance.setTouchSwipeEnabled = (enabled) =>
    navigatorInstance.touchErgonomics.setSwipeEnabled(enabled);

  navigatorInstance.triggerPwaInstall = () =>
    navigatorInstance.pwaManager.triggerPwaInstall();

  navigatorInstance.jumpToFeatureAction = (actionKey) =>
    deepActionBridge.jumpToFeatureAction(actionKey);

  navigatorInstance.listDeepActions = () =>
    deepActionBridge.listAvailableDeepActions();

  navigatorInstance.runResponsiveHealthReport = () => ({
    domIntegrity: layoutAuditor.inspectDomLayoutIntegrity(navigatorInstance.getCurrentScreen()),
    diagnostics: navigatorInstance.getViewportDiagnostics(),
    dwellStats: dwellTracker.getTelemetryReport(),
  });

  navigatorInstance.autoHealLayout = () =>
    layoutAuditor.autoHealLayoutIfCorrupted(navigatorInstance);

  /**
   * Trình thông báo vùng đọc màn hình (ARIA Live Region) & chế độ đọc tràn viền trên điện thoại.
   */
  class ScreenReaderAnnouncerAndFullReadingMode {
    constructor() {
      this.liveRegionId = 'mod29-aria-screen-announcer';
      this.isMobileFullReadingActive = false;
    }

    ensureLiveRegionElement() {
      if (typeof document === 'undefined') return null;
      let region = document.getElementById(this.liveRegionId);
      if (!region) {
        region = document.createElement('div');
        region.id = this.liveRegionId;
        region.setAttribute('aria-live', 'polite');
        region.setAttribute('aria-atomic', 'true');
        region.className = 'sr-only';
        document.body?.appendChild(region);
      }
      return region;
    }

    announceScreenChange(screenId) {
      const cfg = SIX_SCREENS_ROUTING_TABLE[screenId];
      if (!cfg) return;
      const el = this.ensureLiveRegionElement();
      if (el) {
        el.textContent = `Đã chuyển sang màn hình ${cfg.order}: ${cfg.title}.`;
      }
    }

    toggleMobileDistractionFreeReading(forceState) {
      if (typeof document === 'undefined') return false;
      const next =
        typeof forceState === 'boolean' ? forceState : !this.isMobileFullReadingActive;
      this.isMobileFullReadingActive = next;

      const header = document.querySelector('header');
      const mobileNav = document.getElementById('mobile-bottom-nav');
      const readerBar = document.getElementById('stage6-reader-typography-bar');

      if (header) header.classList.toggle('hidden', next);
      if (mobileNav) mobileNav.classList.toggle('hidden', next);
      if (readerBar) readerBar.classList.toggle('hidden', next);
      document.body?.classList.toggle('mod29-mobile-reading-focus', next);

      return this.isMobileFullReadingActive;
    }
  }

  /**
   * Tự động thu gọn nhãn nút dài trên màn hình hẹp và khôi phục khoảng đệm cuộn tối ưu.
   */
  class MobileHeaderCompactAndViewportAdvisor {
    constructor(viewportProfiler) {
      this.viewportProfiler = viewportProfiler;
    }

    computeAdaptiveEditorialPaddingPx() {
      const vp = this.viewportProfiler.getProfile();
      if (vp.width < 400) return { horizontalPx: 12, verticalPx: 14, maxColumns: 1 };
      if (vp.width < 768) return { horizontalPx: 18, verticalPx: 18, maxColumns: 1 };
      if (vp.width < 1200) return { horizontalPx: 26, verticalPx: 22, maxColumns: 2 };
      return { horizontalPx: 36, verticalPx: 28, maxColumns: 3 };
    }

    getMobileUsabilityHints() {
      const vp = this.viewportProfiler.getProfile();
      const hints = [];
      if (vp.isMobile) {
        hints.push('Chạm thanh dưới đáy để chuyển nhanh giữa 6 màn hình viết truyện.');
        hints.push('Thanh chèn nhanh ngay dưới ô viết giúp gõ 「 」, ——, … chỉ với 1 chạm.');
      } else if (vp.isTablet) {
        hints.push('Xoay ngang máy tính bảng giúp mở rộng danh sách chương ở Tab 2.');
      } else {
        hints.push('Dùng Alt+1 đến Alt+6 hoặc nút Tab trên cùng để điều hướng không cần chuột.');
      }
      if (!vp.isDesktop && vp.keyboardOpenLikely) {
        hints.push('Thanh điều hướng đáy tạm ẩn để nhường tối đa diện tích gõ chữ.');
      }
      return {
        tier: vp.tier,
        width: vp.width,
        height: vp.height,
        recommendedPadding: this.computeAdaptiveEditorialPaddingPx(),
        hints,
      };
    }

    applyResponsiveModalMaxHeights() {
      if (typeof document === 'undefined') return 0;
      const vp = this.viewportProfiler.getProfile();
      const maxPx = Math.max(260, (vp.visualViewportHeight || vp.height) - 28);
      const modalContainers = document.querySelectorAll('[id^="modal-"] > div');
      let updatedCount = 0;
      modalContainers.forEach((panel) => {
        if (!vp.isDesktop) {
          panel.style.maxHeight = `${maxPx}px`;
          updatedCount += 1;
        } else {
          panel.style.maxHeight = '';
        }
      });
      return updatedCount;
    }
  }

  /**
   * Điều phối trạng thái thu gọn hay mở rộng của các bảng trong Tab 4, Tab 5, Tab 6 trên di động.
   */
  class ResponsiveSectionFoldManager {
    constructor(storageKey = 'noir_fold_sections_v38') {
      this.storageKey = storageKey;
      this.collapsedSet = this.loadCollapsedSet();
    }

    loadCollapsedSet() {
      try {
        if (typeof localStorage === 'undefined') return new Set();
        const raw = localStorage.getItem(this.storageKey);
        if (!raw) return new Set();
        const arr = JSON.parse(raw);
        return new Set(Array.isArray(arr) ? arr : []);
      } catch (_err) {
        return new Set();
      }
    }

    saveCollapsedSet() {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(this.storageKey, JSON.stringify(Array.from(this.collapsedSet)));
        }
      } catch (_err) {
        // Không làm gián đoạn tác giả
      }
    }

    isSectionFolded(sectionKey) {
      return this.collapsedSet.has(String(sectionKey || ''));
    }

    toggleSectionFold(sectionKey) {
      const key = String(sectionKey || '');
      if (!key) return false;
      if (this.collapsedSet.has(key)) {
        this.collapsedSet.delete(key);
      } else {
        this.collapsedSet.add(key);
      }
      this.saveCollapsedSet();
      return this.collapsedSet.has(key);
    }

    clearAllFolds() {
      this.collapsedSet.clear();
      this.saveCollapsedSet();
    }
  }

  /**
   * Kiểm tra sự hiện diện và độ sẵn sàng tương tác của toàn bộ thanh công cụ Desktop & Mobile.
   */
  class NavigationControlsReadinessVerifier {
    inspectInteractiveControls() {
      if (typeof document === 'undefined') return { ready: false };
      const desktopNav = document.getElementById('desktop-six-tabs-nav');
      const mobileNav = document.getElementById('mobile-bottom-nav');
      const backBtns = document.querySelectorAll('.btn-s14-back-to-write');
      const quickBar = document.getElementById('mobile-writer-quickbar');

      return {
        ready: Boolean(desktopNav && mobileNav),
        hasDesktopNav: Boolean(desktopNav),
        hasMobileBottomNav: Boolean(mobileNav),
        backToWriteButtonsCount: backBtns.length,
        hasMobileQuickInsertBar: Boolean(quickBar),
        activeNavButtonsCount: document.querySelectorAll('.s14-nav-tab.active-tab').length,
      };
    }

    verifyAllSixTabsReachable() {
      const missingTabs = [];
      for (const id of VALID_SCREEN_ORDER) {
        const match = document.querySelector(`.s14-nav-tab[data-s14-tab="${id}"]`);
        if (!match) missingTabs.push(id);
      }
      return {
        allSixReachable: missingTabs.length === 0,
        missingTabs,
      };
    }
  }

  const srAnnouncerAndReading = new ScreenReaderAnnouncerAndFullReadingMode();
  const mobileCompactAdvisor = new MobileHeaderCompactAndViewportAdvisor(
    navigatorInstance.viewportProfiler
  );
  const sectionFoldManager = new ResponsiveSectionFoldManager();
  const controlsVerifier = new NavigationControlsReadinessVerifier();

  navigatorInstance.srAnnouncer = srAnnouncerAndReading;
  navigatorInstance.mobileCompactAdvisor = mobileCompactAdvisor;
  navigatorInstance.sectionFoldManager = sectionFoldManager;
  navigatorInstance.controlsVerifier = controlsVerifier;

  const prevNavWithGrid = navigatorInstance.navigateToScreen;
  navigatorInstance.navigateToScreen = (screenId, options = {}) => {
    const chosen = prevNavWithGrid(screenId, options);
    srAnnouncerAndReading.announceScreenChange(chosen);
    mobileCompactAdvisor.applyResponsiveModalMaxHeights();
    return chosen;
  };

  navigatorInstance.toggleMobileFullScreenReading = (forceState) =>
    srAnnouncerAndReading.toggleMobileDistractionFreeReading(forceState);

  navigatorInstance.getMobileUiHints = () =>
    mobileCompactAdvisor.getMobileUsabilityHints();

  navigatorInstance.verifyNavigationReadiness = () => ({
    controls: controlsVerifier.inspectInteractiveControls(),
    reachability: controlsVerifier.verifyAllSixTabsReachable(),
  });

  /**
   * Tự động phục hồi tiêu điểm cuộn cho thiết bị cảm ứng & cung cấp API kiểm tra khả năng cài đặt PWA.
   */
  class MobileViewportScrollGuard {
    constructor(viewportProfiler) {
      this.viewportProfiler = viewportProfiler;
    }

    ensureActiveElementVisibleAboveKeyboard() {
      if (typeof document === 'undefined') return false;
      const vp = this.viewportProfiler.getProfile();
      if (vp.isDesktop || !vp.keyboardOpenLikely) return false;
      const active = document.activeElement;
      if (!active || typeof active.scrollIntoView !== 'function') return false;
      if (active.matches('textarea, input, [contenteditable="true"]')) {
        try {
          active.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return true;
        } catch (_err) {
          active.scrollIntoView();
          return true;
        }
      }
      return false;
    }

    computeSafeBottomInsetPx() {
      if (typeof document === 'undefined' || typeof getComputedStyle !== 'function') return 0;
      const mobileNav = document.getElementById('mobile-bottom-nav');
      if (!mobileNav || mobileNav.classList.contains('hidden')) return 0;
      const rect = mobileNav.getBoundingClientRect();
      return rect && rect.height ? Math.round(rect.height) : 56;
    }

    buildDeviceCapabilitySummary() {
      const vp = this.viewportProfiler.getProfile();
      const hasTouch =
        typeof window !== 'undefined' &&
        ('ontouchstart' in window || (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0));
      const hasServiceWorker =
        typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
      const hasIndexedDb = typeof indexedDB !== 'undefined';
      const hasFileSystemAccess =
        typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function';

      return {
        viewportTier: vp.tier,
        screenSize: `${vp.width}x${vp.height}`,
        orientation: vp.isLandscape ? 'Ngang (Landscape)' : 'Dọc (Portrait)',
        touchCapable: Boolean(hasTouch),
        pwaOfflineReady: Boolean(hasServiceWorker && hasIndexedDb),
        directDiskSyncSupported: Boolean(hasFileSystemAccess),
        bottomNavHeightPx: this.computeSafeBottomInsetPx(),
      };
    }
  }

  const mobileScrollGuard = new MobileViewportScrollGuard(navigatorInstance.viewportProfiler);
  navigatorInstance.mobileScrollGuard = mobileScrollGuard;

  navigatorInstance.ensureKeyboardVisibility = () =>
    mobileScrollGuard.ensureActiveElementVisibleAboveKeyboard();

  navigatorInstance.getDeviceCapabilitySummary = () =>
    mobileScrollGuard.buildDeviceCapabilitySummary();

  // Tương thích các mô-đun có thể lắng nghe hoặc chuyển Tab qua tên bí danh
  NS.SIX_SCREENS_ROUTING_TABLE = SIX_SCREENS_ROUTING_TABLE;
  NS.VALID_SCREEN_ORDER = VALID_SCREEN_ORDER;
  NS.ResponsiveViewportProfiler = ResponsiveViewportProfiler;
  NS.PwaInstallAndOfflineManager = PwaInstallAndOfflineManager;
  NS.ResponsiveSixScreensNavigator = ResponsiveSixScreensNavigator;
  NS.ResponsiveGridAndSplitColumnOptimizer = ResponsiveGridAndSplitColumnOptimizer;
  NS.CrossDeviceResponsiveAuditEngine = CrossDeviceResponsiveAuditEngine;
  NS.ScreenDeepActionNavigatorBridge = ScreenDeepActionNavigatorBridge;
  NS.ScreenDwellTelemetryTracker = ScreenDwellTelemetryTracker;
  NS.ScreenReaderAnnouncerAndFullReadingMode = ScreenReaderAnnouncerAndFullReadingMode;
  NS.MobileHeaderCompactAndViewportAdvisor = MobileHeaderCompactAndViewportAdvisor;
  NS.ResponsiveSectionFoldManager = ResponsiveSectionFoldManager;
  NS.NavigationControlsReadinessVerifier = NavigationControlsReadinessVerifier;
  NS.MobileViewportScrollGuard = MobileViewportScrollGuard;
  NS.navigator = navigatorInstance;
  NS.navigation = navigatorInstance;

  if (typeof NS.registerModule === 'function') {
    NS.registerModule('mod29', navigatorInstance);
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        if (!navigatorInstance.hasInitialized) navigatorInstance.init();
      });
    } else {
      navigatorInstance.init();
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);
