#!/usr/bin/env bash
# Kombinle sunucusunu Cloudflare'e kurar/günceller (GitHub Actions çalıştırır).
# Gerekli ortam: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, GEMINI_API_KEY, UYGULAMA_ANAHTARI
# Çıktı: GITHUB_OUTPUT dosyasına url=https://kombinle-api.<alt-alan>.workers.dev
set -euo pipefail
cd "$(dirname "$0")"

API="https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}"
YETKI="Authorization: Bearer ${CLOUDFLARE_API_TOKEN}"

echo "› wrangler kuruluyor"
npm install --no-audit --no-fund --loglevel=error
W="npx --no-install wrangler"

echo "› workers.dev alt alanı"
ALT=$(curl -fsS -H "$YETKI" "$API/workers/subdomain" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{try{const j=JSON.parse(d);process.stdout.write((j.result&&j.result.subdomain)||"")}catch(e){}})' || true)
if [ -z "$ALT" ]; then
  YENI="kombinle-$(head -c 4 /dev/urandom | od -An -tx1 | tr -d ' \n')"
  echo "  alt alan yok, oluşturuluyor: $YENI"
  curl -fsS -X PUT -H "$YETKI" -H "Content-Type: application/json" --data "{\"subdomain\":\"$YENI\"}" "$API/workers/subdomain" > /dev/null
  ALT="$YENI"
fi

echo "› D1 veritabanı"
D1=$($W d1 list --json 2>/dev/null | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{try{const l=JSON.parse(d);const x=l.find(v=>v.name==="kombinle");process.stdout.write(x?(x.uuid||x.database_id||""):"")}catch(e){}})' || true)
if [ -z "$D1" ]; then
  $W d1 create kombinle > /dev/null
  D1=$($W d1 list --json | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{const l=JSON.parse(d);const x=l.find(v=>v.name==="kombinle");process.stdout.write(x?(x.uuid||x.database_id||""):"")})')
fi
[ -n "$D1" ] || { echo "D1 kimliği alınamadı"; exit 1; }
sed -i "s/__D1_ID__/$D1/" wrangler.toml
$W d1 execute kombinle --remote --file schema.sql > /dev/null

echo "› yayınlanıyor"
$W deploy > /dev/null
printf '%s' "$GEMINI_API_KEY" | $W secret put GEMINI_API_KEY > /dev/null
printf '%s' "$UYGULAMA_ANAHTARI" | $W secret put UYGULAMA_ANAHTARI > /dev/null

URL="https://kombinle-api.${ALT}.workers.dev"
echo "› sağlık denetimi: $URL"
for i in $(seq 1 12); do
  if curl -fsS "$URL/v1/saglik" | grep -q '"ok":true'; then echo "  sunucu hazır"; break; fi
  sleep 5
done
echo "url=$URL" >> "${GITHUB_OUTPUT:-/dev/null}"
