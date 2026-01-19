# CLAUDE.md

이 파일은 Claude Code가 이 프로젝트를 이해하는 데 필요한 컨텍스트를 제공합니다.

## 프로젝트 개요

**토허제 대시보드** - 서울시 토지거래허가 현황을 시각화하는 웹 대시보드

- 서울시 토지거래허가구역 지정(2025.10.15~) 이후 데이터 수집 및 시각화
- 카카오 API를 통한 건물명 자동 매핑
- GitHub Actions를 통한 매일 자동 데이터 수집
- Vercel을 통한 자동 배포

## 기술 스택

- **Frontend**: Next.js 16, React 18, TypeScript, Tailwind CSS
- **Charts**: Chart.js, react-chartjs-2
- **Data Collection**: Python 3, requests, pandas
- **Deployment**: Vercel (정적 사이트 빌드)
- **CI/CD**: GitHub Actions (매일 09:00 KST 데이터 수집)

## 프로젝트 구조

```
toheoje-dashboard/
├── .github/workflows/
│   └── daily-update.yml     # 매일 데이터 수집 워크플로우
├── scripts/
│   ├── collect_data.py      # 서울시 API 데이터 수집 (재시도 로직 포함)
│   ├── add_building_names.py # 카카오 API 건물명 추가
│   ├── backfill.py          # 실패한 요청 재수집
│   └── requirements.txt
├── public/data/
│   ├── land_contract_data.json   # 메인 데이터
│   ├── land_contract_data.csv
│   ├── building_name_map.json    # 건물명 매핑 캐시
│   ├── manual_building_names.json # 수동 건물명 오버라이드
│   └── failed_requests.json      # 실패한 요청 로그 (있을 경우)
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx         # 메인 대시보드 컴포넌트
│   │   └── globals.css
│   └── types/
│       └── index.ts         # TypeScript 타입 정의
├── CLAUDE.md
└── package.json
```

## 주요 명령어

```bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 데이터 수집 (수동)
python scripts/collect_data.py

# 건물명 추가 (수동)
KAKAO_API_KEY=xxx python scripts/add_building_names.py

# 실패한 요청 재수집
python scripts/backfill.py
```

## 데이터 구조

### land_contract_data.json

```typescript
interface LandContract {
  자치구: string      // "강남구"
  주소: string        // "강남구 대치동 316"
  허가일자: number    // 20251120
  처리결과: string    // "허가" | "취소" | "취하" | "불허가" | "반려" | "미결"
  이용목적: string    // "주거용" | "상업용" | ...
  건물명?: string     // "은마아파트" (카카오 API로 조회)
  수집일자?: string   // "20260119" (수집된 날짜)
}
```

## 외부 API

### 서울시 토지거래허가 API

- 엔드포인트: `https://land.seoul.go.kr/land/wsklis/getContractList.do`
- 제한: 한 번에 최대 62일까지 조회 가능
- 파라미터: `sggCd` (자치구코드), `beginDate`, `endDate`

### 카카오 주소 검색 API

- 엔드포인트: `https://dapi.kakao.com/v2/local/search/address.json`
- 인증: `Authorization: KakaoAK {API_KEY}`
- 용도: 지번 주소로 건물명 조회

## 환경 변수

| 변수명 | 설명 | 필수 |
|--------|------|------|
| `KAKAO_API_KEY` | 카카오 REST API 키 | GitHub Secrets에 설정 |

## 코드 스타일

- TypeScript strict 모드 사용
- 컴포넌트는 함수형 + hooks 패턴
- 한글 필드명 사용 (API 응답과 일치)
- Tailwind CSS 유틸리티 클래스 사용

## 주의사항

- 데이터 수집 스크립트는 증분 수집 (마지막 수집 이후 데이터만)
- 건물명 매핑은 캐시되어 중복 API 호출 방지
- 수동 건물명 오버라이드는 `manual_building_names.json`에서 관리
- 실패한 요청은 `failed_requests.json`에 기록됨
