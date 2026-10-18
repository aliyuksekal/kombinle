(function () {
  try {
    var t = localStorage.getItem('kb_tema') || 'oto';
    var d = t === 'koyu' || (t === 'oto' && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.setAttribute('data-tema', d ? 'koyu' : 'acik');
  } catch (e) {
    document.documentElement.setAttribute('data-tema', 'acik');
  }
})();
