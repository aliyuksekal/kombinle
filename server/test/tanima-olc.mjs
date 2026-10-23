// Gerçek yapay zekâyla kıyafet tanıma ölçümü (CI'da, yalnız commit mesajında [olc] varsa çalışır).
// Wikimedia Commons kategorilerinden gerçek fotoğraflar indirilir; yeni (iki aşamalı) tanıma ile
// eski tek aşamalı yönerge karşılaştırılır. Sonuç TANIMA.md dosyasına yazılır.
// Not: Commons kategorileri gürültülü olabilir (bir fotoğrafta birden çok parça vb.); sonuçlar yaklaşıktır.
import { writeFileSync } from 'node:fs';
import { createHash, createHmac } from 'node:crypto';
import isci from '../src/index.js';

const GEMINI = process.env.GEMINI_API_KEY;
if (!GEMINI) { console.log('GEMINI_API_KEY yok, ölçüm atlandı'); process.exit(0); }
const ANAHTAR = 'olcum-anahtari';
const sahteDB = {
  prepare(sql) {
    const n = { bind() { return n; }, async first() { return null; }, async all() { return { results: [] }; }, async run() { return /RETURNING/i.test(sql) ? { results: [{ sayi: 1 }] } : { meta: { changes: 0 } }; } };
    return n;
  },
  async batch(l) { return Promise.all(l.map(x => x.run())); }
};
const env = { DB: sahteDB, UYGULAMA_ANAHTARI: ANAHTAR, GEMINI_API_KEY: GEMINI };

// uygulamadaki tür listesi (kimlik, Türkçe ad, İngilizce ad, kategori)
const TURLER = [
  ['tisort', 'Tişört', 'T-shirt', 'ust'], ['bluz', 'Bluz', 'Blouse', 'ust'], ['gomlek', 'Gömlek', 'Shirt', 'ust'], ['askili', 'Askılı / atlet', 'Tank top', 'ust'],
  ['kazak', 'Kazak', 'Sweater', 'ust'], ['sweat', 'Sweatshirt', 'Sweatshirt', 'ust'], ['tunik', 'Tunik', 'Tunic', 'ust'], ['kumas', 'Kumaş pantolon', 'Trousers', 'alt'],
  ['kot', 'Kot pantolon', 'Jeans', 'alt'], ['etek', 'Etek', 'Skirt', 'alt'], ['uzunetek', 'Uzun etek', 'Long skirt', 'alt'], ['sort', 'Şort', 'Shorts', 'alt'],
  ['tayt', 'Tayt', 'Leggings', 'alt'], ['esofman', 'Eşofman altı', 'Joggers', 'alt'], ['elbise', 'Elbise', 'Dress', 'tek'], ['uzunelbise', 'Uzun elbise', 'Maxi dress', 'tek'],
  ['tulum', 'Tulum', 'Jumpsuit', 'tek'], ['ferace', 'Ferace / abaya', 'Abaya', 'tek'], ['hirka', 'Hırka', 'Cardigan', 'dis'], ['yelek', 'Yelek', 'Vest', 'dis'],
  ['blazer', 'Blazer ceket', 'Blazer', 'dis'], ['ceket', 'Ceket', 'Jacket', 'dis'], ['tren', 'Trençkot / pardösü', 'Trench coat', 'dis'], ['yagmurluk', 'Yağmurluk', 'Raincoat', 'dis'],
  ['mont', 'Mont', 'Puffer / parka', 'dis'], ['kaban', 'Kaban', 'Wool coat', 'dis'], ['spor', 'Spor ayakkabı', 'Sneakers', 'ayk'], ['babet', 'Babet', 'Ballet flats', 'ayk'],
  ['loafer', 'Loafer / makosen', 'Loafers', 'ayk'], ['topuklu', 'Topuklu', 'Heels', 'ayk'], ['bot', 'Bot / çizme', 'Boots', 'ayk'], ['sandalet', 'Sandalet', 'Sandals', 'ayk'],
  ['terlik', 'Terlik', 'Slides', 'ayk'], ['canta', 'Çanta', 'Bag', 'aks'], ['esarp', 'Eşarp / şal', 'Headscarf / shawl', 'aks'], ['atki', 'Atkı', 'Scarf', 'aks'],
  ['bere', 'Bere / şapka', 'Hat / beanie', 'aks'], ['eldiven', 'Eldiven', 'Gloves', 'aks'], ['gozluk', 'Güneş gözlüğü', 'Sunglasses', 'aks'], ['kemer', 'Kemer', 'Belt', 'aks'],
  ['kupe', 'Küpe', 'Earrings', 'aks'], ['kolye', 'Kolye', 'Necklace', 'aks'], ['bileklik', 'Bileklik / yüzük', 'Bracelet / ring', 'aks'], ['saat', 'Saat', 'Watch', 'aks'],
  ['taki', 'Diğer takı', 'Other jewelry', 'aks'], ['kulot', 'Külot', 'Briefs', 'ic'], ['sutyen', 'Sütyen', 'Bra', 'ic'], ['corap', 'Çorap', 'Socks', 'ic'], ['kulotlu', 'Külotlu çorap', 'Tights', 'ic']
];
const KAT = Object.fromEntries(TURLER.map(x => [x[0], x[3]]));
const RENKLER = [['siyah', 'Siyah'], ['beyaz', 'Beyaz'], ['gri', 'Gri'], ['lacivert', 'Lacivert'], ['mavi', 'Mavi'], ['kirmizi', 'Kırmızı'], ['bordo', 'Bordo'], ['pembe', 'Pembe'], ['mor', 'Mor'],
  ['yesil', 'Yeşil'], ['haki', 'Haki'], ['sari', 'Sarı'], ['turuncu', 'Turuncu'], ['kahve', 'Kahverengi'], ['bej', 'Bej'], ['krem', 'Krem']];

