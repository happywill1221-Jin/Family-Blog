import './globals.css'

export const metadata = {
  title: '우리 가족 이야기',
  description: '가족끼리 글을 쓰고 공유하는 공간',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
        {children}
      </body>
    </html>
  )
}