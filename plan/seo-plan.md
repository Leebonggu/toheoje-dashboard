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

- [ ] layout.tsx에 Metadata 설정
- [ ] Open Graph 이미지 생성 (1200x630)
- [ ] sitemap.ts 생성
- [ ] robots.ts 생성
- [ ] JSON-LD 구조화 데이터 추가
- [ ] Google Search Console 등록
- [ ] Naver Search Advisor 등록
