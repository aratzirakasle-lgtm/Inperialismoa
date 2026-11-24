"""Restore native-resolution atlas graphics from the approved reference.

The original artwork is a design source, never a live screen. Static team progress,
dates, labels and reward graphics are removed or rendered separately by the UI.
"""
from pathlib import Path
import math
import re
import base64
from io import BytesIO
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFilter

ROOT=Path(__file__).resolve().parents[1]
A=ROOT/'assets'
R=Image.open(A/'atlas-original-hd.webp').convert('RGB')
assert R.size==(1672,941), R.size
S=R.resize((1648,928),Image.Resampling.LANCZOS)
a=np.array(S)
rng=np.random.default_rng(21)

def texture(w,h):
    sample=a[464:540,402:429].astype(float)
    detail=sample-cv2.GaussianBlur(sample,(0,0),2.4)
    tile=np.zeros((h,w,3));weight=np.zeros((h,w,1));size=26
    win=np.outer(np.hanning(size),np.hanning(size))[...,None]+.02
    for y0 in range(-13,h,13):
        for x0 in range(-13,w,13):
            sy=int(rng.integers(0,detail.shape[0]-size+1));sx=int(rng.integers(0,detail.shape[1]-size+1))
            p=np.rot90(detail[sy:sy+size,sx:sx+size],int(rng.integers(0,4)))
            ya=max(0,y0);yb=min(h,y0+size);xa=max(0,x0);xb=min(w,x0+size)
            ww=win[ya-y0:yb-y0,xa-x0:xb-x0]
            tile[ya:yb,xa:xb]+=p[ya-y0:yb-y0,xa-x0:xb-x0]*ww;weight[ya:yb,xa:xb]+=ww
    tile/=np.maximum(weight,.001)
    low=cv2.resize(rng.normal(0,1,(9,8)),(w,h),interpolation=cv2.INTER_CUBIC)
    y,x=np.mgrid[:h,:w];low=low*5+8*np.sin(x/w*np.pi)-4*y/h
    return np.clip(np.array([225,190,145])+tile*.75+low[...,None],0,255).astype('uint8')

def book():
    base=a.copy();mask=np.zeros(a.shape[:2],np.uint8)
    for poly in [[(169,264),(376,237),(403,248),(435,683),(206,712),(160,701),(165,683)],[(427,247),(451,222),(667,218),(687,240),(692,270),(724,650),(706,685),(465,700),(448,665)]]:
        cv2.fillPoly(mask,[np.array(poly,np.int32)],255)
    for y in range(620,728):
        x0=int(148+(y-620)*.1)
        if y<710:base[y,x0:207]=a[y-220,x0:207]
        elif y<727:base[y,x0:207]=a[y,240:240+207-x0]
    tex=texture(620,540);xx,yy=126,194
    m=cv2.GaussianBlur(mask,(0,0),5).astype(float)/255
    sub=base[yy:yy+540,xx:xx+620];sm=m[yy:yy+540,xx:xx+620,None]
    Y,X=np.mgrid[:540,:620];shade=-19*np.exp(-((X-293)/21)**2)-5*np.exp(-((X-40)/15)**2)+5*np.sin(X/620*np.pi)
    tex=np.clip(tex.astype(float)+shade[...,None],0,255)
    base[yy:yy+540,xx:xx+620]=(sub*(1-sm)+tex*sm).astype(np.uint8)
    out=Image.fromarray(base).crop((126,194,764,738)).convert('RGBA')
    alpha=Image.new('L',out.size);d=ImageDraw.Draw(alpha)
    pts=[(133,255),(149,238),(197,226),(276,214),(350,210),(395,220),(418,213),(490,206),(591,199),(688,196),(707,205),(715,224),(754,679),(753,697),(742,708),(710,716),(455,728),(439,724),(421,718),(384,716),(205,730),(160,726),(150,715)]
    d.polygon([(x-126,y-194) for x,y in pts],fill=255);out.putalpha(alpha.filter(ImageFilter.GaussianBlur(.7)))
    return out

def cut(box,poly=None):
    im=R.crop(box).convert('RGBA')
    if poly:
        mask=Image.new('L',im.size);ImageDraw.Draw(mask).polygon(poly,fill=255);im.putalpha(mask.filter(ImageFilter.GaussianBlur(.65)))
    return im

def clear(im,poly):
    rgb=np.array(im.convert('RGB'));m=np.zeros(rgb.shape[:2],np.uint8)
    cv2.fillPoly(m,[np.array(poly,np.int32)],255)
    gray=cv2.cvtColor(rgb,cv2.COLOR_RGB2GRAY);bg=cv2.GaussianBlur(gray,(0,0),5)
    ink=(gray.astype(int)<bg.astype(int)-12).astype(np.uint8)*255
    ink=cv2.dilate(ink,np.ones((3,3),np.uint8),iterations=1)&m
    repaired=cv2.inpaint(rgb,ink,4,cv2.INPAINT_TELEA)
    out=Image.fromarray(repaired).convert('RGBA');out.putalpha(im.getchannel('A'));return out

def warp_page():
    pts=np.float32([(155,252),(397,228),(442,709),(169,722)])
    dst=np.float32([(0,0),(279,0),(279,479),(0,479)])
    return Image.fromarray(cv2.warpPerspective(a,cv2.getPerspectiveTransform(pts,dst),(280,480)))

