# Audit App - Checklist Type Split & Maturity Assessment

## 1. 적용 목적

이번 버전은 점검표 유형에 따라 점검 실시 화면을 분리합니다.

- Type 1: 일반 점검표
- Type 2: 성숙도 점검표

2번 체크리스트(checklist-2 또는 현장탑승심사표 계열)는 Type 2로 판별되어 성숙도 점검 UI가 표시됩니다.

---

## 2. 화면 구조

### Type 1: 일반 점검표

순서:

1. Requirement
2. Result
3. Auditor Comment
4. Evidence

구성:

- Requirement
  - No.
  - Check Requirement
  - Internal Ref.
  - External Ref.
- Result
  - Satisfaction
  - Observation
  - Un-Satisfaction
  - N/A
- Comment(s)
- Evidence / 사진

성숙도 선택 영역은 표시하지 않습니다.

---

### Type 2: 성숙도 점검표

순서:

1. Requirement
2. Result
3. Maturity Assessment
4. Auditor Comment
5. Evidence

구성:

- Requirement
  - No.
  - Check Requirement
  - Internal Ref.
  - External Ref.
- Result
  - Satisfaction
  - Observation
  - Un-Satisfaction
  - N/A
- Maturity Assessment
  - Conformity + 요구조건 / 판단기준
  - Established + 요구조건 / 판단기준
  - Mature + 요구조건 / 판단기준
  - Leading + 요구조건 / 판단기준
- Comment(s)
- Evidence / 사진

Result와 Maturity는 별도 평가축입니다.
Maturity를 선택해도 Result가 자동으로 Satisfaction 처리되지 않습니다.

---

## 3. Type 판별 기준

Type 2로 판별되는 경우:

- checklist-2
- checklist 2
- 현장탑승심사표
- 안전성과지표
- 리튬
- report-type-2로 저장된 점검표

그 외는 Type 1 일반 점검표로 처리합니다.

---

## 4. Excel 점검표 컬럼 구조

권장 컬럼은 다음과 같습니다.

| Column | Field | 설명 |
|---|---|---|
| A | Section | 섹션명 |
| B | No. | 항목번호 |
| C | Check Requirement | 점검 질문 / 요구사항 |
| D | Internal Ref. | 내부 참조 |
| E | External Ref. | 외부 참조 |
| F | Conformity Criteria | Type 2 성숙도 기준 |
| G | Established Criteria | Type 2 성숙도 기준 |
| H | Mature Criteria | Type 2 성숙도 기준 |
| I | Leading Criteria | Type 2 성숙도 기준 |
| J | Result Type | OK/NG/NA/OBS |

Type 1 점검표는 F~I 컬럼이 비어 있어도 됩니다.
Type 2 점검표는 F~I 컬럼을 입력하면 각 성숙도 점수 옆에 요구조건으로 표시됩니다.
F~I가 비어 있으면 앱의 기본 성숙도 설명이 표시됩니다.

---

## 5. 변경 파일

- index_type_split_maturity.txt
  - index.html로 적용
- sw_v20_type_split.txt
  - sw.js로 적용

---

## 6. 배포 시 주의사항

PWA/Service Worker 캐시 때문에 index.html을 수정할 때마다 sw.js의 CACHE_VERSION을 올려야 합니다.

이번 버전:

```js
const CACHE_VERSION = 'audit-app-v72';
```

GitHub Pages 또는 정적 배포 후 화면이 바뀌지 않으면 다음을 수행합니다.

1. Chrome DevTools 열기
2. Application > Service Workers > Unregister
3. Application > Storage > Clear site data
4. 새로고침

---

## 7. 검증 항목

배포 후 다음을 확인합니다.

- 홈 화면 로딩 완료
- 점검 기록 목록 표시
- 기존 심사 열기 가능
- Type 1 점검표에서 성숙도 영역 미표시
- Type 2 점검표에서 성숙도 영역 표시
- Result 선택 저장
- Maturity 선택 저장
- Comment 저장
- 사진 첨부 저장
- 심사 완료 버튼 작동
- Word/PDF 출력 시 Type 2 양식 유지

---

## 8. 개인용 데이터 보관 규칙

- 심사 기록과 사진은 현재 브라우저의 로컬 저장소에만 보관됩니다.
- 백업·복원은 모든 사용자에게 표시되며, 복원은 기존 로컬 데이터를 전체 교체합니다.
- 모든 항목에 Result가 입력된 심사만 완료 처리할 수 있습니다.
- 완료된 심사는 읽기 전용이며, 다시 열기 후에만 수정할 수 있습니다.

