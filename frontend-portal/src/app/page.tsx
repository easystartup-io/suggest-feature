import Link from "next/link"
import { CircleUser, Menu, Moon, Package2, Search, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { cookies, headers } from 'next/headers'

const ModeToggle = dynamic(() => import('./ModeToggle'), { ssr: false });

async function getData() {
  const host = headers().get('host');
  const res = await fetch(`http://${host}/api/portal/unauth/posts/get-page`)
  const data = await res.json()

  return data;
}

export default async function Dashboard() {
  const data = await getData();

  return (
    <div className="flex min-h-screen w-full flex-col items-center">
      <div className="w-full max-w-screen-xl items-center justify-center">
        <header className="flex h-16 items-center justify-center gap-4 bg-background px-4 md:px-6 w-full">
          <div className="flex w-full items-center justify-end gap-4 md:ml-auto md:gap-2 lg:gap-4">
            <ModeToggle />
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
                <DropdownMenuItem>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
      </div>
      <Separator />
      <main className="flex min-h-[calc(100vh_-_theme(spacing.16))] flex-col gap-4 bg-muted/40 p-4 md:gap-8 md:p-10 w-full">
        <div className="w-full max-w-screen-xl">
          <div className="w-full">
            <div className="mx-auto grid w-full max-w-6xl items-start gap-6 md:grid-cols-[180px_1fr] lg:grid-cols-[250px_1fr]">
              <div className="grid gap-6">
                {data.name}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
