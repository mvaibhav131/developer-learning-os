// Applies the saved theme and language before first paint so the page never flashes.
(function () {
  try {
    var saved = JSON.parse(localStorage.getItem('dlos-ui') || '{}').state || {};
    var theme = saved.theme || 'system';
    var dark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', dark);
    if (saved.locale) document.documentElement.lang = saved.locale;
  } catch {
    /* storage can be blocked; the defaults in index.html are fine */
  }
})();
