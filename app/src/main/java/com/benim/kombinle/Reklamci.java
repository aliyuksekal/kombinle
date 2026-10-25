package com.benim.kombinle;

import android.graphics.Color;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;

import com.google.android.gms.ads.AdListener;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.AdSize;
import com.google.android.gms.ads.AdView;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.MobileAds;
import com.google.android.ump.ConsentInformation;
import com.google.android.ump.ConsentRequestParameters;
import com.google.android.ump.UserMessagingPlatform;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

/**
 * Keşfet akışında AdMob reklamı (satır içi uyarlanabilir banner).
 * Sayfa, akıştaki reklam yuvalarının yerini (belge koordinatı, CSS px) bildirir; reklam görünümü WebView'in
 * üstünde tam o yuvaya yerleştirilir ve WebView kaydırıldıkça aynı karede birlikte kayar. Yuva gönderi
 * görseliyle aynı boyuttadır. Üst çubuk ve alt menünün altına taşan kısım kırpılır; bir sayfa açılınca gizlenir.
 * Reklam AdMob'un kendi görünümüdür: içeriği değiştirilmez, üstü kapatılmaz (politika gereği).
 * İzin (AB/BK kullanıcıları için) Google'ın UMP formuyla, ilk reklam yuvası göründüğünde sorulur.
 */
final class Reklamci {
    private static final int EN_FAZLA = 4;

    private final AnaEkran ekran;
    private final Kopru kopru;
    private final FrameLayout pencere;
    private final Map<String, Yuva> yuvalar = new HashMap<>();
    private ConsentInformation izin;
    private boolean izinSoruldu = false, baslatildi = false, hazir = false, gizli = true, kapali = false;
    private int ustPx = 0, altPx = 0;
    private JSONArray sonListe = new JSONArray();

    private static final class Yuva {
        AdView gorunum;
        float x, y, w, h;
        boolean yuklendi;
    }

