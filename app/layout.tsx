import type { Metadata } from "next";
import { Poppins, Inter } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import Header from "@/components/Header"; // Asigură-te că Header este importat
import Footer from "@/components/Footer"; // Asigură-te că noul Footer este importat
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ['700', '800'],
  variable: '--font-poppins',
  display: 'swap',
});

const inter = Inter({
  subsets: ["latin"],
  weight: ['400', '500'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "PascuPas.online – Psiholog AI în limba română",
  description: "Discret. 24/7. Gata să te ajute când nu ai cu cine vorbi. Începe o conversație gratuită cu un AI empatic.",
  keywords: "psiholog ai, suport emotional, sanatate mintala, chatbot romania, dezvoltare personala",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro">
      <body className={`${poppins.variable} ${inter.variable} bg-background font-inter antialiased flex flex-col min-h-screen`}>
        <AuthProvider>
          <Header />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}