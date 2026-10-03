import json
from pathlib import Path
# Every montage frame inspected in review-1-0 through review-1-7. Boundary indices are zero based.
entries=[(0,'opening','나비 도판 클로즈업'),(36,'map-intro','고지도'),(62,'ceramics-intro','도자기 도판'),(86,'fruit-intro','열매 도판'),(102,'garden-intro','정원 평면도'),(114,'architecture-intro','건축 단면'),(124,'birds-intro','새 도판'),
(134,'floral-wallpaper','꽃무늬 색지 / 확대'),(142,'polyhedra','기하학 도판 / 확대'),(148,'eggs','알 표본'),(154,'algae','녹색 미생물 도판'),(160,'score','악보'),(164,'flags','국기'),(170,'illuminated','녹색 금박 장식'),(174,'toile','갈색 동물 식물 문양'),(178,'blackletter','옛 활자 / 음각 형태'),(182,'purple-ornament','보라색 동물 장식'),(184,'fish-engraving','물고기 흑백 도판'),(187,'botanical-grid','식물 도판 조각'),(190,'letterpress','검정 활자'),(194,'calligraphy','세로 한자'),(197,'coins','동전'),(200,'snake','뱀'),(203,'fig','무화과 가지'),(206,'stamp-negative','우표 / 음각 형태'),(209,'cards','고전 카드 / 음각 형태'),(211,'fruit','배 사과 가지'),(214,'flowers','꽃 줄기'),(217,'bridge','교량 설계'),(220,'stamps','우표 / 양각 형태'),(223,'bars','흑색 선 도판'),(226,'map','고지도 형태'),(229,'city','도시 도면 / 음각 형태'),(232,'faded-text','옅은 활자'),(235,'anatomy','관절 해부 도판'),(238,'ink-map','흑백 지도'),(241,'network','노랑 연결망'),(244,'blueprint','청사진'),(247,'seaweed','청색 해조류 실루엣'),(250,'paper','노란 종이 조각'),(253,'neurons','형광 신경조직'),(256,'clover','클로버'),(259,'red-dots','빨간 점 / 격자'),(262,'micro-gold','황금색 현미경'),(265,'micro-blue','청색 현미경'),(268,'mushrooms','버섯'),(271,'insects','곤충 표본'),(274,'circuit','회로 X-ray'),(277,'electronics','전자부품 X-ray'),(280,'leaves','흙 위 잎'),(283,'petri-red','빨간 배양 접시'),(286,'cells','형광 주황 세포'),(289,'shells','조개 X-ray'),(292,'fish-xray','물고기 X-ray'),(295,'controller','게임 컨트롤러 X-ray'),(298,'network','노랑 연결망 반복'),(301,'cards','카드 반복'),(304,'fern','고사리 시아노타입'),(308,'autumn','낙엽'),(315,'petri','초록 배양 접시'),(333,'flowers','꽃잎 분리'),(353,'butterflies','나비 N 비행'),(388,'coral','주황 격자 N'),(446,'ivory','밝은 격자 N')]
shots=[]
for i,(frame,key,label) in enumerate(entries):
 end=entries[i+1][0] if i+1<len(entries) else 491
 shots.append(dict(frame=frame,endFrame=end,start=frame/24,end=min(end/24,20.455328798),key=key,label=label,transition='hard-cut' if frame else 'start',verified=True))
Path('shots.json').write_text(json.dumps(dict(fps=24,duration=20.455328798,shots=shots),ensure_ascii=False,indent=2))
lines=['# 컷별 원본 대조표','', '원본 24fps. 프레임 번호는 0부터 시작하며 끝 프레임은 미포함. 몽타주 134–319는 모든 프레임을 시각 비교했다. 초반 경계는 별도 전후 프레임 검토. 숫자/로고만 N으로 변경한다.','', '| 시작–끝 프레임 | 시간(s) | 소재 | 동작/전환 |','|---|---|---|---|']
for s in shots:
 motion='도판 카메라 이동 / 하드 컷' if s['frame']<134 else '형태 정렬 / 하드 컷'
 if s['frame']==333:motion='꽃잎이 원래 꽃 위치에서 분리 / 카메라 고정'
 if s['frame']==353:motion='개별 이륙 → 전경 날개 가림 / 다음 배경까지 비행 지속'
 if s['frame']>=388:motion='배경 컷 / N 타이포 유지'
 lines.append(f"| {s['frame']}–{s['endFrame']-1} | {s['start']:.4f}–{s['end']:.4f} | {s['label']} | {motion} |")
lines += ['', '## 관찰과 추정', '- 관찰: 각 컷 소재·순서, 프레임 경계, 배경, 나비의 화면 내 경로, 꽃잎 분리 시점.', '- 추정: 원작의 실제 3D 깊이·날개 관절 각도·카메라 초점거리. 원본 픽셀에서 유일하게 복원할 수 없다.', '- 이전 오류: 실제 원본은 24fps다. 30Hz 표본 시간은 컷 프레임 번호가 아니며 이 표로 대체한다.', '- 이미지 생성 단계에서는 원본의 재료·종이색·여백을 유지하도록 각 컷을 별도 참조한다. N의 구조에 따른 재배치는 필요하다.']
Path('reference-analysis/shot-by-shot.md').write_text('\n'.join(lines)+'\n')
print('shots',len(shots),'unique generated plates',len(set(s['key'] for s in shots if 134<=s['frame']<353)))
