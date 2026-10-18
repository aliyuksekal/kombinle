package com.benim.kombinle;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.content.res.Configuration;
import android.graphics.Color;
import android.location.Address;
import android.location.Geocoder;
import android.location.Location;
import android.location.LocationManager;
import android.provider.Settings;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.speech.RecognizerIntent;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.GeolocationPermissions;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.Toast;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import androidx.webkit.WebViewAssetLoader;

import org.json.JSONObject;

import java.io.OutputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Kombinle ana ekranı: sayfa uygulamanın içinden (assets/www) güvenli bir https
 * adresiyle açılır. Uygulama dışındaki adreslere WebView içinde gidilmez.
 */
public class AnaEkran extends Activity {

    static final String KOK = "https://appassets.androidplatform.net";
    static final String SAYFA = KOK + "/assets/www/index.html";

    private static final int ISTEK_DOSYA = 11, ISTEK_SES = 12, ISTEK_KAYDET = 13;
    private static final int IZIN_KONUM = 21, IZIN_KAMERA = 22, IZIN_KONUM_YEREL = 23;
    private String konumIstek;

    WebView web;
    private FrameLayout kok;
    private Kopru kopru;
    private WebViewAssetLoader yukleyici;
    private ValueCallback<Uri[]> dosyaGeriDonus;
    private GeolocationPermissions.Callback konumGeriDonus;
    private String konumKaynak;
    private PermissionRequest bekleyenIzin;
    private String sesIstek, kaydetIstek;
    private byte[] kaydetVeri;
    private long sonGeri = 0;
    private boolean koyuCubuk;
    final Handler ui = new Handler(Looper.getMainLooper());

    @SuppressLint({"SetJavaScriptEnabled", "AddJavascriptInterface"})
    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        koyuCubuk = (getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES;

        kok = new FrameLayout(this);
        kok.setBackgroundColor(koyuCubuk ? 0xFF191117 : 0xFFFAF5F7);
        web = new WebView(this);
        web.setBackgroundColor(Color.TRANSPARENT);
        kok.addView(web, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        setContentView(kok);
        cubuklariAyarla(koyuCubuk);

        // Sistem çubukları ve klavye kadar boşluk bırak (Android 15 kenardan kenara ekran)
        ViewCompat.setOnApplyWindowInsetsListener(kok, (v, ic) -> {
            Insets s = ic.getInsets(WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout());
            Insets k = ic.getInsets(WindowInsetsCompat.Type.ime());
            v.setPadding(s.left, s.top, s.right, Math.max(s.bottom, k.bottom));
            return WindowInsetsCompat.CONSUMED;
        });

        boolean hataAyikla = (getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0;
        WebView.setWebContentsDebuggingEnabled(hataAyikla);

        WebSettings ws = web.getSettings();
        ws.setJavaScriptEnabled(true);
        ws.setDomStorageEnabled(true);
        ws.setDatabaseEnabled(true);
        ws.setGeolocationEnabled(true);
        ws.setMediaPlaybackRequiresUserGesture(false);
        ws.setAllowFileAccess(false);
        ws.setAllowContentAccess(false);
        ws.setJavaScriptCanOpenWindowsAutomatically(false);
        ws.setSupportMultipleWindows(false);
        ws.setSupportZoom(false);
        ws.setBuiltInZoomControls(false);
        ws.setTextZoom(100);
        ws.setCacheMode(WebSettings.LOAD_DEFAULT);
        if (Build.VERSION.SDK_INT >= 26) ws.setSafeBrowsingEnabled(true);
        // MET Norway hava servisi uygulamanın kendini tanıtmasını ister
        ws.setUserAgentString(ws.getUserAgentString() + " Kombinle/" + surum() + " (Android; matali.truz@gmail.com)");

        yukleyici = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        kopru = new Kopru(this);
        web.addJavascriptInterface(kopru, "KombinleNative");

        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest r) {
                return yukleyici.shouldInterceptRequest(r.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                Uri u = r.getUrl();
                if (KOK.equals(u.getScheme() + "://" + u.getHost())) return false;
                disariAc(u);
                return true;
            }

            @Override
            public void onPageStarted(WebView v, String url, android.graphics.Bitmap f) {
                kopru.guvenli = url != null && url.startsWith(KOK + "/");
            }
        });

        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> cb, FileChooserParams p) {
                if (dosyaGeriDonus != null) dosyaGeriDonus.onReceiveValue(null);
                dosyaGeriDonus = cb;
                Intent i;
                String[] turler = p.getAcceptTypes();
                boolean resim = turler != null && turler.length > 0 && turler[0] != null && turler[0].startsWith("image");
                if (resim) {
                    i = new Intent(Intent.ACTION_GET_CONTENT);
                    i.setType("image/*");
                    i.addCategory(Intent.CATEGORY_OPENABLE);
                    if (p.getMode() == FileChooserParams.MODE_OPEN_MULTIPLE) i.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
                } else {
                    i = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                    i.addCategory(Intent.CATEGORY_OPENABLE);
                    i.setType("*/*");
                    i.putExtra(Intent.EXTRA_MIME_TYPES, new String[]{"application/json", "text/plain", "application/octet-stream"});
                }
                try {
                    startActivityForResult(i, ISTEK_DOSYA);
                } catch (ActivityNotFoundException e) {
                    dosyaGeriDonus = null;
                    cb.onReceiveValue(null);
                }
                return true;
            }

