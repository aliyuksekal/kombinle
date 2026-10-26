package com.benim.kombinle;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Build;
import android.widget.RemoteViews;

import androidx.annotation.NonNull;
import androidx.work.ExistingWorkPolicy;
import androidx.work.OneTimeWorkRequest;
import androidx.work.WorkManager;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;
import java.util.concurrent.TimeUnit;

/**
 * Sabah kombin bildirimi ve ana ekran widget'ı.
 * Uygulama her açılıp kapandığında sayfa ertesi sabahın (ya da bugünün) kombinini kendi stilistiyle hazırlar,
 * kolaj görüntüsüyle birlikte buraya bırakır. Seçilen saatte (varsayılan 07:30) bildirim gösterilir.
 * Hazırlanan öneri o güne ait değilse (uygulama günlerdir açılmadıysa) hava durumu telefondan alınır
 * (MET Norway) ve "bugünün kombinine bak" bildirimi gider. Widget aynı öneriyi gösterir.
 */
public final class Sabah extends Worker {

    static final String KANAL = "kombinle_sabah";
    static final int NO = 3;
    private static final String AYAR = "sabah";

    public Sabah(@NonNull Context c, @NonNull WorkerParameters p) {
        super(c, p);
    }

    static SharedPreferences ayar(Context c) {
        return c.getSharedPreferences(AYAR, Context.MODE_PRIVATE);
    }

    static String bugun() {
        SimpleDateFormat f = new SimpleDateFormat("yyyy-MM-dd", Locale.US);
        f.setTimeZone(TimeZone.getDefault());
        return f.format(new Date());
    }