// Commons kategorisi → beklenen tür(ler) (ilk kabul edilen; sonrakiler de doğru sayılır)
const KUME = [
  ['Jeans', ['kot']], ['Skirts', ['etek', 'uzunetek']], ['Dresses', ['elbise', 'uzunelbise']], ['T-shirts', ['tisort']], ['Sweaters', ['kazak', 'sweat']],
  ['Cardigans', ['hirka']], ['Hoodies', ['sweat']], ['Blazers', ['blazer']], ['Trench coats', ['tren']], ['Overcoats', ['kaban', 'tren']], ['Down jackets', ['mont']],
  ['Leather jackets', ['ceket']], ['Sneakers', ['spor']], ['High-heeled shoes', ['topuklu']], ['Boots', ['bot']], ['Sandals', ['sandalet', 'terlik']],
  ['Ballet flats', ['babet']], ['Loafers', ['loafer']], ['Handbags', ['canta']], ['Scarves', ['atki', 'esarp']], ['Leggings', ['tayt']], ['Shorts', ['sort']],
  ['Jumpsuits', ['tulum']], ['Blouses', ['bluz', 'gomlek']], ['Dress shirts', ['gomlek']], ['Sunglasses', ['gozluk']], ['Necklaces', ['kolye']], ['Hijab', ['esarp']]
];
const KAC = Number(process.env.OLC_KAC || 3);

