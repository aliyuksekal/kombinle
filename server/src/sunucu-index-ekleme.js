/* =========================================================
   SUNUCU EKLEMESİ — server/src/index.js
   Bu dosya kendi başına çalışmaz; index.js İÇİNE iki yere
   yapıştırılacak parçaları içerir.

   1) PARÇA: yönlendirme switch'ine 2 satır.
      Yer: `case 'kisiler':` satırının HEMEN ALTINA ekle.
      (Desen /v1/([a-z]{2,10}) olduğundan 'kisara' ve
      'kayitlar' adları uygundur; kota anahtarları mevcut
      kovanları kullanır: kisi_ip ve yonetim.)

   2) PARÇA: iki fonksiyon.
      Yer: dosyanın SONUNA, son fonksiyonun altına ekle.
   ========================================================= */


/* ================= 1) PARÇA: switch'e 2 satır =================
   case 'kisiler': ... satırının altına ekle:
   ============================================================ */
// case 'kisara': await kotaDus(env, ['kisi_ip:' + ip]); return json(await kisiAra(env, govde, hesap));
// case 'kayitlar': hesapGerek(); await kotaDus(env, ['yonetim:' + cihaz]); return json(await kayitlar(env, govde, hesap));


/* ================= 2) PARÇA: fonksiyonlar =================
   (Aşağıdaki yorum satırlarındaki // işaretlerini kaldır)
   ============================================================ */

// /* Keşfet'te kişi arama: takma ad / kullanıcı adı içeren arama */
// async function kisiAra(env, g, hesap) {
//   const q = metin(g.q, 30);
//   if (q.length < 2) return { ok: true, liste: [] };
//   const ben = hesap ? hesap.kimlik.slice(0, 12) : '';
//   const p = '%' + q.replace(/[%_]/g, '') + '%';
//   const { results } = await env.DB.prepare(
//     "SELECT p.kod, p.takma, p.kadi, p.bio, " +
//     "(SELECT 1 FROM avatar a WHERE a.kod = p.kod) AS av, " +
//     "(SELECT 1 FROM takip t WHERE t.takipci = ? AND t.takip = p.kod) AS takipte " +
//     "FROM profil p WHERE (p.takma LIKE ? OR p.kadi LIKE ?) ORDER BY p.takma LIMIT 25"
//   ).bind(ben, p, p).all();
//   return { ok: true, liste: (results || []).map(r => ({ kod: r.kod, takma: r.takma, kadi: r.kadi, bio: r.bio || '', av: r.av ? 1 : 0, takipte: r.takipte ? 1 : 0 })) };
// }

// /* Geliştirici: kayıt olan tüm hesaplar (yalnız @admin görür) */
// async function kayitlar(env, g, hesap) {
//   if (hesap.kadi !== 'admin') throw new Hata('yetki', 403);
//   const sonra = sayi(g.sonra, 0, 9e15, 0);
//   const { results } = await env.DB.prepare(
//     "SELECT eposta, ad, kadi, zaman, kilit FROM hesap" + (sonra ? " WHERE zaman < ?" : "") + " ORDER BY zaman DESC LIMIT 100"
//   ).bind(sonra || 0).all();
//   const liste = results || [];
//   /* profil bağlantısı: kadi üzerinden (kırılgan birleştirme yok) */
//   const kadilar = liste.map(x => x.kadi).filter(Boolean);
//   const pr = {};
//   if (kadilar.length) {
//     const p = await env.DB.prepare("SELECT kod, takma, kadi, (SELECT 1 FROM avatar a WHERE a.kod = kod) AS av FROM profil WHERE kadi IN (" + kadilar.map(() => '?').join(',') + ")").bind(...kadilar).all();
//     (p.results || []).forEach(r => { pr[r.kadi] = r; });
//   }
//   return {
//     ok: true,
//     liste: liste.map(x => {
//       const r = pr[x.kadi] || {};
//       return { eposta: x.eposta, ad: x.ad, kadi: x.kadi, takma: r.takma || '', kod: r.kod || '', av: r.av ? 1 : 0, zaman: x.zaman, kilit: x.kilit > Date.now() ? 1 : 0 };
//     }),
//     bitti: liste.length < 100,
//     sonra: liste.length ? liste[liste.length - 1].zaman : 0
//   };
// }
