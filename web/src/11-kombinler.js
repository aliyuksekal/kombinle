/* ---------- Kombinlerim ---------- */
function kombinlerEkrani() {
  var bol = h('section', null);
  var g = gecmisAl();
  bol.appendChild(h('h1', { class: 'baslik', text: t('kombinlerim') }));
  bol.appendChild(h('p', { class: 'alt-yazi', text: t('kombinlerimAlt') }));
  var seg = h('div', { class: 'seg', style: { 'margin-top': '14px' } });
  [['hepsi', 'tumu'], ['fav', 'favoriler']].forEach(function (x) {
    seg.appendChild(h('button', { 'aria-pressed': S.gecmisFiltre === x[0] ? 'true' : 'false', text: t(x[1]), on: { click: function () { S.gecmisFiltre = x[0]; ciz(); } } }));
  });
  bol.appendChild(seg);
  var liste = g.filter(function (x) { return S.gecmisFiltre !== 'fav' || x.fav; });
  if (!liste.length) {
    bol.appendChild(h('div', { class: 'kart bos' }, h('div', { class: 'resim' }, ikon('kalp')),
      h('h2', { class: 'baslik', text: S.gecmisFiltre === 'fav' ? t('favBos') : t('gecmisBos') }),
      h('p', { class: 'alt-yazi', text: t('gecmisBosMetin') }),
      h('div', { class: 'dugmeler' }, h('button', { class: 'btn ana', on: { click: function () { S.sekme = 'bugun'; ciz(); } } }, ikon('isilti'), t('kombinOner')))));
    return bol;
  }
  var kutu = h('div', { class: 'gecmis' });
  var harita = {}; S.parcalar.forEach(function (p) { harita[p.id] = p; });
  liste.forEach(function (k) {
    var parcalar = k.p.map(function (id) { return harita[id]; }).filter(Boolean);
    var kolaj = h('div', { class: 'mini-kolaj' });
    parcalar.slice(0, 4).forEach(function (p) { kolaj.appendChild(resimEl(p.id, false, null, '')); });
    for (var i = parcalar.length; i < 4; i++) kolaj.appendChild(h('div'));
    var baslik = k.m || ortamAd(k.o) || t('kombin');
    var alt = tarihYaz(k.tarih) + (k.h && sayiMi(k.h.min) ? ', ' + k.h.min + '°–' + k.h.max + '°' : '');
    kutu.appendChild(h('button', { class: 'gecmis-oge', on: { click: function () { kombinDetay(k); } } },
      kolaj, h('div', { class: 'bilgi' }, h('b', { text: baslik }), h('small', { text: alt })),
      k.fav ? h('span', { style: { color: 'var(--vurgu)' } }, (function () { var s = ikon('kalp', 'k'); s.style.fill = 'currentColor'; return s; })()) : null));
  });
  bol.appendChild(kutu);
  return bol;
}
function kombinDetay(k) {
  var harita = {}; S.parcalar.forEach(function (p) { harita[p.id] = p; });
  var parcalar = k.p.map(function (id) { return harita[id]; }).filter(Boolean);
  var yapi = { aks: [] };
  parcalar.forEach(function (p) {
    var g = TUR[p.tur].g, tr = TUR[p.tur];
    if (g === 'ust' && !yapi.ust) yapi.ust = p; else if (g === 'alt' && !yapi.alt) yapi.alt = p; else if (g === 'tek' && !yapi.tek) yapi.tek = p;
    else if (g === 'dis' && tr.kat && !yapi.kat) yapi.kat = p; else if (g === 'dis' && !yapi.dis) yapi.dis = p; else if (g === 'ayk' && !yapi.ayk) yapi.ayk = p;
    else yapi.aks.push(p);
  });
  var icerik = h('div', null,
    h('p', { class: 'alt-yazi', text: tarihYaz(k.tarih) + (k.o ? ', ' + ortamAd(k.o) : '') }),
    parcalar.length ? masaCiz(yapi) : h('p', { class: 'alt-yazi', text: t('parcalarSilinmis') }),
    parcalar.length < k.p.length && parcalar.length ? h('p', { class: 'alt-yazi', style: { 'margin-top': '8px' }, text: t('bazisiSilinmis') }) : null);
  var favBtn = h('button', { class: 'btn ikincil', on: { click: function () { guncelle(function (x) { x.fav = !x.fav; }); tost(k.fav ? t('favEklendi') : t('favCikti')); s.kapat(); ciz(); } } }, ikon('kalp', 'k'), k.fav ? t('favdenCikar') : t('favoriyeEkle'));
  var giyBtn = h('button', {
    class: 'btn ana', disabled: !parcalar.length ? true : null, on: {
      click: function () {
        var simdi = Date.now();
        parcalar.forEach(function (p) { p.son = simdi; p.giy = sinirla((p.giy || 0) + 1, 0, 99999); Depo.parcaYaz(p).catch(hataYakala); });
        var g = gecmisAl();
        g.unshift({ id: yeniId(), tarih: simdi, p: k.p.slice(0, 16), o: k.o, m: k.m, fav: false, giyildi: true, h: k.h });
        gecmisYaz(g); tost(t('giyildiTost')); s.kapat(); ciz();
      }
    }
  }, ikon('tik', 'k'), t('tekrarGiy'));
  icerik.appendChild(h('button', {
    class: 'btn ikincil tehlike tam', style: { 'margin-top': '18px' }, on: {
      click: function () { onayla(t('kombinSilBaslik'), t('kombinSilMetin'), t('sil'), true).then(function (ok) { if (!ok) return; gecmisYaz(gecmisAl().filter(function (x) { return x.id !== k.id; })); s.kapat(); ciz(); }); }
    }
  }, ikon('cop', 'k'), t('kombiniSil')));
  var s = sayfaAc({ baslik: k.m || ortamAd(k.o) || t('kombin'), icerik: icerik, altBar: [favBtn, giyBtn] });
  function guncelle(fn) { var g = gecmisAl(); g.forEach(function (x) { if (x.id === k.id) { fn(x); k.fav = x.fav; } }); gecmisYaz(g); }
}
