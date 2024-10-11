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


export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const headersList = headers()
  const host = headersList.get('host') || 'localhost:3000'
  const protocol = 'https';

  const resp = await (await getInitMetadata());

  // You can get the title or other metadata from searchParams or any other source
  const title = 'Feedback';
  const company = resp?.org?.name || 'Feedback';
  const logo = resp?.org?.logo || 'https://suggestfeature.com/logo-light.jpeg';

  const baseUrl = `${protocol}://${host}`;
  const url = new URL(`/api/og`, baseUrl);
  url.searchParams.append('title', title);
  url.searchParams.append('company', company);
  url.searchParams.append('logo', logo);

  return {
    openGraph: {
      title,
      type: 'website',
      images: [
        {
          url: url.toString(),
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

  const [parsedData, userData] = await Promise.all([await getInitMetadata(), fetchLoggedInUserDetails()])

  return (
    <html lang="en" className="">
      <title>{parsedData?.org?.name}</title>
      {
        parsedData?.org?.favicon &&
        <link rel="icon" href={parsedData.org.favicon} sizes="any" />
      }
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
