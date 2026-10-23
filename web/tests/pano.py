import sys, os, fnmatch
from PIL import Image
# Ekran görüntülerinden pano: python3 pano.py <önek> <çıktı.png> [sütun] [genişlik]
d = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ekran')
onek, cikti = sys.argv[1], sys.argv[2]
sutun = int(sys.argv[3]) if len(sys.argv) > 3 else 4
gen = int(sys.argv[4]) if len(sys.argv) > 4 else 390
adlar = sorted(f for f in os.listdir(d) if fnmatch.fnmatch(f, onek))
res = [Image.open(os.path.join(d, f)).convert('RGB') for f in adlar]
res = [r.resize((gen, int(r.height * gen / r.width))) for r in res]
yuk = max(r.height for r in res); bosluk = 16
satir = (len(res) + sutun - 1) // sutun
pano = Image.new('RGB', (sutun * gen + (sutun + 1) * bosluk, satir * yuk + (satir + 1) * bosluk), (128, 128, 128))
for i, r in enumerate(res):
    pano.paste(r, (bosluk + (i % sutun) * (gen + bosluk), bosluk + (i // sutun) * (yuk + bosluk)))
pano.save(cikti)
print(cikti, pano.size, adlar)
