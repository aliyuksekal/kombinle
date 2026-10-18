from PIL import Image, ImageDraw, ImageFilter
import random, os
random.seed(7)
D = 'foto'
def tuval(w=800, h=800, zemin=(236, 228, 216)):
    im = Image.new('RGB', (w, h), zemin)
    px = im.load()
    for y in range(0, h):
        for x in range(0, w, 1):
            if random.random() < 0.25:
                r, g, b = px[x, y]; n = random.randint(-6, 6)
                px[x, y] = (r + n, g + n, b + n)
    # hafif ışık gradyanı
    grad = Image.linear_gradient('L').resize((w, h)).point(lambda v: int(v * 0.12))
    im = Image.composite(Image.new('RGB', (w, h), (205, 198, 188)), im, grad)
    return im
def ciz(ad, sekiller, renk, w=800, h=800, zemin=(236, 228, 216), golge=True):
    im = tuval(w, h, zemin)
    if golge:
        g = Image.new('L', (w, h), 0); dg = ImageDraw.Draw(g)
        for tip, pts in sekiller:
            off = [(x + 10, y + 12) for x, y in pts] if tip == 'p' else None
            if tip == 'p': dg.polygon(off, fill=70)
            elif tip == 'e': dg.ellipse([pts[0] + 10, pts[1] + 12, pts[2] + 10, pts[3] + 12], fill=70)
        g = g.filter(ImageFilter.GaussianBlur(14))
        im = Image.composite(Image.new('RGB', (w, h), (150, 140, 130)), im, g)
    d = ImageDraw.Draw(im)
    for tip, pts in sekiller:
        if tip == 'p': d.polygon(pts, fill=renk)
        elif tip == 'e': d.ellipse(pts, fill=renk)
        elif tip == 'r': d.ellipse(pts, outline=renk, width=22)
    # kumaş dokusu
    px = im.load()
    for y in range(h):
        for x in range(w):
            if px[x, y] == renk and random.random() < 0.3:
                n = random.randint(-10, 10); px[x, y] = tuple(max(0, min(255, c + n)) for c in renk)
    im.save(os.path.join(D, ad + '.jpg'), quality=88)
# üst kısa kollu
ciz('tisort_kirmizi', [('p', [(280, 150), (350, 130), (400, 165), (450, 130), (520, 150), (640, 250), (585, 320), (540, 285), (540, 660), (260, 660), (260, 285), (215, 320), (160, 250)])], (196, 40, 58))
# kazak uzun kollu (kollar sarkıyor, gövdeden boşlukla)
ciz('kazak_krem', [('p', [(300, 130), (500, 130), (600, 170), (650, 640), (590, 650), (545, 300), (545, 690), (255, 690), (255, 300), (210, 650), (150, 640), (200, 170)])], (238, 226, 205))
# pantolon
ciz('pantolon_lacivert', [('p', [(270, 90), (530, 90), (560, 720), (430, 720), (402, 300), (398, 300), (370, 720), (240, 720)])], (32, 44, 72), w=800, h=800)
# şort
ciz('sort_mavi', [('p', [(220, 230), (580, 230), (620, 560), (440, 570), (402, 400), (398, 400), (360, 570), (180, 560)])], (80, 110, 150))
# etek
ciz('etek_bordo', [('p', [(300, 180), (500, 180), (600, 620), (200, 620)])], (108, 31, 47))
# elbise
ciz('elbise_yesil', [('p', [(330, 60), (360, 60), (400, 110), (440, 60), (470, 60), (470, 260), (440, 330), (590, 760), (210, 760), (360, 330), (330, 260)])], (47, 124, 74), h=820)
# ayakkabı yandan
ciz('ayakkabi_siyah', [('p', [(150, 330), (300, 330), (330, 420), (420, 450), (620, 480), (660, 520), (660, 560), (150, 560)])], (30, 29, 33))
# ayakkabı çifti üstten
ciz('spor_beyaz', [('e', [190, 200, 370, 640]), ('e', [430, 200, 610, 640])], (248, 248, 246), zemin=(120, 135, 150))
# çanta (sap halkası)
ciz('canta_taba', [('p', [(220, 380), (580, 380), (610, 680), (190, 680)]), ('r', [300, 180, 500, 460])], (174, 122, 75))
# uzun kaban
ciz('kaban_gri', [('p', [(310, 70), (490, 70), (590, 110), (650, 560), (595, 570), (555, 260), (560, 760), (240, 760), (245, 260), (205, 570), (150, 560), (210, 110)])], (142, 141, 147), h=820)
# atkı
ciz('atki_mor', [('p', [(330, 60), (440, 60), (440, 760), (330, 760)])], (105, 64, 142))
# karışık arka plan (tanıma zor)
im = Image.new('RGB', (800, 800))
px = im.load()
for y in range(800):
    for x in range(800):
        px[x, y] = ((x * 7 + y * 3) % 255, (x * 2 + y * 9) % 255, (x * 5) % 255)
d = ImageDraw.Draw(im); d.polygon([(300, 200), (500, 200), (540, 600), (260, 600)], fill=(230, 140, 160))
im.save(os.path.join(D, 'karisik_pembe.jpg'), quality=85)
# bozuk dosya
open(os.path.join(D, 'bozuk.jpg'), 'wb').write(b'\xff\xd8\xff\xe0' + os.urandom(3000))
open(os.path.join(D, 'metin.txt'), 'w').write('merhaba')
print(sorted(os.listdir(D)))
