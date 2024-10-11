"use client"

import { useInit } from "@/context/InitContext";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import Link from "next/link";

export default function Layout({
  children, params
}) {

  const { boards } = useInit();

  const currentBoard = boards && boards.find((item) => item.slug === params.slug);

  const router = useRouter();

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
            <Select
              onValueChange={(val) => {
                router.push('/b/' + val)
              }}
            >
              <SelectTrigger className="w-[40px] px-2 flex items-center justify-center rounded-l-none ">
                {""}
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {boards && boards.map((item) => {
                    return <Link
                      href={`/b/${item.slug}`}
                      key={item.slug}
                    >
                      <SelectItem value={item.slug}>{item.name}</SelectItem>
                    </Link>
                  })}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </main>
    {children}
  </div>)
}
