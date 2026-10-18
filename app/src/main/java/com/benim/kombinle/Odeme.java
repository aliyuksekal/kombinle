package com.benim.kombinle;

import android.app.Activity;
import android.content.SharedPreferences;

import com.android.billingclient.api.AcknowledgePurchaseParams;
import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.ConsumeParams;
import com.android.billingclient.api.PendingPurchasesParams;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.PurchasesUpdatedListener;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryPurchasesParams;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/** Google Play uygulama içi satın alma (Play Billing 8): Kombinle Pro ve destek ürünleri. */
final class Odeme implements PurchasesUpdatedListener {

    static final String PRO = "kombinle_pro";
    private static final Set<String> KALICI = new HashSet<>(Collections.singletonList(PRO));
    private static final Set<String> TUKETILEN = new HashSet<>(Arrays.asList("destek_cay", "destek_yemek"));

    private final Activity act;
    private final Kopru kopru;
    private final SharedPreferences ayar;
    private final Set<String> sahip = Collections.synchronizedSet(new LinkedHashSet<>());
    private final Map<String, ProductDetails> bilgi = new HashMap<>();
    private BillingClient istemci;
    private String alIstek, alId;

    Odeme(Activity act, Kopru kopru) {
        this.act = act;
        this.kopru = kopru;
        this.ayar = act.getSharedPreferences("odeme", Activity.MODE_PRIVATE);
        try {
            JSONArray a = new JSONArray(ayar.getString("sahip", "[]"));
            for (int i = 0; i < a.length(); i++) if (KALICI.contains(a.getString(i))) sahip.add(a.getString(i));
        } catch (Exception ignored) {
        }
    }

    private static boolean tanimli(String id) {
        return KALICI.contains(id) || TUKETILEN.contains(id);
    }

    void baslat() {
        try {
            istemci = BillingClient.newBuilder(act)
                    .setListener(this)
                    .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
                    .enableAutoServiceReconnection()
                    .build();
            baglan(() -> yenile(null), null);
        } catch (Throwable t) {
            istemci = null;
        }
    }

