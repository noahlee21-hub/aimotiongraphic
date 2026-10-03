import json
from pathlib import Path
from PIL import Image, ImageDraw
root=Path('reference-analysis/frames'); data=json.loads((root/'timing.json').read_text())
# Every frame of the dense montage is reviewed, not just automatic candidates.
ranges=[(0,136,4),(134,320,1),(318,392,2),(390,490,4)]
for part,(start,end,step) in enumerate(ranges):
 frames=list(range(start,end,step))
 for page in range((len(frames)+23)//24):
  group=frames[page*24:page*24+24];out=Image.new('RGB',(1440,1040),'#333333');d=ImageDraw.Draw(out)
  for j,f in enumerate(group):
   im=Image.open(root/f'{f:04d}.jpg');im.thumbnail((240,240));x=(j%6)*240;y=(j//6)*260;out.paste(im,(x,y));d.text((x+5,y+242),f'{f:03d} | {f/24:.4f}s | d {data["frames"][f]["difference"]:.3f}',fill='white')
  out.save(f'reference-analysis/review-{part}-{page}.jpg',quality=90)
print([(r['frame'],round(r['difference'],3)) for r in data['frames'] if r['difference']>.08])
