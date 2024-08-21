"use client"

import { Button } from "@/components/ui/button"
import withAuth from '@/hoc/withAuth';
import { useContext, useEffect, useState } from "react";
import { SidebarContext } from "@/app/[slug]/layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input"
import { useFieldArray, useForm } from "react-hook-form"
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Icons } from "@/components/icons";
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { ChevronsUpDown, Command, Check, X } from "lucide-react";
import React from "react";
import { ComboboxDemo } from "@/components/ComboBox";


const Dashboard: React.FC = ({ params }) => {
  const { toast } = useToast()


  const [data, setData] = useState(null)
  const [boardData, setBoardData] = useState(null)
  const [isLoading, setLoading] = useState(true)
  const [defaultValues, setDefaultValues] = useState({})
  const [boards, setBoards] = useState([])
  const form = useForm({ defaultValues })
  const { reset, setValue } = form; // Get reset function from useForm

  useEffect(() => {
    fetch(`/api/auth/pages/fetch-page?pageId=${params.id}`, {
      headers: {
        "x-org-slug": params.slug
      }
    })
      .then((res) => res.json())
      .then((data) => {
        setData(data)
        setBoards(data.boards || [])
        reset(data)
        setLoading(false)
      })

    fetch(`/api/auth/boards/fetch-boards`, {
      headers: {
        "x-org-slug": params.slug
      }
    })
      .then((res) => res.json())
      .then((data) => {
        setBoardData(data)
      })
  }, [params.id, params.slug, reset])

  async function onSubmit(data) {
    setLoading(true)
    try {
      const reqPayload = { ...data, boards }

      const resp = await fetch(`/api/auth/pages/create-page`, {
        method: 'POST',
        headers: {
          "x-org-slug": params.slug,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reqPayload)
      });
      const respData = await resp.json();
      if (resp.ok) {
        setData(respData)
        setBoards(respData.boards || [])
        reset(respData)
        toast({
          title: 'Page updated successfully',
        })
      } else {
        toast({
          title: respData.message,
          variant: 'destructive'
        })
      }
      setLoading(false)
    } catch (err) {
      console.log(err)
      toast({
        title: 'Something went wrong',
        description: 'Please try again by reloading the page, if the problem persists contact support',
        variant: 'destructive'
      })
    }
    setTimeout(() => { setLoading(false) }, 1000)
  }

  // if (isLoading) return <p>Loading...</p>
  if (!data) return <p>No profile data</p>


  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 h-full">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Page - {data && data.name}</h1>
      </div>
      <div
        className="flex flex-1 justify-center rounded-lg border border-dashed shadow-sm"
      >
        <div className="w-full p-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input disabled={isLoading} placeholder="name" {...field} />
                    </FormControl>
                    <FormDescription>
                      This is the page name. It will be displayed for you to identify here
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input disabled={isLoading} placeholder="slug" {...field} />
                    </FormControl>
                    <FormDescription>
                      This is the webpage slug. It should be unique and can only contain letters, numbers, and hyphens.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="customDomain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom Domain</FormLabel>
                    <FormControl>
                      <Input disabled={isLoading} placeholder="feature-request.yourdomain.com" {...field} />
                    </FormControl>
                    <FormDescription>
                      This is the custom domain for the page. You have to setup a CNAME mapping in your DNS server to our domain widget.suggestfeature.com .
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div>
                {boards && boards.length > 0 && boards.map((board, index) => (
                  <div className="my-2">
                    <FormLabel className={cn(index !== 0 && "sr-only")}>
                      Boards
                    </FormLabel>
                    <FormDescription className={cn(index !== 0 && "sr-only")}>
                      Select the board ids
                    </FormDescription>
                    <div className="flex items-center my-2">
                      <FormControl>
                        {
                          boardData &&
                          <ComboboxDemo
                            key={board || index}
                            data={boardData} setBoards={setBoards} boards={boards} index={index}
                          />
                        }
                      </FormControl>
                      <Button
                        type="button"
                        variant="icon"
                        onClick={() => {
                          // Delete the board with index
                          setBoards(boards.filter((_, i) => i !== index))
                        }}
                      >
                        <X />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    setBoards([...boards, ""])
                  }}
                >
                  Add Board
                </Button>
              </div>
              <Button type="submit" disabled={isLoading}>
                {isLoading &&
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                }
                Update page
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </main>
  )
}
export default withAuth(Dashboard);

