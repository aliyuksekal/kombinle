package com.benim.kombinle;

import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.regex.Pattern;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import javax.net.ssl.HttpsURLConnection;

/**
 * Kombinle sunucusu ile imzalı HTTPS haberleşmesi.
 * Adres ve uygulama anahtarı derlemede (GitHub Actions) eklenir; sayfa bunları görmez.
 * Yapay zekâ anahtarı uygulamada hiç yoktur, yalnızca sunucudadır.
 */
final class Sunucu {

    static final String ADRES = BuildConfig.SUNUCU;
    private static final String ANAHTAR = BuildConfig.UYGULAMA_ANAHTARI;
    private static final Pattern YOL = Pattern.compile("/v1/(tani|kombin|analiz|paylas|akis|oy|sikayet|sil|sohbet|yorumlar|yorum|yorumsil|ysikayet|takip|kisiler|kayit|giris|sifre|cikis|ben|hesapsil|profil|kadi|ata|avatar|reklamlar|reklamsay|reklamekle|reklamsil|bildirim|kaydet|profilgor|takipler|duzenle|ksikayet|proata|prolar|renk|anket|anketler|anketoy|anketsil|aksikayet|dmliste|dmoku|dmyaz|dmkabul|dmsil|dmengel|dmsikayet|yonetim|durum|kodgonder|kodsifirla|ses|istekler|istekyanit|gizlilik|dmtepki|dmmsil|dmyaziyor|onecikar|rtarife|rtalep|rtalepler|rtiptal|rtyonetim|rtkarar|siparis|merhaba|olcum|geribildir|gbliste|hata|hataliste)");
    private static final int EN_FAZLA_GOVDE = 3 * 1024 * 1024;
    private static final int EN_FAZLA_YANIT = 8 * 1024 * 1024;   // doğal ses yanıtı (WAV) birkaç MB olabilir
    private static volatile long saatFarki = 0;

    private Sunucu() { }

    static boolean hazir() {
        return ADRES != null && ADRES.matches("https://[a-z0-9.-]{3,120}") && ANAHTAR != null && ANAHTAR.matches("[a-f0-9]{64}");
    }

    static boolean yolGecerli(String yol) {
        return yol != null && YOL.matcher(yol).matches();
    }

    static boolean govdeGecerli(String govde) {
        return govde != null && govde.length() <= EN_FAZLA_GOVDE;
    }

    /** Uygulamaya özel rastgele kimlik (ad, hesap ya da donanım bilgisi içermez). */
    private static synchronized String cihaz(Context c) {
        SharedPreferences a = c.getSharedPreferences("sunucu", Context.MODE_PRIVATE);
        String k = a.getString("cihaz", "");
        if (k.matches("[a-f0-9]{64}")) return k;
        byte[] b = new byte[32];
        new SecureRandom().nextBytes(b);
        k = hex(b);
        a.edit().putString("cihaz", k).apply();
        return k;
    }

    /* Hesap oturumu telefonda saklanır; sayfa belirteci bir kez verir, sonra istekler buradan eklenir */
    static void oturumYaz(Context c, String belirtec) {
        SharedPreferences a = c.getSharedPreferences("sunucu", Context.MODE_PRIVATE);
        if (belirtec != null && belirtec.matches("[a-f0-9]{64}")) a.edit().putString("oturum", belirtec).apply();
        else a.edit().remove("oturum").apply();
    }

    static boolean oturumVar(Context c) {
        return c.getSharedPreferences("sunucu", Context.MODE_PRIVATE).getString("oturum", "").matches("[a-f0-9]{64}");
    }

    private static String oturumEkle(Context c, String yol, String govde) {
        try {
            String o = c.getSharedPreferences("sunucu", Context.MODE_PRIVATE).getString("oturum", "");
            if (!o.matches("[a-f0-9]{64}") || yol.equals("/v1/kayit") || yol.equals("/v1/giris") || yol.equals("/v1/sifre")) return govde;
            JSONObject j = new JSONObject(govde);
            if (!j.has("oturum")) j.put("oturum", o);
            return j.toString();
        } catch (Exception e) {
            return govde;
        }
    }

