(() => {
  const origin = location.origin;
  const buttons = [...document.querySelectorAll('[data-install]')];
  const setInstalled = value => buttons.forEach(button => { button.hidden = value; });
  // Install prompts belong to the top-level page, even when the game uses an iframe.
  if (window.parent !== window) {
    buttons.forEach(button => button.addEventListener('click', () => {
      window.parent.postMessage({type: 'woods-install-request'}, origin);
    }));
    window.addEventListener('message', event => {
      if (event.origin !== origin || event.source !== window.parent || event.data?.type !== 'woods-install-state') return;
      setInstalled(!!event.data.installed);
    });
    window.parent.postMessage({type: 'woods-install-state-request'}, origin);
    return;
  }

  let installPrompt, installed = false, offlineReady = false, offlineFailed = false;
  const frame = document.querySelector('iframe');
  const standalone = () => installed || matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches || !!navigator.standalone;
  function refresh() {
    setInstalled(standalone());
    frame?.contentWindow?.postMessage({type: 'woods-install-state', installed: standalone()}, origin);
  }
  const dialog = document.createElement('dialog');
  dialog.className = 'woods-install-dialog';
  dialog.setAttribute('aria-labelledby', 'woods-install-title');
  dialog.innerHTML = `<button class="woods-install-close" aria-label="Close installation guide">×</button>
    <h2 id="woods-install-title">Take the woods with you.</h2>
    <p id="woods-install-message"></p>
    <p class="woods-install-note" id="woods-offline-status"></p>
    <p class="woods-install-note">Runs are not saved. Closing or reloading the game starts a new run.</p>
    <button class="woods-install-button" id="woods-install-confirm" hidden>Install game</button>`;
  document.body.append(dialog);
  const confirm = dialog.querySelector('#woods-install-confirm');
  const message = dialog.querySelector('#woods-install-message');
  const status = dialog.querySelector('#woods-offline-status');
  function refreshOffline() {
    status.textContent = offlineFailed ? 'Offline play is unavailable in this browser session. You can still play online.' : offlineReady ? 'The game is ready for offline play on this device. Clear this site’s browser data to remove its cached files.' : 'Preparing offline play after this online visit. Keep the game open until it is ready.';
  }
  function showInstall() {
    if (standalone()) return;
    confirm.hidden = !installPrompt;
    message.textContent = installPrompt ? 'Install Sticks in the Woods to play in its own full-screen window.' : /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ? 'In Safari, tap Share, then Add to Home Screen. Turn on Open as Web App if offered, then tap Add.' : 'Open your browser menu and choose Install app or Add to Home Screen. On desktop Safari, use File → Add to Dock. Options depend on your browser.';
    refreshOffline();
    if (!dialog.open) dialog.showModal();
  }
  buttons.forEach(button => button.addEventListener('click', showInstall));
  dialog.querySelector('.woods-install-close').addEventListener('click', () => dialog.close());
  confirm.addEventListener('click', async () => {
    if (!installPrompt) return;
    const request = installPrompt;
    installPrompt = null;
    confirm.hidden = true;
    try { await request.prompt(); await request.userChoice; dialog.close(); }
    catch { message.textContent = 'Use your browser’s menu to install the game, or keep playing here.'; }
  });
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault(); installPrompt = event;
    if (dialog.open) { confirm.hidden = false; message.textContent = 'Install Sticks in the Woods to play in its own full-screen window.'; }
  });
  window.addEventListener('appinstalled', () => { installed = true; installPrompt = null; dialog.close(); refresh(); });
  window.addEventListener('message', event => {
    if (event.origin !== origin || !frame || event.source !== frame.contentWindow) return;
    if (event.data?.type === 'woods-install-request') showInstall();
    if (event.data?.type === 'woods-install-state-request') refresh();
  });
  frame?.addEventListener('load', refresh);
  refresh();
  refreshOffline();
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        await navigator.serviceWorker.register('./sw.js', {updateViaCache: 'none'});
        await navigator.serviceWorker.ready;
        offlineReady = true;
      } catch { offlineFailed = true; }
      refreshOffline();
    });
  } else { offlineFailed = true; refreshOffline(); }
})();
