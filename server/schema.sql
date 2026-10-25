-- Kombinle sunucusu veritabanı (Cloudflare D1). Tekrar çalıştırılabilir.
CREATE TABLE IF NOT EXISTS paylasim (
  id TEXT PRIMARY KEY,
  yazar TEXT NOT NULL,
  takma TEXT NOT NULL,
  aciklama TEXT NOT NULL DEFAULT '',
  etiket TEXT NOT NULL DEFAULT '[]',
  resim BLOB NOT NULL,
  tip TEXT NOT NULL,
  begeni INTEGER NOT NULL DEFAULT 0,
  begenmeme INTEGER NOT NULL DEFAULT 0,
  sikayet INTEGER NOT NULL DEFAULT 0,
  gizli INTEGER NOT NULL DEFAULT 0,
  zaman INTEGER NOT NULL,
  gorunurluk TEXT NOT NULL DEFAULT 'herkes',
  yorum_sayisi INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS p_yeni ON paylasim(gizli, zaman DESC);
CREATE INDEX IF NOT EXISTS p_yazar ON paylasim(yazar, zaman DESC);
CREATE TABLE IF NOT EXISTS oy (
  paylasim TEXT NOT NULL,
  cihaz TEXT NOT NULL,
  deger INTEGER NOT NULL,
  PRIMARY KEY (paylasim, cihaz)
);
CREATE TABLE IF NOT EXISTS sikayet (
  paylasim TEXT NOT NULL,
  cihaz TEXT NOT NULL,
  neden TEXT NOT NULL,
  zaman INTEGER NOT NULL,
  PRIMARY KEY (paylasim, cihaz)
);
CREATE TABLE IF NOT EXISTS kota (
  anahtar TEXT NOT NULL,
  gun TEXT NOT NULL,
  sayi INTEGER NOT NULL,
  PRIMARY KEY (anahtar, gun)
);
CREATE TABLE IF NOT EXISTS engelli (
  cihaz TEXT PRIMARY KEY,
  zaman INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS profil (
  kod TEXT PRIMARY KEY,
  takma TEXT NOT NULL,
  zaman INTEGER NOT NULL,
  kadi TEXT NOT NULL DEFAULT '',
  bio TEXT NOT NULL DEFAULT '',
  hesapli INTEGER NOT NULL DEFAULT 0,
  acik INTEGER NOT NULL DEFAULT 0,
  dm_izin TEXT NOT NULL DEFAULT 'herkes'
);
CREATE INDEX IF NOT EXISTS pr_takma ON profil(takma);
CREATE TABLE IF NOT EXISTS takip (
  takipci TEXT NOT NULL,
  takip TEXT NOT NULL,
  zaman INTEGER NOT NULL,
  PRIMARY KEY (takipci, takip)
);
CREATE INDEX IF NOT EXISTS t_takip ON takip(takip);
-- takip istekleri: hesap herkese açık değilse takip önce istek olarak gider
CREATE TABLE IF NOT EXISTS takip_istek (
  isteyen TEXT NOT NULL,
  hedef TEXT NOT NULL,
  zaman INTEGER NOT NULL,
  PRIMARY KEY (isteyen, hedef)
);
CREATE INDEX IF NOT EXISTS ti_hedef ON takip_istek(hedef);
CREATE TABLE IF NOT EXISTS yorum (
  id TEXT PRIMARY KEY,
  paylasim TEXT NOT NULL,
  yazar TEXT NOT NULL,
  takma TEXT NOT NULL,
  metin TEXT NOT NULL,
  zaman INTEGER NOT NULL,
  sikayet INTEGER NOT NULL DEFAULT 0,
  gizli INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS y_paylasim ON yorum(paylasim, zaman);
CREATE TABLE IF NOT EXISTS yorum_sikayet (
  yorum TEXT NOT NULL,
  cihaz TEXT NOT NULL,
  PRIMARY KEY (yorum, cihaz)
);
CREATE TABLE IF NOT EXISTS hesap (
  id TEXT PRIMARY KEY,
  eposta TEXT NOT NULL UNIQUE,
  ad TEXT NOT NULL,
  tuz TEXT NOT NULL,
  ozet TEXT NOT NULL,
  kurtarma TEXT NOT NULL,
  zaman INTEGER NOT NULL,
  hatali INTEGER NOT NULL DEFAULT 0,
  kilit INTEGER NOT NULL DEFAULT 0,
  kadi TEXT,
  bio TEXT NOT NULL DEFAULT '',
  sifirla_ozet TEXT NOT NULL DEFAULT '',
  sifirla_zaman INTEGER NOT NULL DEFAULT 0,
  kod TEXT NOT NULL DEFAULT '',
  cihaz TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS h_kod ON hesap(kod);
CREATE INDEX IF NOT EXISTS h_cihaz ON hesap(cihaz);
CREATE TABLE IF NOT EXISTS bakim (
  ad TEXT PRIMARY KEY,
  zaman INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS h_kadi ON hesap(kadi);
CREATE TABLE IF NOT EXISTS oturum (
  ozet TEXT PRIMARY KEY,
  hesap TEXT NOT NULL,
  zaman INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS o_hesap ON oturum(hesap);
CREATE TABLE IF NOT EXISTS avatar (
  kod TEXT PRIMARY KEY,
  resim BLOB NOT NULL,
  tip TEXT NOT NULL,
  zaman INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS reklam (
  id TEXT PRIMARY KEY,
  marka TEXT NOT NULL,
  baslik TEXT NOT NULL DEFAULT '',
  metin TEXT NOT NULL DEFAULT '',
  link TEXT NOT NULL DEFAULT '',
  dugme TEXT NOT NULL DEFAULT '',
  boyut TEXT NOT NULL DEFAULT 'kare',
  resim BLOB NOT NULL,
  tip TEXT NOT NULL,
  zaman INTEGER NOT NULL,
  bitis INTEGER NOT NULL,
  aktif INTEGER NOT NULL DEFAULT 1,
  gosterim INTEGER NOT NULL DEFAULT 0,
  tik INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS r_aktif ON reklam(aktif, bitis);
CREATE TABLE IF NOT EXISTS bildirim (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  alici TEXT NOT NULL,
  tur TEXT NOT NULL,
  kimden TEXT NOT NULL,
  paylasim TEXT NOT NULL DEFAULT '',
  metin TEXT NOT NULL DEFAULT '',
  zaman INTEGER NOT NULL,
  okundu INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS b_alici ON bildirim(alici, zaman DESC);
CREATE UNIQUE INDEX IF NOT EXISTS b_tekil ON bildirim(alici, tur, kimden, paylasim) WHERE tur <> 'yorum';
CREATE TABLE IF NOT EXISTS kayitli (
  kisi TEXT NOT NULL,
  paylasim TEXT NOT NULL,
  zaman INTEGER NOT NULL,
  PRIMARY KEY (kisi, paylasim)
);
CREATE TABLE IF NOT EXISTS kisi_sikayet (
  kod TEXT NOT NULL,
  cihaz TEXT NOT NULL,
  neden TEXT NOT NULL,
  zaman INTEGER NOT NULL,
  PRIMARY KEY (kod, cihaz)
);
CREATE TABLE IF NOT EXISTS pro_hediye (
  hesap TEXT PRIMARY KEY,
  bitis INTEGER NOT NULL,
  zaman INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS anket (
  id TEXT PRIMARY KEY,
  yazar TEXT NOT NULL,
  takma TEXT NOT NULL,
  soru TEXT NOT NULL DEFAULT '',
  resim_a BLOB NOT NULL,
  tip_a TEXT NOT NULL,
  resim_b BLOB NOT NULL,
  tip_b TEXT NOT NULL,
  oy_a INTEGER NOT NULL DEFAULT 0,
  oy_b INTEGER NOT NULL DEFAULT 0,
  zaman INTEGER NOT NULL,
  gorunurluk TEXT NOT NULL DEFAULT 'herkes',
  gizli INTEGER NOT NULL DEFAULT 0,
  sikayet INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS an_zaman ON anket(zaman DESC);
CREATE INDEX IF NOT EXISTS an_yazar ON anket(yazar, zaman DESC);
CREATE TABLE IF NOT EXISTS anket_oy (
  anket TEXT NOT NULL,
  cihaz TEXT NOT NULL,
  secim TEXT NOT NULL,
  zaman INTEGER NOT NULL,
  PRIMARY KEY (anket, cihaz)
);
CREATE TABLE IF NOT EXISTS anket_sikayet (
  anket TEXT NOT NULL,
  cihaz TEXT NOT NULL,
  PRIMARY KEY (anket, cihaz)
);
CREATE TABLE IF NOT EXISTS konusma (
  id TEXT PRIMARY KEY,
  a TEXT NOT NULL,
  b TEXT NOT NULL,
  son INTEGER NOT NULL,
  son_metin TEXT NOT NULL DEFAULT '',
  son_kim TEXT NOT NULL DEFAULT '',
  istek TEXT NOT NULL DEFAULT '',
  a_sil INTEGER NOT NULL DEFAULT 0,
  b_sil INTEGER NOT NULL DEFAULT 0,
  a_yaz INTEGER NOT NULL DEFAULT 0,
  b_yaz INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS k_a ON konusma(a, son DESC);
CREATE INDEX IF NOT EXISTS k_b ON konusma(b, son DESC);
CREATE TABLE IF NOT EXISTS mesaj (
  id TEXT PRIMARY KEY,
  konusma TEXT NOT NULL,
  gonderen TEXT NOT NULL,
  alici TEXT NOT NULL,
  metin TEXT NOT NULL,
  zaman INTEGER NOT NULL,
  okundu INTEGER NOT NULL DEFAULT 0,
  teslim INTEGER NOT NULL DEFAULT 0,
  silindi INTEGER NOT NULL DEFAULT 0,
  tepki TEXT NOT NULL DEFAULT '',
  yanit_id TEXT NOT NULL DEFAULT '',
  yanit_metin TEXT NOT NULL DEFAULT '',
  yanit_kim TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS m_konusma ON mesaj(konusma, zaman DESC);
CREATE INDEX IF NOT EXISTS m_alici ON mesaj(alici, okundu);
CREATE TABLE IF NOT EXISTS dm_engel (
  engelleyen TEXT NOT NULL,
  engellenen TEXT NOT NULL,
  zaman INTEGER NOT NULL,
  PRIMARY KEY (engelleyen, engellenen)
);
CREATE TABLE IF NOT EXISTS dm_sikayet (
  mesaj TEXT NOT NULL,
  cihaz TEXT NOT NULL,
  zaman INTEGER NOT NULL,
  PRIMARY KEY (mesaj, cihaz)
);
