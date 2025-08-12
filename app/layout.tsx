import type React from "react"
import type { Metadata } from "next"
import { Poppins, Inter } from "next/font/google"
import "./globals.css"

// Configurare fonturi conform branding-ului
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-poppins",
  display: "swap",
})

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-inter",
  display: "swap",
})

// Metadata optimizată pentru SEO
export const metadata: Metadata = {
  title: "PascuPas.online – Psiholog AI în limba română",
  description:
    "Discret. 24/7. Gata să te ajute când nu ai cu cine vorbi. Începe o conversație gratuită cu un AI empatic.",
  keywords: "psiholog ai, suport emotional, sanatate mintala, chatbot romania, dezvoltare personala",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ro" className={`${poppins.variable} ${inter.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  )
}
