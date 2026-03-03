import { Inter } from 'next/font/google'
import './globals.css'
import { SidebarProvider } from '@/context/SidebarContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'AOT Manager',
  description: 'Art of Tech - Project Management System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th">
      <body className={inter.className}>
        <SidebarProvider>
          {children}
        </SidebarProvider>
      </body>
    </html>
  )
}
