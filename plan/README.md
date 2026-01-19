# 토허제 대시보드 마케팅/수익화 계획

## 개요

이 폴더에는 SEO, 분석, 광고 설정에 대한 상세 계획이 포함되어 있습니다.

## 문서 목록

| 파일 | 설명 | 우선순위 |
|------|------|----------|
| [seo-plan.md](./seo-plan.md) | SEO 메타태그, 사이트맵, 구조화 데이터 | 높음 |
| [ga-plan.md](./ga-plan.md) | Google Analytics 4 설정 | 높음 |
| [ads-plan.md](./ads-plan.md) | Google AdSense 광고 설정 | 보통 |

## 권장 구현 순서

### 1단계: SEO 기본 설정 (즉시 가능)
- layout.tsx 메타데이터 추가
- sitemap.ts 생성
- robots.ts 생성

### 2단계: Google Analytics (GA4 계정 필요)
- GA4 계정/속성 생성
- 측정 ID 환경변수 설정
- 스크립트 추가

### 3단계: 광고 (승인 필요, 시간 소요)
- 개인정보처리방침 페이지 생성
- AdSense 신청
- 승인 후 광고 코드 통합

## 필요한 계정/서비스

| 서비스 | URL | 용도 |
|--------|-----|------|
| Google Search Console | https://search.google.com/search-console | SEO 모니터링 |
| Google Analytics | https://analytics.google.com | 트래픽 분석 |
| Google AdSense | https://www.google.com/adsense | 광고 수익 |
| Naver Search Advisor | https://searchadvisor.naver.com | 네이버 SEO |

## 환경변수 (Vercel에 설정)

```
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_ADSENSE_ID=ca-pub-XXXXXXXXXXXXXXXX
```
