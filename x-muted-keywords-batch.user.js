// ==UserScript==
// @name         X Muted Keywords Batch Add
// @namespace    https://x.com/
// @version      0.3.0
// @description  Batch-add muted keywords with X's own transaction-id generator.
// @match        https://x.com/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(() => {
  'use strict';

  const API_PATH = '/i/api/1.1/mutes/keywords/create.json';
  const SIGN_PATH = '/1.1/mutes/keywords/create.json';
  const STEP_DELAY = 500;
  const PUBLIC_BEARER =
    'AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA';
  let stopped = false;

  function webpackRequire() {
    const chunks = window.webpackChunk_twitter_responsive_web;
    if (!chunks) throw new Error('X 主程序尚未加载，请稍后重试');
    let require;
    chunks.push([[Math.floor(Math.random() * 1e9)], {}, (value) => { require = value; }]);
    if (!require) throw new Error('无法访问 X 模块加载器');
    return require;
  }

  function transactionModule(require) {
    const cached = Object.values(require.c || {}).find((module) =>
      typeof module.exports?.kc === 'function'
      && typeof module.exports?._E === 'function');
    if (cached) return cached.exports;

    // Current X responsive-web module. The cache lookup above avoids depending
    // on this id after the module has been loaded by X's own requests.
    const current = require(991160);
    if (typeof current?.kc !== 'function') throw new Error('X 已更新请求签名模块，请更新脚本');
    return current;
  }

  async function transactionId() {
    const require = webpackRequire();
    return transactionModule(require).kc('https://x.com', SIGN_PATH, 'POST');
  }

  function csrfToken() {
    return decodeURIComponent(document.cookie.match(/(?:^|; )ct0=([^;]+)/)?.[1] || '');
  }

  function parseKeywords(text) {
    return [...new Set(text.split(/[\n,，;；]+/).map((value) => value.trim()).filter(Boolean))];
  }

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  async function addKeyword(keyword) {
    const csrf = csrfToken();
    if (!csrf) throw new Error('未检测到登录会话或 CSRF Token');
    const response = await fetch(API_PATH, {
      method: 'POST',
      credentials: 'include',
      headers: {
        accept: '*/*',
        authorization: `Bearer ${PUBLIC_BEARER}`,
        'content-type': 'application/x-www-form-urlencoded',
        'x-client-transaction-id': await transactionId(),
        'x-csrf-token': csrf,
        'x-twitter-active-user': 'yes',
        'x-twitter-auth-type': 'OAuth2Session',
        'x-twitter-client-language': document.documentElement.lang || 'en',
      },
      body: new URLSearchParams({
        keyword,
        mute_surfaces: 'notifications,home_timeline,tweet_replies',
        mute_options: 'exclude_following_accounts',
        duration: '',
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.errors?.[0]?.message || `HTTP ${response.status}`);
      error.code = data.errors?.[0]?.code;
      error.status = response.status;
      throw error;
    }
    return data;
  }

  function installUI() {
    if (document.querySelector('#xmk-root')) return;
    const root = document.createElement('div');
    root.id = 'xmk-root';
    root.innerHTML = `
      <style>
        #xmk-launcher{position:fixed;right:22px;bottom:22px;z-index:2147483646;width:48px;height:48px;border:1px solid #cfd9de;border-radius:50%;background:#eff3f4;color:#0f1419;box-shadow:0 6px 20px rgb(0 0 0/.22);font:700 22px system-ui;cursor:pointer}
        #xmk-panel{position:fixed;inset:0;z-index:2147483647;display:none;place-items:center;background:rgb(0 0 0/.62);font-family:system-ui;color:#e7e9ea}#xmk-panel[data-open="true"]{display:grid}
        .xmk-shell{box-sizing:border-box;width:min(600px,calc(100vw - 28px));max-height:calc(100vh - 28px);overflow:auto;border:1px solid #2f3336;border-radius:8px;background:#000;box-shadow:0 18px 60px rgb(0 0 0/.5)}
        .xmk-head{display:flex;align-items:center;justify-content:space-between;padding:15px 18px;border-bottom:1px solid #2f3336}.xmk-title{font-size:19px;font-weight:800}.xmk-close{width:34px;height:34px;border:0;border-radius:50%;background:transparent;color:#e7e9ea;font-size:22px;cursor:pointer}
        .xmk-body{padding:18px}.xmk-note{margin:0 0 12px;color:#8b98a5;font-size:13px;line-height:1.5}#xmk-input{box-sizing:border-box;width:100%;min-height:190px;padding:12px;border:1px solid #536471;border-radius:6px;outline:0;resize:vertical;background:#16181c;color:#e7e9ea;font:14px/1.55 system-ui}#xmk-input:focus{border-color:#1d9bf0;box-shadow:0 0 0 1px #1d9bf0}
        .xmk-progress{display:none;margin-top:14px}.xmk-progress[data-show="true"]{display:block}.xmk-track{height:5px;overflow:hidden;border-radius:3px;background:#2f3336}.xmk-bar{height:100%;width:0;background:#1d9bf0;transition:width .2s}.xmk-summary{margin:9px 0;color:#e7e9ea;font-size:13px}#xmk-log{max-height:190px;overflow:auto;border-top:1px solid #2f3336;padding-top:8px;font:13px/1.55 ui-monospace,monospace;white-space:pre-wrap}
        .xmk-actions{display:flex;justify-content:flex-end;gap:9px;padding:14px 18px;border-top:1px solid #2f3336}.xmk-btn{min-height:38px;border:1px solid #536471;border-radius:999px;padding:0 17px;background:transparent;color:#e7e9ea;font-weight:700;cursor:pointer}.xmk-primary{border-color:#eff3f4;background:#eff3f4;color:#0f1419}.xmk-danger{border-color:#f4212e;color:#f4212e}.xmk-btn:disabled{opacity:.45;cursor:not-allowed}
      </style>
      <button id="xmk-launcher" title="批量添加屏蔽词" aria-label="批量添加屏蔽词">+</button>
      <div id="xmk-panel" role="dialog" aria-modal="true"><section class="xmk-shell">
        <header class="xmk-head"><div class="xmk-title">批量添加屏蔽词</div><button class="xmk-close" aria-label="关闭">×</button></header>
        <main class="xmk-body"><p class="xmk-note">每行一个，也支持逗号或分号分隔。请求直接在当前 X 页面发送，每条间隔 0.5 秒。</p><textarea id="xmk-input" placeholder="广告\n色情\n推广"></textarea><div class="xmk-progress"><div class="xmk-track"><div class="xmk-bar"></div></div><div class="xmk-summary"></div><div id="xmk-log"></div></div></main>
        <footer class="xmk-actions"><button id="xmk-stop" class="xmk-btn xmk-danger" hidden>停止</button><button id="xmk-start" class="xmk-btn xmk-primary">开始添加</button></footer>
      </section></div>`;
    document.documentElement.appendChild(root);

    const panel = root.querySelector('#xmk-panel');
    const input = root.querySelector('#xmk-input');
    const start = root.querySelector('#xmk-start');
    const stop = root.querySelector('#xmk-stop');
    const progress = root.querySelector('.xmk-progress');
    const summary = root.querySelector('.xmk-summary');
    const log = root.querySelector('#xmk-log');
    const bar = root.querySelector('.xmk-bar');

    root.querySelector('#xmk-launcher').onclick = () => { panel.dataset.open = 'true'; };
    root.querySelector('.xmk-close').onclick = () => { panel.dataset.open = 'false'; };
    panel.onclick = (event) => { if (event.target === panel) panel.dataset.open = 'false'; };
    stop.onclick = () => { stopped = true; stop.disabled = true; };

    start.onclick = async () => {
      const keywords = parseKeywords(input.value);
      if (!keywords.length) return input.focus();
      stopped = false;
      input.disabled = true;
      start.disabled = true;
      stop.hidden = false;
      stop.disabled = false;
      progress.dataset.show = 'true';
      log.textContent = '';
      let success = 0;
      let duplicate = 0;
      let failed = 0;

      const render = (completed) => {
        bar.style.width = `${completed / keywords.length * 100}%`;
        summary.textContent = `${completed}/${keywords.length} · 成功 ${success} · 已存在 ${duplicate} · 失败 ${failed}${stopped ? ' · 已停止' : ''}`;
        log.scrollTop = log.scrollHeight;
      };
      render(0);

      for (let index = 0; index < keywords.length && !stopped; index += 1) {
        const keyword = keywords[index];
        try {
          await addKeyword(keyword);
          success += 1;
          log.textContent += `成功  ${keyword}\n`;
        } catch (error) {
          if (error.code === 85) {
            duplicate += 1;
            log.textContent += `已存在  ${keyword}\n`;
          } else {
            failed += 1;
            log.textContent += `失败  ${keyword} · ${error.message}\n`;
            if ([401, 403, 404, 429].includes(error.status)) stopped = true;
          }
        }
        render(index + 1);
        if (index < keywords.length - 1 && !stopped) await sleep(STEP_DELAY);
      }
      input.disabled = false;
      start.disabled = false;
      stop.hidden = true;
      start.textContent = '再次添加';
    };
  }

  installUI();
  new MutationObserver(installUI).observe(document.documentElement, { childList: true, subtree: true });
})();
