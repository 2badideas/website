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
    section, button { font: 15px/1.5 system-ui, sans-serif; }
    section { pointer-events: auto; position: fixed; bottom: calc(52px + env(safe-area-inset-bottom, 0px)); left: 12px; right: 12px;
      max-width: 650px; max-height: 70dvh; overflow-y: auto; padding: 20px; border: 1px solid #abc0ad;
      border-radius: 12px; background: #101d18; color: #f0ecec; box-shadow: 0 8px 35px #0008; touch-action: pan-y; }
    h2 { margin: 0 0 8px; font-size: 19px; } p { margin: 0 0 14px; }
    a { color: #d2f2b9; text-decoration: underline; }
    .actions { display: flex; flex-wrap: wrap; gap: 10px; }
    button { pointer-events: auto; cursor: pointer; min-height: 44px; padding: 8px 14px;
      border: 1px solid #abc0ad; border-radius: 6px; background: #20372a; color: #fff; touch-action: manipulation; }
    button:focus-visible, a:focus-visible { outline: 3px solid #f4cf7c; outline-offset: 3px; }
    #settings { position: fixed; bottom: calc(6px + env(safe-area-inset-bottom, 0px)); left: max(12px, env(safe-area-inset-left, 0px)); font-size: 12px; }
  </style>
  <section role="region" aria-labelledby="heading" hidden>
    <h2 id="heading">Analytics choices</h2>
    <p>With your permission, we use cookieless Umami analytics to count visits, referral sources, and game starts. Your game saves and scores stay on your device. We store your choice here for 180 days. <a href="/privacy.html">Privacy policy</a></p>
    <p id="status" role="status"></p>
    <div class="actions"><button id="reject" type="button">Reject analytics</button><button id="accept" type="button">Accept analytics</button><button id="close" type="button">Close</button></div>
  </section>
  <button id="settings" type="button" aria-expanded="false">Analytics choices</button>`;
  const panel = root.querySelector('section');
  const settings = root.getElementById('settings');
  const accept = root.getElementById('accept');
  const reject = root.getElementById('reject');
  function render(open) {
    panel.hidden = !open;
    settings.setAttribute('aria-expanded', String(open));
    accept.disabled = signal();
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
