import './globals.css'

export const metadata = {
  title: 'Warden Property Search - Weather Integration',
  description: 'Find properties with real-time weather information',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
