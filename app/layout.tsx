import './globals.css'

export const metadata = {
  title: 'Bullsh!t Card Game',
  description: 'Play Bullsh!t online with friends for free',
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