            @Override
            public void onPermissionRequest(PermissionRequest r) {
                ui.post(() -> webIzni(r));
            }

            @Override
            public void onPermissionRequestCanceled(PermissionRequest r) {
                if (bekleyenIzin == r) bekleyenIzin = null;
            }

            @Override
            public void onGeolocationPermissionsShowPrompt(String kaynak, GeolocationPermissions.Callback cb) {
                if (!(KOK).equals(kaynak) && !(KOK + "/").equals(kaynak)) {
                    cb.invoke(kaynak, false, false);
                    return;
                }
                if (izinVar(Manifest.permission.ACCESS_COARSE_LOCATION) || izinVar(Manifest.permission.ACCESS_FINE_LOCATION)) {
                    cb.invoke(kaynak, true, false);
                } else {
                    konumGeriDonus = cb;
                    konumKaynak = kaynak;
                    requestPermissions(new String[]{Manifest.permission.ACCESS_COARSE_LOCATION, Manifest.permission.ACCESS_FINE_LOCATION}, IZIN_KONUM);
                }
            }
        });

        if (b != null) web.restoreState(b);
        if (web.getUrl() == null) web.loadUrl(SAYFA);
    }

    String surum() {
        try {
            return getPackageManager().getPackageInfo(getPackageName(), 0).versionName;
        } catch (Exception e) {
            return "1.0";
        }
    }

    private boolean izinVar(String p) {
        return checkSelfPermission(p) == PackageManager.PERMISSION_GRANTED;
    }

    private void webIzni(PermissionRequest r) {
        boolean kamera = false;
        for (String s : r.getResources()) if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(s)) kamera = true;
        if (!kamera || !KOK.equals(r.getOrigin().getScheme() + "://" + r.getOrigin().getHost())) {
            r.deny();
            return;
        }
        if (izinVar(Manifest.permission.CAMERA)) {
            r.grant(new String[]{PermissionRequest.RESOURCE_VIDEO_CAPTURE});
        } else {
            bekleyenIzin = r;
            requestPermissions(new String[]{Manifest.permission.CAMERA}, IZIN_KAMERA);
        }
    }

    @Override
    public void onRequestPermissionsResult(int kod, String[] izinler, int[] sonuc) {
        super.onRequestPermissionsResult(kod, izinler, sonuc);
        boolean verildi = false;
        for (int s : sonuc) if (s == PackageManager.PERMISSION_GRANTED) verildi = true;
        if (kod == IZIN_KONUM && konumGeriDonus != null) {
            konumGeriDonus.invoke(konumKaynak, verildi, false);
            konumGeriDonus = null;
        } else if (kod == IZIN_KONUM_YEREL && konumIstek != null) {
            String r = konumIstek;
            konumIstek = null;
            if (verildi) konumAl(r);
            else kopru.gonder(r, false, "hata", "izin");
        } else if (kod == IZIN_KAMERA && bekleyenIzin != null) {
            if (verildi) bekleyenIzin.grant(new String[]{PermissionRequest.RESOURCE_VIDEO_CAPTURE});
            else bekleyenIzin.deny();
            bekleyenIzin = null;
        }
    }

    /* ---------------- konum (telefonun kendi konum servisi + ilçe adı) ---------------- */

    void konumBaslat(String istek) {
        if (izinVar(Manifest.permission.ACCESS_COARSE_LOCATION) || izinVar(Manifest.permission.ACCESS_FINE_LOCATION)) {
            konumAl(istek);
            return;
        }
        if (konumIstek != null) kopru.gonder(konumIstek, false, "hata", "iptal");
        konumIstek = istek;
        requestPermissions(new String[]{Manifest.permission.ACCESS_COARSE_LOCATION, Manifest.permission.ACCESS_FINE_LOCATION}, IZIN_KONUM_YEREL);
    }

    @SuppressLint("MissingPermission")
    private void konumAl(final String istek) {
        final LocationManager lm = (LocationManager) getSystemService(LOCATION_SERVICE);
        if (lm == null) {
            kopru.gonder(istek, false, "hata", "yok");
            return;
        }
        boolean ag = false, gps = false;
        try { ag = lm.isProviderEnabled(LocationManager.NETWORK_PROVIDER); } catch (Exception ignored) { }
        try { gps = lm.isProviderEnabled(LocationManager.GPS_PROVIDER); } catch (Exception ignored) { }
        if (!ag && !gps) {
            kopru.gonder(istek, false, "hata", "kapali");
            return;
        }
        // Son bilinen konum yeterince yeniyse hemen kullan
        Location en = null;
        for (String p : new String[]{"fused", LocationManager.NETWORK_PROVIDER, LocationManager.GPS_PROVIDER, LocationManager.PASSIVE_PROVIDER}) {
            try {
                Location l = lm.getLastKnownLocation(p);
                if (l != null && (en == null || l.getTime() > en.getTime())) en = l;
            } catch (Exception ignored) { }
        }
        final Location eski = en;
        if (en != null && System.currentTimeMillis() - en.getTime() < 20 * 60 * 1000L) {
            konumBitir(istek, en);
            return;
        }
        final AtomicBoolean bitti = new AtomicBoolean(false);
        final String saglayici = ag ? LocationManager.NETWORK_PROVIDER : LocationManager.GPS_PROVIDER;
        ui.postDelayed(() -> {
            if (bitti.compareAndSet(false, true)) {
                if (eski != null) konumBitir(istek, eski);
                else kopru.gonder(istek, false, "hata", "zaman");
            }
        }, 15000);
        try {
            if (Build.VERSION.SDK_INT >= 30) {
                lm.getCurrentLocation(saglayici, null, getMainExecutor(), l -> {
                    if (!bitti.compareAndSet(false, true)) return;
                    if (l != null) konumBitir(istek, l);
                    else if (eski != null) konumBitir(istek, eski);
                    else kopru.gonder(istek, false, "hata", "zaman");
                });
            } else {
                lm.requestSingleUpdate(saglayici, new android.location.LocationListener() {
                    @Override public void onLocationChanged(Location l) {
                        if (bitti.compareAndSet(false, true)) konumBitir(istek, l);
                    }
                    @Override public void onStatusChanged(String p, int s, Bundle b) { }
                    @Override public void onProviderEnabled(String p) { }
                    @Override public void onProviderDisabled(String p) { }
                }, Looper.getMainLooper());
            }
        } catch (Exception e) {
            if (bitti.compareAndSet(false, true)) {
                if (eski != null) konumBitir(istek, eski);
                else kopru.gonder(istek, false, "hata", "yok");
            }
        }
    }

    private void konumBitir(final String istek, final Location l) {
        final double lat = l.getLatitude(), lon = l.getLongitude();
        Executors.newSingleThreadExecutor().execute(() -> {
            String ad = "";
            try {
                if (Geocoder.isPresent()) {
                    @SuppressWarnings("deprecation")
                    List<Address> a = new Geocoder(this, Locale.getDefault()).getFromLocation(lat, lon, 1);
                    if (a != null && !a.isEmpty()) {
                        Address x = a.get(0);
                        String ilce = x.getSubAdminArea() != null ? x.getSubAdminArea() : x.getLocality();
                        if (ilce == null) ilce = x.getSubLocality();
                        String il = x.getAdminArea();
                        if (ilce != null && il != null && !ilce.equals(il)) ad = ilce + ", " + il;
                        else if (il != null) ad = il;
                        else if (ilce != null) ad = ilce;
                    }
                }
            } catch (Exception ignored) { }
            JSONObject o = new JSONObject();
            try {
                o.put("req", istek);
                o.put("ok", true);
                o.put("lat", lat);
                o.put("lon", lon);
                o.put("dogruluk", l.hasAccuracy() ? Math.round(l.getAccuracy()) : -1);
                o.put("ad", ad.length() > 60 ? ad.substring(0, 60) : ad);
            } catch (Exception ignored) { }
            kopru.gonder(o);
        });
    }

    void konumAyarlariAc() {
        try {
            startActivity(new Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS));
        } catch (Exception ignored) { }
    }

    /* ---------------- ses tanıma ---------------- */

    void sesBaslat(String istek, String dil) {
        if (sesIstek != null) kopru.gonder(sesIstek, false, "iptal", true);
        sesIstek = istek;
        Intent i = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        i.putExtra(RecognizerIntent.EXTRA_LANGUAGE, dil);
        i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, dil);
        i.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1);
        i.putExtra(RecognizerIntent.EXTRA_PROMPT, getString(R.string.ses_soyle));
        try {
            startActivityForResult(i, ISTEK_SES);
        } catch (ActivityNotFoundException e) {
            sesIstek = null;
            Toast.makeText(this, R.string.ses_yok, Toast.LENGTH_SHORT).show();
            kopru.gonder(istek, false, "yok", true);
        }
    }

    /* ---------------- dosya kaydetme (yedek) ---------------- */

    void kaydetBaslat(String istek, String ad, String tur, byte[] veri) {
        if (kaydetIstek != null) kopru.gonder(kaydetIstek, false, "iptal", true);
        kaydetIstek = istek;
        kaydetVeri = veri;
        Intent i = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        i.addCategory(Intent.CATEGORY_OPENABLE);
        i.setType(tur);
        i.putExtra(Intent.EXTRA_TITLE, ad);
        try {
            startActivityForResult(i, ISTEK_KAYDET);
        } catch (ActivityNotFoundException e) {
            kaydetIstek = null;
            kaydetVeri = null;
            kopru.gonder(istek, false, "yok", true);
        }
    }

    @Override
    protected void onActivityResult(int kod, int sonuc, Intent veri) {
        super.onActivityResult(kod, sonuc, veri);
        if (kod == ISTEK_DOSYA) {
            if (dosyaGeriDonus == null) return;
            Uri[] secilen = null;
            if (sonuc == RESULT_OK && veri != null) {
                ArrayList<Uri> l = new ArrayList<>();
                ClipData c = veri.getClipData();
                if (c != null) for (int i = 0; i < c.getItemCount() && i < 30; i++) l.add(c.getItemAt(i).getUri());
                else if (veri.getData() != null) l.add(veri.getData());
                if (!l.isEmpty()) secilen = l.toArray(new Uri[0]);
            }
            dosyaGeriDonus.onReceiveValue(secilen);
            dosyaGeriDonus = null;
        } else if (kod == ISTEK_SES) {
            String istek = sesIstek;
            sesIstek = null;
            if (istek == null) return;
            String metin = null;
            if (sonuc == RESULT_OK && veri != null) {
                ArrayList<String> l = veri.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS);
                if (l != null && !l.isEmpty()) metin = l.get(0);
            }
            if (metin != null) kopru.gonder(istek, true, "metin", metin);
            else kopru.gonder(istek, false, "iptal", true);
        } else if (kod == ISTEK_KAYDET) {
            final String istek = kaydetIstek;
            final byte[] b = kaydetVeri;
            kaydetIstek = null;
            kaydetVeri = null;
            if (istek == null) return;
            if (sonuc != RESULT_OK || veri == null || veri.getData() == null || b == null) {
                kopru.gonder(istek, false, "iptal", true);
                return;
            }
            final Uri u = veri.getData();
            new Thread(() -> {
                boolean ok = false;
                try (OutputStream o = getContentResolver().openOutputStream(u, "wt")) {
                    if (o != null) {
                        o.write(b);
                        ok = true;
                    }
                } catch (Exception ignored) {
                }
                kopru.gonder(istek, ok, "yazildi", ok);
            }).start();
        }
    }

    /* ---------------- görünüm ---------------- */

    void cubuklariAyarla(boolean koyu) {
        koyuCubuk = koyu;
        kok.setBackgroundColor(koyu ? 0xFF191117 : 0xFFFAF5F7);
        getWindow().getDecorView().setBackgroundColor(koyu ? 0xFF191117 : 0xFFFAF5F7);
        WindowInsetsControllerCompat c = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        c.setAppearanceLightStatusBars(!koyu);
        c.setAppearanceLightNavigationBars(!koyu);
    }

    void disariAc(Uri u) {
        String s = u.getScheme();
        if (!"https".equals(s) && !"mailto".equals(s)) return;
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, u).addCategory(Intent.CATEGORY_BROWSABLE));
        } catch (ActivityNotFoundException e) {
            Toast.makeText(this, R.string.tarayici_yok, Toast.LENGTH_SHORT).show();
        }
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        if (web != null && web.canGoBack()) {
            web.goBack();
            return;
        }
        long simdi = System.currentTimeMillis();
        if (simdi - sonGeri < 2000) {
            super.onBackPressed();
        } else {
            sonGeri = simdi;
            Toast.makeText(this, R.string.cikis, Toast.LENGTH_SHORT).show();
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle b) {
        super.onSaveInstanceState(b);
        if (web != null) web.saveState(b);
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (web != null) web.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (web != null) web.onResume();
    }

    @Override
    protected void onDestroy() {
        if (kopru != null) kopru.kapat();
        if (web != null) {
            ((ViewGroup) web.getParent()).removeView(web);
            web.destroy();
            web = null;
        }
        super.onDestroy();
    }

    static String json(Object o) {
        return JSONObject.quote(String.valueOf(o));
    }
}
