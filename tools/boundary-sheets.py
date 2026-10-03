import json
from pathlib import Path
from PIL import Image,ImageDraw
shots=json.loads(Path('shots.json').read_text())['shots']
for page in range((len(shots)-1+15)//16):
 group=shots[1:][page*16:page*16+16];out=Image.new('RGB',(1280,1360),'#333');d=ImageDraw.Draw(out)
 for j,s in enumerate(group):
  for k,f in enumerate([s['frame']-1,s['frame']]):
   im=Image.open(f'reference-analysis/frames/{f:04d}.jpg').resize((160,160));x=(j%4)*320+k*160;y=(j//4)*340;out.paste(im,(x,y));d.text((x+2,y+164),f'{f} {s["key"]}',fill='white')
 out.save(f'reference-analysis/boundaries-{page}.jpg',quality=90)