async function commons(kat) {
  const u = 'https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=categorymembers&gcmtype=file&gcmlimit=25&gcmtitle=' +
    encodeURIComponent('Category:' + kat) + '&prop=imageinfo&iiprop=url|mime|size&iiurlwidth=900';
  const r = await fetch(u, { headers: { 'User-Agent': 'KombinleOlcum/1.0 (github.com/aliyuksekal/kombinle)' } });
  if (!r.ok) { console.log('commons', kat, r.status); return []; }
  await new Promise(c => setTimeout(c, 400));
  const v = await r.json().catch(() => null);
  const sayfalar = v && v.query && v.query.pages ? Object.values(v.query.pages) : [];
  return sayfalar.map(p => p.imageinfo && p.imageinfo[0]).filter(i => i && /image\/(jpeg|png)/.test(i.mime) && i.thumburl && i.width >= 300 && i.height >= 300).slice(0, KAC).map(i => i.thumburl);
}
async function indir(url) {
  const r = await fetch(url, { headers: { 'User-Agent': 'KombinleOlcum/1.0 (github.com/aliyuksekal/kombinle)' } });
  if (!r.ok) return null;
  const b = Buffer.from(await r.arrayBuffer());
  return b.length > 1000 && b.length < 1.4 * 1024 * 1024 ? b.toString('base64') : null;
}
async function yeniTani(b64) {
  const govde = JSON.stringify({ resim: b64, turler: TURLER, renkler: RENKLER, dil: 'tr' });
  const zaman = String(Date.now()), cihaz = 'a'.repeat(64);
  const imza = createHmac('sha256', ANAHTAR).update(cihaz + '.' + zaman + '.' + createHash('sha256').update(govde).digest('hex')).digest('hex');
  const r = await isci.fetch(new Request('https://x/v1/tani', { method: 'POST', body: govde, headers: { 'X-Cihaz': cihaz, 'X-Zaman': zaman, 'X-Imza': imza, 'CF-Connecting-IP': '1.1.1.1' } }), env, {});
  const v = await r.json();
  return v.ok ? v.sonuc : { hata: v.hata || r.status };
}
// önceki sürümün yönergesi (karşılaştırma için, aynı sınırlarla)
async function eskiTani(b64) {
  const ids = TURLER.map(x => x[0]);
  const sema = { type: 'object', properties: { kiyafet: { type: 'boolean' }, tur: { type: 'string', enum: ids }, alternatifler: { type: 'array', items: { type: 'string', enum: ids }, maxItems: 3 }, guven: { type: 'number' } }, required: ['kiyafet', 'tur', 'guven'] };
  const yonerge = 'Fotoğraftaki ana kıyafeti tanı. Birden fazla parça varsa en büyük/en öndeki parçayı seç.\nTürler (kimlik=ad): ' + TURLER.map(x => x[0] + '=' + x[1]).join(', ') +
    '\nFotoğrafta kıyafet yoksa kiyafet=false ve guven=0 ver. Emin değilsen guven değerini düşük tut.';
  try {
    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: yonerge }, { inlineData: { mimeType: 'image/jpeg', data: b64 } }] }],
        generationConfig: { responseMimeType: 'application/json', responseJsonSchema: sema, maxOutputTokens: 600, thinkingConfig: { thinkingLevel: 'low' } } }),
      signal: AbortSignal.timeout(40000)
    });
    const v = await r.json();
    if (v.error) return { hata: 'api:' + v.error.status + ':' + String(v.error.message).slice(0, 80) };
    const a = v.candidates && v.candidates[0];
    const yazi = a && a.content && a.content.parts ? a.content.parts.filter(p => !p.thought && p.text).map(p => p.text).join('') : '';
    try { return JSON.parse(yazi); } catch (e) { return { hata: 'yarim:' + (a && a.finishReason) }; }
  } catch (e) { return { hata: 'ag' }; }
}

// --- teşhis: anahtar hangi modellere erişebiliyor, basit bir çağrı ne döndürüyor ---
let teshis = '## Teşhis\n\n';
try {
  const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', { headers: { 'x-goog-api-key': GEMINI } });
  const v = await r.json().catch(() => ({}));
  const adlar = (v.models || []).map(m => m.name.replace('models/', '')).filter(n => /flash|pro/.test(n));
  teshis += '- Model listesi: HTTP ' + r.status + (v.error ? ' — ' + String(v.error.message).slice(0, 300) : '') + '\n- Erişilebilen flash/pro modelleri: ' + (adlar.join(', ') || 'yok') + '\n';
} catch (e) { teshis += '- Model listesi alınamadı: ' + e + '\n'; }
for (const model of ['gemini-3-flash-preview', 'gemini-flash-latest', 'gemini-2.5-flash']) {
  for (const dusunme of [{ thinkingLevel: 'low' }, null]) {
    try {
      const gc = { maxOutputTokens: 2000 }; if (dusunme) gc.thinkingConfig = dusunme;
      const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI },
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'Say OK' }] }], generationConfig: gc }) });
      const t = await r.text();
      let m = ''; try { const j = JSON.parse(t); m = j.error ? j.error.status + ': ' + j.error.message : (j.candidates && j.candidates[0] && j.candidates[0].finishReason) || 'aday yok'; } catch (e) { m = t.slice(0, 200); }
      teshis += '- ' + model + (dusunme ? ' (thinkingLevel)' : ' (düşünme ayarsız)') + ': HTTP ' + r.status + ' — ' + String(m).slice(0, 300) + '\n';
    } catch (e) { teshis += '- ' + model + ': ' + e + '\n'; }
  }
}
console.log(teshis);

