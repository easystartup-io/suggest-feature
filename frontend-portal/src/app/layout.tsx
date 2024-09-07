"use client"
import { ThemeProvider } from "@/components/theme-provider"
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Suspense, useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { CircleUser } from "lucide-react";
import { Button } from "@/components/ui/button";
import ModeToggle from "./ModeToggle";
import withInit from "@/hoc/withInit";
import { InitContextProvider, useInit } from "@/context/InitContext";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import LoginDialog from "@/components/LoginDialog";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Toaster } from "@/components/ui/toaster"
import { useSearchParams } from 'next/navigation'


const inter = Inter({ subsets: ["latin"] });

// export const metadata: Metadata = {
//   title: "Suggest Feature",
//   description: "Suggestions for new features",
// };

function Custom404() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-blue-400 to-blue-300 text-center">
      <div className="text-8xl font-bold text-white">404</div>
      <div className="mt-4 text-2xl font-medium text-white">
        Oops! Page not found!
      </div>
      <div className="relative w-24 h-24 mt-8">
      </div>
      <div className="mt-8 text-lg text-white underline">
        <a href="https://suggestfeature.com">Go Back to Suggest Feature</a>
      </div>
    </div>
  );
}

function Header({ params }) {

  const { user, loading, logout } = useAuth()
  const [org, setOrg] = useState({});
  const [boards, setBoards] = useState({});
  const [error, setError] = useState(false);
  const { setOrg: setInitOrg, setBoards: setInitBoards } = useInit();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams()

  const hideNavBar = searchParams.get('hideNavBar')

  useEffect(() => {
    const updateFavicon = async () => {
      const linkElements = document.getElementsByTagName('link');
      for (let i = 0; i < linkElements.length; i++) {
        const link = linkElements[i];
        if (link.rel === 'icon' || link.rel === 'shortcut icon') {
          link.href = org.favicon;
        }
      }

      // If no existing favicon link, create a new one
      if (!document.querySelector("link[rel*='icon']")) {
        const newLink = document.createElement('link');
        newLink.rel = 'icon';
        newLink.href = org.favicon;
        document.head.appendChild(newLink);
      }
    };

    if (org && org.favicon) {
      updateFavicon();
    }
  }, [org, pathname]);

  useEffect(() => {
    const host = window.location.host
    const protocol = window.location.protocol // http: or https:
    fetch(`${protocol}//${host}/api/portal/unauth/posts/init-page`)
      .then((res) => res.json())
      .then((data) => {
        if (Object.keys(data).length === 0) {
          setError(true)
        } else {
          setOrg(data.org)
          setInitOrg(data.org)
          setBoards(data.boards)
          setInitBoards(data.boards)
        }
      }).catch((e) => {
        setError(true)
        console.log(e)
      })

  }, [params]);

  if (!org || error) {
    return <Custom404 />
  }

  if (hideNavBar) {
    return null
  }

  return (
    <div className="w-full px-4 md:px-10">
      <title>{org.name}</title>
      <header className="flex h-16 items-center justify-between gap-4 w-full">
        <div onClick={() => {
          router.push('/')
        }} className="cursor-pointer flex items-center">
          {org.logo ? <img
            className="h-12 w-12 mr-2"
            src={org.logo}
          /> : null}
          {
            org.hideOrgName ? null :
              <h1 className="text-xl font-semibold">{org.name}</h1>
          }
        </div>
        {!loading ?
          <div className="flex items-center justify-end gap-4 md:ml-auto md:gap-2 lg:gap-4">
            <ModeToggle />
            {user ?
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="icon" className="rounded-full">
                    <Avatar>
                      <AvatarImage src={`${user.profilePic}`} />
                      <AvatarFallback>
                        {(() => {
                          const name = user.name || user.email.split('@')[0];
                          const words = name.split(' ');

                          let initials;

                          if (words.length > 1) {
                            // If the name has multiple words, take the first letter of each word
                            initials = words.map(word => word[0]).join('').toUpperCase();
                          } else {
                            // If it's a single word, take the first two characters
                            initials = name.slice(0, 2).toUpperCase();
                          }

                          // Ensure it returns exactly 2 characters
                          return initials.length >= 2 ? initials.slice(0, 2) : initials.padEnd(2, initials[0]);
                        })()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="sr-only">Toggle user menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{user.name}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/settings')} >Settings</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout()}>Logout</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              :
              <LoginDialog />}
          </div>
          : ""}
      </header>
    </div>
  )
}

const SuspenseProvider = ({ children }) => {
  const [isEmbedded, setIsEmbedded] = useState(false)
  const searchParams = useSearchParams()

  useEffect(() => {
    setIsEmbedded(searchParams.get('isEmbedded'))
  }, []);

  return (
    <div className={cn("w-full",
      isEmbedded ? '' : 'max-w-screen-xl'
    )}>
      {children}
    </div>
  );
};

function RootLayout({
  children, params
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en">
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
                      <Header params={params} />
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
