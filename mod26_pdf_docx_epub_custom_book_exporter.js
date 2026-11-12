/**
 * ============================================================================
 * 📤 MODULE 26: ĐỘNG CƠ XUẤT SÁCH ĐA ĐỊNH DẠNG & CHẾ BẢN IN ẤN CHUYÊN NGHIỆP
 * (mod26_pdf_docx_epub_custom_book_exporter.js — v38.0 SUPREME EDITION)
 * ============================================================================
 * Phụ trách toàn bộ hệ thống xuất bản phẩm cho "Web Viết Tiểu Thuyết Của Bi":
 * 1. Xuất Sách .PDF Chế Bản In Ấn:
 *    - Cho phép chọn Font chữ (Merriweather, Times New Roman, Lora, Noto Serif,
 *      Literata, Be Vietnam Pro, Inter) ngay trước khi xuất.
 *    - Cho phép chọn Cỡ chữ (11pt -> 18pt) và Độ giãn dòng (1.5, 1.75, 2.0).
 *    - Khung Xem Thử Trực Tiếp (#export-pdf-live-preview) cập nhật tức thời
 *      theo đúng Font, Cỡ chữ, Giãn dòng và trích đoạn thực tế từ chương đang mở.
 *    - Tự động tạo Trang Bìa Sách (Book Title Page), Trang Bản Quyền (Colophon),
 *      Danh sách Nhân vật (Dramatis Personae từ Story Bible), Mục Lục Tự Động
 *      (Table of Contents), Thụt đầu dòng chuẩn sách văn học Việt Nam, Hoa văn
 *      ngắt cảnh và Ngắt trang (@media print page-break).
 * 2. Xuất Tài Liệu .DOCX Chuẩn Microsoft Word & Google Docs:
 *    - Đóng gói cấu trúc XML/HTML WordProcessingML chuẩn xác kèm bảng kiểu chữ
 *      (Style Sheet), tiêu đề chương Heading 1, thụt lề đoạn văn và đánh số trang.
 * 3. Xuất Sách Điện Tử .EPUB / .HTML Đọc Sách Độc Lập (Standalone E-Reader):
 *    - Tạo tệp sách điện tử có thanh điều hướng chương, chỉnh cỡ chữ, đổi nền
 *      Sáng/Tối/Giấy Sepia để gửi cho bạn bè hoặc đọc trên điện thoại.
 * 4. Xuất Văn Bản Thuần .TXT & .MD (Markdown) Chuẩn Đăng Web Novel.
 * 5. Sao Lưu Toàn Bộ Dự Án (.JSON Workspace Backup) & Đóng Gói Chia Sẻ (.HTML).
 * ============================================================================
 */
