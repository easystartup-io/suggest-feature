"use client"
import {
  BookOpenText,
  Clipboard,
  Home,
  LineChart,
  Menu,
  MessageCircleMore,
  Package2,
  UserRoundCog,
  Users
} from "lucide-react"
import Link from "next/link"

import Cookies from 'js-cookie';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useAuth } from '@/context/AuthContext'
import withAuth from '@/hoc/withAuth'
import { cn } from "@/lib/utils"
import { Crisp } from "crisp-sdk-web"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import dynamic from "next/dynamic"
import { usePathname, useRouter } from "next/navigation"
import { createContext, useEffect, useState } from "react"

export const SidebarContext = createContext();
export function ModeToggle() {
  const { setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function MobileNavigation({ params, isActive, setCurrentSection }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="shrink-0 md:hidden"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex flex-col">
        <nav className="grid gap-2 text-lg font-medium">
          <Link href={`/${params.slug}/dashboard`} className="flex items-center gap-2 font-semibold mb-2">
            <Avatar className={"rounded-none h-6 w-6"}>
              <AvatarImage className="" src="/logo.svg" alt="suggest-feature" />
              <AvatarFallback>SF</AvatarFallback>
            </Avatar>
            <span className="text-lg font-semibold">Suggest Feature</span>
          </Link>
          <Link
            href={`/${params.slug}/dashboard`}
            className={`mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 transition-all ${isActive('dashboard')}`}
            onClick={() => setCurrentSection('dashboard')}
          >
            <Home className="h-5 w-5" />
            Dashboard
          </Link>
          <Link
            href={`/${params.slug}/pages`}
            className={`mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 transition-all ${isActive('pages')}`}
            onClick={() => setCurrentSection('pages')}
          >
            <BookOpenText className="h-5 w-5" />
            Pages
          </Link>
          <Link
            href={`/${params.slug}/boards`}
            className={`mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 transition-all ${isActive('boards')}`}
            onClick={() => setCurrentSection('boards')}
          >
            <Clipboard className="h-5 w-5" />
            Boards
          </Link>
          <Link
            href={`/${params.slug}/members`}
            className={`mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 transition-all ${isActive('members')}`}
            onClick={() => setCurrentSection('members')}
          >
            <UserRoundCog className="h-5 w-5" />
            Team Members
          </Link>
          <Link
            href={`/${params.slug}/customers`}
            className={`mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 transition-all ${isActive('customers')}`}
            onClick={() => setCurrentSection('customers')}
          >
            <Users className="h-5 w-5" />
            Customers
          </Link>
        </nav>
      </SheetContent>
    </Sheet>
  )
}


function ProfileDropdownMenu({ logout, router, user }) {
  return (
    <>
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
          <DropdownMenuLabel className="text-center" >{user && user.name}</DropdownMenuLabel>
          <DropdownMenuItem>{user && user.email}</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => {
            router.push(`/${params.slug}/profile`);
          }}>
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              Crisp.user.setEmail(user.email);
              Crisp.user.setNickname(user.name);
              Crisp.session.setData({
                orgSlug: params.slug
              });
              Crisp.chat.open()
            }}
          >Support</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={async () => {
            await logout();
            router.push('/login');
          }}>Logout</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}


function FullscreenNav({ isActive, setCurrentSection, params, isCollapsed }) {
  return (
    <>
      <nav className={cn("grid items-start px-2 text-sm font-medium lg:px-4",
        isCollapsed && "px-0 lg:px-0")}>
        <Link
          href={`/${params.slug}/dashboard`}
          className={cn(`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${isActive('dashboard')}`,
            isCollapsed && "justify-center lg:mx-2")}
          onClick={() => setCurrentSection('dashboard')}
        >
          <Home className="h-4 w-4" />
          {isCollapsed ? null : 'Dashboard'}
        </Link>
        <Link
          href={`/${params.slug}/pages`}
          className={cn(`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${isActive('pages')}`,
            isCollapsed && "justify-center lg:mx-2")}
          onClick={() => setCurrentSection('pages')}
        >
          <BookOpenText className="h-4 w-4" />
          {isCollapsed ? null : 'Pages'}
        </Link>
        <Link
          href={`/${params.slug}/boards`}
          className={cn(`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${isActive('boards')}`,
            isCollapsed && "justify-center lg:mx-2")}
          onClick={() => setCurrentSection('boards')}
        >
          <Clipboard className="h-4 w-4" />
          {isCollapsed ? null : 'Boards'}
        </Link>
        <Link
          href={`/${params.slug}/members`}
          className={cn(`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${isActive('members')}`,
            isCollapsed && "justify-center lg:mx-2")}
          onClick={() => setCurrentSection('members')}
        >
          <UserRoundCog className="h-4 w-4" />
          {isCollapsed ? null : 'Team Members'}
        </Link>
        <Link
          href={`/${params.slug}/customers`}
          className={cn(`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${isActive('customers')}`,
            isCollapsed && "justify-center lg:mx-2")}
          onClick={() => setCurrentSection('customers')}
        >
          <Users className="h-4 w-4" />
          {isCollapsed ? null : 'Customers'}
        </Link>
      </nav>
    </>
  )
}

