import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from '../context/AuthContext';
import { Inter as FontSans } from "next/font/google"
import dynamic from 'next/dynamic'
import "./globals.css";
import { cn } from "@/lib/utils"


const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "Suggest feature",
  description: "Simple tool to gather feature requests",
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {

  const CrispWithNoSSR = dynamic(
    () => import('../components/crisp')
  )

  return (
    <html lang="en">
      <CrispWithNoSSR />
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        )}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
