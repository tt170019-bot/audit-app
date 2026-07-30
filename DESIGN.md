# 심사 점검표 앱 디자인 기준

이 문서는 이 저장소의 화면 변경 기준입니다. 원본 참고 문서는
`C:\Users\twayair\Downloads\DESIGN-linear.app.md`이며, 이 앱에는 현장 심사
작업 화면에 맞는 아래 규칙을 우선 적용합니다.

## 방향

- 라이트 모드 전용
- Pretendard 로컬 변수 폰트 사용: `./fonts/PretendardVariable.woff2`
- 전체 페이지 배경은 연한 청회색(`#F4F5F7`), 카드는 순백(`#FFFFFF`)으로
  표면 위계를 나누고, 인디고 액센트(`#4F46E5`)는 주요 버튼, 선택 상태,
  포커스에만 사용
- 마케팅용 히어로, 장식용 카드, 그라데이션은 사용하지 않음

## 색상 토큰

- 배경: `--page-bg` #F4F5F7 / 카드 `--card-bg` #FFFFFF
- 본문 텍스트 `--text-primary` #181B22 / 보조 텍스트 `--text-secondary` #6B7280 /
  흐린 텍스트·라벨 `--ads-text-subtlest` #9AA1AC
- 액센트 `--ads-brand` #4F46E5, 소프트 배경 `--selected-bg` #EEF0FE
- 상태 색상(카드·배지·상태 버튼 공용):
  - YES `--ads-success-text` #16A34A / 배경 `--ads-success-bg` #EAF7EF
  - NO `--ads-danger-text` #DC2626 / 배경 `--ads-danger-bg` #FDEEEE
  - OBS(라벤더) `--ads-obs-text` #8B7CF6 / 배경 `--ads-obs-bg` #F1EEFE
  - N/A는 중립 회색(`--ads-neutral-*`) 유지
- 카드 테두리 `--ads-border` #E6E8EC(1px), 그림자 `--shadow-card`
  `0 2px 8px rgba(20,20,43,0.06)`

## 간격과 카드

- 기준 단위: 4px
- 모바일 창 가장자리와 카드 사이: 14px(`--mobile-page-padding`)
- 인접 카드 사이 세로 간격: 14px(`--card-stack-gap`)
- 섹션 제목, 요약, 카드, 주요 실행 영역은 같은 14px 기준선에 정렬
- 카드 모서리 radius: 18px(`--radius-large`), 버튼·입력창·작은 요소 radius:
  9px(`--radius-medium`)
- 카드 안쪽 여백: 기본 16px, 필드 카드(질문/Result/Comment)는
  20px 18px 22px(위/좌우/아래), 밀도 높은 제어 영역은 12px 허용
- 필드 라벨(Result, Comment(s), Evidence 등) 아래 여백 9px, 입력 섹션
  (Result 버튼 그룹, Comment 입력창 등) 아래 여백 20px, 버튼 그룹 내부
  gap 8px
- 데스크톱에서도 바깥 여백을 없애지 않고, 열과 콘텐츠 폭으로 공간을 확장

## 상태 버튼과 입력창

- 상태 버튼(YES/NO/OBS/N/A)은 테두리 없이 배경·텍스트 색으로만 상태를
  구분한다. 미선택 시 배경은 흰색 또는 `#F4F5F7`, 텍스트는 보조 회색
  (`--ads-text-subtle`)이다. 선택 시 배경은 해당 소프트톤, 텍스트는 해당
  상태 색이다.
- 입력창(textarea 등)은 카드와 같은 흰 배경을 유지하고 테두리로만
  구분한다. 회색 음영을 배경에 주면 비활성처럼 보이므로 피한다. 포커스 시
  배경은 그대로 두고 테두리를 액센트 색으로, `--focus-ring`
  (`0 0 0 3px #EEF0FE`) 글로우만 추가한다.
- 필드 라벨은 본문보다 작게(12px), 흐린 색(`--ads-text-subtlest`),
  uppercase, letter-spacing 0.04em의 캡션 스타일로 낮춰 본문과 위계
  차이를 준다.

## 타이포그래피

- 본문·입력: 16px
- 버튼: 14px, weight 500
- 보조 텍스트: 13px
- 제목: 16px 이상, weight 600

## 상호작용

- 선택된 필터는 라벤더 배경과 흰 글자로 표시
- 보조 버튼은 흰 배경과 명확한 테두리로 배경과 구분
- 44px는 모든 터치 조작 대상의 최소 클릭·터치 영역이다. 버튼의 보이는 높이로 해석하지 않는다.
- 버튼의 시각 규격은 기준 문서의 14px/weight 500, 세로 8px · 가로 14px 패딩, 8px 모서리를 따른다. 작은 보조·관리자·삭제 버튼도 이 규격을 유지한다.
- 시각 크기가 44px보다 작은 버튼·필터·선택 칩은 투명한 히트 영역을 포함해 최소 44px 조작 영역을 확보한다. 입력 필드는 기존 44px 시각 높이를 유지한다.
- 결과 상태는 색상 외 텍스트로도 구분
