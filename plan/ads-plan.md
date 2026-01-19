# 광고 설정 계획 (Google AdSense)

## 1. AdSense 계정 신청

### 사전 요구사항
- Google 계정
- 웹사이트 소유권 (Vercel 배포 완료 상태)
- 고유한 콘텐츠
- 개인정보처리방침 페이지

### 신청 절차
1. https://www.google.com/adsense 접속
2. "시작하기" 클릭
3. 사이트 URL 입력: `toheoje-dashboard.vercel.app`
4. 연락처 정보 입력
5. 검토 대기 (1~14일 소요)

## 2. AdSense 승인 조건

- **콘텐츠 품질**: 유용하고 독창적인 콘텐츠
- **사이트 운영**: 일정 기간 운영 기록 (최소 1~3개월 권장)
- **필수 페이지**: 개인정보처리방침, 연락처 정보
- **트래픽**: 일정 수준의 방문자 (명시적 기준 없음)

## 3. 광고 코드 통합

### AdSense 스크립트 추가

```typescript
// src/app/layout.tsx
import Script from 'next/script'

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        <Script
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

### 광고 단위 컴포넌트

```typescript
// src/components/AdUnit.tsx
'use client'

import { useEffect } from 'react'

interface AdUnitProps {
  slot: string
  format?: 'auto' | 'fluid' | 'rectangle'
  responsive?: boolean
}

export default function AdUnit({ slot, format = 'auto', responsive = true }: AdUnitProps) {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch (e) {
      console.error('AdSense error:', e)
    }
  }, [])

  return (
    <ins
      className="adsbygoogle"
      style={{ display: 'block' }}
      data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive={responsive}
    />
  )
}
```

## 4. 광고 배치 위치

### 권장 배치
1. **상단 배너**: 헤더 아래, 통계 카드 위
2. **사이드바**: 테이블 옆 (데스크톱)
3. **본문 중간**: 차트와 테이블 사이
4. **하단 배너**: 푸터 위

### 배치 예시
```tsx
// src/app/page.tsx
<main>
  <Header />
  <AdUnit slot="1234567890" /> {/* 상단 배너 */}

  <StatsCards />
  <Charts />

  <AdUnit slot="0987654321" /> {/* 중간 배너 */}

  <DataTable />

  <AdUnit slot="1357924680" /> {/* 하단 배너 */}
  <Footer />
</main>
```

## 5. 개인정보처리방침 페이지

AdSense 승인을 위해 필수:

```typescript
// src/app/privacy/page.tsx
export default function PrivacyPolicy() {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1>개인정보처리방침</h1>
      <p>토허제 대시보드는 Google Analytics와 Google AdSense를 사용합니다...</p>
      {/* 상세 내용 */}
    </div>
  )
}
```

## 6. 대안: 카카오 애드핏

AdSense 승인이 어려운 경우 대안:

- 신청: https://adfit.kakao.com
- 장점: 국내 서비스로 승인 빠름
- 단점: 수익이 AdSense보다 낮을 수 있음

## 7. 구현 체크리스트

- [ ] 개인정보처리방침 페이지 생성
- [ ] AdSense 계정 신청
- [ ] 사이트 검토 승인 대기
- [ ] 승인 후 광고 코드 획득
- [ ] AdUnit 컴포넌트 생성
- [ ] 적절한 위치에 광고 배치
- [ ] 광고 정책 준수 확인
