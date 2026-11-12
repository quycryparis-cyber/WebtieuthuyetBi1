/**
 * ============================================================================
 * MODULE 15: KÉT SẮT GEMINI API KEY & BỘ ĐỊNH TUYẾN ZERO-CONGESTION CLIENT
 * Tệp: mod15_api_key_vault_and_zero_congestion_client.js
 * ============================================================================
 * Nhiệm vụ chuyên biệt:
 *   1. Quản lý Két Sắt Gemini API Key (`#modal-api-key-vault`) lưu cục bộ an toàn
 *      trên trình duyệt người dùng + hỗ trợ Kho Key Dự Phòng xoay vòng khi hết quota.
 *   2. Đồng bộ 100% 3 trình chọn mô hình trên toàn giao diện:
 *      - `#select-gemini-model` (Trung tâm Điều khiển AI)
 *      - `#confirm-modal-model-select` (Cửa sổ Xác nhận Prompt Tổng hợp Bước 2/2)
 *      - `#mode5-model-selector` (Studio Biểu đồ Cốt truyện & Thời gian Chế độ 5)
 *      tuyệt đối KHÔNG chứa nút mở Google Studio hay bảng thông số dư thừa.
 *   3. Kích hoạt cảnh báo `#confirm-model-lite-warning` theo thời gian thực bất cứ
 *      khi nào người dùng chọn mô hình dòng Flash-Lite, khuyến cáo nâng lên Flash/Pro/Argon.
 *   4. Động cơ gọi API Gemini `generateTextWithFallback(...)` chống nghẽn cổ chai:
 *      tự động trượt sang endpoint dự phòng khi gặp 429/503/404, ghi nhận telemetry
 *      sang `mod02`, hỗ trợ AbortController khi người dùng bấm Hủy ở Màn hình chờ.
 * ============================================================================
 */