    Reklamci(AnaEkran ekran, Kopru kopru, FrameLayout kok) {
        this.ekran = ekran;
        this.kopru = kopru;
        pencere = new FrameLayout(ekran);
        pencere.setClipChildren(true);
        pencere.setClipToPadding(true);
        pencere.setBackgroundColor(Color.TRANSPARENT);
        pencere.setVisibility(View.GONE);
        kok.addView(pencere, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        ekran.web.setOnScrollChangeListener((v, x, y, ex, ey) -> konumla());
    }

    private float yogunluk() {
        return ekran.getResources().getDisplayMetrics().density;
    }

    /* ------------------------------------------------------------ izin ve başlatma */

    private void izinIste() {
        if (izinSoruldu) return;
        izinSoruldu = true;
        try {
            izin = UserMessagingPlatform.getConsentInformation(ekran);
            ConsentRequestParameters p = new ConsentRequestParameters.Builder().build();
            izin.requestConsentInfoUpdate(ekran, p,
                    () -> UserMessagingPlatform.loadAndShowConsentFormIfRequired(ekran, hata -> {
                        if (izin.canRequestAds()) mobilBaslat();
                    }),
                    hata -> {
                        if (izin.canRequestAds()) mobilBaslat();
                    });
            if (izin.canRequestAds()) mobilBaslat();
        } catch (Throwable t) {
            kapali = true;
        }
    }

    private void mobilBaslat() {
        if (baslatildi) return;
        baslatildi = true;
        new Thread(() -> {
            try {
                MobileAds.initialize(ekran, d -> ekran.ui.post(() -> {
                    hazir = true;
                    uygula();
                }));
            } catch (Throwable t) {
                ekran.ui.post(() -> kapali = true);
            }
        }).start();
    }

    boolean gizlilikGerekli() {
        try {
            return izin != null && izin.getPrivacyOptionsRequirementStatus() == ConsentInformation.PrivacyOptionsRequirementStatus.REQUIRED;
        } catch (Throwable t) {
            return false;
        }
    }

    void gizlilikAc() {
        try {
            UserMessagingPlatform.showPrivacyOptionsForm(ekran, hata -> { });
        } catch (Throwable ignored) {
        }
    }

    /* ------------------------------------------------------------ yuvalar */

    /** Sayfadan: {gizli, ust, alt, liste:[{id, x, y, w, h}]} (CSS px, belge koordinatı). UI iş parçacığında çağrılır. */
    void yerler(JSONObject o) {
        gizli = o.optBoolean("gizli", true);
        ustPx = Math.max(0, o.optInt("ust", 0));
        altPx = Math.max(0, o.optInt("alt", 0));
        JSONArray l = o.optJSONArray("liste");
        sonListe = l == null ? new JSONArray() : l;
        if (sonListe.length() > 0) izinIste();
        uygula();
    }

    private void uygula() {
        float d = yogunluk();
        FrameLayout.LayoutParams lp = (FrameLayout.LayoutParams) pencere.getLayoutParams();
        if (lp.topMargin != (int) (ustPx * d) || lp.bottomMargin != (int) (altPx * d)) {
            lp.topMargin = (int) (ustPx * d);
            lp.bottomMargin = (int) (altPx * d);
            pencere.setLayoutParams(lp);
        }
        // listede olmayanlar ve ekrandan çok uzaktakiler kaldırılır
        int kaydir = ekran.web.getScrollY(), boy = Math.max(1, ekran.web.getHeight());
        Map<String, JSONObject> istenen = new HashMap<>();
        for (int i = 0; i < sonListe.length(); i++) {
            JSONObject y = sonListe.optJSONObject(i);
            if (y == null) continue;
            String id = y.optString("id", "");
            if (!id.matches("[a-z0-9-]{1,40}")) continue;
            float ust = (float) y.optDouble("y", 0) * d;
            if (ust > kaydir + boy * 3 || ust + y.optDouble("h", 0) * d < kaydir - boy * 2) continue;
            istenen.put(id, y);
        }
        Iterator<Map.Entry<String, Yuva>> it = yuvalar.entrySet().iterator();
        while (it.hasNext()) {
            Map.Entry<String, Yuva> e = it.next();
            if (!istenen.containsKey(e.getKey())) {
                kaldir(e.getValue());
                it.remove();
            }
        }
        if (hazir && !kapali) {
            for (Map.Entry<String, JSONObject> e : istenen.entrySet()) {
                Yuva v = yuvalar.get(e.getKey());
                JSONObject y = e.getValue();
                if (v == null) {
                    if (yuvalar.size() >= EN_FAZLA) continue;
                    v = new Yuva();
                    v.w = (float) y.optDouble("w", 0);
                    v.h = (float) y.optDouble("h", 0);
                    if (v.w < 120 || v.h < 50) continue;
                    yuvalar.put(e.getKey(), v);
                    yukle(e.getKey(), v);
                }
                v.x = (float) y.optDouble("x", 0);
                v.y = (float) y.optDouble("y", 0);
            }
        }
        pencere.setVisibility(gizli || yuvalar.isEmpty() ? View.GONE : View.VISIBLE);
        konumla();
    }

    private void yukle(final String id, final Yuva v) {
        AdView a = new AdView(ekran);
        a.setAdUnitId(BuildConfig.ADMOB_BIRIM);
        a.setAdSize(AdSize.getInlineAdaptiveBannerAdSize((int) v.w, (int) v.h));
        a.setVisibility(View.INVISIBLE);
        a.setAdListener(new AdListener() {
            @Override
            public void onAdLoaded() {
                v.yuklendi = true;
                a.setVisibility(View.VISIBLE);
                a.setAlpha(0f);
                a.animate().alpha(1f).setDuration(220).start();
                konumla();
                AdSize s = a.getAdSize();
                bildir(id, "tamam", s == null ? 0 : s.getHeight());
            }

            @Override
            public void onAdFailedToLoad(LoadAdError e) {
                bildir(id, "hata", 0);
            }
        });
        v.gorunum = a;
        a.addOnLayoutChangeListener((g, l, t, r, alt, el, et, er, ealt) -> konumla());
        pencere.addView(a, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT));
        try {
            a.loadAd(new AdRequest.Builder().build());
        } catch (Throwable t) {
            bildir(id, "hata", 0);
        }
    }

    private void kaldir(Yuva v) {
        if (v.gorunum == null) return;
        pencere.removeView(v.gorunum);
        try {
            v.gorunum.destroy();
        } catch (Throwable ignored) {
        }
        v.gorunum = null;
    }

    /** Yuvaları WebView'in o anki kaydırma konumuna göre yerleştirir (kaydırmayla aynı karede). */
    void konumla() {
        if (yuvalar.isEmpty()) return;
        float d = yogunluk();
        int kaydir = ekran.web.getScrollY();
        for (Yuva v : yuvalar.values()) {
            AdView a = v.gorunum;
            if (a == null) continue;
            int aw = a.getWidth() > 0 ? a.getWidth() : (int) (v.w * d), ah = a.getHeight() > 0 ? a.getHeight() : (int) (v.h * d);
            a.setTranslationX(v.x * d + (v.w * d - aw) / 2f);
            a.setTranslationY(v.y * d - kaydir - ustPx * d + (v.h * d - ah) / 2f);
        }
    }

    private void bildir(String id, String durum, int yukseklik) {
        try {
            JSONObject o = new JSONObject();
            o.put("id", id);
            o.put("durum", durum);
            o.put("h", yukseklik);
            kopru.olay("kbadmob", o);
        } catch (Exception ignored) {
        }
    }

    void duraklat() {
        for (Yuva v : yuvalar.values()) if (v.gorunum != null) v.gorunum.pause();
    }

    void devam() {
        for (Yuva v : yuvalar.values()) if (v.gorunum != null) v.gorunum.resume();
    }

    void kapat() {
        for (Yuva v : yuvalar.values()) kaldir(v);
        yuvalar.clear();
    }
}
