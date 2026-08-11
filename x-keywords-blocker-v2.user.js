// ==UserScript==
// @name         X Keywords Blocker V2
// @namespace    https://x.com/
// @author       Stephen-Xu-X
// @version      3.1.6
// @description  A safe, configurable workspace for adding, syncing, browsing, and deleting X muted keywords.
// @match        https://x.com/*
// @run-at       document-idle
// @grant        GM.xmlHttpRequest
// @grant        unsafeWindow
// @connect      raw.githubusercontent.com
// ==/UserScript==

(() => {
  'use strict';

  const CREATE_API = '/i/api/1.1/mutes/keywords/create.json';
  const CREATE_SIGN = '/1.1/mutes/keywords/create.json';
  const DELETE_API = '/i/api/1.1/mutes/keywords/destroy.json';
  const DELETE_SIGN = '/1.1/mutes/keywords/destroy.json';
  const LIST_API = '/i/api/1.1/mutes/keywords/list.json';
  const LIST_SIGN = '/1.1/mutes/keywords/list.json';
  const KEYWORDS_URL = 'https://raw.githubusercontent.com/Stephen-Xu-X/X_keywords_Blocker/main/keywords.md';
  const DELAY = 3000;
  const RETRIES = 2;
  const BEARER = 'AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA';
  const pageWindow = typeof unsafeWindow === 'undefined' ? window : unsafeWindow;

const state = {
    activeView: 'add',
    presetCategories: [],
    presetSource: '远程词库未加载',
    presetSyncedAt: '',
    presetStats: { categories: 0, words: 0, duplicates: 0, invalid: 0, ignored: 0 },
    presetSelected: new Set(),
    collapsedPresetCategories: new Set(),
    keywords: [],
    selectedIds: new Set(),
    listLoaded: false,
    running: false,
    cancelRequested: false,
    task: null,
    retryWords: [],
    retryOptions: null,
    retryDeleteIds: [],
    retryMode: 'add',
    presetSyncing: false,
    runtimeRequire: null,
  };

  const icon = (name, size = 20) => {
    const paths = {
      list: '<path d="M3 6h.01M3 12h.01M3 18h.01M8 6h13M8 12h13M8 18h8"/><path d="m18 17 4 4m0-4-4 4"/>',
      plus: '<path d="M12 5v14M5 12h14"/>',
      library: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/>',
      trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5"/>',
      search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
      refresh: '<path d="M20 6v5h-5M4 18v-5h5"/><path d="M18 9a7 7 0 0 0-12-3L4 8M6 15a7 7 0 0 0 12 3l2-2"/>',
      close: '<path d="m6 6 12 12M18 6 6 18"/>',
      stop: '<rect x="6" y="6" width="12" height="12" rx="1"/>',
      check: '<path d="m5 12 4 4L19 6"/>',
      alert: '<path d="m12 3 9 18H3L12 3Z"/><path d="M12 9v4m0 4h.01"/>',
      retry: '<path d="M20 11a8 8 0 1 0 2 5"/><path d="M20 5v6h-6"/>',
      chevron: '<path d="m9 18 6-6-6-6"/>',
      github: '<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3.3-.4 6.8-1.6 6.8-7A5.4 5.4 0 0 0 19.4 4 5 5 0 0 0 19.3.5S18.2.1 15 1.8a13.4 13.4 0 0 0-7 0C4.8.1 3.7.5 3.7.5A5 5 0 0 0 3.6 4a5.4 5.4 0 0 0-1.4 3.7c0 5.4 3.5 6.5 6.8 7A4.8 4.8 0 0 0 7.5 18v4"/><path d="M7.5 18c-4.5 2-5-2-7-2"/>',
    };
    return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths[name] || ''}</svg>`;
  };

  const launcherIcon = (size = 24) => `<svg viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true"><defs><mask id="xmks-mute-mask"><rect width="100" height="100" fill="white"/><circle cx="72" cy="72" r="21" fill="black"/></mask></defs><rect width="100" height="100" rx="20" fill="#000000"/><path d="M25 25 L45 50 L25 75 H35 L50 56 L65 75 H75 L55 50 L75 25 H65 L50 44 L35 25 Z" fill="#ffffff" mask="url(#xmks-mute-mask)"/><circle cx="72" cy="72" r="18" fill="#f4212e"/><line x1="62" y1="72" x2="82" y2="72" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/></svg>`;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const csrf = () => decodeURIComponent(document.cookie.match(/(?:^|; )ct0=([^;]+)/)?.[1] || '');
  const normalizeKeyword = (value) => String(value || '').trim().toLocaleLowerCase();
  const uniqueWords = (values) => {
    const seen = new Set();
    const result = [];
    for (const value of values.map((item) => String(item).trim()).filter(Boolean)) {
      const key = normalizeKeyword(value);
      if (!seen.has(key)) { seen.add(key); result.push(value); }
    }
    return result;
  };
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[character]);
  const formatTime = (value) => value ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '未同步';

  function parseKeywordMarkdown(markdown) {
    const categories = [];
    const seen = new Set();
    let current = null;
    let duplicates = 0;
    let invalid = 0;
    let ignored = 0;
    for (const rawLine of String(markdown).split(/\r?\n/)) {
      const line = rawLine.trim();
      if (line.startsWith('### ')) {
        const rawName = line.slice(4).trim();
        const name = rawName.replace(/^[A-Z]\s+(?:默认|自选)\s*[·•:：-]\s*/i, '').trim() || rawName;
        current = categories.find((category) => normalizeKeyword(category.name) === normalizeKeyword(name));
        if (!current) {
          current = { name, words: [] };
          categories.push(current);
        }
        continue;
      }
      if (!current) continue;
      if (line.startsWith('#### ')) continue;
      if (!line) continue;
      const match = line.match(/^[-*]\s+`([^`]+)`\s*$/);
      if (!match) {
        if (line.startsWith('-') || line.includes('`')) invalid += 1;
        else ignored += 1;
        continue;
      }
      const word = match[1].trim();
      if (!word) { invalid += 1; continue; }
      if (Array.from(word).length <= 1) { invalid += 1; continue; }
      const key = normalizeKeyword(word);
      if (seen.has(key)) { duplicates += 1; continue; }
      seen.add(key);
      current.words.push(word);
    }
    return {
      categories: categories.filter((category) => category.words.length),
      stats: { categories: categories.filter((category) => category.words.length).length, words: seen.size, duplicates, invalid, ignored },
    };
  }

  function requestRemoteMarkdown() {
    const url = `${KEYWORDS_URL}?t=${Date.now()}`;
    if (typeof GM !== 'undefined' && typeof GM.xmlHttpRequest === 'function') {
      return new Promise((resolve, reject) => GM.xmlHttpRequest({
        method: 'GET', url, timeout: 15000,
        onload: (response) => response.status >= 200 && response.status < 300 ? resolve(response.responseText) : reject(new Error(`HTTP ${response.status}`)),
        onerror: () => reject(new Error('远程词库请求失败')),
        ontimeout: () => reject(new Error('远程词库请求超时')),
      }));
    }
    return fetch(url, { cache: 'no-store' }).then((response) => { if (!response.ok) throw new Error(`HTTP ${response.status}`); return response.text(); });
  }

  async function syncPresetCategories({ manual = false, onState = () => {}, onUpdated = () => {}, onFailed = () => {}, onNotify = () => {} } = {}) {
    if (state.presetSyncing) return;
    state.presetSyncing = true;
    onState(true, '正在同步…');
    try {
      const parsed = parseKeywordMarkdown(await requestRemoteMarkdown());
      if (!parsed.categories.length) throw new Error('远程词库格式无效');
      state.presetCategories = parsed.categories;
      state.presetStats = parsed.stats;
      state.presetSource = 'GitHub 远程词库';
      state.presetSyncedAt = new Date().toISOString();
      const available = new Map(parsed.categories.flatMap((category) => category.words.map((word) => [normalizeKeyword(word), word])));
      const selected = [...state.presetSelected].map((word) => available.get(normalizeKeyword(word))).filter(Boolean);
      state.presetSelected.clear();
      selected.forEach((word) => state.presetSelected.add(word));
      onUpdated(parsed);
      onState(false);
      if (manual) onNotify(`远程词库已更新：${parsed.stats.words} 个关键词`, 'success');
    } catch (error) {
      if (!state.presetSyncedAt) {
        state.presetCategories = [];
        state.presetStats = { categories: 0, words: 0, duplicates: 0, invalid: 0, ignored: 0 };
        state.presetSource = '远程词库不可用';
        onUpdated({ categories: [], stats: state.presetStats });
      } else {
        state.presetSource = 'GitHub 远程词库（保留上次版本）';
      }
      onState(false, state.presetSource);
      if (manual) onFailed(error);
    } finally {
      state.presetSyncing = false;
    }
  }

  function getRequire() {
    if (state.runtimeRequire) return state.runtimeRequire;
    const chunks = pageWindow.webpackChunk_twitter_responsive_web;
    if (!chunks) throw new Error('X 主程序尚未加载，请稍后重试');
    chunks.push([[Math.floor(Math.random() * 1e9)], {}, (value) => { state.runtimeRequire = value; }]);
    if (!state.runtimeRequire) throw new Error('无法访问 X 请求模块');
    return state.runtimeRequire;
  }

  function signer() {
    const require = getRequire();
    const cached = Object.values(require.c || {}).find((module) => typeof module.exports?.kc === 'function' && typeof module.exports?._E === 'function');
    const module = cached?.exports || require(991160);
    if (typeof module?.kc !== 'function') throw new Error('X 已更新请求签名模块');
    return module.kc;
  }

  async function transactionId(path, method) {
    const value = await signer()('https://x.com', path, method);
    try { if (atob(value).startsWith('e:')) throw new Error('X 请求签名生成失败'); } catch (error) { if (error.message === 'X 请求签名生成失败') throw error; }
    return value;
  }

  async function api(path, signPath, method = 'GET', body) {
    const token = csrf();
    if (!token) throw new Error('未检测到 X 登录会话');
    const headers = { accept: '*/*', authorization: `Bearer ${BEARER}`, 'x-csrf-token': token, 'x-twitter-active-user': 'yes', 'x-twitter-auth-type': 'OAuth2Session', 'x-twitter-client-language': document.documentElement.lang || 'en' };
    headers['x-client-transaction-id'] = await transactionId(signPath, method);
    const init = { credentials: 'include', headers, method };
    if (body) { headers['content-type'] = 'application/x-www-form-urlencoded'; init.body = new URLSearchParams(body); }
    const response = await fetch(path, init);
    const text = await response.text();
    let data = {};
    try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
    if (!response.ok) { const error = new Error(data.errors?.[0]?.message || `HTTP ${response.status}`); error.status = response.status; error.code = data.errors?.[0]?.code; error.retryAfter = Number(response.headers.get('retry-after') || 0); throw error; }
    return data;
  }

  const createKeyword = (keyword, options) => api(CREATE_API, CREATE_SIGN, 'POST', { keyword, mute_surfaces: options.surfaces.join(','), mute_options: options.source === 'non_following' ? 'exclude_following_accounts' : '', duration: options.duration });
  const deleteKeyword = (id) => api(DELETE_API, DELETE_SIGN, 'POST', { ids: id });
  const listKeywords = () => api(LIST_API, LIST_SIGN, 'GET');

  function install() {
    if (document.querySelector('#xmks-v2-root')) return;
    const host = document.createElement('div');
    host.id = 'xmks-v2-root';
    const shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        :host{
          --bg:#f8fbff;
          --panel:#ffffff;
          --raised:#edf5ff;
          --line:#b9c8d8;
          --line-strong:#17212b;
          --text:#101820;
          --muted:#5c6b79;
          --blue:#147ce5;
          --blue-soft:#dceeff;
          --red:#d9382d;
          --green:#138a5b;
          --mint:#c9f5df;
          --lavender:#eadcff;
          --sun:#ffe36e;
          --ember:#ff6b3d;
          color:var(--text);
          font:14px/1.45 Inter,"Segoe UI","Microsoft YaHei",sans-serif;
          display:contents;
          letter-spacing:0;
        }
        *,*::before,*::after{box-sizing:border-box;letter-spacing:0}
        button,input,textarea,select{font:inherit}
        button{color:inherit}
        #xmks-launch{position:fixed;display:grid;place-items:center;padding:0;border-radius:50%;cursor:pointer;z-index:2147483600;transition:background .16s,color .16s,transform .16s,box-shadow .16s}
        #xmks-launch[hidden]{display:none}
        #xmks-launch:active{transform:scale(.94)}
        .xmks-overlay{position:fixed;inset:0;z-index:2147483601;display:grid;place-items:center;visibility:hidden;opacity:0;transition:opacity .22s,visibility .22s}
        .xmks-overlay[data-open=true]{visibility:visible;opacity:1}
        .xmks-window{display:grid;overflow:hidden;transform:translateY(8px) scale(.985);transition:transform .22s cubic-bezier(.2,.8,.2,1)}
        .xmks-overlay[data-open=true] .xmks-window{transform:none}
        .xmks-rail{display:flex;flex-direction:column;min-width:0}
        .xmks-brand{display:flex;align-items:center;font-weight:800}
        .xmks-brandmark{display:grid;place-items:center}
        .xmks-tab{display:flex;align-items:center;gap:9px;width:100%;height:42px;background:transparent;text-align:left;cursor:pointer;transition:background .16s,color .16s,border-color .16s,box-shadow .16s}
        .xmks-railnote{font-size:11px;line-height:1.45}
        .xmks-main{display:grid;min-width:0;min-height:0}
        .xmks-head{display:flex;align-items:center;justify-content:space-between}
        .xmks-heading{font-weight:800}
        .xmks-subtitle{margin-top:2px;font-size:12px}
        .xmks-iconbtn{display:grid;place-items:center;width:36px;height:36px;padding:0;background:transparent;cursor:pointer}
        .xmks-view{display:none;min-height:0;overflow:auto;overscroll-behavior:contain;scrollbar-width:thin;scrollbar-color:transparent transparent}
        .xmks-view[data-active=true]{display:block}
        .xmks-view::-webkit-scrollbar,.xmks-log::-webkit-scrollbar{width:6px;height:6px}
        .xmks-view::-webkit-scrollbar-thumb,.xmks-log::-webkit-scrollbar-thumb{border-radius:99px;background:transparent}
        .xmks-label,.xmks-legend{display:block;margin-bottom:8px;font-size:13px}
        .xmks-input-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px}
        .xmks-input-head .xmks-label{margin:0}
        .xmks-clear-input{padding:2px 0;border:0;background:transparent;color:var(--muted);font-size:12px;font-weight:750;cursor:pointer}
        .xmks-clear-input:hover{color:var(--red);text-decoration:underline}
        .xmks-textarea,.xmks-search input,.xmks-token-draft{box-sizing:border-box;width:100%;outline:0}
        .xmks-textarea{resize:none;font:14px/1.6 ui-monospace,"Cascadia Code",monospace}
        .xmks-token-editor{display:flex;align-content:flex-start;align-items:flex-start;flex-wrap:wrap;gap:8px;min-height:116px;max-height:148px;overflow:auto;cursor:text}
        .xmks-token-chip{display:inline-flex;align-items:center;gap:5px;max-width:100%;min-height:30px;padding:3px 6px 3px 10px;border-radius:99px;font-weight:750;overflow-wrap:anywhere}
        .xmks-token-remove{display:grid;place-items:center;width:20px;height:20px;padding:0;border:0;border-radius:50%;background:transparent;color:inherit;cursor:pointer;opacity:0;transition:background .16s,opacity .16s}
        .xmks-token-chip:hover .xmks-token-remove,.xmks-token-remove:focus-visible{opacity:1}
        .xmks-token-draft{flex:1 1 150px;min-width:110px;height:30px;padding:0 4px;border:0;background:transparent;color:inherit}
        .xmks-token-draft::placeholder{color:#718294}
        .xmks-hint,.xmks-preset-tools,.xmks-toolbar,.xmks-category-head,.xmks-foot,.xmks-task-head{display:flex;align-items:center;justify-content:space-between;gap:12px}
        .xmks-hint{margin-top:8px;font-size:12px}
        .xmks-options{display:grid;grid-template-columns:1fr 1fr}
        .xmks-fieldset{min-width:0;margin:0}
        .xmks-option-stack{display:grid;gap:8px}
        .xmks-option,.xmks-radio{position:relative;display:flex;align-items:center;gap:9px;cursor:pointer}
        .xmks-option input,.xmks-radio input,.xmks-segments input{position:absolute;width:1px;height:1px;opacity:0}
        .xmks-switch{position:relative;width:36px;height:20px;margin-left:auto;border-radius:99px;transition:.16s}
        .xmks-switch::after{content:"";position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;background:var(--muted);transition:.16s}
        .xmks-option input:checked+.xmks-switch::after{background:#fff;transform:translateX(16px)}
        .xmks-radio-mark{width:17px;height:17px;border-radius:50%}
        .xmks-radio input:checked+.xmks-radio-mark{border-width:5px;border-style:solid}
        .xmks-segments{display:grid;grid-template-columns:repeat(4,1fr);gap:3px;padding:3px}
        .xmks-segments span{display:grid;place-items:center;min-height:34px;font-size:12px;font-weight:700;cursor:pointer}
        .xmks-chips{display:flex;flex-wrap:wrap}
        .xmks-chip,.xmks-badge{display:inline-flex;align-items:center;gap:5px;border-radius:99px}
        .xmks-chip{padding:5px 11px;cursor:pointer;overflow-wrap:anywhere;transition:background .16s,border-color .16s,color .16s,transform .16s,box-shadow .16s}
        .xmks-sync{display:flex;align-items:center;gap:8px;padding:0 12px}
        .xmks-dot{width:7px;height:7px;flex:0 0 auto;border-radius:50%;background:var(--green);box-shadow:0 0 0 3px rgb(19 138 91/.13)}
        .xmks-sync small{font-size:11px}
        .xmks-search{position:relative;flex:1;min-width:180px}
        .xmks-search svg{position:absolute;left:11px;top:11px;color:var(--muted)}
        .xmks-search input{height:40px;padding:0 12px 0 38px}
        .xmks-list{min-height:0}
        .xmks-manage-tools{position:sticky;z-index:2;top:-22px;margin:-22px -24px 14px;padding:18px 24px 12px;border-bottom:1px solid var(--line);background:rgb(248 251 255/.96);backdrop-filter:blur(10px)}
        .xmks-toolbar{justify-content:flex-start}
        .xmks-filterbar{display:flex;gap:7px;margin-top:10px;overflow-x:auto;scrollbar-width:none}
        .xmks-filterbar::-webkit-scrollbar{display:none}
        .xmks-filter{flex:0 0 auto;min-height:30px;padding:0 11px;border:1px solid var(--line);border-radius:99px;background:#fff;color:var(--muted);font-size:12px;font-weight:750;cursor:pointer}
        .xmks-filter[data-active=true]{border-color:#101820;background:#101820;color:#fff}
        .xmks-row{display:grid;grid-template-columns:30px minmax(0,1fr) 38px;align-items:center;min-height:70px;border-bottom:1px solid var(--line)}
        .xmks-check{width:17px;height:17px}
        .xmks-word{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:750}
        .xmks-wordblock{min-width:0;padding:8px 8px 8px 0}
        .xmks-meta{display:flex;flex-wrap:wrap;gap:5px;margin-top:6px}
        .xmks-badge{min-height:22px;padding:2px 8px;font-size:11px}
        .xmks-empty{display:grid;place-items:center;min-height:240px;text-align:center}
        .xmks-task{display:flex;flex-direction:column;min-width:0;min-height:0}
        .xmks-task-title{font-weight:750}
        .xmks-task-meta{color:var(--muted);font-size:12px}
        .xmks-progress{height:5px;margin:10px 0;border-radius:99px;overflow:hidden}
        .xmks-bar{height:100%;width:0;border-radius:99px;transition:width .2s}
        .xmks-log{min-height:0;overflow:auto;font:12px/1.55 ui-monospace,"Cascadia Code",monospace;white-space:pre-wrap}
        .xmks-foot{min-width:0}
        .xmks-status{min-width:0;overflow:hidden;font-size:12px;text-overflow:ellipsis;white-space:nowrap}
        .xmks-actions{display:flex}
        .xmks-btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;padding:0 15px;border-radius:99px;font-weight:750;cursor:pointer;transition:background .16s,color .16s,box-shadow .16s,transform .16s}
        .xmks-btn:disabled{opacity:.45;cursor:not-allowed}
        .xmks-toast{position:absolute;max-width:380px;padding:12px 14px;opacity:0;transform:translateY(8px);pointer-events:none;transition:opacity .18s,transform .18s}
        .xmks-toast[data-show=true]{opacity:1;transform:none}
        .xmks-toast[data-tone=error]{border-left-color:var(--red)}
        .xmks-toast[data-tone=success]{border-left-color:var(--green)}
        .xmks-dialog-wrap{position:fixed;inset:0;z-index:2147483602;display:grid;place-items:center;padding:18px;visibility:hidden;opacity:0;transition:opacity .18s,visibility .18s}
        .xmks-dialog-wrap[data-show=true]{visibility:visible;opacity:1}
        .xmks-dialog-card{width:min(560px,calc(100vw - 36px));max-height:min(680px,calc(100vh - 36px));overflow:auto;padding:20px}
        .xmks-dialog-card h2{margin:0;font-size:18px}
        .xmks-dialog-card p{margin:6px 0;color:var(--muted);font-size:12px}
        .xmks-confirm-words{display:flex;flex-wrap:wrap;gap:6px;max-height:100px;margin:14px 0;overflow:auto}
        .xmks-confirm-words span{padding:5px 8px;border-radius:99px;font-size:12px}
        .xmks-confirm-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:14px 0}
        .xmks-stat{padding:10px;text-align:center}
        .xmks-stat strong{display:block;font-size:20px}
        .xmks-stat small{color:var(--muted)}
        .xmks-dialog-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:18px}
        .xmks-error-list{max-height:120px;overflow:auto;font-size:12px;white-space:pre-wrap}
        #xmks-launch{
          width:42px;
          height:42px;
          border:1px solid rgb(255 255 255/.18);
          background:#101820;
          color:#fff;
          box-shadow:0 5px 14px rgb(16 24 32/.22);
        }
        #xmks-launch:hover{background:var(--blue);color:#fff;box-shadow:0 7px 18px rgb(20 124 229/.3)}
        .xmks-overlay{padding:24px;background:rgb(16 24 32/.38);backdrop-filter:blur(8px)}
        .xmks-window{
          grid-template-columns:140px minmax(520px,1fr) 300px;
          width:min(1280px,calc(100vw - 48px));
          height:min(720px,calc(100vh - 48px));
          border:1px solid #17212b;
          border-radius:20px;
          background:var(--bg);
          box-shadow:0 24px 64px rgb(25 45 64/.28),0 4px 0 rgb(16 24 32/.08);
        }
        .xmks-rail{
          padding:16px 8px 14px;
          border-right:1px solid #17212b;
          background:#dceeff;
        }
        .xmks-brand{gap:8px;padding:2px 5px 14px;color:#101820;font-size:14px;white-space:nowrap}
        .xmks-brandmark{
          width:28px;
          height:28px;
          border:1px solid #101820;
          border-radius:9px;
          background:var(--sun);
          color:#101820;
          box-shadow:2px 2px 0 #101820;
        }
        .xmks-tab{
          min-height:42px;
          margin:2px 0;
          gap:7px;
          padding:0 7px;
          border:1px solid transparent;
          border-radius:12px;
          color:#425466;
          font-weight:750;
        }
        .xmks-tab:hover{border-color:#7aaee0;background:rgb(255 255 255/.62);color:#101820}
        .xmks-tab[data-active=true]{border-color:#101820;background:#fff;color:#101820;box-shadow:3px 3px 0 #101820}
        .xmks-rail-action{
          display:flex;
          align-items:center;
          gap:7px;
          min-height:36px;
          margin-top:5px;
          padding:0 7px;
          border:1px solid #101820;
          border-radius:999px;
          background:#fff;
          color:#101820;
          font-size:12px;
          font-weight:750;
          text-decoration:none;
          transition:transform .16s,box-shadow .16s,background .16s;
        }
        .xmks-rail-links{display:grid;gap:0;margin-top:auto}
        .xmks-rail-action:hover{background:var(--lavender);box-shadow:3px 3px 0 #101820;transform:translate(-1px,-1px)}
        .xmks-railnote{margin-top:9px;padding:8px 5px 0;color:#52697d}
        .xmks-main{grid-template-rows:70px minmax(0,1fr) minmax(76px,auto);background:var(--bg)}
        .xmks-head{padding:0 24px;border-bottom:1px solid var(--line);background:#fff}
        .xmks-heading{font-size:21px;line-height:1.15}
        .xmks-subtitle{color:var(--muted)}
        .xmks-iconbtn{border:1px solid transparent;color:#344454;transition:background .16s,border-color .16s,transform .16s}
        .xmks-iconbtn:hover{border-color:var(--line);background:var(--raised);transform:translateY(-1px)}
        .xmks-view{padding:22px 24px 28px;scrollbar-color:transparent transparent}
        .xmks-view:hover{scrollbar-color:#8da6bd transparent}
        .xmks-view:hover::-webkit-scrollbar-thumb,.xmks-log:hover::-webkit-scrollbar-thumb{background:#8da6bd}
        .xmks-label,.xmks-legend{color:#17212b;font-weight:800}
        .xmks-textarea,.xmks-search input,.xmks-token-editor{border:1px solid #91a7bb;border-radius:10px;background:#fff;color:#101820;box-shadow:inset 0 1px 0 rgb(16 24 32/.03)}
        .xmks-textarea{height:184px;padding:14px 15px}
        .xmks-token-editor{padding:12px}
        .xmks-token-editor:focus-within,.xmks-textarea:focus,.xmks-search input:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgb(20 124 229/.14)}
        .xmks-token-chip{background:#273746;color:#fff}
        .xmks-token-remove:hover{background:rgb(255 255 255/.18)}
        .xmks-hint,.xmks-preset-tools{color:var(--muted)}
        .xmks-options{grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:16px}
        .xmks-fieldset{padding:14px;border:1px solid var(--line);border-radius:12px;background:#fff}
        .xmks-dialog-card .xmks-fieldset{padding:12px}
        .xmks-option,.xmks-radio{min-height:32px;color:#283747}
        .xmks-switch{border-color:#8ea2b5;background:#dfe8ef}
        .xmks-option input:checked+.xmks-switch{border-color:#101820;background:var(--blue)}
        .xmks-radio-mark{border-color:#7b90a4;background:#fff}
        .xmks-radio input:checked+.xmks-radio-mark{border-color:var(--blue)}
        .xmks-segments{grid-template-columns:repeat(2,1fr);border-color:#91a7bb;border-radius:10px;background:#eaf2f9}
        .xmks-segments span{border-radius:7px;color:#526575}
        .xmks-segments input:checked+span{background:#fff;color:#101820;box-shadow:0 1px 4px rgb(37 61 82/.16)}
        .xmks-preset-tools{align-items:stretch;margin:0 0 18px}
        .xmks-sync{min-height:48px;border-color:#17212b;border-radius:12px;background:var(--mint);color:#132b21;box-shadow:2px 2px 0 #17212b}
        .xmks-sync small{color:#416555}
        .xmks-category{
          margin:0 0 12px;
          padding:0;
          overflow:hidden;
          border:1px solid var(--line);
          border-radius:14px;
          background:#fff;
        }
        .xmks-category-head{
          width:100%;
          min-height:50px;
          padding:0 14px;
          border:0;
          background:#edf5ff;
          color:#101820;
          text-align:left;
          cursor:pointer;
          transition:background .16s;
        }
        .xmks-category:nth-child(3n+2) .xmks-category-head{background:#f1e8ff}
        .xmks-category:nth-child(3n) .xmks-category-head{background:#e0f6eb}
        .xmks-category-head:hover{background:#dceeff}
        .xmks-category-title{font-size:14px;font-weight:850}
        .xmks-category-tail{display:flex;align-items:center;gap:8px}
        .xmks-category-count{color:#526575;font-weight:700}
        .xmks-category-chevron{display:grid;place-items:center;transition:transform .18s}
        .xmks-category-head[aria-expanded=true] .xmks-category-chevron{transform:rotate(90deg)}
        .xmks-chips{gap:8px;margin:0;padding:14px}
        .xmks-category[data-collapsed=true] .xmks-chips{display:none}
        .xmks-chip{min-height:32px;border:0;background:#273746;color:#fff;box-shadow:none}
        .xmks-chip:hover{background:#3b5063;transform:translateY(-1px)}
        .xmks-chip[data-selected=true]{border:0;background:var(--sun);color:#101820;box-shadow:none}
        .xmks-toolbar{margin-bottom:0}
        .xmks-list{overflow:hidden;border:1px solid var(--line);border-radius:12px;background:#fff}
        .xmks-row{padding:0 10px;border-bottom-color:#d8e2eb}
        .xmks-row:last-child{border-bottom:0}
        .xmks-check{accent-color:var(--blue)}
        .xmks-badge{border-color:#a8bac9;background:#edf3f7;color:#425466}
        .xmks-badge-blue{border-color:#79afe0;background:#dceeff;color:#185b98}
        .xmks-badge-time{border-color:#d2b84f;background:#fff4b8;color:#715d08}
        .xmks-empty{color:#5c6b79}
        .xmks-task{height:100%;padding:18px 16px;border-left:1px solid #17212b;background:#eadcff}
        .xmks-task[data-dismissed=true]{display:none}
        .xmks-window:has(.xmks-task[data-dismissed=true]){grid-template-columns:140px minmax(520px,1fr);width:min(932px,calc(100vw - 48px))}
        .xmks-task-close{flex:0 0 auto;width:30px;height:30px}
        .xmks-task-summary{display:flex;align-items:center;justify-content:space-between;gap:8px}
        .xmks-task .xmks-progress{flex:0 0 auto}
        .xmks-task .xmks-log{flex:1;padding-right:5px;scrollbar-color:#8b78a7 transparent}
        .xmks-task .xmks-btn{align-self:flex-start;margin-top:10px}
        .xmks-progress{background:#c8b4e5}
        .xmks-bar{background:var(--blue)}
        .xmks-log{color:#4f4562}
        .xmks-foot{
          align-items:center;
          min-height:76px;
          padding:14px 24px calc(14px + env(safe-area-inset-bottom));
          border-top:1px solid var(--line);
          background:#fff;
        }
        .xmks-status{color:#5c6b79}
        .xmks-actions{flex-wrap:wrap;justify-content:flex-end;gap:9px}
        .xmks-btn{min-height:40px;border-color:#17212b;background:#fff;color:#101820;box-shadow:2px 2px 0 transparent}
        .xmks-btn:hover{background:var(--raised);box-shadow:2px 2px 0 #17212b;transform:translate(-1px,-1px)}
        .xmks-primary{border-color:#101820;background:#101820;color:#fff;box-shadow:2px 2px 0 var(--blue)}
        .xmks-primary:hover{background:var(--blue);color:#fff}
        .xmks-danger{border-color:#c94c44;background:#fff4f2;color:#a51f18}
        .xmks-btn:disabled{box-shadow:none;transform:none}
        .xmks-toast{right:24px;bottom:92px;border-color:#17212b;border-left:5px solid var(--blue);border-radius:10px;background:#fff;box-shadow:5px 5px 0 #17212b}
        .xmks-dialog-wrap{background:rgb(16 24 32/.38);backdrop-filter:blur(7px)}
        .xmks-dialog-card{border-color:#17212b;border-radius:16px;background:#f8fbff;box-shadow:8px 8px 0 rgb(16 24 32/.24)}
        .xmks-confirm-words span{border-color:#8ca0b3;background:#273746;color:#fff}
        .xmks-stat{border-color:#a8bac9;border-radius:10px;background:#fff}
        .xmks-stat:nth-child(1){background:#dceeff}
        .xmks-stat:nth-child(2){background:#f1e8ff}
        .xmks-stat:nth-child(3){background:#e0f6eb}
        .xmks-stat strong{color:#101820}
        .xmks-error-list{color:#a51f18}
        .xmks-focus:focus-visible,.xmks-btn:focus-visible,.xmks-iconbtn:focus-visible,.xmks-chip:focus-visible,.xmks-tab:focus-visible,.xmks-category-head:focus-visible,.xmks-rail-action:focus-visible,.xmks-filter:focus-visible,.xmks-option:has(input:focus-visible),.xmks-radio:has(input:focus-visible),.xmks-segments label:has(input:focus-visible){outline:3px solid rgb(20 124 229/.45);outline-offset:2px}
        @media(min-width:721px) and (min-height:560px){.xmks-view[data-view-panel="add"]{overflow:hidden;padding-top:16px;padding-bottom:16px}}
        .xmks-view,.xmks-log,.xmks-token-editor,.xmks-confirm-words,.xmks-dialog-card{scrollbar-width:thin;scrollbar-color:#8da6bd transparent}
        .xmks-view::-webkit-scrollbar-thumb,.xmks-log::-webkit-scrollbar-thumb,.xmks-token-editor::-webkit-scrollbar-thumb,.xmks-confirm-words::-webkit-scrollbar-thumb,.xmks-dialog-card::-webkit-scrollbar-thumb{background:#8da6bd;border-radius:99px}
        @media(max-width:1060px) and (min-width:721px){.xmks-window{grid-template-columns:140px minmax(430px,1fr) 250px}.xmks-window:has(.xmks-task[data-dismissed=true]){grid-template-columns:140px minmax(430px,1fr)}.xmks-task{padding:16px 13px}.xmks-options{gap:9px}.xmks-fieldset{padding:11px}.xmks-option,.xmks-radio{font-size:12px}}
        @media(max-width:720px){
          .xmks-overlay{place-items:end center;padding:0}
          .xmks-window{position:relative;grid-template-columns:1fr;width:100%;height:min(95dvh,820px);border-right:0;border-bottom:0;border-left:0;border-radius:18px 18px 0 0}
          .xmks-rail{display:flex;flex-direction:row;align-items:center;gap:8px;padding:10px 12px;border-right:0;border-bottom:1px solid #17212b;background:#dceeff}
          .xmks-brand,.xmks-railnote{display:none}
          .xmks-rail nav{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));flex:1;gap:6px;min-width:0}
          .xmks-rail-links{display:none}
          .xmks-tab{justify-content:center;min-height:42px;padding:0 6px;font-size:12px}
          .xmks-main{grid-template-rows:64px minmax(0,1fr) minmax(78px,auto)}
          .xmks-head,.xmks-view{padding-left:16px;padding-right:16px}
          .xmks-options{grid-template-columns:1fr}
          .xmks-segments{grid-template-columns:repeat(2,1fr)}
          .xmks-preset-tools{flex-direction:column}
          .xmks-preset-tools .xmks-actions{justify-content:stretch}
          .xmks-preset-tools .xmks-btn{flex:1}
          .xmks-task{position:absolute;z-index:3;right:0;bottom:0;left:0;height:min(48dvh,390px);padding:16px;border:1px solid #17212b;border-bottom:0;border-radius:18px 18px 0 0;box-shadow:0 -12px 30px rgb(16 24 32/.2);transform:translateY(102%);transition:transform .2s ease}
          .xmks-task[data-show=true]:not([data-dismissed=true]){transform:none}
          .xmks-manage-tools{top:-22px;margin-right:-16px;margin-left:-16px;padding-right:16px;padding-left:16px}
          .xmks-toolbar{flex-wrap:wrap}
          .xmks-foot{padding:12px 16px calc(14px + env(safe-area-inset-bottom))}
          .xmks-status{display:none}
          .xmks-actions{width:100%}
          .xmks-actions .xmks-btn{flex:1;min-width:0}
          .xmks-confirm-stats{grid-template-columns:1fr 1fr}
          .xmks-confirm-stats .xmks-stat:last-child{grid-column:1/-1}
        }
        @media(prefers-reduced-motion:reduce){*,*::before,*::after{transition-duration:.01ms!important;animation-duration:.01ms!important}}
      </style>
      <button id="xmks-launch" hidden title="屏蔽词工作台" aria-label="打开屏蔽词工作台">${launcherIcon(24)}</button>
      <div class="xmks-overlay" id="xmks-overlay" data-open="false"><section class="xmks-window" role="dialog" aria-modal="true" aria-labelledby="xmks-title"><aside class="xmks-rail"><div class="xmks-brand"><span class="xmks-brandmark">M</span><span>Mute Studio</span></div><nav aria-label="工作台页面"><button class="xmks-tab" data-view="add" data-active="true">${icon('plus')}<span>批量添加</span></button><button class="xmks-tab" data-view="manage">${icon('library')}<span>用户词库</span></button><button class="xmks-tab" data-view="presets">${icon('list')}<span>远程词库</span></button></nav><div class="xmks-railnote"><span class="xmks-dot"></span> 请求仅发送至 X<br>不会上传登录凭证</div></aside><div class="xmks-main"><header class="xmks-head"><div><div class="xmks-heading" id="xmks-title">批量添加</div><div class="xmks-subtitle">每条请求间隔 3 秒</div></div><button class="xmks-iconbtn xmks-close" aria-label="关闭">${icon('close')}</button></header><main class="xmks-view" data-view-panel="add" data-active="true"><label class="xmks-label" for="xmks-input">屏蔽词或短语</label><textarea id="xmks-input" class="xmks-textarea" placeholder="广告\n色情\n推广"></textarea><div class="xmks-hint"><span>支持换行、逗号和分号</span><span class="xmks-count">0 个</span></div><div class="xmks-options"><fieldset class="xmks-fieldset"><legend class="xmks-legend">屏蔽位置</legend><div class="xmks-option-stack"><label class="xmks-option"><span>Home timeline</span><input id="xmks-home" type="checkbox" checked><i class="xmks-switch"></i></label><label class="xmks-option"><span>Notifications</span><input id="xmks-notifications" type="checkbox" checked><i class="xmks-switch"></i></label></div></fieldset><fieldset class="xmks-fieldset"><legend class="xmks-legend">通知来源</legend><div class="xmks-option-stack"><label class="xmks-radio"><input type="radio" name="xmks-source" value="anyone"><i class="xmks-radio-mark"></i>From anyone</label><label class="xmks-radio"><input type="radio" name="xmks-source" value="non_following" checked><i class="xmks-radio-mark"></i>From people you don’t follow</label></div></fieldset><fieldset class="xmks-fieldset"><legend class="xmks-legend">屏蔽时长</legend><div class="xmks-segments"><label><input type="radio" name="xmks-duration" value="" checked><span>Forever</span></label><label><input type="radio" name="xmks-duration" value="86400000"><span>24 hours</span></label><label><input type="radio" name="xmks-duration" value="604800000"><span>7 days</span></label><label><input type="radio" name="xmks-duration" value="2592000000"><span>30 days</span></label></div></fieldset></div></main><main class="xmks-view" data-view-panel="presets" data-active="false"><div class="xmks-preset-tools"><div class="xmks-sync"><span class="xmks-dot"></span><strong class="xmks-source">远程词库未加载</strong><small class="xmks-sync-time">未同步 · 0 个</small></div><div class="xmks-actions"><button class="xmks-btn" id="xmks-sync" title="同步远程词库">${icon('refresh',17)}同步远程词库</button><button class="xmks-btn" id="xmks-clear-presets">清除选择</button></div></div><div class="xmks-presets"></div></main><main class="xmks-view" data-view-panel="manage" data-active="false"><div class="xmks-toolbar"><label class="xmks-search">${icon('search',18)}<input id="xmks-search" placeholder="搜索已屏蔽词" aria-label="搜索已屏蔽词"></label><button id="xmks-refresh" class="xmks-iconbtn" title="刷新账户列表" aria-label="刷新账户列表">${icon('refresh')}</button></div><div class="xmks-list"></div></main><section class="xmks-task" id="xmks-task" aria-live="polite"><div class="xmks-task-head"><span class="xmks-task-title">就绪</span><span class="xmks-task-meta"></span></div><div class="xmks-progress"><div class="xmks-bar"></div></div><div class="xmks-log"></div></section><footer class="xmks-foot"><div class="xmks-status">就绪</div><div class="xmks-actions"><button id="xmks-stop" class="xmks-btn xmks-danger" hidden>${icon('stop',17)}停止剩余任务</button><button id="xmks-delete" class="xmks-btn xmks-danger" hidden>${icon('trash',17)}删除所选</button><button id="xmks-run" class="xmks-btn xmks-primary">${icon('plus',17)}检查并添加</button></div></footer><div class="xmks-toast" role="status" aria-live="polite"></div></div></section></div><div class="xmks-dialog-wrap" id="xmks-confirm" data-show="false"><section class="xmks-dialog-card" role="dialog" aria-modal="true" aria-labelledby="xmks-confirm-title"><h2 id="xmks-confirm-title">检查并添加</h2><p>确认后才会发送请求；每条请求间隔 3 秒。</p><div class="xmks-confirm-stats"><div class="xmks-stat"><strong id="xmks-pending">0</strong><small>待处理</small></div><div class="xmks-stat"><strong id="xmks-existing">0</strong><small>已存在</small></div><div class="xmks-stat"><strong id="xmks-new">0</strong><small>将新增</small></div></div><div class="xmks-confirm-words" id="xmks-confirm-words"></div><div class="xmks-options"><fieldset class="xmks-fieldset"><legend class="xmks-legend">屏蔽位置</legend><div class="xmks-option-stack"><label class="xmks-option"><span>Home timeline</span><input id="xmks-c-home" type="checkbox"><i class="xmks-switch"></i></label><label class="xmks-option"><span>Notifications</span><input id="xmks-c-notifications" type="checkbox"><i class="xmks-switch"></i></label></div></fieldset><fieldset class="xmks-fieldset"><legend class="xmks-legend">通知来源</legend><div class="xmks-option-stack"><label class="xmks-radio"><input type="radio" name="xmks-c-source" value="anyone"><i class="xmks-radio-mark"></i>From anyone</label><label class="xmks-radio"><input type="radio" name="xmks-c-source" value="non_following"><i class="xmks-radio-mark"></i>From people you don’t follow</label></div></fieldset><fieldset class="xmks-fieldset"><legend class="xmks-legend">屏蔽时长</legend><div class="xmks-segments"><label><input type="radio" name="xmks-c-duration" value=""><span>Forever</span></label><label><input type="radio" name="xmks-c-duration" value="86400000"><span>24 hours</span></label><label><input type="radio" name="xmks-c-duration" value="604800000"><span>7 days</span></label><label><input type="radio" name="xmks-c-duration" value="2592000000"><span>30 days</span></label></div></fieldset></div><div class="xmks-dialog-actions"><button class="xmks-btn" id="xmks-confirm-cancel">返回</button><button class="xmks-btn xmks-primary" id="xmks-confirm-run">添加</button></div></section></div><div class="xmks-dialog-wrap" id="xmks-delete-modal" data-show="false"><section class="xmks-dialog-card" role="dialog" aria-modal="true" aria-labelledby="xmks-delete-title"><h2 id="xmks-delete-title">删除屏蔽词</h2><p id="xmks-delete-copy">此操作不可撤销。</p><div class="xmks-confirm-words" id="xmks-delete-words"></div><div class="xmks-dialog-actions"><button class="xmks-btn" id="xmks-delete-cancel">取消</button><button class="xmks-btn xmks-danger" id="xmks-delete-confirm">确认删除</button></div></section></div></div>`;
    (document.body || document.documentElement).appendChild(host);

    const $ = (selector) => shadow.querySelector(selector);
    const $$ = (selector) => [...shadow.querySelectorAll(selector)];
    const overlay = $('#xmks-overlay');
    const launcher = $('#xmks-launch');
    const input = $('#xmks-input');
    const search = $('#xmks-search');
    const list = $('.xmks-list');
    const presets = $('.xmks-presets');
    const tokenEditor = document.createElement('div');
    tokenEditor.className = 'xmks-token-editor';
    tokenEditor.setAttribute('role', 'group');
    tokenEditor.setAttribute('aria-labelledby', 'xmks-input-label');
    const tokenList = document.createElement('div');
    tokenList.className = 'xmks-input-chips';
    tokenList.style.display = 'contents';
    const tokenDraft = document.createElement('input');
    tokenDraft.className = 'xmks-token-draft';
    tokenDraft.type = 'text';
    tokenDraft.placeholder = '输入词语或短语，空格、回车、逗号会自动拆分';
    tokenDraft.setAttribute('aria-label', '输入屏蔽词或短语');
    tokenEditor.append(tokenList, tokenDraft);
    input.hidden = true;
    const inputLabel = input.previousElementSibling;
    inputLabel.id = 'xmks-input-label';
    inputLabel.removeAttribute('for');
    const inputHead = document.createElement('div');
    inputHead.className = 'xmks-input-head';
    const clearInputButton = document.createElement('button');
    clearInputButton.className = 'xmks-clear-input';
    clearInputButton.type = 'button';
    clearInputButton.textContent = '清空';
    clearInputButton.title = '清空当前输入';
    clearInputButton.setAttribute('aria-label', '清空当前输入');
    const inputParent = inputLabel.parentNode;
    inputParent.insertBefore(inputHead, inputLabel);
    inputHead.append(inputLabel, clearInputButton);
    input.parentNode.insertBefore(tokenEditor, input);
    $('.xmks-hint span').textContent = '空格、回车、中英文逗号会自动生成词条';
    const railLinks = document.createElement('div');
    railLinks.className = 'xmks-rail-links';
    const developButton = document.createElement('button');
    developButton.className = 'xmks-rail-action';
    developButton.type = 'button';
    developButton.title = '复制继续开发提示词';
    developButton.innerHTML = `${icon('plus', 18)}<span>继续开发</span>`;
    const keywordsLink = document.createElement('a');
    keywordsLink.className = 'xmks-rail-action';
    keywordsLink.href = KEYWORDS_URL.replace('raw.githubusercontent.com', 'github.com').replace('/main/', '/blob/main/');
    keywordsLink.target = '_blank';
    keywordsLink.rel = 'noopener noreferrer';
    keywordsLink.title = '打开当前远程 keywords.md';
    keywordsLink.innerHTML = `${icon('library', 18)}<span>当前词库</span>`;
    const githubLink = document.createElement('a');
    githubLink.className = 'xmks-rail-action';
    githubLink.href = 'https://github.com/Stephen-Xu-X/X_keywords_Blocker';
    githubLink.target = '_blank';
    githubLink.rel = 'noopener noreferrer';
    githubLink.title = '打开 GitHub 仓库';
    githubLink.setAttribute('aria-label', '打开 X Keywords Blocker GitHub 仓库');
    githubLink.innerHTML = `${icon('github', 18)}<span>GitHub 仓库</span>`;
    const officialLink = document.createElement('a');
    officialLink.className = 'xmks-rail-action';
    officialLink.href = 'https://help.x.com/en/using-x/advanced-x-mute-options';
    officialLink.target = '_blank';
    officialLink.rel = 'noopener noreferrer';
    officialLink.title = '查看 X 官方高级屏蔽规则';
    officialLink.innerHTML = `${icon('alert', 18)}<span>官方规则</span>`;
    railLinks.append(developButton, keywordsLink, officialLink, githubLink);
    $('.xmks-rail').insertBefore(railLinks, $('.xmks-railnote'));
    const presetSelectAll = document.createElement('button');
    presetSelectAll.className = 'xmks-btn';
    presetSelectAll.id = 'xmks-select-all-presets';
    presetSelectAll.type = 'button';
    presetSelectAll.innerHTML = `${icon('check', 17)}全选`;
    $('#xmks-clear-presets').before(presetSelectAll);
    const manageToolbar = $('.xmks-toolbar');
    const manageTools = document.createElement('div');
    manageTools.className = 'xmks-manage-tools';
    manageToolbar.parentNode.insertBefore(manageTools, manageToolbar);
    const manageSelectAll = document.createElement('button');
    manageSelectAll.className = 'xmks-btn';
    manageSelectAll.id = 'xmks-select-all-manage';
    manageSelectAll.type = 'button';
    manageSelectAll.innerHTML = `${icon('check', 17)}全选`;
    const refreshButton = $('#xmks-refresh');
    refreshButton.classList.remove('xmks-iconbtn');
    refreshButton.classList.add('xmks-btn');
    refreshButton.innerHTML = `${icon('refresh', 17)}刷新`;
    manageToolbar.prepend(refreshButton, manageSelectAll);
    const filterBar = document.createElement('div');
    filterBar.className = 'xmks-filterbar';
    filterBar.setAttribute('aria-label', '按屏蔽条件筛选');
    filterBar.innerHTML = [
      ['all', '全部'],
      ['home', 'Home timeline'],
      ['notifications', 'Notifications'],
      ['anyone', 'Anyone'],
      ['non_following', 'People you don’t follow'],
      ['forever', 'Forever'],
      ['timed', '限时'],
    ].map(([value, label]) => `<button class="xmks-filter" type="button" data-filter="${value}" data-active="${value === 'all'}">${label}</button>`).join('');
    manageTools.append(manageToolbar, filterBar);
    const run = $('#xmks-run');
    const stop = $('#xmks-stop');
    const remove = $('#xmks-delete');
    const status = $('.xmks-status');
    const taskPanel = $('#xmks-task');
    const taskClose = document.createElement('button');
    taskClose.className = 'xmks-iconbtn xmks-task-close';
    taskClose.type = 'button';
    taskClose.title = '关闭任务结果';
    taskClose.setAttribute('aria-label', '关闭任务结果');
    taskClose.innerHTML = icon('close', 17);
    $('.xmks-task-head').appendChild(taskClose);
    $('.xmks-window').appendChild(taskPanel);
    const toast = $('.xmks-toast');
    $('.xmks-source').textContent = state.presetSource;
    $('#xmks-confirm').inert = true;
    $('#xmks-delete-modal').inert = true;
    let previousHtmlOverflow = '';
    let previousBodyOverflow = '';
    let pageLocked = false;
    let pendingWords = [];
    let pendingExisting = [];
    let deleteIds = [];
    let lastFocus = launcher;
    let manualWords = [];
    let manageFilter = 'all';
    const retryButton = document.createElement('button');
    retryButton.className = 'xmks-btn';
    retryButton.type = 'button';
    retryButton.hidden = true;
    retryButton.innerHTML = `${icon('retry', 16)}重试未完成项`;
    const taskNote = document.createElement('div');
    taskNote.textContent = '当前请求完成后停止；已发送请求不会撤销。';
    taskNote.style.cssText = 'margin-top:6px;color:var(--muted);font-size:12px;';
    taskPanel.appendChild(taskNote);
    retryButton.onclick = async () => {
      if (state.running) return;
      if (state.retryMode === 'delete' && state.retryDeleteIds.length) {
        const ids = [...state.retryDeleteIds];
        state.retryDeleteIds = [];
        await runDelete(ids);
      } else if (state.retryWords.length) {
        const words = [...state.retryWords];
        state.retryWords = [];
        await runAdd(words, state.retryOptions || getPageOptions(), 0);
      }
    };
    taskPanel.appendChild(retryButton);
    $$('.xmks-tab').forEach((tab) => {
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-selected', tab.dataset.view === state.activeView ? 'true' : 'false');
    });
    $('nav[aria-label="工作台页面"]').setAttribute('role', 'tablist');
    $$('.xmks-view').forEach((panel) => {
      panel.setAttribute('role', 'tabpanel');
      panel.id = `xmks-panel-${panel.dataset.viewPanel}`;
      panel.setAttribute('aria-labelledby', `xmks-tab-${panel.dataset.viewPanel}`);
    });
    $$('.xmks-tab').forEach((tab) => { tab.id = `xmks-tab-${tab.dataset.view}`; tab.setAttribute('aria-controls', `xmks-panel-${tab.dataset.view}`); });

    const setStatus = (message) => { status.textContent = message; };
    const notify = (message, tone = 'info') => { toast.textContent = message; toast.dataset.tone = tone; toast.dataset.show = 'true'; clearTimeout(notify.timer); notify.timer = setTimeout(() => { toast.dataset.show = 'false'; }, 3200); };
    const syncManualInput = () => {
      input.value = manualWords.join('\n');
      $('.xmks-count').textContent = `${manualWords.length} 个`;
    };
    const renderManualWords = () => {
      tokenList.innerHTML = manualWords.map((word, index) => `<span class="xmks-token-chip" data-index="${index}" title="双击重新编辑"><span>${escapeHtml(word)}</span><button class="xmks-token-remove" type="button" data-index="${index}" title="删除 ${escapeHtml(word)}" aria-label="删除 ${escapeHtml(word)}">${icon('close', 13)}</button></span>`).join('');
      syncManualInput();
    };
    clearInputButton.onclick = () => {
      manualWords = [];
      tokenDraft.value = '';
      renderManualWords();
      tokenDraft.focus();
    };
    const commitTokenDraft = ({ force = false } = {}) => {
      const value = tokenDraft.value;
      if (!force && !/[ \r\n,，]/u.test(value)) return;
      const pieces = value.split(/[ \r\n,，]+/u);
      const remainder = force || /[ \r\n,，]$/u.test(value) ? '' : pieces.pop() || '';
      manualWords = uniqueWords([...manualWords, ...pieces]);
      tokenDraft.value = remainder;
      renderManualWords();
    };
    const visibleKeywords = () => {
      const query = search.value.trim().toLocaleLowerCase();
      return state.keywords.filter((item) => {
        if (!String(item.keyword).toLocaleLowerCase().includes(query)) return false;
        const surfaces = item.mute_surfaces || [];
        const options = item.mute_options || [];
        if (manageFilter === 'home') return surfaces.includes('home_timeline') || surfaces.includes('tweet_replies');
        if (manageFilter === 'notifications') return surfaces.includes('notifications');
        if (manageFilter === 'anyone') return !options.includes('exclude_following_accounts');
        if (manageFilter === 'non_following') return options.includes('exclude_following_accounts');
        if (manageFilter === 'forever') return !item.valid_until;
        if (manageFilter === 'timed') return Boolean(item.valid_until);
        return true;
      });
    };
    const updateManageSelectAll = (shown = visibleKeywords()) => {
      const allSelected = shown.length > 0 && shown.every((item) => state.selectedIds.has(item.id));
      manageSelectAll.disabled = shown.length === 0 || state.running;
      manageSelectAll.innerHTML = `${icon('check', 17)}${allSelected ? '取消全选' : '全选'}`;
      manageSelectAll.setAttribute('aria-pressed', String(allSelected));
    };
    const updatePresetSelectAll = () => {
      const words = state.presetCategories.flatMap((category) => category.words);
      const allSelected = words.length > 0 && words.every((word) => state.presetSelected.has(word));
      presetSelectAll.disabled = words.length === 0 || state.running;
      presetSelectAll.innerHTML = `${icon('check', 17)}${allSelected ? '取消全选' : '全选'}`;
      presetSelectAll.setAttribute('aria-pressed', String(allSelected));
    };
    const setSyncState = (loading, label) => { const button = $('#xmks-sync'); button.disabled = loading; button.innerHTML = loading ? `${icon('refresh',17)}同步中…` : `${icon('refresh',17)}同步远程词库`; $('.xmks-source').textContent = label || state.presetSource; $('.xmks-sync-time').textContent = `${state.presetSyncedAt ? `最后同步 ${formatTime(state.presetSyncedAt)}` : '未同步'} · ${state.presetStats.words} 个`; };
    const updateHeader = () => { $('.xmks-subtitle').textContent = state.activeView === 'add' ? '检查参数后发送 · 每条请求间隔 3 秒' : state.activeView === 'presets' ? `${state.presetSelected.size} 个已选择 · ${state.presetSource}` : `${state.keywords.length} 个屏蔽词`; setSyncState(false); };
    const refreshPresets = ({ manual = false } = {}) => syncPresetCategories({
      manual,
      onState: setSyncState,
      onUpdated: () => { renderPresets(); updateHeader(); },
      onFailed: (error) => notify(`同步失败，已保留当前词库：${error.message}`, 'error'),
      onNotify: notify,
    });
    developButton.onclick = async () => {
      const prompt = `继续开发 X Keywords Blocker。项目仓库：https://github.com/Stephen-Xu-X/X_keywords_Blocker\n当前脚本：x-keywords-blocker-v2.user.js\n请先读取项目 AGENTS.md，严格保持后端 API、签名、请求映射、3000ms 队列、停止、重试和结果计数语义不变，仅在明确任务范围内修改。`;
      try { await navigator.clipboard.writeText(prompt); notify('继续开发提示词已复制', 'success'); }
      catch { notify('浏览器未允许写入剪贴板', 'error'); }
    };
    taskClose.onclick = () => { taskPanel.dataset.dismissed = 'true'; };

    function positionLauncher() {
      const isVisible = (element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
      };
      const exact = [...document.querySelectorAll('a[href="/home"][aria-label="X"], a[href="/home"][data-testid="AppTabBar_Home_Link"]')].find(isVisible);
      const logo = exact || [...document.querySelectorAll('a[href="/home"], a[data-testid*="Home"]')].find(isVisible);
      if (!logo) {
        launcher.hidden = true;
        launcher.style.left = '';
        launcher.style.right = '';
        launcher.style.top = '';
        return;
      }
      const rect = logo.getBoundingClientRect();
      launcher.hidden = false;
      launcher.style.right = 'auto';
      launcher.style.left = `${Math.round(rect.right + 4)}px`;
      launcher.style.top = `${Math.round(rect.top + (rect.height - 40) / 2)}px`;
    }

    function lockPage(open) {
      if (open) {
        if (pageLocked) return;
        pageLocked = true;
        previousHtmlOverflow = document.documentElement.style.overflow;
        previousBodyOverflow = document.body?.style.overflow || '';
        document.documentElement.style.overflow = 'hidden';
        if (document.body) document.body.style.overflow = 'hidden';
      } else {
        if (!pageLocked) return;
        pageLocked = false;
        document.documentElement.style.overflow = previousHtmlOverflow;
        if (document.body) document.body.style.overflow = previousBodyOverflow;
      }
    }

    function setOverlay(open) {
      overlay.dataset.open = String(open);
      lockPage(open);
      if (open) { lastFocus = shadow.activeElement || launcher; $('.xmks-tab[data-view="add"]').focus(); }
      else { (lastFocus && typeof lastFocus.focus === 'function' ? lastFocus : launcher).focus(); }
    }
    function showModal(selector, open) {
      const modal = $(selector);
      modal.dataset.show = String(open);
      modal.inert = !open;
      if (open) lockPage(true);
      else if (overlay.dataset.open !== 'true') lockPage(false);
    }

    function getPageOptions() {
      const surfaces = [];
      if ($('#xmks-home').checked) surfaces.push('home_timeline', 'tweet_replies');
      if ($('#xmks-notifications').checked) surfaces.push('notifications');
      return { surfaces, source: shadow.querySelector('input[name="xmks-source"]:checked')?.value || 'non_following', duration: shadow.querySelector('input[name="xmks-duration"]:checked')?.value || '' };
    }

    function setConfirmOptions(options) {
      $('#xmks-c-home').checked = options.surfaces.includes('home_timeline');
      $('#xmks-c-notifications').checked = options.surfaces.includes('notifications');
      const source = shadow.querySelector(`input[name="xmks-c-source"][value="${options.source}"]`) || shadow.querySelector('input[name="xmks-c-source"]');
      source.checked = true;
      const duration = shadow.querySelector(`input[name="xmks-c-duration"][value="${options.duration}"]`) || shadow.querySelector('input[name="xmks-c-duration"]');
      duration.checked = true;
    }

    function getConfirmOptions() {
      const surfaces = [];
      if ($('#xmks-c-home').checked) surfaces.push('home_timeline', 'tweet_replies');
      if ($('#xmks-c-notifications').checked) surfaces.push('notifications');
      return { surfaces, source: shadow.querySelector('input[name="xmks-c-source"]:checked')?.value || 'non_following', duration: shadow.querySelector('input[name="xmks-c-duration"]:checked')?.value || '' };
    }

    function keywordBadges(item) {
      const surfaces = item.mute_surfaces || [];
      const options = item.mute_options || [];
      const badges = [];
      if (surfaces.includes('home_timeline') || surfaces.includes('tweet_replies')) badges.push(['Home timeline', 'blue']);
      if (surfaces.includes('notifications')) badges.push(['Notifications', 'blue']);
      badges.push([options.includes('exclude_following_accounts') ? 'People you don’t follow' : 'Anyone', '']);
      let timing = 'Forever';
      if (item.valid_until) {
        const remaining = Math.max(0, Number(item.valid_until) - Date.now());
        const hours = remaining / 3600000;
        const days = remaining / 86400000;
        if (hours < 20) timing = hours >= 1 ? `Ends in ${Math.ceil(hours)}h` : `Ends in ${Math.max(1, Math.ceil(remaining / 60000))}m`;
        else if (days < 2) timing = '24 hours';
        else if (days < 10) timing = '7 days';
        else timing = '30 days';
      }
      badges.push([timing, 'time']);
      return badges.map(([label, tone]) => `<span class="xmks-badge ${tone ? `xmks-badge-${tone}` : ''}">${escapeHtml(label)}</span>`).join('');
    }

    function renderPresets() {
      if (!state.presetCategories.length) {
        presets.innerHTML = '<div class="xmks-empty">远程词库尚未加载<br>请点击“同步远程词库”重试。</div>';
        updatePresetSelectAll();
        updateHeader();
        return;
      }
      presets.innerHTML = state.presetCategories.map((category) => {
        const collapsed = state.collapsedPresetCategories.has(category.name);
        return `<section class="xmks-category" data-collapsed="${collapsed}"><button class="xmks-category-head" type="button" data-category="${escapeHtml(category.name)}" aria-expanded="${!collapsed}"><span class="xmks-category-title">${escapeHtml(category.name)}</span><span class="xmks-category-tail"><span class="xmks-category-count">${category.words.length} 个</span><span class="xmks-category-chevron">${icon('chevron', 17)}</span></span></button><div class="xmks-chips">${category.words.map((word) => `<button class="xmks-chip" type="button" data-word="${escapeHtml(word)}" data-selected="${state.presetSelected.has(word)}" aria-pressed="${state.presetSelected.has(word)}">${escapeHtml(word)}</button>`).join('')}</div></section>`;
      }).join('');
      updatePresetSelectAll();
      updateHeader();
    }

    function renderList() {
      const query = search.value.trim().toLocaleLowerCase();
      const shown = visibleKeywords();
      updateManageSelectAll(shown);
      if (!shown.length) { list.innerHTML = `<div class="xmks-empty">${query || manageFilter !== 'all' ? '没有匹配的屏蔽词' : '词库为空或尚未加载'}<br><button class="xmks-btn" id="xmks-empty-refresh">刷新账户列表</button></div>`; return; }
      list.innerHTML = shown.map((item) => `<div class="xmks-row"><input class="xmks-check" type="checkbox" data-id="${escapeHtml(item.id)}" aria-label="选择 ${escapeHtml(item.keyword)}" ${state.selectedIds.has(item.id) ? 'checked' : ''}><div class="xmks-wordblock"><div class="xmks-word" title="${escapeHtml(item.keyword)}">${escapeHtml(item.keyword)}</div><div class="xmks-meta">${keywordBadges(item)}</div></div><button class="xmks-iconbtn xmks-single-delete" type="button" data-id="${escapeHtml(item.id)}" title="删除 ${escapeHtml(item.keyword)}" aria-label="删除 ${escapeHtml(item.keyword)}">${icon('trash',17)}</button></div>`).join('');
    }

    async function loadList({ silent = false } = {}) {
      if (!silent) setStatus('正在读取 X 屏蔽词…');
      list.innerHTML = '<div class="xmks-empty">正在读取 X 屏蔽词…</div>';
      try { const data = await listKeywords(); state.keywords = data.muted_keywords || []; state.listLoaded = true; state.selectedIds.clear(); renderList(); updateHeader(); setStatus(`已加载 ${state.keywords.length} 个`); }
      catch (error) { list.innerHTML = `<div class="xmks-empty">加载失败<br>${escapeHtml(error.message)}<br><button class="xmks-btn" id="xmks-empty-refresh">重试</button></div>`; setStatus('账户列表加载失败'); }
    }

    function switchView(view) {
      if (state.running && view === 'manage') { notify('任务进行中，可以查看列表，但不能刷新或删除', 'info'); }
      state.activeView = view;
      $$('.xmks-tab').forEach((element) => { const active = element.dataset.view === view; element.dataset.active = String(active); element.setAttribute('aria-selected', String(active)); });
      $$('.xmks-view').forEach((element) => { element.dataset.active = String(element.dataset.viewPanel === view); });
      run.hidden = view === 'manage';
      remove.hidden = view !== 'manage' || state.selectedIds.size === 0;
      run.innerHTML = view === 'presets' ? `${icon('plus',17)}检查并添加` : `${icon('plus',17)}检查并添加`;
      updateHeader();
      if (view === 'presets' && !state.presetSyncedAt) refreshPresets();
      if (view === 'manage' && !state.listLoaded) loadList();
    }

    function setTask(task) {
      state.task = task;
      taskPanel.dataset.dismissed = 'false';
      taskPanel.dataset.show = 'true';
      $('.xmks-task-title').textContent = task.title;
      $('.xmks-task-meta').textContent = `${task.completed}/${task.total} · 成功 ${task.success} · 已存在 ${task.duplicate} · 失败 ${task.failed} · 未执行 ${Math.max(0, task.total - task.completed)}`;
      $('.xmks-bar').style.width = `${task.total ? task.completed / task.total * 100 : 0}%`;
      $('.xmks-log').textContent = task.log.join('\n');
      $('.xmks-log').scrollTop = $('.xmks-log').scrollHeight;
    }

    async function sendWithRetry(word, options) {
      let attempt = 0;
      while (true) {
        try { return await createKeyword(word, options); }
        catch (error) {
          if (state.cancelRequested) {
            const cancelled = new Error('用户停止剩余任务');
            cancelled.cancelled = true;
            throw cancelled;
          }
          if (attempt >= RETRIES || ![0, 408, 429, 500, 502, 503, 504].includes(error.status || 0)) throw error;
          attempt += 1;
          const waitMs = Math.min(30000, Math.max(1000, error.status === 429 && error.retryAfter ? error.retryAfter * 1000 : attempt * 1000));
          for (let left = Math.ceil(waitMs / 1000); left > 0; left -= 1) {
            if (state.cancelRequested) {
              const cancelled = new Error('用户停止剩余任务');
              cancelled.cancelled = true;
              throw cancelled;
            }
            setStatus(error.status === 429 ? `X 限流，${left} 秒后重试：${word}` : `网络重试 ${attempt}/${RETRIES}：${word}`);
            await sleep(1000);
          }
        }
      }
    }

    async function runAdd(words, options, duplicateCount) {
      state.running = true; state.cancelRequested = false; run.disabled = true; stop.hidden = false; remove.disabled = true;
      const task = { title: '正在添加屏蔽词', total: words.length + duplicateCount, completed: duplicateCount, success: 0, duplicate: duplicateCount, failed: 0, log: duplicateCount ? [`跳过已存在 ${duplicateCount} 个`] : [] };
      state.retryWords = [];
      state.retryOptions = options;
      state.retryMode = 'add';
      retryButton.hidden = true;
      setTask(task);
      for (let index = 0; index < words.length; index += 1) {
        const word = words[index];
        if (state.cancelRequested) break;
        setStatus(`正在添加：${word}`);
        try { await sendWithRetry(word, options); task.success += 1; task.completed += 1; task.log.push(`成功  ${word}`); }
        catch (error) {
          if (error.cancelled) { state.cancelRequested = true; break; }
          task.failed += 1; task.completed += 1; state.retryWords.push(word); task.log.push(`失败  ${word} · ${error.message}`);
          if ([401, 403, 404].includes(error.status)) { state.cancelRequested = true; setStatus('鉴权或接口错误，已停止剩余任务'); }
        }
        setTask(task);
        if (!state.cancelRequested && task.completed < task.total) await sleep(DELAY);
      }
      if (state.cancelRequested) state.retryWords.push(...words.slice(task.completed - duplicateCount));
      state.retryWords = [...new Set(state.retryWords)];
      retryButton.hidden = state.retryWords.length === 0;
      state.running = false; run.disabled = false; stop.hidden = true; remove.disabled = false; state.listLoaded = false;
      const remaining = task.total - task.completed;
      task.title = state.cancelRequested ? '已停止剩余任务' : '添加任务完成';
      setTask(task);
      setStatus(state.cancelRequested ? `已停止剩余任务：成功 ${task.success}，未执行 ${remaining}` : `添加完成：新增 ${task.success}，已存在 ${task.duplicate}，失败 ${task.failed}`);
      notify(state.cancelRequested ? `已停止剩余任务，已发送请求不会撤销` : `完成：新增 ${task.success} 个`, state.cancelRequested ? 'info' : 'success');
      if (state.activeView === 'presets') { const retry = new Set(state.retryWords.map(normalizeKeyword)); state.presetSelected = new Set([...state.presetSelected].filter((word) => retry.has(normalizeKeyword(word)))); renderPresets(); }
    }

    async function openConfirm(words) {
      pendingWords = uniqueWords(words);
      if (!pendingWords.length || state.running) return;
      if (!state.listLoaded) {
        await loadList({ silent: true });
        if (!state.listLoaded) {
          notify('无法读取现有屏蔽词，未发送请求', 'error');
          return;
        }
      }
      const existing = new Map(state.keywords.map((item) => [normalizeKeyword(item.keyword), item]));
      pendingExisting = pendingWords.filter((word) => existing.has(normalizeKeyword(word)));
      $('#xmks-pending').textContent = pendingWords.length;
      $('#xmks-existing').textContent = pendingExisting.length;
      $('#xmks-new').textContent = pendingWords.length - pendingExisting.length;
      $('#xmks-confirm-words').innerHTML = pendingWords.map((word) => `<span>${escapeHtml(word)}</span>`).join('');
      setConfirmOptions(getPageOptions());
      $('#xmks-confirm-run').textContent = `添加 ${pendingWords.length - pendingExisting.length} 个`;
      showModal('#xmks-confirm', true);
      $('#xmks-confirm-run').focus();
    }

    async function confirmAdd() {
      const options = getConfirmOptions();
      if (!options.surfaces.length) { notify('至少选择一个屏蔽位置', 'error'); return; }
      const existingSet = new Set(pendingExisting.map(normalizeKeyword));
      const words = pendingWords.filter((word) => !existingSet.has(normalizeKeyword(word)));
      showModal('#xmks-confirm', false);
      if (!words.length) { notify('所选词均已存在，无需发送请求', 'info'); return; }
      await runAdd(words, options, pendingExisting.length);
      if (state.activeView === 'presets') renderPresets();
    }

    async function runDelete(ids) {
      if (!ids.length || state.running) return;
      state.running = true; state.cancelRequested = false; run.disabled = true; stop.hidden = false; remove.disabled = true;
      const task = { title: '正在删除屏蔽词', total: ids.length, completed: 0, success: 0, duplicate: 0, failed: 0, log: [] };
      state.retryDeleteIds = [];
      state.retryMode = 'delete';
      retryButton.hidden = true;
      setTask(task);
      for (let index = 0; index < ids.length; index += 1) {
        const id = ids[index];
        if (state.cancelRequested) break;
        const item = state.keywords.find((entry) => entry.id === id);
        setStatus(`正在删除：${item?.keyword || id}`);
        try { await deleteKeyword(id); task.success += 1; task.completed += 1; task.log.push(`删除成功  ${item?.keyword || id}`); state.keywords = state.keywords.filter((entry) => entry.id !== id); state.selectedIds.delete(id); renderList(); }
        catch (error) { task.failed += 1; task.completed += 1; state.retryDeleteIds.push(id); task.log.push(`删除失败  ${item?.keyword || id} · ${error.message}`); if ([401, 403, 404].includes(error.status)) state.cancelRequested = true; }
        setTask(task);
        if (!state.cancelRequested && task.completed < task.total) await sleep(DELAY);
      }
      if (state.cancelRequested) state.retryDeleteIds.push(...ids.slice(task.completed));
      state.retryDeleteIds = [...new Set(state.retryDeleteIds)];
      retryButton.hidden = state.retryDeleteIds.length === 0;
      state.running = false; run.disabled = false; stop.hidden = true; remove.disabled = false; remove.hidden = state.selectedIds.size === 0;
      task.title = state.cancelRequested ? '已停止删除任务' : '删除任务完成';
      setTask(task);
      setStatus(state.cancelRequested ? `已停止删除：成功 ${task.success}，未执行 ${task.total - task.completed}` : `删除完成：成功 ${task.success}，失败 ${task.failed}`);
      notify(task.failed || state.retryDeleteIds.length ? `删除完成，${state.retryDeleteIds.length} 个可重试` : `已删除 ${task.success} 个`, task.failed ? 'error' : 'success');
    }

    function openDelete(ids) {
      deleteIds = ids;
      const words = ids.map((id) => state.keywords.find((item) => item.id === id)?.keyword || id);
      $('#xmks-delete-copy').textContent = `确定删除 ${ids.length} 个屏蔽词？此操作不可撤销。`;
      $('#xmks-delete-words').innerHTML = words.slice(0, 12).map((word) => `<span>${escapeHtml(word)}</span>`).join('') + (words.length > 12 ? `<span>+${words.length - 12}</span>` : '');
      showModal('#xmks-delete-modal', true);
      $('#xmks-delete-confirm').focus();
    }

    let positionFrame = 0;
    const schedulePosition = () => {
      if (positionFrame) return;
      positionFrame = requestAnimationFrame(() => { positionFrame = 0; positionLauncher(); });
    };
    const positionObserver = new MutationObserver(schedulePosition);
    positionObserver.observe(document.documentElement, { childList: true, subtree: true });
    window.addEventListener('resize', schedulePosition, { passive: true });
    positionLauncher();
    launcher.onclick = () => setOverlay(true);
    $('.xmks-close').onclick = () => { if (!state.running) setOverlay(false); else notify('任务进行中，请先停止剩余任务', 'info'); };
    overlay.onclick = (event) => { if (event.target === overlay && !state.running) setOverlay(false); };
    $$('.xmks-tab').forEach((element) => { element.onclick = () => switchView(element.dataset.view); });
    tokenEditor.onclick = (event) => {
      const removeToken = event.target.closest('.xmks-token-remove');
      if (removeToken) {
        manualWords.splice(Number(removeToken.dataset.index), 1);
        renderManualWords();
        tokenDraft.focus();
        return;
      }
      tokenDraft.focus();
    };
    tokenEditor.ondblclick = (event) => {
      const chip = event.target.closest('.xmks-token-chip');
      if (!chip || event.target.closest('.xmks-token-remove')) return;
      const [word] = manualWords.splice(Number(chip.dataset.index), 1);
      renderManualWords();
      tokenDraft.value = word || '';
      tokenDraft.focus();
      tokenDraft.select();
    };
    tokenDraft.oninput = () => commitTokenDraft();
    tokenDraft.onblur = () => commitTokenDraft({ force: true });
    tokenDraft.onkeydown = (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        commitTokenDraft({ force: true });
      } else if (event.key === 'Backspace' && !tokenDraft.value && manualWords.length) {
        tokenDraft.value = manualWords.pop();
        renderManualWords();
      }
    };
    search.oninput = renderList;
    $('#xmks-sync').onclick = () => refreshPresets({ manual: true });
    $('#xmks-refresh').onclick = () => { if (!state.running) { state.listLoaded = false; loadList(); } };
    manageSelectAll.onclick = () => {
      if (state.running) return;
      const shown = visibleKeywords();
      const allSelected = shown.length > 0 && shown.every((item) => state.selectedIds.has(item.id));
      shown.forEach((item) => allSelected ? state.selectedIds.delete(item.id) : state.selectedIds.add(item.id));
      renderList();
      remove.hidden = state.activeView !== 'manage' || state.selectedIds.size === 0;
    };
    filterBar.onclick = (event) => {
      const filter = event.target.closest('.xmks-filter');
      if (!filter) return;
      manageFilter = filter.dataset.filter;
      filterBar.querySelectorAll('.xmks-filter').forEach((button) => { button.dataset.active = String(button === filter); });
      renderList();
    };
    presetSelectAll.onclick = () => {
      if (state.running) return;
      const words = state.presetCategories.flatMap((category) => category.words);
      const allSelected = words.length > 0 && words.every((word) => state.presetSelected.has(word));
      state.presetSelected.clear();
      if (!allSelected) words.forEach((word) => state.presetSelected.add(word));
      renderPresets();
    };
    $('#xmks-clear-presets').onclick = () => { state.presetSelected.clear(); renderPresets(); };
    presets.onclick = (event) => {
      const categoryToggle = event.target.closest('.xmks-category-head');
      if (categoryToggle) {
        const category = categoryToggle.dataset.category;
        state.collapsedPresetCategories.has(category) ? state.collapsedPresetCategories.delete(category) : state.collapsedPresetCategories.add(category);
        renderPresets();
        return;
      }
      const chip = event.target.closest('.xmks-chip');
      if (!chip || state.running) return;
      const word = chip.dataset.word;
      state.presetSelected.has(word) ? state.presetSelected.delete(word) : state.presetSelected.add(word);
      renderPresets();
    };
    stop.onclick = () => { if (state.running) { state.cancelRequested = true; setStatus('正在停止剩余任务…'); } };
    remove.onclick = () => openDelete([...state.selectedIds]);
    list.onclick = (event) => { if (event.target.closest('#xmks-empty-refresh')) { state.listLoaded = false; loadList(); return; } const checkbox = event.target.closest('.xmks-check'); if (checkbox && !state.running) { checkbox.checked ? state.selectedIds.add(checkbox.dataset.id) : state.selectedIds.delete(checkbox.dataset.id); remove.hidden = state.selectedIds.size === 0; updateManageSelectAll(); } const button = event.target.closest('.xmks-single-delete'); if (button && !state.running) openDelete([button.dataset.id]); };
    run.onclick = async () => { if (state.activeView !== 'presets') commitTokenDraft({ force: true }); const words = state.activeView === 'presets' ? [...state.presetSelected] : [...manualWords]; if (!words.length) { notify('请先输入或选择屏蔽词', 'error'); return; } await openConfirm(words); };
    $('#xmks-confirm-cancel').onclick = () => showModal('#xmks-confirm', false);
    $('#xmks-confirm-run').onclick = confirmAdd;
    $('#xmks-delete-cancel').onclick = () => showModal('#xmks-delete-modal', false);
    $('#xmks-delete-confirm').onclick = async () => { showModal('#xmks-delete-modal', false); await runDelete(deleteIds); };
    shadow.addEventListener('keydown', (event) => {
      const activeModal = $('#xmks-confirm').dataset.show === 'true' ? $('#xmks-confirm') : $('#xmks-delete-modal').dataset.show === 'true' ? $('#xmks-delete-modal') : null;
      if (event.key === 'Escape') {
        if (activeModal) showModal(`#${activeModal.id}`, false);
        else if (!state.running) setOverlay(false);
        return;
      }
      if (event.key !== 'Tab' || !activeModal) return;
      const focusable = [...activeModal.querySelectorAll('button,input,textarea,select,[tabindex]:not([tabindex="-1"])')].filter((element) => !element.disabled);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && shadow.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && shadow.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    renderManualWords();
    renderPresets();
    refreshPresets();
  }

  install();
})();
