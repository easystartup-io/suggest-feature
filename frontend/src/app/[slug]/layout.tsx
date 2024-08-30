"use client"
import React, { createContext, useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import Cookies from 'js-cookie'
import { Crisp } from "crisp-sdk-web"
import { useTheme } from "next-themes"
import {
  BookOpenText,
  CircleDollarSign,
  Clipboard,
  Home,
  Map,
  Menu,
  MessageCircleMore,
  Moon,
  Sun,
  UserRoundCog,
  Users
} from "lucide-react"

import { useAuth } from '@/context/AuthContext'
import withAuth from '@/hoc/withAuth'
import { cn } from "@/lib/utils"
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
import { openCrisp } from "@/lib/open-crisp"

export const SidebarContext = createContext()

const navigationItems = [
  { href: 'dashboard', icon: Home, label: 'Dashboard' },
  { href: 'page', icon: BookOpenText, label: 'Page Settings' },
  { href: 'boards', icon: Clipboard, label: 'Boards' },
  { href: 'roadmap', icon: Map, label: 'Roadmap' },
  { href: 'members', icon: UserRoundCog, label: 'Team Members' },
  { href: 'customers', icon: Users, label: 'Customers' },
  { href: 'billing', icon: CircleDollarSign, label: 'Billing' },
]

function ModeToggle() {
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
        <DropdownMenuItem onClick={() => setTheme("light")}>Light</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>Dark</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>System</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function Navigation({ items, isActive, setCurrentSection, params, isCollapsed }) {
  return (
    <nav className={cn("grid items-start px-2 text-lg md:text-sm font-medium lg:px-4",
      isCollapsed && "px-0 lg:px-0")}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={`/${params.slug}/${item.href}`}
          className={cn(`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${isActive(item.href)}`,
            isCollapsed && "justify-center lg:mx-2")}
          onClick={() => setCurrentSection(item.href)}
        >
          <item.icon className="h-5 w-5 md:h-4 md:w-4" />
          {isCollapsed ? null : item.label}
        </Link>
      ))}
    </nav>
  )
}

function ProfileDropdownMenu({ params, logout, router, user }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="icon" className="rounded-full">
          <Avatar>
            <AvatarImage src={`${user.profilePic}`} />
            <AvatarFallback>
              {(() => {
                const name = user.name || user.email.split('@')[0];
                const words = name.split(' ');
                let initials = words.length > 1
                  ? words.map(word => word[0]).join('').toUpperCase()
                  : name.slice(0, 2).toUpperCase();
                return initials.length >= 2 ? initials.slice(0, 2) : initials.padEnd(2, initials[0]);
              })()}
            </AvatarFallback>
          </Avatar>
          <span className="sr-only">Toggle user menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="text-center">{user && user.name}</DropdownMenuLabel>
        <DropdownMenuItem>{user && user.email}</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push(`/${params.slug}/profile`)}>
          Profile Settings
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => {
          openCrisp({ user, params });
        }}>Support</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={async () => {
          await logout();
          router.push('/login');
        }}>Logout</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const Dashboard = ({ children, params }) => {
  const { logout, user } = useAuth();
  const [currentSection, setCurrentSection] = useState('dashboard');
  const router = useRouter();
  const pathname = usePathname();

  const layout = Cookies.get("react-resizable-panels:layout:sf")
  const collapsed = Cookies.get("react-resizable-panels:sf:collapsed")

  const defaultLayout = layout ? JSON.parse(layout) : [18, 82]
  const defaultCollapsed = collapsed ? JSON.parse(collapsed) : undefined

  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed || false)

  const CrispWithNoSSR = dynamic(() => import('../../components/crisp'))

  useEffect(() => {
    if (!params.slug || !pathname) return;
    const sections = pathname.replace(`/${params.slug}`, '').split('/').filter(Boolean);
    setCurrentSection(sections.length > 0 ? sections[0] : 'dashboard');
  }, [params.slug, pathname])

  const isActive = (section) => currentSection === section ? 'bg-muted text-primary' : 'text-muted-foreground hover:text-primary';

  return (
    <div className="flex flex-1 flex-col h-full w-full">
      <ResizablePanelGroup
        direction="horizontal"
        onLayout={(sizes) => {
          document.cookie = `react-resizable-panels:layout:sf=${JSON.stringify(sizes)}; path=/`
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
            document.cookie = `react-resizable-panels:sf:collapsed=${JSON.stringify(true)}; path=/`
          }}
          onResize={() => {
            setIsCollapsed(false)
            document.cookie = `react-resizable-panels:sf:collapsed=${JSON.stringify(false)}; path=/`
          }}
          className={cn(
            isCollapsed && "min-w-[50px] transition-all duration-300 ease-in-out",
            "hidden md:flex"
          )}
        >
          <div className="hidden bg-muted/40 dark:bg-muted/20 md:block w-full md:min-h-screen">
            <div className="flex h-full max-h-screen flex-col gap-2 w-full">
              <div className={cn(
                "flex h-[52px] items-center",
                isCollapsed ? "h-[52px] justify-center" : "px-2 justify-start"
              )}>
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
                <Navigation
                  items={navigationItems}
                  isActive={isActive}
                  setCurrentSection={setCurrentSection}
                  params={params}
                  isCollapsed={isCollapsed}
                />
              </div>
            </div>
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle className="hidden md:flex" />
        <ResizablePanel defaultSize={defaultLayout[1]} minSize={30}>
          <div className="flex flex-col w-full flex-1">
            <header className="flex h-14 items-center gap-4 bg-muted/40 dark:bg-muted/20 px-4 lg:h-[60px] lg:px-6 w-full">
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
                      <Avatar className="rounded-none h-6 w-6">
                        <AvatarImage className="" src="/logo.svg" alt="suggest-feature" />
                        <AvatarFallback>SF</AvatarFallback>
                      </Avatar>
                      <span className="text-lg font-semibold">Suggest Feature</span>
                    </Link>
                    <Navigation
                      items={navigationItems}
                      isActive={isActive}
                      setCurrentSection={setCurrentSection}
                      params={params}
                      isCollapsed={false}
                    />
                  </nav>
                </SheetContent>
              </Sheet>
              <div className="w-full flex flex-1 items-center justify-end gap-2">
                <ModeToggle />
                <div className="text-right">
                  <Button className="flex items-center" variant="outline" onClick={() => {
                    Crisp.user.setEmail(user.email);
                    Crisp.user.setNickname(user.name);
                    Crisp.session.setData({ orgSlug: params.slug });
                    Crisp.chat.open()
                  }}>
                    <MessageCircleMore />
                    <span className="ml-2 hidden md:block">Support</span>
                  </Button>
                </div>
              </div>
              <ProfileDropdownMenu logout={logout} router={router} user={user} params={params} />
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
