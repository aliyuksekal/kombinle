(function () {
  var r = 'pembe';
  try {
    var t = localStorage.getItem('kb_tema') || 'oto';
    var k = ['pembe', 'lavanta', 'altin', 'mint', 'rosegold', 'acik', 'koyu', 'amoled'];
    r = k.indexOf(t) >= 0 ? t : (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'koyu' : 'pembe');
  } catch (e) { }
  document.documentElement.setAttribute('data-tema', r === 'koyu' || r === 'amoled' ? 'koyu' : 'acik');
  document.documentElement.setAttribute('data-renk', r);
})();
