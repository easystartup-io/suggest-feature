"use client"

import { useInit } from "@/context/InitContext";
import { Button } from "@/components/ui/button";
import { ChevronDown, Home } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function Layout({
  children, params
}) {

  const { org, boards } = useInit();

  const currentBoard = boards && boards.find((item) => item.slug === params.slug);

  const router = useRouter();


  return (<div>
    <main className="flex flex-col gap-4 pl-4 pt-4 md:gap-8 md:pl-10 md:pt-6 w-full">
      <div className="w-full">
        <div className="w-full">
          <div className="flex items-center w-full space-x-1">
            <Button variant="outline" className="rounded-r-none font-bold" size="icon" onClick={() => {
              router.push('/')
            }}>
              <Home className="font-bold h-5 w-5" />
            </Button>
            <Button variant="outline" className="rounded-l-none rounded-r-none ">
              <div className="font-bold " onClick={() => {
                router.push('/b/' + currentBoard.slug)
              }}>
                {currentBoard && currentBoard.name}
              </div>
            </Button>
            <Select onValueChange={(val) => {
              router.push('/b/' + val)
            }}>
              <SelectTrigger className="w-[40px] px-2 flex items-center justify-center rounded-l-none ">
                {""}
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {boards && boards.map((item) => {
                    return <SelectItem key={item.slug} value={item.slug}>{item.name}</SelectItem>
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
