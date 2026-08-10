// ==UserScript==
// @name         X Muted Keywords Studio (Debug)
// @namespace    https://x.com/
// @version      0.3.1
// @description  Standalone UI for adding, browsing, and deleting X muted keywords.
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
  const DELAY = 500;
  const BEARER = 'AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA';
  const pageWindow = typeof unsafeWindow === 'undefined' ? window : unsafeWindow;
  let runtimeRequire;
  let running = false;
  let stopped = false;
  let keywords = [];
  const selected = new Set();
  const presetSelected = new Set();
  let listLoaded = false;
  const DEFAULT_CATEGORIES = [
    {
      name: '常见广告 / 加密 / 赚钱类',
      words: ['张雪峰','香港银行卡','deepseek','eSIM','VPN','线下','A股','比特币','夏河','同城','咸鱼','闲鱼','罗永浩','狗','说个暴论','蓝V互粉','蹲个弟弟','涨粉','crypto','giveaway','毫无疑问普通人也可以','这仅仅是开始','每天赚钱','快速获利','暴论','币','春晚','春节'],
    },
    {
      name: '色情 / 骚扰 / “福”系评论区常见',
      words: ['少妇','看片','福利','日本美女','AI裸照','搭子','弟弟','附近','墨迹','勿扰','小狗','小姐','主人','资','万达广场','福','比她好看的没她骚','比她骚的没她好看','比我骚的没我好看','体制内老师','同城上门','玩归玩闹归闹','只入身体','刷了半天的','就她的主页能打','我福不黑不信你看','应该没人比我玩的开了吧','有人想锐评一下我的福','她太涩了','我真顶不住'],
    },
  ];
  let presetCategories = DEFAULT_CATEGORIES;
  let presetSource = '内置词库';

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
    };
    return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths[name]}</svg>`;
  };

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const csrf = () => decodeURIComponent(document.cookie.match(/(?:^|; )ct0=([^;]+)/)?.[1] || '');
  const parseWords = (text) => [...new Set(text.split(/[\n,，;；]+/).map((value) => value.trim()).filter(Boolean))];
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[character]);

  function parseKeywordMarkdown(markdown) {
    const categories = [];
    let current;
    let currentDescription = '';
    for (const rawLine of markdown.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (line.startsWith('### ')) {
        current = { name: line.slice(4).trim(), descriptions: [], words: [] };
        categories.push(current);
        currentDescription = '';
      } else if (current && line.startsWith('#### ')) {
        currentDescription = line.slice(5).trim();
        current.descriptions.push(currentDescription);
      } else if (current && line) {
        for (const match of line.matchAll(/`([^`]+)`/g)) {
          const word = match[1].trim();
          if (word && !current.words.includes(word)) current.words.push(word);
        }
      }
    }
    return categories.filter((category) => category.words.length);
  }

  async function loadPresetCategories() {
    if (!KEYWORDS_URL) return DEFAULT_CATEGORIES;
    try {
      let markdown;
      if (typeof GM !== 'undefined' && typeof GM.xmlHttpRequest === 'function') {
        markdown = await new Promise((resolve, reject) => {
          GM.xmlHttpRequest({
            method: 'GET',
            url: `${KEYWORDS_URL}?t=${Date.now()}`,
            timeout: 15000,
            onload: (response) => response.status >= 200 && response.status < 300
              ? resolve(response.responseText)
              : reject(new Error(`HTTP ${response.status}`)),
            onerror: () => reject(new Error('远程词库请求失败')),
            ontimeout: () => reject(new Error('远程词库请求超时')),
          });
        });
      } else {
        const response = await fetch(KEYWORDS_URL, { cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        markdown = await response.text();
      }
      const categories = parseKeywordMarkdown(markdown);
      if (!categories.length) throw new Error('远程词库格式无效');
      presetSource = 'GitHub 远程词库';
      return categories;
    } catch {
      presetSource = '内置词库（远程加载失败）';
      return DEFAULT_CATEGORIES;
    }
  }

  function getRequire() {
    if (runtimeRequire) return runtimeRequire;
    const chunks = pageWindow.webpackChunk_twitter_responsive_web;
    if (!chunks) throw new Error('X 主程序尚未加载，请稍后重试');
    chunks.push([[Math.floor(Math.random() * 1e9)], {}, (value) => { runtimeRequire = value; }]);
    if (!runtimeRequire) throw new Error('无法访问 X 请求模块');
    return runtimeRequire;
  }

  function signer() {
    const require = getRequire();
    const cached = Object.values(require.c || {}).find((module) =>
      typeof module.exports?.kc === 'function' && typeof module.exports?._E === 'function');
    const module = cached?.exports || require(991160);
    if (typeof module?.kc !== 'function') throw new Error('X 已更新请求签名模块');
    return module.kc;
  }

  async function transactionId(path, method) {
    const value = await signer()('https://x.com', path, method);
    try {
      const decoded = atob(value);
      if (decoded.startsWith('e:')) throw new Error('X 请求签名生成失败');
    } catch (error) {
      if (error.message === 'X 请求签名生成失败') throw error;
    }
    return value;
  }

  async function api(path, signPath, method = 'GET', body) {
    const token = csrf();
    if (!token) throw new Error('未检测到 X 登录会话');
    const headers = {
      accept: '*/*',
      authorization: `Bearer ${BEARER}`,
      'x-csrf-token': token,
      'x-twitter-active-user': 'yes',
      'x-twitter-auth-type': 'OAuth2Session',
      'x-twitter-client-language': document.documentElement.lang || 'en',
    };
    headers['x-client-transaction-id'] = await transactionId(signPath, method);
    const init = { credentials: 'include', headers, method };
    if (body) {
      headers['content-type'] = 'application/x-www-form-urlencoded';
      init.body = new URLSearchParams(body);
    }
    const response = await fetch(path, init);
    const text = await response.text();
    let data = {};
    try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
    if (!response.ok) {
      const error = new Error(data.errors?.[0]?.message || `HTTP ${response.status}`);
      error.status = response.status;
      error.code = data.errors?.[0]?.code;
      throw error;
    }
    return data;
  }

  const createKeyword = (keyword, options) => api(CREATE_API, CREATE_SIGN, 'POST', {
    keyword,
    mute_surfaces: options.surfaces.join(','),
    mute_options: options.source === 'non_following' ? 'exclude_following_accounts' : '',
    duration: options.duration,
  });
  const deleteKeyword = (id) => api(DELETE_API, DELETE_SIGN, 'POST', { ids: id });
  const listKeywords = () => api(LIST_API, LIST_SIGN, 'GET');

  function install() {
    if (document.querySelector('#xmks-root')) return;
    const root = document.createElement('div');
    root.id = 'xmks-root';
    root.innerHTML = `
      <style>
        :root{--xmks-bg:#000;--xmks-panel:#16181c;--xmks-soft:#202327;--xmks-line:#2f3336;--xmks-text:#e7e9ea;--xmks-muted:#8b98a5;--xmks-blue:#1d9bf0;--xmks-red:#f4212e;--xmks-white:#eff3f4}
        #xmks-launch{position:fixed;left:116px;top:8px;z-index:2147483645;display:grid;place-items:center;width:40px;height:40px;border:1px solid transparent;border-radius:50%;background:transparent;color:rgb(15,20,25);cursor:pointer;transition:background .15s,color .15s,transform .15s}#xmks-launch:hover{background:rgb(15 20 25/.1);color:#1d9bf0}#xmks-launch:active{transform:scale(.94)}
        @media(prefers-color-scheme:dark){#xmks-launch{color:#f2f2f2}#xmks-launch:hover{background:rgb(239 243 244/.1)}}
        #xmks-overlay{position:fixed;inset:0;z-index:2147483646;display:none;place-items:center;padding:18px;background:rgb(0 0 0/.58);backdrop-filter:blur(3px)}#xmks-overlay[data-open="true"]{display:grid}
        .xmks-window{display:grid;grid-template-columns:156px minmax(0,1fr);width:min(820px,calc(100vw - 32px));height:min(600px,calc(100vh - 32px));overflow:hidden;border:1px solid var(--xmks-line);border-radius:8px;background:var(--xmks-bg);color:var(--xmks-text);box-shadow:0 24px 80px rgb(0 0 0/.56);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
        .xmks-rail{display:flex;flex-direction:column;padding:16px 10px;border-right:1px solid var(--xmks-line);background:#0b0d0f}.xmks-brand{display:flex;align-items:center;gap:9px;padding:4px 8px 18px;font-size:14px;font-weight:800}.xmks-brandmark{display:grid;place-items:center;width:28px;height:28px;border-radius:6px;background:var(--xmks-white);color:#0f1419}.xmks-tab{display:flex;align-items:center;gap:9px;width:100%;height:42px;margin:2px 0;padding:0 10px;border:0;border-radius:6px;background:transparent;color:var(--xmks-muted);font-size:14px;font-weight:700;cursor:pointer;text-align:left}.xmks-tab:hover{background:var(--xmks-soft);color:var(--xmks-text)}.xmks-tab[data-active="true"]{background:#172b38;color:#8ed0fa}.xmks-railnote{margin-top:auto;padding:10px 9px;color:#687684;font-size:11px;line-height:1.45}
        .xmks-main{display:grid;grid-template-rows:58px minmax(0,1fr) 62px;min-width:0;min-height:0}.xmks-head{display:flex;align-items:center;justify-content:space-between;padding:0 18px;border-bottom:1px solid var(--xmks-line)}.xmks-heading{font-size:18px;font-weight:800}.xmks-subtitle{margin-top:2px;color:var(--xmks-muted);font-size:12px}.xmks-iconbtn{display:grid;place-items:center;width:36px;height:36px;border:0;border-radius:50%;background:transparent;color:var(--xmks-text);cursor:pointer}.xmks-iconbtn:hover{background:var(--xmks-soft)}
        .xmks-view{display:none;box-sizing:border-box;min-height:0;padding:18px;overflow:auto;overscroll-behavior:contain}.xmks-view[data-active="true"]{display:block}.xmks-view[data-view-panel="manage"][data-active="true"]{display:flex;flex-direction:column;overflow:hidden}.xmks-label{display:block;margin-bottom:8px;color:var(--xmks-text);font-size:13px;font-weight:700}.xmks-textarea{box-sizing:border-box;width:100%;height:200px;padding:13px;border:1px solid #536471;border-radius:6px;outline:0;resize:vertical;background:var(--xmks-panel);color:var(--xmks-text);font:14px/1.6 ui-monospace,"Cascadia Code",monospace}.xmks-textarea:focus{border-color:var(--xmks-blue);box-shadow:0 0 0 1px var(--xmks-blue)}.xmks-hint{display:flex;justify-content:space-between;margin-top:8px;color:var(--xmks-muted);font-size:12px}
        .xmks-options{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:16px}.xmks-fieldset{min-width:0;margin:0;padding:0;border:0}.xmks-legend{margin-bottom:8px;color:var(--xmks-muted);font-size:11px;font-weight:800;text-transform:uppercase}.xmks-option-stack{display:flex;flex-direction:column;gap:7px}.xmks-option{display:flex;align-items:center;gap:8px;min-height:30px;color:var(--xmks-text);font-size:13px;cursor:pointer}.xmks-option input{width:16px;height:16px;margin:0;accent-color:var(--xmks-blue)}.xmks-duration-select{box-sizing:border-box;width:100%;height:36px;border:1px solid var(--xmks-line);border-radius:6px;padding:0 10px;background:var(--xmks-panel);color:var(--xmks-text);font-size:13px;outline:0}.xmks-duration-select:focus{border-color:var(--xmks-blue)}
        .xmks-progress{display:none;margin-top:16px}.xmks-progress[data-show="true"]{display:block}.xmks-track{height:4px;overflow:hidden;background:var(--xmks-line)}.xmks-bar{height:100%;width:0;background:var(--xmks-blue);transition:width .2s}.xmks-summary{margin:10px 0 6px;font-size:12px}.xmks-log{max-height:110px;overflow:auto;color:var(--xmks-muted);font:12px/1.55 ui-monospace,"Cascadia Code",monospace;white-space:pre-wrap}
        .xmks-toolbar{display:flex;gap:9px;margin-bottom:12px}.xmks-search{position:relative;flex:1}.xmks-search svg{position:absolute;left:11px;top:10px;color:var(--xmks-muted)}.xmks-search input{box-sizing:border-box;width:100%;height:40px;padding:0 12px 0 38px;border:1px solid var(--xmks-line);border-radius:6px;outline:0;background:var(--xmks-panel);color:var(--xmks-text)}.xmks-search input:focus{border-color:var(--xmks-blue)}
        .xmks-list{flex:1;min-height:0;overflow:auto;overscroll-behavior:contain;border-top:1px solid var(--xmks-line)}.xmks-row{display:grid;grid-template-columns:34px minmax(0,1fr) 40px;align-items:center;min-height:66px;border-bottom:1px solid var(--xmks-line)}.xmks-word{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:14px;font-weight:700}.xmks-wordblock{min-width:0;padding:8px 8px 8px 0}.xmks-meta{display:flex;flex-wrap:wrap;gap:5px;margin-top:6px}.xmks-badge{display:inline-flex;align-items:center;min-height:20px;padding:1px 7px;border:1px solid #3b4248;border-radius:999px;background:#15191d;color:#9aa8b2;font-size:10px;line-height:16px}.xmks-badge-blue{border-color:#164e70;background:#0d2635;color:#83c9f4}.xmks-badge-time{border-color:#4a4230;background:#211d13;color:#d7bd79}.xmks-empty{display:grid;place-items:center;min-height:260px;color:var(--xmks-muted);text-align:center}.xmks-check{width:17px;height:17px;accent-color:var(--xmks-blue)}
        .xmks-presets{display:flex;flex-direction:column;gap:20px}.xmks-category{border-bottom:1px solid var(--xmks-line);padding-bottom:18px}.xmks-category:last-child{border-bottom:0}.xmks-category-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:10px}.xmks-category-title{font-size:14px;font-weight:800}.xmks-category-desc{max-width:540px;margin-top:3px;color:var(--xmks-muted);font-size:11px;line-height:1.45}.xmks-category-count{flex:0 0 auto;color:var(--xmks-muted);font-size:12px}.xmks-chips{display:flex;flex-wrap:wrap;gap:8px}.xmks-chip{max-width:100%;min-height:32px;padding:5px 11px;border:1px solid #3d444b;border-radius:999px;background:#181b1f;color:#cfd9de;font-size:13px;line-height:20px;cursor:pointer;white-space:normal;overflow-wrap:anywhere}.xmks-chip:hover{border-color:#657786;background:#20252a}.xmks-chip[data-selected="true"]{border-color:#1d9bf0;background:#0d2f45;color:#9bd8ff}.xmks-preset-tools{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;color:var(--xmks-muted);font-size:12px}
        .xmks-foot{display:flex;align-items:center;justify-content:space-between;padding:0 18px;border-top:1px solid var(--xmks-line)}.xmks-status{color:var(--xmks-muted);font-size:12px}.xmks-actions{display:flex;gap:8px}.xmks-btn{display:flex;align-items:center;justify-content:center;gap:7px;height:38px;padding:0 16px;border:1px solid #536471;border-radius:999px;background:transparent;color:var(--xmks-text);font-weight:800;cursor:pointer}.xmks-btn:hover{background:var(--xmks-soft)}.xmks-primary{border-color:var(--xmks-white);background:var(--xmks-white);color:#0f1419}.xmks-danger{border-color:#67070f;color:#ff7a83}.xmks-btn:disabled{opacity:.45;cursor:not-allowed}
        .xmks-toast{position:absolute;right:22px;bottom:76px;max-width:340px;padding:11px 14px;border:1px solid var(--xmks-line);border-radius:6px;background:var(--xmks-panel);box-shadow:0 8px 30px rgb(0 0 0/.35);font-size:13px;opacity:0;transform:translateY(8px);pointer-events:none;transition:.18s}.xmks-toast[data-show="true"]{opacity:1;transform:none}
        @media(max-width:680px){.xmks-window{grid-template-columns:58px 1fr}.xmks-brand span,.xmks-tab span,.xmks-railnote{display:none}.xmks-brand,.xmks-tab{justify-content:center;padding:0}.xmks-row{grid-template-columns:32px minmax(0,1fr) 38px}.xmks-duration{display:none}}
        @media(prefers-reduced-motion:reduce){*{transition:none!important}}
      </style>
      <button id="xmks-launch" title="屏蔽词工作台" aria-label="打开屏蔽词工作台">${icon('list',22)}</button>
      <div id="xmks-overlay"><section class="xmks-window" role="dialog" aria-modal="true" aria-label="屏蔽词工作台">
        <aside class="xmks-rail"><div class="xmks-brand"><span class="xmks-brandmark">M</span><span>Mute studio</span></div><button class="xmks-tab" data-view="add" data-active="true">${icon('plus')}<span>批量添加</span></button><button class="xmks-tab" data-view="presets">${icon('list')}<span>默认词库</span></button><button class="xmks-tab" data-view="manage">${icon('library')}<span>管理词库</span></button><div class="xmks-railnote">请求直接发送到 X。<br>不会上传登录凭证。</div></aside>
        <div class="xmks-main"><header class="xmks-head"><div><div class="xmks-heading">批量添加</div><div class="xmks-subtitle">每条请求间隔 0.5 秒</div></div><button class="xmks-iconbtn xmks-close" aria-label="关闭">${icon('close')}</button></header>
        <main class="xmks-view" data-view-panel="add" data-active="true"><label class="xmks-label" for="xmks-input">屏蔽词或短语</label><textarea id="xmks-input" class="xmks-textarea" placeholder="广告\n色情\n推广"></textarea><div class="xmks-hint"><span>支持换行、逗号和分号</span><span class="xmks-count">0 个</span></div>
          <div class="xmks-options"><fieldset class="xmks-fieldset"><legend class="xmks-legend">Mute from</legend><div class="xmks-option-stack"><label class="xmks-option"><input id="xmks-home" type="checkbox" checked>Home timeline</label><label class="xmks-option"><input id="xmks-notifications" type="checkbox" checked>Notifications</label></div></fieldset>
          <fieldset class="xmks-fieldset"><legend class="xmks-legend">Notification source</legend><div class="xmks-option-stack"><label class="xmks-option"><input type="radio" name="xmks-source" value="anyone">From anyone</label><label class="xmks-option"><input type="radio" name="xmks-source" value="non_following" checked>From people you don’t follow</label></div></fieldset>
          <fieldset class="xmks-fieldset"><legend class="xmks-legend">Mute timing</legend><select id="xmks-duration" class="xmks-duration-select"><option value="">Forever</option><option value="86400000">24 hours</option><option value="604800000">7 days</option><option value="2592000000">30 days</option></select></fieldset></div>
          <section class="xmks-progress"><div class="xmks-track"><div class="xmks-bar"></div></div><div class="xmks-summary"></div><div class="xmks-log"></div></section></main>
        <main class="xmks-view" data-view-panel="presets"><div class="xmks-preset-tools"><span>点击词条选择，再批量添加</span><button id="xmks-clear-presets" class="xmks-btn">清除选择</button></div><div class="xmks-presets"></div></main>
        <main class="xmks-view" data-view-panel="manage"><div class="xmks-toolbar"><label class="xmks-search">${icon('search',18)}<input id="xmks-search" placeholder="搜索屏蔽词"></label><button id="xmks-refresh" class="xmks-iconbtn" title="刷新词库">${icon('refresh')}</button></div><div class="xmks-list"></div></main>
        <footer class="xmks-foot"><div class="xmks-status">就绪</div><div class="xmks-actions"><button id="xmks-stop" class="xmks-btn" hidden>${icon('stop',17)}停止</button><button id="xmks-delete" class="xmks-btn xmks-danger" hidden>${icon('trash',17)}删除所选</button><button id="xmks-run" class="xmks-btn xmks-primary">${icon('plus',17)}开始添加</button></div></footer><div class="xmks-toast"></div></div>
      </section></div>`;
    document.documentElement.appendChild(root);

    const positionLauncher = () => {
      const xLogo = [...document.querySelectorAll('a[href="/home"]')].find((element) =>
        element.getAttribute('aria-label') === 'X' || element.querySelector('svg'));
      if (!xLogo) return;
      const rect = xLogo.getBoundingClientRect();
      const launcher = root.querySelector('#xmks-launch');
      launcher.style.left = `${Math.round(rect.right + 4)}px`;
      launcher.style.top = `${Math.round(rect.top + (rect.height - 40) / 2)}px`;
    };
    positionLauncher();
    window.addEventListener('resize', positionLauncher);

    const $ = (selector) => root.querySelector(selector);
    const $$ = (selector) => [...root.querySelectorAll(selector)];
    const overlay = $('#xmks-overlay');
    const input = $('#xmks-input');
    const status = $('.xmks-status');
    const list = $('.xmks-list');
    const search = $('#xmks-search');
    const run = $('#xmks-run');
    const stop = $('#xmks-stop');
    const remove = $('#xmks-delete');
    const toast = $('.xmks-toast');
    const presets = $('.xmks-presets');
    let activeView = 'add';
    let previousRootOverflow = '';
    let previousBodyOverflow = '';

    const notify = (message) => {
      toast.textContent = message;
      toast.dataset.show = 'true';
      clearTimeout(notify.timer);
      notify.timer = setTimeout(() => { toast.dataset.show = 'false'; }, 2600);
    };
    const setStatus = (value) => { status.textContent = value; };
    const countInput = () => { $('.xmks-count').textContent = `${parseWords(input.value).length} 个`; };

    function currentOptions() {
      const surfaces = [];
      if ($('#xmks-home').checked) surfaces.push('home_timeline', 'tweet_replies');
      if ($('#xmks-notifications').checked) surfaces.push('notifications');
      return {
        surfaces,
        source: root.querySelector('input[name="xmks-source"]:checked')?.value || 'non_following',
        duration: $('#xmks-duration').value,
      };
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
      return badges.map(([label, tone]) => `<span class="xmks-badge ${tone ? `xmks-badge-${tone}` : ''}">${label}</span>`).join('');
    }

    function setOverlayOpen(open) {
      overlay.dataset.open = String(open);
      if (open) {
        previousRootOverflow = document.documentElement.style.overflow;
        previousBodyOverflow = document.body?.style.overflow || '';
        document.documentElement.style.overflow = 'hidden';
        if (document.body) document.body.style.overflow = 'hidden';
      } else {
        document.documentElement.style.overflow = previousRootOverflow;
        if (document.body) document.body.style.overflow = previousBodyOverflow;
      }
    }

    function renderPresets() {
      presets.innerHTML = presetCategories.map((category) => `
        <section class="xmks-category">
          <div class="xmks-category-head"><div><div class="xmks-category-title">${escapeHtml(category.name)}</div>${category.descriptions?.length ? `<div class="xmks-category-desc">${escapeHtml(category.descriptions.join(' · '))}</div>` : ''}</div><div class="xmks-category-count">${category.words.length} 个</div></div>
          <div class="xmks-chips">${category.words.map((word) => `<button class="xmks-chip" data-word="${escapeHtml(word)}" data-selected="${presetSelected.has(word)}">${escapeHtml(word)}</button>`).join('')}</div>
        </section>`).join('');
    }

    function switchView(view) {
      activeView = view;
      $$('.xmks-tab').forEach((element) => { element.dataset.active = String(element.dataset.view === view); });
      $$('.xmks-view').forEach((element) => { element.dataset.active = String(element.dataset.viewPanel === view); });
      const titles = { add: '批量添加', presets: '默认词库', manage: '管理词库' };
      $('.xmks-heading').textContent = titles[view];
      $('.xmks-subtitle').textContent = view === 'add' ? '每条请求间隔 0.5 秒' : view === 'presets' ? `${presetSelected.size} 个已选择 · ${presetSource}` : `${keywords.length} 个屏蔽词`;
      run.hidden = view === 'manage';
      run.innerHTML = view === 'presets' ? `${icon('plus',17)}添加所选` : `${icon('plus',17)}开始添加`;
      remove.hidden = view !== 'manage' || selected.size === 0;
      if (view === 'manage' && !listLoaded) loadList();
    }

    function renderList() {
      const query = search.value.trim().toLowerCase();
      const shown = keywords.filter((item) => item.keyword.toLowerCase().includes(query));
      if (!shown.length) {
        list.innerHTML = `<div class="xmks-empty">${query ? '没有匹配的屏蔽词' : '词库为空或尚未加载'}</div>`;
        return;
      }
      list.innerHTML = shown.map((item) => `<div class="xmks-row"><input class="xmks-check" type="checkbox" data-id="${escapeHtml(item.id)}" ${selected.has(item.id) ? 'checked' : ''}><div class="xmks-wordblock"><div class="xmks-word" title="${escapeHtml(item.keyword)}">${escapeHtml(item.keyword)}</div><div class="xmks-meta">${keywordBadges(item)}</div></div><button class="xmks-iconbtn xmks-single-delete" data-id="${escapeHtml(item.id)}" title="删除">${icon('trash',17)}</button></div>`).join('');
    }

    async function loadList() {
      setStatus('正在加载词库…');
      list.innerHTML = '<div class="xmks-empty">正在读取 X 屏蔽词…</div>';
      try {
        const data = await listKeywords();
        keywords = data.muted_keywords || [];
        listLoaded = true;
        selected.clear();
        renderList();
        $('.xmks-subtitle').textContent = `${keywords.length} 个屏蔽词`;
        setStatus(`已加载 ${keywords.length} 个`);
      } catch (error) {
        list.innerHTML = `<div class="xmks-empty">加载失败<br>${error.message}</div>`;
        setStatus('加载失败');
      }
    }

    async function removeIds(ids) {
      if (!ids.length || running) return;
      if (!confirm(`确定删除 ${ids.length} 个屏蔽词？`)) return;
      running = true;
      stopped = false;
      stop.hidden = false;
      remove.disabled = true;
      let done = 0;
      for (const id of ids) {
        if (stopped) break;
        const item = keywords.find((entry) => entry.id === id);
        setStatus(`正在删除：${item?.keyword || id}`);
        try {
          await deleteKeyword(id);
          keywords = keywords.filter((entry) => entry.id !== id);
          selected.delete(id);
          done += 1;
          renderList();
        } catch (error) {
          notify(`删除失败：${error.message}`);
          if ([401, 403, 404, 429].includes(error.status)) break;
        }
        await sleep(DELAY);
      }
      running = false;
      stop.hidden = true;
      remove.disabled = false;
      remove.hidden = selected.size === 0;
      setStatus(stopped ? `已停止，删除 ${done} 个` : `已删除 ${done} 个`);
    }

    $('#xmks-launch').onclick = () => { setOverlayOpen(true); };
    $('.xmks-close').onclick = () => { if (!running) setOverlayOpen(false); };
    overlay.onclick = (event) => { if (event.target === overlay && !running) setOverlayOpen(false); };
    $$('.xmks-tab').forEach((element) => { element.onclick = () => switchView(element.dataset.view); });
    input.oninput = countInput;
    search.oninput = renderList;
    $('#xmks-refresh').onclick = () => { listLoaded = false; loadList(); };
    $('#xmks-clear-presets').onclick = () => {
      presetSelected.clear();
      renderPresets();
      switchView('presets');
    };
    presets.onclick = (event) => {
      const chip = event.target.closest('.xmks-chip');
      if (!chip) return;
      const word = chip.dataset.word;
      presetSelected.has(word) ? presetSelected.delete(word) : presetSelected.add(word);
      chip.dataset.selected = String(presetSelected.has(word));
      $('.xmks-subtitle').textContent = `${presetSelected.size} 个已选择 · ${presetSource}`;
    };
    stop.onclick = () => { stopped = true; setStatus('正在停止…'); };
    remove.onclick = () => removeIds([...selected]);
    list.onclick = (event) => {
      const checkbox = event.target.closest('.xmks-check');
      if (checkbox) {
        checkbox.checked ? selected.add(checkbox.dataset.id) : selected.delete(checkbox.dataset.id);
        remove.hidden = selected.size === 0;
      }
      const button = event.target.closest('.xmks-single-delete');
      if (button) removeIds([button.dataset.id]);
    };

    run.onclick = async () => {
      const words = activeView === 'presets' ? [...presetSelected] : parseWords(input.value);
      if (!words.length || running) return input.focus();
      const options = currentOptions();
      if (!options.surfaces.length) {
        notify('至少选择一个屏蔽位置');
        switchView('add');
        return;
      }
      running = true;
      stopped = false;
      run.disabled = true;
      stop.hidden = false;
      $('.xmks-progress').dataset.show = 'true';
      $('.xmks-log').textContent = '';
      let success = 0, duplicate = 0, failed = 0;
      for (let index = 0; index < words.length && !stopped; index += 1) {
        const word = words[index];
        setStatus(`正在添加：${word}`);
        try {
          await createKeyword(word, options);
          success += 1;
          $('.xmks-log').textContent += `成功  ${word}\n`;
        } catch (error) {
          if (error.code === 85) {
            duplicate += 1;
            $('.xmks-log').textContent += `已存在  ${word}\n`;
          } else {
            failed += 1;
            $('.xmks-log').textContent += `失败  ${word} · ${error.message}\n`;
            if ([401, 403, 404, 429].includes(error.status)) stopped = true;
          }
        }
        const completed = index + 1;
        $('.xmks-bar').style.width = `${completed / words.length * 100}%`;
        $('.xmks-summary').textContent = `${completed}/${words.length} · 成功 ${success} · 已存在 ${duplicate} · 失败 ${failed}`;
        $('.xmks-log').scrollTop = $('.xmks-log').scrollHeight;
        if (completed < words.length && !stopped) await sleep(DELAY);
      }
      running = false;
      run.disabled = false;
      stop.hidden = true;
      setStatus(stopped ? '任务已停止' : '添加完成');
      notify(stopped ? '任务已停止' : `完成：新增 ${success} 个`);
    };

    loadPresetCategories().then((categories) => {
      presetCategories = categories;
      renderPresets();
      if (activeView === 'presets') $('.xmks-subtitle').textContent = `${presetSelected.size} 个已选择 · ${presetSource}`;
    });
    renderPresets();
  }

  install();
})();