    /** Arka planda çağrılmalı. Dönen nesne: {durum, veri} */
    static JSONObject gonder(Context c, String yol, String govde0) throws Exception {
        final String govde = oturumEkle(c, yol, govde0);
        JSONObject sonuc = istek(c, yol, govde);
        JSONObject veri = sonuc.optJSONObject("veri");
        // telefon saati çok yanlışsa sunucu saatine göre bir kez daha dene
        if (sonuc.optInt("durum") == 401 && veri != null && "saat".equals(veri.optString("hata")) && veri.optLong("zaman", 0) > 0) {
            saatFarki = veri.optLong("zaman") - System.currentTimeMillis();
            sonuc = istek(c, yol, govde);
        }
        // oturum geçersizse (şifre değişti, hesap silindi) telefondaki belirteç silinir
        JSONObject v2 = sonuc.optJSONObject("veri");
        if (sonuc.optInt("durum") == 401 && v2 != null && "oturum".equals(v2.optString("hata"))) oturumYaz(c, null);
        if ("/v1/cikis".equals(yol)) oturumYaz(c, null);
        return sonuc;
    }

    private static JSONObject istek(Context c, String yol, String govde) throws Exception {
        byte[] veri = govde.getBytes(StandardCharsets.UTF_8);
        String kimlik = cihaz(c);
        String zaman = String.valueOf(System.currentTimeMillis() + saatFarki);
        String imza = hmac(ANAHTAR, kimlik + "." + zaman + "." + hex(MessageDigest.getInstance("SHA-256").digest(veri)));

        HttpsURLConnection u = (HttpsURLConnection) new URL(ADRES + yol).openConnection();
        try {
            u.setConnectTimeout(12000);
            u.setReadTimeout(55000);
            u.setInstanceFollowRedirects(false);
            u.setUseCaches(false);
            u.setDoOutput(true);
            u.setRequestMethod("POST");
            u.setRequestProperty("Content-Type", "application/json; charset=utf-8");
            u.setRequestProperty("Accept", "application/json");
            u.setRequestProperty("User-Agent", "Kombinle/" + BuildConfig.VERSION_NAME);
            u.setRequestProperty("X-Cihaz", kimlik);
            u.setRequestProperty("X-Zaman", zaman);
            u.setRequestProperty("X-Imza", imza);
            u.setFixedLengthStreamingMode(veri.length);
            try (OutputStream o = u.getOutputStream()) {
                o.write(veri);
            }
            int durum = u.getResponseCode();
            InputStream girdi = durum < 400 ? u.getInputStream() : u.getErrorStream();
            String metin = "";
            if (girdi != null) {
                try (InputStream g = girdi) {
                    ByteArrayOutputStream b = new ByteArrayOutputStream();
                    byte[] tampon = new byte[8192];
                    int n;
                    while ((n = g.read(tampon)) > 0) {
                        if (b.size() + n > EN_FAZLA_YANIT) throw new IllegalStateException("buyuk");
                        b.write(tampon, 0, n);
                    }
                    metin = b.toString("UTF-8");
                }
            }
            JSONObject s = new JSONObject();
            s.put("durum", durum);
            try {
                s.put("veri", new JSONObject(metin));
            } catch (Exception e) {
                s.put("veri", new JSONObject().put("ok", false).put("hata", "yanit"));
            }
            return s;
        } finally {
            u.disconnect();
        }
    }

    private static String hmac(String anahtar, String metin) throws Exception {
        Mac m = Mac.getInstance("HmacSHA256");
        m.init(new SecretKeySpec(anahtar.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        return hex(m.doFinal(metin.getBytes(StandardCharsets.UTF_8)));
    }

    private static String hex(byte[] b) {
        StringBuilder s = new StringBuilder(b.length * 2);
        for (byte x : b) s.append(String.format("%02x", x & 0xff));
        return s.toString();
    }
}
