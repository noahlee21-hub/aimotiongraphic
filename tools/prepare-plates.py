from pathlib import Path
from PIL import Image,ImageDraw
import json
root=Path('assets/plates')
for path in root.glob('*.png'):
 out=path.with_suffix('.jpg')
 if not out.exists() or out.stat().st_mtime<path.stat().st_mtime:
  im=Image.open(path).convert('RGB');im.thumbnail((1024,1024));im.save(out,quality=93,subsampling=0,optimize=True)
shots=json.loads(Path('shots.json').read_text())['shots'];keys=list(dict.fromkeys(s['key'] for s in shots if 134<=s['frame']<353))
for page in range((len(keys)+11)//12):
 group=keys[page*12:page*12+12];out=Image.new('RGB',(1200,960),'#333');d=ImageDraw.Draw(out)
 for i,key in enumerate(group):
  path=root/f'{key}.jpg'
  if not path.exists():continue
  im=Image.open(path).resize((300,300));x=(i%4)*300;y=(i//4)*320;out.paste(im,(x,y));d.text((x+5,y+303),key,fill='white')
 out.save(f'reference-analysis/generated-{page}.jpg',quality=88)
print('ready',len(list(root.glob('*.jpg'))),'expected',len(keys))
