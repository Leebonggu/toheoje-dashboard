import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '서울시 토지거래허가 현황',
  description: '서울시 토지거래허가 데이터 대시보드',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className="bg-gray-100 min-h-screen">{children}</body>
    </html>
  )
}
