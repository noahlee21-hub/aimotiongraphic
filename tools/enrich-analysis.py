import json
from pathlib import Path
import numpy as np
from PIL import Image
p=Path('shots.json');d=json.loads(p.read_text());rows=[]
for s in d['shots']:
 f=s['frame'];a=np.asarray(Image.open(f'reference-analysis/frames/{min(f,489):04d}.jpg').convert('RGB'))
 edges=np.concatenate([a[:18].reshape(-1,3),a[-18:].reshape(-1,3),a[:,:18].reshape(-1,3),a[:,-18:].reshape(-1,3)])
 rgb=np.median(edges,axis=0).astype(int);color='#'+''.join(f'{x:02x}' for x in rgb)
 if f<134: bounds='전체 화면 크롭; 완성 글자 없음';cam='도판 확대/이동; 원본 프레임 직접 사용';obj='개별 분리 동작 없음'
 elif f<160: bounds='중앙 확대, 일부 가장자리 잘림 → 전체 윤곽';cam='축소 방향의 계단식 변화 (2프레임 간격 추정)';obj='정적인 도판'
 elif f<333: bounds='중심 약 (360,360), 높이 약 560–620px; 소재별 여백 차이';cam='고정에 가까운 짧은 홀드';obj='소재 교체; 부정형/양각형 교차'
 elif f==333: bounds='중앙, 꽃/가지 전체 높이 약 570px';cam='고정';obj='꽃잎이 원래 꽃에서 순차 분리, 바깥/아래로 이동'
 elif f==353: bounds='초기 중심 약 (360,360), 높이 약 590px → 화면 밖';cam='배경 고정';obj='개별 날갯짓·이륙·접근; 큰 붉은 나비가 전경 가림'
 else: bounds='중앙 기준선 약 y389px, 원본 글자 높이 약 105px';cam='고정';obj='388 이후 기존 나비 잔류, 484 이후 마지막 나비 접근'
 s['backgroundEdgeMedian']=color;s['compositionObservation']=bounds;s['cameraObservation']=cam;s['objectObservation']=obj
 rows.append(f"| {f} | {s['label']} | {color} | {bounds} | {cam} | {obj} |")
p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
r=Path('reference-analysis/shot-by-shot.md');t=r.read_text().replace('끝 프레임은 미포함.','아래 범위의 끝 번호는 포함하며, JSON의 endFrame만 미포함이다.')
t+='\n## 배경·구도·카메라·개체 기록\n\n배경색은 원본 각 시작 프레임 외곽 18px의 중앙값이다. 종이 질감과 주변 소재를 포함하므로 순수 배경색 측정치는 아니다. 위치·크기는 720px 화면에서 시각적으로 읽은 근사값이며 원본 편집 데이터가 아니다. 컷 경계는 전후 프레임을 직접 검토했다.\n\n| 시작 프레임 | 소재 | 외곽 색 중앙값 | 글자/구도 관찰 | 카메라 | 개체 |\n|---|---|---|---|---|---|\n'+'\n'.join(rows)+'\n'
t+='''
## 이전 구현과 이번 변경

- 30Hz 변화검출 시각을 24fps 실제 프레임 경계로 교체했다. 64개의 장면 구간으로 편집한다.
- 9개 타일/일반 도형 대체를 없애고 원본 장면별 참조를 가진 51개 N 이미지로 바꿨다. 악보, 동전, 양각/음각 우표, 현미경, X-ray, 배양 접시를 각각 대응한다.
- 첫 134프레임은 글자 없는 원본 도판을 그대로 사용해 카메라 이동을 보존한다.
- 빠른 몽타주는 디졸브 없이 프레임 경계에서 교체한다. N 중앙과 외곽 크기는 생성 단계에서 정렬했으나 유기적 소재의 픽셀 윤곽까지 같지는 않다.
- 꽃잎을 해당 N 꽃 이미지에서 마스크로 분리했다. 줄기를 움직이는 카메라 효과는 넣지 않았다.
- 원본 나비 14개 표본을 개별 마스크로 분리해 N을 구성한다. 몸통과 좌우 날개를 따로 WebGL에서 투영한다. 한 무리만 이륙하며 가까운 개체만 흐려진다.
- 마지막 두 장면은 원본 격자 종이를 사용하되 문구를 N 한 글자로 교체한다.

## 남는 차이 / 추정에 기반한 구현

51개 N 도판은 ImageGen으로 재구성한 이미지이므로 원본의 세부 삽화·글자·동전 문양이 픽셀 단위로 동일하지 않다. N의 두 세로획과 대각획 때문에 개체의 배치와 밀도가 달라진다. 나비의 개별 경로·지연·날개 각도와 깊이는 화면 관찰을 바탕으로 조정한 2.5D 근사이며 원작의 리그를 복원한 것은 아니다. 꽃잎의 연결 부위/가려진 종이는 주변 종이로 보완한다. 초반 도판 및 원본 오디오를 포함하므로 이 결과는 제공된 영상에 의존한다. 마지막 타이포는 Georgia로 대응했고 원본 폰트 파일은 확보하지 않았다.
'''
r.write_text(t)
