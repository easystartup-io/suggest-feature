import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google"

import "@/app/(home)/globals.css";
import { cn } from "@/lib/utils"
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import dynamic from 'next/dynamic'
import { HotJar } from "@/components/Hotjar";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
})
export const metadata: Metadata = {
  title: "Suggest Feature - Share and Vote on Feature Requests",
  description: "Suggest Feature is a platform for sharing and voting on feature requests.",
  metadataBase: new URL('https://suggestfeature.com'),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const CrispWithNoSSR = dynamic(
    () => import('@/components/crisp')
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
        <Header />

        <div className="flex items-center justify-center">
          <div className="prose prose-headings:mt-8 prose-headings:font-semibold prose-headings:text-black prose-h1:text-5xl prose-h2:text-4xl prose-h3:text-3xl prose-h4:text-2xl prose-h5:text-xl prose-h6:text-lg dark:prose-headings:text-white">
            {children}
          </div>
        </div>
        <Footer />
      </body>

      <HotJar />
      <script data-collect-dnt="true" async defer src="https://scripts.simpleanalyticscdn.com/latest.js"></script>
      <noscript><img src="https://queue.simpleanalyticscdn.com/noscript.gif" alt="" referrerPolicy="no-referrer-when-downgrade" /></noscript>
    </html>
  );
}
