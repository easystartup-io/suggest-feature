"use client"

import { useInit } from "@/context/InitContext";
import { Button } from "@/components/ui/button";
import { ChevronDown, Home } from "lucide-react";
import Link from "next/link";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function Layout({
  children, params
}) {

  const { boards } = useInit();

  const currentBoard = boards && boards.find((item) => item.slug === params.slug);

  return (<div>
    <main className="flex flex-col gap-4 pl-4 pt-4 md:gap-8 md:pl-10 md:pt-6 w-full">
      <div className="w-full">
        <div className="w-full">
          <div className="flex items-center w-full space-x-1">
            <Link href="/">
              <Button variant="outline" className="rounded-r-none font-bold" size="icon"
              >
                <Home className="font-bold h-5 w-5" />
              </Button>
            </Link>
            <Link href={`/b/${currentBoard?.slug}`}>
              <Button variant="outline" className="rounded-l-none rounded-r-none ">
                <div className="font-bold " >
                  {currentBoard && currentBoard.name}
                </div>
              </Button>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon"
                  className="rounded-l-none "
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent >
                {boards && boards.map((item) => {
                  return <Link
                    href={`/b/${item.slug}`}
                    key={item.slug}
                  >
                    <DropdownMenuItem
                      className="cursor-pointer"
                    >
                      {item.name}
                    </DropdownMenuItem>
                  </Link>
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </main >
    {children}
  </div >)
}
