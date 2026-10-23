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
  bio TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS pr_takma ON profil(takma);
CREATE TABLE IF NOT EXISTS takip (
  takipci TEXT NOT NULL,
  takip TEXT NOT NULL,
  zaman INTEGER NOT NULL,
  PRIMARY KEY (takipci, takip)
);
CREATE INDEX IF NOT EXISTS t_takip ON takip(takip);
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
  bio TEXT NOT NULL DEFAULT ''
);
CREATE UNIQUE INDEX IF NOT EXISTS h_kadi ON hesap(kadi);
CREATE TABLE IF NOT EXISTS oturum (
  ozet TEXT PRIMARY KEY,
  hesap TEXT NOT NULL,
  zaman INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS o_hesap ON oturum(hesap);