    private void baglan(Runnable ok, Runnable hata) {
        if (istemci == null) {
            if (hata != null) hata.run();
            return;
        }
        if (istemci.isReady()) {
            ok.run();
            return;
        }
        istemci.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(BillingResult r) {
                if (r.getResponseCode() == BillingClient.BillingResponseCode.OK) ok.run();
                else if (hata != null) hata.run();
            }

            @Override
            public void onBillingServiceDisconnected() {
            }
        });
    }

    /** Google Play'den güncel sahiplik: iade edilen ürün burada düşer. */
    private void yenile(Runnable bitti) {
        istemci.queryPurchasesAsync(QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.INAPP).build(), (r, alimlar) -> {
            if (r.getResponseCode() == BillingClient.BillingResponseCode.OK && alimlar != null) {
                Set<String> yeni = new HashSet<>();
                for (Purchase p : alimlar) if (isle(p)) yeni.addAll(p.getProducts());
                sahip.clear();
                for (String s : yeni) if (KALICI.contains(s)) sahip.add(s);
                kaydet();
            }
            if (bitti != null) bitti.run();
        });
    }

    private boolean isle(Purchase p) {
        if (p.getPurchaseState() != Purchase.PurchaseState.PURCHASED) return false;
        boolean tuketilen = false;
        for (String id : p.getProducts()) if (TUKETILEN.contains(id)) tuketilen = true;
        if (tuketilen) {
            istemci.consumeAsync(ConsumeParams.newBuilder().setPurchaseToken(p.getPurchaseToken()).build(), (r, t) -> { });
            return false;
        }
        if (!p.isAcknowledged()) {
            istemci.acknowledgePurchase(AcknowledgePurchaseParams.newBuilder().setPurchaseToken(p.getPurchaseToken()).build(), r -> { });
        }
        return true;
    }

    private void kaydet() {
        JSONArray a = new JSONArray();
        synchronized (sahip) {
            for (String s : sahip) a.put(s);
        }
        ayar.edit().putString("sahip", a.toString()).apply();
    }

    String sahipJson() {
        JSONArray a = new JSONArray();
        synchronized (sahip) {
            for (String s : sahip) a.put(s);
        }
        return a.toString();
    }

    private JSONArray sahipDizi() {
        JSONArray a = new JSONArray();
        synchronized (sahip) {
            for (String s : sahip) a.put(s);
        }
        return a;
    }

    private void bilgiYukle(List<String> idler, Runnable bitti) {
        List<QueryProductDetailsParams.Product> l = new ArrayList<>();
        for (String id : idler) {
            l.add(QueryProductDetailsParams.Product.newBuilder().setProductId(id).setProductType(BillingClient.ProductType.INAPP).build());
        }
        if (l.isEmpty()) {
            bitti.run();
            return;
        }
        istemci.queryProductDetailsAsync(QueryProductDetailsParams.newBuilder().setProductList(l).build(), (r, sonuc) -> {
            if (r.getResponseCode() == BillingClient.BillingResponseCode.OK && sonuc != null) {
                synchronized (bilgi) {
                    for (ProductDetails d : sonuc.getProductDetailsList()) bilgi.put(d.getProductId(), d);
                }
            }
            bitti.run();
        });
    }

    void sorgula(String istek, String csv) {
        final List<String> idler = new ArrayList<>();
        if (csv != null) for (String s : csv.split("[,;\\s]+")) if (tanimli(s.trim())) idler.add(s.trim());
        baglan(() -> bilgiYukle(idler, () -> {
            try {
                JSONArray a = new JSONArray();
                synchronized (bilgi) {
                    for (String id : idler) {
                        ProductDetails d = bilgi.get(id);
                        if (d == null || d.getOneTimePurchaseOfferDetails() == null) continue;
                        JSONObject o = new JSONObject();
                        o.put("id", id);
                        o.put("price", d.getOneTimePurchaseOfferDetails().getFormattedPrice());
                        a.put(o);
                    }
                }
                kopru.gonder(istek, true, "products", a);
            } catch (Exception e) {
                kopru.gonder(istek, false, "hata", "bilgi");
            }
        }), () -> kopru.gonder(istek, false, "hata", "baglanti"));
    }

    void al(String istek, String id) {
        final String pid = id == null ? "" : id.trim();
        if (!tanimli(pid)) {
            kopru.gonder(istek, false, "hata", "urun");
            return;
        }
        if (sahip.contains(pid)) {
            kopru.gonder(istek, true, "owned", sahipDizi());
            return;
        }
        baglan(() -> bilgiYukle(Collections.singletonList(pid), () -> act.runOnUiThread(() -> {
            ProductDetails d;
            synchronized (bilgi) {
                d = bilgi.get(pid);
            }
            if (d == null) {
                kopru.gonder(istek, false, "hata", "playde-yok");
                return;
            }
            alIstek = istek;
            alId = pid;
            BillingResult r = istemci.launchBillingFlow(act, BillingFlowParams.newBuilder()
                    .setProductDetailsParamsList(Collections.singletonList(
                            BillingFlowParams.ProductDetailsParams.newBuilder().setProductDetails(d).build()))
                    .build());
            if (r.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                alIstek = null;
                kopru.gonder(istek, false, "hata", "acilmadi");
            }
        })), () -> kopru.gonder(istek, false, "hata", "baglanti"));
    }

    @Override
    public void onPurchasesUpdated(BillingResult r, List<Purchase> alimlar) {
        final String istek = alIstek, id = alId;
        alIstek = null;
        int kod = r.getResponseCode();
        boolean alindi = false;
        if (kod == BillingClient.BillingResponseCode.OK && alimlar != null) {
            for (Purchase p : alimlar) {
                boolean kalici = isle(p);
                if (p.getProducts().contains(id) && p.getPurchaseState() == Purchase.PurchaseState.PURCHASED) alindi = true;
                if (kalici) for (String s : p.getProducts()) if (KALICI.contains(s)) sahip.add(s);
            }
            kaydet();
        } else if (kod == BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED) {
            alindi = true;
            yenile(null);
        }
        if (istek == null) return;
        JSONObject o = new JSONObject();
        try {
            o.put("req", istek);
            o.put("ok", alindi);
            o.put("iptal", kod == BillingClient.BillingResponseCode.USER_CANCELED);
            o.put("owned", sahipDizi());
        } catch (Exception ignored) {
        }
        kopru.gonder(o);
    }

    void geriYukle(String istek) {
        baglan(() -> yenile(() -> kopru.gonder(istek, true, "owned", sahipDizi())),
                () -> kopru.gonder(istek, false, "hata", "baglanti"));
    }

    void kapat() {
        try {
            if (istemci != null) istemci.endConnection();
        } catch (Throwable ignored) {
        }
    }
}
