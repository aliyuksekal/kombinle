package com.benim.kombinle;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.util.Base64;
import android.webkit.JavascriptInterface;

import com.google.mlkit.vision.common.InputImage;
import com.google.mlkit.vision.label.ImageLabel;
import com.google.mlkit.vision.label.ImageLabeler;
import com.google.mlkit.vision.label.ImageLabeling;
import com.google.mlkit.vision.label.defaults.ImageLabelerOptions;
import com.google.mlkit.vision.segmentation.subject.SubjectSegmentation;
import com.google.mlkit.vision.segmentation.subject.SubjectSegmenter;
import com.google.mlkit.vision.segmentation.subject.SubjectSegmenterOptions;

import java.io.ByteArrayOutputStream;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Sayfa ile telefon arasındaki köprü (window.KombinleNative).
 * Yalnızca uygulamanın kendi sayfası (appassets) açıkken çalışır; yanıtlar
 * sayfaya 'kbyerel' olayıyla döner: detail = {req, ok, ...}
 */
public final class Kopru {

    private static final int EN_FAZLA_RESIM = 4 * 1024 * 1024;   // etiketleme için base64 sınırı
    private static final int EN_FAZLA_DOSYA = 150 * 1024 * 1024; // yedek dosyası sınırı

    /* aynı anda en fazla 4 ağ isteği: sayfa ne kadar çağırırsa çağırsın telefon yorulmaz */
    private static final java.util.concurrent.ExecutorService AG = java.util.concurrent.Executors.newFixedThreadPool(4);

    private final AnaEkran ekran;
    private final Odeme odeme;
    private ImageLabeler etiketleyici;
    private SubjectSegmenter ayirici;
    volatile boolean guvenli = false;

    Kopru(AnaEkran ekran) {
        this.ekran = ekran;
        this.odeme = new Odeme(ekran, this);
        this.odeme.baslat();
    }

    private static boolean istekGecerli(String r) {
        return r != null && r.length() <= 24 && r.matches("[a-z0-9]+");
    }

    /* ---------------- genel ---------------- */

    @JavascriptInterface
    public String surum() {
        return guvenli ? ekran.surum() : "";
    }

    @JavascriptInterface
    public void cubuk(final boolean koyu) {
        if (!guvenli) return;
        ekran.ui.post(() -> ekran.cubuklariAyarla(koyu));
    }

    /* ---------------- konum ---------------- */

    @JavascriptInterface
    public void konum(final String req) {
        if (!guvenli || !istekGecerli(req)) return;
        ekran.ui.post(() -> ekran.konumBaslat(req));
    }

    @JavascriptInterface
    public void konumAyarlari() {
        if (!guvenli) return;
        ekran.ui.post(ekran::konumAyarlariAc);
    }

    /* ---------------- ses ---------------- */

    @JavascriptInterface
    public void dinle(final String req, final String dil) {
        if (!guvenli || !istekGecerli(req)) return;
        final String d = dil != null && dil.matches("[a-zA-Z-]{2,10}") ? dil : "tr-TR";
        ekran.ui.post(() -> ekran.sesBaslat(req, d));
    }

    /* ---------------- görüntü etiketleme (ML Kit, cihaz içi) ---------------- */

    @JavascriptInterface
    public void etiketle(final String req, final String b64) {
        if (!guvenli || !istekGecerli(req)) return;
        if (b64 == null || b64.isEmpty() || b64.length() > EN_FAZLA_RESIM) {
            gonder(req, false, "hata", "boyut");
            return;
        }
        new Thread(() -> {
            try {
                byte[] veri = Base64.decode(b64, Base64.DEFAULT);
                BitmapFactory.Options o = new BitmapFactory.Options();
                o.inJustDecodeBounds = true;
                BitmapFactory.decodeByteArray(veri, 0, veri.length, o);
                if (o.outWidth <= 0 || o.outHeight <= 0 || o.outWidth > 4096 || o.outHeight > 4096) {
                    gonder(req, false, "hata", "olcu");
                    return;
                }
                o.inJustDecodeBounds = false;
                Bitmap bmp = BitmapFactory.decodeByteArray(veri, 0, veri.length, o);
                if (bmp == null) {
                    gonder(req, false, "hata", "coz");
                    return;
                }
                synchronized (this) {
                    if (etiketleyici == null) {
                        etiketleyici = ImageLabeling.getClient(new ImageLabelerOptions.Builder().setConfidenceThreshold(0.3f).build());
                    }
                }
                etiketleyici.process(InputImage.fromBitmap(bmp, 0))
                        .addOnSuccessListener(etiketler -> {
                            JSONArray a = new JSONArray();
                            try {
                                for (ImageLabel l : etiketler) {
                                    JSONObject j = new JSONObject();
                                    j.put("t", l.getText());
                                    j.put("c", Math.round(l.getConfidence() * 100) / 100.0);
                                    a.put(j);
                                }
                            } catch (Exception ignored) {
                            }
                            gonder(req, true, "etiketler", a);
                        })
                        .addOnFailureListener(e -> gonder(req, false, "hata", "model"));
            } catch (Throwable t) {
                gonder(req, false, "hata", "coz");
            }
        }).start();
    }

    /* ---------------- arka plan silme (ML Kit konu ayırma) ---------------- */

