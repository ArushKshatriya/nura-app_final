import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'NURA | Sustainable Diet Planning',
  description: 'Fuel your body. Balance your footprint.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* This link is what makes the icons work */}
        <link 
          rel="stylesheet" 
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" 
        />
      </head>
      <body>{children}</body>
    </html>
  )
}