const Dashboard: React.FC = ({ children, params }) => {

  const { logout, user } = useAuth();
  const [currentSection, setCurrentSection] = useState('dashboard');
  const router = useRouter();
  const pathname = usePathname();

  // Collapsed state
  const layout = Cookies.get("react-resizable-panels:layout:sf")
  const collapsed = Cookies.get("react-resizable-panels:sf:collapsed")

  const defaultLayout = layout ? JSON.parse(layout) : [18, 82]
  const defaultCollapsed = collapsed ? JSON.parse(collapsed) : undefined

  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed || false)


  const CrispWithNoSSR = dynamic(
    () => import('../../components/crisp')
  )
  useEffect(() => {
    if (!params.slug || !pathname)
      return;

    // Removing the slug part to identify the section
    const sections = pathname.replace(`/${params.slug}`, '').split('/').filter(Boolean);

    if (sections.length > 0) {
      setCurrentSection(sections[0]); // Set the section based on the first segment after the slug
    } else {
      setCurrentSection('dashboard'); // Default section if nothing else matches
    }
  }, [params.slug, pathname])


  const isActive = (section) => currentSection === section ? 'bg-muted text-primary' : 'text-muted-foreground hover:text-primary';

  return (
    <div className="h-screen w-full">
      <ResizablePanelGroup
        direction="horizontal"
        onLayout={(sizes: number[]) => {
          document.cookie = `react-resizable-panels:layout:sf=${JSON.stringify(
            sizes
          )}; path=/`
        }}
        className="h-full items-stretch hidden md:flex flex-1"
      >
        <ResizablePanel
          defaultSize={defaultLayout[0]}
          collapsedSize={4}
          collapsible={true}
          minSize={15}
          maxSize={18}
          onCollapse={() => {
            setIsCollapsed(true)
            document.cookie = `react-resizable-panels:sf:collapsed=${JSON.stringify(
              true
            )}; path=/`
          }}
          onResize={() => {
            setIsCollapsed(false)
            document.cookie = `react-resizable-panels:sf:collapsed=${JSON.stringify(
              false
            )}; path=/`
          }}
          className={cn(
            isCollapsed &&
            "min-w-[50px] transition-all duration-300 ease-in-out",
            "hidden md:flex"
          )}
        >
          <div className="hidden bg-muted/40 dark:bg-muted/20 md:block w-full md:min-h-screen">
            <div className="flex h-full max-h-screen flex-col gap-2 w-full">
              <div
                className={cn(
                  "flex h-[52px] items-center",
                  isCollapsed ? "h-[52px] justify-center" : "px-2 justify-start"
                )}
              >
                <div className={cn("flex h-14 items-center px-4 lg:h-[60px] lg:px-6",
                  isCollapsed && "px-0 lg:px-0")}>
                  <Link href={`/${params.slug}/dashboard`} className="flex items-center gap-2 font-semibold">
                    <Avatar className={cn(isCollapsed && "px-0 lg:px-0", "rounded-none")}>
                      <AvatarImage className="" src="/logo.svg" alt="suggest-feature" />
                      <AvatarFallback>SF</AvatarFallback>
                    </Avatar>
                    {!isCollapsed && <span className="text-lg font-semibold">Suggest Feature</span>}
                  </Link>
                </div>
              </div>
              <Separator />
              <div className="flex-1">
                <FullscreenNav isActive={isActive} setCurrentSection={setCurrentSection} params={params} isCollapsed={isCollapsed} />
              </div>
            </div>
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle className="hidden md:flex" />
        <ResizablePanel defaultSize={defaultLayout[1]} minSize={30}>
          <div className="flex flex-col w-full flex-1">
            <header className="flex h-14 items-center gap-4 bg-muted/40 dark:bg-muted/20 px-4 lg:h-[60px] lg:px-6 w-full">
              <MobileNavigation isActive={isActive} setCurrentSection={setCurrentSection} params={params} />
              <div className="w-full flex flex-1 items-center justify-end gap-2">
                <ModeToggle />
                <div className="text-right">
                  <Button className="flex items-center" variant="outline" onClick={() => {
                    Crisp.user.setEmail(user.email);
                    Crisp.user.setNickname(user.name);
                    Crisp.session.setData({
                      orgSlug: params.slug,
                    });
                    Crisp.chat.open()
                  }}>
                    <MessageCircleMore />
                    <span className="ml-2 hidden md:block">Support</span>
                  </Button>
                </div>
                <form>
                  <div className="relative">
                    {/* <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /> */}
                    {/* <Input */}
                    {/*   type="search" */}
                    {/*   placeholder="Search products..." */}
                    {/*   className="w-full appearance-none bg-background pl-8 shadow-none md:w-2/3 lg:w-1/3" */}
                    {/* /> */}
                  </div>
                </form>
              </div>
              <ProfileDropdownMenu logout={logout} router={router} user={user} />
            </header>
            <Separator />
            <SidebarContext.Provider value={{ setCurrentSection: () => { } }}>
              {children}
            </SidebarContext.Provider>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
      <CrispWithNoSSR />
    </div>
  )
}
export default withAuth(Dashboard);

