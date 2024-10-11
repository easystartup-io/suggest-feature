import Header from "./Header";
import { ThemeProvider } from "@/components/theme-provider";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/context/AuthContext";
import { InitContextProvider } from "@/context/InitContext";
import { cn } from "@/lib/utils";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import SuspenseProvider from "./SuspenseProviderResizeIfEmbedded";
import { headers } from "next/headers";

const inter = Inter({ subsets: ["latin"] });

async function getInitMetadata() {
  const headersList = headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = 'https:';
  const resp = await fetch(`${protocol}//${host}/api/portal/unauth/posts/init-page`);
  if (!resp.ok) {
    throw new Error('Failed to fetch metadata');
  }
  return resp.json();
}

export async function generateMetadata(
  { searchParams }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const headersList = headers()
  const host = headersList.get('host') || 'localhost:3000'
  const protocol = 'https';

  const resp = await (await getInitMetadata());

  // You can get the title or other metadata from searchParams or any other source
  const title = resp?.org?.name || 'Feedback';

  return {
    openGraph: {
      title,
      images: [
        {
          url: `${protocol}://${host}/api/portal/unauth/og/get-company?title=${encodeURIComponent(title)}`,
          width: 1200,
          height: 630,
          alt: title + ' - Feedback page'
        }
      ],
    },
  }
}


async function RootLayout({
  children, params
}: Readonly<{
  children: React.ReactNode;
}>) {

  const parsedData = await (await getInitMetadata());

  return (
    <html lang="en">
      <title>{parsedData?.org?.name}</title>
      <body className={cn(inter.className, "bg-muted/40")}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >

          <div className="flex h-full w-full flex-col items-center justify-center">
            <AuthProvider>
              <InitContextProvider>
                <div className="w-full bg-background flex items-center justify-center">
                  <Suspense>
                    <SuspenseProvider >
                      <Header params={params} initMetadata={parsedData} />
                    </SuspenseProvider>
                  </Suspense>
                </div>
                <Separator />
                <Suspense>
                  <SuspenseProvider >
                    {/* TODO: Handle it better when doing SSR instead of suspense. Just have a suspense provider which sets after client side load for specific div id */}
                    {children}
                  </SuspenseProvider>
                </Suspense>
              </InitContextProvider>
            </AuthProvider>
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

export default RootLayout;
