# 심사 점검표 앱 — 배포 가이드

오프라인 동작 모바일 PWA. 인터넷 없이 심사 점검표를 작성하고, 온라인 복귀 후 Excel/Word로 내보내거나 Google Drive에 업로드합니다.

---

## 파일 구성

```
audit-app/
├── index.html              # 앱 전체 (단일 파일)
├── sw.js                   # Service Worker (오프라인 캐시)
├── manifest.json           # PWA 설정 (홈 화면 설치)
├── icon-192.png            # 앱 아이콘 192px (직접 제작)
├── icon-512.png            # 앱 아이콘 512px (직접 제작)
└── IOSA_점검표_샘플.xlsx   # 점검표 샘플 (앱에 업로드용)
```

---

## 배포 방법 (권장: Vercel — 무료)

### 1단계 — GitHub 저장소 생성
```bash
git init
git add .
git commit -m "init: audit app"
git remote add origin https://github.com/yourname/audit-app.git
git push -u origin main
```

### 2단계 — Vercel 배포
1. https://vercel.com 에서 GitHub 계정으로 로그인
2. "New Project" → 저장소 선택 → Deploy
3. 자동 HTTPS URL 발급 (예: `https://audit-app-xxx.vercel.app`)

### 3단계 — 모바일 설치 (홈 화면 추가)

**iOS Safari:**
- 앱 URL 접속 → 공유 버튼(□↑) → "홈 화면에 추가" → 추가

**Android Chrome:**
- 앱 URL 접속 → 주소창 우측 ⋮ 메뉴 → "앱 설치" 또는 "홈 화면에 추가"

설치 후 **인터넷 없이** 앱 아이콘으로 실행 가능합니다.

---

## 오프라인 사용 흐름

```
1. 사무실(온라인) ──→ 앱 열기 (캐시됨)
2. 현장(오프라인) ──→ 앱 실행 → 점검표 작성 → IndexedDB 자동 저장
3. 사무실 복귀    ──→ [내보내기] → Excel / Word 다운로드
                                 → Google Drive 업로드
```

---

## Excel 점검표 형식

| A열 | B열 | C열 | D열 | E열 |
|-----|-----|-----|-----|-----|
| 섹션명 | 항목번호 | 점검 항목 (필수) | 참조규정 | 점검유형 |
| 1. 운항 일반 | FLT-001 | 운항 매뉴얼은 최신본인가? | IOSA FLT 1.1.1 | OK/NG/NA |

- **1행**: 헤더 (앱이 자동으로 건너뜀)
- **C열**: 필수 — 비어있으면 해당 행 무시
- 첫 번째 시트만 읽음

---

## 결과 코드

| 코드 | 의미 |
|------|------|
| OK | 적합 — 요건 충족 |
| NG | 부적합 — 시정조치 필요 |
| NA | 해당없음 — 적용 불가 |
| OBS | 관찰사항 — 개선 권고 |

---

## 내보내기 형식

| 형식 | 내용 |
|------|------|
| Excel (.xlsx) | 요약 시트 + 전체 결과 + 부적합 목록 |
| Word (.doc) | 결과보고서 (표 형식, 부적합 목록 포함) |
| PDF | 인쇄 창에서 "PDF로 저장" 선택 |

---

## Google Drive 연동 (고급 설정)

실제 Drive 업로드를 위해서는 Google Cloud Console에서 OAuth2 설정이 필요합니다:

1. https://console.cloud.google.com → 새 프로젝트
2. API 및 서비스 → Drive API 활성화
3. OAuth 동의 화면 설정
4. 클라이언트 ID 발급 → `index.html`의 `uploadGDrive()` 함수에 적용

---

## 아이콘 제작

앱 아이콘이 없으면 PWA 설치 시 기본 아이콘이 표시됩니다.
아래 사이트에서 무료로 제작 가능:
- https://favicon.io — 텍스트/이모지로 빠르게 생성
- 필요 파일: `icon-192.png`, `icon-512.png`

---

## 기술 스택

| 역할 | 기술 |
|------|------|
| UI 프레임워크 | Vanilla JS + CSS (의존성 최소화) |
| 오프라인 DB | IndexedDB (내장, 추가 설치 없음) |
| 오프라인 캐시 | Service Worker |
| Excel 처리 | SheetJS (CDN, 오프라인 캐시됨) |
| Word 출력 | HTML→.doc (브라우저 내장) |
| PDF 출력 | 브라우저 인쇄 기능 |
