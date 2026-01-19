# SEO 설정 계획

## 1. 메타 태그 설정

### 기본 메타 태그
- `title`: 토허제 대시보드 - 서울시 토지거래허가 현황
- `description`: 서울시 25개 자치구 토지거래허가 신청/처리 현황을 실시간으로 확인하세요. 자치구별, 처리결과별 통계와 건물명 정보를 제공합니다.
- `keywords`: 토지거래허가제, 토허제, 서울시, 부동산, 토지거래, 허가현황

### Open Graph (SNS 공유용)
```typescript
// src/app/layout.tsx에 추가
export const metadata: Metadata = {
  title: '토허제 대시보드 - 서울시 토지거래허가 현황',
  description: '서울시 25개 자치구 토지거래허가 신청/처리 현황',
  openGraph: {
    title: '토허제 대시보드',
    description: '서울시 토지거래허가 현황을 한눈에',
    url: 'https://toheoje-dashboard.vercel.app',
    siteName: '토허제 대시보드',
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '토허제 대시보드',
    description: '서울시 토지거래허가 현황을 한눈에',
  },
}
```

## 2. 구조화된 데이터 (JSON-LD)

```typescript
// WebSite 스키마
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "토허제 대시보드",
  "url": "https://toheoje-dashboard.vercel.app",
  "description": "서울시 토지거래허가 현황 대시보드"
}
```

## 3. 사이트맵 생성

Next.js 16에서 자동 생성 설정:

```typescript
// src/app/sitemap.ts
import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://toheoje-dashboard.vercel.app',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
  ]
}
```

## 4. robots.txt

```typescript
// src/app/robots.ts
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: 'https://toheoje-dashboard.vercel.app/sitemap.xml',
  }
}
```

## 5. 구현 체크리스트

- [x] layout.tsx에 Metadata 설정 ✅ 완료
- [x] sitemap.ts 생성 ✅ 완료
- [x] robots.ts 생성 ✅ 완료
- [x] JSON-LD 구조화 데이터 추가 ✅ 완료
- [x] llms.txt 생성 (LLM 검색용) ✅ 완료
- [ ] Open Graph 이미지 생성 (1200x630) - 선택사항
- [ ] Google Search Console 등록 - **사용자 작업 필요**
- [ ] Naver Search Advisor 등록 - **사용자 작업 필요**

## 6. 검색엔진 등록 방법

### Google Search Console
1. https://search.google.com/search-console 접속
2. 속성 추가 > URL 접두어 > `https://toheoje-dashboard.vercel.app`
3. HTML 태그 방식으로 소유권 인증
4. 인증 메타 태그를 layout.tsx에 추가 (Claude에게 요청)
5. 사이트맵 제출: `https://toheoje-dashboard.vercel.app/sitemap.xml`

### Naver Search Advisor
1. https://searchadvisor.naver.com 접속
2. 사이트 등록 > `https://toheoje-dashboard.vercel.app`
3. HTML 태그 방식으로 소유권 인증
4. 인증 메타 태그를 layout.tsx에 추가 (Claude에게 요청)
5. 사이트맵 제출

## 7. 커스텀 도메인 (예정)

> ⚠️ 도메인 변경 시 아래 파일들의 URL 수정 필요

- [ ] 도메인 구매 (가비아 등)
- [ ] Vercel에 도메인 연결
- [ ] 코드 URL 변경 필요 파일:
  - `src/app/layout.tsx` - siteUrl 변수
  - `src/app/sitemap.ts` - url
  - `src/app/robots.ts` - sitemap URL
- [ ] 검색엔진 등록은 도메인 확정 후 진행