    /** Sayfadan gelen hazırlık: {acik, saat:"07:30", tarih, baslik, metin, gunEtiket, lat, lon, resim(base64 jpeg)} */
    static void ayarla(Context c, JSONObject o) {
        SharedPreferences.Editor e = ayar(c).edit();
        e.putBoolean("acik", o.optBoolean("acik", true));
        String saat = o.optString("saat", "07:30");
        if (!saat.matches("([01]\\d|2[0-3]):[0-5]\\d")) saat = "07:30";
        e.putString("saat", saat);
        e.putString("tarih", o.optString("tarih", "").matches("\\d{4}-\\d\\d-\\d\\d") ? o.optString("tarih") : "");
        e.putString("baslik", kirp(o.optString("baslik", ""), 90));
        e.putString("metin", kirp(o.optString("metin", ""), 200));
        e.putString("gunEtiket", kirp(o.optString("gunEtiket", ""), 30));
        e.putString("bosBaslik", kirp(o.optString("bosBaslik", ""), 90));
        e.putString("bosMetin", kirp(o.optString("bosMetin", ""), 160));
        e.putString("havaSablon", kirp(o.optString("havaSablon", ""), 90));
        e.putString("yagmurEk", kirp(o.optString("yagmurEk", ""), 60));
        e.putString("wBosBaslik", kirp(o.optString("widgetBosBaslik", ""), 60));
        e.putString("wBosMetin", kirp(o.optString("widgetBosMetin", ""), 90));
        double lat = o.optDouble("lat", Double.NaN), lon = o.optDouble("lon", Double.NaN);
        if (!Double.isNaN(lat) && !Double.isNaN(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
            e.putString("lat", String.format(Locale.US, "%.2f", lat));
            e.putString("lon", String.format(Locale.US, "%.2f", lon));
        }
        String b64 = o.optString("resim", "");
        File f = new File(c.getFilesDir(), "sabah.jpg");
        if (b64.length() > 100 && b64.length() < 3_000_000) {
            try {
                byte[] b = android.util.Base64.decode(b64, android.util.Base64.DEFAULT);
                try (FileOutputStream out = new FileOutputStream(f)) {
                    out.write(b);
                }
            } catch (Exception ignored) {
            }
        } else if (o.has("resim")) {
            //noinspection ResultOfMethodCallIgnored
            f.delete();
        }
        e.apply();
        planla(c);
        Widget.hepsiniGuncelle(c);
    }

    private static String kirp(String s, int n) {
        if (s == null) return "";
        s = s.replaceAll("[\\p{Cntrl}]", " ").trim();
        return s.length() > n ? s.substring(0, n) : s;
    }

    /** Bir sonraki bildirim saatine tek seferlik iş kurar (her çalışmada yenisi kurulur). */
    static void planla(Context c) {
        try {
            SharedPreferences a = ayar(c);
            WorkManager wm = WorkManager.getInstance(c);
            if (!a.getBoolean("acik", true)) {
                wm.cancelUniqueWork("kombinle_sabah");
                return;
            }
            String[] s = a.getString("saat", "07:30").split(":");
            Calendar k = Calendar.getInstance();
            k.set(Calendar.HOUR_OF_DAY, Integer.parseInt(s[0]));
            k.set(Calendar.MINUTE, Integer.parseInt(s[1]));
            k.set(Calendar.SECOND, 0);
            k.set(Calendar.MILLISECOND, 0);
            if (k.getTimeInMillis() <= System.currentTimeMillis() + 60_000) k.add(Calendar.DAY_OF_MONTH, 1);
            long gecikme = k.getTimeInMillis() - System.currentTimeMillis();
            OneTimeWorkRequest r = new OneTimeWorkRequest.Builder(Sabah.class).setInitialDelay(gecikme, TimeUnit.MILLISECONDS).build();
            wm.enqueueUniqueWork("kombinle_sabah", ExistingWorkPolicy.REPLACE, r);
        } catch (Throwable ignored) {
        }
    }

    @NonNull
    @Override
    public Result doWork() {
        Context c = getApplicationContext();
        try {
            SharedPreferences a = ayar(c);
            if (a.getBoolean("acik", true) && !BildirimIscisi.onPlanda) {
                String baslik, metin;
                boolean bugunMu = bugun().equals(a.getString("tarih", ""));
                if (bugunMu && !a.getString("baslik", "").isEmpty()) {
                    baslik = a.getString("baslik", "");
                    metin = a.getString("metin", "");
                } else {
                    String hava = havaOzeti(c, a);
                    baslik = hava != null ? hava : (a.getString("bosBaslik", "").isEmpty() ? c.getString(R.string.sabah_baslik) : a.getString("bosBaslik", ""));
                    metin = a.getString("bosMetin", "").isEmpty() ? c.getString(R.string.sabah_metin) : a.getString("bosMetin", "");
                    a.edit().putString("havaBaslik", hava == null ? "" : hava).putString("havaTarih", bugun()).apply();
                }
                Bitmap resim = bugunMu ? resim(c) : null;
                goster(c, baslik, metin, resim);
                Widget.hepsiniGuncelle(c);
            }
        } catch (Throwable ignored) {
        }
        planla(c);
        return Result.success();
    }

    static Bitmap resim(Context c) {
        File f = new File(c.getFilesDir(), "sabah.jpg");
        if (!f.isFile()) return null;
        try {
            BitmapFactory.Options o = new BitmapFactory.Options();
            o.inSampleSize = 1;
            return BitmapFactory.decodeFile(f.getAbsolutePath(), o);
        } catch (Throwable t) {
            return null;
        }
    }

    /** MET Norway'den bugünün en düşük/en yüksek sıcaklığı ve yağmur: "Günaydın ☀️ Bugün 9–16°, yağmur bekleniyor" */
    private static String havaOzeti(Context c, SharedPreferences a) {
        String lat = a.getString("lat", ""), lon = a.getString("lon", "");
        if (lat.isEmpty() || lon.isEmpty()) return null;
        HttpURLConnection u = null;
        try {
            u = (HttpURLConnection) new URL("https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=" + lat + "&lon=" + lon).openConnection();
            u.setConnectTimeout(10000);
            u.setReadTimeout(15000);
            u.setRequestProperty("User-Agent", "Kombinle/" + BuildConfig.VERSION_NAME + " (Android; matali.truz@gmail.com)");
            if (u.getResponseCode() != 200) return null;
            StringBuilder sb = new StringBuilder();
            try (InputStream in = u.getInputStream()) {
                byte[] b = new byte[16384];
                int n;
                while ((n = in.read(b)) > 0 && sb.length() < 2_000_000) sb.append(new String(b, 0, n, "UTF-8"));
            }
            JSONArray l = new JSONObject(sb.toString()).getJSONObject("properties").getJSONArray("timeseries");
            SimpleDateFormat iso = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US);
            iso.setTimeZone(TimeZone.getTimeZone("UTC"));
            Calendar bas = Calendar.getInstance();
            bas.set(Calendar.HOUR_OF_DAY, 8);
            bas.set(Calendar.MINUTE, 0);
            long b0 = bas.getTimeInMillis(), b1 = b0 + 13 * 3600_000L;
            double min = 99, max = -99, yag = 0;
            int yagSaat = 0;
            for (int i = 0; i < l.length() && i < 60; i++) {
                JSONObject x = l.getJSONObject(i);
                long t = iso.parse(x.getString("time")).getTime();
                if (t < b0 || t > b1) continue;
                JSONObject d = x.getJSONObject("data");
                double T = d.getJSONObject("instant").getJSONObject("details").getDouble("air_temperature");
                min = Math.min(min, T);
                max = Math.max(max, T);
                JSONObject s1 = d.optJSONObject("next_1_hours");
                if (s1 != null) {
                    double y = s1.optJSONObject("details") != null ? s1.optJSONObject("details").optDouble("precipitation_amount", 0) : 0;
                    yag += y;
                    String kod = s1.optJSONObject("summary") != null ? s1.optJSONObject("summary").optString("symbol_code", "") : "";
                    if (y >= 0.2 || kod.contains("rain") || kod.contains("sleet")) yagSaat++;
                }
            }
            if (max < -90) return null;
            String sablon = a.getString("havaSablon", "");
            String s = sablon.contains("{min}") && sablon.contains("{max}")
                    ? sablon.replace("{min}", String.valueOf((int) Math.round(min))).replace("{max}", String.valueOf((int) Math.round(max)))
                    : c.getString(R.string.sabah_hava, (int) Math.round(min), (int) Math.round(max));
            if (yagSaat >= 2 || yag >= 1.2) s += a.getString("yagmurEk", "").isEmpty() ? c.getString(R.string.sabah_yagmur) : a.getString("yagmurEk", "");
            return s;
        } catch (Throwable t) {
            return null;
        } finally {
            if (u != null) u.disconnect();
        }
    }