items={
 'atlas-pasaporte-foto':book(),
 'atlas-pagina-retrato':warp_page(),
 'atlas-mapa-referencia':cut((734,199,1167,417)),
 'atlas-expediente-foto':clear(cut((530,680,1170,941),[(22,91),(55,62),(502,2),(525,38),(607,79),(585,165),(637,236),(630,252),(240,261),(42,261)]),[(170,95),(422,65),(436,89),(181,127)]),
 'atlas-brujula-foto':cut((0,620,420,941),[(0,28),(72,39),(80,18),(105,9),(148,11),(183,32),(207,73),(215,108),(212,129),(247,124),(294,126),(342,145),(367,171),(373,197),(392,207),(408,224),(402,248),(377,253),(356,237),(163,254),(153,275),(0,308)]),
 'atlas-medalla-referencia-1':cut((482,567,565,706),[(4,6),(68,1),(66,30),(54,43),(45,48),(43,57),(52,64),(73,76),(80,96),(76,115),(61,133),(41,138),(19,131),(5,114),(2,95),(9,77),(23,64),(35,59),(33,53),(17,48),(7,31)]),
 'atlas-medalla-referencia-2':cut((598,558,684,697),[(4,7),(65,1),(66,31),(55,45),(44,51),(44,56),(56,62),(74,77),(81,95),(76,117),(60,132),(40,137),(19,130),(5,114),(2,94),(9,76),(23,63),(33,58),(32,51),(18,47),(8,31)]),
 'atlas-cartela-titulo-real':clear(cut((794,455,950,494)),[(21,8),(135,8),(135,31),(21,31)]),
}

# Transparent outer frame: the original illustration, title and completion label
# are completely excluded from the frame image.
frame=cut((778,439,970,674))
w,h=frame.size
alpha=Image.new('L',(w,h),0);d=ImageDraw.Draw(alpha)
outer=[(4,24),(12,22),(19,13),(73,13),(85,7),(95,4),(108,7),(119,13),(174,13),(181,22),(186,24),(186,218),(179,221),(173,230),(16,230),(10,222),(4,219)]
inner=[(12,29),(19,27),(24,21),(166,21),(173,27),(179,32),(179,211),(170,216),(166,222),(22,222),(17,216),(12,211)]
sc=lambda p:[(round(x*w/189),round(y*h/236)) for x,y in p]
d.polygon(sc(outer),fill=255);d.polygon(sc(inner),fill=0);frame.putalpha(alpha.filter(ImageFilter.GaussianBlur(.35)))
items['atlas-marco-referencia']=frame

# Use the existing clean green plaque (small, already native-size), rather than
# risk leaving a ghost of the reference's completed-state text on screen.
# The source remains vector-styled via the existing CSS.

room=Image.new('RGB',(1672,941),(28,35,26))
for box in [(0,0,365,142),(0,0,103,653),(1563,0,1672,735),(360,0,610,120),(1085,0,1505,125)]:
    room.paste(R.crop(box),box[:2])
wood=R.crop((408,755,536,785))
wood2=Image.new('RGB',(256,30));wood2.paste(wood,(0,0));wood2.paste(wood.transpose(Image.Transpose.FLIP_LEFT_RIGHT),(128,0))
for y in range(735,941,30):
    for x in range(0,1672,256):room.paste(wood2,(x,y))
items['atlas-sala-referencia']=room
items['atlas-madera-referencia']=wood2

# The four small reference paintings have only ~165 source pixels each.
# Use native-pixel crops from the larger, already-approved museum art for the
# same four subjects. Crop ONLY the painting, never labels, flags used as answer
# choices, exercise text, status indicators or clues.
scenes=[
 ('inperioen-art-angola-v5.webp',(110,250,625,550)),
 ('inperioen-art-indonesia-v5.webp',(112,267,703,573)),
 ('inperioen-art-india-v5.webp',(92,247,524,566)),
 ('inperioen-art-angola-v5.webp',(1135,699,1434,879)),
]
for i,(src,box) in enumerate(scenes,1):
    original=Image.open(A/src).convert('RGB')
    assert original.size==(1672,941)
    items[f'atlas-mission-hd-{i}']=original.crop(box)

for name,im in items.items():
    out=A/(name+'-hd.webp' if not name.startswith('atlas-mission-hd-') else name+'.webp')
    im.save(out,quality=94,method=6)
    with Image.open(out) as checked:
        assert checked.size==im.size, name
    print(out.name, im.size, out.stat().st_size)

# Keep old SVGs and PNGs for reversibility; switch only the atlas renderers.
css=A/'museum-expedition.css'
s=css.read_text(encoding='utf-8')
for name in items:
    if not name.startswith('atlas-mission-hd-') and not name.startswith('atlas-medalla-referencia-'):
        s=s.replace('./'+name+'.svg','./'+name+'-hd.webp')
s=s.replace("url('./atlas-mission-1.png')","url('./atlas-mission-hd-1.webp')")
css.write_text(s,encoding='utf-8')

for p in [ROOT/'js/museum-expedition.js',ROOT/'js/museum-passport.js']:
    s=p.read_text(encoding='utf-8')
    for i in range(1,5):s=s.replace(f'atlas-mission-{i}.png',f'atlas-mission-hd-{i}.webp')
    s=s.replace('atlas-mapa-referencia.svg','atlas-mapa-referencia-hd.webp').replace('atlas-brujula-foto.svg','atlas-brujula-foto-hd.webp')
    s=s.replace("atlas-medalla-referencia-'+id+'.svg","atlas-medalla-referencia-'+id+'-hd.webp")
    s=re.sub(r'(museum-passport\.js)\?v=[\w-]+',r'\1?v=20261124-atlas-hd19',s)
    p.write_text(s,encoding='utf-8')
for path in ['js/app.js','index.html']:
    p=ROOT/path;s=p.read_text(encoding='utf-8')
    s=re.sub(r'(museum-expedition\.js|museum-expedition\.css|app\.js)\?v=[\w-]+',r'\1?v=20261124-atlas-hd19',s)
    p.write_text(s,encoding='utf-8')