    @JavascriptInterface
    public void arkaSil(final String req, final String b64) {
        if (!guvenli || !istekGecerli(req)) return;
        if (b64 == null || b64.isEmpty() || b64.length() > 8 * 1024 * 1024) {
            gonder(req, false, "hata", "boyut");
            return;
        }
        new Thread(() -> {
            try {
                byte[] veri = Base64.decode(b64, Base64.DEFAULT);
                BitmapFactory.Options o = new BitmapFactory.Options();
                o.inJustDecodeBounds = true;
                BitmapFactory.decodeByteArray(veri, 0, veri.length, o);
                if (o.outWidth <= 0 || o.outHeight <= 0 || o.outWidth > 4096 || o.outHeight > 4096) {
                    gonder(req, false, "hata", "olcu");
                    return;
                }
                o.inJustDecodeBounds = false;
                Bitmap bmp = BitmapFactory.decodeByteArray(veri, 0, veri.length, o);
                if (bmp == null) {
                    gonder(req, false, "hata", "coz");
                    return;
                }
                synchronized (this) {
                    if (ayirici == null) {
                        ayirici = SubjectSegmentation.getClient(new SubjectSegmenterOptions.Builder().enableForegroundBitmap().build());
                    }
                }
                ayirici.process(InputImage.fromBitmap(bmp, 0))
                        .addOnSuccessListener(sonuc -> new Thread(() -> {
                            try {
                                Bitmap on = sonuc.getForegroundBitmap();
                                if (on == null) {
                                    gonder(req, false, "hata", "bos");
                                    return;
                                }
                                ByteArrayOutputStream cikti = new ByteArrayOutputStream();
                                on.compress(Bitmap.CompressFormat.PNG, 100, cikti);
                                gonder(req, true, "png", Base64.encodeToString(cikti.toByteArray(), Base64.NO_WRAP));
                            } catch (Throwable t) {
                                gonder(req, false, "hata", "png");
                            }
                        }).start())
                        .addOnFailureListener(e -> gonder(req, false, "hata", "model"));
            } catch (Throwable t) {
                gonder(req, false, "hata", "coz");
            }
        }).start();
    }

    /* ---------------- Kombinle sunucusu (yapay zekâ, topluluk) ---------------- */

    @JavascriptInterface
    public boolean yzVar() {
        return guvenli && Sunucu.hazir();
    }

    /** Yalnızca paylaşım görsellerini göstermek için; anahtar içermez. */
    @JavascriptInterface
    public String sunucu() {
        return guvenli && Sunucu.hazir() ? Sunucu.ADRES : "";
    }

    @JavascriptInterface
    public void api(final String req, final String yol, final String govde) {
        if (!guvenli || !istekGecerli(req)) return;
        if (!Sunucu.hazir()) { gonder(req, false, "hata", "kurulu-degil"); return; }
        if (!Sunucu.yolGecerli(yol) || !Sunucu.govdeGecerli(govde)) { gonder(req, false, "hata", "girdi"); return; }
        AG.execute(() -> {
            try {
                JSONObject s = Sunucu.gonder(ekran.getApplicationContext(), yol, govde);
                int durum = s.optInt("durum");
                JSONObject o = new JSONObject();
                o.put("req", req);
                o.put("ok", durum >= 200 && durum < 300);
                o.put("durum", durum);
                o.put("veri", s.optJSONObject("veri"));
                gonder(o);
            } catch (Throwable t) {
                gonder(req, false, "hata", "ag");
            }
        });
    }

    /* ---------------- dosya kaydetme ---------------- */

    @JavascriptInterface
    public void dosyaKaydet(final String req, final String ad, final String tur, final String b64) {
        if (!guvenli || !istekGecerli(req)) return;
        if (b64 == null || b64.length() > EN_FAZLA_DOSYA) {
            gonder(req, false, "hata", "boyut");
            return;
        }
        final String temizAd = ad == null ? "kombinle.json" : ad.replaceAll("[^A-Za-z0-9._-]", "_");
        final String temizTur = "application/json".equals(tur) ? tur : "application/octet-stream";
        byte[] veri;
        try {
            veri = Base64.decode(b64, Base64.DEFAULT);
        } catch (Exception e) {
            gonder(req, false, "hata", "coz");
            return;
        }
        final byte[] v = veri;
        ekran.ui.post(() -> ekran.kaydetBaslat(req, temizAd, temizTur, v));
    }

    /* ---------------- satın alma ---------------- */

    @JavascriptInterface
    public void odemeSorgula(final String req, final String idler) {
        if (!guvenli || !istekGecerli(req)) return;
        odeme.sorgula(req, idler);
    }

    @JavascriptInterface
    public void odemeAl(final String req, final String id) {
        if (!guvenli || !istekGecerli(req)) return;
        ekran.ui.post(() -> odeme.al(req, id));
    }

    @JavascriptInterface
    public String odemeSahip() {
        return guvenli ? odeme.sahipJson() : "[]";
    }

    @JavascriptInterface
    public int jetonTeslim() {
        return guvenli ? odeme.jetonTeslim() : 0;
    }

    @JavascriptInterface
    public void odemeGeriYukle(final String req) {
        if (!guvenli || !istekGecerli(req)) return;
        odeme.geriYukle(req);
    }

    /* ---------------- sayfaya yanıt ---------------- */

    void gonder(String req, boolean ok, String anahtar, Object deger) {
        JSONObject o = new JSONObject();
        try {
            o.put("req", req);
            o.put("ok", ok);
            if (anahtar != null) o.put(anahtar, deger);
        } catch (Exception ignored) {
        }
        gonder(o);
    }

    void gonder(JSONObject detay) {
        final String js = "window.dispatchEvent(new CustomEvent('kbyerel',{detail:" + detay + "}))";
        ekran.ui.post(() -> {
            try {
                if (ekran.web != null) ekran.web.evaluateJavascript(js, null);
            } catch (Throwable ignored) {
            }
        });
    }

    void kapat() {
        odeme.kapat();
        try {
            if (etiketleyici != null) etiketleyici.close();
            if (ayirici != null) ayirici.close();
        } catch (Throwable ignored) {
        }
    }
}
