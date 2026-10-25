(function () {
  var r = 'acik';
  try {
    var t = localStorage.getItem('kb_tema') || 'oto';
    var k = ['pembe', 'lavanta', 'altin', 'mint', 'nane', 'rosegold', 'acik', 'koyu', 'amoled'];
    r = k.indexOf(t) >= 0 ? t : (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'koyu' : 'acik');
  } catch (e) { }
  document.documentElement.setAttribute('data-tema', r === 'koyu' || r === 'amoled' ? 'koyu' : 'acik');
  document.documentElement.setAttribute('data-renk', r);
})();
