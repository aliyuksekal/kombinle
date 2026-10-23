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
  zaman INTEGER NOT NULL
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
