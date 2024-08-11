"use client"
import {
  Bell,
  CircleUser,
  Home,
  LineChart,
  Menu,
  Package,
  Package2,
  ShoppingCart,
  UserRoundCog,
  Users
} from "lucide-react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useAuth } from '@/context/AuthContext'
import withAuth from '@/hoc/withAuth'
import { useRouter } from "next/navigation"
import { createContext, useState } from "react"

export const SidebarContext = createContext();

const Dashboard: React.FC = ({ children, params }) => {
  const { logout } = useAuth();
  const [currentSection, setCurrentSection] = useState('dashboard');

  const router = useRouter();

  const isActive = (section) => currentSection === section ? 'bg-muted text-primary' : 'text-muted-foreground hover:text-primary';

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href={`/${params.slug}/dashboard`} className="flex items-center gap-2 font-semibold">
              <Package2 className="h-6 w-6" />
              <span className="">Suggest Feature</span>
            </Link>
            <Button variant="outline" size="icon" className="ml-auto h-8 w-8">
              <Bell className="h-4 w-4" />
              <span className="sr-only">Toggle notifications</span>
            </Button>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              <Link
                href={`/${params.slug}/dashboard`}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${isActive('dashboard')}`}
                onClick={() => setCurrentSection('dashboard')}
              >
                <Home className="h-4 w-4" />
                Dashboard
              </Link>
              <Link
                href={`/${params.slug}/orders`}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${isActive('orders')}`}
                onClick={() => setCurrentSection('orders')}
              >
                <ShoppingCart className="h-4 w-4" />
                Orders
                <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                  6
                </Badge>
              </Link>
              <Link
                href={`/${params.slug}/members`}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${isActive('members')}`}
                onClick={() => setCurrentSection('members')}
              >
                <UserRoundCog className="h-4 w-4" />
                Members
              </Link>
              <Link
                href="#"
                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${isActive('customers')}`}
                onClick={() => setCurrentSection('customers')}
              >
                <Users className="h-4 w-4" />
                Customers
              </Link>
              <Link
                href="#"
                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${isActive('analytics')}`}
                onClick={() => setCurrentSection('analytics')}
              >
                <LineChart className="h-4 w-4" />
                Analytics
              </Link>
            </nav>
          </div>
          <div className="mt-auto p-4">
            <Card x-chunk="dashboard-02-chunk-0">
              <CardHeader className="p-2 pt-0 md:p-4">
                <CardTitle>Upgrade to Pro</CardTitle>
                <CardDescription>
                  Unlock all features and get unlimited access to our support team.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-2 pt-0 md:p-4 md:pt-0">
                <Button size="sm" className="w-full">
                  Upgrade
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
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
                <Link
                  href="#"
                  className="flex items-center gap-2 text-lg font-semibold"
                >
                  <Package2 className="h-6 w-6" />
                  <span className="sr-only">Acme Inc</span>
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
                  href="#"
                  className={`mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 transition-all ${isActive('orders')}`}
                  onClick={() => setCurrentSection('orders')}
                >
                  <ShoppingCart className="h-5 w-5" />
                  Orders
                  <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                    6
                  </Badge>
                </Link>
                <Link
                  href={`/${params.slug}/members`}
                  className={`mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 transition-all ${isActive('members')}`}
                  onClick={() => setCurrentSection('members')}
                >
                  <UserRoundCog className="h-5 w-5" />
                  Members
                </Link>
                <Link
                  href="#"
                  className={`mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 transition-all ${isActive('customers')}`}
                  onClick={() => setCurrentSection('customers')}
                >
                  <Users className="h-5 w-5" />
                  Customers
                </Link>
                <Link
                  href="#"
                  className={`mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 transition-all ${isActive('analytics')}`}
                  onClick={() => setCurrentSection('analytics')}
                >
                  <LineChart className="h-5 w-5" />
                  Analytics
                </Link>
              </nav>
              <div className="mt-auto">
                <Card>
                  <CardHeader>
                    <CardTitle>Upgrade to Pro</CardTitle>
                    <CardDescription>
                      Unlock all features and get unlimited access to our
                      support team.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button size="sm" className="w-full">
                      Upgrade
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1">
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <CircleUser className="h-5 w-5" />
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Support</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={async () => {
                await logout();
                router.push('/login');
              }}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <SidebarContext.Provider value={{ setCurrentSection }}>
          {children}
        </SidebarContext.Provider>
      </div>
    </div>
  )
}
export default withAuth(Dashboard);
