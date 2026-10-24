package com.benim.kombinle;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;

import androidx.annotation.NonNull;
import androidx.work.Constraints;
import androidx.work.ExistingPeriodicWorkPolicy;
import androidx.work.NetworkType;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

import org.json.JSONObject;

import java.util.concurrent.TimeUnit;

/**
 * Uygulama kapalıyken yaklaşık 15 dakikada bir yeni takipçi, beğeni, yorum ve mesaj olup olmadığına bakar;
 * varsa telefon bildirimi gösterir. Uygulama açıkken bildirim göstermez (uygulama içi uyarı yeter).
 * Ek bir hizmet (Firebase vb.) gerektirmez.
 */
public final class BildirimIscisi extends Worker {

    static final String KANAL = "kombinle_bildirim";
    static final int NO_BILDIRIM = 1, NO_MESAJ = 2;
    static volatile boolean onPlanda = false;

    public BildirimIscisi(@NonNull Context c, @NonNull WorkerParameters p) {
        super(c, p);
    }

    @NonNull
    @Override
    public Result doWork() {
        Context c = getApplicationContext();
        try {
            if (onPlanda || !Sunucu.hazir() || !Sunucu.oturumVar(c)) return Result.success();
            JSONObject s = Sunucu.gonder(c, "/v1/bildirim", "{\"sadeceSay\":true}");
            if (s.optInt("durum") != 200) return Result.success();
            JSONObject v = s.optJSONObject("veri");
            if (v == null) return Result.success();
            SharedPreferences a = c.getSharedPreferences("bildirim", Context.MODE_PRIVATE);
            JSONObject sm = v.optJSONObject("sonMesaj");
            if (sm != null && sm.optLong("zaman") > a.getLong("mesaj", 0)) {
                String ad = kisa(sm.optString("takma"));
                int n = v.optInt("mesaj");
                goster(c, NO_MESAJ, c.getString(R.string.bn_mesaj, ad), n > 1 ? c.getString(R.string.bn_mesaj_sayi, n) : c.getString(R.string.bn_mesaj_ac), "mesaj");
                a.edit().putLong("mesaj", sm.optLong("zaman")).apply();
            }
            JSONObject son = v.optJSONObject("son");
            if (son != null && son.optLong("zaman") > a.getLong("son", 0)) {
                String ad = kisa(son.optString("takma"));
                String tur = son.optString("tur");
                int metin = "takip".equals(tur) ? R.string.bn_takip : "begeni".equals(tur) ? R.string.bn_begeni
                        : "yorum".equals(tur) ? R.string.bn_yorum : "anket".equals(tur) ? R.string.bn_anket
                        : "istek".equals(tur) ? R.string.bn_istek : "kabul".equals(tur) ? R.string.bn_kabul : R.string.bn_genel;
                int n = v.optInt("okunmamis");
                goster(c, NO_BILDIRIM, c.getString(metin, ad), n > 1 ? c.getString(R.string.bn_sayi, n) : c.getString(R.string.bn_ac), "bildirim");
                a.edit().putLong("son", son.optLong("zaman")).apply();
            }
        } catch (Throwable ignored) {
        }
        return Result.success();
    }

    private static String kisa(String s) {
        if (s == null) return "";
        s = s.replaceAll("[\\p{Cntrl}]", " ").trim();
        return s.length() > 24 ? s.substring(0, 24) : s;
    }

    static boolean izinVar(Context c) {
        return Build.VERSION.SDK_INT < 33 || c.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED;
    }

    static void goster(Context c, int no, String baslik, String metin, String ac) {
        if (!izinVar(c)) return;
        NotificationManager nm = c.getSystemService(NotificationManager.class);
        if (nm == null) return;
        if (Build.VERSION.SDK_INT >= 26) {
            nm.createNotificationChannel(new NotificationChannel(KANAL, c.getString(R.string.kanal_adi), NotificationManager.IMPORTANCE_DEFAULT));
        }
        Intent i = new Intent(c, AnaEkran.class).putExtra("ac", ac).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pi = PendingIntent.getActivity(c, no, i, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        Notification.Builder b = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(c, KANAL) : new Notification.Builder(c);
        b.setSmallIcon(R.drawable.ic_bildirim)
                .setContentTitle(baslik)
                .setContentText(metin)
                .setAutoCancel(true)
                .setContentIntent(pi)
                .setColor(0xFFEC4899);
        nm.notify(no, b.build());
    }

    static void temizle(Context c) {
        try {
            NotificationManager nm = c.getSystemService(NotificationManager.class);
            if (nm != null) { nm.cancel(NO_BILDIRIM); nm.cancel(NO_MESAJ); }
        } catch (Throwable ignored) {
        }
    }

    static void planla(Context c) {
        try {
            PeriodicWorkRequest r = new PeriodicWorkRequest.Builder(BildirimIscisi.class, 15, TimeUnit.MINUTES)
                    .setConstraints(new Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build())
                    .build();
            WorkManager.getInstance(c).enqueueUniquePeriodicWork("kombinle_bildirim", ExistingPeriodicWorkPolicy.KEEP, r);
        } catch (Throwable ignored) {
        }
    }
}
