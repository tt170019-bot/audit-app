# 심사 점검표 앱 디자인 기준

이 문서는 이 저장소의 화면 변경 기준입니다. 방향은 `minimalist-ui`
(warm monochrome editorial) 를 현장 심사 도구에 맞게 적용한 것입니다.
마케팅용 히어로·장식 카드·사진·일러스트·그라데이션은 이 앱에 적용하지
않습니다 — 기능 도구입니다.

## 방향

- 라이트 모드 전용
- Pretendard 로컬 가변폰트만 사용: `./fonts/PretendardVariable.woff2`.
  serif 없음. 에디토리얼 위계는 크기·굵기·자간·색 대비로만 만든다.
- 전체 배경은 웜본(`#F7F6F3`), 카드는 순백(`#FFFFFF`). 색은 희소
  자원이며 대부분 의미 전달에만 쓴다.
- 주 실행 색은 브랜드 색조가 아니라 차콜(`#1A1A18`)이다.

## 색상 토큰

- 배경 `--page-bg` #F7F6F3 / 카드 `--card-bg` #FFFFFF
- 본문 `--text-primary` #1F1F1D / 보조 `--text-secondary` #6B6B66 /
  흐린 라벨 `--ads-text-subtlest` #9A9A93
- 주 실행/선택/포커스 강조: 차콜 `--ads-brand` #1A1A18, hover #333331
- 포커스 링 `--focus-ring` `0 0 0 3px #E1F3FE` (pale blue), 선택 소프트
  배경 `--selected-bg` #E1F3FE
- 상태 색(카드·배지·상태 버튼 공용, 워시드 파스텔):
  - YES `--ads-success-bg` #EDF3EC / text #346538
  - NO  `--ads-danger-bg` #FDEBEC / text #9F2F2D
  - OBS `--ads-obs-bg` #F0EEFA / text #5B4B96 (워시드 라벤더)
  - N/A `--ads-neutral-bg` #F1F1EF / text #6B6B66
  - 경고 `--ads-warning-bg` #FBF3DB / text #956400
- 파괴적 실행 버튼(`.btn-danger`)의 솔리드 색은 대비 확보를 위해
  `#DC2626` 을 유지한다. 워시드 핑크는 흰 글자 대비가 부족하다.
- 카드 테두리 `--ads-border` #EAEAEA (1px)
- 그림자: 평상시 거의 없음 `--shadow-card` `0 1px 2px rgba(0,0,0,.03)`.
  상호작용 카드(`.audit-item`)만 hover 시 `--shadow-card-hover`
  `0 2px 8px rgba(0,0,0,.04)` 로 살짝 뜬다.

## 타이포그래피

- 본문·입력: 16px
- 페이지 제목: 24px / weight 600 / 자간 -0.02em
- KPI 숫자: 32px / weight 600 / 자간 -0.03em / tabular-nums
- 섹션 헤더: 13px / weight 500 / 흐린 색 / 자간 0.02em — 제목이 아니라
  조용한 라벨. 한글이므로 uppercase 하지 않는다.
- 필드 캡션 라벨(RESULT / COMMENT(S) / EVIDENCE, 라틴): 12px, 흐린 색,
  uppercase, 자간 0.06em 유지
- 버튼: 14px / weight 500
- 보조 텍스트: 13px

## 간격과 모양

- 기준 단위 4px
- 모바일 가장자리·카드 간격 14px(`--mobile-page-padding`), 인접 카드
  세로 간격 14px(`--card-stack-gap`), 데스크톱 그리드 gap 16px
- 데스크톱 섹션 헤더 상단 여백 32px(매크로 화이트스페이스). 모바일은
  현장 밀도를 위해 16px 유지
- 카드 radius 12px(`--radius-large`), 버튼·입력·작은 요소 8px
  (`--radius-medium`), 주 실행 버튼 6px(`--radius-small`)
- 모달 시트 상단 코너 16px

## 상태 버튼과 입력창

- 상태 버튼(YES/NO/OBS/N/A)은 테두리 없이 배경·텍스트 색으로만 구분.
  미선택 시 배경 `#F7F6F3`, 텍스트 보조 회색. 선택 시 해당 워시드
  파스텔 배경 + 해당 상태 텍스트 색.
- 입력창은 카드와 같은 흰 배경, 테두리로만 구분. 포커스 시 배경 그대로,
  테두리를 차콜로, `--focus-ring` pale blue 글로우 추가.
- 항목 번호 칩(`.check-input-no`)은 채우지 않고 1px 테두리 아웃라인으로
  조용하게 둔다.

## 컴포넌트

- 주 실행 버튼: 차콜 배경, 흰 글자, radius 6px, 그림자 없음,
  `:active` 시 `scale(0.98)`
- 배지: pill, 소형, uppercase(라틴), 자간 0.05em, 워시드 파스텔 배경
- 아코디언(참조 토글, 템플릿 설정): 컨테이너 박스 없음, `border-top`
  1px 만. 토글 표시는 회전 셰브런이 아니라 `+` / `−` 글리프 교체.

## 아이콘

- 현재: 인라인 SVG, stroke 2.25, round cap/join 통일.
- `minimalist-ui` 는 얇은 라인 아이콘 세트를 금지하고 Phosphor
  Bold/Fill 을 요구한다. 실제 Phosphor path 교체는 향후 작업(Approach
  B)으로 남긴다 — 오프라인 인라인 SVG 라 최소 변경을 우선했다.

## 상호작용과 모션

- 44px 는 모든 터치 조작 대상의 최소 클릭·터치 영역이다. 버튼의 보이는
  높이로 해석하지 않는다. 시각 크기가 44px 보다 작은 요소는 투명한 히트
  영역으로 44px 를 확보한다.
- 결과 상태는 색 외에 텍스트로도 구분한다.
- 스크롤 진입 시 카드·리스트 항목이 1회만 페이드+상승(12px, 600ms
  `cubic-bezier(.16,1,.3,1)`, 최대 6개 stagger)한다. `motion.js` 담당.
- `prefers-reduced-motion: reduce` 시 모션은 완전히 꺼진다(페이드·이동·
  트랜지션 없음). `motion.js` 미실행 시에도 콘텐츠는 항상 보인다
  (`body.motion-ready` 게이트).

## 유지 원칙 (현장 도구)

- 마케팅 히어로, 장식 카드, 그라데이션, 앰비언트 배경 없음
- 데스크톱에서도 바깥 여백을 없애지 않고 열·콘텐츠 폭으로 확장
- 밀도가 필요한 현장 화면에서는 모바일 간격을 데스크톱보다 촘촘히 둔다