const ornekler = [];
for (const [kat, bek] of KUME) {
  const l = await commons(kat).catch(() => []);
  for (const u of l) ornekler.push({ kat, bek, u });
}
console.log('örnek sayısı:', ornekler.length);
const sonuc = [];
let sira = 0;
async function isle() {
  while (sira < ornekler.length) {
    const o = ornekler[sira++];
    const b64 = await indir(o.u).catch(() => null);
    if (!b64) continue;
    const [y, e] = await Promise.all([yeniTani(b64).catch(x => ({ hata: String(x) })), eskiTani(b64)]);
    sonuc.push({ ...o, y, e });
    console.log(o.kat.padEnd(18), 'yeni:', y.tur || y.hata, (y.guven || 0).toFixed?.(2) || '', '| eski:', e.tur || e.hata);
  }
}
await Promise.all([isle(), isle(), isle(), isle()]);

function puan(anahtar) {
  let n = 0, dogru = 0, ilk3 = 0, grup = 0, hata = 0;
  for (const s of sonuc) {
    const r = s[anahtar]; n++;
    if (!r || !r.tur) { hata++; continue; }
    if (s.bek.indexOf(r.tur) >= 0) dogru++;
    if ([r.tur].concat(r.alternatifler || []).some(x => s.bek.indexOf(x) >= 0)) ilk3++;
    if (KAT[r.tur] === KAT[s.bek[0]]) grup++;
  }
  const y = x => n ? Math.round(100 * x / n) + '%' : '-';
  return { n, dogru: y(dogru), ilk3: y(ilk3), grup: y(grup), hata: y(hata) };
}
const Y = puan('y'), E = puan('e');
let md = '# Kıyafet tanıma ölçümü\n\n' + teshis + '\n' + new Date().toISOString() + ' — ' + sonuc.length + ' gerçek fotoğraf (Wikimedia Commons, ' + KUME.length + ' kategori)\n\n' +
  '| | Doğru tür | İlk 3 içinde | Doğru grup | Yanıt alınamadı |\n|---|---|---|---|---|\n' +
  '| **Yeni (iki aşamalı)** | ' + Y.dogru + ' | ' + Y.ilk3 + ' | ' + Y.grup + ' | ' + Y.hata + ' |\n' +
  '| Eski | ' + E.dogru + ' | ' + E.ilk3 + ' | ' + E.grup + ' | ' + E.hata + ' |\n\n' +
  'Not: Commons kategorileri gürültülüdür (ör. birden çok parça içeren fotoğraflar); yüzdeler yaklaşıktır.\n\n| Kategori | Beklenen | Yeni | Eski |\n|---|---|---|---|\n' +
  sonuc.map(s => '| ' + s.kat + ' | ' + s.bek.join('/') + ' | ' + (s.y.tur ? s.y.tur + ' (' + Math.round((s.y.guven || 0) * 100) + '%)' : '⚠ ' + s.y.hata) + ' | ' + (s.e.tur || '⚠ ' + s.e.hata) + ' |').join('\n') + '\n';
writeFileSync(process.env.OLC_CIKTI || 'TANIMA.md', md);
console.log(md.split('\n').slice(0, 8).join('\n'));
