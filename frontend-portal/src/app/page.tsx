"use client"
import { CircleUser } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { useEffect, useState } from "react"
import ModeToggle from "./ModeToggle"

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

export default function Dashboard({ params }) {
  const [data, setData] = useState({});
  const [error, setError] = useState(false);


  useEffect(() => {
    const host = window.location.host
    fetch(`http://${host}/api/portal/unauth/posts/get-page`)
      .then((res) => res.json())
      .then((data) => {
        if (Object.keys(data).length === 0) {
          setError(true)
        } else {
          setData(data)
        }
      }).catch((e) => {
        console.log(e)
      })
  }, [params]);

  if (!data || error) {
    return <Custom404 />
  }

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
                <h1 className="text-2xl font-semibold">{data.name}</h1>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