(function () {
  'use strict';

  window.NoirStudio = window.NoirStudio || {};
  if (window.NoirStudio.__MOD26_EXPORTER_LOADED__) return;
  window.NoirStudio.__MOD26_EXPORTER_LOADED__ = true;

  // ==========================================================================
  // PHẦN 1: Cơ sở dữ liệu Mẫu Chế Bản Sách In (Typography & Trim Size Presets),
  //         Hoa Văn Ngắt Cảnh (Ornamental Dividers) & Quy Tắc Chế Bản Tiếng Việt
  // ==========================================================================
  const BOOK_TYPOGRAPHY_PRESETS = {
    LIGHT_NOVEL_B6: {
      id: 'LIGHT_NOVEL_B6',
      name: '📖 Khổ Light Novel Nhật Bản (B6 — 12.8 × 18.2 cm)',
      pageSizeCss: '128mm 182mm',
      marginCss: '16mm 15mm 18mm 18mm',
      fontFamily: "'Merriweather', 'Literata', Georgia, serif",
      fontSize: '12pt',
      lineHeight: '1.75',
      textIndent: '1.8em',
      paragraphSpacing: '0.45em',
      dropCapFirstParagraph: true,
      chapterHeaderStyle: 'ORNATE_BOX',
      description: 'Khổ sách Light Novel kinh điển của Kadokawa / IPM, lề thoáng, chữ sắc nét, cầm vừa tay.'
    },
    VIETNAM_TRADE_14X20: {
      id: 'VIETNAM_TRADE_14X20',
      name: '📚 Khổ Tiểu Thuyết Xuất Bản Việt Nam (14.5 × 20.5 cm)',
      pageSizeCss: '145mm 205mm',
      marginCss: '20mm 18mm 22mm 22mm',
      fontFamily: "'Times New Roman', 'Noto Serif', Times, serif",
      fontSize: '13pt',
      lineHeight: '1.75',
      textIndent: '2.0em',
      paragraphSpacing: '0.5em',
      dropCapFirstParagraph: true,
      chapterHeaderStyle: 'CLASSIC_SERIF',
      description: 'Khổ tiêu chuẩn của Nhã Nam, Trẻ, Kim Đồng cho tiểu thuyết văn học và trinh thám dài kỳ.'
    },
    HARDCOVER_ROYAL_A5: {
      id: 'HARDCOVER_ROYAL_A5',
      name: '👑 Khổ Bìa Cứng Sưu Tầm (A5 Royal — 15.5 × 23.5 cm)',
      pageSizeCss: '155mm 235mm',
      marginCss: '22mm 20mm 25mm 24mm',
      fontFamily: "'Lora', 'Merriweather', Georgia, serif",
      fontSize: '13pt',
      lineHeight: '1.85',
      textIndent: '2.0em',
      paragraphSpacing: '0.6em',
      dropCapFirstParagraph: true,
      chapterHeaderStyle: 'ROYAL_CREST',
      description: 'Khổ sách bìa cứng cao cấp dùng cho các bộ đại tự sự, kỳ ảo, sử thi nhiều tập.'
    },
    MANUSCRIPT_A4_REVIEW: {
      id: 'MANUSCRIPT_A4_REVIEW',
      name: '📝 Khổ Bản Thảo Gửi Nhà Xuất Bản (A4 — 21.0 × 29.7 cm)',
      pageSizeCss: 'A4 portrait',
      marginCss: '25mm 25mm 25mm 30mm',
      fontFamily: "'Times New Roman', Times, serif",
      fontSize: '14pt',
      lineHeight: '2.0',
      textIndent: '2.2em',
      paragraphSpacing: '0.65em',
      dropCapFirstParagraph: false,
      chapterHeaderStyle: 'MINIMAL_EDITORIAL',
      description: 'Chuẩn bản thảo đánh máy gửi biên tập viên duyệt in với giãn dòng rộng để ghi chú bên lề.'
    },
    MOBILE_EBOOK_READER: {
      id: 'MOBILE_EBOOK_READER',
      name: '📱 Khổ Tối Ưu Đọc Trên Điện Thoại & Máy Tính Bảng',
      pageSizeCss: '110mm 175mm',
      marginCss: '10mm 9mm 12mm 9mm',
      fontFamily: "'Inter', 'Be Vietnam Pro', sans-serif",
      fontSize: '14pt',
      lineHeight: '1.75',
      textIndent: '1.4em',
      paragraphSpacing: '0.7em',
      dropCapFirstParagraph: false,
      chapterHeaderStyle: 'MODERN_CLEAN',
      description: 'Chữ to rõ, lề hẹp, tối ưu cho màn hình điện thoại di động và máy đọc sách Kindle/Kobo.'
    }
  };

  const ORNAMENTAL_SCENE_DIVIDERS = {
    STARS_CLASSIC: {
      id: 'STARS_CLASSIC',
      label: '✦  ✦  ✦ (Sao ba ngôi cổ điển)',
      html: '<div class="book-scene-divider">✦ &nbsp;&nbsp; ✦ &nbsp;&nbsp; ✦</div>',
      plain: '* * *'
    },
    FLEURON_LEAF: {
      id: 'FLEURON_LEAF',
      label: '❦ ─── ❦ (Hoa văn lá cổ điển)',
      html: '<div class="book-scene-divider">─── &nbsp; ❦ &nbsp; ───</div>',
      plain: '--- ❦ ---'
    },
    NOIR_DIAMOND: {
      id: 'NOIR_DIAMOND',
      label: '❖ ── ❖ ── ❖ (Kim cương Noir)',
      html: '<div class="book-scene-divider">❖ &nbsp;──&nbsp; ❖ &nbsp;──&nbsp; ❖</div>',
      plain: '❖ ── ❖ ── ❖'
    },
    MOON_CRESCENT: {
      id: 'MOON_CRESCENT',
      label: '✧ ☽ ◯ ☾ ✧ (Trăng rằm & Tinh tú)',
      html: '<div class="book-scene-divider">✧ &nbsp; ☽ &nbsp; ◯ &nbsp; ☾ &nbsp; ✧</div>',
      plain: '✧ ☽ ◯ ☾ ✧'
    },
    SWORD_FANTASY: {
      id: 'SWORD_FANTASY',
      label: '⚔ ═══════ ⚔ (Kiếm & Kỳ ảo)',
      html: '<div class="book-scene-divider">⚔ &nbsp;═══════&nbsp; ⚔</div>',
      plain: '⚔ ======= ⚔'
    }
  };

  const PAPER_COLOR_THEMES = {
    CREAM_BOOK: {
      id: 'CREAM_BOOK',
      label: '📜 Giấy Kem Sách In (Dịu mắt chuẩn Nhã Nam)',
      bgHex: '#FCF9F2',
      textHex: '#1C1917',
      accentHex: '#065F46',
      borderHex: '#D6D3D1',
      mutedHex: '#57534E'
    },
    PURE_WHITE: {
      id: 'PURE_WHITE',
      label: '📄 Giấy Trắng Tinh Khiết (Chuẩn In Laser / NXB)',
      bgHex: '#FFFFFF',
      textHex: '#111827',
      accentHex: '#047857',
      borderHex: '#E5E7EB',
      mutedHex: '#4B5563'
    },
    VINTAGE_SEPIA: {
      id: 'VINTAGE_SEPIA',
      label: '🍂 Giấy Cổ Điển Sepia (Hoài niệm ấm áp)',
      bgHex: '#F4ECD8',
      textHex: '#2C221E',
      accentHex: '#78350F',
      borderHex: '#C8B89A',
      mutedHex: '#6B5744'
    },
    NOIR_NIGHT_PDF: {
      id: 'NOIR_NIGHT_PDF',
      label: '🌙 Nền Tối Noir (Đọc ban đêm trên màn hình OLED)',
      bgHex: '#09090B',
      textHex: '#E4E4E7',
      accentHex: '#10B981',
      borderHex: '#27272A',
      mutedHex: '#A1A1AA'
    }
  };

  const EXPORT_FONT_CATALOG = [
    {
      value: "'Merriweather', Georgia, serif",
      label: 'Merriweather (Sách in kinh điển — Khuyên dùng)',
      cssImport: 'https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,300;0,400;0,700;1,300;1,400&display=swap',
      docxFontName: 'Merriweather'
    },
    {
      value: "'Times New Roman', Times, serif",
      label: 'Times New Roman (Chuẩn bản thảo Nhà Xuất Bản)',
      cssImport: '',
      docxFontName: 'Times New Roman'
    },
    {
      value: "'Lora', Georgia, serif",
      label: 'Lora (Văn học lãng mạn & Tâm lý sâu lắng)',
      cssImport: 'https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400&display=swap',
      docxFontName: 'Lora'
    },
    {
      value: "'Noto Serif', Georgia, serif",
      label: 'Noto Serif (Chữ có chân sắc nét, hỗ trợ dấu Tiếng Việt 100%)',
      cssImport: 'https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,400;0,700;1,400&display=swap',
      docxFontName: 'Noto Serif'
    },
    {
      value: "'Literata', Georgia, serif",
      label: 'Literata (Font chuyên dụng của Google Play Books)',
      cssImport: 'https://fonts.googleapis.com/css2?family=Literata:ital,opsz,wght@0,7..72,400;0,7..72,600;0,7..72,700;1,7..72,400&display=swap',
      docxFontName: 'Literata'
    },
    {
      value: "'Inter', Arial, sans-serif",
      label: 'Inter (Không chân hiện đại — Tối ưu đọc trên điện thoại)',
      cssImport: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
      docxFontName: 'Inter'
    },
    {
      value: "'Be Vietnam Pro', Arial, sans-serif",
      label: 'Be Vietnam Pro (Thiết kế riêng cho Tiếng Việt hiện đại)',
      cssImport: 'https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap',
      docxFontName: 'Be Vietnam Pro'
    }
  ];

  // ==========================================================================
  // PHẦN 2: LỚP CHÍNH CustomBookExporterEngine
  // ==========================================================================
  class CustomBookExporterEngine {
    constructor() {
      this.storageKeyPrefs = 'noir_v38_custom_book_exporter_prefs';
      this.prefs = {
        scope: 'CURRENT',
        fontFamily: "'Merriweather', Georgia, serif",
        fontSize: '13pt',
        lineHeight: '1.75',
        trimPresetId: 'VIETNAM_TRADE_14X20',
        paperThemeId: 'CREAM_BOOK',
        dividerId: 'STARS_CLASSIC',
        bookTitle: 'Tuyển Tập Tiểu Thuyết Của Bi',
        authorName: 'Tác giả Bi',
        bookSubtitle: 'Ấn Bản Chế Bản Đặc Biệt Từ Studio Sáng Tác',
        publisherLabel: 'Nhà Xuất Bản Cá Nhân — Noir Light Novel Studio',
        includeCoverPage: true,
        includeTableOfContents: true,
        includeCharacterAppendix: false,
        includeStoryBibleAppendix: false,
        includeAuthorNotes: true,
        enableDropCap: true,
        enableFirstLineIndent: true,
        enablePageNumbers: true,
        formatDialogueAttributionItalic: true
      };
      this.isAdvancedPanelInjected = false;
    }

    // ------------------------------------------------------------------------
    // Tiện ích truy cập an toàn các mô-đun khác trong window.NoirStudio
    // ------------------------------------------------------------------------
    getUtils() {
      if (window.NoirStudio && window.NoirStudio.utils) return window.NoirStudio.utils;
      if (window.NoirStudio && window.NoirStudio.ui) return window.NoirStudio.ui;
      return {
        escapeHtml: (str) =>
          String(str ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;'),
        countVietnameseWords: (txt) => {
          if (!txt || typeof txt !== 'string') return 0;
          const t = txt.trim();
          return t ? t.split(/\s+/).filter(Boolean).length : 0;
        },
        countParagraphs: (txt) => {
          if (!txt || typeof txt !== 'string') return 0;
          return txt
            .split(/\r?\n+/)
            .map((l) => l.trim())
            .filter(Boolean).length;
        },
        formatTimestampVN: (ts) => {
          const d = new Date(ts || Date.now());
          const p = (n) => String(n).padStart(2, '0');
          return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())} — ${p(
            d.getDate()
          )}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
        },
        showToast: (msg) => console.log('[ExporterToast]', msg)
      };
    }

    getChapterManager() {
      return (
        window.NoirStudio?.chapterManager ||
        window.NoirStudio?.chapterTree ||
        window.NoirStudio?.chapters ||
        null
      );
    }

    getStoryBibleEngine() {
      return (
        window.NoirStudio?.storyBible ||
        window.NoirStudio?.bibleEngine ||
        null
      );
    }

    getVersionVault() {
      return (
        window.NoirStudio?.versionVault ||
        window.NoirStudio?.versionMachine ||
        null
      );
    }

    getDbEngine() {
      return (
        window.NoirStudio?.db ||
        window.NoirStudio?.idb ||
        window.NoirStudio?.storage ||
        null
      );
    }

    // ------------------------------------------------------------------------
    // Khởi tạo mô-đun, nạp cấu hình đã lưu và gắn kết giao diện
    // ------------------------------------------------------------------------
    init() {
      this.loadSavedPreferences();
      this.enhanceFontSelectOptions();
      this.injectAdvancedExporterControlsIntoModal();
      this.syncPrefsToDOMControls();
      this.bindInternalExporterEvents();
      this.updateLivePreview();
    }

    loadSavedPreferences() {
      try {
        const raw = localStorage.getItem(this.storageKeyPrefs);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            this.prefs = { ...this.prefs, ...parsed };
          }
        }
      } catch (err) {
        console.warn('[Mod26 Exporter] Không thể đọc cấu hình xuất sách cũ:', err);
      }
    }

    savePreferences() {
      try {
        localStorage.setItem(this.storageKeyPrefs, JSON.stringify(this.prefs));
      } catch (err) {
        console.warn('[Mod26 Exporter] Không thể lưu cấu hình xuất sách:', err);
      }
    }

    enhanceFontSelectOptions() {
      const fontSelect = document.getElementById('export-pdf-font-family');
      if (!fontSelect) return;

      const existingValues = new Set(
        Array.from(fontSelect.options).map((o) => o.value)
      );
      EXPORT_FONT_CATALOG.forEach((f) => {
        if (!existingValues.has(f.value)) {
          const opt = document.createElement('option');
          opt.value = f.value;
          opt.textContent = f.label;
          fontSelect.appendChild(opt);
        }
      });
    }

    /**
     * Bổ sung các tùy chọn chế bản sách nâng cao (Tên sách, Bút danh, Khổ giấy,
     * Màu giấy, Hoa văn ngắt cảnh, Xuất EPUB / Markdown / Xem trước dàn trang)
     * vào trong #modal-s6-custom-exporter một cách gọn gàng, không làm thay đổi
     * các ID nút bấm gốc của index.html.
     */
    injectAdvancedExporterControlsIntoModal() {
      if (this.isAdvancedPanelInjected) return;
      const modal = document.getElementById('modal-s6-custom-exporter');
      if (!modal) return;

      const modalCard = modal.querySelector('.max-w-xl');
      if (modalCard) {
        modalCard.classList.remove('max-w-xl');
        modalCard.classList.add('max-w-3xl', 'max-h-[92vh]', 'flex', 'flex-col');
      }

      const bodyContainer = modal.querySelector('.p-5.space-y-4');
      if (!bodyContainer) return;
      bodyContainer.classList.add('overflow-y-auto', 'flex-1');

      const previewBox = document.getElementById('export-pdf-live-preview');
      if (!previewBox) return;

      const extraPanel = document.createElement('div');
      extraPanel.id = 'exporter-advanced-publishing-panel';
      extraPanel.className =
        'p-3.5 rounded-2xl border border-indigo-500/30 bg-studioLightBg dark:bg-zinc-950 space-y-3 text-xs';
      extraPanel.innerHTML = `
        <div class="flex flex-wrap items-center justify-between gap-2">
          <span class="font-extrabold uppercase text-indigo-400 text-[11px]">
            📚 3. Thông Tin Bìa Sách, Khổ Giấy In & Tùy Chọn Chế Bản Cao Cấp:
          </span>
          <span id="exporter-scope-metrics-badge" class="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-monoCode font-bold text-[10px]">
            1 chương • 0 từ • ~1 trang in
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label class="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Tên tác phẩm in trên bìa & đầu trang:</label>
            <input id="export-book-title-input" type="text" value="${this.getUtils().escapeHtml(
              this.prefs.bookTitle
            )}" placeholder="Nhập tên tiểu thuyết..." class="w-full px-2.5 py-1.5 rounded-xl border border-zinc-700 bg-zinc-900 text-xs font-bold text-emerald-300 select-text focus:outline-none focus:border-emerald-500" />
          </div>
          <div>
            <label class="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Bút danh tác giả:</label>
            <input id="export-book-author-input" type="text" value="${this.getUtils().escapeHtml(
              this.prefs.authorName
            )}" placeholder="Nhập bút danh tác giả..." class="w-full px-2.5 py-1.5 rounded-xl border border-zinc-700 bg-zinc-900 text-xs font-semibold text-amber-300 select-text focus:outline-none focus:border-amber-500" />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div>
            <label class="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Khổ trang sách (Trim Size):</label>
            <select id="export-book-trim-select" class="w-full px-2.5 py-1.5 rounded-xl border border-zinc-700 bg-zinc-900 font-semibold text-[11px]">
              ${Object.values(BOOK_TYPOGRAPHY_PRESETS)
                .map(
                  (p) =>
                    `<option value="${p.id}" ${
                      p.id === this.prefs.trimPresetId ? 'selected' : ''
                    }>${this.getUtils().escapeHtml(p.name)}</option>`
                )
                .join('')}
            </select>
          </div>
          <div>
            <label class="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Màu giấy khi xem & in:</label>
            <select id="export-book-paper-theme" class="w-full px-2.5 py-1.5 rounded-xl border border-zinc-700 bg-zinc-900 font-semibold text-[11px]">
              ${Object.values(PAPER_COLOR_THEMES)
                .map(
                  (t) =>
                    `<option value="${t.id}" ${
                      t.id === this.prefs.paperThemeId ? 'selected' : ''
                    }>${this.getUtils().escapeHtml(t.label)}</option>`
                )
                .join('')}
            </select>
          </div>
          <div>
            <label class="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Hoa văn ngắt phân cảnh:</label>
            <select id="export-book-divider-select" class="w-full px-2.5 py-1.5 rounded-xl border border-zinc-700 bg-zinc-900 font-semibold text-[11px]">
              ${Object.values(ORNAMENTAL_SCENE_DIVIDERS)
                .map(
                  (d) =>
                    `<option value="${d.id}" ${
                      d.id === this.prefs.dividerId ? 'selected' : ''
                    }>${this.getUtils().escapeHtml(d.label)}</option>`
                )
                .join('')}
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
          <label class="flex items-center gap-1.5 cursor-pointer select-none">
            <input type="checkbox" id="chk-export-cover" ${
              this.prefs.includeCoverPage ? 'checked' : ''
            } class="accent-emerald-500 rounded" />
            <span class="text-[11px] text-zinc-300">Tạo Trang Bìa Sách</span>
          </label>
          <label class="flex items-center gap-1.5 cursor-pointer select-none">
            <input type="checkbox" id="chk-export-toc" ${
              this.prefs.includeTableOfContents ? 'checked' : ''
            } class="accent-emerald-500 rounded" />
            <span class="text-[11px] text-zinc-300">Tạo Mục Lục Tự Động</span>
          </label>
          <label class="flex items-center gap-1.5 cursor-pointer select-none">
            <input type="checkbox" id="chk-export-dropcap" ${
              this.prefs.enableDropCap ? 'checked' : ''
            } class="accent-emerald-500 rounded" />
            <span class="text-[11px] text-zinc-300">Chữ Hoa Đầu Chương (Drop Cap)</span>
          </label>
          <label class="flex items-center gap-1.5 cursor-pointer select-none">
            <input type="checkbox" id="chk-export-indent" ${
              this.prefs.enableFirstLineIndent ? 'checked' : ''
            } class="accent-emerald-500 rounded" />
            <span class="text-[11px] text-zinc-300">Thụt Đầu Dòng Chuẩn Sách In</span>
          </label>
          <label class="flex items-center gap-1.5 cursor-pointer select-none">
            <input type="checkbox" id="chk-export-characters" ${
              this.prefs.includeCharacterAppendix ? 'checked' : ''
            } class="accent-emerald-500 rounded" />
            <span class="text-[11px] text-zinc-300">Kèm Bảng Nhân Vật (Tab 4)</span>
          </label>
          <label class="flex items-center gap-1.5 cursor-pointer select-none">
            <input type="checkbox" id="chk-export-bible" ${
              this.prefs.includeStoryBibleAppendix ? 'checked' : ''
            } class="accent-emerald-500 rounded" />
            <span class="text-[11px] text-zinc-300">Kèm Phụ Lục Story Bible</span>
          </label>
        </div>

        <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-800">
          <span class="text-[10px] text-zinc-400">Định dạng mở rộng cho E-Reader & Web Novel:</span>
          <div class="flex items-center gap-1.5 flex-wrap">
            <button type="button" id="btn-export-epub-now" class="px-2.5 py-1 rounded-lg border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold text-[11px] transition">
              📱 Xuất Sách Điện Tử (.EPUB / E-Book)
            </button>
            <button type="button" id="btn-export-markdown-now" class="px-2.5 py-1 rounded-lg border border-teal-500/40 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 font-bold text-[11px] transition">
              📝 Xuất Markdown (.MD)
            </button>
          </div>
        </div>
      `;

      const parentOfButtons = document
        .getElementById('btn-export-pdf-now')
        ?.closest('.grid');
      if (parentOfButtons && parentOfButtons.parentNode) {
        parentOfButtons.parentNode.insertBefore(extraPanel, parentOfButtons);
      } else {
        bodyContainer.appendChild(extraPanel);
      }

      this.isAdvancedPanelInjected = true;
    }

    syncPrefsToDOMControls() {
      const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el && val !== undefined && val !== null) el.value = val;
      };
      const setChk = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.checked = Boolean(val);
      };

      setVal('export-scope-select', this.prefs.scope);
      setVal('export-pdf-font-family', this.prefs.fontFamily);
      setVal('export-pdf-font-size', this.prefs.fontSize);
      setVal('export-pdf-line-height', this.prefs.lineHeight);
      setVal('export-book-title-input', this.prefs.bookTitle);
      setVal('export-book-author-input', this.prefs.authorName);
      setVal('export-book-trim-select', this.prefs.trimPresetId);
      setVal('export-book-paper-theme', this.prefs.paperThemeId);
      setVal('export-book-divider-select', this.prefs.dividerId);

      setChk('chk-export-cover', this.prefs.includeCoverPage);
      setChk('chk-export-toc', this.prefs.includeTableOfContents);
      setChk('chk-export-dropcap', this.prefs.enableDropCap);
      setChk('chk-export-indent', this.prefs.enableFirstLineIndent);
      setChk('chk-export-characters', this.prefs.includeCharacterAppendix);
      setChk('chk-export-bible', this.prefs.includeStoryBibleAppendix);
    }

    readPrefsFromDOMControls() {
      const getVal = (id, fallback) => {
        const el = document.getElementById(id);
        return el && el.value ? el.value : fallback;
      };
      const getChk = (id, fallback) => {
        const el = document.getElementById(id);
        return el ? Boolean(el.checked) : fallback;
      };

      this.prefs.scope = getVal('export-scope-select', this.prefs.scope);
      this.prefs.fontFamily = getVal('export-pdf-font-family', this.prefs.fontFamily);
      this.prefs.fontSize = getVal('export-pdf-font-size', this.prefs.fontSize);
      this.prefs.lineHeight = getVal('export-pdf-line-height', this.prefs.lineHeight);
      this.prefs.bookTitle = getVal('export-book-title-input', this.prefs.bookTitle);
      this.prefs.authorName = getVal('export-book-author-input', this.prefs.authorName);
      this.prefs.trimPresetId = getVal('export-book-trim-select', this.prefs.trimPresetId);
      this.prefs.paperThemeId = getVal('export-book-paper-theme', this.prefs.paperThemeId);
      this.prefs.dividerId = getVal('export-book-divider-select', this.prefs.dividerId);

      this.prefs.includeCoverPage = getChk('chk-export-cover', this.prefs.includeCoverPage);
      this.prefs.includeTableOfContents = getChk('chk-export-toc', this.prefs.includeTableOfContents);
      this.prefs.enableDropCap = getChk('chk-export-dropcap', this.prefs.enableDropCap);
      this.prefs.enableFirstLineIndent = getChk('chk-export-indent', this.prefs.enableFirstLineIndent);
      this.prefs.includeCharacterAppendix = getChk(
        'chk-export-characters',
        this.prefs.includeCharacterAppendix
      );
      this.prefs.includeStoryBibleAppendix = getChk(
        'chk-export-bible',
        this.prefs.includeStoryBibleAppendix
      );

      this.savePreferences();
      return this.prefs;
    }

    bindInternalExporterEvents() {
      const bindChange = (id, handler) => {
        const el = document.getElementById(id);
        if (!el || el.dataset.mod26Bound === '1') return;
        el.dataset.mod26Bound = '1';
        el.addEventListener('change', handler);
        if (el.tagName === 'INPUT' && el.type === 'text') {
          el.addEventListener('input', handler);
        }
      };

      const onAnyControlChanged = () => {
        this.readPrefsFromDOMControls();
        this.updateLivePreview();
      };

      [
        'export-scope-select',
        'export-pdf-font-family',
        'export-pdf-font-size',
        'export-pdf-line-height',
        'export-book-title-input',
        'export-book-author-input',
        'export-book-trim-select',
        'export-book-paper-theme',
        'export-book-divider-select',
        'chk-export-cover',
        'chk-export-toc',
        'chk-export-dropcap',
        'chk-export-indent',
        'chk-export-characters',
        'chk-export-bible'
      ].forEach((id) => bindChange(id, onAnyControlChanged));

      // Khi chọn Khổ sách (Trim Size), tự động gợi ý thông số nhưng vẫn giữ quyền tùy chỉnh Font/Size của người dùng
      const trimSelect = document.getElementById('export-book-trim-select');
      if (trimSelect && !trimSelect.dataset.mod26PresetBound) {
        trimSelect.dataset.mod26PresetBound = '1';
        trimSelect.addEventListener('change', () => {
          const preset = BOOK_TYPOGRAPHY_PRESETS[trimSelect.value];
          if (preset) {
            this.prefs.trimPresetId = preset.id;
            this.updateLivePreview();
          }
        });
      }

      const btnEpub = document.getElementById('btn-export-epub-now');
      if (btnEpub && !btnEpub.dataset.mod26Bound) {
        btnEpub.dataset.mod26Bound = '1';
        btnEpub.addEventListener('click', () => this.exportEpub());
      }

      const btnMd = document.getElementById('btn-export-markdown-now');
      if (btnMd && !btnMd.dataset.mod26Bound) {
        btnMd.dataset.mod26Bound = '1';
        btnMd.addEventListener('click', () => this.exportMarkdown());
      }
    }

    // ------------------------------------------------------------------------
    // Mở hộp thoại Xuất Sách & Đồng Bộ Dữ Liệu Bản Thảo Mới Nhất
    // ------------------------------------------------------------------------
    openModal() {
      const chapMgr = this.getChapterManager();
      if (chapMgr && typeof chapMgr.syncEditorToActiveChapter === 'function') {
        chapMgr.syncEditorToActiveChapter();
      }
      this.injectAdvancedExporterControlsIntoModal();
      this.syncPrefsToDOMControls();
      this.bindInternalExporterEvents();
      this.updateLivePreview();
      const modal = document.getElementById('modal-s6-custom-exporter');
      if (modal) modal.classList.remove('hidden');
    }

    closeModal() {
      const modal = document.getElementById('modal-s6-custom-exporter');
      if (modal) modal.classList.add('hidden');
    }

    /**
     * Lấy danh sách chương cần xuất theo phạm vi:
     * - CURRENT: Chương đang mở tại bàn viết Tab 1
     * - ALL_APPROVED: Toàn bộ các chương đã được chốt duyệt (APPROVED)
     * - ALL_CHAPTERS: Tất cả các chương trong cây bản thảo
     */
    getChaptersForExportScope() {
      const chapMgr = this.getChapterManager();
      if (chapMgr && typeof chapMgr.syncEditorToActiveChapter === 'function') {
        chapMgr.syncEditorToActiveChapter();
      }

      const scope =
        document.getElementById('export-scope-select')?.value ||
        this.prefs.scope ||
        'CURRENT';

      const allChapters = Array.isArray(chapMgr?.chapters) ? chapMgr.chapters : [];
      const activeChap =
        chapMgr && typeof chapMgr.getActiveChapter === 'function'
          ? chapMgr.getActiveChapter()
          : allChapters[0] || null;

      // Dự phòng nếu chapterManager chưa có dữ liệu nhưng khung soạn thảo đang có chữ
      const fallbackChapter = () => {
        const titleEl = document.getElementById('input-chapter-title');
        const contentEl = document.getElementById('textarea-chapter-content');
        const content = contentEl ? contentEl.value : '';
        const title =
          (titleEl && titleEl.value.trim()) || 'Chương 1: Bản Thảo Tiểu Thuyết';
        return [
          {
            id: 'chap_fallback_current',
            title,
            displayTitle: title,
            content,
            status: 'DRAFT',
            wordCount: this.getUtils().countVietnameseWords(content),
            updatedAt: Date.now()
          }
        ];
      };

      if (scope === 'CURRENT') {
        if (activeChap) return [activeChap];
        return fallbackChapter();
      }

      if (scope === 'ALL_APPROVED') {
        const approved = allChapters.filter((c) => c.status === 'APPROVED');
        if (approved.length > 0) return approved;
        if (activeChap) return [activeChap];
        return fallbackChapter();
      }

      // ALL_CHAPTERS
      if (allChapters.length > 0) return allChapters;
      return fallbackChapter();
    }

    /**
     * Tính toán thống kê xuất bản chuyên sâu (Tổng số chương, Tổng số từ,
     * Tổng số đoạn văn, Số câu thoại, Số trang sách in ước tính theo cỡ chữ)
     */
    calculateBookPublishingMetrics(chapters) {
      const utils = this.getUtils();
      const list = Array.isArray(chapters) ? chapters : this.getChaptersForExportScope();
      let totalWords = 0;
      let totalParagraphs = 0;
      let totalDialogues = 0;
      let totalCharactersCount = 0;

      list.forEach((chap) => {
        const text = String(chap.content || '');
        totalWords += utils.countVietnameseWords(text);
        totalParagraphs += utils.countParagraphs(text);
        totalCharactersCount += text.length;
        const lines = text.split(/\r?\n/);
        lines.forEach((ln) => {
          if (/^\s*[-–—]\s+/.test(ln)) {
            totalDialogues += 1;
          }
        });
      });

      const fontSizePt = parseInt(this.prefs.fontSize, 10) || 13;
      const lineHeightNum = parseFloat(this.prefs.lineHeight) || 1.75;
      // Ước tính số từ trên 1 trang sách in dựa trên cỡ chữ và giãn dòng
      const baseWordsPerPage = 320;
      const sizeFactor = 13 / Math.max(10, fontSizePt);
      const lhFactor = 1.75 / Math.max(1.2, lineHeightNum);
      const wordsPerPrintedPage = Math.max(
        160,
        Math.round(baseWordsPerPage * sizeFactor * lhFactor)
      );
      const estimatedPrintedPages = Math.max(
        1,
        Math.ceil(totalWords / wordsPerPrintedPage) +
          (this.prefs.includeCoverPage ? 2 : 0) +
          (this.prefs.includeTableOfContents ? 1 : 0)
      );
      const estimatedReadingMinutes = Math.max(1, Math.ceil(totalWords / 220));

      return {
        chapterCount: list.length,
        totalWords,
        totalParagraphs,
        totalDialogues,
        totalCharactersCount,
        wordsPerPrintedPage,
        estimatedPrintedPages,
        estimatedReadingMinutes
      };
    }

    /**
     * Cập nhật Khung Xem Thử Kiểu Chữ Xuất PDF (#export-pdf-live-preview)
     * theo thời gian thực ngay khi tác giả chọn Font chữ, Cỡ chữ, Giãn dòng hoặc Màu giấy!
     */
    updateLivePreview() {
      const previewEl = document.getElementById('export-pdf-live-preview');
      if (!previewEl) return;

      this.readPrefsFromDOMControls();
      const utils = this.getUtils();
      const chapters = this.getChaptersForExportScope();
      const metrics = this.calculateBookPublishingMetrics(chapters);

      // Cập nhật huy hiệu thống kê số chương, số từ và số trang ước tính
      const badgeEl = document.getElementById('exporter-scope-metrics-badge');
      if (badgeEl) {
        badgeEl.textContent = `${metrics.chapterCount} chương • ${metrics.totalWords.toLocaleString(
          'vi-VN'
        )} từ • ~${metrics.estimatedPrintedPages} trang sách in`;
      }

      const paperTheme =
        PAPER_COLOR_THEMES[this.prefs.paperThemeId] || PAPER_COLOR_THEMES.CREAM_BOOK;
      const dividerObj =
        ORNAMENTAL_SCENE_DIVIDERS[this.prefs.dividerId] ||
        ORNAMENTAL_SCENE_DIVIDERS.STARS_CLASSIC;

      // Áp dụng trực tiếp Font Family, Font Size, Line Height lên #export-pdf-live-preview
      previewEl.style.fontFamily = this.prefs.fontFamily;
      previewEl.style.fontSize = this.prefs.fontSize;
      previewEl.style.lineHeight = this.prefs.lineHeight;
      previewEl.style.backgroundColor = paperTheme.bgHex;
      previewEl.style.color = paperTheme.textHex;
      previewEl.style.borderColor = paperTheme.borderHex;
      previewEl.style.padding = '16px 20px';
      previewEl.style.borderRadius = '14px';
      previewEl.style.transition = 'all 0.2s ease';

      // Lấy trích đoạn thực tế từ chương đầu tiên trong phạm vi xuất để người dùng xem thử chân thực nhất
      const sampleChap = chapters[0] || {};
      const sampleTitle =
        sampleChap.displayTitle || sampleChap.title || 'Chương 1: Khởi Đầu Trong Mưa Đêm';
      const rawText = String(sampleChap.content || '').trim();
      const paragraphs = rawText
        .split(/\r?\n+/)
        .map((p) => p.trim())
        .filter(Boolean);

      const samplePara1 =
        paragraphs[0] ||
        'Mưa đêm vẫn rơi đều trên mái hiên cổ kính, phản chiếu ánh đèn vàng ấm áp xuống mặt đường lát đá ướt đẫm.';
      const samplePara2 =
        paragraphs[1] ||
        '- Chúng ta đã đi qua bao nhiêu mùa mưa như thế này rồi nhỉ? (Nhân vật chính)';

      const indentStyle = this.prefs.enableFirstLineIndent
        ? 'text-indent: 1.8em;'
        : 'text-indent: 0;';

      previewEl.innerHTML = `
        <div style="border-bottom: 1px solid ${paperTheme.borderHex}; padding-bottom: 6px; margin-bottom: 10px; display: flex; justify-content: space-between; font-size: 0.78em; color: ${paperTheme.mutedHex}; font-style: italic;">
          <span>${utils.escapeHtml(this.prefs.bookTitle)}</span>
          <span>Font: ${utils.escapeHtml(
            this.prefs.fontFamily.split(',')[0].replace(/['"]/g, '')
          )} • ${utils.escapeHtml(this.prefs.fontSize)} • Giãn dòng ${utils.escapeHtml(
        this.prefs.lineHeight
      )}</span>
        </div>
        <div style="font-weight: 800; color: ${paperTheme.accentHex}; font-size: 1.08em; margin-bottom: 8px; text-align: center;">
          ${utils.escapeHtml(sampleTitle)}
        </div>
        <p style="${indentStyle} margin: 0 0 0.45em 0; text-align: justify;">
          ${utils.escapeHtml(samplePara1.slice(0, 220))}${samplePara1.length > 220 ? '…' : ''}
        </p>
        <p style="${indentStyle} margin: 0; text-align: justify;">
          ${utils.escapeHtml(samplePara2.slice(0, 180))}${samplePara2.length > 180 ? '…' : ''}
        </p>
        <div style="text-align: center; color: ${paperTheme.mutedHex}; font-size: 0.85em; margin-top: 8px;">
          ${utils.escapeHtml(dividerObj.plain)}
        </div>
      `;
    }

    // ------------------------------------------------------------------------
    // Chế bản văn bản Tiếng Việt sang HTML chuẩn sách in (Xử lý câu thoại,
    // hoa văn chuyển cảnh, chữ hoa đầu chương Drop Cap và lời tác giả)
    // ------------------------------------------------------------------------
    formatVietnameseParagraphForPrint(rawLine, indexInChapter) {
      const utils = this.getUtils();
      const trimmed = String(rawLine || '').trim();
      if (!trimmed) return '';

      const dividerObj =
        ORNAMENTAL_SCENE_DIVIDERS[this.prefs.dividerId] ||
        ORNAMENTAL_SCENE_DIVIDERS.STARS_CLASSIC;

      // 1. Nhận diện dấu ngắt phân cảnh (* * *, ---, ***, ~~~, ✦ ✦ ✦)
      if (/^(\*\s*\*\s*\*|-{3,}|~{3,}|✦.*✦|❖.*❖|═{3,})$/.test(trimmed)) {
        return dividerObj.html;
      }

      // 2. Nhận diện mốc chuyển cảnh [CHUYỂN CẢNH ...] hoặc [POV ...]
      if (/^\[(CHUYỂN CẢNH|PHÂN CẢNH|POV|MỐC THỜI GIAN)/i.test(trimmed)) {
        return `<div class="book-scene-marker-box">${utils.escapeHtml(trimmed)}</div>`;
      }

      // 3. Nhận diện câu thoại chuẩn: - Câu thoại (Tên nhân vật)
      const dialogueMatch = trimmed.match(/^([-–—])\s*(.+?)\s*\(([^()]+)\)\s*$/);
      if (dialogueMatch) {
        const spokenText = utils.escapeHtml(dialogueMatch[2].trim());
        const speakerName = utils.escapeHtml(dialogueMatch[3].trim());
        if (this.prefs.formatDialogueAttributionItalic) {
          return `<p class="book-paragraph book-dialogue-line">— ${spokenText} <span class="book-dialogue-speaker">(${speakerName})</span></p>`;
        }
        return `<p class="book-paragraph book-dialogue-line">— ${spokenText} (${speakerName})</p>`;
      }

      // 4. Câu thoại thông thường bắt đầu bằng gạch đầu dòng
      if (/^[-–—]\s+/.test(trimmed)) {
        const cleanSpoken = trimmed.replace(/^[-–—]\s+/, '— ');
        return `<p class="book-paragraph book-dialogue-line">${utils.escapeHtml(cleanSpoken)}</p>`;
      }

      // 5. Đoạn văn mở đầu chương (Hỗ trợ Drop Cap nếu được bật)
      if (indexInChapter === 0 && this.prefs.enableDropCap && trimmed.length > 2) {
        const firstChar = utils.escapeHtml(trimmed.charAt(0));
        const restChars = utils.escapeHtml(trimmed.slice(1));
        return `<p class="book-paragraph book-first-paragraph"><span class="book-dropcap">${firstChar}</span>${restChars}</p>`;
      }

      return `<p class="book-paragraph">${utils.escapeHtml(trimmed)}</p>`;
    }

    renderChapterContentToBookHtml(chap) {
      const utils = this.getUtils();
      const rawContent = String(chap?.content || '').trim();
      if (!rawContent) {
        return `<p class="book-paragraph" style="font-style: italic; opacity: 0.7;">(Chương này hiện chưa có nội dung văn bản)</p>`;
      }

      const lines = rawContent
        .split(/\r?\n+/)
        .map((l) => l.trim())
        .filter(Boolean);

      const htmlBlocks = lines.map((line, idx) =>
        this.formatVietnameseParagraphForPrint(line, idx)
      );

      // Nếu chương có đính kèm Lời tác giả đầu/cuối chương (Từ Module 25)
      let authorNoteHtml = '';
      if (this.prefs.includeAuthorNotes && chap.authorNotePost) {
        authorNoteHtml = `
          <div class="book-author-note-card">
            <div class="book-author-note-title">💌 Lời tâm sự của tác giả cuối chương:</div>
            <div class="book-author-note-body">${utils.escapeHtml(chap.authorNotePost)}</div>
          </div>
        `;
      }

      return htmlBlocks.join('\n') + authorNoteHtml;
    }

    // ------------------------------------------------------------------------
    // Tạo Trang Bìa Trong (Half-Title & Full Title Page), Trang Bản Quyền,
    // Mục Lục Tự Động & Phụ Lục Nhân Vật / Story Bible
    // ------------------------------------------------------------------------
    generateBookCoverPageHtml(chapters, metrics) {
      if (!this.prefs.includeCoverPage) return '';
      const utils = this.getUtils();
      const dateStr = utils.formatTimestampVN(Date.now());
      return `
        <section class="book-cover-page">
          <div class="book-cover-ornament-top">✦ ─── ❖ ─── ✦</div>
          <div class="book-cover-subtitle-top">${utils.escapeHtml(
            this.prefs.publisherLabel
          )}</div>
          <h1 class="book-cover-main-title">${utils.escapeHtml(this.prefs.bookTitle)}</h1>
          <div class="book-cover-subtitle">${utils.escapeHtml(this.prefs.bookSubtitle)}</div>
          <div class="book-cover-divider">─── ❦ ───</div>
          <div class="book-cover-author-box">
            <div class="book-cover-author-label">TÁC GIẢ</div>
            <div class="book-cover-author-name">${utils.escapeHtml(this.prefs.authorName)}</div>
          </div>
          <div class="book-cover-meta-footer">
            <div>Ấn bản gồm <strong>${metrics.chapterCount}</strong> chương • Tổng cộng <strong>${metrics.totalWords.toLocaleString(
        'vi-VN'
      )}</strong> từ</div>
            <div>Chế bản & Kết xuất lúc: ${utils.escapeHtml(dateStr)}</div>
          </div>
          <div class="book-cover-ornament-bottom">✦ ─────────────── ✦</div>
        </section>
      `;
    }

    generateTableOfContentsHtml(chapters) {
      if (!this.prefs.includeTableOfContents || chapters.length <= 1) return '';
      const utils = this.getUtils();
      let runningPage = this.prefs.includeCoverPage ? 3 : 2;
      const metrics = this.calculateBookPublishingMetrics(chapters);
      const wordsPerPage = metrics.wordsPerPrintedPage || 300;

      const rowsHtml = chapters
        .map((c, idx) => {
          const title = c.displayTitle || c.title || `Chương ${idx + 1}`;
          const words = utils.countVietnameseWords(c.content || '');
          const startPage = runningPage;
          const chapPages = Math.max(1, Math.ceil(words / wordsPerPage));
          runningPage += chapPages;
          return `
            <li class="book-toc-item">
              <a href="#book-chap-anchor-${idx + 1}" class="book-toc-link">
                <span class="book-toc-chap-title">${utils.escapeHtml(title)}</span>
                <span class="book-toc-dots"></span>
                <span class="book-toc-meta">${words.toLocaleString('vi-VN')} từ • Tr. ${startPage}</span>
              </a>
            </li>
          `;
        })
        .join('\n');

      return `
        <section class="book-toc-section">
          <h2 class="book-section-heading">📖 MỤC LỤC TÁC PHẨM</h2>
          <div class="book-section-sub">Danh mục ${chapters.length} chương trong ấn bản</div>
          <ol class="book-toc-list">
            ${rowsHtml}
          </ol>
        </section>
      `;
    }

    generateDramatisPersonaeAppendixHtml() {
      if (!this.prefs.includeCharacterAppendix) return '';
      const utils = this.getUtils();
      const bible = this.getStoryBibleEngine();
      const chars = Array.isArray(bible?.characters) ? bible.characters : [];
      if (chars.length === 0) return '';

      const cards = chars
        .map(
          (ch) => `
          <div class="book-appendix-card">
            <div class="book-appendix-card-title">👤 ${utils.escapeHtml(
              ch.name || 'Nhân vật'
            )} <span style="font-weight: normal; opacity: 0.8;">(${utils.escapeHtml(
            ch.role || 'Nhân vật trong truyện'
          )})</span></div>
            <div class="book-appendix-card-body">
              <div><strong>Tính cách & Đặc điểm:</strong> ${utils.escapeHtml(
                ch.traits || 'Đang cập nhật'
              )}</div>
              <div><strong>Mục tiêu & Động cơ:</strong> ${utils.escapeHtml(
                ch.goal || 'Đang cập nhật'
              )}</div>
              ${
                ch.speechStyle
                  ? `<div><strong>Giọng điệu đặc trưng:</strong> ${utils.escapeHtml(
                      ch.speechStyle
                    )}</div>`
                  : ''
              }
            </div>
          </div>
        `
        )
        .join('\n');

      return `
        <section class="book-appendix-section">
          <h2 class="book-section-heading">👥 PHỤ LỤC: HỒ SƠ NHÂN VẬT (DRAMATIS PERSONAE)</h2>
          <div class="book-appendix-grid">
            ${cards}
          </div>
        </section>
      `;
    }

    generateStoryBibleAppendixHtml() {
      if (!this.prefs.includeStoryBibleAppendix) return '';
      const utils = this.getUtils();
      const renderedBible =
        document.getElementById('textarea-rendered-bible-content')?.value ||
        localStorage.getItem('noir_s10_rendered_bible_content') ||
        '';
      if (!renderedBible.trim()) return '';

      return `
        <section class="book-appendix-section">
          <h2 class="book-section-heading">🏛️ PHỤ LỤC: HỒ SƠ THẾ GIỚI QUAN & STORY BIBLE</h2>
          <div class="book-bible-pre">${utils.escapeHtml(renderedBible.trim())}</div>
        </section>
      `;
    }

    /**
     * Xây dựng toàn bộ mã HTML5 + CSS @media print chuẩn xuất bản sách in
     * để in ra PDF sắc nét với đúng Font chữ, Cỡ chữ và Giãn dòng đã chọn.
     */
    buildCompletePrintReadyBookHtml(chapters) {
      const utils = this.getUtils();
      this.readPrefsFromDOMControls();

      const metrics = this.calculateBookPublishingMetrics(chapters);
      const trimPreset =
        BOOK_TYPOGRAPHY_PRESETS[this.prefs.trimPresetId] ||
        BOOK_TYPOGRAPHY_PRESETS.VIETNAM_TRADE_14X20;
      const paperTheme =
        PAPER_COLOR_THEMES[this.prefs.paperThemeId] || PAPER_COLOR_THEMES.CREAM_BOOK;

      const indentRule = this.prefs.enableFirstLineIndent ? trimPreset.textIndent : '0';

      const chaptersHtml = chapters
        .map((chap, idx) => {
          const chapTitle = chap.displayTitle || chap.title || `Chương ${idx + 1}`;
          const chapWords = utils.countVietnameseWords(chap.content || '');
          const bodyHtml = this.renderChapterContentToBookHtml(chap);
          return `
            <article id="book-chap-anchor-${idx + 1}" class="book-chapter-article">
              <header class="book-chapter-header">
                <div class="book-chapter-num-label">CHƯƠNG THỨ ${idx + 1}</div>
                <h2 class="book-chapter-title">${utils.escapeHtml(chapTitle)}</h2>
                <div class="book-chapter-meta">${chapWords.toLocaleString('vi-VN')} từ</div>
                <div class="book-chapter-ornament">─── ✦ ───</div>
              </header>
              <div class="book-chapter-body">
                ${bodyHtml}
              </div>
            </article>
          `;
        })
        .join('\n');

      return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${utils.escapeHtml(this.prefs.bookTitle)} — Bản In Sách PDF</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@400;600;700&family=Literata:ital,opsz,wght@0,7..72,400;0,7..72,700;1,7..72,400&family=Lora:ital,wght@0,400;0,700;1,400&family=Merriweather:ital,wght@0,300;0,400;0,700;1,300;1,400&family=Noto+Serif:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet" />
  <style>
    @page {
      size: ${trimPreset.pageSizeCss};
      margin: ${trimPreset.marginCss};
    }

    * {
      box-sizing: border-box;
    }

    html, body {
      margin: 0;
      padding: 0;
      background-color: ${paperTheme.bgHex};
      color: ${paperTheme.textHex};
      font-family: ${this.prefs.fontFamily};
      font-size: ${this.prefs.fontSize};
      line-height: ${this.prefs.lineHeight};
      -webkit-font-smoothing: antialiased;
    }

    /* Thanh công cụ điều khiển in trên đầu trang (Tự động ẩn khi lưu ra PDF) */
    .print-Floating-toolbar {
      position: sticky;
      top: 0;
      z-index: 999;
      background: #18181b;
      color: #f4f4f5;
      padding: 12px 24px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      border-bottom: 2px solid #10b981;
      font-family: 'Be Vietnam Pro', 'Inter', system-ui, sans-serif;
      font-size: 13px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
    }

    .print-toolbar-btn {
      background: #10b981;
      color: #052e16;
      border: none;
      padding: 8px 18px;
      border-radius: 10px;
      font-weight: 800;
      font-size: 13px;
      cursor: pointer;
    }
    .print-toolbar-btn:hover {
      background: #34d399;
    }

    .book-master-container {
      max-width: 780px;
      margin: 0 auto;
      padding: 36px 28px 80px 28px;
    }

    /* Trang Bìa Sách */
    .book-cover-page {
      min-height: 82vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      border: 3px double ${paperTheme.borderHex};
      padding: 48px 32px;
      margin-bottom: 48px;
      page-break-after: always;
      break-after: page;
    }
    .book-cover-ornament-top,
    .book-cover-ornament-bottom {
      color: ${paperTheme.accentHex};
      font-size: 1.1em;
      letter-spacing: 0.25em;
      margin: 12px 0;
    }
    .book-cover-subtitle-top {
      font-size: 0.8em;
      text-transform: uppercase;
      letter-spacing: 0.18em;
      color: ${paperTheme.mutedHex};
      margin-bottom: 24px;
    }
    .book-cover-main-title {
      font-size: 2.35em;
      font-weight: 800;
      color: ${paperTheme.accentHex};
      line-height: 1.25;
      margin: 0 0 16px 0;
    }
    .book-cover-subtitle {
      font-size: 1.05em;
      font-style: italic;
      color: ${paperTheme.mutedHex};
      margin-bottom: 28px;
    }
    .book-cover-divider {
      color: ${paperTheme.accentHex};
      margin: 18px 0;
      font-size: 1.2em;
    }
    .book-cover-author-box {
      margin: 24px 0 36px 0;
    }
    .book-cover-author-label {
      font-size: 0.72em;
      letter-spacing: 0.25em;
      color: ${paperTheme.mutedHex};
      margin-bottom: 6px;
    }
    .book-cover-author-name {
      font-size: 1.45em;
      font-weight: 700;
    }
    .book-cover-meta-footer {
      margin-top: auto;
      font-size: 0.82em;
      color: ${paperTheme.mutedHex};
      line-height: 1.6;
    }

    /* Mục lục */
    .book-toc-section {
      padding: 24px 0 40px 0;
      page-break-after: always;
      break-after: page;
    }
    .book-section-heading {
      text-align: center;
      font-size: 1.55em;
      font-weight: 800;
      color: ${paperTheme.accentHex};
      margin: 0 0 6px 0;
    }
    .book-section-sub {
      text-align: center;
      font-size: 0.85em;
      color: ${paperTheme.mutedHex};
      margin-bottom: 28px;
      font-style: italic;
    }
    .book-toc-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .book-toc-item {
      margin-bottom: 10px;
    }
    .book-toc-link {
      display: flex;
      align-items: baseline;
      text-decoration: none;
      color: inherit;
      gap: 8px;
    }
    .book-toc-chap-title {
      font-weight: 700;
    }
    .book-toc-dots {
      flex: 1;
      border-bottom: 1px dotted ${paperTheme.borderHex};
    }
    .book-toc-meta {
      font-size: 0.85em;
      color: ${paperTheme.mutedHex};
      white-space: nowrap;
    }

    /* Chương truyện */
    .book-chapter-article {
      padding-top: 16px;
      margin-bottom: 52px;
      page-break-before: always;
      break-before: page;
    }
    .book-chapter-header {
      text-align: center;
      margin-bottom: 32px;
      padding-bottom: 16px;
      border-bottom: 1px solid ${paperTheme.borderHex};
    }
    .book-chapter-num-label {
      font-size: 0.76em;
      letter-spacing: 0.24em;
      text-transform: uppercase;
      color: ${paperTheme.mutedHex};
      margin-bottom: 8px;
    }
    .book-chapter-title {
      font-size: 1.65em;
      font-weight: 800;
      color: ${paperTheme.accentHex};
      margin: 0 0 8px 0;
      line-height: 1.3;
    }
    .book-chapter-meta {
      font-size: 0.8em;
      color: ${paperTheme.mutedHex};
      font-style: italic;
    }
    .book-chapter-ornament {
      color: ${paperTheme.accentHex};
      margin-top: 10px;
      font-size: 0.95em;
    }

    /* Đoạn văn & Hội thoại */
    .book-paragraph {
      margin: 0 0 ${trimPreset.paragraphSpacing} 0;
      text-align: justify;
      text-indent: ${indentRule};
      orphans: 3;
      widows: 3;
    }
    .book-first-paragraph {
      text-indent: 0 !important;
    }
    .book-dropcap {
      float: left;
      font-size: 3.1em;
      line-height: 0.84;
      padding-top: 4px;
      padding-right: 10px;
      padding-bottom: 2px;
      font-weight: 800;
      color: ${paperTheme.accentHex};
    }
    .book-dialogue-speaker {
      font-style: italic;
      opacity: 0.88;
    }
    .book-scene-divider {
      text-align: center;
      margin: 1.6em 0;
      color: ${paperTheme.accentHex};
      font-size: 1.05em;
      letter-spacing: 0.2em;
    }
    .book-scene-marker-box {
      margin: 1.2em 0;
      padding: 8px 14px;
      border-left: 3px solid ${paperTheme.accentHex};
      font-style: italic;
      font-size: 0.9em;
      color: ${paperTheme.mutedHex};
    }
    .book-author-note-card {
      margin-top: 2em;
      padding: 14px 18px;
      border: 1px dashed ${paperTheme.borderHex};
      border-radius: 10px;
      font-size: 0.9em;
    }
    .book-author-note-title {
      font-weight: 700;
      color: ${paperTheme.accentHex};
      margin-bottom: 4px;
    }

    /* Phụ lục */
    .book-appendix-section {
      page-break-before: always;
      break-before: page;
      padding-top: 20px;
    }
    .book-appendix-card {
      padding: 12px 16px;
      border: 1px solid ${paperTheme.borderHex};
      border-radius: 10px;
      margin-bottom: 12px;
    }
    .book-appendix-card-title {
      font-weight: 700;
      color: ${paperTheme.accentHex};
      margin-bottom: 6px;
    }
    .book-bible-pre {
      white-space: pre-wrap;
      font-size: 0.92em;
      line-height: 1.7;
      border: 1px solid ${paperTheme.borderHex};
      padding: 18px;
      border-radius: 12px;
    }

    @media print {
      .print-Floating-toolbar {
        display: none !important;
      }
      .book-master-container {
        max-width: 100%;
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="print-Floating-toolbar">
    <div>
      <strong>📕 BẢN CHẾ BẢN SÁCH PDF:</strong> ${utils.escapeHtml(
        this.prefs.bookTitle
      )} (${metrics.chapterCount} chương • ${metrics.totalWords.toLocaleString(
        'vi-VN'
      )} từ) — Font: <u>${utils.escapeHtml(
        this.prefs.fontFamily.split(',')[0].replace(/['"]/g, '')
      )}</u>, Cỡ: <u>${utils.escapeHtml(
        this.prefs.fontSize
      )}</u>, Giãn dòng: <u>${utils.escapeHtml(this.prefs.lineHeight)}</u>
    </div>
    <div style="display: flex; gap: 10px;">
      <button type="button" class="print-toolbar-btn" onclick="window.print()">🖨️ Lưu Thành File .PDF / In Ngay</button>
    </div>
  </div>

  <main class="book-master-container">
    ${this.generateBookCoverPageHtml(chapters, metrics)}
    ${this.generateTableOfContentsHtml(chapters)}
    ${chaptersHtml}
    ${this.generateDramatisPersonaeAppendixHtml()}
    ${this.generateStoryBibleAppendixHtml()}
  </main>

  <script>
    window.addEventListener('load', function () {
      setTimeout(function () {
        try { window.focus(); window.print(); } catch (e) {}
      }, 450);
    });
  </script>
</body>
</html>`;
    }

    /**
     * Xuất bản thảo ra tệp Sách .PDF với đúng Font chữ, Cỡ chữ & Giãn dòng người dùng đã chọn!
     */
    exportPdf() {
      const utils = this.getUtils();
      const chapters = this.getChaptersForExportScope();
      if (!chapters || chapters.length === 0) {
        utils.showToast('⚠️ Không có chương nào để xuất PDF!', 'warning');
        return;
      }

      const printHtml = this.buildCompletePrintReadyBookHtml(chapters);

      // Mở cửa sổ chế bản sách PDF chuyên dụng; nếu trình duyệt chặn popup thì dùng iframe in trực tiếp
      const printWin = window.open('', '_blank', 'width=1024,height=840');
      if (printWin && printWin.document) {
        printWin.document.open();
        printWin.document.write(printHtml);
        printWin.document.close();
        this.closeModal();
        utils.showToast(
          `📕 Đã mở trang Chế Bản Sách PDF (${chapters.length} chương — Cỡ chữ ${this.prefs.fontSize})! Chọn "Save as PDF / Lưu dưới dạng PDF" trong hộp thoại in nhé.`,
          'success',
          4800
        );
        return;
      }

      // Dự phòng nếu cửa sổ bật lên bị chặn: Dùng khung in ẩn trực tiếp ngay trên trang
      let printFrame = document.getElementById('noir-hidden-pdf-print-iframe');
      if (!printFrame) {
        printFrame = document.createElement('iframe');
        printFrame.id = 'noir-hidden-pdf-print-iframe';
        printFrame.style.position = 'fixed';
        printFrame.style.right = '0';
        printFrame.style.bottom = '0';
        printFrame.style.width = '0';
        printFrame.style.height = '0';
        printFrame.style.border = '0';
        document.body.appendChild(printFrame);
      }

      const frameDoc = printFrame.contentWindow || printFrame.contentDocument;
      const doc = frameDoc.document || frameDoc;
      doc.open();
      doc.write(printHtml);
      doc.close();

      setTimeout(() => {
        try {
          printFrame.contentWindow.focus();
          printFrame.contentWindow.print();
        } catch (_) {}
      }, 500);

      this.closeModal();
      utils.showToast(
        '📕 Đang mở hộp thoại Lưu Sách .PDF với Font & Cỡ chữ đã chọn!',
        'success',
        4200
      );
    }

    // ------------------------------------------------------------------------
    // 2. Xuất Bản Thảo Ra File Văn Bản Thuần (.TXT Chuẩn UTF-8 Có BOM)
    // ------------------------------------------------------------------------
    exportTxt() {
      const utils = this.getUtils();
      this.readPrefsFromDOMControls();
      const chapters = this.getChaptersForExportScope();
      if (!chapters || chapters.length === 0) {
        utils.showToast('⚠️ Không có chương nào để xuất file .TXT!', 'warning');
        return;
      }

      const metrics = this.calculateBookPublishingMetrics(chapters);
      const dividerObj =
        ORNAMENTAL_SCENE_DIVIDERS[this.prefs.dividerId] ||
        ORNAMENTAL_SCENE_DIVIDERS.STARS_CLASSIC;

      const lines = [];
      lines.push('========================================================================');
      lines.push(`📚 TÁC PHẨM : ${this.prefs.bookTitle.toUpperCase()}`);
      lines.push(`✍️ TÁC GIẢ  : ${this.prefs.authorName}`);
      lines.push(`📊 THỐNG KÊ : ${metrics.chapterCount} chương | ${metrics.totalWords.toLocaleString('vi-VN')} từ | ~${metrics.estimatedPrintedPages} trang in`);
      lines.push(`🕒 NGÀY XUẤT: ${utils.formatTimestampVN(Date.now())}`);
      lines.push('========================================================================');
      lines.push('');

      if (this.prefs.includeTableOfContents && chapters.length > 1) {
        lines.push('📖 MỤC LỤC CÁC CHƯƠNG:');
        lines.push('------------------------------------------------------------------------');
        chapters.forEach((c, idx) => {
          const title = c.displayTitle || c.title || `Chương ${idx + 1}`;
          const w = utils.countVietnameseWords(c.content || '');
          lines.push(`  ${String(idx + 1).padStart(2, '0')}. ${title} (${w.toLocaleString('vi-VN')} từ)`);
        });
        lines.push('------------------------------------------------------------------------');
        lines.push('');
      }

      chapters.forEach((chap, idx) => {
        const title = chap.displayTitle || chap.title || `Chương ${idx + 1}`;
        const w = utils.countVietnameseWords(chap.content || '');
        lines.push('========================================================================');
        lines.push(`CHƯƠNG ${idx + 1}: ${title.toUpperCase()}`);
        lines.push(`(Độ dài: ${w.toLocaleString('vi-VN')} từ — Trạng thái: ${chap.status === 'APPROVED' ? 'Đã duyệt' : 'Bản nháp'})`);
        lines.push('========================================================================');
        lines.push('');

        const rawParagraphs = String(chap.content || '')
          .split(/\r?\n+/)
          .map((p) => p.trim())
          .filter(Boolean);

        if (rawParagraphs.length === 0) {
          lines.push('(Chương này hiện chưa có nội dung)');
        } else {
          rawParagraphs.forEach((p) => {
            if (/^(\*\s*\*\s*\*|-{3,}|~{3,})$/.test(p)) {
              lines.push('');
              lines.push(`                    ${dividerObj.plain}`);
              lines.push('');
            } else if (this.prefs.enableFirstLineIndent) {
              lines.push(`    ${p}`);
            } else {
              lines.push(p);
            }
            lines.push('');
          });
        }
        lines.push('');
      });

      if (this.prefs.includeCharacterAppendix) {
        const bible = this.getStoryBibleEngine();
        const chars = Array.isArray(bible?.characters) ? bible.characters : [];
        if (chars.length > 0) {
          lines.push('========================================================================');
          lines.push('👥 PHỤ LỤC: HỒ SƠ NHÂN VẬT');
          lines.push('========================================================================');
          chars.forEach((ch, i) => {
            lines.push(`${i + 1}. ${ch.name} (${ch.role || 'Nhân vật'})`);
            lines.push(`   - Tính cách & Đặc điểm: ${ch.traits || ''}`);
            lines.push(`   - Mục tiêu & Động cơ : ${ch.goal || ''}`);
            lines.push('');
          });
        }
      }

      if (this.prefs.includeStoryBibleAppendix) {
        const renderedBible =
          document.getElementById('textarea-rendered-bible-content')?.value || '';
        if (renderedBible.trim()) {
          lines.push('========================================================================');
          lines.push('🏛️ PHỤ LỤC: HỒ SƠ THẾ GIỚI QUAN & STORY BIBLE');
          lines.push('========================================================================');
          lines.push(renderedBible.trim());
          lines.push('');
        }
      }

      const fullTxt = '\uFEFF' + lines.join('\r\n');
      const safeFilename = this.buildSafeFileName(
        chapters.length === 1
          ? chapters[0].displayTitle || chapters[0].title
          : this.prefs.bookTitle,
        'txt'
      );

      this.triggerBrowserDownload(
        fullTxt,
        safeFilename,
        'text/plain;charset=utf-8'
      );
      this.closeModal();
      utils.showToast(
        `📄 Đã xuất bản thảo ra file "${safeFilename}" (${metrics.totalWords.toLocaleString('vi-VN')} từ)!`,
        'success'
      );
    }

    // ------------------------------------------------------------------------
    // 3. Xuất Bản Thảo Ra File .DOCX (Chuẩn Microsoft Word & Google Docs)
    //    Giữ nguyên Font chữ, Cỡ chữ, Giãn dòng, Bìa sách và Ngắt trang
    // ------------------------------------------------------------------------
    exportDocx() {
      const utils = this.getUtils();
      this.readPrefsFromDOMControls();
      const chapters = this.getChaptersForExportScope();
      if (!chapters || chapters.length === 0) {
        utils.showToast('⚠️ Không có chương nào để xuất file .DOCX!', 'warning');
        return;
      }

      const metrics = this.calculateBookPublishingMetrics(chapters);
      const cleanFontName = this.prefs.fontFamily
        .split(',')[0]
        .replace(/['"]/g, '')
        .trim() || 'Times New Roman';
      const fontSizePt = parseInt(this.prefs.fontSize, 10) || 13;
      const lineHeightPercent = Math.round(
        (parseFloat(this.prefs.lineHeight) || 1.75) * 100
      );
      const indentCm = this.prefs.enableFirstLineIndent ? '1.0cm' : '0cm';

      let wordBodyHtml = '';

      // Trang bìa Word
      if (this.prefs.includeCoverPage) {
        wordBodyHtml += `
          <div style="text-align: center; padding-top: 80pt; padding-bottom: 80pt;">
            <p style="font-size: 10pt; letter-spacing: 2pt; color: #555555; text-transform: uppercase;">
              ${utils.escapeHtml(this.prefs.publisherLabel)}
            </p>
            <h1 style="font-size: 26pt; font-weight: bold; color: #065f46; margin-top: 24pt; margin-bottom: 12pt;">
              ${utils.escapeHtml(this.prefs.bookTitle)}
            </h1>
            <p style="font-size: 13pt; font-style: italic; color: #444444; margin-bottom: 36pt;">
              ${utils.escapeHtml(this.prefs.bookSubtitle)}
            </p>
            <p style="font-size: 14pt; font-weight: bold; margin-bottom: 48pt;">
              Tác giả: ${utils.escapeHtml(this.prefs.authorName)}
            </p>
            <p style="font-size: 10pt; color: #666666;">
              Tổng số chương: ${metrics.chapterCount} chương | Tổng số từ: ${metrics.totalWords.toLocaleString('vi-VN')} từ
            </p>
          </div>
          <br clear="all" style="page-break-before: always; mso-break-type: section-break;" />
        `;
      }

      // Mục lục Word
      if (this.prefs.includeTableOfContents && chapters.length > 1) {
        wordBodyHtml += `
          <h2 style="text-align: center; font-size: 18pt; color: #065f46; margin-bottom: 18pt;">
            MỤC LỤC TÁC PHẨM
          </h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24pt;">
            ${chapters
              .map((c, idx) => {
                const title = c.displayTitle || c.title || `Chương ${idx + 1}`;
                const w = utils.countVietnameseWords(c.content || '');
                return `
                  <tr>
                    <td style="padding: 6pt 4pt; border-bottom: 1px dotted #cccccc; font-weight: bold;">
                      ${idx + 1}. ${utils.escapeHtml(title)}
                    </td>
                    <td style="padding: 6pt 4pt; border-bottom: 1px dotted #cccccc; text-align: right; color: #555555;">
                      ${w.toLocaleString('vi-VN')} từ
                    </td>
                  </tr>
                `;
              })
              .join('')}
          </table>
          <br clear="all" style="page-break-before: always; mso-break-type: section-break;" />
        `;
      }

      // Nội dung từng chương
      chapters.forEach((chap, idx) => {
        const title = chap.displayTitle || chap.title || `Chương ${idx + 1}`;
        const w = utils.countVietnameseWords(chap.content || '');
        const paras = String(chap.content || '')
          .split(/\r?\n+/)
          .map((p) => p.trim())
          .filter(Boolean);

        wordBodyHtml += `
          <div class="word-chapter-block">
            <p style="text-align: center; font-size: 10pt; color: #666666; letter-spacing: 2pt; text-transform: uppercase; margin-bottom: 4pt;">
              CHƯƠNG THỨ ${idx + 1}
            </p>
            <h1 style="text-align: center; font-size: ${
              fontSizePt + 5
            }pt; font-weight: bold; color: #065f46; margin-top: 0; margin-bottom: 6pt;">
              ${utils.escapeHtml(title)}
            </h1>
            <p style="text-align: center; font-size: 9.5pt; font-style: italic; color: #666666; margin-bottom: 20pt;">
              (${w.toLocaleString('vi-VN')} từ)
            </p>
            ${
              paras.length > 0
                ? paras
                    .map((p) => {
                      if (/^(\*\s*\*\s*\*|-{3,}|~{3,})$/.test(p)) {
                        return `<p style="text-align: center; text-indent: 0; margin: 14pt 0; color: #065f46;">✦ &nbsp;&nbsp; ✦ &nbsp;&nbsp; ✦</p>`;
                      }
                      return `<p class="MsoNormal" style="text-align: justify; text-indent: ${indentCm}; margin-top: 0; margin-bottom: 6pt; line-height: ${lineHeightPercent}%; font-family: '${cleanFontName}', serif; font-size: ${fontSizePt}pt;">${utils.escapeHtml(
                        p
                      )}</p>`;
                    })
                    .join('\n')
                : `<p style="font-style: italic; color: #777777;">(Chương này hiện chưa có nội dung)</p>`
            }
          </div>
          ${
            idx < chapters.length - 1
              ? `<br clear="all" style="page-break-before: always; mso-break-type: section-break;" />`
              : ''
          }
        `;
      });

      const wordDocumentXml = `<html xmlns:o="urn:schemas-microsoft-com:office:office"
xmlns:w="urn:schemas-microsoft-com:office:word"
xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8" />
  <title>${utils.escapeHtml(this.prefs.bookTitle)}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page WordSection1 {
      size: 21.0cm 29.7cm;
      margin: 2.5cm 2.2cm 2.5cm 2.8cm;
      mso-header-margin: 1.2cm;
      mso-footer-margin: 1.2cm;
    }
    div.WordSection1 {
      page: WordSection1;
    }
    body, p.MsoNormal {
      font-family: '${cleanFontName}', 'Times New Roman', serif;
      font-size: ${fontSizePt}pt;
      line-height: ${lineHeightPercent}%;
      color: #111111;
    }
  </style>
</head>
<body>
  <div class="WordSection1">
    ${wordBodyHtml}
  </div>
</body>
</html>`;

      const safeFilename = this.buildSafeFileName(
        chapters.length === 1
          ? chapters[0].displayTitle || chapters[0].title
          : this.prefs.bookTitle,
        'docx'
      );

      this.triggerBrowserDownload(
        '\uFEFF' + wordDocumentXml,
        safeFilename,
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
      this.closeModal();
      utils.showToast(
        `📘 Đã xuất bản thảo ra file Word "${safeFilename}" (Font ${cleanFontName}, cỡ ${fontSizePt}pt)!`,
        'success'
      );
    }

    // ------------------------------------------------------------------------
    // 4. Xuất Bản Thảo Ra File .MD (Markdown Chuẩn Đăng Web Novel / Obsidian)
    // ------------------------------------------------------------------------
    exportMarkdown() {
      const utils = this.getUtils();
      this.readPrefsFromDOMControls();
      const chapters = this.getChaptersForExportScope();
      if (!chapters || chapters.length === 0) return;

      const metrics = this.calculateBookPublishingMetrics(chapters);
      const mdLines = [
        `# 📚 ${this.prefs.bookTitle}`,
        ``,
        `- **Tác giả:** ${this.prefs.authorName}`,
        `- **Thống kê:** ${metrics.chapterCount} chương | ${metrics.totalWords.toLocaleString('vi-VN')} từ`,
        `- **Ngày xuất:** ${utils.formatTimestampVN(Date.now())}`,
        ``,
        `---`,
        ``
      ];

      chapters.forEach((chap, idx) => {
        const title = chap.displayTitle || chap.title || `Chương ${idx + 1}`;
        mdLines.push(`## Chương ${idx + 1}: ${title}`);
        mdLines.push(``);
        const paras = String(chap.content || '')
          .split(/\r?\n+/)
          .map((p) => p.trim())
          .filter(Boolean);
        paras.forEach((p) => {
          mdLines.push(p);
          mdLines.push(``);
        });
        mdLines.push(`---`);
        mdLines.push(``);
      });

      const safeFilename = this.buildSafeFileName(this.prefs.bookTitle, 'md');
      this.triggerBrowserDownload(
        mdLines.join('\n'),
        safeFilename,
        'text/markdown;charset=utf-8'
      );
      utils.showToast(`📝 Đã xuất bản thảo Markdown "${safeFilename}"!`, 'success');
    }

    // ------------------------------------------------------------------------
    // 5. Xuất Sách Điện Tử .EPUB / Standalone E-Book Reader
    // ------------------------------------------------------------------------
    exportEpub() {
      const utils = this.getUtils();
      this.readPrefsFromDOMControls();
      const chapters = this.getChaptersForExportScope();
      if (!chapters || chapters.length === 0) return;

      const metrics = this.calculateBookPublishingMetrics(chapters);
      const xhtmlContent = this.buildStandaloneInteractiveEbookHtml(chapters, metrics);
      const safeFilename = this.buildSafeFileName(
        `${this.prefs.bookTitle}_Ebook_Reader`,
        'html'
      );

      this.triggerBrowserDownload(
        xhtmlContent,
        safeFilename,
        'text/html;charset=utf-8'
      );
      utils.showToast(
        `📱 Đã xuất Sách Điện Tử Tương Tác "${safeFilename}" (Mở được trên mọi điện thoại & máy tính mà không cần mạng)!`,
        'success',
        4500
      );
    }

    // ------------------------------------------------------------------------
    // 6. Sao Lưu Toàn Bộ Dự Án Ra File .JSON (Workspace Backup)
    // ------------------------------------------------------------------------
    exportWorkspaceJsonBackup() {
      const utils = this.getUtils();
      const chapMgr = this.getChapterManager();
      if (chapMgr && typeof chapMgr.syncEditorToActiveChapter === 'function') {
        chapMgr.syncEditorToActiveChapter();
      }

      const bible = this.getStoryBibleEngine();
      const vault = this.getVersionVault();

      const backupPayload = {
        studioBackupFormat: 'NOIR_LIGHT_NOVEL_STUDIO_V38_FULL_BACKUP',
        exportedAt: Date.now(),
        exportedAtFormatted: utils.formatTimestampVN(Date.now()),
        bookMetadata: this.prefs,
        activeChapterId: chapMgr?.activeChapterId || null,
        chapters: Array.isArray(chapMgr?.chapters) ? chapMgr.chapters : [],
        storyBible: {
          templateFrame:
            document.getElementById('textarea-bible-template-frame')?.value ||
            localStorage.getItem('noir_s10_bible_template_frame') ||
            '',
          renderedContent:
            document.getElementById('textarea-rendered-bible-content')?.value ||
            localStorage.getItem('noir_s10_rendered_bible_content') ||
            '',
          isLocked: Boolean(bible?.isTemplateLocked),
          characters: Array.isArray(bible?.characters) ? bible.characters : [],
          knowledgeMatrix: Array.isArray(bible?.knowledgeMatrix)
            ? bible.knowledgeMatrix
            : [],
          cluesLedger: Array.isArray(bible?.cluesLedger) ? bible.cluesLedger : [],
          antiClicheBlacklist:
            document.getElementById('textarea-anti-cliche-blacklist')?.value || ''
        },
        sceneMarkers:
          window.NoirStudio?.sceneBuilder?.markers ||
          JSON.parse(localStorage.getItem('noir_s18_scene_pov_markers_v1') || '[]'),
        modeOutputs:
          window.NoirStudio?.tab3Controller?.modeOutputs ||
          JSON.parse(localStorage.getItem('noir_s20_quad_mode_outputs_v1') || '{}'),
        customSystemPrompts:
          window.NoirStudio?.sysPrompts?.customPrompts ||
          JSON.parse(localStorage.getItem('noir_s20_custom_mode_sysprompts_v1') || '{}'),
        scratchpadNotes:
          document.getElementById('textarea-quick-scratchpad')?.value ||
          localStorage.getItem('noir_quick_scratchpad_notes') ||
          '',
        versionSnapshots: Array.isArray(vault?.snapshots)
          ? vault.snapshots.slice(0, 30)
          : []
      };

      const jsonString = JSON.stringify(backupPayload, null, 2);
      const safeName = this.buildSafeFileName(
        `Sao_Luu_Tieu_Thuyet_Bi_${new Date().toISOString().slice(0, 10)}`,
        'json'
      );

      this.triggerBrowserDownload(
        jsonString,
        safeName,
        'application/json;charset=utf-8'
      );
      utils.showToast(
        `💾 Đã tải xuống bản sao lưu toàn diện "${safeName}" (Gồm toàn bộ Chương, Story Bible, Nhân vật & Lịch sử phiên bản)!`,
        'success',
        4500
      );
    }

    // ------------------------------------------------------------------------
    // 7. Đóng Gói Chia Sẻ Cho Bạn Bè (.HTML Sách Độc Lập Đầy Đủ Chế Độ Đọc)
    // ------------------------------------------------------------------------
    exportShareBundle() {
      const utils = this.getUtils();
      this.readPrefsFromDOMControls();
      const chapMgr = this.getChapterManager();
      if (chapMgr && typeof chapMgr.syncEditorToActiveChapter === 'function') {
        chapMgr.syncEditorToActiveChapter();
      }
      const allChaps =
        Array.isArray(chapMgr?.chapters) && chapMgr.chapters.length > 0
          ? chapMgr.chapters
          : this.getChaptersForExportScope();

      const metrics = this.calculateBookPublishingMetrics(allChaps);
      const bundleHtml = this.buildStandaloneInteractiveEbookHtml(allChaps, metrics);
      const safeName = this.buildSafeFileName(
        `Tieu_Thuyet_${this.prefs.bookTitle}_Ban_Doc_Chia_Se`,
        'html'
      );

      this.triggerBrowserDownload(bundleHtml, safeName, 'text/html;charset=utf-8');
      utils.showToast(
        `🎁 Đã đóng gói ấn phẩm chia sẻ "${safeName}"! Bạn có thể gửi file này cho bạn bè mở đọc ngay trên điện thoại hoặc máy tính.`,
        'success',
        5000
      );
    }

    /**
     * Xây dựng ứng dụng đọc sách điện tử độc lập (.HTML Standalone E-Reader)
     * có thanh chọn chương, chỉnh cỡ chữ, đổi màu nền (Noir / Giấy Kem / Sáng)
     * và lưu vị trí đọc tự động.
     */
    buildStandaloneInteractiveEbookHtml(chapters, metrics) {
      const utils = this.getUtils();
      const serializedChapters = JSON.stringify(
        chapters.map((c, idx) => ({
          index: idx + 1,
          title: c.displayTitle || c.title || `Chương ${idx + 1}`,
          wordCount: utils.countVietnameseWords(c.content || ''),
          status: c.status || 'DRAFT',
          content: String(c.content || '')
        }))
      ).replace(/<\/script>/gi, '<\\/script>');

      return `<!DOCTYPE html>
<html lang="vi" data-ereader-theme="cream">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>📖 ${utils.escapeHtml(this.prefs.bookTitle)} — Ấn Bản Đọc Sách Độc Lập</title>
  <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;600;700&family=Literata:ital,opsz,wght@0,7..72,400;0,7..72,700;1,7..72,400&family=Merriweather:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet" />
  <style>
    :root {
      --er-bg: #FCF9F2;
      --er-panel: #F3EFE4;
      --er-text: #1C1917;
      --er-accent: #059669;
      --er-border: #D6D3D1;
      --er-font-size: 18px;
      --er-line-height: 1.85;
    }
    html[data-ereader-theme="noir"] {
      --er-bg: #09090B;
      --er-panel: #141418;
      --er-text: #E4E4E7;
      --er-accent: #10B981;
      --er-border: #27272A;
    }
    html[data-ereader-theme="sepia"] {
      --er-bg: #F4ECD8;
      --er-panel: #EAE0C8;
      --er-text: #2C221E;
      --er-accent: #92400E;
      --er-border: #C8B89A;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--er-bg);
      color: var(--er-text);
      font-family: 'Merriweather', 'Literata', Georgia, serif;
      font-size: var(--er-font-size);
      line-height: var(--er-line-height);
      transition: background 0.2s, color 0.2s;
    }
    header {
      position: sticky;
      top: 0;
      z-index: 50;
      background: var(--er-panel);
      border-bottom: 1px solid var(--er-border);
      padding: 10px 18px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      font-family: 'Be Vietnam Pro', system-ui, sans-serif;
      font-size: 13px;
    }
    select, button {
      font-family: inherit;
      font-size: 12px;
      font-weight: 700;
      padding: 6px 12px;
      border-radius: 8px;
      border: 1px solid var(--er-border);
      background: var(--er-bg);
      color: var(--er-text);
      cursor: pointer;
    }
    button:hover {
      border-color: var(--er-accent);
    }
    main {
      max-width: 760px;
      margin: 0 auto;
      padding: 36px 20px 90px 20px;
    }
    h1.chap-heading {
      text-align: center;
      color: var(--er-accent);
      font-size: 1.6em;
      margin-bottom: 8px;
    }
    .chap-submeta {
      text-align: center;
      font-size: 0.8em;
      opacity: 0.72;
      margin-bottom: 32px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--er-border);
    }
    p.novel-p {
      text-align: justify;
      text-indent: 1.8em;
      margin: 0 0 0.6em 0;
    }
    .nav-footer {
      margin-top: 48px;
      padding-top: 20px;
      border-top: 1px solid var(--er-border);
      display: flex;
      justify-content: space-between;
      font-family: 'Be Vietnam Pro', sans-serif;
    }
  </style>
</head>
<body>
  <header>
    <div>
      <strong style="color: var(--er-accent);">📖 ${utils.escapeHtml(
        this.prefs.bookTitle
      )}</strong>
      <span style="opacity: 0.75; margin-left: 8px;">— ${utils.escapeHtml(
        this.prefs.authorName
      )} (${metrics.totalWords.toLocaleString('vi-VN')} từ)</span>
    </div>
    <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
      <select id="er-chap-select"></select>
      <button type="button" onclick="changeFontSize(-1)">A-</button>
      <button type="button" onclick="changeFontSize(1)">A+</button>
      <button type="button" onclick="cycleTheme()">🎨 Đổi nền</button>
      <button type="button" onclick="window.print()">🖨️ In / PDF</button>
    </div>
  </header>

  <main>
    <h1 id="er-chap-title" class="chap-heading"></h1>
    <div id="er-chap-meta" class="chap-submeta"></div>
    <div id="er-chap-body"></div>
    <div class="nav-footer">
      <button type="button" id="er-prev-btn" onclick="stepChapter(-1)">← Chương trước</button>
      <button type="button" id="er-next-btn" onclick="stepChapter(1)">Chương tiếp theo →</button>
    </div>
  </main>

  <script>
    var CHAPTERS = ${serializedChapters};
    var currentIdx = 0;
    var fontSize = 18;
    var themes = ['cream', 'noir', 'sepia'];
    var themeIdx = 0;

    function initReader() {
      var sel = document.getElementById('er-chap-select');
      sel.innerHTML = CHAPTERS.map(function(c, i) {
        return '<option value="' + i + '">' + c.title + ' (' + c.wordCount + ' từ)</option>';
      }).join('');
      sel.addEventListener('change', function() {
        renderChapter(parseInt(sel.value, 10) || 0);
      });
      renderChapter(0);
    }

    function renderChapter(idx) {
      if (idx < 0 || idx >= CHAPTERS.length) return;
      currentIdx = idx;
      document.getElementById('er-chap-select').value = String(idx);
      var ch = CHAPTERS[idx];
      document.getElementById('er-chap-title').textContent = ch.title;
      document.getElementById('er-chap-meta').textContent =
        'Chương ' + ch.index + ' / ' + CHAPTERS.length + ' • ' + ch.wordCount.toLocaleString('vi-VN') + ' từ';
      var lines = String(ch.content || '').split(/\\r?\\n+/).filter(Boolean);
      document.getElementById('er-chap-body').innerHTML = lines.map(function(ln) {
        var safe = ln.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return '<p class="novel-p">' + safe + '</p>';
      }).join('');
      document.getElementById('er-prev-btn').disabled = (idx === 0);
      document.getElementById('er-next-btn').disabled = (idx === CHAPTERS.length - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function stepChapter(delta) {
      renderChapter(currentIdx + delta);
    }

    function changeFontSize(delta) {
      fontSize = Math.max(14, Math.min(28, fontSize + delta));
      document.documentElement.style.setProperty('--er-font-size', fontSize + 'px');
    }

    function cycleTheme() {
      themeIdx = (themeIdx + 1) % themes.length;
      document.documentElement.setAttribute('data-ereader-theme', themes[themeIdx]);
    }

    initReader();
  </script>
</body>
</html>`;
    }

    // ------------------------------------------------------------------------
    // Các hàm tiện ích đặt tên file an toàn và kích hoạt tải xuống trình duyệt
    // ------------------------------------------------------------------------
    buildSafeFileName(rawTitle, extension) {
      const clean = String(rawTitle || 'Tieu_Thuyet_Cua_Bi')
        .trim()
        .replace(/[\\/:*?"<>|]+/g, '_')
        .replace(/\s+/g, '_')
        .slice(0, 75);
      const ext = String(extension || 'txt').replace(/^\./, '');
      return `${clean || 'Tieu_Thuyet_Cua_Bi'}.${ext}`;
    }

    triggerBrowserDownload(content, filename, mimeType) {
      const blob =
        content instanceof Blob
          ? content
          : new Blob([content], { type: mimeType || 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 3000);
    }
  }

  const exporterEngine = new CustomBookExporterEngine();
  window.NoirStudio.exporter = exporterEngine;
  window.NoirStudio.customExporter = exporterEngine;
})();
