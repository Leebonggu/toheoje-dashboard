import type { Metadata } from 'next'
import './globals.css'

const siteUrl = 'https://toheoje-dashboard.vercel.app'

export const metadata: Metadata = {
  title: '토허제 대시보드 - 서울시 토지거래허가 현황',
  description:
    '서울시 25개 자치구 토지거래허가 신청/처리 현황을 확인하세요. 자치구별, 처리결과별 통계와 건물명 정보를 제공합니다. 2025년 10월 15일 이후 데이터를 매일 업데이트합니다.',
  keywords: [
    '토지거래허가제',
    '토허제',
    '서울시',
    '부동산',
    '토지거래',
    '허가현황',
    '강남구',
    '서초구',
    '송파구',
    '용산구',
  ],
  authors: [{ name: '토허제 대시보드' }],
  creator: '토허제 대시보드',
  openGraph: {
    title: '토허제 대시보드 - 서울시 토지거래허가 현황',
    description:
      '서울시 25개 자치구 토지거래허가 신청/처리 현황을 한눈에 확인하세요.',
    url: siteUrl,
    siteName: '토허제 대시보드',
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '토허제 대시보드 - 서울시 토지거래허가 현황',
    description:
      '서울시 25개 자치구 토지거래허가 신청/처리 현황을 한눈에 확인하세요.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: '토허제 대시보드',
  url: siteUrl,
  description: '서울시 토지거래허가 현황 대시보드',
  inLanguage: 'ko-KR',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-gray-100 min-h-screen">{children}</body>
    </html>
  )
}
