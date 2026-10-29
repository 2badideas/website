(() => {
  let prompt;
  const install = document.getElementById('install');
  const dialog = document.getElementById('installguide');
  const confirm = document.getElementById('installconfirm');
  const message = document.getElementById('installmessage');
  const standalone = () => matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches || navigator.standalone;
  function refresh() { install.hidden = !!standalone(); document.getElementById('landingInstall').hidden = !!standalone(); }
  refresh();
  window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); prompt = event; });
  window.addEventListener('appinstalled', () => { prompt = null; refresh(); dialog.close(); });
  install.onclick = () => {
    if (document.getElementById('overlay').classList.contains('hidden')) document.getElementById('pause').click();
    confirm.hidden = !prompt;
    message.textContent = prompt ? 'Install the game to open it in its own full-screen window. Your cave is ready whenever you are.' : /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ? 'On iPhone or iPad: open this page in Safari, tap Share, then Add to Home Screen. Turn on Open as Web App if offered, then tap Add.' : 'Open your browser menu and choose Install app or Add to Home Screen. On desktop Safari, use File → Add to Dock. Installation options depend on your browser.';
    dialog.showModal();
  };
  confirm.onclick = async () => {
    if (!prompt) return;
    const request = prompt; prompt = null;
    await request.prompt(); await request.userChoice;
    dialog.close();
  };
  document.getElementById('closeinstall').onclick = () => dialog.close();
  document.getElementById('fullscreen').onclick = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
      else install.click();
    } catch { install.click(); }
  };
  document.addEventListener('fullscreenchange', () => document.getElementById('fullscreen').setAttribute('aria-label', document.fullscreenElement ? 'Exit full screen' : 'Use full screen'));
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js', {updateViaCache:'none'}).catch(() => {
      document.querySelector('.install-footnote').textContent = 'Offline mode is unavailable in this browser session. Online play and local progress saving still work.';
    }));
  }
})();
