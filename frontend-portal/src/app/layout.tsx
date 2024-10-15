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
import { cookies, headers } from "next/headers";
import { ResolvingMetadata, Metadata } from "next";
import { Props } from "next/script";
import PopulateOgUrl from "./PopulateOgUrl";

const inter = Inter({ subsets: ["latin"] });

export async function getInitMetadata() {
  const headersList = headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = 'https:';
  const resp = await fetch(`${protocol}//${host}/api/portal/unauth/posts/init-page`);
  if (!resp.ok) {
    throw new Error('Failed to fetch metadata');
  }
  return resp.json();
}

export async function fetchLoggedInUserDetails() {
  const cookieStore = cookies()
  const token = cookieStore.get('token');

  const headersList = headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = 'https:';

  if (token && token.value) {
    const response = await fetch(`${protocol}//${host}/api/auth/user`, {
      headers: {
        Authorization: `${token.value}`,
      },
    });

    if (response.ok) {
      return await response.json();
    }
  }
  return null;
};

export async function defaultMetadata(category, title) {
  const headersList = headers()
  const host = headersList.get('host') || 'localhost:3000'
  const protocol = 'https';

  const resp = await (await getInitMetadata());

  // You can get the title or other metadata from searchParams or any other source
  const company = resp?.org?.name || 'Suggest Feature';

  const baseUrl = `${protocol}://${host}`;
  const url = new URL(`/api/portal/unauth/og/get-ss`, baseUrl);
  url.searchParams.append('category', category);
  url.searchParams.append('title', title);
  // Add random url to avoid caching at socialMedia
  // valid string
  url.searchParams.append('v', Math.random().toString(36).substring(7))


  return {
    openGraph: {
      title: `${company} - ${category}`,
      description: `${title} | ${category} for ${company}`,
      type: 'website',
      images: [
        {
          url: url.toString(),
          width: 1200,
          height: 630,
          alt: `${company} - ${category} page`
        }
      ],
    },
  }
}


export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const title = 'Feedback';

  return await defaultMetadata('Feedback', title);
}


async function RootLayout({
  children, params
}: Readonly<{
  children: React.ReactNode;
}>) {

  const [parsedData, userData] = await Promise.all([await getInitMetadata(), fetchLoggedInUserDetails()])

  return (
    <html lang="en" className="">
      <title>{parsedData?.org?.name}</title>
      {
        parsedData?.org?.favicon &&
        <link rel="icon" href={parsedData.org.favicon} sizes="any" />
      }
      <PopulateOgUrl />
      <body className={cn(inter.className, "bg-muted/40")}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >

          <div className="flex h-full w-full flex-col items-center justify-center">
            <AuthProvider userData={userData}>
              <InitContextProvider initMetadata={parsedData}>
                <div className="w-full bg-background flex items-center justify-center">
                  <Suspense>
                    <SuspenseProvider >
                      <Header params={params} initMetadata={parsedData} userData={userData} />
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
