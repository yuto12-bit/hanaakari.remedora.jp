/* ============================================================
   彩灯り - 予約フォーム送信スクリプト
   contact.html 専用。main.js・custom-analytics.js の後に読み込む。
   ============================================================ */
(function () {
  'use strict';

  // ──────────────────────────────────────────────────────────
  // GAS WebアプリURL ← GASデプロイ後にここを書き換えてください
  var GAS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbz4h2zosBkwVhPbk2UiHV18YhACX7ZFPAwSs6O6vIxZ1ikpNCYZWIbM8D1_HDVvVZg/exec';
  // ──────────────────────────────────────────────────────────

  var formFacility   = document.getElementById('form-facility');
  var formIndividual = document.getElementById('form-individual');
  var toggleBtns     = document.querySelectorAll('.form-toggle__btn');

  if (!formFacility || !formIndividual) return;

  /* ── GA4 ヘルパー ── */
  function fireGa4(eventName, params) {
    if (typeof gtag === 'function') {
      gtag('event', eventName, Object.assign({ page_path: location.pathname }, params || {}));
    }
  }

  /* ── sessionStorage 下書き保存 ── */
  var DRAFT_KEY = 'hanaakariContactDraftV1';

  function collectFormData(form) {
    var data = {};
    form.querySelectorAll('input, select, textarea').forEach(function (el) {
      if (!el.name || el.name === 'formType') return;
      if (el.type === 'checkbox') {
        if (!Array.isArray(data[el.name])) data[el.name] = [];
        if (el.checked) data[el.name].push(el.value);
      } else {
        data[el.name] = el.value;
      }
    });
    return data;
  }

  function saveDraft() {
    try {
      var activeForm = formFacility.hidden ? 'individual' : 'facility';
      var draft = {
        activeForm: activeForm,
        facility:   collectFormData(formFacility),
        individual: collectFormData(formIndividual)
      };
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch (_) {}
  }

  function restoreFormData(form, data) {
    if (!data) return;
    form.querySelectorAll('input, select, textarea').forEach(function (el) {
      if (!el.name || el.name === 'formType') return;
      var saved = data[el.name];
      if (saved === undefined) return;
      if (el.type === 'checkbox') {
        el.checked = Array.isArray(saved) && saved.indexOf(el.value) !== -1;
      } else {
        el.value = saved;
      }
    });
  }

  function restoreDraft() {
    try {
      var raw = sessionStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      var draft = JSON.parse(raw);

      restoreFormData(formFacility,   draft.facility);
      restoreFormData(formIndividual, draft.individual);

      // タブ・表示状態の復元（GA4イベントは発火しない）
      var target = draft.activeForm || 'facility';
      toggleBtns.forEach(function (b) {
        var isActive = b.dataset.form === target;
        b.classList.toggle('is-active', isActive);
        b.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      });
      formFacility.hidden   = (target !== 'facility');
      formIndividual.hidden = (target !== 'individual');
    } catch (_) {}
  }

  function clearDraft() {
    try { sessionStorage.removeItem(DRAFT_KEY); } catch (_) {}
  }

  /* ── debounce ── */
  function debounce(fn, ms) {
    var t;
    return function () {
      clearTimeout(t);
      t = setTimeout(fn, ms);
    };
  }

  var debouncedSave = debounce(saveDraft, 300);

  function attachDraftListeners(form) {
    form.addEventListener('input',  debouncedSave);
    form.addEventListener('change', debouncedSave);
  }

  /* ── フォーム切替タブ ── */
  toggleBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var target = btn.dataset.form;
      toggleBtns.forEach(function (b) {
        b.classList.toggle('is-active', b === btn);
        b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
      });
      formFacility.hidden   = (target !== 'facility');
      formIndividual.hidden = (target !== 'individual');

      // エラー状態をリセット
      [formFacility, formIndividual].forEach(clearErrors);

      fireGa4(target === 'facility' ? 'facility_form_open' : 'individual_form_open');
      saveDraft();
    });
  });

  /* ── バリデーション ── */
  function clearErrors(form) {
    form.querySelectorAll('.form-field--error').forEach(function (el) {
      el.classList.remove('form-field--error');
    });
    hideStatus(form);
  }

  function validateForm(form) {
    var valid = true;

    // テキスト / email / tel / select / textarea の必須チェック
    form.querySelectorAll('[data-required]').forEach(function (field) {
      var wrap = field.closest('.form-field');
      if (!wrap) return;
      var empty = field.type === 'checkbox' ? !field.checked
                : !field.value.trim();
      if (empty) {
        wrap.classList.add('form-field--error');
        valid = false;
      } else {
        wrap.classList.remove('form-field--error');
      }
    });

    // チェックボックスグループ（メニュー）の必須チェック
    form.querySelectorAll('[data-check-required]').forEach(function (group) {
      var name    = group.dataset.checkRequired;
      var checked = form.querySelectorAll('input[name="' + name + '"]:checked');
      if (checked.length === 0) {
        group.classList.add('form-field--error');
        valid = false;
      } else {
        group.classList.remove('form-field--error');
      }
    });

    return valid;
  }

  /* ── ステータス表示 ── */
  function showStatus(form, type, msg) {
    var el = form.querySelector('.form-status');
    if (!el) return;
    el.className   = 'form-status form-status--' + type;
    el.textContent = msg;
    el.hidden      = false;
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function hideStatus(form) {
    var el = form.querySelector('.form-status');
    if (el) el.hidden = true;
  }

  /* ── 送信ハンドラ ── */
  function attachSubmit(form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      if (!validateForm(form)) {
        var firstErr = form.querySelector('.form-field--error');
        if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
        fireGa4('reservation_form_error', {
          form_type: form.querySelector('[name="formType"]').value
        });
        return;
      }

      var btn = form.querySelector('.form-submit__btn');
      if (btn.disabled) return; // 二重送信防止
      btn.disabled = true;

      showStatus(form, 'sending', '送信中...');

      // フォームデータを URLSearchParams に変換
      var fd   = new FormData(form);
      var body = new URLSearchParams();

      // チェックボックスグループ（menus）は除いて先に追加
      fd.forEach(function (val, key) {
        if (key !== 'menus') body.set(key, val);
      });

      // menus は選択値をまとめて1エントリにする
      var selectedMenus = Array.from(
        form.querySelectorAll('input[name="menus"]:checked')
      ).map(function (cb) { return cb.value; });
      body.set('menus', selectedMenus.join('、') || '―');

      var formType = form.querySelector('[name="formType"]').value;

      fetch(GAS_ENDPOINT, {
        method : 'POST',
        body   : body
        // URLSearchParams を直接渡すことで Content-Type: application/x-www-form-urlencoded が自動設定される
        // GAS 側で e.parameters が正しく取得できる
      })
      .then(function (r) {
        return r.text();
      })
      .then(function (text) {
        try {
          var data = JSON.parse(text);
          if (data.status === 'ok') {
            clearDraft();
            window.location.href = 'thanks.html?type=' + formType;
          } else {
            // GAS 側でエラーが発生した場合（バリデーション失敗等）
            showStatus(form, 'error',
              '送信エラー：' + (data.message || '内容を確認して再度お試しください。')
            );
            btn.disabled = false;
            fireGa4('reservation_form_error', { form_type: formType });
          }
        } catch (_) {
          // JSON パース失敗 → GAS は受け取っているが応答形式が違う場合のみ起こる
          clearDraft();
          window.location.href = 'thanks.html?type=' + formType;
        }
      })
      .catch(function () {
        showStatus(form, 'error',
          '通信エラーが発生しました。\nLINEからご連絡いただくか、しばらく時間をおいて再度お試しください。'
        );
        btn.disabled = false;
        fireGa4('reservation_form_error', { form_type: formType });
      });
    });
  }

  attachSubmit(formFacility);
  attachSubmit(formIndividual);
  attachDraftListeners(formFacility);
  attachDraftListeners(formIndividual);

  // ページ離脱直前に必ず保存（debounce が未発火のまま遷移するケース対策）
  window.addEventListener('beforeunload', saveDraft);

  // 下書き復元（ページ読み込み時）
  restoreDraft();

})();