    static void goster(Context c, String baslik, String metin, Bitmap resim) {
        if (!BildirimIscisi.izinVar(c)) return;
        NotificationManager nm = c.getSystemService(NotificationManager.class);
        if (nm == null) return;
        if (Build.VERSION.SDK_INT >= 26) {
            nm.createNotificationChannel(new NotificationChannel(KANAL, c.getString(R.string.sabah_kanal), NotificationManager.IMPORTANCE_DEFAULT));
        }
        Intent i = new Intent(c, AnaEkran.class).putExtra("ac", "sabah").addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pi = PendingIntent.getActivity(c, NO, i, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        Notification.Builder b = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(c, KANAL) : new Notification.Builder(c);
        b.setSmallIcon(R.drawable.ic_bildirim)
                .setContentTitle(baslik)
                .setContentText(metin)
                .setAutoCancel(true)
                .setContentIntent(pi)
                .setColor(0xFFEC4899);
        if (resim != null) {
            b.setLargeIcon(resim);
            b.setStyle(new Notification.BigPictureStyle().bigPicture(resim).setSummaryText(metin));
        } else {
            b.setStyle(new Notification.BigTextStyle().bigText(metin));
        }
        nm.notify(NO, b.build());
    }

    /* ------------------------------------------------------------ widget */

    /** Ana ekran widget'ı: önerilen kombinin kolajı, hava ve parçalar. Dokununca uygulama açılır. */
    public static final class Widget extends android.appwidget.AppWidgetProvider {
        @Override
        public void onUpdate(Context c, AppWidgetManager m, int[] idler) {
            for (int id : idler) m.updateAppWidget(id, gorunum(c));
        }

        @Override
        public void onEnabled(Context c) {
            ayar(c).edit().putBoolean("widgetVar", true).apply();
        }

        @Override
        public void onDisabled(Context c) {
            ayar(c).edit().putBoolean("widgetVar", false).apply();
        }

        static void hepsiniGuncelle(Context c) {
            try {
                AppWidgetManager m = AppWidgetManager.getInstance(c);
                int[] idler = m.getAppWidgetIds(new ComponentName(c, Widget.class));
                if (idler == null || idler.length == 0) return;
                RemoteViews v = gorunum(c);
                for (int id : idler) m.updateAppWidget(id, v);
            } catch (Throwable ignored) {
            }
        }

        static RemoteViews gorunum(Context c) {
            SharedPreferences a = ayar(c);
            RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget_kombin);
            String baslik = a.getString("baslik", ""), metin = a.getString("metin", ""), etiket = a.getString("gunEtiket", "");
            String tarih = a.getString("tarih", "");
            // geçmiş günün önerisi gösterilmez
            boolean gecerli = !baslik.isEmpty() && tarih.compareTo(bugun()) >= 0;
            Bitmap r = gecerli ? resim(c) : null;
            if (r != null) {
                int en = Math.max(r.getWidth(), r.getHeight());
                if (en > 720) r = Bitmap.createScaledBitmap(r, r.getWidth() * 720 / en, r.getHeight() * 720 / en, true);
                v.setImageViewBitmap(R.id.w_resim, r);
                v.setViewVisibility(R.id.w_resim, android.view.View.VISIBLE);
                v.setViewVisibility(R.id.w_bos, android.view.View.GONE);
            } else {
                v.setViewVisibility(R.id.w_resim, android.view.View.GONE);
                v.setViewVisibility(R.id.w_bos, android.view.View.VISIBLE);
            }
            v.setTextViewText(R.id.w_etiket, gecerli && !etiket.isEmpty() ? etiket : c.getString(R.string.app_name));
            String bb = a.getString("wBosBaslik", ""), bm = a.getString("wBosMetin", "");
            v.setTextViewText(R.id.w_baslik, gecerli ? baslik : (bb.isEmpty() ? c.getString(R.string.widget_bos_baslik) : bb));
            v.setTextViewText(R.id.w_metin, gecerli ? metin : (bm.isEmpty() ? c.getString(R.string.widget_bos_metin) : bm));
            Intent i = new Intent(c, AnaEkran.class).putExtra("ac", "sabah").addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            v.setOnClickPendingIntent(R.id.w_kok, PendingIntent.getActivity(c, 31, i, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT));
            return v;
        }
    }
}