(function (global) {
  'use strict';

  const NS = (global.NoirStudio = global.NoirStudio || {});

  const DEFAULT_MODEL_FALLBACK_ID = 'gemini-3.8-flash';
  const API_KEY_BACKUP_VAULT_KEY = 'noir_gemini_backup_keys_vault_v1';
  const API_CALL_HISTORY_LOG_KEY = 'noir_gemini_api_call_ledger_v1';

  // Bảng mô hình tối thiểu dự phòng nếu mod02 chưa sẵn sàng
  const SAFE_INLINE_MODELS_CATALOG = Object.freeze([
    {
      id: 'gemini-3.8-flash',
      label: 'Gemini 3.8 Flash — Nhanh, Sắc Nét & Giàu Cảm Xúc (Khuyên dùng)',
      tier: 'BALANCED',
      endpointCandidates: ['gemini-3.8-flash', 'gemini-2.5-flash'],
      isLite: false
    },
    {
      id: 'gemini-3.1-pro-preview',
      label: 'Gemini 3.1 Pro Preview — Tâm Lý Sâu Sắc & Cốt Truyện Nhiều Tầng',
      tier: 'PRO',
      endpointCandidates: ['gemini-3.1-pro-preview', 'gemini-2.5-pro', 'gemini-2.5-flash'],
      isLite: false
    },
    {
      id: 'gemini-4-argon',
      label: 'Gemini 4 Argon — Flagship Thế Hệ Mới Cho Tiểu Thuyết Dài Hơi',
      tier: 'FLAGSHIP',
      endpointCandidates: ['gemini-4-argon', 'gemini-3.8-flash', 'gemini-2.5-pro'],
      isLite: false
    },
    {
      id: 'gemini-4-carbon',
      label: 'Gemini 4 Carbon — Tư Duy Logic & Kiểm Toán Chặt Chẽ',
      tier: 'FLAGSHIP',
      endpointCandidates: ['gemini-4-carbon', 'gemini-3.8-flash', 'gemini-2.5-flash'],
      isLite: false
    },
    {
      id: 'gemini-3.6-flash',
      label: 'Gemini 3.6 Flash — Cân Bằng Tốc Độ & Độ Mượt Thoại',
      tier: 'BALANCED',
      endpointCandidates: ['gemini-3.6-flash', 'gemini-2.5-flash'],
      isLite: false
    },
    {
      id: 'gemini-3.5-flash-lite',
      label: 'Gemini 3.5 Flash-Lite — Siêu Nhanh (Chỉ hợp nháp ý ngắn)',
      tier: 'LIGHT',
      endpointCandidates: ['gemini-3.5-flash-lite', 'gemini-2.5-flash-lite'],
      isLite: true
    },
    {
      id: 'gemini-3.1-flash-lite-preview',
      label: 'Gemini 3.1 Flash-Lite Preview — Thử Nghiệm Nháp Nhanh',
      tier: 'LIGHT',
      endpointCandidates: ['gemini-3.1-flash-lite-preview', 'gemini-2.5-flash-lite'],
      isLite: true
    }
  ]);

  function getUtils() {
    return NS.utils || {
      escapeHtml: (s) =>
        String(s == null ? '' : s)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;'),
      countVietnameseWords: (t) =>
        String(t || '')
          .trim()
          .split(/\s+/)
          .filter(Boolean).length,
      showToast: () => {}
    };
  }

  function getStorageKeys() {
    return (
      NS.constants?.STORAGE_KEYS || {
        API_KEY: 'noir_gemini_api_key',
        SELECTED_MODEL: 'noir_selected_gemini_model'
      }
    );
  }

  // ==========================================================================
  // LỚP 1: QUẢN LÝ KÉT SẮT API KEY & XOAY VÒNG KEY DỰ PHÒNG AN TOÀN
  // ==========================================================================
  class ApiKeyVaultAndRotationManager {
    constructor() {
      this.primaryKey = this.loadPrimaryKey();
      this.backupKeys = this.loadBackupKeys();
      this.lastVerifiedAt = 0;
      this.lastVerificationSummary = null;
    }

    sanitizeKeyString(raw) {
      return String(raw || '')
        .replace(/[\r\n\t\s]+/g, '')
        .trim();
    }

    isPlausibleGeminiKeyFormat(keyStr) {
      const cleaned = this.sanitizeKeyString(keyStr);
      if (!cleaned) return { valid: false, reason: 'Khóa API đang trống.' };
      if (cleaned.length < 24) {
        return {
          valid: false,
          reason: 'Khóa API quá ngắn (Gemini API Key thường bắt đầu bằng AIza... và dài khoảng 39 ký tự).'
        };
      }
      if (!/^AIza[0-9A-Za-z\-_]{20,}$/.test(cleaned)) {
        return {
          valid: true,
          warning: 'Định dạng key không bắt đầu bằng tiền tố AIza thông thường — hệ thống vẫn sẽ thử xác thực trực tiếp qua API.'
        };
      }
      return { valid: true, warning: '' };
    }

    maskKeyForDisplay(keyStr) {
      const cleaned = this.sanitizeKeyString(keyStr);
      if (!cleaned) return 'Chưa có API Key';
      if (cleaned.length <= 10) return '••••••••••';
      return `${cleaned.slice(0, 6)}••••••••••••${cleaned.slice(-4)}`;
    }

    loadPrimaryKey() {
      const keyName = getStorageKeys().API_KEY || 'noir_gemini_api_key';
      try {
        const stored = localStorage.getItem(keyName) || '';
        return this.sanitizeKeyString(stored);
      } catch (_) {
        return '';
      }
    }

    savePrimaryKey(rawKey) {
      const cleaned = this.sanitizeKeyString(rawKey);
      const keyName = getStorageKeys().API_KEY || 'noir_gemini_api_key';
      this.primaryKey = cleaned;
      try {
        if (cleaned) {
          localStorage.setItem(keyName, cleaned);
        } else {
          localStorage.removeItem(keyName);
        }
        return true;
      } catch (_) {
        return false;
      }
    }

    loadBackupKeys() {
      try {
        const raw = localStorage.getItem(API_KEY_BACKUP_VAULT_KEY);
        if (!raw) return [];
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          return arr
            .map((item) => ({
              id: String(item.id || `bk_${Date.now()}`),
              label: String(item.label || 'Key dự phòng'),
              key: this.sanitizeKeyString(item.key),
              cooldownUntil: Number(item.cooldownUntil || 0),
              errorCount: Number(item.errorCount || 0)
            }))
            .filter((item) => item.key.length >= 20);
        }
      } catch (_) {}
      return [];
    }

    persistBackupKeys() {
      try {
        localStorage.setItem(
          API_KEY_BACKUP_VAULT_KEY,
          JSON.stringify(this.backupKeys)
        );
      } catch (_) {}
    }

    addBackupKey(rawKey, label = 'Key dự phòng') {
      const cleaned = this.sanitizeKeyString(rawKey);
      const format = this.isPlausibleGeminiKeyFormat(cleaned);
      if (!format.valid) {
        return { ok: false, error: format.reason };
      }
      if (
        cleaned === this.primaryKey ||
        this.backupKeys.some((k) => k.key === cleaned)
      ) {
        return { ok: false, error: 'Key này đã có sẵn trong két sắt.' };
      }
      const entry = {
        id: `bk_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        label: String(label || `Key dự phòng #${this.backupKeys.length + 1}`).trim(),
        key: cleaned,
        cooldownUntil: 0,
        errorCount: 0
      };
      this.backupKeys.push(entry);
      this.persistBackupKeys();
      return { ok: true, entry };
    }

    removeBackupKey(id) {
      const prevLen = this.backupKeys.length;
      this.backupKeys = this.backupKeys.filter((k) => k.id !== id);
      if (this.backupKeys.length !== prevLen) {
        this.persistBackupKeys();
        return true;
      }
      return false;
    }

    getCandidateKeysForRequest() {
      const now = Date.now();
      const candidates = [];
      if (this.primaryKey) {
        candidates.push({
          source: 'PRIMARY',
          label: 'Key Chính',
          key: this.primaryKey
        });
      }
      for (const bk of this.backupKeys) {
        if (bk.key && bk.cooldownUntil <= now) {
          candidates.push({
            source: 'BACKUP',
            label: bk.label,
            id: bk.id,
            key: bk.key
          });
        }
      }
      return candidates;
    }

    markKeyRateLimited(keyStr, cooldownMs = 65000) {
      const found = this.backupKeys.find((b) => b.key === keyStr);
      if (found) {
        found.cooldownUntil = Date.now() + cooldownMs;
        found.errorCount += 1;
        this.persistBackupKeys();
      }
    }
  }

  // ==========================================================================
  // LỚP 2: SỔ CÁI NHẬT KÝ CUỘC GỌI GEMINI API & CHẨN ĐOÁN LỖI MẠNG
  // ==========================================================================
  class ApiExecutionLedgerAndDiagnostics {
    constructor() {
      this.entries = this.loadEntries();
    }

    loadEntries() {
      try {
        const raw = localStorage.getItem(API_CALL_HISTORY_LOG_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.slice(0, 60) : [];
      } catch (_) {
        return [];
      }
    }

    recordCall(entry) {
      const normalized = {
        id: `api_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        timestamp: Date.now(),
        requestedModel: entry.requestedModel || 'unknown',
        usedEndpoint: entry.usedEndpoint || entry.requestedModel || 'unknown',
        keyLabel: entry.keyLabel || 'Key Chính',
        status: entry.status || 'SUCCESS',
        httpStatus: Number(entry.httpStatus || 200),
        durationMs: Math.round(Number(entry.durationMs || 0)),
        promptChars: Number(entry.promptChars || 0),
        outputWords: Number(entry.outputWords || 0),
        errorMessage: entry.errorMessage ? String(entry.errorMessage).slice(0, 220) : ''
      };
      this.entries.unshift(normalized);
      if (this.entries.length > 60) {
        this.entries.length = 60;
      }
      try {
        localStorage.setItem(
          API_CALL_HISTORY_LOG_KEY,
          JSON.stringify(this.entries)
        );
      } catch (_) {}
      return normalized;
    }

    getSummaryStats() {
      const total = this.entries.length;
      const successes = this.entries.filter((e) => e.status === 'SUCCESS');
      const avgLatency =
        successes.length > 0
          ? Math.round(
              successes.reduce((s, e) => s + e.durationMs, 0) / successes.length
            )
          : 0;
      const totalOutputWords = successes.reduce(
        (s, e) => s + (e.outputWords || 0),
        0
      );
      return {
        totalCalls: total,
        successCalls: successes.length,
        failedCalls: total - successes.length,
        avgLatencyMs: avgLatency,
        totalOutputWords,
        lastEntry: this.entries[0] || null
      };
    }

    translateHttpErrorToHumanVietnamese(statusCode, rawErrorText = '') {
      if (NS.apiErrorAdvisor && typeof NS.apiErrorAdvisor.explainError === 'function') {
        try {
          const advised = NS.apiErrorAdvisor.explainError(statusCode, rawErrorText);
          if (advised && advised.humanMessage) {
            return advised.humanMessage;
          }
        } catch (_) {}
      }

      const lower = String(rawErrorText || '').toLowerCase();
      if (statusCode === 400 && lower.includes('api key not valid')) {
        return 'Khóa API Key không hợp lệ hoặc đã bị thu hồi. Hãy kiểm tra lại chuỗi AIza... trong Két Sắt Tab 6.';
      }
      if (statusCode === 401 || statusCode === 403) {
        return 'Khóa API chưa được cấp quyền dùng Gemini API hoặc bị hạn chế vùng/billing.';
      }
      if (statusCode === 404 || lower.includes('not found')) {
        return 'Endpoint mô hình thử nghiệm này chưa mở cho tài khoản; hệ thống đang tự trượt sang mô hình dự phòng tương đương.';
      }
      if (statusCode === 429 || lower.includes('quota') || lower.includes('resource_exhausted')) {
        return 'Đụng giới hạn lượt gọi (Rate Limit / Quota 429). Hệ thống sẽ tự nghỉ nhịp ngắn hoặc đổi mô hình/key dự phòng.';
      }
      if (statusCode >= 500 && statusCode <= 599) {
        return `Máy chủ Gemini đang bận tạm thời (HTTP ${statusCode}). Hệ thống sẽ tự thử lại mượt mà.`;
      }
      if (lower.includes('failed to fetch') || lower.includes('networkerror')) {
        return 'Không thể kết nối mạng tới máy chủ Google Gemini. Vui lòng kiểm tra Wi-Fi/4G hoặc tường lửa trình duyệt.';
      }
      return `Lỗi kết nối AI (Mã ${statusCode || 'NET'}): ${String(rawErrorText || 'Không rõ nguyên nhân').slice(0, 140)}`;
    }
  }

  // ==========================================================================
  // LỚP 3: TRÌNH ĐÓNG GÓI PAYLOAD GEMINI & BỘ GIẢI MÃ PHẢN HỒI AN TOÀN
  // ==========================================================================
  class GeminiPayloadAndResponseAdapter {
    buildGenerateContentPayload({
      prompt,
      systemInstruction = '',
      temperature = 0.78,
      maxOutputTokens = 8192,
      safetyMode = 'LITERARY_CREATIVE'
    }) {
      const clampedTemp = Math.max(0, Math.min(2.0, Number(temperature ?? 0.78)));
      const clampedTokens = Math.max(256, Math.min(32768, Number(maxOutputTokens || 8192)));

      const payload = {
        contents: [
          {
            role: 'user',
            parts: [{ text: String(prompt || '') }]
          }
        ],
        generationConfig: {
          temperature: clampedTemp,
          topP: clampedTemp > 0.9 ? 0.96 : 0.92,
          topK: 40,
          maxOutputTokens: clampedTokens
        }
      };

      if (systemInstruction && String(systemInstruction).trim().length > 0) {
        payload.systemInstruction = {
          parts: [{ text: String(systemInstruction).trim() }]
        };
      }

      if (safetyMode === 'LITERARY_CREATIVE') {
        payload.safetySettings = [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_ONLY_HIGH'
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_ONLY_HIGH'
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_ONLY_HIGH'
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_ONLY_HIGH'
          }
        ];
      }

      return payload;
    }

    extractTextFromGeminiResponse(jsonData) {
      if (!jsonData || typeof jsonData !== 'object') {
        return { ok: false, text: '', reason: 'Phản hồi JSON từ máy chủ rỗng.' };
      }

      if (jsonData.promptFeedback?.blockReason) {
        return {
          ok: false,
          text: '',
          reason: `Bộ lọc an toàn đầu vào tạm chặn (${jsonData.promptFeedback.blockReason}). Hãy giảm bớt từ nhạy cảm trực diện trong câu lệnh.`
        };
      }

      const candidate = Array.isArray(jsonData.candidates)
        ? jsonData.candidates[0]
        : null;
      if (!candidate) {
        return {
          ok: false,
          text: '',
          reason: 'Gemini không trả về nhánh ứng viên nội dung nào.'
        };
      }

      const finishReason = candidate.finishReason || 'STOP';
      const parts = Array.isArray(candidate.content?.parts)
        ? candidate.content.parts
        : [];
      const extractedText = parts
        .filter((p) => typeof p?.text === 'string')
        .map((p) => p.text)
        .join('\n')
        .trim();

      if (!extractedText) {
        return {
          ok: false,
          text: '',
          finishReason,
          reason:
            finishReason === 'SAFETY'
              ? 'Đầu ra bị bộ lọc an toàn SAFETY tạm ngắt giữa chừng. Hãy thử diễn đạt cảnh bạo lực/nhạy cảm theo lối ẩn dụ tâm lý.'
              : `Không trích xuất được văn bản từ phản hồi (Trạng thái: ${finishReason}).`
        };
      }

      const truncatedByMaxTokens = finishReason === 'MAX_TOKENS';
      return {
        ok: true,
        text: truncatedByMaxTokens
          ? `${extractedText}\n\n[... Lưu ý: Chương viết đã chạm ngưỡng độ dài 1 lượt xuất, bạn có thể bấm Chế độ 1 viết nối tiếp phần còn lại.]`
          : extractedText,
        finishReason,
        truncatedByMaxTokens,
        usageMetadata: jsonData.usageMetadata || null
      };
    }
  }

  // ==========================================================================
  // LỚP 4: BỘ ĐIỀU PHỐI HÀNG ĐỢI ZERO-CONGESTION & RETRY MỀM
  // ==========================================================================
  class ZeroCongestionRequestScheduler {
    constructor(vaultMgr, ledger) {
      this.vaultMgr = vaultMgr;
      this.ledger = ledger;
      this.adapter = new GeminiPayloadAndResponseAdapter();
      this.inFlightAbortControllers = new Set();
      this.activeConcurrency = 0;
      this.maxConcurrency = 2;
    }

    sleepMs(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    abortAllPendingRequests() {
      let aborted = 0;
      for (const ctrl of this.inFlightAbortControllers) {
        try {
          ctrl.abort(new Error('USER_CANCELLED_TASK'));
          aborted += 1;
        } catch (_) {}
      }
      this.inFlightAbortControllers.clear();
      return aborted;
    }

    getModelEndpointChain(requestedModelId) {
      if (NS.modelAdvisor && typeof NS.modelAdvisor.buildFallbackChain === 'function') {
        try {
          const chain = NS.modelAdvisor.buildFallbackChain(requestedModelId);
          if (Array.isArray(chain) && chain.length > 0) {
            return chain;
          }
        } catch (_) {}
      }

      const catalog = Array.isArray(NS.models) && NS.models.length > 0
        ? NS.models
        : SAFE_INLINE_MODELS_CATALOG;
      const target =
        catalog.find((m) => m.id === requestedModelId) ||
        catalog.find((m) => m.id === DEFAULT_MODEL_FALLBACK_ID) ||
        catalog[0];

      const rawList = [
        ...(Array.isArray(target?.endpointCandidates)
          ? target.endpointCandidates
          : [target?.id || DEFAULT_MODEL_FALLBACK_ID]),
        'gemini-3.8-flash',
        'gemini-2.5-flash'
      ];
      return Array.from(new Set(rawList.filter(Boolean)));
    }

    async waitForSlot(timeoutMs = 15000) {
      const start = Date.now();
      while (this.activeConcurrency >= this.maxConcurrency) {
        if (Date.now() - start > timeoutMs) {
          throw new Error(
            'Hàng đợi gọi AI đang bận, vui lòng đợi tác vụ trước hoàn tất.'
          );
        }
        await this.sleepMs(160);
      }
      this.activeConcurrency += 1;
    }

    releaseSlot() {
      this.activeConcurrency = Math.max(0, this.activeConcurrency - 1);
    }

    async executeSingleEndpointCall({
      endpointModel,
      apiKey,
      payload,
      externalSignal = null,
      timeoutMs = 115000
    }) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        endpointModel
      )}:generateContent?key=${encodeURIComponent(apiKey)}`;

      const ctrl = new AbortController();
      this.inFlightAbortControllers.add(ctrl);

      const onExternalAbort = () => ctrl.abort(externalSignal?.reason);
      if (externalSignal) {
        if (externalSignal.aborted) {
          this.inFlightAbortControllers.delete(ctrl);
          throw new Error('Đã hủy theo yêu cầu của tác giả.');
        }
        externalSignal.addEventListener('abort', onExternalAbort, { once: true });
      }

      const timer = setTimeout(() => {
        ctrl.abort(new Error('REQUEST_TIMEOUT_EXCEEDED'));
      }, timeoutMs);

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: ctrl.signal
        });

        const rawText = await response.text();
        let parsedJson = null;
        try {
          parsedJson = rawText ? JSON.parse(rawText) : null;
        } catch (_) {}

        if (!response.ok) {
          const errDetail =
            parsedJson?.error?.message || rawText || `HTTP ${response.status}`;
          const err = new Error(errDetail);
          err.httpStatus = response.status;
          err.rawDetail = errDetail;
          throw err;
        }

        const unpacked = this.adapter.extractTextFromGeminiResponse(parsedJson);
        if (!unpacked.ok) {
          const err = new Error(unpacked.reason || 'Lỗi đọc đầu ra Gemini.');
          err.httpStatus = 422;
          throw err;
        }

        return unpacked;
      } finally {
        clearTimeout(timer);
        this.inFlightAbortControllers.delete(ctrl);
        if (externalSignal) {
          externalSignal.removeEventListener('abort', onExternalAbort);
        }
      }
    }

    async runWithFallback({
      prompt,
      systemInstruction = '',
      modelId = DEFAULT_MODEL_FALLBACK_ID,
      temperature = 0.78,
      maxOutputTokens = 8192,
      stopSignal = null
    }) {
      const candidateKeys = this.vaultMgr.getCandidateKeysForRequest();
      if (candidateKeys.length === 0) {
        throw new Error(
          'Chưa cấu hình Gemini API Key. Hãy mở Tab 6 -> "Cấu hình Gemini API Key" để nhập khóa (AIza...).'
        );
      }

      const endpoints = this.getModelEndpointChain(modelId);
      const payload = this.adapter.buildGenerateContentPayload({
        prompt,
        systemInstruction,
        temperature,
        maxOutputTokens
      });

      const overallStart = Date.now();
      let lastError = null;

      await this.waitForSlot();
      try {
        for (let keyIdx = 0; keyIdx < candidateKeys.length; keyIdx += 1) {
          const keyObj = candidateKeys[keyIdx];

          for (let epIdx = 0; epIdx < endpoints.length; epIdx += 1) {
            const ep = endpoints[epIdx];
            if (stopSignal && stopSignal.aborted) {
              throw new Error('Đã hủy tác vụ AI theo yêu cầu.');
            }

            // Tham vấn mod02 rateLimiter nếu có
            if (NS.rateLimiter && typeof NS.rateLimiter.waitBeforeCall === 'function') {
              try {
                await NS.rateLimiter.waitBeforeCall(ep);
              } catch (_) {}
            }

            const attemptStart = Date.now();
            try {
              const res = await this.executeSingleEndpointCall({
                endpointModel: ep,
                apiKey: keyObj.key,
                payload,
                externalSignal: stopSignal
              });

              const durationMs = Date.now() - attemptStart;
              const outWords = getUtils().countVietnameseWords(res.text);

              if (NS.modelHealth && typeof NS.modelHealth.recordSuccess === 'function') {
                NS.modelHealth.recordSuccess(ep, durationMs);
              }
              if (NS.modelAnalytics && typeof NS.modelAnalytics.recordSuccess === 'function') {
                NS.modelAnalytics.recordSuccess(ep, durationMs, outWords);
              }

              this.ledger.recordCall({
                requestedModel: modelId,
                usedEndpoint: ep,
                keyLabel: keyObj.label,
                status: 'SUCCESS',
                httpStatus: 200,
                durationMs,
                promptChars: String(prompt || '').length,
                outputWords: outWords
              });

              return {
                text: res.text,
                modelId,
                usedEndpoint: ep,
                fromFallback: ep !== endpoints[0] || keyIdx > 0,
                keyLabel: keyObj.label,
                durationMs: Date.now() - overallStart,
                finishReason: res.finishReason,
                usageMetadata: res.usageMetadata
              };
            } catch (err) {
              lastError = err;
              const status = Number(err?.httpStatus || 0);
              const durationMs = Date.now() - attemptStart;

              if (NS.modelHealth && typeof NS.modelHealth.recordFailure === 'function') {
                NS.modelHealth.recordFailure(ep, status || 500, err.message);
              }

              this.ledger.recordCall({
                requestedModel: modelId,
                usedEndpoint: ep,
                keyLabel: keyObj.label,
                status: 'FAILED',
                httpStatus: status,
                durationMs,
                promptChars: String(prompt || '').length,
                outputWords: 0,
                errorMessage: err.message
              });

              if (
                String(err?.message || '').includes('hủy') ||
                String(err?.message || '').includes('USER_CANCELLED')
              ) {
                throw err;
              }

              // Nếu key sai hoàn toàn (400/401/403), chuyển sang key dự phòng kế tiếp ngay
              if (status === 400 || status === 401 || status === 403) {
                break;
              }

              // Nếu 429 quá tải, nghỉ jitter ngắn rồi thử endpoint kế tiếp
              if (status === 429 || status === 503) {
                this.vaultMgr.markKeyRateLimited(keyObj.key, 65000);
                const jitter = 450 + Math.floor(Math.random() * 650);
                await this.sleepMs(jitter);
              }
            }
          }
        }
      } finally {
        this.releaseSlot();
      }

      const statusCode = Number(lastError?.httpStatus || 0);
      const friendlyMsg = this.ledger.translateHttpErrorToHumanVietnamese(
        statusCode,
        lastError?.rawDetail || lastError?.message || ''
      );
      const wrapped = new Error(friendlyMsg);
      wrapped.originalError = lastError;
      wrapped.httpStatus = statusCode;
      throw wrapped;
    }
  }

  // ==========================================================================
  // LỚP 5: BỘ ĐỒNG BỘ 3 DROPDOWN MÔ HÌNH & CẢNH BÁO FLASH-LITE THỜI GIAN THỰC
  // ==========================================================================
  class UnifiedModelSelectorSyncAndGuard {
    constructor(router) {
      this.router = router;
      this.selectorIds = Object.freeze([
        'select-gemini-model',
        'confirm-modal-model-select',
        'mode5-model-selector'
      ]);
    }

    getCatalog() {
      if (Array.isArray(NS.models) && NS.models.length > 0) {
        return NS.models;
      }
      return SAFE_INLINE_MODELS_CATALOG;
    }

    isFlashLiteModel(modelId) {
      const id = String(modelId || '').toLowerCase();
      if (id.includes('flash-lite') || id.includes('lite')) return true;
      const entry = this.getModelEntry(modelId);
      return Boolean(
        entry &&
          (entry.isLite ||
            String(entry.tier || '').toUpperCase() === 'LIGHT' ||
            String(entry.label || '').toLowerCase().includes('flash-lite'))
      );
    }

    getModelEntry(modelId) {
      const catalog = this.getCatalog();
      return (
        catalog.find((m) => m.id === modelId) ||
        catalog.find((m) => m.id === DEFAULT_MODEL_FALLBACK_ID) ||
        catalog[0]
      );
    }

    formatDropdownOptionLabel(model) {
      const baseLabel = model.label || model.name || model.id;
      const isLite = this.isFlashLiteModel(model.id);
      if (isLite) {
        return `⚠️ ${baseLabel} [Flash-Lite · Chỉ hợp nháp nhanh]`;
      }
      if (
        model.id === DEFAULT_MODEL_FALLBACK_ID ||
        String(model.tier || '').toUpperCase() === 'BALANCED'
      ) {
        return `⭐ ${baseLabel}`;
      }
      return `💎 ${baseLabel}`;
    }

    populateAllDropdowns(selectedId) {
      const catalog = this.getCatalog();
      const validId =
        catalog.find((m) => m.id === selectedId)?.id || DEFAULT_MODEL_FALLBACK_ID;

      for (const domId of this.selectorIds) {
        const selectEl = document.getElementById(domId);
        if (!selectEl) continue;

        const prevSelected = selectEl.value;
        selectEl.innerHTML = catalog
          .map((m) => {
            const label = getUtils().escapeHtml(this.formatDropdownOptionLabel(m));
            const val = getUtils().escapeHtml(m.id);
            return `<option value="${val}">${label}</option>`;
          })
          .join('');

        const finalVal =
          catalog.some((m) => m.id === validId)
            ? validId
            : catalog.some((m) => m.id === prevSelected)
              ? prevSelected
              : catalog[0].id;
        selectEl.value = finalVal;
      }

      this.updateLiteWarningBanner(validId);
      return validId;
    }

    updateLiteWarningBanner(modelId) {
      const banner = document.getElementById('confirm-model-lite-warning');
      if (!banner) return false;
      const isLite = this.isFlashLiteModel(modelId);
      if (isLite) {
        banner.classList.remove('hidden');
        banner.setAttribute('data-lite-warning-active', 'true');
      } else {
        banner.classList.add('hidden');
        banner.setAttribute('data-lite-warning-active', 'false');
      }
      return isLite;
    }

    syncSelectionValueAcrossDOM(modelId) {
      for (const domId of this.selectorIds) {
        const el = document.getElementById(domId);
        if (el && el.value !== modelId) {
          const hasOption = Array.from(el.options || []).some(
            (opt) => opt.value === modelId
          );
          if (hasOption) el.value = modelId;
        }
      }
      this.updateLiteWarningBanner(modelId);
    }
  }

  // ==========================================================================
  // LỚP 6: MỞ RỘNG GIAO DIỆN KÉT SẮT API KEY (KEY DỰ PHÒNG & NHẬT KÝ GỌI API)
  // ==========================================================================
  class ApiKeyVaultModalEnhancer {
    constructor(router) {
      this.router = router;
      this.mounted = false;
    }

    ensureVaultExtrasMounted() {
      const modal = document.getElementById('modal-api-key-vault');
      const statusEl = document.getElementById('apikey-verify-status');
      if (!modal || !statusEl || !statusEl.parentElement) return false;

      if (document.getElementById('apikey-vault-extras-panel')) {
        this.mounted = true;
        this.refreshExtrasPanel();
        return true;
      }

      const panel = document.createElement('div');
      panel.id = 'apikey-vault-extras-panel';
      panel.className =
        'pt-3 border-t border-zinc-800 space-y-3 text-[11px]';
      panel.innerHTML = [
        '<div id="apikey-telemetry-summary-box" class="p-2.5 rounded-xl bg-zinc-950/90 border border-zinc-800 text-zinc-300 flex flex-wrap items-center justify-between gap-2"></div>',
        '<div class="space-y-1.5">',
        '  <div class="flex items-center justify-between">',
        '    <span class="font-bold text-amber-300 uppercase text-[10px]">🔄 Kho Key Dự Phòng Tự Xoay Vòng Khi Hết Quota (Tùy chọn)</span>',
        '    <span id="apikey-backup-count-badge" class="font-monoCode text-[10px] text-zinc-400">0 key dự phòng</span>',
        '  </div>',
        '  <div class="flex gap-1.5">',
        '    <input id="input-backup-gemini-key" type="password" placeholder="Dán thêm AIzaSy... dự phòng (nếu có nhiều key)" class="flex-1 px-2.5 py-1.5 rounded-lg border border-zinc-700 bg-zinc-950 font-monoCode text-[11px]" />',
        '    <button type="button" id="btn-add-backup-gemini-key" class="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold shrink-0">+ Thêm Key</button>',
        '  </div>',
        '  <div id="apikey-backup-list-container" class="max-h-28 overflow-y-auto space-y-1"></div>',
        '</div>'
      ].join('\n');

      statusEl.parentElement.appendChild(panel);
      this.bindExtrasEvents();
      this.refreshExtrasPanel();
      this.mounted = true;
      return true;
    }

    refreshExtrasPanel() {
      const telemetryBox = document.getElementById('apikey-telemetry-summary-box');
      const countBadge = document.getElementById('apikey-backup-count-badge');
      const listBox = document.getElementById('apikey-backup-list-container');
      const esc = getUtils().escapeHtml;

      if (telemetryBox) {
        const stats = this.router.ledger.getSummaryStats();
        const primaryMasked = this.router.vaultMgr.maskKeyForDisplay(
          this.router.getApiKey()
        );
        telemetryBox.innerHTML = [
          `<span>Key chính: <strong class="font-monoCode text-emerald-300">${esc(primaryMasked)}</strong></span>`,
          `<span>Đã gọi: <strong>${stats.successCalls}/${stats.totalCalls}</strong> thành công · TB <strong>${stats.avgLatencyMs}ms</strong></span>`
        ].join('');
      }

      const backups = this.router.vaultMgr.backupKeys;
      if (countBadge) {
        countBadge.textContent = `${backups.length} key dự phòng`;
      }

      if (listBox) {
        if (backups.length === 0) {
          listBox.innerHTML =
            '<div class="text-[10px] text-zinc-500 italic">Chưa thêm key dự phòng. Khi gặp lỗi 429 hết quota, hệ thống sẽ tự xoay sang các key ở đây.</div>';
        } else {
          listBox.innerHTML = backups
            .map(
              (bk) =>
                `<div class="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-2">` +
                `  <div class="truncate"><span class="font-bold text-amber-200">${esc(bk.label)}</span> · <span class="font-monoCode text-zinc-400">${esc(this.router.vaultMgr.maskKeyForDisplay(bk.key))}</span></div>` +
                `  <button type="button" data-remove-backup-key="${esc(bk.id)}" class="px-2 py-0.5 rounded bg-zinc-800 hover:bg-rose-600 text-zinc-200 font-bold text-[10px]">Xóa</button>` +
                `</div>`
            )
            .join('');
        }
      }
    }

    bindExtrasEvents() {
      const bindOnce =
        typeof NS.bindOnce === 'function'
          ? NS.bindOnce.bind(NS)
          : (el, ev, fn) => {
              const t = typeof el === 'string' ? document.getElementById(el) : el;
              if (t) t.addEventListener(ev, fn);
            };

      bindOnce(
        'btn-add-backup-gemini-key',
        'click',
        () => {
          const inp = document.getElementById('input-backup-gemini-key');
          if (!inp) return;
          const res = this.router.vaultMgr.addBackupKey(inp.value);
          if (!res.ok) {
            getUtils().showToast(`⚠️ ${res.error}`, 'warn');
            return;
          }
          inp.value = '';
          this.refreshExtrasPanel();
          getUtils().showToast('✅ Đã lưu thêm Gemini API Key dự phòng!', 'success');
        },
        'mod15_add_backup_key'
      );

      bindOnce(
        'apikey-backup-list-container',
        'click',
        (ev) => {
          const btn = ev.target.closest('[data-remove-backup-key]');
          if (!btn) return;
          const id = btn.getAttribute('data-remove-backup-key');
          if (this.router.vaultMgr.removeBackupKey(id)) {
            this.refreshExtrasPanel();
            getUtils().showToast('🗑️ Đã gỡ key dự phòng khỏi két sắt.', 'info', 2000);
          }
        },
        'mod15_remove_backup_key'
      );
    }
  }

  // ==========================================================================
  // LỚP 7: BỘ KIỂM TRA DANH SÁCH MÔ HÌNH LIVE TỪ API KEY & DỰ TOÁN TOKEN
  // ==========================================================================
  class GeminiLiveModelsInspectorAndProbe {
    constructor(vaultMgr, ledger) {
      this.vaultMgr = vaultMgr;
      this.ledger = ledger;
      this.lastLiveModels = [];
    }

    async probeKeyAndFetchLiveModels(candidateKey = '') {
      const apiKey = this.vaultMgr.sanitizeKeyString(
        candidateKey || this.vaultMgr.primaryKey
      );
      if (!apiKey) {
        return {
          ok: false,
          httpStatus: 0,
          message: 'Bạn chưa nhập Gemini API Key để kiểm tra.'
        };
      }

      const formatCheck = this.vaultMgr.isPlausibleGeminiKeyFormat(apiKey);
      if (!formatCheck.valid) {
        return {
          ok: false,
          httpStatus: 0,
          message: formatCheck.reason
        };
      }

      const url = `https://generativelanguage.googleapis.com/v1beta/models?pageSize=20&key=${encodeURIComponent(
        apiKey
      )}`;

      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 16000);
      const started = Date.now();

      try {
        const res = await fetch(url, { method: 'GET', signal: ctrl.signal });
        const rawText = await res.text();
        let data = null;
        try {
          data = rawText ? JSON.parse(rawText) : null;
        } catch (_) {}

        if (!res.ok) {
          const rawErr = data?.error?.message || rawText || `HTTP ${res.status}`;
          return {
            ok: false,
            httpStatus: res.status,
            latencyMs: Date.now() - started,
            message: this.ledger.translateHttpErrorToHumanVietnamese(
              res.status,
              rawErr
            )
          };
        }

        const modelsArr = Array.isArray(data?.models) ? data.models : [];
        this.lastLiveModels = modelsArr
          .map((m) => String(m.name || '').replace(/^models\//, ''))
          .filter((id) => id.includes('gemini'));

        return {
          ok: true,
          httpStatus: 200,
          latencyMs: Date.now() - started,
          availableCount: this.lastLiveModels.length,
          sampleModels: this.lastLiveModels.slice(0, 6),
          warningNote: formatCheck.warning || '',
          message: `Kết nối Gemini API thành công (${Date.now() - started}ms) — Key của bạn đang mở khóa ${this.lastLiveModels.length} điểm truy cập Gemini.`
        };
      } catch (err) {
        return {
          ok: false,
          httpStatus: 0,
          latencyMs: Date.now() - started,
          message:
            err?.name === 'AbortError'
              ? 'Hết thời gian chờ kết nối (16 giây). Hãy kiểm tra lại kết nối Internet.'
              : this.ledger.translateHttpErrorToHumanVietnamese(
                  0,
                  err?.message || 'Lỗi mạng'
                )
        };
      } finally {
        clearTimeout(timer);
      }
    }

    estimatePayloadBudgetBeforeSend(promptText, systemInstruction = '', modelId = '') {
      const charTotal =
        String(promptText || '').length + String(systemInstruction || '').length;
      const approxTokens = Math.ceil(charTotal / 3.4);
      const isHeavy = approxTokens > 36000;
      return {
        totalChars: charTotal,
        approxInputTokens: approxTokens,
        isHeavy,
        advice: isHeavy
          ? 'Gói ngữ cảnh khá dài (>36k token). Khuyến nghị dùng Gemini 3.8 Flash / 3.1 Pro / Argon để đọc trọn vẹn không rớt chi tiết.'
          : `Dung lượng gói Prompt ~${approxTokens.toLocaleString('vi-VN')} token — tối ưu mượt cho ${modelId || 'Gemini Flash'}.`
      };
    }
  }

  // ==========================================================================
  // LỚP 8: ĐỘNG CƠ ĐỊNH TUYẾN GEMINI TRUNG TÂM (`NoirStudio.geminiRouter`)
  // ==========================================================================
  class ApiKeyVaultAndGeminiRouterEngine {
    constructor() {
      this.vaultMgr = new ApiKeyVaultAndRotationManager();
      this.ledger = new ApiExecutionLedgerAndDiagnostics();
      this.scheduler = new ZeroCongestionRequestScheduler(
        this.vaultMgr,
        this.ledger
      );
      this.modelSync = new UnifiedModelSelectorSyncAndGuard(this);
      this.vaultEnhancer = new ApiKeyVaultModalEnhancer(this);
      this.liveProbe = new GeminiLiveModelsInspectorAndProbe(
        this.vaultMgr,
        this.ledger
      );
      this._selectedModelId = this.loadSelectedModelIdFromStorage();
      this.hasInitialized = false;
    }

    get selectedModelId() {
      return this._selectedModelId;
    }

    set selectedModelId(val) {
      this.setSelectedModel(val);
    }

    init() {
      this._selectedModelId = this.loadSelectedModelIdFromStorage();
      this.populateAllModelDropdowns();
      this.hydrateApiKeyInputFromVault();
      this.bindDOM();
      this.hasInitialized = true;
      return this;
    }

    loadSelectedModelIdFromStorage() {
      const storageKey =
        getStorageKeys().SELECTED_MODEL || 'noir_selected_gemini_model';
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored && this.getModelEntry(stored)) {
          return stored;
        }
      } catch (_) {}
      if (
        NS.modelAdvisor &&
        typeof NS.modelAdvisor.getDefaultRecommendedModel === 'function'
      ) {
        const rec = NS.modelAdvisor.getDefaultRecommendedModel();
        if (rec && rec.id) return rec.id;
      }
      return DEFAULT_MODEL_FALLBACK_ID;
    }

    getSelectedModelId() {
      return this._selectedModelId || DEFAULT_MODEL_FALLBACK_ID;
    }

    setSelectedModel(modelId) {
      const entry = this.getModelEntry(modelId);
      const resolved = entry ? entry.id : DEFAULT_MODEL_FALLBACK_ID;
      this._selectedModelId = resolved;
      const storageKey =
        getStorageKeys().SELECTED_MODEL || 'noir_selected_gemini_model';
      try {
        localStorage.setItem(storageKey, resolved);
      } catch (_) {}

      if (NS.state) {
        NS.state.selectedModelId = resolved;
      }
      this.modelSync.syncSelectionValueAcrossDOM(resolved);

      if (NS.bus && typeof NS.bus.emit === 'function') {
        NS.bus.emit(
          NS.constants?.EVENTS?.MODEL_CHANGED || 'ai:model_changed',
          { modelId: resolved, isLite: this.modelSync.isFlashLiteModel(resolved) }
        );
      }
      return resolved;
    }

    getModelEntry(modelId) {
      return this.modelSync.getModelEntry(modelId);
    }

    isLiteModel(modelId) {
      return this.modelSync.isFlashLiteModel(modelId || this._selectedModelId);
    }

    updateLiteWarningBanner(modelId) {
      return this.modelSync.updateLiteWarningBanner(
        modelId || this._selectedModelId
      );
    }

    populateAllModelDropdowns() {
      return this.modelSync.populateAllDropdowns(this._selectedModelId);
    }

    getApiKey() {
      if (!this.vaultMgr.primaryKey) {
        this.vaultMgr.primaryKey = this.vaultMgr.loadPrimaryKey();
      }
      return this.vaultMgr.primaryKey;
    }

    saveApiKey(rawKey) {
      const ok = this.vaultMgr.savePrimaryKey(rawKey);
      this.hydrateApiKeyInputFromVault();
      if (NS.bus && typeof NS.bus.emit === 'function') {
        NS.bus.emit(
          NS.constants?.EVENTS?.API_KEY_UPDATED || 'ai:api_key_updated',
          { hasKey: Boolean(this.getApiKey()) }
        );
      }
      return ok;
    }

    hydrateApiKeyInputFromVault() {
      const input = document.getElementById('input-gemini-api-key');
      const statusBox = document.getElementById('apikey-verify-status');
      const currentKey = this.getApiKey();
      if (input && currentKey && !input.value.trim()) {
        input.value = currentKey;
      }
      if (statusBox && currentKey && !this.vaultMgr.lastVerifiedAt) {
        statusBox.textContent = `🔒 Đã nạp khóa cục bộ (${this.vaultMgr.maskKeyForDisplay(
          currentKey
        )}). Bấm "Lưu & Kiểm Tra Kết Nối" để kiểm tra trực tuyến.`;
      }
    }

    openApiKeyVaultModal() {
      const modal = document.getElementById('modal-api-key-vault');
      if (!modal) return false;
      this.hydrateApiKeyInputFromVault();
      this.vaultEnhancer.ensureVaultExtrasMounted();
      modal.classList.remove('hidden');
      const input = document.getElementById('input-gemini-api-key');
      if (input) setTimeout(() => input.focus(), 40);
      return true;
    }

    closeApiKeyVaultModal() {
      const modal = document.getElementById('modal-api-key-vault');
      if (modal) modal.classList.add('hidden');
    }

    async verifyApiKeyConnection(explicitKey = null) {
      const input = document.getElementById('input-gemini-api-key');
      const statusBox = document.getElementById('apikey-verify-status');
      const btn = document.getElementById('btn-save-and-verify-apikey');

      const candidate = this.vaultMgr.sanitizeKeyString(
        explicitKey !== null ? explicitKey : input?.value || this.getApiKey()
      );

      this.saveApiKey(candidate);

      if (!candidate) {
        if (statusBox) {
          statusBox.innerHTML =
            '<span class="text-amber-300 font-bold">⚠️ Đã xóa khóa API khỏi bộ nhớ máy. Nhập khóa AIza... mới bất cứ lúc nào.</span>';
        }
        getUtils().showToast('Đã xóa API Key khỏi két sắt cục bộ.', 'info');
        return { ok: false, cleared: true };
      }

      if (btn) {
        btn.disabled = true;
        btn.textContent = '⏳ Đang kiểm tra kết nối...';
      }
      if (statusBox) {
        statusBox.innerHTML =
          '<span class="text-sky-300">⏳ Đang kết nối máy chủ Google Gemini để kiểm tra khóa API của bạn...</span>';
      }

      try {
        const result = await this.liveProbe.probeKeyAndFetchLiveModels(candidate);
        if (result.ok) {
          this.vaultMgr.lastVerifiedAt = Date.now();
          this.vaultMgr.lastVerificationSummary = result;
          const esc = getUtils().escapeHtml;
          if (statusBox) {
            statusBox.innerHTML = [
              `<div class="text-emerald-300 font-bold">✅ ${esc(result.message)}</div>`,
              result.sampleModels?.length
                ? `<div class="text-[10px] text-zinc-400 mt-1">Mẫu endpoint khả dụng: <span class="font-monoCode text-emerald-200">${esc(
                    result.sampleModels.join(', ')
                  )}</span></div>`
                : '',
              result.warningNote
                ? `<div class="text-[10px] text-amber-300 mt-1">⚠️ ${esc(
                    result.warningNote
                  )}</div>`
                : ''
            ].join('');
          }
          getUtils().showToast('✅ Kết nối Gemini API Key thành công!', 'success');
        } else {
          if (statusBox) {
            statusBox.innerHTML = `<span class="text-rose-300 font-bold">❌ ${getUtils().escapeHtml(
              result.message
            )}</span>`;
          }
          getUtils().showToast(`⚠️ ${result.message}`, 'warn');
        }
        this.vaultEnhancer.refreshExtrasPanel();
        return result;
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.textContent = '💾 Lưu & Kiểm Tra Kết Nối';
        }
      }
    }

    async generateTextWithFallback({
      prompt,
      systemInstruction = '',
      modelId = null,
      temperature = 0.78,
      maxOutputTokens = 8192,
      stopSignal = null
    }) {
      const targetModel = modelId || this.getSelectedModelId();
      if (!prompt || String(prompt).trim().length === 0) {
        throw new Error('Nội dung Prompt gửi tới AI đang trống.');
      }

      const budget = this.liveProbe.estimatePayloadBudgetBeforeSend(
        prompt,
        systemInstruction,
        targetModel
      );
      if (NS.logger && typeof NS.logger.info === 'function') {
        NS.logger.info('mod15: dispatch generateTextWithFallback', {
          modelId: targetModel,
          approxTokens: budget.approxInputTokens
        });
      }

      return this.scheduler.runWithFallback({
        prompt,
        systemInstruction,
        modelId: targetModel,
        temperature,
        maxOutputTokens,
        stopSignal
      });
    }

    cancelAllPendingCalls() {
      return this.scheduler.abortAllPendingRequests();
    }

    bindDOM() {
      const bindOnce =
        typeof NS.bindOnce === 'function'
          ? NS.bindOnce.bind(NS)
          : (el, ev, fn) => {
              const t = typeof el === 'string' ? document.getElementById(el) : el;
              if (t) t.addEventListener(ev, fn);
            };

      bindOnce(
        'btn-s6-card-apikey',
        'click',
        () => this.openApiKeyVaultModal(),
        'mod15_open_apikey_modal'
      );

      bindOnce(
        'btn-close-apikey-modal',
        'click',
        () => this.closeApiKeyVaultModal(),
        'mod15_close_apikey_modal'
      );

      bindOnce(
        'btn-toggle-show-apikey',
        'click',
        () => {
          const inp = document.getElementById('input-gemini-api-key');
          if (!inp) return;
          inp.type = inp.type === 'password' ? 'text' : 'password';
        },
        'mod15_toggle_apikey_visibility'
      );

      bindOnce(
        'btn-save-and-verify-apikey',
        'click',
        () => this.verifyApiKeyConnection(),
        'mod15_save_and_verify_apikey'
      );

      for (const selId of this.modelSync.selectorIds) {
        bindOnce(
          selId,
          'change',
          (ev) => {
            const nextModel = ev.target?.value || DEFAULT_MODEL_FALLBACK_ID;
            const resolved = this.setSelectedModel(nextModel);
            const entry = this.getModelEntry(resolved);
            if (selId === 'confirm-modal-model-select') {
              if (this.isLiteModel(resolved)) {
                getUtils().showToast(
                  '💡 Khuyến cáo: Dòng Flash-Lite phù hợp nháp ngắn; viết chương chính thức nên dùng từ Gemini Flash trở lên!',
                  'warn',
                  3800
                );
              } else {
                getUtils().showToast(
                  `🤖 Đã chọn mô hình thực thi: ${entry?.id || resolved}`,
                  'info',
                  2200
                );
              }
            }
          },
          `mod15_sync_${selId}`
        );
      }

      bindOnce(
        'btn-cancel-blocking-loader',
        'click',
        () => {
          const aborted = this.cancelAllPendingCalls();
          getUtils().hideBlockingLoader();
          if (aborted > 0) {
            getUtils().showToast(
              '🛑 Đã hủy kết nối AI đang chờ theo yêu cầu.',
              'warn'
            );
          }
        },
        'mod15_cancel_inflight_loader'
      );
    }

    getHealthReport() {
      return {
        module: 'mod15_api_key_vault_and_zero_congestion_client.js',
        initialized: this.hasInitialized,
        hasPrimaryKey: Boolean(this.getApiKey()),
        backupKeysCount: this.vaultMgr.backupKeys.length,
        selectedModelId: this.getSelectedModelId(),
        isLiteSelected: this.isLiteModel(),
        ledgerSummary: this.ledger.getSummaryStats()
      };
    }
  }

  // ==========================================================================
  // LỚP 9: BỘ ĐỌC LUỒNG SSE STREAMING THEO THỜI GIAN THỰC (:streamGenerateContent)
  // ==========================================================================
  class GeminiSSEStreamDecoderClient {
    constructor(router) {
      this.router = router;
    }

    async streamGenerateText({
      prompt,
      systemInstruction = '',
      modelId = null,
      temperature = 0.78,
      maxOutputTokens = 8192,
      onChunk = null,
      stopSignal = null
    }) {
      const targetModel = modelId || this.router.getSelectedModelId();
      const candidateKeys = this.router.vaultMgr.getCandidateKeysForRequest();
      if (candidateKeys.length === 0) {
        throw new Error(
          'Chưa có Gemini API Key. Hãy mở Tab 6 -> Cấu hình Gemini API Key trước khi chạy.'
        );
      }

      const endpoints = this.router.scheduler.getModelEndpointChain(targetModel);
      const payload = this.router.scheduler.adapter.buildGenerateContentPayload({
        prompt,
        systemInstruction,
        temperature,
        maxOutputTokens
      });

      const activeKey = candidateKeys[0].key;
      const endpoint = endpoints[0] || DEFAULT_MODEL_FALLBACK_ID;
      const streamUrl = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        endpoint
      )}:streamGenerateContent?alt=sse&key=${encodeURIComponent(activeKey)}`;

      const ctrl = new AbortController();
      this.router.scheduler.inFlightAbortControllers.add(ctrl);
      const onExt = () => ctrl.abort(stopSignal?.reason);
      if (stopSignal) {
        if (stopSignal.aborted) throw new Error('Đã hủy theo yêu cầu.');
        stopSignal.addEventListener('abort', onExt, { once: true });
      }

      const started = Date.now();
      let accumulatedText = '';

      try {
        const res = await fetch(streamUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: ctrl.signal
        });

        if (!res.ok || !res.body) {
          // Nếu luồng SSE bị từ chối hoặc trình duyệt hạn chế ReadableStream, rơi về call thường
          return this.router.generateTextWithFallback({
            prompt,
            systemInstruction,
            modelId: targetModel,
            temperature,
            maxOutputTokens,
            stopSignal
          });
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let lineBuffer = '';

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          lineBuffer += decoder.decode(value, { stream: true });

          const lines = lineBuffer.split('\n');
          lineBuffer = lines.pop() || '';

          for (const rawLine of lines) {
            const line = rawLine.trim();
            if (!line.startsWith('data:')) continue;
            const jsonStr = line.slice(5).trim();
            if (!jsonStr || jsonStr === '[DONE]') continue;

            try {
              const evtObj = JSON.parse(jsonStr);
              const parts = evtObj?.candidates?.[0]?.content?.parts || [];
              const chunkText = parts
                .filter((p) => typeof p?.text === 'string')
                .map((p) => p.text)
                .join('');
              if (chunkText) {
                accumulatedText += chunkText;
                if (typeof onChunk === 'function') {
                  onChunk(chunkText, accumulatedText);
                }
              }
            } catch (_) {}
          }
        }

        if (!accumulatedText.trim()) {
          return this.router.generateTextWithFallback({
            prompt,
            systemInstruction,
            modelId: targetModel,
            temperature,
            maxOutputTokens,
            stopSignal
          });
        }

        const durationMs = Date.now() - started;
        const outWords = getUtils().countVietnameseWords(accumulatedText);
        this.router.ledger.recordCall({
          requestedModel: targetModel,
          usedEndpoint: endpoint,
          keyLabel: candidateKeys[0].label,
          status: 'SUCCESS',
          httpStatus: 200,
          durationMs,
          promptChars: String(prompt || '').length,
          outputWords: outWords
        });

        return {
          text: accumulatedText,
          modelId: targetModel,
          usedEndpoint: endpoint,
          fromFallback: false,
          durationMs
        };
      } finally {
        this.router.scheduler.inFlightAbortControllers.delete(ctrl);
        if (stopSignal) {
          stopSignal.removeEventListener('abort', onExt);
        }
      }
    }
  }

  // ==========================================================================
  // LỚP 10: CỐ VẤN QUOTA, TẦN SUẤT GỌI & BẢNG NHẬT KÝ TRỰC QUAN TRONG MODAL KEY
  // ==========================================================================
  class GeminiQuotaCoachAndCallLedgerUI {
    constructor(router) {
      this.router = router;
    }

    evaluateCurrentSessionPace() {
      const ledger = this.router.ledger.entries || [];
      const now = Date.now();
      const oneMinuteAgo = now - 60000;
      const fifteenMinutesAgo = now - 900000;

      const callsLastMin = ledger.filter((e) => e.timestamp >= oneMinuteAgo).length;
      const callsLast15Min = ledger.filter(
        (e) => e.timestamp >= fifteenMinutesAgo
      ).length;
      const rateLimitHits = ledger.filter(
        (e) => e.timestamp >= fifteenMinutesAgo && e.httpStatus === 429
      ).length;

      let statusLabel = 'Rất thông thoáng';
      let advice =
        'Tần suất gọi AI hoàn toàn khỏe mạnh, hầu như không có nguy cơ đụng giới hạn RPM.';

      if (rateLimitHits >= 2) {
        statusLabel = 'Đang căng giới hạn (429)';
        advice =
          'Bạn vừa chạm giới hạn quota miễn phí liên tiếp. Gợi ý: thêm 1 Key dự phòng vào Két sắt hoặc đợi khoảng 45 giây rồi chạy tiếp.';
      } else if (callsLastMin >= 8) {
        statusLabel = 'Nhịp gọi khá cao';
        advice =
          'Bạn đang gọi nhiều lượt trong 1 phút. Hãy gộp các câu lệnh nhỏ thành 1 Prompt Tổng Hợp để tiết kiệm quota tối đa.';
      }

      return {
        callsLastMin,
        callsLast15Min,
        rateLimitHits,
        statusLabel,
        advice
      };
    }

    buildLedgerHtmlTable(limit = 6) {
      const entries = (this.router.ledger.entries || []).slice(0, limit);
      const esc = getUtils().escapeHtml;
      if (entries.length === 0) {
        return '<div class="text-[10px] text-zinc-500 italic">Chưa ghi nhận lượt gọi Gemini API nào trong phiên làm việc này.</div>';
      }

      return [
        '<div class="max-h-36 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950/90 divide-y divide-zinc-800/80">',
        ...entries.map((e) => {
          const timeStr = new Date(e.timestamp).toLocaleTimeString('vi-VN');
          const okBadge =
            e.status === 'SUCCESS'
              ? '<span class="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">OK</span>'
              : `<span class="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">HTTP ${e.httpStatus || 'ERR'}</span>`;
          return [
            '<div class="px-2.5 py-1.5 flex items-center justify-between gap-2 text-[10px]">',
            `  <div class="flex items-center gap-1.5 min-w-0 truncate">${okBadge} <span class="font-monoCode text-zinc-200 truncate">${esc(e.usedEndpoint)}</span></div>`,
            `  <div class="font-monoCode text-zinc-400 shrink-0">${e.durationMs}ms · ${e.outputWords} từ · ${esc(timeStr)}</div>`,
            '</div>'
          ].join('');
        }),
        '</div>'
      ].join('\n');
    }

    mountDiagnosticLedgerWidget() {
      const panel = document.getElementById('apikey-vault-extras-panel');
      if (!panel) return;
      let widget = document.getElementById('apikey-ledger-diagnostic-box');
      if (!widget) {
        widget = document.createElement('div');
        widget.id = 'apikey-ledger-diagnostic-box';
        widget.className = 'pt-2 border-t border-zinc-800 space-y-1.5';
        panel.appendChild(widget);
      }

      const pace = this.evaluateCurrentSessionPace();
      const esc = getUtils().escapeHtml;
      widget.innerHTML = [
        '<div class="flex items-center justify-between">',
        '  <span class="font-bold uppercase text-[10px] text-sky-300">📡 Nhật Ký Kết Nối Gemini Gần Nhất</span>',
        `  <span class="text-[10px] font-semibold text-zinc-400">${esc(pace.statusLabel)} (${pace.callsLast15Min} lượt/15p)</span>`,
        '</div>',
        this.buildLedgerHtmlTable(5),
        `<div class="text-[10px] text-zinc-400">${esc(pace.advice)}</div>`
      ].join('\n');
    }

    async runMultiKeyPingBenchmark() {
      const keys = this.router.vaultMgr.getCandidateKeysForRequest();
      const results = [];
      for (const kObj of keys) {
        const probe = await this.router.liveProbe.probeKeyAndFetchLiveModels(
          kObj.key
        );
        results.push({
          label: kObj.label,
          masked: this.router.vaultMgr.maskKeyForDisplay(kObj.key),
          ok: probe.ok,
          latencyMs: probe.latencyMs || 0,
          message: probe.message
        });
      }
      return results;
    }
  }

  // Nối thêm bảng nhật ký kết nối vào Két sắt API Key mỗi lần mở/refresh
  const origRefreshExtras = ApiKeyVaultModalEnhancer.prototype.refreshExtrasPanel;
  ApiKeyVaultModalEnhancer.prototype.refreshExtrasPanel = function () {
    origRefreshExtras.call(this);
    if (this.router.quotaCoach) {
      this.router.quotaCoach.mountDiagnosticLedgerWidget();
    }
  };

  // ==========================================================================
  // LỚP 11: CỐ VẤN TRÁNH LỌC NHẦM AN TOÀN VĂN HỌC & BẢNG PHÂN CẤP DỰ PHÒNG
  // ==========================================================================
  const LITERARY_SAFETY_REPHRASE_HINTS = Object.freeze([
    {
      pattern: /(tự sát|tự tử|kết liễu đời mình|treo cổ|cắt cổ tay)/gi,
      suggestion: 'rời bỏ cuộc chơi giữa đêm tối / chạm tới bờ vực tuyệt vọng không lối về'
    },
    {
      pattern: /(tra tấn dã man|xẻ thịt|chặt tay chân|máu me be bét)/gi,
      suggestion: 'những vết hằn tàn khốc của cuộc thẩm vấn / mùi tanh kim loại đặc quánh trong căn hầm ẩm'
    },
    {
      pattern: /(cưỡng hiếp|xâm hại tình dục|hiếp dâm)/gi,
      suggestion: 'sự xâm phạm thô bạo / ký ức tổn thương không thể cất thành lời'
    },
    {
      pattern: /(chế tạo bom|thuốc nổ quân dụng|chất độc chết người)/gi,
      suggestion: 'thứ hỗn hợp nguy hiểm được giấu dưới đáy hòm gỗ / cơ chế kích nổ bí mật'
    }
  ]);

  class GeminiSafetyAndEndpointResilienceAdvisor {
    constructor(router) {
      this.router = router;
    }

    scanPromptForSafetyFalsePositiveRisk(promptText) {
      const text = String(promptText || '');
      const matched = [];
      for (const rule of LITERARY_SAFETY_REPHRASE_HINTS) {
        if (rule.pattern.test(text)) {
          rule.pattern.lastIndex = 0;
          const m = text.match(rule.pattern);
          matched.push({
            triggerSample: m ? m[0] : '',
            saferLiteraryAlternative: rule.suggestion
          });
        }
      }
      return {
        hasRisk: matched.length > 0,
        findings: matched,
        recommendation:
          matched.length > 0
            ? 'Trong tiểu thuyết trinh thám/kinh dị, dùng ngôn từ gợi tả gián tiếp giúp văn chương tinh tế hơn và tránh bộ lọc an toàn tự động.'
            : 'Văn bản đầu vào sạch sẽ, an toàn cho mọi cấp mô hình.'
      };
    }

    buildFallbackChainPreviewForModel(modelId) {
      const targetId = modelId || this.router.getSelectedModelId();
      const chain = this.router.scheduler.getModelEndpointChain(targetId);
      const isLite = this.router.isLiteModel(targetId);
      return {
        requestedModelId: targetId,
        isLiteModel: isLite,
        qualityTierNote: isLite
          ? 'Cảnh báo: Đang dùng Flash-Lite (chỉ khuyến nghị để viết nháp nhanh).'
          : 'Đạt chuẩn chất lượng văn học (Flash / Pro / Argon trở lên).',
        fallbackEndpoints: chain,
        formattedSummary: chain
          .map((ep, idx) => (idx === 0 ? `① Chính: ${ep}` : `↳ Dự phòng #${idx}: ${ep}`))
          .join('  →  ')
      };
    }

    formatDiagnosticsReportForUser() {
      const stats = this.router.ledger.getSummaryStats();
      const chainInfo = this.buildFallbackChainPreviewForModel();
      const hasPrimary = Boolean(this.router.getApiKey());
      const backupCount = this.router.vaultMgr.backupKeys.length;
      const lines = [
        '=== BÁO CÁO TRẠNG THÁI ĐỊNH TUYẾN GEMINI API ===',
        `- API Key chính: ${hasPrimary ? this.router.vaultMgr.maskKeyForDisplay(this.router.getApiKey()) : 'Chưa thiết lập'}`,
        `- Số Key dự phòng sẵn sàng: ${backupCount}`,
        `- Mô hình mặc định đang chọn: ${chainInfo.requestedModelId}`,
        `- Khuyến nghị chất lượng: ${chainInfo.qualityTierNote}`,
        `- Chuỗi trượt tự động chống nghẽn: ${chainInfo.formattedSummary}`,
        `- Tổng lượt gọi phiên bản: ${stats.successCalls}/${stats.totalCalls} thành công · Tốc độ TB: ${stats.avgLatencyMs}ms`
      ];
      return lines.join('\n');
    }

    clearHistoryLedger() {
      this.router.ledger.entries = [];
      try {
        localStorage.removeItem(API_CALL_HISTORY_LOG_KEY);
      } catch (_) {}
      if (this.router.vaultEnhancer.mounted) {
        this.router.vaultEnhancer.refreshExtrasPanel();
      }
      return true;
    }
  }

  // ==========================================================================
  // LỚP 12: CẢM BIẾN TRẠNG THÁI MẠNG & GỢI Ý MÔ HÌNH TỐI ƯU THEO CHẾ ĐỘ AI
  // ==========================================================================
  class NetworkReconnectAndModeRecommender {
    constructor(router) {
      this.router = router;
      this.isOnline =
        typeof navigator !== 'undefined' ? navigator.onLine !== false : true;
      this.offlineSince = this.isOnline ? 0 : Date.now();
      this.listenersBound = false;
    }

    attachNetworkListeners() {
      if (this.listenersBound || typeof window === 'undefined') return;
      this.listenersBound = true;

      window.addEventListener('online', () => {
        this.isOnline = true;
        this.offlineSince = 0;
        if (NS.bus && typeof NS.bus.emit === 'function') {
          NS.bus.emit('network:restored', { timestamp: Date.now() });
        }
        getUtils().showToast(
          '🌐 Đã khôi phục kết nối mạng — AI Gemini sẵn sàng chạy lại bình thường!',
          'success',
          2600
        );
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.offlineSince = Date.now();
        if (NS.bus && typeof NS.bus.emit === 'function') {
          NS.bus.emit('network:lost', { timestamp: Date.now() });
        }
        getUtils().showToast(
          '✈️ Đang mất kết nối Internet — Bạn vẫn viết truyện & lưu tự động offline 100% nhé!',
          'warn',
          3200
        );
      });
    }

    recommendBestModelForExecutionMode(modeKey) {
      const mapping = {
        MODE_1_DRAFT: {
          preferredId: 'gemini-3.8-flash',
          alternativeId: 'gemini-4-argon',
          reason:
            'Chế độ viết bản thảo cần cảm xúc tự nhiên, đối thoại sống động và sức bền trên 3.000+ từ — Gemini 3.8 Flash / Argon cho chất lượng rất ổn định.'
        },
        MODE_2_BRAINSTORM: {
          preferredId: 'gemini-3.1-pro-preview',
          alternativeId: 'gemini-3.8-flash',
          reason:
            'Tham mưu cốt truyện và bẻ lái nhiều tầng nên ưu tiên dòng Pro hoặc 3.8 Flash để không bị ý tưởng lối mòn.'
        },
        MODE_3_AUDIT: {
          preferredId: 'gemini-4-carbon',
          alternativeId: 'gemini-3.1-pro-preview',
          reason:
            'Kiểm toán logic đòi hỏi suy luận khắt khe và bắt lỗ hổng dòng thời gian — dòng Carbon hoặc Pro soi cực kỳ kỹ.'
        },
        MODE_4_REVIEW: {
          preferredId: 'gemini-3.8-flash',
          alternativeId: 'gemini-3.1-pro-preview',
          reason:
            'Hội đồng độc giả beta đánh giá đa chiều mượt mà và chi tiết trên Gemini 3.8 Flash trở lên.'
        },
        MODE_5_DIAGRAM: {
          preferredId: 'gemini-3.8-flash',
          alternativeId: 'gemini-4-carbon',
          reason:
            'Vẽ biểu đồ cốt truyện Mode 5 cần xuất chuẩn cấu trúc JSON nodes/edges và phát hiện xung đột giờ giấc.'
        }
      };

      const picked = mapping[modeKey] || mapping.MODE_1_DRAFT;
      const entry =
        this.router.getModelEntry(picked.preferredId) ||
        this.router.getModelEntry(picked.alternativeId);

      return {
        modeKey,
        recommendedModelId: entry ? entry.id : DEFAULT_MODEL_FALLBACK_ID,
        reason: picked.reason
      };
    }

    ensureOnlineOrThrow() {
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        throw new Error(
          'Thiết bị đang ngoại tuyến (Offline). Dữ liệu bản thảo vẫn được tự động lưu an toàn trên máy; hãy bật Wi-Fi/4G khi cần gọi Gemini.'
        );
      }
      return true;
    }
  }

  // ==========================================================================
  // ĐĂNG KÝ SINGLETON LÊN `window.NoirStudio.geminiRouter`
  // ==========================================================================
  const geminiRouterEngine = new ApiKeyVaultAndGeminiRouterEngine();
  geminiRouterEngine.streamClient = new GeminiSSEStreamDecoderClient(
    geminiRouterEngine
  );
  geminiRouterEngine.quotaCoach = new GeminiQuotaCoachAndCallLedgerUI(
    geminiRouterEngine
  );
  geminiRouterEngine.resilienceAdvisor =
    new GeminiSafetyAndEndpointResilienceAdvisor(geminiRouterEngine);
  geminiRouterEngine.networkObserver = new NetworkReconnectAndModeRecommender(
    geminiRouterEngine
  );

  geminiRouterEngine.streamGenerateText = (opts) =>
    geminiRouterEngine.streamClient.streamGenerateText(opts);
  geminiRouterEngine.checkSafetyFalsePositive = (txt) =>
    geminiRouterEngine.resilienceAdvisor.scanPromptForSafetyFalsePositiveRisk(txt);
  geminiRouterEngine.getDiagnosticsText = () =>
    geminiRouterEngine.resilienceAdvisor.formatDiagnosticsReportForUser();
  geminiRouterEngine.recommendModelForMode = (modeKey) =>
    geminiRouterEngine.networkObserver.recommendBestModelForExecutionMode(modeKey);

  const origInitRouter = ApiKeyVaultAndGeminiRouterEngine.prototype.init;
  ApiKeyVaultAndGeminiRouterEngine.prototype.init = function () {
    origInitRouter.call(this);
    if (this.networkObserver) {
      this.networkObserver.attachNetworkListeners();
    }
    return this;
  };

  NS.geminiRouter = geminiRouterEngine;
  NS.ApiKeyVaultAndGeminiRouterEngine = ApiKeyVaultAndGeminiRouterEngine;

  if (typeof NS.registerModule === 'function') {
    NS.registerModule('mod15', geminiRouterEngine);
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        if (!geminiRouterEngine.hasInitialized) geminiRouterEngine.init();
      });
    } else {
      geminiRouterEngine.init();
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);
