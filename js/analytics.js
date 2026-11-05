/* Optional Umami Cloud analytics. Keep all collection behind an explicit choice. */
(() => {
  'use strict';
  const games = new Set(['sticks-in-the-woods', 'into-the-deep', 'sap-and-survive']);
  if (window !== window.top) {
    // The embedded Woods game shares the outer page's consent and tracker.
    window.siteAnalytics = { gameStart: game => {
      try { window.parent.siteAnalytics?.gameStart(game); } catch {}
    } };
    return;
  }
  const key = '2badideas-analytics-v1';
  const lifetime = 180 * 24 * 60 * 60 * 1000;
  const production = ['2badideas.com', 'www.2badideas.com'].includes(location.hostname);
  let sessionChoice = null, tracker = null, ready = false;
  const signal = () => navigator.globalPrivacyControl === true ||
    navigator.doNotTrack === '1' || window.doNotTrack === '1';
  function readChoice() {
    let raw, value;
    try { raw = localStorage.getItem(key); }
    catch { value = sessionChoice; }
    if (raw !== undefined) {
      try { value = JSON.parse(raw); } catch { return null; }
    }
    return value && ['accepted', 'rejected'].includes(value.choice) &&
      value.expires > Date.now() && value.expires <= Date.now() + lifetime ? value.choice : null;
  }
  const allowed = () => production && !signal() && readChoice() === 'accepted' && navigator.onLine;
  function pagePath() {
    return location.pathname.replace(/\/index\.html$/, '/').replace(/\/game\.html$/, '/');
  }
  function referrerHost() {
    try { return new URL(document.referrer).origin; } catch { return ''; }
  }
  // Recheck consent on every send, including after a change in another tab.
  window.siteAnalyticsBeforeSend = (type, payload) => {
    if (!allowed() || type !== 'event') return false;
    if (payload.name && (payload.name !== 'game-start' || !games.has(payload.data?.game))) return false;
    return {
      website: '5ff42a68-829e-4902-9d3b-b4fc38c8f29c',
      hostname: location.hostname, url: pagePath(), title: document.title,
      referrer: referrerHost(), language: navigator.language,
      screen: `${screen.width}x${screen.height}`,
      ...(payload.name ? { name: 'game-start', data: { game: payload.data.game } } : {})
    };
  };
  function send(name, game) {
    if (!ready || !allowed()) return;
    const payload = window.siteAnalyticsBeforeSend('event', name ? { name, data: { game } } : {});
    if (payload) Promise.resolve(window.umami?.track(payload)).catch(() => {});
  }
  window.siteAnalytics = { gameStart: game => { if (games.has(game)) send('game-start', game); } };
  function loadTracker() {
    if (!allowed() || tracker) return;
    tracker = document.createElement('script');
    tracker.src = 'https://cloud.umami.is/script.js';
    tracker.defer = true;
    tracker.setAttribute('data-website-id', '5ff42a68-829e-4902-9d3b-b4fc38c8f29c');
    tracker.setAttribute('data-domains', '2badideas.com,www.2badideas.com');
    tracker.setAttribute('data-auto-track', 'false');
    tracker.setAttribute('data-exclude-search', 'true');
    tracker.setAttribute('data-exclude-hash', 'true');
    tracker.setAttribute('data-do-not-track', 'true');
    tracker.setAttribute('data-before-send', 'siteAnalyticsBeforeSend');
    tracker.referrerPolicy = 'no-referrer';
    tracker.onload = () => { ready = true; send(); };
    tracker.onerror = () => { tracker.remove(); tracker = null; };
    document.head.append(tracker);
  }

  // Shadow DOM keeps game styles from hiding or restyling the consent controls.
  const host = document.createElement('div');
  host.id = 'analytics-controls';
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `<style>
    :host { all: initial; position: fixed; z-index: 2147483647; inset: auto 0 0; pointer-events: none; }
    * { box-sizing: border-box; }
    [hidden] { display: none !important; }
    section, button { font: 14px/1.4 system-ui, sans-serif; }
    section { pointer-events: auto; position: fixed; bottom: 0; left: 0; right: 0;
      display: flex; align-items: center; justify-content: center; gap: 16px; max-height: 50dvh; overflow-y: auto;
      padding: 10px max(56px, env(safe-area-inset-right, 0px)) calc(10px + env(safe-area-inset-bottom, 0px)) max(16px, env(safe-area-inset-left, 0px));
      border-top: 1px solid #718775; background: #101d18; color: #f0ecec; touch-action: pan-y; }
    h2 { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
    p { margin: 0; } #status { margin-top: 4px; font-size: 12px; }
    .message { max-width: 650px; }
    a { color: #d2f2b9; text-decoration: underline; }
    .actions { display: flex; flex-shrink: 0; gap: 8px; }
    button { pointer-events: auto; cursor: pointer; min-height: 44px; padding: 8px 12px;
      border: 1px solid #abc0ad; border-radius: 6px; background: #20372a; color: #fff; touch-action: manipulation; }
    button:focus-visible, a:focus-visible { outline: 3px solid #f4cf7c; outline-offset: 3px; }
    #close { position: absolute; right: max(4px, env(safe-area-inset-right, 0px)); top: 4px; width: 44px; border: 0; background: transparent; font-size: 22px; }
    #settings { position: fixed; bottom: env(safe-area-inset-bottom, 0px); left: max(8px, env(safe-area-inset-left, 0px));
      font-size: 11px; border: 0; background: #101d18; text-decoration: underline; }
    @media (max-width: 760px) {
      section { flex-direction: column; align-items: flex-start; gap: 8px; padding-left: max(12px, env(safe-area-inset-left, 0px)); }
      .actions { flex-wrap: wrap; }
    }
  </style>
  <section role="region" aria-labelledby="heading" hidden>
    <h2 id="heading">Analytics choices</h2>
    <div class="message"><p>Allow us to measure visits, referrals, and game starts? We do not use cookies. <a href="/privacy.html">Privacy policy</a></p><p id="status" role="status" hidden></p></div>
    <div class="actions"><button id="reject" type="button">Reject analytics</button><button id="accept" type="button">Accept analytics</button></div>
    <button id="close" type="button" aria-label="Close">×</button>
  </section>
  <button id="settings" type="button" aria-expanded="false">Analytics choices</button>`;
  const panel = root.querySelector('section');
  const settings = root.getElementById('settings');
  const accept = root.getElementById('accept');
  const reject = root.getElementById('reject');
  function render(open) {
    panel.hidden = !open;
    settings.hidden = open;
    settings.setAttribute('aria-expanded', String(open));
    accept.disabled = signal();
    root.getElementById('status').hidden = !signal() && !readChoice();
    root.getElementById('status').textContent = signal()
      ? 'Your browser privacy signal keeps analytics off.'
      : `Analytics are ${readChoice() === 'accepted' ? 'accepted' : 'off'}. You can change your choice at any time.`;
  }
  function choose(choice) {
    sessionChoice = { choice, expires: Date.now() + lifetime };
    try { localStorage.setItem(key, JSON.stringify(sessionChoice)); } catch {}
    render(false);
    settings.focus();
    loadTracker();
  }
  settings.onclick = () => { render(panel.hidden); if (!panel.hidden) reject.focus(); };
  accept.onclick = () => { if (!signal()) choose('accepted'); };
  reject.onclick = () => choose('rejected');
  root.getElementById('close').onclick = () => { render(false); settings.focus(); };
  // Prevent focused consent controls from also operating a game's keyboard controls.
  for (const type of ['keydown', 'keyup', 'pointerdown', 'pointerup', 'click']) {
    host.addEventListener(type, event => {
      event.stopPropagation();
      if (type === 'keydown' && event.key === 'Escape') { render(false); settings.focus(); }
    });
  }
  document.body.append(host);
  window.addEventListener('storage', event => {
    if (event.key === key || event.key === null) { render(!readChoice() && !signal()); loadTracker(); }
  });
  window.addEventListener('online', loadTracker);
  render(!readChoice() && !signal());
  loadTracker();
})();
