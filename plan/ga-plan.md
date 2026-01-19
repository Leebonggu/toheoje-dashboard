# Google Analytics 설정 계획

## 1. GA4 계정 생성

1. https://analytics.google.com 접속
2. "측정 시작" 클릭
3. 계정 이름: `toheoje-dashboard`
4. 속성 이름: `토허제 대시보드`
5. 시간대: 대한민국 (GMT+9)
6. 통화: KRW

## 2. 측정 ID 획득

- 형식: `G-XXXXXXXXXX`
- 위치: 관리 > 데이터 스트림 > 웹 스트림 세부정보

## 3. Next.js 통합

### 방법 1: next/script 사용 (권장)

```typescript
// src/app/layout.tsx
import Script from 'next/script'

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-XXXXXXXXXX');
          `}
        </Script>
      </head>
      <body>{children}</body>
    </html>
  )
}
```

### 방법 2: 환경변수 사용

```bash
# .env.local
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

```typescript
// src/app/layout.tsx
const GA_ID = process.env.NEXT_PUBLIC_GA_ID

<Script
  src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
  strategy="afterInteractive"
/>
```

## 4. 추적할 이벤트

### 기본 페이지뷰
- 자동 추적됨

### 커스텀 이벤트 (선택)
```typescript
// 자치구 필터 사용
gtag('event', 'filter_district', {
  district: '강남구'
})

// 처리결과 필터 사용
gtag('event', 'filter_status', {
  status: '허가'
})

// CSV 다운로드
gtag('event', 'download_csv')
```

## 5. 구현 체크리스트

- [ ] GA4 계정/속성 생성
- [ ] 측정 ID 획득
- [ ] Vercel 환경변수에 GA ID 추가
- [ ] layout.tsx에 GA 스크립트 추가
- [ ] 개발환경에서 테스트
- [ ] 프로덕션 배포 후 실시간 리포트 확인
