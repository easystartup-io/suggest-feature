"use client"

import { Button } from "@/components/ui/button"
import withAuth from '@/hoc/withAuth';
import { useContext, useEffect, useState } from "react";
import { SidebarContext } from "@/app/[slug]/layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Icons } from "@/components/icons";
import { useToast } from "@/components/ui/use-toast"
import { ExternalLink, Telescope } from "lucide-react";
import { useRouter } from 'next/navigation'

const Dashboard: React.FC = ({ params }) => {
  const { toast } = useToast()
  const router = useRouter();

  const [data, setData] = useState(null)
  const [org, setOrg] = useState(null)
  const [isLoading, setLoading] = useState(true)
  const [defaultValues, setDefaultValues] = useState({})
  const form = useForm({ defaultValues })
  const { reset, setValue, watch } = form; // Get reset function from useForm
  const watchSlug = watch('slug', "")
  const watchName = watch('name', "")

  const updateSlug = (value: string) => {
    // Set org slug based on the org name, all lower case and all special characters removed and spaces replaced with -
    // Example: "Example Org" => "example-org"
    // Example: "Example Org" => "example-org"
    // Example: "hello-how-do-you-do" => "hello-how-do-you-do"
    // Example: "-hello-how-do-you-do" => "hello-how-do-you-do"
    // Example: "-hello-how-do-you-do-" => "hello-how-do-you-do"
    // Limit max length to 35 characters 
    // replace all special characters with - and replace multiple - with single -
    setValue("slug", value.toLowerCase().replace(/[^a-zA-Z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-/g, '').slice(0, 35))
  }

  useEffect(() => {
    updateSlug(watchSlug)
  }, [watchSlug])

  useEffect(() => {
    updateSlug(watchName)
  }, [watchName])

  useEffect(() => {
    fetch(`/api/auth/boards/fetch-board?boardId=${params.id}`, {
      headers: {
        "x-org-slug": params.slug
      }
    })
      .then((res) => res.json())
      .then((data) => {
        setData(data)
        reset(data)
        setLoading(false)
      })

    fetch(`/api/auth/pages/fetch-org`, {
      headers: {
        "x-org-slug": params.slug
      }
    })
      .then((res) => res.json())
      .then((data) => {
        setOrg(data)
      })
  }, [params.id, params.slug, reset])

  async function onSubmit(data) {
    setLoading(true)
    try {

      const resp = await fetch(`/api/auth/boards/create-board`, {
        method: 'POST',
        headers: {
          "x-org-slug": params.slug,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      const respData = await resp.json();
      if (resp.ok) {
        setData(respData)
        reset(respData)
        toast({
          title: 'Board updated successfully',
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
        description: 'Please try again by reloading the board, if the problem persists contact support',
        variant: 'destructive'
      })
    }
    setTimeout(() => { setLoading(false) }, 1000)
  }


  // if (isLoading) return <p>Loading...</p>
  if (!data) return <p>No profile data</p>


  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Board - {data && data.name}</h1>
        <Button
          onClick={() => router.push(`/${params.slug}/boards/${params.id}/posts`)}
          className="flex items-center gap-2"
        >
          <Telescope className="" />
          View Posts
        </Button>
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
                      This is the board name. It will be displayed for you to identify here
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input disabled={isLoading} placeholder="Please input all your feature requests" {...field} />
                    </FormControl>
                    <FormDescription>
                      This is the board description.
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
                      <Input disabled={isLoading} placeholder="Please input the slug" {...field} />
                    </FormControl>
                    <FormDescription>
                      <p>
                        This is the board slug. It should be unique in your org and can only contain letters, numbers, and hyphens.
                      </p>

                      <p>
                        Your page will be accessible at {
                          org && org.customDomain ? <a href={`https://${org.customDomain}/b/${field.value}`} target="_blank"
                            className="inline-block hover:text-indigo-700">
                            https://{org.customDomain}/b/{field.value}<ExternalLink className="ml-1 h-4 w-4 inline-block" />
                          </a>
                            : <a href={`https://widget.suggestfeature.com/b/${field.value}`} target="_blank"
                              className="inline-block hover:text-indigo-700">
                              https://widget.suggestfeature.com/b/{field.value}<ExternalLink className="ml-1 h-4 w-4 inline-block" />
                            </a>
                        }
                      </p>

                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading &&
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                }
                Update board
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </main>
  )
}
export default withAuth(Dashboard);

