#!/usr/bin/env python3
"""Recupera los ocho dibujos de la maleta histórica, sin sustituir sus motivos.

Fuentes existentes de la maqueta original, conservadas en Git:
 - assets/m2-reference-open-leather.webp (pan, chimeneas, trigo, cruz, familia, barco, libros)
 - assets/m2-atlas-original-mission.webp (misionero)
Los recortes proceden de la imagen original, no de imágenes generadas nuevas.
El escalado a 720x540 mejora la definición a tamaño de tarjeta, pero no crea
detalle histórico que no esté en las fuentes.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance
import math

ROOT=Path(__file__).resolve().parents[1]
ASSETS=ROOT/'assets'
SRC=Image.open(ASSETS/'m2-reference-open-leather.webp').convert('RGB')
MISSION=Image.open(ASSETS/'m2-atlas-original-mission.webp').convert('RGB')
# Bounds cerrados antes del texto impreso en la vieja pintura.
CUTS={
  'growth':(SRC,(271,42,357,88)),
  'conditions':(SRC,(176,40,251,89)),
  'better':(SRC,(65,40,151,88)),
  'conversion':(SRC,(184,145,222,194)),
  'settlement':(SRC,(386,39,456,89)),
  'missions':(MISSION,(0,0,248,78)),
  'oceania':(SRC,(385,149,470,193)),
  'faith':(SRC,(271,149,359,192)),
}
for key,(source,box) in CUTS.items():
  crop=source.crop(box)
  w,h=crop.size
  pix=crop.load()
  alpha=Image.new('L',(w,h))
  mask=alpha.load()
  for y in range(h):
    for x in range(w):
      r,g,b=pix[x,y]
      luma=.2126*r+.7152*g+.0722*b
      # El papel antiguo se vuelve transparente; la tinta y los objetos
      # históricos siguen visibles. El centro no se sustituye por iconos.
      amount=max(0,min(1,(207-luma)/68))
      v=max(0,min(255,round(255*(amount-.08)/.92)))
      # Borde suave para evitar filtrar los márgenes de las cartelas.
      ex=abs((x+.5-w/2)/(w*.55))
      ey=abs((y+.5-h/2)/(h*.56))
      border=max(0,min(1,(1.20-ex*ex-ey*ey)*4))
      mask[x,y]=round(v*border)
  if key=='better':
    # La miga es clara: preservar el pan completo, sin perforar sus luces.
    outline=Image.new('L',(w,h))
    d=ImageDraw.Draw(outline)
    d.polygon([(4,41),(7,34),(16,23),(27,18),(39,11),(55,5),(72,5),(82,11),(84,17),(78,27),(64,34),(45,43),(22,47),(7,47)],fill=255)
    alpha=outline.filter(ImageFilter.GaussianBlur(.9))
  else:
    alpha=alpha.filter(ImageFilter.GaussianBlur(.46))
  result=crop.convert('RGBA')
  result.putalpha(alpha)
  # El origen se conserva. Lanczos + unsharp mejora el escalado.
  maxwidth,maxheight=620,350
  scale=min(maxwidth/w,maxheight/h)
  item=result.resize((round(w*scale),round(h*scale)),Image.Resampling.LANCZOS)
  rgba=item.split()
  sharpen=Image.merge('RGB',rgba[:3]).filter(ImageFilter.UnsharpMask(radius=1.15,percent=85,threshold=3))
  item=Image.merge('RGBA',(*sharpen.split(),rgba[3]))
  canvas=Image.new('RGBA',(720,540),(0,0,0,0))
  canvas.alpha_composite(item,((720-item.width)//2,(540-item.height)//2))
  out=ASSETS/f'm2-vintage-{key}-transparent.webp'
  canvas.save(out,'WEBP',quality=89,method=6)
  assert Image.open(out).getpixel((0,0))[3]==0
  print(out.name,out.stat().st_size,'bytes',canvas.size)
